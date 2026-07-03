from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from order.models import Order


class Command(BaseCommand):
    help = "Anonymize customer PII on fulfilled orders beyond the configured retention period."

    def handle(self, *args: object, **options: object) -> None:
        cutoff = timezone.now() - timedelta(days=settings.CUSTOMER_PII_RETENTION_DAYS)
        order_ids = Order.objects.filter(
            fulfillment_status=Order.FulfillmentStatus.FULFILLED,
            updated_at__lt=cutoff,
        ).values_list("id", flat=True)
        updated = 0
        for order_id in order_ids.iterator():
            updated += Order.objects.filter(id=order_id).update(
                customer_name="Deleted customer",
                customer_email=f"deleted+{order_id}@invalid.example",
            )
        self.stdout.write(self.style.SUCCESS(f"Anonymized {updated} order(s)."))
