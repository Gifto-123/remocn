import React, {useLayoutEffect, useRef, useState} from "react";
import {continueRender, delayRender, useCurrentFrame} from "remotion";
import {HandPen, type HandPenProps} from "./HandPen";
import {
  MARKER_FONT_STACK,
  MarkerTextContent,
  markerParts,
  markerTextDuration,
  type MarkerPart,
} from "./MarkerText";
import {reveal} from "./path";
import {
  DEFAULT_AWAY,
  handAt,
  progressAt,
  type TimelineEntry,
} from "./timeline";

export type TextAlign = "left" | "center" | "right";

export type MarkerListMarker = "bullet" | "dash" | "number" | "check";

export type MarkerListEntry =
  | string
  | {
      text?: string;
      parts?: MarkerPart[];
      color?: string;
    };

export type MarkerParagraphProps = {
  /** Paragraph text (supports `\n`). Use `parts` instead for mixed colours. */
  text?: string;
  parts?: MarkerPart[];

  /** Wrap width in px. Omit to wrap only on `\n`. */
  maxWidth?: number;
  align?: TextAlign;
  lineHeight?: number;

  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  letterSpacing?: number | string;

  /** Top-left position inside the parent, in px. */
  x?: number;
  y?: number;

  /** Frames before the hand starts coming in. Default 0. */
  delay?: number;
  /** Frames the pen spends writing + hopping between lines. */
  duration?: number;
  /** Frames per character when `duration` is not set. Default 2.1. */
  framesPerChar?: number;
  handEnter?: number;
  handExit?: number;
  /** Frames for the hand to hop from one line to the next. Default 4. */
  lineTravel?: number;
  /** How high the pen lifts (px) when hopping between lines. Default 26. */
  lineLift?: number;
  showHand?: boolean;
  /** Hand size / image overrides. Default scale is 0.55. */
  hand?: Pick<HandPenProps, "scale" | "src" | "tip" | "size">;
  /** Up-and-down scribbles per line. Default 5. */
  scribbles?: number;

  style?: React.CSSProperties;
};

export type MarkerListProps = Omit<
  MarkerParagraphProps,
  "text" | "parts" | "align"
> & {
  items: MarkerListEntry[];
  /** Marker style before each item. Default "bullet". */
  marker?: MarkerListMarker;
  /** Colour for the marker glyph. Defaults to green for "check", otherwise `color`. */
  markerColor?: string;
  /** Left indent (px) between marker column and item text. Default ~1.1 * fontSize. */
  indent?: number;
  /** Vertical gap (px) between list items. Default ~0.4 * fontSize. */
  itemGap?: number;
  /** Frames for the hand to travel from one list item to the next. Default 6. */
  itemTravel?: number;
};

export type MeasuredLine = {
  parts: MarkerPart[];
  x: number;
  y: number;
  w: number;
  h: number;
  padX: number;
  padY: number;
  chars: number;
  scribbles: number;
  /** Travel frames after this line (ignored on the last line). */
  travelAfter?: number;
};

type Token =
  | {kind: "newline"}
  | {kind: "space"}
  | {kind: "cluster"; parts: MarkerPart[]};

export const PARAGRAPH_DEFAULTS = {
  fontSize: 64,
  color: "#111111",
  fontFamily: MARKER_FONT_STACK,
  fontWeight: 700 as number | string,
  lineHeight: 1.24,
  framesPerChar: 2.1,
  handEnter: 8,
  handExit: 10,
  lineTravel: 4,
  lineLift: 26,
  scribbles: 5,
};

/** Splits coloured parts into newline, whitespace, and unbreakable word clusters. */
const tokenizeParts = (parts: MarkerPart[]): Token[] => {
  const tokens: Token[] = [];
  let pending: MarkerPart[] = [];

  const flush = () => {
    if (pending.length > 0) {
      tokens.push({kind: "cluster", parts: pending});
      pending = [];
    }
  };

  for (const part of parts) {
    const pieces = part.text.split(/(\n|[ \t]+)/);
    for (const piece of pieces) {
      if (!piece) continue;
      if (piece === "\n") {
        flush();
        tokens.push({kind: "newline"});
      } else if (/^[ \t]+$/.test(piece)) {
        flush();
        if (tokens[tokens.length - 1]?.kind !== "space") {
          tokens.push({kind: "space"});
        }
      } else {
        pending.push({text: piece, color: part.color});
      }
    }
  }
  flush();
  return tokens;
};

const mergeAdjacentParts = (parts: MarkerPart[]): MarkerPart[] => {
  const merged: MarkerPart[] = [];
  for (const p of parts) {
    const prev = merged[merged.length - 1];
    if (prev && prev.color === p.color) {
      prev.text += p.text;
    } else {
      merged.push({text: p.text, color: p.color});
    }
  }
  return merged;
};

const estimateLineCount = (
  totalChars: number,
  fontSize: number,
  maxWidth?: number,
  explicitNewlines = 0,
) => {
  const base = 1 + explicitNewlines;
  if (!maxWidth || maxWidth <= 0) return base;
  const approxCharsPerLine = Math.max(4, Math.floor(maxWidth / (fontSize * 0.52)));
  return Math.max(base, Math.ceil(totalChars / approxCharsPerLine));
};

/**
 * Deterministic drawing + line-hop frames for a MarkerParagraph (handEnter/handExit excluded).
 */
export const markerParagraphDrawFrames = ({
  text,
  parts,
  fontSize = PARAGRAPH_DEFAULTS.fontSize,
  maxWidth,
  framesPerChar = PARAGRAPH_DEFAULTS.framesPerChar,
  lineTravel = PARAGRAPH_DEFAULTS.lineTravel,
}: {
  text?: string;
  parts?: MarkerPart[];
  fontSize?: number;
  maxWidth?: number;
  framesPerChar?: number;
  lineTravel?: number;
}) => {
  const norm = markerParts(text, parts);
  const full = norm.map((p) => p.text).join("");
  const newlines = (full.match(/\n/g) ?? []).length;
  const chars = full.replace(/\s+/g, "").length;
  const write = markerTextDuration({
    text: full,
    framesPerChar,
    minFrames: 14,
  });
  const estLines = estimateLineCount(chars, fontSize, maxWidth, newlines);
  return write + Math.max(0, estLines - 1) * lineTravel;
};

/** Total frames a MarkerParagraph occupies (delay not included). */
export const markerParagraphDuration = ({
  duration,
  handEnter = PARAGRAPH_DEFAULTS.handEnter,
  handExit = PARAGRAPH_DEFAULTS.handExit,
  ...rest
}: Pick<
  MarkerParagraphProps,
  | "text"
  | "parts"
  | "fontSize"
  | "maxWidth"
  | "duration"
  | "framesPerChar"
  | "handEnter"
  | "handExit"
  | "lineTravel"
>) => {
  const draw = duration ?? markerParagraphDrawFrames(rest);
  return handEnter + draw + handExit;
};

export const listMarkerGlyph = (
  marker: MarkerListMarker,
  index: number,
): string => {
  switch (marker) {
    case "check":
      return "✓";
    case "dash":
      return "–";
    case "number":
      return `${index + 1}.`;
    default:
      return "•";
  }
};

const normalizeListItem = (
  entry: MarkerListEntry,
  fallbackColor?: string,
): MarkerPart[] => {
  if (typeof entry === "string") {
    return [{text: entry, color: fallbackColor}];
  }
  return markerParts(entry.text, entry.parts).map((p) => ({
    text: p.text,
    color: p.color ?? entry.color ?? fallbackColor,
  }));
};

/** Deterministic drawing + hop frames for a MarkerList (handEnter/handExit excluded). */
export const markerListDrawFrames = ({
  items,
  fontSize = PARAGRAPH_DEFAULTS.fontSize,
  maxWidth,
  indent,
  framesPerChar = PARAGRAPH_DEFAULTS.framesPerChar,
  lineTravel = PARAGRAPH_DEFAULTS.lineTravel,
  itemTravel = 6,
  marker = "bullet",
}: {
  items: MarkerListEntry[];
  fontSize?: number;
  maxWidth?: number;
  indent?: number;
  framesPerChar?: number;
  lineTravel?: number;
  itemTravel?: number;
  marker?: MarkerListMarker;
}) => {
  const col = indent ?? Math.round(fontSize * 1.15);
  const bodyMax = maxWidth ? Math.max(120, maxWidth - col) : undefined;
  let total = 0;
  items.forEach((item, idx) => {
    const glyphFrames = marker === "number" ? 7 : 5;
    const itemParts = normalizeListItem(item);
    const bodyFrames = markerParagraphDrawFrames({
      parts: itemParts,
      fontSize,
      maxWidth: bodyMax,
      framesPerChar,
      lineTravel,
    });
    total += glyphFrames + 2 + bodyFrames;
    if (idx < items.length - 1) total += itemTravel;
  });
  return Math.max(14, total);
};

/** Total frames a MarkerList occupies (delay not included). */
export const markerListDuration = ({
  duration,
  handEnter = PARAGRAPH_DEFAULTS.handEnter,
  handExit = PARAGRAPH_DEFAULTS.handExit,
  ...rest
}: Pick<
  MarkerListProps,
  | "items"
  | "fontSize"
  | "maxWidth"
  | "indent"
  | "duration"
  | "framesPerChar"
  | "handEnter"
  | "handExit"
  | "lineTravel"
  | "itemTravel"
  | "marker"
>) => {
  const draw = duration ?? markerListDrawFrames(rest);
  return handEnter + draw + handExit;
};

/** Hidden DOM layout element used to wrap words cleanly under the loaded font. */
export const HiddenTokensBlock: React.FC<{
  tokens: Token[];
  maxWidth?: number;
  align?: TextAlign;
  fontSize: number;
  fontFamily: string;
  fontWeight: number | string;
  letterSpacing?: number | string;
  lineHeight: number;
  containerRef: (el: HTMLDivElement | null) => void;
}> = ({
  tokens,
  maxWidth,
  align = "left",
  fontSize,
  fontFamily,
  fontWeight,
  letterSpacing,
  lineHeight,
  containerRef,
}) => (
  <div
    ref={containerRef}
    style={{
      position: "relative",
      width: maxWidth ?? "max-content",
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      textAlign: align,
      whiteSpace: maxWidth ? "normal" : "pre",
    }}
  >
    {tokens.map((tok, i) => {
      if (tok.kind === "newline") return <br key={i} />;
      if (tok.kind === "space") return " ";
      return (
        <span
          key={i}
          data-cluster={i}
          style={{display: "inline-block"}}
        >
          {tok.parts.map((p, j) => (
            <span key={j}>{p.text}</span>
          ))}
        </span>
      );
    })}
  </div>
);

/** Reads wrapped line geometry from a measured HiddenTokensBlock container. */
export const readWrappedLines = (
  containerEl: HTMLDivElement | null,
  tokens: Token[],
  {
    x,
    y,
    fontSize,
    scribbles,
  }: {x: number; y: number; fontSize: number; scribbles: number},
): {lines: MeasuredLine[]; contentHeight: number} => {
  if (!containerEl) return {lines: [], contentHeight: 0};

  const els = Array.from(
    containerEl.querySelectorAll<HTMLElement>("[data-cluster]"),
  );
  if (els.length === 0) return {lines: [], contentHeight: 0};

  type Placed = {
    left: number;
    top: number;
    width: number;
    height: number;
    parts: MarkerPart[];
  };

  const rowTol = Math.max(2, fontSize * 0.18);
  const rows: Placed[][] = [];

  for (const el of els) {
    const idx = Number(el.dataset.cluster);
    const tok = tokens[idx];
    if (!tok || tok.kind !== "cluster") continue;
    const placed: Placed = {
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
      parts: tok.parts,
    };
    const lastRow = rows[rows.length - 1];
    if (!lastRow || Math.abs(placed.top - lastRow[0].top) > rowTol) {
      rows.push([placed]);
    } else {
      lastRow.push(placed);
    }
  }

  const padX = Math.ceil(fontSize * 0.14);
  const padY = Math.ceil(fontSize * 0.12);
  let minTopAll = Infinity;
  let maxBottomAll = 0;

  const lines: MeasuredLine[] = rows.map((row) => {
    const minLeft = Math.min(...row.map((c) => c.left));
    const maxRight = Math.max(...row.map((c) => c.left + c.width));
    const minTop = Math.min(...row.map((c) => c.top));
    const maxBottom = Math.max(...row.map((c) => c.top + c.height));
    minTopAll = Math.min(minTopAll, minTop);
    maxBottomAll = Math.max(maxBottomAll, maxBottom);

    const rawParts: MarkerPart[] = [];
    row.forEach((c, idx) => {
      if (idx > 0) rawParts.push({text: " "});
      rawParts.push(...c.parts);
    });
    const parts = mergeAdjacentParts(rawParts);
    const chars = parts.reduce((n, p) => n + p.text.length, 0);
    const lineScribbles = Math.max(2, Math.round((scribbles * chars) / 14));

    return {
      parts,
      x: x + minLeft - padX,
      y: y + minTop - padY,
      // +4px avoids 1px subpixel shave at the end of a wrapped line
      w: maxRight - minLeft + padX * 2 + 4,
      h: maxBottom - minTop + padY * 2,
      padX,
      padY,
      chars,
      scribbles: lineScribbles,
    };
  });

  const contentHeight =
    rows.length > 0 ? Math.max(0, maxBottomAll - minTopAll) : 0;
  return {lines, contentHeight};
};

/** Allocates per-line durations + hop intervals inside a fixed `totalDuration` budget. */
export const buildLineTimeline = (
  lines: MeasuredLine[],
  totalDuration: number,
  defaultTravel: number,
) => {
  if (lines.length === 0) {
    return {
      slots: [] as Array<{start: number; end: number}>,
      entries: [] as TimelineEntry[],
      travels: [] as number[],
    };
  }

  const rawTravels = lines
    .slice(0, -1)
    .map((l) => l.travelAfter ?? defaultTravel);
  const sumRawTravel = rawTravels.reduce((a, b) => a + b, 0);
  const maxTravelBudget = Math.floor(totalDuration * 0.45);
  const travelScale =
    sumRawTravel > maxTravelBudget && sumRawTravel > 0
      ? maxTravelBudget / sumRawTravel
      : 1;
  const travels = rawTravels.map((t) => Math.floor(t * travelScale));
  const usedTravel = travels.reduce((a, b) => a + b, 0);
  const drawBudget = Math.max(lines.length, totalDuration - usedTravel);

  const weights = lines.map((l) => Math.max(1, l.chars));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const durations = weights.map((w) =>
    Math.max(1, Math.round((w / totalWeight) * drawBudget)),
  );
  // Adjust rounding drift on the longest line so slots end exactly at totalDuration
  const diff = drawBudget - durations.reduce((a, b) => a + b, 0);
  if (diff !== 0) {
    let maxIdx = 0;
    durations.forEach((d, i) => {
      if (d > durations[maxIdx]) maxIdx = i;
    });
    durations[maxIdx] = Math.max(1, durations[maxIdx] + diff);
  }

  const slots: Array<{start: number; end: number}> = [];
  let cursor = 0;
  durations.forEach((d, i) => {
    const start = i === 0 ? 0 : cursor + travels[i - 1];
    const end = start + d;
    slots.push({start, end});
    cursor = end;
  });

  const entries: TimelineEntry[] = lines.map((line, i) => ({
    kind: "reveal",
    duration: durations[i],
    box: {x: line.x, y: line.y, w: line.w, h: line.h},
    mode: "sweep",
    bands: 1,
    scribbles: line.scribbles,
    linear: true,
  }));

  return {slots, entries, travels};
};

/** Computes hand pose across multi-line entries even when gaps vary per line. */
export const multiLineHandAt = (
  localFrame: number,
  lines: MeasuredLine[],
  totalDuration: number,
  defaultTravel: number,
  lift: number,
): {x: number; y: number; rotate: number} => {
  if (lines.length === 0) return {x: 0, y: 0, rotate: 0};
  const {slots, entries} = buildLineTimeline(lines, totalDuration, defaultTravel);

  // Use timeline.ts's handAt for each pair/slot by normalizing uniform travel or interpolating directly
  const f = Math.min(totalDuration, Math.max(0, localFrame));
  for (let i = 0; i < lines.length; i++) {
    const {start, end} = slots[i];
    if (f >= start && f <= end) {
      const p = handAt(f - start, [entries[i]], {
        enter: 0,
        travel: 0,
        exit: 0,
        lift,
        away: DEFAULT_AWAY,
      });
      return p ?? {x: lines[i].x, y: lines[i].y + lines[i].h / 2, rotate: 0};
    }
    if (i < lines.length - 1 && f > end && f < slots[i + 1].start) {
      const gap = slots[i + 1].start - end;
      const pose = handAt(entries[i].duration + (f - end), [entries[i], entries[i + 1]], {
        enter: 0,
        travel: gap,
        exit: 0,
        lift,
        away: DEFAULT_AWAY,
      });
      return pose ?? {x: lines[i + 1].x, y: lines[i + 1].y + lines[i + 1].h / 2, rotate: 0};
    }
  }
  const last = lines[lines.length - 1];
  return {x: last.x + last.w, y: last.y + last.h / 2, rotate: 0};
};

/** Renders a sequence of measured lines with one hand. */
export const MultiLineRenderer: React.FC<{
  lines: MeasuredLine[];
  localFrame: number;
  drawDuration: number;
  handEnter: number;
  handExit: number;
  lineTravel: number;
  lineLift: number;
  showHand: boolean;
  hand?: MarkerParagraphProps["hand"];
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: number | string;
  letterSpacing?: number | string;
}> = ({
  lines,
  localFrame,
  drawDuration,
  handEnter,
  handExit,
  lineTravel,
  lineLift,
  showHand,
  hand,
  fontSize,
  color,
  fontFamily,
  fontWeight,
  letterSpacing,
}) => {
  const {slots} = buildLineTimeline(lines, drawDuration, lineTravel);
  const drawFrame = localFrame - handEnter;
  const total = handEnter + drawDuration + handExit;

  const away = (() => {
    if (localFrame < handEnter) {
      const t = handEnter > 0 ? Math.min(1, Math.max(0, localFrame / handEnter)) : 1;
      return Math.pow(1 - t, 3);
    }
    if (localFrame > handEnter + drawDuration) {
      const t =
        handExit > 0
          ? Math.min(1, Math.max(0, (localFrame - (handEnter + drawDuration)) / handExit))
          : 1;
      return Math.pow(t, 3);
    }
    return 0;
  })();

  const handVisible = showHand && lines.length > 0 && localFrame >= 0 && localFrame <= total;
  const pose = handVisible
    ? multiLineHandAt(drawFrame, lines, drawDuration, lineTravel, lineLift)
    : null;

  return (
    <>
      {lines.map((line, i) => {
        const progress = progressAt(drawFrame, slots[i]);
        const {clipPath} = reveal("sweep", progress, line.w, line.h, 1, line.scribbles, {
          unit: "px",
          linear: true,
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: line.x,
              top: line.y,
              width: line.w,
              height: line.h,
              clipPath,
            }}
          >
            <MarkerTextContent
              parts={line.parts}
              fontSize={fontSize}
              color={color}
              fontFamily={fontFamily}
              fontWeight={fontWeight}
              letterSpacing={letterSpacing}
              padding={`${line.padY}px ${line.padX}px`}
            />
          </div>
        );
      })}
      {pose ? (
        <HandPen
          tipX={pose.x}
          tipY={pose.y}
          rotate={pose.rotate}
          offsetX={away * DEFAULT_AWAY.x}
          offsetY={away * DEFAULT_AWAY.y}
          scale={0.55}
          {...hand}
        />
      ) : null}
    </>
  );
};

/**
 * Multi-line marker text that wraps automatically at `maxWidth` (or on `\n`)
 * and is written line-by-line by a single hand.
 */
export const MarkerParagraph: React.FC<MarkerParagraphProps> = ({
  text,
  parts,
  maxWidth,
  align = "left",
  lineHeight = PARAGRAPH_DEFAULTS.lineHeight,
  fontSize = PARAGRAPH_DEFAULTS.fontSize,
  color = PARAGRAPH_DEFAULTS.color,
  fontFamily = PARAGRAPH_DEFAULTS.fontFamily,
  fontWeight = PARAGRAPH_DEFAULTS.fontWeight,
  letterSpacing,
  x = 0,
  y = 0,
  delay = 0,
  duration,
  framesPerChar = PARAGRAPH_DEFAULTS.framesPerChar,
  handEnter = PARAGRAPH_DEFAULTS.handEnter,
  handExit = PARAGRAPH_DEFAULTS.handExit,
  lineTravel = PARAGRAPH_DEFAULTS.lineTravel,
  lineLift = PARAGRAPH_DEFAULTS.lineLift,
  showHand = true,
  hand,
  scribbles = PARAGRAPH_DEFAULTS.scribbles,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const tokens = tokenizeParts(markerParts(text, parts));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = useState<MeasuredLine[] | null>(null);
  const [handle] = useState(() => delayRender("Measuring MarkerParagraph"));
  const sig = JSON.stringify([
    text,
    parts,
    maxWidth,
    align,
    lineHeight,
    fontSize,
    fontFamily,
    fontWeight,
    letterSpacing,
    x,
    y,
    scribbles,
  ]);

  useLayoutEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await (document as Document).fonts?.ready;
      } catch {
        // fallback font measurement is safer than hanging
      }
      if (cancelled) return;
      const measured = readWrappedLines(containerRef.current, tokens, {
        x,
        y,
        fontSize,
        scribbles,
      });
      setLines(measured.lines);
      continueRender(handle);
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const measurer = (
    <div style={{position: "absolute", left: 0, top: 0, visibility: "hidden", pointerEvents: "none"}}>
      <HiddenTokensBlock
        tokens={tokens}
        maxWidth={maxWidth}
        align={align}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        letterSpacing={letterSpacing}
        lineHeight={lineHeight}
        containerRef={(el) => {
          containerRef.current = el;
        }}
      />
    </div>
  );

  if (!lines) return measurer;

  const drawDuration =
    duration ??
    markerParagraphDrawFrames({
      text,
      parts,
      fontSize,
      maxWidth,
      framesPerChar,
      lineTravel,
    });

  return (
    <div style={style}>
      {measurer}
      <MultiLineRenderer
        lines={lines}
        localFrame={f}
        drawDuration={drawDuration}
        handEnter={handEnter}
        handExit={handExit}
        lineTravel={lineTravel}
        lineLift={lineLift}
        showHand={showHand}
        hand={hand}
        fontSize={fontSize}
        color={color}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        letterSpacing={letterSpacing}
      />
    </div>
  );
};

/**
 * Bullet, dash, checkmark, or numbered marker list with automatic wrapping
 * and single-hand sequential writing.
 */
export const MarkerList: React.FC<MarkerListProps> = ({
  items,
  marker = "bullet",
  markerColor,
  indent,
  itemGap,
  maxWidth,
  lineHeight = PARAGRAPH_DEFAULTS.lineHeight,
  fontSize = PARAGRAPH_DEFAULTS.fontSize,
  color = PARAGRAPH_DEFAULTS.color,
  fontFamily = PARAGRAPH_DEFAULTS.fontFamily,
  fontWeight = PARAGRAPH_DEFAULTS.fontWeight,
  letterSpacing,
  x = 0,
  y = 0,
  delay = 0,
  duration,
  framesPerChar = PARAGRAPH_DEFAULTS.framesPerChar,
  handEnter = PARAGRAPH_DEFAULTS.handEnter,
  handExit = PARAGRAPH_DEFAULTS.handExit,
  lineTravel = PARAGRAPH_DEFAULTS.lineTravel,
  itemTravel = 6,
  lineLift = PARAGRAPH_DEFAULTS.lineLift,
  showHand = true,
  hand,
  scribbles = PARAGRAPH_DEFAULTS.scribbles,
  style,
}) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const col = indent ?? Math.round(fontSize * 1.15);
  const gap = itemGap ?? Math.round(fontSize * 0.42);
  const resolvedMarkerColor =
    markerColor ?? (marker === "check" ? "#3aa845" : color);
  const bodyMax = maxWidth ? Math.max(120, maxWidth - col) : undefined;

  const tokenizedItems = items.map((item) =>
    tokenizeParts(normalizeListItem(item)),
  );

  const markerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const bodyRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [lines, setLines] = useState<MeasuredLine[] | null>(null);
  const [handle] = useState(() => delayRender("Measuring MarkerList"));

  const sig = JSON.stringify([
    items,
    marker,
    resolvedMarkerColor,
    col,
    gap,
    maxWidth,
    lineHeight,
    fontSize,
    fontFamily,
    fontWeight,
    letterSpacing,
    x,
    y,
    scribbles,
    itemTravel,
  ]);

  useLayoutEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await (document as Document).fonts?.ready;
      } catch {
        // fallback font measurement is safer than hanging
      }
      if (cancelled) return;

      const padX = Math.ceil(fontSize * 0.14);
      const padY = Math.ceil(fontSize * 0.12);
      const all: MeasuredLine[] = [];
      let cursorY = y;

      tokenizedItems.forEach((tokens, idx) => {
        const glyph = listMarkerGlyph(marker, idx);
        const mEl = markerRefs.current[idx];
        const mWidth = mEl ? mEl.offsetWidth : Math.ceil(fontSize * 0.6);
        const mHeight = mEl ? mEl.offsetHeight : Math.ceil(fontSize * lineHeight);

        const body = readWrappedLines(bodyRefs.current[idx], tokens, {
          x: x + col,
          y: cursorY,
          fontSize,
          scribbles,
        });

        all.push({
          parts: [{text: glyph, color: resolvedMarkerColor}],
          x: x - padX,
          y: cursorY - padY,
          w: mWidth + padX * 2 + 2,
          h: mHeight + padY * 2,
          padX,
          padY,
          chars: glyph.length + 1,
          scribbles: 2,
          travelAfter: 2,
        });

        body.lines.forEach((line, lIdx) => {
          const isLastLineOfItem = lIdx === body.lines.length - 1;
          all.push({
            ...line,
            travelAfter: isLastLineOfItem ? itemTravel : lineTravel,
          });
        });

        const itemHeight = Math.max(mHeight, body.contentHeight || fontSize * lineHeight);
        cursorY += itemHeight + gap;
      });

      setLines(all);
      continueRender(handle);
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const measurer = (
    <div style={{position: "absolute", left: 0, top: 0, visibility: "hidden", pointerEvents: "none"}}>
      {tokenizedItems.map((tokens, idx) => (
        <React.Fragment key={idx}>
          <div
            ref={(el) => {
              markerRefs.current[idx] = el;
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              fontFamily,
              fontSize,
              fontWeight,
              letterSpacing,
              lineHeight,
              whiteSpace: "nowrap",
            }}
          >
            {listMarkerGlyph(marker, idx)}
          </div>
          <HiddenTokensBlock
            tokens={tokens}
            maxWidth={bodyMax}
            align="left"
            fontSize={fontSize}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            letterSpacing={letterSpacing}
            lineHeight={lineHeight}
            containerRef={(el) => {
              bodyRefs.current[idx] = el;
            }}
          />
        </React.Fragment>
      ))}
    </div>
  );

  if (!lines) return measurer;

  const drawDuration =
    duration ??
    markerListDrawFrames({
      items,
      fontSize,
      maxWidth,
      indent: col,
      framesPerChar,
      lineTravel,
      itemTravel,
      marker,
    });

  return (
    <div style={style}>
      {measurer}
      <MultiLineRenderer
        lines={lines}
        localFrame={f}
        drawDuration={drawDuration}
        handEnter={handEnter}
        handExit={handExit}
        lineTravel={lineTravel}
        lineLift={lineLift}
        showHand={showHand}
        hand={hand}
        fontSize={fontSize}
        color={color}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        letterSpacing={letterSpacing}
      />
    </div>
  );
};
