import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {HandPen, type HandPenProps} from "./HandPen";

export type RoundedFrameProps = {
  /** Top-left of the frame inside the parent, in px. The element is position: absolute. */
  x?: number;
  y?: number;
  /** Outer size of the frame in px. */
  width: number;
  height: number;
  /** Corner radius in px. Default 70. */
  radius?: number;
  /** Ink colour. Default red. */
  color?: string;
  /** Line thickness in px. Default 14. */
  strokeWidth?: number;
  /** Optional fill inside the frame, e.g. "#fff5f5". Default none. */
  fill?: string;

  /** Frames to wait before the hand starts coming in. Default 0. */
  delay?: number;
  /** Frames the pen spends drawing the frame. Default 40. */
  duration?: number;
  /** Frames the hand takes to slide in / out. Default 8 / 10. */
  handEnter?: number;
  handExit?: number;

  /**
   * How far past the start the line runs when it closes, in px. Gives the
   * slightly sloppy hand-drawn closure instead of a perfect loop. Default 36.
   */
  overshoot?: number;
  /** Set false to draw the frame without the hand. Default true. */
  showHand?: boolean;
  /** Hand size, tip and image overrides. Default scale is 0.6. */
  hand?: Pick<HandPenProps, "scale" | "src" | "tip" | "size">;

  style?: React.CSSProperties;
};

/** Total frames a RoundedFrame occupies (delay not included). Handy for sequencing. */
export const roundedFrameDuration = ({
  duration = 40,
  handEnter = 8,
  handExit = 10,
}: Pick<RoundedFrameProps, "duration" | "handEnter" | "handExit"> = {}) =>
  handEnter + duration + handExit;

export type Segment =
  | {kind: "line"; x0: number; y0: number; x1: number; y1: number; len: number}
  | {kind: "arc"; cx: number; cy: number; r: number; a0: number; len: number};

/**
 * The outline as a list of segments, drawn clockwise from the middle of the
 * top edge's left end: along the top, round each corner, back to the start,
 * then a short overshoot past the start.
 * The stroke is inset by half its width, so the OUTER edge matches width x height.
 */
const buildSegments = (
  w: number,
  h: number,
  r: number,
  overshoot: number,
): Segment[] => {
  const line = (x0: number, y0: number, x1: number, y1: number): Segment => ({
    kind: "line",
    x0,
    y0,
    x1,
    y1,
    len: Math.hypot(x1 - x0, y1 - y0),
  });
  const arc = (cx: number, cy: number, a0: number): Segment => ({
    kind: "arc",
    cx,
    cy,
    r,
    a0,
    len: (Math.PI / 2) * r,
  });
  const P = Math.PI;
  return [
    line(r, 0, w - r, 0),
    arc(w - r, r, -P / 2),
    line(w, r, w, h - r),
    arc(w - r, h - r, 0),
    line(w - r, h, r, h),
    arc(r, h - r, P / 2),
    line(0, h - r, 0, r),
    arc(r, r, P),
    // closing: back along the top edge, a little past the start, slightly off the line
    line(r, 0, r + overshoot, -Math.min(5, overshoot * 0.15)),
  ];
};

/** The SVG path `d` for the segments above. */
const toPath = (segs: Segment[], r: number): string => {
  const f = (n: number) => Math.round(n * 100) / 100;
  let d = `M ${f(segs[0].kind === "line" ? segs[0].x0 : 0)} ${f(segs[0].kind === "line" ? segs[0].y0 : 0)}`;
  for (const s of segs) {
    if (s.kind === "line") d += ` L ${f(s.x1)} ${f(s.y1)}`;
    else {
      const a1 = s.a0 + Math.PI / 2;
      d += ` A ${f(r)} ${f(r)} 0 0 1 ${f(s.cx + r * Math.cos(a1))} ${f(s.cy + r * Math.sin(a1))}`;
    }
  }
  return d;
};

/** Point at distance `dist` along the outline (clamped to its ends). */
export const pointOnFrame = (
  segs: Segment[],
  dist: number,
): {x: number; y: number} => {
  let left = Math.max(0, dist);
  for (const s of segs) {
    if (left <= s.len || s === segs[segs.length - 1]) {
      const t = s.len > 0 ? Math.min(1, left / s.len) : 1;
      if (s.kind === "line") {
        return {x: s.x0 + (s.x1 - s.x0) * t, y: s.y0 + (s.y1 - s.y0) * t};
      }
      const a = s.a0 + (Math.PI / 2) * t;
      return {x: s.cx + s.r * Math.cos(a), y: s.cy + s.r * Math.sin(a)};
    }
    left -= s.len;
  }
  return {x: 0, y: 0};
};

export const frameGeometry = (
  width: number,
  height: number,
  radius: number,
  strokeWidth: number,
  overshoot: number,
) => {
  // inset by half the stroke so the outer edge is exactly width x height
  const w = width - strokeWidth;
  const h = height - strokeWidth;
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const segs = buildSegments(w, h, r, overshoot);
  const length = segs.reduce((n, s) => n + s.len, 0);
  return {segs, length, d: toPath(segs, r), inset: strokeWidth / 2};
};

export const FRAME_DEFAULTS = {
  radius: 70,
  color: "#d62828",
  strokeWidth: 14,
  duration: 40,
  overshoot: 36,
} as const;

export const RoundedFrameSvg: React.FC<{
  width: number;
  height: number;
  d: string;
  inset: number;
  length: number;
  progress: number;
  color: string;
  strokeWidth: number;
  fill?: string;
}> = ({width, height, d, inset, length, progress, color, strokeWidth, fill}) => (
  <svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}
  >
    <g transform={`translate(${inset} ${inset})`}>
      {fill && progress > 0.8 ? (
        <path
          d={d}
          fill={fill}
          stroke="none"
          opacity={Math.min(1, Math.max(0, (progress - 0.8) / 0.2))}
        />
      ) : null}
      {progress > 0 ? (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - progress)}
        />
      ) : null}
    </g>
  </svg>
);

export const RoundedFrame: React.FC<RoundedFrameProps> = ({
  x = 0,
  y = 0,
  width,
  height,
  radius = FRAME_DEFAULTS.radius,
  color = FRAME_DEFAULTS.color,
  strokeWidth = FRAME_DEFAULTS.strokeWidth,
  fill,
  delay = 0,
  duration = FRAME_DEFAULTS.duration,
  handEnter = 8,
  handExit = 10,
  overshoot = FRAME_DEFAULTS.overshoot,
  showHand = true,
  hand,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay; // local frame, 0 = the hand starts to come in

  const drawStart = handEnter;
  const drawEnd = handEnter + duration;
  const total = drawEnd + handExit;

  const {segs, length, d, inset} = frameGeometry(
    width,
    height,
    radius,
    strokeWidth,
    overshoot,
  );

  const progress = interpolate(f, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  const pen = pointOnFrame(segs, progress * length);

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
      <RoundedFrameSvg
        width={width}
        height={height}
        d={d}
        inset={inset}
        length={length}
        progress={progress}
        color={color}
        strokeWidth={strokeWidth}
        fill={fill}
      />
      {handVisible ? (
        <HandPen
          tipX={pen.x + inset}
          tipY={pen.y + inset}
          rotate={tilt}
          offsetX={away * 340}
          offsetY={away * 460}
          scale={0.6}
          {...hand}
        />
      ) : null}
    </div>
  );
};
