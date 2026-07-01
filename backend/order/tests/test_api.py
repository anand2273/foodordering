from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from order.models import Order
from order.services import issue_tracking_token
from order.tests.factories import (
    checkout_payload,
    create_menu,
    create_merchant,
    create_paid_order,
)


@override_settings(STRIPE_SECRET_KEY="sk_test")
class PublicApiTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.location, self.item, _, self.options = create_menu()

    @patch("order.services.stripe.PaymentIntent.create")
    def test_checkout_requires_idempotency_key(self, create_intent: object) -> None:
        response = self.client.post(
            "/api/v1/checkouts/",
            checkout_payload(self.location, self.item, self.options[0]),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"]["code"], "invalid_idempotency_key")
        create_intent.assert_not_called()

    @patch("order.services.stripe.PaymentIntent.create")
    def test_checkout_returns_tracking_token(self, create_intent: object) -> None:
        create_intent.return_value = SimpleNamespace(id="pi_1", client_secret="secret")
        response = self.client.post(
            "/api/v1/checkouts/",
            checkout_payload(self.location, self.item, self.options[0]),
            format="json",
            HTTP_IDEMPOTENCY_KEY="api-checkout",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["client_secret"], "secret")
        self.assertIn("tracking_token", response.data)

    def test_tracking_response_does_not_expose_customer_pii(self) -> None:
        order = create_paid_order(self.location, self.item)
        response = self.client.get(
            "/api/v1/order-status/",
            {"token": issue_tracking_token(order.id)},
        )
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("customer_email", response.data)
        self.assertNotIn("customer_name", response.data)

    def test_invalid_tracking_token_is_rejected(self) -> None:
        response = self.client.get("/api/v1/order-status/", {"token": "tampered"})
        self.assertEqual(response.status_code, 404)

    def test_menu_and_location_endpoints_only_return_active_records(self) -> None:
        self.item.active = False
        self.item.save()
        menu_response = self.client.get("/api/v1/menu-items/")
        location_response = self.client.get("/api/v1/locations/")
        self.assertEqual(menu_response.data, [])
        self.assertEqual(location_response.data[0]["name"], self.location.name)

    def test_health_endpoints_report_ready(self) -> None:
        self.assertEqual(self.client.get("/api/v1/health/live/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/health/ready/").status_code, 200)


class MerchantApiTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient(enforce_csrf_checks=True)
        self.location, self.item, _, _ = create_menu()
        self.order = create_paid_order(self.location, self.item)
        self.user = create_merchant()

    def login(self) -> None:
        csrf_response = self.client.get("/api/v1/auth/csrf/")
        token = csrf_response.cookies["csrftoken"].value
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": self.user.username, "password": "correct-horse-battery"},
            format="json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, 200)

    def test_merchant_orders_require_authentication(self) -> None:
        response = self.client.get("/api/v1/merchant/orders/")
        self.assertIn(response.status_code, (401, 403))

    def test_login_requires_csrf(self) -> None:
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": self.user.username, "password": "correct-horse-battery"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_valid_fulfillment_transitions(self) -> None:
        self.login()
        csrf_token = self.client.cookies["csrftoken"].value
        response = self.client.patch(
            f"/api/v1/merchant/orders/{self.order.id}/status/",
            {"status": Order.FulfillmentStatus.READY},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.fulfillment_status, Order.FulfillmentStatus.READY)

    def test_cannot_skip_directly_to_fulfilled(self) -> None:
        self.login()
        csrf_token = self.client.cookies["csrftoken"].value
        response = self.client.patch(
            f"/api/v1/merchant/orders/{self.order.id}/status/",
            {"status": Order.FulfillmentStatus.FULFILLED},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, 409)

    def test_bulk_fulfillment_only_updates_ready_orders(self) -> None:
        self.login()
        self.order.fulfillment_status = Order.FulfillmentStatus.READY
        self.order.save(update_fields=("fulfillment_status",))
        second = create_paid_order_with_key(self.location, self.item, "second")
        csrf_token = self.client.cookies["csrftoken"].value

        response = self.client.post(
            f"/api/v1/merchant/locations/{self.location.id}/fulfill-ready/",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["fulfilled_count"], 1)
        self.order.refresh_from_db()
        second.refresh_from_db()
        self.assertEqual(self.order.fulfillment_status, Order.FulfillmentStatus.FULFILLED)
        self.assertEqual(second.fulfillment_status, Order.FulfillmentStatus.PREPARING)


def create_paid_order_with_key(location: object, item: object, key: str) -> Order:
    return create_paid_order(location, item, key)  # type: ignore[arg-type]
