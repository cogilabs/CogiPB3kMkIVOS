// renderer.js
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
  
        // Clear existing content and append the new tab content
        interfaceDiv.innerHTML = '';
        interfaceDiv.appendChild(content);
      })
      .catch(error => console.error(`Error loading ${tab} content:`, error));
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
  