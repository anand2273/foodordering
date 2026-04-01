import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBuyerOrderById } from '../services/orderServices';
import { OrderItemCard } from '../components/order/OrderItemCard';
import Navbar from '../components/misc/NavBar';

const business_slug = "its-bubblin"

export default function ActiveOrderPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        <>
          {order.payment_status && order.payment_status !== 'paid' && (
            <div className="mb-4 p-3 rounded border bg-white">
              {order.payment_status === 'failed' || order.payment_status === 'canceled' ? (
                <>
                  <p className="font-semibold text-red-600">Payment did not go through.</p>
                  <p className="text-gray-700 text-sm">No charge was completed. You can go back to your cart and try again.</p>
                  <button
                    className="mt-2 px-3 py-2 bg-blue-600 text-white rounded"
                    onClick={() => {
                      localStorage.removeItem('activeOrderId');
                      navigate('/cart');
                    }}
                  >
                    Back to cart
                  </button>
                </>
              ) : (
                <>
                  <p className="font-semibold text-yellow-700">Payment not completed yet.</p>
                  <p className="text-gray-700 text-sm">If you used PayNow, you may be redirected to complete payment. This page will update once payment is confirmed.</p>
                </>
              )}
            </div>
          )}
          <OrderItemCard order={order} isMerchant={false} />
        </>
      )}
    </div>
    </>
  );
}