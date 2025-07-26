import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { useState } from 'react';
import { toggleOrderFulfilled, toggleOrderReady } from '../../services/orderServices';

export function OrderItemCard({ order, isMerchant = false }) {
  const [isReady, setIsReady] = useState(order.ready);
  const [isFulfilled, setIsFulfilled] = useState(order.fulfilled);

  const toggleReady = async () => {
    try {      
      const res = await toggleOrderReady(order.id, !isReady);
      if (isFulfilled && isReady) {
        const res2 = await toggleOrderFulfilled(order.id, !isFulfilled);
        setIsFulfilled(res.data.fulfilled);
      }
      setIsReady(res.data.ready);
      
    } catch (err) {
      alert("Could not update readiness.");
    }
  };

  const toggleFulfilled = async () => {
    try {
      const res = await toggleOrderFulfilled(order.id, !isFulfilled);
      setIsFulfilled(res.data.fulfilled);
    } catch (err) {
      alert("Could not update fulfillment.");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <p><strong>Order ID:</strong> {order.id.slice(0, 4).toUpperCase()}</p>
      <p><strong>Student:</strong> {order.student_name}</p>
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
        <p className="font-semibold">Items:</p>
        <ul className="list-disc pl-6">
          {order.items.map((item, idx) => (
            <li key={idx}>
              {item.title || "Unnamed item"} — x{item.quantity}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}