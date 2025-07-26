import { useEffect, useState } from "react";
import { getMenuItemBySlug } from "../services/menuServices";
import { MenuItemDetail } from "../components/menu/MenuItemCard";
import { useParams } from "react-router-dom";

const business_slug = "its-bubblin"

export default function MenuItemPage() {
    const { slug } = useParams();
    const [item, setItem] = useState(null);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        getMenuItemBySlug(slug, business_slug)
        .then(res => setItem(res.data))
        .catch(() => setError("item could not be loaded"));
    }, [slug]);
        
    if (error) return <p>{error}</p>;
    if (!item) return <p>Loading...</p>;

    return <MenuItemDetail item={item} />
}