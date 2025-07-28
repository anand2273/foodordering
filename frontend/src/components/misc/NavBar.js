import { useContext } from "react";
import { CartContext } from "../../context/CartContext"; // adjust if path is different
import { Link } from "react-router-dom";

export default function Navbar() {
  const context = useContext(CartContext);
  const totalItemsInCart = context?.totalItemsInCart || 0;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 via-yellow-500 to-yellow-500 bg-clip-text text-transparent text-center">
            ItsBubblin'🧋
          </h1>

          <div className="flex gap-6 relative">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Menu</Link>
            
            <div className="relative">
              <Link to="/cart" className="text-gray-700 hover:text-blue-600 font-medium">
                Cart
              </Link>
              {totalItemsInCart > 0 && (
                <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItemsInCart}
                </span>
              )}
            </div>

            <Link to="/active-order" className="text-gray-700 hover:text-blue-600 font-medium">Active Order</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
