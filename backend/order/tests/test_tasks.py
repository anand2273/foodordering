from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings

from order.models import Notification
from order.tasks import send_order_confirmation
from order.tests.factories import create_menu, create_paid_order


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    PUBLIC_APP_URL="https://app.example.com",
)
class NotificationTaskTests(TestCase):
    def setUp(self) -> None:
        location, item, _, _ = create_menu()
        order = create_paid_order(location, item)
        self.notification = Notification.objects.create(
            order=order,
            kind=Notification.Kind.ORDER_CONFIRMATION,
        )

    def test_sends_confirmation_once(self) -> None:
        send_order_confirmation.run(self.notification.id)
        send_order_confirmation.run(self.notification.id)

        self.notification.refresh_from_db()
        self.assertEqual(self.notification.status, Notification.Status.SENT)
        self.assertEqual(self.notification.attempts, 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("https://app.example.com/active-order?token=", mail.outbox[0].body)

    @patch("order.tasks.send_mail", side_effect=RuntimeError("provider unavailable"))
    def test_records_delivery_failure(self, send_mail_mock: object) -> None:
        with self.assertRaisesRegex(RuntimeError, "provider unavailable"):
            send_order_confirmation.run(self.notification.id)

        self.notification.refresh_from_db()
        self.assertEqual(self.notification.status, Notification.Status.FAILED)
        self.assertEqual(self.notification.attempts, 1)
        self.assertIn("provider unavailable", self.notification.last_error)
