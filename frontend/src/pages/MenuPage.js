import { useEffect, useState } from "react";
import { getMenuItems } from "../services/menuServices";
import MenuItemCard from "../components/menu/MenuItemCard";

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMenuItems("its-bubblin")
      .then(res => setItems(res.data))
      .catch(() => setError("Failed to load menu"));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Menu</h1>

      {error && (
        <p className="text-red-500 mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map(item => (
          <MenuItemCard key={item.slug} item={item} />
        ))}
      </div>
    </div>
  );
}
