# Food Ordering App

A production-oriented, single-vendor ordering system. Customers customize a menu,
pay through Stripe, and track fulfillment without creating an account. Merchants
use a CSRF-protected server session to manage paid orders.

## Architecture

- Django 5.2 and Django REST Framework
- PostgreSQL for durable application state
- Redis and Celery for reliable notification delivery
- Stripe Payment Intents with signed webhooks and end-to-end idempotency
- React 19, Vite, strict TypeScript, React Query, and Tailwind CSS
- Vercel for the frontend; Render for the API, worker, PostgreSQL, and Redis

The API is private-by-default. Public endpoints are explicitly marked, customer
tracking uses an expiring signed token, and public order responses exclude PII.
Order lines snapshot names and prices so menu edits cannot rewrite order history.

See [Architecture](docs/architecture.md), [API](docs/api.md), and the
[Operations runbook](docs/runbook.md).

## Local setup

Prerequisites: Python 3.12–3.13, Node 22, Docker, and Stripe test credentials.

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
docker compose up -d
python -m venv venv
./venv/bin/pip install -r requirements-dev.lock
./venv/bin/python backend/manage.py migrate
./venv/bin/python backend/manage.py seed_demo
./venv/bin/python backend/manage.py createsuperuser
```

Start the API and worker:

```bash
./venv/bin/python backend/manage.py runserver
./venv/bin/celery -A foodapp --workdir backend worker --loglevel=INFO
```

Start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Forward Stripe test webhooks to
`http://localhost:8000/api/v1/webhooks/stripe/` and place the generated webhook
secret in `.env`.

## Quality gates

```bash
./venv/bin/ruff format --check backend
./venv/bin/ruff check backend
MYPYPATH=backend ./venv/bin/mypy backend
./venv/bin/coverage run backend/manage.py test order
./venv/bin/coverage report
./venv/bin/python backend/manage.py makemigrations --check --dry-run

cd frontend
npm run lint
npm test
npm run test:e2e
npm run build
```

CI runs these checks against PostgreSQL and Redis. Production deployment also
runs Django's deployment security checks.

## Security

Never commit environment files or databases. Credentials that have ever appeared
in Git must be rotated; removing them from the latest commit is not sufficient.
Report vulnerabilities privately to the repository owner rather than opening a
public issue.
