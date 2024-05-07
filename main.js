const { app, BrowserWindow } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 480//,
    //webPreferences: {
    //  preload: __dirname + '/preload.js'
    //}
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
