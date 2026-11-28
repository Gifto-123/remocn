import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import {createTikTokStyleCaptions, type Caption, type TikTokPage} from "@remotion/captions";
import {fitText} from "@remotion/layout-utils";
import {EDITORIAL_FONTS, EDITORIAL_PALETTE as P} from "../core/theme";

/**
 * Word-highlight captions for Shorts (1080x1920). Official Remotion flow:
 * Whisper JSON -> `toCaptions()` (scripts/to-captions.mjs) -> Caption[] JSON in public/
 * -> `createTikTokStyleCaptions()` pages -> one <Sequence> per page.
 *
 * Usage inside a scene (render it last so it sits above the visuals):
 *   const captions = useCaptions("narration/<id>/<id>.captions.json");
 *   ...
 *   {captions ? <Captions captions={captions} /> : null}
 */

/** Shorts-safe caption band (px, 1080x1920): clear of the title block above and the UI below. */
export const CAPTION_SAFE_ZONE = {top: 1250, bottom: 1450} as const;

/** Loads a Caption[] JSON from public/. Holds the render until it has loaded. */
export const useCaptions = (src: string): Caption[] | null => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const [handle] = useState(() => delayRender(`Loading captions ${src}`));

  const fetchCaptions = useCallback(async () => {
    try {
      const response = await fetch(staticFile(src));
      if (!response.ok) {
        throw new Error(`Could not load captions ${src}: ${response.status}`);
      }
      const data = (await response.json()) as Caption[];
      setCaptions(data);
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [src, continueRender, cancelRender, handle]);

  useEffect(() => {
    fetchCaptions();
  }, [fetchCaptions]);

  return captions;
};

type Look = {
  x: number;
  top: number;
  height: number;
  width: number;
  maxFontSize: number;
  minFontSize: number;
  uppercase: boolean;
  textColor: string;
  highlightColor: string;
  strokeColor: string;
};

const CaptionPage: React.FC<{page: TikTokPage; look: Look}> = ({page, look}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Frame is relative to the Sequence; token times are absolute, so add the page start.
  const absoluteTimeMs = page.startMs + (frame / fps) * 1000;

  const label = look.uppercase ? page.text.trim().toUpperCase() : page.text.trim();
  const fitted = fitText({
    text: label,
    withinWidth: look.width,
    fontFamily: EDITORIAL_FONTS.head,
    fontWeight: 800,
  }).fontSize;
  const fontSize = Math.max(look.minFontSize, Math.min(look.maxFontSize, fitted));

  return (
    <div
      style={{
        position: "absolute",
        left: look.x,
        top: look.top,
        width: look.width,
        height: look.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity: interpolate(frame, [0, 3], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: interpolate(frame, [0, 0.25 * fps], [0.88, 1], {
          easing: Easing.spring({damping: 14}),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          output: "perceptual-scale",
        }),
        transformOrigin: "50% 50%",
      }}
    >
      <div
        style={{
          fontFamily: EDITORIAL_FONTS.head,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.12,
          whiteSpace: "pre-wrap",
          WebkitTextStroke: `${Math.round(fontSize * 0.12)}px ${look.strokeColor}`,
          paintOrder: "stroke fill",
        }}
      >
        {page.tokens.map((token, tokenIndex) => {
          const isActive = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
          return (
            <span
              key={`${token.fromMs}-${tokenIndex}`}
              style={{color: isActive ? look.highlightColor : look.textColor}}
            >
              {look.uppercase ? token.text.toUpperCase() : token.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export type CaptionsProps = {
  captions: Caption[];
  /** Page-size dial. Higher = more words per page, lower = closer to word-by-word. */
  combineTokensWithinMilliseconds?: number;
  /** Caption band in px. Defaults to CAPTION_SAFE_ZONE (y 1250-1450). */
  top?: number;
  bottom?: number;
  /** Left edge and width. Defaults keep ~160px clear of the Shorts button column on the right. */
  x?: number;
  width?: number;
  maxFontSize?: number;
  minFontSize?: number;
  uppercase?: boolean;
  textColor?: string;
  highlightColor?: string;
  strokeColor?: string;
};

export const Captions: React.FC<CaptionsProps> = ({
  captions,
  combineTokensWithinMilliseconds = 800,
  top = CAPTION_SAFE_ZONE.top,
  bottom = CAPTION_SAFE_ZONE.bottom,
  x = 60,
  width = 860,
  maxFontSize = 110,
  minFontSize = 64,
  uppercase = true,
  textColor = P.ink,
  highlightColor = P.terracotta,
  strokeColor = P.paperCard,
}) => {
  const {fps} = useVideoConfig();

  const {pages} = useMemo(
    () => createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds}),
    [captions, combineTokensWithinMilliseconds],
  );

  const look: Look = {
    x,
    top,
    height: bottom - top,
    width,
    maxFontSize,
    minFontSize,
    uppercase,
    textColor,
    highlightColor,
    strokeColor,
  };

  return (
    <>
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const maxPageMs = Math.max(combineTokensWithinMilliseconds, page.durationMs);
        const endFrame = Math.min(
          nextPage ? Math.round((nextPage.startMs / 1000) * fps) : Infinity,
          startFrame + Math.round((maxPageMs / 1000) * fps),
        );
        const durationInFrames = endFrame - startFrame;

        if (durationInFrames <= 0) {
          return null;
        }

        return (
          <Sequence key={index} from={startFrame} durationInFrames={durationInFrames}>
            <CaptionPage page={page} look={look} />
          </Sequence>
        );
      })}
    </>
  );
};
