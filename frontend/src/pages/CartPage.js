import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { CartItemCard } from "../components/cart/CartItemCard";
import ModalForm from "../components/order/OrderModal";

export default function CartPage() {
  const { cart } = useContext(CartContext);

  const total = cart.reduce((sum, item) => {
    const base = item.price || 0;
    const extra =
        item.selectedOptions
        ? Object.values(item.selectedOptions)
            .flat()
            .reduce((s, opt) => s + (Number(opt.extra_cost) || 0), 0)
        : 0;
    return sum + (base + extra) * item.quantity;
    }, 0);


  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Your Cart</h1>

      {cart.length === 0 ? (
        <p className="text-gray-500">Your cart is empty. Visit the menu to add items.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <CartItemCard key={item.key} item={item} />
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <>
          <div className="mt-6 text-right">
            <p className="text-lg font-semibold text-gray-700">Total:</p>
            <p className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</p>
          </div>

          <div className="mt-8">
            <ModalForm />
          </div>
        </>
      )}
    </div>
  );
}
