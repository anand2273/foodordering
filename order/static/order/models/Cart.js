import {OrderItem} from './OrderItem.js';
import {MenuItem} from './MenuItem.js';

export class Cart {
    constructor() {
        const stored = JSON.parse(localStorage.getItem("cart"));
        this.items = stored
        ? stored.map(OrderItem.fromJSON).filter(Boolean)
        : [];
    }

    save() {
        localStorage.setItem("cart", JSON.stringify(this.items.map(oi => oi.toJSON())));
    }

    add(itemData) {
        const item = MenuItem.fromJSON(itemData);
        const existing = this.items.find(oi => oi.slug === item.slug);
        if (existing) {
            existing.quantity++;
        } else {
            this.items.push(new OrderItem({menuItem: item, quantity: 1}));
        }
        this.save()
    }

    remove(slug) {
        const index = this.items.findIndex(item => item.slug === slug);
        if (index !== -1) {
            this.items.splice(index, 1);
            this.save()
        }
    }

    updateQuantity(slug, delta) {
        const item = this.items.find(oi => oi.slug === slug);
        if (!item) {
            return;
        }
        item.quantity += delta;
        if (item.quantity <= 0) {
            this.remove(slug);
        } else {
            this.save()
        }
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + item.subTotal(), 0);
    }

    totalFormatted() {
        return `$${this.getTotal().toFixed(2)}`;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    clear() {
        this.items = [];
        this.save();
    }

    get length() {
        return this.items.length;
    }
}