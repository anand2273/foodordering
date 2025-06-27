document.addEventListener('DOMContentLoaded', load_item);

function load_item() {
    const slug = window.location.pathname.split('/').filter(Boolean).pop();
    console.log(slug);
    fetch(`/api/menu-item/${slug}/`)
    .then(response => response.json())
    .then(item => {
       const container = document.getElementById('item-container');
        container.innerHTML = `
            <img src="${item.img}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px;">
            <h2>${item.title}</h2>
            <p>${item.desc}</p>
            <strong>Price: $${item.price}</strong>
            <br><br>
            <button onclick="history.back()">← Back to menu</button>
            <button id="add_to_cart">Add to cart<button>
        `;
        document.querySelector("#add_to_cart").addEventListener('click', () => add_to_cart(item));
    })
    .catch(error => {
            console.error(error);
            document.getElementById('item-container').innerText = "Item could not be loaded.";
        });

}

function add_to_cart(item) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const exists = cart.find(cartItem => cartItem.slug === item.slug);
    if (exists) {
        exists.quantity += 1;
    } else {
        cart.push({
            slug: item.slug,
            title: item.title,
            price: item.price,
            quantity: 1
        });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart))
    alert(`${item.title} added to cart!`);
}
