'use strict';
// VigilTech's sound set, synthesised from scratch (no samples): a startup chime, bells, a chant-like piece in the Dorian mode, and soft interface sounds.
// Mono 16-bit WAV.  node tools/sound.js
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'sounds');
fs.mkdirSync(OUT, { recursive: true });
const TAU = Math.PI * 2;
const hz = (semi, base = 293.66) => base * Math.pow(2, semi / 12);   // semitones above D4

function wav(file, data, sr) {
  let peak = 0; for (const v of data) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.89 / peak : 1, buf = Buffer.alloc(44 + data.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + data.length * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(data[i] * g * 32767))), 44 + i * 2);
  fs.writeFileSync(path.join(OUT, file), buf);
  console.log(file, (data.length / sr).toFixed(1) + 's', 'peak before normalise', peak.toFixed(2));
}
/** Schroeder reverb: four combs into two allpasses. */
function reverb(x, sr, wet, size = 1) {
  const comb = (d, fb) => { const buf = new Float32Array(d), out = new Float32Array(x.length); let p = 0; for (let i = 0; i < x.length; i++) { const y = buf[p]; out[i] = y; buf[p] = x[i] + y * fb; p = (p + 1) % d; } return out; };
  const ap = (src, d, g) => { const buf = new Float32Array(d), out = new Float32Array(src.length); let p = 0; for (let i = 0; i < src.length; i++) { const b = buf[p], v = src[i] + b * g; out[i] = b - v * g; buf[p] = v; p = (p + 1) % d; } return out; };
  const c = [comb(Math.round(0.0297 * sr * size), 0.84), comb(Math.round(0.0371 * sr * size), 0.82), comb(Math.round(0.0411 * sr * size), 0.8), comb(Math.round(0.0437 * sr * size), 0.78)];
  let r = new Float32Array(x.length); for (let i = 0; i < x.length; i++) r[i] = (c[0][i] + c[1][i] + c[2][i] + c[3][i]) * 0.25;
  r = ap(ap(r, Math.round(0.005 * sr), 0.7), Math.round(0.0017 * sr), 0.7);
  const o = new Float32Array(x.length); for (let i = 0; i < x.length; i++) o[i] = x[i] * (1 - wet * 0.5) + r[i] * wet; return o;
}
const rnd = (() => { let s = 12345; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 * 2 - 1; }; })();

/** A struck bell: inharmonic partials, each fading at its own rate, with a short noisy strike. */
function bell(out, sr, start, f0, len, amp) {
  const P = [[0.5, 0.45, 1.0], [1, 1, 0.9], [1.19, 0.6, 0.7], [1.5, 0.35, 0.55], [2, 0.5, 0.5], [2.5, 0.25, 0.4], [3.01, 0.28, 0.3], [4.2, 0.16, 0.22], [5.4, 0.1, 0.16]];
  const n = Math.min(out.length - start, Math.round(len * sr));
  for (let i = 0; i < n; i++) {
    const t = i / sr; let v = 0;
    for (const [r, a, d] of P) v += a * Math.sin(TAU * f0 * r * t) * Math.exp(-t * (1.4 + 3.2 / d) * (0.5 + r * 0.25));
    v += rnd() * 0.25 * Math.exp(-t * 90);
    out[start + i] += v * amp * (1 - Math.exp(-t * 700));
  }
}
/** A choir-like voice: a sawtooth spectrum shaped by the formants of an open "ah", with vibrato and a slow swell. */
function voice(out, sr, start, f0, len, amp, formants) {
  const F = formants || [[700, 110, 1], [1100, 140, 0.55], [2600, 250, 0.2]], n = Math.min(out.length - start, Math.round(len * sr)), H = Math.floor(Math.min(sr / 2, 5000) / f0);
  const w = []; for (let h = 1; h <= H; h++) { const f = h * f0; let g = 0; for (const [fc, bw, a] of F) g += a * Math.exp(-Math.pow((f - fc) / bw, 2)); w.push((g + 0.04) / Math.pow(h, 0.6)); }
  for (let i = 0; i < n; i++) {
    const t = i / sr, env = Math.min(1, t / 0.28) * Math.min(1, (len - t) / 0.45), vib = 1 + 0.006 * Math.sin(TAU * 5.1 * t) * Math.min(1, t / 0.6); let v = 0;
    for (let h = 0; h < H; h++) v += w[h] * Math.sin(TAU * f0 * (h + 1) * vib * t);
    out[start + i] += v * env * amp;
  }
}
/** A soft organ-like pad tone. */
function pad(out, sr, start, f0, len, amp) {
  const n = Math.min(out.length - start, Math.round(len * sr));
  for (let i = 0; i < n; i++) { const t = i / sr, env = Math.min(1, t / 1.2) * Math.min(1, (len - t) / 1.5); out[start + i] += env * amp * (Math.sin(TAU * f0 * t) + 0.5 * Math.sin(TAU * f0 * 2 * t) + 0.25 * Math.sin(TAU * f0 * 3 * t) + 0.12 * Math.sin(TAU * f0 * 4 * t)); }
}

// ------------------------------------------------------------------ the pieces
{ // vigil-chime: four rising bell tones in the Dorian mode, then a long open fifth
  const sr = 44100, x = new Float32Array(sr * 6);
  [[0, 0], [7, 0.32], [12, 0.64], [15, 0.98]].forEach(([s, t]) => bell(x, sr, Math.round(t * sr), hz(s, 293.66), 4.2, 0.5));
  pad(x, sr, Math.round(1.1 * sr), hz(-12), 4.6, 0.12); pad(x, sr, Math.round(1.1 * sr), hz(-5), 4.6, 0.09);
  wav('vigil-chime.wav', reverb(x, sr, 0.5, 1.6), sr);
}
{ // bell: one stroke, for notifications
  const sr = 44100, x = new Float32Array(sr * 3.5); bell(x, sr, 0, 392, 3.3, 0.7); wav('bell.wav', reverb(x, sr, 0.3, 1.2), sr);
}
{ // angelus: three strokes, a pause, three, a pause, three, then nine in a row (the traditional pattern, shortened)
  const sr = 44100, x = new Float32Array(sr * 34); let t = 0.3;
  for (let grp = 0; grp < 3; grp++) { for (let k = 0; k < 3; k++) { bell(x, sr, Math.round(t * sr), 329.63, 3.5, 0.6); t += 1.5; } t += 2.2; }
  for (let k = 0; k < 9; k++) { bell(x, sr, Math.round(t * sr), 329.63, 3.2, 0.6); t += 1.1; }
  wav('angelus.wav', reverb(x, sr, 0.35, 1.4), sr);
}
{ // kyrie-vigil: an original unison melody in the Dorian mode over a drone (the piece is not a quotation of any existing chant)
  const sr = 32000, x = new Float32Array(sr * 48), N = (s, d) => ({ s, d });
  const phrases = [
    [N(0, 1.2), N(2, 1.0), N(3, 1.0), N(5, 2.2), N(3, 1.0), N(2, 1.0), N(0, 2.8)],
    [N(3, 1.0), N(5, 1.0), N(7, 2.4), N(5, 1.0), N(3, 1.0), N(5, 1.2), N(2, 1.0), N(0, 3.0)],
    [N(0, 1.0), N(3, 1.0), N(7, 1.4), N(10, 2.6), N(7, 1.0), N(5, 1.0), N(3, 1.4), N(2, 1.0), N(0, 3.0)],
    [N(2, 1.0), N(3, 1.0), N(2, 1.0), N(0, 1.0), N(-2, 1.4), N(0, 4.0)],
  ];
  let t = 1.5; const total = [];
  for (let rep = 0; rep < 1; rep++) for (const ph of phrases) { for (const n of ph) { for (const [off, a] of [[0, 1], [0.7, 0.5], [-0.7, 0.5]]) voice(x, sr, Math.round((t + (off ? Math.abs(off) * 0.02 : 0)) * sr), hz(n.s - 12, 293.66) * Math.pow(2, off * 0.0016), n.d * 0.78 + 0.5, 0.05 * a); t += n.d * 0.78; } t += 1.6; }
  // drone: D and A, soft, under the whole piece
  pad(x, sr, Math.round(0.5 * sr), hz(-24), 46, 0.02); pad(x, sr, Math.round(0.5 * sr), hz(-17), 46, 0.014);
  wav('kyrie-vigil.wav', reverb(x, sr, 0.55, 2.2), sr);
}
const ui = (file, notes, len) => { const sr = 44100, x = new Float32Array(Math.round(sr * len)); notes.forEach(([s, t, a]) => { const f = hz(s, 293.66), st = Math.round(t * sr), n = Math.round(0.35 * sr); for (let i = 0; i < n && st + i < x.length; i++) { const tt = i / sr; x[st + i] += a * Math.sin(TAU * f * tt) * Math.exp(-tt * 12) * (1 - Math.exp(-tt * 900)) + a * 0.3 * Math.sin(TAU * f * 2.01 * tt) * Math.exp(-tt * 18); } }); wav(file, reverb(x, sr, 0.2, 0.6), sr); };
ui('ui-tap.wav', [[12, 0, 0.5]], 0.4);
ui('ui-success.wav', [[7, 0, 0.45], [12, 0.12, 0.5], [15, 0.24, 0.5]], 0.9);
ui('ui-soft-error.wav', [[3, 0, 0.45], [-2, 0.16, 0.5]], 0.8);
