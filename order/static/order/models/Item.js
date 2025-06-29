export class Item {
    constructor({ title, price, slug}) {
        this.title = title;
        this.price = parseFloat(price);
        this.slug = slug;
    }

    formatPrice() {
        return `$${this.price.toFixed(2)}`;
    }

    toJSON() {
        return {
            title: this.title,
            price: this.price,
            slug: this.slug
        }
    };

}