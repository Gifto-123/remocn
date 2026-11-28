import React from "react";
import {markerParts, type MarkerPart} from "../core/MarkerText";
import {
  Whiteboard,
  whiteboardDuration,
  type WhiteboardItem,
  type WhiteboardProps,
} from "../motion/Whiteboard";

export type ComparisonRow = {
  left: string | MarkerPart[];
  right: string | MarkerPart[];
  leftColor?: string;
  rightColor?: string;
};

export type ComparisonTableProps = {
  /** Top-left position in parent px. */
  x?: number;
  y?: number;
  /** Total width of the 2-column table in px. */
  width: number;

  leftTitle: string | MarkerPart[];
  rightTitle: string | MarkerPart[];
  leftTitleColor?: string;
  rightTitleColor?: string;

  rows: ComparisonRow[];

  /** Optional badge drawn in front of each cell ("cross" = ✕, "check" = ✓). */
  leftBadge?: "cross" | "none";
  rightBadge?: "check" | "none";

  /** Draw a rounded outer frame around the T-chart. Default false. */
  bordered?: boolean;
  borderColor?: string;
  fill?: string;
  /** Draw faint horizontal dividers between body rows. Default true. */
  rowDividers?: boolean;
  /** Use a double hand-drawn line under the header. Default true. */
  doubleHeaderLine?: boolean;
  lineColor?: string;

  headerFontSize?: number;
  cellFontSize?: number;
  textColor?: string;
  fontFamily?: string;

  delay?: number;
  enter?: number;
  travel?: number;
  exit?: number;
  lift?: number;
  showHand?: boolean;
  hand?: WhiteboardProps["hand"];
};

export const TABLE_DEFAULTS = {
  leftTitleColor: "#d62828",
  rightTitleColor: "#3aa845",
  leftBadge: "none" as "cross" | "none",
  rightBadge: "none" as "check" | "none",
  bordered: false,
  borderColor: "#111111",
  rowDividers: true,
  doubleHeaderLine: true,
  lineColor: "#111111",
  headerFontSize: 54,
  cellFontSize: 42,
  textColor: "#111111",
  enter: 8,
  travel: 5,
  exit: 10,
  lift: 32,
};

const toParts = (v: string | MarkerPart[]): MarkerPart[] =>
  typeof v === "string" ? markerParts(v) : v;

/** Wraps MarkerPart[] into lines of roughly `maxChars` without splitting words. */
const wrapCellParts = (parts: MarkerPart[], maxChars: number): MarkerPart[][] => {
  const explicitLines: MarkerPart[][] = [[]];
  for (const part of parts) {
    const segs = part.text.split("\n");
    segs.forEach((seg, idx) => {
      if (idx > 0) explicitLines.push([]);
      if (seg.length > 0) {
        explicitLines[explicitLines.length - 1].push({
          text: seg,
          color: part.color,
        });
      }
    });
  }

  const out: MarkerPart[][] = [];
  for (const lineParts of explicitLines) {
    // Flatten into word tokens preserving colour
    const words: Array<{parts: MarkerPart[]; len: number}> = [];
    let current: MarkerPart[] = [];
    let currentLen = 0;

    const flushWord = () => {
      if (current.length > 0) {
        words.push({parts: current, len: currentLen});
        current = [];
        currentLen = 0;
      }
    };

    for (const p of lineParts) {
      const pieces = p.text.split(/([ \t]+)/);
      for (const piece of pieces) {
        if (!piece) continue;
        if (/^[ \t]+$/.test(piece)) {
          flushWord();
        } else {
          current.push({text: piece, color: p.color});
          currentLen += piece.length;
        }
      }
    }
    flushWord();

    if (words.length === 0) {
      out.push([{text: ""}]);
      continue;
    }

    let line: MarkerPart[] = [];
    let len = 0;
    for (const w of words) {
      const addLen = len === 0 ? w.len : 1 + w.len;
      if (len > 0 && len + addLen > maxChars) {
        out.push(line);
        line = [...w.parts];
        len = w.len;
      } else {
        if (len > 0) line.push({text: " "});
        line.push(...w.parts);
        len += addLen;
      }
    }
    if (line.length > 0) out.push(line);
  }
  return out;
};

/**
 * Generates the ordered WhiteboardItem[] list for a 2-column T-chart / table.
 * You can also spread these items directly inside a larger <Whiteboard /> scene.
 */
export const comparisonTableItems = ({
  x = 0,
  y = 0,
  width,
  leftTitle,
  rightTitle,
  leftTitleColor = TABLE_DEFAULTS.leftTitleColor,
  rightTitleColor = TABLE_DEFAULTS.rightTitleColor,
  rows,
  leftBadge = TABLE_DEFAULTS.leftBadge,
  rightBadge = TABLE_DEFAULTS.rightBadge,
  bordered = TABLE_DEFAULTS.bordered,
  borderColor = TABLE_DEFAULTS.borderColor,
  fill,
  rowDividers = TABLE_DEFAULTS.rowDividers,
  doubleHeaderLine = TABLE_DEFAULTS.doubleHeaderLine,
  lineColor = TABLE_DEFAULTS.lineColor,
  headerFontSize = TABLE_DEFAULTS.headerFontSize,
  cellFontSize = TABLE_DEFAULTS.cellFontSize,
  textColor = TABLE_DEFAULTS.textColor,
  fontFamily,
}: Omit<
  ComparisonTableProps,
  "delay" | "enter" | "travel" | "exit" | "lift" | "showHand" | "hand"
>): WhiteboardItem[] => {
  const colW = width / 2;
  const padX = 28;
  const headerBottomPad = doubleHeaderLine ? 16 : 6;
  const headerH = Math.round(headerFontSize * 1.75) + headerBottomPad;
  const lineStep = Math.round(cellFontSize * 1.24);
  const badgeSize = Math.round(cellFontSize * 0.95);
  const leftBadgeGap = leftBadge === "cross" ? badgeSize + 14 : 0;
  const rightBadgeGap = rightBadge === "check" ? badgeSize + 14 : 0;

  const leftAvailW = Math.max(100, colW - padX * 2 - leftBadgeGap);
  const rightAvailW = Math.max(100, colW - padX * 2 - rightBadgeGap);
  const maxCharsLeft = Math.max(8, Math.floor(leftAvailW / (cellFontSize * 0.54)));
  const maxCharsRight = Math.max(8, Math.floor(rightAvailW / (cellFontSize * 0.54)));

  const measuredRows = rows.map((row) => {
    const leftLines = wrapCellParts(toParts(row.left), maxCharsLeft);
    const rightLines = wrapCellParts(toParts(row.right), maxCharsRight);
    const maxLines = Math.max(leftLines.length, rightLines.length);
    const rowH = Math.max(
      Math.round(cellFontSize * 1.9),
      maxLines * lineStep + 34,
    );
    return {row, leftLines, rightLines, rowH};
  });

  const bodyH = measuredRows.reduce((n, r) => n + r.rowH, 0);
  const totalH = headerH + bodyH;

  const items: WhiteboardItem[] = [];

  if (bordered) {
    items.push({
      type: "frame",
      x,
      y,
      width,
      height: totalH,
      radius: 36,
      color: borderColor,
      strokeWidth: 10,
      fill,
    });
  }

  // Center vertical divider
  items.push({
    type: "divider",
    x: x + colW,
    y: y + 12,
    length: Math.max(40, totalH - 24),
    orientation: "vertical",
    color: lineColor,
    strokeWidth: 8,
  });

  // Header horizontal divider
  const headerLineY = y + headerH - headerBottomPad;
  items.push({
    type: "divider",
    x: x + 14,
    y: headerLineY,
    length: Math.max(40, width - 28),
    orientation: "horizontal",
    double: doubleHeaderLine,
    gap: 10,
    color: lineColor,
    strokeWidth: 8,
  });

  // Column headers
  items.push({
    type: "text",
    parts: toParts(leftTitle),
    x: x + padX,
    y: y + Math.round((headerLineY - y - headerFontSize * 1.25) / 2),
    fontSize: headerFontSize,
    color: leftTitleColor,
    fontFamily,
  });
  items.push({
    type: "text",
    parts: toParts(rightTitle),
    x: x + colW + padX,
    y: y + Math.round((headerLineY - y - headerFontSize * 1.25) / 2),
    fontSize: headerFontSize,
    color: rightTitleColor,
    fontFamily,
  });

  // Body rows
  let cursorY = y + headerH;
  measuredRows.forEach((mr, rIdx) => {
    if (rIdx > 0 && rowDividers) {
      items.push({
        type: "divider",
        x: x + 22,
        y: cursorY,
        length: Math.max(40, width - 44),
        orientation: "horizontal",
        color: "#cbd5e1",
        strokeWidth: 5,
      });
    }

    const cellTop = cursorY + 14;

    if (leftBadge === "cross") {
      items.push({
        type: "cross",
        x: x + padX,
        y: cellTop + 6,
        size: badgeSize,
        color: "#d62828",
        strokeWidth: 9,
      });
    }
    mr.leftLines.forEach((parts, lIdx) => {
      items.push({
        type: "text",
        parts,
        x: x + padX + leftBadgeGap,
        y: cellTop + lIdx * lineStep,
        fontSize: cellFontSize,
        color: mr.row.leftColor ?? textColor,
        fontFamily,
      });
    });

    if (rightBadge === "check") {
      items.push({
        type: "check",
        x: x + colW + padX,
        y: cellTop + 6,
        size: badgeSize,
        color: "#3aa845",
        strokeWidth: 9,
      });
    }
    mr.rightLines.forEach((parts, lIdx) => {
      items.push({
        type: "text",
        parts,
        x: x + colW + padX + rightBadgeGap,
        y: cellTop + lIdx * lineStep,
        fontSize: cellFontSize,
        color: mr.row.rightColor ?? textColor,
        fontFamily,
      });
    });

    cursorY += mr.rowH;
  });

  return items;
};

/** Total frames a ComparisonTable occupies (delay not included). */
export const comparisonTableDuration = ({
  enter = TABLE_DEFAULTS.enter,
  travel = TABLE_DEFAULTS.travel,
  exit = TABLE_DEFAULTS.exit,
  ...rest
}: Omit<ComparisonTableProps, "delay" | "lift" | "showHand" | "hand">) =>
  whiteboardDuration(comparisonTableItems(rest), {enter, travel, exit});

/**
 * A hand-drawn 2-column T-chart / comparison table rendered by one continuous hand.
 */
export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  delay = 0,
  enter = TABLE_DEFAULTS.enter,
  travel = TABLE_DEFAULTS.travel,
  exit = TABLE_DEFAULTS.exit,
  lift = TABLE_DEFAULTS.lift,
  showHand = true,
  hand,
  ...rest
}) => (
  <Whiteboard
    items={comparisonTableItems(rest)}
    delay={delay}
    enter={enter}
    travel={travel}
    exit={exit}
    lift={lift}
    showHand={showHand}
    hand={hand}
  />
);
