from django.core.management.base import BaseCommand

from order.models import Notification
from order.tasks import send_order_confirmation


class Command(BaseCommand):
    help = "Enqueue pending and retryable failed notifications."

    def handle(self, *args: object, **options: object) -> None:
        notification_ids = list(
            Notification.objects.filter(
                status__in=(Notification.Status.PENDING, Notification.Status.FAILED),
                attempts__lt=5,
            ).values_list("id", flat=True)
        )
        for notification_id in notification_ids:
            send_order_confirmation.delay(notification_id)
        self.stdout.write(self.style.SUCCESS(f"Enqueued {len(notification_ids)} notification(s)."))
