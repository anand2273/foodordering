import { useEffect, useState } from 'react';
import { getBuyerOrderById } from '../services/orderServices';
import { OrderItemCard } from '../components/order/OrderItemCard';
import Navbar from '../components/misc/NavBar';

const business_slug = "its-bubblin"

export default function ActiveOrderPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const activeOrderId = localStorage.getItem('activeOrderId');
        
        if (!activeOrderId) {
          setOrder(null);
          setLoading(false);
          return;
        }

        const response = await getBuyerOrderById(activeOrderId, business_slug);
        const orderData = response.data;
        
        // If order is fulfilled, remove from localStorage
        if (orderData.fulfilled) {
          localStorage.removeItem('activeOrderId');
          setOrder(null);
        } else {
          setOrder(orderData);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        // If order not found, remove from localStorage
        localStorage.removeItem('activeOrderId');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Set up polling to check order status every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
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