import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "foodapp.settings")

app = Celery("foodapp")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
