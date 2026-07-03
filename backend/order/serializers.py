from __future__ import annotations

from rest_framework import serializers

from .models import (
    CustomizationGroup,
    CustomizationOption,
    Location,
    MenuItem,
    Order,
    OrderItem,
    OrderItemCustomization,
)


class CustomizationOptionSerializer(serializers.ModelSerializer):
    extra_amount = serializers.SerializerMethodField()

    class Meta:
        model = CustomizationOption
        fields = ("id", "name", "extra_amount")

    def get_extra_amount(self, obj: CustomizationOption) -> int:
        return int(obj.extra_cost * 100)


class CustomizationGroupSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = CustomizationGroup
        fields = ("id", "name", "required", "max_choices", "options")

    def get_options(self, obj: CustomizationGroup) -> list[dict[str, object]]:
        options = obj.options.filter(active=True)
        return CustomizationOptionSerializer(options, many=True).data


class MenuItemSerializer(serializers.ModelSerializer):
    price_amount = serializers.SerializerMethodField()
    customization_groups = CustomizationGroupSerializer(many=True)

    class Meta:
        model = MenuItem
        fields = (
            "id",
            "slug",
            "title",
            "description",
            "image_url",
            "price_amount",
            "customization_groups",
        )

    def get_price_amount(self, obj: MenuItem) -> int:
        return int(obj.price * 100)


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ("id", "name")


class CheckoutItemSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=20)
    option_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=True,
        max_length=20,
        default=list,
    )

    def validate_option_ids(self, values: list[int]) -> list[int]:
        if len(values) != len(set(values)):
            raise serializers.ValidationError("Duplicate customization options are not allowed.")
        return values


class CheckoutSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=100, trim_whitespace=True)
    customer_email = serializers.EmailField()
    location_id = serializers.IntegerField(min_value=1)
    items = CheckoutItemSerializer(many=True, allow_empty=False, max_length=50)


class OrderItemCustomizationSerializer(serializers.ModelSerializer):
    extra_amount = serializers.IntegerField(source="unit_amount")

    class Meta:
        model = OrderItemCustomization
        fields = ("group_name", "option_name", "extra_amount")


class OrderItemSerializer(serializers.ModelSerializer):
    customizations = OrderItemCustomizationSerializer(many=True)

    class Meta:
        model = OrderItem
        fields = ("title", "unit_amount", "quantity", "customizations")


class CustomerOrderSerializer(serializers.ModelSerializer):
    location = serializers.CharField(source="location_name")
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "created_at",
            "location",
            "currency",
            "amount_total",
            "payment_status",
            "fulfillment_status",
            "items",
        )


class MerchantOrderSerializer(CustomerOrderSerializer):
    class Meta(CustomerOrderSerializer.Meta):
        fields = CustomerOrderSerializer.Meta.fields + (  # type: ignore[assignment]
            "customer_name",
            "customer_email",
        )


class FulfillmentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.FulfillmentStatus.choices)
