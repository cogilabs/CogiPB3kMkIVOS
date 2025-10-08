let currentTab = 'stat';
let savedTab = currentTab;
let subMenuskeyDownListener;
let itemListskeyDownListener;
let settingsKeyListener;
let mapKeyListener;

let nickName = "Demo";

const profilesList = ["guest", "david", "marie"];
let currentProfile = {};
let isLocalFile = false;
let itemsData = {};
let isMusicPlaying = false;
let isMusicRunning = false;
let displayName = '';

let hueValue = 120;
let satValue = 100;
let lightValue = 60;
let lightOffsetValue = 0;
let satOffsetValue = 0;

let birthday = new Date();
let songList = [];
let currentSongIndex = 0;

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
  
  import('./itemLists.js')
    .then(module => module.fetchItemsData())
    .then(() => setProfile("Local"))
    .then(() => {
      setActiveTab(currentTab);
      if (currentTab === "stat") {
        calculateLevel();
      }
    })
    .catch(error => console.error('Error loading items data or setting profile:', error));
  
  getSongs().then(() => playMusic());
});

function addLeadingZero(num) {
  return num < 10 ? `0${num}` : num;
}

function setProfile(chosenName) {
  return new Promise((resolve, reject) => {
    if (chosenName === "Local") {
      const localProfilePath = window.electron.getLocalProfilePath();
      window.electron.readFile(localProfilePath)
        .then(data => {
          if (data) {
            isLocalFile = true;
            const localProfile = JSON.parse(data).config;
            currentProfile = localProfile;
            nickName = "Local";
            displayName = currentProfile.displayName;
            hueValue = currentProfile.hue;
            satValue = currentProfile.sat;
            lightValue = currentProfile.light;
            lightOffsetValue = currentProfile.lightOffset ? currentProfile.lightOffset : 0;
            satOffsetValue = currentProfile.satOffset ? currentProfile.satOffset : 0;
            birthday = new Date(currentProfile.birthday);
            initializeColorSliders(!(currentTab === 'settings'));
            initializeColorSliders(true);
              import('./itemLists.js').then(module => {
                module.fetchProfileData('Local').finally(() => resolve());
              }).catch(() => resolve());
          } else {
            isLocalFile = false;
            setProfile(nickName).then(resolve).catch(reject);
          }
        })
        .catch(error => {
          console.warn("Error reading local profile, falling back to default profile.", error);
          setProfile(nickName).then(resolve).catch(reject);
        });
    } else {
      let profileFile = `profiles/${chosenName.toLowerCase()}.json`;
      if (chosenName === "Demo") profileFile = `profiles/guest.json`;
      fetch(profileFile)
        .then(response => response.json())
        .then(data => {
          currentProfile = data.config;
          nickName = currentProfile.displayName;
          displayName = currentProfile.displayName;
          if (chosenName === "Demo") {
            nickName = "Demo";
            displayName = "DEMO MODE";
          }
          if (chosenName === "guest") displayName = '&nbsp;';
          hueValue = currentProfile.hue;
          satValue = currentProfile.sat;
          lightValue = currentProfile.light;
          lightOffsetValue = currentProfile.lightOffset ? currentProfile.lightOffset : 0;
          satOffsetValue = currentProfile.satOffset ? currentProfile.satOffset : 0;
          birthday = new Date(currentProfile.birthday);
          initializeColorSliders(!(currentTab === 'settings'));
          initializeColorSliders(true);
          import('./itemLists.js').then(module => {
            module.fetchProfileData(chosenName).finally(() => resolve());
          }).catch(() => resolve());
        })
        .catch(error => {
          console.error(`Profile for ${chosenName} not found, loading profile Guest.`, error);
          if (chosenName !== "Guest") {
            setProfile("Guest").then(resolve).catch(reject);
          } else {
            reject(error);
          }
        });
    }
  });
}

function calculateLevel() {
  const today = new Date();
  const birthdate = new Date(birthday);
  let level = today.getFullYear() - birthdate.getFullYear();

  let birthDayThisYear = new Date(`${today.getFullYear()}-${birthdate.getMonth() + 1}-${birthdate.getDate()}`);
  if (today > birthDayThisYear) {
    birthDayThisYear.setFullYear(today.getFullYear() + 1);
  } else {
    level--;
  }

  let totalDaysLeft = Math.round(Math.abs(birthDayThisYear.getTime() - today.getTime()) / 86400000);
  const levelProgress = 100 * (1 - (totalDaysLeft / 365));

  if (document.getElementById("currentLevel")) document.getElementById("currentLevel").innerHTML = "LEVEL " + level + '<span class="loading-bar" id="level-bar"><span id="levels"></span></span>';
  if (document.getElementById("levels")) {
    document.getElementById("levels").setAttribute('style', 'width: ' + levelProgress + '%');
  }
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

  if (mapKeyListener) {
    document.removeEventListener('keydown', mapKeyListener);
    mapKeyListener = null;
  }

  const menuItems = document.querySelectorAll('#menu .nav-item');
  menuItems.forEach(item => item.classList.remove('active'));

  const activeItem = document.querySelector(`#menu .nav-item[data-tab="${tab}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }

  loadTabContent(tab).then(() => {
    savedTab = currentTab;
    currentTab = tab;

    if (tab === "stat") {
      calculateLevel();
    }
		if (tab === "data" || tab === "map") {
      updateDateAndTimeContinuously();
    }
    if (tab === "radio") {
      return import('./radioWave.js').then(module => {
          module.radioWave();
        });
    }
  }).catch(error => console.error(`Error loading ${tab} content:`, error));
}

function loadTabContent(tab) {
  return fetch(`tabs/${tab}.html`)
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
        return import('./subMenus.js').then(module => {
          module.initializeSubMenuActions();
        });
      }

      if (tab === "settings") {
        initializeColorSliders();
        initializeSettingsKeyNavigation();
      }

      if (tab === "map") {
        initializeMapKeyNavigation();
      }

      if (tab === "radio") {
        import('./itemLists.js').then(module => {
          module.initializeItemListActions();
        });
        updateRadio();
      }

      return Promise.resolve();
    })
    .catch(error => {
      console.error(`Error loading ${tab} content:`, error);
      return Promise.reject(error);
    });
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
          import('./itemLists.js').then(module => {
            try { module.updateLimbGaugesFromProfile(); } catch (e) { /* ignore */ }
            setTimeout(() => {
              const healthEl = document.getElementById('health-points');
            }, 120);
          }).catch(() => {});
        } else {
          tableContent.innerHTML = '';
        }
      }
      if (category === "stat/status") {
        document.getElementById("name").innerHTML = displayName;
        import('./itemLists.js').then(module => {
          try { module.updateLimbGaugesFromProfile(); } catch (e) { console.warn('Failed to update limb gauges after loading status subpage', e); }
        }).catch(err => console.warn('Failed to import itemLists for limb update', err));
      }
      if (tab === "inv") {
        import('./itemLists.js').then(module => {
          setTimeout(() => {
            module.fetchItemsData().then(() => {
              module.initializeItemList(nickName, category);
            });
          }, 0);
        });
      }
      if (category === "stat/perks" || category === "stat/special") {
        import('./itemLists.js').then(module => {
          setTimeout(() => {
            module.fetchItemsData().then(() => {
              module.initializeItemList(nickName, category);
            });
          }, 0);
        });
      }
      if (category === "data/quests") {
        import('./itemLists.js').then(module => {
          setTimeout(() => {
            module.fetchItemsData().then(() => {
              module.initializeItemList(nickName, category);
            });
          }, 0);
        });
      }
    })
    .catch(error => console.error('Failed to load content:', error));
}

function updateDateAndTimeContinuously() {
  const update = () => {
    const dateArea = document.getElementById('date');
    const timeArea = document.getElementById('time');
    const now = new Date();

    if (dateArea) {
      dateArea.innerHTML = `${addLeadingZero(now.getDate())}/${addLeadingZero(now.getMonth() + 1)}/${now.getFullYear()}`;
    }
    if (timeArea) {
      timeArea.innerHTML = `${addLeadingZero(now.getHours())}:${addLeadingZero(now.getMinutes())}`;
    }
  };

  update();
  setInterval(update, 60000);
}

function initializeColorSliders(force) {
  if (force) {
    updateColor();
    return;
  }
  const hueSlider = document.getElementById('hue-slider');
  const satSlider = document.getElementById('sat-slider');
  const lightSlider = document.getElementById('light-slider');
  const lightOffsetSlider = document.getElementById('light-offset-slider');
  const satOffsetSlider = document.getElementById('sat-offset-slider');

  const hueDisplay = document.getElementById('hue-val');
  const satDisplay = document.getElementById('sat-val');
  const lightDisplay = document.getElementById('light-val');
  const lightOffsetDisplay = document.getElementById('light-offset-val');
  const satOffsetDisplay = document.getElementById('sat-offset-val');

  if (hueSlider) hueSlider.value = hueValue;
  if (satSlider) satSlider.value = satValue;
  if (lightSlider) lightSlider.value = lightValue;
  if (lightOffsetSlider) lightOffsetSlider.value = lightOffsetValue;
  if (satOffsetSlider) satOffsetSlider.value = satOffsetValue;

  if (hueDisplay) hueDisplay.textContent = hueValue;
  if (satDisplay) satDisplay.textContent = satValue;
  if (lightDisplay) lightDisplay.textContent = lightValue;
  if (lightOffsetDisplay) lightOffsetDisplay.textContent = lightOffsetValue;
  if (satOffsetDisplay) satOffsetDisplay.textContent = satOffsetValue;

  function updateColor() {
    if (!force) {
      if (hueSlider) hueValue = parseInt(hueSlider.value, 10) || 0;
      if (satSlider) satValue = parseInt(satSlider.value, 10) || 0;
      if (lightSlider) lightValue = parseInt(lightSlider.value, 10) || 0;
      if (lightOffsetSlider) lightOffsetValue = parseInt(lightOffsetSlider.value, 10) || 0;
      if (satOffsetSlider) satOffsetValue = parseInt(satOffsetSlider.value, 10) || 0;

      if (hueDisplay) hueDisplay.textContent = hueValue;
      if (satDisplay) satDisplay.textContent = satValue;
      if (lightDisplay) lightDisplay.textContent = lightValue;
      if (lightOffsetDisplay) lightOffsetDisplay.textContent = lightOffsetValue;
      if (satOffsetDisplay) satOffsetDisplay.textContent = satOffsetValue;
    }

    const newLight = `hsl(${hueValue}, ${satValue}%, ${lightValue}%)`;
    const newMedLight = `hsla(${hueValue}, ${satValue}%, ${lightValue}%, 0.3)`;
    const newMed = `hsla(${hueValue}, ${satValue}%, ${lightValue}%, 0.2)`;
    const newMedDark = `hsla(${hueValue}, ${satValue}%, ${lightValue}%, 0.1)`;
    const newDark = `hsla(${hueValue}, ${satValue}%, ${lightValue}%, 0.02)`;
    const newDarkText = `hsla(${hueValue}, ${satValue}%, 2%)`;

    document.documentElement.style.setProperty('--hue', `${hueValue - 140}deg`);
    document.documentElement.style.setProperty('--biHue', `${hueValue - 55}deg`);
    document.documentElement.style.setProperty('--realHue', `${hueValue}deg`);
    document.documentElement.style.setProperty('--sat', `${satValue}%`);

    const baseBiSat = parseInt(satValue, 10) || 0;
    const offsetBiSat = parseInt(satOffsetValue, 10) || 0;
    const computedBiSat = (baseBiSat * 5) + (offsetBiSat * 10);
    document.documentElement.style.setProperty('--biSat', `${computedBiSat}%`);

    document.documentElement.style.setProperty('--brightness', `${lightValue * 2}%`);
    document.documentElement.style.setProperty('--biBrightness', `${(parseInt(lightValue, 10) + parseInt(lightOffsetValue, 10)) * 2}%`);

    document.documentElement.style.setProperty('--light', newLight);
    document.documentElement.style.setProperty('--mediumLight', newMedLight);
    document.documentElement.style.setProperty('--medium', newMed);
    document.documentElement.style.setProperty('--mediumDark', newMedDark);
    document.documentElement.style.setProperty('--dark', newDark);
    document.documentElement.style.setProperty('--darkText', newDarkText);
  }

  if (hueSlider) hueSlider.addEventListener('input', updateColor);
  if (satSlider) satSlider.addEventListener('input', updateColor);
  if (lightSlider) lightSlider.addEventListener('input', updateColor);
  if (lightOffsetSlider) lightOffsetSlider.addEventListener('input', updateColor);
  if (satOffsetSlider) satOffsetSlider.addEventListener('input', updateColor);

  const profileButtonsContainer = document.getElementById('profile-buttons');
  if (profileButtonsContainer) {
    profileButtonsContainer.innerHTML = '<span>Choose an existing profile:&nbsp;</span>';

    if (isLocalFile) {
      const localButton = document.createElement('button');
      localButton.className = 'profile-btn';
      localButton.dataset.profile = "local";
      localButton.textContent = "Local";
      localButton.addEventListener('click', () => setProfile("Local"));
      profileButtonsContainer.appendChild(localButton);
    }

    profilesList.forEach(profileName => {
      const button = document.createElement('button');
      button.className = 'profile-btn';
      button.dataset.profile = profileName;
      button.textContent = profileName.charAt(0).toUpperCase() + profileName.slice(1);
      button.addEventListener('click', () => setProfile(profileName));
      profileButtonsContainer.appendChild(button);
    });
  }
}

document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'Digit1':
      if (currentTab !== 'stat')
        setActiveTab('stat');
      break;
    case 'Digit2':
      if (currentTab !== 'inv')
        setActiveTab('inv');
      break;
    case 'Digit3':
      if (currentTab !== 'data')
        setActiveTab('data');
      break;
    case 'Digit4':
      if (currentTab !== 'map')
        setActiveTab('map');
      break;
    case 'Digit5':
      if (currentTab !== 'radio')
        setActiveTab('radio');
      break;
    case 'KeyP':
      if (currentTab !== 'settings') {
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
    document.getElementById('light-offset-slider'),
    document.getElementById('sat-offset-slider'),
    ...document.querySelectorAll('.profile-btn')
  ];

  if (elements.length > 0) {
    elements[currentElementIndex].focus();
    elements[currentElementIndex].parentElement.classList.add('selected');
  }

  const settingsKeyListenerHandler = (event) => {
    if (currentTab === "settings") {
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
        case 'KeyQ':
          if (elements[currentElementIndex].type === 'range') {
            elements[currentElementIndex].value = Math.max(elements[currentElementIndex].min, elements[currentElementIndex].value - 1);
            elements[currentElementIndex].dispatchEvent(new Event('input'));
          }
          break;
        case 'KeyE':
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

function initializeMapKeyNavigation() {

  let mapTemplate = document.getElementById('map-template');

  const mapKeyListenerHandler = (event) => {
    if (currentTab === "map") {
      switch (event.code) {
        case 'KeyW':
          mapTemplate.scrollTop -= 20;
          break;
        case 'KeyS':
          mapTemplate.scrollTop += 20;
          break;
        case 'KeyA':
          mapTemplate.scrollLeft -= 20;
          break;
        case 'KeyD':
          mapTemplate.scrollLeft += 20;
          break;
      }
    }
  };

  if (mapKeyListener) {
    document.removeEventListener('keydown', mapKeyListener);
  }
  mapKeyListener = mapKeyListenerHandler;
  document.addEventListener('keydown', mapKeyListenerHandler);
}

export function updateRadio(item) {
  let isEquipped = false;
  if (!item) {
    if(isMusicPlaying) {
      document.getElementById('music-radio').classList.add('equipped');
    }
    return;
  }
  item.classList.forEach(currentClass => {
    if (currentClass == 'equipped') isEquipped = true;
  });
  if (item.firstChild.innerText === "Rocket's Hideout Radio") {
    if (isEquipped) {
      isMusicPlaying = true;
      playMusic();
    } else {
      if(isMusicPlaying) {
        isMusicPlaying = false;
        playMusic();
      }
    }
  } else {
    if (isEquipped) {
      if(isMusicPlaying) {
        isMusicPlaying = false;
        playMusic();
      }
    }
  }
}

async function getSongs() {
  try {
    songList = await window.electron.invoke('get-songs');
    shuffleSongs();
  } catch (error) {
    console.error('Failed to load songs:', error);
  }
}

function shuffleSongs() {
  for (let i = songList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [songList[i], songList[j]] = [songList[j], songList[i]];
  }
}

function playNextSong() {
  currentSongIndex = (currentSongIndex + 1) % songList.length;
  const audio = document.getElementById('audio');
  audio.src = songList[currentSongIndex];
  if (!isMusicRunning) {
    audio.currentTime = 30;
  }
  audio.play();
}

function playMusic() {
  const audio = document.getElementById('audio');
  if (!isMusicRunning) {
    audio.addEventListener('ended', playNextSong);
    playNextSong();
    isMusicRunning = true;
  }
  audio.volume = isMusicPlaying ? 1 : 0;
  audio.play();
}