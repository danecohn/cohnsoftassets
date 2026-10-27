'use strict';
// Procedural pixel artwork for the VigilTech identity. Everything returns grids of palette indices (-1 = transparent),
// which build.js draws into AltStack Sprite documents with Sprite's own tools and exports with Sprite's PNG engine.
const { BAYER } = require('./palette');

// Palette layout shared by every sprite: 0-7 the pink tile ramp, 8-11 the white glyph ramp, 12-15 ink and neutrals.
const COLORS = ['#ff8fb3', '#ff6a9b', '#ff3d7f', '#ff0058', '#d6004a', '#a8003a', '#7a002b', '#4a0019', '#ffffff', '#fff1f6', '#ffc2d6', '#ff93b8', '#17101a', '#6b5d68', '#f6f1f4', '#2a000f'];
const I = { g0: 0, g1: 1, g2: 2, g3: 3, g4: 4, g5: 5, g6: 6, g7: 7, w0: 8, w1: 9, w2: 10, w3: 11, ink: 12, gray: 13, mist: 14, deep: 15 };

const grid = (w, h, v) => Array.from({ length: h }, () => new Array(w).fill(v === undefined ? -1 : v));
const dither = (u, K, x, y) => { const level = Math.max(0, Math.min(1, u)) * (K - 1); const base = Math.floor(level); return Math.min(K - 1, base + ((level - base) > BAYER[y & 3][x & 3] ? 1 : 0)); };

/** Squircle test (superellipse: the continuous-corner shape of a modern app icon). */
function squircle(n, x, y, inset) {
  const a = n / 2 - (inset || 0), px = Math.abs(x + 0.5 - n / 2) / a, py = Math.abs(y + 0.5 - n / 2) / a;
  return Math.pow(px, 5) + Math.pow(py, 5) <= 1;
}

const hd = require('./hd.js');
/** Geometry of the lamp for a tile of n pixels (the same shapes as the HD mark, sampled per pixel). */
function geom(n) { return hd.glyphGeom(n / 2, n / 2, n * 0.5 * 0.8, false); }
function inGlyph(g, x, y) { return hd.sdGlyph(g, x + 0.5, y + 0.5) < 0; }
/** Glyph colour by height: white at the top shading down to pale pink, so it reads as a raised, lit object. */
function glyphShade(g, y, ramp) {
  const t = Math.max(0, Math.min(0.999, (y - (g.cy - g.R)) / (2 * g.R)));
  return ramp[Math.floor(t * ramp.length)];
}

/** The primary mark: pink squircle tile, white C with its bit, a drop shadow, a lit top edge. */
function tile(n) {
  const g = geom(n), out = grid(n, n), lights = [I.w0, I.w1, I.w2, I.w3];
  const glyph = grid(n, n, 0);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) glyph[y][x] = inGlyph(g, x, y) ? 1 : 0;
  const sh = Math.max(1, Math.round(n / 28));
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!squircle(n, x, y)) continue;
    const u = 0.1 + 0.84 * (y / (n - 1)) - 0.2 * Math.exp(-(Math.pow(x - n * 0.28, 2) + Math.pow(y - n * 0.12, 2)) / Math.pow(n * 0.55, 2));
    let c = dither(u, 8, x, y);
    if (n >= 24 && !squircle(n, x, y, 1.2)) c = I.g7;                                                   // crisp dark edge
    else if (n >= 32 && y < n * 0.45 && !squircle(n, x, y - 1.6, 1.2)) c = Math.max(0, c - 2);          // lit upper rim
    else if (y - sh >= 0 && glyph[y - sh][x] && !glyph[y][x]) c = I.g6;                                 // glyph shadow
    if (glyph[y][x]) c = glyphShade(g, y, lights);
    out[y][x] = c;
  }
  return out;
}

/** The glyph alone, for any background. ramp: palette indices from top to bottom (one entry = flat colour). */
function glyphOnly(n, ramp) {
  const g = geom(n), out = grid(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (inGlyph(g, x, y)) out[y][x] = ramp.length === 1 ? ramp[0] : glyphShade(g, y, ramp);
  return out;
}

// ---------------------------------------------------------------------------------------------- wordmark
// Lowercase letters built from 3-pixel strokes on an 11-pixel x-height, as rows of 0/1.
const XH = 11, ASC = 4;
const mk = (w, h) => Array.from({ length: h }, () => new Array(w).fill(0));
const rect = (m, x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y] && m[y][x] !== undefined) m[y][x] = v === undefined ? 1 : v; };
const roundCorners = (m, x0, y0, x1, y1, tl, tr, br, bl) => {
  const cut = (cx, cy, dx, dy, r) => { for (let i = 0; i < r; i++) for (let j = 0; j < r - i; j++) if (m[cy + dy * j] && m[cy + dy * j][cx + dx * i] !== undefined) m[cy + dy * j][cx + dx * i] = 0; };
  if (tl) cut(x0, y0, 1, 1, tl); if (tr) cut(x1, y0, -1, 1, tr); if (br) cut(x1, y1, -1, -1, br); if (bl) cut(x0, y1, 1, -1, bl);
};
const GLYPHS = {
  o() { const m = mk(11, XH); rect(m, 0, 0, 10, 10); roundCorners(m, 0, 0, 10, 10, 3, 3, 3, 3); rect(m, 3, 3, 7, 7, 0); roundCorners(m, 3, 3, 7, 7, 1, 1, 1, 1); return m; },
  c() { const m = GLYPHS.o(); rect(m, 7, 3, 10, 7, 0); return m; },
  n() { const m = mk(10, XH); rect(m, 0, 0, 9, 10); roundCorners(m, 0, 0, 9, 10, 3, 3, 0, 0); rect(m, 3, 3, 6, 10, 0); roundCorners(m, 3, 3, 6, 10, 1, 1, 0, 0); return m; },
  h() { const m = mk(10, XH + ASC), n = GLYPHS.n(); for (let y = 0; y < XH; y++) for (let x = 0; x < 10; x++) m[y + ASC][x] = n[y][x]; rect(m, 0, 0, 2, XH + ASC - 1); roundCorners(m, 0, 0, 2, 3, 1, 0, 0, 0); return m; },
  s() {
    const rows = ['.########.', '##########', '###.....##', '###.......', '.#######..', '..#######.', '.......###', '##.....###', '##########', '.########.', '..........'];
    return rows.slice(0, 10).map((r) => [...r].map((c) => (c === '#' ? 1 : 0))).concat([new Array(10).fill(0)]).slice(0, XH);
  },
  f() { const m = mk(8, XH + ASC); rect(m, 2, 1, 4, XH + ASC - 1); rect(m, 2, 0, 7, 2); roundCorners(m, 2, 0, 7, 2, 2, 1, 0, 0); rect(m, 0, ASC, 7, ASC + 2); return m; },
  t() { const m = mk(8, XH + ASC - 1); rect(m, 2, 1, 4, XH + ASC - 2); rect(m, 0, ASC - 1, 7, ASC + 1); rect(m, 4, XH + ASC - 4, 7, XH + ASC - 2); roundCorners(m, 2, XH + ASC - 4, 7, XH + ASC - 2, 0, 0, 2, 0); return m; },
};
const ADV = { c: 11, o: 12, h: 11, n: 11, s: 11, f: 8, t: 8 };
/** The word "vigiltech" at an integer scale; 'A' marks the letters of "cohn", 'B' the letters of "soft", -1 is empty. */
function wordmark(scale) {
  const word = 'vigiltech', gap = 2, H = (XH + ASC) * scale;
  let width = 0; for (const ch of word) width += ADV[ch] + gap; width = (width - gap) * scale;
  const out = grid(width, H, -1);
  let x0 = 0;
  [...word].forEach((ch, k) => {
    const gl = GLYPHS[ch](), yOff = (XH + ASC) - gl.length, part = k < 4 ? 'A' : 'B';
    for (let y = 0; y < gl.length; y++) for (let x = 0; x < gl[y].length; x++) if (gl[y][x]) for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) out[(y + yOff) * scale + sy][(x0 + x) * scale + sx] = part;
    x0 += ADV[ch] + gap;
  });
  return out;
}
const recolor = (g, a, b) => g.map((r) => r.map((v) => (v === 'A' ? a : v === 'B' ? b : v)));
function paste(dst, src, x, y) { for (let j = 0; j < src.length; j++) for (let i = 0; i < src[0].length; i++) if (src[j][i] !== -1 && dst[y + j] && dst[y + j][x + i] !== undefined) dst[y + j][x + i] = src[j][i]; return dst; }

/** Horizontal lockup: the mark, then the wordmark centred on it. markGrid is a tile or a glyph. */
function lockup(markGrid, textA, textB, scale, pad) {
  const word = recolor(wordmark(scale), textA, textB), n = markGrid.length, gap = Math.round(n * 0.26);
  const out = grid(pad * 2 + n + gap + word[0].length, pad * 2 + n, -1);
  paste(out, markGrid, pad, pad);
  paste(out, word, pad + n + gap, pad + Math.round((n - word.length) / 2) + Math.round(scale * 1.5));
  return out;
}

/** Pixel-art "wallpaper": sweeping curves in the pinks, dithered so the gradients stay smooth. */
function wallpaper(w, h, dark) {
  const out = grid(w, h);
  const field = (x, y) => {
    const u = x / w, v = y / h;
    let t = 0.2 + 0.55 * v;
    for (const [cx, cy, r, amt] of [[0.05, 1.18, 0.78, 0.2], [0.78, 1.25, 0.9, 0.17], [0.5, 1.5, 0.95, 0.22], [-0.1, 0.5, 0.55, 0.12]]) { const d = Math.hypot((u - cx) * (w / h), v - cy); if (d < r) t -= amt * Math.pow(1 - d / r, 0.7); }
    return Math.max(0, Math.min(1, t));
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let t = field(x, y); if (dark) t = 0.45 + t * 0.55; out[y][x] = dither(t, 8, x, y); }
  return out;
}

module.exports = { COLORS, I, grid, tile, glyphOnly, wordmark, recolor, paste, lockup, wallpaper, geom };
