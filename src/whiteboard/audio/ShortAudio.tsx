import React from "react";
import {Audio} from "@remotion/media";
import {staticFile} from "remotion";

export type ShortAudioProps = {
  /** Short id, e.g. "short1". SFX defaults to `audio/<short>/sfx.wav`. */
  short: string;
  /** Voice-over path under public/, e.g. "narration/short1/short1.mp3". Omit to skip. */
  voice?: string;
  /** Override the rendered SFX path under public/. */
  sfx?: string;
  voiceVolume?: number;
  sfxVolume?: number;
};

/** Plays the narration and the baked SFX master (already ducked under the voice). */
export const ShortAudio: React.FC<ShortAudioProps> = ({
  short,
  voice,
  sfx = `audio/${short}/sfx.wav`,
  voiceVolume = 1,
  sfxVolume = 1,
}) => (
  <>
    {voice ? <Audio src={staticFile(voice)} volume={voiceVolume} /> : null}
    <Audio src={staticFile(sfx)} volume={sfxVolume} />
  </>
);
