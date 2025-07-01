import { Item } from "./Item.js";

export class MenuItem extends Item {
    constructor ({title, price, slug, img, desc}) {
        super({title, price, slug});
        this.img = img;
        this.desc = desc;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            img: this.img,
            desc: this.desc
        };
    }

    /**
     * @returns A HTML div for the Menu Item in the menu itself.
     * @description (Styling) 'div' className: 'menu-item'
     */
    menuRender() {
        const div = document.createElement('div');
        div.className = 'menu-item';

        div.innerHTML = `
            <img src="${this.img}">
            <h3>${this.title}</h3>
            <p>${this.desc}</p>
            <strong>$${this.formatPrice()}</strong>
        `;

        console.log(this.slug);
        return div;
    }

    /**
     * @param {HTML div} container 
     * @description 
     * Populates the container with HTML to display
     * the item on the item page.
     * (Styling) "Add to cart" button id: add_to_cart
     */
    itemRender(container) {
        container.innerHTML = `
            <img src="${this.img}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px;">
            <h2>${this.title}</h2>
            <p>${this.desc}</p>
            <strong>Price: $${this.price}</strong>
            <br><br>
            <button onclick="history.back()">← Back to menu</button>
            <button id="add_to_cart">Add to cart<button>
        `;
    }

    static fromJSON(data) {
        return new MenuItem(data);
    }
}