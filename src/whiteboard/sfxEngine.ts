/**
 * sfxEngine.ts — deterministic, dependency-free SFX synthesis for whiteboard
 * explainer videos. 48 kHz / 16-bit / stereo WAV data URIs.
 *
 * Design rules:
 *  - Fully deterministic: same options => byte-identical WAV (safe for Remotion's
 *    parallel render tabs). No Math.random anywhere.
 *  - Every clip is rendered to the EXACT duration of the visual it belongs to,
 *    so nothing loops and nothing repeats audibly.
 *  - Every clip is unique per `seed`.
 */

export const SAMPLE_RATE = 48000;
const SR = SAMPLE_RATE;
const TAU = Math.PI * 2;

/* ───────────────────────── helpers ───────────────────────── */

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** mulberry32 — small, fast, well-distributed. Returns [0, 1). */
export const makeRand = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
export type Rand = () => number;

/** Smoothly interpolated random values in [0, 1) at ~rateHz new targets/sec. */
export const valueNoise = (rand: Rand, rateHz: number) => {
  const period = Math.max(1, Math.round(SR / rateHz));
  let a = rand();
  let b = rand();
  let k = 0;
  return () => {
    const v = a + (b - a) * smooth(k / period);
    if (++k >= period) {
      k = 0;
      a = b;
      b = rand();
    }
    return v;
  };
};

/** Paul Kellet's economy pink-noise filter (~ -3 dB/oct). */
export const makePink = (rand: Rand) => {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  return () => {
    const w = rand() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    return (b0 + b1 + b2 + w * 0.1848) * 0.3;
  };
};

/* ───────────────────────── filters ───────────────────────── */

export type FilterType = "lp" | "hp" | "bp" | "peak" | "hshelf";

/** RBJ cookbook biquad. Coefficients can be updated while running (sweeps). */
export class Biquad {
  b0 = 1;
  b1 = 0;
  b2 = 0;
  a1 = 0;
  a2 = 0;
  x1 = 0;
  x2 = 0;
  y1 = 0;
  y2 = 0;

  constructor(type: FilterType, f: number, q = 0.7071, gainDb = 0) {
    this.set(type, f, q, gainDb);
  }

  set(type: FilterType, f: number, q = 0.7071, gainDb = 0) {
    const w = (TAU * clamp(f, 20, SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const sn = Math.sin(w);
    const alpha = sn / (2 * q);
    let b0 = 1;
    let b1 = 0;
    let b2 = 0;
    let a0 = 1;
    let a1 = 0;
    let a2 = 0;
    switch (type) {
      case "lp":
        b0 = (1 - cs) / 2;
        b1 = 1 - cs;
        b2 = (1 - cs) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cs;
        a2 = 1 - alpha;
        break;
      case "hp":
        b0 = (1 + cs) / 2;
        b1 = -(1 + cs);
        b2 = (1 + cs) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cs;
        a2 = 1 - alpha;
        break;
      case "bp":
        b0 = alpha;
        b1 = 0;
        b2 = -alpha;
        a0 = 1 + alpha;
        a1 = -2 * cs;
        a2 = 1 - alpha;
        break;
      case "peak": {
        const A = Math.pow(10, gainDb / 40);
        b0 = 1 + alpha * A;
        b1 = -2 * cs;
        b2 = 1 - alpha * A;
        a0 = 1 + alpha / A;
        a1 = -2 * cs;
        a2 = 1 - alpha / A;
        break;
      }
      case "hshelf": {
        const A = Math.pow(10, gainDb / 40);
        const beta = 2 * Math.sqrt(A) * alpha;
        b0 = A * (A + 1 + (A - 1) * cs + beta);
        b1 = -2 * A * (A - 1 + (A + 1) * cs);
        b2 = A * (A + 1 + (A - 1) * cs - beta);
        a0 = A + 1 - (A - 1) * cs + beta;
        a1 = 2 * (A - 1 - (A + 1) * cs);
        a2 = A + 1 - (A - 1) * cs - beta;
        break;
      }
    }
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }

  run(x: number) {
    const y =
      this.b0 * x +
      this.b1 * this.x1 +
      this.b2 * this.x2 -
      this.a1 * this.y1 -
      this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/* ───────────────────────── stereo buffer ───────────────────────── */

export type Stereo = {l: Float32Array; r: Float32Array; n: number};

const alloc = (seconds: number): Stereo => {
  const n = Math.max(2, Math.round(seconds * SR));
  return {l: new Float32Array(n), r: new Float32Array(n), n};
};

/** Equal-power pan a mono signal into a stereo buffer. pan: -1 (L) .. +1 (R). */
const place = (
  mono: Float32Array,
  pan: number | ((i: number) => number),
): Stereo => {
  const n = mono.length;
  const out: Stereo = {l: new Float32Array(n), r: new Float32Array(n), n};
  for (let i = 0; i < n; i++) {
    const p = clamp(typeof pan === "number" ? pan : pan(i), -1, 1);
    const th = ((p + 1) * Math.PI) / 4;
    out.l[i] = mono[i] * Math.cos(th) * 1.4142;
    out.r[i] = mono[i] * Math.sin(th) * 1.4142;
  }
  return out;
};

/**
 * Tiny "small room" — cross-fed early reflections, low-passed. Adds depth and
 * width without any audible tail, so transients stay crisp.
 */
export const addRoom = (b: Stereo, amount: number) => {
  if (amount <= 0) return;
  const dl = b.l.slice();
  const dr = b.r.slice();
  const lpL = new Biquad("lp", 4200, 0.6);
  const lpR = new Biquad("lp", 4200, 0.6);
  const ms = (t: number) => Math.round((t / 1000) * SR);
  const tapsL: [number, number][] = [
    [ms(5.3), 0.34],
    [ms(8.9), 0.26],
    [ms(13.7), 0.2],
    [ms(19.1), 0.14],
  ];
  const tapsR: [number, number][] = [
    [ms(6.7), 0.32],
    [ms(10.3), 0.25],
    [ms(15.9), 0.18],
    [ms(23.3), 0.12],
  ];
  for (let i = 0; i < b.n; i++) {
    dl[i] = lpL.run(dl[i]);
    dr[i] = lpR.run(dr[i]);
  }
  for (let i = 0; i < b.n; i++) {
    let sl = 0;
    let sr = 0;
    for (const [d, g] of tapsL) if (i >= d) sl += dr[i - d] * g;
    for (const [d, g] of tapsR) if (i >= d) sr += dl[i - d] * g;
    b.l[i] += sl * amount;
    b.r[i] += sr * amount;
  }
};

/* ───────────────────────── master stage ───────────────────────── */

type FinishOpts = {
  /** "peak": one-shots, "rms": continuous textures (consistent loudness). */
  mode: "peak" | "rms";
  /** Peak (0..1) or RMS (0..1) target at volume = 1. */
  target: number;
  fadeIn?: number;
  fadeOut?: number;
  hp?: number;
};

export const softClip = (x: number) => {
  const a = Math.abs(x);
  if (a < 0.8) return x;
  return Math.sign(x) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2));
};

const finish = (b: Stereo, o: FinishOpts) => {
  const hpL = new Biquad("hp", o.hp ?? 40, 0.7071);
  const hpR = new Biquad("hp", o.hp ?? 40, 0.7071);
  const fi = Math.round((o.fadeIn ?? 0.004) * SR);
  const fo = Math.round((o.fadeOut ?? 0.012) * SR);
  let peak = 1e-9;
  let sumSq = 0;
  for (let i = 0; i < b.n; i++) {
    let g = 1;
    if (i < fi && fi > 0) g = 0.5 - 0.5 * Math.cos((Math.PI * i) / fi);
    const j = b.n - 1 - i;
    if (j < fo && fo > 0) g *= 0.5 - 0.5 * Math.cos((Math.PI * j) / fo);
    b.l[i] = hpL.run(b.l[i]) * g;
    b.r[i] = hpR.run(b.r[i]) * g;
    peak = Math.max(peak, Math.abs(b.l[i]), Math.abs(b.r[i]));
    sumSq += b.l[i] * b.l[i] + b.r[i] * b.r[i];
  }
  const rms = Math.sqrt(sumSq / (2 * b.n)) + 1e-9;
  const gain = o.mode === "peak" ? o.target / peak : o.target / rms;
  for (let i = 0; i < b.n; i++) {
    b.l[i] = softClip(b.l[i] * gain) * 0.97;
    b.r[i] = softClip(b.r[i] * gain) * 0.97;
  }
  return b;
};

/* ───────────────────────── WAV encoding ───────────────────────── */

const toBase64 = (bytes: Uint8Array) => {
  let s = "";
  const C = 0x2000;
  for (let i = 0; i < bytes.length; i += C) {
    s += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + C) as unknown as number[],
    );
  }
  return btoa(s);
};

/** 16-bit stereo PCM with deterministic TPDF dither. */
export const encodeWavBytes = (b: Stereo, seed = 1): Uint8Array => {
  const dataBytes = b.n * 4;
  const buf = new ArrayBuffer(44 + dataBytes);
  const v = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + dataBytes, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 2, true);
  v.setUint32(24, SR, true);
  v.setUint32(28, SR * 4, true);
  v.setUint16(32, 4, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, dataBytes, true);
  const dith = makeRand(seed ^ 0x9e3779b9);
  let o = 44;
  for (let i = 0; i < b.n; i++) {
    const l = Math.round(b.l[i] * 32767 + (dith() - dith()));
    const r = Math.round(b.r[i] * 32767 + (dith() - dith()));
    v.setInt16(o, clamp(l, -32768, 32767), true);
    v.setInt16(o + 2, clamp(r, -32768, 32767), true);
    o += 4;
  }
  return new Uint8Array(buf);
};

export const stereoToDataUri = (b: Stereo, seed = 1) =>
  `data:audio/wav;base64,${toBase64(encodeWavBytes(b, seed))}`;
const toDataUri = stereoToDataUri;

/* ═══════════════════════════ VOICES ═══════════════════════════ */

export type MarkerOpts = {
  seconds: number;
  seed?: number;
  /** "write": connected letter strokes (text). "shape": long sweeps (circle, underline, box). */
  style?: "write" | "shape";
  /** -1..1 */
  pan?: number;
  /** 0..1 optional subtle felt-tip squeak. Default 0 (smooth felt glide). */
  squeak?: number;
};

/**
 * Marker on whiteboard: warm, smooth felt-tip glide with gentle stroke
 * velocity swells and soft board contact — no harsh high-frequency hiss.
 */
export const synthMarker = (o: MarkerOpts): Stereo => {
  const seed = o.seed ?? 1;
  const rand = makeRand(seed * 7919 + 13);
  const shape = o.style === "shape";
  const buf = alloc(o.seconds);
  const n = buf.n;
  const dur = n / SR;

  // 1) Smooth overlapping stroke velocity curve
  const vel = new Float32Array(n);
  const taps: {at: number; amp: number}[] = [];
  const [lo, hi] = shape ? [0.28, 0.72] : [0.13, 0.34];
  let t = 0.004;
  while (t < dur) {
    const len = lo + Math.pow(rand(), 1.2) * (hi - lo);
    const peak = 0.55 + 0.45 * rand();
    const s0 = Math.floor(t * SR);
    const s1 = Math.min(n, Math.floor((t + len) * SR));
    for (let i = s0; i < s1; i++) {
      const x = (i - s0) / Math.max(1, s1 - s0);
      vel[i] = Math.max(vel[i], peak * Math.pow(Math.sin(Math.PI * x), 0.9));
    }
    if (rand() < 0.35) taps.push({at: s0, amp: 0.25 + 0.35 * rand()});
    // Overlap/short gap so strokes flow smoothly instead of stuttering
    t += len + (shape ? 0.004 + rand() * 0.018 : 0.006 + rand() * 0.028);
  }
  const sm = 1 - Math.exp((-TAU * 22) / SR);
  let y = 0;
  for (let i = 0; i < n; i++) {
    y += sm * (vel[i] - y);
    vel[i] = y;
  }

  // 2) Warm felt-glide synthesis (350..1600 Hz focus, silky modulation)
  const white = () => rand() * 2 - 1;
  const pink = makePink(rand);
  const feltLp = new Biquad("lp", 1500, 0.55);
  const feltLp2 = new Biquad("lp", 2100, 0.55);
  const feltHp = new Biquad("hp", 260, 0.65);
  const feltMid = new Biquad("peak", 680, 0.85, 3.5);
  const body = new Biquad("bp", 195, 0.9);
  const bodyLp = new Biquad("lp", 340, 0.7071);
  const grainA = valueNoise(rand, 18);
  const grainB = valueNoise(rand, 6.5);
  const sqGate = valueNoise(rand, 4.5);
  const sqFreq = valueNoise(rand, 7);
  const squeak = clamp(o.squeak ?? 0, 0, 1);
  let sqPhase = 0;

  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const v = vel[i];
    if ((i & 15) === 0) {
      feltLp.set("lp", 1100 + 850 * v, 0.55);
    }
    // Gentle pressure swell instead of choppy high-rate flutter
    const g = 0.8 + 0.2 * grainA() * (0.85 + 0.3 * grainB());
    const src = pink() * 1.15 + white() * 0.12;
    const f = feltMid.run(feltHp.run(feltLp2.run(feltLp.run(src))));
    const b = bodyLp.run(body.run(pink())) * 2.1;
    let x = (f * 0.95 + b * 0.36) * g * Math.pow(v, 1.05);

    if (squeak > 0) {
      const gate = clamp((sqGate() - 0.78) / 0.22, 0, 1);
      if (gate > 0) {
        sqPhase += (TAU * (1250 + 380 * sqFreq() + 180 * v)) / SR;
        x += Math.sin(sqPhase) * gate * v * v * 0.025 * squeak;
      }
    }
    mono[i] = x;
  }

  // Soft muted felt-touch thump on occasional stroke starts (no sharp high clicks)
  const tapLp = new Biquad("bp", 580, 0.95);
  for (const tk of taps) {
    const len = Math.round(0.012 * SR);
    for (let k = 0; k < len && tk.at + k < n; k++) {
      mono[tk.at + k] +=
        tapLp.run(pink()) *
        Math.exp(-k / (0.0035 * SR)) *
        tk.amp *
        0.08 *
        (0.4 + vel[Math.min(n - 1, tk.at + 60)]);
    }
  }

  const out = place(mono, o.pan ?? 0);
  addRoom(out, 0.35);
  return finish(out, {
    mode: "rms",
    target: 0.065,
    fadeIn: 0.012,
    fadeOut: 0.028,
    hp: 100,
  });
};

export type EraserOpts = {seconds: number; seed?: number; pan?: number};

/** Side-to-side plush felt eraser scrub with L<->R hand stereo movement. */
export const synthEraser = (o: EraserOpts): Stereo => {
  const rand = makeRand((o.seed ?? 1) * 104729 + 7);
  const buf = alloc(o.seconds);
  const n = buf.n;
  const white = () => rand() * 2 - 1;
  const pink = makePink(rand);
  const lp = new Biquad("lp", 1150, 0.55);
  const lp2 = new Biquad("lp", 1750, 0.55);
  const hp = new Biquad("hp", 160, 0.7071);
  const felt = new Biquad("peak", 560, 0.85, 4);
  const rumble = new Biquad("lp", 150, 0.7071);
  const rateWander = valueNoise(rand, 1.5);
  const grain = valueNoise(rand, 22);
  const mono = new Float32Array(n);
  const pos = new Float32Array(n);
  let phase = rand() * Math.PI;
  for (let i = 0; i < n; i++) {
    const humpRate = 2.8 + 1.6 * rateWander();
    phase += (Math.PI * humpRate) / SR;
    const speed = Math.pow(Math.abs(Math.sin(phase)), 0.85);
    pos[i] = -Math.cos(phase);
    const g = 0.78 + 0.22 * grain();
    let x = felt.run(hp.run(lp2.run(lp.run(pink() * 1.4 + white() * 0.08))));
    x += rumble.run(pink()) * 1.4 * 0.5;
    x *= speed * g;
    mono[i] = x;
  }
  const p0 = o.pan ?? 0;
  const out = place(mono, (i) => p0 + pos[i] * 0.25);
  addRoom(out, 0.35);
  return finish(out, {
    mode: "rms",
    target: 0.085,
    fadeIn: 0.04,
    fadeOut: 0.07,
    hp: 75,
  });
};

export type WhooshOpts = {
  seconds: number;
  seed?: number;
  sweep?: "up" | "down";
  /** Motion easing match: "in" (fast start), "travel" (symmetric midpoint), "out" (fast end). */
  curve?: "in" | "travel" | "out";
  panFrom?: number;
  panTo?: number;
  /** 0.5..1.5, scales top of the sweep. Default 1. */
  brightness?: number;
};

/** Dual swept bandpass air/hand whoosh with stereo pan sweep. */
export const synthWhoosh = (o: WhooshOpts): Stereo => {
  const rand = makeRand((o.seed ?? 1) * 15485863 + 3);
  const mono0 = Math.max(0.08, o.seconds);
  const buf = alloc(mono0);
  const n = buf.n;
  const white = () => rand() * 2 - 1;
  const pink = makePink(rand);
  const up = (o.sweep ?? "up") === "up";
  const curve = o.curve ?? "travel";
  const fLow = 380;
  const fHigh = 3600 * (o.brightness ?? 1);
  const bp1 = new Biquad("bp", 800, 0.95);
  const bp2 = new Biquad("bp", 2000, 1.6);
  const hp = new Biquad("hp", 220, 0.7071);
  const grain = valueNoise(rand, 38);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const e = up ? Math.pow(u, 0.6) : 1 - Math.pow(u, 0.6);
    const f = fLow * Math.pow(fHigh / fLow, e);
    if ((i & 7) === 0) {
      bp1.set("bp", f, 0.95);
      bp2.set("bp", f * 2.3, 1.6);
    }
    const src = hp.run(white() * 0.6 + pink() * 0.9);
    // Align whoosh peak with hand easing: early for enter, midpoint for travel, late for exit
    const warped =
      curve === "in"
        ? Math.pow(u, 0.52)
        : curve === "out"
          ? 1 - Math.pow(1 - u, 0.52)
          : u;
    const env = Math.pow(Math.sin(Math.PI * warped), 1.55);
    const g = 0.82 + 0.18 * grain();
    mono[i] = (bp1.run(src) + bp2.run(src) * 0.35) * env * g;
  }
  const a = o.panFrom ?? -0.45;
  const b = o.panTo ?? 0.45;
  const out = place(mono, (i) => a + (b - a) * smooth(i / (n - 1)));
  addRoom(out, 0.45);
  return finish(out, {
    mode: "peak",
    target: 0.9,
    fadeIn: 0.006,
    fadeOut: 0.02,
    hp: 120,
  });
};

export type PopOpts = {seed?: number; pan?: number; pitch?: number};
export const POP_SECONDS = 0.2;

/** Soft woody "thock" for landed accents. */
export const synthPop = (o: PopOpts = {}): Stereo => {
  const rand = makeRand((o.seed ?? 1) * 32452843 + 11);
  const buf = alloc(POP_SECONDS);
  const n = buf.n;
  const detune = 1 + (rand() - 0.5) * 0.12;
  const base = 250 * detune * (o.pitch ?? 1);
  const click = new Biquad("bp", 3300, 1.1);
  const mono = new Float32Array(n);
  let ph1 = 0;
  let ph2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = base + base * 1.9 * Math.exp(-t / 0.016);
    ph1 += (TAU * f) / SR;
    ph2 += (TAU * f * 2.01) / SR;
    const env = (1 - Math.exp(-t / 0.0007)) * Math.exp(-t / 0.032);
    const body =
      Math.sin(ph1) * env +
      Math.sin(ph2) * env * Math.exp(-t / 0.02) * 0.22;
    const c = click.run(rand() * 2 - 1) * Math.exp(-t / 0.0022) * 0.6;
    mono[i] = body + c;
  }
  const out = place(mono, o.pan ?? 0);
  addRoom(out, 0.35);
  return finish(out, {
    mode: "peak",
    target: 0.9,
    fadeIn: 0.0005,
    fadeOut: 0.03,
    hp: 110,
  });
};

export type PingOpts = {seed?: number; pan?: number; freq?: number};
export const PING_SECONDS = 0.85;

/** Soft glass chime for checkmarks and finished charts. */
export const synthPing = (o: PingOpts = {}): Stereo => {
  const rand = makeRand((o.seed ?? 1) * 49979687 + 5);
  const buf = alloc(PING_SECONDS);
  const n = buf.n;
  const f0 = (o.freq ?? 1174.66) * (1 + (rand() - 0.5) * 0.01);
  const partials: [number, number, number][] = [
    [1, 1, 0.34],
    [2.76, 0.32, 0.14],
    [5.4, 0.1, 0.06],
    [0.5, 0.18, 0.28],
  ];
  const click = new Biquad("bp", 4500, 1.4);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let p = 0; p < partials.length; p++) {
    const [ratio, amp, dec] = partials[p];
    const ph0 = rand() * TAU;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const env = (1 - Math.exp(-t / 0.0015)) * Math.exp(-t / dec) * amp;
      L[i] += Math.sin(TAU * f0 * ratio * t + ph0) * env;
      R[i] += Math.sin(TAU * f0 * ratio * 1.0006 * t + ph0) * env;
    }
  }
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const c = click.run(rand() * 2 - 1) * Math.exp(-t / 0.0015) * 0.25;
    L[i] += c;
    R[i] += c;
  }
  const out: Stereo = {l: L, r: R, n};
  const p = clamp(o.pan ?? 0, -1, 1);
  if (p !== 0) {
    const th = ((p + 1) * Math.PI) / 4;
    for (let i = 0; i < n; i++) {
      out.l[i] *= Math.cos(th) * 1.4142;
      out.r[i] *= Math.sin(th) * 1.4142;
    }
  }
  addRoom(out, 0.5);
  return finish(out, {
    mode: "peak",
    target: 0.9,
    fadeIn: 0.0005,
    fadeOut: 0.08,
    hp: 200,
  });
};

/* ═══════════════════════════ CACHED DATA-URI API ═══════════════════════════ */

const cache = new Map<string, string>();
const memo = (key: string, seed: number, build: () => Stereo) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const uri = toDataUri(build(), seed);
  cache.set(key, uri);
  return uri;
};

const q = (x: number | undefined, d = 2) =>
  x === undefined ? "-" : x.toFixed(d);
const secKey = (s: number) => Math.round(s * SR);

export const markerWav = (o: MarkerOpts) =>
  memo(
    `m|${secKey(o.seconds)}|${o.seed ?? 1}|${o.style ?? "write"}|${q(o.pan)}|${q(o.squeak)}`,
    o.seed ?? 1,
    () => synthMarker(o),
  );

export const eraserWav = (o: EraserOpts) =>
  memo(
    `e|${secKey(o.seconds)}|${o.seed ?? 1}|${q(o.pan)}`,
    o.seed ?? 1,
    () => synthEraser(o),
  );

export const whooshWav = (o: WhooshOpts) =>
  memo(
    `w|${secKey(o.seconds)}|${o.seed ?? 1}|${o.sweep ?? "up"}|${o.curve ?? "travel"}|${q(o.panFrom)}|${q(o.panTo)}|${q(o.brightness)}`,
    o.seed ?? 1,
    () => synthWhoosh(o),
  );

export const popWav = (o: PopOpts = {}) =>
  memo(
    `p|${o.seed ?? 1}|${q(o.pan)}|${q(o.pitch)}`,
    o.seed ?? 1,
    () => synthPop(o),
  );

export const pingWav = (o: PingOpts = {}) =>
  memo(
    `g|${o.seed ?? 1}|${q(o.pan)}|${q(o.freq, 1)}`,
    o.seed ?? 1,
    () => synthPing(o),
  );
