import { createContext, useContext, useState, useEffect } from "react";

export const CartContext = createContext(null);

export function Cart({ children }) {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem("cart");
        return saved ? JSON.parse(saved) : [];
    });

    console.log("Cart contents: ", cart);
    useEffect(() => localStorage.setItem("cart", JSON.stringify(cart)), [cart]);

    const addToCart = (item) => {
        setCart(prev => {
        const existing = prev.find(i => 
        i.slug === item.slug &&
        JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)
        );

        if (existing) {
        return prev.map(i => 
            i.slug === item.slug &&
            JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
    }

    return [...prev, { ...item, quantity: 1 }];
  });

  alert(`${item.title} added to cart`);
};


    const removeFromCart = slug => {
        setCart(prev => prev.filter(i => i.slug !== slug));
    }

    const increment = slug => 
        setCart(prev => 
            prev.map(i => 
                i.slug === slug ? {...i, quantity: i.quantity + 1} : i
            )
        )

    const decrement = slug => 
        setCart(prev => 
            prev.map(i => 
                i.slug === slug ? {...i, quantity: i.quantity - 1} : i
            )
            .filter(i => i.quantity > 0)
        );
    
    const clear = () => setCart([]);
    

    return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, increment, decrement, clear }}>
        {children}
    </CartContext.Provider>
    )
}
