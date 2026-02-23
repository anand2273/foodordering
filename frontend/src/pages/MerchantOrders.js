import { useEffect, useState } from 'react';
import { getOrders, getLocations, fulfillLocation } from '../services/orderServices';
import LogoutButton from '../components/misc/logoutButton';
import { OrderItemCard } from '../components/order/OrderItemCard';

const business_slug = "its-bubblin";

export default function MerchantOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to view orders.");
        setLoading(false);
        return;
      }

      try {
        const [ordersRes, locationsRes] = await Promise.all([
          getOrders(business_slug, selectedLocation),
          getLocations(business_slug)
        ]);
        setOrders(ordersRes.data.filter(o => !o.fulfilled));
        setLocations(locationsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("You must be logged in to view this page.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedLocation]);

  const handleFulfillLocation = async () => {
    if (!selectedLocation) return;
    try {
      await fulfillLocation(selectedLocation, business_slug);
      alert("All orders for this location have been marked as fulfilled.");
      // Refresh orders
      const res = await getOrders(business_slug, selectedLocation);
      setOrders(res.data.filter(o => !o.fulfilled));
    } catch (err) {
      console.error("Error fulfilling location:", err);
      alert("Failed to fulfill location. Please try again.");
    }
  };

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

      <div className="flex items-center mb-4">
        <select 
          className="mr-4 p-2 border rounded"
          onChange={(e) => setSelectedLocation(e.target.value)}
          value={selectedLocation || ''}
        >
          <option value="">All Locations</option>
          {locations.map(location => (
            <option key={location.id} value={location.id}>{location.name}</option>
          ))}
        </select>
        {selectedLocation && (
          <button 
            className="p-2 bg-blue-500 text-white rounded"
            onClick={handleFulfillLocation}
          >
            Mark Location as Fulfilled
          </button>
        )}
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
