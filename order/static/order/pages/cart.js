import { Cart } from '../models/Cart.js';
import { MenuItem } from '../models/MenuItem.js';
import { OrderItem } from '../models/OrderItem.js';

document.addEventListener('DOMContentLoaded', load_items);

function load_items() {
    const cart = new Cart();
    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
    }
    console.log(cart);
    const container = document.getElementById('cart-container');
    container.innerHTML = "";
    
    cart.items.forEach(item => {
        const div = item.render();
        container.appendChild(div);
        
        div.querySelector(".add-one").addEventListener('click', () => {
            cart.updateQuantity(item.slug, 1);
            load_items();
        })
        div.querySelector(".remove-one").addEventListener('click', () => {
            cart.updateQuantity(item.slug, -1)
            load_items();
        });
        div.querySelector(".delete").addEventListener('click', () => {
            cart.remove(item.slug)
            load_items();
        });
    });
    const priceDiv = document.createElement('div');
    priceDiv.innerHTML = `<h3>Total: ${cart.totalFormatted()}</h3>`;
    container.appendChild(priceDiv);
    
}
