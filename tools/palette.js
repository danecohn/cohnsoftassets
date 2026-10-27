'use strict';
// Cohnsoft colour system. One pink, a family of plum-tinted neutrals, and the ramps the pixel artwork is drawn with.
const PINK = { 50: '#fff0f5', 100: '#ffd6e4', 200: '#ffadc9', 300: '#ff7aa6', 400: '#ff4d86', 500: '#ff0058', 600: '#d6004a', 700: '#a8003a', 800: '#7a002b', 900: '#3d0016' };   // 500 is Cohnsoft Pink
const INK = { ink: '#17101a', graphite: '#6b5d68', bone: '#f6f1f4', paper: '#fffbfd', night: '#120a14', nightRaised: '#1e1422' };
// Ordered (Bayer 4x4) dithering threshold, 0..1, for smooth pixel-art gradients.
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const luminance = (h) => { const c = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
module.exports = { PINK, INK, BAYER, hex, contrast };
