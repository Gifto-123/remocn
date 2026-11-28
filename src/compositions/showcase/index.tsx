import React from "react";
import {CATEGORIES} from "../../whiteboard/categories";
import {CANVAS_PRESETS, EDITORIAL_PALETTE as P} from "../../whiteboard/core";
import {Beat, PaperSurface} from "../../whiteboard/layout";
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

/** Sections grouped by category, in CATEGORIES order. Drives the Studio folders. */
export const SECTION_GROUPS = CATEGORIES.map((category) => ({
  category,
  sections: SECTIONS.filter((s) => s.category === category.id),
})).filter((g) => g.sections.length > 0);

export {SECTIONS};
