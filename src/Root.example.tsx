// Add these Compositions to your own src/Root.tsx.
import React from "react";
import {Composition} from "remotion";
import {
  DEMO_DURATION,
  DEMO_FPS,
  DEMO_HEIGHT,
  DEMO_WIDTH,
  WhiteboardDemo,
} from "./compositions/WhiteboardDemo";
import {
  MarkerTextDemo,
  TEXT_DEMO_DURATION,
  TEXT_DEMO_FPS,
  TEXT_DEMO_HEIGHT,
  TEXT_DEMO_WIDTH,
} from "./compositions/MarkerTextDemo";

import {
  SCENE_DEMO_DURATION,
  SCENE_DEMO_FPS,
  SCENE_DEMO_HEIGHT,
  SCENE_DEMO_WIDTH,
  WhiteboardSceneDemo,
} from "./compositions/WhiteboardSceneDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WhiteboardDemo"
        component={WhiteboardDemo}
        durationInFrames={DEMO_DURATION}
        fps={DEMO_FPS}
        width={DEMO_WIDTH}
        height={DEMO_HEIGHT}
      />
      <Composition
        id="MarkerTextDemo"
        component={MarkerTextDemo}
        durationInFrames={TEXT_DEMO_DURATION}
        fps={TEXT_DEMO_FPS}
        width={TEXT_DEMO_WIDTH}
        height={TEXT_DEMO_HEIGHT}
      />
      <Composition
        id="WhiteboardSceneDemo"
        component={WhiteboardSceneDemo}
        durationInFrames={SCENE_DEMO_DURATION}
        fps={SCENE_DEMO_FPS}
        width={SCENE_DEMO_WIDTH}
        height={SCENE_DEMO_HEIGHT}
      />
    </>
  );
};
