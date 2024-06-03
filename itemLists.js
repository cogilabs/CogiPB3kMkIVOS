import { setItemListsKeyDownListener, updateRadio } from './renderer.js';

let itemsData = {};
let profileItems = {};
let tries = 0;

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
  if (nickName != "Local") {
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
        updateTotalWeight(); // Update total weight after fetching profile data
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
            updateTotalWeight(); // Update total weight after fetching default profile data
          })
          .catch(error => {
            console.error('Failed to load profile items:', error);
          });
      });
    } else {
      const localProfilePath = window.electron.getLocalProfilePath();
      window.electron.readFile(localProfilePath)
        .then(data => {
          profileItems = JSON.parse(data);
          updateTotalWeight(); // Update total weight after fetching profile data
        })
        .catch(error => {
          console.error('Failed to load profile items:', error);
        });
    }
}

export function initializeItemList(nickName, tabPlusSubCategory) {
  fetchItemsData()
    .then(() => fetchProfileData(nickName))
    .then(() => {
      populateInventory(nickName, tabPlusSubCategory);
      initializeItemListActions();
    })
    .catch(error => {
      console.error('Error initializing item list:', error);
    });
}

function populateInventory(nickName, tabPlusSubCategory) {
  const category = tabPlusSubCategory.split("/")[0];
  const subCategory = tabPlusSubCategory.split("/")[1];
  const inventory = document.getElementById('inventory');
  if (!inventory) {
    console.error('Inventory element not found.');
    return;
  }
  inventory.innerHTML = '';  // Clear any existing items
  if (!profileItems[category] || !profileItems[category][subCategory]) {
    if (tries <= 3) {
      initializeItemList(nickName, tabPlusSubCategory);
      tries++;
      return;
    } else {
      console.error(`Profile data for ${category}/${subCategory} not found.`);
      tries = 0;
      return;
    }
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

  if (itemListItems.length === 0) return;

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
    case 'KeyD':
      if(itemListsItem[Array.from(itemListsItem).indexOf(activeItem)].parentElement.id === 'radio-list') {
        setEquippedState(itemListsItem[Array.from(itemListsItem).indexOf(activeItem)], 'equip');
      }
      break;
    case 'KeyA':
      if(itemListsItem[Array.from(itemListsItem).indexOf(activeItem)].parentElement.id === 'radio-list') {
        setEquippedState(itemListsItem[Array.from(itemListsItem).indexOf(activeItem)], 'unequip');
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

  if (selectedItem.parentElement.id === 'radio-list') {
    selectedItem.classList.forEach(currentClass => {
      if (currentClass == 'active') {
        setEquippedState(selectedItem);
        return;
      };
    });
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

function setEquippedState(selectedItem, state) {
  if (!selectedItem) {
    console.error('No item selected to set as equipped.');
    return;
  }

  const itemListItems = document.querySelectorAll('.itemList-item');
    
  if (!state) {

    itemListItems.forEach(item => {
      if (item != selectedItem) item.classList.remove('equipped');
    });

    selectedItem.classList.toggle('equipped');

  } else {
    if (state == 'equip') {

      itemListItems.forEach(item => {
        if (item != selectedItem) item.classList.remove('equipped');
      });

      selectedItem.classList.add('equipped');

    } else {
      selectedItem.classList.remove('equipped');
    }
  }
  updateRadio(selectedItem);
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
  if (!detailsTable) return;
  const junkComponents = document.getElementById('junk-components');
  const tabPlusSubCategory = detailsTable.getAttribute('category');
  const category = tabPlusSubCategory.split("/")[0];
  const subCategory = tabPlusSubCategory.split("/")[1];

  let itemData = null;

  // Find item data in itemsData
  if (itemsData[category] && itemsData[category][subCategory] && itemsData[category][subCategory][itemType] && itemsData[category][subCategory][itemType][itemId]) {
    itemData = itemsData[category][subCategory][itemType][itemId];
  }

  if (itemData) {
    let detailsHTML = `
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
          <span><img src="images/ammo.svg" height="11" class="black-icon">&nbsp;${getAmmoName(itemData.ammoType)}</span><span>${getAmmoAmount(itemData.ammoType)}</span>
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

    detailsTable.innerHTML = detailsHTML;

    // Check for components if item is junk
    if (category === 'inv' && subCategory === 'junk' && itemData.components) {
      let componentsHTML = '';
      for (let component in itemData.components) {
        componentsHTML += `<span>${component.charAt(0).toUpperCase() + component.slice(1)} (${itemData.components[component]})</span><br>`;
      }
      junkComponents.innerHTML = componentsHTML;
    }
  } else {
    console.error('Item data not found.', itemId);
    detailsTable.innerHTML = '';
    junkComponents.innerHTML = ''; // Clear components if item data is not found
  }
}

// Helper functions to get ammo name and amount
function getAmmoName(ammoType) {
  for (let type in itemsData.inv.ammo) {
    if (itemsData.inv.ammo[type][ammoType]) {
      return itemsData.inv.ammo[type][ammoType].name;
    }
  }
  return ammoType;
}

function getAmmoAmount(ammoType) {
  for (let type in profileItems.inv.ammo) {
    if (profileItems.inv.ammo[type][ammoType]) {
      return profileItems.inv.ammo[type][ammoType].amount;
    }
  }
  return 0;
}

function updateFooterWeight(totalWeight) {
  const weightElement = document.getElementById('weight');
  if (weightElement) {
    weightElement.innerHTML = `<img src="images/weight.svg" height="20" class="black-icon" style="margin: -3.5px 0">&nbsp;&nbsp;${Math.round(totalWeight)}/240`;
  } 
}

function updateTotalWeight() {
  let totalWeight = 0;
  for (let category in profileItems) {
    for (let subCategory in profileItems[category]) {
      if (category == 'inv') {
        for (let type in profileItems[category][subCategory]) {
          for (let item in profileItems[category][subCategory][type]) {
            if (profileItems[category][subCategory][type][item].possessed === "true") {
              const itemData = itemsData[category][subCategory][type][item];
              if (itemData) {
                const itemAmount = profileItems[category][subCategory][type][item].amount || 1;
                totalWeight += parseFloat(itemData.weight) * itemAmount;
              }
            }
          }
        }
      }
    }
  }

  updateFooterWeight(totalWeight);
}
