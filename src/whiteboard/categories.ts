/**
 * Component categories: the single source of truth for how src/whiteboard is organised.
 * Folder = category id. Studio folders and the CLAUDE.md map are generated from / mirror this.
 *
 * Layering (lower may not import higher):
 *   core -> annotations -> illustration -> data -> layout -> motion -> audio
 * Theme tokens (palette, fonts, helpers) live in core/theme.ts so every category can use them.
 * One known exception: data/ComparisonTable is built on motion/Whiteboard, and Whiteboard
 * renders data/Charts. File-level imports stay acyclic.
 * Inside src/whiteboard import sibling files directly ("../core/HandPen"), never a folder barrel.
 * Barrels (e.g. "../../whiteboard/data") are for compositions.
 */
export const CATEGORIES = [
  {id: "core", title: "Core", visualTypes: "all", summary: "Pen, writing, image reveal, hand scheduling, timeline, presets"},
  {id: "annotations", title: "Annotations", visualTypes: "D", summary: "Circle, underline, arrow, check, cross, strike, bracket, highlighter, eraser, frame"},
  {id: "data", title: "Data", visualTypes: "B", summary: "Charts, candlesticks, counters, money flow, tables, company building"},
  {id: "illustration", title: "Illustration", visualTypes: "A, C", summary: "Person, bubbles, money props, drawn props"},
  {id: "layout", title: "Layout", visualTypes: "all", summary: "Theme, SceneKit (Beat, Pic, T), paper surface, lower third, captions"},
  {id: "motion", title: "Motion", visualTypes: "all", summary: "Whiteboard, camera, transitions"},
  {id: "audio", title: "Audio", visualTypes: "all", summary: "SFX synth, master mix, WhiteboardAudio"},
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
