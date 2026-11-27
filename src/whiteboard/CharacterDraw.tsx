import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {HandPen} from "./HandPen";

export type CharacterDrawProps = {
  text: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  delay?: number;
  duration?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  color?: string;
  backgroundColor?: string;
  handScale?: number;
  showHand?: boolean;
  style?: React.CSSProperties;
};

export const characterDrawDuration = ({duration = 90}: Pick<CharacterDrawProps, "duration"> = {}) =>
  Math.max(1, duration);

/** Draws character-by-character text with a pen hand following the active glyph. */
export const CharacterDraw: React.FC<CharacterDrawProps> = ({
  text,
  width = 1080,
  height = 300,
  x = 0,
  y = 0,
  delay = 0,
  duration = 90,
  fontSize,
  fontFamily = "Arial, sans-serif",
  fontWeight = 800,
  color = "#1e293b",
  backgroundColor = "transparent",
  handScale = 0.55,
  showHand = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - delay;
  const safeDuration = Math.max(1, duration);
  const resolvedFontSize = fontSize ?? Math.max(32, width * 0.07);
  const characters = Array.from(text);
  const startX = width * 0.08;
  const startY = height * 0.56;

  const visibleCount = Math.floor(
    interpolate(localFrame, [0, safeDuration], [0, characters.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    })
  );

  const letters = characters.map((character, index) => {
    const letterFrame = localFrame - (safeDuration * index) / Math.max(1, characters.length);
    const opacity = interpolate(letterFrame, [0, 8], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const rise = interpolate(letterFrame, [0, 10], [12, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

    return {character, index, opacity, rise};
  });

  const visibleLetters = letters.slice(0, visibleCount);
  const penProgress = interpolate(localFrame, [0, safeDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const penIndex = Math.min(characters.length - 1, visibleCount);
  const approximateCharacterWidth = resolvedFontSize * 0.58;
  const penX = startX + Math.max(0, penIndex - 0.15) * approximateCharacterWidth;
  const penY = startY + resolvedFontSize * 0.15;

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
        fontFamily,
        ...style,
      }}
    >
      <div
        aria-label={text}
        style={{
          position: "absolute",
          left: startX,
          top: startY - resolvedFontSize,
          width: width - startX * 1.6,
          height: resolvedFontSize * 1.35,
          display: "flex",
          alignItems: "flex-end",
          whiteSpace: "nowrap",
          fontSize: resolvedFontSize,
          fontWeight,
          lineHeight: 1,
          letterSpacing: "0.015em",
          color,
        }}
      >
        {visibleLetters.map(({character, index, opacity, rise}) => (
          <span
            key={`${character}-${index}`}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${rise}px)`,
            }}
          >
            {character === " " ? "\u00A0" : character}
          </span>
        ))}
      </div>

      {showHand && characters.length > 0 && localFrame >= 0 && localFrame <= safeDuration ? (
        <HandPen
          tipX={penX}
          tipY={penY}
          scale={handScale}
          rotate={-8 + penProgress * 4}
          offsetX={-4}
          offsetY={8}
          opacity={interpolate(localFrame, [0, 6, safeDuration - 8, safeDuration], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      ) : null}
    </div>
  );
};

export default CharacterDraw;
