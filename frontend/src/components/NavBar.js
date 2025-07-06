import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
      <Link to="/">Menu</Link>
      <Link to="/cart">Cart</Link>
      <Link to="/active-order">Active Order</Link>
    </nav>
  );
}
