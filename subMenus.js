//document.addEventListener('DOMContentLoaded', () => {
//const submenuItems = document.querySelectorAll('.sub-nav-item');

// Set initial active state and center the first item
setActiveAndCenter((document.querySelectorAll('.sub-nav-item'))[0]);  // Assuming the first item should be active

// Add click event listeners to all submenu items
(document.querySelectorAll('.sub-nav-item')).forEach(item => {
    item.addEventListener('click', function() {
        setActiveAndCenter(this);
    });
});

// Attach the keydown listener only once to the document
document.addEventListener('keydown', (event) => {
    handleArrowKeys(event, (document.querySelectorAll('.sub-nav-item')));
});
//});

function handleArrowKeys(event, submenuItems) {
const activeItem = document.querySelector('.sub-nav-item.active');
let newIndex;
switch (event.key) {
    case 'ArrowRight':
        newIndex = (Array.from(submenuItems).indexOf(activeItem) + 1) % submenuItems.length;
        setActiveAndCenter(submenuItems[newIndex]);
        break;
    case 'ArrowLeft':
        newIndex = (Array.from(submenuItems).indexOf(activeItem) - 1 + submenuItems.length) % submenuItems.length;
        setActiveAndCenter(submenuItems[newIndex]);
        break;
}
}

function setActiveAndCenter(selectedItem) {
const submenuItems = document.querySelectorAll('.sub-nav-item');
submenuItems.forEach(item => {
    item.classList.remove('active');
    item.style.opacity = "0.5";  // Reset opacity
});

selectedItem.classList.add('active');
selectedItem.style.opacity = "1";

const submenu = document.querySelector('.submenu');
const submenuWidth = submenu.offsetWidth;
const itemCenter = selectedItem.offsetLeft + selectedItem.offsetWidth / 2;
const offset = -(itemCenter - submenuWidth / 3.5);
submenu.style.transform = `translateX(${offset}px)`;

const activeIndex = Array.from(submenuItems).indexOf(selectedItem);
submenuItems.forEach((item, index) => {
    const distance = Math.abs(index - activeIndex);
    const opacity = Math.max(0.01, 1 - 0.35 * distance);
    item.style.opacity = opacity.toString();
});
}
