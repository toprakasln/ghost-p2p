/**
 * GhostP2P - Minimalist Siyah & Beyaz P2P İstemcisi
 * Doğrudan WebRTC PeerJS + Web Crypto API AES-256-GCM E2EE
 */

(() => {
  // ==========================================
  // 1. CONSTANTS & SETTINGS
  // ==========================================
  const CODENAMES = [
    'Ghost', 'Phantom', 'Alpha', 'Vector', 'Echo', 'Cipher',
    'Shadow', 'Silent', 'Specter', 'Hunter', 'Neutron', 'Prism',
    'Quantum', 'Guardian', 'Zero', 'Apex'
  ];

  const PEER_PREFIX = 'ghostp2p_';

  // ==========================================
  // 2. APPLICATION STATE (RAM ONLY - ZERO LOG)
  // ==========================================
  const state = {
    myAlias: '',
    myAvatarSvg: '',
    peerAlias: 'Anonymous Peer',
    peerAvatarSvg: '',
    roomCode: '',
    sharedSecret: '',
    cryptoKey: null,
    safetyFingerprint: '',
    
    // P2P Bağlantısı (PeerJS / WebRTC)
    peer: null,
    dataConn: null,
    isConnected: false,
    
    // Ayarlar
    audioEnabled: true,
    ephemeralSeconds: 0,
    antiPryingEnabled: true,
    
    // Dosya & Ses aktarımı
    pendingFiles: new Map(),
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,

    // Latency ölçümü
    pingInterval: null
  };

  // ==========================================
  // 3. SES SENTEZLEYİCİ (Minimalist Web Audio)
  // ==========================================
  const AudioEffects = (() => {
    let ctx = null;

    const getContext = () => {
      if (!ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) ctx = new AudioContext();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    };

    const playTone = (freq, type, duration, gainLevel = 0.05) => {
      if (!state.audioEnabled) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(gainLevel, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch {}
    };

    return {
      send: () => playTone(800, 'sine', 0.06),
      receive: () => {
        playTone(600, 'sine', 0.08);
        setTimeout(() => playTone(900, 'sine', 0.08), 70);
      },
      connect: () => {
        playTone(520, 'sine', 0.12);
        setTimeout(() => playTone(780, 'sine', 0.16), 100);
      },
      burn: () => {
        if (!state.audioEnabled) return;
        try {
          const audioCtx = getContext();
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        } catch {}
      }
    };
  })();

  // ==========================================
  // 4. SİYAH-BEYAZ GEOMETRİK AVATAR ÜRETİCİ
  // ==========================================
  const generateMonochromeAvatar = (seedText) => {
    let hash = 0;
    for (let i = 0; i < seedText.length; i++) {
      hash = seedText.charCodeAt(i) + ((hash << 5) - hash);
    }
    const shapeType = Math.abs(hash) % 4;

    let shapeSvg = '';
    if (shapeType === 0) {
      shapeSvg = `<rect x="14" y="14" width="22" height="22" fill="#ffffff" />
                  <circle cx="25" cy="25" r="5" fill="#000000" />`;
    } else if (shapeType === 1) {
      shapeSvg = `<circle cx="25" cy="25" r="14" fill="none" stroke="#ffffff" stroke-width="3" />
                  <circle cx="25" cy="25" r="6" fill="#ffffff" />`;
    } else if (shapeType === 2) {
      shapeSvg = `<polygon points="25,10 40,38 10,38" fill="none" stroke="#ffffff" stroke-width="3" />
                  <line x1="25" y1="18" x2="25" y2="34" stroke="#ffffff" stroke-width="2" />`;
    } else {
      shapeSvg = `<polygon points="25,8 42,25 25,42 8,25" fill="#ffffff" />
                  <rect x="20" y="20" width="10" height="10" fill="#000000" />`;
    }

    return `
      <svg viewBox="0 0 50 50" width="100%" height="100%">
        ${shapeSvg}
      </svg>
    `;
  };

  const randomizeIdentity = () => {
    const randomAlias = CODENAMES[Math.floor(Math.random() * CODENAMES.length)] + ' ' + Math.floor(10 + Math.random() * 90);
    state.myAlias = randomAlias;
    state.myAvatarSvg = generateMonochromeAvatar(randomAlias);

    const aliasInput = document.getElementById('aliasInput');
    const myAvatarElem = document.getElementById('myAvatar');
    if (aliasInput) aliasInput.value = state.myAlias;
    if (myAvatarElem) myAvatarElem.innerHTML = state.myAvatarSvg;
  };

  // ==========================================
  // 5. DOM ELEMENTLERİ
  // ==========================================
  const dom = {
    lobbyView: document.getElementById('lobbyView'),
    chatView: document.getElementById('chatView'),
    privacyShield: document.getElementById('privacyShield'),
    unshieldBtn: document.getElementById('unshieldBtn'),
    
    connectionPill: document.getElementById('connectionPill'),
    connectionText: document.getElementById('connectionText'),
    pingBadge: document.getElementById('pingBadge'),
    pingValue: document.getElementById('pingValue'),
    fingerprintBtn: document.getElementById('fingerprintBtn'),
    toggleAudioBtn: document.getElementById('toggleAudioBtn'),
    toggleShieldBtn: document.getElementById('toggleShieldBtn'),
    panicBtn: document.getElementById('panicBtn'),
    
    aliasInput: document.getElementById('aliasInput'),
    randomizeAliasBtn: document.getElementById('randomizeAliasBtn'),
    myAvatar: document.getElementById('myAvatar'),
    
    generatedRoomCode: document.getElementById('generatedRoomCode'),
    copyRoomLinkBtn: document.getElementById('copyRoomLinkBtn'),
    joinRoomInput: document.getElementById('joinRoomInput'),
    joinRoomBtn: document.getElementById('joinRoomBtn'),
    sharedSecretInput: document.getElementById('sharedSecretInput'),
    
    peerAvatar: document.getElementById('peerAvatar'),
    peerAliasName: document.getElementById('peerAliasName'),
    peerStatusBadge: document.getElementById('peerStatusBadge'),
    activeRoomLabel: document.getElementById('activeRoomLabel'),
    ephemeralSelect: document.getElementById('ephemeralSelect'),
    leaveChatBtn: document.getElementById('leaveChatBtn'),
    messageStream: document.getElementById('messageStream'),
    typingIndicator: document.getElementById('typingIndicator'),
    fileTransferProgress: document.getElementById('fileTransferProgress'),
    transferFileName: document.getElementById('transferFileName'),
    transferPercentage: document.getElementById('transferPercentage'),
    transferProgressBar: document.getElementById('transferProgressBar'),
    fileInput: document.getElementById('fileInput'),
    attachBtn: document.getElementById('attachBtn'),
    recordAudioBtn: document.getElementById('recordAudioBtn'),
    messageInput: document.getElementById('messageInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),

    fingerprintModal: document.getElementById('fingerprintModal'),
    safetyFingerprintDisplay: document.getElementById('safetyFingerprintDisplay'),
    legalModal: document.getElementById('legalModal'),
    openLegalModalBtn: document.getElementById('openLegalModalBtn'),
    closeModalBtns: document.querySelectorAll('.close-modal-btn')
  };

  // ==========================================
  // 6. ARAYÜZ YARDIMCILARI
  // ==========================================
  const setStatus = (statusClass, text) => {
    dom.connectionPill.className = `status-pill ${statusClass}`;
    dom.connectionText.textContent = text;
  };

  const switchView = (viewName) => {
    if (viewName === 'chat') {
      dom.lobbyView.classList.remove('active-view');
      dom.chatView.classList.add('active-view');
      dom.fingerprintBtn.classList.remove('hidden');
    } else {
      dom.chatView.classList.remove('active-view');
      dom.lobbyView.classList.add('active-view');
      dom.pingBadge.classList.add('hidden');
      dom.fingerprintBtn.classList.add('hidden');
    }
  };

  const scrollToBottom = () => {
    dom.messageStream.scrollTop = dom.messageStream.scrollHeight;
  };

  // ==========================================
  // 7. ŞİFRELEME HAZIRLIĞI (AES-256-GCM)
  // ==========================================
  const setupEncryptionKey = async (roomCode, secret) => {
    const rawSecret = (secret && secret.trim().length > 0) ? secret.trim() : `SEC_${roomCode}`;
    state.cryptoKey = await CryptoEngine.deriveAESKey(rawSecret, roomCode);
    state.safetyFingerprint = await CryptoEngine.getSafetyFingerprint(state.cryptoKey);
    dom.safetyFingerprintDisplay.textContent = state.safetyFingerprint;
  };

  // ==========================================
  // 8. TEK TIKLA PEERJS DOĞRUDAN P2P BAĞLANTISI
  // (Harici sunucu gerektirmez, doğrudan P2P el sıkışır)
  // ==========================================
  const generateCleanRoomCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    const bytes = window.crypto.getRandomValues(new Uint8Array(6));
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  };

  const initHostPeer = (roomCode) => {
    state.roomCode = roomCode;
    dom.generatedRoomCode.textContent = roomCode;

    if (state.peer) {
      try { state.peer.destroy(); } catch {}
    }

    const fullPeerId = `${PEER_PREFIX}${roomCode}`;
    const peer = new Peer(fullPeerId, {
      debug: 0
    });
    state.peer = peer;

    peer.on('open', () => {
      setStatus('status-connecting', 'Room Ready (Waiting)');
    });

    peer.on('connection', (conn) => {
      bindConnection(conn, roomCode);
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        const newCode = generateCleanRoomCode();
        initHostPeer(newCode);
      } else {
        console.warn('PeerJS State:', err.type);
      }
    });
  };

  const connectToRoom = (targetRoomCode) => {
    const cleanCode = targetRoomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode || cleanCode.length < 4) {
      alert('Please enter a valid room code.');
      return;
    }

    state.roomCode = cleanCode;
    setStatus('status-connecting', 'Connecting...');

    if (state.peer) {
      try { state.peer.destroy(); } catch {}
    }

    const clientPeer = new Peer({ debug: 0 });
    state.peer = clientPeer;

    clientPeer.on('open', () => {
      const conn = clientPeer.connect(`${PEER_PREFIX}${cleanCode}`, {
        reliable: true
      });
      bindConnection(conn, cleanCode);
    });

    clientPeer.on('error', (err) => {
      alert('Failed to connect to room. Please check the code.');
      setStatus('status-disconnected', 'Error');
    });
  };

  // Bind DataConnection events
  const bindConnection = async (conn, roomCode) => {
    state.dataConn = conn;

    conn.on('open', async () => {
      state.isConnected = true;
      setStatus('status-connected', 'P2P Connected');
      dom.peerStatusBadge.className = 'badge badge-success';
      dom.peerStatusBadge.textContent = 'Direct P2P';
      dom.activeRoomLabel.textContent = `Room: ${roomCode}`;

      await setupEncryptionKey(roomCode, dom.sharedSecretInput.value);

      sendP2PPacket({
        action: 'handshake',
        alias: state.myAlias,
        avatarSvg: state.myAvatarSvg
      });

      switchView('chat');
      AudioEffects.connect();
      startPingMonitor();
    });

    conn.on('data', async (data) => {
      handleIncomingPacket(data);
    });

    conn.on('close', () => {
      state.isConnected = false;
      setStatus('status-disconnected', 'Disconnected');
      dom.peerStatusBadge.className = 'badge badge-warning';
      dom.peerStatusBadge.textContent = 'Left';
      appendSystemMessage('Peer has left the room.');
      stopPingMonitor();
    });

    conn.on('error', (err) => {
      console.warn('P2P Connection error:', err);
    });
  };

  // ==========================================
  // 9. ŞİFRELİ PAKET İLETİMİ & İŞLEME (AES-256)
  // ==========================================
  const sendP2PPacket = async (packetObj) => {
    if (!state.dataConn || !state.dataConn.open) {
      return false;
    }

    try {
      const encrypted = await CryptoEngine.encryptData(packetObj, state.cryptoKey);
      state.dataConn.send(encrypted);
      return true;
    } catch (err) {
      console.error('Şifreleme hatası:', err);
      return false;
    }
  };

  const handleIncomingPacket = async (encryptedData) => {
    let payload;
    try {
      payload = await CryptoEngine.decryptData(encryptedData, state.cryptoKey);
    } catch (err) {
      console.error('Paket çözülemedi:', err);
      return;
    }

    const { action } = payload;

    if (action === 'handshake') {
      state.peerAlias = payload.alias || 'Anonymous';
      state.peerAvatarSvg = payload.avatarSvg || generateMonochromeAvatar(state.peerAlias);
      dom.peerAliasName.textContent = state.peerAlias;
      dom.peerAvatar.innerHTML = state.peerAvatarSvg;

      sendP2PPacket({
        action: 'handshake_ack',
        alias: state.myAlias,
        avatarSvg: state.myAvatarSvg
      });
      return;
    }

    if (action === 'handshake_ack') {
      state.peerAlias = payload.alias || 'Anonymous';
      state.peerAvatarSvg = payload.avatarSvg || generateMonochromeAvatar(state.peerAlias);
      dom.peerAliasName.textContent = state.peerAlias;
      dom.peerAvatar.innerHTML = state.peerAvatarSvg;
      return;
    }

    if (action === 'chat_message') {
      AudioEffects.receive();
      renderIncomingMessage(payload);
      sendP2PPacket({ action: 'receipt', msgId: payload.id });
      return;
    }

    if (action === 'receipt') {
      markMessageAsDelivered(payload.msgId);
      return;
    }

    if (action === 'typing') {
      showTypingIndicator(payload.isTyping);
      return;
    }

    if (action === 'ping') {
      sendP2PPacket({ action: 'pong', sendTime: payload.sendTime });
      return;
    }

    if (action === 'pong') {
      const rtt = Math.round(Date.now() - payload.sendTime);
      dom.pingValue.textContent = `${rtt} ms`;
      dom.pingBadge.classList.remove('hidden');
      return;
    }

    if (action === 'file_chunk') {
      handleIncomingFileChunk(payload);
      return;
    }

    if (action === 'voice_note') {
      AudioEffects.receive();
      renderVoiceNoteMessage(payload, false);
      return;
    }
  };

  // ==========================================
  // 10. METİN MESAJI İŞLEMLERİ
  // ==========================================
  const sendChatMessage = async () => {
    const text = dom.messageInput.value.trim();
    if (!text) return;

    const msgId = 'msg_' + Date.now();
    const ephemeral = parseInt(dom.ephemeralSelect.value, 10) || 0;

    const packet = {
      action: 'chat_message',
      id: msgId,
      text: text,
      timestamp: Date.now(),
      ephemeral: ephemeral
    };

    const sent = await sendP2PPacket(packet);
    if (sent) {
      dom.messageInput.value = '';
      dom.messageInput.style.height = 'auto';
      renderOutgoingMessage(packet);
      AudioEffects.send();
    }
  };

  const renderOutgoingMessage = (packet) => {
    const row = document.createElement('div');
    row.className = 'message-row sent';
    row.id = packet.id;

    const timeStr = new Date(packet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let burnBarHtml = '';
    if (packet.ephemeral > 0) {
      burnBarHtml = `<div class="burn-bar" style="animation-duration: ${packet.ephemeral}s"></div>`;
    }

    row.innerHTML = `
      <div class="message-bubble">
        <div class="message-text">${escapeHtml(packet.text)}</div>
        ${burnBarHtml}
      </div>
      <div class="message-meta">
        <span>${timeStr}</span>
        <span id="receipt_${packet.id}">✓</span>
        ${packet.ephemeral > 0 ? `<span>⏳ ${packet.ephemeral}s</span>` : ''}
      </div>
    `;

    dom.messageStream.appendChild(row);
    scrollToBottom();

    if (packet.ephemeral > 0) {
      setupSelfDestruct(row, packet.ephemeral);
    }
  };

  const renderIncomingMessage = (packet) => {
    const row = document.createElement('div');
    row.className = 'message-row received';
    row.id = packet.id;

    const timeStr = new Date(packet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let burnBarHtml = '';
    if (packet.ephemeral > 0) {
      burnBarHtml = `<div class="burn-bar" style="animation-duration: ${packet.ephemeral}s"></div>`;
    }

    row.innerHTML = `
      <div class="message-bubble">
        <div class="message-text">${escapeHtml(packet.text)}</div>
        ${burnBarHtml}
      </div>
      <div class="message-meta">
        <span>${timeStr}</span>
        ${packet.ephemeral > 0 ? `<span>⏳ ${packet.ephemeral}s</span>` : ''}
      </div>
    `;

    dom.messageStream.appendChild(row);
    scrollToBottom();

    if (packet.ephemeral > 0) {
      setupSelfDestruct(row, packet.ephemeral);
    }
  };

  const markMessageAsDelivered = (msgId) => {
    const receiptElem = document.getElementById(`receipt_${msgId}`);
    if (receiptElem) {
      receiptElem.textContent = '✓✓';
    }
  };

  const setupSelfDestruct = (element, seconds) => {
    setTimeout(() => {
      AudioEffects.burn();
      element.style.transition = 'opacity 0.3s ease';
      element.style.opacity = '0';
      setTimeout(() => {
        if (element.parentNode) element.parentNode.removeChild(element);
      }, 300);
    }, seconds * 1000);
  };

  const appendSystemMessage = (text) => {
    const msg = document.createElement('div');
    msg.className = 'system-message';
    msg.innerHTML = `<div class="system-bubble">${text}</div>`;
    dom.messageStream.appendChild(msg);
    scrollToBottom();
  };

  // ==========================================
  // 11. DOSYA & GÖRSEL TRANSFERİ (P2P CHUNKING)
  // ==========================================
  const CHUNK_SIZE = 16384;

  const sendFileP2P = async (file) => {
    if (!state.dataConn || !state.dataConn.open) {
      alert('P2P bağlantısı aktif değil.');
      return;
    }

    const transferId = 'file_' + Date.now();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const isImage = file.type.startsWith('image/');

    dom.fileTransferProgress.classList.remove('hidden');
    dom.transferFileName.textContent = `${file.name} (${formatBytes(file.size)})`;
    dom.transferPercentage.textContent = '0%';
    dom.transferProgressBar.style.width = '0%';

    const reader = new FileReader();
    let currentChunk = 0;

    reader.onload = async (e) => {
      const buffer = e.target.result;
      const base64Chunk = CryptoEngine.bufferToBase64(buffer);

      await sendP2PPacket({
        action: 'file_chunk',
        transferId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        chunkIndex: currentChunk,
        totalChunks,
        data: base64Chunk
      });

      currentChunk++;
      const percent = Math.round((currentChunk / totalChunks) * 100);
      dom.transferPercentage.textContent = `${percent}%`;
      dom.transferProgressBar.style.width = `${percent}%`;

      if (currentChunk < totalChunks) {
        readNextChunk();
      } else {
        setTimeout(() => dom.fileTransferProgress.classList.add('hidden'), 800);
        renderFileMessage({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          dataUrl: isImage ? URL.createObjectURL(file) : null,
          blob: file
        }, true);
      }
    };

    const readNextChunk = () => {
      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const slice = file.slice(start, end);
      reader.readAsArrayBuffer(slice);
    };

    readNextChunk();
  };

  const handleIncomingFileChunk = (payload) => {
    const { transferId, fileName, fileSize, fileType, chunkIndex, totalChunks, data } = payload;

    if (!state.pendingFiles.has(transferId)) {
      state.pendingFiles.set(transferId, {
        name: fileName,
        size: fileSize,
        type: fileType,
        chunks: new Array(totalChunks),
        receivedCount: 0
      });
      dom.fileTransferProgress.classList.remove('hidden');
      dom.transferFileName.textContent = `Alınıyor: ${fileName}`;
    }

    const transfer = state.pendingFiles.get(transferId);
    transfer.chunks[chunkIndex] = CryptoEngine.base64ToBuffer(data);
    transfer.receivedCount++;

    const percent = Math.round((transfer.receivedCount / totalChunks) * 100);
    dom.transferPercentage.textContent = `${percent}%`;
    dom.transferProgressBar.style.width = `${percent}%`;

    if (transfer.receivedCount === totalChunks) {
      setTimeout(() => dom.fileTransferProgress.classList.add('hidden'), 600);
      const completeBlob = new Blob(transfer.chunks, { type: transfer.type });
      const isImage = transfer.type.startsWith('image/');
      const dataUrl = isImage ? URL.createObjectURL(completeBlob) : null;

      AudioEffects.receive();
      renderFileMessage({
        fileName: transfer.name,
        fileSize: transfer.size,
        fileType: transfer.type,
        dataUrl,
        blob: completeBlob
      }, false);

      state.pendingFiles.delete(transferId);
    }
  };

  const renderFileMessage = (fileObj, isSent) => {
    const row = document.createElement('div');
    row.className = `message-row ${isSent ? 'sent' : 'received'}`;

    let mediaContent = '';
    if (fileObj.dataUrl && fileObj.fileType.startsWith('image/')) {
      mediaContent = `<div class="image-preview-bubble"><img src="${fileObj.dataUrl}" alt="P2P Görsel" /></div>`;
    }

    const downloadBtnId = 'dl_' + Math.random().toString(36).substr(2, 8);

    row.innerHTML = `
      <div class="message-bubble">
        ${mediaContent}
        <div class="file-attachment-bubble">
          <span class="file-icon">📁</span>
          <div class="file-info">
            <div class="file-name">${escapeHtml(fileObj.fileName)}</div>
            <div class="file-size">${formatBytes(fileObj.fileSize)}</div>
          </div>
          <button id="${downloadBtnId}" class="file-download-btn">İndir</button>
        </div>
      </div>
      <div class="message-meta">
        <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        ${isSent ? '<span>✓✓</span>' : ''}
      </div>
    `;

    dom.messageStream.appendChild(row);
    scrollToBottom();

    setTimeout(() => {
      const btn = document.getElementById(downloadBtnId);
      if (btn) {
        btn.onclick = () => {
          const url = URL.createObjectURL(fileObj.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileObj.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
      }
    }, 50);
  };

  // ==========================================
  // 12. P2P SESLİ MESAJ
  // ==========================================
  const setupVoiceRecording = () => {
    dom.recordAudioBtn.addEventListener('click', async () => {
      if (state.isRecording) {
        stopVoiceRecording();
      } else {
        startVoiceRecording();
      }
    });
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaRecorder = new MediaRecorder(stream);
      state.audioChunks = [];

      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) state.audioChunks.push(e.data);
      };

      state.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = CryptoEngine.bufferToBase64(arrayBuffer);

        await sendP2PPacket({
          action: 'voice_note',
          audioData: base64Audio,
          timestamp: Date.now()
        });

        renderVoiceNoteMessage({
          audioData: base64Audio,
          timestamp: Date.now()
        }, true);

        stream.getTracks().forEach(track => track.stop());
      };

      state.mediaRecorder.start();
      state.isRecording = true;
      dom.recordAudioBtn.classList.add('recording-active');
    } catch (err) {
      alert('Mikrofon erişimi sağlanamadı: ' + err.message);
    }
  };

  const stopVoiceRecording = () => {
    if (state.mediaRecorder && state.isRecording) {
      state.mediaRecorder.stop();
      state.isRecording = false;
      dom.recordAudioBtn.classList.remove('recording-active');
    }
  };

  const renderVoiceNoteMessage = (payload, isSent) => {
    const row = document.createElement('div');
    row.className = `message-row ${isSent ? 'sent' : 'received'}`;

    const playBtnId = 'play_' + Math.random().toString(36).substr(2, 8);
    const buffer = CryptoEngine.base64ToBuffer(payload.audioData);
    const audioBlob = new Blob([buffer], { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);

    row.innerHTML = `
      <div class="message-bubble">
        <div class="audio-player-bubble">
          <button id="${playBtnId}" class="audio-play-btn">▶</button>
          <div class="audio-waveform-stub">
            <div class="wave-bar" style="height: 40%"></div>
            <div class="wave-bar" style="height: 80%"></div>
            <div class="wave-bar" style="height: 100%"></div>
            <div class="wave-bar" style="height: 60%"></div>
            <div class="wave-bar" style="height: 70%"></div>
            <div class="wave-bar" style="height: 40%"></div>
          </div>
          <audio src="${audioUrl}" preload="auto"></audio>
        </div>
      </div>
      <div class="message-meta">
        <span>${new Date(payload.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        ${isSent ? '<span>✓✓</span>' : ''}
      </div>
    `;

    dom.messageStream.appendChild(row);
    scrollToBottom();

    setTimeout(() => {
      const btn = document.getElementById(playBtnId);
      const audioElem = row.querySelector('audio');
      if (btn && audioElem) {
        btn.onclick = () => {
          if (audioElem.paused) {
            audioElem.play();
            btn.textContent = '⏸';
          } else {
            audioElem.pause();
            btn.textContent = '▶';
          }
        };
        audioElem.onended = () => {
          btn.textContent = '▶';
        };
      }
    }, 50);
  };

  // ==========================================
  // 13. YAZIYOR VE LATENCY (PING)
  // ==========================================
  let typingTimeout = null;
  const sendTypingNotification = (isTyping) => {
    sendP2PPacket({ action: 'typing', isTyping });
  };

  const showTypingIndicator = (isTyping) => {
    if (isTyping) {
      dom.typingText.textContent = `${state.peerAlias} yazıyor...`;
      dom.typingIndicator.classList.remove('hidden');
      scrollToBottom();
    } else {
      dom.typingIndicator.classList.add('hidden');
    }
  };

  const startPingMonitor = () => {
    stopPingMonitor();
    state.pingInterval = setInterval(() => {
      if (state.dataConn && state.dataConn.open) {
        sendP2PPacket({ action: 'ping', sendTime: Date.now() });
      }
    }, 4000);
  };

  const stopPingMonitor = () => {
    if (state.pingInterval) {
      clearInterval(state.pingInterval);
      state.pingInterval = null;
    }
  };

  // ==========================================
  // 14. GÜVENLİK & PANİK PROTOKOLÜ
  // ==========================================
  const triggerPanicProtocol = () => {
    try { if (state.dataConn) state.dataConn.close(); } catch {}
    try { if (state.peer) state.peer.destroy(); } catch {}
    state.cryptoKey = null;
    state.pendingFiles.clear();
    state.audioChunks = [];
    dom.messageStream.innerHTML = '';
    window.location.replace('https://www.google.com');
  };

  const setupAntiPryingShield = () => {
    window.addEventListener('blur', () => {
      if (state.antiPryingEnabled && state.isConnected) {
        dom.privacyShield.classList.remove('hidden');
      }
    });

    dom.unshieldBtn.addEventListener('click', () => {
      dom.privacyShield.classList.add('hidden');
    });

    dom.toggleShieldBtn.addEventListener('click', () => {
      state.antiPryingEnabled = !state.antiPryingEnabled;
      dom.toggleShieldBtn.style.color = state.antiPryingEnabled ? 'var(--text-white)' : 'var(--text-dim)';
      if (!state.antiPryingEnabled) dom.privacyShield.classList.add('hidden');
    });
  };

  // ==========================================
  // 15. ETKİLEŞİM & OLAY DİNLEYİCİLERİ
  // ==========================================
  const setupEventListeners = () => {
    // İsim & Avatar yenileme
    dom.randomizeAliasBtn.onclick = randomizeIdentity;
    dom.aliasInput.oninput = (e) => {
      state.myAlias = e.target.value.trim() || 'Anonim';
      state.myAvatarSvg = generateMonochromeAvatar(state.myAlias);
      dom.myAvatar.innerHTML = state.myAvatarSvg;
    };

    // Ses bildirimleri
    dom.toggleAudioBtn.onclick = () => {
      state.audioEnabled = !state.audioEnabled;
      dom.toggleAudioBtn.style.color = state.audioEnabled ? 'var(--text-white)' : 'var(--text-dim)';
    };

    // Panic
    dom.panicBtn.onclick = () => {
      if (confirm('WARNING: All connections, encryption keys, and message history will be destroyed. Are you sure?')) {
        triggerPanicProtocol();
      }
    };

    // Copy room link
    dom.copyRoomLinkBtn.onclick = () => {
      const url = `${window.location.origin}${window.location.pathname}#${state.roomCode}`;
      navigator.clipboard.writeText(url).then(() => {
        dom.copyRoomLinkBtn.textContent = '✓ Copied!';
        setTimeout(() => dom.copyRoomLinkBtn.textContent = '📋 Copy Link', 2000);
      }).catch(() => {
        // Fallback copy code only
        navigator.clipboard.writeText(state.roomCode);
        dom.copyRoomLinkBtn.textContent = '✓ Code Copied!';
        setTimeout(() => dom.copyRoomLinkBtn.textContent = '📋 Copy Link', 2000);
      });
    };

    // Join room button
    dom.joinRoomBtn.onclick = () => {
      connectToRoom(dom.joinRoomInput.value);
    };

    dom.joinRoomInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        connectToRoom(dom.joinRoomInput.value);
      }
    };

    // Leave room
    dom.leaveChatBtn.onclick = () => {
      if (confirm('Are you sure you want to leave the chat?')) {
        try { if (state.dataConn) state.dataConn.close(); } catch {}
        switchView('lobby');
        initHostPeer(generateCleanRoomCode());
      }
    };

    // Mesaj gönderme
    dom.sendMessageBtn.onclick = sendChatMessage;
    dom.messageInput.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      } else {
        sendTypingNotification(true);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => sendTypingNotification(false), 1500);
      }
    };

    // Dosya gönderme
    dom.attachBtn.onclick = () => dom.fileInput.click();
    dom.fileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        sendFileP2P(e.target.files[0]);
        dom.fileInput.value = '';
      }
    };

    // Modallar
    dom.fingerprintBtn.onclick = () => {
      dom.fingerprintModal.classList.remove('hidden');
    };

    if (dom.openLegalModalBtn) {
      dom.openLegalModalBtn.onclick = () => {
        if (dom.legalModal) dom.legalModal.classList.remove('hidden');
      };
    }

    dom.closeModalBtns.forEach(btn => {
      btn.onclick = () => {
        if (dom.fingerprintModal) dom.fingerprintModal.classList.add('hidden');
        if (dom.legalModal) dom.legalModal.classList.add('hidden');
      };
    });

    // Ephemeral seçici
    dom.ephemeralSelect.onchange = (e) => {
      state.ephemeralSeconds = parseInt(e.target.value, 10) || 0;
    };
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ==========================================
  // BAŞLATMA (INIT)
  // ==========================================
  const init = () => {
    randomizeIdentity();
    setupEventListeners();
    setupVoiceRecording();
    setupAntiPryingShield();

    // URL'de #ODA_KODU varsa doğrudan katıl
    const hash = window.location.hash.replace('#', '').trim().toUpperCase();
    if (hash && hash.length >= 4) {
      dom.joinRoomInput.value = hash;
      connectToRoom(hash);
    } else {
      // Varsayılan olarak rastgele bir oda aç ve bekle
      const roomCode = generateCleanRoomCode();
      initHostPeer(roomCode);
    }

    window.triggerPanicProtocol = triggerPanicProtocol;
  };

  window.addEventListener('DOMContentLoaded', init);
})();
