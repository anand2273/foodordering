import { Link } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function Navbar() {
    const { cart } = useContext(CartContext);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <nav className="flex justify-between items-center p-4 shadow-md bg-white">
            <Link to="/" className="text-xl font-bold">Menu</Link>
            <Link to="/cart" className="text-blue-600">
                Cart ({totalItems})
            </Link>
        </nav>
    );
}
