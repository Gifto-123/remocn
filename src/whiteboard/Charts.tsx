import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {
  annotationFrames,
  penAlongStrokes,
  polylineLength,
  type Point,
  type Stroke,
} from "./Annotations";
import {HandPen, type HandPenProps} from "./HandPen";
import {MARKER_FONT_STACK} from "./MarkerText";
import {DEFAULT_AWAY} from "./timeline";

export type BarDatum = {
  label: string;
  value: number;
  color?: string;
  /** Optional formatted value shown above the bar (e.g. "$174k"). */
  displayValue?: string;
};

export type LineSeries = {
  data: number[];
  color?: string;
  label?: string;
  /** Optional soft area tint under the curve. */
  fill?: boolean;
};

type CommonChartProps = {
  x?: number;
  y?: number;
  width: number;
  height: number;
  axisColor?: string;
  strokeWidth?: number;
  showGrid?: boolean;
  fontFamily?: string;
  delay?: number;
  duration?: number;
  handEnter?: number;
  handExit?: number;
  showHand?: boolean;
  hand?: Pick<HandPenProps, "scale" | "src" | "tip" | "size">;
  style?: React.CSSProperties;
};

export type HandBarChartProps = CommonChartProps & {
  data: BarDatum[];
  maxValue?: number;
  barColor?: string;
  fillOpacity?: number;
  showValues?: boolean;
  showLabels?: boolean;
};

export type HandLineChartProps = CommonChartProps & {
  /** Single series values (use `series` instead for multiple lines). */
  data?: number[];
  series?: LineSeries[];
  labels?: string[];
  minValue?: number;
  maxValue?: number;
  color?: string;
  smooth?: boolean;
  showDots?: boolean;
};

export const CHART_DEFAULTS = {
  axisColor: "#111111",
  barColor: "#3aa845",
  lineColor: "#3aa845",
  strokeWidth: 9,
  fillOpacity: 0.24,
  fontFamily: MARKER_FONT_STACK,
  handEnter: 8,
  handExit: 10,
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ease = Easing.inOut(Easing.sin);
const r2 = (n: number) => Math.round(n * 100) / 100;

const bowedLine = (a: Point, b: Point, bow = 0.015, steps = 12): Stroke => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const c = {
    x: (a.x + b.x) / 2 + nx * bow * dist,
    y: (a.y + b.y) / 2 + ny * bow * dist,
  };
  const pts: Stroke = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    });
  }
  return pts;
};

const buildAxesGeometry = (
  width: number,
  height: number,
  {
    leftPad = 42,
    rightPad = 24,
    topPad = 62,
    bottomPad = 76,
  }: {
    leftPad?: number;
    rightPad?: number;
    topPad?: number;
    bottomPad?: number;
  } = {},
) => {
  const px = leftPad;
  const py = topPad;
  const pw = Math.max(80, width - leftPad - rightPad);
  const ph = Math.max(80, height - topPad - bottomPad);

  const yAxis = bowedLine({x: px, y: py}, {x: px, y: py + ph}, -0.012, 16);
  const xAxis = bowedLine(
    {x: px, y: py + ph},
    {x: px + pw, y: py + ph},
    0.01,
    20,
  );
  return {px, py, pw, ph, yAxis, xAxis};
};

type ColoredStroke = {
  pts: Stroke;
  color: string;
  strokeWidth: number;
};

const renderColoredStrokes = (
  items: ColoredStroke[],
  lens: number[],
  dist: number,
) => {
  let before = 0;
  return items.map((s, i) => {
    const len = lens[i];
    const drawn = Math.min(len, Math.max(0, dist - before));
    before += len;
    if (drawn <= 0.01) return null;
    return (
      <polyline
        key={i}
        points={s.pts.map((p) => `${r2(p.x)},${r2(p.y)}`).join(" ")}
        fill="none"
        stroke={s.color}
        strokeWidth={s.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len - drawn}
      />
    );
  });
};

/* ---------- 1. Bar Chart ---------- */

export const buildBarChartGeometry = ({
  data,
  width,
  height,
  maxValue,
  axisColor = CHART_DEFAULTS.axisColor,
  barColor = CHART_DEFAULTS.barColor,
  strokeWidth = CHART_DEFAULTS.strokeWidth,
}: {
  data: BarDatum[];
  width: number;
  height: number;
  maxValue?: number;
  axisColor?: string;
  barColor?: string;
  strokeWidth?: number;
}) => {
  const {px, py, pw, ph, yAxis, xAxis} = buildAxesGeometry(width, height);
  const maxV = Math.max(
    1,
    maxValue ?? Math.max(...data.map((d) => d.value), 0) * 1.15,
  );
  const count = Math.max(1, data.length);
  const slotW = pw / count;
  const barW = Math.min(120, slotW * 0.56);

  const strokes: ColoredStroke[] = [
    {pts: yAxis, color: axisColor, strokeWidth},
    {pts: xAxis, color: axisColor, strokeWidth},
  ];

  const bars = data.map((d, i) => {
    const ratio = clamp01(d.value / maxV);
    const barH = Math.max(14, ratio * (ph - 16));
    const bx = px + slotW * i + (slotW - barW) / 2;
    const by = py + ph - barH;
    const col = d.color ?? barColor;

    // Drawn up left side -> across top -> down right side
    const leftEdge = bowedLine({x: bx, y: py + ph}, {x: bx, y: by}, -0.015, 10);
    const topEdge = bowedLine({x: bx, y: by}, {x: bx + barW, y: by}, -0.025, 8);
    const rightEdge = bowedLine(
      {x: bx + barW, y: by},
      {x: bx + barW, y: py + ph},
      0.015,
      10,
    );
    const outline: Stroke = [
      ...leftEdge,
      ...topEdge.slice(1),
      ...rightEdge.slice(1),
    ];
    const fillPath =
      `M ${r2(outline[0].x)} ${r2(outline[0].y)} ` +
      outline
        .slice(1)
        .map((p) => `L ${r2(p.x)} ${r2(p.y)}`)
        .join(" ") +
      " Z";

    strokes.push({pts: outline, color: col, strokeWidth});

    return {
      datum: d,
      bx,
      by,
      barW,
      barH,
      color: col,
      fillPath,
      strokeIndex: 2 + i,
    };
  });

  const rawStrokes = strokes.map((s) => s.pts);
  const lens = rawStrokes.map(polylineLength);
  const totalLen = lens.reduce((a, b) => a + b, 0);

  return {px, py, pw, ph, strokes, rawStrokes, lens, totalLen, bars};
};

export const barChartFrames = (
  props: Parameters<typeof buildBarChartGeometry>[0],
) => annotationFrames(buildBarChartGeometry(props).rawStrokes, 32);

export const barChartDuration = ({
  duration,
  handEnter = CHART_DEFAULTS.handEnter,
  handExit = CHART_DEFAULTS.handExit,
  ...rest
}: Pick<
  HandBarChartProps,
  | "data"
  | "width"
  | "height"
  | "maxValue"
  | "axisColor"
  | "barColor"
  | "strokeWidth"
  | "duration"
  | "handEnter"
  | "handExit"
>) => handEnter + (duration ?? barChartFrames(rest)) + handExit;

export const BarChartGraphic: React.FC<{
  geom: ReturnType<typeof buildBarChartGeometry>;
  width: number;
  height: number;
  progress: number;
  fillOpacity: number;
  showGrid: boolean;
  showValues: boolean;
  showLabels: boolean;
  fontFamily: string;
}> = ({
  geom,
  width,
  height,
  progress,
  fillOpacity,
  showGrid,
  showValues,
  showLabels,
  fontFamily,
}) => {
  const eased = ease(clamp01(progress));
  const dist = eased * geom.totalLen;

  // Cumulative length starts for each stroke
  const starts: number[] = [];
  let acc = 0;
  for (const len of geom.lens) {
    starts.push(acc);
    acc += len;
  }
  const axisFade = clamp01(dist / Math.max(1, geom.lens[0] + geom.lens[1]));

  return (
    <div style={{position: "relative", width, height}}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}
      >
        {showGrid
          ? [0.25, 0.5, 0.75, 1].map((g, i) => {
              const gy = geom.py + geom.ph * (1 - g);
              return (
                <line
                  key={i}
                  x1={geom.px}
                  y1={gy}
                  x2={geom.px + geom.pw}
                  y2={gy}
                  stroke="#e5e7eb"
                  strokeWidth={3}
                  strokeDasharray="10 10"
                  opacity={axisFade}
                />
              );
            })
          : null}

        {geom.bars.map((b, i) => {
          const bLen = geom.lens[b.strokeIndex];
          const bDone = clamp01((dist - starts[b.strokeIndex]) / Math.max(1, bLen));
          const fOp = clamp01((bDone - 0.65) / 0.35) * fillOpacity;
          if (fOp <= 0) return null;
          return <path key={i} d={b.fillPath} fill={b.color} opacity={fOp} />;
        })}

        {renderColoredStrokes(geom.strokes, geom.lens, dist)}
      </svg>

      {geom.bars.map((b, i) => {
        const bLen = geom.lens[b.strokeIndex];
        const bDone = clamp01((dist - starts[b.strokeIndex]) / Math.max(1, bLen));
        const valOp = clamp01((bDone - 0.75) / 0.25);
        return (
          <React.Fragment key={i}>
            {showValues && valOp > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: b.bx + b.barW / 2,
                  top: b.by - 50,
                  transform: `translateX(-50%) scale(${0.85 + 0.15 * valOp})`,
                  opacity: valOp,
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 34,
                  color: b.color,
                  whiteSpace: "nowrap",
                }}
              >
                {b.datum.displayValue ?? String(b.datum.value)}
              </div>
            ) : null}
            {showLabels && axisFade > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: b.bx + b.barW / 2,
                  top: geom.py + geom.ph + 18,
                  transform: "translateX(-50%)",
                  opacity: axisFade,
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 32,
                  color: "#333333",
                  whiteSpace: "nowrap",
                }}
              >
                {b.datum.label}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Hand-drawn bar chart with animated axes, bar outlines, soft fills, and value pop-ins. */
export const HandBarChart: React.FC<HandBarChartProps> = ({
  data,
  x = 0,
  y = 0,
  width,
  height,
  maxValue,
  axisColor = CHART_DEFAULTS.axisColor,
  barColor = CHART_DEFAULTS.barColor,
  strokeWidth = CHART_DEFAULTS.strokeWidth,
  fillOpacity = CHART_DEFAULTS.fillOpacity,
  showGrid = true,
  showValues = true,
  showLabels = true,
  fontFamily = CHART_DEFAULTS.fontFamily,
  delay = 0,
  duration,
  handEnter = CHART_DEFAULTS.handEnter,
  handExit = CHART_DEFAULTS.handExit,
  showHand = true,
  hand,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  const geom = buildBarChartGeometry({
    data,
    width,
    height,
    maxValue,
    axisColor,
    barColor,
    strokeWidth,
  });
  const frames = duration ?? annotationFrames(geom.rawStrokes, 32);
  const drawStart = handEnter;
  const drawEnd = handEnter + frames;
  const total = drawEnd + handExit;

  const progress = interpolate(f, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dist = ease(progress) * geom.totalLen;
  const pen = penAlongStrokes(geom.rawStrokes, dist);

  const slideIn = interpolate(f, [0, handEnter], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const slideOut = interpolate(f, [drawEnd, total], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const away = slideIn + slideOut;
  const drawing = f >= drawStart && f <= drawEnd;
  const tilt = drawing ? Math.sin(f * 0.45) * 1.6 : 0;
  const handVisible = showHand && f >= 0 && f <= total;

  return (
    <div style={{position: "absolute", left: x, top: y, width, height, ...style}}>
      <BarChartGraphic
        geom={geom}
        width={width}
        height={height}
        progress={progress}
        fillOpacity={fillOpacity}
        showGrid={showGrid}
        showValues={showValues}
        showLabels={showLabels}
        fontFamily={fontFamily}
      />
      {handVisible ? (
        <HandPen
          tipX={pen.x}
          tipY={pen.y}
          rotate={tilt}
          offsetX={away * DEFAULT_AWAY.x}
          offsetY={away * DEFAULT_AWAY.y}
          scale={0.6}
          {...hand}
        />
      ) : null}
    </div>
  );
};

/* ---------- 2. Line Chart ---------- */

const sampleSmoothPath = (pts: Point[], stepsPerSeg = 10): Stroke => {
  if (pts.length <= 2) return pts;
  const out: Stroke = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 1; s <= stepsPerSeg; s++) {
      const t = s / stepsPerSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      // Catmull-Rom spline with tension 0.5
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      out.push({x, y});
    }
  }
  return out;
};

export const buildLineChartGeometry = ({
  data,
  series,
  labels,
  width,
  height,
  minValue = 0,
  maxValue,
  axisColor = CHART_DEFAULTS.axisColor,
  color = CHART_DEFAULTS.lineColor,
  strokeWidth = CHART_DEFAULTS.strokeWidth,
  smooth = true,
}: {
  data?: number[];
  series?: LineSeries[];
  labels?: string[];
  width: number;
  height: number;
  minValue?: number;
  maxValue?: number;
  axisColor?: string;
  color?: string;
  strokeWidth?: number;
  smooth?: boolean;
}) => {
  const {px, py, pw, ph, yAxis, xAxis} = buildAxesGeometry(width, height, {
    leftPad: 42,
    rightPad: 42,
    topPad: 50,
    bottomPad: 76,
  });

  const resolvedSeries: LineSeries[] =
    series && series.length > 0 ? series : [{data: data ?? [0, 10], color}];

  const allVals = resolvedSeries.reduce<number[]>(
    (acc, s) => acc.concat(s.data),
    [],
  );
  const maxV = Math.max(
    minValue + 1,
    maxValue ?? Math.max(...allVals, minValue + 1) * 1.12,
  );
  const spanV = maxV - minValue;

  const strokes: ColoredStroke[] = [
    {pts: yAxis, color: axisColor, strokeWidth},
    {pts: xAxis, color: axisColor, strokeWidth},
  ];

  const plotted = resolvedSeries.map((s, sIdx) => {
    const n = Math.max(2, s.data.length);
    const anchors: Point[] = s.data.map((v, i) => ({
      x: px + 14 + ((pw - 28) * i) / (n - 1),
      y: py + ph - clamp01((v - minValue) / spanV) * (ph - 20),
    }));
    const curve = smooth ? sampleSmoothPath(anchors, 10) : anchors;
    const col = s.color ?? color;
    strokes.push({pts: curve, color: col, strokeWidth});

    const areaPath =
      `M ${r2(curve[0].x)} ${r2(py + ph)} ` +
      curve.map((p) => `L ${r2(p.x)} ${r2(p.y)}`).join(" ") +
      ` L ${r2(curve[curve.length - 1].x)} ${r2(py + ph)} Z`;

    return {
      series: s,
      color: col,
      anchors,
      curve,
      areaPath,
      strokeIndex: 2 + sIdx,
    };
  });

  const rawStrokes = strokes.map((s) => s.pts);
  const lens = rawStrokes.map(polylineLength);
  const totalLen = lens.reduce((a, b) => a + b, 0);

  return {
    px,
    py,
    pw,
    ph,
    labels: labels ?? [],
    strokes,
    rawStrokes,
    lens,
    totalLen,
    plotted,
  };
};

export const lineChartFrames = (
  props: Parameters<typeof buildLineChartGeometry>[0],
) => annotationFrames(buildLineChartGeometry(props).rawStrokes, 32);

export const lineChartDuration = ({
  duration,
  handEnter = CHART_DEFAULTS.handEnter,
  handExit = CHART_DEFAULTS.handExit,
  ...rest
}: Pick<
  HandLineChartProps,
  | "data"
  | "series"
  | "labels"
  | "width"
  | "height"
  | "minValue"
  | "maxValue"
  | "axisColor"
  | "color"
  | "strokeWidth"
  | "smooth"
  | "duration"
  | "handEnter"
  | "handExit"
>) => handEnter + (duration ?? lineChartFrames(rest)) + handExit;

export const LineChartGraphic: React.FC<{
  geom: ReturnType<typeof buildLineChartGeometry>;
  width: number;
  height: number;
  progress: number;
  showGrid: boolean;
  showDots: boolean;
  fontFamily: string;
}> = ({geom, width, height, progress, showGrid, showDots, fontFamily}) => {
  const eased = ease(clamp01(progress));
  const dist = eased * geom.totalLen;

  const starts: number[] = [];
  let acc = 0;
  for (const len of geom.lens) {
    starts.push(acc);
    acc += len;
  }
  const axisFade = clamp01(dist / Math.max(1, geom.lens[0] + geom.lens[1]));

  return (
    <div style={{position: "relative", width, height}}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}
      >
        {showGrid
          ? [0.25, 0.5, 0.75, 1].map((g, i) => {
              const gy = geom.py + geom.ph * (1 - g);
              return (
                <line
                  key={i}
                  x1={geom.px}
                  y1={gy}
                  x2={geom.px + geom.pw}
                  y2={gy}
                  stroke="#e5e7eb"
                  strokeWidth={3}
                  strokeDasharray="10 10"
                  opacity={axisFade}
                />
              );
            })
          : null}

        {geom.plotted.map((s, i) => {
          if (!s.series.fill) return null;
          const sLen = geom.lens[s.strokeIndex];
          const sDone = clamp01((dist - starts[s.strokeIndex]) / Math.max(1, sLen));
          if (sDone <= 0.01) return null;
          const clipX = geom.px + sDone * geom.pw;
          return (
            <path
              key={i}
              d={s.areaPath}
              fill={s.color}
              opacity={0.14}
              style={{
                clipPath: `polygon(0px 0px, ${r2(clipX)}px 0px, ${r2(clipX)}px ${r2(height)}px, 0px ${r2(height)}px)`,
              }}
            />
          );
        })}

        {renderColoredStrokes(geom.strokes, geom.lens, dist)}

        {showDots
          ? geom.plotted.map((s, si) => {
              const sLen = geom.lens[s.strokeIndex];
              const sDone = clamp01((dist - starts[s.strokeIndex]) / Math.max(1, sLen));
              const lastIdx = s.anchors.length - 1;
              return s.anchors.map((pt, di) => {
                const thresh = di / Math.max(1, lastIdx);
                const dotScale = clamp01((sDone - thresh + 0.06) / 0.08);
                if (dotScale <= 0) return null;
                return (
                  <circle
                    key={`${si}-${di}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={(di === lastIdx ? 11 : 7) * dotScale}
                    fill={s.color}
                  />
                );
              });
            })
          : null}
      </svg>

      {geom.plotted.map((s, si) => {
        if (!s.series.label) return null;
        const sLen = geom.lens[s.strokeIndex];
        const sDone = clamp01((dist - starts[s.strokeIndex]) / Math.max(1, sLen));
        const op = clamp01((sDone - 0.85) / 0.15);
        if (op <= 0) return null;
        const end = s.anchors[s.anchors.length - 1];
        return (
          <div
            key={si}
            style={{
              position: "absolute",
              left: end.x - 10,
              top: end.y - 46,
              transform: "translateX(-100%)",
              opacity: op,
              fontFamily,
              fontWeight: 700,
              fontSize: 32,
              color: s.color,
              whiteSpace: "nowrap",
              background: "rgba(255,255,255,0.85)",
              padding: "2px 8px",
              borderRadius: 8,
            }}
          >
            {s.series.label}
          </div>
        );
      })}

      {axisFade > 0
        ? geom.labels.map((lbl, i) => {
            const n = Math.max(2, geom.labels.length);
            const lx = geom.px + 14 + ((geom.pw - 28) * i) / (n - 1);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: lx,
                  top: geom.py + geom.ph + 18,
                  transform: "translateX(-50%)",
                  opacity: axisFade,
                  fontFamily,
                  fontWeight: 700,
                  fontSize: 30,
                  color: "#333333",
                  whiteSpace: "nowrap",
                }}
              >
                {lbl}
              </div>
            );
          })
        : null}
    </div>
  );
};

/** Hand-drawn single or multi-series line graph with smooth/jagged curves and dots. */
export const HandLineChart: React.FC<HandLineChartProps> = ({
  data,
  series,
  labels,
  x = 0,
  y = 0,
  width,
  height,
  minValue = 0,
  maxValue,
  axisColor = CHART_DEFAULTS.axisColor,
  color = CHART_DEFAULTS.lineColor,
  strokeWidth = CHART_DEFAULTS.strokeWidth,
  smooth = true,
  showGrid = true,
  showDots = true,
  fontFamily = CHART_DEFAULTS.fontFamily,
  delay = 0,
  duration,
  handEnter = CHART_DEFAULTS.handEnter,
  handExit = CHART_DEFAULTS.handExit,
  showHand = true,
  hand,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;

  const geom = buildLineChartGeometry({
    data,
    series,
    labels,
    width,
    height,
    minValue,
    maxValue,
    axisColor,
    color,
    strokeWidth,
    smooth,
  });
  const frames = duration ?? annotationFrames(geom.rawStrokes, 32);
  const drawStart = handEnter;
  const drawEnd = handEnter + frames;
  const total = drawEnd + handExit;

  const progress = interpolate(f, [drawStart, drawEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dist = ease(progress) * geom.totalLen;
  const pen = penAlongStrokes(geom.rawStrokes, dist);

  const slideIn = interpolate(f, [0, handEnter], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const slideOut = interpolate(f, [drawEnd, total], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const away = slideIn + slideOut;
  const drawing = f >= drawStart && f <= drawEnd;
  const tilt = drawing ? Math.sin(f * 0.45) * 1.6 : 0;
  const handVisible = showHand && f >= 0 && f <= total;

  return (
    <div style={{position: "absolute", left: x, top: y, width, height, ...style}}>
      <LineChartGraphic
        geom={geom}
        width={width}
        height={height}
        progress={progress}
        showGrid={showGrid}
        showDots={showDots}
        fontFamily={fontFamily}
      />
      {handVisible ? (
        <HandPen
          tipX={pen.x}
          tipY={pen.y}
          rotate={tilt}
          offsetX={away * DEFAULT_AWAY.x}
          offsetY={away * DEFAULT_AWAY.y}
          scale={0.6}
          {...hand}
        />
      ) : null}
    </div>
  );
};
