import React from "react";
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame} from "remotion";
import {Audio} from "@remotion/media";
import {
  CANVAS_PRESETS,
  DrawOn,
  HandCheck,
  HandCircle,
  HandStrike,
  HandUnderline,
  MarkerText,
  PaperSurface,
  type MarkerTextProps,
} from "../whiteboard";
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

/** Set false if public/assets/hand-pen.png is missing. */
const SHOW_HAND = true;
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

/** Image reveal (serpentine clip). Hand off: avoids overlapping hands. */
const Pic: React.FC<{
  name: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration?: number;
  rotate?: number;
}> = ({name, x, y, size, delay, duration = 34, rotate = 0}) => (
  <DrawOn
    src={staticFile(`assets/scene1/${name}`)}
    x={x}
    y={y}
    width={size}
    height={size}
    delay={delay}
    duration={duration}
    bands={5}
    showHand={false}
    style={{mixBlendMode: "multiply", transform: `rotate(${rotate}deg)`}}
  />
);

const T: React.FC<MarkerTextProps> = (props) => (
  <MarkerText
    fontFamily={EDITORIAL_FONTS.head}
    fontWeight={800}
    color={P.ink}
    handEnter={4}
    handExit={6}
    showHand={SHOW_HAND}
    {...props}
  />
);

const Fade: React.FC<{duration: number; children: React.ReactNode}> = ({
  duration,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: beatEnvelope(frame, duration, 6, 10)}}>
      {children}
    </AbsoluteFill>
  );
};

/** Beat window in absolute frames. Children use local frames (0 = `from`). */
const Beat: React.FC<{
  from: number;
  to: number;
  last?: boolean;
  children: React.ReactNode;
}> = ({from, to, last = false, children}) => {
  const duration = to - from + (last ? 0 : TAIL);
  return (
    <Sequence from={from} durationInFrames={duration}>
      <Fade duration={duration}>{children}</Fade>
    </Sequence>
  );
};

const ann = {handEnter: 4, handExit: 4, showHand: SHOW_HAND} as const;

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

    {/* A */}
    <Beat from={0} to={206}>
      <Pic name={IMG.thumb} x={110} y={190} size={700} delay={4} duration={40} rotate={-2} />
      <T text="4 MASSIVE" x={900} y={150} fontSize={112} delay={6} duration={24} />
      <T
        parts={[{text: "STOCK "}, {text: "SPLITS", color: P.terracotta}]}
        x={900}
        y={290}
        fontSize={112}
        delay={36}
        duration={36}
      />
      <T text="BUY NOW?" x={900} y={470} fontSize={130} color={P.crimson} delay={80} duration={26} />
      <HandUnderline x={900} y={620} width={640} color={P.crimson} strokeWidth={9} delay={112} duration={16} {...ann} />
      <T text="the title a lot of videos" x={900} y={710} fontSize={46} color={P.mutedInk} delay={134} duration={34} />
      <T text="have used this month." x={900} y={775} fontSize={46} color={P.mutedInk} delay={176} duration={24} />
    </Beat>

    {/* B */}
    <Beat from={206} to={393}>
      <T text="THE PROBLEM" x={140} y={50} fontSize={96} color={P.crimson} delay={4} duration={26} />
      <Pic name={IMG.calendar} x={130} y={210} size={700} delay={46} duration={34} rotate={-2} />
      <T text="FRI, NOV 27, 2026" x={880} y={260} fontSize={84} delay={48} duration={54} />
      <T text="FILINGS CHECKED" x={880} y={430} fontSize={64} color={P.slate} delay={141} duration={26} />
      <Pic name={IMG.magnifier} x={1180} y={520} size={520} delay={141} duration={30} rotate={3} />
      <HandCheck x={1560} y={425} size={72} delay={176} duration={10} {...ann} />
    </Beat>

    {/* C */}
    <Beat from={393} to={557}>
      <T text="4" x={160} y={150} fontSize={400} delay={2} duration={12} />
      <HandStrike x={140} y={210} width={300} height={330} variant="double" delay={22} duration={20} {...ann} />
      <T text="FORWARD SPLIT" x={160} y={700} fontSize={84} color={P.terracotta} delay={48} duration={28} />
      <Pic name={IMG.upArrow} x={1040} y={170} size={740} delay={50} duration={36} rotate={2} />
      <T text="IN THE U.S." x={160} y={830} fontSize={84} color={P.slate} delay={92} duration={22} />
      <T text="1" x={600} y={150} fontSize={400} color={P.sageDark} delay={126} duration={10} />
      <HandCircle x={540} y={140} width={300} height={440} color={P.sageDark} delay={144} duration={16} {...ann} />
    </Beat>

    {/* D */}
    <Beat from={557} to={745}>
      <T text="BIGGEST SPLIT OF THE YEAR" x={130} y={70} fontSize={72} delay={8} duration={40} />
      <Pic name={IMG.chained} x={130} y={200} size={700} delay={8} duration={34} rotate={-1} />
      <T text="WAITING SINCE JANUARY" x={130} y={920} fontSize={56} color={P.slate} delay={60} duration={40} />
      <T text="FROZEN" x={900} y={200} fontSize={130} color={P.crimson} delay={130} duration={18} />
      <Pic name={IMG.court} x={1100} y={370} size={660} delay={160} duration={24} rotate={2} />
    </Beat>

    {/* E */}
    <Beat from={745} to={842}>
      <Pic name={IMG.timer} x={140} y={220} size={640} delay={4} duration={34} rotate={-2} />
      <T text="THE HONEST" x={860} y={300} fontSize={120} delay={48} duration={18} />
      <T text="COUNTDOWN" x={860} y={440} fontSize={120} color={P.terracotta} delay={76} duration={18} />
    </Beat>

    {/* F */}
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
      <Pic name={IMG.trap} x={700} y={240} size={520} delay={44} duration={30} rotate={-2} />
      <T text="1 TRAP" x={700} y={780} fontSize={80} color={P.crimson} delay={56} duration={14} />
      <Pic name={IMG.books} x={1300} y={240} size={520} delay={126} duration={30} rotate={2} />
      <T text="RESEARCH" x={1300} y={780} fontSize={80} color={P.slate} delay={146} duration={16} />
      <T text="SHOULD YOU BUY?" x={620} y={900} fontSize={96} delay={176} duration={36} />
      <HandUnderline x={620} y={1015} width={940} color={P.crimson} strokeWidth={9} delay={222} duration={12} {...ann} />
    </Beat>

    {/* G */}
    <Beat from={1076} to={1230} last>
      <Pic name={IMG.questions} x={110} y={190} size={720} delay={4} duration={40} rotate={-2} />
      <T text="STAY TILL THE END" x={900} y={120} fontSize={56} color={P.mutedInk} delay={8} duration={34} />
      <T text="WHICH ONE" x={900} y={240} fontSize={130} delay={56} duration={14} />
      <T text="WOULD YOU" x={900} y={390} fontSize={130} delay={80} duration={14} />
      <T text="TRUST?" x={900} y={540} fontSize={130} color={P.sageDark} delay={104} duration={12} />
      <HandUnderline x={900} y={700} width={520} color={P.sageDark} strokeWidth={9} delay={126} duration={12} {...ann} />
    </Beat>
  </PaperSurface>
);
