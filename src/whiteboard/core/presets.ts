/**
 * Canvas aspect presets for Remotion compositions and the audio telemetry pipeline.
 */

export type AspectRatio = "9:16" | "16:9";

export type CanvasPreset = {
  width: number;
  height: number;
  fps: number;
  aspect: AspectRatio;
};

export const CANVAS_PRESETS = {
  youtubeShort: {width: 1080, height: 1920, fps: 30, aspect: "9:16"},
  youtubeLong: {width: 1920, height: 1080, fps: 30, aspect: "16:9"},
  youtubeLong60: {width: 1920, height: 1080, fps: 60, aspect: "16:9"},
  youtubeLong4k: {width: 3840, height: 2160, fps: 30, aspect: "16:9"},
} as const satisfies Record<string, CanvasPreset>;

export type CanvasPresetName = keyof typeof CANVAS_PRESETS;

export const presetForAspect = (aspect: AspectRatio): CanvasPreset =>
  aspect === "16:9" ? CANVAS_PRESETS.youtubeLong : CANVAS_PRESETS.youtubeShort;
