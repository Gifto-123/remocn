import {Easing} from "remotion";

/**
 * Pure maths for the "hand draws it" reveal.
 * No React in here, so it is easy to reuse and to test.
 *
 * Coordinates are inside the revealed box: (0,0) is its top-left corner.
 * Pass w = h = 100 with unit "%" to work in percentages of an auto-sized box
 * (this is how text is revealed without measuring it).
 */

export type RevealMode =
  /** Pen sweeps left-right, right-left, ... down the picture (good for characters, objects). */
  | "serpentine"
  /** One left-to-right pass (good for words, labels, lines). */
  | "sweep";

export type RevealState = {
  /** Where the pen tip is, in `unit`. */
  penX: number;
  penY: number;
  /** CSS clip-path for the part of the box that has been drawn so far. */
  clipPath: string;
};

export type RevealOptions = {
  /** Unit written into the clip-path polygon. Default "px". */
  unit?: "px" | "%";
  /** sweep only: constant pen speed instead of easing in and out. Default false. */
  linear?: boolean;
};

const ease = Easing.inOut(Easing.sin);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const smoothstep = (t: number, a: number, b: number) => {
  const s = clamp01((t - a) / (b - a));
  return s * s * (3 - 2 * s);
};

const r = (n: number) => Math.round(n * 100) / 100;

const polygon = (points: Array<[number, number]>, unit: string) =>
  `polygon(${points.map(([x, y]) => `${r(x)}${unit} ${r(y)}${unit}`).join(", ")})`;

const fullRect = (w: number, h: number, unit: string) =>
  polygon(
    [
      [0, 0],
      [w, 0],
      [w, h],
      [0, h],
    ],
    unit,
  );

export const serpentine = (
  progress: number,
  w: number,
  h: number,
  bands: number,
  scribbles: number,
  {unit = "px"}: RevealOptions = {},
): RevealState => {
  const p = clamp01(progress);
  const n = Math.max(1, Math.round(bands));
  const bandH = h / n;

  const u = p * n;
  const i = Math.min(Math.floor(u), n - 1);
  const t = u - i; // 0..1 inside the current band

  const leftToRight = i % 2 === 0;
  const te = ease(t);
  const edgeX = leftToRight ? te * w : (1 - te) * w;

  const top = i * bandH;
  const bottom = top + bandH;

  // The pen scribbles up and down inside the band, then drops to the next one.
  const wobble =
    Math.sin(t * Math.PI * 2 * scribbles) * Math.sin(Math.PI * t) * bandH * 0.45;
  const drop = i < n - 1 ? smoothstep(t, 0.88, 1) * bandH : 0;
  const penY = top + bandH / 2 + wobble + drop;

  let clipPath: string;
  if (p >= 1) {
    clipPath = fullRect(w, h, unit);
  } else if (leftToRight) {
    clipPath = polygon(
      [
        [0, 0],
        [w, 0],
        [w, top],
        [edgeX, top],
        [edgeX, bottom],
        [0, bottom],
      ],
      unit,
    );
  } else {
    clipPath = polygon(
      [
        [0, 0],
        [w, 0],
        [w, bottom],
        [edgeX, bottom],
        [edgeX, top],
        [0, top],
      ],
      unit,
    );
  }

  return {penX: edgeX, penY, clipPath};
};

export const sweep = (
  progress: number,
  w: number,
  h: number,
  scribbles: number,
  {unit = "px", linear = false}: RevealOptions = {},
): RevealState => {
  const p = clamp01(progress);
  const edgeX = (linear ? p : ease(p)) * w;
  const penY = h / 2 + Math.sin(p * Math.PI * 2 * scribbles) * h * 0.3;

  const clipPath =
    p >= 1
      ? fullRect(w, h, unit)
      : polygon(
          [
            [0, 0],
            [edgeX, 0],
            [edgeX, h],
            [0, h],
          ],
          unit,
        );

  return {penX: edgeX, penY, clipPath};
};

export const reveal = (
  mode: RevealMode,
  progress: number,
  w: number,
  h: number,
  bands: number,
  scribbles: number,
  options: RevealOptions = {},
): RevealState =>
  mode === "sweep"
    ? sweep(progress, w, h, scribbles, options)
    : serpentine(progress, w, h, bands, scribbles, options);

const emptyRect = (unit: string) =>
  polygon(
    [
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    unit,
  );

/** Complementary clip-path that erases the box as `progress` goes 0 -> 1. */
export const eraseReveal = (
  mode: RevealMode,
  progress: number,
  w: number,
  h: number,
  bands: number,
  scribbles: number,
  {unit = "px", linear = false}: RevealOptions = {},
): RevealState => {
  const p = clamp01(progress);
  if (mode === "sweep") {
    const s = sweep(p, w, h, scribbles, {unit, linear});
    const clipPath =
      p <= 0
        ? fullRect(w, h, unit)
        : p >= 1
          ? emptyRect(unit)
          : polygon(
              [
                [s.penX, 0],
                [w, 0],
                [w, h],
                [s.penX, h],
              ],
              unit,
            );
    return {penX: s.penX, penY: s.penY, clipPath};
  }

  const n = Math.max(1, Math.round(bands));
  const bandH = h / n;
  const u = p * n;
  const i = Math.min(Math.floor(u), n - 1);
  const t = u - i;
  const leftToRight = i % 2 === 0;
  const te = ease(t);
  const edgeX = leftToRight ? te * w : (1 - te) * w;
  const top = i * bandH;
  const bottom = top + bandH;

  const wobble =
    Math.sin(t * Math.PI * 2 * scribbles) * Math.sin(Math.PI * t) * bandH * 0.45;
  const drop = i < n - 1 ? smoothstep(t, 0.88, 1) * bandH : 0;
  const penY = top + bandH / 2 + wobble + drop;

  let clipPath: string;
  if (p <= 0) {
    clipPath = fullRect(w, h, unit);
  } else if (p >= 1) {
    clipPath = emptyRect(unit);
  } else if (leftToRight) {
    clipPath = polygon(
      [
        [edgeX, top],
        [w, top],
        [w, h],
        [0, h],
        [0, bottom],
        [edgeX, bottom],
      ],
      unit,
    );
  } else {
    clipPath = polygon(
      [
        [0, top],
        [edgeX, top],
        [edgeX, bottom],
        [w, bottom],
        [w, h],
        [0, h],
      ],
      unit,
    );
  }

  return {penX: edgeX, penY, clipPath};
};
