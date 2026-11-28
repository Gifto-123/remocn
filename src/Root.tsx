import React from "react";
import {Composition, Folder} from "remotion";
import {
  ComponentShowcase,
  SECTIONS,
  SHOWCASE_DURATION,
  SHOWCASE_FPS,
  SHOWCASE_HEIGHT,
  SHOWCASE_WIDTH,
  sectionComponent,
} from "./compositions/showcase";

/** One composition per section, built once so component identity stays stable. */
const SECTION_COMPOSITIONS = SECTIONS.map((section) => ({
  section,
  Component: sectionComponent(section),
}));

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ComponentShowcase"
        component={ComponentShowcase}
        durationInFrames={SHOWCASE_DURATION}
        fps={SHOWCASE_FPS}
        width={SHOWCASE_WIDTH}
        height={SHOWCASE_HEIGHT}
      />
      <Folder name="Components">
        {SECTION_COMPOSITIONS.map(({section, Component}) => (
          <Composition
            key={section.id}
            id={section.id}
            component={Component}
            durationInFrames={section.duration}
            fps={SHOWCASE_FPS}
            width={SHOWCASE_WIDTH}
            height={SHOWCASE_HEIGHT}
          />
        ))}
      </Folder>
    </>
  );
};
