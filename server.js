/**
 * ShadowP2P - Tamamen Anonim Player-to-Player Sinyal Sunucusu
 * 
 * SIFIR KAYIT (ZERO LOG) POLİTİKASI:
 * - Mesaj içerikleri sunucuya ASLA GELMEZ (WebRTC DataChannel ile doğrudan P2P iletilir).
 * - IP adresleri kaydedilmez veya saklanmaz.
 * - Disk üzerine hiçbir veritabanı veya log yazılmaz.
 * - Sadece WebRTC el sıkışması (SDP Offer/Answer ve ICE Candidate) için geçici RAM içi sinyalleşme görevi görür.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

// Static file HTTP server
const server = http.createServer((req, res) => {
  // CORS & Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');

  let safePath = path.normalize(decodeURI(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security: ensure requested path is inside PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Erişim Reddedildi');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 - Sayfa Bulunamadı');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

// WebSocket Signaling Server
const wss = new WebSocketServer({ server });

// In-memory room storage (RAM only, auto-purged on disconnect)
// Map<roomCode, Set<WebSocket>>
const rooms = new Map();

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
      if (!room || typeof room !== 'string') return;
      
      const cleanRoom = room.trim().toUpperCase();
      let roomPeers = rooms.get(cleanRoom);

      if (!roomPeers) {
        roomPeers = new Set();
        rooms.set(cleanRoom, roomPeers);
      }

      // 1-on-1 private P2P rooms (max 2 participants)
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

      // If second peer joined, notify both peers to start WebRTC negotiation
      if (roomPeers.size === 2) {
        for (const peer of roomPeers) {
          if (peer !== ws) {
            peer.send(JSON.stringify({ type: 'peer-joined', isInitiator: true }));
          }
        }
      }
      return;
    }

    // Blind relay of WebRTC signaling payloads (offer, answer, ice-candidate, leave)
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

      // Notify other peer if still present
      for (const peer of roomPeers) {
        if (peer.readyState === WebSocket.OPEN) {
          peer.send(JSON.stringify({ type: 'peer-left' }));
        }
      }

      // Purge empty rooms from RAM immediately
      if (roomPeers.size === 0) {
        rooms.delete(currentRoom);
      }
      currentRoom = null;
    }
  };

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(` 🛡️  ShadowP2P - Anonim Player-to-Player Mesajlaşma`);
  console.log(` 🌐 Sunucu Adresi: http://localhost:${PORT}`);
  console.log(` 🔒 Güvenlik: Uçtan Uca Şifreli (E2EE) + WebRTC P2P`);
  console.log(` 🗑️  Loglama: KAPALI (Sıfır İz & Sıfır Veri Tabanı)`);
  console.log(`======================================================\n`);
});
