import React from "react";
import {AbsoluteFill} from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import {HandPen, type HandPenProps} from "../core/HandPen";
import {reveal} from "../core/path";

/**
 * Whiteboard scene transitions, as custom presentations for @remotion/transitions:
 *
 *   npx remotion add @remotion/transitions
 *
 *   <TransitionSeries.Transition
 *     presentation={whiteboardWipe({direction: "from-left"})}
 *     timing={linearTiming({durationInFrames: 20})}
 *   />
 *
 * - whiteboardWipe : the next board is revealed by a hand-drawn wobbly edge
 * - whiteboardSlide: the camera pans to the next board
 * - handWipe       : the hand sweeps the next board in, line by line
 *
 * Use linearTiming for wipe and handWipe (springTiming makes the edge speed up and slow down).
 */

export type TransitionDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

/* ---------- pure geometry (percent of the frame) ---------- */

type Pt = [number, number];

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Canonical (from-left) coordinates -> the requested direction. */
const orient = (direction: TransitionDirection, [x, y]: Pt): Pt => {
  switch (direction) {
    case "from-right":
      return [100 - x, y];
    case "from-top":
      return [y, x];
    case "from-bottom":
      return [y, 100 - x];
    default:
      return [x, y];
  }
};

/**
 * The wobbly edge of the wipe as a list of points, plus the full clip polygon.
 * progress 0 = nothing revealed, 1 = everything revealed.
 * `phase` changes the wobble, so the edge can "boil" between poses.
 */
export const wipeShape = (
  direction: TransitionDirection,
  progress: number,
  amplitude: number,
  waves: number,
  phase: number,
  steps = 28,
): {edge: Pt[]; polygon: Pt[]} => {
  const p = Math.min(1, Math.max(0, progress));
  // the whole wobbly edge starts fully off-frame and ends fully off-frame
  const margin = amplitude + 2;
  const base = -margin + p * (100 + 2 * margin);

  const edge: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = (100 * i) / steps;
    const wob =
      amplitude *
      (Math.sin((y / 100) * Math.PI * 2 * waves + phase) * 0.7 +
        Math.sin((y / 100) * Math.PI * 2 * (waves * 2.3) + phase * 1.9) * 0.3);
    edge.push(orient(direction, [base + wob, y]));
  }
  const polygon: Pt[] = [
    ...edge,
    orient(direction, [-10, 100]),
    orient(direction, [-10, 0]),
  ];
  return {edge, polygon};
};

const toClip = (pts: Pt[]) =>
  `polygon(${pts.map(([x, y]) => `${f2(x)}% ${f2(y)}%`).join(", ")})`;

/** Time-quantised phase: the edge jumps to a new wobble every `every` frames. */
const boilPhase = (progress: number, durationInFrames: number | undefined, every = 3) =>
  Math.floor((progress * (durationInFrames ?? 30)) / every) * 1.7;

/* ---------- 1. wobbly wipe ---------- */

export type WipeOptions = {
  /** Where the next board comes from. Default "from-left". */
  direction?: TransitionDirection;
  /** How wobbly the edge is, in % of the frame. Default 3. */
  amplitude?: number;
  /** How many waves along the edge. Default 3. */
  waves?: number;
  /** Colour of a pen line drawn along the edge. Default none. */
  edgeColor?: string | null;
  /** Thickness of that line in px. Default 10. */
  edgeWidth?: number;
};

type WipeProps = Required<WipeOptions>;

const WipeComponent: React.FC<TransitionPresentationComponentProps<WipeProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  presentationDurationInFrames,
  passedProps,
}) => {
  if (presentationDirection === "exiting") {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const {direction, amplitude, waves, edgeColor, edgeWidth} = passedProps;
  const phase = boilPhase(presentationProgress, presentationDurationInFrames);
  const {edge, polygon} = wipeShape(direction, presentationProgress, amplitude, waves, phase);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: toClip(polygon)}}>{children}</AbsoluteFill>
      {edgeColor ? (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none"}}
        >
          <polyline
            points={edge.map(([x, y]) => `${f2(x)},${f2(y)}`).join(" ")}
            fill="none"
            stroke={edgeColor}
            strokeWidth={edgeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

/** The next board is revealed by a hand-drawn wobbly edge sweeping across. */
export const whiteboardWipe = (options: WipeOptions = {}): TransitionPresentation<WipeProps> => ({
  component: WipeComponent,
  props: {
    direction: options.direction ?? "from-left",
    amplitude: options.amplitude ?? 3,
    waves: options.waves ?? 3,
    edgeColor: options.edgeColor ?? null,
    edgeWidth: options.edgeWidth ?? 10,
  },
});

/* ---------- 2. slide / pan ---------- */

export type SlideOptions = {
  /** Where the next board comes from. Default "from-right". */
  direction?: TransitionDirection;
  /** Drop shadow on the arriving board, so it reads as a separate sheet. Default true. */
  shadow?: boolean;
};

type SlideProps = Required<SlideOptions>;

/** translate() of a scene, in % of the frame. Entering: 100 -> 0. Exiting: 0 -> -100. */
export const slideOffset = (
  direction: TransitionDirection,
  presentationDirection: "entering" | "exiting",
  progress: number,
): {x: number; y: number} => {
  const p = progress;
  const along = presentationDirection === "entering" ? (1 - p) * 100 : -p * 100;
  switch (direction) {
    case "from-left":
      return {x: -along, y: 0};
    case "from-top":
      return {x: 0, y: -along};
    case "from-bottom":
      return {x: 0, y: along};
    default:
      return {x: along, y: 0};
  }
};

const SlideComponent: React.FC<TransitionPresentationComponentProps<SlideProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const {direction, shadow} = passedProps;
  const {x, y} = slideOffset(direction, presentationDirection, presentationProgress);
  const entering = presentationDirection === "entering";
  // shadow falls toward the board it covers
  const sx = direction === "from-left" ? 1 : direction === "from-right" ? -1 : 0;
  const sy = direction === "from-top" ? 1 : direction === "from-bottom" ? -1 : 0;
  return (
    <AbsoluteFill
      style={{
        translate: `${f2(x)}% ${f2(y)}%`,
        boxShadow:
          entering && shadow ? `${sx * 40}px ${sy * 40}px 80px rgba(0,0,0,0.18)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** The camera pans to the next board: both boards move together. */
export const whiteboardSlide = (options: SlideOptions = {}): TransitionPresentation<SlideProps> => ({
  component: SlideComponent,
  props: {
    direction: options.direction ?? "from-right",
    shadow: options.shadow ?? true,
  },
});

/* ---------- 3. hand wipe ---------- */

export type HandWipeOptions = {
  /** Horizontal passes of the hand over the board. Default 6. */
  bands?: number;
  /** Up-and-down scribbles per pass. Default 2. */
  scribbles?: number;
  /** Fraction of the transition the hand needs to slide in, and again to slide out. Default 0.16. */
  handFraction?: number;
  /** Hand size, tip and image overrides. Default scale is 0.7. */
  hand?: Pick<HandPenProps, "scale" | "src" | "tip" | "size">;
};

type HandWipeProps = Required<Omit<HandWipeOptions, "hand">> & {
  hand: HandWipeOptions["hand"] | null;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Where the next board is revealed, and where the hand is, for a given progress. */
export const handWipeState = (
  progress: number,
  bands: number,
  scribbles: number,
  handFraction: number,
) => {
  const f = clamp01(handFraction);
  const draw = clamp01((progress - f) / Math.max(1e-6, 1 - 2 * f));
  const s = reveal("serpentine", draw, 100, 100, bands, scribbles, {unit: "%"});
  const slideIn = progress < f ? 1 - Math.pow(1 - clamp01(progress / f), 3) : 1;
  const slideOut = progress > 1 - f ? Math.pow(clamp01((progress - (1 - f)) / f), 3) : 0;
  return {
    clipPath: s.clipPath,
    penX: s.penX,
    penY: s.penY,
    away: 1 - slideIn + slideOut,
    drawing: progress >= f && progress <= 1 - f,
  };
};

const HandWipeComponent: React.FC<TransitionPresentationComponentProps<HandWipeProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  if (presentationDirection === "exiting") {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const {bands, scribbles, handFraction, hand} = passedProps;
  const s = handWipeState(presentationProgress, bands, scribbles, handFraction);
  const showHand = presentationProgress > 0 && presentationProgress < 1;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: s.clipPath}}>{children}</AbsoluteFill>
      {showHand ? (
        <HandPen
          tipX={`${s.penX}%`}
          tipY={`${s.penY}%`}
          rotate={s.drawing ? Math.sin(presentationProgress * 60) * 1.6 : 0}
          offsetX={s.away * 340}
          offsetY={s.away * 460}
          scale={0.7}
          {...(hand ?? {})}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** The hand sweeps the next board in, line by line. Use with linearTiming. */
export const handWipe = (options: HandWipeOptions = {}): TransitionPresentation<HandWipeProps> => ({
  component: HandWipeComponent,
  props: {
    bands: options.bands ?? 6,
    scribbles: options.scribbles ?? 2,
    handFraction: options.handFraction ?? 0.16,
    hand: options.hand ?? null,
  },
});
