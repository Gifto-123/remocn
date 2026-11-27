import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame} from "remotion";
import {DrawOn} from "../DrawOn";
import {MarkerText, type MarkerTextProps} from "../MarkerText";
import type {PlannedSlot} from "../handPlan";
import {EDITORIAL_FONTS, EDITORIAL_PALETTE, beatEnvelope} from "./EditorialCard";

/** Shared scene helpers. Every scene imports these; do not copy them per scene. */
export const TAIL = 8;

/** Image drawn by the hand. Timing comes from planHand(). `src` = staticFile(...). */
export const Pic: React.FC<
  PlannedSlot & {src: string; x: number; y: number; size: number; rotate?: number}
> = ({src, x, y, size, rotate = 0, delay, duration, handEnter, handExit, showHand}) => (
  <DrawOn
    src={src}
    x={x}
    y={y}
    width={size}
    height={size}
    delay={delay}
    duration={duration}
    handEnter={handEnter}
    handExit={handExit}
    showHand={showHand}
    bands={5}
    hand={{scale: 0.55}}
    style={{mixBlendMode: "multiply", transform: `rotate(${rotate}deg)`}}
  />
);

/** Marker text with editorial defaults. Spread a planHand slot into it. */
export const T: React.FC<MarkerTextProps> = (props) => (
  <MarkerText
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