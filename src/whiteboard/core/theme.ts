/**
 * Theme tokens and timing helpers shared by every category: palette, fonts, ms->frames,
 * progress, beat fade envelope, spring pop. Lives in core so data/ and illustration/ can use it
 * without depending on layout/.
 */
import {Easing, interpolate, spring} from "remotion";
import {loadFont as loadInter} from "@remotion/google-fonts/Inter";
import {loadFont as loadManrope} from "@remotion/google-fonts/Manrope";
import {loadFont as loadPlex} from "@remotion/google-fonts/IBMPlexMono";

/** Warm editorial palette derived from `public/assets/reference-imgs/`. */
export const EDITORIAL_PALETTE = {
  paper: "#FAF3E3",
  paperCard: "#FFFDF7",
  paperAlt: "#F2E6CC",
  ink: "#222222",
  mutedInk: "#5C574D",
  sage: "#6E9B77",
  sageDark: "#3F7A54",
  terracotta: "#D26B4A",
  crimson: "#B83B3B",
  mustard: "#E3AE45",
  slate: "#56728C",
  border: "rgba(34, 34, 34, 0.16)",
  shadow: "rgba(34, 34, 34, 0.10)",
} as const;

export const EDITORIAL_FONTS = {
  head: loadManrope("normal", {weights: ["700", "800"], subsets: ["latin"]}).fontFamily,
  body: loadInter("normal", {weights: ["500", "600", "700"], subsets: ["latin"]}).fontFamily,
  mono: loadPlex("normal", {weights: ["600", "700"], subsets: ["latin"]}).fontFamily,
};

/** Converts milliseconds to integer frames at the given FPS. */
export const msToFrames = (ms: number, fps: number): number => Math.round((ms * fps) / 1000);

/** Clamped 0..1 progress helper with cubic-out default easing. */
export const progressBetween = (
  frame: number,
  startFrame: number,
  durationFrames: number,
  easing: (t: number) => number = Easing.out(Easing.cubic),
): number =>
  interpolate(frame, [startFrame, startFrame + Math.max(1, durationFrames)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Smooth fade-in and fade-out opacity envelope for a local sequence. */
export const beatEnvelope = (
  localFrame: number,
  totalFrames: number,
  fadeInFrames = 10,
  fadeOutFrames = 12,
): number => {
  const enter = interpolate(localFrame, [0, Math.max(1, fadeInFrames)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const exit = interpolate(
    localFrame,
    [Math.max(0, totalFrames - fadeOutFrames), totalFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    },
  );
  return Math.min(enter, exit);
};

/** Snappy editorial spring pop (0 -> 1) starting at `delay` frames. */
export const springPop = (
  frame: number,
  fps: number,
  delay = 0,
  config: {damping?: number; stiffness?: number; mass?: number} = {},
): number =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {
      damping: config.damping ?? 15,
      stiffness: config.stiffness ?? 170,
      mass: config.mass ?? 0.8,
    },
  });
