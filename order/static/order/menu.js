document.addEventListener('DOMContentLoaded', () => {
    load_menu();
})

function load_menu() {
    // GET request to the API route
    fetch('/api/menu/', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(items => {
        const container = document.getElementById('menu-container');
        container.innerHTML = ''; // Clear anything in there

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'menu-item';

            div.innerHTML = `
                <img src="${item.img}">
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
                <strong>$${item.price}</strong>
            `;
            console.log(item.slug);
            div.addEventListener('click', () => {
                window.location.href = `/menu/${item.slug}/`;
            });
            container.appendChild(div);
        });
    })
    .catch(error => {
        console.error("Failed to load menu:", error);
        document.getElementById('menu-container').innerText = "Failed to load menu.";
    });
}

function goBack() {
    load_menu();
}