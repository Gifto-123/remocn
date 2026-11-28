import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame} from "remotion";
import {DrawOn} from "../DrawOn";
import {MarkerText, type MarkerTextProps} from "../MarkerText";
import {NumberCounter, type NumberCounterProps} from "../NumberCounter";
import {CANVAS_PRESETS} from "../presets";
import type {PlannedSlot} from "../handPlan";
import {EDITORIAL_FONTS, EDITORIAL_PALETTE, beatEnvelope} from "./EditorialCard";

/**
 * Shared scene helpers for the locked 9:16 canvas (1080×1920).
 * Every scene imports these; do not copy them per scene.
 */
export const TAIL = 8;
export const W = CANVAS_PRESETS.youtubeShort.width; // 1080
export const H = CANVAS_PRESETS.youtubeShort.height; // 1920

/** Shorts UI safe zone. Text and key visuals stay inside. */
export const SAFE = {left: 60, right: 960, top: 200, bottom: 1480, width: 900, height: 1280} as const;

/** Estimated caps width (Manrope 800): 0.7 × fontSize × chars. */
export const textW = (text: string, fontSize: number) => Math.round(0.7 * fontSize * text.length);
export const centerX = (width: number) => Math.round((W - width) / 2);

/** Largest fontSize ≤ `ideal` that fits the safe width. Warns if even `min` overflows. */
export const fitFont = (text: string, ideal: number, min = 80, maxW: number = SAFE.width) => {
  const fit = Math.floor(maxW / (0.7 * Math.max(1, text.length)));
  if (fit < min) {
    console.warn(`[SceneKit] "${text}" needs ${textW(text, min)}px at ${min}px > ${maxW}px. Cut words or break the line.`);
  }
  return Math.max(min, Math.min(ideal, fit));
};

/**
 * Image drawn by the hand. Spread a planHand slot into it.
 * Square: `size`. Rectangle / full-bleed: `w` + `h`. `x` defaults to centered.
 * No blend modes, no rotation by default (style lock).
 */
export const Pic: React.FC<
  PlannedSlot & {src: string; y: number; x?: number; size?: number; w?: number; h?: number; rotate?: number}
> = ({src, y, x, size = 900, w, h, rotate = 0, delay, duration, handEnter, handExit, showHand, hand}) => {
  const width = w ?? size;
  const height = h ?? size;
  return (
    <DrawOn
      src={src}
      x={x ?? centerX(width)}
      y={y}
      width={width}
      height={height}
      delay={delay}
      duration={duration}
      handEnter={handEnter}
      handExit={handExit}
      showHand={showHand}
      hand={hand}
      bands={5}
      style={rotate ? {transform: `rotate(${rotate}deg)`} : undefined}
    />
  );
};

/** Marker text with editorial defaults. Spread a planHand slot into it. */
export const T: React.FC<MarkerTextProps> = (props) => (
  <MarkerText
    fontFamily={EDITORIAL_FONTS.head}
    fontWeight={800}
    color={EDITORIAL_PALETTE.ink}
    {...props}
  />
);

/** Centered, auto-fitted marker text inside the safe zone. `x` is computed. */
export const CT: React.FC<
  Omit<MarkerTextProps, "x" | "text" | "parts" | "fontSize"> & {text: string; fontSize: number; minFont?: number}
> = ({text, fontSize, minFont = 80, ...rest}) => {
  const size = fitFont(text, fontSize, minFont);
  return <T {...rest} text={text} fontSize={size} x={centerX(textW(text, size))} />;
};

/** NumberCounter with editorial font defaults. Not a pen action; no planHand slot. */
export const Num: React.FC<NumberCounterProps> = (props) => (
  <NumberCounter
    fontFamily={EDITORIAL_FONTS.head}
    fontWeight={800}
    color={EDITORIAL_PALETTE.ink}
    {...props}
  />
);

const Fade: React.FC<{duration: number; children: React.ReactNode}> = ({duration, children}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: beatEnvelope(frame, duration, 6, 10)}}>{children}</AbsoluteFill>
  );
};

/** Beat window in absolute frames. Children use beat-local frames (0 = `from`). */
export const Beat: React.FC<{
  from: number;
  to: number;
  last?: boolean;
  children: React.ReactNode;
}> = ({from, to, last = false, children}) => {
  const duration = to - from + (last ? 0 : TAIL);
  return (
    <Sequence from={from} durationInFrames={duration}>
      <Fade duration={duration}>{children}</Fade>
    </Sequence>
  );
};
