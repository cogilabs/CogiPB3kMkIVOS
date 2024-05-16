//itemLists.js
import { setItemListsKeyDownListener } from './renderer.js';

export function initializeItemListActions() {
  const itemListItems = document.querySelectorAll('.itemList-item');
    
  itemListItems.forEach(item => {
      item.removeEventListener('click', setItemActiveHandler); // Remove old listener to avoid duplicates
      item.addEventListener('click', setItemActiveHandler); // Add new listener
  });

  setItemListsKeyDownListener((event) => handleItemListsKeys(event, itemListItems));
  setItemActive(itemListItems[0])
}

// Define a global function to handle left and right arrow key navigation
export function handleItemListsKeys(event, itemListsItem) {
  const activeItem = document.querySelector('.itemList-item.active');
  let newIndex;
  switch (event.code) {
  case 'KeyW':
      if (Array.from(itemListsItem).indexOf(activeItem) > 0) {
          newIndex = Array.from(itemListsItem).indexOf(activeItem) - 1;
          setItemActive(itemListsItem[newIndex]);
      }
      break;
  case 'KeyS':
      if (Array.from(itemListsItem).indexOf(activeItem) < itemListsItem.length - 1) {
          newIndex = Array.from(itemListsItem).indexOf(activeItem) + 1;
          setItemActive(itemListsItem[newIndex]);
      }
      break;
  }
}

function setItemActiveHandler(event) {
  setItemActive(event.currentTarget);  // Pass currentTarget instead of the event object
  console.log(event.currentTarget);
}

export function setItemActive(selectedItem) {
  const itemListItems = document.querySelectorAll('.itemList-item');

  itemListItems.forEach(item => {
      item.classList.remove('active');
  });

  selectedItem.classList.add('active');

  // Ensure the new active item is scrolled into view
  scrollIntoViewIfNeeded(selectedItem);
    
  const category = selectedItem.getAttribute('item-id');
  //loadItemListItemContent(itemID);

}

function scrollIntoViewIfNeeded(element) {
  const listContainer = document.getElementsByClassName('itemList');

  const elemRect = element.getBoundingClientRect(); // Get element's rect relative to viewport
  const contRect = listContainer[0].getBoundingClientRect(); // Get container's rect relative to viewport

  if (elemRect.bottom > contRect.bottom) {
      element.scrollIntoView(false); // Align the element with the bottom of the container
  } else if (elemRect.top < contRect.top) {
      element.scrollIntoView(); // Align the element with the top of the container
  }
}
