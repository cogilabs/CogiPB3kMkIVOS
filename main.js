const { app, BrowserWindow } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 480,
    frame: true,
    useContentSize: true//,
    //webPreferences: {
    //  preload: __dirname + '/preload.js'
    //}
  });
  //win.setFullScreen(true); // ! Only for the raspberry
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);