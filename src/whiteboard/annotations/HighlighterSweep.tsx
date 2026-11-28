import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {HandPen, type HandPenProps} from "../core/HandPen";
import {DEFAULT_AWAY} from "../core/timeline";

export type HighlighterSweepProps = {
  /** Top-left position of the highlight strip inside the parent, in px. */
  x?: number;
  y?: number;
  /** Width and height of the highlight strip in px. */
  width: number;
  height?: number;

  /** Marker ink colour. Default warm highlighter yellow. */
  color?: string;
  /** Ink opacity (0..1). Default 0.78. */
  opacity?: number;
  /** CSS blend mode so text underneath stays crisp even if placed earlier in JSX. Default "multiply". */
  blendMode?: React.CSSProperties["mixBlendMode"];
  /** Slight hand slant of the whole strip in degrees. Default -1.2. */
  angle?: number;
  /** Chisel-tip slant in px between top and bottom edges. Default 14. */
  slant?: number;
  /** 1 = single left-to-right pass, 2 = back-and-forth double highlight. Default 1. */
  passes?: 1 | 2;

  /** Frames to wait before the hand starts coming in. Default 0. */
  delay?: number;
  /** Frames the pen spends highlighting. Default: ~26 px/frame (min 14, doubled for 2 passes). */
  duration?: number;
  handEnter?: number;
  handExit?: number;
  showHand?: boolean;
  hand?: Pick<HandPenProps, "scale" | "src" | "tip" | "size">;

  style?: React.CSSProperties;
};

export const HIGHLIGHT_DEFAULTS = {
  height: 86,
  color: "#ffe44d",
  opacity: 0.78,
  blendMode: "multiply" as React.CSSProperties["mixBlendMode"],
  angle: -1.2,
  slant: 14,
  passes: 1 as 1 | 2,
  handEnter: 8,
  handExit: 10,
};

/** Default highlight draw frames for a strip of `width` px and `passes`. */
export const highlighterFrames = (width: number, passes: 1 | 2 = 1) =>
  Math.max(14, Math.round((width * passes) / 26));

/** Total frames a HighlighterSweep occupies (delay not included). */
export const highlighterDuration = ({
  width,
  passes = HIGHLIGHT_DEFAULTS.passes,
  duration,
  handEnter = HIGHLIGHT_DEFAULTS.handEnter,
  handExit = HIGHLIGHT_DEFAULTS.handExit,
}: Pick<
  HighlighterSweepProps,
  "width" | "passes" | "duration" | "handEnter" | "handExit"
>) => handEnter + (duration ?? highlighterFrames(width, passes)) + handExit;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ease = Easing.inOut(Easing.sin);
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Builds an organic wavy chisel-tip ribbon path inside 0..width x 0..height.
 */
export const highlightRibbonPath = (
  width: number,
  height: number,
  slant: number,
  seed = 0,
): string => {
  const s = Math.min(Math.max(0, slant), width * 0.45);
  const steps = Math.max(12, Math.round(width / 22));
  const amp = Math.min(4, height * 0.05);

  const topPts: Array<[number, number]> = [];
  const botPts: Array<[number, number]> = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const xTop = s + t * (width - s);
    const xBot = t * (width - s);
    const waveTop =
      Math.sin(t * Math.PI * 3.2 + seed) * amp * 0.65 +
      Math.sin(t * Math.PI * 7.1 + seed * 1.7) * amp * 0.35;
    const waveBot =
      Math.sin(t * Math.PI * 2.8 + seed + 1.4) * amp * 0.65 +
      Math.sin(t * Math.PI * 6.5 + seed * 2.1) * amp * 0.35;

    topPts.push([xTop, amp + waveTop]);
    botPts.push([xBot, height - amp + waveBot]);
  }

  const all = [...topPts, ...botPts.reverse()];
  return (
    `M ${r2(all[0][0])} ${r2(all[0][1])} ` +
    all
      .slice(1)
      .map(([px, py]) => `L ${r2(px)} ${r2(py)}`)
      .join(" ") +
    " Z"
  );
};

/**
 * Pen-tip position in local (0..width, 0..height) coordinates for linear progress 0..1.
 */
export const highlightPenLocal = (
  width: number,
  height: number,
  slant: number,
  passes: 1 | 2,
  progress: number,
): {x: number; y: number} => {
  const p = clamp01(progress);
  const s = Math.min(Math.max(0, slant), width * 0.45);
  const span = width - s;

  if (passes === 1) {
    const e = ease(p);
    return {
      x: s * 0.5 + e * span,
      y: height * 0.52 + Math.sin(e * Math.PI * 2) * 2.5,
    };
  }

  // Pass 1: left -> right (0..0.52), Pass 2: right -> left (0.52..1)
  const split = 0.52;
  if (p <= split) {
    const e = ease(p / split);
    return {
      x: s * 0.5 + e * span,
      y: height * 0.48 + Math.sin(e * Math.PI * 2) * 2,
    };
  }
  const e = ease((p - split) / (1 - split));
  return {
    x: s * 0.5 + (1 - e) * span,
    y: height * 0.56 - Math.sin(e * Math.PI * 2) * 2,
  };
};

/** Rotates a local offset around the strip center for matching `angle` tilt. */
export const highlightPenAt = (
  x: number,
  y: number,
  width: number,
  height: number,
  slant: number,
  angle: number,
  passes: 1 | 2,
  progress: number,
): {x: number; y: number} => {
  const local = highlightPenLocal(width, height, slant, passes, progress);
  const rad = (angle * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const dx = local.x - cx;
  const dy = local.y - cy;
  return {
    x: x + cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: y + cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  };
};

const chiselClipLeftToRight = (
  eased: number,
  width: number,
  height: number,
  slant: number,
) => {
  if (eased <= 0) return "polygon(0px 0px, 0px 0px, 0px 0px)";
  if (eased >= 1) return undefined;
  const s = Math.min(Math.max(0, slant), width * 0.45);
  const topX = s + eased * (width - s);
  const botX = eased * (width - s);
  return `polygon(0px 0px, ${r2(topX)}px 0px, ${r2(botX)}px ${r2(height)}px, 0px ${r2(height)}px)`;
};

const chiselClipRightToLeft = (
  eased: number,
  width: number,
  height: number,
  slant: number,
) => {
  if (eased <= 0) return "polygon(0px 0px, 0px 0px, 0px 0px)";
  if (eased >= 1) return undefined;
  const s = Math.min(Math.max(0, slant), width * 0.45);
  const topX = width - eased * (width - s);
  const botX = width - s - eased * (width - s);
  return `polygon(${r2(topX)}px 0px, ${r2(width)}px 0px, ${r2(width)}px ${r2(height)}px, ${r2(botX)}px ${r2(height)}px)`;
};

/** Pure SVG highlighter strip shared by HighlighterSweep and Whiteboard. */
export const HighlighterGraphic: React.FC<{
  width: number;
  height: number;
  color: string;
  opacity: number;
  blendMode: React.CSSProperties["mixBlendMode"];
  angle: number;
  slant: number;
  passes: 1 | 2;
  progress: number;
}> = ({
  width,
  height,
  color,
  opacity,
  blendMode,
  angle,
  slant,
  passes,
  progress,
}) => {
  const p = clamp01(progress);
  if (p <= 0) return null;

  const d1 = highlightRibbonPath(width, height, slant, 0);
  const split = 0.52;
  const p1 = passes === 1 ? ease(p) : ease(clamp01(p / split));
  const p2 = passes === 2 && p > split ? ease(clamp01((p - split) / (1 - split))) : 0;

  const clip1 = chiselClipLeftToRight(p1, width, height, slant);
  const d2 = passes === 2 ? highlightRibbonPath(width, height, slant, 2.3) : "";
  const clip2 = passes === 2 ? chiselClipRightToLeft(p2, width, height, slant) : undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "center center",
        mixBlendMode: blendMode,
        pointerEvents: "none",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          overflow: "visible",
          clipPath: clip1,
        }}
      >
        <path
          d={d1}
          fill={color}
          opacity={passes === 2 ? opacity * 0.68 : opacity}
        />
      </svg>
      {passes === 2 && p2 > 0 ? (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{
            position: "absolute",
            left: 0,
            top: Math.round(height * 0.06),
            overflow: "visible",
            clipPath: clip2,
          }}
        >
          <path d={d2} fill={color} opacity={opacity * 0.52} />
        </svg>
      ) : null}
    </div>
  );
};

/**
 * A chisel-tip highlighter sweep that draws behind or across text/numbers
 * with an organic slightly angled edge.
 */
export const HighlighterSweep: React.FC<HighlighterSweepProps> = ({
  x = 0,
  y = 0,
  width,
  height = HIGHLIGHT_DEFAULTS.height,
  color = HIGHLIGHT_DEFAULTS.color,
  opacity = HIGHLIGHT_DEFAULTS.opacity,
  blendMode = HIGHLIGHT_DEFAULTS.blendMode,
  angle = HIGHLIGHT_DEFAULTS.angle,
  slant = HIGHLIGHT_DEFAULTS.slant,
  passes = HIGHLIGHT_DEFAULTS.passes,
  delay = 0,
  duration,
  handEnter = HIGHLIGHT_DEFAULTS.handEnter,
  handExit = HIGHLIGHT_DEFAULTS.handExit,
  showHand = true,
  hand,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  const drawFrames = duration ?? highlighterFrames(width, passes);
  const drawStart = handEnter;
  const drawEnd = handEnter + drawFrames;
  const total = drawEnd + handExit;

  const progress = interpolate(f, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pen = highlightPenAt(0, 0, width, height, slant, angle, passes, progress);

  const slideIn = interpolate(f, [0, handEnter], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const slideOut = interpolate(f, [drawEnd, total], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const away = slideIn + slideOut;

  const drawing = f >= drawStart && f <= drawEnd;
  const tilt = drawing ? Math.sin(f * 0.45) * 1.6 : 0;
  const handVisible = showHand && f >= 0 && f <= total;

  return (
    <div style={{position: "absolute", left: x, top: y, width, height, ...style}}>
      <HighlighterGraphic
        width={width}
        height={height}
        color={color}
        opacity={opacity}
        blendMode={blendMode}
        angle={angle}
        slant={slant}
        passes={passes}
        progress={progress}
      />
      {handVisible ? (
        <HandPen
          tipX={pen.x}
          tipY={pen.y}
          rotate={tilt}
          offsetX={away * DEFAULT_AWAY.x}
          offsetY={away * DEFAULT_AWAY.y}
          scale={0.6}
          {...hand}
        />
      ) : null}
    </div>
  );
};
