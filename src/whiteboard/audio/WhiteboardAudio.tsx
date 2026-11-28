import React, {useEffect, useMemo, useState} from "react";
import {Audio} from "@remotion/media";
import {
  Sequence,
  continueRender,
  delayRender,
  useVideoConfig,
} from "remotion";
import {whiteboardSlots, type WhiteboardItem} from "../motion/Whiteboard";
import {type CameraKeyframe} from "../motion/WhiteboardCamera";
import {
  decodeWavBytes,
  renderMasterAudio,
  type FoleyBank,
  type FoleyBankKey,
  type FoleySample,
  type MasterAudioOptions,
} from "./masterAudio";
import {extractMotionTrace, type MotionTrace} from "./motionTrace";
import {
  PING_SECONDS,
  POP_SECONDS,
  eraserWav,
  markerWav,
  pingWav,
  popWav,
  whooshWav,
} from "./sfxEngine";

/**
 * Whiteboard SFX for Remotion.
 *
 * Every clip is synthesized (deterministically) to the EXACT length of the
 * visual it belongs to — nothing loops, nothing repeats. Pass `src` to any
 * component to swap in a recorded foley file instead.
 *
 * Suggested mix: voice-over around -18 dBFS RMS; defaults here sit roughly
 * 8-12 dB under it. Use `master` on <WhiteboardAudio /> to move everything.
 */

const framesFor = (seconds: number, fps: number) =>
  Math.max(1, Math.ceil(seconds * fps) + 1);

/* ───────────────────────── continuous textures ───────────────────────── */

export type LoopSfxProps = {
  /** Frame (relative to the parent Sequence) when the sound starts. */
  delay?: number;
  /** Duration in frames — the clip is rendered to exactly this length. */
  duration: number;
  /** 0..1 */
  volume?: number;
  /** Different seed = different "handwriting". */
  seed?: number;
  /** -1 (left) .. +1 (right) */
  pan?: number;
  /** Custom file. When given, it is looped instead of synthesized. */
  src?: string;
};

export type MarkerSoundProps = LoopSfxProps & {
  /** "write": many short strokes (text). "shape": long sweeps (circle, underline, box). */
  style?: "write" | "shape";
  /** 0..1 optional subtle felt-tip squeak. Default 0. */
  squeak?: number;
};

/** Felt-tip marker on whiteboard — warm, smooth stroke-based glide. */
export const MarkerSound: React.FC<MarkerSoundProps> = ({
  delay = 0,
  duration,
  volume = 0.34,
  seed = 1,
  pan = 0,
  style = "write",
  squeak = 0,
  src,
}) => {
  const {fps} = useVideoConfig();
  const dur = Math.max(1, Math.round(duration));
  const active = volume > 0 && duration > 0;
  const uri = useMemo(
    () =>
      !active
        ? ""
        : (src ?? markerWav({seconds: dur / fps, seed, style, pan, squeak})),
    [active, src, dur, fps, seed, style, pan, squeak],
  );
  if (!active) return null;
  return (
    <Sequence from={Math.round(delay)} durationInFrames={dur} layout="none">
      <Audio src={uri} loop={Boolean(src)} volume={volume} />
    </Sequence>
  );
};

/** Felt eraser wiping side to side; stereo position follows the hand. */
export const EraserSound: React.FC<LoopSfxProps> = ({
  delay = 0,
  duration,
  volume = 0.5,
  seed = 1,
  pan = 0,
  src,
}) => {
  const {fps} = useVideoConfig();
  const dur = Math.max(1, Math.round(duration));
  const active = volume > 0 && duration > 0;
  const uri = useMemo(
    () => (!active ? "" : (src ?? eraserWav({seconds: dur / fps, seed, pan}))),
    [active, src, dur, fps, seed, pan],
  );
  if (!active) return null;
  return (
    <Sequence from={Math.round(delay)} durationInFrames={dur} layout="none">
      <Audio src={uri} loop={Boolean(src)} volume={volume} />
    </Sequence>
  );
};

/* ───────────────────────── one-shots ───────────────────────── */

export type WhooshSoundProps = {
  delay?: number;
  /** Duration in frames — the swell is rendered to this length. Default 10. */
  duration?: number;
  volume?: number;
  seed?: number;
  /** "up" brightens as it swells (enter/travel), "down" darkens (exit). */
  sweep?: "up" | "down";
  panFrom?: number;
  panTo?: number;
  src?: string;
};

/** Hand / paper / board slide. Moves across the stereo field. */
export const WhooshSound: React.FC<WhooshSoundProps> = ({
  delay = 0,
  duration = 10,
  volume = 0.28,
  seed = 1,
  sweep = "up",
  panFrom = -0.45,
  panTo = 0.45,
  src,
}) => {
  const {fps} = useVideoConfig();
  const dur = Math.max(1, Math.round(duration));
  const active = volume > 0 && duration > 0;
  const uri = useMemo(
    () =>
      !active
        ? ""
        : (src ?? whooshWav({seconds: dur / fps, seed, sweep, panFrom, panTo})),
    [active, src, dur, fps, seed, sweep, panFrom, panTo],
  );
  if (!active) return null;
  return (
    <Sequence from={Math.round(delay)} durationInFrames={dur} layout="none">
      <Audio src={uri} volume={volume} />
    </Sequence>
  );
};

export type AccentSoundProps = {
  delay?: number;
  volume?: number;
  seed?: number;
  pan?: number;
  src?: string;
};

/** Soft woody "thock" — circles, highlights, frames, bubbles. */
export const PopSound: React.FC<AccentSoundProps> = ({
  delay = 0,
  volume = 0.3,
  seed = 1,
  pan = 0,
  src,
}) => {
  const {fps} = useVideoConfig();
  const uri = useMemo(
    () => (volume <= 0 ? "" : (src ?? popWav({seed, pan}))),
    [volume, src, seed, pan],
  );
  if (volume <= 0) return null;
  return (
    <Sequence
      from={Math.round(delay)}
      durationInFrames={framesFor(POP_SECONDS, fps)}
      layout="none"
    >
      <Audio src={uri} volume={volume} />
    </Sequence>
  );
};

/** Soft glass ping — checkmarks and finished charts / "result" moments. */
export const PingSound: React.FC<AccentSoundProps> = ({
  delay = 0,
  volume = 0.24,
  seed = 1,
  pan = 0,
  src,
}) => {
  const {fps} = useVideoConfig();
  const uri = useMemo(
    () => (volume <= 0 ? "" : (src ?? pingWav({seed, pan}))),
    [volume, src, seed, pan],
  );
  if (volume <= 0) return null;
  return (
    <Sequence
      from={Math.round(delay)}
      durationInFrames={framesFor(PING_SECONDS, fps)}
      layout="none"
    >
      <Audio src={uri} volume={volume} />
    </Sequence>
  );
};

/* ───────────────────────── automatic Whiteboard scene audio ───────────────────────── */

export type WhiteboardAudioProps = {
  /** Same `items` array passed to <Whiteboard />. */
  items: WhiteboardItem[];
  /** Same timing props passed to <Whiteboard />. */
  delay?: number;
  enter?: number;
  travel?: number;
  exit?: number;

  /** Scales everything (default 1). */
  master?: number;
  /** Marker volume while drawing (0 = mute). Default 0. */
  scribbleVolume?: number;
  /** Whoosh volume (0 = mute). Default 0. */
  whooshVolume?: number;
  /** Pop / ping volume (0 = mute). Default 0.26. */
  popVolume?: number;
  /**
   * Which items get a landing accent:
   * - "accents" (default): circle, check, cross, strike, highlight, frame, bubble, charts
   * - "all": every item
   * - "none": disabled
   */
  popOn?: "accents" | "all" | "none";
  /** What plays as the board leaves. Default "whoosh". */
  exitSound?: "whoosh" | "eraser" | "none";
  /** 0..1 random-but-fixed left/right scatter per item. Default 0.3. */
  stereoSpread?: number;
  /** Change to get a different set of "takes" for the whole scene. */
  seed?: number;

  scribbleSrc?: string;
  whooshSrc?: string;
  popSrc?: string;
  pingSrc?: string;
};

const ACCENT_TYPES = new Set<string>([
  "circle",
  "check",
  "cross",
  "strike",
  "highlight",
  "frame",
  "bubble",
  "barChart",
  "lineChart",
]);
const PING_TYPES = new Set<string>(["check", "barChart", "lineChart"]);
const SHAPE_TYPES = new Set<string>([
  "circle",
  "check",
  "cross",
  "strike",
  "highlight",
  "frame",
  "bubble",
]);

/** Deterministic pseudo-random in [-1, 1] from an integer. */
const hashPan = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

/**
 * Automatically synchronizes marker, whoosh and accent SFX to a <Whiteboard />
 * scene's drawing and travel slots. Each clip is rendered to the exact length
 * of its slot, with its own seed, so no two strokes sound the same.
 */
export const WhiteboardAudio: React.FC<WhiteboardAudioProps> = ({
  items,
  delay = 0,
  enter = 8,
  travel = 10,
  exit = 10,
  master = 1,
  scribbleVolume = 0,
  whooshVolume = 0,
  popVolume = 0.26,
  popOn = "accents",
  exitSound = "whoosh",
  stereoSpread = 0.3,
  seed = 1,
  scribbleSrc,
  whooshSrc,
  popSrc,
  pingSrc,
}) => {
  if (items.length === 0) return null;

  const {slots, lastEnd} = whiteboardSlots(items, {enter, travel});
  const sv = scribbleVolume * master;
  const wv = whooshVolume * master;
  const pv = popVolume * master;

  return (
    <>
      {enter > 0 ? (
        <WhooshSound
          delay={delay}
          duration={enter}
          volume={wv}
          seed={seed * 1000 + 1}
          sweep="up"
          panFrom={-0.55}
          panTo={0.1}
          src={whooshSrc}
        />
      ) : null}

      {slots.map((slot, i) => {
        const drawDur = slot.end - slot.start;
        const nextSlot = slots[i + 1];
        const travelDur = nextSlot ? nextSlot.start - slot.end : 0;
        const item = items[i];
        const type = String(item.type);
        const pan = hashPan(seed * 31 + i) * stereoSpread;
        const accent =
          popOn === "all" || (popOn === "accents" && ACCENT_TYPES.has(type));
        const itemSeed = seed * 1000 + i * 17 + 3;

        return (
          <React.Fragment key={i}>
            <MarkerSound
              delay={delay + slot.start}
              duration={drawDur}
              volume={sv}
              seed={itemSeed}
              pan={pan}
              style={SHAPE_TYPES.has(type) ? "shape" : "write"}
              src={scribbleSrc}
            />
            {accent ? (
              PING_TYPES.has(type) ? (
                <PingSound
                  delay={delay + Math.max(0, slot.end - 1)}
                  volume={pv * 0.8}
                  seed={itemSeed}
                  pan={pan}
                  src={pingSrc}
                />
              ) : (
                <PopSound
                  delay={delay + Math.max(0, slot.end - 1)}
                  volume={pv}
                  seed={itemSeed}
                  pan={pan}
                  src={popSrc}
                />
              )
            ) : null}
            {travelDur > 0 ? (
              <WhooshSound
                delay={delay + slot.end}
                duration={travelDur}
                volume={wv * 0.65}
                seed={itemSeed + 5}
                sweep={i % 2 === 0 ? "up" : "down"}
                panFrom={pan - 0.25}
                panTo={hashPan(seed * 31 + i + 1) * stereoSpread + 0.25}
                src={whooshSrc}
              />
            ) : null}
          </React.Fragment>
        );
      })}

      {exit > 0 && exitSound === "whoosh" ? (
        <WhooshSound
          delay={delay + lastEnd}
          duration={exit}
          volume={wv}
          seed={seed * 1000 + 2}
          sweep="down"
          panFrom={0.1}
          panTo={0.55}
          src={whooshSrc}
        />
      ) : null}
      {exit > 0 && exitSound === "eraser" ? (
        <EraserSound
          delay={delay + lastEnd}
          duration={exit}
          volume={sv}
          seed={seed * 1000 + 4}
        />
      ) : null}
    </>
  );
};

/* ───────────────────────── Stage 4: Master Pipeline Component ───────────────────────── */

const foleyCache = new Map<string, Promise<FoleySample>>();

const loadFoleyUrl = (url: string): Promise<FoleySample> => {
  const hit = foleyCache.get(url);
  if (hit) return hit;
  const p = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch foley WAV: ${url}`);
      return res.arrayBuffer();
    })
    .then((buf) => decodeWavBytes(new Uint8Array(buf)));
  foleyCache.set(url, p);
  return p;
};

export type FoleySrcMap = Partial<Record<FoleyBankKey, string>>;

export type MasterWhiteboardAudioProps = Omit<MasterAudioOptions, "foley"> & {
  /**
   * Optional pre-baked `.wav` file (e.g. `staticFile("audio/scene-master.wav")`).
   * When set, plays that file directly with zero runtime synthesis.
   */
  src?: string;
  /** Whiteboard items to synthesize telemetry audio for (when `src` & `trace` are omitted). */
  items?: WhiteboardItem[];
  /** Optional pre-computed Stage 1 MotionTrace. */
  trace?: MotionTrace;
  delay?: number;
  enter?: number;
  travel?: number;
  exit?: number;
  lift?: number;
  totalFrames?: number;
  stereoSpread?: number;
  cameraKeyframes?: CameraKeyframe[];
  cameraDefaultGlide?: number;
  /** Optional decoded foley bank. */
  foley?: FoleyBank;
  /** Optional `.wav` URLs (e.g. `{marker: staticFile("sfx/marker.wav")}`) fetched & decoded automatically. */
  foleySrcs?: FoleySrcMap;
  /** Playback volume on the Remotion <Audio /> element (0..1). Default 1. */
  volume?: number;
};

/**
 * Studio-mastered single-stream Whiteboard audio component.
 *
 * - Pass `src={staticFile("...")}` to play an exported `.wav` from `scripts/export-sfx.mjs`.
 * - Or pass `items` (plus optional `cameraKeyframes` / `foleySrcs`) to synthesize
 *   a 48 kHz stereo master track directly from frame coordinates & velocity.
 */
export const MasterWhiteboardAudio: React.FC<MasterWhiteboardAudioProps> = ({
  src,
  items,
  trace: explicitTrace,
  delay = 0,
  enter = 8,
  travel = 10,
  exit = 10,
  lift = 60,
  totalFrames,
  stereoSpread = 0.55,
  cameraKeyframes,
  cameraDefaultGlide = 22,
  foley,
  foleySrcs,
  volume = 1,
  seed = 1,
  master = 1,
  drawVolume = 0,
  whooshVolume = 0.34,
  accentVolume = 0.52,
  room = 0.32,
}) => {
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const foleySig = JSON.stringify(foleySrcs ?? null);
  const [loadedFoley, setLoadedFoley] = useState<FoleyBank | null>(
    foleySrcs ? null : {},
  );

  useEffect(() => {
    if (src || !foleySrcs) {
      setLoadedFoley({});
      return;
    }
    const entries = (Object.keys(foleySrcs) as FoleyBankKey[]).filter(
      (k) => Boolean(foleySrcs[k]),
    );
    if (entries.length === 0) {
      setLoadedFoley({});
      return;
    }

    let cancelled = false;
    const handle = delayRender("Loading whiteboard foley WAVs");
    Promise.all(
      entries.map(async (k) => [k, await loadFoleyUrl(foleySrcs[k]!)] as const),
    )
      .then((pairs) => {
        if (cancelled) return;
        const bank: FoleyBank = {};
        for (const [k, sample] of pairs) bank[k] = sample;
        setLoadedFoley(bank);
        continueRender(handle);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedFoley({});
        continueRender(handle);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, foleySig]);

  const dataUri = useMemo(() => {
    if (src || loadedFoley === null) return "";
    const resolvedTrace =
      explicitTrace ??
      (items
        ? extractMotionTrace({
            items,
            delay,
            enter,
            travel,
            exit,
            lift,
            fps,
            viewportWidth: width,
            viewportHeight: height,
            totalFrames: totalFrames ?? durationInFrames,
            stereoSpread,
            cameraKeyframes,
            cameraDefaultGlide,
          })
        : null);
    if (!resolvedTrace) return "";
    const mergedFoley: FoleyBank = {...loadedFoley, ...foley};
    return renderMasterAudio(resolvedTrace, {
      seed,
      master,
      drawVolume,
      whooshVolume,
      accentVolume,
      room,
      foley: Object.keys(mergedFoley).length > 0 ? mergedFoley : undefined,
    }).dataUri;
  }, [
    src,
    loadedFoley,
    explicitTrace,
    items,
    delay,
    enter,
    travel,
    exit,
    lift,
    fps,
    width,
    height,
    totalFrames,
    durationInFrames,
    stereoSpread,
    cameraKeyframes,
    cameraDefaultGlide,
    foley,
    seed,
    master,
    drawVolume,
    whooshVolume,
    accentVolume,
    room,
  ]);

  const resolvedSrc = src ?? dataUri;
  if (!resolvedSrc || volume <= 0) return null;

  return <Audio src={resolvedSrc} volume={volume} />;
};
