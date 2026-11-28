import {Easing} from "remotion";
import {
  DEFAULT_AWAY,
  buildSlots,
  handAt,
  timelineFrames,
  type TimelineOptions,
} from "../core/timeline";
import {
  prepareWhiteboardItems,
  type PreparedItem,
  type WhiteboardItem,
} from "../motion/Whiteboard";
import {cameraAt, type CameraKeyframe} from "../motion/WhiteboardCamera";
import {
  CANVAS_PRESETS,
  presetForAspect,
  type AspectRatio,
  type CanvasPresetName,
} from "../core/presets";

/**
 * motionTrace.ts — Stage 1 of the studio SFX pipeline.
 *
 * Extracts pure coordinate, velocity, curvature, stereo-pan, and stroke-event
 * telemetry directly from Whiteboard items (and optional WhiteboardCamera
 * keyframes). Zero React / DOM dependency so it runs identically in Remotion
 * Studio and headless Node CLI audio export.
 */

export type PenMode = "idle" | "enter" | "draw" | "travel" | "exit" | "erase";

export type MotionSample = {
  /** Frame coordinate (fractional, e.g. 12.25). */
  frame: number;
  /** Time in seconds from frame 0. */
  time: number;
  /** Pen-tip X, Y in board coordinates (0,0 when idle). */
  x: number;
  y: number;
  /** Normalized stereo pan -1 (left) .. +1 (right) inside viewport. */
  pan: number;
  /** Normalized pen speed 0..1 (smoothed). */
  speed: number;
  /** Raw speed in board px/sec. */
  pxPerSec: number;
  /** Corner / direction-turn intensity 0..1. */
  curvature: number;
  mode: PenMode;
  /** Active item index in `items`, or -1 when idle/entering/exiting. */
  itemIndex: number;
  /** Gesture class when drawing ("write" vs "shape"), or null. */
  gesture: "write" | "shape" | null;
};

export type MotionCueKind =
  | "whooshIn"
  | "whooshTravel"
  | "whooshOut"
  | "whooshTransition"
  | "penDown"
  | "penLift"
  | "corner"
  | "pop"
  | "ping";

export type MotionCue = {
  kind: MotionCueKind;
  frame: number;
  time: number;
  durationFrames?: number;
  x: number;
  y: number;
  pan: number;
  panTo?: number;
  /** 0..1 relative intensity. */
  intensity: number;
  /** Optional pitch multiplier for pop/ping accents. */
  pitch?: number;
  itemIndex: number;
  itemType?: WhiteboardItem["type"];
};

export type MotionTrace = {
  fps: number;
  subSteps: number;
  viewportWidth: number;
  viewportHeight: number;
  totalFrames: number;
  totalSeconds: number;
  samples: MotionSample[];
  cues: MotionCue[];
};

export type MotionTraceOptions = {
  items: WhiteboardItem[];
  delay?: number;
  enter?: number;
  travel?: number;
  exit?: number;
  lift?: number;
  away?: {x: number; y: number};
  fps?: number;
  /** Convenience aspect preset ("16:9" = 1920x1080, "9:16" = 1080x1920). */
  aspect?: AspectRatio;
  /** Named preset ("youtubeLong", "youtubeLong60", "youtubeLong4k", "youtubeShort"). */
  preset?: CanvasPresetName;
  /** Composition viewport width (px) used for stereo panning. */
  viewportWidth?: number;
  /** Composition viewport height (px). */
  viewportHeight?: number;
  /** Optional total composition length (frames). Defaults to delay + sceneFrames. */
  totalFrames?: number;
  /** Sub-steps per frame for corner/velocity resolution. Default 4. */
  subSteps?: number;
  /** 0..1 stereo width multiplier. Default 0.55. */
  stereoSpread?: number;
  /** Optional exact measured text sizes; omitted => deterministic estimate. */
  textSizes?: Record<number, {w: number; h: number}>;
  /** Optional WhiteboardCamera keyframes to project board coords -> viewport pan. */
  cameraKeyframes?: CameraKeyframe[];
  cameraDefaultGlide?: number;
  /** Reference drawing speed (px/sec) corresponding to speed = 1. Default 2200. */
  referenceSpeed?: number;
  /** Minimum hand travel distance (px) required when `travelWhoosh` is enabled. Default 220. */
  minTravelWhooshDist?: number;
  /** Emit whoosh SFX when the hand slides in/out of the board. Default false. */
  handWhoosh?: boolean;
  /** Emit whoosh SFX when the hand travels between items on the same board. Default false. */
  travelWhoosh?: boolean;
  /** Suppress board enter/exit whooshes (useful inside TransitionSeries). */
  suppressEnterWhoosh?: boolean;
  suppressExitWhoosh?: boolean;
  /** Extra manual cues (e.g. camera pans or transitions) to merge in. */
  extraCues?: MotionCue[];
};

const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x));

const strokeEase = Easing.inOut(Easing.sin);

const SHAPE_TYPES = new Set<WhiteboardItem["type"]>([
  "circle",
  "check",
  "cross",
  "strike",
  "highlight",
  "frame",
  "bubble",
  "divider",
  "bracket",
  "arrow",
  "underline",
]);

const ACCENT_TYPES = new Set<WhiteboardItem["type"]>([
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

const PING_TYPES = new Set<WhiteboardItem["type"]>([
  "check",
  "barChart",
  "lineChart",
]);

/** Visual completion fraction (0..1 of slot duration) where an accent snap lands. */
const accentSnapFraction = (type: WhiteboardItem["type"]): number => {
  switch (type) {
    case "circle":
      return 0.78;
    case "highlight":
    case "check":
      return 0.85;
    case "frame":
    case "bubble":
      return 0.88;
    case "lineChart":
      return 0.9;
    default:
      return 0.9;
  }
};

const invertSineEase = (eased: number) =>
  Math.acos(clamp(1 - 2 * eased, -1, 1)) / Math.PI;

const subStrokeLens = (prep: PreparedItem): number[] | null => {
  switch (prep.kind) {
    case "bubble":
    case "strokes":
      return prep.lens.length > 1 ? prep.lens : null;
    case "barChart":
    case "lineChart":
      return prep.geom.lens.length > 1 ? prep.geom.lens : null;
    default:
      return null;
  }
};

const toViewportPan = (
  bx: number,
  by: number,
  frame: number,
  vw: number,
  vh: number,
  spread: number,
  cameraKeyframes?: CameraKeyframe[],
  cameraDefaultGlide = 22,
): number => {
  let vx = bx;
  if (cameraKeyframes && cameraKeyframes.length > 0) {
    const cam = cameraAt(frame, cameraKeyframes, {
      defaultGlide: cameraDefaultGlide,
      fallback: {x: vw / 2, y: vh / 2, zoom: 1, rotate: 0},
    });
    const rad = (cam.rotate * Math.PI) / 180;
    const dx = (bx - cam.x) * cam.zoom;
    const dy = (by - cam.y) * cam.zoom;
    vx = vw / 2 + dx * Math.cos(rad) - dy * Math.sin(rad);
  }
  const norm = (vx / Math.max(1, vw)) * 2 - 1;
  return clamp(norm * spread, -1, 1);
};

/**
 * Samples a Whiteboard scene into continuous motion telemetry + discrete audio cues.
 */
export const extractMotionTrace = ({
  items,
  delay = 0,
  enter = 8,
  travel = 10,
  exit = 10,
  lift = 60,
  away,
  fps: explicitFps,
  aspect,
  preset,
  viewportWidth: explicitVw,
  viewportHeight: explicitVh,
  totalFrames: explicitTotalFrames,
  subSteps = 4,
  stereoSpread = 0.55,
  textSizes,
  cameraKeyframes,
  cameraDefaultGlide = 22,
  referenceSpeed: explicitRefSpeed,
  minTravelWhooshDist = 220,
  handWhoosh = false,
  travelWhoosh = false,
  suppressEnterWhoosh = false,
  suppressExitWhoosh = false,
  extraCues = [],
}: MotionTraceOptions): MotionTrace => {
  const basePreset = preset
    ? CANVAS_PRESETS[preset]
    : aspect
      ? presetForAspect(aspect)
      : CANVAS_PRESETS.youtubeShort;
  const fps = explicitFps ?? basePreset.fps;
  const viewportWidth = explicitVw ?? basePreset.width;
  const viewportHeight = explicitVh ?? basePreset.height;
  const resolvedAway =
    away ??
    (viewportWidth > viewportHeight ? {x: 420, y: 680} : DEFAULT_AWAY);
  const referenceSpeed =
    explicitRefSpeed ?? (viewportWidth >= 1920 ? 2500 : 2200);

  const prepared = prepareWhiteboardItems(items, textSizes);
  const entries = prepared.map((p) => p.entry);
  const durations = entries.map((e) => e.duration);
  const options: TimelineOptions = {
    enter,
    travel,
    exit,
    lift,
    away: resolvedAway,
  };
  const {slots, lastEnd} = buildSlots(durations, options);
  const sceneFrames =
    items.length === 0 ? 0 : timelineFrames(durations, options);
  const totalFrames = Math.max(1, explicitTotalFrames ?? delay + sceneFrames);
  const steps = Math.max(1, Math.round(subSteps));
  const totalSamples = Math.max(2, Math.round(totalFrames * steps) + 1);
  const dtSec = 1 / (fps * steps);

  const samples: MotionSample[] = [];
  const cues: MotionCue[] = [...extraCues];

  const panAt = (bx: number, by: number, frame: number) =>
    toViewportPan(
      bx,
      by,
      frame,
      viewportWidth,
      viewportHeight,
      stereoSpread,
      cameraKeyframes,
      cameraDefaultGlide,
    );

  // 1) Sample continuous motion at sub-frame resolution
  let prevX = 0;
  let prevY = 0;
  let prevVx = 0;
  let prevVy = 0;
  let prevMode: PenMode = "idle";
  let smoothSpeed = 0;
  let smoothCurvature = 0;
  let lastCornerFrame = -100;

  for (let k = 0; k < totalSamples; k++) {
    const frame = k / steps;
    const time = frame / fps;
    const localF = frame - delay;
    const pose = items.length > 0 ? handAt(localF, entries, options) : null;

    let mode: PenMode = "idle";
    let itemIndex = -1;
    let gesture: "write" | "shape" | null = null;

    if (pose && items.length > 0) {
      if (localF < slots[0].start) {
        mode = "enter";
        itemIndex = 0;
      } else if (localF > lastEnd) {
        mode = "exit";
        itemIndex = items.length - 1;
      } else {
        for (let i = 0; i < slots.length; i++) {
          const s = slots[i];
          if (localF >= s.start && localF <= s.end) {
            mode = "draw";
            itemIndex = i;
            gesture = SHAPE_TYPES.has(items[i].type) ? "shape" : "write";
            break;
          }
          if (i < slots.length - 1 && localF > s.end && localF < slots[i + 1].start) {
            mode = "travel";
            itemIndex = i;
            break;
          }
        }
      }
    }

    const x = pose ? pose.x : 0;
    const y = pose ? pose.y : 0;
    const pan = pose ? panAt(x, y, frame) : 0;

    let pxPerSec = 0;
    let rawCurvature = 0;

    if (
      k > 0 &&
      (mode === "draw" || mode === "travel") &&
      mode === prevMode
    ) {
      const dx = x - prevX;
      const dy = y - prevY;
      const dist = Math.hypot(dx, dy);
      // Ignore instantaneous jumps across discrete strokes
      if (dist <= 42) {
        pxPerSec = dist / dtSec;
        const vx = dx / dtSec;
        const vy = dy / dtSec;
        const vMag = Math.hypot(vx, vy);
        const pvMag = Math.hypot(prevVx, prevVy);
        if (mode === "draw" && vMag > 90 && pvMag > 90) {
          const cos = clamp((vx * prevVx + vy * prevVy) / (vMag * pvMag), -1, 1);
          const angle = Math.acos(cos);
          rawCurvature = clamp((angle - 0.32) / (Math.PI * 0.7), 0, 1);
        }
        prevVx = vx;
        prevVy = vy;
      } else {
        prevVx = 0;
        prevVy = 0;
      }
    } else {
      prevVx = 0;
      prevVy = 0;
    }

    const targetSpeed = clamp(pxPerSec / referenceSpeed, 0, 1);
    const alpha = mode === "draw" ? 0.35 : 0.5;
    smoothSpeed =
      mode === "idle" ? 0 : smoothSpeed + alpha * (targetSpeed - smoothSpeed);
    smoothCurvature =
      mode === "draw"
        ? smoothCurvature + 0.45 * (rawCurvature - smoothCurvature)
        : 0;

    if (
      mode === "draw" &&
      smoothCurvature >= 0.55 &&
      frame - lastCornerFrame >= 5
    ) {
      lastCornerFrame = frame;
      cues.push({
        kind: "corner",
        frame,
        time,
        x,
        y,
        pan,
        intensity: clamp(smoothCurvature, 0.3, 1),
        itemIndex,
        itemType: items[itemIndex]?.type,
      });
    }

    samples.push({
      frame,
      time,
      x,
      y,
      pan,
      speed: smoothSpeed,
      pxPerSec,
      curvature: smoothCurvature,
      mode,
      itemIndex,
      gesture,
    });

    prevX = x;
    prevY = y;
    prevMode = mode;
  }

  // 2) Emit structural item, stroke, travel, and accent cues
  if (items.length > 0) {
    if (enter > 0 && handWhoosh && !suppressEnterWhoosh) {
      const startPose = handAt(slots[0].start, entries, options);
      const pEnd = startPose ? panAt(startPose.x, startPose.y, delay + enter) : 0;
      cues.push({
        kind: "whooshIn",
        frame: delay,
        time: delay / fps,
        durationFrames: enter,
        x: startPose?.x ?? 0,
        y: startPose?.y ?? 0,
        pan: clamp(pEnd - 0.35, -1, 1),
        panTo: pEnd,
        intensity: 0.75,
        itemIndex: 0,
        itemType: items[0].type,
      });
    }

    slots.forEach((slot, i) => {
      const item = items[i];
      const prep = prepared[i];
      const dur = Math.max(1, slot.end - slot.start);
      const pStart = handAt(slot.start, entries, options) ?? {x: 0, y: 0};
      const pEnd = handAt(slot.end, entries, options) ?? {x: 0, y: 0};
      const panStart = panAt(pStart.x, pStart.y, delay + slot.start);
      const panEnd = panAt(pEnd.x, pEnd.y, delay + slot.end);

      cues.push({
        kind: "penDown",
        frame: delay + slot.start,
        time: (delay + slot.start) / fps,
        x: pStart.x,
        y: pStart.y,
        pan: panStart,
        intensity: 0.65,
        itemIndex: i,
        itemType: item.type,
      });

      // Multi-stroke interior penLift / penDown boundaries
      const lens = subStrokeLens(prep);
      if (lens) {
        const total = lens.reduce((a, b) => a + b, 0);
        let acc = 0;
        for (let sIdx = 0; sIdx < lens.length - 1; sIdx++) {
          acc += lens[sIdx];
          const targetEased = total > 0 ? acc / total : 0;
          const u = invertSineEase(targetEased);
          const fCross = delay + slot.start + u * dur;
          const pose = handAt(fCross - delay, entries, options) ?? pStart;
          const pCross = panAt(pose.x, pose.y, fCross);
          cues.push({
            kind: "penLift",
            frame: fCross,
            time: fCross / fps,
            x: pose.x,
            y: pose.y,
            pan: pCross,
            intensity: 0.45,
            itemIndex: i,
            itemType: item.type,
          });
          cues.push({
            kind: "penDown",
            frame: fCross + 0.25,
            time: (fCross + 0.25) / fps,
            x: pose.x,
            y: pose.y,
            pan: pCross,
            intensity: 0.5,
            itemIndex: i,
            itemType: item.type,
          });
        }
      }

      cues.push({
        kind: "penLift",
        frame: delay + slot.end,
        time: (delay + slot.end) / fps,
        x: pEnd.x,
        y: pEnd.y,
        pan: panEnd,
        intensity: 0.55,
        itemIndex: i,
        itemType: item.type,
      });

      if (prep.kind === "barChart") {
        // Fire ascending pops right as each bar's value pops in, and ping on final bar
        const total = Math.max(1, prep.geom.totalLen);
        let acc = 0;
        const barOffsets: number[] = [];
        prep.geom.lens.forEach((len) => {
          barOffsets.push(acc);
          acc += len;
        });
        prep.geom.bars.forEach((bar, bIdx) => {
          const bStart = barOffsets[bar.strokeIndex];
          const bLen = prep.geom.lens[bar.strokeIndex];
          const targetEased = (bStart + bLen * 0.85) / total;
          const u = invertSineEase(targetEased);
          const fSnap = delay + slot.start + u * dur;
          const pose = handAt(fSnap - delay, entries, options) ?? pEnd;
          const isLast = bIdx === prep.geom.bars.length - 1;
          cues.push({
            kind: isLast ? "ping" : "pop",
            frame: fSnap,
            time: fSnap / fps,
            x: pose.x,
            y: pose.y,
            pan: panAt(pose.x, pose.y, fSnap),
            intensity: isLast ? 0.9 : 0.68,
            pitch: isLast ? 1 : 0.9 + bIdx * 0.08,
            itemIndex: i,
            itemType: item.type,
          });
        });
      } else if (ACCENT_TYPES.has(item.type)) {
        const snapU = accentSnapFraction(item.type);
        const fSnap = delay + slot.start + snapU * dur;
        const pose = handAt(fSnap - delay, entries, options) ?? pEnd;
        cues.push({
          kind: PING_TYPES.has(item.type) ? "ping" : "pop",
          frame: fSnap,
          time: fSnap / fps,
          x: pose.x,
          y: pose.y,
          pan: panAt(pose.x, pose.y, fSnap),
          intensity: 0.85,
          itemIndex: i,
          itemType: item.type,
        });
      }

      if (travelWhoosh && i < slots.length - 1) {
        const nextSlot = slots[i + 1];
        const gap = nextSlot.start - slot.end;
        if (gap > 0) {
          const pNext =
            handAt(nextSlot.start, entries, options) ?? {x: 0, y: 0};
          const panNext = panAt(pNext.x, pNext.y, delay + nextSlot.start);
          const hopDist = Math.hypot(pNext.x - pEnd.x, pNext.y - pEnd.y);
          if (hopDist >= minTravelWhooshDist) {
            cues.push({
              kind: "whooshTravel",
              frame: delay + slot.end,
              time: (delay + slot.end) / fps,
              durationFrames: gap,
              x: pEnd.x,
              y: pEnd.y,
              pan: panEnd,
              panTo: panNext,
              intensity: clamp(0.4 + (hopDist / 1100) * 0.5, 0.4, 0.9),
              itemIndex: i,
              itemType: item.type,
            });
          }
        }
      }
    });

    if (exit > 0 && handWhoosh && !suppressExitWhoosh) {
      const endPose = handAt(lastEnd, entries, options) ?? {x: 0, y: 0};
      const pStart = panAt(endPose.x, endPose.y, delay + lastEnd);
      cues.push({
        kind: "whooshOut",
        frame: delay + lastEnd,
        time: (delay + lastEnd) / fps,
        durationFrames: exit,
        x: endPose.x,
        y: endPose.y,
        pan: pStart,
        panTo: clamp(pStart + 0.35, -1, 1),
        intensity: 0.7,
        itemIndex: items.length - 1,
        itemType: items[items.length - 1].type,
      });
    }
  }

  cues.sort((a, b) => a.frame - b.frame);

  return {
    fps,
    subSteps: steps,
    viewportWidth,
    viewportHeight,
    totalFrames,
    totalSeconds: totalFrames / fps,
    samples,
    cues,
  };
};

/** Looks up the closest motion sample for a given `frame`. */
export const sampleAtFrame = (
  trace: MotionTrace,
  frame: number,
): MotionSample => {
  const idx = clamp(
    Math.round(frame * trace.subSteps),
    0,
    trace.samples.length - 1,
  );
  return trace.samples[idx];
};

export type MultiSceneSpec = {
  items: WhiteboardItem[];
  /** Duration of this board's <TransitionSeries.Sequence> in frames. */
  durationInFrames: number;
  delay?: number;
  enter?: number;
  travel?: number;
  exit?: number;
  lift?: number;
  textSizes?: Record<number, {w: number; h: number}>;
  cameraKeyframes?: CameraKeyframe[];
  cameraDefaultGlide?: number;
  /** Overlapping transition duration (frames) after this board. */
  transitionAfter?: number;
};

export type MultiSceneTraceOptions = {
  scenes: MultiSceneSpec[];
  fps?: number;
  aspect?: AspectRatio;
  preset?: CanvasPresetName;
  viewportWidth?: number;
  viewportHeight?: number;
  subSteps?: number;
  stereoSpread?: number;
  referenceSpeed?: number;
};

/**
 * Extracts one continuous MotionTrace across a multi-board TransitionSeries
 * (ideal for 16:9 YouTube Long videos with multiple boards & transitions).
 */
export const extractMultiSceneTrace = ({
  scenes,
  fps: explicitFps,
  aspect = "16:9",
  preset,
  viewportWidth: explicitVw,
  viewportHeight: explicitVh,
  subSteps = 4,
  stereoSpread = 0.55,
  referenceSpeed,
}: MultiSceneTraceOptions): MotionTrace => {
  const basePreset = preset
    ? CANVAS_PRESETS[preset]
    : presetForAspect(aspect);
  const fps = explicitFps ?? basePreset.fps;
  const viewportWidth = explicitVw ?? basePreset.width;
  const viewportHeight = explicitVh ?? basePreset.height;
  const steps = Math.max(1, Math.round(subSteps));

  const starts: number[] = [];
  let cursor = 0;
  scenes.forEach((sc, i) => {
    starts.push(cursor);
    const overlap = i < scenes.length - 1 ? (sc.transitionAfter ?? 0) : 0;
    cursor += sc.durationInFrames - overlap;
  });

  const totalFrames =
    scenes.length === 0
      ? 1
      : starts[scenes.length - 1] + scenes[scenes.length - 1].durationInFrames;
  const totalSamples = Math.max(2, Math.round(totalFrames * steps) + 1);

  const samples: MotionSample[] = Array.from({length: totalSamples}, (_, k) => ({
    frame: k / steps,
    time: k / steps / fps,
    x: 0,
    y: 0,
    pan: 0,
    speed: 0,
    pxPerSec: 0,
    curvature: 0,
    mode: "idle",
    itemIndex: -1,
    gesture: null,
  }));
  const cues: MotionCue[] = [];

  scenes.forEach((sc, idx) => {
    const startFrame = starts[idx];
    const prevTransition = idx > 0 ? (scenes[idx - 1].transitionAfter ?? 0) : 0;
    const hasTransitionAfter =
      idx < scenes.length - 1 && (sc.transitionAfter ?? 0) > 0;
    const subTrace = extractMotionTrace({
      items: sc.items,
      delay: sc.delay ?? 0,
      enter: sc.enter,
      travel: sc.travel,
      exit: sc.exit,
      lift: sc.lift,
      fps,
      viewportWidth,
      viewportHeight,
      totalFrames: sc.durationInFrames,
      subSteps: steps,
      stereoSpread,
      textSizes: sc.textSizes,
      cameraKeyframes: sc.cameraKeyframes,
      cameraDefaultGlide: sc.cameraDefaultGlide,
      referenceSpeed,
      suppressEnterWhoosh: prevTransition > 0 && (sc.delay ?? 0) < prevTransition,
      suppressExitWhoosh: hasTransitionAfter,
    });

    const offsetIdx = Math.round(startFrame * steps);
    for (let k = 0; k < subTrace.samples.length; k++) {
      const dstIdx = offsetIdx + k;
      if (dstIdx < 0 || dstIdx >= samples.length) continue;
      const src = subTrace.samples[k];
      const cur = samples[dstIdx];
      if (cur.mode === "idle" || src.mode === "draw") {
        samples[dstIdx] = {
          ...src,
          frame: dstIdx / steps,
          time: dstIdx / steps / fps,
        };
      }
    }

    for (const c of subTrace.cues) {
      cues.push({
        ...c,
        frame: c.frame + startFrame,
        time: (c.frame + startFrame) / fps,
      });
    }

    if (idx < scenes.length - 1 && (sc.transitionAfter ?? 0) > 0) {
      const tDur = sc.transitionAfter!;
      const tFrame = startFrame + sc.durationInFrames - tDur;
      cues.push({
        kind: "whooshTransition",
        frame: tFrame,
        time: tFrame / fps,
        durationFrames: tDur,
        x: viewportWidth / 2,
        y: viewportHeight / 2,
        pan: -0.45 * stereoSpread,
        panTo: 0.45 * stereoSpread,
        intensity: 0.88,
        itemIndex: -1,
      });
    }
  });

  cues.sort((a, b) => a.frame - b.frame);

  return {
    fps,
    subSteps: steps,
    viewportWidth,
    viewportHeight,
    totalFrames,
    totalSeconds: totalFrames / fps,
    samples,
    cues,
  };
};

// Re-export unused-warning guard for strokeEase if needed externally
export {strokeEase};
