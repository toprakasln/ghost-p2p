/**
 * ShadowP2P - Electron Preload Script
 * Güvenli izole köprü
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  internalPort: 38921
});
