/* Copies the game (the files of the site) into desktop/app so that Electron packs only what the game needs. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(__dirname, 'app');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const n of ['index.html', 'seq.js', 'runtime-manifest.json', 'css', 'js', 'assets', 'lab']) {
  const from = path.join(root, n);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(out, n), { recursive: true });
}
console.log('app ready:', out);
