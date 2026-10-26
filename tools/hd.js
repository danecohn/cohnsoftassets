'use strict';
// High-detail renderer for the Cohnsoft identity: smooth true-colour artwork with bevels, a lit rim, glass gloss and soft shadows.
// Everything is analytic (signed-distance shapes), so any size is drawn natively at that size, never scaled. The results become
// Sprite documents (RGBA) in build.js, which Sprite then saves and exports.
const fs = require('fs');
const path = require('path');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const mixc = (c1, c2, t) => [mix(c1[0], c2[0], t), mix(c1[1], c2[1], t), mix(c1[2], c2[2], t)];
function ramp(stops, t) { // stops: [[pos, [r,g,b]], ...]
  t = clamp(t, 0, 1);
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) return mixc(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1));
  return stops[stops.length - 1][1];
}

class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Float32Array(w * h * 4); }
  over(x, y, rgb, a) {
    if (a <= 0.0005) return;
    const i = (y * this.w + x) * 4, d = this.d, A = d[i + 3], oa = a + A * (1 - a);
    d[i] = (rgb[0] * a + d[i] * A * (1 - a)) / oa; d[i + 1] = (rgb[1] * a + d[i + 1] * A * (1 - a)) / oa; d[i + 2] = (rgb[2] * a + d[i + 2] * A * (1 - a)) / oa; d[i + 3] = oa;
  }
  toRGBA() { // 8-bit, with a whisper of ordered noise so long gradients do not band
    const out = new Uint8Array(this.w * this.h * 4);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = (y * this.w + x) * 4, n = (((x * 7 + y * 13) & 15) / 15 - 0.5) / 255;
      for (let c = 0; c < 3; c++) out[i + c] = clamp(Math.round((this.d[i + c] + n) * 255), 0, 255);
      out[i + 3] = clamp(Math.round(this.d[i + 3] * 255), 0, 255);
    }
    return out;
  }
}

// ---------------------------------------------------------------------------------------------- shapes (signed distance, in pixels)
const sdArcRound = (px, py, R, half, T) => {            // a ring open on the right (|angle| < half), round ends
  const r = Math.hypot(px, py), th = Math.atan2(py, px);
  if (Math.abs(th) >= half) return Math.abs(r - R) - T / 2;
  const ex = R * Math.cos(half), ey = R * Math.sin(half);
  return Math.min(Math.hypot(px - ex, py - ey), Math.hypot(px - ex, py + ey)) - T / 2;
};
const sdRoundRect = (px, py, hx, hy, r) => { const qx = Math.abs(px) - (hx - r), qy = Math.abs(py) - (hy - r); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; };
const P5 = 5;
const sdSquircle = (px, py, a) => { const f = Math.pow(Math.pow(Math.abs(px) / a, P5) + Math.pow(Math.abs(py) / a, P5), 1 / P5); return (f - 1) * a * 0.93; };
const cov = (d) => clamp(0.5 - d, 0, 1);

const GREEN = { top: hex('#6ae79a'), mid: hex('#25bb5d'), bot: hex('#0b6a34'), deep: hex('#05361b'), light: hex('#b9f7d0') };

/** The glyph's geometry for a tile whose half-width is a (pixels), centred at (cx, cy). */
function glyphGeom(cx, cy, a) {
  return { cx: cx - 0.075 * a, cy, R: 0.5 * a, T: 0.215 * a, half: (39 * Math.PI) / 180, bitX: cx - 0.075 * a + 0.545 * a, bitS: 0.1 * a, bitR: 0.045 * a };
}
const sdGlyph = (g, x, y) => Math.min(sdArcRound(x - g.cx, y - g.cy, g.R, g.half, g.T), sdRoundRect(x - g.bitX, y - g.cy, g.bitS, g.bitS, g.bitR));

/** Light from the top left: shade a raised white/green surface from its distance field. */
function shadeGlyph(g, x, y, d, fill) {
  const e = 0.9, nx = sdGlyph(g, x + e, y) - sdGlyph(g, x - e, y), ny = sdGlyph(g, x, y + e) - sdGlyph(g, x, y - e), nl = Math.hypot(nx, ny) || 1;
  const lit = (nx / nl) * -0.45 + (ny / nl) * -0.89;           // dot with the light direction
  const bevel = 1 - smooth(0, Math.max(1.4, g.T * 0.17), -d);  // 1 at the rim, 0 deep inside
  const t = (y - (g.cy - g.R - g.T / 2)) / (2 * g.R + g.T);
  let c = ramp(fill, t);
  if (lit > 0) c = mixc(c, [1, 1, 1], lit * bevel * 0.85); else c = mixc(c, GREEN.mid, -lit * bevel * 0.45);
  return c;
}

/** The tile mark. style 'mark' fills the canvas (favicons, web), 'app' is a macOS-style icon with margin and a soft shadow. */
function renderMark(S, style) {
  const cv = new Canvas(S, S), cx = S / 2, cy = S / 2, app = style === 'app';
  const a = (app ? 0.405 : 0.485) * S, k = Math.max(S / 512, 0.3), g = glyphGeom(cx, cy, a);
  const fillGlyph = [[0, hex('#ffffff')], [0.55, hex('#eefcf3')], [1, hex('#c2f0d4')]];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const px = x + 0.5 - cx, py = y + 0.5 - cy;
    if (app) { const sd = sdSquircle(px, py - 0.022 * S, a * 1.0); cv.over(x, y, GREEN.deep, 0.42 * (1 - smooth(-0.004 * S, 0.034 * S, sd)) * (sd > -0.5 ? 1 : 1)); }
    const d = sdSquircle(px, py, a), c = cov(d);
    if (c <= 0) continue;
    const tY = (py / a + 1) / 2, inner = -d;
    let col = ramp([[0, GREEN.top], [0.5, GREEN.mid], [1, GREEN.bot]], tY);
    col = mixc(col, [1, 1, 1], 0.17 * Math.exp(-(Math.pow(px / a + 0.42, 2) + Math.pow(py / a + 0.55, 2)) / 0.42));    // soft light from the upper left
    col = mixc(col, GREEN.deep, 0.22 * smooth(0.55, 1.1, tY));                                                           // bottom falloff
    // normal of the squircle edge, for the lit rim above and the shaded rim below
    const nxs = Math.sign(px) * Math.pow(Math.abs(px) / a, P5 - 1), nys = Math.sign(py) * Math.pow(Math.abs(py) / a, P5 - 1), nl = Math.hypot(nxs, nys) || 1, ny = nys / nl;
    const rimW = Math.max(1.2, 6 * k);
    col = mixc(col, [1, 1, 1], 0.55 * Math.max(0, -ny) * (1 - smooth(0, rimW, inner)));
    col = mixc(col, GREEN.deep, 0.45 * Math.max(0, ny) * (1 - smooth(0, rimW * 1.6, inner)));
    col = mixc(col, GREEN.deep, 0.5 * (1 - smooth(0, Math.max(1, 1.6 * k), inner)));                                      // hairline edge
    // glass gloss over the upper half
    if (S >= 40) { const gx = px / (0.98 * a), gy = (py + 0.5 * a) / (0.66 * a), gl = clamp(1 - (gx * gx + gy * gy), 0, 1); col = mixc(col, [1, 1, 1], 0.24 * smooth(0, 0.55, gl) * (1 - smooth(0.1, 1.0, tY))); }
    cv.over(x, y, col, c);
    // the glyph: shadow first, then the lit surface
    const gd = sdGlyph(g, x + 0.5, y + 0.5);
    const sh = sdGlyph(g, x + 0.5, y + 0.5 - 0.05 * a);
    cv.over(x, y, GREEN.deep, c * 0.45 * (1 - smooth(-0.02 * a, 0.075 * a, sh)) * (gd > 0 ? 1 : 0));
    const gc = cov(gd);
    if (gc > 0) cv.over(x, y, S >= 40 ? shadeGlyph(g, x + 0.5, y + 0.5, gd, fillGlyph) : ramp(fillGlyph, (y - (g.cy - g.R)) / (2 * g.R)), gc);
  }
  return cv;
}

/** The glyph on its own: 'green' | 'white' | 'black'. */
function renderGlyph(S, variant) {
  const cv = new Canvas(S, S), a = 0.52 * S, g = glyphGeom(S / 2 + 0.075 * a, S / 2, a);
  const fills = { green: [[0, hex('#6ae79a')], [0.5, hex('#25bb5d')], [1, hex('#0e7a3b')]], white: [[0, hex('#ffffff')], [1, hex('#ffffff')]], black: [[0, hex('#1d1d1f')], [1, hex('#1d1d1f')]] }[variant];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const gd = sdGlyph(g, x + 0.5, y + 0.5), gc = cov(gd);
    if (gc <= 0) continue;
    cv.over(x, y, variant === 'green' && S >= 40 ? shadeGlyph(g, x + 0.5, y + 0.5, gd, fills) : ramp(fills, (y - (g.cy - g.R)) / (2 * g.R)), gc);
  }
  return cv;
}

// ---------------------------------------------------------------------------------------------- wordmark from the Cohn Sans outlines
const OUT = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fonts', 'wordmark-outlines.json'), 'utf8'));
/** Fill closed polygons (nonzero rule) with area coverage; transform maps font units to pixels. */
function fillContours(cv, contours, tx, color) {
  const SS = 5, W = cv.w, H = cv.h, acc = new Float32Array(W * H);
  const polys = contours.map((c) => c.map(([x, y]) => tx(x, y)));
  let minY = Infinity, maxY = -Infinity; for (const p of polys) for (const [, y] of p) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(H - 1, Math.ceil(maxY)); y++) for (let s = 0; s < SS; s++) {
    const sy = y + (s + 0.5) / SS, xs = [];
    for (const p of polys) for (let i = 0; i < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length]; if ((y0 <= sy && y1 > sy) || (y1 <= sy && y0 > sy)) xs.push([x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0), y1 > y0 ? 1 : -1]); }
    xs.sort((p, q) => p[0] - q[0]);
    let wind = 0;
    for (let i = 0; i < xs.length - 1; i++) {
      wind += xs[i][1];
      if (wind !== 0) { const xa = clamp(xs[i][0], 0, W), xb = clamp(xs[i + 1][0], 0, W); for (let x = Math.floor(xa); x < Math.ceil(xb); x++) acc[y * W + x] += (Math.min(x + 1, xb) - Math.max(x, xa)) / SS; }
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = clamp(acc[y * W + x], 0, 1); if (c > 0) cv.over(x, y, color, c); }
}
/** Draw "cohnsoft" with its left edge at x and baseline at y; fontPx is the height of one em. */
function drawWordmark(cv, x, baseline, fontPx, colorA, colorB) {
  const k = fontPx / OUT.unitsPerEm;
  OUT.letters.forEach((l, i) => fillContours(cv, l.contours, (ux, uy) => [x + ux * k, baseline - uy * k], i < 4 ? colorA : colorB));
  return OUT.width * k;
}
const wordmarkWidth = (fontPx) => (OUT.width * fontPx) / OUT.unitsPerEm;

/** Tile mark composited onto a canvas at (x, y) with the given size. */
function blit(dst, src, x0, y0) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4, a = src.d[i + 3]; if (a > 0 && dst.d && x0 + x >= 0 && x0 + x < dst.w && y0 + y >= 0 && y0 + y < dst.h) dst.over(x0 + x, y0 + y, [src.d[i], src.d[i + 1], src.d[i + 2]], a); } }

/** Horizontal lockup: the tile mark and the wordmark, width W, height H. */
function renderLockup(W, H, dark, glyphOnly) {
  const cv = new Canvas(W, H), pad = Math.round(H * 0.08), m = H - pad * 2;
  blit(cv, glyphOnly ? renderGlyph(m, 'green') : renderMark(m, 'mark'), pad, pad);
  const px = pad + m + Math.round(m * 0.24), fontPx = m * 0.78;
  const avail = W - px - pad, size = Math.min(fontPx, (avail / OUT.width) * OUT.unitsPerEm);
  const k = size / OUT.unitsPerEm, baseline = pad + m / 2 + (OUT.xHeight * k) / 2;
  drawWordmark(cv, px, baseline, size, dark ? hex('#ffffff') : hex('#1d1d1f'), dark ? hex('#7aeca6') : hex('#25bb5d'));
  return cv;
}
function renderWordmark(W, H, colorA, colorB) {
  const cv = new Canvas(W, H), size = Math.min(H * 0.9 / ((OUT.ascender - OUT.descender) / OUT.unitsPerEm), (W * 0.96 / OUT.width) * OUT.unitsPerEm), k = size / OUT.unitsPerEm;
  drawWordmark(cv, (W - OUT.width * k) / 2, H / 2 + (OUT.xHeight * k) / 2, size, colorA, colorB);
  return cv;
}
function renderStacked(W, H) {
  const cv = new Canvas(W, H), m = Math.round(H * 0.58);
  blit(cv, renderMark(m, 'mark'), Math.round((W - m) / 2), Math.round(H * 0.06));
  const size = Math.min((W * 0.74 / OUT.width) * OUT.unitsPerEm, H * 0.3), k = size / OUT.unitsPerEm;
  drawWordmark(cv, (W - OUT.width * k) / 2, Math.round(H * 0.06) + m + H * 0.06 + OUT.xHeight * k + 4, size, hex('#1d1d1f'), hex('#25bb5d'));
  return cv;
}

// ---------------------------------------------------------------------------------------------- wallpaper: sweeping tinted curves
function renderWallpaper(W, H, dark) {
  const cv = new Canvas(W, H), u = Math.max(W, H);
  const base = dark ? [[0, hex('#0f5a2d')], [0.55, hex('#0a3d20')], [1, hex('#04200f')]] : [[0, hex('#9cf0bb')], [0.5, hex('#3fcb78')], [1, hex('#10713a')]];
  // big overlapping sweeps: [centre x, centre y, radius, strength, lighten(1) or deepen(0)]
  const arcs = [[-0.1, 1.12, 0.9, 0.30, 1], [0.8, 1.4, 1.02, 0.34, 0], [0.4, 1.6, 1.0, 0.30, 1], [1.1, 0.1, 0.62, 0.18, 1]];
  const deep = hex('#05361b');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = x / W, ny = y / H;
    let col = ramp(base, ny * 0.8 + (1 - nx) * 0.25);
    for (const [ax, ay, ar, amt, up] of arcs) {
      const d = (Math.hypot((nx - ax) * (W / u), (ny - ay) * (H / u)) - ar * (H / u + 0.2)) * u;
      if (d < 0) { const depth = clamp(-d / (0.4 * u), 0, 1); col = mixc(col, up ? [1, 1, 1] : deep, amt * (dark ? 0.5 : 1) * (0.3 + 0.7 * (1 - depth))); }
      const edge = Math.exp(-(d * d) / (2 * Math.pow(0.0035 * u + 1, 2)));
      col = mixc(col, [1, 1, 1], (dark ? 0.14 : 0.2) * edge);
    }
    cv.over(x, y, col, 1);
  }
  return cv;
}
function renderSocial(W, H) {
  const cv = renderWallpaper(W, H, false), lk = renderLockup(Math.round(W * 0.72), Math.round(H * 0.3), true, false);
  // a soft frosted plate behind the lockup
  const px = Math.round((W - lk.w) / 2), py = Math.round((H - lk.h) / 2), r = lk.h * 0.34;
  for (let y = py - 18; y < py + lk.h + 18; y++) for (let x = px - 28; x < px + lk.w + 28; x++) { if (x < 0 || y < 0 || x >= W || y >= H) continue; const d = sdRoundRect(x + 0.5 - W / 2, y + 0.5 - H / 2, lk.w / 2 + 28, lk.h / 2 + 18, r + 18); cv.over(x, y, [0.02, 0.17, 0.09], 0.5 * cov(d)); cv.over(x, y, [1, 1, 1], 0.05 * cov(d)); }
  blit(cv, lk, px, py);
  return cv;
}

module.exports = { Canvas, renderMark, renderGlyph, renderLockup, renderWordmark, renderStacked, renderWallpaper, renderSocial, hex, wordmarkWidth, glyphGeom, GREEN };
