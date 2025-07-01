import { Cart } from '../models/Cart.js';
import { MenuItem } from '../models/MenuItem.js';
import { OrderItem } from '../models/OrderItem.js';
import { Order } from '../models/Order.js';


document.addEventListener('DOMContentLoaded', () => {
    const cart = new Cart();
    document.getElementById('confirm-order').addEventListener('click', () => placeOrder(cart));
    document.getElementById('cancel-order').addEventListener('click', closeModal);
    load_items(cart)
});

function load_items(cart) {
    const container = document.getElementById('cart-container');
    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }
    console.log(cart);
    container.innerHTML = "";
    
    cart.items.forEach(item => {
        const div = item.render();
        container.appendChild(div);
        
        div.querySelector(".add-one").addEventListener('click', () => {
            cart.updateQuantity(item.slug, 1);
            load_items(cart);
        })
        div.querySelector(".remove-one").addEventListener('click', () => {
            cart.updateQuantity(item.slug, -1)
            load_items(cart);
        });
        div.querySelector(".delete").addEventListener('click', () => {
            cart.remove(item.slug)
            load_items(cart);
        });
    });
    const orderDiv = document.createElement('div');
    orderDiv.innerHTML = `<h3>Total: ${cart.totalFormatted()}</h3>
                          <button id="order">Place Order</button>                        
                        `;
    orderDiv.querySelector('#order').addEventListener('click', () => {
        openModal();
    })
    container.appendChild(orderDiv);

}

function openModal() {
    document.getElementById('order-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

function placeOrder(cart) {
    const name = document.getElementById('student-name').value.trim();
    if (!name) {
        alert("Please enter your name.");
        return;
    }
    if (cart.isEmpty()) {
        alert("Your cart is empty!");
        return;
    }

    const order = new Order({
        student_name: name,
        items: cart.items
    })

    fetch('/api/place-order/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(order.toJSON())
    })
    .then(response => {
        if (!response.ok) throw new Error("Failed to place order");
        return response.json()
    })
    .then(result => {
        alert("Order placed successfully!");
        cart.clear();
        closeModal();
        load_items(cart);
    })
    .catch(error => {
        console.error("Order failed:", error);
        alert("Failed to place order");
    });

}