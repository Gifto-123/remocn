import React from "react";
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {Audio} from "@remotion/media";
import {
  CANVAS_PRESETS,
  HandCircle,
  HandCross,
  HandUnderline,
  HighlighterSweep,
  LowerThird,
  NumberCounter,
  PaperSurface,
  RoundedFrame,
} from "../whiteboard";
import {planHand} from "../whiteboard/handPlan";
import {
  EDITORIAL_FONTS,
  EDITORIAL_PALETTE as P,
} from "../whiteboard/components/EditorialCard";
import {Beat, T} from "../whiteboard/components/SceneKit";
import {Draw, INK, QMark, SplitCard} from "../whiteboard/components/DrawnProps";

export const SCENE1_WIDTH = CANVAS_PRESETS.youtubeLong.width;
export const SCENE1_HEIGHT = CANVAS_PRESETS.youtubeLong.height;
export const SCENE1_FPS = CANVAS_PRESETS.youtubeLong.fps;
/** ~41.0s. mp3 = 39.89s (1197f); narration ends ~39.94s. */
export const SCENE1_DURATION = 1230;

const asset = (name: string) => staticFile(`assets/scene1/${name}`);
const IMG = {
  hook: asset("Hand_hovering_above_trading_button_8fea9c84.jpg"),
  filing: asset("SiTime.png"),
  docket: asset("meta.png"),
} as const;

/* ------------------------------------------------------------------ */
/* Drawn pieces (SVG, revealed by the hand through DrawOn)             */
/* ------------------------------------------------------------------ */

/** Alarm clock whose hands run backwards over `frames`. */
const CountdownClock: React.FC<{size: number; frames: number}> = ({size, frames}) => {
  const f = useCurrentFrame();
  const minute = -interpolate(f, [0, frames], [0, 300], {extrapolateRight: "clamp"});
  const hour = -interpolate(f, [0, frames], [0, 25], {extrapolateRight: "clamp"}) - 50;
  const ticks = Array.from({length: 12}, (_, i) => i * 30);
  return (
    <svg width={size} height={size} viewBox="0 0 600 600">
      <circle cx={170} cy={90} r={52} fill={P.terracotta} strokeWidth={10} {...INK} />
      <circle cx={430} cy={90} r={52} fill={P.terracotta} strokeWidth={10} {...INK} />
      <circle cx={300} cy={320} r={250} fill={P.paperCard} strokeWidth={14} {...INK} />
      {ticks.map((a) => (
        <line
          key={a}
          x1={300}
          y1={92}
          x2={300}
          y2={a % 90 === 0 ? 132 : 114}
          strokeWidth={a % 90 === 0 ? 14 : 8}
          transform={`rotate(${a} 300 320)`}
          {...INK}
        />
      ))}
      <line x1={300} y1={320} x2={300} y2={168} strokeWidth={12} transform={`rotate(${minute} 300 320)`} {...INK} />
      <line x1={300} y1={320} x2={300} y2={212} strokeWidth={18} transform={`rotate(${hour} 300 320)`} {...INK} />
      <circle cx={300} cy={320} r={16} fill={P.crimson} />
    </svg>
  );
};

/** A coin cut in half. */
const CoinCut: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    <path d="M168 50 A130 130 0 0 0 168 310 Z" transform="translate(-22 0)" fill={P.mustard} strokeWidth={9} {...INK} />
    <path d="M192 50 A130 130 0 0 1 192 310 Z" transform="translate(22 0)" fill={P.mustard} strokeWidth={9} {...INK} />
    <path d="M180 30V330" stroke={P.crimson} strokeWidth={7} strokeDasharray="16 14" strokeLinecap="round" />
    <path d="M120 140h30M120 180h40M120 220h30M240 140h-30M240 180h-40M240 220h-30" fill="none" strokeWidth={7} {...INK} />
  </svg>
);

/** Steel bear trap with a coin as bait. */
const BearTrap: React.FC<{size: number}> = ({size}) => {
  const teeth = Array.from({length: 13}, (_, i) => {
    const a = Math.PI + (i / 12) * Math.PI;
    const r = i % 2 === 0 ? 118 : 74;
    return `${180 + r * Math.cos(a)},${230 + r * Math.sin(a)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox="0 0 360 360">
      <rect x={30} y={226} width={300} height={34} rx={17} fill={P.slate} strokeWidth={8} {...INK} />
      <path d="M50 226 A130 130 0 0 1 310 226" fill="none" strokeWidth={14} {...INK} />
      <polyline points={teeth} fill={P.paperAlt} strokeWidth={7} {...INK} />
      <circle cx={180} cy={196} r={26} fill={P.mustard} strokeWidth={6} {...INK} />
      <path d="M180 260v50M130 310h100" fill="none" strokeWidth={8} {...INK} />
    </svg>
  );
};

/** Mini line chart. */
const MiniChart: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    <path d="M30 24V316H340" fill="none" strokeWidth={9} {...INK} />
    <polyline
      points="50,280 100,226 150,252 210,160 260,188 326,84"
      fill="none"
      stroke={P.terracotta}
      strokeWidth={14}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx={326} cy={84} r={14} fill={P.crimson} />
  </svg>
);

/** Cropped, zoomed excerpt of a real filing / docket on a paper card. */
const Evidence: React.FC<{
  src: string;
  native: number;
  scale: number;
  cropX: number;
  w: number;
  h: number;
  pad?: number;
}> = ({src, native, scale, cropX, w, h, pad = 24}) => (
  <div
    style={{
      width: w,
      height: h,
      boxSizing: "border-box",
      padding: pad,
      background: P.paperCard,
      borderRadius: 28,
      boxShadow: `0 6px 0 ${P.shadow}, 0 0 0 2px ${P.border}`,
    }}
  >
    <div style={{position: "relative", width: w - 2 * pad, height: h - 2 * pad, overflow: "hidden"}}>
      <Img
        src={src}
        style={{
          position: "absolute",
          left: -cropX * scale,
          top: 0,
          width: native * scale,
          maxWidth: "none",
          height: "auto",
        }}
      />
    </div>
  </div>
);

/** Full-bleed cinematic hook image with slow push-in and dark overlay. */
const HookBg: React.FC<{duration: number}> = ({duration}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, duration], [1, 1.07], {extrapolateRight: "clamp"});
  return (
    <AbsoluteFill>
      <Img
        src={IMG.hook}
        style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`}}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(8,10,10,0.38) 0%, rgba(8,10,10,0.74) 52%, rgba(8,10,10,0.82) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Hand plans. `at` = beat-local frame the pen touches paper           */
/* = (word start s × 30) − beat start.                                 */
/* ------------------------------------------------------------------ */

const A = planHand(
  {splits: {at: 37, draw: 18}, buy: {at: 79, draw: 22}},
  {label: "scene1/A", limit: 215},
);
const B = planHand(
  {
    date: {at: 47, draw: 22},
    doc: {at: 84, draw: 26},
    frame: {at: 120, draw: 18},
    hl: {at: 156, draw: 18},
  },
  {label: "scene1/B", limit: 186},
);
const C = planHand(
  {
    c1: {at: 4, draw: 12, enter: 3, exit: 3},
    c2: {at: 22, draw: 12, enter: 3, exit: 3},
    c3: {at: 40, draw: 12, enter: 3, exit: 3},
    c4: {at: 58, draw: 12, enter: 3, exit: 3},
    x2: {at: 78, draw: 8, enter: 3, exit: 3},
    x3: {at: 94, draw: 8, enter: 3, exit: 3},
    x4: {at: 110, draw: 8, enter: 3, exit: 3},
    ring: {at: 133, draw: 20},
  },
  {label: "scene1/C", limit: 165},
);
const D = planHand(
  {
    doc: {at: 6, draw: 24},
    frame: {at: 40, draw: 18},
    frozen: {at: 135, draw: 14},
    ring: {at: 161, draw: 16},
  },
  {label: "scene1/D", limit: 186},
);
const E = planHand(
  {clock: {at: 2, draw: 28}, word: {at: 56, draw: 18}, under: {at: 84, draw: 10}},
  {label: "scene1/E", limit: 99},
);
const F = planHand(
  {
    i1: {at: 2, draw: 14},
    l1: {at: 24, draw: 12},
    i2: {at: 46, draw: 14},
    l2: {at: 70, draw: 10},
    i3: {at: 124, draw: 18},
    l3: {at: 143, draw: 14},
  },
  {label: "scene1/F", limit: 234},
);
const G = planHand(
  {
    k1: {at: 4, draw: 14, enter: 3, exit: 3},
    k2: {at: 24, draw: 14, enter: 3, exit: 3},
    which: {at: 61, draw: 20},
    q1: {at: 90, draw: 10},
    q2: {at: 108, draw: 10},
  },
  {label: "scene1/G", limit: 153},
);

/* ------------------------------------------------------------------ */
/* Layout constants                                                    */
/* ------------------------------------------------------------------ */

const CARD_W = 372;
const CARD_H = (CARD_W * 440) / 360;
const ROW_X = [108, 552, 996, 1440];
const ROW_Y = 360;

const NODE_CX = [360, 960, 1560];
const labelX = (cx: number, chars: number, fs: number) => Math.round(cx - (0.7 * fs * chars) / 2);

/**
 * Scene 1 — hook. Audio 0–39.94s. Beats (abs frames @30fps):
 * A     0–207   A  videos hype 4 splits as "buy now"        (cinematic hook)
 * B   207–393   D  I checked the actual filings             (SEC filing crop)
 * C   393–558   B  only 1 of the 4 is scheduled             (4 cards, 3 crossed, 4→1)
 * D   558–744   D  biggest split frozen by a lawsuit        (docket crop)
 * E   744–843   C  today: the honest countdown              (drawn clock)
 * F   843–1077  C  2 splits, 1 trap, research               (3-node agenda)
 * G  1077–1230  C  which one would you trust?               (2 cards + ?)
 */
export const Scene1: React.FC = () => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    <Audio src={staticFile("narration/scene1/scene1.mp3")} />

    {/* A — cinematic hook */}
    <Beat from={0} to={207}>
      <HookBg duration={215} />
      <NumberCounter
        value={4}
        from={0}
        delay={6}
        duration={30}
        decimals={0}
        x={960}
        y={220}
        fontSize={320}
        fontWeight={800}
        fontFamily={EDITORIAL_FONTS.head}
        color={P.paper}
      />
      <T {...A.splits} text="SPLITS" x={1230} y={330} fontSize={150} color={P.paper} />
      <T {...A.buy} text="BUY NOW?" x={960} y={620} fontSize={150} color="#FF6A57" />
    </Beat>

    {/* B — real filing */}
    <Beat from={207} to={393}>
      <T {...B.date} text="NOV 27, 2026" x={110} y={300} fontSize={150} color={P.slate} />
      <Draw {...B.doc} x={116} y={540} width={1688} height={188}>
        <Evidence src={IMG.filing} native={1838} scale={1.8} cropX={0} w={1688} h={188} />
      </Draw>
      <RoundedFrame {...B.frame} x={92} y={516} width={1736} height={236} radius={40} color={P.ink} strokeWidth={10} />
      <LowerThird text="SiTime · SEC filing, Note 13" delay={150} />
      <HighlighterSweep {...B.hl} x={634} y={631} width={332} height={36} />
    </Beat>

    {/* C — only 1 of 4 scheduled */}
    <Beat from={393} to={558}>
      <NumberCounter
        value={1}
        from={4}
        delay={129}
        duration={18}
        decimals={0}
        x={0}
        y={120}
        width={1920}
        textAlign="center"
        fontSize={190}
        fontWeight={800}
        fontFamily={EDITORIAL_FONTS.head}
        color={P.terracotta}
      />
      {([C.c1, C.c2, C.c3, C.c4] as const).map((slot, i) => (
        <Draw key={i} {...slot} x={ROW_X[i]} y={ROW_Y} width={CARD_W} height={CARD_H}>
          <SplitCard parts={[3, 2, 4, 5][i]} width={CARD_W} />
        </Draw>
      ))}
      {([C.x2, C.x3, C.x4] as const).map((slot, i) => (
        <HandCross
          key={i}
          {...slot}
          x={ROW_X[i + 1] + CARD_W / 2 - 120}
          y={ROW_Y + CARD_H / 2 - 120}
          size={240}
          strokeWidth={18}
          color={P.crimson}
        />
      ))}
      <HandCircle
        {...C.ring}
        x={ROW_X[0] - 30}
        y={ROW_Y - 30}
        width={CARD_W + 60}
        height={CARD_H + 60}
        color={P.sageDark}
        strokeWidth={12}
      />
    </Beat>

    {/* D — docket: frozen */}
    <Beat from={558} to={744}>
      <Draw {...D.doc} x={116} y={330} width={1688} height={198}>
        <Evidence src={IMG.docket} native={1900} scale={2.1} cropX={430} w={1688} h={198} />
      </Draw>
      <RoundedFrame {...D.frame} x={92} y={306} width={1736} height={246} radius={40} color={P.ink} strokeWidth={10} />
      <LowerThird text="Meta Platforms · SEC filing, 8-K Item 8.01" delay={60} />
      <T {...D.frozen} text="FROZEN" x={110} y={640} fontSize={230} color={P.crimson} />
      <HandCircle {...D.ring} x={462} y={441} width={632} height={76} color={P.crimson} strokeWidth={10} />
    </Beat>

    {/* E — countdown */}
    <Beat from={744} to={843}>
      <Draw {...E.clock} x={110} y={240} width={600} height={600}>
        <CountdownClock size={600} frames={99} />
      </Draw>
      <T {...E.word} text="COUNTDOWN" x={880} y={400} fontSize={150} color={P.terracotta} />
      <HandUnderline {...E.under} x={880} y={575} width={940} color={P.ink} strokeWidth={10} />
    </Beat>

    {/* F — 2 splits, 1 trap, research */}
    <Beat from={843} to={1077}>
      <NumberCounter
        value={2}
        from={0}
        delay={6}
        duration={16}
        decimals={0}
        x={NODE_CX[0] - 260}
        y={150}
        width={520}
        textAlign="center"
        fontSize={200}
        fontWeight={800}
        fontFamily={EDITORIAL_FONTS.head}
        color={P.sageDark}
      />
      <Draw {...F.i1} x={NODE_CX[0] - 180} y={400} width={360} height={360}>
        <CoinCut size={360} />
      </Draw>
      <T {...F.l1} text="SPLITS" x={labelX(NODE_CX[0], 6, 90)} y={830} fontSize={90} color={P.ink} />

      <NumberCounter
        value={1}
        from={0}
        delay={50}
        duration={12}
        decimals={0}
        x={NODE_CX[1] - 260}
        y={150}
        width={520}
        textAlign="center"
        fontSize={200}
        fontWeight={800}
        fontFamily={EDITORIAL_FONTS.head}
        color={P.crimson}
      />
      <Draw {...F.i2} x={NODE_CX[1] - 180} y={400} width={360} height={360}>
        <BearTrap size={360} />
      </Draw>
      <T {...F.l2} text="TRAP" x={labelX(NODE_CX[1], 4, 90)} y={830} fontSize={90} color={P.crimson} />

      <Draw {...F.i3} x={NODE_CX[2] - 180} y={400} width={360} height={360}>
        <MiniChart size={360} />
      </Draw>
      <T {...F.l3} text="RESEARCH" x={labelX(NODE_CX[2], 8, 90)} y={830} fontSize={90} color={P.slate} />
    </Beat>

    {/* G — which one would you trust */}
    <Beat from={1077} to={1230} last>
      <T {...G.which} text="WHICH ONE?" x={365} y={110} fontSize={170} color={P.ink} />
      <Draw {...G.k1} x={330} y={360} width={400} height={(400 * 440) / 360}>
        <SplitCard parts={3} width={400} />
      </Draw>
      <Draw {...G.k2} x={1190} y={360} width={400} height={(400 * 440) / 360}>
        <SplitCard parts={2} width={400} />
      </Draw>
      <Draw {...G.q1} x={430} y={440} width={200} height={280}>
        <QMark width={200} />
      </Draw>
      <Draw {...G.q2} x={1290} y={440} width={200} height={280}>
        <QMark width={200} />
      </Draw>
    </Beat>
  </PaperSurface>
);
