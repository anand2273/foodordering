import { useState } from 'react';
import { toggleOrderFulfilled, toggleOrderReady } from '../../services/orderServices';

const business_slug = "its-bubblin"

export function OrderItemCard({ order, isMerchant = false }) {
  const [isReady, setIsReady] = useState(order.ready);
  const [isFulfilled, setIsFulfilled] = useState(order.fulfilled);

  const toggleReady = async () => {
    try {      
      const res = await toggleOrderReady(order.id, !isReady, business_slug);
      if (isFulfilled && isReady) {
        const res2 = await toggleOrderFulfilled(order.id, !isFulfilled, business_slug);
        setIsFulfilled(res2.data.fulfilled);
      }
      setIsReady(res.data.ready);
      
    } catch (err) {
      alert("Could not update readiness.");
    }
  };

  const toggleFulfilled = async () => {
    try {
      const res = await toggleOrderFulfilled(order.id, !isFulfilled, business_slug);
      setIsFulfilled(res.data.fulfilled);
    } catch (err) {
      alert("Could not update fulfillment.");
    }
  };
    const computeOrderTotal = () => {
    let total = 0;
    for (const item of order.items) {
        const base = item.price || 0;
        const customizations = item.customizations || [];
        const extra = customizations.reduce((sum, c) => sum + c.extra_cost, 0);
        const itemTotal = (base + extra) * item.quantity;
        total += itemTotal;
    }
    return total.toFixed(2);
    };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <p><strong>Order ID:</strong> {order.id.slice(0, 4).toUpperCase()}</p>
      <p><strong>Student:</strong> {order.student_name}</p>
      <p><strong>Location:</strong> {order.location || "—"}</p>
      <p><strong>Timestamp:</strong> {new Date(order.timestamp).toLocaleString()}</p>
      <p>
        <strong>Status:</strong>{" "}
        <span className={isFulfilled ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>
          {isFulfilled ? "✅ Fulfilled" : "🕓 Unfulfilled"}
        </span>
      </p>
      <p>
        <strong>Ready:</strong>{" "}
        <span className={isReady ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>
          {isReady ? "✅ Ready" : "⏳ Preparing"}
        </span>
      </p>

      {isMerchant && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={toggleReady}
            className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition"
          >
            {isReady ? "Mark as Not Ready" : "Mark as Ready"}
          </button>
          <button
            onClick={toggleFulfilled}
            disabled={!isReady}
            className={`px-3 py-1 rounded transition ${
              isReady
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isFulfilled ? "Mark as Not Fulfilled" : "Mark as Fulfilled"}
          </button>
        </div>
      )}

      <div className="mt-4">
        <p><strong>Total Price:</strong> ${computeOrderTotal()}</p>
        <p className="font-semibold">Items:</p>
        <ul className="list-disc pl-6">
        {order.items.map((item, idx) => (
            <li key={idx}>
            {item.title || "Unnamed item"} — x{item.quantity}
            {item.customizations && item.customizations.length > 0 && (
                <ul className="list-disc pl-4 text-sm text-gray-600">
                {item.customizations.map((c, i) => (
                    <li key={i}>
                    {c.group}: {c.option} {c.extra_cost > 0 && `(+$${c.extra_cost.toFixed(2)})`}
                    </li>
                ))}
                </ul>
            )}
            </li>
        ))}
        </ul>
      </div>
    </div>
  );
}