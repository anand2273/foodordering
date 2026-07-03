# Operations Runbook

## Deployment

Render runs database migrations as a pre-deploy command. Deploy the API and
worker before the Vercel frontend when an API change is backward compatible.
Breaking API changes require a new versioned endpoint.

Required production configuration is documented in `.env.example`. The API and
worker must share the same `SECRET_KEY`, database, and Redis instance. Use sibling
custom domains for the frontend and API and restrict CORS/CSRF to the frontend.

## Health and alerts

- `/api/v1/health/live/`: process is serving requests.
- `/api/v1/health/ready/`: process can query PostgreSQL.
- Alert on sustained 5xx responses, failed Stripe signatures, notification rows
  remaining failed, Celery queue backlog, and database capacity.

## Payment incident

1. Do not manually mark an order paid based on a browser response.
2. Find the Payment Intent in Stripe and match its `order_id` metadata.
3. Confirm webhook delivery and the unique Stripe event row.
4. Retry the webhook from Stripe. Duplicate delivery is safe.
5. If payment succeeded but no order exists, stop checkout traffic and investigate
   before issuing a refund or reconstructing the order.

## Notification incident

Payment processing is independent of email. Inspect the notification's attempts
and error, correct provider configuration, reset a failed row to `pending`, and
enqueue it once. The uniqueness constraint prevents duplicate outbox records.

## Backup and rollback

Enable daily PostgreSQL backups and test restoring into an isolated database
before launch and quarterly afterward. Application rollback is safe only when the
previous release understands the deployed schema; use additive migrations once
real data exists. Never roll back by deleting production tables.

## Credential exposure

Rotate the credential first, then remove it from the current tree and Git history.
Assume every committed secret has already been copied. Coordinate any history
rewrite because all collaborators must re-clone.
