// subMenus.js
import { setKeyDownListener, loadSubMenuContent } from './renderer.js';

export function initializeSubMenuActions() {
    const submenuItems = document.querySelectorAll('.sub-nav-item');
    
    submenuItems.forEach(item => {
        item.removeEventListener('click', setActiveAndCenterHandler); // Remove old listener to avoid duplicates
        item.addEventListener('click', setActiveAndCenterHandler); // Add new listener
    });

    setKeyDownListener((event) => handleArrowKeys(event, submenuItems));
    setActiveAndCenter(submenuItems[0])
}

// Define a global function to handle arrow key navigation
export function handleArrowKeys(event, submenuItems) {
    const activeItem = document.querySelector('.sub-nav-item.active');
    let newIndex;
    switch (event.key) {
        case 'ArrowRight':
            if (Array.from(submenuItems).indexOf(activeItem) != submenuItems.length - 1) {
                newIndex = (Array.from(submenuItems).indexOf(activeItem) + 1);
                setActiveAndCenter(submenuItems[newIndex]);
            }
            break;
        case 'ArrowLeft':
            if (Array.from(submenuItems).indexOf(activeItem) != 0) {
                newIndex = (Array.from(submenuItems).indexOf(activeItem) - 1);
                setActiveAndCenter(submenuItems[newIndex]);
            }
            break;
    }
}

function setActiveAndCenterHandler(event) {
    setActiveAndCenter(event.currentTarget);  // Pass currentTarget instead of the event object
}

// Define a function to set the active submenu item and adjust view as needed
export function setActiveAndCenter(selectedItem) {
    const submenuItems = document.querySelectorAll('.sub-nav-item');
    submenuItems.forEach(item => {
        item.classList.remove('active');
        item.style.opacity = "0.5"; // Reset opacity
    });

    selectedItem.classList.add('active');
    selectedItem.style.opacity = "1";
    
    const category = selectedItem.getAttribute('data-category');
    loadSubMenuContent(category);

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

