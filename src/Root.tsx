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
import {
  Scene3,
  SCENE3_DURATION,
  SCENE3_FPS,
  SCENE3_HEIGHT,
  SCENE3_WIDTH,
} from "./compositions/scene3";
import {
  Scene4,
  SCENE4_DURATION,
  SCENE4_FPS,
  SCENE4_HEIGHT,
  SCENE4_WIDTH,
} from "./compositions/scene4";

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
      <Composition
        id="Scene3"
        component={Scene3}
        durationInFrames={SCENE3_DURATION}
        fps={SCENE3_FPS}
        width={SCENE3_WIDTH}
        height={SCENE3_HEIGHT}
      />
      <Composition
        id="Scene4"
        component={Scene4}
        durationInFrames={SCENE4_DURATION}
        fps={SCENE4_FPS}
        width={SCENE4_WIDTH}
        height={SCENE4_HEIGHT}
      />
    </>
  );
};