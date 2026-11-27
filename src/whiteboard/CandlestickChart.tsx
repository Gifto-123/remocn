import React, {useId} from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";

/** One OHLC observation. `label` (or `date`) is shown beneath the candle. */
export type CandlestickDatum = {
  open: number;
  high: number;
  low: number;
  close: number;
  label?: string;
  date?: string;
};

export type CandlestickChartProps = {
  data: CandlestickDatum[];
  width: number;
  height: number;
  /** Position in the parent composition, in pixels. */
  x?: number;
  y?: number;
  minValue?: number;
  maxValue?: number;
  /** Rising and falling candle colors. */
  upColor?: string;
  downColor?: string;
  gridColor?: string;
  axisColor?: string;
  backgroundColor?: string;
  candleWidth?: number;
  showGrid?: boolean;
  showPriceLabels?: boolean;
  showDateLabels?: boolean;
  fontFamily?: string;
  /** Frames before the chart starts animating. */
  delay?: number;
  /** Frames for the left-to-right reveal. */
  duration?: number;
  style?: React.CSSProperties;
};

type CandleGeometry = {
  datum: CandlestickDatum;
  centerX: number;
  highY: number;
  lowY: number;
  openY: number;
  closeY: number;
  bodyTop: number;
  bodyHeight: number;
  rising: boolean;
};

export type CandlestickChartGeometry = {
  plotX: number;
  plotY: number;
  plotWidth: number;
  plotHeight: number;
  minValue: number;
  maxValue: number;
  candles: CandleGeometry[];
};

const LEFT_PAD = 72;
const RIGHT_PAD = 14;
const TOP_PAD = 16;
const BOTTOM_PAD = 34;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Build normalized candle positions. Useful for custom chart overlays. */
export const buildCandlestickChartGeometry = ({
  data,
  width,
  height,
  minValue,
  maxValue,
}: Pick<CandlestickChartProps, "data" | "width" | "height" | "minValue" | "maxValue">): CandlestickChartGeometry => {
  const plotX = LEFT_PAD;
  const plotY = TOP_PAD;
  const plotWidth = Math.max(1, width - LEFT_PAD - RIGHT_PAD);
  const plotHeight = Math.max(1, height - TOP_PAD - BOTTOM_PAD);
  const values = data.flatMap(({open, high, low, close}) => [open, high, low, close]);
  const dataMin = values.length ? Math.min(...values) : 0;
  const dataMax = values.length ? Math.max(...values) : 1;
  const rawMin = minValue ?? dataMin;
  const rawMax = maxValue ?? dataMax;
  // Keep the scale nonzero, including when every observation has the same price.
  const spread = Math.max(1e-9, rawMax - rawMin);
  const min = rawMax === rawMin ? rawMin - spread / 2 : rawMin;
  const max = rawMax === rawMin ? rawMax + spread / 2 : rawMax;
  const valueY = (value: number) =>
    plotY + ((max - value) / (max - min)) * plotHeight;
  const slotWidth = plotWidth / Math.max(1, data.length);

  return {
    plotX,
    plotY,
    plotWidth,
    plotHeight,
    minValue: min,
    maxValue: max,
    candles: data.map((datum, index) => {
      const upper = Math.max(datum.open, datum.high, datum.low, datum.close);
      const lower = Math.min(datum.open, datum.high, datum.low, datum.close);
      const openY = valueY(datum.open);
      const closeY = valueY(datum.close);
      return {
        datum,
        centerX: plotX + (index + 0.5) * slotWidth,
        highY: valueY(upper),
        lowY: valueY(lower),
        openY,
        closeY,
        bodyTop: Math.min(openY, closeY),
        bodyHeight: Math.max(1.5, Math.abs(closeY - openY)),
        rising: datum.close >= datum.open,
      };
    }),
  };
};

export const candlestickChartDuration = ({duration = 45}: Pick<CandlestickChartProps, "duration"> = {}) =>
  Math.max(1, duration);

/** Animated OHLC candlestick chart for Remotion compositions. */
export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  width,
  height,
  x = 0,
  y = 0,
  minValue,
  maxValue,
  upColor = "#16a34a",
  downColor = "#dc2626",
  gridColor = "#e2e8f0",
  axisColor = "#64748b",
  backgroundColor = "transparent",
  candleWidth,
  showGrid = true,
  showPriceLabels = true,
  showDateLabels = true,
  fontFamily = "Arial, sans-serif",
  delay = 0,
  duration = 45,
  style,
}) => {
  const frame = useCurrentFrame();
  const id = useId().replace(/:/g, "");
  const clipId = `candles-${id}`;
  const safeDuration = Math.max(1, duration);
  const progress = interpolate(frame - delay, [0, safeDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  const geometry = buildCandlestickChartGeometry({data, width, height, minValue, maxValue});
  const {plotX, plotY, plotWidth, plotHeight, minValue: scaleMin, maxValue: scaleMax, candles} = geometry;
  const slotWidth = plotWidth / Math.max(1, candles.length);
  const bodyWidth = candleWidth ?? clamp(slotWidth * 0.62, 3, 18);
  const tickCount = 5;
  const labelIndexes = new Set<number>();
  const labelCount = Math.min(6, candles.length);
  for (let i = 0; i < labelCount; i++) {
    labelIndexes.add(labelCount <= 1 ? 0 : Math.round((i * (candles.length - 1)) / (labelCount - 1)));
  }
  const formatter = new Intl.NumberFormat(undefined, {maximumSignificantDigits: 5});

  return (
    <div style={{position: "absolute", left: x, top: y, width, height, ...style}}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Animated candlestick chart"
        style={{display: "block", background: backgroundColor, overflow: "visible"}}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={plotX} y={plotY} width={plotWidth * progress} height={plotHeight} />
          </clipPath>
        </defs>

        {showGrid
          ? Array.from({length: tickCount}, (_, index) => {
              const ratio = index / (tickCount - 1);
              const lineY = plotY + ratio * plotHeight;
              const value = scaleMax - ratio * (scaleMax - scaleMin);
              return (
                <g key={`grid-${index}`} opacity={progress}>
                  <line x1={plotX} y1={lineY} x2={plotX + plotWidth} y2={lineY} stroke={gridColor} strokeWidth={1} />
                  {showPriceLabels ? (
                    <text
                      x={plotX - 9}
                      y={lineY + 4}
                      textAnchor="end"
                      fill={axisColor}
                      fontFamily={fontFamily}
                      fontSize={12}
                    >
                      {formatter.format(value)}
                    </text>
                  ) : null}
                </g>
              );
            })
          : null}

        <g clipPath={`url(#${clipId})`}>
          {candles.map((candle, index) => {
            const color = candle.rising ? upColor : downColor;
            return (
              <g key={`${candle.datum.label ?? candle.datum.date ?? "candle"}-${index}`}>
                <line
                  x1={candle.centerX}
                  y1={candle.highY}
                  x2={candle.centerX}
                  y2={candle.lowY}
                  stroke={color}
                  strokeWidth={Math.max(1, Math.min(2, bodyWidth * 0.18))}
                />
                <rect
                  x={candle.centerX - bodyWidth / 2}
                  y={candle.bodyTop}
                  width={bodyWidth}
                  height={candle.bodyHeight}
                  fill={candle.rising ? color : backgroundColor === "transparent" ? "#ffffff" : backgroundColor}
                  stroke={color}
                  strokeWidth={Math.max(1, Math.min(2, bodyWidth * 0.18))}
                />
              </g>
            );
          })}
        </g>

        {showDateLabels
          ? candles.map((candle, index) => {
              if (!labelIndexes.has(index)) return null;
              const label = candle.datum.label ?? candle.datum.date;
              if (!label) return null;
              return (
                <text
                  key={`label-${index}`}
                  x={candle.centerX}
                  y={height - 9}
                  textAnchor="middle"
                  fill={axisColor}
                  fontFamily={fontFamily}
                  fontSize={12}
                  opacity={progress}
                >
                  {label}
                </text>
              );
            })
          : null}
      </svg>
    </div>
  );
};

export default CandlestickChart;
