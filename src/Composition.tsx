import React from "react";
import {AbsoluteFill, staticFile} from "remotion";
import {ASSETS, DrawOn, fit} from "./whiteboard";

/** 9:16 YouTube Short, 30 fps. */
export const DEMO_WIDTH = 1080;
export const DEMO_HEIGHT = 1920;
export const DEMO_FPS = 30;
export const DEMO_DURATION = 300; // 10 s

/**
 * Three pictures drawn one after another, each by the hand:
 *  1. line-art money stack (top)  2. the character (bottom left)  3. coloured cash (bottom right)
 */
export const WhiteboardDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: "#ffffff"}}>
      {/* 1. sketch: biggest picture, slowest */}
      <DrawOn
        src={staticFile(ASSETS.moneySketch.file)}
        {...fit(ASSETS.moneySketch, {width: 760})}
        x={160}
        y={40}
        delay={0}
        duration={100}
        bands={9}
      />

      {/* 2. character */}
      <DrawOn
        src={staticFile(ASSETS.man.file)}
        {...fit(ASSETS.man, {height: 940})}
        x={30}
        y={930}
        delay={125}
        duration={80}
        bands={8}
      />

      {/* 3. coloured cash: small object, quick */}
      <DrawOn
        src={staticFile(ASSETS.moneyColor.file)}
        {...fit(ASSETS.moneyColor, {width: 440})}
        x={600}
        y={1400}
        delay={235}
        duration={36}
        bands={4}
        hand={{scale: 0.6}}
      />
    </AbsoluteFill>
  );
};
