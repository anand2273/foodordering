# Architecture

## Trust boundaries

The browser never supplies authoritative prices, item names, payment state, or
fulfillment state. Checkout accepts database IDs and quantities; the API reloads
the active menu, validates customization ownership and limits, calculates the
total, and stores immutable snapshots.

Customer order access is a bearer capability represented by a timestamped Django
signature. It expires after seven days and resolves to a reduced response that
does not include the customer's name or email. Merchant endpoints require an
active staff or `merchant`-group user authenticated through a secure Django
session.

## Payment lifecycle

1. The client creates a random idempotency key and submits checkout once.
2. Django validates the whole cart and atomically creates the order snapshots.
3. Stripe receives the same stable idempotency key. A timeout can therefore be
   retried without creating a second Payment Intent.
4. Signed Stripe webhooks are the source of truth for payment status.
5. Each Stripe event ID is recorded once under a transaction and order row lock.
6. A successful payment creates one notification outbox row after commit.
7. Celery retries SendGrid delivery independently from the webhook response.

`paid` is terminal against late failed/canceled events. Fulfillment has a separate
state machine: `preparing → ready → fulfilled`; a ready order may be returned to
preparing, but fulfilled orders are terminal.

## Data and failure handling

- PostgreSQL constraints protect positive totals/quantities and paid fulfillment.
- Menu and option deletion uses nullable references; snapshots preserve history.
- Abandoned pending checkouts are canceled after 24 hours.
- Liveness does not contact dependencies. Readiness verifies the database.
- Redis queue failures are logged and surfaced through Sentry; the notification
  outbox preserves work for operational replay.
