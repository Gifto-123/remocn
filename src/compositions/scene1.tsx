import React from "react";
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame} from "remotion";
import {Audio} from "@remotion/media";
import {
  CANVAS_PRESETS,
  DrawOn,
  HandCircle,
  HandStrike,
  HandUnderline,
  MarkerText,
  PaperSurface,
  type MarkerTextProps,
} from "../whiteboard";
import {planHand, type PlannedSlot} from "../whiteboard/handPlan";
import {
  EDITORIAL_FONTS,
  EDITORIAL_PALETTE as P,
  EditorialCard,
  beatEnvelope,
} from "../whiteboard/components/EditorialCard";

export const SCENE1_WIDTH = CANVAS_PRESETS.youtubeLong.width;
export const SCENE1_HEIGHT = CANVAS_PRESETS.youtubeLong.height;
export const SCENE1_FPS = CANVAS_PRESETS.youtubeLong.fps;
/** ~41.0s. mp3 = 655160 B @128kbps. Set to exact mp3 length if different. */
export const SCENE1_DURATION = 1230;

const TAIL = 8;

const IMG = {
  books: "Stack_of_annual_reports_and_2444a9d8.jpg",
  trap: "Steel_bear_trap_with_coin_a8adcb1d.jpg",
  chained: "Legal_injunction_document_with_p…_5c672db9.jpg",
  court: "Stone_courthouse_facade_at_dusk_6f23690d.jpg",
  magnifier: "Magnifying_glass_over_corporate_…_ed6a627e.jpg",
  upArrow: "Stock_certificate_with_upward_arrow_7f5e409e.jpg",
  thumb: "Two_stock_certificates_side_by_e3594ad5.jpg",
  questions: "Vintage_stock_certificates_disso…_b9d49bd1.jpg",
  timer: "Countdown_clock_dissolving_into_…_79910659.jpg",
  calendar: "Pen_resting_on_desk_calendar_41d5d9dd.jpg",
} as const;

/** Image drawn by the hand. Timing comes from planHand. */
const Pic: React.FC<
  PlannedSlot & {name: string; x: number; y: number; size: number; rotate?: number}
> = ({name, x, y, size, rotate = 0, delay, duration, handEnter, handExit, showHand}) => (
  <DrawOn
    src={staticFile(`assets/scene1/${name}`)}
    x={x}
    y={y}
    width={size}
    height={size}
    delay={delay}
    duration={duration}
    handEnter={handEnter}
    handExit={handExit}
    showHand={showHand}
    bands={5}
    hand={{scale: 0.55}}
    style={{mixBlendMode: "multiply", transform: `rotate(${rotate}deg)`}}
  />
);

const T: React.FC<MarkerTextProps> = (props) => (
  <MarkerText fontFamily={EDITORIAL_FONTS.head} fontWeight={800} color={P.ink} {...props} />
);

const Fade: React.FC<{duration: number; children: React.ReactNode}> = ({duration, children}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: beatEnvelope(frame, duration, 6, 10)}}>{children}</AbsoluteFill>
  );
};

/** Beat window in absolute frames. Children use local frames (0 = `from`). */
const Beat: React.FC<{from: number; to: number; last?: boolean; children: React.ReactNode}> = ({
  from,
  to,
  last = false,
  children,
}) => {
  const duration = to - from + (last ? 0 : TAIL);
  return (
    <Sequence from={from} durationInFrames={duration}>
      <Fade duration={duration}>{children}</Fade>
    </Sequence>
  );
};

/* ---- hand plans: `at` = beat-local frame the pen touches paper (narration-locked) ---- */
const A = planHand(
  {
    thumb: {at: 6, draw: 26},
    splits: {at: 40, draw: 36},
    buy: {at: 90, draw: 20},
    under: {at: 118, draw: 12},
  },
  {label: "scene1/A", limit: 214},
);
const B = planHand(
  {
    problem: {at: 8, draw: 22},
    calendar: {at: 48, draw: 28},
    date: {at: 84, draw: 32},
    magnifier: {at: 169, draw: 20},
  },
  {label: "scene1/B", limit: 195},
);
const C = planHand(
  {
    four: {at: 6, draw: 10},
    strike: {at: 24, draw: 16},
    cert: {at: 78, draw: 26},
    one: {at: 134, draw: 8},
    circle: {at: 150, draw: 12},
  },
  {label: "scene1/C", limit: 172},
);
const D = planHand(
  {
    chained: {at: 12, draw: 24},
    title: {at: 44, draw: 24},
    frozen: {at: 140, draw: 14},
    court: {at: 158, draw: 22},
  },
  {label: "scene1/D", limit: 196},
);
const E = planHand(
  {
    timer: {at: 8, draw: 28},
    honest: {at: 56, draw: 14},
    count: {at: 78, draw: 14},
  },
  {label: "scene1/E", limit: 105},
);
const F = planHand(
  {
    trap: {at: 47, draw: 24},
    books: {at: 130, draw: 24},
    buy: {at: 184, draw: 30},
    under: {at: 222, draw: 10},
  },
  {label: "scene1/F", limit: 242},
);
const G = planHand(
  {
    img: {at: 36, draw: 24},
    which: {at: 66, draw: 14},
    trust: {at: 86, draw: 28},
    under: {at: 124, draw: 10},
  },
  {label: "scene1/G", limit: 154},
);

/**
 * Scene 1 — hook. Audio 0–39.94s. Beats (abs frames @30fps):
 * A    0–206  "4 massive stock splits… Buy now?" video-title bait
 * B  206–393  "Here's the problem." Fri Nov 27 2026, checked filings
 * C  393–557  only ONE forward split scheduled (US)
 * D  557–745  biggest split frozen by lawsuit
 * E  745–842  honest countdown
 * F  842–1076 2 splits, 1 trap, research; buy any?
 * G 1076–1230 which one would you trust
 */
export const Scene1: React.FC = () => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    <Audio src={staticFile("narration/scene1/scene1.mp3")} />

    <Beat from={0} to={206}>
      <Pic {...A.thumb} name={IMG.thumb} x={110} y={190} size={700} rotate={-2} />
      <T
        {...A.splits}
        parts={[{text: "4 STOCK "}, {text: "SPLITS", color: P.terracotta}]}
        x={900}
        y={250}
        fontSize={96}
      />
      <T {...A.buy} text="BUY NOW?" x={900} y={440} fontSize={130} color={P.crimson} />
      <HandUnderline {...A.under} x={900} y={600} width={640} color={P.crimson} strokeWidth={9} />
    </Beat>

    <Beat from={206} to={393}>
      <T {...B.problem} text="THE PROBLEM" x={140} y={50} fontSize={96} color={P.crimson} />
      <Pic {...B.calendar} name={IMG.calendar} x={130} y={210} size={700} rotate={-2} />
      <T {...B.date} text="NOV 27, 2026" x={880} y={300} fontSize={110} />
      <Pic {...B.magnifier} name={IMG.magnifier} x={1180} y={520} size={520} rotate={3} />
    </Beat>

    <Beat from={393} to={557}>
      <T {...C.four} text="4" x={160} y={240} fontSize={400} />
      <HandStrike {...C.strike} x={140} y={300} width={300} height={330} variant="double" />
      <Pic {...C.cert} name={IMG.upArrow} x={1040} y={170} size={740} rotate={2} />
      <T {...C.one} text="1" x={600} y={240} fontSize={400} color={P.sageDark} />
      <HandCircle {...C.circle} x={540} y={230} width={300} height={440} color={P.sageDark} />
    </Beat>

    <Beat from={557} to={745}>
      <Pic {...D.chained} name={IMG.chained} x={130} y={200} size={700} rotate={-1} />
      <T {...D.title} text="BIGGEST SPLIT" x={130} y={70} fontSize={96} />
      <T {...D.frozen} text="FROZEN" x={900} y={200} fontSize={130} color={P.crimson} />
      <Pic {...D.court} name={IMG.court} x={1100} y={370} size={660} rotate={2} />
    </Beat>

    <Beat from={745} to={842}>
      <Pic {...E.timer} name={IMG.timer} x={140} y={220} size={640} rotate={-2} />
      <T {...E.honest} text="THE HONEST" x={860} y={300} fontSize={120} />
      <T {...E.count} text="COUNTDOWN" x={860} y={440} fontSize={120} color={P.terracotta} />
    </Beat>

    <Beat from={842} to={1076}>
      <EditorialCard x={100} y={240} width={520} height={520} delay={2} backgroundColor={P.paperAlt}>
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: EDITORIAL_FONTS.head,
            fontWeight: 800,
            color: P.ink,
          }}
        >
          <div style={{fontSize: 300, lineHeight: 1}}>2</div>
          <div style={{fontSize: 76, color: P.terracotta}}>SPLITS</div>
        </div>
      </EditorialCard>
      <Pic {...F.trap} name={IMG.trap} x={700} y={240} size={520} rotate={-2} />
      <Pic {...F.books} name={IMG.books} x={1300} y={240} size={520} rotate={2} />
      <T {...F.buy} text="SHOULD YOU BUY?" x={620} y={900} fontSize={96} />
      <HandUnderline {...F.under} x={620} y={1015} width={940} color={P.crimson} strokeWidth={9} />
    </Beat>

    <Beat from={1076} to={1230} last>
      <Pic {...G.img} name={IMG.questions} x={110} y={190} size={720} rotate={-2} />
      <T {...G.which} text="WHICH ONE" x={900} y={260} fontSize={130} />
      <T {...G.trust} text="WOULD YOU TRUST?" x={900} y={440} fontSize={84} color={P.sageDark} />
      <HandUnderline {...G.under} x={900} y={560} width={900} color={P.sageDark} strokeWidth={9} />
    </Beat>
  </PaperSurface>
);
