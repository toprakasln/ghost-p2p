# 🚀 GitHub Yayınlama Paketi / GitHub Publishing Kit

Bu rehber, **GhostP2P** projesini GitHub'da yayınlarken ihtiyaç duyacağınız tüm başlık, açıklama ve release metinlerini **İngilizce, Almanca, Rusça ve Türkçe** olarak sunar.

---

## 📌 1. GitHub Depo Bilgileri (Repository Setup)

* **Repository Name:** `ghost-p2p`
* **Public / Private:** `Public`
* **Topics (Depo Etiketleri):**
  ```
  p2p, webrtc, e2ee, privacy, anonymous-chat, zero-knowledge, cryptography, security, open-source
  ```

---

## 📝 2. Depo Kısa Açıklaması (About / Description)

GitHub sayfanızın sağ üstündeki **"About -> Edit"** kısmına ekleyebileceğiniz hazır açıklamalar:

### 🇬🇧 English (Önerilen Ana Açıklama)
> Zero-server, zero-knowledge & anonymous Player-to-Player (WebRTC & AES-256-GCM) encrypted messenger. 100% client-side, single-file standalone.

### 🇩🇪 Deutsch (Almanca)
> Serverloser, anonymer Peer-to-Peer (WebRTC & AES-256-GCM) verschlüsselter Messenger. 100 % clientseitig als eigenständige Einzeldatei.

### 🇷🇺 Русский (Rusça)
> Бессерверный анонимный P2P-мессенджер (WebRTC & AES-256-GCM) со сквозным шифрованием. 100% на стороне клиента, в виде одного файла.

### 🇹🇷 Türkçe
> Sunucusuz, sıfır kayıtlı ve tamamen anonim Player-to-Player (WebRTC & AES-256-GCM) uçtan uca şifreli mesajlaşma uygulaması.

---

## 📦 3. GitHub "Release v1.0.0" Yayınlama Metinleri

GitHub'da **Releases -> Draft a new release** diyerek `GhostP2P-Standalone.html` dosyasını ekleyin:

* **Tag version:** `v1.0.0`
* **Release title:** `GhostP2P v1.0.0 — Zero-Server Anonymous P2P Messenger`

### Release Notu (İngilizce - Almanca - Rusça - Türkçe):

```markdown
# 🛡️ GhostP2P v1.0.0 — Stable Release

[English](#english) | [Deutsch](#deutsch) | [Русский](#русский) | [Türkçe](#türkçe)

---

### <a id="english"></a>🇬🇧 English
GhostP2P connects two peers directly device-to-device via WebRTC with hardware AES-256-GCM encryption. No servers, no sign-ups, no traces.

**How to run:**
Download `GhostP2P-Standalone.html` and double-click to run in any browser. No installation needed!

---

### <a id="deutsch"></a>🇩🇪 Deutsch
GhostP2P verbindet zwei Teilnehmer direkt von Gerät zu Gerät über WebRTC mit AES-256-GCM-Verschlüsselung. Keine Server, keine Registrierung, keine Spuren.

**Ausführung:**
Laden Sie `GhostP2P-Standalone.html` herunter und doppelklicken Sie darauf. Keine Installation erforderlich!

---

### <a id="русский"></a>🇷🇺 Русский
GhostP2P соединяет двух собеседников напрямую без серверов через WebRTC с шифрованием AES-256-GCM. Без регистрации, без логов, без серверов.

**Запуск:**
Скачайте файл `GhostP2P-Standalone.html` и запустите двойным кликом в любом браузере.

---

### <a id="türkçe"></a>🇹🇷 Türkçe
GhostP2P, iki cihaz arasında sunucusuz doğrudan WebRTC ve AES-256-GCM şifrelemeyle çalışan anonim mesajlaşma aracıdır.

**Kullanım:**
Aşağıdaki `GhostP2P-Standalone.html` dosyasını indirin ve çift tıklayın. Kurulum gerektirmez!
```

---

## 💻 4. GitHub'a Gönderme Komutları (Terminal)

Depoyu GitHub'a göndermek için proje klasöründe PowerShell veya CMD'de sırayla:

```powershell
git add .
git commit -m "feat: GhostP2P v1.0.0 - Multilingual Zero-Server Anonymous P2P Messenger"
git branch -M main
git remote add origin https://github.com/toprakasln/ghost-p2p.git
git push -u origin main
```
