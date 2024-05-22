import { setItemListsKeyDownListener } from './renderer.js';

let itemsData = {};

export function fetchItemsData(nickName) {
  const defaultFileName = 'profiles/guest.json';
  let userFileName = `profiles/${nickName.toLowerCase()}.json`;

  if (nickName == 'Demo') userFileName = 'profiles/guest.json';

  return fetch(userFileName)
    .then(response => {
      if (!response.ok) {
          throw new Error('User file not found');
      }
      return response.json();
    })
    .then(data => {
      itemsData = data;
    })
    .catch(error => {
      console.warn(`Failed to load ${userFileName}, trying ${defaultFileName}.`, error);
      return fetch(defaultFileName)
        .then(response => {
          if (!response.ok) {
              throw new Error('Default file not found');
          }
          return response.json();
        })
        .then(data => {
          itemsData = data;
        })
        .catch(error => {
          console.error('Failed to load items:', error);
        });
    });
}

export function initializeItemList(nickName, tabPlusSubCategory) {
  const category = tabPlusSubCategory.split("/")[0];
  const subCategory = tabPlusSubCategory.split("/")[1];
    if (!itemsData[category][subCategory]) {
      fetchItemsData(nickName).then(() => {
        populateInventory(tabPlusSubCategory);
        initializeItemListActions();
      });
    } else {
      populateInventory(tabPlusSubCategory);
      initializeItemListActions();
    }
}

function populateInventory(tabPlusSubCategory) {
  const category = tabPlusSubCategory.split("/")[0];
  const subCategory = tabPlusSubCategory.split("/")[1];
  const inventory = document.getElementById('inventory');
  if (!inventory) {
    console.error('Inventory element not found.');
    return;
  }
  inventory.innerHTML = '';  // Clear any existing items

  const itemsArray = [];

  // Collect items into an array
  for (let type in itemsData[category][subCategory]) {
    for (let item in itemsData[category][subCategory][type]) {
      const itemData = itemsData[category][subCategory][type][item];
      itemsArray.push({ id: item, ...itemData });
    }
  }

  // Sort items alphabetically by name
  itemsArray.sort((a, b) => a.name.localeCompare(b.name));

  // Append sorted items to the inventory
  itemsArray.forEach(itemData => {
    const itemElement = document.createElement('div');
    itemElement.classList.add('itemList-item', 'equipableList-item');
    if (itemData.equipped) {
      itemElement.classList.add('equipped');
    }
    itemElement.setAttribute('item-id', itemData.id);
    itemElement.innerHTML = `<span>${itemData.name}</span>`;
    if (itemData.amount) {
      itemElement.innerHTML += ` (${itemData.amount})`;
    }
    itemElement.addEventListener('click', setItemActiveHandler);  // Add click listener
    inventory.appendChild(itemElement);
  });
}

export function initializeItemListActions() {
  const itemListItems = document.querySelectorAll('.itemList-item');

  if (itemListItems.length === 0) {
    console.warn('No items found in the item list.');
    return;
  }

  itemListItems.forEach(item => {
    item.removeEventListener('click', setItemActiveHandler); // Remove old listener to avoid duplicates
    item.addEventListener('click', setItemActiveHandler); // Add new listener
  });

  setItemListsKeyDownListener((event) => handleItemListsKeys(event, itemListItems));
  setItemActive(itemListItems[0]);
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
}

export function setItemActive(selectedItem) {
  if (!selectedItem) {
    console.error('No item selected to set as active.');
    return;
  }

  const itemListItems = document.querySelectorAll('.itemList-item');

  itemListItems.forEach(item => {
    item.classList.remove('active');
  });

  selectedItem.classList.add('active');

  // Ensure the new active item is scrolled into view
  scrollIntoViewIfNeeded(selectedItem);

  const itemId = selectedItem.getAttribute('item-id');
  if (itemId != "loading")
    updateItemDetails(itemId);
}

function scrollIntoViewIfNeeded(element) {
  const listContainer = document.getElementsByClassName('itemList');

  if (listContainer.length === 0) {
    console.error('List container not found.');
    return;
  }

  const elemRect = element.getBoundingClientRect(); // Get element's rect relative to viewport
  const contRect = listContainer[0].getBoundingClientRect(); // Get container's rect relative to viewport

  if (elemRect.bottom > contRect.bottom) {
    element.scrollIntoView(false); // Align the element with the bottom of the container
  } else if (elemRect.top < contRect.top) {
    element.scrollIntoView(); // Align the element with the top of the container
  }
}

function updateItemDetails(itemId) {
  const detailsTable = document.getElementById('details-table');
  const tabPlusSubCategory = detailsTable.getAttribute('category');
  const category = tabPlusSubCategory.split("/")[0];
  const subCategory = tabPlusSubCategory.split("/")[1];
  if (!detailsTable) {
    console.error('Details table element not found.');
    return;
  }

  let itemData = null;

  // Find item data in itemsData
  for (let type in itemsData[category][subCategory]) {
    if (itemsData[category][subCategory][type][itemId]) {
      itemData = itemsData[category][subCategory][type][itemId];
      break;
    }
  }

  if (itemData) {
    detailsTable.innerHTML = `
      ${itemData.damageAmount ? `
      <tr>
        <td id="dmg">
          <span id="dmg-txt">Damage</span>
          <span id="dmg-val">
            <span><img src="images/crosshair.png" height="11" class="black-icon"></span><span>${itemData.damageAmount}</span>
          </span>
        </td>
      </tr>
      ` : ''}
      ${itemData.ammoType ? `
      <tr>
        <td id="ammo">
          <span><img src="images/ammo.svg" height="11" class="black-icon">&nbsp;${itemData.ammoType}</span><span>${itemData.ammoAmount}</span>
        </td>
      </tr>
      ` : ''}
      ${itemData.speed ? `<tr><td><span>Speed</span><span>${itemData.speed}</span></td></tr>` : ''}
      ${itemData.fireRate ? `<tr><td><span>Fire Rate</span><span>${itemData.fireRate}</span></td></tr>` : ''}
      ${itemData.range ? `<tr><td><span>Range</span><span>${itemData.range}</span></td></tr>` : ''}
      ${itemData.accuracy ? `<tr><td><span>Accuracy</span><span>${itemData.accuracy}</span></td></tr>` : ''}
      ${itemData.weight ? `<tr><td><span>Weight</span><span>${itemData.weight}</span></td></tr>` : ''}
      ${itemData.value ? `<tr><td><span>Value</span><span>${itemData.value}</span></td></tr>` : ''}
    `;
  } else {
    console.error('Item data not found.', itemId);
  }
}
