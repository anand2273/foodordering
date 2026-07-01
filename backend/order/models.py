from __future__ import annotations

import uuid
from typing import Any

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Location(models.Model):
    name = models.CharField(max_length=100, unique=True)
    active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("display_order", "name")

    def __str__(self) -> str:
        return self.name


class MenuItem(TimeStampedModel):
    title = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ("title",)
        constraints = [
            models.CheckConstraint(condition=models.Q(price__gte=0), name="menu_item_price_gte_0")
        ]

    def __str__(self) -> str:
        return self.title

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class CustomizationGroup(models.Model):
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.CASCADE,
        related_name="customization_groups",
    )
    name = models.CharField(max_length=100)
    required = models.BooleanField(default=False)
    max_choices = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("display_order", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("menu_item", "name"),
                name="unique_customization_group_name_per_item",
            ),
            models.CheckConstraint(
                condition=models.Q(max_choices__gte=1),
                name="customization_group_max_choices_gte_1",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.menu_item.title} — {self.name}"


class CustomizationOption(models.Model):
    group = models.ForeignKey(
        CustomizationGroup,
        on_delete=models.CASCADE,
        related_name="options",
    )
    name = models.CharField(max_length=100)
    extra_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("display_order", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("group", "name"),
                name="unique_customization_option_name_per_group",
            ),
            models.CheckConstraint(
                condition=models.Q(extra_cost__gte=0),
                name="customization_option_extra_cost_gte_0",
            ),
        ]

    def __str__(self) -> str:
        return self.name


class Order(TimeStampedModel):
    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        CANCELED = "canceled", "Canceled"

    class FulfillmentStatus(models.TextChoices):
        PREPARING = "preparing", "Preparing"
        READY = "ready", "Ready"
        FULFILLED = "fulfilled", "Fulfilled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer_name = models.CharField(max_length=100)
    customer_email = models.EmailField()
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        related_name="orders",
        null=True,
    )
    location_name = models.CharField(max_length=100)
    currency = models.CharField(max_length=3)
    amount_total = models.PositiveIntegerField(help_text="Total in the smallest currency unit.")
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    fulfillment_status = models.CharField(
        max_length=20,
        choices=FulfillmentStatus.choices,
        default=FulfillmentStatus.PREPARING,
    )
    checkout_idempotency_key = models.CharField(max_length=255, unique=True)
    checkout_fingerprint = models.CharField(max_length=64)
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(
                fields=("payment_status", "fulfillment_status", "-created_at"),
                name="order_order_payment_418c8d_idx",
            ),
            models.Index(
                fields=("location", "fulfillment_status"),
                name="order_order_locatio_402576_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(amount_total__gt=0), name="order_total_gt_0"),
            models.CheckConstraint(
                condition=(
                    ~models.Q(fulfillment_status="fulfilled") | models.Q(payment_status="paid")
                ),
                name="fulfilled_order_must_be_paid",
            ),
        ]

    def __str__(self) -> str:
        return f"{str(self.id)[:8]} — {self.customer_name}"

    def mark_paid(self) -> bool:
        if self.payment_status == self.PaymentStatus.PAID:
            return False
        self.payment_status = self.PaymentStatus.PAID
        self.paid_at = timezone.now()
        self.save(update_fields=("payment_status", "paid_at", "updated_at"))
        return True


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.SET_NULL,
        related_name="order_items",
        null=True,
    )
    title = models.CharField(max_length=100)
    unit_amount = models.PositiveIntegerField(help_text="Unit price in the smallest currency unit.")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        ordering = ("id",)
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gte=1),
                name="order_item_quantity_gte_1",
            )
        ]

    def __str__(self) -> str:
        return f"{self.quantity} × {self.title}"

    @property
    def line_total(self) -> int:
        extras = sum(option.unit_amount for option in self.customizations.all())
        return (self.unit_amount + extras) * self.quantity


class OrderItemCustomization(models.Model):
    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.CASCADE,
        related_name="customizations",
    )
    option = models.ForeignKey(
        CustomizationOption,
        on_delete=models.SET_NULL,
        related_name="order_item_customizations",
        null=True,
    )
    group_name = models.CharField(max_length=100)
    option_name = models.CharField(max_length=100)
    unit_amount = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("id",)
        constraints = [
            models.UniqueConstraint(
                fields=("order_item", "option"),
                condition=models.Q(option__isnull=False),
                name="unique_selected_option_per_order_item",
            )
        ]

    def __str__(self) -> str:
        return f"{self.group_name}: {self.option_name}"


class StripeEvent(models.Model):
    event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100)
    processed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.event_type} ({self.event_id})"


class Notification(TimeStampedModel):
    class Kind(models.TextChoices):
        ORDER_CONFIRMATION = "order_confirmation", "Order confirmation"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENDING = "sending", "Sending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="notifications")
    kind = models.CharField(max_length=50, choices=Kind.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    attempts = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("order", "kind"),
                name="unique_notification_per_order_kind",
            )
        ]

    def __str__(self) -> str:
        return f"{self.kind} for {self.order_id}: {self.status}"
