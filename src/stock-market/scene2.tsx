import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexMono";

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

const PUB = "stock-market"; // folder inside public/ that holds stock-market.wav and the whoosh files
const FPS = 30;
const OVERLAP = 15; // frames a beat stays alive under the next one
const MINUS = "\u2212";

const FONT = {
  head: loadManrope("normal", { weights: ["800"], subsets: ["latin"] }).fontFamily,
  body: loadInter("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily,
  data: loadPlex("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily,
};

const C = {
  midnight: "#101820",
  slate: "#192B3A",
  ivory: "#F2F0E9",
  gold: "#D6A85F",
  steel: "#477FA8",
  risk: "#A84C45",
  growth: "#4C896F",
  analysis: "#8A7AA8",
  neutral: "#A5A9AD",
  white: "#FFFFFF",
};

const SAFE_X = 96;

const f = (ms: number) => Math.round((ms * FPS) / 1000);

const EASE = {
  snap: Easing.bezier(0.2, 0.9, 0.1, 1),
  reveal: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
  linear: Easing.linear,
};

const prog = (
  frame: number,
  start: number,
  dur: number,
  easing: (t: number) => number = EASE.reveal,
) =>
  interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

/* ------------------------------------------------------------------ */
/* Timing: absolute ms in stock-market.json (word index in comments)   */
/* ------------------------------------------------------------------ */

const SCENE_START = 48720; // w161 "First"
const SCENE_END = 98290; // w308 "So" (Scene 3 starts here)
export const SCENE_2_DURATION = f(SCENE_END) - f(SCENE_START); // 1487 frames
const loc = (ms: number) => f(ms) - f(SCENE_START);

const T = {
  b1: { start: 48720, end: 51040 }, // w161 "First" .. w165 "damage"
  b2: { start: 51040, end: 64160 }, // w166 "On" .. w201 "%"
  b3: { start: 64160, end: 70360 }, // w202 "For" .. w221 "%"
  b4: { start: 70360, end: 78770 }, // w222 "Both" .. w246 "highs"
  b5: { start: 78770, end: 92440 }, // w247 "But" .. w285
  b6: { start: 92440, end: 98290 }, // w286 "That" .. w307 "revolution"

  // b1
  lookAt: 49440, // w162 "look"
  damage: 49990, // w164 "the damage"

  // b2
  date: 51300, // w167 "November"
  nasCard: 52470, // the NASDAQ composite
  nasChgFrom: 53670, // w "5"
  nasChgTo: 54240, // w "%"
  closing: 54500, // "closing at"
  nasLvlFrom: 55540, // w179 "22"
  nasLvlTo: 57000, // end of "617"
  spCard: 58210, // w182 "S"
  spChgFrom: 59980, // "3"
  spChgTo: 60820, // "%"
  spTo: 60950, // "to"
  spLvlFrom: 61100, // "6"
  spLvlTo: 62300, // end of "910"
  dowCard: 62950, // w196 "Dow"
  almost: 63520, // w199 "almost"
  dowChgFrom: 63700, // w200 "2"
  dowChgTo: 64000,

  // b3
  weekTitle: 64160, // w202 "For"
  nasCol: 65720, // w207 "NAS"
  nasColFrom: 66420, // w210 "down"
  nasColTo: 67520, // end of w212 "%"
  spCol: 67780, // w214 "S"
  spColFrom: 68800, // w218 "lost"
  spColTo: 69960, // w221 "%"

  // b4
  spPill: 70970, // w224 "S"
  dowPill: 72420, // w230 "Dow"
  correction: 73270, // w232
  territory: 74120, // w233
  meaning: 75150, // w234
  moreThan: 76030, // w238 "more"
  ten: 76450, // w240 "10"
  from: 76820, // w242 "from"
  record: 77730, // w245 "record"

  // b5
  biggest: 78770, // w247 "But"
  nvidia: 80050, // w252 "Nvidia"
  r1: 80910, // w253 "The"
  r1Bar: 81630, // w256 "approximately"
  r1To: 82880, // w258 "%"
  alone: 84440, // w265 "alone"
  r2: 85440, // w268 "week"
  r2Bar: 86060, // w270 "shares"
  r2To: 87090, // w273 "%"
  r3: 88530, // w278 "October"
  nearly: 90330, // w282 "nearly"
  r3To: 91410, // w284 "%"

  // b6
  thats: 92440, // w286 "That"
  extra: 92640, // w289 "extraordinary"
  reversal: 93320, // w290 "reversal"
  forACo: 93760, // w291 "for"
  oneOf: 94820, // w297 "one"
  symbols: 95700, // w302 "symbols"
  ofThe: 96060, // w303 "of"
};

/* whoosh accents: start ~100 ms before the beat they announce */
const SFX = [
  { at: 48720, file: "transition-smooth-whoosh", frames: 14 }, // scene handover
  { at: 50940, file: "whoosh-short", frames: 12 }, // b2 cards
  { at: 64060, file: "whoosh-short", frames: 12 }, // b3 week
  { at: 78670, file: "transition-smooth-whoosh", frames: 14 }, // b5 "But ... Nvidia"
  { at: 92340, file: "whoosh-short", frames: 12 }, // b6 reversal
] as const;

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const txt = (
  size: number,
  font: string,
  color: string,
  extra?: React.CSSProperties,
): React.CSSProperties => ({
  fontFamily: font,
  fontSize: size,
  color,
  lineHeight: 1.05,
  margin: 0,
  whiteSpace: "nowrap",
  ...extra,
});

const BeatBg: React.FC<{ color: string; children: React.ReactNode }> = ({
  color,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        opacity: interpolate(frame, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.reveal,
        }),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** rise-reveal: fade plus upward drift */
const rise = (frame: number, start: number, dur = 18, dy = 40): React.CSSProperties => {
  const p = prog(frame, start, dur);
  return { opacity: p, translate: `0px ${(1 - p) * dy}px` };
};

/** slide-in from the left */
const slideIn = (frame: number, start: number, dur = 16, dx = 60): React.CSSProperties => {
  const p = prog(frame, start, dur, EASE.snap);
  return { opacity: p, translate: `${(1 - p) * -dx}px 0px` };
};

const Sfx: React.FC<{ file: string; frames: number }> = ({ file, frames }) => (
  <Audio src={staticFile(`${PUB}/${file}.wav`)} volume={0.32} trimAfter={frames} />
);

/* ------------------------------------------------------------------ */
/* b1  typography-led: "First, look at the damage"                     */
/* ------------------------------------------------------------------ */

const B1: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b1.start);

  // change b1 @49990 ms, w164 "the damage": headline mask-wipes in, underline follows
  const wipe = prog(frame, at(T.damage), 18, EASE.snap);
  const under = prog(frame, at(T.damage) + 14, 22, EASE.snap);

  return (
    <BeatBg color={C.midnight}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 45% at 22% 75%, ${C.risk}55, transparent 70%)`,
        }}
      />
      {/* change b1 @48720 ms, w161 "First" and @49440 ms, w162 "look at" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 330, display: "flex", gap: 24, ...txt(56, FONT.body, C.neutral, { letterSpacing: "0.12em" }) }}>
        <span style={slideIn(frame, 0)}>FIRST,</span>
        <span style={slideIn(frame, at(T.lookAt))}>LOOK AT</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 420,
          ...txt(230, FONT.head, C.ivory),
          clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
        }}
      >
        THE DAMAGE
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 700,
          width: 1100,
          height: 10,
          backgroundColor: C.risk,
          transformOrigin: "0% 50%",
          scale: `${under} 1`,
        }}
      />
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b2  data-viz: Nov 20 closes, three index cards                      */
/* ------------------------------------------------------------------ */

type CardSpec = {
  key: string;
  x: number;
  name: string;
  cardMs: number;
  chgFrom: number;
  chgTo: number;
  chg: number;
  dec: number;
  tag: { text: string; ms: number } | null;
  lvl: { label: string; labelMs: number; from: number; to: number; value: number } | null;
};

const CARDS: CardSpec[] = [
  {
    key: "nas",
    x: 96,
    name: "NASDAQ COMPOSITE",
    cardMs: T.nasCard,
    chgFrom: T.nasChgFrom,
    chgTo: T.nasChgTo,
    chg: 5.3,
    dec: 1,
    tag: null,
    lvl: { label: "CLOSING AT", labelMs: T.closing, from: T.nasLvlFrom, to: T.nasLvlTo, value: 22617 },
  },
  {
    key: "sp",
    x: 690,
    name: "S&P 500",
    cardMs: T.spCard,
    chgFrom: T.spChgFrom,
    chgTo: T.spChgTo,
    chg: 3.7,
    dec: 1,
    tag: null,
    lvl: { label: "TO", labelMs: T.spTo, from: T.spLvlFrom, to: T.spLvlTo, value: 6910 },
  },
  {
    key: "dow",
    x: 1284,
    name: "DOW JONES",
    cardMs: T.dowCard,
    chgFrom: T.dowChgFrom,
    chgTo: T.dowChgTo,
    chg: 2,
    dec: 0,
    tag: { text: "ALMOST", ms: T.almost },
    lvl: null,
  },
];

const B2: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b2.start);

  return (
    <BeatBg color={C.slate}>
      {/* change b2 @51300 ms, w167 "November": date label */}
      <div style={{ position: "absolute", left: SAFE_X, top: 80, ...txt(76, FONT.head, C.ivory), ...slideIn(frame, at(T.date)) }}>
        NOVEMBER 20
      </div>

      {CARDS.map((c) => {
        const cardIn = prog(frame, at(c.cardMs), 18, EASE.snap);
        const chgP = prog(frame, at(c.chgFrom), at(c.chgTo) - at(c.chgFrom), EASE.snap);
        const chgText = `${MINUS}${(chgP * c.chg).toFixed(c.dec)}%`;
        const lvlP = c.lvl ? prog(frame, at(c.lvl.from), at(c.lvl.to) - at(c.lvl.from), EASE.reveal) : 0;
        return (
          <div
            key={c.key}
            style={{
              position: "absolute",
              left: c.x,
              top: 250,
              width: 540,
              height: 620,
              borderRadius: 28,
              backgroundColor: C.ivory,
              opacity: cardIn,
              translate: `0px ${(1 - cardIn) * 90}px`,
            }}
          >
            <div style={{ position: "absolute", left: 40, top: 40, ...txt(40, FONT.body, C.slate, { letterSpacing: "0.06em" }) }}>
              {c.name}
            </div>
            {c.tag ? (
              <div style={{ position: "absolute", left: 40, top: 124, ...txt(34, FONT.body, C.slate), ...rise(frame, at(c.tag.ms), 12, 14) }}>
                {c.tag.text}
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: 40,
                top: 170,
                ...txt(150, FONT.data, C.risk),
                fontVariantNumeric: "tabular-nums",
                opacity: prog(frame, at(c.chgFrom) - 6, 6),
              }}
            >
              {chgText}
            </div>
            <div style={{ position: "absolute", left: 40, top: 360, width: 460, height: 3, backgroundColor: "rgba(16,24,32,0.15)" }} />
            {c.lvl ? (
              <>
                <div style={{ position: "absolute", left: 40, top: 395, ...txt(34, FONT.body, C.slate), ...rise(frame, at(c.lvl.labelMs), 12, 14) }}>
                  {c.lvl.label}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 40,
                    top: 450,
                    ...txt(104, FONT.data, C.midnight),
                    fontVariantNumeric: "tabular-nums",
                    opacity: prog(frame, at(c.lvl.from) - 6, 6),
                  }}
                >
                  {fmt(lvlP * c.lvl.value)}
                </div>
              </>
            ) : null}
          </div>
        );
      })}
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b3  data-viz: the week, columns hanging from zero                   */
/* ------------------------------------------------------------------ */

const B3: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b3.start);

  const Y0 = 250; // zero line
  const PXP = 44; // px per 1 %, so 10 % = 440 px and 8.6 % = 378 px
  const ticks = [0, 2, 4, 6, 8, 10, 12];

  // change b3 @66420 ms, w210 "down": Nasdaq column grows to 10 %, lands by the end of w212 "%"
  const nas = prog(frame, at(T.nasColFrom), at(T.nasColTo) - at(T.nasColFrom), EASE.snap);
  // change b3 @68800 ms, w218 "lost": S&P column grows to 8.6 %, lands by the end of w221 "%"
  const sp = prog(frame, at(T.spColFrom), at(T.spColTo) - at(T.spColFrom), EASE.snap);

  const cols = [
    { x: 700, v: 10, p: nas, name: "NASDAQ", nameMs: T.nasCol, growMs: T.nasColFrom, dec: 0 },
    { x: 1100, v: 8.6, p: sp, name: "S&P 500", nameMs: T.spCol, growMs: T.spColFrom, dec: 1 },
  ];

  return (
    <BeatBg color={C.midnight}>
      {/* change b3 @64160 ms, w202 "For": title */}
      <div style={{ position: "absolute", left: SAFE_X, top: 80, ...txt(76, FONT.head, C.ivory), ...slideIn(frame, 0) }}>
        FOR THE ENTIRE WEEK
      </div>

      {ticks.map((v) => (
        <React.Fragment key={v}>
          <div
            style={{
              position: "absolute",
              left: 540,
              top: Y0 + v * PXP,
              width: 1000,
              height: v === 0 ? 4 : 2,
              backgroundColor: v === 0 ? C.ivory : "rgba(242,240,233,0.12)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 400,
              top: Y0 + v * PXP - 16,
              width: 110,
              textAlign: "right",
              ...txt(32, FONT.data, C.neutral),
            }}
          >
            {v === 0 ? "0" : `${MINUS}${v}`}
          </div>
        </React.Fragment>
      ))}

      {cols.map((c) => (
        <React.Fragment key={c.name}>
          <div style={{ position: "absolute", left: c.x, top: 160, width: 220, textAlign: "center", ...txt(40, FONT.body, C.ivory), ...slideIn(frame, at(c.nameMs), 14, 30) }}>
            {c.name}
          </div>
          <div
            style={{
              position: "absolute",
              left: c.x,
              top: Y0,
              width: 220,
              height: c.v * PXP,
              backgroundColor: C.risk,
              transformOrigin: "50% 0%",
              scale: `1 ${c.p}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: c.x - 40,
              top: 0,
              width: 300,
              textAlign: "center",
              translate: `0px ${Y0 + c.p * c.v * PXP + 24}px`,
              opacity: prog(frame, at(c.growMs), 6),
              ...txt(80, FONT.data, C.ivory),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {`${MINUS}${(c.p * c.v).toFixed(c.dec)}%`}
          </div>
        </React.Fragment>
      ))}
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b4  visual-metaphor: the index ladder, past the correction line     */
/* ------------------------------------------------------------------ */

const B4: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b4.start);

  const TOP = 200; // record-high line
  const THR = 750; // correction line (10 % below)
  const LX = 380;
  const RX = 1640;

  const line = prog(frame, 0, 20, EASE.snap);
  const thr = prog(frame, at(T.correction), 18, EASE.snap);
  const spP = prog(frame, at(T.spPill), at(73100) - at(T.spPill), EASE.inOut);
  const dowP = prog(frame, at(T.dowPill), at(74000) - at(T.dowPill), EASE.inOut);
  const bracket = prog(frame, at(T.ten), 20, EASE.snap);

  const pills = [
    { x: 560, label: "S&P 500", p: spP, ms: T.spPill },
    { x: 980, label: "DOW", p: dowP, ms: T.dowPill },
  ];

  return (
    <BeatBg color={C.ivory}>
      {/* record-high line */}
      <div
        style={{
          position: "absolute",
          left: LX,
          top: TOP,
          width: RX - LX,
          height: 5,
          backgroundColor: C.midnight,
          transformOrigin: "0% 50%",
          scale: `${line} 1`,
        }}
      />
      {/* change b4 @76820 ms, w242 "from": caption over the record line (record highs land at 77730) */}
      <div style={{ position: "absolute", left: LX, top: 140, ...txt(36, FONT.body, C.slate), ...rise(frame, at(T.from), 14, 16) }}>
        FROM THEIR PREVIOUS RECORD HIGHS
      </div>

      {/* change b4 @73270 ms, w232 "correction": threshold line draws, label words follow */}
      <div
        style={{
          position: "absolute",
          left: LX,
          top: THR,
          width: RX - LX,
          height: 0,
          borderTop: `6px dashed ${C.risk}`,
          transformOrigin: "0% 50%",
          scale: `${thr} 1`,
        }}
      />
      <div style={{ position: "absolute", left: 120, top: THR - 24, width: 220, textAlign: "right", ...txt(44, FONT.data, C.risk), opacity: thr }}>
        {`${MINUS}10%`}
      </div>
      <div style={{ position: "absolute", left: LX, top: 680, display: "flex", gap: 20, ...txt(52, FONT.head, C.risk) }}>
        <span style={rise(frame, at(T.correction), 14, 20)}>CORRECTION</span>
        <span style={rise(frame, at(T.territory), 14, 20)}>TERRITORY</span>
      </div>

      {/* change b4 @70970 and @72420 ms, w224 "S&P" and w230 "Dow": the two indexes drop from the record line to the correction line */}
      {pills.map((pl) => (
        <div
          key={pl.label}
          style={{
            position: "absolute",
            left: pl.x,
            top: 0,
            width: 300,
            height: 80,
            borderRadius: 16,
            backgroundColor: C.risk,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: prog(frame, at(pl.ms), 6),
            translate: `0px ${TOP + 14 + pl.p * (THR + 14 - (TOP + 14))}px`,
            ...txt(40, FONT.body, C.ivory),
          }}
        >
          {pl.label}
        </div>
      ))}

      {/* change b4 @75150 ms, w234 "meaning": explainer line */}
      <div style={{ position: "absolute", left: LX, top: 880, ...txt(36, FONT.body, C.slate), ...rise(frame, at(T.meaning), 14, 16) }}>
        MEANING THEY HAD FALLEN
      </div>

      {/* change b4 @76030-76450 ms, w238 "more" .. w240 "10": bracket from record line to correction line */}
      <div
        style={{
          position: "absolute",
          left: 1500,
          top: TOP,
          width: 6,
          height: THR - TOP,
          backgroundColor: C.midnight,
          transformOrigin: "50% 0%",
          scale: `1 ${bracket}`,
        }}
      />
      <div style={{ position: "absolute", left: 0, top: 450, width: 1440, textAlign: "right", ...txt(56, FONT.data, C.risk), ...rise(frame, at(T.moreThan), 14, 16) }}>
        {`MORE THAN 10%`}
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b5  data-viz: Nvidia, three drops, bars to scale (0 to 50 %)        */
/* ------------------------------------------------------------------ */

const B5: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b5.start);

  const X0 = 540;
  const PXP = 20; // px per 1 %, so 48 % = 960 px

  const rows = [
    { top: 400, label: ["FRIDAY"], labelMs: T.r1, barFrom: T.r1Bar, barTo: T.r1To, v: 14, tag: "APPROXIMATELY", tagMs: T.r1Bar, nearly: false },
    { top: 590, label: ["THE WEEK"], labelMs: T.r2, barFrom: T.r2Bar, barTo: T.r2To, v: 23, tag: null, tagMs: 0, nearly: false },
    { top: 780, label: ["VS OCTOBER", "RECORD"], labelMs: T.r3, barFrom: T.nearly, barTo: T.r3To, v: 48, tag: "NEARLY", tagMs: T.nearly, nearly: true },
  ];

  // change b5 @84440 ms, w265 "alone": "ALONE" lands on the Friday row
  const alone = rise(frame, at(T.alone), 12, 14);

  return (
    <BeatBg color={C.midnight}>
      {/* change b5 @78770 ms, w247 "But": setup line; @80050 ms, w252 "Nvidia": slams in */}
      <div style={{ position: "absolute", left: SAFE_X, top: 80, ...txt(44, FONT.body, C.neutral, { letterSpacing: "0.12em" }), ...slideIn(frame, 0) }}>
        BUT THE BIGGEST STORY
      </div>
      {(() => {
        const p = prog(frame, at(T.nvidia), 10, EASE.snap);
        return (
          <div style={{ position: "absolute", left: SAFE_X, top: 140, ...txt(150, FONT.head, C.ivory), opacity: p, scale: `${1.12 - p * 0.12}`, transformOrigin: "0% 50%" }}>
            NVIDIA
          </div>
        );
      })()}

      {rows.map((r) => {
        const p = prog(frame, at(r.barFrom), at(r.barTo) - at(r.barFrom), EASE.snap);
        return (
          <React.Fragment key={r.label.join(" ")}>
            <div style={{ position: "absolute", left: SAFE_X, top: r.top + (r.label.length > 1 ? 14 : 36), ...txt(40, FONT.body, C.ivory), lineHeight: 1.15, ...slideIn(frame, at(r.labelMs), 14, 40) }}>
              {r.label.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
            {r.tag ? (
              <div style={{ position: "absolute", left: X0, top: r.top - 40, ...txt(32, FONT.body, C.neutral), ...rise(frame, at(r.tagMs), 12, 14) }}>
                {r.tag}
              </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: X0,
                top: r.top,
                width: r.v * PXP,
                height: 120,
                backgroundColor: C.risk,
                transformOrigin: "0% 50%",
                scale: `${p} 1`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: r.top,
                height: 120,
                display: "flex",
                alignItems: "center",
                translate: `${X0 + p * r.v * PXP + 28}px 0px`,
                opacity: prog(frame, at(r.barFrom), 6),
                ...txt(88, FONT.data, C.ivory),
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {`${MINUS}${Math.round(p * r.v)}%`}
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: SAFE_X + 220, top: 436, ...txt(32, FONT.body, C.neutral), ...alone }}>
        ALONE
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b6  typography-led: "extraordinary reversal", the AI symbol         */
/* ------------------------------------------------------------------ */

const B6: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b6.start);

  // change b6 @93320 ms, w290 "reversal": the growth arrow flips to a risk arrow
  const flip = prog(frame, at(T.reversal), 16, EASE.snap);
  const arrowIn = prog(frame, at(T.extra), 16, EASE.snap);
  // change b6 @95700 ms, w302 "symbols": chip appears
  const chip = prog(frame, at(T.symbols), 18, EASE.snap);

  const lines = [
    { t: "FOR A COMPANY THAT HAD BECOME", ms: T.forACo, color: C.neutral },
    { t: "ONE OF THE MOST IMPORTANT", ms: T.oneOf, color: C.neutral },
    { t: "SYMBOLS OF THE", ms: T.symbols, color: C.ivory },
    { t: "AI REVOLUTION", ms: T.ofThe + 250, color: C.analysis },
  ];

  return (
    <BeatBg color={C.slate}>
      <div style={{ position: "absolute", left: SAFE_X, top: 110, ...txt(44, FONT.body, C.neutral, { letterSpacing: "0.12em" }), ...slideIn(frame, 0) }}>
        THAT&apos;S AN
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 180, ...txt(150, FONT.head, C.ivory), ...slideIn(frame, at(T.extra), 16, 80) }}>
        EXTRAORDINARY
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 340, ...txt(150, FONT.head, C.risk), ...slideIn(frame, at(T.reversal), 16, 80) }}>
        REVERSAL
      </div>

      <svg
        width={300}
        height={300}
        viewBox="0 0 300 300"
        style={{
          position: "absolute",
          left: 1500,
          top: 190,
          opacity: arrowIn,
          rotate: `${flip * 180}deg`,
        }}
      >
        <polygon points="150,30 270,170 190,170 190,270 110,270 110,170 30,170" fill={flip > 0.5 ? C.risk : C.growth} />
      </svg>

      {lines.map((l, i) => (
        <div key={l.t} style={{ position: "absolute", left: SAFE_X, top: 620 + i * 84, ...txt(56, FONT.body, l.color), ...rise(frame, at(l.ms), 14, 24) }}>
          {l.t}
        </div>
      ))}

      <svg
        width={300}
        height={300}
        viewBox="0 0 300 300"
        style={{ position: "absolute", left: 1500, top: 640, opacity: chip, scale: `${0.6 + chip * 0.4}` }}
      >
        {[90, 130, 170, 210].map((p) => (
          <React.Fragment key={p}>
            <line x1={p} y1={30} x2={p} y2={70} stroke={C.steel} strokeWidth={10} strokeLinecap="round" />
            <line x1={p} y1={230} x2={p} y2={270} stroke={C.steel} strokeWidth={10} strokeLinecap="round" />
            <line x1={30} y1={p} x2={70} y2={p} stroke={C.steel} strokeWidth={10} strokeLinecap="round" />
            <line x1={230} y1={p} x2={270} y2={p} stroke={C.steel} strokeWidth={10} strokeLinecap="round" />
          </React.Fragment>
        ))}
        <rect x={60} y={60} width={180} height={180} rx={24} fill={C.steel} />
        <rect x={100} y={100} width={100} height={100} rx={12} fill={C.slate} />
        <text x={150} y={170} textAnchor="middle" fontFamily={FONT.head} fontSize={56} fill={C.ivory}>
          AI
        </text>
      </svg>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

const beatSeq = (b: { start: number; end: number }, last = false) => ({
  from: loc(b.start),
  durationInFrames: (last ? SCENE_2_DURATION : loc(b.end) + OVERLAP) - loc(b.start),
});

export const Scene2: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.midnight }}>
    <Audio
      src={staticFile(`${PUB}/stock-market.wav`)}
      trimBefore={f(SCENE_START)}
      trimAfter={f(SCENE_START) + SCENE_2_DURATION}
    />

    <Sequence name="b1 the damage" {...beatSeq(T.b1)} premountFor={FPS}>
      <B1 />
    </Sequence>
    <Sequence name="b2 nov 20 closes" {...beatSeq(T.b2)} premountFor={FPS}>
      <B2 />
    </Sequence>
    <Sequence name="b3 the week" {...beatSeq(T.b3)} premountFor={FPS}>
      <B3 />
    </Sequence>
    <Sequence name="b4 correction ladder" {...beatSeq(T.b4)} premountFor={FPS}>
      <B4 />
    </Sequence>
    <Sequence name="b5 nvidia drops" {...beatSeq(T.b5)} premountFor={FPS}>
      <B5 />
    </Sequence>
    <Sequence name="b6 extraordinary reversal" {...beatSeq(T.b6, true)} premountFor={FPS}>
      <B6 />
    </Sequence>

    {SFX.map((s) => (
      <Sequence key={s.at} name={`sfx ${s.file}`} from={loc(s.at)} durationInFrames={s.frames} layout="none">
        <Sfx file={s.file} frames={s.frames} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
