import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {HandPen, type HandPenProps} from "./HandPen";

/**
 * Hand-drawn annotations: an arrow, a circle and an underline.
 * Each one is drawn by the hand, stroke by stroke, and positioned in the
 * PARENT's pixel coordinates (render inside a position: relative | absolute parent).
 *
 * All three share one core: a list of strokes (polylines) that the pen
 * follows. The geometry builders are exported so the Whiteboard scene can use
 * them later.
 */

export type Point = {x: number; y: number};
export type Stroke = Point[];

/* ---------- pure geometry ---------- */

export const polylineLength = (pts: Stroke): number => {
  let n = 0;
  for (let i = 1; i < pts.length; i++) {
    n += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return n;
};

/** Point at distance `dist` along a polyline (clamped to its ends). */
export const pointAtLength = (pts: Stroke, dist: number): Point => {
  if (pts.length === 0) return {x: 0, y: 0};
  let left = Math.max(0, dist);
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (left <= seg) {
      const t = seg > 0 ? left / seg : 1;
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
      };
    }
    left -= seg;
  }
  return pts[pts.length - 1];
};

/** Pen position after drawing `dist` px in total, across all strokes in order. */
export const penAlongStrokes = (strokes: Stroke[], dist: number): Point => {
  let left = Math.max(0, dist);
  for (let i = 0; i < strokes.length; i++) {
    const len = polylineLength(strokes[i]);
    if (left <= len || i === strokes.length - 1) {
      return pointAtLength(strokes[i], Math.min(left, len));
    }
    left -= len;
  }
  return {x: 0, y: 0};
};

export const strokesLength = (strokes: Stroke[]) =>
  strokes.reduce((n, s) => n + polylineLength(s), 0);

/**
 * Arrow from `from` to `to`: a bowed shaft, then two short head strokes drawn
 * from the tip. `curvature` is the bow as a fraction of the length (negative bows the
 * other way, 0 is straight).
 */
export const arrowStrokes = (
  from: Point,
  to: Point,
  curvature = 0.25,
  headSize = 44,
): Stroke[] => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const c = {
    x: (from.x + to.x) / 2 + nx * curvature * dist,
    y: (from.y + to.y) / 2 + ny * curvature * dist,
  };

  const shaft: Stroke = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const d = t * t;
    shaft.push({
      x: a * from.x + b * c.x + d * to.x,
      y: a * from.y + b * c.y + d * to.y,
    });
  }

  // direction the arrow is travelling at the tip (derivative of the bezier at t = 1)
  const tx = to.x - c.x;
  const ty = to.y - c.y;
  const tl = Math.hypot(tx, ty) || 1;
  const bx = -tx / tl; // pointing back from the tip
  const by = -ty / tl;
  const rot = (deg: number, len: number): Point => {
    const r = (deg * Math.PI) / 180;
    return {
      x: to.x + (bx * Math.cos(r) - by * Math.sin(r)) * len,
      y: to.y + (bx * Math.sin(r) + by * Math.cos(r)) * len,
    };
  };
  // the second stroke is a touch shorter, like a real hand
  return [shaft, [to, rot(28, headSize)], [to, rot(-28, headSize * 0.9)]];
};

/**
 * A loop drawn around an ellipse whose top-left is (x, y). It runs a bit more than a full
 * lap and ends slightly outside where it started, so it never retraces itself.
 */
export const circleStrokes = (
  x: number,
  y: number,
  width: number,
  height: number,
  {laps = 1.15, clockwise = false}: {laps?: number; clockwise?: boolean} = {},
): Stroke[] => {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = width / 2;
  const ry = height / 2;
  const n = Math.max(12, Math.round(laps * 80));
  const dir = clockwise ? 1 : -1;
  const start = -2.2;
  const pts: Stroke = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const th = start + dir * u * laps * 2 * Math.PI;
    // spiral outward; more laps spread further so a double loop shows two distinct rings
    const k = 1 + 0.1 * laps * (u - 0.5) + 0.02 * Math.sin(2 * th + 1.3);
    pts.push({x: cx + rx * k * Math.cos(th), y: cy + ry * k * Math.sin(th)});
  }
  return [pts];
};

/**
 * An underline starting at (x, y), `width` px long. `double` adds a second pass
 * back from the right, a little lower.
 */
export const underlineStrokes = (
  x: number,
  y: number,
  width: number,
  {
    wave = 4,
    double = false,
    gap = 16,
  }: {wave?: number; double?: boolean; gap?: number} = {},
): Stroke[] => {
  const n = 36;
  const line = (yy: number, phase: number, reverse: boolean): Stroke => {
    const pts: Stroke = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({
        x: x + width * t,
        y: yy + wave * Math.sin(t * Math.PI * 3 + phase) - t * wave * 1.5,
      });
    }
    return reverse ? pts.reverse() : pts;
  };
  const first = line(y, 0, false);
  return double ? [first, line(y + gap, 1.7, true)] : [first];
};

const bowedSegment = (
  a: Point,
  b: Point,
  bow: number,
  steps = 16,
): Stroke => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const c = {
    x: (a.x + b.x) / 2 + nx * bow * dist,
    y: (a.y + b.y) / 2 + ny * bow * dist,
  };
  const pts: Stroke = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    });
  }
  return pts;
};

/**
 * A hand-drawn checkmark inside (x, y, width, height) in one continuous stroke.
 */
export const checkStrokes = (
  x: number,
  y: number,
  width: number,
  height: number,
): Stroke[] => {
  const start = {x: x + width * 0.1, y: y + height * 0.56};
  const mid = {x: x + width * 0.37, y: y + height * 0.85};
  const end = {x: x + width * 0.94, y: y + height * 0.12};
  const leg1 = bowedSegment(start, mid, 0.04, 12);
  const leg2 = bowedSegment(mid, end, -0.05, 20);
  return [[...leg1, ...leg2.slice(1)]];
};

/**
 * A hand-drawn X mark inside (x, y, width, height) in two strokes.
 */
export const crossStrokes = (
  x: number,
  y: number,
  width: number,
  height: number,
): Stroke[] => [
  bowedSegment(
    {x: x + width * 0.12, y: y + height * 0.14},
    {x: x + width * 0.88, y: y + height * 0.86},
    0.04,
    16,
  ),
  bowedSegment(
    {x: x + width * 0.86, y: y + height * 0.12},
    {x: x + width * 0.14, y: y + height * 0.88},
    -0.04,
    16,
  ),
];

export type StrikeVariant = "line" | "double" | "scribble";

/**
 * A cross-out strike across (x, y, width, height): single slash, double slash,
 * or energetic scribble-out.
 */
export const strikeStrokes = (
  x: number,
  y: number,
  width: number,
  height: number,
  variant: StrikeVariant = "line",
): Stroke[] => {
  if (variant === "double") {
    return [
      bowedSegment(
        {x, y: y + height * 0.62},
        {x: x + width, y: y + height * 0.34},
        -0.03,
        24,
      ),
      bowedSegment(
        {x: x + width * 0.98, y: y + height * 0.56},
        {x: x + width * 0.02, y: y + height * 0.44},
        0.025,
        24,
      ),
    ];
  }
  if (variant === "scribble") {
    const passes = 5;
    const pts: Stroke = [];
    for (let i = 0; i <= passes; i++) {
      const t = i / passes;
      const px = x + width * t;
      const py =
        i % 2 === 0 ? y + height * 0.82 : y + height * 0.18;
      if (i > 0) {
        const prev = pts[pts.length - 1];
        const seg = bowedSegment(prev, {x: px, y: py}, i % 2 === 0 ? 0.04 : -0.04, 10);
        pts.push(...seg.slice(1));
      } else {
        pts.push({x: px, y: py});
      }
    }
    return [pts];
  }
  return [
    bowedSegment(
      {x, y: y + height * 0.6},
      {x: x + width, y: y + height * 0.38},
      -0.03,
      24,
    ),
  ];
};

export type DividerOrientation = "horizontal" | "vertical";

/**
 * A hand-drawn separator line starting at (x, y), `length` px long.
 */
export const dividerStrokes = (
  x: number,
  y: number,
  length: number,
  {
    orientation = "horizontal",
    wave = 3,
    double = false,
    gap = 14,
    dashed = false,
  }: {
    orientation?: DividerOrientation;
    wave?: number;
    double?: boolean;
    gap?: number;
    dashed?: boolean;
  } = {},
): Stroke[] => {
  const pt = (along: number, cross: number): Point =>
    orientation === "vertical"
      ? {x: x + cross, y: y + along}
      : {x: x + along, y: y + cross};

  if (dashed) {
    const dashLen = 36;
    const gapLen = 22;
    const step = dashLen + gapLen;
    const strokes: Stroke[] = [];
    for (let pos = 0; pos < length; pos += step) {
      const end = Math.min(length, pos + dashLen);
      if (end - pos < 6) break;
      const wob = Math.sin(pos * 0.05) * wave * 0.4;
      strokes.push(bowedSegment(pt(pos, wob), pt(end, -wob * 0.5), 0.02, 8));
    }
    return strokes;
  }

  const n = 36;
  const line = (offset: number, phase: number, reverse: boolean): Stroke => {
    const pts: Stroke = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const cross =
        offset + wave * Math.sin(t * Math.PI * 2.5 + phase) - t * wave * 0.8;
      pts.push(pt(length * t, cross));
    }
    return reverse ? pts.reverse() : pts;
  };
  const first = line(0, 0, false);
  return double ? [first, line(gap, 1.5, true)] : [first];
};

export type BracketSide = "left" | "right" | "top" | "bottom";
export type BracketVariant = "curly" | "square";

/**
 * A hand-drawn curly (`{`, `}`, `⏞`, `⏟`) or square (`[`, `]`) bracket inside
 * `(x, y, width, height)`. `side` is the direction the centre tip points.
 */
export const bracketStrokes = (
  x: number,
  y: number,
  width: number,
  height: number,
  {
    side = "right",
    variant = "curly",
  }: {side?: BracketSide; variant?: BracketVariant} = {},
): Stroke[] => {
  const mapUv = (u: number, v: number): Point => {
    switch (side) {
      case "left":
        return {x: x + (1 - u) * width, y: y + v * height};
      case "bottom":
        return {x: x + v * width, y: y + u * height};
      case "top":
        return {x: x + v * width, y: y + (1 - u) * height};
      default:
        return {x: x + u * width, y: y + v * height};
    }
  };

  if (variant === "square") {
    const p0 = mapUv(0, 0);
    const p1 = mapUv(1, 0);
    const p2 = mapUv(1, 1);
    const p3 = mapUv(0, 1);
    return [
      [
        ...bowedSegment(p0, p1, 0.03, 10),
        ...bowedSegment(p1, p2, 0.015, 18).slice(1),
        ...bowedSegment(p2, p3, 0.03, 10).slice(1),
      ],
    ];
  }

  const cubic = (
    p0: [number, number],
    c1: [number, number],
    c2: [number, number],
    p1: [number, number],
    steps = 20,
  ): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const m = 1 - t;
      const u =
        m * m * m * p0[0] +
        3 * m * m * t * c1[0] +
        3 * m * t * t * c2[0] +
        t * t * t * p1[0];
      const v =
        m * m * m * p0[1] +
        3 * m * m * t * c1[1] +
        3 * m * t * t * c2[1] +
        t * t * t * p1[1];
      out.push([u, v]);
    }
    return out;
  };

  const upper = cubic([0, 0], [0.76, 0.01], [0.24, 0.47], [1, 0.5], 20);
  const lower = cubic([1, 0.5], [0.26, 0.53], [0.78, 0.99], [0.02, 1], 20);
  const uv = [...upper, ...lower.slice(1)];
  return [uv.map(([u, v]) => mapUv(u, v))];
};

/* ---------- timing helpers ---------- */

/** Frames the pen needs for these strokes at `speed` px per frame (min 12). */
export const annotationFrames = (strokes: Stroke[], speed = 26) =>
  Math.max(12, Math.round(strokesLength(strokes) / speed));

/** Total frames an annotation occupies (delay not included). Handy for sequencing. */
export const annotationDuration = ({
  duration = 30,
  handEnter = 8,
  handExit = 10,
}: {duration?: number; handEnter?: number; handExit?: number} = {}) =>
  handEnter + duration + handExit;

/* ---------- shared drawing core ---------- */

type CommonProps = {
  /** Ink colour. Default red. */
  color?: string;
  /** Line thickness in px. */
  strokeWidth?: number;
  /** Frames to wait before the hand starts coming in. Default 0. */
  delay?: number;
  /** Frames the pen spends drawing. Default: about 26 px of line per frame. */
  duration?: number;
  /** Frames the hand takes to slide in / out. Default 8 / 10. */
  handEnter?: number;
  handExit?: number;
  /** Set false to draw without the hand. Default true. */
  showHand?: boolean;
  /** Hand size, tip and image overrides. Default scale is 0.6. */
  hand?: Pick<HandPenProps, "scale" | "src" | "tip" | "size">;
};

type StrokeDrawingProps = CommonProps & {strokes: Stroke[]};

export const StrokesSvg: React.FC<{
  strokes: Stroke[];
  lens: number[];
  dist: number;
  color: string;
  strokeWidth: number;
}> = ({strokes, lens, dist, color, strokeWidth}) => {
  let before = 0;
  return (
    <svg
      width={1}
      height={1}
      style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}
    >
      {strokes.map((pts, i) => {
        const len = lens[i];
        const drawn = Math.min(len, Math.max(0, dist - before));
        before += len;
        if (drawn <= 0.01) return null;
        return (
          <polyline
            key={i}
            points={pts.map((p) => `${Math.round(p.x * 100) / 100},${Math.round(p.y * 100) / 100}`).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={len}
            strokeDashoffset={len - drawn}
          />
        );
      })}
    </svg>
  );
};

const StrokeDrawing: React.FC<StrokeDrawingProps> = ({
  strokes,
  color = "#d62828",
  strokeWidth = 10,
  delay = 0,
  duration,
  handEnter = 8,
  handExit = 10,
  showHand = true,
  hand,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay; // local frame, 0 = the hand starts to come in

  const frames = duration ?? annotationFrames(strokes);
  const drawStart = handEnter;
  const drawEnd = handEnter + frames;
  const total = drawEnd + handExit;

  const lens = strokes.map(polylineLength);
  const totalLen = lens.reduce((a, b) => a + b, 0);

  const progress = interpolate(f, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const dist = progress * totalLen;
  const pen = penAlongStrokes(strokes, dist);

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
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        overflow: "visible",
      }}
    >
      <StrokesSvg
        strokes={strokes}
        lens={lens}
        dist={dist}
        color={color}
        strokeWidth={strokeWidth}
      />
      {handVisible ? (
        <HandPen
          tipX={pen.x}
          tipY={pen.y}
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

/* ---------- the three components ---------- */

export type HandArrowProps = CommonProps & {
  /** Start and end of the arrow in the parent's px. The head lands on `to`. */
  from: Point;
  to: Point;
  /** Bow of the shaft as a fraction of its length. Negative bows the other way. Default 0.25. */
  curvature?: number;
  /** Length of each head stroke in px. Default 44. */
  headSize?: number;
};

/** An arrow the hand draws from `from` to `to`, ending with two head strokes. */
export const HandArrow: React.FC<HandArrowProps> = ({
  from,
  to,
  curvature = 0.25,
  headSize = 44,
  strokeWidth = 10,
  ...rest
}) => (
  <StrokeDrawing
    strokes={arrowStrokes(from, to, curvature, headSize)}
    strokeWidth={strokeWidth}
    {...rest}
  />
);

export type HandCircleProps = CommonProps & {
  /** Top-left and size of the ellipse to draw, in the parent's px. Size it a bit larger than the target. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** How far round the pen goes. 1.15 overshoots a little, 2 is a double loop. Default 1.15. */
  laps?: number;
  /** Draw clockwise instead of counter-clockwise. Default false. */
  clockwise?: boolean;
};

/** A loop the hand draws around something. */
export const HandCircle: React.FC<HandCircleProps> = ({
  x,
  y,
  width,
  height,
  laps = 1.15,
  clockwise = false,
  strokeWidth = 10,
  ...rest
}) => (
  <StrokeDrawing
    strokes={circleStrokes(x, y, width, height, {laps, clockwise})}
    strokeWidth={strokeWidth}
    {...rest}
  />
);

export type HandUnderlineProps = CommonProps & {
  /** Left end of the underline and its length, in the parent's px. */
  x: number;
  y: number;
  width: number;
  /** Height of the wobble in px. Default 4. */
  wave?: number;
  /** Add a second pass back from the right. Default false. */
  double?: boolean;
  /** Distance between the two passes in px when `double` is on. Default 16. */
  gap?: number;
};

/** A slightly wavy underline the hand draws left to right. */
export const HandUnderline: React.FC<HandUnderlineProps> = ({
  x,
  y,
  width,
  wave = 4,
  double = false,
  gap = 16,
  strokeWidth = 10,
  ...rest
}) => (
  <StrokeDrawing
    strokes={underlineStrokes(x, y, width, {wave, double, gap})}
    strokeWidth={strokeWidth}
    {...rest}
  />
);

export type HandCheckProps = CommonProps & {
  /** Top-left of the checkmark box in the parent's px. */
  x: number;
  y: number;
  /** Square size in px when `width`/`height` are omitted. Default 84. */
  size?: number;
  width?: number;
  height?: number;
};

/** A hand-drawn checkmark (✓). Defaults to green ink. */
export const HandCheck: React.FC<HandCheckProps> = ({
  x,
  y,
  size = 84,
  width,
  height,
  color = "#3aa845",
  strokeWidth = 12,
  ...rest
}) => (
  <StrokeDrawing
    strokes={checkStrokes(x, y, width ?? size, height ?? size)}
    color={color}
    strokeWidth={strokeWidth}
    {...rest}
  />
);

export type HandCrossProps = CommonProps & {
  /** Top-left of the cross box in the parent's px. */
  x: number;
  y: number;
  /** Square size in px when `width`/`height` are omitted. Default 80. */
  size?: number;
  width?: number;
  height?: number;
};

/** A hand-drawn X mark (✕) in two strokes. Defaults to red ink. */
export const HandCross: React.FC<HandCrossProps> = ({
  x,
  y,
  size = 80,
  width,
  height,
  color = "#d62828",
  strokeWidth = 12,
  ...rest
}) => (
  <StrokeDrawing
    strokes={crossStrokes(x, y, width ?? size, height ?? size)}
    color={color}
    strokeWidth={strokeWidth}
    {...rest}
  />
);

export type HandStrikeProps = CommonProps & {
  /** Top-left and size of the target region to cross out, in px. */
  x: number;
  y: number;
  width: number;
  height?: number;
  /** "line" = single slash, "double" = two slashes, "scribble" = zig-zag cross-out. */
  variant?: StrikeVariant;
};

/** A hand-drawn cross-out strike across text or numbers. Defaults to red ink. */
export const HandStrike: React.FC<HandStrikeProps> = ({
  x,
  y,
  width,
  height = 80,
  variant = "line",
  color = "#d62828",
  strokeWidth = 11,
  ...rest
}) => (
  <StrokeDrawing
    strokes={strikeStrokes(x, y, width, height, variant)}
    color={color}
    strokeWidth={strokeWidth}
    {...rest}
  />
);

export type HandDividerProps = CommonProps & {
  /** Start point of the divider in the parent's px. */
  x: number;
  y: number;
  /** Length of the divider in px. */
  length: number;
  orientation?: DividerOrientation;
  /** Subtle hand wobble in px. Default 3. */
  wave?: number;
  /** Draw a second parallel line back. Default false. */
  double?: boolean;
  /** Spacing between double lines in px. Default 14. */
  gap?: number;
  /** Render as a series of hand-drawn dashes. Default false. */
  dashed?: boolean;
};

/** A hand-drawn horizontal or vertical divider line. Defaults to dark ink. */
export const HandDivider: React.FC<HandDividerProps> = ({
  x,
  y,
  length,
  orientation = "horizontal",
  wave = 3,
  double = false,
  gap = 14,
  dashed = false,
  color = "#111111",
  strokeWidth = 8,
  ...rest
}) => (
  <StrokeDrawing
    strokes={dividerStrokes(x, y, length, {
      orientation,
      wave,
      double,
      gap,
      dashed,
    })}
    color={color}
    strokeWidth={strokeWidth}
    {...rest}
  />
);

export type HandBracketProps = CommonProps & {
  /** Top-left of the bracket box in the parent's px. */
  x: number;
  y: number;
  width?: number;
  height?: number;
  /** Direction the centre tip points ("right" = `}`, "left" = `{`, "top" = `⏞`, "bottom" = `⏟`). */
  side?: BracketSide;
  /** "curly" (default) or "square". */
  variant?: BracketVariant;
};

/** A hand-drawn curly or square bracket for grouping lines or totals. */
export const HandBracket: React.FC<HandBracketProps> = ({
  x,
  y,
  width,
  height,
  side = "right",
  variant = "curly",
  color = "#111111",
  strokeWidth = 10,
  ...rest
}) => {
  const horiz = side === "top" || side === "bottom";
  const w = width ?? (horiz ? 360 : 56);
  const h = height ?? (horiz ? 56 : 260);
  return (
    <StrokeDrawing
      strokes={bracketStrokes(x, y, w, h, {side, variant})}
      color={color}
      strokeWidth={strokeWidth}
      {...rest}
    />
  );
};
