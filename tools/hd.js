'use strict';
// High-detail renderer for the VigilTech identity: smooth true-colour artwork with bevels, a lit rim, glass gloss and soft shadows.
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
const sdRoundRect = (px, py, hx, hy, r) => { const qx = Math.abs(px) - (hx - r), qy = Math.abs(py) - (hy - r); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; };
const P5 = 5;
const sdSquircle = (px, py, a) => { const f = Math.pow(Math.pow(Math.abs(px) / a, P5) + Math.pow(Math.abs(py) / a, P5), 1 / P5); return (f - 1) * a * 0.93; };
const cov = (d) => clamp(0.5 - d, 0, 1);
const circle = (px, py, r) => Math.hypot(px, py) - r;

// The mark: a vigil lamp. A flame (a vesica, the lens made by two pointed arches) above a bowl (an upside-down lancet arch),
// with a small cross cut into the bowl and the four-point glint beside the flame.
const TAPER_MIN = 0.3;
const FLAME = { y: -0.36, hh: 0.27, hw: 0.125, tilt: 9 * Math.PI / 180 }, BOWL = { w: 0.36, top: 0.0, rho: 0.06 }, GLINT = { x: 0.47, y: -0.44, r: 0.1 };
/** Distance (in glyph units) to the flame: the intersection of two circles, tilted a little so it flickers. */
const sdFlame = (u, v) => {
  const R = (FLAME.hh * FLAME.hh + FLAME.hw * FLAME.hw) / (2 * FLAME.hw), c = R - FLAME.hw, ca = Math.cos(FLAME.tilt), sa = Math.sin(FLAME.tilt), px = u, py = v - FLAME.y;
  const lx = px * ca + py * sa, ly = -px * sa + py * ca;
  return Math.max(Math.hypot(lx - c, ly) - R, Math.hypot(lx + c, ly) - R);
};
/** The bowl: an inverted lancet, corners rounded by rho; optional cross cut out of it. */
const sdBowl = (u, v, cross) => {
  const R1 = 2 * BOWL.w - BOWL.rho, d = Math.max(Math.hypot(u + BOWL.w, v - BOWL.top) - R1, Math.hypot(u - BOWL.w, v - BOWL.top) - R1, BOWL.top + BOWL.rho - v) - BOWL.rho;
  if (!cross) return d;
  const box = (x, y, hx, hy) => Math.max(Math.abs(x) - hx, Math.abs(y) - hy), cr = Math.min(box(u, v - 0.27, 0.028, 0.15), box(u, v - 0.2, 0.09, 0.028));
  return Math.max(d, -cr);
};
const sdStar = (px, py, r) => { const ax = Math.abs(px), ay = Math.abs(py); return Math.max(Math.max(ax, ay) - r, -(Math.hypot(ax - r, ay - r) - r)); };
/** The lancet (pointed) arch, in unit coordinates: u across -1..1, v up 0..1 (apex). Returns >0 inside. */
const lancet = (u, v) => 1 - ((Math.abs(u) + 1) * (Math.abs(u) + 1) + 3 * v * v) / 4;

// VigilTech Pink #ff0058 over plum-black: the one colour, and the dark it sits in.
const PINK = { hi: hex('#ff6a9b'), top: hex('#ff5c8f'), mid: hex('#ff0058'), bot: hex('#5a001f'), deep: hex('#1f0009'), wine: hex('#3d0016'), glow: hex('#ff8fb3') };

/** The glyph's geometry for a tile whose half-width is a (pixels), centred at (cx, cy). */
function glyphGeom(cx, cy, a, cross) {
  return { cx, cy: cy + 0.0 * a, a, sc: 1.2, cross: !!cross, R: 0.62 * a * 1.2, T: 0.235 * a };
}
const sdGlyph = (g, x, y) => { const k = g.a * g.sc, u = (x - g.cx) / k, v = (y - g.cy) / k; return Math.min(sdFlame(u, v), sdBowl(u, v, g.cross), sdStar(u - GLINT.x, v - GLINT.y, GLINT.r)) * k; };

/** Light from the top left: shade a raised bone-white surface from its distance field. */
function shadeGlyph(g, x, y, d, fill) {
  const e = 0.9, nx = sdGlyph(g, x + e, y) - sdGlyph(g, x - e, y), ny = sdGlyph(g, x, y + e) - sdGlyph(g, x, y - e), nl = Math.hypot(nx, ny) || 1;
  const lit = (nx / nl) * -0.45 + (ny / nl) * -0.89;
  const bevel = 1 - smooth(0, Math.max(1.4, g.T * 0.17), -d);
  const t = (y - (g.cy - g.R - g.T / 2)) / (2 * g.R + g.T);
  let c = ramp(fill, t);
  if (lit > 0) c = mixc(c, [1, 1, 1], lit * bevel * 0.85); else c = mixc(c, PINK.mid, -lit * bevel * 0.5);
  return c;
}

/** The tile mark. style 'mark' fills the canvas (favicons, web), 'app' is a desktop-style icon with margin and a soft shadow. */
function renderMark(S, style) {
  const cv = new Canvas(S, S), cx = S / 2, cy = S / 2, app = style === 'app';
  const a = (app ? 0.405 : 0.485) * S, k = Math.max(S / 512, 0.3), g = glyphGeom(cx, cy, a, S >= 64);
  const fillGlyph = [[0, hex('#ffffff')], [0.55, hex('#fff1f6')], [1, hex('#ffc2d6')]];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const px = x + 0.5 - cx, py = y + 0.5 - cy;
    if (app) { const sd = sdSquircle(px, py - 0.022 * S, a); cv.over(x, y, PINK.deep, 0.5 * (1 - smooth(-0.004 * S, 0.034 * S, sd))); }
    const d = sdSquircle(px, py, a), c = cov(d);
    if (c <= 0) continue;
    const tY = (py / a + 1) / 2, inner = -d, rr = Math.pow(Math.pow(Math.abs(px) / a, P5) + Math.pow(Math.abs(py) / a, P5), 1 / P5);
    let col = ramp([[0, PINK.top], [0.4, PINK.mid], [1, hex('#7d002c')]], tY);
    col = mixc(col, [1, 1, 1], 0.14 * Math.exp(-(Math.pow(px / a + 0.42, 2) + Math.pow(py / a + 0.55, 2)) / 0.4));       // soft light from the upper left
    col = mixc(col, PINK.wine, 0.34 * smooth(0.66, 1.04, rr));                                                           // gothic vignette: the corners fall into wine
    const nxs = Math.sign(px) * Math.pow(Math.abs(px) / a, P5 - 1), nys = Math.sign(py) * Math.pow(Math.abs(py) / a, P5 - 1), nl = Math.hypot(nxs, nys) || 1, ny = nys / nl;
    const rimW = Math.max(1.2, 6 * k);
    col = mixc(col, PINK.glow, 0.55 * Math.max(0, -ny) * (1 - smooth(0, rimW, inner)));
    col = mixc(col, PINK.deep, 0.5 * Math.max(0, ny) * (1 - smooth(0, rimW * 1.6, inner)));
    col = mixc(col, PINK.deep, 0.7 * (1 - smooth(0, Math.max(1, 1.8 * k), inner)));                                      // dark edge
    // the gloss is a pointed arch, like a lancet window catching the light
    if (S >= 40) { const u = px / (0.96 * a), v = (0.1 * a - py) / (1.02 * a), gl = v > 0 ? lancet(u, v) : 0; col = mixc(col, [1, 1, 1], 0.2 * smooth(0, 0.5, gl) * (1 - v * 0.75) * smooth(0, 0.12, v)); }
    cv.over(x, y, col, c);
    const gd = sdGlyph(g, x + 0.5, y + 0.5), sh = sdGlyph(g, x + 0.5, y + 0.5 - 0.05 * a);
    cv.over(x, y, PINK.deep, c * 0.55 * (1 - smooth(-0.012 * a, 0.045 * a, sh)) * (gd > 0 ? 1 : 0));
    const gc = cov(gd);
    if (gc > 0) cv.over(x, y, S >= 40 ? shadeGlyph(g, x + 0.5, y + 0.5, gd, fillGlyph) : ramp(fillGlyph, (y - (g.cy - g.R)) / (2 * g.R)), gc);
  }
  return cv;
}

/** The glyph on its own: 'pink' | 'white' | 'black'. */
function renderGlyph(S, variant) {
  const cv = new Canvas(S, S), a = 0.5 * S * 0.9, g = glyphGeom(S / 2, S / 2, a, S >= 64);
  const fills = { pink: [[0, hex('#ff6a9b')], [0.5, hex('#ff0058')], [1, hex('#a8003a')]], white: [[0, hex('#ffffff')], [1, hex('#ffffff')]], black: [[0, hex('#17101a')], [1, hex('#17101a')]] }[variant];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const gd = sdGlyph(g, x + 0.5, y + 0.5), gc = cov(gd);
    if (gc <= 0) continue;
    cv.over(x, y, variant === 'pink' && S >= 40 ? shadeGlyph(g, x + 0.5, y + 0.5, gd, fills) : ramp(fills, (y - (g.cy - g.R)) / (2 * g.R)), gc);
  }
  return cv;
}

// ---------------------------------------------------------------------------------------------- wordmark from the Vigil Sans outlines
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
/** Draw "vigiltech" with its left edge at x and baseline at y; fontPx is the height of one em. */
function drawWordmark(cv, x, baseline, fontPx, colorA, colorB) {
  const k = fontPx / OUT.unitsPerEm;
  OUT.letters.forEach((l, i) => fillContours(cv, l.contours, (ux, uy) => [x + ux * k, baseline - uy * k], i < 5 ? colorA : colorB));
  return OUT.width * k;
}
const wordmarkWidth = (fontPx) => (OUT.width * fontPx) / OUT.unitsPerEm;

/** Tile mark composited onto a canvas at (x, y) with the given size. */
function blit(dst, src, x0, y0) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4, a = src.d[i + 3]; if (a > 0 && dst.d && x0 + x >= 0 && x0 + x < dst.w && y0 + y >= 0 && y0 + y < dst.h) dst.over(x0 + x, y0 + y, [src.d[i], src.d[i + 1], src.d[i + 2]], a); } }

/** Tile mark composited onto a canvas at (x, y). */
function blit(dst, src, x0, y0) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4, a = src.d[i + 3]; if (a > 0 && x0 + x >= 0 && x0 + x < dst.w && y0 + y >= 0 && y0 + y < dst.h) dst.over(x0 + x, y0 + y, [src.d[i], src.d[i + 1], src.d[i + 2]], a); } }
const INK = hex('#17101a'), BONE = hex('#f7eef2'), PINK_TEXT_DARK = hex('#ff4d86');

/** Horizontal lockup: the tile mark and the wordmark. */
function renderLockup(W, H, dark, glyphOnly) {
  const cv = new Canvas(W, H), pad = Math.round(H * 0.08), m = H - pad * 2;
  blit(cv, glyphOnly ? renderGlyph(m, 'pink') : renderMark(m, 'mark'), pad, pad);
  const px = pad + m + Math.round(m * 0.24), fontPx = m * 0.78;
  const avail = W - px - pad, size = Math.min(fontPx, (avail / OUT.width) * OUT.unitsPerEm);
  const k = size / OUT.unitsPerEm, baseline = pad + m / 2 + (OUT.xHeight * k) / 2;
  drawWordmark(cv, px, baseline, size, dark ? BONE : INK, dark ? PINK_TEXT_DARK : PINK.mid);
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
  drawWordmark(cv, (W - OUT.width * k) / 2, Math.round(H * 0.06) + m + H * 0.06 + OUT.xHeight * k + 4, size, INK, PINK.mid);
  return cv;
}

// ---------------------------------------------------------------------------------------------- wallpaper: night, pink glow, pointed arches
/** 'night' (default, plum-black with a pink glow) or 'dawn' (bone and rose). Sweeping curves, a faint crescent, tiny glints, and a row of lancet arches. */
function renderWallpaper(W, H, dark) {
  const cv = new Canvas(W, H), u = Math.max(W, H);
  const base = dark ? [[0, hex('#140812')], [0.5, hex('#2b0a1e')], [1, hex('#5a0a2c')]] : [[0, hex('#fff4f8')], [0.5, hex('#ffc0d4')], [1, hex('#ff5c8f')]];
  const arcs = [[-0.1, 1.12, 0.9, 0.3, 1], [0.8, 1.4, 1.02, 0.36, 0], [0.4, 1.6, 1.0, 0.28, 1], [1.1, 0.1, 0.6, 0.14, 1]];
  const line = dark ? hex('#ff8fb3') : hex('#7a002b');
  const arches = []; const n = 7, hw = W / (2 * n); for (let i = 0; i < n; i++) arches.push([hw * (2 * i + 1), hw]);
  const stars = [[0.12, 0.2, 5], [0.31, 0.1, 3.4], [0.62, 0.17, 4.4], [0.83, 0.3, 3], [0.92, 0.09, 5.4], [0.47, 0.32, 2.6], [0.07, 0.45, 2.8]].map(([sx, sy, sr]) => [sx * W, sy * H, sr * (u / 1280)]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const nx = x / W, ny = y / H;
    let col = ramp(base, clamp(ny * 0.85 + (1 - nx) * 0.2, 0, 1));
    if (dark) col = mixc(col, PINK.mid, 0.38 * Math.exp(-(Math.pow((nx - 0.62) * (W / u) * 2.2, 2) + Math.pow((ny - 1.05) * (H / u) * 2.4, 2))));   // the pink glow low in the frame
    for (const [ax, ay, ar, amt, up] of arcs) {
      const d = (Math.hypot((nx - ax) * (W / u), (ny - ay) * (H / u)) - ar * (H / u + 0.2)) * u;
      if (d < 0) { const depth = clamp(-d / (0.4 * u), 0, 1); col = mixc(col, up ? (dark ? PINK.glow : [1, 1, 1]) : (dark ? PINK.deep : hex('#e0004f')), amt * (dark ? (up ? 0.22 : 0.7) : (up ? 1 : 0.55)) * (0.3 + 0.7 * (1 - depth))); }
      col = mixc(col, dark ? PINK.glow : [1, 1, 1], (dark ? 0.1 : 0.2) * Math.exp(-(d * d) / (2 * Math.pow(0.0035 * u + 1, 2))));
    }
    // faint crescent, upper right
    const cR = 0.1 * u, cxm = W * 0.84, cym = H * 0.24, dc = circle(x - cxm, y - cym, cR), dn = circle(x - cxm - cR * 0.42, y - cym - cR * 0.1, cR * 0.9);
    const crescent = cov(Math.max(dc, -dn));
    if (crescent > 0) col = mixc(col, dark ? [1, 0.93, 0.96] : [1, 1, 1], (dark ? 0.2 : 0.4) * crescent);
    // pointed arches along the bottom: a tall outer arch and an inner one, drawn as thin lit lines
    for (const [ac, ahw] of arches) for (const sc of [1, 0.62]) {
      const w2 = ahw * sc * 0.94, uu = (x - ac) / w2, vv = (H + 0.02 * H - y) / w2;
      if (Math.abs(uu) > 1.25 || vv < 0) continue;
      const f = -lancet(uu, vv / 1.0), dpx = Math.abs(f) * w2 * 2 / (Math.abs(uu) + 1), a2 = Math.exp(-(dpx * dpx) / (2 * Math.pow(0.0016 * u + 0.8, 2)));
      if (a2 > 0.01) col = mixc(col, line, (dark ? 0.2 : 0.14) * a2 * (0.35 + 0.65 * smooth(0, 0.9, vv / (Math.sqrt(3) * w2 / w2 + 0.01))));
    }
    cv.over(x, y, col, 1);
  }
  for (const [sx, sy, sr] of stars) for (let y = Math.floor(sy - sr * 3); y <= Math.ceil(sy + sr * 3); y++) for (let x = Math.floor(sx - sr * 3); x <= Math.ceil(sx + sr * 3); x++) {
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const c2 = cov(sdStar(x + 0.5 - sx, y + 0.5 - sy, sr)); if (c2 > 0) cv.over(x, y, dark ? [1, 0.88, 0.93] : [1, 1, 1], (dark ? 0.7 : 0.8) * c2);
  }
  return cv;
}
function renderSocial(W, H) {
  const cv = renderWallpaper(W, H, true), lk = renderLockup(Math.round(W * 0.72), Math.round(H * 0.3), true, false);
  const px = Math.round((W - lk.w) / 2), py = Math.round((H - lk.h) / 2), r = lk.h * 0.34;
  for (let y = py - 18; y < py + lk.h + 18; y++) for (let x = px - 28; x < px + lk.w + 28; x++) { if (x < 0 || y < 0 || x >= W || y >= H) continue; const d = sdRoundRect(x + 0.5 - W / 2, y + 0.5 - H / 2, lk.w / 2 + 28, lk.h / 2 + 18, r + 18); cv.over(x, y, [0.08, 0.02, 0.06], 0.46 * cov(d)); cv.over(x, y, [1, 0.8, 0.9], 0.05 * cov(d)); }
  blit(cv, lk, px, py);
  return cv;
}

module.exports = { sdGlyph, FLAME, BOWL, GLINT, Canvas, renderMark, renderGlyph, renderLockup, renderWordmark, renderStacked, renderWallpaper, renderSocial, hex, wordmarkWidth, glyphGeom, PINK, sdStar, TAPER_MIN, lancet };
