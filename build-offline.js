// Rebuild offline.html as a single self-contained file: node build-offline.js
const fs=require('fs'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const html=read('index.html')
  .replace('<link rel="stylesheet" href="style.css">',()=>`<style>${read('style.css')}</style>`)
  .replace(/<a class="btn primary" href="offline.html"[^>]*>下載離線版<\/a>/,`<a class="btn primary" href="#" onclick="event.preventDefault();alert('你已在離線版。可將這個HTML檔案複製到其他電腦使用。')">離線版</a>`)
  .replace('<script src="app.js"></script>',()=>`<script>${read('app.js').replace(/img\/([\w-]+)\.webp/g,(m,n)=>`data:image/webp;base64,${fs.readFileSync(path.join(__dirname,'img',n+'.webp')).toString('base64')}`)}</script>`);
if(/src="app\.js"|href="style\.css"|href="offline\.html"/.test(html))throw new Error('offline build: a placeholder was not replaced');
fs.writeFileSync(path.join(__dirname,'offline.html'),html);
console.log('offline.html written',Buffer.byteLength(html),'bytes');
