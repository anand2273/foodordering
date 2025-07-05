import { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";

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

export function OrderItemCart({ item }) {
    return;
}