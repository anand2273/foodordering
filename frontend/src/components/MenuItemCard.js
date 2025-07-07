import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useState } from 'react';
import { toggleOrderFulfilled, toggleOrderReady } from '../services/orderServices';

export default function MenuItemCard({ item }) {
  return (
    <Link to={`/menu/${item.slug}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition p-4 cursor-pointer">
        <img src={item.img} alt={item.title} className="w-full h-40 object-cover rounded-md mb-3" />
        <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
        <p className="text-gray-600 text-sm">{item.desc}</p>
        <p className="mt-2 text-blue-600 font-bold">${item.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}

export function MenuItemDetail({ item }) {
  const { addToCart } = useContext(CartContext);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <img src={item.img} alt={item.title} className="w-full h-64 object-cover rounded mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{item.title}</h2>
      <p className="text-gray-600 mb-4">{item.desc}</p>
      <p className="text-lg font-semibold text-blue-600 mb-6">Price: ${item.price}</p>
      <button
        onClick={() => addToCart(item)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Add to Cart
      </button>
    </div>
  );
}

export function CartItemCard({ item }) {
  const { increment, decrement, removeFromCart } = useContext(CartContext);

  if (!item) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 flex gap-4">
      <img src={item.img} alt={item.title} className="w-32 h-32 object-cover rounded-md" />

      <div className="flex flex-col justify-between flex-grow">
        <div>
          <h2 className="text-xl font-semibold">{item.title}</h2>
          <p className="text-gray-600">{item.desc}</p>
          <p className="font-medium text-blue-600 mt-2">Price: ${item.price}</p>
          <p className="text-sm mt-1">Quantity: {item.quantity}</p>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => increment(item.slug)}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
          >
            +1
          </button>
          <button
            onClick={() => decrement(item.slug)}
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
          >
            -1
          </button>
          <button
            onClick={() => removeFromCart(item.slug)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}


export function OrderItemCard({ order, isMerchant = false }) {
  const [isReady, setIsReady] = useState(order.ready);
  const [isFulfilled, setIsFulfilled] = useState(order.fulfilled);

  const toggleReady = async () => {
    try {
      const res = await toggleOrderReady(order.id, !isReady);
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
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
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


