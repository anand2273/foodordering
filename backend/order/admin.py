from django.contrib import admin

from .models import (
    CustomizationGroup,
    CustomizationOption,
    Location,
    MenuItem,
    Notification,
    Order,
    OrderItem,
    OrderItemCustomization,
    StripeEvent,
)


class CustomizationOptionInline(admin.TabularInline):
    model = CustomizationOption
    extra = 0


@admin.register(CustomizationGroup)
class CustomizationGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "menu_item", "required", "max_choices", "display_order")
    list_filter = ("required", "menu_item")
    inlines = (CustomizationOptionInline,)


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("title", "price", "active", "updated_at")
    list_filter = ("active",)
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "description")


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("name", "active", "display_order")
    list_editable = ("active", "display_order")


class OrderItemCustomizationInline(admin.TabularInline):
    model = OrderItemCustomization
    extra = 0
    readonly_fields = ("group_name", "option_name", "unit_amount")


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("title", "unit_amount", "quantity")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "short_id",
        "customer_name",
        "location_name",
        "amount_total",
        "payment_status",
        "fulfillment_status",
        "created_at",
    )
    list_filter = ("payment_status", "fulfillment_status", "location")
    search_fields = ("id", "customer_name", "customer_email")
    readonly_fields = (
        "id",
        "customer_name",
        "customer_email",
        "location_name",
        "currency",
        "amount_total",
        "checkout_idempotency_key",
        "checkout_fingerprint",
        "stripe_payment_intent_id",
        "paid_at",
        "created_at",
        "updated_at",
    )
    inlines = (OrderItemInline,)

    @admin.display(description="Order")
    def short_id(self, obj: Order) -> str:
        return str(obj.id)[:8].upper()


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("order", "kind", "status", "attempts", "sent_at")
    list_filter = ("kind", "status")
    readonly_fields = ("order", "kind", "status", "attempts", "last_error", "sent_at")


@admin.register(StripeEvent)
class StripeEventAdmin(admin.ModelAdmin):
    list_display = ("event_id", "event_type", "processed_at")
    readonly_fields = ("event_id", "event_type", "processed_at")


admin.site.register(CustomizationOption)
