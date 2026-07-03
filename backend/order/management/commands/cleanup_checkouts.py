from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from order.models import Order


class Command(BaseCommand):
    help = "Cancel checkout records that have remained unpaid for more than 24 hours."

    def handle(self, *args: object, **options: object) -> None:
        cutoff = timezone.now() - timedelta(hours=24)
        updated = Order.objects.filter(
            payment_status__in=(Order.PaymentStatus.PENDING, Order.PaymentStatus.PROCESSING),
            created_at__lt=cutoff,
        ).update(payment_status=Order.PaymentStatus.CANCELED)
        self.stdout.write(self.style.SUCCESS(f"Canceled {updated} abandoned checkout(s)."))
