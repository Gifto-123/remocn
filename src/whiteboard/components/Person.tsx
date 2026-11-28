import React from "react";
import {EDITORIAL_PALETTE as P} from "./EditorialCard";
import {INK} from "./DrawnProps";

export type PersonPose = "stand" | "happy" | "worried" | "shrug" | "point" | "hold";

const SKIN = "#DDA871";

const ARMS: Record<PersonPose, [string, string]> = {
  stand: ["M126 262Q104 330 108 420", "M234 262Q256 330 252 420"],
  happy: ["M126 262Q70 230 62 150", "M234 262Q290 230 298 150"],
  worried: ["M126 262Q96 230 138 186", "M234 262Q264 230 222 186"],
  shrug: ["M126 262Q80 300 58 250", "M234 262Q280 300 302 250"],
  point: ["M126 262Q104 330 108 420", "M234 262Q290 250 338 226"],
  hold: ["M126 262Q104 340 150 380", "M234 262Q256 340 210 380"],
};

const BROWS: Record<PersonPose, string> = {
  stand: "M142 104Q156 98 170 104M190 104Q204 98 218 104",
  happy: "M142 100Q156 92 170 100M190 100Q204 92 218 100",
  worried: "M140 108L168 96M220 108L192 96",
  shrug: "M142 104Q156 98 170 104M190 104Q204 98 218 104",
  point: "M142 104Q156 98 170 104M190 104Q204 98 218 104",
  hold: "M142 104Q156 98 170 104M190 104Q204 98 218 104",
};

const MOUTH: Record<PersonPose, string> = {
  stand: "M158 160Q180 176 202 160",
  happy: "M148 156Q180 200 212 156Z",
  worried: "M158 174Q180 156 202 174",
  shrug: "M160 168H200",
  point: "M156 158Q180 180 204 158",
  hold: "M158 162Q180 174 202 162",
};

/** Faceless-channel actor in the reference style (round head, stick limbs). 360x720 viewBox. */
export const Person: React.FC<{pose?: PersonPose; shirt?: string; width: number; shadow?: boolean}> = ({
  pose = "stand",
  shirt = P.sage,
  width,
  shadow = true,
}) => (
  <svg width={width} height={width * 2} viewBox="0 0 360 720">
    {shadow ? <ellipse cx={180} cy={676} rx={84} ry={14} fill="rgba(120,100,60,0.25)" /> : null}
    <path d="M162 440L156 660L128 668M198 440L204 660L232 668" fill="none" strokeWidth={6} {...INK} />
    <path
      d="M124 250Q124 226 150 226H210Q236 226 236 250V420Q236 452 180 452Q124 452 124 420Z"
      fill={shirt}
      strokeWidth={5}
      {...INK}
    />
    <path d="M150 360H210L216 396H144Z" fill="none" strokeWidth={4} {...INK} />
    <path d="M170 250V300M190 250V300" fill="none" strokeWidth={4} {...INK} />
    <path d={`${ARMS[pose][0]}M${ARMS[pose][1].slice(1)}`} fill="none" strokeWidth={6} {...INK} />
    {pose === "hold" ? (
      <g>
        <rect x={150} y={326} width={60} height={104} rx={10} fill={P.slate} strokeWidth={5} {...INK} />
        <rect x={158} y={338} width={44} height={74} rx={4} fill={P.paperCard} strokeWidth={3} {...INK} />
      </g>
    ) : null}
    <circle cx={180} cy={120} r={96} fill={SKIN} strokeWidth={5} {...INK} />
    <path d={BROWS[pose]} fill="none" strokeWidth={4} {...INK} />
    {pose === "happy" ? (
      <path d="M146 128Q156 114 166 128M194 128Q204 114 214 128" fill="none" strokeWidth={5} {...INK} />
    ) : (
      <g>
        <circle cx={156} cy={128} r={7} fill={P.ink} />
        <circle cx={204} cy={128} r={7} fill={P.ink} />
      </g>
    )}
    <path d={MOUTH[pose]} fill={pose === "happy" ? P.paperCard : "none"} strokeWidth={4} {...INK} />
  </svg>
);
