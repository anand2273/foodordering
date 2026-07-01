# API v1

All error responses use:

```json
{"error": {"code": "machine_code", "message": "Human-readable message", "fields": {}}}
```

## Public

- `GET /api/v1/menu-items/`
- `GET /api/v1/menu-items/{slug}/`
- `GET /api/v1/locations/`
- `POST /api/v1/checkouts/` — requires `Idempotency-Key`
- `GET /api/v1/order-status/?token=...`
- `POST /api/v1/webhooks/stripe/` — requires a valid Stripe signature

Checkout body:

```json
{
  "customer_name": "Ada",
  "customer_email": "ada@example.com",
  "location_id": 1,
  "items": [{"menu_item_id": 1, "quantity": 2, "option_ids": [3]}]
}
```

## Merchant

Call `GET /api/v1/auth/csrf/` before login and send the `csrftoken` cookie as
`X-CSRFToken` on unsafe requests.

- `POST /api/v1/auth/login/`
- `GET /api/v1/auth/session/`
- `POST /api/v1/auth/logout/`
- `GET /api/v1/merchant/orders/?location_id=&status=`
- `PATCH /api/v1/merchant/orders/{uuid}/status/`
- `POST /api/v1/merchant/locations/{id}/fulfill-ready/`
