import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {HandPen, type HandPenProps} from "../core/HandPen";
import {eraseReveal, type RevealMode} from "../core/path";
import {DEFAULT_AWAY} from "../core/timeline";

export type EraserWipeProps = {
  /** Content currently on the board that will be erased once `delay` arrives. */
  children: React.ReactNode;
  /** Top-left position inside the parent, in px. */
  x?: number;
  y?: number;
  /**
   * Optional box size in px. Leave both out to wrap `children` (uses `%` clip).
   */
  width?: number;
  height?: number;

  /** Frames to wait before the eraser comes in. Default 0. */
  delay?: number;
  /** Frames spent scrubbing the area clean. Default 32. */
  duration?: number;
  handEnter?: number;
  handExit?: number;

  /** "serpentine" (default) scrubs back-and-forth; "sweep" wipes left-to-right. */
  mode?: RevealMode;
  bands?: number;
  scribbles?: number;
  linear?: boolean;

  /** "eraser" renders a built-in illustrated whiteboard eraser; "hand" uses HandPen. */
  tool?: "eraser" | "hand";
  /** Grip colour of the built-in whiteboard eraser. Default "#2a6fd6". */
  eraserColor?: string;
  showTool?: boolean;
  hand?: Pick<HandPenProps, "scale" | "src" | "tip" | "size">;

  style?: React.CSSProperties;
};

export const ERASER_DEFAULTS = {
  duration: 32,
  handEnter: 8,
  handExit: 10,
  mode: "serpentine" as RevealMode,
  bands: 4,
  scribbles: 4,
  eraserColor: "#2a6fd6",
};

/** Total frames an EraserWipe occupies (delay not included). */
export const eraserWipeDuration = ({
  duration = ERASER_DEFAULTS.duration,
  handEnter = ERASER_DEFAULTS.handEnter,
  handExit = ERASER_DEFAULTS.handExit,
}: Pick<EraserWipeProps, "duration" | "handEnter" | "handExit"> = {}) =>
  handEnter + duration + handExit;

const EraserGraphic: React.FC<{
  tipX: number | string;
  tipY: number | string;
  rotate: number;
  offsetX: number;
  offsetY: number;
  color: string;
}> = ({tipX, tipY, rotate, offsetX, offsetY, color}) => {
  const at = (v: number | string, delta: number) =>
    typeof v === "number" ? v + delta : `calc(${v} + ${delta}px)`;

  const w = 136;
  const h = 74;
  // Anchor bottom-left felt corner on the scrub coordinate
  const anchorX = 24;
  const anchorY = 58;

  return (
    <div
      style={{
        position: "absolute",
        left: at(tipX, -anchorX + offsetX),
        top: at(tipY, -anchorY + offsetY),
        width: w,
        height: h,
        transformOrigin: `${anchorX}px ${anchorY}px`,
        transform: `rotate(${-18 + rotate}deg)`,
        filter: "drop-shadow(0px 10px 12px rgba(0, 0, 0, 0.24))",
        pointerEvents: "none",
      }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Top grip block */}
        <rect
          x={6}
          y={4}
          width={w - 12}
          height={44}
          rx={12}
          fill={color}
          stroke="#111111"
          strokeWidth={5}
        />
        {/* Highlight stripe on grip */}
        <path
          d={`M 20 14 L ${w - 24} 14`}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={5}
          strokeLinecap="round"
        />
        {/* Felt pad bottom */}
        <rect
          x={10}
          y={44}
          width={w - 20}
          height={24}
          rx={6}
          fill="#334155"
          stroke="#111111"
          strokeWidth={5}
        />
      </svg>
    </div>
  );
};

/**
 * Erases `children` in place using a whiteboard scrubbing motion so new
 * content can be drawn right over the cleared spot.
 */
export const EraserWipe: React.FC<EraserWipeProps> = ({
  children,
  x = 0,
  y = 0,
  width,
  height,
  delay = 0,
  duration = ERASER_DEFAULTS.duration,
  handEnter = ERASER_DEFAULTS.handEnter,
  handExit = ERASER_DEFAULTS.handExit,
  mode = ERASER_DEFAULTS.mode,
  bands = ERASER_DEFAULTS.bands,
  scribbles = ERASER_DEFAULTS.scribbles,
  linear = false,
  tool = "eraser",
  eraserColor = ERASER_DEFAULTS.eraserColor,
  showTool = true,
  hand,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  const eraseStart = handEnter;
  const eraseEnd = handEnter + duration;
  const total = eraseEnd + handExit;

  const progress = interpolate(f, [eraseStart, eraseEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fixed = width !== undefined && height !== undefined;
  const unit = fixed ? "px" : "%";
  const {penX, penY, clipPath} = eraseReveal(
    mode,
    progress,
    fixed ? width : 100,
    fixed ? height : 100,
    bands,
    scribbles,
    {unit, linear},
  );

  const slideIn = interpolate(f, [0, handEnter], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const slideOut = interpolate(f, [eraseEnd, total], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const away = slideIn + slideOut;

  const erasing = f >= eraseStart && f <= eraseEnd;
  const tilt = erasing ? Math.sin(f * 0.65) * 4 : 0;
  const toolVisible = showTool && f >= 0 && f <= total;

  const box: React.CSSProperties = fixed
    ? {width, height}
    : {whiteSpace: "nowrap"};

  const tipX = fixed ? penX : `${penX}%`;
  const tipY = fixed ? penY : `${penY}%`;

  return (
    <div style={{position: "absolute", left: x, top: y, ...box, ...style}}>
      <div style={{width: fixed ? "100%" : undefined, height: fixed ? "100%" : undefined, clipPath}}>
        {children}
      </div>
      {toolVisible ? (
        tool === "hand" ? (
          <HandPen
            tipX={tipX}
            tipY={tipY}
            rotate={tilt}
            offsetX={away * DEFAULT_AWAY.x}
            offsetY={away * DEFAULT_AWAY.y}
            scale={0.6}
            {...hand}
          />
        ) : (
          <EraserGraphic
            tipX={tipX}
            tipY={tipY}
            rotate={tilt}
            offsetX={away * DEFAULT_AWAY.x}
            offsetY={away * DEFAULT_AWAY.y}
            color={eraserColor}
          />
        )
      ) : null}
    </div>
  );
};
