// SPDX-License-Identifier: GPL-3.0-or-later
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {contrast}=require('../tools/palette');
const css=fs.readFileSync('css/goldengate.css','utf8');
test('body-sized primary controls and links meet AA',()=>{
 for(const [fg,bg] of [['#ffffff','#d6004a'],['#ffffff','#a8003a'],['#a8003a','#fffbfd'],['#a8003a','#f6f1f4'],['#ff4d86','#120a14'],['#ff7aa6','#1e1422'],['#6b5d68','#fffbfd'],['#b7a5b1','#1e1422']]) assert.ok(contrast(fg,bg)>=4.5,`${fg} on ${bg}`);
 assert.match(css,/\.vt-btn\.primary\s*\{[^}]*background: var\(--vt-pink-600\)/);
 assert.doesNotMatch(css,/linear-gradient\(#ff2a73/);
});
test('new namespace, typography and all accessibility modes are available',()=>{
 assert.doesNotMatch(css,/\.cs\b|--cs-|letter-spacing|rgba\(0, 0, 0/);
 for(const flag of ['prefers-reduced-motion','prefers-reduced-transparency','forced-colors','pointer: coarse','min-height: 44px','outline: 3px solid','font-synthesis: none']) assert.ok(css.includes(flag),flag);
 assert.ok(fs.readFileSync('css/vigilsans.css','utf8').includes('VigilSans-Regular.woff2'));
});
test('all local portal resources resolve',()=>{
 const html=fs.readFileSync('index.html','utf8');
 for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) if(!/^(?:https?:|mailto:)/.test(url)) assert.ok(fs.existsSync(url),url);
 assert.ok(html.includes('class="vt"'));assert.ok(html.includes('id="appearance"'));assert.ok(html.includes('id="system-font"'));
});
