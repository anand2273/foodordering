import { useEffect, useState } from 'react';
import { getOrders } from '../services/orderServices';
import LogoutButton from '../components/misc/logoutButton';
import { OrderItemCard } from '../components/order/OrderItemCard';

export default function MerchantOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to view orders.");
        setLoading(false);
        return;
      }

      try {
        const res = await getOrders("its-bubblin");
        setOrders(res.data.filter(o => !o.fulfilled));
      } catch (err) {
        console.error("Error fetching orders:", err);
        alert("You must be logged in to view orders.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Merchant Orders</h2>
        <LogoutButton />
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <OrderItemCard key={order.id} order={order} isMerchant={true} />
          ))}
        </div>
      )}
    </div>
  );
}
