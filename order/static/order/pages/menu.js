import { Cart } from '../models/Cart.js';
import { MenuItem } from '../models/MenuItem.js';
import { OrderItem } from '../models/OrderItem.js';


document.addEventListener('DOMContentLoaded', () => {
    load_menu();
})

function load_menu() {
    // GET request to the API route
    fetch('/api/menu/', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(itemData => {
        const container = document.getElementById('menu-container');
        container.innerHTML = ''; 

        const items = itemData.map(item => MenuItem.fromJSON(item));
        items.forEach(item => {
            const card = item.menuRender();
            card.addEventListener('click', () => {
            window.location.href = `/menu/${item.slug}/`;
            });
            container.appendChild(card);
        })
    })
    .catch(error => {
        console.error("Failed to load menu:", error);
        document.getElementById('menu-container').innerText = "Failed to load menu.";
    });
}

function goBack() {
    load_menu();
}