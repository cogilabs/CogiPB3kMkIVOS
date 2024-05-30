const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 480,
    frame: true,
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });
  win.setFullScreen(true); // Only for the Raspberry Pi
  win.loadFile('index.html');
}

ipcMain.handle('read-file', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(null); // Resolve with null if the file does not exist
        } else {
          reject(err);
        }
      } else {
        resolve(data);
      }
    });
  });
});

ipcMain.handle('get-songs', async () => {
  const musicDir = path.join(__dirname, 'musics');
  return new Promise((resolve, reject) => {
    fs.readdir(musicDir, (err, files) => {
      if (err) {
        reject(err);
      } else {
        const songs = files.filter(file => path.extname(file) === '.mp3').map(file => path.join('musics', file));
        resolve(songs);
      }
    });
  });
});

app.whenReady().then(createWindow);

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
