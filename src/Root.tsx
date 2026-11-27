import React from "react";
import {Composition} from "remotion";
import {
  Scene1,
  SCENE1_DURATION,
  SCENE1_FPS,
  SCENE1_HEIGHT,
  SCENE1_WIDTH,
} from "./compositions/scene1";
import {
  Scene2,
  SCENE2_DURATION,
  SCENE2_FPS,
  SCENE2_HEIGHT,
  SCENE2_WIDTH,
} from "./compositions/scene2";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Scene1"
        component={Scene1}
        durationInFrames={SCENE1_DURATION}
        fps={SCENE1_FPS}
        width={SCENE1_WIDTH}
        height={SCENE1_HEIGHT}
      />
      <Composition
        id="Scene2"
        component={Scene2}
        durationInFrames={SCENE2_DURATION}
        fps={SCENE2_FPS}
        width={SCENE2_WIDTH}
        height={SCENE2_HEIGHT}
      />
    </>
  );
};