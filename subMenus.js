// subMenus.js
import { setSubMenusKeyDownListener, loadSubMenuContent } from './renderer.js';

export function initializeSubMenuActions() {
    const submenuItems = document.querySelectorAll('.sub-nav-item');
    
    submenuItems.forEach(item => {
        item.removeEventListener('click', setActiveAndCenterHandler); // Remove old listener to avoid duplicates
        item.addEventListener('click', setActiveAndCenterHandler); // Add new listener
    });
    submenuItems[0].parentElement.setAttribute('style', 'transition: unset');

    setSubMenusKeyDownListener((event) => handleSubMenusKeys(event, submenuItems));
    setActiveAndCenter(submenuItems[0])
}

// Define a global function to handle left and right arrow key navigation
export function handleSubMenusKeys(event, submenuItems) {

    const activeItem = document.querySelector('.sub-nav-item.active');
    let newIndex;
    switch (event.code) {
    case 'KeyE':
        if (Array.from(submenuItems).indexOf(activeItem) != submenuItems.length - 1) {
            newIndex = (Array.from(submenuItems).indexOf(activeItem) + 1);
            setActiveAndCenter(submenuItems[newIndex]);
        }
        break;
    case 'KeyQ':
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
    let offsetMultiplier = 3.05;
    if (selectedItem != submenuItems[0]) selectedItem.parentElement.removeAttribute('style');
    submenuItems.forEach(item => {
        item.classList.remove('active');
        item.style.opacity = "0.5"; // Reset opacity
    });

    selectedItem.classList.add('active');
    selectedItem.style.opacity = "1";
    
    const category = selectedItem.getAttribute('data-category');
    loadSubMenuContent(category);
    let currentTab = category.split("/")[0];

    if (currentTab == 'stat') {
        offsetMultiplier = 6.3;
    } else if (currentTab == 'inv') {
        offsetMultiplier = 3.05;
    } else if (currentTab == 'data') {
        offsetMultiplier = 2;
    }

    const submenu = document.querySelector('.submenu');
    const submenuWidth = submenu.offsetWidth;
    const itemCenter = selectedItem.offsetLeft + selectedItem.offsetWidth / 2;
    const offset = -(itemCenter - submenuWidth / offsetMultiplier);
    submenu.style.transform = `translateX(${offset}px)`;

    const activeIndex = Array.from(submenuItems).indexOf(selectedItem);
    submenuItems.forEach((item, index) => {
        const distance = Math.abs(index - activeIndex);
        const opacity = Math.max(0.01, 1 - 0.35 * distance);
        item.style.opacity = opacity.toString();
    });
}

