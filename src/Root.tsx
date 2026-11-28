import React from "react";
import {Composition, Folder} from "remotion";
import {
  ComponentShowcase,
  SECTION_GROUPS,
  SHOWCASE_DURATION,
  SHOWCASE_FPS,
  SHOWCASE_HEIGHT,
  SHOWCASE_WIDTH,
  sectionComponent,
} from "./compositions/showcase";

/** One composition per section, built once so component identity stays stable. */
const GROUPS = SECTION_GROUPS.map(({category, sections}) => ({
  category,
  items: sections.map((section) => ({section, Component: sectionComponent(section)})),
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
        {GROUPS.map(({category, items}) => (
          <Folder key={category.id} name={category.title}>
            {items.map(({section, Component}) => (
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
        ))}
      </Folder>
    </>
  );
};
