import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";

export type CompanyBuildingPhase = {
  label: string;
  detail?: string;
  progress?: number;
  color?: string;
};

export type CompanyBuildingProps = {
  title?: string;
  subtitle?: string;
  phases: CompanyBuildingPhase[];
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  delay?: number;
  duration?: number;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
};

export const companyBuildingDuration = ({duration = 120}: Pick<CompanyBuildingProps, "duration"> = {}) =>
  Math.max(1, duration);

/** A staged company-building visualization with animated foundations, infrastructure, and growth. */
export const CompanyBuilding: React.FC<CompanyBuildingProps> = ({
  title = "BUILDING THE COMPANY",
  subtitle,
  phases,
  width = 1080,
  height = 620,
  x = 0,
  y = 0,
  delay = 0,
  duration = 120,
  accentColor = "#16a34a",
  backgroundColor = "#f8fafc",
  textColor = "#334155",
  fontFamily = "Arial, sans-serif",
  style,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - delay;
  const safeDuration = Math.max(1, duration);
  const reveal = interpolate(localFrame, [0, safeDuration * 0.42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const baseY = height * 0.82;
  const left = width * 0.1;
  const usableWidth = width * 0.8;
  const columnWidth = phases.length > 0 ? usableWidth / phases.length : usableWidth;
  const defaultColors = ["#94a3b8", "#38bdf8", "#16a34a", "#f59e0b", "#8b5cf6"];

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        overflow: "hidden",
        background: backgroundColor,
        borderRadius: 24,
        fontFamily,
        color: textColor,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: width * 0.07,
          top: height * 0.07,
          maxWidth: width * 0.86,
          fontSize: Math.max(24, width * 0.035),
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: "0.04em",
          opacity: interpolate(localFrame, [0, 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
          transform: `translateY(${interpolate(localFrame, [0, 12], [18, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px)`,
        }}
      >
        {title}
      </div>

      {subtitle ? (
        <div
          style={{
            position: "absolute",
            left: width * 0.07,
            top: height * 0.145,
            fontSize: Math.max(14, width * 0.018),
            color: "#64748b",
            opacity: interpolate(localFrame, [8, 22], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
          }}
        >
          {subtitle}
        </div>
      ) : null}

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}
        aria-label="Animated company building stages"
      >
        <line
          x1={left}
          y1={baseY}
          x2={left + usableWidth}
          y2={baseY}
          stroke="#94a3b8"
          strokeWidth={4}
          opacity={reveal}
        />

        {phases.map((phase, index) => {
          const start = safeDuration * (0.12 + index * (0.58 / Math.max(1, phases.length)));
          const phaseReveal = interpolate(localFrame - start, [0, 24], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.back(1.15)),
          });
          const phaseProgress = Math.max(0.18, Math.min(1, phase.progress ?? (index + 1) / phases.length));
          const stageHeight = height * (0.34 * phaseProgress);
          const cx = left + columnWidth * (index + 0.5);
          const color = phase.color ?? defaultColors[index % defaultColors.length];

          return (
            <g key={`${phase.label}-${index}`} opacity={phaseReveal}>
              <rect
                x={cx - columnWidth * 0.28}
                y={baseY - stageHeight}
                width={columnWidth * 0.56}
                height={stageHeight}
                rx={12}
                fill={color}
                transform={`scale(1 ${phaseReveal})`}
                style={{transformOrigin: `${cx}px ${baseY}px`}}
              />
              <rect
                x={cx - columnWidth * 0.34}
                y={baseY - stageHeight - height * 0.055}
                width={columnWidth * 0.68}
                height={height * 0.055}
                rx={8}
                fill="#ffffff"
                stroke={color}
                strokeWidth={3}
              />
              <circle cx={cx} cy={baseY - stageHeight - height * 0.0275} r={Math.max(6, width * 0.012)} fill={color} />
              <line
                x1={cx}
                y1={baseY - stageHeight - height * 0.035}
                x2={cx}
                y2={baseY - stageHeight - height * 0.19}
                stroke={color}
                strokeWidth={4}
              />
              <circle
                cx={cx}
                cy={baseY - stageHeight - height * 0.19}
                r={Math.max(8, width * 0.016)}
                fill={accentColor}
                stroke="#ffffff"
                strokeWidth={4}
              />
            </g>
          );
        })}
      </svg>

      {phases.map((phase, index) => {
        const start = safeDuration * (0.22 + index * (0.58 / Math.max(1, phases.length)));
        const phaseReveal = interpolate(localFrame - start, [0, 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const cx = left + columnWidth * (index + 0.5);

        return (
          <div
            key={`label-${phase.label}-${index}`}
            style={{
              position: "absolute",
              left: cx - columnWidth * 0.43,
              top: height * 0.84,
              width: columnWidth * 0.86,
              textAlign: "center",
              opacity: phaseReveal,
              transform: `translateY(${interpolate(localFrame - start, [0, 18], [12, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px)`,
            }}
          >
            <div style={{fontSize: Math.max(12, width * 0.017), fontWeight: 800, letterSpacing: "0.02em"}}>
              {phase.label}
            </div>
            {phase.detail ? (
              <div style={{marginTop: 6, fontSize: Math.max(10, width * 0.013), color: "#64748b", lineHeight: 1.25}}>
                {phase.detail}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default CompanyBuilding;
