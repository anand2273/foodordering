import { Item } from "./Item.js";
import { MenuItem } from "./MenuItem.js";

export class OrderItem {
    constructor({ menuItem, quantity = 1}) {
        this.menuItem = menuItem;
        this.quantity = quantity;
    }
    
    get title() { return this.menuItem.title; }
    get price() { return this.menuItem.price; }
    get slug()  { return this.menuItem.slug; }
    get desc()  { return this.menuItem.desc; }
    get img()   { return this.menuItem.img; }

    subTotal() {
        return this.quantity * this.price;
    }

    formatPrice() {
    return this.menuItem.formatPrice();
    }

    /**
     * @description Consists of functions to add, remove and delete items from the cart.
     * @returns a HTML 'div' element for the item in the cart page. 
     */
    render() {
        const div = document.createElement('div');
        div.className = 'cart-item';

        div.innerHTML = `
            <img src="${this.img}">
            <h3>${this.title}</h3>
            <p>${this.desc}</p>
            <p>Quantity: ${this.quantity}</p>
            <strong>$${this.formatPrice()}</strong>
            <p>Subtotal: $${this.subTotal().toFixed(2)}</p>
            <button class="add-one">+1</button>
            <button class="remove-one">-1</button>
            <button class="delete">Delete</button>
        `;
        console.log(this.slug);
        return div;
    }


    /*
    Converts a Javascript Object to JSON for sending requests to backend.
    */
    toJSON() {
        return {
            item: this.menuItem.toJSON(),
            quantity: this.quantity
        };
    }
    // data field is formatted in JSON, includes the quantity field.
    static fromJSON(data) {
        return new OrderItem({
            menuItem: MenuItem.fromJSON(data.menuItem),
            quantity: data.quantity
        })
    }
}