from decimal import Decimal

from django.contrib.auth.models import Group, User

from order.models import (
    CustomizationGroup,
    CustomizationOption,
    Location,
    MenuItem,
    Order,
    OrderItem,
)


def create_menu() -> tuple[Location, MenuItem, CustomizationGroup, list[CustomizationOption]]:
    location = Location.objects.create(name="Hall 4")
    item = MenuItem.objects.create(title="Milk Tea", price=Decimal("4.50"))
    group = CustomizationGroup.objects.create(
        menu_item=item,
        name="Sugar",
        required=True,
        max_choices=1,
    )
    options = [
        CustomizationOption.objects.create(group=group, name="0%"),
        CustomizationOption.objects.create(group=group, name="50%"),
    ]
    return location, item, group, options


def checkout_payload(
    location: Location,
    item: MenuItem,
    option: CustomizationOption,
) -> dict[str, object]:
    return {
        "customer_name": "Ada Lovelace",
        "customer_email": "ada@example.com",
        "location_id": location.id,
        "items": [
            {
                "menu_item_id": item.id,
                "quantity": 2,
                "option_ids": [option.id],
            }
        ],
    }


def create_paid_order(location: Location, item: MenuItem, key: str = "paid-order") -> Order:
    order = Order.objects.create(
        customer_name="Ada Lovelace",
        customer_email="ada@example.com",
        location=location,
        location_name=location.name,
        currency="sgd",
        amount_total=900,
        payment_status=Order.PaymentStatus.PAID,
        checkout_idempotency_key=key,
        checkout_fingerprint="a" * 64,
        stripe_payment_intent_id=f"pi_{key}",
    )
    OrderItem.objects.create(
        order=order,
        menu_item=item,
        title=item.title,
        unit_amount=450,
        quantity=2,
    )
    return order


def create_merchant() -> User:
    group, _ = Group.objects.get_or_create(name="merchant")
    user = User.objects.create_user(username="merchant", password="correct-horse-battery")
    user.groups.add(group)
    return user
