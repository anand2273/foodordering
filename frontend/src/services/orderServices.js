import axios from 'axios'

const BASE_URL = process.env.REACT_APP_API_BASE_URL

export const placeOrder = (studentName, items, business_slug) => {
    return axios.post(`${BASE_URL}/${business_slug}/api/place-order/`, {
        student_name: studentName,
        items: items
    });
};

export const getOrders = (business_slug) => {
    return axios.get(`${BASE_URL}/${business_slug}/api/orders/`);
};

// For buyers (no auth needed)
export function getBuyerOrderById(id, business_slug) {
  // For buyer requests, never send any auth headers
  const url = `${BASE_URL}/${business_slug}/api/orders/${id}/`;
  console.log("Making buyer request to:", url);
  
  return axios.get(url, {
    headers: {
      Authorization: undefined // Explicitly remove Authorization header
    }
  });
}

export async function toggleOrderReady(orderId, ready, business_slug) {
  return axios.patch(`${BASE_URL}/${business_slug}/api/orders/${orderId}/ready/`, { ready });
}

export async function toggleOrderFulfilled(orderId, fulfilled, business_slug) {
  return axios.patch(`${BASE_URL}/${business_slug}/api/orders/${orderId}/fulfilled/`, { fulfilled });
}

