# Food Ordering App

A full-stack food pre-ordering application built for a campus food vendor. Customers browse a menu with item customization options, add items to a persistent cart, and track their order status in real time. Merchants authenticate via JWT to view and fulfill orders, with support for bulk fulfillment filtered by pickup location.

**Stack:** Django 5.2 / Django REST Framework / SimpleJWT · React 19 / React Router / Axios / TailwindCSS / Bootstrap

---

## Architecture

```
React 19 (frontend)
    |
    |  HTTP + Axios (JWT Bearer token for merchant requests)
    v
Django REST Framework (backend)
    |
    |  Django ORM
    v
SQLite (development — swap DATABASES in settings.py for PostgreSQL)
```

**Two user contexts:**
- **Customer** — unauthenticated. Browses menu, places orders, polls for order status.
- **Merchant** — JWT-authenticated. Views orders, marks items ready/fulfilled, bulk-fulfills by location.

---

## Key Design Decisions

- **UUID primary keys on `Order`** — prevents sequential ID enumeration by customers.
- **Abstract Django `Item` model** — centralises slug auto-generation via `save()` so any future item type inherits it without repetition.
- **Cart key = slug + customisation fingerprint** — `slug__group:optionA|group:optionB` means the same item with different options appears as a distinct cart entry, not a quantity increment.
- **`Location` as a FK on `Order`** (not a free-text field) — enables future location-based analytics queries and preserves referential integrity. `SET_NULL` on delete preserves order history even if a location is removed.
- **Bulk fulfillment via `QuerySet.update()`** — single SQL `UPDATE` statement, not a Python loop calling `save()` N times.
- **30-second polling with `useEffect` cleanup** — `clearInterval` returned from the effect prevents the timer firing after unmount. Designed to be replaced with WebSockets for production.

---

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate        # also seeds Location data via migration 0005
python manage.py createsuperuser  # creates the merchant login
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
REACT_APP_API_BASE_URL=http://127.0.0.1:8000
```

```bash
npm start
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/{slug}/api/menu/` | None | List all menu items with customisation options |
| `GET` | `/{slug}/api/menu-item/{item_slug}/` | None | Single item detail |
| `POST` | `/{slug}/api/place-order/` | None | Place a new order |
| `GET` | `/{slug}/api/orders/` | None | List orders; filter with `?location_id=` |
| `GET` | `/{slug}/api/orders/{order_id}/` | None | Single order detail |
| `PATCH` | `/{slug}/api/orders/{order_id}/ready/` | JWT | Toggle order ready state |
| `PATCH` | `/{slug}/api/orders/{order_id}/fulfilled/` | JWT | Toggle order fulfilled state |
| `GET` | `/api/locations/` | None | List all pickup locations |
| `POST` | `/api/locations/{location_id}/fulfill/` | JWT | Bulk-fulfill all orders at a location |
| `POST` | `/api/token/` | None | Obtain JWT access + refresh tokens |
| `POST` | `/api/token/refresh/` | None | Refresh access token |

---

## Notes on CSRF

`place_order` uses `@csrf_exempt` because it receives JSON from a cross-origin React frontend and does not rely on session cookies for authentication. All mutation endpoints that require authentication (`toggle_order_ready`, `toggle_order_fulfilled`, `fulfill_location`) are protected by JWT bearer token validation. Since the token is not automatically sent by the browser (unlike cookies), these endpoints are inherently CSRF-safe. Public read endpoints use `AllowAny` intentionally as order read access is not sensitive.
