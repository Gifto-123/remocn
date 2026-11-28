import React, {useId} from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";

export type PaperVariant = "paper" | "dots" | "grid" | "lined" | "plain";

export type PaperSurfaceProps = {
  /** Surface pattern over the paper base. Default "paper". */
  variant?: PaperVariant;
  /** Base paper/board colour. Default warm off-white "#fcfbf7". */
  backgroundColor?: string;
  /** Subtle SVG paper-fiber grain strength (0..1). Default 0.045. */
  grain?: number;
  /** Dot, grid, or notebook line colour. Default "rgba(17, 24, 39, 0.08)". */
  patternColor?: string;
  /** Spacing of dots, grid squares, or ruled lines in px. Default 48. */
  spacing?: number;
  /** Soft corner studio lighting vignette (0..1). Default 0.08. */
  vignette?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");

/**
 * Tactile whiteboard / paper background with optional dot-grid, square grid,
 * ruled lines, SVG paper grain, and soft corner vignette.
 */
export const PaperSurface: React.FC<PaperSurfaceProps> = ({
  variant = "paper",
  backgroundColor = "#fcfbf7",
  grain = 0.045,
  patternColor = "rgba(17, 24, 39, 0.085)",
  spacing = 48,
  vignette = 0.08,
  children,
  style,
}) => {
  const uid = sanitizeId(useId());
  const grainId = `paper-grain-${uid}`;
  const patId = `paper-pat-${uid}`;

  return (
    <AbsoluteFill style={{backgroundColor, overflow: "hidden", ...style}}>
      {/* Pattern layer (dots / grid / ruled lines) */}
      {variant === "dots" || variant === "grid" || variant === "lined" ? (
        <svg
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          <defs>
            <pattern
              id={patId}
              width={spacing}
              height={spacing}
              patternUnits="userSpaceOnUse"
            >
              {variant === "dots" ? (
                <circle
                  cx={spacing / 2}
                  cy={spacing / 2}
                  r={2.2}
                  fill={patternColor}
                />
              ) : variant === "grid" ? (
                <path
                  d={`M ${spacing} 0 L 0 0 0 ${spacing}`}
                  fill="none"
                  stroke={patternColor}
                  strokeWidth={1.5}
                />
              ) : (
                <line
                  x1={0}
                  y1={spacing}
                  x2={spacing}
                  y2={spacing}
                  stroke={patternColor}
                  strokeWidth={1.8}
                />
              )}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patId})`} />
        </svg>
      ) : null}

      {/* Paper fiber grain */}
      {grain > 0 ? (
        <svg
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            inset: 0,
            opacity: grain,
            pointerEvents: "none",
          }}
        >
          <defs>
            <filter id={grainId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.75"
                numOctaves={3}
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter={`url(#${grainId})`} />
        </svg>
      ) : null}

      {/* Soft overhead studio vignette */}
      {vignette > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 45%, transparent 55%, rgba(15, 23, 42, ${vignette}) 100%)`,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {children}
    </AbsoluteFill>
  );
};

export type InkBoilFilterProps = {
  /** Edge displacement amount in px. Default 2.5. */
  intensity?: number;
  /** Noise frequency (higher = finer grain wobble). Default 0.035. */
  frequency?: number;
  /** Frames between boil steps when `boil` is true. Default 4. */
  every?: number;
  /** Animate the hand-inked wobble over time. Set false for static wobble. Default true. */
  boil?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

/**
 * Applies an SVG turbulence displacement filter stepped every `every` frames
 * so clean fonts, SVG frames, and illustrations get an authentic hand-inked
 * "living line" boil.
 */
export const InkBoilFilter: React.FC<InkBoilFilterProps> = ({
  intensity = 2.5,
  frequency = 0.035,
  every = 4,
  boil = true,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const uid = sanitizeId(useId());
  const filterId = `ink-boil-${uid}`;
  const seed = boil && every > 0 ? Math.floor(frame / every) + 1 : 1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        ...style,
      }}
    >
      {intensity > 0 ? (
        <svg
          width={0}
          height={0}
          style={{position: "absolute", pointerEvents: "none"}}
          aria-hidden
        >
          <defs>
            <filter
              id={filterId}
              x="-5%"
              y="-5%"
              width="110%"
              height="110%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency={frequency}
                numOctaves={2}
                seed={seed}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={intensity}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      ) : null}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          filter: intensity > 0 ? `url(#${filterId})` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
