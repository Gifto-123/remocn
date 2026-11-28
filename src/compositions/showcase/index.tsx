import React from "react";
import {CANVAS_PRESETS, PaperSurface} from "../../whiteboard";
import {EDITORIAL_PALETTE as P} from "../../whiteboard/components/EditorialCard";
import {Beat} from "../../whiteboard/components/SceneKit";
import {SECTIONS, type Section} from "./sections";

export const SHOWCASE_WIDTH = CANVAS_PRESETS.youtubeShort.width;
export const SHOWCASE_HEIGHT = CANVAS_PRESETS.youtubeShort.height;
export const SHOWCASE_FPS = CANVAS_PRESETS.youtubeShort.fps;

/** Absolute start frame of each section in the full reel. */
const STARTS = SECTIONS.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SECTIONS[i - 1].duration);
  return acc;
}, []);
export const SHOWCASE_DURATION = STARTS[STARTS.length - 1] + SECTIONS[SECTIONS.length - 1].duration;

const Surface: React.FC<{children: React.ReactNode}> = ({children}) => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    {children}
  </PaperSurface>
);

/** Every reusable component, one section after another. */
export const ComponentShowcase: React.FC = () => (
  <Surface>
    {SECTIONS.map((s, i) => (
      <Beat key={s.id} from={STARTS[i]} to={STARTS[i] + s.duration} last={i === SECTIONS.length - 1}>
        <s.Body />
      </Beat>
    ))}
  </Surface>
);

/** One section on its own, for focused preview in Studio. */
export const sectionComponent = (section: Section): React.FC => {
  const Single: React.FC = () => (
    <Surface>
      <Beat from={0} to={section.duration} last>
        <section.Body />
      </Beat>
    </Surface>
  );
  Single.displayName = `Showcase(${section.id})`;
  return Single;
};

export {SECTIONS};
