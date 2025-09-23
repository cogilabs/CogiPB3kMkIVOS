const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWin, overlayWin;

function createWindows() {
  mainWin = new BrowserWindow({
    width: 800,
    height: 480,
    frame: true,
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  // Fullscreen seulement sur la Pi si tu veux
  // if (process.platform !== 'win32') mainWin.setFullScreen(true);

  mainWin.loadFile('index.html');

  // --- Overlay en FENÊTRE ENFANT (reste au-dessus du parent uniquement) ---
  overlayWin = new BrowserWindow({
    parent: mainWin,
    modal: false,
    frame: false,
    transparent: true,
    resizable: false,
    focusable: false,
    hasShadow: false,
    useContentSize: true,
    webPreferences: { backgroundThrottling: false },
    show: false, // on montrera après le premier sync
  });

  overlayWin.setIgnoreMouseEvents(true, { forward: true });
  overlayWin.loadFile('overlay.html');

  const syncToContent = () => {
    if (!mainWin || !overlayWin) return;
    const cb = mainWin.getContentBounds();   // zone client exacte
    overlayWin.setBounds(cb, /*animate*/false);
    if (!overlayWin.isVisible()) overlayWin.showInactive(); // ne prend pas le focus
  };

  // sync initial + resync sur changements
  mainWin.once('ready-to-show', syncToContent);
  overlayWin.once('ready-to-show', syncToContent);
  ['move','resize','enter-full-screen','leave-full-screen'].forEach(ev =>
    mainWin.on(ev, syncToContent)
  );

  // petite sécurité: re-sync après un court délai (Windows / menus)
  setTimeout(syncToContent, 50);
}

// ===== IPCs EXISTANTS (inchangés) =====
ipcMain.handle('read-file', async (_event, filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') resolve(null);
        else reject(err);
      } else resolve(data);
    });
  });
});

ipcMain.handle('get-songs', async () => {
  const musicDir = path.join(__dirname, 'musics');
  return new Promise((resolve, reject) => {
    fs.readdir(musicDir, (err, files) => {
      if (err) reject(err);
      else {
        const songs = files
          .filter(file => path.extname(file) === '.mp3')
          .map(file => path.join('musics', file));
        resolve(songs);
      }
    });
  });
});

// ===== Cycle de vie =====
app.whenReady().then(createWindows);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindows();
});
