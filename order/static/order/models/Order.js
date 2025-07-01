import { OrderItem } from "./OrderItem.js";

export class Order {
    constructor({id = null, student_name, items, timestamp = null, fulfilled = false}) {
        this.id = id;
        this.student_name = student_name;
        this.items = items;
        this.timestamp = timestamp;
        this.fulfilled = fulfilled;
    }

    toJSON() {
        return {
            student_name: this.student_name,
            items: this.items.map(item => item.toJSON()),
        }
    }

    static fromJSON(data) {
        return new Order({
            id: data.id || null,
            student_name: data.student_name,
            timestamp: data.timestamp || null,
            items: data.items.map(OrderItem.fromJSON),
            fulfilled: data.fulfilled || false
        })
    }

    render() {
    const card = document.createElement('div');
    card.className = 'order-card';

    const date = new Date(this.timestamp).toLocaleString();

    card.innerHTML = `
        <h3>Order ID: ${this.id}</h3>
        <p><strong>Name:</strong> ${this.student_name}</p>
        <p><strong>Time:</strong> ${date}</p>
        <ul>
            ${this.items.map(item => `
                <li>${item.quantity} × ${item.title} - $${item.formatPrice()}</li>
            `).join('')}
        </ul>
    `;
    return card;
    }

}