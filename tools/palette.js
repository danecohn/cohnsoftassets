'use strict';
// Cohnsoft colour system. One green, a family of neutrals, and the ramps the pixel artwork is drawn with.
const GREEN = {
  // The ramp of the app tile, light to dark. g3 is "Cohnsoft Green", the brand's primary colour.
  g0: '#7cf0a0', g1: '#4cdb7e', g2: '#2fc866', g3: '#22b45a', g4: '#1a9b4d', g5: '#138340', g6: '#0d6a34', g7: '#085228',
};
const INK = { ink: '#1d1d1f', ink2: '#3a3a3c', gray: '#636366', mist: '#f2f2f7', paper: '#ffffff', night: '#1c1c1e', night2: '#2c2c2e' };
// Ordered (Bayer 4x4) dithering threshold, 0..1, for smooth pixel-art gradients.
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const luminance = (h) => { const c = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
module.exports = { GREEN, INK, BAYER, hex, contrast };
