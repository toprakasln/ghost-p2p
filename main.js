/**
 * GhostP2P - Masaüstü Uygulaması (Electron Main Process)
 * Tek bir bağımsız masaüstü uygulaması olarak çalışır.
 * Harici bir web sitesi veya sunucu gerektirmez.
 */

const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { WebSocketServer, WebSocket } = require('ws');

let mainWindow = null;
let internalServer = null;
let wss = null;
const INTERNAL_PORT = 38921; // Rastgele güvenli yerel port

// ==========================================
// 1. DAHİLİ MİKRO SİNYAL SUNUCUSU (Sadece localhost)
// Harici sunucu kurmadan yerel veya LAN üzerinden sinyalleşmeyi sağlar
// ==========================================
function startInternalSignalingServer() {
  const rooms = new Map();

  internalServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('GhostP2P Internal Engine Running');
  });

  wss = new WebSocketServer({ server: internalServer });

  wss.on('connection', (ws) => {
    let currentRoom = null;

    ws.on('message', (data) => {
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }

      const { type, room } = msg;

      if (type === 'join') {
        if (!room) return;
        const cleanRoom = room.trim().toUpperCase();
        let roomPeers = rooms.get(cleanRoom);
        if (!roomPeers) {
          roomPeers = new Set();
          rooms.set(cleanRoom, roomPeers);
        }

        if (roomPeers.size >= 2) {
          ws.send(JSON.stringify({ type: 'room-full', room: cleanRoom }));
          return;
        }

        roomPeers.add(ws);
        currentRoom = cleanRoom;

        const isInitiator = roomPeers.size === 1;
        ws.send(JSON.stringify({
          type: 'joined',
          room: cleanRoom,
          isInitiator,
          peerCount: roomPeers.size
        }));

        if (roomPeers.size === 2) {
          for (const peer of roomPeers) {
            if (peer !== ws) {
              peer.send(JSON.stringify({ type: 'peer-joined', isInitiator: true }));
            }
          }
        }
        return;
      }

      // Sinyalleşme aktarımı
      if (currentRoom && rooms.has(currentRoom)) {
        const roomPeers = rooms.get(currentRoom);
        for (const peer of roomPeers) {
          if (peer !== ws && peer.readyState === WebSocket.OPEN) {
            peer.send(JSON.stringify(msg));
          }
        }
      }
    });

    const cleanup = () => {
      if (currentRoom && rooms.has(currentRoom)) {
        const roomPeers = rooms.get(currentRoom);
        roomPeers.delete(ws);
        for (const peer of roomPeers) {
          if (peer.readyState === WebSocket.OPEN) {
            peer.send(JSON.stringify({ type: 'peer-left' }));
          }
        }
        if (roomPeers.size === 0) rooms.delete(currentRoom);
        currentRoom = null;
      }
    };

    ws.on('close', cleanup);
    ws.on('error', cleanup);
  });

  internalServer.listen(INTERNAL_PORT, '127.0.0.1');
}

// ==========================================
// 2. MASAÜSTÜ PENCERESİ OLUŞTURMA
// ==========================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 740,
    minWidth: 420,
    minHeight: 600,
    backgroundColor: '#07090e',
    title: 'GhostP2P - Tamamen Anonim Mesajlaşma',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  // index.html'i doğrudan yerel dosya sisteminden yükle (Site gerektirmez!)
  mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Global Panik Kısayolu: Escape tuşuna basıldığında anında gizle/yok et
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript('if (window.triggerPanicProtocol) window.triggerPanicProtocol();');
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startInternalSignalingServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (wss) wss.close();
  if (internalServer) internalServer.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
