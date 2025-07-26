import { useContext } from "react";
import { CartContext } from "../../context/CartContext";

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

          {/* Customizations Display */}
          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
            <div className="mt-2 text-sm text-gray-700">
              <p className="font-semibold">Customizations:</p>
              <ul className="list-disc list-inside">
                {Object.entries(item.selectedOptions).map(([groupName, options]) =>
                  options.map((opt, idx) => (
                    <li key={`${groupName}-${opt.name}-${idx}`}>
                      {groupName}: {opt.name}
                      {opt.extra_cost > 0 && (
                        <span className="text-gray-500"> (+${Number(opt.extra_cost).toFixed(2)})</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          <p className="font-medium text-blue-600 mt-2">
            Price: ${item.totalPrice ?? item.price}
          </p>
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
