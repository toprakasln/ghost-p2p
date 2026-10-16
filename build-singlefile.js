/**
 * ShadowP2P - Tek Dosya (Single-File Standalone HTML) Paketleyici
 * 
 * Bu betik HTML, CSS, Crypto ve JS dosyalarını tek bir .html dosyası içinde birleştirir.
 * Sonuç: Kullanıcılar GitHub'dan sadece bu tek dosyayı indirip çift tıklayarak
 * hiçbir kurulum (Node.js, sunucu vb.) yapmadan doğrudan uygulamayı çalıştırabilir!
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const htmlPath = path.join(publicDir, 'index.html');
const cssPath = path.join(publicDir, 'style.css');
const cryptoPath = path.join(publicDir, 'crypto.js');
const appPath = path.join(publicDir, 'app.js');
const outputPath = path.join(__dirname, 'GhostP2P-Standalone.html');

console.log('📦 Tek dosya bağımsız sürüm paketleniyor...');

let html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const peerjsPath = path.join(publicDir, 'peerjs.min.js');
const peerJs = fs.readFileSync(peerjsPath, 'utf8');
const cryptoJs = fs.readFileSync(cryptoPath, 'utf8');
const appJs = fs.readFileSync(appPath, 'utf8');

// 1. CSS'i doğrudan HTML içine göm
html = html.replace(
  '<link rel="stylesheet" href="style.css">',
  `<style>\n${css}\n</style>`
);

// 2. JavaScript scriptlerini doğrudan HTML içine göm
const inlinedScripts = `
  <script>
    /* Inlined PeerJS P2P Engine */
    ${peerJs}
  </script>
  <script>
    /* Inlined Crypto Engine */
    ${cryptoJs}
  </script>
  <script>
    /* Inlined Application Logic */
    ${appJs}
  </script>
`;

html = html.replace('<script src="peerjs.min.js"></script>', '');
html = html.replace('<script src="crypto.js"></script>', '');
html = html.replace('<script src="app.js"></script>', inlinedScripts);

fs.writeFileSync(outputPath, html, 'utf8');

console.log(`✅ Başarıyla üretildi: ${outputPath}`);
console.log(`📊 Dosya boyutu: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
console.log('🚀 Artık bu tek dosyayı doğrudan çift tıklayarak veya GitHub Releases üzerinde paylaşabilirsiniz!');
