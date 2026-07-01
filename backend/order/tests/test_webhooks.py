from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from order.models import Notification, Order, StripeEvent
from order.services import _enqueue_notification, process_stripe_event
from order.tests.factories import create_menu, create_paid_order


class StripeEventTests(TestCase):
    def setUp(self) -> None:
        self.location, self.item, _, _ = create_menu()
        self.order = create_paid_order(self.location, self.item)
        self.order.payment_status = Order.PaymentStatus.PENDING
        self.order.paid_at = None
        self.order.save(update_fields=("payment_status", "paid_at"))

    def event(self, event_id: str, event_type: str) -> dict[str, object]:
        return {
            "id": event_id,
            "type": event_type,
            "data": {
                "object": {
                    "id": self.order.stripe_payment_intent_id,
                    "metadata": {"order_id": str(self.order.id)},
                }
            },
        }

    @patch("order.services._enqueue_notification")
    def test_success_marks_paid_and_enqueues_once(self, enqueue: object) -> None:
        with self.captureOnCommitCallbacks(execute=True):
            processed = process_stripe_event(self.event("evt_success", "payment_intent.succeeded"))
        self.assertTrue(processed)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.PAID)
        self.assertEqual(Notification.objects.count(), 1)
        enqueue.assert_called_once()

    @patch("order.services._enqueue_notification")
    def test_duplicate_event_is_ignored(self, enqueue: object) -> None:
        event = self.event("evt_duplicate", "payment_intent.succeeded")
        with self.captureOnCommitCallbacks(execute=True):
            self.assertTrue(process_stripe_event(event))
        self.assertFalse(process_stripe_event(event))
        self.assertEqual(StripeEvent.objects.count(), 1)
        enqueue.assert_called_once()

    def test_late_failure_cannot_regress_paid_order(self) -> None:
        self.order.mark_paid()
        process_stripe_event(self.event("evt_late", "payment_intent.payment_failed"))
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.PAID)

    def test_processing_and_canceled_transitions(self) -> None:
        process_stripe_event(self.event("evt_processing", "payment_intent.processing"))
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.PROCESSING)
        process_stripe_event(self.event("evt_canceled", "payment_intent.canceled"))
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.CANCELED)

    def test_event_without_id_is_ignored(self) -> None:
        self.assertFalse(process_stripe_event({"type": "payment_intent.succeeded"}))

    def test_unmatched_event_is_acknowledged(self) -> None:
        event = {
            "id": "evt_unknown",
            "type": "payment_intent.succeeded",
            "data": {"object": {"id": "pi_unknown", "metadata": {}}},
        }
        self.assertTrue(process_stripe_event(event))

    def test_event_can_recover_intent_id_from_metadata(self) -> None:
        self.order.stripe_payment_intent_id = None
        self.order.save(update_fields=("stripe_payment_intent_id",))
        event = self.event("evt_metadata", "payment_intent.processing")
        event["data"]["object"]["id"] = "pi_recovered"  # type: ignore[index]
        process_stripe_event(event)
        self.order.refresh_from_db()
        self.assertEqual(self.order.stripe_payment_intent_id, "pi_recovered")

    def test_payment_failure_marks_unpaid_order_failed(self) -> None:
        process_stripe_event(self.event("evt_failed", "payment_intent.payment_failed"))
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PaymentStatus.FAILED)

    @patch("order.tasks.send_order_confirmation.delay")
    def test_notification_enqueue_delegates_to_celery(self, delay: object) -> None:
        _enqueue_notification(42)
        delay.assert_called_once_with(42)  # type: ignore[attr-defined]


@override_settings(STRIPE_WEBHOOK_SECRET="whsec_test")
class StripeWebhookApiTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()

    @patch("order.views.process_stripe_event")
    @patch("order.views.stripe.Webhook.construct_event")
    def test_valid_event_is_processed(
        self,
        construct_event: object,
        process_event: object,
    ) -> None:
        construct_event.return_value = {"id": "evt_1", "type": "test"}  # type: ignore[attr-defined]
        response = self.client.post(
            "/api/v1/webhooks/stripe/",
            b"{}",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="signature",
        )
        self.assertEqual(response.status_code, 200)
        process_event.assert_called_once()  # type: ignore[attr-defined]

    def test_missing_signature_is_rejected(self) -> None:
        response = self.client.post(
            "/api/v1/webhooks/stripe/",
            b"{}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
