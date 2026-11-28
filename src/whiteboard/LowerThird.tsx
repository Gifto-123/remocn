import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {EDITORIAL_FONTS, EDITORIAL_PALETTE as P} from "./components/EditorialCard";

export type LowerThirdProps = {
  /** Source text, e.g. "SiTime · SEC filing". */
  text: string;
  /** Small tag on the left. Default "SOURCE". */
  label?: string;
  /** Top-left position in px. Default bottom-left safe area. */
  x?: number;
  y?: number;
  /** Beat-local frame it starts sliding in. Default 0. */
  delay?: number;
  /** Slide-in frames. Default 12. */
  duration?: number;
  /** Tag colour. Default terracotta. */
  accent?: string;
  /** Text size in px. Default 34. */
  fontSize?: number;
};

/** Source credit that slides in from the left. No pen: it never occupies the hand. */
export const LowerThird: React.FC<LowerThirdProps> = ({
  text,
  label = "SOURCE",
  x = 110,
  y = 900,
  delay = 0,
  duration = 12,
  accent = P.terracotta,
  fontSize = 34,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, Math.max(1, duration)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "stretch",
        height: 76,
        borderRadius: 14,
        overflow: "hidden",
        border: `3px solid ${P.ink}`,
        boxShadow: `6px 6px 0 ${P.shadow}`,
        opacity: p,
        transform: `translateX(${(1 - p) * -60}px)`,
        fontFamily: EDITORIAL_FONTS.head,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 22px",
          background: accent,
          color: P.paper,
          fontSize: Math.round(fontSize * 0.75),
          fontWeight: 800,
          letterSpacing: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          background: P.paperCard,
          color: P.ink,
          fontSize,
          fontWeight: 700,
        }}
      >
        {text}
      </div>
    </div>
  );
};
