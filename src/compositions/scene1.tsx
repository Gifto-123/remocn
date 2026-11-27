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
  books: "Academic_books_and_rolled_chart_85864bf2.jpg",
  trap: "Bear_trap_under_leaves_bait_31cc3dba.jpg",
  chained: "Chained_stock_certificate_with_g…_0636d49b.jpg",
  court: "Courthouse_building,_gavel,_and_…_57f0de57.jpg",
  magnifier: "Magnifying_glass_over_filing_doc…_541b451b.jpg",
  upArrow: "Stock_certificate_with_up_arrow_33045a1a.jpg",
  thumb: "Stock_certificates_video_thumbna…_c22e2055.jpg",
  questions: "Two_stock_certificates_with_ques…_bd28e4ba.jpg",
  timer: "Vintage_countdown_timer_illustra…_22aafcae.jpg",
  calendar: "Wall_calendar_page_with_November_a0d13697.jpg",
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
    four: {at: 40, draw: 16},
    splits: {at: 64, draw: 18},
    buy: {at: 90, draw: 20},
    under: {at: 118, draw: 12},
    l1: {at: 138, draw: 30},
    l2: {at: 176, draw: 22},
  },
  {label: "scene1/A", limit: 214},
);
const B = planHand(
  {
    problem: {at: 8, draw: 22},
    calendar: {at: 48, draw: 28},
    date: {at: 84, draw: 40},
    filings: {at: 141, draw: 20},
    magnifier: {at: 169, draw: 20},
  },
  {label: "scene1/B", limit: 195},
);
const C = planHand(
  {
    four: {at: 6, draw: 10},
    strike: {at: 24, draw: 16},
    fwd: {at: 48, draw: 22},
    cert: {at: 78, draw: 26},
    us: {at: 108, draw: 18},
    one: {at: 134, draw: 8},
    circle: {at: 150, draw: 12},
  },
  {label: "scene1/C", limit: 172},
);
const D = planHand(
  {
    chained: {at: 12, draw: 24},
    title: {at: 44, draw: 30},
    waiting: {at: 84, draw: 28},
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
    trapT: {at: 79, draw: 10},
    books: {at: 130, draw: 24},
    resT: {at: 162, draw: 14},
    buy: {at: 184, draw: 30},
    under: {at: 222, draw: 10},
  },
  {label: "scene1/F", limit: 242},
);
const G = planHand(
  {
    stay: {at: 8, draw: 20},
    img: {at: 36, draw: 24},
    which: {at: 66, draw: 12},
    would: {at: 86, draw: 12},
    trust: {at: 106, draw: 10},
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
      <T {...A.four} text="4 MASSIVE" x={900} y={150} fontSize={112} />
      <T
        {...A.splits}
        parts={[{text: "STOCK "}, {text: "SPLITS", color: P.terracotta}]}
        x={900}
        y={290}
        fontSize={112}
      />
      <T {...A.buy} text="BUY NOW?" x={900} y={470} fontSize={130} color={P.crimson} />
      <HandUnderline {...A.under} x={900} y={620} width={640} color={P.crimson} strokeWidth={9} />
      <T {...A.l1} text="the title a lot of videos" x={900} y={710} fontSize={46} color={P.mutedInk} />
      <T {...A.l2} text="have used this month." x={900} y={775} fontSize={46} color={P.mutedInk} />
    </Beat>

    <Beat from={206} to={393}>
      <T {...B.problem} text="THE PROBLEM" x={140} y={50} fontSize={96} color={P.crimson} />
      <Pic {...B.calendar} name={IMG.calendar} x={130} y={210} size={700} rotate={-2} />
      <T {...B.date} text="FRI, NOV 27, 2026" x={880} y={260} fontSize={84} />
      <T {...B.filings} text="FILINGS CHECKED" x={880} y={430} fontSize={64} color={P.slate} />
      <Pic {...B.magnifier} name={IMG.magnifier} x={1180} y={520} size={520} rotate={3} />
    </Beat>

    <Beat from={393} to={557}>
      <T {...C.four} text="4" x={160} y={150} fontSize={400} />
      <HandStrike {...C.strike} x={140} y={210} width={300} height={330} variant="double" />
      <T {...C.fwd} text="FORWARD SPLIT" x={160} y={700} fontSize={84} color={P.terracotta} />
      <Pic {...C.cert} name={IMG.upArrow} x={1040} y={170} size={740} rotate={2} />
      <T {...C.us} text="IN THE U.S." x={160} y={830} fontSize={84} color={P.slate} />
      <T {...C.one} text="1" x={600} y={150} fontSize={400} color={P.sageDark} />
      <HandCircle {...C.circle} x={540} y={140} width={300} height={440} color={P.sageDark} />
    </Beat>

    <Beat from={557} to={745}>
      <Pic {...D.chained} name={IMG.chained} x={130} y={200} size={700} rotate={-1} />
      <T {...D.title} text="BIGGEST SPLIT OF THE YEAR" x={130} y={70} fontSize={72} />
      <T {...D.waiting} text="WAITING SINCE JANUARY" x={130} y={920} fontSize={56} color={P.slate} />
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
      <T {...F.trapT} text="1 TRAP" x={700} y={780} fontSize={80} color={P.crimson} />
      <Pic {...F.books} name={IMG.books} x={1300} y={240} size={520} rotate={2} />
      <T {...F.resT} text="RESEARCH" x={1300} y={780} fontSize={80} color={P.slate} />
      <T {...F.buy} text="SHOULD YOU BUY?" x={620} y={900} fontSize={96} />
      <HandUnderline {...F.under} x={620} y={1015} width={940} color={P.crimson} strokeWidth={9} />
    </Beat>

    <Beat from={1076} to={1230} last>
      <T {...G.stay} text="STAY TILL THE END" x={900} y={120} fontSize={56} color={P.mutedInk} />
      <Pic {...G.img} name={IMG.questions} x={110} y={190} size={720} rotate={-2} />
      <T {...G.which} text="WHICH ONE" x={900} y={240} fontSize={130} />
      <T {...G.would} text="WOULD YOU" x={900} y={390} fontSize={130} />
      <T {...G.trust} text="TRUST?" x={900} y={540} fontSize={130} color={P.sageDark} />
      <HandUnderline {...G.under} x={900} y={700} width={520} color={P.sageDark} strokeWidth={9} />
    </Beat>
  </PaperSurface>
);