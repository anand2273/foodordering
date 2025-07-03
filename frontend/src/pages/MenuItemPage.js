import { useEffect, useState } from "react";
import { getMenuItemBySlug } from "../services/menuServices";
import { MenuItemDetail } from "../components/MenuItemCard";
import { useParams } from "react-router-dom";

export default function MenuItemPage() {
    const { slug } = useParams();
    const [item, setItem] = useState(null);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        getMenuItemBySlug(slug)
        .then(res => setItem(res.data))
        .catch(() => setError("item could not be loaded"));
    }, [slug]);

    const handleAddToCart = item => {
        //TODO: add cart logic here
        console.log(`${item.title} added to cart`);
        alert(`${item.title} added to cart`);
    }
    
    if (error) return <p>{error}</p>;
    if (!item) return <p>Loading...</p>;

    return <MenuItemDetail item={item} onAddToCart={handleAddToCart} />
}