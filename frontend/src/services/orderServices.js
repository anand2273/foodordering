import axios from 'axios'

const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "")

// Separate axios instance for buyer/checkout flows so we never attach merchant JWTs.
const buyerAxios = axios.create();

// Attach JWT token to all requests if present
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getLocations = (business_slug) => {
    return axios.get(`${BASE_URL}/${business_slug}/api/locations/`);
};

export const placeOrder = (studentName, items, location_id, business_slug) => {
    return axios.post(`${BASE_URL}/${business_slug}/api/place-order/`, {
        student_name: studentName,
        items: items,
        location_id: location_id
    });
};

// Buyer checkout: creates an Order in requires_payment + returns Stripe client_secret.
export const createPaymentIntent = (studentName, items, location_id, business_slug, idempotencyKey) => {
  const headers = {};
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return buyerAxios.post(
    `${BASE_URL}/${business_slug}/api/checkout/create-payment-intent/`,
    {
      student_name: studentName,
      items: items,
      location_id: location_id,
    },
    { headers }
  );
};

export const getOrders = (business_slug, location_id = null) => {
    let url = `${BASE_URL}/${business_slug}/api/orders/`;
    if (location_id) {
        url += `?location_id=${location_id}`;
    }
    return axios.get(url);
};

export const fulfillLocation = (location_id, business_slug) => {
    return axios.post(`${BASE_URL}/${business_slug}/api/locations/${location_id}/fulfill/`);
}

// For buyers (no auth needed)
export function getBuyerOrderById(id, business_slug) {
  const url = `${BASE_URL}/${business_slug}/api/orders/${id}/`;
  return buyerAxios.get(url);
}

export async function toggleOrderReady(orderId, ready, business_slug) {
  return axios.patch(`${BASE_URL}/${business_slug}/api/orders/${orderId}/ready/`, { ready });
}

export async function toggleOrderFulfilled(orderId, fulfilled, business_slug) {
  return axios.patch(`${BASE_URL}/${business_slug}/api/orders/${orderId}/fulfilled/`, { fulfilled });
}




