// pages/ActiveOrderPage.js
import { useEffect, useState } from 'react';
import { getOrderById } from '../services/orderServices';
import { OrderItemCard } from '../components/MenuItemCard';

export default function ActiveOrderPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchOrder = async () => {
    const orderId = localStorage.getItem("activeOrderId");
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      const response = await getOrderById(orderId);
      if (response.data && response.data.id) {
        // If the order is fulfilled, clear it from localStorage
        if (response.data.fulfilled) {
          localStorage.removeItem("activeOrderId");
          setOrder(null);
        } else {
          setOrder(response.data);
        }
      } else {
        console.warn("Invalid order data:", response.data);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchOrder();
}, []);

  if (loading) return <p>Loading order...</p>;
  if (!order) return <p>You have no active orders. If you just collected your meal, thanks!</p>;

  return (
    <div>
      <h2>Active Order</h2>
      <OrderItemCard order={order} isMerchant={false} />
    </div>
  );
}
