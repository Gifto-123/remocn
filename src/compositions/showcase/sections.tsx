import React from "react";
import {AbsoluteFill, staticFile} from "remotion";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import type {Caption} from "@remotion/captions";
import {
  EDITORIAL_FONTS,
  EDITORIAL_PALETTE as P,
  ASSETS,
  DrawOn,
  MarkerList,
  MarkerParagraph,
  fit,
  planHand,
  type PlannedSlot,
} from "../../whiteboard/core";
import {
  EraserWipe,
  HandArrow,
  HandBracket,
  HandCheck,
  HandCircle,
  HandCross,
  HandDivider,
  HandStrike,
  HandUnderline,
  HighlighterSweep,
  RoundedFrame,
} from "../../whiteboard/annotations";
import {
  CandlestickChart,
  CompanyBuilding,
  ComparisonTable,
  CompoundGrowth,
  DonutChart,
  Gauge,
  HandBarChart,
  HandLineChart,
  MoneyFlow,
  ProgressBar,
  comparisonTableDuration,
  type CandlestickDatum,
} from "../../whiteboard/data";
import * as Illus from "../../whiteboard/illustration";
import {Draw, Person, SpeechBubble, ThoughtBubble} from "../../whiteboard/illustration";
import {
  CT,
  Captions,
  CharacterSprite,
  EditorialCard,
  LowerThird,
  Num,
  Pic,
  T,
  YearBadge,
  centerX,
  fitFont,
  textW,
} from "../../whiteboard/layout";
import {
  Whiteboard,
  WhiteboardCamera,
  handWipe,
  whiteboardDuration,
  whiteboardSlide,
  whiteboardWipe,
  type WhiteboardItem,
} from "../../whiteboard/motion";
import type {CategoryId} from "../../whiteboard/categories";

/**
 * Component showcase. One section per component group, 9:16 (1080×1920).
 * Rules followed: safe zone x 60–960 / y 200–1480, one centered column,
 * text ≥ 80, one hand per section routed through planHand().
 * Hand slot `at` values are beat-local frames (sections are not narrated).
 */

export type Section = {
  id: string;
  title: string;
  category: CategoryId;
  duration: number;
  Body: React.FC;
};

/* ---------- shared helpers ---------- */

/** Section title, written by the hand at the top of the safe zone. */
const Label: React.FC<PlannedSlot & {text: string}> = ({text, ...slot}) => (
  <CT {...slot} text={text} fontSize={100} y={200} color={P.terracotta} />
);
const LBL = {at: 4, draw: 26} as const;

/** Centered grid cell positions for 2 columns × 3 rows of 340px props. */
const CELL = 340;
const cellX = (i: number) => (i % 2 === 0 ? 190 : 550);
const cellY = (i: number) => 380 + Math.floor(i / 2) * 360;

/* ---------- 1. MarkerText ---------- */
const MT = planHand(
  {l: LBL, big: {at: 40, draw: 40}},
  {label: "showcase/marker-text", limit: 120},
);
const MT_TEXT = "$10/DAY";
const MT_SIZE = fitFont(MT_TEXT, 260);
const MarkerTextBody: React.FC = () => (
  <>
    <Label {...MT.l} text="MarkerText" />
    <T
      {...MT.big}
      parts={[{text: "$10", color: P.sageDark}, {text: "/DAY"}]}
      x={centerX(textW(MT_TEXT, MT_SIZE))}
      y={700}
      fontSize={MT_SIZE}
    />
  </>
);

/* ---------- 2. MarkerList ---------- */
const ML = planHand(
  {l: LBL, list: {at: 40, draw: 80}},
  {label: "showcase/marker-list", limit: 170},
);
const MarkerListBody: React.FC = () => (
  <>
    <Label {...ML.l} text="MarkerList" />
    <MarkerList
      {...ML.list}
      items={["SAVE", "INVEST", "REPEAT"]}
      marker="check"
      x={170}
      y={520}
      fontSize={120}
      maxWidth={760}
    />
  </>
);

/* ---------- 3. MarkerParagraph ---------- */
const MP = planHand(
  {l: LBL, para: {at: 40, draw: 110}},
  {label: "showcase/marker-paragraph", limit: 170},
);
const MarkerParagraphBody: React.FC = () => (
  <>
    <Label {...MP.l} text="MarkerParagraph" />
    <MarkerParagraph
      {...MP.para}
      text={"Pay yourself first.\nThen spend the rest."}
      x={90}
      y={500}
      fontSize={90}
      maxWidth={900}
    />
  </>
);

/* ---------- 4. DrawOn ---------- */
const DO = planHand(
  {l: LBL, img: {at: 40, draw: 70}},
  {label: "showcase/draw-on", limit: 140},
);
const MAN = fit(ASSETS.man, {height: 1000});
const DrawOnBody: React.FC = () => (
  <>
    <Label {...DO.l} text="DrawOn" />
    <DrawOn
      {...DO.img}
      src={staticFile(ASSETS.man.file)}
      {...MAN}
      x={centerX(MAN.width)}
      y={380}
      bands={8}
    />
  </>
);

/* ---------- 5. Pic ---------- */
const PC = planHand(
  {l: LBL, img: {at: 40, draw: 50}},
  {label: "showcase/pic", limit: 130},
);
const CASH = fit(ASSETS.moneyColor, {width: 860});
const PicBody: React.FC = () => (
  <>
    <Label {...PC.l} text="Pic" />
    <Pic {...PC.img} src={staticFile(ASSETS.moneyColor.file)} w={CASH.width} h={CASH.height} y={560} />
  </>
);

/* ---------- 6-7. Annotations ---------- */
const WORD = {fontSize: 100} as const;
const AA = planHand(
  {
    l: LBL,
    w1: {at: 30, draw: 8, hand: false},
    w2: {at: 64, draw: 8, hand: false},
    w3: {at: 97, draw: 8, hand: false},
    w4: {at: 130, draw: 8, hand: false},
    a1: {at: 44, draw: 24},
    a2: {at: 77, draw: 24},
    a3: {at: 110, draw: 24},
    a4: {at: 143, draw: 24},
  },
  {label: "showcase/annotations-a", limit: 190},
);
const AnnotationsABody: React.FC = () => (
  <>
    <Label {...AA.l} text="Annotations" />
    <T {...AA.w1} {...WORD} text="CIRCLE" x={330} y={400} />
    <HandCircle {...AA.a1} x={290} y={380} width={500} height={160} color={P.terracotta} />
    <T {...AA.w2} {...WORD} text="UNDERLINE" x={225} y={680} />
    <HandUnderline {...AA.a2} x={225} y={790} width={630} double color={P.sageDark} />
    <T {...AA.w3} {...WORD} text="ARROW" x={365} y={960} />
    <HandArrow {...AA.a3} from={{x: 100, y: 1110}} to={{x: 345, y: 1030}} color={P.slate} />
    <T {...AA.w4} {...WORD} text="DIVIDER" x={295} y={1240} />
    <HandDivider {...AA.a4} x={170} y={1370} length={740} double color={P.mustard} />
  </>
);

const AB = planHand(
  {
    l: LBL,
    w1: {at: 30, draw: 8, hand: false},
    w2: {at: 64, draw: 8, hand: false},
    w3: {at: 97, draw: 8, hand: false},
    w4: {at: 130, draw: 8, hand: false},
    a1: {at: 44, draw: 24},
    a2: {at: 77, draw: 24},
    a3: {at: 110, draw: 24},
    a4: {at: 143, draw: 24},
  },
  {label: "showcase/annotations-b", limit: 190},
);
const AnnotationsBBody: React.FC = () => (
  <>
    <Label {...AB.l} text="Annotations" />
    <T {...AB.w1} {...WORD} text="CHECK" x={365} y={400} />
    <HandCheck {...AB.a1} x={740} y={395} size={100} />
    <T {...AB.w2} {...WORD} text="CROSS" x={365} y={680} />
    <HandCross {...AB.a2} x={740} y={675} size={100} />
    <T {...AB.w3} {...WORD} text="STRIKE" x={330} y={960} />
    <HandStrike {...AB.a3} x={310} y={965} width={460} height={100} variant="double" />
    <T {...AB.w4} {...WORD} text="BRACKET" x={295} y={1240} />
    <HandBracket {...AB.a4} x={800} y={1215} width={80} height={140} side="right" color={P.slate} />
  </>
);

/* ---------- 8. HighlighterSweep ---------- */
const HL = planHand(
  {l: LBL, txt: {at: 36, draw: 20}, hl: {at: 60, draw: 30}},
  {label: "showcase/highlighter", limit: 150},
);
const HL_TEXT = "BUY LOW";
const HL_SIZE = fitFont(HL_TEXT, 200);
const HL_W = textW(HL_TEXT, HL_SIZE);
const HighlighterBody: React.FC = () => (
  <>
    <Label {...HL.l} text="HighlighterSweep" />
    <T {...HL.txt} text={HL_TEXT} x={centerX(HL_W)} y={640} fontSize={HL_SIZE} />
    <HighlighterSweep
      {...HL.hl}
      x={centerX(HL_W)}
      y={670}
      width={HL_W}
      height={140}
      color={P.mustard}
    />
  </>
);

/* ---------- 9. NumberCounter ---------- */
const NC = planHand({l: LBL}, {label: "showcase/number-counter", limit: 170});
const NumberCounterBody: React.FC = () => (
  <>
    <Label {...NC.l} text="NumberCounter" />
    <Num
      value={1250}
      format="currency"
      currency="USD"
      decimals={0}
      x={0}
      y={430}
      width={1080}
      textAlign="center"
      fontSize={200}
      color={P.sageDark}
      delay={20}
      duration={45}
    />
    <Num
      value={257}
      format="percentage"
      decimals={0}
      x={0}
      y={740}
      width={1080}
      textAlign="center"
      fontSize={200}
      color={P.terracotta}
      delay={50}
      duration={45}
    />
    <Num
      value={1200000}
      format="compact"
      decimals={1}
      x={0}
      y={1050}
      width={1080}
      textAlign="center"
      fontSize={200}
      color={P.slate}
      delay={80}
      duration={45}
      pop
    />
  </>
);

/* ---------- 10. HandBarChart ---------- */
const BC = planHand(
  {l: LBL, chart: {at: 40, draw: 70}},
  {label: "showcase/bar-chart", limit: 150},
);
const HandBarChartBody: React.FC = () => (
  <>
    <Label {...BC.l} text="HandBarChart" />
    <HandBarChart
      {...BC.chart}
      x={90}
      y={420}
      width={900}
      height={900}
      fontFamily={EDITORIAL_FONTS.head}
      data={[
        {label: "Q1", value: 4, color: P.sage},
        {label: "Q2", value: 6, color: P.mustard},
        {label: "Q3", value: 9, color: P.terracotta},
        {label: "Q4", value: 13, color: P.sageDark},
      ]}
    />
  </>
);

/* ---------- 11. HandLineChart ---------- */
const LC = planHand(
  {l: LBL, chart: {at: 40, draw: 70}},
  {label: "showcase/line-chart", limit: 150},
);
const HandLineChartBody: React.FC = () => (
  <>
    <Label {...LC.l} text="HandLineChart" />
    <HandLineChart
      {...LC.chart}
      x={90}
      y={420}
      width={900}
      height={900}
      fontFamily={EDITORIAL_FONTS.head}
      labels={["Q1", "Q2", "Q3", "Q4"]}
      series={[
        {data: [3, 5, 4, 9], color: P.sageDark, label: "Saved"},
        {data: [2, 3, 6, 5], color: P.terracotta, label: "Spent"},
      ]}
    />
  </>
);

/* ---------- 12. CandlestickChart ---------- */
const CANDLES: CandlestickDatum[] = (() => {
  const out: CandlestickDatum[] = [];
  let price = 100;
  for (let i = 0; i < 14; i++) {
    const open = price;
    const close = open + Math.sin(i * 1.7) * 6 + (i % 3 === 0 ? -4 : 5);
    out.push({
      open,
      close,
      high: Math.max(open, close) + 3 + (i % 4),
      low: Math.min(open, close) - 3 - (i % 3),
      label: `D${i + 1}`,
    });
    price = close;
  }
  return out;
})();
const CS = planHand({l: LBL}, {label: "showcase/candlestick", limit: 170});
const CandlestickBody: React.FC = () => (
  <>
    <Label {...CS.l} text="CandlestickChart" />
    <CandlestickChart
      data={CANDLES}
      x={90}
      y={420}
      width={900}
      height={900}
      delay={36}
      duration={90}
      upColor={P.sageDark}
      downColor={P.crimson}
      backgroundColor={P.paperCard}
      gridColor={P.border}
      axisColor={P.mutedInk}
      fontFamily={EDITORIAL_FONTS.body}
    />
  </>
);

/* ---------- 13. MoneyFlow ---------- */
const MF = planHand({l: LBL}, {label: "showcase/money-flow", limit: 190});
const MoneyFlowBody: React.FC = () => (
  <>
    <Label {...MF.l} text="MoneyFlow" />
    <MoneyFlow
      x={90}
      y={400}
      width={900}
      height={1000}
      delay={36}
      duration={110}
      currency="USD"
      fontFamily={EDITORIAL_FONTS.head}
      fontSize={36}
      backgroundColor={P.paperCard}
      nodes={[
        {id: "income", label: "INCOME", x: 360, y: 60, color: P.ink, backgroundColor: P.mustard},
        {id: "save", label: "SAVE", x: 90, y: 440, color: P.ink, backgroundColor: P.sage},
        {id: "spend", label: "SPEND", x: 630, y: 440, color: P.ink, backgroundColor: P.terracotta},
        {id: "invest", label: "INVEST", x: 90, y: 840, color: P.ink, backgroundColor: P.slate},
      ]}
      connections={[
        {from: "income", to: "save", amount: 500, color: P.sageDark, curvature: 40},
        {from: "income", to: "spend", amount: 1500, color: P.terracotta, curvature: -40},
        {from: "save", to: "invest", amount: 500, color: P.slate},
      ]}
    />
  </>
);

/* ---------- 14. ComparisonTable ---------- */
const TBL = {
  width: 900,
  leftTitle: "BAD",
  rightTitle: "GOOD",
  leftBadge: "cross" as const,
  rightBadge: "check" as const,
  headerFontSize: 80,
  cellFontSize: 80,
  fontFamily: EDITORIAL_FONTS.head,
  rows: [
    {left: "RISK", right: "SAFE"},
    {left: "DEBT", right: "CASH"},
    {left: "LOSS", right: "GAIN"},
  ],
};
const TBL_TOTAL = comparisonTableDuration({...TBL, enter: 4, exit: 4});
const TB = planHand(
  {l: LBL, table: {at: 40, draw: TBL_TOTAL - 8}},
  {label: "showcase/comparison-table", limit: 40 + TBL_TOTAL + 24},
);
const ComparisonTableBody: React.FC = () => (
  <>
    <Label {...TB.l} text="ComparisonTable" />
    <ComparisonTable
      {...TBL}
      x={90}
      y={440}
      delay={TB.table.delay}
      enter={TB.table.handEnter}
      exit={TB.table.handExit}
      travel={10}
      hand={TB.table.hand}
    />
  </>
);

/* ---------- 15. CompanyBuilding ---------- */
const CB = planHand({l: LBL}, {label: "showcase/company-building", limit: 170});
const CompanyBuildingBody: React.FC = () => (
  <>
    <Label {...CB.l} text="CompanyBuilding" />
    <CompanyBuilding
      x={90}
      y={420}
      width={900}
      height={900}
      delay={30}
      duration={120}
      title="BUILD"
      accentColor={P.sageDark}
      backgroundColor={P.paperCard}
      textColor={P.ink}
      fontFamily={EDITORIAL_FONTS.head}
      phases={[
        {label: "BASE", progress: 1, color: P.slate},
        {label: "GROW", progress: 0.7, color: P.mustard},
        {label: "SCALE", progress: 0.4, color: P.terracotta},
      ]}
    />
  </>
);

/* ---------- 16. SpeechBubble / ThoughtBubble ---------- */
const BB = planHand(
  {l: LBL, speech: {at: 40, draw: 50}, thought: {at: 100, draw: 50}},
  {label: "showcase/bubbles", limit: 190},
);
const bubbleText: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: EDITORIAL_FONTS.head,
  fontWeight: 800,
  fontSize: 140,
  color: P.ink,
};
const BubblesBody: React.FC = () => (
  <>
    <Label {...BB.l} text="SpeechBubble" />
    <SpeechBubble {...BB.speech} x={90} y={420} width={900} height={330} fill={P.paperCard}>
      <div style={bubbleText}>HODL?</div>
    </SpeechBubble>
    <ThoughtBubble {...BB.thought} x={90} y={980} width={900} height={330} tailSide="top" fill={P.paperCard}>
      <div style={bubbleText}>SELL?</div>
    </ThoughtBubble>
  </>
);

/* ---------- 17. Person ---------- */
const PERSON_W = 280;
const PERSON_H = Math.round((PERSON_W * 620) / 360);
const personX = (i: number) => 60 + (i % 3) * (PERSON_W + 30);
const personY = (i: number) => 380 + Math.floor(i / 3) * (PERSON_H + 20);
const PS = planHand(
  {
    l: LBL,
    p0: {at: 40, draw: 20},
    p1: {at: 69, draw: 20},
    p2: {at: 98, draw: 20},
    p3: {at: 127, draw: 20},
    p4: {at: 156, draw: 20},
    p5: {at: 185, draw: 20},
  },
  {label: "showcase/person", limit: 230},
);
const PersonBody: React.FC = () => (
  <>
    <Label {...PS.l} text="Person" />
    <Draw {...PS.p0} x={personX(0)} y={personY(0)} width={PERSON_W} height={PERSON_H} bands={2}>
      <Person width={PERSON_W} pose="stand" shirt="green" outfit="hoodie" hair="short" />
    </Draw>
    <Draw {...PS.p1} x={personX(1)} y={personY(1)} width={PERSON_W} height={PERSON_H} bands={2}>
      <Person width={PERSON_W} pose="happy" shirt="mustard" outfit="sweater" hair="ponytail" />
    </Draw>
    <Draw {...PS.p2} x={personX(2)} y={personY(2)} width={PERSON_W} height={PERSON_H} bands={2}>
      <Person width={PERSON_W} pose="worried" shirt="red" outfit="suit" hair="side" />
    </Draw>
    <Draw {...PS.p3} x={personX(3)} y={personY(3)} width={PERSON_W} height={PERSON_H} bands={2}>
      <Person width={PERSON_W} pose="shrug" shirt="slate" outfit="hoodie" hair="bald" />
    </Draw>
    <Draw {...PS.p4} x={personX(4)} y={personY(4)} width={PERSON_W} height={PERSON_H} bands={2}>
      <Person width={PERSON_W} pose="point" shirt="terracotta" outfit="sweater" hair="short" flip />
    </Draw>
    <Draw {...PS.p5} x={personX(5)} y={personY(5)} width={PERSON_W} height={PERSON_H} bands={2}>
      <Person width={PERSON_W} pose="holding" shirt="navy" outfit="suit" hair="ponytail" />
    </Draw>
  </>
);

/* ---------- 18-19. FinanceCharts ---------- */
const FA = planHand(
  {l: LBL, donut: {at: 40, draw: 40}, bar: {at: 90, draw: 30}},
  {label: "showcase/finance-a", limit: 200},
);
const after = (s: PlannedSlot) => s.delay + s.handEnter + s.duration;
const FinanceAChartsBody: React.FC = () => (
  <>
    <Label {...FA.l} text="FinanceCharts" />
    <Draw {...FA.donut} x={280} y={380} width={520} height={520} bands={4}>
      <DonutChart
        size={520}
        from={after(FA.donut)}
        data={[
          {value: 50, color: P.sage},
          {value: 30, color: P.mustard},
          {value: 20, color: P.terracotta},
        ]}
      />
    </Draw>
    <Draw {...FA.bar} x={140} y={1040} width={800} height={100} bands={3}>
      <ProgressBar progress={0.65} width={800} height={100} ticks={4} from={after(FA.bar)} />
    </Draw>
  </>
);

const FB = planHand(
  {l: LBL, gauge: {at: 40, draw: 40}, grow: {at: 90, draw: 40}},
  {label: "showcase/finance-b", limit: 200},
);
const FinanceBChartsBody: React.FC = () => (
  <>
    <Label {...FB.l} text="FinanceCharts" />
    <Draw {...FB.gauge} x={190} y={380} width={700} height={455} bands={4}>
      <Gauge value={740} size={700} from={after(FB.gauge)} />
    </Draw>
    <Draw {...FB.grow} x={90} y={900} width={900} height={560} bands={4}>
      <CompoundGrowth width={900} height={560} monthly={300} rate={7} years={20} from={after(FB.grow)} />
    </Draw>
  </>
);

/* ---------- 20-23. Prop galleries ---------- */
const GRID_SLOTS = {
  l: LBL,
  g0: {at: 40, draw: 16},
  g1: {at: 65, draw: 16},
  g2: {at: 90, draw: 16},
  g3: {at: 115, draw: 16},
  g4: {at: 140, draw: 16},
  g5: {at: 165, draw: 16},
} as const;

const Cell: React.FC<{slot: PlannedSlot; i: number; children: React.ReactNode}> = ({slot, i, children}) => (
  <Draw {...slot} x={cellX(i)} y={cellY(i)} width={CELL} height={CELL} bands={2}>
    {children}
  </Draw>
);

const MA = planHand(GRID_SLOTS, {label: "showcase/money-props-a", limit: 200});
const MoneyPropsABody: React.FC = () => (
  <>
    <Label {...MA.l} text="MoneyProps" />
    <Cell slot={MA.g0} i={0}><Illus.Coin size={CELL} /></Cell>
    <Cell slot={MA.g1} i={1}><Illus.CoinStack size={CELL} /></Cell>
    <Cell slot={MA.g2} i={2}><Illus.PiggyBank size={CELL} /></Cell>
    <Cell slot={MA.g3} i={3}><Illus.Wallet size={CELL} /></Cell>
    <Cell slot={MA.g4} i={4}><Illus.CreditCard size={CELL} /></Cell>
    <Cell slot={MA.g5} i={5}><Illus.House size={CELL} /></Cell>
  </>
);

const MBS = planHand(GRID_SLOTS, {label: "showcase/money-props-b", limit: 200});
const MoneyPropsBBody: React.FC = () => (
  <>
    <Label {...MBS.l} text="MoneyProps" />
    <Cell slot={MBS.g0} i={0}><Illus.Car size={CELL} /></Cell>
    <Cell slot={MBS.g1} i={1}><Illus.Receipt size={CELL} /></Cell>
    <Cell slot={MBS.g2} i={2}><Illus.Calendar size={CELL} /></Cell>
    <Cell slot={MBS.g3} i={3}><Illus.Safe size={CELL} /></Cell>
    <Cell slot={MBS.g4} i={4}><Illus.BallChain size={CELL} /></Cell>
    <Cell slot={MBS.g5} i={5}><Illus.Badge size={CELL} kind="dollar" /></Cell>
  </>
);

const DA = planHand(GRID_SLOTS, {label: "showcase/drawn-props-a", limit: 200});
const DrawnPropsABody: React.FC = () => (
  <>
    <Label {...DA.l} text="DrawnProps" />
    <Cell slot={DA.g0} i={0}><Illus.SplitCard parts={3} width={CELL - 60} /></Cell>
    <Cell slot={DA.g1} i={1}><Illus.QMark width={CELL - 60} /></Cell>
    <Cell slot={DA.g2} i={2}><Illus.MemoryCard size={CELL} /></Cell>
    <Cell slot={DA.g3} i={3}><Illus.Chip size={CELL} /></Cell>
    <Cell slot={DA.g4} i={4}><Illus.Jet size={CELL} /></Cell>
    <Cell slot={DA.g5} i={5}><Illus.CornCan size={CELL} /></Cell>
  </>
);

const DBS = planHand(
  {
    l: LBL,
    g0: {at: 40, draw: 16},
    g1: {at: 65, draw: 16},
    g2: {at: 90, draw: 16},
    g3: {at: 115, draw: 16},
    g4: {at: 140, draw: 16},
  },
  {label: "showcase/drawn-props-b", limit: 190},
);
const DrawnPropsBBody: React.FC = () => (
  <>
    <Label {...DBS.l} text="DrawnProps" />
    <Cell slot={DBS.g0} i={0}><Illus.Building size={CELL} tags={2} /></Cell>
    <Cell slot={DBS.g1} i={1}><Illus.Bill value={10} width={CELL} /></Cell>
    <Cell slot={DBS.g2} i={2}><Illus.Magnifier size={CELL} /></Cell>
    <Cell slot={DBS.g3} i={3}><Illus.Equals size={CELL} /></Cell>
    <Cell slot={DBS.g4} i={4}><Illus.Stamp text="SOLD" width={CELL} height={200} fontSize={90} /></Cell>
  </>
);

/* ---------- 24. RoundedFrame + LowerThird + HighlighterSweep (evidence) ---------- */
const RF = planHand(
  {l: LBL, frame: {at: 40, draw: 50}, hl: {at: 96, draw: 30}},
  {label: "showcase/rounded-frame", limit: 160},
);
const DocLines: React.FC = () => (
  <svg
    width={900}
    height={700}
    style={{position: "absolute", left: 90, top: 420}}
    viewBox="0 0 900 700"
  >
    {[150, 250, 350, 450, 550].map((y, i) => (
      <rect key={y} x={60} y={y} width={i % 2 === 0 ? 780 : 620} height={30} rx={15} fill={P.mutedInk} opacity={0.35} />
    ))}
  </svg>
);
const RoundedFrameBody: React.FC = () => (
  <>
    <Label {...RF.l} text="RoundedFrame" />
    <DocLines />
    <RoundedFrame {...RF.frame} x={90} y={420} width={900} height={700} color={P.terracotta} fill="rgba(255,253,247,0.55)" />
    <HighlighterSweep {...RF.hl} x={150} y={656} width={780} height={90} color={P.mustard} />
    <LowerThird text="SiTime · SEC filing" x={90} y={1200} delay={130} />
  </>
);

/* ---------- 25. EraserWipe ---------- */
const EW = planHand(
  {l: LBL, erase: {at: 60, draw: 50}},
  {label: "showcase/eraser-wipe", limit: 170},
);
const EraserWipeBody: React.FC = () => (
  <>
    <Label {...EW.l} text="EraserWipe" />
    <EraserWipe {...EW.erase} x={90} y={560} width={900} height={400}>
      <div
        style={{
          width: 900,
          height: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: EDITORIAL_FONTS.head,
          fontWeight: 800,
          fontSize: 300,
          color: P.crimson,
        }}
      >
        OOPS
      </div>
    </EraserWipe>
  </>
);

/* ---------- 26. Captions ---------- */
const CAPTION_WORDS = ["A", "SPLIT", "CHANGES", "NOTHING", "ABOUT", "WORTH", "JUST", "THE", "PRICE", "TAG"];
const SHOWCASE_CAPTIONS: Caption[] = CAPTION_WORDS.map((word, i) => ({
  text: i === 0 ? word : ` ${word}`,
  startMs: i * 450,
  endMs: (i + 1) * 450,
  timestampMs: i * 450 + 225,
  confidence: 1,
}));
const CP = planHand({l: LBL}, {label: "showcase/captions", limit: 150});
const CaptionsBody: React.FC = () => (
  <>
    <Label {...CP.l} text="Captions" />
    <Captions captions={SHOWCASE_CAPTIONS} />
  </>
);

/* ---------- 27. Transitions ---------- */
const TR = planHand({l: LBL}, {label: "showcase/transitions", limit: 130});
const Board: React.FC<{bg: string; word: string}> = ({bg, word}) => (
  <AbsoluteFill
    style={{
      backgroundColor: bg,
      alignItems: "center",
      justifyContent: "center",
      fontFamily: EDITORIAL_FONTS.head,
      fontWeight: 800,
      fontSize: 220,
      color: P.ink,
    }}
  >
    {word}
  </AbsoluteFill>
);
const TransitionsBody: React.FC = () => (
  <>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={60}>
        <Board bg="#E4EEDF" word="WIPE" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={whiteboardWipe()} timing={linearTiming({durationInFrames: 25})} />
      <TransitionSeries.Sequence durationInFrames={60}>
        <Board bg="#F6DFD5" word="SLIDE" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={whiteboardSlide()} timing={linearTiming({durationInFrames: 25})} />
      <TransitionSeries.Sequence durationInFrames={60}>
        <Board bg="#DCE6EF" word="HAND" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={handWipe()} timing={linearTiming({durationInFrames: 25})} />
      <TransitionSeries.Sequence durationInFrames={60}>
        <Board bg={P.paper} word="DONE" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Label {...TR.l} text="Transitions" />
  </>
);
/** 4 sequences × 60f − 3 transitions × 25f. */
const TRANSITIONS_DURATION = 4 * 60 - 3 * 25;

/* ---------- 28. WhiteboardCamera ---------- */
const WC = planHand({l: LBL}, {label: "showcase/camera", limit: 170});
const CameraBody: React.FC = () => (
  <WhiteboardCamera
    backgroundColor={P.paper}
    keyframes={[
      {frame: 0, x: 540, y: 960, zoom: 1},
      {frame: 50, x: 270, y: 570, zoom: 2.2, glide: 30},
      {frame: 90, x: 810, y: 970, zoom: 2.2},
      {frame: 125, x: 270, y: 1310, zoom: 2.2},
      {frame: 150, x: 540, y: 960, zoom: 1},
    ]}
  >
    <Label {...WC.l} text="WhiteboardCamera" />
    <div style={{position: "absolute", left: 120, top: 420}}>
      <Illus.Coin size={300} />
    </div>
    <div style={{position: "absolute", left: 660, top: 820}}>
      <Illus.Safe size={300} />
    </div>
    <div style={{position: "absolute", left: 120, top: 1160}}>
      <Illus.Calendar size={300} />
    </div>
  </WhiteboardCamera>
);

/* ---------- 29. Whiteboard (declarative items, one hand) ---------- */
const WB_ITEMS: WhiteboardItem[] = [
  {type: "text", text: "SAVE 20%", x: 120, y: 520, fontSize: 150, color: P.ink},
  {type: "underline", x: 120, y: 700, width: 840, double: true, color: P.terracotta},
  {type: "arrow", from: {x: 200, y: 1050}, to: {x: 520, y: 790}, color: P.slate},
  {type: "check", x: 540, y: 1060, size: 160, color: P.sageDark},
];
const WB_TOTAL = whiteboardDuration(WB_ITEMS, {enter: 4, travel: 10, exit: 4});
const WBP = planHand(
  {l: LBL, board: {at: 40, draw: WB_TOTAL - 8}},
  {label: "showcase/whiteboard", limit: 40 + WB_TOTAL + 24},
);
const WhiteboardBody: React.FC = () => (
  <>
    <Label {...WBP.l} text="Whiteboard" />
    <Whiteboard
      items={WB_ITEMS}
      delay={WBP.board.delay}
      enter={WBP.board.handEnter}
      exit={WBP.board.handExit}
      travel={10}
      hand={WBP.board.hand}
    />
  </>
);

/* ---------- 30. EditorialCard / YearBadge / CharacterSprite ---------- */
const EC = planHand({l: LBL}, {label: "showcase/editorial-card", limit: 150});
const EditorialCardBody: React.FC = () => (
  <>
    <Label {...EC.l} text="EditorialCard" />
    <EditorialCard x={90} y={420} width={900} height={900} delay={30}>
      <div style={{position: "absolute", left: 40, top: 40}}>
        <YearBadge label="2026" backgroundColor={P.terracotta} />
      </div>
      <CharacterSprite
        src={staticFile(ASSETS.man.file)}
        x={258}
        y={150}
        height={640}
        aspectRatio={ASSETS.man.width / ASSETS.man.height}
        delay={50}
      />
    </EditorialCard>
  </>
);

/* ---------- registry (grouped by category; order = reel order) ---------- */
export const SECTIONS: Section[] = [
  // core
  {id: "marker-text", title: "MarkerText", category: "core", duration: 120, Body: MarkerTextBody},
  {id: "marker-list", title: "MarkerList", category: "core", duration: 170, Body: MarkerListBody},
  {id: "marker-paragraph", title: "MarkerParagraph", category: "core", duration: 170, Body: MarkerParagraphBody},
  {id: "draw-on", title: "DrawOn", category: "core", duration: 140, Body: DrawOnBody},
  // annotations
  {id: "annotations-a", title: "Annotations 1/2", category: "annotations", duration: 190, Body: AnnotationsABody},
  {id: "annotations-b", title: "Annotations 2/2", category: "annotations", duration: 190, Body: AnnotationsBBody},
  {id: "highlighter-sweep", title: "HighlighterSweep", category: "annotations", duration: 150, Body: HighlighterBody},
  {id: "rounded-frame", title: "RoundedFrame / LowerThird", category: "annotations", duration: 160, Body: RoundedFrameBody},
  {id: "eraser-wipe", title: "EraserWipe", category: "annotations", duration: 170, Body: EraserWipeBody},
  // data
  {id: "number-counter", title: "NumberCounter", category: "data", duration: 170, Body: NumberCounterBody},
  {id: "hand-bar-chart", title: "HandBarChart", category: "data", duration: 150, Body: HandBarChartBody},
  {id: "hand-line-chart", title: "HandLineChart", category: "data", duration: 150, Body: HandLineChartBody},
  {id: "candlestick-chart", title: "CandlestickChart", category: "data", duration: 170, Body: CandlestickBody},
  {id: "money-flow", title: "MoneyFlow", category: "data", duration: 190, Body: MoneyFlowBody},
  {id: "comparison-table", title: "ComparisonTable", category: "data", duration: 40 + TBL_TOTAL + 24, Body: ComparisonTableBody},
  {id: "company-building", title: "CompanyBuilding", category: "data", duration: 170, Body: CompanyBuildingBody},
  {id: "finance-charts-a", title: "FinanceCharts 1/2", category: "data", duration: 200, Body: FinanceAChartsBody},
  {id: "finance-charts-b", title: "FinanceCharts 2/2", category: "data", duration: 200, Body: FinanceBChartsBody},
  // illustration
  {id: "bubbles", title: "SpeechBubble / ThoughtBubble", category: "illustration", duration: 190, Body: BubblesBody},
  {id: "person", title: "Person", category: "illustration", duration: 230, Body: PersonBody},
  {id: "money-props-a", title: "MoneyProps 1/2", category: "illustration", duration: 200, Body: MoneyPropsABody},
  {id: "money-props-b", title: "MoneyProps 2/2", category: "illustration", duration: 200, Body: MoneyPropsBBody},
  {id: "drawn-props-a", title: "DrawnProps 1/2", category: "illustration", duration: 200, Body: DrawnPropsABody},
  {id: "drawn-props-b", title: "DrawnProps 2/2", category: "illustration", duration: 190, Body: DrawnPropsBBody},
  // layout
  {id: "pic", title: "Pic", category: "layout", duration: 130, Body: PicBody},
  {id: "captions", title: "Captions", category: "layout", duration: 150, Body: CaptionsBody},
  {id: "editorial-card", title: "EditorialCard", category: "layout", duration: 150, Body: EditorialCardBody},
  // motion
  {id: "transitions", title: "Transitions", category: "motion", duration: TRANSITIONS_DURATION, Body: TransitionsBody},
  {id: "whiteboard-camera", title: "WhiteboardCamera", category: "motion", duration: 170, Body: CameraBody},
  {id: "whiteboard", title: "Whiteboard", category: "motion", duration: 40 + WB_TOTAL + 24, Body: WhiteboardBody},
];
