import { useEffect, useState } from "react";
import { getMenuItems } from "../services/menuServices";
import MenuItemCard from "../components/MenuItemCard";

export default function MenuPage() {
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        getMenuItems()
        .then(res => setItems(res.data))
        .catch(() => setError("failed to load menu"));
    }, []);

    return (
        <div>
            <h1>Menu</h1>
            {error && <p>{error}</p>}
            <div>
                {items.map(item => (
                    <MenuItemCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    )
}
