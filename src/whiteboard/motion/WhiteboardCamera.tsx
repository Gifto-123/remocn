import React from "react";
import {AbsoluteFill, Easing, useCurrentFrame, useVideoConfig} from "remotion";

export type CameraKeyframe = {
  /** Frame when the camera begins gliding to this pose (after holding the previous one). */
  frame: number;
  /** Board X coordinate (px) placed at the centre of the viewport. */
  x: number;
  /** Board Y coordinate (px) placed at the centre of the viewport. */
  y: number;
  /** Zoom scale (1 = 1:1 board px, >1 = zoom in, <1 = zoom out). Default 1. */
  zoom?: number;
  /** Camera roll in degrees. Default 0. */
  rotate?: number;
  /** Frames taken to glide into this keyframe. Default 22. Ignored on keyframe 0. */
  glide?: number;
};

export type CameraPose = {
  x: number;
  y: number;
  zoom: number;
  rotate: number;
};

export type WhiteboardCameraProps = {
  /** Virtual board dimensions in px. Defaults to the composition size. */
  boardWidth?: number;
  boardHeight?: number;
  /** Optional board background colour. Default "#ffffff". */
  backgroundColor?: string;
  /** Ordered camera keyframes. */
  keyframes: CameraKeyframe[];
  /** Default glide duration (frames) when a keyframe omits `glide`. Default 22. */
  defaultGlide?: number;
  /** Easing curve applied to each pan/zoom glide. Default cubic in-out. */
  easing?: (t: number) => number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const defaultEase = Easing.inOut(Easing.cubic);

/** Pure camera solver: computes {x, y, zoom, rotate} at `frame`. */
export const cameraAt = (
  frame: number,
  keyframes: CameraKeyframe[],
  {
    defaultGlide = 22,
    easing = defaultEase,
    fallback = {x: 0, y: 0, zoom: 1, rotate: 0},
  }: {
    defaultGlide?: number;
    easing?: (t: number) => number;
    fallback?: CameraPose;
  } = {},
): CameraPose => {
  if (keyframes.length === 0) return fallback;

  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
  const first = sorted[0];
  let pose: CameraPose = {
    x: first.x,
    y: first.y,
    zoom: first.zoom ?? 1,
    rotate: first.rotate ?? 0,
  };

  if (frame <= first.frame) return pose;

  for (let i = 1; i < sorted.length; i++) {
    const kf = sorted[i];
    const target: CameraPose = {
      x: kf.x,
      y: kf.y,
      zoom: kf.zoom ?? pose.zoom,
      rotate: kf.rotate ?? 0,
    };
    const dur = Math.max(0, kf.glide ?? defaultGlide);
    const start = kf.frame;
    const end = start + dur;

    if (frame < start) {
      return pose;
    }
    if (frame < end && dur > 0) {
      const t = easing(clamp01((frame - start) / dur));
      const z0 = Math.max(0.01, pose.zoom);
      const z1 = Math.max(0.01, target.zoom);
      return {
        x: pose.x + (target.x - pose.x) * t,
        y: pose.y + (target.y - pose.y) * t,
        // Logarithmic zoom interpolation keeps perceived zoom speed steady
        zoom: z0 * Math.pow(z1 / z0, t),
        rotate: pose.rotate + (target.rotate - pose.rotate) * t,
      };
    }
    pose = target;
  }

  return pose;
};

/** Helper to build a keyframe that fits an entire board inside the viewport. */
export const fitBoardPose = (
  boardWidth: number,
  boardHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding = 0,
): CameraPose => {
  const usableW = Math.max(1, viewportWidth - padding * 2);
  const usableH = Math.max(1, viewportHeight - padding * 2);
  return {
    x: boardWidth / 2,
    y: boardHeight / 2,
    zoom: Math.min(usableW / boardWidth, usableH / boardHeight),
    rotate: 0,
  };
};

/**
 * Virtual pan-and-zoom camera over a large whiteboard canvas.
 * Children are positioned in board pixel coordinates; layout measurements
 * remain undistorted because scaling happens on the outer transform wrapper.
 */
export const WhiteboardCamera: React.FC<WhiteboardCameraProps> = ({
  boardWidth,
  boardHeight,
  backgroundColor = "#ffffff",
  keyframes,
  defaultGlide = 22,
  easing = defaultEase,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const {width: vw, height: vh} = useVideoConfig();
  const bw = boardWidth ?? vw;
  const bh = boardHeight ?? vh;

  const pose = cameraAt(frame, keyframes, {
    defaultGlide,
    easing,
    fallback: {x: bw / 2, y: bh / 2, zoom: 1, rotate: 0},
  });

  const transform = `translate(${vw / 2}px, ${vh / 2}px) rotate(${pose.rotate}deg) scale(${pose.zoom}) translate(${-pose.x}px, ${-pose.y}px)`;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: bw,
          height: bh,
          backgroundColor,
          transformOrigin: "0 0",
          transform,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
