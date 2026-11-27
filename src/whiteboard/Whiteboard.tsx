import React, {useLayoutEffect, useRef, useState} from "react";
import {
  Easing,
  Img,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  StrokesSvg,
  annotationFrames,
  arrowStrokes,
  bracketStrokes,
  checkStrokes,
  circleStrokes,
  crossStrokes,
  dividerStrokes,
  penAlongStrokes,
  polylineLength,
  strikeStrokes,
  underlineStrokes,
  type BracketSide,
  type BracketVariant,
  type DividerOrientation,
  type Point,
  type StrikeVariant,
  type Stroke,
} from "./Annotations";
import {HandPen, type HandPenProps} from "./HandPen";
import {
  MARKER_FONT_STACK,
  MarkerTextContent,
  markerParts,
  markerTextDuration,
  type MarkerPart,
} from "./MarkerText";
import {
  FRAME_DEFAULTS,
  RoundedFrameSvg,
  frameGeometry,
  pointOnFrame,
} from "./RoundedFrame";
import {
  HIGHLIGHT_DEFAULTS,
  HighlighterGraphic,
  highlightPenAt,
  highlighterFrames,
} from "./HighlighterSweep";
import {
  BUBBLE_DEFAULTS,
  BubbleGraphic,
  bubbleFrames,
  buildSpeechBubbleGeometry,
  buildThoughtBubbleGeometry,
  type BubbleTailSide,
  type BubbleVariant,
} from "./SpeechBubble";
import {
  BarChartGraphic,
  CHART_DEFAULTS,
  LineChartGraphic,
  buildBarChartGeometry,
  buildLineChartGeometry,
  type BarDatum,
  type LineSeries,
} from "./Charts";
import {reveal} from "./path";
import {
  DEFAULT_AWAY,
  buildSlots,
  handAt,
  progressAt,
  timelineFrames,
  type TimelineEntry,
  type TimelineOptions,
} from "./timeline";

export type ImageItem = {
  type: "image";
  src: string;
  /** Position and display size in px (use fit() from ./assets to keep the aspect ratio). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Frames the pen spends drawing it. Default 60. */
  duration?: number;
  /** Zig-zag passes. Keep duration / bands >= 8. Default 6. */
  bands?: number;
  scribbles?: number;
};

export type TextItem = {
  type: "text";
  text?: string;
  /** Mixed colours in one line: [{text: "$10", color: "#3aa845"}, {text: "/DAY"}]. */
  parts?: MarkerPart[];
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  letterSpacing?: number | string;
  /** Frames the pen spends writing. Default: about 2.4 frames per character. */
  duration?: number;
  scribbles?: number;
};

export type FrameItem = {
  type: "frame";
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  overshoot?: number;
  /** Frames the pen spends drawing the frame. Default 40. */
  duration?: number;
};

export type ArrowItem = {
  type: "arrow";
  from: Point;
  to: Point;
  curvature?: number;
  headSize?: number;
  color?: string;
  strokeWidth?: number;
  duration?: number;
};

export type CircleItem = {
  type: "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  laps?: number;
  clockwise?: boolean;
  color?: string;
  strokeWidth?: number;
  duration?: number;
};

export type UnderlineItem = {
  type: "underline";
  x: number;
  y: number;
  width: number;
  wave?: number;
  double?: boolean;
  gap?: number;
  color?: string;
  strokeWidth?: number;
  duration?: number;
};

export type HighlightItem = {
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height?: number;
  color?: string;
  opacity?: number;
  blendMode?: React.CSSProperties["mixBlendMode"];
  angle?: number;
  slant?: number;
  passes?: 1 | 2;
  duration?: number;
};

export type CheckItem = {
  type: "check";
  x: number;
  y: number;
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  duration?: number;
};

export type CrossItem = {
  type: "cross";
  x: number;
  y: number;
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  duration?: number;
};

export type StrikeItem = {
  type: "strike";
  x: number;
  y: number;
  width: number;
  height?: number;
  variant?: StrikeVariant;
  color?: string;
  strokeWidth?: number;
  duration?: number;
};

export type BubbleItem = {
  type: "bubble";
  variant?: BubbleVariant;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  puffDepth?: number;
  tailSide?: BubbleTailSide;
  tailOffset?: number;
  tailLength?: number;
  tailSpread?: number;
  tailLean?: number;
  overshoot?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  duration?: number;
};

export type DividerItem = {
  type: "divider";
  x: number;
  y: number;
  length: number;
  orientation?: DividerOrientation;
  wave?: number;
  double?: boolean;
  gap?: number;
  dashed?: boolean;
  color?: string;
  strokeWidth?: number;
  duration?: number;
};

export type BracketItem = {
  type: "bracket";
  x: number;
  y: number;
  width?: number;
  height?: number;
  side?: BracketSide;
  variant?: BracketVariant;
  color?: string;
  strokeWidth?: number;
  duration?: number;
};

export type BarChartItem = {
  type: "barChart";
  x: number;
  y: number;
  width: number;
  height: number;
  data: BarDatum[];
  maxValue?: number;
  axisColor?: string;
  barColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  showGrid?: boolean;
  showValues?: boolean;
  showLabels?: boolean;
  fontFamily?: string;
  duration?: number;
};

export type LineChartItem = {
  type: "lineChart";
  x: number;
  y: number;
  width: number;
  height: number;
  data?: number[];
  series?: LineSeries[];
  labels?: string[];
  minValue?: number;
  maxValue?: number;
  axisColor?: string;
  color?: string;
  strokeWidth?: number;
  smooth?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  fontFamily?: string;
  duration?: number;
};

export type AnnotationItem =
  | ArrowItem
  | CircleItem
  | UnderlineItem
  | CheckItem
  | CrossItem
  | StrikeItem
  | DividerItem
  | BracketItem;

export type WhiteboardItem =
  | ImageItem
  | TextItem
  | FrameItem
  | HighlightItem
  | BubbleItem
  | BarChartItem
  | LineChartItem
  | AnnotationItem;

export type WhiteboardProps = {
  /** Drawn in this order, by one hand. */
  items: WhiteboardItem[];
  /** Frames before the hand starts to slide in. Default 0. */
  delay?: number;
  /** Frames for the hand to slide in. Default 8. */
  enter?: number;
  /** Frames for the hand to move to the next item. Default 10. */
  travel?: number;
  /** Frames for the hand to slide out at the end. Default 10. */
  exit?: number;
  /** How high the pen lifts, in px, while it travels. Default 60. */
  lift?: number;
  /** Set false to reveal everything without the hand. Default true. */
  showHand?: boolean;
  /** Off-screen resting offset (px) relative to the pen tip. Auto-expanded in 16:9 landscape. */
  away?: {x: number; y: number};
  /** Hand size, tip and image overrides. Default scale is 0.6. */
  hand?: Pick<HandPenProps, "scale" | "src" | "tip" | "size">;
};

const DEFAULTS = {enter: 8, travel: 10, exit: 10, lift: 60};
const TEXT_DEFAULTS = {
  fontSize: 96,
  color: "#111111",
  fontFamily: MARKER_FONT_STACK,
  fontWeight: 700 as number | string,
};

const strokeEase = Easing.inOut(Easing.sin);

const buildAnnotationStrokes = (item: AnnotationItem): Stroke[] => {
  switch (item.type) {
    case "arrow":
      return arrowStrokes(item.from, item.to, item.curvature, item.headSize);
    case "circle":
      return circleStrokes(item.x, item.y, item.width, item.height, {
        laps: item.laps,
        clockwise: item.clockwise,
      });
    case "underline":
      return underlineStrokes(item.x, item.y, item.width, {
        wave: item.wave,
        double: item.double,
        gap: item.gap,
      });
    case "check":
      return checkStrokes(
        item.x,
        item.y,
        item.width ?? item.size ?? 84,
        item.height ?? item.size ?? 84,
      );
    case "cross":
      return crossStrokes(
        item.x,
        item.y,
        item.width ?? item.size ?? 80,
        item.height ?? item.size ?? 80,
      );
    case "strike":
      return strikeStrokes(
        item.x,
        item.y,
        item.width,
        item.height ?? 80,
        item.variant,
      );
    case "divider":
      return dividerStrokes(item.x, item.y, item.length, {
        orientation: item.orientation,
        wave: item.wave,
        double: item.double,
        gap: item.gap,
        dashed: item.dashed,
      });
    case "bracket": {
      const side = item.side ?? "right";
      const horiz = side === "top" || side === "bottom";
      return bracketStrokes(
        item.x,
        item.y,
        item.width ?? (horiz ? 360 : 56),
        item.height ?? (horiz ? 56 : 260),
        {side, variant: item.variant},
      );
    }
  }
};

const buildBubbleGeometry = (item: BubbleItem) =>
  (item.variant ?? "speech") === "thought"
    ? buildThoughtBubbleGeometry({
        width: item.width,
        height: item.height,
        puffDepth: item.puffDepth,
        tailSide: item.tailSide,
        tailOffset: item.tailOffset,
        tailLength: item.tailLength,
        tailLean: item.tailLean,
        strokeWidth: item.strokeWidth,
      })
    : buildSpeechBubbleGeometry({
        width: item.width,
        height: item.height,
        radius: item.radius,
        tailSide: item.tailSide,
        tailOffset: item.tailOffset,
        tailLength: item.tailLength,
        tailSpread: item.tailSpread,
        tailLean: item.tailLean,
        overshoot: item.overshoot,
        strokeWidth: item.strokeWidth,
      });

const itemDuration = (item: WhiteboardItem): number => {
  if (item.duration !== undefined) return item.duration;
  switch (item.type) {
    case "image":
      return 60;
    case "text":
      return markerTextDuration({text: item.text, parts: item.parts});
    case "frame":
      return FRAME_DEFAULTS.duration;
    case "highlight":
      return highlighterFrames(item.width, item.passes ?? HIGHLIGHT_DEFAULTS.passes);
    case "bubble":
      return bubbleFrames(buildBubbleGeometry(item).strokes);
    case "barChart":
      return annotationFrames(
        buildBarChartGeometry({
          data: item.data,
          width: item.width,
          height: item.height,
          maxValue: item.maxValue,
          axisColor: item.axisColor,
          barColor: item.barColor,
          strokeWidth: item.strokeWidth,
        }).rawStrokes,
        32,
      );
    case "lineChart":
      return annotationFrames(
        buildLineChartGeometry({
          data: item.data,
          series: item.series,
          labels: item.labels,
          width: item.width,
          height: item.height,
          minValue: item.minValue,
          maxValue: item.maxValue,
          axisColor: item.axisColor,
          color: item.color,
          strokeWidth: item.strokeWidth,
          smooth: item.smooth,
        }).rawStrokes,
        32,
      );
    case "arrow":
    case "circle":
    case "underline":
    case "check":
    case "cross":
    case "strike":
    case "divider":
    case "bracket":
      return annotationFrames(buildAnnotationStrokes(item));
  }
};

/**
 * Drawing start/end frame slots for each item in a Whiteboard (delay not included).
 */
export const whiteboardSlots = (
  items: WhiteboardItem[],
  {
    enter = DEFAULTS.enter,
    travel = DEFAULTS.travel,
  }: Pick<WhiteboardProps, "enter" | "travel"> = {},
) => buildSlots(items.map(itemDuration), {enter, travel});

/**
 * Total frames a Whiteboard occupies: hand slides in, draws everything, slides out.
 * Use it to size a <Sequence> or a Composition.
 */
export const whiteboardDuration = (
  items: WhiteboardItem[],
  {
    enter = DEFAULTS.enter,
    travel = DEFAULTS.travel,
    exit = DEFAULTS.exit,
  }: Pick<WhiteboardProps, "enter" | "travel" | "exit"> = {},
) => timelineFrames(items.map(itemDuration), {enter, travel, exit});

type Size = {w: number; h: number};

/**
 * Measures every text item in a hidden layer, once the font is ready.
 * Holds the render (delayRender) until the sizes are known.
 * offsetWidth / offsetHeight are layout sizes, so Remotion's scale() does not distort them.
 */
const useTextSizes = (items: WhiteboardItem[]) => {
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  const [sizes, setSizes] = useState<Record<number, Size> | null>(null);
  const [handle] = useState(() => delayRender("Measuring whiteboard text"));
  const signature = JSON.stringify(
    items.map((i) => (i.type === "text" ? [i.text, i.parts, i.fontSize, i.fontFamily, i.fontWeight, i.letterSpacing] : 0)),
  );

  useLayoutEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await (document as Document).fonts?.ready;
      } catch {
        // measuring with the fallback font is better than hanging the render
      }
      if (cancelled) return;
      const next: Record<number, Size> = {};
      items.forEach((item, i) => {
        const el = refs.current[i];
        if (item.type === "text" && el) {
          next[i] = {w: el.offsetWidth, h: el.offsetHeight};
        }
      });
      setSizes(next);
      continueRender(handle);
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return {sizes, refs};
};

export type PreparedItem =
  | {
      kind: "reveal";
      item: ImageItem | TextItem;
      entry: Extract<TimelineEntry, {kind?: "reveal"}>;
    }
  | {
      kind: "frame";
      item: FrameItem;
      geom: ReturnType<typeof frameGeometry>;
      entry: Extract<TimelineEntry, {kind: "path"}>;
    }
  | {
      kind: "highlight";
      item: HighlightItem;
      entry: Extract<TimelineEntry, {kind: "path"}>;
    }
  | {
      kind: "bubble";
      item: BubbleItem;
      geom: ReturnType<typeof buildBubbleGeometry>;
      lens: number[];
      totalLen: number;
      entry: Extract<TimelineEntry, {kind: "path"}>;
    }
  | {
      kind: "barChart";
      item: BarChartItem;
      geom: ReturnType<typeof buildBarChartGeometry>;
      entry: Extract<TimelineEntry, {kind: "path"}>;
    }
  | {
      kind: "lineChart";
      item: LineChartItem;
      geom: ReturnType<typeof buildLineChartGeometry>;
      entry: Extract<TimelineEntry, {kind: "path"}>;
    }
  | {
      kind: "strokes";
      item: AnnotationItem;
      strokes: Stroke[];
      lens: number[];
      totalLen: number;
      entry: Extract<TimelineEntry, {kind: "path"}>;
    };

const estimateTextSize = (item: TextItem): Size => {
  const len = markerParts(item.text, item.parts).reduce(
    (n, p) => n + p.text.length,
    0,
  );
  const fs = item.fontSize ?? TEXT_DEFAULTS.fontSize;
  return {
    w: Math.max(20, Math.round(len * fs * 0.56)),
    h: Math.round(fs * 1.28),
  };
};

/**
 * Pure item preparation shared between <Whiteboard /> rendering and the
 * coordinate/timestamp audio telemetry pipeline. When `sizes` is omitted,
 * text boxes are estimated deterministically so headless CLI export works
 * without a DOM.
 */
export const prepareWhiteboardItems = (
  items: WhiteboardItem[],
  sizes?: Record<number, Size> | null,
): PreparedItem[] =>
  items.map((item, i) => {
    const duration = itemDuration(item);
    if (item.type === "image") {
      return {
        kind: "reveal",
        item,
        entry: {
          kind: "reveal",
          duration,
          box: {x: item.x, y: item.y, w: item.width, h: item.height},
          mode: "serpentine",
          bands: item.bands ?? 6,
          scribbles: item.scribbles ?? 3,
          linear: false,
        },
      };
    }
    if (item.type === "text") {
      const size = sizes?.[i] ?? estimateTextSize(item);
      return {
        kind: "reveal",
        item,
        entry: {
          kind: "reveal",
          duration,
          box: {x: item.x, y: item.y, w: size.w, h: size.h},
          mode: "sweep",
          bands: 1,
          scribbles: item.scribbles ?? 5,
          linear: true,
        },
      };
    }
    if (item.type === "frame") {
      const geom = frameGeometry(
        item.width,
        item.height,
        item.radius ?? FRAME_DEFAULTS.radius,
        item.strokeWidth ?? FRAME_DEFAULTS.strokeWidth,
        item.overshoot ?? FRAME_DEFAULTS.overshoot,
      );
      return {
        kind: "frame",
        item,
        geom,
        entry: {
          kind: "path",
          duration,
          penAt: (progress) => {
            const p = pointOnFrame(geom.segs, strokeEase(progress) * geom.length);
            return {x: item.x + geom.inset + p.x, y: item.y + geom.inset + p.y};
          },
        },
      };
    }
    if (item.type === "highlight") {
      const h = item.height ?? HIGHLIGHT_DEFAULTS.height;
      const slant = item.slant ?? HIGHLIGHT_DEFAULTS.slant;
      const angle = item.angle ?? HIGHLIGHT_DEFAULTS.angle;
      const passes = item.passes ?? HIGHLIGHT_DEFAULTS.passes;
      return {
        kind: "highlight",
        item,
        entry: {
          kind: "path",
          duration,
          penAt: (progress) =>
            highlightPenAt(
              item.x,
              item.y,
              item.width,
              h,
              slant,
              angle,
              passes,
              progress,
            ),
        },
      };
    }
    if (item.type === "bubble") {
      const geom = buildBubbleGeometry(item);
      const lens = geom.strokes.map(polylineLength);
      const totalLen = lens.reduce((a, b) => a + b, 0);
      return {
        kind: "bubble",
        item,
        geom,
        lens,
        totalLen,
        entry: {
          kind: "path",
          duration,
          penAt: (progress) => {
            const p = penAlongStrokes(
              geom.strokes,
              strokeEase(progress) * totalLen,
            );
            return {x: item.x + p.x, y: item.y + p.y};
          },
        },
      };
    }
    if (item.type === "barChart") {
      const geom = buildBarChartGeometry({
        data: item.data,
        width: item.width,
        height: item.height,
        maxValue: item.maxValue,
        axisColor: item.axisColor,
        barColor: item.barColor,
        strokeWidth: item.strokeWidth,
      });
      return {
        kind: "barChart",
        item,
        geom,
        entry: {
          kind: "path",
          duration,
          penAt: (progress) => {
            const p = penAlongStrokes(
              geom.rawStrokes,
              strokeEase(progress) * geom.totalLen,
            );
            return {x: item.x + p.x, y: item.y + p.y};
          },
        },
      };
    }
    if (item.type === "lineChart") {
      const geom = buildLineChartGeometry({
        data: item.data,
        series: item.series,
        labels: item.labels,
        width: item.width,
        height: item.height,
        minValue: item.minValue,
        maxValue: item.maxValue,
        axisColor: item.axisColor,
        color: item.color,
        strokeWidth: item.strokeWidth,
        smooth: item.smooth,
      });
      return {
        kind: "lineChart",
        item,
        geom,
        entry: {
          kind: "path",
          duration,
          penAt: (progress) => {
            const p = penAlongStrokes(
              geom.rawStrokes,
              strokeEase(progress) * geom.totalLen,
            );
            return {x: item.x + p.x, y: item.y + p.y};
          },
        },
      };
    }
    const strokes = buildAnnotationStrokes(item);
    const lens = strokes.map(polylineLength);
    const totalLen = lens.reduce((a, b) => a + b, 0);
    return {
      kind: "strokes",
      item,
      strokes,
      lens,
      totalLen,
      entry: {
        kind: "path",
        duration,
        penAt: (progress) =>
          penAlongStrokes(strokes, strokeEase(progress) * totalLen),
      },
    };
  });

export const Whiteboard: React.FC<WhiteboardProps> = ({
  items,
  delay = 0,
  enter = DEFAULTS.enter,
  travel = DEFAULTS.travel,
  exit = DEFAULTS.exit,
  lift = DEFAULTS.lift,
  showHand = true,
  away,
  hand,
}) => {
  const frame = useCurrentFrame();
  const {width: videoWidth, height: videoHeight} = useVideoConfig();
  const f = frame - delay;
  const {sizes, refs} = useTextSizes(items);

  const textStyle = (item: TextItem) => ({
    parts: markerParts(item.text, item.parts),
    fontSize: item.fontSize ?? TEXT_DEFAULTS.fontSize,
    color: item.color ?? TEXT_DEFAULTS.color,
    fontFamily: item.fontFamily ?? TEXT_DEFAULTS.fontFamily,
    fontWeight: item.fontWeight ?? TEXT_DEFAULTS.fontWeight,
    letterSpacing: item.letterSpacing,
  });

  // hidden layer that is only used to measure text
  const measurer = (
    <div style={{position: "absolute", left: 0, top: 0, visibility: "hidden", pointerEvents: "none"}}>
      {items.map((item, i) =>
        item.type === "text" ? (
          <div
            key={i}
            ref={(el: HTMLDivElement | null) => {
              refs.current[i] = el;
            }}
            style={{position: "absolute", left: 0, top: 0, whiteSpace: "nowrap"}}
          >
            <MarkerTextContent {...textStyle(item)} />
          </div>
        ) : null,
      )}
    </div>
  );

  if (!sizes) return measurer;

  const prepared = prepareWhiteboardItems(items, sizes);

  const resolvedAway =
    away ??
    (videoWidth > videoHeight ? {x: 420, y: 680} : DEFAULT_AWAY);

  const entries = prepared.map((p) => p.entry);
  const options: TimelineOptions = {enter, travel, exit, lift, away: resolvedAway};
  const {slots} = buildSlots(
    entries.map((e) => e.duration),
    options,
  );
  const pose = showHand ? handAt(f, entries, options) : null;

  return (
    <>
      {measurer}
      {prepared.map((prep, i) => {
        const progress = progressAt(f, slots[i]);
        if (prep.kind === "frame") {
          const {item, geom} = prep;
          const eased = strokeEase(progress);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
              }}
            >
              <RoundedFrameSvg
                width={item.width}
                height={item.height}
                d={geom.d}
                inset={geom.inset}
                length={geom.length}
                progress={eased}
                color={item.color ?? FRAME_DEFAULTS.color}
                strokeWidth={item.strokeWidth ?? FRAME_DEFAULTS.strokeWidth}
                fill={item.fill}
              />
            </div>
          );
        }
        if (prep.kind === "highlight") {
          const {item} = prep;
          const h = item.height ?? HIGHLIGHT_DEFAULTS.height;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.width,
                height: h,
              }}
            >
              <HighlighterGraphic
                width={item.width}
                height={h}
                color={item.color ?? HIGHLIGHT_DEFAULTS.color}
                opacity={item.opacity ?? HIGHLIGHT_DEFAULTS.opacity}
                blendMode={item.blendMode ?? HIGHLIGHT_DEFAULTS.blendMode}
                angle={item.angle ?? HIGHLIGHT_DEFAULTS.angle}
                slant={item.slant ?? HIGHLIGHT_DEFAULTS.slant}
                passes={item.passes ?? HIGHLIGHT_DEFAULTS.passes}
                progress={progress}
              />
            </div>
          );
        }
        if (prep.kind === "bubble") {
          const {item, geom, lens, totalLen} = prep;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
              }}
            >
              <BubbleGraphic
                width={item.width}
                height={item.height}
                fillPath={geom.fillPath}
                dots={geom.dots}
                strokes={geom.strokes}
                lens={lens}
                totalLen={totalLen}
                progress={progress}
                color={item.color ?? BUBBLE_DEFAULTS.color}
                strokeWidth={item.strokeWidth ?? BUBBLE_DEFAULTS.strokeWidth}
                fill={item.fill ?? BUBBLE_DEFAULTS.fill}
              />
            </div>
          );
        }
        if (prep.kind === "barChart") {
          const {item, geom} = prep;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
              }}
            >
              <BarChartGraphic
                geom={geom}
                width={item.width}
                height={item.height}
                progress={progress}
                fillOpacity={item.fillOpacity ?? CHART_DEFAULTS.fillOpacity}
                showGrid={item.showGrid ?? true}
                showValues={item.showValues ?? true}
                showLabels={item.showLabels ?? true}
                fontFamily={item.fontFamily ?? CHART_DEFAULTS.fontFamily}
              />
            </div>
          );
        }
        if (prep.kind === "lineChart") {
          const {item, geom} = prep;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
              }}
            >
              <LineChartGraphic
                geom={geom}
                width={item.width}
                height={item.height}
                progress={progress}
                showGrid={item.showGrid ?? true}
                showDots={item.showDots ?? true}
                fontFamily={item.fontFamily ?? CHART_DEFAULTS.fontFamily}
              />
            </div>
          );
        }
        if (prep.kind === "strokes") {
          const {item, strokes, lens, totalLen} = prep;
          const dist = strokeEase(progress) * totalLen;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 0,
                height: 0,
                overflow: "visible",
              }}
            >
              <StrokesSvg
                strokes={strokes}
                lens={lens}
                dist={dist}
                color={
                  item.color ??
                  (item.type === "check"
                    ? "#3aa845"
                    : item.type === "divider" || item.type === "bracket"
                      ? "#111111"
                      : "#d62828")
                }
                strokeWidth={
                  item.strokeWidth ??
                  (item.type === "check" || item.type === "cross"
                    ? 12
                    : item.type === "strike"
                      ? 11
                      : item.type === "divider"
                        ? 8
                        : 10)
                }
              />
            </div>
          );
        }

        const {item, entry} = prep;
        const {clipPath} = reveal(
          entry.mode,
          progress,
          entry.box.w,
          entry.box.h,
          entry.bands,
          entry.scribbles,
          {unit: "px", linear: entry.linear},
        );
        const box: React.CSSProperties = {
          position: "absolute",
          left: entry.box.x,
          top: entry.box.y,
          width: entry.box.w,
          height: entry.box.h,
          clipPath,
        };
        return item.type === "image" ? (
          <Img key={i} src={item.src} style={{...box, display: "block"}} />
        ) : (
          <div key={i} style={box}>
            <MarkerTextContent {...textStyle(item)} />
          </div>
        );
      })}
      {pose ? (
        <HandPen tipX={pose.x} tipY={pose.y} rotate={pose.rotate} scale={0.6} {...hand} />
      ) : null}
    </>
  );
};
