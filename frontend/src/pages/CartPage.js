import { useContext } from "react";
import { useEffect, useState } from "react"
import { getMenuItems } from "../services/menuServices"
import { CartItemCard } from "../components/MenuItemCard"
import { CartContext } from "../context/CartContext";
import ModalForm from "../components/OrderModal";

export default function CartPage() {
    const { cart } = useContext(CartContext);
    
    return (
        <div>
            <h1>Your Cart</h1>
            {
                cart.length === 0 
                ? <p>Your cart is empty. Visit the menu.</p>
                : cart.map(item => 
                    <CartItemCard key={item.slug} item={item} />
                    )
            }
            <p>Total price:</p>
                <strong>
                    {cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                </strong>
            <ModalForm />
        </div>
    );

}