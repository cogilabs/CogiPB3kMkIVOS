import { setItemListsKeyDownListener, updateRadio, getCachedLevel, calculateLevelAndProgress } from './renderer.js';

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
  return new Promise((resolve, reject) => {
    function applyProfileData(data) {
      profileItems = data;
      updateTotalWeight(); // Update total weight after fetching profile data
      updateFooterCaps(profileItems?.inv?.caps?.amount ? profileItems.inv.caps.amount : 0);
      try {
        updateLimbGaugesFromProfile();
      } catch (err) {
        console.warn('Failed to update limb gauges from profile:', err);
      }
      try { updateEquippedStats(); } catch(e) {}
    }

    function fetchAndApply(file) {
      return fetch(file)
        .then(response => {
          if (!response.ok) {
            throw new Error('File not found');
          }
          return response.json();
        })
        .then(data => {
          applyProfileData(data);
        });
    }

    if (nickName != "Local") {
      const defaultFileName = 'profiles/guest.json';
      let userFileName = `profiles/${nickName.toLowerCase()}.json`;
    
      if (nickName == 'Demo') userFileName = defaultFileName;
    
      fetchAndApply(userFileName)
        .catch(error => {
          console.warn(`Failed to load ${userFileName}, trying ${defaultFileName}.`, error);
          return fetchAndApply(defaultFileName);
        })
        .then(() => resolve())
        .catch(error => {
          console.error('Failed to load profile items:', error);
          reject(error);
        });
    } else {
      const localProfilePath = window.electron.getLocalProfilePath();
      window.electron.readFile(localProfilePath)
        .then(data => {
          applyProfileData(JSON.parse(data));
          resolve();
        })
        .catch(error => {
          console.error('Failed to load profile items:', error);
          reject(error);
        });
    }
  });
}

export function initializeItemList(nickName, tabPlusSubCategory) {
  const subCategory = tabPlusSubCategory.split("/")[1];
  fetchItemsData()
    .then(() => fetchProfileData(nickName))
    .then(() => {
      if (subCategory !== 'special') {
        populateInventory(tabPlusSubCategory);
        if (subCategory === 'apparel') {
          try {
            updateApparelDisplay();
          } catch (e) { console.warn('Failed to update apparel display on init:', e); }
        }
      } else {
        updateSpecialAttributes();
      }
    })
    .then(() => initializeItemListActions())
    .catch(error => {
      console.error('Error initializing item list:', error);
    });
}

export function updateApparelDisplay(){
  const apparelBg = document.getElementById('apparel-background');
  const apparelSlots = {
    head: document.getElementById('apparel-head'),
    eyes: document.getElementById('apparel-eyes'),
    torso: document.getElementById('apparel-torso'),
    left_arm: document.getElementById('apparel-left_arm'),
    right_arm: document.getElementById('apparel-right_arm'),
    left_leg: document.getElementById('apparel-left_leg'),
    right_leg: document.getElementById('apparel-right_leg'),
  };

  if (!apparelBg) return;

  Object.keys(apparelSlots).forEach(k => {
    const el = apparelSlots[k];
    if (el) {
      el.style.display = 'none';
      if (el.dataset && el.dataset.prevDisplay !== undefined) delete el.dataset.prevDisplay;
      el.classList.remove('slow-blink');
    }
  });

  const profileApparel = profileItems.inv && profileItems.inv.apparel ? profileItems.inv.apparel : null;
  if (!profileApparel) return;

  for (let type in profileApparel) {
    for (let id in profileApparel[type]) {
      const entry = profileApparel[type][id];
      if (entry && (entry.equipped === true || entry.equipped === 'true')) {
        const itemDef = itemsData.inv && itemsData.inv.apparel && itemsData.inv.apparel[type] && itemsData.inv.apparel[type][id] ? itemsData.inv.apparel[type][id] : null;
        if (itemDef && itemDef.slots) {
          for (let slotKey in itemDef.slots) {
            const slotName = itemDef.slots[slotKey];
            const slotEl = apparelSlots[slotName];
            if (slotEl) slotEl.style.display = 'block';
          }
        }
      }
    }
    try { updateEquippedStats(); } catch(e) {}
  }
}

function populateInventory(tabPlusSubCategory) {
  const category = tabPlusSubCategory.split("/")[0];
  const subCategory = tabPlusSubCategory.split("/")[1];
  const inventory = document.getElementById('inventory');
  const completedQuests = document.getElementById('completed-quests');
  if (tabPlusSubCategory === 'data/quests' && completedQuests) {
    completedQuests.innerHTML = ''; // Clear any existing items
  }
  if (!inventory) {
    console.error('Inventory element not found.');
    return;
  }
  inventory.innerHTML = '';  // Clear any existing items
  
  if (!profileItems[category] || !profileItems[category][subCategory]) {
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
      if (tabPlusSubCategory === 'data/quests') {
        itemsArray.push({ id: item, type: type, ...profileItems[category][subCategory][type][item] });
      }
    }
  }

  // Sort items alphabetically by name
  if (tabPlusSubCategory !== 'data/quests') itemsArray.sort((a, b) => a.name.localeCompare(b.name));

  // Append sorted items to the inventory
  itemsArray.forEach(itemData => {
    const itemElement = document.createElement('div');
    if (category === 'stat') itemElement.classList.add('itemList-item', 'attrList-item', 'perkList-item');
    else if (tabPlusSubCategory === 'data/quests') itemElement.classList.add('itemList-item', 'questList-item', 'equipableList-item');
    else itemElement.classList.add('itemList-item', 'equipableList-item');

    // profile entry for this item (safe access)
    const itemProfile = profileItems[category] && profileItems[category][subCategory] && profileItems[category][subCategory][itemData.type] && profileItems[category][subCategory][itemData.type][itemData.id] ? profileItems[category][subCategory][itemData.type][itemData.id] : null;
    // if quest and has objectives, mark completed when all objectives are completed
    if (tabPlusSubCategory === 'data/quests' && itemProfile && itemProfile.objectives) {
      const objectivesValues = Object.values(itemProfile.objectives);
      const allDone = objectivesValues.length > 0 && objectivesValues.every(o => o && (o.completed === true || o.completed === 'true'));
      if (allDone) itemElement.classList.add('completed');
    }

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
    if (tabPlusSubCategory !== 'data/quests') inventory.appendChild(itemElement);
    else {
      if (!itemElement.classList.contains('completed')) {
        inventory.appendChild(itemElement);
      } else {
        if (completedQuests) completedQuests.appendChild(itemElement);
      }
    }
  });
  if (tabPlusSubCategory === 'data/quests') if (completedQuests.children.length > 0) completedQuests.style.display = 'block';
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
  try { updateEquippedStats(); } catch(e) {}
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
    case 'KeyD': // TODO: Implement properly for inventory
      if(itemListsItem[Array.from(itemListsItem).indexOf(activeItem)].parentElement.id === 'radio-list') {
        setEquippedState(itemListsItem[Array.from(itemListsItem).indexOf(activeItem)], 'equip');
      }
      break;
    case 'KeyA': // TODO: Implement properly for inventory
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
  try { clearApparelBlink(); } catch(e) {}

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
  try { updateEquippedStats(); } catch(e) {}
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
  try { updateEquippedStats(); } catch(e) {}
}

export function updateEquippedStats() {
  try {
    console.debug && console.debug('updateEquippedStats called');
    let damage = null;
    if (profileItems && profileItems.inv && profileItems.inv.weapons) {
      const weaponTypes = Object.keys(profileItems.inv.weapons);
      for (let t = 0; t < weaponTypes.length; t++) {
        const type = weaponTypes[t];
        const entries = profileItems.inv.weapons[type] || {};
        for (let id in entries) {
          const ent = entries[id];
          if (ent && (ent.equipped === true || ent.equipped === 'true')) {
            const def = itemsData.inv && itemsData.inv.weapons && itemsData.inv.weapons[type] && itemsData.inv.weapons[type][id] ? itemsData.inv.weapons[type][id] : null;
            if (def && def.damageAmount) {
              damage = def.damageAmount;
              break;
            }
            if (def && def.damageAmount === undefined && def.damage) {
              damage = def.damage;
              break;
            }
          }
        }
        if (damage !== null) break;
      }
    }

    const res = { bullet: 0, energy: 0, radiation: 0 };
    if (profileItems && profileItems.inv && profileItems.inv.apparel) {
      for (let type in profileItems.inv.apparel) {
        const entries = profileItems.inv.apparel[type] || {};
        for (let id in entries) {
          const ent = entries[id];
          if (ent && (ent.equipped === true || ent.equipped === 'true')) {
            const def = itemsData.inv && itemsData.inv.apparel && itemsData.inv.apparel[type] && itemsData.inv.apparel[type][id] ? itemsData.inv.apparel[type][id] : null;
            if (def && def.dmgRes) {
              const dr = def.dmgRes;
              res.bullet += parseFloat(dr.bullet || dr.bulletDamage || 0) || 0;
              res.energy += parseFloat(dr.energy || 0) || 0;
              res.radiation += parseFloat(dr.radiation || dr.rad || 0) || 0;
            }
          }
        }
      }
    }

    const setIfExists = (id, value) => {
      try {
        const el = document.getElementById(id);
        if (el) el.innerText = String(value);
      } catch(e) {}
    };

    setIfExists('damageVal', damage !== null ? damage : '0');

    const bulletVal = Math.round(res.bullet || 0);
    const energyVal = Math.round(res.energy || 0);
    const radVal = Math.round(res.radiation || 0);

    setIfExists('resBulletVal', bulletVal);
    setIfExists('resEnergyVal', energyVal);
    setIfExists('resRadiationVal', radVal);

    const setDisplay = (id, show, display = 'table-cell') => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = show ? display : 'none';
    };

    const nonZeroResCount = [bulletVal, energyVal, radVal].filter(v => Number(v) !== 0).length;

    setDisplay('resBulletValContainer', bulletVal !== 0, 'table-cell');
    setDisplay('resEnergyValContainer', energyVal !== 0, 'table-cell');
    setDisplay('resRadiationValContainer', radVal !== 0, 'table-cell');

    setDisplay('helmetContainer', true, 'table-cell');

    if (nonZeroResCount === 0) {
      setDisplay('resBulletValContainer', true, 'table-cell');
      setDisplay('resEnergyValContainer', false);
      setDisplay('resRadiationValContainer', false);
    }

    const sep = document.getElementById('statusOverviewSeparator');
    if (sep) {
      sep.style.display = '';
    }

    console.debug && console.debug('updateEquippedStats result', { damage, res });
    return { damage, res };
  } catch (e) {
    console.warn('updateEquippedStats failed', e);
    return null;
  }
}

function clearApparelBlink() {
  const apparelSlots = [
    'apparel-head','apparel-eyes','apparel-torso','apparel-left_arm','apparel-right_arm','apparel-left_leg','apparel-right_leg'
  ];
  apparelSlots.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.dataset && el.dataset.prevDisplay !== undefined) {
      el.style.display = el.dataset.prevDisplay;
      delete el.dataset.prevDisplay;
    } else {
    }
    el.classList.remove('slow-blink');
  });
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
  const weaponImage = document.getElementById('inv-img');
  const attrDesc = document.getElementById('attr-description');
  const perkRank = document.getElementById('perk-rank');
  const perkDesc = document.getElementById('perk-description');
  const questDesc = document.getElementById('quest-description');
  const questObjectives = document.getElementById('quest-objectives');
  const apparelBg = document.getElementById('apparel-background');
  const apparelSlots = {
    head: document.getElementById('apparel-head'),
    eyes: document.getElementById('apparel-eyes'),
    torso: document.getElementById('apparel-torso'),
    left_arm: document.getElementById('apparel-left_arm'),
    right_arm: document.getElementById('apparel-right_arm'),
    left_leg: document.getElementById('apparel-left_leg'),
    right_leg: document.getElementById('apparel-right_leg'),
  };

  //if (!detailsTable && !attrDesc) return;
  if (detailsTable) {
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
              <span><img src="images/icons/crosshair.png" height="11" class="black-icon"></span><span>${itemData.damageAmount}</span>
            </span>
          </td>
        </tr>
        ` : ''}
        ${itemData.ammoType ? `
        <tr>
          <td id="ammo">
            <span><img src="images/icons/ammo.svg" height="11" class="black-icon">&nbsp;${getAmmoName(itemData.ammoType)}</span><span>${getAmmoAmount(itemData.ammoType)}</span>
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

      if (apparelBg) {
        if (itemData.slots) {
          for (let slot in itemData.slots) {
            const slotName = itemData.slots[slot];
            const slotEl = apparelSlots[slotName];
            if (!slotEl) continue;
            try {
              if (slotEl.dataset && slotEl.dataset.prevDisplay === undefined) {
                slotEl.dataset.prevDisplay = slotEl.style.display || window.getComputedStyle(slotEl).display || 'none';
              }
            } catch(e) {}
            slotEl.style.display = 'block';
            slotEl.classList.add('slow-blink');
          }
        }
      }

      // Check for components if item is junk
      if (category === 'inv' && subCategory === 'junk' && itemData.components) {
        let componentsHTML = '';
        for (let component in itemData.components) {
          componentsHTML += `<span>${component.charAt(0).toUpperCase() + component.slice(1)} (${itemData.components[component]})</span><br>`;
        }
        junkComponents.innerHTML = componentsHTML;
      }
      if (weaponImage) {
        weaponImage.src = itemData.image;
      }
    } else {
      console.error('Item data not found.', itemId);
      detailsTable.innerHTML = '';
      junkComponents.innerHTML = ''; // Clear components if item data is not found
    }
  } else if (attrDesc || perkDesc) {
    let img;
    let subCategory;
    let desc;
    let rankVal;
    let rank;

    if (attrDesc) {
      img = document.getElementById('attr-img');
      subCategory = attrDesc.getAttribute('category');
      desc = attrDesc;
    } else {
      img = document.getElementById('perk-img');
      subCategory = perkDesc.getAttribute('category');
      rank = perkRank;
      rankVal = parseInt(profileItems.stat.perks.perks[itemId].rank);
      desc = perkDesc;
    }

    let itemData = null;

    // Find item data in itemsData
    if (itemsData.stat && itemsData.stat[subCategory] && itemsData.stat[subCategory][itemType] && itemsData.stat[subCategory][itemType][itemId]) {
      itemData = itemsData.stat[subCategory][itemType][itemId];
    }
    if (itemData) {
      if (!rank) {
        desc.innerHTML = itemData.description;
      } else {
        rank.innerHTML = calculateRankStars(rankVal, itemsData.stat.perks.perks[itemId].maxRank);
        desc.innerHTML = itemsData.stat.perks.perks[itemId][`rank${rankVal}description`];
      }
      img.src = itemData.imageUrl;
    } else {
      console.error('Item data not found.', itemId);
      desc.innerHTML = '';
      img.src = ''; // Clear components if item data is not found
    }
  } else if (questDesc) {
    const questsRoot = profileItems?.data?.quests;
    let quest = null;
    if (questsRoot) {
      if (questsRoot.quests && questsRoot.quests[itemId]) {
        quest = questsRoot.quests[itemId];
      } else {
        for (let t in questsRoot) {
          if (questsRoot[t] && questsRoot[t][itemId]) {
            quest = questsRoot[t][itemId];
            break;
          }
        }
      }
    }

    if (quest) {
      if (questDesc) questDesc.innerHTML = (quest.description || '').replace(/\n/g, '<br>');

      if (questObjectives) {
        let html = '<ul class="objectives-list">';
        if (quest.objectives) {
          const entries = Object.entries(quest.objectives);
          const notDone = [];
          const done = [];
          for (const [key, objective] of entries) {
            const completed = objective.completed === true || objective.completed === 'true';
            if (completed) done.push({ key, objective });
            else notDone.push({ key, objective });
          }
          const ordered = notDone.concat(done);
          html += ordered.map(({ key, objective }) =>
            `<li class="objective ${objective.completed === true || objective.completed === 'true' ? 'completed' : ''}"><div class="checkmark">${objective.completed === true || objective.completed === 'true' ? '✓' : ''}</div><div class="objective-description">${objective.description || objective.name || key}</div></li>`
          ).join('');
        }
        html += '</ul>';
        questObjectives.innerHTML = html;
      }
    }

    return;
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
      return profileItems.inv.ammo[type][ammoType].amount? profileItems.inv.ammo[type][ammoType].amount : 0;
    }
  }
  return 0;
}

function updateFooterWeight(totalWeight) {
  const weightElement = document.getElementById('weight');
  if (weightElement) {
    const capacity = computeCarryCapacity(profileItems) || 240;
    weightElement.innerHTML = `<img src="images/icons/weight.svg" height="20" class="black-icon" style="margin: -3.5px 0">&nbsp;&nbsp;${Math.round(totalWeight)}/${capacity}`;
  } 
}

function updateFooterCaps(caps) {
  const capsElement = document.getElementById('caps');
  if (capsElement) {
    capsElement.innerHTML = `<img src="images/icons/caps.svg" height="20" class="black-icon" style="margin: -3.5px 0">&nbsp;&nbsp;${Math.round(caps)}`;
  } 
}

function updateTotalWeight() {
  let totalWeight = 0;
  for (let subCategory in profileItems.inv) {
    for (let type in profileItems.inv[subCategory]) {
      for (let item in profileItems.inv[subCategory][type]) {
        if (profileItems.inv[subCategory][type][item].possessed === "true") {
          const itemData = itemsData.inv[subCategory][type][item];
          if (itemData) {
            const itemAmount = profileItems.inv[subCategory][type][item].amount || 1;
            totalWeight += parseFloat(itemData.weight) * itemAmount;
          }
        }
      }
    }
  }

  updateFooterWeight(totalWeight);
}

function updateSpecialAttributes() {
  for (let attribute in profileItems.stat.special.attributes) {
    document.getElementById(attribute).innerHTML = 
    `<span>${itemsData.stat.special.attributes[attribute].name}</span><span>${profileItems.stat.special.attributes[attribute].points}</span>`
  }
}

function calculateRankStars(rank, maxRank) {
  let stars = '';
  for (let i = 1; i <= maxRank; i++) {
    if (i <= rank) {
      stars += '★';
    } else {
      stars += '☆';
    }
  }
  return stars;
}

const LIMB_KEYS = ['limbHead','limbRightArm','limbLeftArm','limbRightLeg','limbLeftLeg','limbTorso'];

function _clamp(n, a=0, b=100){ return Math.max(a, Math.min(b, Number(n) || 0)); }

function setGaugePercentById(limbId, percent){
  const container = document.getElementById(limbId);
  const gauge = container ? container.querySelector('.gauge-small') : document.querySelector(`#${limbId} .gauge-small`);
  if (!gauge) return false;
  const p = _clamp(percent);
  const vb = gauge.viewBox && gauge.viewBox.baseVal ? gauge.viewBox.baseVal : null;
  const viewW = vb ? vb.width : gauge.clientWidth || 37;
  const stroke = 1;
  const maxFillW = Math.max(0, viewW - stroke);
  const newW = (maxFillW * p / 100);
  const fillRect = gauge.querySelector('.g-fill');
  if (fillRect) {
    const finalW = newW < 0.5 ? 0 : newW.toFixed(2);
    fillRect.setAttribute('width', finalW);
  }
  gauge.setAttribute('aria-valuenow', String(Math.round(p)));
  return p;
}

export function updateLimbGaugesFromProfile(retries = 5, delayMs = 120){
  const limbSource = (profileItems && profileItems.stat && profileItems.stat.health && profileItems.stat.health.limbs) ? profileItems.stat.health.limbs : null;
  const values = {};
  if (!limbSource) {
    LIMB_KEYS.forEach(k => values[k] = 100);
  } else {
    const map = {
      limbHead: limbSource.head,
      limbRightArm: limbSource.rightArm,
      limbLeftArm: limbSource.leftArm,
      limbRightLeg: limbSource.rightLeg,
      limbLeftLeg: limbSource.leftLeg,
      limbTorso: limbSource.torso
    };
    LIMB_KEYS.forEach(k => values[k] = _clamp(map[k] ?? 100));
  }
  const averageFromProfile = LIMB_KEYS.reduce((acc, k) => acc + (Number(values[k]) || 0), 0) / LIMB_KEYS.length;
  const healthElNow = document.getElementById('health-points');
  if (healthElNow) {
    healthElNow.style.width = `${averageFromProfile}%`;
  }
  try { updateFooterHPSummary(profileItems, averageFromProfile); } catch(e) {}

  let foundCount = 0;
  LIMB_KEYS.forEach(k => {
    const res = setGaugePercentById(k, values[k]);
    if (res !== false) { foundCount++; }
  });

  if (foundCount === 0 && retries > 0) {
    setTimeout(() => updateLimbGaugesFromProfile(retries - 1, delayMs), delayMs);
  }

  try { console.debug('updateLimbGaugesFromProfile', { values, foundCount }); } catch(e){}
  const result = { values, average: averageFromProfile, foundCount };
  return result;
}

export function setLimbValue(limbId, value){
  if (!LIMB_KEYS.includes(limbId)) return false;
  const p = _clamp(value);
  setGaugePercentById(limbId, p);
  const current = LIMB_KEYS.reduce((acc, k) => {
    const g = document.querySelector(`#${k} .gauge-small`);
    const v = g ? Number(g.getAttribute('aria-valuenow') || 0) : 0;
    return acc + v;
  }, 0);
  const avg = current / LIMB_KEYS.length;
  const healthEl = document.getElementById('health-points');
  if (healthEl) {
    healthEl.style.width = `${avg}%`;
  }
  try { updateFooterHPSummary(profileItems, avg); } catch(e) {}
  return true;
}

export function computeCarryCapacity(profileRoot) {
  try {
    const root = profileRoot && Object.keys(profileRoot).length ? profileRoot : profileItems || {};
    const special = root?.stat?.special?.attributes || {};
    const perks = root?.stat?.perks?.perks || {};

    const STR = Number(special.str?.points || 0);

    const strongBack = perks.strongBack || {};
    const sbRank = Number(strongBack.rank || 0);
    const hasStrongBack = strongBack.possessed === 'true' || strongBack.possessed === true;
    let strongBackBonus = 0;
    if (hasStrongBack) {
      strongBackBonus = sbRank === 1 ? 25 : (sbRank >= 2 ? 50 : 0);
    }

    const loneWanderer = perks.loneWanderer || {};
    const lwRank = Number(loneWanderer.rank || 0);
    const hasLoneWanderer = loneWanderer.possessed === 'true' || loneWanderer.possessed === true;
    let loneWandererBonus = 0;
    if (hasLoneWanderer) {
      loneWandererBonus = lwRank === 1 ? 50 : (lwRank >= 2 ? 100 : 0);
    }

    const capacity = Math.round(200 + (STR * 10) + strongBackBonus + loneWandererBonus);
    return capacity;
  } catch (e) {
    return 240; // fallback
  }
}

function computeMaxHP(profileRoot) {
  try {
    const cfg = profileRoot?.config ? profileRoot.config : profileRoot;
    const special = profileRoot?.stat?.special?.attributes || {};
    const perks = profileRoot?.stat?.perks?.perks || {};
    const END = Number(special.end?.points || 0);
    // Determine level: prefer birthday in the profile, otherwise fall back to cached level
    let level = 1;
    const bday = profileRoot?.config?.birthday || profileRoot?.birthday;
    if (bday) {
      try { level = calculateLevelAndProgress(bday).level; } catch(e) { level = getCachedLevel() || 1; }
    } else {
      level = getCachedLevel() || 1;
    }
    const lifeGiver = perks.lifeGiver || {};
    const lifeGiverRank = Number(lifeGiver.rank || 0);
    const hasLifeGiver = lifeGiver.possessed === 'true' || lifeGiver.possessed === true;
    const extra = hasLifeGiver ? (lifeGiverRank * 20) : 0;
    const maxHP = Math.round(80 + (END * 5) + ((Math.max(1, level) - 1) * 2.5) + extra);
    return { maxHP, level };
  } catch(e) { return { maxHP: 100, level: 1 }; }
}

function updateFooterHPSummary(profileRoot, averagePercent) {
  try {
    const hpCell = document.getElementById('hp-summary');
    if (!hpCell) return;
    const { maxHP } = computeMaxHP(profileRoot);
    const currentHP = Math.round(maxHP * (Number(averagePercent || 0) / 100));
    hpCell.innerText = `HP ${currentHP}/${maxHP}`;
  } catch(e) {}
}