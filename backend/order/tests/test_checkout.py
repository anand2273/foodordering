from types import SimpleNamespace
from unittest.mock import patch

import stripe
from django.test import TestCase, override_settings

from order.models import Order
from order.services import CheckoutError, create_checkout
from order.tests.factories import checkout_payload, create_menu


@override_settings(STRIPE_SECRET_KEY="sk_test")
class CheckoutServiceTests(TestCase):
    def setUp(self) -> None:
        self.location, self.item, self.group, self.options = create_menu()
        self.payload = checkout_payload(self.location, self.item, self.options[0])

    @patch("order.services.stripe.PaymentIntent.create")
    def test_checkout_snapshots_server_prices(self, create_intent: object) -> None:
        create_intent.return_value = SimpleNamespace(id="pi_1", client_secret="secret")

        result = create_checkout(self.payload, "checkout-key")

        self.assertEqual(result.order.amount_total, 900)
        self.assertEqual(result.order.items.get().unit_amount, 450)
        self.assertEqual(result.order.items.get().title, "Milk Tea")
        create_intent.assert_called_once()

    @patch("order.services.stripe.PaymentIntent.retrieve")
    @patch("order.services.stripe.PaymentIntent.create")
    def test_idempotent_retry_returns_existing_intent(
        self,
        create_intent: object,
        retrieve_intent: object,
    ) -> None:
        create_intent.return_value = SimpleNamespace(id="pi_1", client_secret="secret")
        retrieve_intent.return_value = SimpleNamespace(id="pi_1", client_secret="secret")
        first = create_checkout(self.payload, "same-key")
        second = create_checkout(self.payload, "same-key")

        self.assertEqual(first.order.id, second.order.id)
        self.assertEqual(Order.objects.count(), 1)
        create_intent.assert_called_once()

    @patch("order.services.stripe.PaymentIntent.create")
    def test_reused_key_with_changed_payload_is_rejected(self, create_intent: object) -> None:
        create_intent.return_value = SimpleNamespace(id="pi_1", client_secret="secret")
        create_checkout(self.payload, "same-key")
        changed = {**self.payload, "customer_name": "Grace Hopper"}

        with self.assertRaisesRegex(CheckoutError, "different checkout"):
            create_checkout(changed, "same-key")

    def test_missing_required_customization_is_rejected(self) -> None:
        self.payload["items"][0]["option_ids"] = []  # type: ignore[index]
        with self.assertRaisesRegex(CheckoutError, "Select an option"):
            create_checkout(self.payload, "missing-option")

    def test_option_from_another_item_is_rejected(self) -> None:
        _, _, _, other_options = create_menu_for_second_location()
        self.payload["items"][0]["option_ids"] = [other_options[0].id]  # type: ignore[index]
        with self.assertRaisesRegex(CheckoutError, "unavailable"):
            create_checkout(self.payload, "wrong-option")

    def test_inactive_location_is_rejected(self) -> None:
        self.location.active = False
        self.location.save()
        with self.assertRaisesRegex(CheckoutError, "pickup location"):
            create_checkout(self.payload, "inactive-location")

    def test_duplicate_item_lines_are_rejected(self) -> None:
        self.payload["items"].append(self.payload["items"][0])  # type: ignore[attr-defined,index]
        with self.assertRaisesRegex(CheckoutError, "only once"):
            create_checkout(self.payload, "duplicate-item")

    def test_inactive_item_is_rejected(self) -> None:
        self.item.active = False
        self.item.save()
        with self.assertRaisesRegex(CheckoutError, "menu items"):
            create_checkout(self.payload, "inactive-item")

    def test_too_many_options_are_rejected(self) -> None:
        self.payload["items"][0]["option_ids"] = [option.id for option in self.options]  # type: ignore[index]
        with self.assertRaisesRegex(CheckoutError, "at most"):
            create_checkout(self.payload, "too-many-options")

    @patch("order.services.stripe.PaymentIntent.create")
    def test_provider_failure_preserves_pending_order(self, create_intent: object) -> None:
        create_intent.side_effect = stripe.APIConnectionError("offline")  # type: ignore[attr-defined]
        with self.assertRaisesRegex(CheckoutError, "Payment service unavailable"):
            create_checkout(self.payload, "provider-failure")
        self.assertEqual(
            Order.objects.get(checkout_idempotency_key="provider-failure").payment_status,
            Order.PaymentStatus.PENDING,
        )

    @override_settings(STRIPE_SECRET_KEY="")
    def test_missing_payment_configuration_fails_closed(self) -> None:
        with self.assertRaisesRegex(CheckoutError, "not configured"):
            create_checkout(self.payload, "not-configured")

    def test_zero_total_is_rejected(self) -> None:
        self.item.price = 0
        self.item.save()
        with self.assertRaisesRegex(CheckoutError, "greater than zero"):
            create_checkout(self.payload, "zero-total")

    @patch("order.services.stripe.PaymentIntent.retrieve")
    @patch("order.services.stripe.PaymentIntent.create")
    def test_provider_failure_during_idempotent_retrieval_is_safe(
        self,
        create_intent: object,
        retrieve_intent: object,
    ) -> None:
        create_intent.return_value = SimpleNamespace(id="pi_1", client_secret="secret")  # type: ignore[attr-defined]
        retrieve_intent.side_effect = stripe.APIConnectionError("offline")  # type: ignore[attr-defined]
        create_checkout(self.payload, "retrieve-failure")
        with self.assertRaisesRegex(CheckoutError, "Payment service unavailable"):
            create_checkout(self.payload, "retrieve-failure")


def create_menu_for_second_location():
    from decimal import Decimal

    from order.models import CustomizationGroup, CustomizationOption, MenuItem

    item = MenuItem.objects.create(title="Coffee", price=Decimal("3.00"))
    group = CustomizationGroup.objects.create(menu_item=item, name="Milk")
    options = [CustomizationOption.objects.create(group=group, name="Oat")]
    return None, item, group, options
