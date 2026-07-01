from __future__ import annotations

import logging

import stripe
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core import signing
from django.db import connection, transaction
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Location, MenuItem, Order
from .permissions import IsMerchant
from .serializers import (
    CheckoutSerializer,
    CustomerOrderSerializer,
    FulfillmentStatusSerializer,
    LocationSerializer,
    MenuItemSerializer,
    MerchantOrderSerializer,
)
from .services import CheckoutError, create_checkout, process_stripe_event, resolve_tracking_token
from .throttles import CheckoutRateThrottle, LoginRateThrottle, TrackingRateThrottle

logger = logging.getLogger(__name__)


def error_response(code: str, message: str, http_status: int, fields: object = None) -> Response:
    error: dict[str, object] = {"code": code, "message": message}
    if fields is not None:
        error["fields"] = fields
    return Response({"error": error}, status=http_status)


class MenuListView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes: tuple[type, ...] = ()

    def get(self, request: Request) -> Response:
        items = MenuItem.objects.filter(active=True).prefetch_related(
            "customization_groups__options"
        )
        return Response(MenuItemSerializer(items, many=True).data)


class MenuDetailView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes: tuple[type, ...] = ()

    def get(self, request: Request, slug: str) -> Response:
        try:
            item = (
                MenuItem.objects.filter(active=True)
                .prefetch_related("customization_groups__options")
                .get(slug=slug)
            )
        except MenuItem.DoesNotExist:
            return error_response("not_found", "Menu item not found.", status.HTTP_404_NOT_FOUND)
        return Response(MenuItemSerializer(item).data)


class LocationListView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes: tuple[type, ...] = ()

    def get(self, request: Request) -> Response:
        return Response(LocationSerializer(Location.objects.filter(active=True), many=True).data)


class CheckoutView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes: tuple[type, ...] = ()
    throttle_classes = (CheckoutRateThrottle,)

    def post(self, request: Request) -> Response:
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "validation_error",
                "Checkout data is invalid.",
                status.HTTP_400_BAD_REQUEST,
                serializer.errors,
            )
        try:
            result = create_checkout(
                serializer.validated_data,
                request.headers.get("Idempotency-Key", ""),
            )
        except CheckoutError as exc:
            return error_response(exc.code, exc.message, exc.status)
        return Response(
            {
                "order_id": result.order.id,
                "tracking_token": result.tracking_token,
                "client_secret": result.client_secret,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerOrderView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes: tuple[type, ...] = ()
    throttle_classes = (TrackingRateThrottle,)

    def get(self, request: Request) -> Response:
        token = request.query_params.get("token")
        if not token:
            return error_response(
                "missing_token",
                "A tracking token is required.",
                status.HTTP_400_BAD_REQUEST,
            )
        try:
            order = resolve_tracking_token(token)
        except signing.SignatureExpired:
            return error_response(
                "expired_token",
                "This tracking link has expired.",
                status.HTTP_410_GONE,
            )
        except (signing.BadSignature, Order.DoesNotExist, ValueError):
            return error_response(
                "invalid_token",
                "This tracking link is invalid.",
                status.HTTP_404_NOT_FOUND,
            )
        return Response(CustomerOrderSerializer(order).data)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes: tuple[type, ...] = ()

    def get(self, request: Request) -> Response:
        return Response({"csrf": "set"})


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = (SessionAuthentication,)
    throttle_classes = (LoginRateThrottle,)

    def post(self, request: Request) -> Response:
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        user = authenticate(request, username=username, password=password)
        if (
            not user
            or not user.is_active
            or not (user.is_staff or user.groups.filter(name="merchant").exists())
        ):
            return error_response(
                "invalid_credentials",
                "Invalid username or password.",
                status.HTTP_401_UNAUTHORIZED,
            )
        login(request, user)
        return Response({"username": user.get_username()})


class SessionView(APIView):
    permission_classes = (IsMerchant,)

    def get(self, request: Request) -> Response:
        return Response({"authenticated": True, "username": request.user.get_username()})


class LogoutView(APIView):
    permission_classes = (IsMerchant,)

    def post(self, request: Request) -> Response:
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MerchantOrderListView(APIView):
    permission_classes = (IsMerchant,)

    def get(self, request: Request) -> Response:
        orders = Order.objects.filter(payment_status=Order.PaymentStatus.PAID).prefetch_related(
            "items__customizations"
        )
        location_id = request.query_params.get("location_id")
        fulfillment_status = request.query_params.get("status")
        if location_id:
            orders = orders.filter(location_id=location_id)
        if fulfillment_status:
            if fulfillment_status not in Order.FulfillmentStatus.values:
                return error_response(
                    "invalid_status",
                    "Unknown fulfillment status.",
                    status.HTTP_400_BAD_REQUEST,
                )
            orders = orders.filter(fulfillment_status=fulfillment_status)
        return Response(MerchantOrderSerializer(orders, many=True).data)


class MerchantOrderStatusView(APIView):
    permission_classes = (IsMerchant,)

    def patch(self, request: Request, order_id: str) -> Response:
        serializer = FulfillmentStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                "validation_error",
                "Status is invalid.",
                status.HTTP_400_BAD_REQUEST,
                serializer.errors,
            )
        with transaction.atomic():
            try:
                order = Order.objects.select_for_update().get(
                    id=order_id,
                    payment_status=Order.PaymentStatus.PAID,
                )
            except (Order.DoesNotExist, ValueError):
                return error_response(
                    "not_found",
                    "Paid order not found.",
                    status.HTTP_404_NOT_FOUND,
                )

            current = order.fulfillment_status
            target = serializer.validated_data["status"]
            allowed: dict[str, set[str]] = {
                Order.FulfillmentStatus.PREPARING: {Order.FulfillmentStatus.READY},
                Order.FulfillmentStatus.READY: {
                    Order.FulfillmentStatus.PREPARING,
                    Order.FulfillmentStatus.FULFILLED,
                },
                Order.FulfillmentStatus.FULFILLED: set(),
            }
            if target != current and target not in allowed[current]:
                return error_response(
                    "invalid_transition",
                    f"Cannot move an order from {current} to {target}.",
                    status.HTTP_409_CONFLICT,
                )
            if target != current:
                order.fulfillment_status = target
                order.save(update_fields=("fulfillment_status", "updated_at"))
        return Response(MerchantOrderSerializer(order).data)


class FulfillReadyOrdersView(APIView):
    permission_classes = (IsMerchant,)

    def post(self, request: Request, location_id: int) -> Response:
        if not Location.objects.filter(id=location_id, active=True).exists():
            return error_response(
                "not_found",
                "Location not found.",
                status.HTTP_404_NOT_FOUND,
            )
        updated = Order.objects.filter(
            location_id=location_id,
            payment_status=Order.PaymentStatus.PAID,
            fulfillment_status=Order.FulfillmentStatus.READY,
        ).update(
            fulfillment_status=Order.FulfillmentStatus.FULFILLED,
            updated_at=timezone.now(),
        )
        return Response({"fulfilled_count": updated})


class StripeWebhookView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes: tuple[type, ...] = ()

    def post(self, request: Request) -> Response:
        if not settings.STRIPE_WEBHOOK_SECRET:
            logger.error("Stripe webhook received while webhook secret is unset")
            return error_response(
                "webhook_not_configured",
                "Webhook is not configured.",
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        signature = request.headers.get("Stripe-Signature")
        if not signature:
            return error_response(
                "missing_signature",
                "Stripe-Signature is required.",
                status.HTTP_400_BAD_REQUEST,
            )
        try:
            event = stripe.Webhook.construct_event(
                request.body,
                signature,
                settings.STRIPE_WEBHOOK_SECRET,
            )
        except ValueError:
            return error_response(
                "invalid_payload",
                "Invalid webhook payload.",
                status.HTTP_400_BAD_REQUEST,
            )
        except stripe.SignatureVerificationError:
            return error_response(
                "invalid_signature",
                "Invalid webhook signature.",
                status.HTTP_400_BAD_REQUEST,
            )
        process_stripe_event(event)
        return Response({"received": True})


class LiveHealthView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes: tuple[type, ...] = ()

    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})


class ReadyHealthView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes: tuple[type, ...] = ()

    def get(self, request: Request) -> Response:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:
            logger.exception("Database readiness check failed")
            return Response({"status": "unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"status": "ok"})
