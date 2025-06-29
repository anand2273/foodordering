import { Cart } from '../models/Cart.js';
import { MenuItem } from '../models/MenuItem.js';
import { OrderItem } from '../models/OrderItem.js';

document.addEventListener('DOMContentLoaded', load_item);

function load_item() {
    const slug = window.location.pathname.split('/').filter(Boolean).pop();
    console.log(slug);
    fetch(`/api/menu-item/${slug}/`)
    .then(response => response.json())
    .then(itemData => {
        const container = document.getElementById('item-container');
        const item = MenuItem.fromJSON(itemData);
        item.itemRender(container);
        document.querySelector("#add_to_cart").addEventListener('click', () => add_to_cart(item))
    })
    .catch(error => {
            console.error(error);
            document.getElementById('item-container').innerText = "Item could not be loaded.";
        });

}

// function expects a MenuItem object.
function add_to_cart(item) {
    const cart = new Cart();
    const oi = new OrderItem({menuItem: item, quantity: 1})
    cart.add(oi);
    alert(`${item.title} added to cart!`);
}
