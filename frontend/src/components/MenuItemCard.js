import { Link } from "react-router-dom";

export default function MenuItemCard({ item }) {
    return (
        <Link to={`/menu/${item.slug}`}>
            <div>
                <img src={item.img} alt={item.title} />
                <h3>{item.title}</h3>
                <p>item.desc</p>
                <strong>{item.price.toFixed(2)}</strong>
            </div>
        </Link>
    )
}

export function MenuItemDetail({ item, onAddToCart }) {
    return (
        <div>
            <img src={item.img} alt={item.title} />
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
            <p><strong>Price:</strong>{item.price}</p>
            <button onClick={() => onAddToCart(item)}>Add to Cart</button>
        </div>
    )
}