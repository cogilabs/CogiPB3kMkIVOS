//document.addEventListener('DOMContentLoaded', () => {
  //const submenuItems = document.querySelectorAll('.sub-nav-item');

  // Set initial active state and center the first item
  setActiveAndCenter((document.querySelectorAll('.sub-nav-item'))[0]);  // Assuming the first item should be active

  // Add click event listeners to all submenu items
  (document.querySelectorAll('.sub-nav-item')).forEach(item => {
      item.addEventListener('click', function() {
          setActiveAndCenter(this);
      });
  });
//});

function setActiveAndCenter(selectedItem) {
  const submenuItems = document.querySelectorAll('.sub-nav-item');

  // Remove 'active' class and reset opacity for all items
  submenuItems.forEach(item => {
      item.classList.remove('active');
      item.style.opacity = "0.5";  // Reset opacity
  });

  // Add 'active' class to the clicked or selected item
  selectedItem.classList.add('active');
  selectedItem.style.opacity = "1";

  // Calculate movement to center the clicked or selected item
  const submenu = document.querySelector('.submenu');
  const submenuWidth = submenu.offsetWidth;
  const itemCenter = selectedItem.offsetLeft + selectedItem.offsetWidth / 2;
  const offset = -(itemCenter - submenuWidth / 3.5);  // Adjusted to your specific layout needs
  submenu.style.transform = `translateX(${offset}px)`;

  // Adjust opacity based on distance from active item
  const activeIndex = Array.from(submenuItems).indexOf(selectedItem);
  submenuItems.forEach((item, index) => {
      const distance = Math.abs(index - activeIndex);
      const opacity = Math.max(0.01, 1 - 0.35 * distance);
      item.style.opacity = opacity.toString();
  });
}
