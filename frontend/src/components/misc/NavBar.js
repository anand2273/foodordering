import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-2xl font-extrabold text-black-600 tracking-tight font-typewriter">
            PASTA @RGS
          </h1>

          <div className="flex gap-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Menu
            </Link>
            <Link to="/cart" className="text-gray-700 hover:text-blue-600 font-medium">
              Cart
            </Link>
            <Link to="/active-order" className="text-gray-700 hover:text-blue-600 font-medium">
              Active Order
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
