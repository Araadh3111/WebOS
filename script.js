const text = "Welcome to AraadhOS";
const target = document.querySelector(".typed");
let i = 0;

function type() {
    if (i < text.length) {
        target.textContent += text.charAt(i);
        i++;
        setTimeout(type, 90);
    }
}

setTimeout(type, 2200);