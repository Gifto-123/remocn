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

const PUB = "stock-market"; // folder inside public/ that holds stock-market.wav
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

/* ------------------------------------------------------------------ */
/* Timing: ms from stock-market.json (word index and text in comments) */
/* ------------------------------------------------------------------ */

const T = {
  // beats (start/end in ms; every beat start is a narration word)
  b1: { start: 150, end: 3400 }, // w0 "The" .. w12 "years"
  b2: { start: 3450, end: 10150 }, // w13 "The" .. w36 "week"
  b3: { start: 10200, end: 15750 }, // w37 "And" .. w51 "day"
  b4: { start: 15780, end: 19850 }, // w52 "The" .. w63 "37"
  b5: { start: 19850, end: 29200 }, // w64 "For" .. w95 "question"
  b6: { start: 29220, end: 36050 }, // w96 "Because" .. w116 "boom"
  b7: { start: 36080, end: 39750 }, // w117 "And" .. w128 "appears"
  b8: { start: 39760, end: 48720 }, // w129 "So" .. w160 "next"

  // b1
  kinetic: 1700, // build starts ~200 ms before w9 so "Worst week in years" lands with the speech
  worst: 1900, // w9 "worst"

  // b2
  plunged: 3910, // w16 "plunged"
  nasPctEnd: 4820, // w18 "%" (counter lands on 10 by here)
  sessions: [5310, 5500, 5690, 5880, 6070], // w21 "five" .. w23 "sessions"
  spLabel: 7130, // w25 "S"
  dropped: 7840, // w29 "dropped"
  more: 8300, // w30 "more"
  spPctEnd: 9010, // w33 "%" (counter lands on 8 by here)
  forWeek: 9070, // w34 "for"

  // b3
  friday: 10330, // w39 "Friday"
  november: 10850, // w40 "November"
  twenty: 11390, // w41 "20"
  nvidia: 12240, // w43 "Nvidia"
  fourteen: 13650, // w46 "14"
  pct14: 14280, // w47 "%"
  single: 14640, // w50 "single"

  // b4
  fear: 16320, // w55 "fear"
  vix: 17220, // w58 "V"
  surged: 17890, // w60 "surged"
  around: 18330, // w62 "around"
  thirtySeven: 18840, // w63 "37"
  needleEnd: 19200, // inside w63 "37" (18840-19490)

  // b5
  forInv: 19850, // w64 "For"
  disaster: 21290, // w70 "disaster"
  but: 22000, // w71 "But"
  mostInteresting: 22320, // w73 "most"
  isnt: 24240, // w80 "isn"
  stocks: 24800, // w84 "stocks"
  fallen: 25470, // w86 "fallen"
  its: 26080, // w87 "It"
  investors: 26530, // w90 "investors"
  suddenly: 27220, // w92 "suddenly"
  question: 28270, // w95 "question"

  // b6
  because: 29220, // w96 "Because"
  another: 30080, // w101 "another"
  technology: 30440, // w102 "technology"
  correction: 31200, // w104 "correction"
  itsStress: 31920, // w105 "It"
  stress: 32190, // w108 "stress"
  test: 32540, // w109 "test"
  artificial: 33400, // w113 "artificial"
  boom: 35370, // w116 "boom"

  // b7
  answer: 36380, // w119 "answer"
  nextW: 37860, // w124 "next"
  major: 38040, // w125 "major"
  market: 38300, // w126 "market"
  opportunity: 38610, // w127 "opportunity"

  // b8
  so: 39870, // w129 "So"
  what1: 40670, // w134 "what" (what happened)
  why: 41690, // w136 "why" (why Nvidia became the center of attention)
  what2: 43920, // w143 "what" (what the latest economic numbers tell us)
  and3: 46380, // w151 "and" (and the three things ...)
  three: 46520, // w153 "three"
  things: 46750, // w154 "things"
};

export const SCENE_1_DURATION = f(48720); // 1462 frames, ends where w161 "First" starts

/* whoosh accents: start ~100 ms before the beat they announce */
const SFX = [
  { at: 10100, file: "whoosh-short", frames: 12 }, // b3 "And on Friday"
  { at: 15680, file: "whoosh-short", frames: 12 }, // b4 gauge
  { at: 21900, file: "transition-smooth-whoosh", frames: 14 }, // b5 "But" pivot
  { at: 35980, file: "transition-smooth-whoosh", frames: 14 }, // b7 "And the answer"
  { at: 39660, file: "whoosh-short", frames: 12 }, // b8 agenda
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
/* b1  typography-led: "Worst week in years" (remocn kinetic build)    */
/* ------------------------------------------------------------------ */

const HEADLINE = [
  { w: "Worst", ms: 1900 }, // w9
  { w: "week", ms: 2190 }, // w10 "weeks"
  { w: "in", ms: 2500 }, // w11
  { w: "years", ms: 2720 }, // w12
] as const;

const B1: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b1.start);

  // change b1 @150 ms, w0 "The": kicker line fades in over a rising red glow
  const kickerIn = prog(frame, 0, 18);
  // change b1 @1700 ms: kicker leaves just before "worst"
  const kickerOut = prog(frame, at(1700) - 14, 12, EASE.snap);
  // change b1 @1900 ms, w9 "worst": red horizon line draws outward from the center
  const line = prog(frame, at(T.worst), 24, EASE.snap);
  const glow = prog(frame, 0, at(T.b1.end), EASE.linear);

  return (
    <BeatBg color={C.midnight}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 62%, ${C.risk}66, transparent 70%)`,
          opacity: 0.35 + glow * 0.65,
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            ...txt(44, FONT.body, C.neutral, { letterSpacing: "0.12em" }),
            opacity: kickerIn * (1 - kickerOut),
            translate: `0px ${(1 - kickerIn) * 24}px`,
          }}
        >
          THE STOCK MARKET HAS JUST SUFFERED ONE OF ITS
        </div>
      </AbsoluteFill>
      {/* change b1 @1900-2720 ms, w9 "worst" .. w12 "years": each word slides in from the right on its spoken time */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 36, ...txt(132, FONT.head, C.ivory) }}>
          {HEADLINE.map((h) => {
            const p = prog(frame, at(h.ms), 14, EASE.snap);
            return (
              <span key={h.ms} style={{ opacity: p, translate: `${(1 - p) * 88}px 0px` }}>
                {h.w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 720,
          width: 1920 - SAFE_X * 2,
          height: 6,
          backgroundColor: C.risk,
          transformOrigin: "50% 50%",
          scale: `${line} 1`,
        }}
      />
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b2  data-viz: Nasdaq and S&P 500 declines, bars from zero           */
/* ------------------------------------------------------------------ */

const B2: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b2.start);

  const X0 = 440;
  const PX = 100; // px per 1 % decline, so 10 % = 1000 px and 8 % = 800 px
  const grid = [0, 2, 4, 6, 8, 10, 12];

  // change b2 @3910 ms, w16 "plunged": Nasdaq bar grows to 10 %, lands by w18 "%"
  const nas = prog(frame, at(T.plunged), at(T.nasPctEnd) - at(T.plunged), EASE.snap);
  // change b2 @7840 ms, w29 "dropped": S&P 500 bar grows to 8 %, lands by w33 "%"
  const sp = prog(frame, at(T.dropped), at(T.spPctEnd) - at(T.dropped), EASE.snap);

  return (
    <BeatBg color={C.slate}>
      <div style={{ position: "absolute", left: SAFE_X, top: 80, ...txt(76, FONT.head, C.ivory), ...slideIn(frame, 0) }}>
        THE SELL-OFF
      </div>

      {grid.map((v) => (
        <React.Fragment key={v}>
          <div
            style={{
              position: "absolute",
              left: X0 + v * PX,
              top: 270,
              width: 2,
              height: 530,
              backgroundColor: v === 0 ? C.ivory : "rgba(242,240,233,0.14)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: X0 + v * PX - 40,
              top: 820,
              width: 80,
              textAlign: "center",
              ...txt(32, FONT.data, C.neutral),
            }}
          >
            {v}
          </div>
        </React.Fragment>
      ))}
      <div style={{ position: "absolute", left: X0, top: 880, ...txt(32, FONT.body, C.neutral) }}>
        % DECLINE
      </div>

      {/* Nasdaq row */}
      {/* change b2 @3490 ms, w14 "NAS": row label slides in */}
      <div style={{ position: "absolute", left: SAFE_X, top: 370, ...txt(48, FONT.body, C.ivory), ...slideIn(frame, at(3490)) }}>
        NASDAQ
      </div>
      <div
        style={{
          position: "absolute",
          left: X0,
          top: 330,
          width: 10 * PX,
          height: 130,
          backgroundColor: C.risk,
          transformOrigin: "0% 50%",
          scale: `${nas} 1`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 330,
          height: 130,
          display: "flex",
          alignItems: "center",
          translate: `${X0 + nas * 10 * PX + 28}px 0px`,
          opacity: prog(frame, at(T.plunged), 6),
          ...txt(88, FONT.data, C.ivory),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {`${MINUS}${Math.round(nas * 10)}%`}
      </div>

      {/* change b2 @5310-6070 ms, w21 "five" .. w23 "sessions": five ticks light up */}
      {T.sessions.map((ms, i) => {
        const on = prog(frame, at(ms), 6, EASE.snap);
        return (
          <div
            key={ms}
            style={{
              position: "absolute",
              left: X0 + i * 44,
              top: 490,
              width: 30,
              height: 30,
              backgroundColor: on > 0.5 ? C.ivory : "rgba(242,240,233,0.18)",
              scale: `${0.8 + on * 0.2}`,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: X0 + 250, top: 488, ...txt(32, FONT.body, C.neutral), ...rise(frame, at(T.sessions[0]), 14, 16) }}>
        IN 5 TRADING SESSIONS
      </div>

      {/* S&P 500 row */}
      {/* change b2 @7130 ms, w25 "S": row label slides in */}
      <div style={{ position: "absolute", left: SAFE_X, top: 630, ...txt(48, FONT.body, C.ivory), ...slideIn(frame, at(T.spLabel)) }}>
        S&amp;P 500
      </div>
      <div
        style={{
          position: "absolute",
          left: X0,
          top: 590,
          width: 8 * PX,
          height: 130,
          backgroundColor: C.risk,
          transformOrigin: "0% 50%",
          scale: `${sp} 1`,
        }}
      />
      {/* change b2 @8300 ms, w30 "more": "MORE THAN" tag */}
      <div style={{ position: "absolute", left: X0 + 8 * PX + 28, top: 544, ...txt(32, FONT.body, C.neutral), ...rise(frame, at(T.more), 12, 14) }}>
        MORE THAN
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 590,
          height: 130,
          display: "flex",
          alignItems: "center",
          translate: `${X0 + sp * 8 * PX + 28}px 0px`,
          opacity: prog(frame, at(T.dropped), 6),
          ...txt(88, FONT.data, C.ivory),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {`${MINUS}${Math.round(sp * 8)}%${sp >= 1 ? "+" : ""}`}
      </div>
      {/* change b2 @9070 ms, w34 "for": "FOR THE WEEK" tag; then stillness until the beat ends */}
      <div style={{ position: "absolute", left: X0, top: 740, ...txt(32, FONT.body, C.neutral), ...rise(frame, at(T.forWeek), 14, 16) }}>
        FOR THE WEEK
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b3  extreme-close-up: Friday Nov 20, Nvidia -14 % in a day          */
/* ------------------------------------------------------------------ */

const B3: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b3.start);

  // change b3 @12240 ms, w43 "Nvidia": slow camera push begins
  const push = prog(frame, at(T.nvidia), 90, EASE.inOut);
  // change b3 @13650 ms, w46 "14": counter rolls to 14 by w47 "%"
  const count = prog(frame, at(T.fourteen), at(T.pct14) - at(T.fourteen), EASE.snap);
  // change b3 @12240 ms: NVIDIA label mask-wipes in
  const nvWipe = prog(frame, at(T.nvidia), 16, EASE.snap);
  // change b3 @14640 ms, w50 "single": one-day line draws
  const dayLine = prog(frame, at(T.single), 18, EASE.snap);

  return (
    <BeatBg color={C.ivory}>
      <AbsoluteFill
        style={{
          transformOrigin: "70% 50%",
          scale: `${1 + push * 0.06}`,
        }}
      >
        {/* change b3 @10330 ms, w39 "Friday": calendar card rises */}
        <div
          style={{
            position: "absolute",
            left: 190,
            top: 250,
            width: 520,
            height: 560,
            borderRadius: 36,
            backgroundColor: C.white,
            boxShadow: "0 24px 60px rgba(16,24,32,0.18)",
            overflow: "hidden",
            ...rise(frame, at(T.friday), 20, 120),
          }}
        >
          <div
            style={{
              height: 150,
              backgroundColor: C.risk,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...txt(84, FONT.head, C.ivory),
            }}
          >
            FRI
          </div>
          {/* change b3 @10850 ms, w40 "November" */}
          <div style={{ textAlign: "center", marginTop: 40, ...txt(72, FONT.data, C.slate), ...rise(frame, at(T.november), 14, 24) }}>
            NOV
          </div>
          {/* change b3 @11390 ms, w41 "20" */}
          <div style={{ textAlign: "center", marginTop: 6, ...txt(220, FONT.data, C.midnight), ...rise(frame, at(T.twenty), 14, 24) }}>
            20
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 800,
            top: 230,
            ...txt(140, FONT.head, C.midnight),
            clipPath: `inset(0 ${(1 - nvWipe) * 100}% 0 0)`,
          }}
        >
          NVIDIA
        </div>
        <div
          style={{
            position: "absolute",
            left: 780,
            top: 400,
            ...txt(380, FONT.data, C.risk),
            fontVariantNumeric: "tabular-nums",
            opacity: prog(frame, at(T.fourteen), 4),
          }}
        >
          {`${MINUS}${Math.round(count * 14)}%`}
        </div>
        <div style={{ position: "absolute", left: 800, top: 810, ...txt(56, FONT.body, C.slate), ...rise(frame, at(T.single), 14, 20) }}>
          IN A SINGLE DAY
        </div>
        <div
          style={{
            position: "absolute",
            left: 800,
            top: 884,
            width: 1000,
            height: 8,
            backgroundColor: C.risk,
            transformOrigin: "0% 50%",
            scale: `${dayLine} 1`,
          }}
        />
      </AbsoluteFill>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b4  data-viz: VIX gauge sweeps to 37 (scale 0 to 50)                */
/* ------------------------------------------------------------------ */

const B4: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b4.start);

  const cx = 500;
  const cy = 520;
  const R = 380;
  const MAX = 50;
  const L = Math.PI * R;
  const arc = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;

  // change b4 @17890 ms, w60 "surged": needle sweeps 0 -> 37, settled by the end of w63 "37"
  const sweep = prog(frame, at(T.surged), at(T.needleEnd) - at(T.surged), EASE.reveal);
  const value = sweep * 37;
  const theta = Math.PI * (1 - value / MAX);
  const needleLen = 330;
  const nx = cx + needleLen * Math.cos(theta);
  const ny = cy - needleLen * Math.sin(theta);

  return (
    <BeatBg color={C.midnight}>
      {/* change b4 @15780 ms, w52 "The": gauge face fades in */}
      <svg
        width={1000}
        height={600}
        viewBox="0 0 1000 600"
        style={{ position: "absolute", left: SAFE_X, top: 250, opacity: prog(frame, 0, 18) }}
      >
        <path d={arc} fill="none" stroke="rgba(242,240,233,0.14)" strokeWidth={36} />
        <path
          d={arc}
          fill="none"
          stroke={C.risk}
          strokeWidth={36}
          strokeDasharray={`${L * (value / MAX)} ${L}`}
        />
        {[0, 10, 20, 30, 40, 50].map((v) => {
          const a = Math.PI * (1 - v / MAX);
          const x1 = cx + (R + 28) * Math.cos(a);
          const y1 = cy - (R + 28) * Math.sin(a);
          const x2 = cx + (R + 52) * Math.cos(a);
          const y2 = cy - (R + 52) * Math.sin(a);
          const lx = cx + (R + 90) * Math.cos(a);
          const ly = cy - (R + 90) * Math.sin(a) + 11;
          return (
            <React.Fragment key={v}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.neutral} strokeWidth={3} />
              <text x={lx} y={ly} textAnchor="middle" fontFamily={FONT.data} fontSize={32} fill={C.neutral}>
                {v}
              </text>
            </React.Fragment>
          );
        })}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.ivory} strokeWidth={10} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={24} fill={C.ivory} />
      </svg>

      {/* change b4 @16320 ms, w55 "fear": FEAR GAUGE title */}
      <div style={{ position: "absolute", left: 1200, top: 250, ...txt(84, FONT.head, C.ivory), ...slideIn(frame, at(T.fear)) }}>
        FEAR GAUGE
      </div>
      {/* change b4 @17220 ms, w58 "V": VIX label */}
      <div style={{ position: "absolute", left: 1200, top: 370, ...txt(140, FONT.data, C.steel), ...slideIn(frame, at(T.vix)) }}>
        VIX
      </div>
      {/* change b4 @18330 ms, w62 "around": tag; value counts to 37 with the needle */}
      <div style={{ position: "absolute", left: 1200, top: 575, ...txt(36, FONT.body, C.neutral), ...rise(frame, at(T.around), 12, 14) }}>
        AROUND
      </div>
      <div
        style={{
          position: "absolute",
          left: 1200,
          top: 620,
          ...txt(240, FONT.data, C.risk),
          fontVariantNumeric: "tabular-nums",
          opacity: prog(frame, at(T.surged), 6),
        }}
      >
        {Math.round(value)}
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b5  visual pivot: "disaster" -> "but" -> the real question          */
/* ------------------------------------------------------------------ */

const B5: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b5.start);

  // change b5 @22000 ms, w71 "But": slate panel wipes across the red phase
  const wipe = prog(frame, at(T.but), 15, EASE.snap);
  // change b5 @25470 ms, w86 "fallen": ghost bars collapse
  const collapse = prog(frame, at(T.fallen), 12, EASE.snap);
  const PX = 60;
  // change b5 @28270 ms, w95 "question": the question mark rises
  const qm = prog(frame, at(T.question), 22);
  // phase B headline leaves at w87 "It"
  const butOut = prog(frame, at(T.its), 12, EASE.snap);

  return (
    <BeatBg color={C.risk}>
      {/* change b5 @19850 ms, w64 "For": setup line */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", ...txt(56, FONT.body, C.ivory), ...rise(frame, 0, 16, 20) }}>
        FOR INVESTORS, THIS LOOKS LIKE A
      </div>
      {/* change b5 @21290 ms, w70 "disaster": slams in, then holds until "But" */}
      {(() => {
        const p = prog(frame, at(T.disaster), 8, EASE.snap);
        return (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 420,
              textAlign: "center",
              ...txt(260, FONT.head, C.ivory),
              opacity: p,
              scale: `${1.15 - p * 0.15}`,
            }}
          >
            DISASTER
          </div>
        );
      })()}

      <AbsoluteFill
        style={{
          backgroundColor: C.slate,
          clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
        }}
      />

      {/* phase B: headline */}
      <div style={{ position: "absolute", left: SAFE_X, top: 110, ...txt(200, FONT.head, C.ivory), opacity: prog(frame, at(T.but) + 6, 12) * (1 - butOut), translate: `${(1 - prog(frame, at(T.but) + 6, 12)) * -40}px 0px` }}>
        BUT
      </div>
      {/* change b5 @22320 ms, w73 "most" */}
      <div style={{ position: "absolute", left: SAFE_X + 4, top: 340, ...txt(48, FONT.body, C.neutral), opacity: butOut > 0 ? 1 - butOut : prog(frame, at(T.mostInteresting), 14), translate: `0px ${(1 - prog(frame, at(T.mostInteresting), 14)) * 20}px` }}>
        THE MOST INTERESTING PART
      </div>

      {/* change b5 @24240-25470 ms, w80 "isn't" .. w86 "fallen": ghost bars show, then collapse */}
      <div style={{ position: "absolute", left: SAFE_X + 4, top: 470, ...txt(36, FONT.body, C.neutral), opacity: prog(frame, at(T.stocks), 12) * (1 - collapse) }}>
        HOW MUCH STOCKS HAVE FALLEN
      </div>
      {[
        { label: "NASDAQ", v: 10, top: 560 },
        { label: "S&P 500", v: 8, top: 680 },
      ].map((r) => (
        <React.Fragment key={r.label}>
          <div style={{ position: "absolute", left: SAFE_X + 4, top: r.top + 16, ...txt(36, FONT.body, C.ivory), opacity: prog(frame, at(T.isnt), 12) * (1 - collapse) }}>
            {r.label}
          </div>
          <div
            style={{
              position: "absolute",
              left: 340,
              top: r.top,
              width: r.v * PX,
              height: 70,
              border: `4px dashed ${C.neutral}`,
              boxSizing: "border-box",
              opacity: prog(frame, at(T.isnt), 12),
              transformOrigin: "0% 50%",
              scale: `${1 - collapse} 1`,
            }}
          />
        </React.Fragment>
      ))}

      {/* change b5 @26530-28270 ms, w90 "investors" .. w95 "question": the real question */}
      <div style={{ position: "absolute", left: 1000, top: 250, ...txt(84, FONT.head, C.ivory), ...slideIn(frame, at(T.investors), 16, 80) }}>
        WHAT INVESTORS
      </div>
      <div style={{ position: "absolute", left: 1000, top: 360, ...txt(84, FONT.head, C.ivory), ...slideIn(frame, at(T.suddenly), 16, 80) }}>
        ARE SUDDENLY
      </div>
      <div style={{ position: "absolute", left: 1000, top: 470, ...txt(84, FONT.head, C.analysis), ...slideIn(frame, at(T.question), 16, 80) }}>
        QUESTIONING
      </div>
      <div
        style={{
          position: "absolute",
          left: 240,
          top: 300,
          ...txt(640, FONT.head, C.analysis),
          opacity: qm,
          translate: `0px ${(1 - qm) * 260}px`,
        }}
      >
        ?
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b6  visual-metaphor: "stress test" press on the AI tower            */
/* ------------------------------------------------------------------ */

const B6: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b6.start);

  const textOut = prog(frame, at(T.itsStress), 12, EASE.snap);
  // change b6 @31200 ms, w104 "correction": strike line draws through CORRECTION
  const strike = prog(frame, at(T.correction) + 8, 14, EASE.snap);

  // change b6 @31920 ms, w105 "It": press starts to descend, touches the tower at w109 "test"
  const descend = prog(frame, at(T.itsStress), at(T.test) - at(T.itsStress), EASE.inOut);
  // change b6 @32540 ms, w109 "test": press keeps pushing, tower compresses and trembles
  const squeeze = prog(frame, at(T.test), f(34400) - f(T.test), EASE.inOut);

  const BLOCK_H = 96;
  const GAP = 8;
  const BLOCKS = 6;
  const TOWER_H = BLOCKS * BLOCK_H + (BLOCKS - 1) * GAP; // 616
  const BASE_Y = 900;
  const TOP_Y = BASE_Y - TOWER_H; // 284
  const SQUEEZE_PX = TOWER_H * 0.14;
  const shake = Math.sin(frame * 1.3) * squeeze * 4;
  const pressY = -460 * (1 - descend) + squeeze * SQUEEZE_PX;

  // change b6 @35370 ms, w116 "boom": ring pulse behind the tower
  const ring = prog(frame, at(T.boom), 24, EASE.snap);

  return (
    <BeatBg color={C.midnight}>
      {/* phase A: the correction line, struck out */}
      <div style={{ opacity: 1 - textOut, translate: `0px ${-textOut * 40}px` }}>
        <div style={{ position: "absolute", left: SAFE_X, top: 300, ...txt(56, FONT.body, C.neutral), ...rise(frame, 0, 16, 20) }}>
          THIS ISN&apos;T SIMPLY ANOTHER
        </div>
        <div style={{ position: "absolute", left: SAFE_X, top: 390, ...txt(110, FONT.head, C.ivory), ...rise(frame, at(T.technology), 16, 30) }}>
          TECHNOLOGY STOCK
        </div>
        <div style={{ position: "absolute", left: SAFE_X, top: 510, ...txt(110, FONT.head, C.ivory), ...rise(frame, at(T.correction), 16, 30) }}>
          CORRECTION
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 52,
              width: "100%",
              height: 10,
              backgroundColor: C.risk,
              transformOrigin: "0% 50%",
              scale: `${strike} 1`,
            }}
          />
        </div>
      </div>

      {/* phase B: stress test */}
      {/* change b6 @32190 ms, w108 "stress" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 300, ...txt(130, FONT.head, C.ivory), ...rise(frame, at(T.stress), 16, 30) }}>
        STRESS TEST
      </div>
      {/* change b6 @33400 ms, w113 "artificial" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 640, ...txt(44, FONT.body, C.neutral), ...rise(frame, at(T.artificial), 16, 20) }}>
        ARTIFICIAL INTELLIGENCE
        <br />
        INVESTMENT BOOM
      </div>

      <div
        style={{
          position: "absolute",
          left: 1300 - 150,
          top: TOP_Y + TOWER_H / 2 - 150,
          width: 300,
          height: 300,
          borderRadius: 300,
          border: `6px solid ${C.steel}`,
          opacity: (1 - ring) * 0.8,
          scale: `${0.6 + ring * 1.4}`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 1300 - 180,
          top: TOP_Y,
          width: 360,
          height: TOWER_H,
          transformOrigin: "50% 100%",
          scale: `1 ${1 - squeeze * 0.14}`,
          translate: `${shake}px 0px`,
          opacity: prog(frame, at(T.itsStress), 12),
        }}
      >
        {Array.from({ length: BLOCKS }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: i * (BLOCK_H + GAP),
              width: 360,
              height: BLOCK_H,
              borderRadius: 14,
              backgroundColor: i === 0 ? C.steel : C.slate,
              border: `4px solid ${C.steel}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...txt(56, FONT.head, C.ivory),
            }}
          >
            {i === 0 ? "AI" : ""}
          </div>
        ))}
      </div>

      {/* press: piston + plate */}
      <div
        style={{
          position: "absolute",
          left: 1300 - 35,
          top: TOP_Y - 70 - 700,
          width: 70,
          height: 700,
          backgroundColor: C.neutral,
          translate: `0px ${pressY}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1300 - 240,
          top: TOP_Y - 70 - 4,
          width: 480,
          height: 70,
          borderRadius: 12,
          backgroundColor: C.neutral,
          translate: `0px ${pressY}px`,
        }}
      />
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b7  environmental-wide: camera push to the opportunity on the horizon */
/* ------------------------------------------------------------------ */

const B7: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b7.start);

  const MX = 1180;
  const MY = 640;
  // change b7 @36080 ms, w117 "And": camera pushes toward the marker (76 frames)
  const cam = prog(frame, 6, f(T.opportunity) - f(T.b7.start), EASE.inOut);
  // change b7 @36380 ms, w119 "answer": gold marker appears on the horizon
  const marker = prog(frame, at(T.answer), 16);
  // change b7 @38610 ms, w127 "opportunity": marker pulses
  const pulse = prog(frame, at(T.opportunity), 22, EASE.snap);

  return (
    <BeatBg color={C.midnight}>
      <AbsoluteFill
        style={{
          transformOrigin: `${MX}px ${MY}px`,
          scale: `${1 + cam * 0.9}`,
          translate: `${cam * (960 - MX)}px ${cam * (540 - MY)}px`,
        }}
      >
        <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.midnight} 0%, #1d3347 78%)` }} />
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M0 720 L220 650 L460 700 L720 630 L980 700 L1260 650 L1560 710 L1920 660 L1920 1080 L0 1080 Z" fill="#22384b" />
          <path d="M0 800 L300 740 L620 790 L940 735 L1280 795 L1620 745 L1920 790 L1920 1080 L0 1080 Z" fill={C.slate} />
          <path d="M0 920 L360 870 L760 915 L1160 865 L1540 910 L1920 875 L1920 1080 L0 1080 Z" fill={C.midnight} />
        </svg>
        <div
          style={{
            position: "absolute",
            left: MX - 90,
            top: MY - 90,
            width: 180,
            height: 180,
            borderRadius: 180,
            background: `radial-gradient(circle, ${C.gold}88 0%, transparent 70%)`,
            opacity: marker,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: MX - 22,
            top: MY - 22,
            width: 44,
            height: 44,
            backgroundColor: C.gold,
            rotate: "45deg",
            opacity: marker,
            scale: `${0.4 + marker * 0.6}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: MX - 60,
            top: MY - 60,
            width: 120,
            height: 120,
            borderRadius: 120,
            border: `4px solid ${C.gold}`,
            opacity: (1 - pulse) * 0.9,
            scale: `${0.4 + pulse * 2.2}`,
          }}
        />
      </AbsoluteFill>

      {/* change b7 @37860-38610 ms, w124 "next" .. w127 "opportunity": words land one by one */}
      <div style={{ position: "absolute", left: SAFE_X, top: 800, display: "flex", gap: 28, ...txt(88, FONT.head, C.ivory) }}>
        <span style={rise(frame, at(T.nextW), 12, 24)}>NEXT</span>
        <span style={rise(frame, at(T.major), 12, 24)}>MAJOR</span>
        <span style={rise(frame, at(T.market), 12, 24)}>MARKET</span>
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 900, ...txt(88, FONT.head, C.gold), ...rise(frame, at(T.opportunity), 14, 24) }}>
        OPPORTUNITY
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b8  typography-led agenda: the four questions, then three pips      */
/* ------------------------------------------------------------------ */

const B8: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b8.start);

  const rows = [
    { n: "01", t: "What happened", ms: T.what1, size: 72 }, // w134
    { n: "02", t: "Why Nvidia became the center of attention", ms: T.why, size: 64 }, // w136
    { n: "03", t: "What the latest economic numbers tell us", ms: T.what2, size: 64 }, // w143
    { n: "04", t: "Three things that could determine what happens next", ms: T.and3, size: 64 }, // w151
  ];
  const pips = [T.three, T.things, T.three + 460];

  return (
    <BeatBg color={C.slate}>
      {/* change b8 @39870 ms, w129 "So": kicker */}
      <div style={{ position: "absolute", left: SAFE_X, top: 110, ...txt(44, FONT.body, C.neutral, { letterSpacing: "0.12em" }), ...rise(frame, at(T.so), 16, 20) }}>
        LET&apos;S BREAK IT DOWN
      </div>
      {rows.map((r, i) => (
        <div key={r.n} style={{ position: "absolute", left: SAFE_X, top: 250 + i * 170, display: "flex", alignItems: "baseline", gap: 36, ...rise(frame, at(r.ms), 18, 40) }}>
          <span style={txt(64, FONT.data, C.steel)}>{r.n}</span>
          <span style={txt(r.size, FONT.head, C.ivory)}>{r.t}</span>
        </div>
      ))}
      {/* change b8 @46520-46980 ms, w153 "three" .. w155 "that": three pips light up on row 04 */}
      {pips.map((ms, i) => {
        const p = prog(frame, at(ms), 12, EASE.snap);
        return (
          <div
            key={ms}
            style={{
              position: "absolute",
              left: SAFE_X + 108 + i * 64,
              top: 250 + 3 * 170 + 104,
              width: 40,
              height: 40,
              borderRadius: 40,
              backgroundColor: C.analysis,
              opacity: p,
              scale: `${0.4 + p * 0.6}`,
            }}
          />
        );
      })}
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export const Scene1: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.midnight }}>
    <Audio src={staticFile(`${PUB}/stock-market.wav`)} trimBefore={0} trimAfter={SCENE_1_DURATION} />

    <Sequence name="b1 worst week" from={f(T.b1.start)} durationInFrames={f(T.b1.end) - f(T.b1.start) + OVERLAP} premountFor={FPS}>
      <B1 />
    </Sequence>
    <Sequence name="b2 index declines" from={f(T.b2.start)} durationInFrames={f(T.b2.end) - f(T.b2.start) + OVERLAP} premountFor={FPS}>
      <B2 />
    </Sequence>
    <Sequence name="b3 nvidia -14" from={f(T.b3.start)} durationInFrames={f(T.b3.end) - f(T.b3.start) + OVERLAP} premountFor={FPS}>
      <B3 />
    </Sequence>
    <Sequence name="b4 vix gauge" from={f(T.b4.start)} durationInFrames={f(T.b4.end) - f(T.b4.start) + OVERLAP} premountFor={FPS}>
      <B4 />
    </Sequence>
    <Sequence name="b5 disaster pivot" from={f(T.b5.start)} durationInFrames={f(T.b5.end) - f(T.b5.start) + OVERLAP} premountFor={FPS}>
      <B5 />
    </Sequence>
    <Sequence name="b6 stress test" from={f(T.b6.start)} durationInFrames={f(T.b6.end) - f(T.b6.start) + OVERLAP} premountFor={FPS}>
      <B6 />
    </Sequence>
    <Sequence name="b7 opportunity" from={f(T.b7.start)} durationInFrames={f(T.b7.end) - f(T.b7.start) + OVERLAP} premountFor={FPS}>
      <B7 />
    </Sequence>
    <Sequence name="b8 agenda" from={f(T.b8.start)} durationInFrames={SCENE_1_DURATION - f(T.b8.start)} premountFor={FPS}>
      <B8 />
    </Sequence>

    {SFX.map((s) => (
      <Sequence key={s.at} name={`sfx ${s.file}`} from={f(s.at)} durationInFrames={s.frames} layout="none">
        <Sfx file={s.file} frames={s.frames} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
