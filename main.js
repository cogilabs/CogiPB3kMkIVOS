const { app, BrowserWindow } = require('electron');
const Gpio = require('onoff').Gpio;
const robot = require('robotjs');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 480,
    frame: true,
    useContentSize: true,
  });
  win.setFullScreen(true); // Only for the Raspberry Pi
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  const clk = new Gpio(17, 'in', 'both');
  const dt = new Gpio(18, 'in', 'both');

  let clkLastState = clk.readSync();

  clk.watch((err, clkState) => {
    if (err) {
      console.error('Error watching GPIO:', err);
      return;
    }

    const dtState = dt.readSync();
    if (clkState !== clkLastState) {
      if (dtState !== clkState) {
        robot.keyTap('d'); // Simulate pressing 'D' key
        console.log('Clockwise');
      } else {
        robot.keyTap('a'); // Simulate pressing 'A' key
        console.log('Counterclockwise');
      }
      console.log('Counter updated');
    }
    clkLastState = clkState;
  });

  process.on('SIGINT', () => {
    clk.unexport();
    dt.unexport();
    console.log('GPIO unexported');
    process.exit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
