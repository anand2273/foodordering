from django.http import JsonResponse, Http404
import json
from decimal import Decimal, ROUND_HALF_UP
import uuid
from django.views.decorators.csrf import csrf_exempt
from .models import MenuItem, OrderItem, Order, Business, CustomizationOption, SelectedCustomization, Location
from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

try:
    import stripe
except Exception:  # pragma: no cover
    stripe = None

def get_business_or_404(slug):
    try:
        return Business.objects.get(slug=slug)
    except:
        raise Http404("Business not found")


def _decimal_to_cents(amount: Decimal) -> int:
    return int((amount * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _validate_and_build_order_items(*, business, items, order):
    """Validate cart items against DB and create OrderItem/SelectedCustomization rows.

    Returns: amount_total_cents (int)
    Raises: ValueError with a user-facing message.
    """

    if not isinstance(items, list) or not items:
        raise ValueError("Missing items")

    total = Decimal("0")

    for item in items:
        slug = item.get("slug")
        quantity = item.get("quantity")
        selected = item.get("selectedOptions", {}) or {}

        if not slug:
            raise ValueError("Item is missing slug")

        try:
            quantity_int = int(quantity)
        except (TypeError, ValueError):
            raise ValueError("Invalid quantity")

        if quantity_int <= 0:
            raise ValueError("Quantity must be at least 1")

        try:
            menu_item = MenuItem.objects.get(slug=slug, business=business)
        except MenuItem.DoesNotExist:
            raise ValueError(f"Unknown item: {slug}")

        group_by_name = {g.name: g for g in menu_item.customization_groups.all()}

        if not isinstance(selected, dict):
            raise ValueError("Invalid selectedOptions")

        for group in group_by_name.values():
            chosen = selected.get(group.name, []) or []
            if group.required and len(chosen) == 0:
                raise ValueError(f"Missing required customization: {group.name}")
            if len(chosen) > group.max_choices:
                raise ValueError(f"Too many selections for {group.name}")

        item_extras = Decimal("0")
        order_item = OrderItem.objects.create(menuItem=menu_item, quantity=quantity_int, order=order)

        for group_name, options in selected.items():
            if group_name not in group_by_name:
                raise ValueError(f"Unknown customization group: {group_name}")
            if not isinstance(options, list):
                raise ValueError("Invalid selectedOptions format")

            for option in options:
                option_name = option.get("name") if isinstance(option, dict) else None
                if not option_name:
                    raise ValueError("Invalid customization option")

                try:
                    opt_obj = CustomizationOption.objects.get(
                        name=option_name,
                        group__menu_item=menu_item,
                        group__name=group_name,
                    )
                except CustomizationOption.DoesNotExist:
                    raise ValueError(f"Unknown customization option: {group_name} / {option_name}")

                SelectedCustomization.objects.create(order_item=order_item, option=opt_obj)
                item_extras += opt_obj.extra_cost

        total += (menu_item.price + item_extras) * quantity_int

    return _decimal_to_cents(total)


# API HANDLERS

# To fetch the entire menu
def api_menu(request, business_slug):
    biz = get_business_or_404(business_slug)
    items = MenuItem.objects.filter(business=biz)
    data = [item.serialize() for item in items]
    return JsonResponse(data, safe=False)

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def api_locations(request, business_slug):
    business = get_business_or_404(business_slug)
    locations = Location.objects.filter(business=business)
    data = [{"id": location.id, "name": location.name} for location in locations]
    return JsonResponse(data, safe=False)

# To fetch data pertaining to a particular item
def item(request, slug, business_slug):
    biz = get_business_or_404(business_slug)
    try:
        item = MenuItem.objects.filter(business=biz).get(slug=slug)
    except MenuItem.DoesNotExist:
        return JsonResponse({"error": "item not found"}, status=400)
    
    if request.method == "GET":
        return JsonResponse(item.serialize())
    else:
        return JsonResponse({"error": "GET required"}, status=400)
    
@csrf_exempt
def place_order(request, business_slug):
    return JsonResponse(
        {"error": "Direct order placement is disabled. Use the payment checkout endpoint."},
        status=400,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
def create_payment_intent(request, business_slug):
    if stripe is None:
        return JsonResponse({"error": "Stripe SDK is not installed on the server."}, status=500)
    if not settings.STRIPE_SECRET_KEY:
        return JsonResponse({"error": "Stripe is not configured (missing STRIPE_SECRET_KEY)."}, status=500)

    business = get_business_or_404(business_slug)

    data = request.data if hasattr(request, "data") else None
    if not isinstance(data, dict):
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({"error": "Invalid JSON."}, status=400)

    student_name = (data.get("student_name") or "").strip()
    items = data.get("items", [])
    location_id = data.get("location_id")

    if not student_name or not items or not location_id:
        return JsonResponse({"error": "Missing name, items, or location"}, status=400)

    try:
        location = Location.objects.get(id=location_id, business=business)
    except Location.DoesNotExist:
        return JsonResponse({"error": "Invalid location"}, status=400)

    idempotency_key = request.META.get("HTTP_IDEMPOTENCY_KEY")
    if not idempotency_key:
        idempotency_key = str(uuid.uuid4())

    existing = Order.objects.filter(business=business, checkout_idempotency_key=idempotency_key).first()
    if existing:
        if existing.payment_status == Order.PaymentStatus.PAID:
            return JsonResponse({"error": "Order already paid."}, status=409)
        if existing.stripe_payment_intent_id:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.retrieve(existing.stripe_payment_intent_id)
            return JsonResponse(
                {"order_id": str(existing.id), "client_secret": intent.client_secret},
                status=200,
            )
        return JsonResponse({"error": "Checkout already started. Please try again."}, status=409)

    order = Order.objects.create(
        student_name=student_name,
        business=business,
        location=location,
        currency=(settings.STRIPE_CURRENCY or "sgd"),
        payment_status=Order.PaymentStatus.REQUIRES_PAYMENT,
        checkout_idempotency_key=idempotency_key,
    )

    try:
        amount_total = _validate_and_build_order_items(business=business, items=items, order=order)
    except ValueError as e:
        order.delete()
        return JsonResponse({"error": str(e)}, status=400)

    order.amount_total = amount_total
    order.save(update_fields=["amount_total"])

    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_total,
            currency=order.currency,
            payment_method_types=["card", "paynow"],
            metadata={
                "order_id": str(order.id),
                "business_slug": business_slug,
            },
        )
    except Exception:
        order.delete()
        return JsonResponse({"error": "Failed to create payment intent."}, status=500)

    order.stripe_payment_intent_id = intent.id
    order.save(update_fields=["stripe_payment_intent_id"])

    return JsonResponse({"order_id": str(order.id), "client_secret": intent.client_secret}, status=200)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])
def stripe_webhook(request):
    if stripe is None:
        return JsonResponse({"error": "Stripe SDK is not installed on the server."}, status=500)
    if not settings.STRIPE_WEBHOOK_SECRET:
        return JsonResponse({"error": "Stripe is not configured (missing STRIPE_WEBHOOK_SECRET)."}, status=500)

    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    if not sig_header:
        return JsonResponse({"error": "Missing Stripe-Signature header."}, status=400)

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except ValueError:
        return JsonResponse({"error": "Invalid payload."}, status=400)
    except stripe.error.SignatureVerificationError:
        return JsonResponse({"error": "Invalid signature."}, status=400)

    event_type = event.get("type")
    obj = (event.get("data") or {}).get("object") or {}

    def _get_order_for_payment_intent(pi_obj):
        pi_id = pi_obj.get("id")
        if pi_id:
            order = Order.objects.filter(stripe_payment_intent_id=pi_id).first()
            if order:
                return order
        metadata = pi_obj.get("metadata") or {}
        order_id = metadata.get("order_id")
        if order_id:
            return Order.objects.filter(id=order_id).first()
        return None

    if event_type in {
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "payment_intent.canceled",
        "payment_intent.processing",
    }:
        order = _get_order_for_payment_intent(obj)
        if not order:
            return JsonResponse({"status": "ignored"}, status=200)

        if event_type == "payment_intent.succeeded":
            if order.payment_status != Order.PaymentStatus.PAID:
                order.payment_status = Order.PaymentStatus.PAID
                order.paid_at = timezone.now()
                order.save(update_fields=["payment_status", "paid_at"])
        elif event_type == "payment_intent.processing":
            if order.payment_status == Order.PaymentStatus.REQUIRES_PAYMENT:
                order.payment_status = Order.PaymentStatus.PROCESSING
                order.save(update_fields=["payment_status"])
        elif event_type == "payment_intent.payment_failed":
            if order.payment_status != Order.PaymentStatus.PAID:
                order.payment_status = Order.PaymentStatus.FAILED
                order.save(update_fields=["payment_status"])
        elif event_type == "payment_intent.canceled":
            if order.payment_status != Order.PaymentStatus.PAID:
                order.payment_status = Order.PaymentStatus.CANCELED
                order.save(update_fields=["payment_status"])

    return JsonResponse({"status": "ok"}, status=200)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def display_orders(request, business_slug):
    business = get_business_or_404(business_slug)
    orders = Order.objects.filter(business=business, payment_status=Order.PaymentStatus.PAID)
    location_id = request.query_params.get('location_id')
    if location_id:
        orders = orders.filter(location_id=location_id)
    data = [order.serialize() for order in orders]
    return JsonResponse(data, safe=False)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def fulfill_location(request, business_slug, location_id):
    business = get_business_or_404(business_slug)
    try:
        Order.objects.filter(
            location_id=location_id,
            business=business,
            payment_status=Order.PaymentStatus.PAID,
        ).update(fulfilled=True)
        return JsonResponse({"message": "Orders for location marked as fulfilled."})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(["GET"])
@permission_classes([AllowAny]) 
def get_order_by_id(request, order_id, business_slug):
    business = get_business_or_404(business_slug)
    try:
        order = Order.objects.get(id=order_id, business=business)
        return JsonResponse(order.serialize())
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)
    
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_order_ready(request, order_id, business_slug):
    business = get_business_or_404(business_slug)
    try:
        order = Order.objects.get(id=order_id, business=business)
        if order.payment_status != Order.PaymentStatus.PAID:
            return JsonResponse({"error": "Order is not paid."}, status=400)
        order.ready = request.data.get("ready", not order.ready)
        order.save()
        return JsonResponse({"message": "Order updated", "ready": order.ready})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_order_fulfilled(request, order_id, business_slug):
    business = get_business_or_404(business_slug)
    try:
        order = Order.objects.get(id=order_id, business=business)
        if order.payment_status != Order.PaymentStatus.PAID:
            return JsonResponse({"error": "Order is not paid."}, status=400)
        order.fulfilled = request.data.get("fulfilled", not order.fulfilled)
        order.save()
        return JsonResponse({"message": "Order updated", "fulfilled": order.fulfilled})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)

