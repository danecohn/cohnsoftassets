'use strict';
// Vector twins of the artwork: the same geometry as hd.js written as SVG, for print, large displays and the web.
const fs = require('fs');
const path = require('path');
const hd = require('./hd.js');
const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fonts', 'wordmark-outlines.json'), 'utf8'));
const f = (n) => (Math.round(n * 100) / 100).toString();
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const squirclePath = (cx, cy, a) => { const pts = []; for (let i = 0; i < 240; i++) { const t = (i / 240) * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t); pts.push([cx + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / 5), cy + a * Math.sign(s) * Math.pow(Math.abs(s), 2 / 5)]); } return 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z'; };
const wordPaths = (x, baseline, size, colA, colB) => { const k = size / OUT.unitsPerEm; return OUT.letters.map((l, i) => '<path fill="' + (i < 4 ? colA : colB) + '" d="' + l.contours.map((c) => 'M' + c.map(([ux, uy]) => f(x + ux * k) + ' ' + f(baseline - uy * k)).join('L') + 'Z').join('') + '"/>').join(''); };

/** The thorn-ended C as one filled outline. g from hd.glyphGeom. */
function thornPath(g) {
  const { cx, cy, R, T, half } = g, TM = hd.TAPER_MIN, tm = (T * TM) / 2, N = 90, outer = [], inner = [];
  for (let i = 0; i <= N; i++) {
    const th = half + ((2 * Math.PI - 2 * half) * i) / N, a = Math.min(th, 2 * Math.PI - th), t = T * (TM + (1 - TM) * smooth(half, half + 0.85, a));
    outer.push([cx + (R + t / 2) * Math.cos(th), cy + (R + t / 2) * Math.sin(th)]); inner.push([cx + (R - t / 2) * Math.cos(th), cy + (R - t / 2) * Math.sin(th)]);
  }
  const cap = (th, a0, a1) => { const ex = cx + R * Math.cos(th), ey = cy + R * Math.sin(th), pts = []; for (let i = 1; i < 12; i++) { const a = a0 + ((a1 - a0) * i) / 12; pts.push([ex + tm * Math.cos(a), ey + tm * Math.sin(a)]); } return pts; };
  const pts = [...outer, ...cap(2 * Math.PI - half, -half, Math.PI - half), ...inner.reverse(), ...cap(half, half - Math.PI, half)];
  return 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
}
const starPath = (x, y, r) => 'M' + f(x + r) + ' ' + f(y) + 'A' + f(r) + ' ' + f(r) + ' 0 0 0 ' + f(x) + ' ' + f(y + r) + 'A' + f(r) + ' ' + f(r) + ' 0 0 0 ' + f(x - r) + ' ' + f(y) + 'A' + f(r) + ' ' + f(r) + ' 0 0 0 ' + f(x) + ' ' + f(y - r) + 'A' + f(r) + ' ' + f(r) + ' 0 0 0 ' + f(x + r) + ' ' + f(y) + 'Z';

function markInner(S, id, app) {
  const a = (app ? 0.405 : 0.485) * S, cx = S / 2, cy = S / 2, g = hd.glyphGeom(cx, cy, a), yb = cy + 0.1 * a;
  const lanc = 'M' + f(cx + 0.96 * a) + ' ' + f(yb) + 'A' + f(1.92 * a) + ' ' + f(1.178 * a) + ' 0 0 0 ' + f(cx) + ' ' + f(yb - 1.02 * a) + 'A' + f(1.92 * a) + ' ' + f(1.178 * a) + ' 0 0 0 ' + f(cx - 0.96 * a) + ' ' + f(yb) + 'Z';
  const glyph = thornPath(g) + starPath(g.starX, cy, g.starR);
  return '<defs>' +
    '<linearGradient id="' + id + 't" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5c8f"/><stop offset=".4" stop-color="#ff0058"/><stop offset="1" stop-color="#7d002c"/></linearGradient>' +
    '<radialGradient id="' + id + 'l" cx=".3" cy=".22" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="' + id + 'v" cx=".5" cy=".5" r=".72"><stop offset=".62" stop-color="#3d0016" stop-opacity="0"/><stop offset="1" stop-color="#3d0016" stop-opacity=".42"/></radialGradient>' +
    '<linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" x1="0" y1="' + f(cy - g.R - g.T / 2) + '" x2="0" y2="' + f(cy + g.R + g.T / 2) + '"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff1f6"/><stop offset="1" stop-color="#ffc2d6"/></linearGradient>' +
    '<linearGradient id="' + id + 'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fb3" stop-opacity=".8"/><stop offset=".12" stop-color="#fff" stop-opacity=".04"/><stop offset=".86" stop-color="#1f0009" stop-opacity=".05"/><stop offset="1" stop-color="#1f0009" stop-opacity=".6"/></linearGradient>' +
    '<linearGradient id="' + id + 's" gradientUnits="userSpaceOnUse" x1="0" y1="' + f(yb - 1.02 * a) + '" x2="0" y2="' + f(yb) + '"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".6" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<clipPath id="' + id + 'c"><path d="' + squirclePath(cx, cy, a) + '"/></clipPath>' +
    '<filter id="' + id + 'b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="' + f(0.028 * a) + '"/></filter>' +
    (app ? '<filter id="' + id + 'd" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="' + f(0.03 * S) + '"/></filter>' : '') +
    '</defs>' +
    (app ? '<path d="' + squirclePath(cx, cy + 0.022 * S, a) + '" fill="#1f0009" opacity=".5" filter="url(#' + id + 'd)"/>' : '') +
    '<path d="' + squirclePath(cx, cy, a) + '" fill="url(#' + id + 't)"/><path d="' + squirclePath(cx, cy, a) + '" fill="url(#' + id + 'l)"/><path d="' + squirclePath(cx, cy, a) + '" fill="url(#' + id + 'v)"/>' +
    '<g clip-path="url(#' + id + 'c)"><path d="' + lanc + '" fill="url(#' + id + 's)"/></g>' +
    '<path d="' + squirclePath(cx, cy, a - 1.2) + '" fill="none" stroke="url(#' + id + 'r)" stroke-width="2.6"/>' +
    '<g filter="url(#' + id + 'b)" opacity=".55" transform="translate(0 ' + f(0.05 * a) + ')"><path d="' + glyph + '" fill="#1f0009"/></g>' +
    '<path d="' + glyph + '" fill="url(#' + id + 'g)"/>';
}
const wrap = (w, h, body, title) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img"><title>' + title + '</title>' + body + '</svg>\n';
const markSvg = (S, app) => wrap(S, S, markInner(S, 'm', app), 'Cohnsoft');
function glyphSvg(S, fill) {
  const a = 0.52 * S, g = hd.glyphGeom(S / 2 + 0.08 * a, S / 2, a), paint = fill === 'pink' ? 'url(#gp)' : fill;
  return wrap(S, S, (fill === 'pink' ? '<defs><linearGradient id="gp" gradientUnits="userSpaceOnUse" x1="0" y1="' + f(g.cy - g.R - g.T / 2) + '" x2="0" y2="' + f(g.cy + g.R + g.T / 2) + '"><stop offset="0" stop-color="#ff6a9b"/><stop offset=".5" stop-color="#ff0058"/><stop offset="1" stop-color="#a8003a"/></linearGradient></defs>' : '') + '<path d="' + thornPath(g) + starPath(g.starX, g.cy, g.starR) + '" fill="' + paint + '"/>', 'Cohnsoft glyph');
}
function wordmarkSvg(W, H, a, b) {
  const size = Math.min((H * 0.9) / ((OUT.ascender - OUT.descender) / OUT.unitsPerEm), (W * 0.96 / OUT.width) * OUT.unitsPerEm), k = size / OUT.unitsPerEm;
  return wrap(W, H, wordPaths((W - OUT.width * k) / 2, H / 2 + (OUT.xHeight * k) / 2, size, a, b), 'cohnsoft');
}
function lockupSvg(W, H, dark) {
  const pad = Math.round(H * 0.08), m = H - pad * 2, px = pad + m + Math.round(m * 0.24), avail = W - px - pad, size = Math.min(m * 0.78, (avail / OUT.width) * OUT.unitsPerEm), k = size / OUT.unitsPerEm;
  return wrap(W, H, '<g transform="translate(' + pad + ' ' + pad + ') scale(' + f(m / 512) + ')">' + markInner(512, 'k', false) + '</g>' + wordPaths(px, pad + m / 2 + (OUT.xHeight * k) / 2, size, dark ? '#f7eef2' : '#17101a', dark ? '#ff4d86' : '#ff0058'), 'cohnsoft');
}
module.exports = { markSvg, glyphSvg, wordmarkSvg, lockupSvg };
