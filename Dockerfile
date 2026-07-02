FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY --chown=app:app pyproject.toml requirements.lock ./
RUN pip install -r requirements.lock

COPY --chown=app:app backend ./backend
WORKDIR /app/backend

RUN python manage.py collectstatic --noinput

USER app

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--access-logfile", "-", "foodapp.wsgi:application"]
