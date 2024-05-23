const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

contextBridge.exposeInMainWorld('electron', {
  getUserHome: () => os.homedir(),
  getLocalProfilePath: () => path.join(os.homedir(), 'pipBoy', 'local.json'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
});
