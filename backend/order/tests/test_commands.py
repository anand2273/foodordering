from datetime import timedelta
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from order.models import Order
from order.tests.factories import create_menu, create_paid_order


class ManagementCommandTests(TestCase):
    def test_cleanup_cancels_only_old_unpaid_orders(self) -> None:
        location, item, _, _ = create_menu()
        old = create_paid_order(location, item)
        old.payment_status = Order.PaymentStatus.PENDING
        old.checkout_idempotency_key = "old"
        old.stripe_payment_intent_id = "pi_old"
        old.save()
        Order.objects.filter(id=old.id).update(created_at=timezone.now() - timedelta(days=2))
        paid = create_paid_order_with_unique_values(location, item)

        output = StringIO()
        call_command("cleanup_checkouts", stdout=output)

        old.refresh_from_db()
        paid.refresh_from_db()
        self.assertEqual(old.payment_status, Order.PaymentStatus.CANCELED)
        self.assertEqual(paid.payment_status, Order.PaymentStatus.PAID)
        self.assertIn("Canceled 1", output.getvalue())

    def test_seed_demo_is_idempotent(self) -> None:
        call_command("seed_demo", stdout=StringIO())
        call_command("seed_demo", stdout=StringIO())
        self.assertEqual(Order.objects.count(), 0)

    @patch("order.management.commands.process_outbox.send_order_confirmation.delay")
    def test_process_outbox_enqueues_retryable_notifications(self, delay: object) -> None:
        from order.models import Notification

        location, item, _, _ = create_menu()
        order = create_paid_order(location, item, "notification-order")
        notification = Notification.objects.create(
            order=order,
            kind=Notification.Kind.ORDER_CONFIRMATION,
        )
        call_command("process_outbox", stdout=StringIO())
        delay.assert_called_once_with(notification.id)  # type: ignore[attr-defined]

    def test_purge_customer_pii_anonymizes_old_fulfilled_orders(self) -> None:
        location, item, _, _ = create_menu()
        order = create_paid_order(location, item, "old-fulfilled")
        order.fulfillment_status = Order.FulfillmentStatus.FULFILLED
        order.save(update_fields=("fulfillment_status",))
        Order.objects.filter(id=order.id).update(updated_at=timezone.now() - timedelta(days=100))

        call_command("purge_customer_pii", stdout=StringIO())

        order.refresh_from_db()
        self.assertEqual(order.customer_name, "Deleted customer")
        self.assertTrue(order.customer_email.endswith("@invalid.example"))


def create_paid_order_with_unique_values(location: object, item: object) -> Order:
    return create_paid_order(location, item, "paid-unique")  # type: ignore[arg-type]
