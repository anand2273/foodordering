import { Order } from '../models/Order.js';

let allOrders = []

document.addEventListener('DOMContentLoaded', () => {
    getOrders();
    document.getElementById('btn-all-orders').addEventListener('click', () => renderOrders(allOrders));
    document.getElementById('btn-fulfilled').addEventListener('click', () =>
        renderOrders(allOrders.filter(order => order.fulfilled))
    );
    document.getElementById('btn-unfulfilled').addEventListener('click', () =>
        renderOrders(allOrders.filter(order => !order.fulfilled))
    ); 
});

function getOrders() {
    const orders = fetch('/api/orders/')
    .then(response => response.json())
    .then(orderList => {
        console.log(orderList);
        allOrders = orderList.map(Order.fromJSON);
        loadOrders(allOrders);
    });
}

function loadOrders(orderList) {
    const container = document.querySelector('.orders-specific');
    container.innerHTML = "";

    if (orderList.length === 0) {
        container.innerHTML = "<p>No orders found</p>";
        return;
    }

    orderList.forEach(order => {
        const card = order.render();
        container.appendChild(card);
    });
}
    