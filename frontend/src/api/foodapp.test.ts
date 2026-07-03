import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("./client", () => ({ api: mocks }));

import {
  createCheckout,
  fulfillReadyOrders,
  getLocations,
  getMenu,
  getMenuItem,
  getMerchantOrders,
  getOrderStatus,
  getSession,
  login,
  logout,
  setCsrfCookie,
  updateOrderStatus,
} from "./foodapp";

describe("foodapp API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps public API responses", async () => {
    mocks.get.mockResolvedValue({ data: ["result"] });
    await expect(getMenu()).resolves.toEqual(["result"]);
    await expect(getMenuItem("milk tea")).resolves.toEqual(["result"]);
    await expect(getLocations()).resolves.toEqual(["result"]);
    await expect(getOrderStatus("signed")).resolves.toEqual(["result"]);
    expect(mocks.get).toHaveBeenCalledWith("/order-status/", {
      params: { token: "signed" },
    });
  });

  it("sends checkout and merchant mutations with explicit data", async () => {
    mocks.post.mockResolvedValue({
      data: { client_secret: "secret", fulfilled_count: 2 },
    });
    mocks.patch.mockResolvedValue({ data: { id: "order" } });
    const checkout = {
      customer_name: "Ada",
      customer_email: "ada@example.com",
      location_id: 1,
      items: [],
    };
    await createCheckout(checkout, "key");
    expect(mocks.post).toHaveBeenCalledWith("/checkouts/", checkout, {
      headers: { "Idempotency-Key": "key" },
    });
    await updateOrderStatus("abc", "ready");
    expect(mocks.patch).toHaveBeenCalledWith("/merchant/orders/abc/status/", {
      status: "ready",
    });
    await expect(fulfillReadyOrders(4)).resolves.toBe(2);
  });

  it("handles the session lifecycle and order filters", async () => {
    mocks.get.mockResolvedValue({
      data: { authenticated: true, username: "merchant" },
    });
    mocks.post.mockResolvedValue({ data: {} });
    await setCsrfCookie();
    await login("merchant", "password");
    await logout();
    await expect(getSession()).resolves.toEqual({
      authenticated: true,
      username: "merchant",
    });
    await getMerchantOrders();
    await getMerchantOrders(2);
    expect(mocks.get).toHaveBeenCalledWith("/merchant/orders/", { params: {} });
    expect(mocks.get).toHaveBeenCalledWith("/merchant/orders/", {
      params: { location_id: 2 },
    });
  });
});
