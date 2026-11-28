import React from "react";
import {Easing, Img, interpolate, useCurrentFrame} from "remotion";
import {HandPen, type HandPenProps} from "./HandPen";
import {reveal, type RevealMode} from "./path";

export type DrawOnProps = {
  /** Image to draw, e.g. staticFile("assets/character-man.png"). Or pass `children` instead. */
  src?: string;
  /** Anything else to draw (text, shapes). Used when `src` is not set. */
  children?: React.ReactNode;
  /**
   * Display size in px (use fit() from ./assets to keep an image's aspect ratio).
   * Leave both out to size the box to its children, e.g. a line of text.
   */
  width?: number;
  height?: number;
  /** Top-left position inside the parent, in px. The element is position: absolute. */
  x?: number;
  y?: number;

  /** Frames to wait before the hand starts coming in. Default 0. */
  delay?: number;
  /** Frames the pen spends drawing. Default 60 (2 s at 30 fps). */
  duration?: number;
  /** Frames the hand takes to slide in before drawing. Default 8. */
  handEnter?: number;
  /** Frames the hand takes to slide out after drawing. Default 10. */
  handExit?: number;

  /** "serpentine" (default) for pictures, "sweep" for words and labels. */
  mode?: RevealMode;
  /**
   * serpentine only: how many horizontal passes the pen makes. Default 6.
   * Rule of thumb: keep duration / bands >= 8 frames, or the pen looks frantic.
   */
  bands?: number;
  /** How many up-and-down scribbles per pass. Default 3. */
  scribbles?: number;
  /** sweep only: constant pen speed instead of easing in and out. Default false. */
  linear?: boolean;

  /** Set false to reveal without the hand. Default true. */
  showHand?: boolean;
  /** Hand size, tip and image overrides. */
  hand?: Pick<HandPenProps, "scale" | "src" | "tip" | "size">;

  style?: React.CSSProperties;
};

/** Total frames a DrawOn occupies (delay not included). Handy for sequencing. */
export const drawOnDuration = ({
  duration = 60,
  handEnter = 8,
  handExit = 10,
}: Pick<DrawOnProps, "duration" | "handEnter" | "handExit"> = {}) =>
  handEnter + duration + handExit;

export const DrawOn: React.FC<DrawOnProps> = ({
  src,
  children,
  width,
  height,
  x = 0,
  y = 0,
  delay = 0,
  duration = 60,
  handEnter = 8,
  handExit = 10,
  mode = "serpentine",
  bands = 6,
  scribbles = 3,
  linear = false,
  showHand = true,
  hand,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay; // local frame, 0 = the hand starts to come in

  const drawStart = handEnter;
  const drawEnd = handEnter + Math.max(1, duration);
  const total = drawEnd + handExit;
  // Keep interpolation ranges strictly increasing even when a caller wants
  // an immediate hand entry/exit (for example when chaining two drawings).
  const safeEnterEnd = Math.max(1, handEnter);
  const safeExitEnd = drawEnd + Math.max(1, handExit);

  const progress = interpolate(f, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fixed size: work in px. No size: the box wraps its children, so work in %.
  const fixed = width !== undefined && height !== undefined;
  const unit = fixed ? "px" : "%";
  const {penX, penY, clipPath} = reveal(
    mode,
    progress,
    fixed ? width : 100,
    fixed ? height : 100,
    bands,
    scribbles,
    {unit, linear},
  );

  // 1 = hand fully off-screen (bottom right), 0 = on the paper.
  const slideIn = interpolate(f, [0, safeEnterEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const slideOut = interpolate(f, [drawEnd, safeExitEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const away = slideIn + slideOut;

  const drawing = f >= drawStart && f <= drawEnd;
  const tilt = drawing ? Math.sin(f * 0.45) * 1.6 : 0;

  const handVisible = showHand && f >= 0 && f < total;

  const box: React.CSSProperties = fixed
    ? {width, height}
    : {whiteSpace: "nowrap"};

  return (
    <div style={{position: "absolute", left: x, top: y, ...box, ...style}}>
      {src ? (
        <Img
          src={src}
          style={{width: "100%", height: "100%", display: "block", clipPath}}
        />
      ) : (
        <div style={{clipPath}}>{children}</div>
      )}
      {handVisible ? (
        <HandPen
          tipX={fixed ? penX : `${penX}%`}
          tipY={fixed ? penY : `${penY}%`}
          rotate={tilt}
          offsetX={away * 340}
          offsetY={away * 460}
          {...hand}
        />
      ) : null}
    </div>
  );
};
