'use strict';
// Generates tokens.json and index.html (the brand portal) from the colour system. Run after build.js:  node tools/site.js
const fs = require('fs');
const path = require('path');
const { contrast } = require('./palette');
const ROOT = path.join(__dirname, '..');

const green = { 50: '#e9fbf0', 100: '#c8f6d9', 200: '#9cf0bb', 300: '#6ae79a', 400: '#3fd477', 500: '#25bb5d', 600: '#1a9b4d', 700: '#0a7a37', 800: '#0b6a34', 900: '#05361b' };
const neutral = { 'Paper': '#ffffff', 'Mist': '#f2f2f7', 'Graphite': '#636366', 'Ink': '#1d1d1f', 'Night': '#1c1c1e', 'Night Raised': '#2c2c2e' };
const pairs = [['Ink on Paper', '#1d1d1f', '#ffffff'], ['Graphite on Paper', '#636366', '#ffffff'], ['Green 700 on Paper (text)', green[700], '#ffffff'], ['White on Green 700', '#ffffff', green[700]], ['White on Green 500 (large only)', '#ffffff', green[500]],
  ['Green 400 on Night', green[400], '#1c1c1e'], ['Paper on Night', '#f5f5f7', '#1c1c1e'], ['Night on Green 400 (buttons, dark)', '#04210f', green[400]]];
const tokens = { name: 'Cohnsoft', primary: green[500], green, neutral, contrast: Object.fromEntries(pairs.map(([n, a, b]) => [n, +contrast(a, b).toFixed(2)])), radii: { control: 8, group: 12, sheet: 22 }, blur: 18, fonts: { family: 'Cohn Sans', fallback: 'system-ui' } };
fs.writeFileSync(path.join(ROOT, 'tokens.json'), JSON.stringify(tokens, null, 2) + '\n');

const swatch = (name, hex, dark) => '<div class="sw"><i style="background:' + hex + '"></i><b>' + name + '</b><code>' + hex + '</code></div>';
const asset = (rel, label, cls) => '<figure class="' + (cls || '') + '"><img src="' + rel + '" alt="' + label + '" loading="lazy"><figcaption>' + label + '</figcaption></figure>';
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark">
<title>Cohnsoft brand</title>
<meta name="description" content="The Cohnsoft identity: logos, colour, typeface and the Golden Gate design system.">
<link rel="icon" href="icons/favicon-32.png" type="image/png"><link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="stylesheet" href="css/cohnsans.css"><link rel="stylesheet" href="css/goldengate.css">
<style>
 body{margin:0} .wrap{max-width:1080px;margin:0 auto;padding:0 20px 80px}
 .hero{box-shadow:inset 0 0 0 999px rgba(5,54,27,.16);min-height:420px;display:grid;place-items:center;text-align:center;padding:60px 20px;color:#fff;border-radius:0 0 28px 28px;overflow:hidden}
 .hero img{width:min(560px,86vw);filter:drop-shadow(0 18px 36px rgba(5,54,27,.35))}
 .hero p{max-width:46ch;margin:16px auto 0;font-size:19px;text-shadow:0 1px 12px rgba(5,54,27,.45)}
 section{margin-top:56px} section>h2{margin-bottom:6px} section>p.lead{color:var(--cs-label-2);margin:0 0 20px;max-width:64ch}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
 figure{margin:0;background:var(--cs-surface);border-radius:var(--cs-r-group);box-shadow:var(--cs-shadow-1),0 0 0 1px var(--cs-separator);padding:18px;display:flex;flex-direction:column;align-items:center;gap:10px}
 figure img{max-width:100%;max-height:150px;object-fit:contain} figure.dark{background:#1c1c1e;color:#f5f5f7} figure.wide{grid-column:span 2} figcaption{font-size:12.5px;color:var(--cs-label-2)} figure.dark figcaption{color:#aeaeb2}
 .sw{background:var(--cs-surface);border-radius:var(--cs-r-group);box-shadow:0 0 0 1px var(--cs-separator);overflow:hidden;font-size:13px} .sw i{display:block;height:64px} .sw b{display:block;padding:8px 10px 0} .sw code{display:block;padding:0 10px 9px;color:var(--cs-label-2);font-family:var(--cs-mono)}
 table{border-collapse:collapse;width:100%;font-size:14px} td,th{padding:8px 10px;text-align:left;border-bottom:1px solid var(--cs-separator)} .ok{color:var(--cs-tint-strong);font-weight:700}
 .spec h3{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--cs-label-3);margin:18px 0 6px} .big{font-size:64px;font-weight:700;line-height:1.05;margin:0} .abc{font-size:30px;line-height:1.3;margin:4px 0} .body{font-size:17px;max-width:60ch}
 .demo{border-radius:var(--cs-r-sheet);overflow:hidden;box-shadow:var(--cs-shadow-2)} .demo .bar{display:flex;gap:10px;align-items:center} .demo .stage{padding:22px;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
 .row2{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
 footer{margin-top:60px;color:var(--cs-label-2);font-size:14px}
</style>
</head>
<body class="cs">
<header class="hero cs-wallpaper"><div><img src="logos/lockup/cohnsoft-lockup-dark@2x.png" alt="cohnsoft"><p>Software in calm, good company. AltStack and Artemis Softworks are now one company: Cohnsoft.</p></div></header>
<main class="wrap">
<section><h2>Logo</h2><p class="lead">The mark is a lit white C holding a single bit, on a green tile. It reads at 16 pixels and at the size of a building. The wordmark is set in Cohn Sans, with "soft" in Cohnsoft Green.</p>
<div class="grid">
${asset('logos/app-icon/cohnsoft-app-512.png', 'App icon', '')}${asset('logos/mark/cohnsoft-mark-512.png', 'Mark (web, favicon, avatar)', '')}
${asset('logos/glyph/cohnsoft-glyph-green.png', 'Glyph, green', '')}${asset('logos/glyph/cohnsoft-glyph-white.png', 'Glyph, white', 'dark')}${asset('logos/glyph/cohnsoft-glyph-black.png', 'Glyph, black', '')}
${asset('logos/lockup/cohnsoft-lockup@2x.png', 'Lockup', 'wide')}${asset('logos/lockup/cohnsoft-lockup-dark@2x.png', 'Lockup, on dark', 'wide dark')}
${asset('logos/lockup/cohnsoft-lockup-stacked@2x.png', 'Stacked lockup', '')}${asset('logos/lockup/cohnsoft-wordmark.png', 'Wordmark', '')}${asset('logos/lockup/cohnsoft-wordmark-white.png', 'Wordmark, white', 'dark')}${asset('logos/pixel/cohnsoft-pixel-mark@8x.png', 'Pixel mark (made in AltStack Sprite)', '')}
</div></section>

<section><h2>Colour</h2><p class="lead">One green. Everything else is a quiet neutral. Logo green is for the logo and for large display type only; use Green 700 for green text on white.</p>
<div class="grid">${Object.entries(green).map(([k, v]) => swatch('Green ' + k + (k === '500' ? ' · Cohnsoft Green' : ''), v)).join('')}${Object.entries(neutral).map(([k, v]) => swatch(k, v)).join('')}</div>
<table style="margin-top:20px"><thead><tr><th>Pair</th><th>Contrast</th><th></th></tr></thead><tbody>${pairs.map(([n, a, b]) => { const c = contrast(a, b); return '<tr><td>' + n + '</td><td>' + c.toFixed(2) + ':1</td><td class="' + (c >= 4.5 ? 'ok' : '') + '">' + (c >= 7 ? 'AAA' : c >= 4.5 ? 'AA' : c >= 3 ? 'large text only' : 'decorative') + '</td></tr>'; }).join('')}</tbody></table></section>

<section class="spec"><h2>Typeface: Cohn Sans</h2><p class="lead">An original typeface: the clean, open feel of a modern system sans, with the reading aids of dyslexia-friendly faces. Letters that are easy to confuse look different (b d p q, I l 1, O 0), the bottoms are drawn heavier so each letter sits on the line, apertures are open and spacing is generous.</p>
<p class="big">cohnsoft</p><p class="abc">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 &nbsp;bdpq &nbsp;Il1 &nbsp;O0</p><p class="abc" style="font-weight:700">Bold: Make something wonderful.</p>
<p class="body">The quick brown fox jumps over the lazy dog. Software should be calm, readable and kind to the person using it. Files: <a href="fonts/CohnSans-Regular.woff2">Regular</a> · <a href="fonts/CohnSans-Bold.woff2">Bold</a> (also .ttf).</p></section>

<section><h2>Golden Gate design system</h2><p class="lead">Frosted bars over a green wallpaper, quiet surfaces, soft shadows, one tint. <code>css/goldengate.css</code> carries the tokens and components; the sample below is built from them.</p>
<div class="demo cs-wallpaper"><div class="cs-toolbar cs-glass bar"><img class="cs-icon" src="logos/mark/cohnsoft-mark-64.png" width="28" height="28" alt=""><b>Cohnsoft Notes</b><span style="flex:1"></span><div class="cs-segmented"><button aria-pressed="true">All</button><button aria-pressed="false">Shared</button><button aria-pressed="false">Archive</button></div><button class="cs-btn primary">New note</button></div>
<div class="stage"><div class="cs-card"><h3>Settings</h3><div class="cs-group" style="margin-top:10px"><div class="cs-row"><span style="flex:1">Sync with Warehouse</span><input class="cs-switch" type="checkbox" checked aria-label="Sync"></div><div class="cs-row"><span style="flex:1">Dark appearance</span><input class="cs-switch" type="checkbox" aria-label="Dark"></div><div class="cs-row"><span style="flex:1">Name</span><input class="cs-field" style="max-width:150px" value="Demie"></div></div></div>
<div class="cs-sheet cs-glass"><h3>Make it yours</h3><p style="color:var(--cs-label-2)">Sheets are translucent, with a lit top edge and a long soft shadow.</p><div class="row2"><button class="cs-btn">Cancel</button><button class="cs-btn primary">Continue</button><span class="cs-badge">Ready</span></div></div></div></div></section>

<section><h2>Downloads</h2><p class="lead">Everything here is in this repository.</p>
<div class="row2"><a class="cs-btn" href="icons/cohnsoft.icns">cohnsoft.icns</a><a class="cs-btn" href="icons/cohnsoft.ico">cohnsoft.ico</a><a class="cs-btn" href="logos/social/cohnsoft-social-1200x630.png">Social card</a><a class="cs-btn" href="logos/wallpaper/cohnsoft-wallpaper-2560x1600.png">Wallpaper</a><a class="cs-btn" href="logos/wallpaper/cohnsoft-wallpaper-dark-2560x1600.png">Wallpaper, dark</a><a class="cs-btn" href="tokens.json">tokens.json</a><a class="cs-btn" href="BRAND.md">Brand guide</a></div></section>

<footer>Cohnsoft was founded by Demetria Althea Cohn (online: Demie Althea Cohn). A product of Cohnsoft.</footer>
</main></body></html>
`;
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('wrote index.html and tokens.json');
