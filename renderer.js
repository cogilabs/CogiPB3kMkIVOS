// Example of adding interactivity
document.addEventListener('DOMContentLoaded', () => {
    const interfaceDiv = document.getElementById('interface');
    interfaceDiv.innerText = 'Pip-Boy Initialized';
});

document.addEventListener('keydown', (event) => {
    handleKeyEvent(event.code);
});

function handleKeyEvent(keyCode) {
    switch (keyCode) {
        case 'Digit1':
        console.log('STAT');
        
        break;
        case 'Digit2':
        console.log('INV');
        
        break;
        case 'Digit3':
        console.log('DATA');
        
        break;
        case 'Digit4':
        console.log('MAP');
        
        break;
        case 'Digit5':
        console.log('RADIO');
        
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
