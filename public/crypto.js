/**
 * ShadowP2P - Kriptografik Güvenlik Katmanı
 * Web Crypto API (SubtleCrypto) ile AES-256-GCM Uçtan Uca Şifreleme (E2EE)
 */

const CryptoEngine = (() => {
  // ArrayBuffer <-> Base64
  const bufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const base64ToBuffer = (base64) => {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  /**
   * Oda şifresinden ve oda kodundan 256-bit AES-GCM anahtarı türetir
   * @param {string} secretKey - Kullanıcı tarafından girilen veya oda koduyla oluşturulan gizli anahtar
   * @param {string} roomCode - Tuz (Salt) olarak kullanılan oda kodu
   */
  const deriveAESKey = async (secretKey, roomCode) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secretKey),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const salt = enc.encode(`shadow_salt_${roomCode.toUpperCase()}`);

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true, // exportable for fingerprint calculation
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  };

  /**
   * JSON nesnesini veya veriyi AES-GCM ile şifreler
   * @param {any} data - Şifrelenecek veri nesnesi
   * @param {CryptoKey} key - AES-GCM anahtarı
   */
  const encryptData = async (data, key) => {
    const enc = new TextEncoder();
    const encodedData = enc.encode(JSON.stringify(data));

    // Her mesaj için benzersiz 12-byte (96-bit) IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedData
    );

    return {
      iv: bufferToBase64(iv),
      payload: bufferToBase64(ciphertextBuffer)
    };
  };

  /**
   * Şifrelenmiş veriyi çözer
   * @param {object} encryptedObj - { iv, payload }
   * @param {CryptoKey} key - AES-GCM anahtarı
   */
  const decryptData = async (encryptedObj, key) => {
    const iv = base64ToBuffer(encryptedObj.iv);
    const ciphertext = base64ToBuffer(encryptedObj.payload);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decryptedBuffer));
  };

  /**
   * Güvenlik Parmak İzi (Fingerprint / Safety Number) üretir
   * Her iki tarafın da aynı anahtarı paylaştığını teyit etmesini sağlar (MITM önlemi)
   */
  const getSafetyFingerprint = async (key) => {
    const rawKey = await window.crypto.subtle.exportKey('raw', key);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', rawKey);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // 4'erli bloklar halinde formatla: XXXX-XXXX-XXXX-XXXX
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
  };

  /**
   * Rastgele güvenli oda kodu üretir (örn: GHOST-8F3K)
   */
  const generateRoomCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    const bytes = window.crypto.getRandomValues(new Uint8Array(6));
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  };

  return {
    deriveAESKey,
    encryptData,
    decryptData,
    getSafetyFingerprint,
    generateRoomCode,
    bufferToBase64,
    base64ToBuffer
  };
})();
