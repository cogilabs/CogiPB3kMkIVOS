// renderer.js
// TODO: Bundle Roboto
let currentTab = 'stat';  // Keep track of the current tab
let savedTab = currentTab; // Occasionnaly used to remember a tab
let subMenuskeyDownListener;  // Reference to the global keydown listener
let itemListskeyDownListener;  // Reference to the global keydown listener
let settingsKeyListener;  // Reference to the settings keydown listener

let nickName = "Demo";

let profiles = {};  // Will hold profiles loaded from JSON
let currentProfile = {};  // Will hold the current profile data

let hueValue = 120;
let satValue = 100;
let lightValue = 60;

let birthday = new Date();

// Load profiles from JSON file
fetch('profiles.json')
    .then(response => response.json())
    .then(data => {
        profiles = data;
        setProfile(nickName);  // Initialize profile once data is loaded
    })
    .catch(error => console.error('Failed to load profiles:', error));

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
    if (profiles[chosenName.toLowerCase()]) {
        currentProfile = profiles[chosenName.toLowerCase()];
        nickName = currentProfile.displayName;
        hueValue = currentProfile.hue;
        satValue = currentProfile.sat;
        lightValue = currentProfile.light;
        birthday = currentProfile.birthday;
        initializeColorSliders(!(currentTab == 'settings'));
        initializeColorSliders(true);
    } else {
        console.error(`Profile for ${chosenName} not found, loading profile Guest.`);
        setProfile("Guest");
    }
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
    const levelProgress = 100 * (1 - (totalDaysLeft / 365));

    document.getElementById("currentLevel").innerHTML = "LEVEL " + level + '<span class="loading-bar" id="level-bar"><span id="levels"></span></span>';
    document.getElementById("levels").setAttribute('style', 'width: ' + levelProgress + '%');
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

    if (settingsKeyListener) {
        document.removeEventListener('keydown', settingsKeyListener);
        settingsKeyListener = null;
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
    savedTab = currentTab;
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
                initializeSettingsKeyNavigation(); // Initialize key navigation for settings
            }

            if (tab === "data" || tab === "map") {
                loadDateAndTime();
            }

            if (tab === "stat") {
                calculateLevel();
            }

            if (tab === "inv") {
                import('./itemLists.js').then(module => {
                    setTimeout(() => {
                        module.fetchItemsData(nickName).then(() => {
                            module.initializeItemList(nickName);
                        });
                    }, 0);  // Use setTimeout to ensure DOM is fully loaded
                });
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
                    document.getElementById("name").innerHTML = '&nbsp;';
                }
                if (nickName == 'Demo') {
                    document.getElementById("name").innerHTML = 'DEMO MODE';
                }
            }
            if (category === "stat/special" || category === "stat/perks" || category === "inv/weapons") {
                import('./itemLists.js').then(module => {
                    module.initializeItemListActions();
                });
            }
            if (category === "inv/weapons") {
                import('./itemLists.js').then(module => {
                    setTimeout(() => {
                        module.fetchItemsData(nickName).then(() => {
                            module.initializeItemList(nickName);
                        });
                    }, 0);  // Use setTimeout to ensure DOM is fully loaded
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

        document.documentElement.style.setProperty('--hue', `${hueValue - 140}deg`);
        document.documentElement.style.setProperty('--biHue', `${hueValue - 50}deg`);
        document.documentElement.style.setProperty('--realHue', `${hueValue}deg`);
        document.documentElement.style.setProperty('--sat', `${satValue}%`);
        document.documentElement.style.setProperty('--biSat', `${Math.pow(parseInt(satValue), 2) / 10}%`);
        document.documentElement.style.setProperty('--brightness', `${lightValue * 2}%`);
        document.documentElement.style.setProperty('--biBrightness', `${lightValue * 1.5}%`);

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

    // Initialize profile buttons
    const profileButtonsContainer = document.getElementById('profile-buttons');
    profileButtonsContainer.innerHTML = '<span>Choose an existing profile:&nbsp;</span>';  // Clear existing buttons

    Object.keys(profiles).forEach(profileName => {
        if (!profiles[profileName].hidden) {
            const button = document.createElement('button');
            button.className = 'profile-btn';
            button.dataset.profile = profileName;
            button.textContent = profiles[profileName].displayName;
            button.addEventListener('click', () => setProfile(profileName));
            profileButtonsContainer.appendChild(button);
        }
    });
}

document.addEventListener('keydown', (event) => {
    switch (event.code) {
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
            if (currentTab != 'settings') {
                savedTab = currentTab;
                setActiveTab('settings');
            } else {
                setActiveTab(savedTab);
            }
            break;
        default:
            break;
    }
});

function initializeSettingsKeyNavigation() {
    let currentElementIndex = 0;
    const elements = [
        document.getElementById('hue-slider'),
        document.getElementById('sat-slider'),
        document.getElementById('light-slider'),
        ...document.querySelectorAll('.profile-btn')
    ];

    if (elements.length > 0) {
        elements[currentElementIndex].focus();
        elements[currentElementIndex].parentElement.classList.add('selected');
    }

    const settingsKeyListenerHandler = (event) => {
        if (currentTab == "settings") {
            switch (event.code) {
                case 'KeyW':
                    elements[currentElementIndex].parentElement.classList.remove('selected');
                    elements[currentElementIndex].classList.remove('selected');
                    currentElementIndex = (currentElementIndex > 0) ? currentElementIndex - 1 : elements.length - 1;
                    elements[currentElementIndex].focus();
                    if (elements[currentElementIndex].type === 'range') {
                        elements[currentElementIndex].parentElement.classList.add('selected');
                    } else {
                        elements[currentElementIndex].classList.add('selected');
                    }
                    break;
                case 'KeyS':
                    elements[currentElementIndex].parentElement.classList.remove('selected');
                    elements[currentElementIndex].classList.remove('selected');
                    currentElementIndex = (currentElementIndex < elements.length - 1) ? currentElementIndex + 1 : 0;
                    elements[currentElementIndex].focus();
                    if (elements[currentElementIndex].type === 'range') {
                        elements[currentElementIndex].parentElement.classList.add('selected');
                    } else {
                        elements[currentElementIndex].classList.add('selected');
                    }
                    break;
                case 'KeyA':
                    if (elements[currentElementIndex].type === 'range') {
                        elements[currentElementIndex].value = Math.max(elements[currentElementIndex].min, elements[currentElementIndex].value - 1);
                        elements[currentElementIndex].dispatchEvent(new Event('input'));
                    }
                    break;
                case 'KeyD':
                    if (elements[currentElementIndex].type === 'range') {
                        elements[currentElementIndex].value = Math.min(elements[currentElementIndex].max, parseInt(elements[currentElementIndex].value) + 1);
                        elements[currentElementIndex].dispatchEvent(new Event('input'));
                    } else {
                        elements[currentElementIndex].click();
                        setActiveTab(savedTab);
                    }
                    break;
            }
        }
    };

    if (settingsKeyListener) {
        document.removeEventListener('keydown', settingsKeyListener);
    }
    settingsKeyListener = settingsKeyListenerHandler;
    document.addEventListener('keydown', settingsKeyListenerHandler);
}
