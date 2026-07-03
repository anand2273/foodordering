from __future__ import annotations

import hashlib
import json
import logging
from collections import defaultdict
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

import stripe
from django.conf import settings
from django.core import signing
from django.db import IntegrityError, transaction
from django.db.models import Prefetch

from .models import (
    CustomizationOption,
    Location,
    MenuItem,
    Notification,
    Order,
    OrderItem,
    OrderItemCustomization,
    StripeEvent,
)

logger = logging.getLogger(__name__)
TRACKING_TOKEN_SALT = "foodapp.order-tracking.v1"


class CheckoutError(Exception):
    def __init__(self, code: str, message: str, status: int = 400) -> None:
        self.code = code
        self.message = message
        self.status = status
        super().__init__(message)


@dataclass(frozen=True)
class CheckoutResult:
    order: Order
    client_secret: str
    tracking_token: str


def decimal_to_minor_units(amount: Decimal) -> int:
    return int((amount * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def issue_tracking_token(order_id: object) -> str:
    return signing.TimestampSigner(salt=TRACKING_TOKEN_SALT).sign(str(order_id))


def resolve_tracking_token(token: str) -> Order:
    order_id = signing.TimestampSigner(salt=TRACKING_TOKEN_SALT).unsign(
        token,
        max_age=settings.ORDER_TRACKING_TOKEN_MAX_AGE,
    )
    return Order.objects.prefetch_related("items__customizations").get(id=order_id)


def _fingerprint_checkout(data: dict[str, Any]) -> str:
    normalized = {
        "customer_name": data["customer_name"],
        "customer_email": data["customer_email"].lower(),
        "location_id": data["location_id"],
        "items": sorted(
            (
                {
                    "menu_item_id": item["menu_item_id"],
                    "quantity": item["quantity"],
                    "option_ids": sorted(item.get("option_ids", [])),
                }
                for item in data["items"]
            ),
            key=lambda item: (item["menu_item_id"], item["option_ids"]),
        ),
    }
    payload = json.dumps(normalized, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(payload).hexdigest()


def _retrieve_existing_checkout(
    idempotency_key: str,
    fingerprint: str,
) -> CheckoutResult | None:
    order = Order.objects.filter(checkout_idempotency_key=idempotency_key).first()
    if order is None:
        return None
    if order.checkout_fingerprint != fingerprint:
        raise CheckoutError(
            "idempotency_conflict",
            "This idempotency key was already used for a different checkout.",
            409,
        )
    if not order.stripe_payment_intent_id:
        raise CheckoutError(
            "checkout_in_progress",
            "Checkout creation is already in progress. Retry shortly with the same key.",
            409,
        )
    try:
        intent = stripe.PaymentIntent.retrieve(order.stripe_payment_intent_id)
    except stripe.StripeError as exc:
        logger.exception(
            "Unable to retrieve existing payment intent", extra={"order_id": str(order.id)}
        )
        raise CheckoutError(
            "payment_provider_unavailable", "Payment service unavailable.", 502
        ) from exc
    if not intent.client_secret:
        raise CheckoutError(
            "invalid_payment_intent", "Payment service returned an invalid response.", 502
        )
    return CheckoutResult(order, intent.client_secret, issue_tracking_token(order.id))


def _create_order(data: dict[str, Any], idempotency_key: str, fingerprint: str) -> Order:
    try:
        location = Location.objects.get(id=data["location_id"], active=True)
    except Location.DoesNotExist as exc:
        raise CheckoutError(
            "invalid_location", "The selected pickup location is unavailable."
        ) from exc

    requested_item_ids = [item["menu_item_id"] for item in data["items"]]
    if len(requested_item_ids) != len(set(requested_item_ids)):
        raise CheckoutError("duplicate_item", "Each menu item may appear only once per checkout.")

    menu_items = {
        item.id: item
        for item in MenuItem.objects.filter(
            id__in=requested_item_ids, active=True
        ).prefetch_related(
            Prefetch(
                "customization_groups__options",
                queryset=CustomizationOption.objects.filter(active=True),
            )
        )
    }
    if len(menu_items) != len(requested_item_ids):
        raise CheckoutError("invalid_item", "One or more menu items are unavailable.")

    item_rows: list[tuple[MenuItem, dict[str, Any], list[CustomizationOption]]] = []
    total = 0

    for requested in data["items"]:
        menu_item = menu_items[requested["menu_item_id"]]
        groups = {group.id: group for group in menu_item.customization_groups.all()}
        available_options = {
            option.id: option for group in groups.values() for option in group.options.all()
        }
        requested_option_ids = requested.get("option_ids", [])
        if not set(requested_option_ids).issubset(available_options):
            raise CheckoutError(
                "invalid_customization",
                f"A customization for {menu_item.title} is unavailable.",
            )

        selected_by_group: dict[int, list[CustomizationOption]] = defaultdict(list)
        for option_id in requested_option_ids:
            option = available_options[option_id]
            selected_by_group[option.group_id].append(option)

        for group in groups.values():
            selection_count = len(selected_by_group[group.id])
            if group.required and selection_count == 0:
                raise CheckoutError(
                    "missing_customization",
                    f"Select an option for {group.name}.",
                )
            if selection_count > group.max_choices:
                raise CheckoutError(
                    "too_many_customizations",
                    f"Select at most {group.max_choices} option(s) for {group.name}.",
                )

        unit_amount = decimal_to_minor_units(menu_item.price)
        options = [available_options[option_id] for option_id in requested_option_ids]
        extras = sum(decimal_to_minor_units(option.extra_cost) for option in options)
        total += (unit_amount + extras) * requested["quantity"]
        item_rows.append((menu_item, requested, options))

    if total <= 0:
        raise CheckoutError("invalid_total", "The checkout total must be greater than zero.")

    order = Order.objects.create(
        customer_name=data["customer_name"],
        customer_email=data["customer_email"].lower(),
        location=location,
        location_name=location.name,
        currency=settings.STORE_CURRENCY,
        amount_total=total,
        checkout_idempotency_key=idempotency_key,
        checkout_fingerprint=fingerprint,
    )
    for menu_item, requested, options in item_rows:
        order_item = OrderItem.objects.create(
            order=order,
            menu_item=menu_item,
            title=menu_item.title,
            unit_amount=decimal_to_minor_units(menu_item.price),
            quantity=requested["quantity"],
        )
        OrderItemCustomization.objects.bulk_create(
            [
                OrderItemCustomization(
                    order_item=order_item,
                    option=option,
                    group_name=option.group.name,
                    option_name=option.name,
                    unit_amount=decimal_to_minor_units(option.extra_cost),
                )
                for option in options
            ]
        )
    return order


def create_checkout(
    data: dict[str, Any],
    idempotency_key: str,
) -> CheckoutResult:
    if not settings.STRIPE_SECRET_KEY:
        raise CheckoutError("payments_not_configured", "Payment service is not configured.", 503)
    if not idempotency_key or len(idempotency_key) > 240:
        raise CheckoutError(
            "invalid_idempotency_key",
            "A valid Idempotency-Key header is required.",
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY
    fingerprint = _fingerprint_checkout(data)
    existing = _retrieve_existing_checkout(idempotency_key, fingerprint)
    if existing:
        return existing

    try:
        with transaction.atomic():
            order = _create_order(data, idempotency_key, fingerprint)
    except IntegrityError:
        existing = _retrieve_existing_checkout(idempotency_key, fingerprint)
        if existing:
            return existing
        raise

    try:
        intent = stripe.PaymentIntent.create(
            amount=order.amount_total,
            currency=order.currency,
            automatic_payment_methods={"enabled": True},
            metadata={"order_id": str(order.id)},
            idempotency_key=f"checkout:{idempotency_key}",
        )
    except stripe.StripeError as exc:
        logger.exception("Payment intent creation failed", extra={"order_id": str(order.id)})
        raise CheckoutError(
            "payment_provider_unavailable", "Payment service unavailable.", 502
        ) from exc

    order.stripe_payment_intent_id = intent.id
    order.save(update_fields=("stripe_payment_intent_id", "updated_at"))
    if not intent.client_secret:
        raise CheckoutError(
            "invalid_payment_intent", "Payment service returned an invalid response.", 502
        )
    return CheckoutResult(order, intent.client_secret, issue_tracking_token(order.id))


def process_stripe_event(event: dict[str, Any]) -> bool:
    event_id = event.get("id")
    event_type = event.get("type", "")
    if not event_id:
        return False

    with transaction.atomic():
        _, created = StripeEvent.objects.get_or_create(
            event_id=event_id,
            defaults={"event_type": event_type},
        )
        if not created:
            return False

        payment_intent = (event.get("data") or {}).get("object") or {}
        intent_id = payment_intent.get("id")
        order_id = (payment_intent.get("metadata") or {}).get("order_id")
        query = Order.objects.select_for_update()
        order = query.filter(stripe_payment_intent_id=intent_id).first() if intent_id else None
        if order is None and order_id:
            order = query.filter(id=order_id).first()
        if order is None:
            logger.warning(
                "Stripe event did not match an order", extra={"stripe_event_id": event_id}
            )
            return True

        if intent_id and not order.stripe_payment_intent_id:
            order.stripe_payment_intent_id = intent_id
            order.save(update_fields=("stripe_payment_intent_id", "updated_at"))

        if event_type == "payment_intent.succeeded":
            newly_paid = order.mark_paid()
            if newly_paid:
                notification, _ = Notification.objects.get_or_create(
                    order=order,
                    kind=Notification.Kind.ORDER_CONFIRMATION,
                )
                transaction.on_commit(lambda: _enqueue_notification(notification.id))
        elif (
            event_type == "payment_intent.processing"
            and order.payment_status == Order.PaymentStatus.PENDING
        ):
            order.payment_status = Order.PaymentStatus.PROCESSING
            order.save(update_fields=("payment_status", "updated_at"))
        elif event_type == "payment_intent.payment_failed" and (
            order.payment_status != Order.PaymentStatus.PAID
        ):
            order.payment_status = Order.PaymentStatus.FAILED
            order.save(update_fields=("payment_status", "updated_at"))
        elif event_type == "payment_intent.canceled" and (
            order.payment_status != Order.PaymentStatus.PAID
        ):
            order.payment_status = Order.PaymentStatus.CANCELED
            order.save(update_fields=("payment_status", "updated_at"))
    return True


def _enqueue_notification(notification_id: int) -> None:
    from .tasks import send_order_confirmation

    try:
        send_order_confirmation.delay(notification_id)
    except Exception:
        logger.exception(
            "Unable to enqueue order confirmation",
            extra={"notification_id": notification_id},
        )
