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
/* Timing: absolute ms in stock-market.json (word index in comments)   */
/* ------------------------------------------------------------------ */

const SCENE_START = 221120; // w674 "Now"
const SCENE_END = 255420; // w780 "And" (Scene 7 starts here)
export const SCENE_6_DURATION = f(SCENE_END) - f(SCENE_START); // 1029 frames
const loc = (ms: number) => f(ms) - f(SCENE_START);

const T = {
  b1: { start: 221120, end: 224280 }, // w674 "Now" .. w682 "complicated"
  b2: { start: 224280, end: 228430 }, // w683 "Despite" .. w693 "strong"
  b3: { start: 228430, end: 231190 }, // w694 "According" .. w703 "report"
  b4: { start: 231190, end: 238910 }, // w704 "S" .. w722 "year"
  b5: { start: 238910, end: 243570 }, // w723 "And" .. w742 "estimates"
  b6: { start: 243570, end: 248660 }, // w743 "That" .. w760 "term"
  b7: { start: 248660, end: 255420 }, // w761 "Sometimes" .. w779 "earnings"

  // b1
  picture: 222140, // w679 "picture"
  becomes: 222560, // w680 "becomes"
  complicated: 223220, // w682 "complicated"

  // b2
  market: 224650, // w685 "market"
  sellOff: 225000, // w686 "sell"
  corporate: 225830, // w688 "corporate"
  remained: 226700, // w691 "remained"
  surprisingly: 227150, // w692 "surprisingly"
  strong: 227750, // w693 "strong"

  // b3
  factset: 228880, // w696 "Fact"
  nov20: 229330, // w699 "November"
  report: 230210, // w702 "earnings"

  // b4
  companies: 232000, // w708 "companies"
  third: 233040, // w711 "third"
  growthOf: 234110, // w714 "growth"
  tThirtyTwo: 235340, // w717 "32"
  tPct: 236440, // w719 "%"
  compared: 236560, // w720 "compared"
  samePeriod: 237280, // w723 "same"

  // b5
  eightyFour: 238910, // w723 "84"
  pct84: 239300, // w724 "%"
  ofThe: 239440, // w725 "of"
  reported: 240260, // w728 "that"
  beaten: 241520, // w732 "beaten"
  eps: 242030, // w734 "earnings"

  // b6
  important: 243690, // w745 "important"
  stockPrices: 244580, // w747 "stock"
  profits: 245280, // w750 "company"
  dont: 246240, // w753 "don"
  together: 247050, // w757 "together"
  shortTerm: 247500, // w758 "in"

  // b7
  sometimes: 248660, // w761
  investors: 249010, // w762
  lessWilling: 249540, // w763 "become"
  less: 249890, // w764 "less"
  payHigh: 250530, // w766 "to"
  prices: 251040, // w768 "prices"
  forFuture: 251430, // w769 "for"
  evenWhen: 252480, // w772 "even"
  continueGen: 253370, // w775 "continue"
  strongEarn: 254430, // w777 "strong"
};

/* whoosh accents: start ~100 ms before the beat they announce */
const SFX = [
  { at: 221120, file: "transition-smooth-whoosh", frames: 14 }, // scene handover
  { at: 231090, file: "whoosh-short", frames: 12 }, // b4 earnings growth
  { at: 238810, file: "whoosh-short", frames: 12 }, // b5 "And 84%"
  { at: 243470, file: "transition-smooth-whoosh", frames: 14 }, // b6 "That's important"
  { at: 248560, file: "whoosh-short", frames: 12 }, // b7 "Sometimes investors"
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
/* b1  typography-led: the picture becomes more complicated            */
/* ------------------------------------------------------------------ */

const B1: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b1.start);

  // change b1 @222560-223220 ms, w680 "becomes" .. w682 "complicated": three clean lines tangle together
  const tangle = prog(frame, at(T.becomes), at(T.complicated) - at(T.becomes) + 10, EASE.inOut);
  const draw = prog(frame, 0, 24, EASE.snap);
  const amp = 6 + tangle * 90;

  const lines = [
    { color: C.growth, y: 800, phase: 0 },
    { color: C.risk, y: 830, phase: 2.1 },
    { color: C.steel, y: 860, phase: 4.2 },
  ];
  const pathFor = (y: number, phase: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= 1920; x += 40) {
      const yy = y + Math.sin(x * 0.011 + phase + frame * 0.05) * amp * (0.6 + 0.4 * Math.sin(x * 0.004 + phase));
      pts.push(`${x === 0 ? "M" : "L"}${x} ${yy.toFixed(1)}`);
    }
    return pts.join(" ");
  };

  return (
    <BeatBg color={C.midnight}>
      <div style={{ position: "absolute", left: SAFE_X, top: 190, ...txt(56, FONT.body, C.neutral, { letterSpacing: "0.1em" }), ...slideIn(frame, 0) }}>
        NOW HERE&apos;S WHERE
      </div>
      {/* change b1 @222140 ms, w679 "picture" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 280, ...txt(120, FONT.head, C.ivory), ...slideIn(frame, at(T.picture) - 8, 16, 80) }}>
        THE PICTURE BECOMES
      </div>
      {/* change b1 @222980 ms, w681 "more" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 430, ...txt(150, FONT.head, C.risk), ...slideIn(frame, at(T.becomes) + 12, 16, 80) }}>
        MORE COMPLICATED
      </div>

      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0, opacity: draw }}>
        {lines.map((l) => (
          <path key={l.color} d={pathFor(l.y, l.phase)} fill="none" stroke={l.color} strokeWidth={8} strokeLinecap="round" />
        ))}
      </svg>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b2  comparison: the sell-off vs strong corporate earnings           */
/* ------------------------------------------------------------------ */

const B2: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b2.start);

  // change b2 @225000 ms, w686 "sell": the down arrow drops into the left card
  const arrow = prog(frame, at(T.sellOff), 14, EASE.snap);
  // change b2 @226700 ms, w691 "remained": the check badge pops in the right card
  const check = prog(frame, at(T.remained), 12, EASE.snap);
  const leftIn = prog(frame, at(T.market) - 6, 16, EASE.snap);
  const rightIn = prog(frame, at(T.corporate) - 6, 16, EASE.snap);

  return (
    <BeatBg color={C.slate}>
      <div style={{ position: "absolute", left: SAFE_X, top: 110, ...txt(56, FONT.body, C.neutral, { letterSpacing: "0.1em" }), ...slideIn(frame, 0) }}>
        DESPITE
      </div>

      <div style={{ position: "absolute", left: 96, top: 250, width: 800, height: 640, borderRadius: 28, backgroundColor: "#22384B", opacity: leftIn, translate: `0px ${(1 - leftIn) * 60}px` }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 50, textAlign: "center", ...txt(56, FONT.head, C.ivory) }}>
          THE MARKET SELL-OFF
        </div>
        <svg
          width={300}
          height={300}
          viewBox="0 0 300 300"
          style={{ position: "absolute", left: 250, top: 230, opacity: arrow, translate: `0px ${(1 - arrow) * -120}px` }}
        >
          <polygon points="150,280 275,140 195,140 195,20 105,20 105,140 25,140" fill={C.risk} />
        </svg>
      </div>

      <div style={{ position: "absolute", left: 1024, top: 250, width: 800, height: 640, borderRadius: 28, backgroundColor: "#22384B", opacity: rightIn, translate: `0px ${(1 - rightIn) * 60}px` }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 50, textAlign: "center", ...txt(56, FONT.head, C.ivory) }}>
          CORPORATE EARNINGS
        </div>
        <div
          style={{
            position: "absolute",
            left: 300,
            top: 200,
            width: 200,
            height: 200,
            borderRadius: 200,
            backgroundColor: C.growth,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: check,
            scale: `${1.5 - check * 0.5}`,
          }}
        >
          <svg width={120} height={120} viewBox="0 0 120 120">
            <polyline points="20,64 50,94 100,28" fill="none" stroke={C.ivory} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {/* change b2 @227150 ms, w692 "surprisingly" */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 470, textAlign: "center", ...txt(48, FONT.body, C.neutral), ...rise(frame, at(T.surprisingly), 14, 20) }}>
          SURPRISINGLY
        </div>
        {/* change b2 @227750 ms, w693 "strong" */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 530, textAlign: "center", ...txt(80, FONT.head, C.growth), ...rise(frame, at(T.strong), 14, 20) }}>
          STRONG
        </div>
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b3  source card: FactSet earnings report, November 20               */
/* ------------------------------------------------------------------ */

const B3: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b3.start);

  const card = prog(frame, at(T.factset) - 4, 18, EASE.snap);

  return (
    <BeatBg color={C.ivory}>
      <div style={{ position: "absolute", left: SAFE_X, top: 170, ...txt(44, FONT.body, C.slate, { letterSpacing: "0.1em" }), ...slideIn(frame, 0) }}>
        ACCORDING TO
      </div>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 260,
          width: 1500,
          height: 560,
          borderRadius: 28,
          backgroundColor: C.white,
          boxShadow: "0 24px 60px rgba(16,24,32,0.18)",
          overflow: "hidden",
          opacity: card,
          translate: `0px ${(1 - card) * 80}px`,
        }}
      >
        <div style={{ height: 170, backgroundColor: C.slate, display: "flex", alignItems: "center", paddingLeft: 56 }}>
          <div style={txt(110, FONT.head, C.ivory)}>FACTSET</div>
        </div>
        {/* change b3 @230210 ms, w702 "earnings" */}
        <div style={{ position: "absolute", left: 56, top: 220, ...txt(64, FONT.head, C.slate), ...rise(frame, at(T.report), 14, 20) }}>
          EARNINGS REPORT
        </div>
        {/* change b3 @229330 ms, w699 "November" */}
        <div style={{ position: "absolute", left: 56, top: 320, ...txt(64, FONT.data, C.steel), ...rise(frame, at(T.nov20), 14, 20) }}>
          NOVEMBER 20
        </div>
        {[620, 540, 600].map((w, i) => (
          <div key={i} style={{ position: "absolute", left: 56, top: 440 + i * 36, width: w, height: 16, borderRadius: 8, backgroundColor: "rgba(16,24,32,0.12)" }} />
        ))}
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b4  data-viz: third-quarter earnings growth of about 32.9 %         */
/* ------------------------------------------------------------------ */

const B4: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b4.start);

  const BASE_Y = 880;
  const LAST_H = 300; // last year's third quarter = baseline
  const THIS_H = LAST_H * 1.329; // +32.9 % taller
  // change b4 @235340-236440 ms, w717 "32" .. w719 "%": the counter and this year's bar rise to +32.9 %
  const g = prog(frame, at(T.tThirtyTwo), at(T.tPct) - at(T.tThirtyTwo), EASE.snap);
  // change b4 @233690 ms, w713 "earnings": last year's baseline bar and reference line appear
  const base = prog(frame, at(T.third) + 20, 16, EASE.snap);

  return (
    <BeatBg color={C.midnight}>
      <div style={{ position: "absolute", left: SAFE_X, top: 100, ...txt(84, FONT.head, C.ivory), ...slideIn(frame, 0, 16, 80) }}>
        S&amp;P 500 COMPANIES
      </div>
      {/* change b4 @232560 ms, w709 "reporting" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 210, ...txt(48, FONT.body, C.neutral), ...rise(frame, at(T.third) - 14, 14, 20) }}>
        REPORTING THIRD QUARTER EARNINGS
      </div>
      {/* change b4 @234110 ms, w714 "growth" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 340, ...txt(44, FONT.body, C.neutral), ...rise(frame, at(T.growthOf), 14, 20) }}>
        GROWTH OF APPROXIMATELY
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 400,
          ...txt(230, FONT.data, C.growth),
          fontVariantNumeric: "tabular-nums",
          opacity: prog(frame, at(T.tThirtyTwo) - 6, 6),
        }}
      >
        {`+${(g * 32.9).toFixed(1)}%`}
      </div>
      {/* change b4 @236560 ms, w720 "compared" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 700, ...txt(40, FONT.body, C.neutral), ...rise(frame, at(T.compared), 14, 20) }}>
        COMPARED WITH THE SAME PERIOD LAST YEAR
      </div>

      {/* bars */}
      <div
        style={{
          position: "absolute",
          left: 1300,
          top: BASE_Y - LAST_H,
          width: 220,
          height: LAST_H,
          borderRadius: 12,
          backgroundColor: C.neutral,
          transformOrigin: "50% 100%",
          scale: `1 ${base}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1270,
          top: BASE_Y - LAST_H - 2,
          width: 560,
          height: 0,
          borderTop: `4px dashed ${C.neutral}`,
          opacity: base,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1580,
          top: BASE_Y - THIS_H,
          width: 220,
          height: THIS_H,
          borderRadius: 12,
          backgroundColor: C.growth,
          transformOrigin: "50% 100%",
          scale: `1 ${g}`,
        }}
      />
      {/* change b4 @237280 ms, w723 "same": bar labels */}
      <div style={{ position: "absolute", left: 1300, top: BASE_Y + 24, width: 220, textAlign: "center", ...txt(30, FONT.body, C.neutral), ...rise(frame, at(T.samePeriod), 14, 14) }}>
        LAST YEAR
      </div>
      <div style={{ position: "absolute", left: 1580, top: BASE_Y + 24, width: 220, textAlign: "center", ...txt(30, FONT.body, C.neutral), ...rise(frame, at(T.samePeriod), 14, 14) }}>
        THIS YEAR
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b5  data-viz: 84 % beat estimates, 21 of 25 marks lit               */
/* ------------------------------------------------------------------ */

const B5: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b5.start);

  // change b5 @238910-239300 ms, w723 "84" .. w724 "%": the counter lands on 84
  const c = prog(frame, at(T.eightyFour), at(T.pct84) - at(T.eightyFour), EASE.snap);

  return (
    <BeatBg color={C.ivory}>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 130,
          ...txt(260, FONT.data, C.growth),
          fontVariantNumeric: "tabular-nums",
          opacity: prog(frame, 0, 4),
        }}
      >
        {`${Math.round(c * 84)}%`}
      </div>
      {/* change b5 @239440 ms, w725 "of" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 430, ...txt(48, FONT.body, C.slate), ...rise(frame, at(T.ofThe), 14, 20) }}>
        OF THE COMPANIES
      </div>
      {/* change b5 @240260 ms, w728 "that" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 500, ...txt(48, FONT.body, C.slate), ...rise(frame, at(T.reported), 14, 20) }}>
        THAT HAD REPORTED
      </div>
      {/* change b5 @241520 ms, w732 "beaten" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 620, ...txt(80, FONT.head, C.midnight), ...rise(frame, at(T.beaten), 14, 24) }}>
        HAD BEATEN
      </div>
      {/* change b5 @242030 ms, w734 "earnings" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 720, ...txt(58, FONT.head, C.slate), ...rise(frame, at(T.eps), 14, 24) }}>
        EARNINGS PER SHARE ESTIMATES
      </div>

      {Array.from({ length: 25 }).map((_, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const x = 1330 + col * 98;
        const y = 220 + row * 98;
        const appear = prog(frame, at(T.ofThe) + (col + row) * 2, 8, EASE.snap);
        // change b5 @241520 ms, w732 "beaten": 21 of the 25 marks light up (21 / 25 = 84 %)
        const litP = i < 21 ? prog(frame, at(T.beaten) + i * 2, 8, EASE.snap) : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 76,
              height: 76,
              borderRadius: 76,
              backgroundColor: litP > 0.5 ? C.growth : "rgba(16,24,32,0.16)",
              opacity: appear,
              scale: `${0.5 + appear * 0.5}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={44} height={44} viewBox="0 0 44 44" style={{ opacity: litP }}>
              <polyline points="8,24 19,34 36,12" fill="none" stroke={C.ivory} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      })}
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b6  schematic: prices and profits drift apart                       */
/* ------------------------------------------------------------------ */

const B6: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b6.start);

  // change b6 @244580 and @245280 ms, w747 "stock" and w750 "company": the two lines start, then split at w753 "don't"
  const price = prog(frame, at(T.stockPrices), at(T.shortTerm) - at(T.stockPrices), EASE.inOut);
  const profit = prog(frame, at(T.profits), at(T.shortTerm) - at(T.profits), EASE.inOut);

  return (
    <BeatBg color={C.slate}>
      <div style={{ position: "absolute", left: SAFE_X, top: 90, ...txt(44, FONT.body, C.neutral, { letterSpacing: "0.08em" }), ...slideIn(frame, 0) }}>
        THAT&apos;S IMPORTANT BECAUSE
      </div>
      {/* change b6 @244580 ms, w747 "stock" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 150, ...txt(64, FONT.head, C.ivory), ...rise(frame, at(T.stockPrices), 14, 24) }}>
        STOCK PRICES AND COMPANY PROFITS
      </div>
      {/* change b6 @246240 ms, w753 "don't" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 235, ...txt(64, FONT.head, C.risk), ...rise(frame, at(T.dont), 14, 24) }}>
        DON&apos;T ALWAYS MOVE TOGETHER
      </div>
      {/* change b6 @247500 ms, w758 "in" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 320, ...txt(44, FONT.body, C.neutral), ...rise(frame, at(T.shortTerm), 14, 20) }}>
        IN THE SHORT TERM
      </div>

      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d="M200 560 C500 540 800 520 1000 550 S1500 760 1720 800"
          pathLength={1}
          fill="none"
          stroke={C.steel}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${price} 1`}
        />
        <path
          d="M200 568 C500 548 800 528 1000 540 S1500 360 1720 320"
          pathLength={1}
          fill="none"
          stroke={C.growth}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${profit} 1`}
        />
      </svg>
      <div style={{ position: "absolute", left: 1420, top: 840, width: 400, textAlign: "right", ...txt(36, FONT.body, C.steel), opacity: prog(frame, at(T.dont) + 20, 14) }}>
        STOCK PRICES
      </div>
      <div style={{ position: "absolute", left: 1420, top: 240, width: 400, textAlign: "right", ...txt(36, FONT.body, C.growth), opacity: prog(frame, at(T.dont) + 20, 14) }}>
        COMPANY PROFITS
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b7  comparison: willingness to pay falls while earnings hold        */
/* ------------------------------------------------------------------ */

const B7: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b7.start);

  const BASE_Y = 900;
  const MAX_H = 460;
  // change b7 @249890-251040 ms, w764 "less" .. w768 "prices": the willingness-to-pay bar falls to 40 %
  const fall = prog(frame, at(T.less), at(T.prices) - at(T.less), EASE.inOut);
  const payH = MAX_H * (1 - fall * 0.6);
  const payIn = prog(frame, at(T.investors), 14, EASE.snap);
  // change b7 @252780 ms, w774 "businesses": the earnings bar rises and then holds
  const earnIn = prog(frame, at(T.evenWhen) + 10, 18, EASE.snap);

  return (
    <BeatBg color={C.midnight}>
      <div style={{ position: "absolute", left: SAFE_X, top: 110, ...txt(70, FONT.head, C.ivory), ...slideIn(frame, 0, 16, 80) }}>
        SOMETIMES INVESTORS
      </div>
      {/* change b7 @249540 ms, w763 "become" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 200, ...txt(70, FONT.head, C.risk), ...slideIn(frame, at(T.lessWilling), 16, 80) }}>
        BECOME LESS WILLING
      </div>
      {/* change b7 @250530 ms, w766 "to" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 320, ...txt(52, FONT.body, C.ivory), ...rise(frame, at(T.payHigh), 14, 20) }}>
        TO PAY HIGH PRICES
      </div>
      {/* change b7 @251430 ms, w769 "for" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 395, ...txt(52, FONT.body, C.ivory), ...rise(frame, at(T.forFuture), 14, 20) }}>
        FOR FUTURE GROWTH
      </div>
      {/* change b7 @252480 ms, w772 "even" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 540, ...txt(44, FONT.body, C.neutral), ...rise(frame, at(T.evenWhen), 14, 20) }}>
        EVEN WHEN BUSINESSES
      </div>
      {/* change b7 @253370 ms, w775 "continue" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 620, ...txt(56, FONT.head, C.ivory), ...rise(frame, at(T.continueGen), 14, 20) }}>
        CONTINUE GENERATING
      </div>
      {/* change b7 @254430 ms, w777 "strong" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 700, ...txt(56, FONT.head, C.growth), ...rise(frame, at(T.strongEarn), 14, 20) }}>
        STRONG EARNINGS
      </div>

      {/* willingness-to-pay bar */}
      <div
        style={{
          position: "absolute",
          left: 1250,
          top: BASE_Y - payH,
          width: 200,
          height: payH,
          borderRadius: 12,
          backgroundColor: C.steel,
          opacity: payIn,
        }}
      />
      <div style={{ position: "absolute", left: 1170, top: BASE_Y + 24, width: 360, textAlign: "center", ...txt(30, FONT.body, C.neutral), opacity: payIn }}>
        WILLINGNESS TO PAY
      </div>
      {/* earnings bar */}
      <div
        style={{
          position: "absolute",
          left: 1580,
          top: BASE_Y - MAX_H,
          width: 200,
          height: MAX_H,
          borderRadius: 12,
          backgroundColor: C.growth,
          transformOrigin: "50% 100%",
          scale: `1 ${earnIn}`,
        }}
      />
      <div style={{ position: "absolute", left: 1500, top: BASE_Y + 24, width: 360, textAlign: "center", ...txt(30, FONT.body, C.neutral), opacity: earnIn }}>
        EARNINGS
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

const beatSeq = (b: { start: number; end: number }, last = false) => ({
  from: loc(b.start),
  durationInFrames: (last ? SCENE_6_DURATION : loc(b.end) + OVERLAP) - loc(b.start),
});

export const Scene6: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.midnight }}>
    <Audio
      src={staticFile(`${PUB}/stock-market.wav`)}
      trimBefore={f(SCENE_START)}
      trimAfter={f(SCENE_START) + SCENE_6_DURATION}
    />

    <Sequence name="b1 picture complicated" {...beatSeq(T.b1)} premountFor={FPS}>
      <B1 />
    </Sequence>
    <Sequence name="b2 selloff vs earnings" {...beatSeq(T.b2)} premountFor={FPS}>
      <B2 />
    </Sequence>
    <Sequence name="b3 factset report" {...beatSeq(T.b3)} premountFor={FPS}>
      <B3 />
    </Sequence>
    <Sequence name="b4 earnings growth 32.9" {...beatSeq(T.b4)} premountFor={FPS}>
      <B4 />
    </Sequence>
    <Sequence name="b5 84 percent beat" {...beatSeq(T.b5)} premountFor={FPS}>
      <B5 />
    </Sequence>
    <Sequence name="b6 prices vs profits" {...beatSeq(T.b6)} premountFor={FPS}>
      <B6 />
    </Sequence>
    <Sequence name="b7 willingness to pay" {...beatSeq(T.b7, true)} premountFor={FPS}>
      <B7 />
    </Sequence>

    {SFX.map((s) => (
      <Sequence key={s.at} name={`sfx ${s.file}`} from={loc(s.at)} durationInFrames={s.frames} layout="none">
        <Sfx file={s.file} frames={s.frames} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
