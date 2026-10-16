# 🛡️ GhostP2P

> **Completely Anonymous, Zero-Server & Zero-Knowledge Player-to-Player (P2P) Encrypted Messenger**  
> *Vollständig anonymer, serverloser Peer-to-Peer Messenger | Полностью анонимный бессерверный P2P-мессенджер | Tamamen Anonim ve Sunucusuz P2P Mesajlaşma*

[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Anonymous-brightgreen.svg)](#)
[![Architecture](https://img.shields.io/badge/Architecture-P2P%20WebRTC-black.svg)](#)
[![Encryption](https://img.shields.io/badge/E2EE-AES--256--GCM-white.svg)](#)
[![Server](https://img.shields.io/badge/Server-Zero%20Hosting%20Needed-lightgrey.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

### 🌐 Language Navigation / Dil Seçimi
* [🇬🇧 English](#-english)
* [🇩🇪 Deutsch](#-deutsch)
* [🇷🇺 Русский](#-русский)
* [🇹🇷 Türkçe](#-türkçe)

---

## 🇬🇧 English

### Overview
**GhostP2P** is an ultra-minimalist, black-and-white, zero-server messaging application designed for absolute privacy. It connects two participants directly (Player-to-Player) via **WebRTC DataChannels** with client-side **AES-256-GCM** hardware encryption using the standard Web Crypto API.

* ❌ **No Servers to Host:** No central backend, no hosting fees, no database.
* ❌ **No Registration:** No phone numbers, emails, passwords, or usernames.
* ❌ **Zero Logs:** Everything stays in volatile RAM; destroyed on exit.
* ✅ **1-Click Connection:** Generate a 6-character room code or share a direct link.
* ✅ **Single-File Standalone:** Double-click [`GhostP2P-Standalone.html`](./GhostP2P-Standalone.html) to run instantly in any browser with zero installation.
* ✅ **P2P File & Voice Transfer:** Send encrypted photos, files, and voice notes directly device-to-device.
* ✅ **Ephemeral Messages & Panic Button:** Self-destruct timers (5s to 60s) and instant trace-wipe panic redirect.

### Quick Start
1. Download [`GhostP2P-Standalone.html`](./GhostP2P-Standalone.html).
2. Double-click to open in any web browser (or Tor Browser / Brave).
3. Click **"Copy Link"** and share it with your peer. Once they open it, you are directly connected!

### ⚖️ Legal Disclaimer
This software is provided strictly for academic, educational, and cybersecurity research purposes. The developers do not host, operate, or maintain any service, server, or database and have zero access to communications. Users assume sole responsibility for compliance with all local laws. See [`DISCLAIMER.md`](./DISCLAIMER.md) and [`LICENSE`](./LICENSE).

---

## 🇩🇪 Deutsch

### Übersicht
**GhostP2P** ist ein minimalistischer Schwarz-Weiß-Messenger ohne Serveranforderung, der für kompromisslose Privatsphäre entwickelt wurde. Er verbindet zwei Teilnehmer direkt von Gerät zu Gerät (Player-to-Player) über **WebRTC-Datenkanäle** mit nativer **AES-256-GCM**-Ende-zu-Ende-Verschlüsselung (Web Crypto API).

* ❌ **Keine Server erforderlich:** Keine Datenbank, kein Hosting, keine zentralen Relais.
* ❌ **Keine Registrierung:** Keine Telefonnummern, E-Mails, Benutzernamen oder Konten.
* ❌ **Null Protokolle:** Alle Daten verbleiben ausschließlich im flüchtigen RAM und werden beim Schließen gelöscht.
* ✅ **1-Klick-Verbindung:** Generieren Sie einen 6-stelligen Raumcode oder teilen Sie einen direkten Link.
* ✅ **Einzeldatei-Version:** Starten Sie [`GhostP2P-Standalone.html`](./GhostP2P-Standalone.html) durch einfachen Doppelklick ohne Installation.
* ✅ **Direkter Datei- und Sprachversand:** Übertragen Sie verschlüsselte Bilder, Dateien und Sprachnachrichten direkt P2P.
* ✅ **Selbstzerstörende Nachrichten & Panik-Taste:** Timer von 5 bis 60 Sekunden und sofortige Speicherlöschung per Knopfdruck.

### Schnellstart
1. Laden Sie die Datei [`GhostP2P-Standalone.html`](./GhostP2P-Standalone.html) herunter.
2. Öffnen Sie die Datei mit einem Doppelklick in einem beliebigen Browser (oder Tor Browser).
3. Klicken Sie auf **"Link kopieren"** und senden Sie ihn an Ihren Gesprächspartner. Sobald dieser beitritt, steht die Direktverbindung!

### ⚖️ Haftungsausschluss
Diese Software dient ausschließlich akademischen, Bildungs- und Sicherheitsforschungszwecken. Die Entwickler betreiben weder Server noch Infrastruktur und haben keinerlei Zugriff auf übertragene Daten. Siehe [`DISCLAIMER.md`](./DISCLAIMER.md).

---

## 🇷🇺 Русский

### Описание
**GhostP2P** — это ультраминималистичный черно-белый бессерверный мессенджер, созданный для обеспечения абсолютной конфиденциальности. Он соединяет двух собеседников напрямую (Player-to-Player) через каналы **WebRTC DataChannel** с аппаратным сквозным шифрованием **AES-256-GCM** на базе Web Crypto API.

* ❌ **Без серверов:** Не требует развертывания серверов, баз данных или расходов на хостинг.
* ❌ **Без регистрации:** Не требуются номера телефонов, почта, пароли или учетные записи.
* ❌ **Нулевое хранение (Zero-Log):** Все данные хранятся только в оперативной памяти (RAM) и уничтожаются при выходе.
* ✅ **Подключение в 1 клик:** Сгенерируйте 6-значный код комнаты или отправьте прямую ссылку собеседнику.
* ✅ **Автономный единый файл:** Скачайте [`GhostP2P-Standalone.html`](./GhostP2P-Standalone.html) и запустите двойным кликом в любом браузере без установки.
* ✅ **Прямая передача файлов и аудио:** Отправляйте зашифрованные фотографии, файлы и голосовые заметки напрямую P2P.
* ✅ **Самоуничтожающиеся сообщения и кнопка «Паника»:** Таймеры удаления (от 5 до 60 секунд) и мгновенная очистка памяти.

### Быстрый старт
1. Скачайте файл [`GhostP2P-Standalone.html`](./GhostP2P-Standalone.html).
2. Откройте его двойным кликом в браузере (поддерживаются Chrome, Brave, Firefox, Tor Browser).
3. Нажмите **«Копировать ссылку»** и отправьте ее собеседнику. Соединение установится мгновенно!

### ⚖️ Отказ от ответственности
Данное программное обеспечение предоставляется исключительно в образовательных, исследовательских целях и для демонстрации технологий кибербезопасности. Разработчики не администрируют никаких серверов и не имеют доступа к переписке. См. [`DISCLAIMER.md`](./DISCLAIMER.md).

---

## 🇹🇷 Türkçe

### Genel Bakış
**GhostP2P**, sunucu barındırma gereksinimi olmayan, siyah-beyaz minimalist ve yüksek gizlilik odaklı bir doğrudan mesajlaşma aracıdır. İki katılımcı arasında **WebRTC DataChannel** üzerinden doğrudan cihazdan cihaza (Player-to-Player) bağlantı kurar ve **AES-256-GCM** ile donanımsal uçtan uca şifreleme sağlar.

* ❌ **Sunucu Barındırma Gerektirmez:** Web sitesi açmanıza, sunucu kiralamanıza veya veritabanı tutmanıza gerek yoktur.
* ❌ **Sıfır Kayıt:** Telefon, e-posta, kullanıcı adı veya hesap oluşturma yoktur.
* ❌ **Sıfır İz (RAM-Only):** Mesajlar diske yazılmaz, sayfa kapandığında tüm bellek sıfırlanır.
* ✅ **Tek Tıkla Bağlantı:** 6 haneli oda kodunu paylaşın veya tek tıkla doğrudan bağlantı linki oluşturun.
* ✅ **Tek Dosya (Kurulumsuz):** [`GhostP2P-Standalone.html`](./GhostP2P-Standalone.html) dosyasını indirip çift tıklayarak anında çalıştırabilirsiniz.
* ✅ **Doğrudan P2P Dosya & Ses Aktarımı:** Buluta yüklemeden cihazdan cihaza doğrudan şifreli aktarım.
* ✅ **İmha Zamanlayıcısı & Panik Butonu:** 5s - 60s arası kendi kendini yok eden mesajlar ve tek tıkla acil çıkış.

### Hızlı Kullanım
1. [`GhostP2P-Standalone.html`](./GhostP2P-Standalone.html) dosyasını indirin.
2. Herhangi bir tarayıcıda (veya Tor Browser) çift tıklayarak açın.
3. **"Linki Kopyala"** butonuna basarak linki arkadaşınıza iletin. Arkadaşınız açtığı anda doğrudan P2P bağlantı kurulacaktır!

### ⚖️ Yasal Bildirim
Bu yazılım yalnızca eğitim, açık kaynak inceleme ve güvenlik araştırması amacıyla hazırlanmıştır. Geliştirici hiçbir sunucu işletmemekte olup verileri göremez. Detaylar için [`DISCLAIMER.md`](./DISCLAIMER.md) ve [`LICENSE`](./LICENSE) dosyalarını inceleyiniz.
