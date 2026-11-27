import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";

export type NumberCounterFormat =
  | "number"
  | "currency"
  | "percentage"
  | "compact";

export type NumberCounterProps = {
  /** The value shown when the counter reaches the end. */
  value: number;
  /** Value at the first frame. Default 0. */
  from?: number;
  /** Animation delay in frames. */
  delay?: number;
  /** Animation duration in frames. */
  duration?: number;
  /** number, currency, percentage or compact. */
  format?: NumberCounterFormat;
  /** Fixed decimal places. A percentage defaults to 1 decimal. */
  decimals?: number;
  /** Currency or custom prefix, e.g. "$". */
  prefix?: string;
  /** Custom suffix, e.g. "M", "k" or "%". */
  suffix?: string;
  /** Currency code used with `format="currency"`. */
  currency?: string;
  /** Locale passed to Intl.NumberFormat. */
  locale?: string;
  /** Add thousand separators. Default true. */
  useGrouping?: boolean;
  /** Position in the parent composition. */
  x?: number;
  y?: number;
  width?: number | string;
  textAlign?: React.CSSProperties["textAlign"];
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  /** Apply a subtle scale pop as the counter completes. */
  pop?: boolean;
  /** `from`→`to` includes ease-out, ease-in-out or linear. */
  easing?: "linear" | "easeOut" | "easeInOut";
  style?: React.CSSProperties;
};

export const numberCounterDuration = (
  props: Pick<NumberCounterProps, "duration"> = {},
) => Math.max(1, props.duration ?? 60);

const easeFor = (easing: NumberCounterProps["easing"] = "easeOut") => {
  if (easing === "linear") return undefined;
  if (easing === "easeInOut") return Easing.inOut(Easing.cubic);
  return Easing.out(Easing.cubic);
};

/** Format a counter value without depending on React state or DOM time. */
export const formatNumberCounter = (
  value: number,
  {
    format = "number",
    decimals,
    prefix,
    suffix,
    currency = "USD",
    locale,
    useGrouping = true,
  }: Pick<
    NumberCounterProps,
    "format" | "decimals" | "prefix" | "suffix" | "currency" | "locale" | "useGrouping"
  > = {},
) => {
  if (format === "currency") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals ?? 2,
      useGrouping,
    }).format(value);
  }

  if (format === "percentage") {
    const places = decimals ?? 1;
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: places,
      maximumFractionDigits: places,
      useGrouping,
    }).format(value);
    return `${prefix ?? ""}${formatted}${suffix ?? "%"}`;
  }

  if (format === "compact") {
    const places = decimals ?? 1;
    const formatted = new Intl.NumberFormat(locale, {
      notation: "compact",
      compactDisplay: "short",
      minimumFractionDigits: places,
      maximumFractionDigits: places,
      useGrouping,
    }).format(value);
    return `${prefix ?? ""}${formatted}${suffix ?? ""}`;
  }

  const places = decimals ?? (Number.isInteger(value) ? 0 : 2);
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
    useGrouping,
  }).format(value);
  return `${prefix ?? ""}${formatted}${suffix ?? ""}`;
};

/** Clean animated financial number counter for Remotion compositions. */
export const NumberCounter: React.FC<NumberCounterProps> = ({
  value,
  from = 0,
  delay = 0,
  duration = 60,
  format = "number",
  decimals,
  prefix,
  suffix,
  currency = "USD",
  locale,
  useGrouping = true,
  x = 0,
  y = 0,
  width,
  textAlign = "left",
  fontSize = 72,
  fontWeight = 700,
  fontFamily = "Arial, sans-serif",
  color = "#111827",
  pop = true,
  easing = "easeOut",
  style,
}) => {
  const frame = useCurrentFrame();
  const safeDuration = Math.max(1, duration);
  const progress = interpolate(frame - delay, [0, safeDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeFor(easing),
  });
  const current = from + (value - from) * progress;
  const displayed = formatNumberCounter(current, {
    format,
    decimals,
    prefix,
    suffix,
    currency,
    locale,
    useGrouping,
  });

  const popProgress = interpolate(progress, [0.92, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = pop ? 1 + Math.sin(popProgress * Math.PI) * 0.025 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        textAlign,
        fontFamily,
        fontSize,
        fontWeight,
        color,
        lineHeight: 1,
        whiteSpace: "nowrap",
        transform: `scale(${scale})`,
        transformOrigin: "center",
        ...style,
      }}
      aria-label={formatNumberCounter(value, {
        format,
        decimals,
        prefix,
        suffix,
        currency,
        locale,
        useGrouping,
      })}
    >
      {displayed}
    </div>
  );
};

export default NumberCounter;
