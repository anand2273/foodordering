import { BrowserRouter, Routes, Route } from "react-router-dom";
import MenuPage from './pages/MenuPage';
import MenuItemPage from './pages/MenuItemPage';
import CartPage from "./pages/CartPage";
import { Cart } from "./context/CartContext";
import Navbar from "./components/NavBar";


function App() {
  return (
    <Cart>
        <BrowserRouter>
            <div>
                <h1>
                    FOOD ORDERING APPLICATION
                </h1>
                <Navbar />
            </div>
            <Routes>
                <Route path="/" element={<MenuPage />} />
                <Route path="/menu/:slug" element={<MenuItemPage />} />
                <Route path="/cart" element={<CartPage />} />
            </Routes>
        </BrowserRouter>
    </Cart>
  );
}

export default App;
