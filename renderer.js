let currentTab = 'stat';
let savedTab = currentTab;
let subMenuskeyDownListener;
let itemListskeyDownListener;
let settingsKeyListener;

let nickName = "Demo";

let currentProfile = {};

let hueValue = 120;
let satValue = 100;
let lightValue = 60;

let birthday = new Date();

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
	
	setActiveTab(currentTab);
	setProfile(nickName); // Initialize profile once the DOM is loaded
});

function addLeadingZero(num) {
	if (num < 10) {
		num = "0" + num;
	}
	return num;
}

function setProfile(chosenName) {
	let profileFile = `profiles/${chosenName.toLowerCase()}.json`
	if (chosenName == "Demo") profileFile = `profiles/guest.json`
	fetch(profileFile)
		.then(response => response.json())
		.then(data => {
			currentProfile = data.config;
			nickName = currentProfile.displayName;
			if (chosenName == "Demo") nickName = "Demo";
			hueValue = currentProfile.hue;
			satValue = currentProfile.sat;
			lightValue = currentProfile.light;
			birthday = currentProfile.birthday;
			initializeColorSliders(!(currentTab === 'settings'));
			initializeColorSliders(true);
		})
		.catch(error => {
			console.error(`Profile for ${chosenName} not found, loading profile Guest.`, error);
			if (chosenName !== "Guest") {
				setProfile("Guest");
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

	const menuItems = document.querySelectorAll('#menu .nav-item');
	menuItems.forEach(item => item.classList.remove('active'));

	const activeItem = document.querySelector(`#menu .nav-item[data-tab="${tab}"]`);
	if (activeItem) {
		activeItem.classList.add('active');
	}

	loadTabContent(tab);
	savedTab = currentTab;
	currentTab = tab;
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

			if (tab === "settings") {
				initializeColorSliders();
				initializeSettingsKeyNavigation(); 
			}

			if (tab === "data" || tab === "map") {
				updateDateAndTimeContinuously();
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
					document.getElementById("name").innerHTML = '&nbsp;';
				}
				if (nickName == 'Demo') {
					document.getElementById("name").innerHTML = 'DEMO MODE';
				}
			}
			if (tab === "inv") {
				import('./itemLists.js').then(module => {
					setTimeout(() => {
						module.fetchItemsData(nickName).then(() => {
							module.initializeItemList(nickName, category);
						});
					}, 0);
				});
			}
			if (category === "stat/special" || category === "stat/perks") {
				import('./itemLists.js').then(module => {
					module.initializeItemListActions();
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

	const hueDisplay = document.getElementById('hue-val');
	const satDisplay = document.getElementById('sat-val');
	const lightDisplay = document.getElementById('light-val');

	if (hueSlider && satSlider && lightSlider) {
		hueSlider.value = hueValue;
		satSlider.value = satValue;
		lightSlider.value = lightValue;

		hueDisplay.textContent = hueValue;
		satDisplay.textContent = satValue;
		lightDisplay.textContent = lightValue;
	}

	function updateColor() {
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
		const newDarkText = `hsla(${hueValue}, ${satValue}%, 2%)`;

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

	const profileButtonsContainer = document.getElementById('profile-buttons');
	profileButtonsContainer.innerHTML = '<span>Choose an existing profile:&nbsp;</span>';

	const profileNames = ["guest", "david", "marie"];
	profileNames.forEach(profileName => {
		const button = document.createElement('button');
		button.className = 'profile-btn';
		button.dataset.profile = profileName;
		button.textContent = profileName.charAt(0).toUpperCase() + profileName.slice(1);
		button.addEventListener('click', () => setProfile(profileName));
		profileButtonsContainer.appendChild(button);
	});
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
