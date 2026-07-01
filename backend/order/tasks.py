from __future__ import annotations

from urllib.parse import quote

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from .models import Notification
from .services import issue_tracking_token


@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    max_retries=5,
)
def send_order_confirmation(notification_id: int) -> None:
    with transaction.atomic():
        notification = (
            Notification.objects.select_for_update().select_related("order").get(id=notification_id)
        )
        if notification.status == Notification.Status.SENT:
            return
        notification.status = Notification.Status.SENDING
        notification.attempts += 1
        notification.last_error = ""
        notification.save(update_fields=("status", "attempts", "last_error", "updated_at"))

    order = notification.order
    token = quote(issue_tracking_token(order.id), safe="")
    tracking_url = f"{settings.PUBLIC_APP_URL}/active-order?token={token}"
    item_lines = []
    for item in order.items.prefetch_related("customizations"):
        item_lines.append(f"- {item.title} × {item.quantity}")
        item_lines.extend(
            f"  - {option.group_name}: {option.option_name}" for option in item.customizations.all()
        )
    body = "\n".join(
        [
            f"Hi {order.customer_name},",
            "",
            f"Your order from {settings.STORE_NAME} has been paid.",
            f"Order: {str(order.id)[:8].upper()}",
            f"Pickup: {order.location_name}",
            f"Total: {order.currency.upper()} {order.amount_total / 100:.2f}",
            "",
            *item_lines,
            "",
            f"Track your order: {tracking_url}",
        ]
    )

    try:
        send_mail(
            subject=f"Order confirmation — {settings.STORE_NAME}",
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer_email],
            fail_silently=False,
        )
    except Exception as exc:
        Notification.objects.filter(id=notification_id).update(
            status=Notification.Status.FAILED,
            last_error=str(exc)[:2000],
        )
        raise

    Notification.objects.filter(id=notification_id).update(
        status=Notification.Status.SENT,
        sent_at=timezone.now(),
        last_error="",
    )
