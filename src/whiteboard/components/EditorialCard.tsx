import React from "react";
import {Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
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

export type YearBadgeProps = {
  label: string;
  backgroundColor?: string;
  textColor?: string;
  style?: React.CSSProperties;
};

/** Pill badge used for years, labels, and status stamps. */
export const YearBadge: React.FC<YearBadgeProps> = ({
  label,
  backgroundColor = EDITORIAL_PALETTE.slate,
  textColor = "#FFFFFF",
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px 22px",
      borderRadius: 999,
      backgroundColor,
      color: textColor,
      fontFamily: EDITORIAL_FONTS.mono,
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.06em",
      border: `2.5px solid ${EDITORIAL_PALETTE.ink}`,
      boxShadow: `0 4px 0 ${EDITORIAL_PALETTE.ink}`,
      ...style,
    }}
  >
    {label}
  </div>
);

export type EditorialCardProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  delay?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  padding?: number | string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

/** Clean editorial paper card with dark ink outline and subtle offset shadow. */
export const EditorialCard: React.FC<EditorialCardProps> = ({
  x,
  y,
  width,
  height,
  delay = 0,
  backgroundColor = EDITORIAL_PALETTE.paperCard,
  borderColor = EDITORIAL_PALETTE.ink,
  borderRadius = 28,
  padding = 32,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = springPop(frame, fps, delay);
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(pop, [0, 1], [28, 0]);
  const scale = interpolate(pop, [0, 1], [0.95, 1]);

  if (frame < delay) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        boxSizing: "border-box",
        backgroundColor,
        borderRadius,
        border: `3.5px solid ${borderColor}`,
        boxShadow: `0 10px 0 ${EDITORIAL_PALETTE.shadow}, 0 22px 44px rgba(34, 34, 34, 0.08)`,
        padding,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: "center center",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export type CharacterSpriteProps = {
  src: string;
  x: number;
  y: number;
  height: number;
  /** Aspect ratio width/height; defaults to 640/1024 for normalized Dana sprites. */
  aspectRatio?: number;
  delay?: number;
  /** Subtle breathing amplitude (0 disables). Default 0.012. */
  breathe?: number;
  opacity?: number;
  style?: React.CSSProperties;
};

/** Renders a normalized character PNG with bottom-anchored breathing motion. */
export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  src,
  x,
  y,
  height,
  aspectRatio = 640 / 1024,
  delay = 0,
  breathe = 0.012,
  opacity = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const width = Math.round(height * aspectRatio);

  const pop = springPop(frame, fps, delay, {damping: 14, stiffness: 155});
  const enterOpacity = interpolate(frame - delay, [0, 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enterY = interpolate(pop, [0, 1], [34, 0]);
  const scalePop = interpolate(pop, [0, 1], [0.92, 1]);
  const idleY = breathe > 0 ? Math.sin((frame - delay) * 0.08) * breathe : 0;

  if (frame < delay) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        opacity: enterOpacity * opacity,
        transform: `translateY(${enterY}px) scale(${scalePop}, ${scalePop * (1 + idleY)})`,
        transformOrigin: "50% 96%",
        pointerEvents: "none",
        ...style,
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
};
