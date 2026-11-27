import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {
  StrokesSvg,
  annotationFrames,
  penAlongStrokes,
  polylineLength,
  type Point,
  type Stroke,
} from "./Annotations";
import {HandPen, type HandPenProps} from "./HandPen";
import {DEFAULT_AWAY} from "./timeline";

export type BubbleTailSide = "bottom" | "top" | "left" | "right";
export type BubbleVariant = "speech" | "thought";
export type BubbleDot = {cx: number; cy: number; r: number};
export type BubbleGeometry = {
  fillPath: string;
  strokes: Stroke[];
  dots?: BubbleDot[];
};

export type SpeechBubbleProps = {
  /** Top-left of the bubble body inside the parent, in px. */
  x?: number;
  y?: number;
  /** Size of the bubble body in px (tail extends outside). */
  width: number;
  height: number;

  /** Corner radius in px (speech bubble). Default 48. */
  radius?: number;
  /** Which edge the tail/dots point out from. Default "bottom". */
  tailSide?: BubbleTailSide;
  /** Position of the tail along that edge (0..1). Default 0.28. */
  tailOffset?: number;
  /** How far the tail tip extends out from the edge, in px. Default 64. */
  tailLength?: number;
  /** Width of the tail base along the edge, in px. Default 54. */
  tailSpread?: number;
  /** Horizontal/vertical lean of the tail tip in px. Default -24. */
  tailLean?: number;
  /** Slight hand-drawn overshoot past the start point, in px. Default 22. */
  overshoot?: number;

  /** Ink colour. Default "#111111". */
  color?: string;
  /** Line thickness in px. Default 10. */
  strokeWidth?: number;
  /** Optional interior fill (e.g. "#ffffff" or "#fff9db"). Default "#ffffff". */
  fill?: string;
  /** Optional static/animated content rendered inside the bubble body. */
  children?: React.ReactNode;

  delay?: number;
  duration?: number;
  handEnter?: number;
  handExit?: number;
  showHand?: boolean;
  hand?: Pick<HandPenProps, "scale" | "src" | "tip" | "size">;

  style?: React.CSSProperties;
};

export type ThoughtBubbleProps = Omit<
  SpeechBubbleProps,
  "radius" | "tailSpread" | "overshoot"
> & {
  /** Depth of the cloud scallops in px. Default 18. */
  puffDepth?: number;
};

export const BUBBLE_DEFAULTS = {
  radius: 48,
  tailSide: "bottom" as BubbleTailSide,
  tailOffset: 0.28,
  tailLength: 64,
  tailSpread: 54,
  tailLean: -24,
  overshoot: 22,
  puffDepth: 18,
  color: "#111111",
  strokeWidth: 10,
  fill: "#ffffff",
  handEnter: 8,
  handExit: 10,
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
const r2 = (n: number) => Math.round(n * 100) / 100;
const ease = Easing.inOut(Easing.sin);

const sampleLine = (a: Point, b: Point, steps = 10): Point[] => {
  const pts: Point[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    pts.push({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
  }
  return pts;
};

const sampleArc = (
  cx: number,
  cy: number,
  rad: number,
  a0: number,
  steps = 10,
): Point[] => {
  const pts: Point[] = [];
  for (let i = 1; i <= steps; i++) {
    const a = a0 + (Math.PI / 2) * (i / steps);
    pts.push({x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a)});
  }
  return pts;
};

/**
 * Builds local (0..width, 0..height) speech bubble outline + closed fill path.
 */
export const buildSpeechBubbleGeometry = ({
  width,
  height,
  radius = BUBBLE_DEFAULTS.radius,
  tailSide = BUBBLE_DEFAULTS.tailSide,
  tailOffset = BUBBLE_DEFAULTS.tailOffset,
  tailLength = BUBBLE_DEFAULTS.tailLength,
  tailSpread = BUBBLE_DEFAULTS.tailSpread,
  tailLean = BUBBLE_DEFAULTS.tailLean,
  overshoot = BUBBLE_DEFAULTS.overshoot,
  strokeWidth = BUBBLE_DEFAULTS.strokeWidth,
}: {
  width: number;
  height: number;
  radius?: number;
  tailSide?: BubbleTailSide;
  tailOffset?: number;
  tailLength?: number;
  tailSpread?: number;
  tailLean?: number;
  overshoot?: number;
  strokeWidth?: number;
}) => {
  const inset = strokeWidth / 2;
  const w = Math.max(40, width - strokeWidth);
  const h = Math.max(40, height - strokeWidth);
  const r = clamp(radius, 0, Math.min(w / 2 - 4, h / 2 - 4));

  const ox = (px: number) => px + inset;
  const oy = (py: number) => py + inset;

  const insertTailOnHorizontal = (
    yEdge: number,
    dir: 1 | -1, // 1 = left->right (top), -1 = right->left (bottom)
    outwardY: number,
  ): Point[] => {
    const span = Math.max(20, w - 2 * r);
    const spread = Math.min(tailSpread, span * 0.65);
    const minC = r + spread / 2 + 4;
    const maxC = w - r - spread / 2 - 4;
    const center = clamp(r + span * clamp(tailOffset, 0.1, 0.9), minC, maxC);
    const p1 = {x: center - dir * (spread / 2), y: yEdge};
    const p2 = {x: center + dir * (spread / 2), y: yEdge};
    const tip = {x: center + tailLean, y: yEdge + outwardY * tailLength};
    const startEdge = dir === 1 ? {x: r, y: yEdge} : {x: w - r, y: yEdge};
    const endEdge = dir === 1 ? {x: w - r, y: yEdge} : {x: r, y: yEdge};
    return [
      ...sampleLine(startEdge, p1, 6),
      ...sampleLine(p1, tip, 10),
      ...sampleLine(tip, p2, 10),
      ...sampleLine(p2, endEdge, 6),
    ];
  };

  const insertTailOnVertical = (
    xEdge: number,
    dir: 1 | -1, // 1 = top->bottom (right), -1 = bottom->top (left)
    outwardX: number,
  ): Point[] => {
    const span = Math.max(20, h - 2 * r);
    const spread = Math.min(tailSpread, span * 0.65);
    const minC = r + spread / 2 + 4;
    const maxC = h - r - spread / 2 - 4;
    const center = clamp(r + span * clamp(tailOffset, 0.1, 0.9), minC, maxC);
    const p1 = {x: xEdge, y: center - dir * (spread / 2)};
    const p2 = {x: xEdge, y: center + dir * (spread / 2)};
    const tip = {x: xEdge + outwardX * tailLength, y: center + tailLean};
    const startEdge = dir === 1 ? {x: xEdge, y: r} : {x: xEdge, y: h - r};
    const endEdge = dir === 1 ? {x: xEdge, y: h - r} : {x: xEdge, y: r};
    return [
      ...sampleLine(startEdge, p1, 6),
      ...sampleLine(p1, tip, 10),
      ...sampleLine(tip, p2, 10),
      ...sampleLine(p2, endEdge, 6),
    ];
  };

  const P = Math.PI;
  const bodyPts: Point[] = [{x: r, y: 0}];
  // Top edge
  bodyPts.push(
    ...(tailSide === "top"
      ? insertTailOnHorizontal(0, 1, -1)
      : sampleLine({x: r, y: 0}, {x: w - r, y: 0}, 12)),
  );
  bodyPts.push(...sampleArc(w - r, r, r, -P / 2));
  // Right edge
  bodyPts.push(
    ...(tailSide === "right"
      ? insertTailOnVertical(w, 1, 1)
      : sampleLine({x: w, y: r}, {x: w, y: h - r}, 12)),
  );
  bodyPts.push(...sampleArc(w - r, h - r, r, 0));
  // Bottom edge
  bodyPts.push(
    ...(tailSide === "bottom"
      ? insertTailOnHorizontal(h, -1, 1)
      : sampleLine({x: w - r, y: h}, {x: r, y: h}, 12)),
  );
  bodyPts.push(...sampleArc(r, h - r, r, P / 2));
  // Left edge
  bodyPts.push(
    ...(tailSide === "left"
      ? insertTailOnVertical(0, -1, -1)
      : sampleLine({x: 0, y: h - r}, {x: 0, y: r}, 12)),
  );
  bodyPts.push(...sampleArc(r, r, r, P));

  const shiftedBody = bodyPts.map((pt) => ({x: ox(pt.x), y: oy(pt.y)}));
  const fillPath =
    `M ${r2(shiftedBody[0].x)} ${r2(shiftedBody[0].y)} ` +
    shiftedBody
      .slice(1)
      .map((pt) => `L ${r2(pt.x)} ${r2(pt.y)}`)
      .join(" ") +
    " Z";

  const overshootPt = {
    x: ox(r + overshoot),
    y: oy(-Math.min(4, overshoot * 0.14)),
  };
  const stroke: Stroke = [
    ...shiftedBody,
    ...sampleLine(shiftedBody[shiftedBody.length - 1], overshootPt, 4),
  ];

  return {fillPath, strokes: [stroke]} as BubbleGeometry;
};

/**
 * Builds local (0..width, 0..height) thought-cloud outline + 2 trailing dots.
 */
export const buildThoughtBubbleGeometry = ({
  width,
  height,
  puffDepth = BUBBLE_DEFAULTS.puffDepth,
  tailSide = BUBBLE_DEFAULTS.tailSide,
  tailOffset = BUBBLE_DEFAULTS.tailOffset,
  tailLength = BUBBLE_DEFAULTS.tailLength,
  tailLean = BUBBLE_DEFAULTS.tailLean,
  strokeWidth = BUBBLE_DEFAULTS.strokeWidth,
}: {
  width: number;
  height: number;
  puffDepth?: number;
  tailSide?: BubbleTailSide;
  tailOffset?: number;
  tailLength?: number;
  tailLean?: number;
  strokeWidth?: number;
}) => {
  const inset = strokeWidth / 2;
  const cx = width / 2;
  const cy = height / 2;
  const rx = Math.max(30, width / 2 - puffDepth - inset);
  const ry = Math.max(30, height / 2 - puffDepth - inset);

  const puffs = Math.max(10, Math.round((width + height) / 95));
  const stepsPerPuff = 8;
  const totalSteps = puffs * stepsPerPuff;

  const cloudPts: Point[] = [];
  for (let i = 0; i <= totalSteps; i++) {
    const u = i / totalSteps;
    const th = -Math.PI * 0.75 + u * Math.PI * 2;
    const bump = Math.abs(Math.sin(u * puffs * Math.PI)) * puffDepth;
    cloudPts.push({
      x: cx + (rx + bump) * Math.cos(th),
      y: cy + (ry + bump) * Math.sin(th),
    });
  }

  const fillPath =
    `M ${r2(cloudPts[0].x)} ${r2(cloudPts[0].y)} ` +
    cloudPts
      .slice(1)
      .map((pt) => `L ${r2(pt.x)} ${r2(pt.y)}`)
      .join(" ") +
    " Z";

  // Slight overshoot on the first puff for hand-drawn feel
  const cloudStroke: Stroke = [
    ...cloudPts,
    ...cloudPts.slice(1, 5),
  ];

  const t = clamp(tailOffset, 0.15, 0.85);
  const anchor = (() => {
    switch (tailSide) {
      case "top":
        return {x: width * t, y: 0, nx: 0, ny: -1};
      case "right":
        return {x: width, y: height * t, nx: 1, ny: 0};
      case "left":
        return {x: 0, y: height * t, nx: -1, ny: 0};
      default:
        return {x: width * t, y: height, nx: 0, ny: 1};
    }
  })();

  const dotCircle = (dcx: number, dcy: number, dr: number): Stroke => {
    const pts: Stroke = [];
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2.1;
      pts.push({x: dcx + dr * Math.cos(a), y: dcy + dr * Math.sin(a)});
    }
    return pts;
  };

  const leanX = tailSide === "top" || tailSide === "bottom" ? tailLean : 0;
  const leanY = tailSide === "left" || tailSide === "right" ? tailLean : 0;

  const d1 = {
    cx: anchor.x + anchor.nx * (tailLength * 0.35) + leanX * 0.35,
    cy: anchor.y + anchor.ny * (tailLength * 0.35) + leanY * 0.35,
    r: 15,
  };
  const d2 = {
    cx: anchor.x + anchor.nx * (tailLength * 0.85) + leanX * 0.85,
    cy: anchor.y + anchor.ny * (tailLength * 0.85) + leanY * 0.85,
    r: 9,
  };

  return {
    fillPath,
    dots: [d1, d2],
    strokes: [cloudStroke, dotCircle(d1.cx, d1.cy, d1.r), dotCircle(d2.cx, d2.cy, d2.r)],
  } as BubbleGeometry;
};

export const bubbleFrames = (strokes: Stroke[]) => annotationFrames(strokes, 28);

/** Total frames a SpeechBubble or ThoughtBubble occupies (delay not included). */
export const bubbleDuration = ({
  variant = "speech",
  width,
  height,
  radius,
  puffDepth,
  tailSide,
  tailOffset,
  tailLength,
  tailSpread,
  tailLean,
  overshoot,
  strokeWidth,
  duration,
  handEnter = BUBBLE_DEFAULTS.handEnter,
  handExit = BUBBLE_DEFAULTS.handExit,
}: {
  variant?: BubbleVariant;
  width: number;
  height: number;
  radius?: number;
  puffDepth?: number;
  tailSide?: BubbleTailSide;
  tailOffset?: number;
  tailLength?: number;
  tailSpread?: number;
  tailLean?: number;
  overshoot?: number;
  strokeWidth?: number;
  duration?: number;
  handEnter?: number;
  handExit?: number;
}) => {
  const geom =
    variant === "thought"
      ? buildThoughtBubbleGeometry({
          width,
          height,
          puffDepth,
          tailSide,
          tailOffset,
          tailLength,
          tailLean,
          strokeWidth,
        })
      : buildSpeechBubbleGeometry({
          width,
          height,
          radius,
          tailSide,
          tailOffset,
          tailLength,
          tailSpread,
          tailLean,
          overshoot,
          strokeWidth,
        });
  return handEnter + (duration ?? bubbleFrames(geom.strokes)) + handExit;
};

/** Pure SVG bubble renderer shared by SpeechBubble, ThoughtBubble, and Whiteboard. */
export const BubbleGraphic: React.FC<{
  width: number;
  height: number;
  fillPath: string;
  dots?: Array<{cx: number; cy: number; r: number}>;
  strokes: Stroke[];
  lens: number[];
  totalLen: number;
  progress: number;
  color: string;
  strokeWidth: number;
  fill?: string;
}> = ({
  width,
  height,
  fillPath,
  dots,
  strokes,
  lens,
  totalLen,
  progress,
  color,
  strokeWidth,
  fill,
}) => {
  const p = Math.min(1, Math.max(0, progress));
  const eased = ease(p);
  const dist = eased * totalLen;
  const fillOpacity = Math.min(1, Math.max(0, (eased - 0.72) / 0.25));

  return (
    <>
      {fill && fillOpacity > 0 ? (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}
        >
          <path d={fillPath} fill={fill} stroke="none" opacity={fillOpacity} />
          {dots?.map((d, i) => (
            <circle
              key={i}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              fill={fill}
              opacity={fillOpacity}
            />
          ))}
        </svg>
      ) : null}
      <StrokesSvg
        strokes={strokes}
        lens={lens}
        dist={dist}
        color={color}
        strokeWidth={strokeWidth}
      />
    </>
  );
};

const BubbleBase: React.FC<
  SpeechBubbleProps & {variant: BubbleVariant; puffDepth?: number}
> = ({
  variant,
  x = 0,
  y = 0,
  width,
  height,
  radius = BUBBLE_DEFAULTS.radius,
  puffDepth = BUBBLE_DEFAULTS.puffDepth,
  tailSide = BUBBLE_DEFAULTS.tailSide,
  tailOffset = BUBBLE_DEFAULTS.tailOffset,
  tailLength = BUBBLE_DEFAULTS.tailLength,
  tailSpread = BUBBLE_DEFAULTS.tailSpread,
  tailLean = BUBBLE_DEFAULTS.tailLean,
  overshoot = BUBBLE_DEFAULTS.overshoot,
  color = BUBBLE_DEFAULTS.color,
  strokeWidth = BUBBLE_DEFAULTS.strokeWidth,
  fill = BUBBLE_DEFAULTS.fill,
  children,
  delay = 0,
  duration,
  handEnter = BUBBLE_DEFAULTS.handEnter,
  handExit = BUBBLE_DEFAULTS.handExit,
  showHand = true,
  hand,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  const geom =
    variant === "thought"
      ? buildThoughtBubbleGeometry({
          width,
          height,
          puffDepth,
          tailSide,
          tailOffset,
          tailLength,
          tailLean,
          strokeWidth,
        })
      : buildSpeechBubbleGeometry({
          width,
          height,
          radius,
          tailSide,
          tailOffset,
          tailLength,
          tailSpread,
          tailLean,
          overshoot,
          strokeWidth,
        });

  const lens = geom.strokes.map(polylineLength);
  const totalLen = lens.reduce((a, b) => a + b, 0);
  const frames = duration ?? bubbleFrames(geom.strokes);

  const drawStart = handEnter;
  const drawEnd = handEnter + frames;
  const total = drawEnd + handExit;

  const progress = interpolate(f, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dist = ease(progress) * totalLen;
  const pen = penAlongStrokes(geom.strokes, dist);

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
      <BubbleGraphic
        width={width}
        height={height}
        fillPath={geom.fillPath}
        dots={geom.dots}
        strokes={geom.strokes}
        lens={lens}
        totalLen={totalLen}
        progress={progress}
        color={color}
        strokeWidth={strokeWidth}
        fill={fill}
      />
      {children ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          {children}
        </div>
      ) : null}
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

/** Hand-drawn speech bubble with a directional tail and optional fill/children. */
export const SpeechBubble: React.FC<SpeechBubbleProps> = (props) => (
  <BubbleBase {...props} variant="speech" />
);

/** Hand-drawn scalloped thought cloud with trailing thought dots. */
export const ThoughtBubble: React.FC<ThoughtBubbleProps> = (props) => (
  <BubbleBase {...props} variant="thought" />
);
