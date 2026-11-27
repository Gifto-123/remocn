import React from "react";
import {DrawOn, type DrawOnProps} from "./DrawOn";

export type MarkerPart = {
  text: string;
  /** Overrides the line colour for this part, e.g. a green "$10" next to a black "/DAY". */
  color?: string;
};

export type MarkerTextProps = {
  /** The line of text. Use `parts` instead for mixed colours. Single line only. */
  text?: string;
  parts?: MarkerPart[];

  fontSize?: number;
  /** Default colour for the whole line. */
  color?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  letterSpacing?: number | string;

  /** Top-left position of the text box inside the parent, in px. */
  x?: number;
  y?: number;

  /** Frames before the hand starts coming in. Default 0. */
  delay?: number;
  /** Frames the pen spends writing. Default: about 2.4 frames per character. */
  duration?: number;
  /** Frames per character when `duration` is not set. Default 2.4. */
  framesPerChar?: number;
  handEnter?: DrawOnProps["handEnter"];
  handExit?: DrawOnProps["handExit"];
  showHand?: DrawOnProps["showHand"];
  /** Hand size / image overrides. Default scale is 0.55. */
  hand?: DrawOnProps["hand"];
  /** Up-and-down scribbles of the pen over the whole line. Default 5. */
  scribbles?: number;

  style?: React.CSSProperties;
};

/**
 * Bold rounded font used in the demo. Load it once with `fonts.ts`
 * (needs `npx remotion add @remotion/google-fonts`), or pass your own `fontFamily`.
 */
export const MARKER_FONT_STACK =
  '"Fredoka", "Baloo 2", "Comic Sans MS", "Trebuchet MS", sans-serif';

/** Normalises `text` / `parts` into a list of coloured parts. */
export const markerParts = (text?: string, parts?: MarkerPart[]): MarkerPart[] =>
  parts ?? [{text: text ?? ""}];

/**
 * Frames the pen needs to write a line (hand slide in/out not included).
 * Handy to chain lines: delay = previous delay + markerTextDuration(...) + handEnter + handExit.
 */
export const markerTextDuration = ({
  text,
  parts,
  framesPerChar = 2.4,
  minFrames = 14,
}: {
  text?: string;
  parts?: MarkerPart[];
  framesPerChar?: number;
  minFrames?: number;
}) => {
  const length = markerParts(text, parts).reduce((n, p) => n + p.text.length, 0);
  return Math.max(minFrames, Math.round(length * framesPerChar));
};

export type MarkerTextContentProps = {
  parts: MarkerPart[];
  fontSize: number;
  color: string;
  fontFamily: string;
  fontWeight: number | string;
  letterSpacing?: number | string;
  padding?: string;
};

/** The styled text itself, shared by MarkerText and Whiteboard. */
export const MarkerTextContent: React.FC<MarkerTextContentProps> = ({
  parts,
  fontSize,
  color,
  fontFamily,
  fontWeight,
  letterSpacing,
  padding = "0.12em 0.14em",
}) => (
  <div
    style={{
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      color,
      lineHeight: 1.15,
      // room for glyph overhang, so the clip never shaves the letters
      padding,
      whiteSpace: "nowrap",
    }}
  >
    {parts.map((piece, i) => (
      <span key={i} style={piece.color ? {color: piece.color} : undefined}>
        {piece.text}
      </span>
    ))}
  </div>
);

/**
 * A line of text that is written left to right while the hand follows the pen.
 * The box wraps the text, so no width needs to be measured or passed in.
 */
export const MarkerText: React.FC<MarkerTextProps> = ({
  text,
  parts,
  fontSize = 96,
  color = "#111111",
  fontFamily = MARKER_FONT_STACK,
  fontWeight = 700,
  letterSpacing,
  x = 0,
  y = 0,
  delay = 0,
  duration,
  framesPerChar,
  handEnter,
  handExit,
  showHand,
  hand,
  scribbles = 5,
  style,
}) => {
  const frames = duration ?? markerTextDuration({text, parts, framesPerChar});

  return (
    <DrawOn
      mode="sweep"
      linear
      x={x}
      y={y}
      delay={delay}
      duration={frames}
      handEnter={handEnter}
      handExit={handExit}
      showHand={showHand}
      scribbles={scribbles}
      hand={{scale: 0.55, ...hand}}
      style={style}
    >
      <MarkerTextContent
        parts={markerParts(text, parts)}
        fontSize={fontSize}
        color={color}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        letterSpacing={letterSpacing}
      />
    </DrawOn>
  );
};
