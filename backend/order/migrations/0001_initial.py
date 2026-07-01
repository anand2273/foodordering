# Generated for the production-ready single-vendor schema.

import uuid

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Location",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=100, unique=True)),
                ("active", models.BooleanField(default=True)),
                ("display_order", models.PositiveIntegerField(default=0)),
            ],
            options={"ordering": ("display_order", "name")},
        ),
        migrations.CreateModel(
            name="MenuItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=100)),
                ("price", models.DecimalField(decimal_places=2, max_digits=8)),
                ("slug", models.SlugField(blank=True, max_length=100, unique=True)),
                ("description", models.TextField(blank=True)),
                ("image_url", models.URLField(blank=True)),
                ("active", models.BooleanField(default=True)),
            ],
            options={"ordering": ("title",)},
        ),
        migrations.CreateModel(
            name="CustomizationGroup",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("required", models.BooleanField(default=False)),
                (
                    "max_choices",
                    models.PositiveIntegerField(
                        default=1, validators=[django.core.validators.MinValueValidator(1)]
                    ),
                ),
                ("display_order", models.PositiveIntegerField(default=0)),
                (
                    "menu_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="customization_groups",
                        to="order.menuitem",
                    ),
                ),
            ],
            options={"ordering": ("display_order", "id")},
        ),
        migrations.CreateModel(
            name="CustomizationOption",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("extra_cost", models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ("active", models.BooleanField(default=True)),
                ("display_order", models.PositiveIntegerField(default=0)),
                (
                    "group",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="options",
                        to="order.customizationgroup",
                    ),
                ),
            ],
            options={"ordering": ("display_order", "id")},
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("customer_name", models.CharField(max_length=100)),
                ("customer_email", models.EmailField(max_length=254)),
                ("location_name", models.CharField(max_length=100)),
                ("currency", models.CharField(max_length=3)),
                (
                    "amount_total",
                    models.PositiveIntegerField(help_text="Total in the smallest currency unit."),
                ),
                (
                    "payment_status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("processing", "Processing"),
                            ("paid", "Paid"),
                            ("failed", "Failed"),
                            ("canceled", "Canceled"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                (
                    "fulfillment_status",
                    models.CharField(
                        choices=[
                            ("preparing", "Preparing"),
                            ("ready", "Ready"),
                            ("fulfilled", "Fulfilled"),
                        ],
                        default="preparing",
                        max_length=20,
                    ),
                ),
                ("checkout_idempotency_key", models.CharField(max_length=255, unique=True)),
                ("checkout_fingerprint", models.CharField(max_length=64)),
                (
                    "stripe_payment_intent_id",
                    models.CharField(blank=True, max_length=255, null=True, unique=True),
                ),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                (
                    "location",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="orders",
                        to="order.location",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "indexes": [
                    models.Index(
                        fields=["payment_status", "fulfillment_status", "-created_at"],
                        name="order_order_payment_418c8d_idx",
                    ),
                    models.Index(
                        fields=["location", "fulfillment_status"],
                        name="order_order_locatio_402576_idx",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("title", models.CharField(max_length=100)),
                (
                    "unit_amount",
                    models.PositiveIntegerField(
                        help_text="Unit price in the smallest currency unit."
                    ),
                ),
                (
                    "quantity",
                    models.PositiveIntegerField(
                        validators=[django.core.validators.MinValueValidator(1)]
                    ),
                ),
                (
                    "menu_item",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="order_items",
                        to="order.menuitem",
                    ),
                ),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="order.order",
                    ),
                ),
            ],
            options={"ordering": ("id",)},
        ),
        migrations.CreateModel(
            name="OrderItemCustomization",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("group_name", models.CharField(max_length=100)),
                ("option_name", models.CharField(max_length=100)),
                ("unit_amount", models.PositiveIntegerField(default=0)),
                (
                    "option",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="order_item_customizations",
                        to="order.customizationoption",
                    ),
                ),
                (
                    "order_item",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="customizations",
                        to="order.orderitem",
                    ),
                ),
            ],
            options={"ordering": ("id",)},
        ),
        migrations.CreateModel(
            name="StripeEvent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("event_id", models.CharField(max_length=255, unique=True)),
                ("event_type", models.CharField(max_length=100)),
                ("processed_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="Notification",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "kind",
                    models.CharField(
                        choices=[("order_confirmation", "Order confirmation")], max_length=50
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("sending", "Sending"),
                            ("sent", "Sent"),
                            ("failed", "Failed"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("attempts", models.PositiveIntegerField(default=0)),
                ("last_error", models.TextField(blank=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to="order.order",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="menuitem",
            constraint=models.CheckConstraint(
                condition=models.Q(("price__gte", 0)), name="menu_item_price_gte_0"
            ),
        ),
        migrations.AddConstraint(
            model_name="customizationgroup",
            constraint=models.UniqueConstraint(
                fields=("menu_item", "name"), name="unique_customization_group_name_per_item"
            ),
        ),
        migrations.AddConstraint(
            model_name="customizationgroup",
            constraint=models.CheckConstraint(
                condition=models.Q(("max_choices__gte", 1)),
                name="customization_group_max_choices_gte_1",
            ),
        ),
        migrations.AddConstraint(
            model_name="customizationoption",
            constraint=models.UniqueConstraint(
                fields=("group", "name"), name="unique_customization_option_name_per_group"
            ),
        ),
        migrations.AddConstraint(
            model_name="customizationoption",
            constraint=models.CheckConstraint(
                condition=models.Q(("extra_cost__gte", 0)),
                name="customization_option_extra_cost_gte_0",
            ),
        ),
        migrations.AddConstraint(
            model_name="order",
            constraint=models.CheckConstraint(
                condition=models.Q(("amount_total__gt", 0)), name="order_total_gt_0"
            ),
        ),
        migrations.AddConstraint(
            model_name="order",
            constraint=models.CheckConstraint(
                condition=models.Q(("fulfillment_status", "fulfilled"), _negated=True)
                | models.Q(("payment_status", "paid")),
                name="fulfilled_order_must_be_paid",
            ),
        ),
        migrations.AddConstraint(
            model_name="orderitem",
            constraint=models.CheckConstraint(
                condition=models.Q(("quantity__gte", 1)), name="order_item_quantity_gte_1"
            ),
        ),
        migrations.AddConstraint(
            model_name="orderitemcustomization",
            constraint=models.UniqueConstraint(
                condition=models.Q(("option__isnull", False)),
                fields=("order_item", "option"),
                name="unique_selected_option_per_order_item",
            ),
        ),
        migrations.AddConstraint(
            model_name="notification",
            constraint=models.UniqueConstraint(
                fields=("order", "kind"), name="unique_notification_per_order_kind"
            ),
        ),
    ]
