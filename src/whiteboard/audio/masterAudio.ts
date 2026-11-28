import {type MotionCue, type MotionTrace} from "./motionTrace";
import {
  Biquad,
  SAMPLE_RATE,
  addRoom,
  encodeWavBytes,
  makePink,
  makeRand,
  softClip,
  stereoToDataUri,
  synthPing,
  synthPop,
  synthWhoosh,
  valueNoise,
  type Stereo,
} from "./sfxEngine";

/**
 * masterAudio.ts — Stage 2 & 3 of the studio SFX pipeline.
 *
 * Takes a Stage 1 `MotionTrace` (coordinates, velocity, curvature, stereo pan,
 * and discrete cues) and renders ONE cohesive 48 kHz stereo master track (plus
 * isolated stems) through a studio bus compressor & soft limiter.
 *
 * Hybrid Foley + Telemetry DSP:
 *  - Pass recorded `.wav` samples via `foley` (parsed with `decodeWavBytes`) to
 *    scrub/pan real studio foley from your hand's actual velocity & position.
 *  - Any omitted foley slot automatically uses telemetry-driven modal DSP
 *    (physical whiteboard resonance driven directly by `speed(t)` & `pan(t)`).
 */

const SR = SAMPLE_RATE;
const TAU = Math.PI * 2;
const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x));

export type FoleySample = {
  sampleRate: number;
  left: Float32Array;
  right: Float32Array;
};

export type FoleyBankKey =
  | "marker"
  | "eraser"
  | "whoosh"
  | "pop"
  | "ping"
  | "penTap";

export type FoleyBank = Partial<Record<FoleyBankKey, FoleySample>>;

export type MasterAudioOptions = {
  seed?: number;
  /** Overall master trim (default 1). */
  master?: number;
  /** Continuous marker/eraser glide level (default 0 — disabled). */
  drawVolume?: number;
  /** Hand/camera whoosh level (default 0.34). */
  whooshVolume?: number;
  /** Pop, ping, penDown, and corner accent level (default 0.52). */
  accentVolume?: number;
  /** Small-room early reflections amount (0..1, default 0.32). */
  room?: number;
  /** Optional recorded foley samples (parsed via `decodeWavBytes`). */
  foley?: FoleyBank;
};

export type MasterAudioResult = {
  master: Stereo;
  stems: {
    draw: Stereo;
    motion: Stereo;
    accents: Stereo;
  };
  wavBytes: Uint8Array;
  dataUri: string;
  stats: {
    durationSeconds: number;
    peakDb: number;
    rmsDb: number;
    cueCount: number;
  };
};

/* ───────────────────────── WAV decoder + resampler ───────────────────────── */

const resampleChannel = (
  src: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array => {
  if (fromRate === toRate || src.length === 0) return src;
  const ratio = fromRate / toRate;
  const outLen = Math.max(1, Math.round(src.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(src.length - 1, i0 + 1);
    const f = pos - i0;
    out[i] = src[i0] + (src[i1] - src[i0]) * f;
  }
  return out;
};

/**
 * Decodes an uncompressed PCM (8/16/24-bit) or IEEE float (32-bit) WAV file
 * into a 48 kHz stereo `FoleySample` ready for `renderMasterAudio`.
 */
export const decodeWavBytes = (bytes: Uint8Array): FoleySample => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 44) {
    throw new Error("Invalid WAV: too short");
  }
  const tag = (off: number) =>
    String.fromCharCode(
      view.getUint8(off),
      view.getUint8(off + 1),
      view.getUint8(off + 2),
      view.getUint8(off + 3),
    );
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") {
    throw new Error("Invalid WAV: missing RIFF/WAVE header");
  }

  let format = 1;
  let channels = 1;
  let sampleRate = SR;
  let bitsPerSample = 16;
  let dataOffset = -1;
  let dataLength = 0;

  let off = 12;
  while (off + 8 <= bytes.byteLength) {
    const id = tag(off);
    const size = view.getUint32(off + 4, true);
    const body = off + 8;
    if (id === "fmt " && body + 16 <= bytes.byteLength) {
      format = view.getUint16(body, true);
      channels = view.getUint16(body + 2, true);
      sampleRate = view.getUint32(body + 4, true);
      bitsPerSample = view.getUint16(body + 14, true);
    } else if (id === "data") {
      dataOffset = body;
      dataLength = Math.min(size, bytes.byteLength - body);
      break;
    }
    off = body + size + (size & 1);
  }

  if (dataOffset < 0) {
    throw new Error("Invalid WAV: missing data chunk");
  }

  const bytesPerSample = Math.max(1, bitsPerSample / 8);
  const frameBytes = bytesPerSample * channels;
  const frames = Math.floor(dataLength / frameBytes);
  const left = new Float32Array(frames);
  const right = new Float32Array(frames);

  const readSample = (pos: number): number => {
    if (format === 3 && bitsPerSample === 32) {
      return clamp(view.getFloat32(pos, true), -1, 1);
    }
    if (bitsPerSample === 8) {
      return (view.getUint8(pos) - 128) / 128;
    }
    if (bitsPerSample === 24) {
      const b0 = view.getUint8(pos);
      const b1 = view.getUint8(pos + 1);
      const b2 = view.getUint8(pos + 2);
      let val = b0 | (b1 << 8) | (b2 << 16);
      if (val & 0x800000) val |= ~0xffffff;
      return val / 8388608;
    }
    return view.getInt16(pos, true) / 32768;
  };

  for (let i = 0; i < frames; i++) {
    const base = dataOffset + i * frameBytes;
    const l = readSample(base);
    const r = channels > 1 ? readSample(base + bytesPerSample) : l;
    left[i] = l;
    right[i] = r;
  }

  return {
    sampleRate: SR,
    left: resampleChannel(left, sampleRate, SR),
    right: resampleChannel(right, sampleRate, SR),
  };
};

/* ───────────────────────── stereo mixing helpers ───────────────────────── */

const allocStereo = (n: number): Stereo => ({
  l: new Float32Array(n),
  r: new Float32Array(n),
  n,
});

const panGains = (pan: number) => {
  const th = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
  return {gl: Math.cos(th) * 1.4142, gr: Math.sin(th) * 1.4142};
};

const mixMonoHit = (
  dst: Stereo,
  mono: Float32Array,
  startSample: number,
  pan: number,
  gain: number,
) => {
  const {gl, gr} = panGains(pan);
  for (let k = 0; k < mono.length; k++) {
    const idx = startSample + k;
    if (idx < 0 || idx >= dst.n) continue;
    const v = mono[k] * gain;
    dst.l[idx] += v * gl;
    dst.r[idx] += v * gr;
  }
};

const mixStereoHit = (
  dst: Stereo,
  src: Stereo,
  startSample: number,
  gain: number,
) => {
  for (let k = 0; k < src.n; k++) {
    const idx = startSample + k;
    if (idx < 0 || idx >= dst.n) continue;
    dst.l[idx] += src.l[k] * gain;
    dst.r[idx] += src.r[k] * gain;
  }
};

const mixFoleyOneShot = (
  dst: Stereo,
  sample: FoleySample,
  startSample: number,
  pan: number,
  gain: number,
  pitch = 1,
) => {
  const {gl, gr} = panGains(pan);
  const outLen = Math.floor(sample.left.length / Math.max(0.5, pitch));
  for (let k = 0; k < outLen; k++) {
    const idx = startSample + k;
    if (idx < 0 || idx >= dst.n) continue;
    const pos = k * pitch;
    const i0 = Math.floor(pos);
    const i1 = Math.min(sample.left.length - 1, i0 + 1);
    const f = pos - i0;
    const sl = sample.left[i0] + (sample.left[i1] - sample.left[i0]) * f;
    const sr = sample.right[i0] + (sample.right[i1] - sample.right[i0]) * f;
    const mono = (sl + sr) * 0.5 * gain;
    dst.l[idx] += mono * gl;
    dst.r[idx] += mono * gr;
  }
};

/* ───────────────────────── telemetry draw bed ───────────────────────── */

const renderDrawBed = (
  trace: MotionTrace,
  n: number,
  seed: number,
  foley: FoleyBank | undefined,
  drawVolume: number,
): Stereo => {
  const out = allocStereo(n);
  if (drawVolume <= 0 || trace.samples.length === 0) return out;

  const rand = makeRand(seed * 7919 + 31);
  const pink = makePink(rand);
  const swell = valueNoise(rand, 14);

  // Modal whiteboard resonance + warm felt low-pass
  const feltLp = new Biquad("lp", 1300, 0.58);
  const feltHp = new Biquad("hp", 185, 0.65);
  const mode1 = new Biquad("bp", 195, 2.2);
  const mode2 = new Biquad("bp", 460, 2.0);
  const mode3 = new Biquad("bp", 940, 1.8);
  const foleyLp = new Biquad("lp", 1800, 0.65);

  const subStepSamples = SR / (trace.fps * trace.subSteps);
  const maxIdx = trace.samples.length - 1;

  // Smooth activity envelope so drawing starts/stops click-free
  let activeEnv = 0;
  const activeAttack = 1 - Math.exp(-1 / (0.006 * SR));
  const activeRelease = 1 - Math.exp(-1 / (0.014 * SR));

  let foleyPhase = 0;
  let sumSq = 0;
  let activeSamples = 0;

  for (let i = 0; i < n; i++) {
    const sPos = clamp(i / subStepSamples, 0, maxIdx);
    const i0 = Math.floor(sPos);
    const i1 = Math.min(maxIdx, i0 + 1);
    const frac = sPos - i0;
    const a = trace.samples[i0];
    const b = trace.samples[i1];

    const isDraw = a.mode === "draw" || a.mode === "erase";
    const targetAct = isDraw ? 1 : 0;
    activeEnv +=
      (targetAct > activeEnv ? activeAttack : activeRelease) *
      (targetAct - activeEnv);

    if (activeEnv < 1e-4) {
      feltLp.run(0);
      mode1.run(0);
      mode2.run(0);
      mode3.run(0);
      continue;
    }

    const speed = a.speed + (b.speed - a.speed) * frac;
    const curvature = a.curvature + (b.curvature - a.curvature) * frac;
    const pan = a.pan + (b.pan - a.pan) * frac;
    const isErase = a.mode === "erase";

    // Velocity-driven drive: dips smoothly at corners, blooms on sweeps
    const velDrive =
      (0.18 + 0.82 * Math.pow(speed, 0.85)) * (1 - 0.35 * curvature);
    const amp = activeEnv * velDrive;

    let mono = 0;
    const activeFoley = isErase ? foley?.eraser : foley?.marker;

    if (activeFoley && activeFoley.left.length > 8) {
      const len = activeFoley.left.length;
      const rate = 0.72 + 0.58 * speed;
      foleyPhase = (foleyPhase + rate) % len;
      const p0 = Math.floor(foleyPhase);
      const p1 = (p0 + 1) % len;
      const f = foleyPhase - p0;
      const raw =
        0.5 *
        (activeFoley.left[p0] +
          (activeFoley.left[p1] - activeFoley.left[p0]) * f +
          activeFoley.right[p0] +
          (activeFoley.right[p1] - activeFoley.right[p0]) * f);
      if ((i & 15) === 0) {
        foleyLp.set("lp", (isErase ? 900 : 1000) + 2200 * speed, 0.6);
      }
      mono = foleyLp.run(raw) * amp;
    } else {
      if ((i & 15) === 0) {
        const cutoff = isErase ? 680 + 750 * speed : 760 + 1280 * speed;
        feltLp.set("lp", cutoff, 0.58);
      }
      const exc = pink() * (0.82 + 0.18 * swell());
      const direct = feltHp.run(feltLp.run(exc));
      const res =
        mode1.run(exc) * 0.45 +
        mode2.run(exc) * 0.35 +
        mode3.run(exc) * 0.25;
      mono = (direct * 0.72 + res * 0.45) * amp;
    }

    const {gl, gr} = panGains(pan);
    out.l[i] = mono * gl;
    out.r[i] = mono * gr;
    sumSq += out.l[i] * out.l[i] + out.r[i] * out.r[i];
    activeSamples++;
  }

  // Normalize active drawing loudness consistently regardless of foley vs DSP
  if (activeSamples > 0) {
    const activeRms = Math.sqrt(sumSq / (2 * activeSamples)) + 1e-9;
    const targetRms = 0.068 * drawVolume;
    const g = Math.min(4, targetRms / activeRms);
    for (let i = 0; i < n; i++) {
      out.l[i] *= g;
      out.r[i] *= g;
    }
  }

  return out;
};

/* ───────────────────────── damped physical taps ───────────────────────── */

const makeFeltTap = (seed: number, freq: number, durSec: number): Float32Array => {
  const rand = makeRand(seed);
  const pink = makePink(rand);
  const len = Math.max(8, Math.round(durSec * SR));
  const out = new Float32Array(len);
  const bp = new Biquad("bp", freq, 1.4);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    ph += (TAU * (freq * (0.7 + 0.5 * Math.exp(-t / 0.004)))) / SR;
    const env = (1 - Math.exp(-t / 0.0008)) * Math.exp(-t / (durSec * 0.24));
    out[i] = (Math.sin(ph) * 0.55 + bp.run(pink()) * 0.9) * env;
  }
  return out;
};

/* ───────────────────────── cue event mixer ───────────────────────── */

const renderCues = (
  cues: MotionCue[],
  n: number,
  fps: number,
  seed: number,
  foley: FoleyBank | undefined,
  drawVolume: number,
  whooshVolume: number,
  accentVolume: number,
): {motion: Stereo; accents: Stereo} => {
  const motion = allocStereo(n);
  const accents = allocStereo(n);

  cues.forEach((cue, idx) => {
    const startSample = Math.round(cue.time * SR);
    const cueSeed = seed * 1009 + idx * 37 + 11;

    if (
      cue.kind === "whooshIn" ||
      cue.kind === "whooshTravel" ||
      cue.kind === "whooshOut" ||
      cue.kind === "whooshTransition"
    ) {
      if (whooshVolume <= 0) return;
      const g = whooshVolume * cue.intensity * 0.36;
      if (foley?.whoosh) {
        mixFoleyOneShot(
          motion,
          foley.whoosh,
          startSample,
          cue.pan,
          g,
          cue.kind === "whooshOut" ? 0.92 : 1.04,
        );
      } else {
        const durSec = Math.max(0.08, (cue.durationFrames ?? 10) / Math.max(1, fps));
        const w = synthWhoosh({
          seconds: durSec,
          seed: cueSeed,
          sweep: cue.kind === "whooshOut" ? "down" : "up",
          curve:
            cue.kind === "whooshIn"
              ? "in"
              : cue.kind === "whooshOut"
                ? "out"
                : "travel",
          panFrom: cue.pan,
          panTo: cue.panTo ?? cue.pan,
          brightness: cue.kind === "whooshTravel" ? 0.85 : 1.0,
        });
        mixStereoHit(motion, w, startSample, g);
      }
      return;
    }

    if (accentVolume <= 0) return;

    if (cue.kind === "penDown") {
      if (drawVolume <= 0) return;
      const g = accentVolume * cue.intensity * 0.14;
      if (foley?.penTap) {
        mixFoleyOneShot(accents, foley.penTap, startSample, cue.pan, g, 1);
      } else {
        const tap = makeFeltTap(cueSeed, 390, 0.022);
        mixMonoHit(accents, tap, startSample, cue.pan, g);
      }
    } else if (cue.kind === "corner") {
      if (drawVolume <= 0) return;
      const g = accentVolume * cue.intensity * 0.1;
      const thump = makeFeltTap(cueSeed, 220, 0.028);
      mixMonoHit(accents, thump, startSample, cue.pan, g);
    } else if (cue.kind === "pop") {
      const g = accentVolume * cue.intensity * 0.34;
      if (foley?.pop) {
        mixFoleyOneShot(
          accents,
          foley.pop,
          startSample,
          cue.pan,
          g,
          cue.pitch ?? 1,
        );
      } else {
        mixStereoHit(
          accents,
          synthPop({seed: cueSeed, pan: cue.pan, pitch: cue.pitch}),
          startSample,
          g,
        );
      }
    } else if (cue.kind === "ping") {
      const g = accentVolume * cue.intensity * 0.28;
      if (foley?.ping) {
        mixFoleyOneShot(
          accents,
          foley.ping,
          startSample,
          cue.pan,
          g,
          cue.pitch ?? 1,
        );
      } else {
        mixStereoHit(
          accents,
          synthPing({
            seed: cueSeed,
            pan: cue.pan,
            freq: cue.pitch ? 1174.66 * cue.pitch : undefined,
          }),
          startSample,
          g,
        );
      }
    }
  });

  return {motion, accents};
};

/* ───────────────────────── studio master bus ───────────────────────── */

const applyMasterBus = (
  draw: Stereo,
  motion: Stereo,
  accents: Stereo,
  masterGain: number,
  room: number,
): {master: Stereo; peakDb: number; rmsDb: number} => {
  const n = draw.n;
  if (room > 0) {
    addRoom(draw, room);
    addRoom(accents, room * 0.8);
  }

  const out = allocStereo(n);
  const hpL = new Biquad("hp", 55, 0.7071);
  const hpR = new Biquad("hp", 55, 0.7071);

  // Feed-forward RMS bus compressor
  const attack = 1 - Math.exp(-1 / (0.008 * SR));
  const release = 1 - Math.exp(-1 / (0.09 * SR));
  const threshold = 0.22;
  const ratio = 2.4;
  let env = 0;

  let peak = 1e-9;
  let sumSq = 0;

  for (let i = 0; i < n; i++) {
    const xl = hpL.run(draw.l[i] + motion.l[i] + accents.l[i]) * masterGain;
    const xr = hpR.run(draw.r[i] + motion.r[i] + accents.r[i]) * masterGain;

    const level = Math.max(Math.abs(xl), Math.abs(xr));
    env += (level > env ? attack : release) * (level - env);

    let comp = 1;
    if (env > threshold) {
      const over = env / threshold;
      comp = Math.pow(over, 1 / ratio - 1);
    }

    const yl = softClip(xl * comp * 1.15) * 0.89;
    const yr = softClip(xr * comp * 1.15) * 0.89;
    out.l[i] = yl;
    out.r[i] = yr;

    peak = Math.max(peak, Math.abs(yl), Math.abs(yr));
    sumSq += yl * yl + yr * yr;
  }

  const rms = Math.sqrt(sumSq / (2 * n)) + 1e-9;
  return {
    master: out,
    peakDb: Math.round(20 * Math.log10(peak) * 10) / 10,
    rmsDb: Math.round(20 * Math.log10(rms) * 10) / 10,
  };
};

/* ───────────────────────── public pipeline API ───────────────────────── */

/**
 * Renders a complete, studio-mastered 48 kHz stereo audio track + isolated stems
 * directly from a Stage 1 `MotionTrace`.
 */
export const renderMasterAudio = (
  trace: MotionTrace,
  options: MasterAudioOptions = {},
): MasterAudioResult => {
  const {
    seed = 1,
    master: masterGain = 1,
    drawVolume = 0,
    whooshVolume = 0.34,
    accentVolume = 0.52,
    room = 0.32,
    foley,
  } = options;

  const n = Math.max(2, Math.round(trace.totalSeconds * SR));
  const draw = renderDrawBed(trace, n, seed, foley, drawVolume);
  const {motion, accents} = renderCues(
    trace.cues,
    n,
    trace.fps,
    seed,
    foley,
    drawVolume,
    whooshVolume,
    accentVolume,
  );

  const {master, peakDb, rmsDb} = applyMasterBus(
    draw,
    motion,
    accents,
    masterGain,
    room,
  );

  const wavBytes = encodeWavBytes(master, seed);
  const dataUri = stereoToDataUri(master, seed);

  return {
    master,
    stems: {draw, motion, accents},
    wavBytes,
    dataUri,
    stats: {
      durationSeconds: n / SR,
      peakDb,
      rmsDb,
      cueCount: trace.cues.length,
    },
  };
};
