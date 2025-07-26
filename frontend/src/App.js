import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import MenuPage from './pages/MenuPage';
import MenuItemPage from './pages/MenuItemPage';
import CartPage from "./pages/CartPage";
import MerchantLogin from "./pages/MerchantLogin";
import MerchantOrders from "./pages/MerchantOrders";
import { Cart } from "./context/CartContext";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/misc/NavBar";
import ActiveOrderPage from "./pages/ActiveOrderPage";

function LayoutWithNavbar({ children }) {
  return (
    <Cart>
      <div
        className="fixed inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />
      <div className="relative z-10 min-h-screen bg-white/80 backdrop-blur-sm">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </Cart>
  );
}



function AppRoutes() {
  const location = useLocation();
  const { isMerchantLoggedIn } = useAuth();

  const isMerchantRoute = location.pathname.startsWith("/merchant");

  return (
    <Routes>
      {/* USER SIDE */}
      <Route path="/" element={<LayoutWithNavbar><MenuPage /></LayoutWithNavbar>} />
      <Route path="/menu/:slug" element={<LayoutWithNavbar><MenuItemPage /></LayoutWithNavbar>} />
      <Route path="/cart" element={<LayoutWithNavbar><CartPage /></LayoutWithNavbar>} />

      {/* MERCHANT SIDE */}
      <Route path="/merchant/login" element={<MerchantLogin />} />
      <Route
        path="/merchant/orders"
        element={
          isMerchantLoggedIn
            ? <MerchantOrders />
            : <Navigate to="/merchant/login" replace />
        }
      />
      <Route path="/active-order" element={<ActiveOrderPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
