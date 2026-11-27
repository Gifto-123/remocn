import React from "react";
import {Composition} from "remotion";
import {
  Scene1,
  SCENE1_DURATION,
  SCENE1_FPS,
  SCENE1_HEIGHT,
  SCENE1_WIDTH,
} from "./compositions/scene1";

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
    </>
  );
};
