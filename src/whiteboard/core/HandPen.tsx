import React from "react";
import {Img, staticFile} from "remotion";
import {HAND_PEN} from "./assets";

/** A pixel number, or any CSS length such as "40%" (relative to the parent box). */
type Length = number | string;

export type HandPenProps = {
  /** Where the pen tip should be, in the parent's coordinate space. */
  tipX: Length;
  tipY: Length;
  /** Size of the hand relative to the PNG (1 = native pixels). */
  scale?: number;
  /** Tilt in degrees, applied around the pen tip. */
  rotate?: number;
  /** Extra shift in px, used to slide the hand in and out of frame. */
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  /** Override the hand image. If you do, also pass `tip` and `size`. */
  src?: string;
  /** Pen-tip position inside the image, in source pixels. */
  tip?: {x: number; y: number};
  /** Source size of the image, in px. Only needed with a custom `src`. */
  size?: {width: number; height: number};
};

const at = (v: Length, delta: number): number | string =>
  typeof v === "number" ? v + delta : `calc(${v} + ${delta}px)`;

/**
 * The hand holding the pen. It is positioned by its pen tip, so whatever
 * you pass as tipX / tipY is exactly where the ink "lands".
 * Render it inside a `position: relative | absolute` parent.
 */
export const HandPen: React.FC<HandPenProps> = ({
  tipX,
  tipY,
  scale = 0.7,
  rotate = 0,
  offsetX = 0,
  offsetY = 0,
  opacity = 1,
  src,
  tip = HAND_PEN.tip,
  size = {width: HAND_PEN.width, height: HAND_PEN.height},
}) => {
  const tipLocalX = tip.x * scale;
  const tipLocalY = tip.y * scale;

  return (
    <Img
      src={src ?? staticFile(HAND_PEN.file)}
      style={{
        position: "absolute",
        left: at(tipX, -tipLocalX + offsetX),
        top: at(tipY, -tipLocalY + offsetY),
        width: size.width * scale,
        height: size.height * scale,
        transformOrigin: `${tipLocalX}px ${tipLocalY}px`,
        rotate: `${rotate}deg`,
        opacity,
        filter: "drop-shadow(0px 8px 10px rgba(0, 0, 0, 0.22))",
        pointerEvents: "none",
      }}
    />
  );
};
