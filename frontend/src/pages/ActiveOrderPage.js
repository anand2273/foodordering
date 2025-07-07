import { useEffect, useState } from 'react';
import { getOrderById } from '../services/orderServices';
import { OrderItemCard } from '../components/MenuItemCard';
import Navbar from '../components/NavBar';

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

  return (
    <>
    <Navbar/>
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Active Order</h2>

      {loading ? (
        <p className="text-gray-600">Loading order...</p>
      ) : !order ? (
        <p className="text-gray-500">No active order found.</p>
      ) : (
        <OrderItemCard order={order} isMerchant={false} />
      )}
    </div>
    </>
  );
}
