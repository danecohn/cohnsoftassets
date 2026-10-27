'use strict';
// Generates tokens.json and index.html (the brand portal) from the colour system. Run after build.js:  node tools/site.js
const fs = require('fs');
const path = require('path');
const { contrast } = require('./palette');
const ROOT = path.join(__dirname, '..');

const pink = { 50: '#fff0f5', 100: '#ffd6e4', 200: '#ffadc9', 300: '#ff7aa6', 400: '#ff4d86', 500: '#ff0058', 600: '#d6004a', 700: '#a8003a', 800: '#7a002b', 900: '#3d0016' };
const neutral = { 'Bone': '#f6f1f4', 'Paper': '#fffbfd', 'Graphite': '#6b5d68', 'Ink': '#17101a', 'Night': '#120a14', 'Night Raised': '#1e1422' };
const pairs = [['Ink on Bone', '#17101a', '#f6f1f4'], ['Graphite on Paper', '#6b5d68', '#fffbfd'], ['Pink 700 on Paper (text, links)', pink[700], '#fffbfd'], ['Pink 600 on Paper', pink[600], '#fffbfd'], ['White on Pink 600 (buttons)', '#ffffff', pink[600]], ['White on Pink 500 (large only)', '#ffffff', pink[500]],
  ['Pink 400 on Night (text, dark)', pink[400], '#120a14'], ['Bone on Night', '#f7eef2', '#120a14'], ['Pink 300 on Night Raised', pink[300], '#1e1422']];
const tokens = { name: 'VigilTech', primary: pink[500], pink, neutral, contrast: Object.fromEntries(pairs.map(([n, a, b]) => [n, +contrast(a, b).toFixed(2)])), radii: { control: 8, group: 12, sheet: 22 }, blur: 18, shapes: { motif: 'pointed (lancet) arch', accent: 'four-point star' }, fonts: { family: 'Vigil Sans', fallback: 'system-ui' } };
fs.writeFileSync(path.join(ROOT, 'tokens.json'), JSON.stringify(tokens, null, 2) + '\n');

const swatch = (name, hex, dark) => '<div class="sw"><i style="background:' + hex + '"></i><b>' + name + '</b><code>' + hex + '</code></div>';
const asset = (rel, label, cls) => '<figure class="' + (cls || '') + '"><img src="' + rel + '" alt="' + label + '" loading="lazy"><figcaption>' + label + '</figcaption></figure>';
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark">
<title>VigilTech brand</title>
<meta name="description" content="The VigilTech identity: logos, colour, typeface and the Golden Gate design system.">
<link rel="icon" href="icons/favicon-32.png" type="image/png"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="stylesheet" href="css/vigilsans.css"><link rel="stylesheet" href="css/goldengate.css">
<style>
 body{margin:0} .wrap{max-width:1080px;margin:0 auto;padding:0 20px 80px}
 .hero{min-height:420px;display:grid;place-items:center;text-align:center;padding:60px 20px;color:#fff;border-radius:0 0 28px 28px;overflow:hidden}
 .hero img{width:min(560px,86vw);filter:drop-shadow(0 18px 36px rgba(31,0,9,.55))}
 .hero p{max-width:46ch;margin:16px auto 0;font-size:19px;text-shadow:0 1px 12px rgba(31,0,9,.6)}
 section{margin-top:56px} section>h2{margin-bottom:6px} section>p.lead{color:var(--vt-label-2);margin:0 0 20px;max-width:64ch}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
 figure{margin:0;background:#fffbfd;color:#17101a;border-radius:var(--vt-r-group);box-shadow:var(--vt-shadow-1),0 0 0 1px rgba(255,170,205,.16);padding:18px;display:flex;flex-direction:column;align-items:center;gap:10px}
 figure img{max-width:100%;max-height:150px;object-fit:contain} figure.dark{background:#120a14;color:#f7eef2} figure.wide{grid-column:span 2} figcaption{font-size:12.5px;color:#6b5d68} figure.dark figcaption{color:#b7a5b1}
 .sw{background:var(--vt-surface);border-radius:var(--vt-r-group);box-shadow:0 0 0 1px var(--vt-separator);overflow:hidden;font-size:13px} .sw i{display:block;height:64px} .sw b{display:block;padding:8px 10px 0} .sw code{display:block;padding:0 10px 9px;color:var(--vt-label-2);font-family:var(--vt-mono)}
 table{border-collapse:collapse;width:100%;font-size:14px} td,th{padding:8px 10px;text-align:left;border-bottom:1px solid var(--vt-separator)} .ok{color:var(--vt-tint-strong);font-weight:700}
 .spec h3{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--vt-label-3);margin:18px 0 6px} .big{font-size:64px;font-weight:700;line-height:1.05;margin:0} .abc{font-size:30px;line-height:1.3;margin:4px 0} .body{font-size:17px;max-width:60ch}
 .demo{border-radius:var(--vt-r-sheet);overflow:hidden;box-shadow:var(--vt-shadow-2)} .demo .bar{display:flex;gap:10px;align-items:center} .demo .stage{padding:22px;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
 .row2{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
 footer{margin-top:60px;color:var(--vt-label-2);font-size:14px}
</style>
</head>
<body class="cs">
<header class="hero vt-wallpaper night"><div><img src="logos/lockup/vigiltech-lockup-dark@2x.png" alt="vigiltech"><p>Christian technology, Catholic at its core, free for everyone under the GPL. Keep watch.</p></div></header>
<main class="wrap">
<section><h2>Logo</h2><p class="lead">The mark is a vigil lamp, the light that burns beside the tabernacle: a flame made from two pointed arches, a bowl shaped like an upside-down lancet window with a cross cut into it, and a four-point guiding star, on a pink tile. It reads at 16 pixels and at the size of a building. The wordmark is set in Vigil Sans, with "tech" in VigilTech Pink.</p>
<div class="grid">
${asset('logos/app-icon/vigiltech-app-512.png', 'App icon', '')}${asset('logos/mark/vigiltech-mark-512.png', 'Mark (web, favicon, avatar)', '')}
${asset('logos/glyph/vigiltech-glyph-pink.png', 'Glyph, pink', '')}${asset('logos/glyph/vigiltech-glyph-white.png', 'Glyph, white', 'dark')}${asset('logos/glyph/vigiltech-glyph-black.png', 'Glyph, black', '')}
${asset('logos/lockup/vigiltech-lockup@2x.png', 'Lockup', 'wide')}${asset('logos/lockup/vigiltech-lockup-dark@2x.png', 'Lockup, on dark', 'wide dark')}
${asset('logos/lockup/vigiltech-lockup-stacked@2x.png', 'Stacked lockup', '')}${asset('logos/lockup/vigiltech-wordmark.png', 'Wordmark', '')}${asset('logos/lockup/vigiltech-wordmark-white.png', 'Wordmark, white', 'dark')}${asset('logos/pixel/vigiltech-pixel-mark@8x.png', 'Pixel mark (made in AltStack Sprite)', '')}
</div></section>

<section><h2>Colour</h2><p class="lead">One pink, #ff0058, and a family of warm, plum-tinted neutrals. Night is the natural home. Pure VigilTech Pink is for the logo, large display type and filled controls; use Pink 700 for pink text on light backgrounds and Pink 400 on dark.</p>
<div class="grid">${Object.entries(pink).map(([k, v]) => swatch('Pink ' + k + (k === '500' ? ' · VigilTech Pink' : ''), v)).join('')}${Object.entries(neutral).map(([k, v]) => swatch(k, v)).join('')}</div>
<table style="margin-top:20px"><thead><tr><th>Pair</th><th>Contrast</th><th></th></tr></thead><tbody>${pairs.map(([n, a, b]) => { const c = contrast(a, b); return '<tr><td>' + n + '</td><td>' + c.toFixed(2) + ':1</td><td class="' + (c >= 4.5 ? 'ok' : '') + '">' + (c >= 7 ? 'AAA' : c >= 4.5 ? 'AA' : c >= 3 ? 'large text only' : 'decorative') + '</td></tr>'; }).join('')}</tbody></table></section>

<section class="spec"><h2>Typeface: Vigil Sans</h2><p class="lead">An original typeface: the clean, open feel of a modern system sans, with the reading aids of dyslexia-friendly faces. Letters that are easy to confuse look different (b d p q, I l 1, O 0), the bottoms are drawn heavier so each letter sits on the line, apertures are open and spacing is generous.</p>
<p class="big">vigiltech</p><p class="abc">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 &nbsp;bdpq &nbsp;Il1 &nbsp;O0</p><p class="abc" style="font-weight:700">Bold: Make something wonderful.</p>
<p class="body">The quick brown fox jumps over the lazy dog. Software should be calm, readable and kind to the person using it. Files: <a href="fonts/VigilSans-Regular.woff2">Regular</a> · <a href="fonts/VigilSans-Bold.woff2">Bold</a> (also .ttf).</p></section>

<section><h2>Golden Gate design system</h2><p class="lead">Frosted bars over a night-sky wallpaper, quiet plum-tinted surfaces, soft shadows, one pink tint, and a single gothic shape: the pointed arch. <code>css/goldengate.css</code> carries the tokens and components; the sample below is built from them.</p>
<div class="demo vt-wallpaper"><div class="vt-toolbar vt-glass bar"><img class="vt-icon" src="logos/mark/vigiltech-mark-64.png" width="28" height="28" alt=""><b>VigilTech Notes</b><span style="flex:1"></span><div class="vt-segmented"><button aria-pressed="true">All</button><button aria-pressed="false">Shared</button><button aria-pressed="false">Archive</button></div><button class="vt-btn primary">New note</button></div>
<div class="stage"><div class="vt-card"><h3>Settings</h3><div class="vt-group" style="margin-top:10px"><div class="vt-row"><span style="flex:1">Sync with Warehouse</span><input class="vt-switch" type="checkbox" checked aria-label="Sync"></div><div class="vt-row"><span style="flex:1">Dark appearance</span><input class="vt-switch" type="checkbox" aria-label="Dark"></div><div class="vt-row"><span style="flex:1">Name</span><input class="vt-field" style="max-width:150px" value="Demie"></div></div></div>
<div class="vt-sheet vt-glass"><h3>Make it yours</h3><p style="color:var(--vt-label-2)">Sheets are translucent, with a lit top edge and a long soft shadow.</p><div class="row2"><button class="vt-btn">Cancel</button><button class="vt-btn primary">Continue</button><span class="vt-badge">Ready</span></div></div></div></div></section>

<section><h2>Downloads</h2><p class="lead">Everything here is in this repository.</p>
<div class="row2"><a class="vt-btn" href="icons/vigiltech.icns">vigiltech.icns</a><a class="vt-btn" href="icons/vigiltech.ico">vigiltech.ico</a><a class="vt-btn" href="logos/social/vigiltech-social-1200x630.png">Social card</a><a class="vt-btn" href="logos/wallpaper/vigiltech-wallpaper-night-2560x1600.png">Wallpaper, night</a><a class="vt-btn" href="logos/wallpaper/vigiltech-wallpaper-dawn-2560x1600.png">Wallpaper, dawn</a><a class="vt-btn" href="tokens.json">tokens.json</a><a class="vt-btn" href="BRAND.md">Brand guide</a></div></section>

<footer>VigilTech, vigiltech.org. Founded by Demetria Althea Cohn (online: Demie Althea Cohn). Free software under the GNU GPL v3. Ad maiorem Dei gloriam.</footer>
</main></body></html>
`;
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('wrote index.html and tokens.json');
