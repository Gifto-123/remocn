import React from "react";
import {EDITORIAL_PALETTE as P} from "../core/theme";
import {INK} from "./DrawnProps";

/**
 * Recurring character for the faceless channel: oversized round head, rounded torso,
 * thin stick arms and legs. Pure SVG, so reveal it with <Draw> and a planHand slot:
 *
 *   <Draw {...slot} x={300} y={500} width={420} height={(420 * 620) / 360}>
 *     <Person pose="worried" shirt="green" width={420} />
 *   </Draw>
 *
 * viewBox is 360x620, so height = width * 620 / 360.
 */

export type PersonPose = "stand" | "happy" | "worried" | "shrug" | "point" | "holding";
export type PersonOutfit = "hoodie" | "sweater" | "suit";
export type PersonHair = "bald" | "short" | "side" | "ponytail";

export const PERSON_SHIRTS = {
  green: "#6C9A4E",
  red: "#A93A3A",
  blue: "#4A6FA5",
  mustard: P.mustard,
  slate: P.slate,
  terracotta: P.terracotta,
  navy: "#1F2A44",
} as const;

export type PersonShirt = keyof typeof PERSON_SHIRTS | (string & {});

type Pt = [number, number];
type Arm = {elbow: Pt; hand: Pt};

const SHOULDER_L: Pt = [118, 282];
const SHOULDER_R: Pt = [242, 282];

const ARMS: Record<PersonPose, {l: Arm; r: Arm}> = {
  stand: {l: {elbow: [92, 350], hand: [86, 424]}, r: {elbow: [268, 350], hand: [274, 424]}},
  happy: {l: {elbow: [78, 300], hand: [70, 232]}, r: {elbow: [282, 300], hand: [290, 232]}},
  worried: {l: {elbow: [88, 334], hand: [146, 266]}, r: {elbow: [272, 334], hand: [214, 266]}},
  shrug: {l: {elbow: [70, 346], hand: [34, 294]}, r: {elbow: [290, 346], hand: [326, 294]}},
  point: {l: {elbow: [92, 350], hand: [86, 424]}, r: {elbow: [302, 282], hand: [338, 272]}},
  holding: {l: {elbow: [92, 352], hand: [150, 352]}, r: {elbow: [268, 352], hand: [210, 352]}},
};

const CALM = {
  browL: "M138 114 Q156 104 174 110",
  browR: "M196 110 Q214 104 232 114",
  mouth: "M160 176 Q184 192 208 176",
};

const FACE: Record<PersonPose, {browL: string; browR: string; mouth: string}> = {
  stand: CALM,
  holding: CALM,
  point: {...CALM, mouth: "M158 172 Q184 190 210 172"},
  happy: {
    browL: "M138 108 Q156 94 174 102",
    browR: "M196 102 Q214 94 232 108",
    mouth: "M150 168 Q184 208 218 168",
  },
  worried: {
    browL: "M136 122 L176 102",
    browR: "M192 102 L232 122",
    mouth: "M158 184 Q171 172 184 184 T210 184",
  },
  shrug: {
    browL: "M138 106 Q156 94 174 104",
    browR: "M196 104 Q214 94 232 106",
    mouth: "M162 182 Q186 174 208 184",
  },
};

const darken = (hex: string, amount: number): string => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#2F3A3A";
  const n = parseInt(m[1], 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};

export type PersonProps = {
  /** Rendered width in px. Height is width * 620 / 360. */
  width: number;
  pose?: PersonPose;
  /** A key of PERSON_SHIRTS ("green", "red", ...) or any #RRGGBB color. */
  shirt?: PersonShirt;
  outfit?: PersonOutfit;
  hair?: PersonHair;
  hairColor?: string;
  skin?: string;
  /** Mirror left/right (e.g. to make "point" aim left). */
  flip?: boolean;
  /** SVG drawn in front of the torso, centered at (180, 352) in the 360x620 viewBox. */
  held?: React.ReactNode;
};

export const Person: React.FC<PersonProps> = ({
  width,
  pose = "stand",
  shirt = "green",
  outfit = "hoodie",
  hair = "bald",
  hairColor,
  skin = "#DDA574",
  flip = false,
  held,
}) => {
  const shirtColor = shirt in PERSON_SHIRTS ? PERSON_SHIRTS[shirt as keyof typeof PERSON_SHIRTS] : shirt;
  const shirtDark = darken(shirtColor, 0.25);
  const baseColor = darken(shirtColor, 0.55);
  const hairFill = hairColor ?? (hair === "ponytail" ? "#7A5236" : "#14192B");
  const arms = ARMS[pose];
  const face = FACE[pose];

  const armPath = (s: Pt, a: Arm) => `M${s[0]} ${s[1]} Q${a.elbow[0]} ${a.elbow[1]} ${a.hand[0]} ${a.hand[1]}`;

  return (
    <svg width={width} height={(width * 620) / 360} viewBox="0 0 360 620">
      <g transform={flip ? "translate(360 0) scale(-1 1)" : undefined}>
        {/* ground shadow */}
        <ellipse cx={180} cy={590} rx={84} ry={16} fill="rgba(86, 70, 40, 0.32)" />

        {/* legs: plain stick legs, nothing worn on them */}
        <path d="M156 430 L152 576 L134 584" fill="none" strokeWidth={6} {...INK} />
        <path d="M204 430 L208 576 L226 584" fill="none" strokeWidth={6} {...INK} />

        {/* hair behind the head */}
        {hair === "ponytail" ? (
          <g>
            <path
              d="M262 70 Q332 82 320 178 Q314 214 288 236 Q306 168 268 120 Z"
              fill={hairFill}
              strokeWidth={5}
              {...INK}
            />
            <ellipse cx={266} cy={96} rx={12} ry={17} fill="#8E2F3C" strokeWidth={4} {...INK} />
          </g>
        ) : null}

        {/* torso */}
        <path
          d="M112 282 Q112 252 142 250 H218 Q248 252 248 282 V404 Q248 440 214 440 H146 Q112 440 112 404 Z"
          fill={shirtColor}
          strokeWidth={6}
          {...INK}
        />
        {outfit === "suit" ? null : (
          <path
            d="M112 398 H248 V404 Q248 440 214 440 H146 Q112 440 112 404 Z"
            fill={baseColor}
            strokeWidth={6}
            {...INK}
          />
        )}

        {/* neck */}
        <rect x={168} y={228} width={24} height={30} fill={skin} strokeWidth={5} {...INK} />

        {/* outfit details */}
        {outfit === "hoodie" ? (
          <g>
            <path
              d="M126 266 Q180 236 234 266 L222 282 Q180 258 138 282 Z"
              fill={shirtDark}
              strokeWidth={5}
              {...INK}
            />
            <path d="M140 372 H220 L230 408 H130 Z" fill="none" strokeWidth={4} {...INK} />
            <path d="M168 280 V326 M192 280 V326" fill="none" strokeWidth={4} {...INK} />
          </g>
        ) : null}
        {outfit === "sweater" ? (
          <g>
            <rect x={148} y={236} width={64} height={36} rx={12} fill={shirtColor} strokeWidth={5} {...INK} />
            <path d="M160 242 V266 M172 242 V266 M184 242 V266 M196 242 V266" fill="none" strokeWidth={3} {...INK} />
            <path d="M112 408 H248" fill="none" strokeWidth={4} {...INK} />
          </g>
        ) : null}
        {outfit === "suit" ? (
          <g>
            <path d="M158 252 L180 304 L202 252 Z" fill="#FFFDF7" strokeWidth={5} {...INK} />
            <path d="M180 266 L171 280 L180 336 L189 280 Z" fill={P.crimson} strokeWidth={4} {...INK} />
            <path d="M146 252 L172 340 M214 252 L188 340 M180 340 V440" fill="none" strokeWidth={4} {...INK} />
          </g>
        ) : null}

        {/* arms */}
        <path d={armPath(SHOULDER_L, arms.l)} fill="none" strokeWidth={6} {...INK} />
        <path d={armPath(SHOULDER_R, arms.r)} fill="none" strokeWidth={6} {...INK} />
        {pose === "point" ? (
          <path d="M338 272 L358 265" fill="none" strokeWidth={5} {...INK} />
        ) : null}

        {/* held object, then hands on top of it */}
        {held ? <g transform="translate(180 352)">{held}</g> : null}
        {[arms.l.hand, arms.r.hand].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={7} fill={skin} strokeWidth={3} {...INK} />
        ))}

        {/* head */}
        <circle cx={180} cy={130} r={100} fill={skin} strokeWidth={6} {...INK} />
        <path d="M180 30 A100 100 0 0 0 180 230 A55 100 0 0 1 180 30 Z" fill="rgba(120, 70, 30, 0.18)" />

        {/* hair on the head */}
        {hair === "short" || hair === "ponytail" ? (
          <path
            d="M82 128 Q70 34 180 28 Q290 34 278 128 Q262 90 226 82 Q180 72 134 82 Q98 90 82 128 Z"
            fill={hairFill}
            strokeWidth={5}
            {...INK}
          />
        ) : null}
        {hair === "side" ? (
          <g>
            <path
              d="M82 124 Q72 30 182 26 Q292 34 278 124 Q256 84 214 76 Q168 70 140 96 Q108 104 82 124 Z"
              fill={hairFill}
              strokeWidth={5}
              {...INK}
            />
            <path d="M168 32 Q162 58 148 78" fill="none" stroke="rgba(255, 255, 255, 0.28)" strokeWidth={3} strokeLinecap="round" />
          </g>
        ) : null}

        {/* face */}
        <ellipse cx={158} cy={138} rx={6} ry={8} fill={P.ink} />
        <ellipse cx={210} cy={138} rx={6} ry={8} fill={P.ink} />
        <path d={face.browL} fill="none" strokeWidth={4} {...INK} />
        <path d={face.browR} fill="none" strokeWidth={4} {...INK} />
        <path d={face.mouth} fill="none" strokeWidth={5} {...INK} />
      </g>
    </svg>
  );
};
