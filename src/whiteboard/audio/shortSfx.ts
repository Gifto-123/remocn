import {type PlannedSlot} from "../core/handPlan";
import {type MotionCue, type MotionCueKind, type MotionSample, type MotionTrace} from "./motionTrace";
import {SAMPLE_RATE, type Stereo} from "./sfxEngine";

/**
 * shortSfx.ts — SFX cue sheet for shorts (Beat + planHand, no Whiteboard items).
 *
 * A short exports `SFX: ShortSfx` built from the SAME plans its beats render with:
 *   const PLAN_A = planHand(SLOTS_A, {label: "short1/A"});
 *   export const SFX = mergeSfx(handPlanSfx(PLAN_A, {start: START_A}), cueAt(START_B, "whooshTransition"));
 * `pnpm export-sfx --from src/compositions/<short>.tsx` renders it (see CLAUDE.md "SFX rules").
 * Headless-safe: no React, no DOM.
 */

export type SfxCue = {
  /** Absolute frame in the short. */
  frame: number;
  kind: MotionCueKind;
  /** -1 left .. +1 right. Default 0 (centered column). */
  pan?: number;
  panTo?: number;
  /** 0..1. Default 0.8. */
  intensity?: number;
  /** Pitch multiplier for pop/ping. */
  pitch?: number;
  durationFrames?: number;
};

/** Frames where the pen is on paper (drives the marker/eraser bed). */
export type DrawSpan = {from: number; to: number; pan?: number; speed?: number; erase?: boolean};

export type ShortSfx = {cues: SfxCue[]; draws: DrawSpan[]};

export const mergeSfx = (...parts: Array<ShortSfx | SfxCue>): ShortSfx => {
  const out: ShortSfx = {cues: [], draws: []};
  for (const p of parts) {
    if ("cues" in p) {
      out.cues.push(...p.cues);
      out.draws.push(...p.draws);
    } else {
      out.cues.push(p);
    }
  }
  out.cues.sort((a, b) => a.frame - b.frame);
  return out;
};

/** One manual cue (beat transition, number hit, ...). */
export const cueAt = (frame: number, kind: MotionCueKind, extra: Partial<SfxCue> = {}): SfxCue => ({
  frame,
  kind,
  ...extra,
});

export type HandPlanSfxOptions<K extends string> = {
  /** Absolute start frame of the beat the plan belongs to. */
  start: number;
  pan?: number;
  /** Slots drawn with the eraser instead of the marker. */
  erase?: K[];
  /** Slots that get a reveal accent as the pen lifts (e.g. a pop on an image). */
  accent?: Partial<Record<K, "pop" | "ping">>;
  /** Slots that make no sound. */
  mute?: K[];
};

/**
 * planHand() result -> cues + draw spans.
 *  hand slot:   whooshIn @delay, penDown + draw span, penLift + whooshOut @end
 *  hand:false:  soft pop @delay (reveal without pen)
 */
export const handPlanSfx = <K extends string>(
  plan: Record<K, PlannedSlot>,
  {start, pan = 0, erase = [], accent = {}, mute = []}: HandPlanSfxOptions<K>,
): ShortSfx => {
  const out: ShortSfx = {cues: [], draws: []};
  for (const key of Object.keys(plan) as K[]) {
    if (mute.includes(key)) continue;
    const s = plan[key];
    const t0 = start + s.delay;
    if (!s.showHand) {
      out.cues.push({frame: t0, kind: "pop", pan, intensity: 0.5});
      continue;
    }
    const down = t0 + s.handEnter;
    const up = down + s.duration;
    out.cues.push(
      {frame: t0, kind: "whooshIn", pan, intensity: 0.6, durationFrames: s.handEnter},
      {frame: down, kind: "penDown", pan, intensity: 0.8},
      {frame: up, kind: "penLift", pan, intensity: 0.5},
      {frame: up, kind: "whooshOut", pan, intensity: 0.5, durationFrames: s.handExit},
    );
    const a = accent[key];
    if (a) out.cues.push({frame: up, kind: a, pan, intensity: 0.7});
    out.draws.push({from: down, to: up, pan, erase: erase.includes(key)});
  }
  out.cues.sort((a, b) => a.frame - b.frame);
  return out;
};

export type ShortTraceOptions = {
  totalFrames: number;
  fps?: number;
  width?: number;
  height?: number;
  subSteps?: number;
};

/** Builds a MotionTrace that `renderMasterAudio` accepts, from a short's cue sheet. */
export const buildShortTrace = (
  sfx: ShortSfx,
  {totalFrames, fps = 30, width = 1080, height = 1920, subSteps = 4}: ShortTraceOptions,
): MotionTrace => {
  const count = Math.ceil(totalFrames * subSteps) + 1;
  const samples: MotionSample[] = new Array(count);
  for (let k = 0; k < count; k++) {
    const frame = k / subSteps;
    samples[k] = {
      frame,
      time: frame / fps,
      x: 0,
      y: 0,
      pan: 0,
      speed: 0,
      pxPerSec: 0,
      curvature: 0,
      mode: "idle",
      itemIndex: -1,
      gesture: null,
    };
  }
  for (const d of sfx.draws) {
    const k0 = Math.max(0, Math.floor(d.from * subSteps));
    const k1 = Math.min(count - 1, Math.ceil(d.to * subSteps));
    for (let k = k0; k <= k1; k++) {
      const s = samples[k];
      s.mode = d.erase ? "erase" : "draw";
      s.speed = d.speed ?? 0.5;
      s.pxPerSec = (d.speed ?? 0.5) * 2200;
      s.pan = d.pan ?? 0;
      s.gesture = "write";
    }
  }
  const cues: MotionCue[] = sfx.cues.map((c) => ({
    kind: c.kind,
    frame: c.frame,
    time: c.frame / fps,
    durationFrames: c.durationFrames,
    x: 0,
    y: 0,
    pan: c.pan ?? 0,
    panTo: c.panTo,
    intensity: c.intensity ?? 0.8,
    pitch: c.pitch,
    itemIndex: -1,
  }));
  return {
    fps,
    subSteps,
    viewportWidth: width,
    viewportHeight: height,
    totalFrames,
    totalSeconds: totalFrames / fps,
    samples,
    cues,
  };
};

/* ───────────────────────── voice-over ducking ───────────────────────── */

export type Span = {start: number; end: number};

/**
 * Word spans (seconds) from whisper.cpp JSON (`transcription[].tokens[].offsets` in ms).
 * Plain object in, no fs: the CLI reads the file.
 */
export const wordSpansFromWhisper = (json: unknown): Span[] => {
  const segments = (json as {transcription?: Array<{tokens?: Array<{text: string; offsets: {from: number; to: number}}>}>})
    .transcription ?? [];
  const out: Span[] = [];
  for (const seg of segments) {
    for (const t of seg.tokens ?? []) {
      if (t.text.startsWith("[_")) continue;
      out.push({start: t.offsets.from / 1000, end: t.offsets.to / 1000});
    }
  }
  return out;
};

export type DuckOptions = {
  /** Gain while the voice speaks, dB (negative). Default -5. */
  depthDb?: number;
  attackMs?: number;
  releaseMs?: number;
  /** Duck starts this early before each word. Default 40 ms. */
  leadMs?: number;
};

/** Lowers `audio` in place under the voice. One-pole smoothed, click-free. */
export const duckStereo = (
  audio: Stereo,
  words: Span[],
  {depthDb = -5, attackMs = 25, releaseMs = 220, leadMs = 40}: DuckOptions = {},
): void => {
  const SR = SAMPLE_RATE;
  const low = Math.pow(10, depthDb / 20);
  const target = new Float32Array(audio.n).fill(1);
  const lead = Math.round((leadMs / 1000) * SR);
  for (const w of words) {
    const a = Math.max(0, Math.round(w.start * SR) - lead);
    const b = Math.min(audio.n, Math.round(w.end * SR));
    for (let i = a; i < b; i++) target[i] = low;
  }
  const att = 1 - Math.exp(-1 / ((attackMs / 1000) * SR));
  const rel = 1 - Math.exp(-1 / ((releaseMs / 1000) * SR));
  let g = 1;
  for (let i = 0; i < audio.n; i++) {
    g += (target[i] < g ? att : rel) * (target[i] - g);
    audio.l[i] *= g;
    audio.r[i] *= g;
  }
};
