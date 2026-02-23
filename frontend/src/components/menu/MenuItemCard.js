import { useContext } from "react";
import { CartContext } from "../../context/CartContext";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CustomizationGroup from "../customization/Customization";

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
  const [selectedOptions, setSelectedOptions] = useState({});
  const [totalPrice, setTotalPrice] = useState(item.price);

  useEffect(() => {
    let extra = 0;
    Object.values(selectedOptions).flat().forEach(option => {
      extra += Number(option.extra_cost);
    });
    setTotalPrice((Number(item.price) + extra).toFixed(2));
  }, [selectedOptions, item.price]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <img src={item.img} alt={item.title} className="w-full h-64 object-cover rounded mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{item.title}</h2>
      <p className="text-gray-600 mb-4">{item.desc}</p>

      {/* Render each customization group */}
      {item.customization_groups?.map(group => (
        <CustomizationGroup
          key={group.name}
          group={group}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
        />
      ))}

      <p className="text-lg font-semibold text-blue-600 mb-6">Total Price: ${totalPrice}</p>
      <button
        onClick={() => addToCart({ ...item, selectedOptions, totalPrice })}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Add to Cart
      </button>
    </div>
  );
}



