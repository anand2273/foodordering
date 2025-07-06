import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useState } from 'react';
import { toggleOrderFulfilled, toggleOrderReady } from '../services/orderServices';

export default function MenuItemCard({ item }) {
    return (
        <Link to={`/menu/${item.slug}`}>
            <div>
                <img src={item.img} alt={item.title} />
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <strong>{item.price.toFixed(2)}</strong>
            </div>
        </Link>
    )
}

export function MenuItemDetail({ item }) {
    const { addToCart } = useContext(CartContext);
    return (
        <div>
            <img src={item.img} alt={item.title} />
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
            <p><strong>Price:</strong>{item.price}</p>
            <button onClick={() => addToCart(item)}>Add to Cart</button>
        </div>
    )
}

export function CartItemCard({ item }) {
    const {cart, addToCart, removeFromCart, increment, decrement} = useContext(CartContext);
    
    if (!item) {
        return null;
    } 
    return (
        <div>
            <img src={item.img} alt={item.title} />
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
            <p><strong>Price:</strong>{item.price}</p>
            <p><strong>Quantity:</strong>{item.quantity}</p>

            <button onClick={() => increment(item.slug)}> + 1</button>
            <button onClick={() => decrement(item.slug)}> - 1</button>
            <button onClick={() => removeFromCart(item.slug)}>Remove</button>
        </div>

    )
}

export function OrderItemCard({ order, isMerchant = false }) {
  const [isReady, setIsReady] = useState(order.ready);
  const [isFulfilled, setIsFulfilled] = useState(order.fulfilled);

  const toggleReady = async () => {
    try {
      console.log(order.id);
      const res = await toggleOrderReady(order.id, !isReady);
      setIsReady(res.data.ready);
    } catch (err) {
      console.error("Failed to update ready status:", err);
      alert("Could not update readiness.");
    }
  };

  const toggleFulfilled = async () => {
    try {
      console.log(order.id);
      const res = await toggleOrderFulfilled(order.id, !isFulfilled);
      setIsFulfilled(res.data.fulfilled);
    } catch (err) {
      console.error("Failed to update ready status:", err);
      alert("Could not update readiness.");
    }
  };

  return (
    <div style={{ border: '1px solid black', padding: '1rem', marginBottom: '1rem' }}>
      <p><strong>Order ID:</strong> {order.id}</p>
      <p><strong>Student:</strong> {order.student_name}</p>
      <p><strong>Timestamp:</strong> {new Date(order.timestamp).toLocaleString()}</p>
      <p><strong>Status:</strong> {isFulfilled ? "✅ Fulfilled" : "🕓 Unfulfilled"}</p>
      <p><strong>Ready:</strong> {isReady ? "✅ Ready for Collection" : "⏳ Preparing"}</p>

      {/* Render ready toggle only for merchant */}
      {isMerchant && (
        <button onClick={toggleReady}>
          {isReady ? "Mark as Not Ready" : "Mark as Ready"}
        </button>
      )}

      {isMerchant && (
        <button onClick={toggleFulfilled}>
          {isFulfilled ? "Mark as not Fulfilled" : "Mark as Fulfilled"}
        </button>
      )}

      <p><strong>Items:</strong></p>
      <ul>
        {order.items.map((item, idx) => (
          <li key={idx}>
            {item.menuItem?.title || "Unnamed item"} — x{item.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

