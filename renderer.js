// renderer.js
let currentTab = 'stat';  // Keep track of the current tab
let subMenuskeyDownListener;  // Reference to the global keydown listener
let itemListskeyDownListener;  // Reference to the global keydown listener

const nickName = "David"

let hueValue = 120;
let satValue = 100;
let lightValue = 60;

let birthday = new Date();

setProfile(nickName);

export function setSubMenusKeyDownListener(newListener) {
    if (subMenuskeyDownListener) {
        document.removeEventListener('keydown', subMenuskeyDownListener);
    }
    subMenuskeyDownListener = newListener;
    document.addEventListener('keydown', subMenuskeyDownListener);
}

export function setItemListsKeyDownListener(newListener) {
    if (itemListskeyDownListener) {
        document.removeEventListener('keydown', itemListskeyDownListener);
    }
    itemListskeyDownListener = newListener;
    document.addEventListener('keydown', itemListskeyDownListener);
}

document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('#menu .nav-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            setActiveTab(item.dataset.tab);
        });
    });
    
    // Set initial active tab
    setActiveTab(currentTab);
});

function addLeadingZero(num) {
  if (num < 10) {
      num = "0" + num;
  }
  return num;
}

function setProfile(chosenName) {
  if (chosenName == "David") {

    hueValue = 120;
    satValue = 100;
    lightValue = 60;

    birthday = "1997/02/10";
  }

  if (chosenName == "Marie" || chosenName == "Ashe" || chosenName == "Aiden") {

    hueValue = 300;
    satValue = 40;
    lightValue = 60;

    birthday = "2003/08/26";
  }

  if (chosenName == "Guest") {

    hueValue = 120;
    satValue = 100;
    lightValue = 60;

    birthday = "2000/01/01";
  }

  initializeColorSliders(true);
}

function calculateLevel() {
  const today = new Date();
  const birthdate = new Date(birthday);
  let level = today.getYear() - birthdate.getYear();
  
  let birthDayThisYear = new Date(
    `${today.getFullYear()}-${birthdate.getMonth() + 1}-${birthdate.getDate()}`
    );
    if (today > birthDayThisYear) {
        birthDayThisYear.setFullYear(today.getFullYear() + 1);
    } else {
      level--;
    }

  let totalDaysLeft = Math.round(
    Math.abs(birthDayThisYear.getTime() - today.getTime()) / 86400000
  );
  const levelProgress = 100*(1-(totalDaysLeft/365))

  document.getElementById("currentLevel").innerHTML = "LEVEL " + level + '<span class="loading-bar" id="level-bar"><span id="levels"></span></span>';
  document.getElementById("levels").setAttribute('style', 'width:  ' + levelProgress + '%');
}

function setActiveTab(tab) {
    if (subMenuskeyDownListener) {
        document.removeEventListener('keydown', subMenuskeyDownListener);
        subMenuskeyDownListener = null;
    }
    if (itemListskeyDownListener) {
        document.removeEventListener('keydown', itemListskeyDownListener);
        itemListskeyDownListener = null;
    }

    // Clear active state for all items
    const menuItems = document.querySelectorAll('#menu .nav-item');
    menuItems.forEach(item => item.classList.remove('active'));

    // Set active state on selected item
    const activeItem = document.querySelector(`#menu .nav-item[data-tab="${tab}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Load the selected tab content
    loadTabContent(tab);
    currentTab = tab;  // Update the current tab
}

function loadTabContent(tab) {
    fetch(`tabs/${tab}.html`)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const template = doc.querySelector('template');
            const content = document.importNode(template.content, true);
            const interfaceDiv = document.getElementById('interface');

            interfaceDiv.innerHTML = '';
            interfaceDiv.appendChild(content);

            if (tab === "stat" || tab === "inv" || tab === "data") {
                import('./subMenus.js').then(module => {
                    module.initializeSubMenuActions();
                });
            }

            // Re-initialize the slider functionality if necessary
            if (tab === "settings") { // Assuming the hue-slider is only in the 'settings' tab
              initializeColorSliders();
            }

            if (tab === "data" || tab === "map") {
              loadDateAndTime();
            }

            if (tab === "stat") {
              calculateLevel();
            }
        })
        .catch(error => console.error(`Error loading ${tab} content:`, error));
}

export function loadSubMenuContent(category) {
  const contentArea = document.getElementById('content-area');
  const tableContent = document.getElementById('table-content');
  if (itemListskeyDownListener) {
      document.removeEventListener('keydown', itemListskeyDownListener);
      itemListskeyDownListener = null;
  }
  
  fetch(`tabs/${category}.html`)
      .then(response => response.text())
      .then(html => {
          let tab = category.split("/")[0];
          contentArea.innerHTML = html;
          const footerContent = document.getElementById('footer-content');
          
          if (tableContent) {
            if (footerContent) {
              tableContent.innerHTML = footerContent.innerHTML;
            } else {
              tableContent.innerHTML = '';
            }
          }
          if (category == "stat/status") {
            document.getElementById("name").innerHTML = nickName;
            if (nickName == 'Guest') {
              document.getElementById("name").innerHTML = '';
            }
          }
          if (category === "stat/special" || category === "stat/perks" || category === "inv/weapons") {
              import('./itemLists.js').then(module => {
                  module.initializeItemListActions();
              });
          }
      })
      .catch(error => console.error('Failed to load content:', error));
}

function loadDateAndTime() {
  const dateArea = document.getElementById('date');
  const timeArea = document.getElementById('time');
  const d = new Date();
  
  if (dateArea) {
    dateArea.innerHTML = addLeadingZero(d.getDate()) 
      + "/" + addLeadingZero(d.getMonth() + 1) 
      + "/" + d.getFullYear();
  } else {
    console.error('Date area not found, cannot load footer.');
  }
  
  if (timeArea) {
    timeArea.innerHTML = addLeadingZero(d.getHours()) 
      + ":" + addLeadingZero(d.getMinutes());
  } else {
    console.error('Time area not found, cannot load footer.');
  }
}

function initializeColorSliders(force) {
  if (force) {
    updateColor();
    return;
  }
  const hueSlider = document.getElementById('hue-slider');
  const satSlider = document.getElementById('sat-slider');
  const lightSlider = document.getElementById('light-slider');

  const hueDisplay = document.getElementById('hue-val');
  const satDisplay = document.getElementById('sat-val');
  const lightDisplay = document.getElementById('light-val');

  // Initialize sliders with stored values
  if (hueSlider && satSlider && lightSlider) {
      hueSlider.value = hueValue;
      satSlider.value = satValue;
      lightSlider.value = lightValue;

      hueDisplay.textContent = hueValue;
      satDisplay.textContent = satValue;
      lightDisplay.textContent = lightValue;
  }

  function updateColor() { // TODO: implement reset button, implement button interactions

    if (!force) {
      hueValue = hueSlider.value;
      satValue = satSlider.value;
      lightValue = lightSlider.value;

      hueDisplay.textContent = hueValue;
      satDisplay.textContent = satValue;
      lightDisplay.textContent = lightValue;
    }

      const newLight = `hsl(${hueValue}, ${satValue}%, ${lightValue}%)`;
      const newMedLight = `hsla(${hueValue}, ${satValue}%, ${lightValue}%, 0.3)`;
      const newMed = `hsla(${hueValue}, ${satValue}%, ${lightValue}%, 0.2)`;
      const newMedDark = `hsla(${hueValue}, ${satValue}%, ${lightValue}%, 0.1)`;
      const newDark = `hsla(${hueValue}, ${satValue}%, ${lightValue}%, 0.02)`;
      const newDarkText = `hsla(${hueValue}, ${satValue}%, 2%)`; //--darkText: hsla(120, 100%, 2%);

      document.documentElement.style.setProperty('--hue', `${hueValue-140}deg`);
      document.documentElement.style.setProperty('--biHue', `${hueValue-50}deg`);
      document.documentElement.style.setProperty('--realHue', `${hueValue}deg`);
      document.documentElement.style.setProperty('--sat', `${satValue}%`);
      document.documentElement.style.setProperty('--biSat', `${Math.pow(parseInt(satValue), 2)/10}%`);
      document.documentElement.style.setProperty('--brightness', `${lightValue*2}%`);
      document.documentElement.style.setProperty('--biBrightness', `${lightValue*1.5}%`);

      document.documentElement.style.setProperty('--light', newLight);
      document.documentElement.style.setProperty('--mediumLight', newMedLight);
      document.documentElement.style.setProperty('--medium', newMed);
      document.documentElement.style.setProperty('--mediumDark', newMedDark);
      document.documentElement.style.setProperty('--dark', newDark);
      document.documentElement.style.setProperty('--darkText', newDarkText);
  }

  hueSlider.addEventListener('input', updateColor);
  satSlider.addEventListener('input', updateColor);
  lightSlider.addEventListener('input', updateColor);
}

document.addEventListener('keydown', (event) => {
  handleKeyEvent(event.code);
});

function handleKeyEvent(keyCode) {
  switch (keyCode) {
    case 'Digit1':
      if (currentTab != 'stat')
        setActiveTab('stat');
      break;
    case 'Digit2':
      if (currentTab != 'inv')
      setActiveTab('inv');
      break;
    case 'Digit3':
      if (currentTab != 'data')
      setActiveTab('data');
      break;
    case 'Digit4':
      if (currentTab != 'map')
      setActiveTab('map');
      break;
    case 'Digit5':
      if (currentTab != 'radio')
      setActiveTab('radio');
      break;
    case 'KeyP':
      if (currentTab != 'settings')
      setActiveTab('settings');
      break;
    case 'ArrowLeft':
      
      break;
    case 'ArrowRight':
      
      break;
      case 'ArrowUp':
        
        break;
      case 'ArrowDown':
        
        break;
    default:
      break;
  }
}
