import { api } from "./client";
import type {
  CheckoutResponse,
  CustomerOrder,
  FulfillmentStatus,
  Location,
  MenuItem,
  MerchantOrder,
} from "../types";

export async function getMenu(): Promise<MenuItem[]> {
  return (await api.get<MenuItem[]>("/menu-items/")).data;
}

export async function getMenuItem(slug: string): Promise<MenuItem> {
  return (await api.get<MenuItem>(`/menu-items/${encodeURIComponent(slug)}/`))
    .data;
}

export async function getLocations(): Promise<Location[]> {
  return (await api.get<Location[]>("/locations/")).data;
}

export interface CheckoutInput {
  customer_name: string;
  customer_email: string;
  location_id: number;
  items: Array<{
    menu_item_id: number;
    quantity: number;
    option_ids: number[];
  }>;
}

export async function createCheckout(
  input: CheckoutInput,
  idempotencyKey: string,
): Promise<CheckoutResponse> {
  return (
    await api.post<CheckoutResponse>("/checkouts/", input, {
      headers: { "Idempotency-Key": idempotencyKey },
    })
  ).data;
}

export async function getOrderStatus(token: string): Promise<CustomerOrder> {
  return (await api.get<CustomerOrder>("/order-status/", { params: { token } }))
    .data;
}

export async function setCsrfCookie(): Promise<void> {
  await api.get("/auth/csrf/");
}

export async function login(username: string, password: string): Promise<void> {
  await setCsrfCookie();
  await api.post("/auth/login/", { username, password });
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout/");
}

export async function getSession(): Promise<{
  authenticated: true;
  username: string;
}> {
  return (
    await api.get<{ authenticated: true; username: string }>("/auth/session/")
  ).data;
}

export async function getMerchantOrders(
  locationId?: number,
): Promise<MerchantOrder[]> {
  return (
    await api.get<MerchantOrder[]>("/merchant/orders/", {
      params: locationId ? { location_id: locationId } : {},
    })
  ).data;
}

export async function updateOrderStatus(
  orderId: string,
  status: FulfillmentStatus,
): Promise<MerchantOrder> {
  return (
    await api.patch<MerchantOrder>(`/merchant/orders/${orderId}/status/`, {
      status,
    })
  ).data;
}

export async function fulfillReadyOrders(locationId: number): Promise<number> {
  return (
    await api.post<{ fulfilled_count: number }>(
      `/merchant/locations/${locationId}/fulfill-ready/`,
    )
  ).data.fulfilled_count;
}
