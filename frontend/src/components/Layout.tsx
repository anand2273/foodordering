import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const { totalItems } = useCart();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-amber-100 text-amber-900"
        : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-amber-50/50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav
          aria-label="Primary navigation"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4"
        >
          <Link
            className="text-xl font-black tracking-tight text-amber-700"
            to="/"
          >
            ItsBubblin
          </Link>
          <div className="flex items-center gap-1">
            <NavLink className={linkClass} to="/" end>
              Menu
            </NavLink>
            <NavLink className={linkClass} to="/active-order">
              Order status
            </NavLink>
            <NavLink className={linkClass} to="/cart">
              Cart{totalItems ? ` (${totalItems})` : ""}
            </NavLink>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
