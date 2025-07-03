import { BrowserRouter, Routes, Route } from "react-router-dom";
import MenuPage from './pages/MenuPage';
import MenuItemPage from './pages/MenuItemPage';


function App() {
  return (
    <BrowserRouter>
        <div>
            <h1>
                FOOD ORDERING APPLICATION
            </h1>
        </div>
        <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/menu/:slug" element={<MenuItemPage />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
