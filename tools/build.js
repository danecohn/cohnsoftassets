'use strict';
// Builds every Cohnsoft logo asset. Each master is a Sprite document (AltStack Sprite's own model, saved as .asprite.json and exported
// with its PNG engine); the vector twins come from svg.js. Run:  node tools/build.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const M = require('./sprite/model.js');
const { Session } = require('./sprite/session.js');
const Tools = require('./sprite/tools.js');
const PNG = require('./sprite/png.js');
const hd = require('./hd.js');
const svg = require('./svg.js');
const art = require('./art.js');

const ROOT = path.join(__dirname, '..');
const D = (p) => { const f = path.join(ROOT, p); fs.mkdirSync(f, { recursive: true }); return f; };
for (const d of ['logos/mark', 'logos/app-icon', 'logos/glyph', 'logos/lockup', 'logos/pixel', 'logos/social', 'logos/wallpaper', 'source']) D(d);
for (const d of ['logos', 'icons', 'source']) fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });   // never leave stale artwork behind
for (const d of ['logos/mark', 'logos/app-icon', 'logos/glyph', 'logos/lockup', 'logos/pixel', 'logos/social', 'logos/wallpaper', 'source']) D(d);
const made = [];

/** Save an RGBA image as a Sprite document and export it with Sprite's PNG exporter. */
async function sprite(name, cv, outRel, scales) {
  const rgba = cv.toRGBA ? cv.toRGBA() : cv.rgba, w = cv.w, h = cv.h;
  const doc = M.Doc.fromRGBA(w, h, [{ rgba, delay: 100 }]); doc.name = name;
  const S = new Session(doc);
  fs.writeFileSync(path.join(ROOT, 'source', name + '.asprite.json'), JSON.stringify(doc.toJSON()));
  const io = { write: async (rel, data) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.from(data)); return { path: rel }; } };
  for (const sc of scales || [1]) await Tools.run(S, 'export', { format: 'png', path: path.join(outRel).replace(/\\/g, '/') + (sc === 1 ? '' : '@' + sc + 'x') + '.png', scale: sc }, { write: (rel, data) => io.write(rel, data) });
  made.push(name);
}
/** Images beyond Sprite's 512-pixel document limit are drawn natively at full size and written with Sprite's PNG encoder. */
function raw(rel, cv) { fs.writeFileSync(path.join(ROOT, rel), Buffer.from(PNG.encode(cv.w, cv.h, cv.toRGBA()))); }
const write = (rel, text) => fs.writeFileSync(path.join(ROOT, rel), text);

(async () => {
  // ---- the mark: native renders at every size, 512 and below as Sprite documents
  for (const n of [16, 32, 48, 64, 128, 256, 512]) await sprite('cohnsoft-mark-' + n, hd.renderMark(n, 'mark'), 'logos/mark/cohnsoft-mark-' + n);
  for (const n of [16, 32, 64, 128, 256, 512]) await sprite('cohnsoft-app-' + n, hd.renderMark(n, 'app'), 'logos/app-icon/cohnsoft-app-' + n);
  raw('logos/app-icon/cohnsoft-app-1024.png', hd.renderMark(1024, 'app'));
  raw('logos/mark/cohnsoft-mark-1024.png', hd.renderMark(1024, 'mark'));
  write('logos/mark/cohnsoft-mark.svg', svg.markSvg(512, false));
  write('logos/app-icon/cohnsoft-app.svg', svg.markSvg(512, true));
  // ---- the glyph alone
  for (const v of ['pink', 'white', 'black']) { await sprite('cohnsoft-glyph-' + v, hd.renderGlyph(512, v), 'logos/glyph/cohnsoft-glyph-' + v); write('logos/glyph/cohnsoft-glyph-' + v + '.svg', svg.glyphSvg(512, v === 'pink' ? 'pink' : v === 'white' ? '#ffffff' : '#17101a')); }
  // ---- wordmarks and lockups (512 wide as documents; 2x and 4x drawn natively; SVG for any size)
  const ink = hd.hex('#17101a'), pink = hd.hex('#ff0058'), bone = hd.hex('#f7eef2'), pinkLight = hd.hex('#ff4d86'), white = hd.hex('#ffffff');
  await sprite('cohnsoft-wordmark', hd.renderWordmark(512, 128, ink, pink), 'logos/lockup/cohnsoft-wordmark');
  await sprite('cohnsoft-wordmark-dark', hd.renderWordmark(512, 128, bone, pinkLight), 'logos/lockup/cohnsoft-wordmark-dark');
  await sprite('cohnsoft-wordmark-black', hd.renderWordmark(512, 128, ink, ink), 'logos/lockup/cohnsoft-wordmark-black');
  await sprite('cohnsoft-wordmark-white', hd.renderWordmark(512, 128, white, white), 'logos/lockup/cohnsoft-wordmark-white');
  write('logos/lockup/cohnsoft-wordmark.svg', svg.wordmarkSvg(1024, 256, '#17101a', '#ff0058'));
  write('logos/lockup/cohnsoft-wordmark-dark.svg', svg.wordmarkSvg(1024, 256, '#f7eef2', '#ff4d86'));
  write('logos/lockup/cohnsoft-wordmark-black.svg', svg.wordmarkSvg(1024, 256, '#17101a', '#17101a'));
  write('logos/lockup/cohnsoft-wordmark-white.svg', svg.wordmarkSvg(1024, 256, '#ffffff', '#ffffff'));
  await sprite('cohnsoft-lockup', hd.renderLockup(512, 144, false), 'logos/lockup/cohnsoft-lockup');
  await sprite('cohnsoft-lockup-dark', hd.renderLockup(512, 144, true), 'logos/lockup/cohnsoft-lockup-dark');
  raw('logos/lockup/cohnsoft-lockup@2x.png', hd.renderLockup(1024, 288, false)); raw('logos/lockup/cohnsoft-lockup@4x.png', hd.renderLockup(2048, 576, false));
  raw('logos/lockup/cohnsoft-lockup-dark@2x.png', hd.renderLockup(1024, 288, true)); raw('logos/lockup/cohnsoft-lockup-dark@4x.png', hd.renderLockup(2048, 576, true));
  write('logos/lockup/cohnsoft-lockup.svg', svg.lockupSvg(1024, 288, false)); write('logos/lockup/cohnsoft-lockup-dark.svg', svg.lockupSvg(1024, 288, true));
  await sprite('cohnsoft-lockup-stacked', hd.renderStacked(512, 400), 'logos/lockup/cohnsoft-lockup-stacked'); raw('logos/lockup/cohnsoft-lockup-stacked@2x.png', hd.renderStacked(1024, 800));
  // ---- social card and wallpapers
  raw('logos/social/cohnsoft-social-1200x630.png', hd.renderSocial(1200, 630)); raw('logos/social/cohnsoft-social-2400x1260.png', hd.renderSocial(2400, 1260));
  await sprite('cohnsoft-wallpaper-night', hd.renderWallpaper(512, 320, true), 'logos/wallpaper/cohnsoft-wallpaper-night-preview'); await sprite('cohnsoft-wallpaper-dawn', hd.renderWallpaper(512, 320, false), 'logos/wallpaper/cohnsoft-wallpaper-dawn-preview');
  raw('logos/wallpaper/cohnsoft-wallpaper-night-2560x1600.png', hd.renderWallpaper(2560, 1600, true)); raw('logos/wallpaper/cohnsoft-wallpaper-dawn-2560x1600.png', hd.renderWallpaper(2560, 1600, false));

  // ---- the original pixel-art mark, kept as a variant: the company grew up on AltStack Sprite
  const CH = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  async function pixel(name, grid, scales) {
    const h = grid.length, w = grid[0].length, doc = new M.Doc({ w, h, mode: 'indexed', name }), S = new Session(doc);
    await Tools.run(S, 'set_palette', { colors: art.COLORS, mode: 'replace' });
    await Tools.run(S, 'draw_pixels', { x: 0, y: 0, rows: grid.map((r) => r.map((v) => (v < 0 ? '.' : CH[v])).join('')) });
    fs.writeFileSync(path.join(ROOT, 'source', name + '.asprite.json'), JSON.stringify(doc.toJSON()));
    for (const sc of scales) await Tools.run(S, 'export', { format: 'png', path: 'logos/pixel/' + name + '@' + sc + 'x.png', scale: sc }, { write: async (rel, data) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.from(data)); return { path: rel }; } });
    made.push(name);
  }
  await pixel('cohnsoft-pixel-mark', art.tile(64), [1, 8, 16]);
  await pixel('cohnsoft-pixel-lockup', art.lockup(art.tile(64), art.I.ink, art.I.g3, 2, 4), [1, 4]);

  // ---- icon files: .ico (PNG entries), .icns (macOS), favicons
  const pngOf = (rel) => fs.readFileSync(path.join(ROOT, rel));
  const iconSrc = { 16: 'logos/mark/cohnsoft-mark-16.png', 32: 'logos/mark/cohnsoft-mark-32.png', 48: 'logos/mark/cohnsoft-mark-48.png', 64: 'logos/mark/cohnsoft-mark-64.png', 128: 'logos/mark/cohnsoft-mark-128.png', 256: 'logos/mark/cohnsoft-mark-256.png' };
  const sizes = Object.keys(iconSrc).map(Number), head = Buffer.alloc(6); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  let off = 6 + 16 * sizes.length; const dirs = [], bodies = [];
  for (const s of sizes) { const b = pngOf(iconSrc[s]), d = Buffer.alloc(16); d[0] = s === 256 ? 0 : s; d[1] = s === 256 ? 0 : s; d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6); d.writeUInt32LE(b.length, 8); d.writeUInt32LE(off, 12); off += b.length; dirs.push(d); bodies.push(b); }
  D('icons'); fs.writeFileSync(path.join(ROOT, 'icons', 'cohnsoft.ico'), Buffer.concat([head, ...dirs, ...bodies])); fs.copyFileSync(path.join(ROOT, 'icons', 'cohnsoft.ico'), path.join(ROOT, 'icons', 'favicon.ico'));
  fs.copyFileSync(path.join(ROOT, 'logos/mark/cohnsoft-mark-32.png'), path.join(ROOT, 'icons', 'favicon-32.png'));
  fs.copyFileSync(path.join(ROOT, 'logos/mark/cohnsoft-mark-512.png'), path.join(ROOT, 'icons', 'icon-512.png'));
  fs.copyFileSync(path.join(ROOT, 'logos/mark/cohnsoft-mark-256.png'), path.join(ROOT, 'icons', 'icon-256.png'));
  raw('icons/apple-touch-icon.png', hd.renderMark(180, 'mark'));
  try {
    const set = path.join(ROOT, '_cohnsoft.iconset'); fs.rmSync(set, { recursive: true, force: true }); fs.mkdirSync(set);
    const app = (n) => path.join(ROOT, 'logos/app-icon/cohnsoft-app-' + n + '.png');
    const map = { 'icon_16x16.png': 16, 'icon_16x16@2x.png': 32, 'icon_32x32.png': 32, 'icon_32x32@2x.png': 64, 'icon_128x128.png': 128, 'icon_128x128@2x.png': 256, 'icon_256x256.png': 256, 'icon_256x256@2x.png': 512, 'icon_512x512.png': 512, 'icon_512x512@2x.png': 1024 };
    for (const [file, n] of Object.entries(map)) fs.copyFileSync(app(n), path.join(set, file));
    execFileSync('iconutil', ['-c', 'icns', set, '-o', path.join(ROOT, 'icons', 'cohnsoft.icns')], { stdio: 'pipe' }); fs.rmSync(set, { recursive: true, force: true });
    console.log('wrote icons/cohnsoft.icns');
  } catch (e) { console.log('skipped .icns (needs macOS iconutil)'); }
  console.log('Cohnsoft assets built: ' + made.length + ' Sprite documents');
})().catch((e) => { console.error(e); process.exit(1); });
