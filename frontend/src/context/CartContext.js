import { createContext, useContext, useState, useEffect } from "react";

export const CartContext = createContext(null);

function generateCartKey(item) {
  const customKey = item.selectedOptions
    ? Object.entries(item.selectedOptions)
        .flatMap(([group, options]) => options.map(o => `${group}:${o.name}`))
        .join("|")
    : "";

  return `${item.slug}__${customKey}`;
}

export function Cart({ children }) {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem("cart");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => localStorage.setItem("cart", JSON.stringify(cart)), [cart]);

    const addToCart = (item) => {
    const key = generateCartKey(item);

    setCart(prev => {
        const existing = prev.find(i => i.key === key);
        if (existing) {
        return prev.map(i =>
            i.key === key ? { ...i, quantity: i.quantity + 1 } : i
        );
        }

        return [...prev, { ...item, quantity: 1, key }];
    });
    };

    const removeFromCart = key => {
        setCart(prev => prev.filter(i => i.key !== key));
    }

    const increment = key =>
        setCart(prev =>
            prev.map(i =>
                i.key === key ? {...i, quantity: i.quantity + 1} : i
            )
        )

    const decrement = key =>
        setCart(prev =>
            prev.map(i =>
                i.key === key ? {...i, quantity: i.quantity - 1} : i
            )
            .filter(i => i.quantity > 0)
        );
    
    const clear = () => setCart([]);
    
    const totalItemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, increment, decrement, clear, totalItemsInCart }}>
        {children}
    </CartContext.Provider>
    );

}
