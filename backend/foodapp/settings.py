"""Environment-driven Django settings.

Development has safe local defaults. Production refuses to start without the
configuration required to protect customer and payment data.
"""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import dj_database_url
import environ
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(BASE_DIR / ".env")

ENVIRONMENT = env("ENVIRONMENT", default="development")
IS_PRODUCTION = ENVIRONMENT == "production"
DEBUG = env.bool("DEBUG", default=not IS_PRODUCTION)


def csv_setting(name: str, default: str = "") -> list[str]:
    return [value.strip() for value in env(name, default=default).split(",") if value.strip()]


SECRET_KEY = env("SECRET_KEY", default="development-only-secret-key-change-me")
if IS_PRODUCTION and SECRET_KEY == "development-only-secret-key-change-me":
    raise ImproperlyConfigured("SECRET_KEY must be set in production.")

ALLOWED_HOSTS = csv_setting(
    "ALLOWED_HOSTS",
    "" if IS_PRODUCTION else "localhost,127.0.0.1",
)

INSTALLED_APPS = [
    "order.apps.OrderConfig",
    "corsheaders",
    "rest_framework",
    "anymail",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "foodapp.urls"
WSGI_APPLICATION = "foodapp.wsgi.application"
ASGI_APPLICATION = "foodapp.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASE_URL = env("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")
if IS_PRODUCTION and DATABASE_URL.startswith("sqlite"):
    raise ImproperlyConfigured("DATABASE_URL must use PostgreSQL in production.")
DATABASES = {
    "default": dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600 if IS_PRODUCTION else 0,
        conn_health_checks=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = env("TIME_ZONE", default="Asia/Singapore")
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = csv_setting(
    "CORS_ALLOWED_ORIGINS",
    "" if IS_PRODUCTION else "http://localhost:5173",
)
CSRF_TRUSTED_ORIGINS = csv_setting(
    "CSRF_TRUSTED_ORIGINS",
    "" if IS_PRODUCTION else "http://localhost:5173",
)

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "login": "10/minute",
        "checkout": "20/minute",
        "tracking": "60/minute",
    },
}

STORE_NAME = env("STORE_NAME", default="ItsBubblin")
STORE_CURRENCY = env("STORE_CURRENCY", default="sgd").lower()
PUBLIC_APP_URL = env("PUBLIC_APP_URL", default="http://localhost:5173").rstrip("/")
ORDER_TRACKING_TOKEN_MAX_AGE = env.int(
    "ORDER_TRACKING_TOKEN_MAX_AGE",
    default=int(timedelta(days=7).total_seconds()),
)
CUSTOMER_PII_RETENTION_DAYS = env.int("CUSTOMER_PII_RETENTION_DAYS", default=90)

STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", default="")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", default="")

REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_TASK_TIME_LIMIT = 60
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)
CELERY_TASK_EAGER_PROPAGATES = True

if IS_PRODUCTION:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }
else:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@example.com")
SENDGRID_API_KEY = env("SENDGRID_API_KEY", default="")
if IS_PRODUCTION:
    EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"
    ANYMAIL = {"SENDGRID_API_KEY": SENDGRID_API_KEY}
else:
    EMAIL_BACKEND = env(
        "EMAIL_BACKEND",
        default="django.core.mail.backends.console.EmailBackend",
    )

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = IS_PRODUCTION
SESSION_COOKIE_SAMESITE = env(
    "SESSION_COOKIE_SAMESITE",
    default="None" if IS_PRODUCTION else "Lax",
)
SESSION_COOKIE_AGE = int(timedelta(hours=8).total_seconds())
SESSION_SAVE_EVERY_REQUEST = True
CSRF_COOKIE_SECURE = IS_PRODUCTION
CSRF_COOKIE_SAMESITE = env(
    "CSRF_COOKIE_SAMESITE",
    default="None" if IS_PRODUCTION else "Lax",
)
CSRF_COOKIE_HTTPONLY = False

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = IS_PRODUCTION
SECURE_HSTS_SECONDS = 31_536_000 if IS_PRODUCTION else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = IS_PRODUCTION
SECURE_HSTS_PRELOAD = IS_PRODUCTION
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.json.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        },
        "plain": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json" if IS_PRODUCTION else "plain",
        }
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", default="INFO")},
}

SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=ENVIRONMENT,
        traces_sample_rate=env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.1),
        send_default_pii=False,
    )
