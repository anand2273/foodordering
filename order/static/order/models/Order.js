import { OrderItem } from "./OrderItem.js";

export class Order {
    constructor({id = null, student_name, items, timestamp = null}) {
        this.id = id;
        this.student_name = student_name;
        this.items = items;
        this.timestamp = timestamp;
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
            items: data.items.map(OrderItem.fromJSON),
            timestamp: data.timestamp || null
        })
    }
    sendOrder() {
        // POST request to orders API.
        return;
    }

}