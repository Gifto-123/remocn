import React from "react";
import {Img, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {EDITORIAL_PALETTE, EDITORIAL_FONTS, springPop} from "../core/theme";

/** Theme tokens moved to core/theme.ts; re-exported so existing imports keep working. */
export * from "../core/theme";

export type YearBadgeProps = {
  label: string;
  backgroundColor?: string;
  textColor?: string;
  style?: React.CSSProperties;
};

/** Pill badge used for years, labels, and status stamps. */
export const YearBadge: React.FC<YearBadgeProps> = ({
  label,
  backgroundColor = EDITORIAL_PALETTE.slate,
  textColor = "#FFFFFF",
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px 22px",
      borderRadius: 999,
      backgroundColor,
      color: textColor,
      fontFamily: EDITORIAL_FONTS.mono,
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.06em",
      border: `2.5px solid ${EDITORIAL_PALETTE.ink}`,
      boxShadow: `0 4px 0 ${EDITORIAL_PALETTE.ink}`,
      ...style,
    }}
  >
    {label}
  </div>
);

export type EditorialCardProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  delay?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  padding?: number | string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

/** Clean editorial paper card with dark ink outline and subtle offset shadow. */
export const EditorialCard: React.FC<EditorialCardProps> = ({
  x,
  y,
  width,
  height,
  delay = 0,
  backgroundColor = EDITORIAL_PALETTE.paperCard,
  borderColor = EDITORIAL_PALETTE.ink,
  borderRadius = 28,
  padding = 32,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = springPop(frame, fps, delay);
  const opacity = interpolate(frame - delay, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(pop, [0, 1], [28, 0]);
  const scale = interpolate(pop, [0, 1], [0.95, 1]);

  if (frame < delay) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        boxSizing: "border-box",
        backgroundColor,
        borderRadius,
        border: `3.5px solid ${borderColor}`,
        boxShadow: `0 10px 0 ${EDITORIAL_PALETTE.shadow}, 0 22px 44px rgba(34, 34, 34, 0.08)`,
        padding,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: "center center",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export type CharacterSpriteProps = {
  src: string;
  x: number;
  y: number;
  height: number;
  /** Aspect ratio width/height; defaults to 640/1024 for normalized Dana sprites. */
  aspectRatio?: number;
  delay?: number;
  /** Subtle breathing amplitude (0 disables). Default 0.012. */
  breathe?: number;
  opacity?: number;
  style?: React.CSSProperties;
};

/** Renders a normalized character PNG with bottom-anchored breathing motion. */
export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  src,
  x,
  y,
  height,
  aspectRatio = 640 / 1024,
  delay = 0,
  breathe = 0.012,
  opacity = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const width = Math.round(height * aspectRatio);

  const pop = springPop(frame, fps, delay, {damping: 14, stiffness: 155});
  const enterOpacity = interpolate(frame - delay, [0, 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enterY = interpolate(pop, [0, 1], [34, 0]);
  const scalePop = interpolate(pop, [0, 1], [0.92, 1]);
  const idleY = breathe > 0 ? Math.sin((frame - delay) * 0.08) * breathe : 0;

  if (frame < delay) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        opacity: enterOpacity * opacity,
        transform: `translateY(${enterY}px) scale(${scalePop}, ${scalePop * (1 + idleY)})`,
        transformOrigin: "50% 96%",
        pointerEvents: "none",
        ...style,
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
};
