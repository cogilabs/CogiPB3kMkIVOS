// renderer.js
let currentTab = 'stat';  // Keep track of the current tab
let keyDownListener;  // Reference to the global keydown listener

export function setKeyDownListener(newListener) {
    if (keyDownListener) {
        document.removeEventListener('keydown', keyDownListener);
    }
    keyDownListener = newListener;
    document.addEventListener('keydown', keyDownListener);
}

document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('#menu .nav-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            setActiveTab(item.dataset.tab);
        });
    });
    
    // Set initial active tab
    setActiveTab('stat');
});

function setActiveTab(tab) {
    // Cleanup if moving away from 'inv'
    if (currentTab === 'inv') {
        if (keyDownListener) {
            document.removeEventListener('keydown', keyDownListener);
            keyDownListener = null;
        }
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

            if (tab === "inv") {
                import('./subMenus.js').then(module => {
                    module.initializeSubMenuActions();
                });
            }

            // Re-initialize the slider functionality if necessary
            if (tab === "settings") { // Assuming the hue-slider is only in the 'settings' tab
              initializeColorSliders();
            }
        })
        .catch(error => console.error(`Error loading ${tab} content:`, error));
}

function initializeColorSliders() {
  const hueSlider = document.getElementById('hue-slider');
  const satSlider = document.getElementById('sat-slider');
  const lightSlider = document.getElementById('light-slider');

  function updateColor() { // TODO: update the sliders to the current values
      const hueValue = hueSlider.value;
      const satValue = satSlider.value;
      const lightValue = lightSlider.value;
      const newLight = `hsl(${hueValue}, ${satValue}%, ${lightValue}%)`;
      const newMed = `hsla(${hueValue}, ${satValue}%, ${lightValue}%, 0.2)`;
      const newDark = `hsla(${hueValue}, ${satValue}%, ${lightValue}%, 0.067)`;
      document.documentElement.style.setProperty('--hue', `${hueSlider.value-140}deg`);
      document.documentElement.style.setProperty('--sat', `${satSlider.value}%`);
      document.documentElement.style.setProperty('--brightness', `${lightSlider.value*2}%`);
      document.documentElement.style.setProperty('--light', newLight);
      document.documentElement.style.setProperty('--medium', newMed);
      document.documentElement.style.setProperty('--dark', newDark);
  }

  // Add event listeners to all sliders
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
      setActiveTab('stat');
      break;
    case 'Digit2':
      setActiveTab('inv');
      break;
    case 'Digit3':
      setActiveTab('data');
      break;
    case 'Digit4':
      setActiveTab('map');
      break;
    case 'Digit5':
      setActiveTab('radio');
      break;
    case 'ArrowLeft':
      console.log('Scroll Knob Turned Left');
      break;
    case 'ArrowRight':
      console.log('Scroll Knob Turned Right');
      break;
    default:
      break;
  }
}
