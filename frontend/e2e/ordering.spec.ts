import { expect, test, type Page, type Route } from "@playwright/test";

const menuItem = {
  id: 1,
  slug: "milk-tea",
  title: "Milk Tea",
  description: "Freshly brewed tea",
  image_url: "",
  price_amount: 450,
  customization_groups: [
    {
      id: 10,
      name: "Sugar",
      required: true,
      max_choices: 1,
      options: [
        { id: 100, name: "0%", extra_amount: 0 },
        { id: 101, name: "50%", extra_amount: 0 },
      ],
    },
  ],
};

const customerOrder = {
  id: "11111111-1111-4111-8111-111111111111",
  created_at: "2026-07-01T03:00:00Z",
  location: "Hall 4",
  currency: "sgd",
  amount_total: 450,
  payment_status: "paid",
  fulfillment_status: "ready",
  items: [
    {
      title: "Milk Tea",
      unit_amount: 450,
      quantity: 1,
      customizations: [
        { group_name: "Sugar", option_name: "50%", extra_amount: 0 },
      ],
    },
  ],
};

async function fulfill(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(json),
  });
}

async function mockCustomerApi(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/auth/session/")) {
      return fulfill(route, { error: { code: "not_authenticated" } }, 403);
    }
    if (path.endsWith("/menu-items/")) return fulfill(route, [menuItem]);
    if (path.endsWith("/menu-items/milk-tea/")) return fulfill(route, menuItem);
    if (path.endsWith("/locations/")) {
      return fulfill(route, [{ id: 1, name: "Hall 4" }]);
    }
    if (path.endsWith("/checkouts/")) {
      expect(request.headers()["idempotency-key"]).toBeTruthy();
      expect(request.postDataJSON()).toMatchObject({
        location_id: 1,
        items: [{ menu_item_id: 1, quantity: 1, option_ids: [101] }],
      });
      return fulfill(route, {
        order_id: customerOrder.id,
        tracking_token: "signed-tracking-token",
        client_secret: "test-client-secret",
      });
    }
    if (path.endsWith("/order-status/")) return fulfill(route, customerOrder);
    return fulfill(route, { error: { code: "not_found" } }, 404);
  });
}

test("customer completes checkout and tracks the paid order", async ({
  page,
}) => {
  await mockCustomerApi(page);
  await page.goto("/");

  await page.getByRole("link", { name: /Milk Tea/ }).click();
  await page.getByLabel("50%").check();
  await page.getByRole("button", { name: /Add to cart/ }).click();
  await page.getByRole("link", { name: /Cart/ }).click();
  await page.getByRole("button", { name: "Continue to checkout" }).click();

  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Pickup location").selectOption("1");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("button", { name: "Complete test payment" }).click();

  await expect(page).toHaveURL(/active-order/);
  await expect(
    page.getByRole("heading", { name: "Order status" }),
  ).toBeVisible();
  await expect(page.getByText("Sugar: 50%")).toBeVisible();
  await expect(page.getByText("Ready")).toBeVisible();
});

test("merchant signs in and marks an order ready", async ({ page }) => {
  let authenticated = false;
  let fulfillmentStatus = "preparing";

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/auth/csrf/")) return fulfill(route, { csrf: "set" });
    if (path.endsWith("/auth/login/")) {
      authenticated = true;
      return fulfill(route, { username: "merchant" });
    }
    if (path.endsWith("/auth/session/")) {
      return authenticated
        ? fulfill(route, { authenticated: true, username: "merchant" })
        : fulfill(route, { error: { code: "not_authenticated" } }, 403);
    }
    if (path.endsWith("/locations/")) {
      return fulfill(route, [{ id: 1, name: "Hall 4" }]);
    }
    if (path.endsWith("/merchant/orders/") && request.method() === "GET") {
      return fulfill(route, [
        {
          ...customerOrder,
          fulfillment_status: fulfillmentStatus,
          customer_name: "Ada Lovelace",
          customer_email: "ada@example.com",
        },
      ]);
    }
    if (path.endsWith("/status/") && request.method() === "PATCH") {
      const body: unknown = request.postDataJSON();
      if (
        typeof body !== "object" ||
        body === null ||
        !("status" in body) ||
        typeof body.status !== "string"
      ) {
        return fulfill(route, { error: { code: "invalid_status" } }, 400);
      }
      fulfillmentStatus = body.status;
      return fulfill(route, {
        ...customerOrder,
        fulfillment_status: fulfillmentStatus,
        customer_name: "Ada Lovelace",
        customer_email: "ada@example.com",
      });
    }
    return fulfill(route, { error: { code: "not_found" } }, 404);
  });

  await page.goto("/merchant/login");
  await page.getByLabel("Username").fill("merchant");
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/merchant\/orders/);
  await page.getByRole("button", { name: "Mark ready" }).click();
  await expect(page.getByText("ready", { exact: true })).toBeVisible();
});
