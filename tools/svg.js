'use strict';
// Vector twins of the artwork: the same geometry as hd.js written as SVG, for print, large displays and the web.
const fs = require('fs');
const path = require('path');
const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fonts', 'wordmark-outlines.json'), 'utf8'));
const f = (n) => (Math.round(n * 100) / 100).toString();

const squirclePath = (cx, cy, a) => { const pts = []; for (let i = 0; i < 240; i++) { const t = (i / 240) * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t); pts.push([cx + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / 5) * 1.0, cy + a * Math.sign(s) * Math.pow(Math.abs(s), 2 / 5) * 1.0]); } return 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z'; };
const wordPaths = (x, baseline, size, colA, colB) => { const k = size / OUT.unitsPerEm; return OUT.letters.map((l, i) => '<path fill="' + (i < 4 ? colA : colB) + '" d="' + l.contours.map((c) => 'M' + c.map(([ux, uy]) => f(x + ux * k) + ' ' + f(baseline - uy * k)).join('L') + 'Z').join('') + '"/>').join(''); };

function geom(S, app) {
  const a = (app ? 0.405 : 0.485) * S, cx = S / 2, cy = S / 2, gcx = cx - 0.075 * a, R = 0.5 * a, T = 0.215 * a, half = (39 * Math.PI) / 180;
  return { S, a, cx, cy, gcx, R, T, half, bitX: gcx + 0.545 * a, bitS: 0.1 * a, bitR: 0.045 * a };
}
function markInner(g, id, app) {
  const { S, a, cx, cy } = g, x0 = g.gcx + g.R * Math.cos(g.half), y0 = cy - g.R * Math.sin(g.half), y1 = cy + g.R * Math.sin(g.half);
  const ring = 'M' + f(x0) + ' ' + f(y0) + 'A' + f(g.R) + ' ' + f(g.R) + ' 0 1 0 ' + f(x0) + ' ' + f(y1);
  return '<defs>' +
    '<linearGradient id="' + id + 't" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ae79a"/><stop offset=".5" stop-color="#25bb5d"/><stop offset="1" stop-color="#0b6a34"/></linearGradient>' +
    '<radialGradient id="' + id + 'l" cx=".3" cy=".22" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" x1="0" y1="' + f(cy - g.R - g.T / 2) + '" x2="0" y2="' + f(cy + g.R + g.T / 2) + '"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#eefcf3"/><stop offset="1" stop-color="#c2f0d4"/></linearGradient>' +
    '<linearGradient id="' + id + 'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".12" stop-color="#fff" stop-opacity=".05"/><stop offset=".88" stop-color="#05361b" stop-opacity=".05"/><stop offset="1" stop-color="#05361b" stop-opacity=".5"/></linearGradient>' +
    '<linearGradient id="' + id + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<clipPath id="' + id + 'c"><path d="' + squirclePath(cx, cy, a) + '"/></clipPath>' +
    '<filter id="' + id + 'b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="' + f(0.03 * a) + '"/></filter>' +
    (app ? '<filter id="' + id + 'd" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="' + f(0.03 * S) + '"/></filter>' : '') +
    '</defs>' +
    (app ? '<path d="' + squirclePath(cx, cy + 0.022 * S, a) + '" fill="#05361b" opacity=".42" filter="url(#' + id + 'd)"/>' : '') +
    '<path d="' + squirclePath(cx, cy, a) + '" fill="url(#' + id + 't)"/>' +
    '<path d="' + squirclePath(cx, cy, a) + '" fill="url(#' + id + 'l)"/>' +
    '<g clip-path="url(#' + id + 'c)"><ellipse cx="' + f(cx) + '" cy="' + f(cy - 0.5 * a) + '" rx="' + f(0.98 * a) + '" ry="' + f(0.66 * a) + '" fill="url(#' + id + 's)" transform="translate(0 0)"/></g>' +
    '<path d="' + squirclePath(cx, cy, a - 1.2) + '" fill="none" stroke="url(#' + id + 'r)" stroke-width="2.4"/>' +
    '<g filter="url(#' + id + 'b)" opacity=".5" transform="translate(0 ' + f(0.05 * a) + ')"><path d="' + ring + '" fill="none" stroke="#05361b" stroke-width="' + f(g.T) + '" stroke-linecap="round"/><rect x="' + f(g.bitX - g.bitS) + '" y="' + f(cy - g.bitS) + '" width="' + f(2 * g.bitS) + '" height="' + f(2 * g.bitS) + '" rx="' + f(g.bitR) + '" fill="#05361b"/></g>' +
    '<path d="' + ring + '" fill="none" stroke="url(#' + id + 'g)" stroke-width="' + f(g.T) + '" stroke-linecap="round"/>' +
    '<rect x="' + f(g.bitX - g.bitS) + '" y="' + f(cy - g.bitS) + '" width="' + f(2 * g.bitS) + '" height="' + f(2 * g.bitS) + '" rx="' + f(g.bitR) + '" fill="url(#' + id + 'g)"/>';
}
const wrap = (w, h, body, title) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img"><title>' + title + '</title>' + body + '</svg>\n';

const markSvg = (S, app) => wrap(S, S, markInner(geom(S, app), 'm', app), 'Cohnsoft');
function glyphSvg(S, fill) {
  const g = geom(S, false), a = 0.52 * S, gcx = S / 2 + 0.075 * a - 0.075 * a, cy = S / 2, R = 0.5 * a, T = 0.215 * a, half = g.half;
  const x0 = gcx + R * Math.cos(half), y0 = cy - R * Math.sin(half), y1 = cy + R * Math.sin(half), bx = gcx + 0.545 * a, bs = 0.1 * a;
  const paint = fill === 'green' ? 'url(#gg)' : fill;
  return wrap(S, S, (fill === 'green' ? '<defs><linearGradient id="gg" gradientUnits="userSpaceOnUse" x1="0" y1="' + f(cy - R - T / 2) + '" x2="0" y2="' + f(cy + R + T / 2) + '"><stop offset="0" stop-color="#6ae79a"/><stop offset=".5" stop-color="#25bb5d"/><stop offset="1" stop-color="#0e7a3b"/></linearGradient></defs>' : '') +
    '<path d="M' + f(x0) + ' ' + f(y0) + 'A' + f(R) + ' ' + f(R) + ' 0 1 0 ' + f(x0) + ' ' + f(y1) + '" fill="none" stroke="' + paint + '" stroke-width="' + f(T) + '" stroke-linecap="round"/><rect x="' + f(bx - bs) + '" y="' + f(cy - bs) + '" width="' + f(2 * bs) + '" height="' + f(2 * bs) + '" rx="' + f(0.045 * a) + '" fill="' + paint + '"/>', 'Cohnsoft glyph');
}
function wordmarkSvg(W, H, a, b) {
  const size = Math.min((H * 0.9) / ((OUT.ascender - OUT.descender) / OUT.unitsPerEm), (W * 0.96 / OUT.width) * OUT.unitsPerEm), k = size / OUT.unitsPerEm;
  return wrap(W, H, wordPaths((W - OUT.width * k) / 2, H / 2 + (OUT.xHeight * k) / 2, size, a, b), 'cohnsoft');
}
function lockupSvg(W, H, dark) {
  const pad = Math.round(H * 0.08), m = H - pad * 2, px = pad + m + Math.round(m * 0.24), avail = W - px - pad, size = Math.min(m * 0.78, (avail / OUT.width) * OUT.unitsPerEm), k = size / OUT.unitsPerEm;
  const scale = m / 512;
  return wrap(W, H, '<g transform="translate(' + pad + ' ' + pad + ') scale(' + f(scale) + ')">' + markInner(geom(512, false), 'k', false) + '</g>' + wordPaths(px, pad + m / 2 + (OUT.xHeight * k) / 2, size, dark ? '#ffffff' : '#1d1d1f', dark ? '#7aeca6' : '#25bb5d'), 'cohnsoft');
}
module.exports = { markSvg, glyphSvg, wordmarkSvg, lockupSvg };
