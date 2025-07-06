import { useEffect, useState } from 'react';
import { fetchOrders } from '../services/merchantServices';
import LogoutButton from '../components/logoutButton';
import { OrderItemCard } from '../components/MenuItemCard';

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
      const res = await fetchOrders();
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      alert("You must be logged in to view orders.");
    } finally {
      setLoading(false);
    }
  };

  load();
}, []);

  if (loading) return <p>Loading orders...</p>;

  return (
    <div>
      <h2>Merchant Orders</h2>
      <LogoutButton />
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map(order => (
          <OrderItemCard key={order.id} order={order} isMerchant={true} />
        ))
      )}
    </div>
  );
}
