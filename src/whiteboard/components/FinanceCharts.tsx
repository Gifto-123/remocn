import React, {useId} from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {EDITORIAL_PALETTE as P} from "./EditorialCard";
import {INK} from "./DrawnProps";

/**
 * Finance charts, no labels (density rules: scenes add ≤2 texts).
 * Reveal the whole chart with <Draw {...slot}>; set `from`/`dur` so the data animation
 * starts after the reveal (from ≈ slot.delay + slot.handEnter + slot.duration).
 */
const useProgress = (from: number, dur: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, from + Math.max(1, dur)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
};

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");

/** Budget split (e.g. 50/30/20). */
export const DonutChart: React.FC<{
  data: {value: number; color: string}[];
  size: number;
  thickness?: number;
  from?: number;
  dur?: number;
}> = ({data, size, thickness = 120, from = 0, dur = 45}) => {
  const p = useProgress(from, dur);
  const c = size / 2;
  const r = (size - thickness) / 2 - 6;
  const C = 2 * Math.PI * r;
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const starts = data.reduce<number[]>((a, _d, i) => {
    a.push(i === 0 ? 0 : a[i - 1] + (data[i - 1].value / total) * C);
    return a;
  }, []);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${c} ${c})`}>
        {data.map((d, i) => {
          const len = (d.value / total) * C;
          const drawn = Math.min(len, Math.max(0, p * C - starts[i]));
          return drawn > 0 ? (
            <circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${drawn} ${C - drawn}`}
              strokeDashoffset={-starts[i]}
            />
          ) : null;
        })}
      </g>
      <circle cx={c} cy={c} r={r + thickness / 2} fill="none" strokeWidth={7} {...INK} />
      <circle cx={c} cy={c} r={r - thickness / 2} fill="none" strokeWidth={7} {...INK} />
      {starts.map((s, i) => {
        if (p * C < s || i === 0) return null;
        const a = (s / C) * 2 * Math.PI - Math.PI / 2;
        const x1 = c + (r - thickness / 2) * Math.cos(a);
        const y1 = c + (r - thickness / 2) * Math.sin(a);
        const x2 = c + (r + thickness / 2) * Math.cos(a);
        const y2 = c + (r + thickness / 2) * Math.sin(a);
        return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth={6} {...INK} />;
      })}
    </svg>
  );
};

/** Contributions vs compounded balance. `rate` = annual %, monthly contribution, `years`. */
export const CompoundGrowth: React.FC<{
  width: number;
  height: number;
  monthly: number;
  rate: number;
  years: number;
  from?: number;
  dur?: number;
}> = ({width, height, monthly, rate, years, from = 0, dur = 60}) => {
  const p = useProgress(from, dur);
  const uid = safeId(useId());
  const pad = 40;
  const total: number[] = [0];
  let bal = 0;
  for (let m = 1; m <= years * 12; m++) {
    bal = bal * (1 + rate / 100 / 12) + monthly;
    if (m % 12 === 0) total.push(bal);
  }
  const contrib = total.map((_, y) => monthly * 12 * y);
  const maxV = Math.max(1, total[total.length - 1]);
  const px = (i: number) => pad + (i / years) * (width - pad * 2);
  const py = (v: number) => height - pad - (v / maxV) * (height - pad * 2);
  const line = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${px(i)} ${py(v)}`).join("");
  const area = `${line(total)}${contrib
    .map((v, i) => `L${px(contrib.length - 1 - i)} ${py(contrib[contrib.length - 1 - i])}`)
    .join("")}Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <clipPath id={`cg-${uid}`}>
          <rect x={0} y={0} width={width * p} height={height} />
        </clipPath>
      </defs>
      <path d={`M${pad} ${pad}V${height - pad}H${width - pad}`} fill="none" strokeWidth={8} {...INK} />
      <g clipPath={`url(#cg-${uid})`}>
        <path d={area} fill={P.mustard} opacity={0.45} />
        <path d={line(contrib)} fill="none" stroke={P.slate} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d={line(total)} fill="none" stroke={P.sageDark} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

/** Semicircle gauge (credit score 300–850 by default). */
export const Gauge: React.FC<{
  value: number;
  min?: number;
  max?: number;
  size: number;
  from?: number;
  dur?: number;
}> = ({value, min = 300, max = 850, size, from = 0, dur = 45}) => {
  const p = useProgress(from, dur);
  const cx = 200;
  const cy = 210;
  const R = 160;
  const pt = (deg: number, rad: number) => ({
    x: cx + rad * Math.cos((deg * Math.PI) / 180),
    y: cy + rad * Math.sin((deg * Math.PI) / 180),
  });
  const arc = (a0: number, a1: number, rad: number) => {
    const s = pt(a0, rad);
    const e = pt(a1, rad);
    return `M${s.x} ${s.y}A${rad} ${rad} 0 0 1 ${e.x} ${e.y}`;
  };
  const colors = [P.crimson, P.terracotta, P.mustard, P.sage, P.sageDark];
  const frac = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const tip = pt(180 + frac * 180 * p, 128);
  return (
    <svg width={size} height={(size * 260) / 400} viewBox="0 0 400 260">
      <path d={arc(180, 360, R)} fill="none" stroke={P.ink} strokeWidth={60} strokeLinecap="round" />
      {colors.map((col, i) => (
        <path key={i} d={arc(180 + i * 36, 216 + i * 36, R)} fill="none" stroke={col} strokeWidth={46} />
      ))}
      <path d={`M${cx} ${cy}L${tip.x} ${tip.y}`} strokeWidth={11} {...INK} />
      <circle cx={cx} cy={cy} r={22} fill={P.ink} />
    </svg>
  );
};

/** Goal bar (emergency fund etc.). `progress` 0..1. */
export const ProgressBar: React.FC<{
  progress: number;
  width: number;
  height?: number;
  color?: string;
  ticks?: number;
  from?: number;
  dur?: number;
}> = ({progress, width, height = 100, color = P.sage, ticks = 0, from = 0, dur = 45}) => {
  const p = useProgress(from, dur);
  const inner = width - 24;
  const fillW = Math.max(0, inner * Math.min(1, progress) * p);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x={4} y={4} width={width - 8} height={height - 8} rx={(height - 8) / 2} fill={P.paperAlt} strokeWidth={8} {...INK} />
      {fillW > 0 ? (
        <rect x={12} y={12} width={Math.max(fillW, height - 24)} height={height - 24} rx={(height - 24) / 2} fill={color} strokeWidth={5} {...INK} />
      ) : null}
      {Array.from({length: ticks}, (_, i) => {
        const x = 12 + (inner * (i + 1)) / (ticks + 1);
        return <path key={i} d={`M${x} 12V${height - 12}`} strokeWidth={4} opacity={0.5} {...INK} />;
      })}
    </svg>
  );
};
