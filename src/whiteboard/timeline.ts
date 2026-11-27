import {reveal, type RevealMode} from "./path";

/**
 * Pure timeline maths for a scene with ONE hand that visits every element:
 *
 *   slide in -> draw item 1 -> travel -> draw item 2 -> travel -> ... -> slide out
 *
 * No React in here. Frames are "local": 0 = the moment the hand starts to slide in.
 */

export type Box = {x: number; y: number; w: number; h: number};

export type TimelineEntry =
  | {
      kind?: "reveal";
      /** Frames the pen spends drawing this item. */
      duration: number;
      /** Where the item sits in the scene, in px. */
      box: Box;
      mode: RevealMode;
      bands: number;
      scribbles: number;
      linear: boolean;
    }
  | {
      kind: "path";
      /** Frames the pen spends drawing this item. */
      duration: number;
      /** Pen-tip position in scene px for linear progress 0..1. */
      penAt: (progress: number) => {x: number; y: number};
    };

export type TimelineOptions = {
  /** Frames for the hand to slide in before the first item. */
  enter: number;
  /** Frames to move the hand from one item to the next. */
  travel: number;
  /** Frames for the hand to slide out after the last item. */
  exit: number;
  /** How high the pen lifts (px) while travelling. */
  lift: number;
  /** Offset (px) of the "off-screen" resting spot relative to the pen tip. */
  away: {x: number; y: number};
};

export type HandPose = {
  /** Pen-tip position in scene px. */
  x: number;
  y: number;
  /** Tilt in degrees. */
  rotate: number;
};

export const DEFAULT_AWAY = {x: 340, y: 460};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** When each item starts and ends drawing. Does not depend on any measured size. */
export const buildSlots = (
  durations: number[],
  {enter, travel}: Pick<TimelineOptions, "enter" | "travel">,
) => {
  const slots: Array<{start: number; end: number}> = [];
  let cursor = enter;
  durations.forEach((d, i) => {
    const start = i === 0 ? enter : cursor + travel;
    const end = start + d;
    slots.push({start, end});
    cursor = end;
  });
  return {slots, lastEnd: cursor};
};

/** Total frames of the scene, from the hand sliding in to it being gone. */
export const timelineFrames = (
  durations: number[],
  options: Pick<TimelineOptions, "enter" | "travel" | "exit">,
) => buildSlots(durations, options).lastEnd + options.exit;

const penAt = (entry: TimelineEntry, progress: number) => {
  if (entry.kind === "path") {
    return entry.penAt(clamp01(progress));
  }
  const {box} = entry;
  const s = reveal(entry.mode, progress, box.w, box.h, entry.bands, entry.scribbles, {
    unit: "px",
    linear: entry.linear,
  });
  return {x: box.x + s.penX, y: box.y + s.penY};
};

/** Draw progress (0..1) of item `i` at local frame `f`. */
export const progressAt = (
  f: number,
  slot: {start: number; end: number},
): number => (slot.end > slot.start ? clamp01((f - slot.start) / (slot.end - slot.start)) : 1);

/** Where the hand is at local frame `f`, or null when it is not on screen at all. */
export const handAt = (
  f: number,
  entries: TimelineEntry[],
  options: TimelineOptions,
): HandPose | null => {
  if (entries.length === 0) return null;

  const {slots, lastEnd} = buildSlots(
    entries.map((e) => e.duration),
    options,
  );
  const total = lastEnd + options.exit;
  if (f < 0 || f > total) return null;

  // 1. sliding in to the first item
  if (f < slots[0].start) {
    const t = options.enter > 0 ? clamp01(f / options.enter) : 1;
    const away = 1 - easeOutCubic(t);
    const p = penAt(entries[0], 0);
    return {x: p.x + away * options.away.x, y: p.y + away * options.away.y, rotate: 0};
  }

  for (let i = 0; i < entries.length; i++) {
    const {start, end} = slots[i];

    // 2. drawing item i
    if (f >= start && f <= end) {
      const p = penAt(entries[i], progressAt(f, slots[i]));
      return {x: p.x, y: p.y, rotate: Math.sin(f * 0.45) * 1.6};
    }

    // 3. travelling from item i to item i + 1
    if (i < entries.length - 1 && f > end && f < slots[i + 1].start) {
      const t = (f - end) / (slots[i + 1].start - end);
      const e = easeInOutCubic(t);
      const a = penAt(entries[i], 1);
      const b = penAt(entries[i + 1], 0);
      return {
        x: a.x + (b.x - a.x) * e,
        y: a.y + (b.y - a.y) * e - Math.sin(Math.PI * e) * options.lift,
        rotate: 0,
      };
    }
  }

  // 4. sliding out after the last item
  const t = options.exit > 0 ? clamp01((f - lastEnd) / options.exit) : 1;
  const away = easeInCubic(t);
  const p = penAt(entries[entries.length - 1], 1);
  return {x: p.x + away * options.away.x, y: p.y + away * options.away.y, rotate: 0};
};
