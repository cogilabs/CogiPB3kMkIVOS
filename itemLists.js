import { setItemListsKeyDownListener } from './renderer.js';

let itemsData = {};
let profileItems = {};

export function fetchItemsData() {
  return fetch('items.json')
    .then(response => response.json())
    .then(data => {
      itemsData = data;
    })
    .catch(error => {
      console.error('Failed to load items:', error);
    });
}

export function fetchProfileData(nickName) {
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
      profileItems = data;
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
          profileItems = data;
        })
        .catch(error => {
          console.error('Failed to load profile items:', error);
        });
    });
}

export function initializeItemList(nickName, tabPlusSubCategory) {
  const category = tabPlusSubCategory.split("/")[0];
  const subCategory = tabPlusSubCategory.split("/")[1];

  fetchItemsData()
    .then(() => fetchProfileData(nickName))
    .then(() => {
      populateInventory(tabPlusSubCategory);
      initializeItemListActions();
    })
    .catch(error => {
      console.error('Error initializing item list:', error);
    });
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

  if (!profileItems[category] || !profileItems[category][subCategory]) {
    console.error(`Profile data for ${category}/${subCategory} not found.`);
    return;
  }

  const itemsArray = [];

  // Collect items into an array
  for (let type in profileItems[category][subCategory]) {
    for (let item in profileItems[category][subCategory][type]) {
      if (profileItems[category][subCategory][type][item].possessed === "true") {
        const itemData = itemsData[category][subCategory][type][item];
        if (itemData) {
          itemsArray.push({ id: item, type: type, ...itemData });
        } else {
          console.warn(`Item data for ${item} not found in items.json.`);
        }
      }
    }
  }

  // Sort items alphabetically by name
  itemsArray.sort((a, b) => a.name.localeCompare(b.name));

  // Append sorted items to the inventory
  itemsArray.forEach(itemData => {
    const itemElement = document.createElement('div');
    itemElement.classList.add('itemList-item', 'equipableList-item');
    if (profileItems[category][subCategory][itemData.type][itemData.id].equipped === "true") {
      itemElement.classList.add('equipped');
    }
    itemElement.setAttribute('item-id', itemData.id);
    itemElement.setAttribute('item-type', itemData.type);
    itemElement.innerHTML = `<span>${itemData.name}</span>`;
    if (profileItems[category][subCategory][itemData.type][itemData.id].amount && profileItems[category][subCategory][itemData.type][itemData.id].amount > 1) {
      itemElement.innerHTML += ` (${profileItems[category][subCategory][itemData.type][itemData.id].amount})`;
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
  const itemType = selectedItem.getAttribute('item-type');
  if (itemId != "loading")
    updateItemDetails(itemId, itemType);
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

function updateItemDetails(itemId, itemType) {
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
  if (itemsData[category] && itemsData[category][subCategory] && itemsData[category][subCategory][itemType] && itemsData[category][subCategory][itemType][itemId]) {
    itemData = itemsData[category][subCategory][itemType][itemId];
    console.log(itemData);
    console.log(itemsData);
    console.log(profileItems);
  }

  if (itemData) {
    let ammoDetails = '';
    if (itemData.ammoType) {
      const ammoType = itemData.ammoType;
      const damageType = itemData.damageType;
      let ammoName = ammoType;
      let ammoAmount = 0;

      // Look for the ammo details in itemsData and profileItems
      for (let ammoCategory in itemsData.inv.ammo) {
        if (itemsData.inv.ammo[ammoCategory][ammoType]) {
          ammoName = itemsData.inv.ammo[ammoCategory][ammoType].name;
          break;
        }
      }

      for (let ammoCategory in profileItems.inv.ammo) {
        if (profileItems.inv.ammo[ammoCategory][ammoType] && profileItems.inv.ammo[ammoCategory][ammoType].amount) {
          ammoAmount = profileItems.inv.ammo[ammoCategory][ammoType].amount;
          break;
        }
      }

      ammoDetails = `
      <tr>
        <td id="ammo">
          <span><img src="images/ammo.svg" height="11" class="black-icon">&nbsp;${ammoName}</span><span>${ammoAmount}</span>
        </td>
      </tr>
      `;
    }

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
      ${ammoDetails}
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
