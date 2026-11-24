// Audio processing only – no UI code here.
// Mic: one shared microphone stream, released when nobody uses it.
const Mic = (() => {
  let ctx = null, stream = null, analyser = null; const users = new Set();
  async function acquire(name, fftSize) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('unsupported');
    if (!ctx) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      ctx.createMediaStreamSource(stream).connect(analyser);
    }
    analyser.fftSize = fftSize; analyser.smoothingTimeConstant = 0.3;
    users.add(name);
    if (ctx.state === 'suspended') await ctx.resume();
    return { analyser, sampleRate: ctx.sampleRate };
  }
  function release(name) {
    users.delete(name);
    if (!users.size && ctx) { stream.getTracks().forEach(t => t.stop()); ctx.close(); ctx = stream = analyser = null; }
  }
  return { acquire, release };
})();

// Level of a time-domain buffer (root mean square).
function rmsOf(buf) { let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); }

// YIN pitch detection. Returns {freq, clarity} or freq = -1 if no clear pitch.
function detectPitch(buf, sr) {
  const minLag = Math.floor(sr / 500), maxLag = Math.floor(sr / 70), n = buf.length - maxLag;
  const d = new Float32Array(maxLag + 1);
  for (let tau = 1; tau <= maxLag; tau++) { let sum = 0; for (let i = 0; i < n; i++) { const x = buf[i] - buf[i + tau]; sum += x * x; } d[tau] = sum; }
  // cumulative mean normalised difference
  let running = 0; d[0] = 1;
  for (let tau = 1; tau <= maxLag; tau++) { running += d[tau]; d[tau] = d[tau] * tau / (running || 1); }
  let tau = -1;
  for (let t = minLag; t < maxLag; t++) { if (d[t] < 0.15) { while (t + 1 < maxLag && d[t + 1] < d[t]) t++; tau = t; break; } }
  if (tau < 0) return { freq: -1, clarity: 0 };
  // parabolic interpolation for sub-sample accuracy
  const a = d[tau - 1], b = d[tau], c = d[tau + 1], shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  return { freq: sr / (tau + shift), clarity: 1 - b };
}

// Chromagram: energy per pitch class (0=C … 11=B) from spectral peaks.
// Peaks that are not close to a real note are ignored; harmonics fall mostly on the same or related notes.
function computeChroma(analyser, sr, a4) {
  const bins = new Float32Array(analyser.frequencyBinCount); analyser.getFloatFrequencyData(bins);
  const chroma = new Array(12).fill(0), hz = sr / analyser.fftSize;
  for (let i = 2; i < bins.length - 1; i++) {
    const f = i * hz; if (f < 75) continue; if (f > 1200) break;
    if (bins[i] < -80 || bins[i] <= bins[i - 1] || bins[i] < bins[i + 1]) continue;
    const midi = 69 + 12 * Math.log2(f / a4), r = Math.round(midi);
    if (Math.abs(midi - r) > 0.35) continue;
    chroma[((r % 12) + 12) % 12] += Math.pow(10, bins[i] / 20) * (f < 330 ? 1.5 : 1); // low notes get a boost: they are weaker
  }
  return chroma;
}
