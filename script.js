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

const frames = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
let fi = 0;
const spinner = document.querySelector(".spinner");

setInterval(() => {
    spinner.textContent = frames[fi];
    fi = (fi + 1) % frames.length;
}, 90);

const face = document.querySelector(".face");

setInterval(() => {
    face.textContent = "(-‿-)";
    setTimeout(() => face.textContent = "(◕‿◕)", 160);
}, 2600);