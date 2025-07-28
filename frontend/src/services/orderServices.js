import axios from 'axios'

const BASE_URL = process.env.REACT_APP_API_BASE_URL

export const placeOrder = (studentName, items, business_slug) => {
    return axios.post(`${BASE_URL}/${business_slug}/api/place-order/`, {
        student_name: studentName,
        items: items
    });
};

export const getOrders = (business_slug) => {
    return axios.get(`${BASE_URL}/${business_slug}/api/orders`);
};

export function getOrderById(id, business_slug) {
  const token = localStorage.getItem("accessToken");
  return axios.get(`${BASE_URL}/${business_slug}/api/orders/${id}/`);
}

export async function toggleOrderReady(orderId, ready, business_slug) {
  return axios.patch(`${BASE_URL}/${business_slug}/api/orders/${orderId}/ready/`, { ready });
}

export async function toggleOrderFulfilled(orderId, fulfilled, business_slug) {
  return axios.patch(`${BASE_URL}/${business_slug}/api/orders/${orderId}/fulfilled/`, { fulfilled });
}

