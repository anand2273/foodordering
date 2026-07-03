import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import { ActiveOrderPage } from "./pages/ActiveOrderPage";
import { CartPage } from "./pages/CartPage";
import { MenuItemPage } from "./pages/MenuItemPage";
import { MenuPage } from "./pages/MenuPage";
import { MerchantLoginPage } from "./pages/MerchantLoginPage";
import { MerchantOrdersPage } from "./pages/MerchantOrdersPage";

function CustomerRoute({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

function ProtectedMerchantRoute() {
  const auth = useAuth();
  if (auth.loading)
    return (
      <div className="grid min-h-screen place-items-center">
        Checking session…
      </div>
    );
  return auth.authenticated ? (
    <MerchantOrdersPage />
  ) : (
    <Navigate replace to="/merchant/login" />
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <CustomerRoute>
            <MenuPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/menu/:slug"
        element={
          <CustomerRoute>
            <MenuItemPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <CustomerRoute>
            <CartPage />
          </CustomerRoute>
        }
      />
      <Route
        path="/active-order"
        element={
          <CustomerRoute>
            <ActiveOrderPage />
          </CustomerRoute>
        }
      />
      <Route path="/merchant/login" element={<MerchantLoginPage />} />
      <Route path="/merchant/orders" element={<ProtectedMerchantRoute />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
