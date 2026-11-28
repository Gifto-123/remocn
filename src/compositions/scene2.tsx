import React from "react";
import {staticFile} from "remotion";
import {Audio} from "@remotion/media";
import {
  CANVAS_PRESETS,
  HandArrow,
  HandCheck,
  NumberCounter,
  PaperSurface,
} from "../whiteboard";
import {planHand} from "../whiteboard/handPlan";
import {EDITORIAL_FONTS, EDITORIAL_PALETTE as P} from "../whiteboard/components/EditorialCard";
import {Beat, T} from "../whiteboard/components/SceneKit";
import {
  Bill,
  Building,
  Chip,
  CornCan,
  Draw,
  Equals,
  INK,
  Jet,
  Magnifier,
  MemoryCard,
  QMark,
  SplitCard,
  Stamp,
} from "../whiteboard/components/DrawnProps";

export const SCENE2_WIDTH = CANVAS_PRESETS.youtubeLong.width;
export const SCENE2_HEIGHT = CANVAS_PRESETS.youtubeLong.height;
export const SCENE2_FPS = CANVAS_PRESETS.youtubeLong.fps;
/** mp3 = 45.01s (1350f); narration ends ~44.2s. +1s tail. */
export const SCENE2_DURATION = 1380;

/* `at` = beat-local frame the pen touches paper = (word start s × 30) − beat start. */
const A = planHand(
  {clip: {at: 4, draw: 26}, title: {at: 46, draw: 20}, tick: {at: 80, draw: 8}},
  {label: "scene2/A", limit: 102},
);
const B = planHand({icon: {at: 8, draw: 22}, name: {at: 35, draw: 16}}, {label: "scene2/B", limit: 132});
const C = planHand({icon: {at: 4, draw: 24}, name: {at: 86, draw: 14}}, {label: "scene2/C", limit: 183});
const D = planHand({name: {at: 4, draw: 16}, icon: {at: 28, draw: 22}}, {label: "scene2/D", limit: 126});
const E = planHand({name: {at: 4, draw: 16}, icon: {at: 28, draw: 22}}, {label: "scene2/E", limit: 108});
const F = planHand(
  {
    c1: {at: 4, draw: 12, enter: 3, exit: 3},
    c2: {at: 22, draw: 12, enter: 3, exit: 3},
    c3: {at: 40, draw: 12, enter: 3, exit: 3},
    c4: {at: 58, draw: 12, enter: 3, exit: 3},
    stamp: {at: 130, draw: 12},
  },
  {label: "scene2/F", limit: 162},
);
const G = planHand(
  {bl: {at: 70, draw: 22}, eq: {at: 100, draw: 10}, br: {at: 118, draw: 22}, same: {at: 148, draw: 14}},
  {label: "scene2/G", limit: 183},
);
const H = planHand(
  {
    ten: {at: 3, draw: 18},
    arrow: {at: 36, draw: 8, enter: 3, exit: 3},
    b1: {at: 46, draw: 12},
    b2: {at: 66, draw: 12},
  },
  {label: "scene2/H", limit: 147},
);
const I = planHand(
  {
    bld: {at: 8, draw: 24},
    sig: {at: 76, draw: 20},
    mag: {at: 104, draw: 16},
    q: {at: 134, draw: 12},
  },
  {label: "scene2/I", limit: 237},
);

/** Counter used by the four split beats: 1 → n with a "-FOR-1" suffix. */
const Ratio: React.FC<{n: number; delay: number}> = ({n, delay}) => (
  <NumberCounter
    value={n}
    from={1}
    delay={delay}
    duration={20}
    decimals={0}
    suffix="-FOR-1"
    x={800}
    y={520}
    fontSize={230}
    fontWeight={800}
    fontFamily={EDITORIAL_FONTS.head}
    color={P.terracotta}
  />
);

const CARD_W = 340;
const CARD_H = (CARD_W * 440) / 360;
const ROW_X = [190, 590, 990, 1390];

/** Clipboard checklist: only the first line is ticked. */
const Clipboard: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    <rect x={60} y={40} width={240} height={300} rx={20} fill={P.paperAlt} strokeWidth={9} {...INK} />
    <rect x={120} y={22} width={120} height={46} rx={14} fill={P.slate} strokeWidth={7} {...INK} />
    <rect x={84} y={78} width={192} height={238} rx={8} fill={P.paperCard} strokeWidth={5} {...INK} />
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect x={102} y={102 + i * 52} width={28} height={28} rx={5} fill="none" strokeWidth={5} {...INK} />
        <path d={`M148 ${116 + i * 52}H${i === 0 ? 256 : 190}`} fill="none" strokeWidth={5} {...INK} />
      </g>
    ))}
  </svg>
);

/**
 * Scene 2 — recent splits already happened. Audio 0.14–43.7s. Beats (abs frames @30fps):
 * A     0–102    C  the list is short           (clipboard, one line)
 * B   102–234    B  SanDisk 8-for-1             (memory card, counter)
 * C   234–417    B  SOXX 3-for-1                (chip, counter)
 * D   417–543    B  Embraer 4-for-1             (jet, counter)
 * E   543–651    B  Seneca 5-for-1              (corn can, counter)
 * F   651–813    C  those deadlines passed      (4 split cards + stamp)
 * G   813–996    C  a split changes nothing     (building = building)
 * H   996–1143   B  $10 cut in two is $10       (bill -> 2 bills)
 * I  1143–1380   C  what does it signal?        (building + magnifier + ?)
 * All code-drawn. No AI images.
 */
export const Scene2: React.FC = () => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    <Audio src={staticFile("narration/scene2/scene2.mp3")} />

    {/* A — short list */}
    <Beat from={0} to={102}>
      <Draw {...A.clip} x={110} y={240} width={560} height={560}>
        <Clipboard size={560} />
      </Draw>
      <HandCheck {...A.tick} x={440} y={330} size={84} color={P.sageDark} />
      <T {...A.title} text="SHORT LIST" x={800} y={420} fontSize={170} color={P.ink} />
    </Beat>

    {/* B — SanDisk */}
    <Beat from={102} to={234}>
      <Draw {...B.icon} x={110} y={240} width={560} height={560}>
        <MemoryCard size={560} />
      </Draw>
      <T {...B.name} text="SANDISK" x={800} y={300} fontSize={140} color={P.ink} />
      <Ratio n={8} delay={64} />
    </Beat>

    {/* C — SOXX */}
    <Beat from={234} to={417}>
      <Draw {...C.icon} x={110} y={240} width={560} height={560}>
        <Chip size={560} />
      </Draw>
      <T {...C.name} text="SOXX" x={800} y={300} fontSize={170} color={P.ink} />
      <Ratio n={3} delay={116} />
    </Beat>

    {/* D — Embraer */}
    <Beat from={417} to={543}>
      <T {...D.name} text="EMBRAER" x={800} y={300} fontSize={140} color={P.ink} />
      <Draw {...D.icon} x={110} y={240} width={560} height={560}>
        <Jet size={560} />
      </Draw>
      <Ratio n={4} delay={20} />
    </Beat>

    {/* E — Seneca Foods */}
    <Beat from={543} to={651}>
      <T {...E.name} text="SENECA" x={800} y={300} fontSize={140} color={P.ink} />
      <Draw {...E.icon} x={110} y={240} width={560} height={560}>
        <CornCan size={560} />
      </Draw>
      <Ratio n={5} delay={28} />
    </Beat>

    {/* F — deadlines passed */}
    <Beat from={651} to={813}>
      {([F.c1, F.c2, F.c3, F.c4] as const).map((slot, i) => (
        <Draw key={i} {...slot} x={ROW_X[i]} y={200} width={CARD_W} height={CARD_H}>
          <SplitCard parts={[8, 3, 4, 5][i]} width={CARD_W} />
        </Draw>
      ))}
      <Draw {...F.stamp} x={400} y={290} width={1120} height={260} style={{transform: "rotate(-6deg)"}}>
        <Stamp text="TOO LATE" width={1120} height={260} fontSize={150} />
      </Draw>
    </Beat>

    {/* G — a split changes nothing */}
    <Beat from={813} to={996}>
      <Draw {...G.bl} x={200} y={230} width={440} height={440}>
        <Building size={440} tags={1} />
      </Draw>
      <Draw {...G.eq} x={860} y={340} width={200} height={200}>
        <Equals size={200} />
      </Draw>
      <Draw {...G.br} x={1280} y={230} width={440} height={440}>
        <Building size={440} tags={2} />
      </Draw>
      <T {...G.same} text="SAME VALUE" x={505} y={760} fontSize={130} color={P.sageDark} />
    </Beat>

    {/* H — $10 cut in two */}
    <Beat from={996} to={1143}>
      <Draw {...H.ten} x={110} y={330} width={600} height={(600 * 250) / 520}>
        <Bill value={10} width={600} />
      </Draw>
      <HandArrow {...H.arrow} from={{x: 740, y: 460}} to={{x: 900, y: 460}} color={P.ink} strokeWidth={12} />
      <Draw {...H.b1} x={960} y={190} width={480} height={(480 * 250) / 520}>
        <Bill value={5} width={480} />
      </Draw>
      <Draw {...H.b2} x={1280} y={450} width={480} height={(480 * 250) / 520}>
        <Bill value={5} width={480} />
      </Draw>
      <NumberCounter
        value={10}
        from={5}
        delay={118}
        duration={18}
        decimals={0}
        prefix="= $"
        x={110}
        y={760}
        fontSize={200}
        fontWeight={800}
        fontFamily={EDITORIAL_FONTS.head}
        color={P.sageDark}
      />
    </Beat>

    {/* I — what does the split signal */}
    <Beat from={1143} to={1380} last>
      <Draw {...I.bld} x={130} y={230} width={560} height={560}>
        <Building size={560} />
      </Draw>
      <T {...I.sig} text="THE SIGNAL" x={900} y={260} fontSize={120} color={P.ink} />
      <Draw {...I.mag} x={470} y={430} width={420} height={420}>
        <Magnifier size={420} />
      </Draw>
      <Draw {...I.q} x={1330} y={440} width={220} height={308}>
        <QMark width={220} />
      </Draw>
    </Beat>
  </PaperSurface>
);
