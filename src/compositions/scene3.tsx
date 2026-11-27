import React from "react";
import {staticFile} from "remotion";
import {Audio} from "@remotion/media";
import {CANVAS_PRESETS, PaperSurface} from "../whiteboard";
import {planHand} from "../whiteboard/handPlan";
import {EDITORIAL_PALETTE as P} from "../whiteboard/components/EditorialCard";
import {Beat, Pic, T} from "../whiteboard/components/SceneKit";

export const SCENE3_WIDTH = CANVAS_PRESETS.youtubeLong.width;
export const SCENE3_HEIGHT = CANVAS_PRESETS.youtubeLong.height;
export const SCENE3_FPS = CANVAS_PRESETS.youtubeLong.fps;
/** ~106.70s. mp3 = 1707163 B @128kbps. Narration ends 105.46s. Set exact mp3 length if different. */
export const SCENE3_DURATION = 3201;

const img = (name: string) => staticFile(`assets/scene3/${name}`);
const IMG = {
  scale: img("Balance_scale_weighing_thumbs-up…_2afcf4a5.jpg"),
  chair: img("Executive_chair_with_suit_jacket_502be98b.jpg"),
  gift: img("Gift_box_revealing_price_tag_98744969.jpg"),
  rocket: img("Gold_coins_and_rocket_arrow_9130cee3.jpg"),
  deal: img("Handshake_over_business_acquisit…_3e20fa97.jpg"),
  mag: img("Magnifying_glass_examining_finan…_bfe3b30d.jpg"),
  peak: img("Red_arrow_sliding_mountain_peak_32b04ed5.jpg"),
  scissors: img("Scissors_splitting_price_tag_ad56a503.jpg"),
  exit: img("Stock_certificates_exiting_door_cdbb58d6.jpg"),
  split: img("Stock_split_illustration_bf153656.jpg"),
  chip: img("Timing_chip_with_server_rack_0069daf7.jpg"),
  timeline: img("Vertical_timeline_calendar_tiles…_c423e09d.jpg"),
} as const;

/* Hand plans. `at` = beat-local frame the pen touches paper = (word start s × 30) − beat start. */
const A = planHand(
  {num: {at: 30, draw: 14}, name: {at: 44, draw: 20}, tick: {at: 83, draw: 12}, sym: {at: 103, draw: 18}},
  {label: "scene3/A", limit: 149},
);
const B = planHand(
  {ratio: {at: 2, draw: 16}, img: {at: 26, draw: 22}, real: {at: 56, draw: 14}},
  {label: "scene3/B", limit: 79},
);
const C = planHand(
  {
    img: {at: 6, draw: 30},
    cap1: {at: 44, draw: 12},
    d3: {at: 57, draw: 18},
    x2: {at: 114, draw: 20},
    cap2: {at: 193, draw: 18},
    d4: {at: 253, draw: 16},
    cap3: {at: 315, draw: 22},
    d7: {at: 355, draw: 16},
  },
  {label: "scene3/C", limit: 410},
);
const D = planHand(
  {
    l1: {at: 2, draw: 12},
    l2: {at: 27, draw: 16},
    img: {at: 61, draw: 26},
    l3: {at: 104, draw: 14},
    l4: {at: 133, draw: 14},
    l5: {at: 155, draw: 10},
  },
  {label: "scene3/D", limit: 182},
);
const E = planHand(
  {
    head: {at: 11, draw: 22},
    img: {at: 51, draw: 26},
    q3: {at: 82, draw: 14},
    rev: {at: 130, draw: 20},
    up: {at: 206, draw: 18},
    yoy: {at: 255, draw: 14},
  },
  {label: "scene3/E", limit: 294},
);
const F = planHand(
  {
    l1: {at: 11, draw: 18},
    img: {at: 45, draw: 28},
    l2: {at: 90, draw: 14},
    l3: {at: 121, draw: 20},
    l4: {at: 150, draw: 10},
  },
  {label: "scene3/F", limit: 174},
);
const G = planHand(
  {l1: {at: 4, draw: 16}, l2: {at: 32, draw: 14}, l3: {at: 74, draw: 20}},
  {label: "scene3/G", limit: 121},
);
const H = planHand(
  {
    l1: {at: 4, draw: 22},
    l2: {at: 41, draw: 18},
    img: {at: 66, draw: 28},
    l3: {at: 111, draw: 14},
    l4: {at: 175, draw: 18},
  },
  {label: "scene3/H", limit: 201},
);
const I = planHand(
  {date: {at: 7, draw: 14}, px: {at: 72, draw: 20}, cut: {at: 101, draw: 18}, ann: {at: 155, draw: 16}},
  {label: "scene3/I", limit: 182},
);
const J = planHand(
  {l1: {at: 16, draw: 16}, img: {at: 50, draw: 26}, px: {at: 87, draw: 22}, sh: {at: 126, draw: 14}},
  {label: "scene3/J", limit: 168},
);
const K = planHand(
  {
    catch: {at: 9, draw: 14},
    img: {at: 30, draw: 24},
    gaap: {at: 55, draw: 16},
    eps: {at: 112, draw: 20},
    cents: {at: 184, draw: 18},
  },
  {label: "scene3/K", limit: 226},
);
const L = planHand(
  {
    adj: {at: 16, draw: 14},
    px: {at: 58, draw: 18},
    out: {at: 94, draw: 12},
    comp: {at: 112, draw: 16},
    acq: {at: 151, draw: 16},
  },
  {label: "scene3/L", limit: 186},
);
const M = planHand(
  {
    l1: {at: 30, draw: 16},
    img: {at: 49, draw: 28},
    sold: {at: 95, draw: 18},
    bought: {at: 133, draw: 18},
  },
  {label: "scene3/M", limit: 174},
);
const N = planHand(
  {
    img: {at: 7, draw: 18},
    ceo: {at: 26, draw: 14},
    shares: {at: 56, draw: 18},
    sep: {at: 78, draw: 14},
    px: {at: 109, draw: 16},
  },
  {label: "scene3/N", limit: 142},
);
const O = planHand(
  {l1: {at: 14, draw: 18}, l2: {at: 59, draw: 14}},
  {label: "scene3/O", limit: 84},
);
const Q = planHand(
  {
    head: {at: 4, draw: 14},
    img: {at: 24, draw: 28},
    rj: {at: 54, draw: 14},
    buy: {at: 95, draw: 16},
    wf: {at: 124, draw: 14},
    under: {at: 156, draw: 16},
  },
  {label: "scene3/Q", limit: 184},
);
const R = planHand(
  {
    l1: {at: 32, draw: 16},
    l2: {at: 73, draw: 16},
    l3: {at: 116, draw: 18},
    img: {at: 137, draw: 22},
    s1: {at: 165, draw: 16},
    s2: {at: 189, draw: 16},
  },
  {label: "scene3/R", limit: 245},
);

/**
 * Scene 3 — SciTime (SITM) 3-for-1 split. Audio 0.05–105.46s. Beats (abs frames @30fps):
 * A     0–149   #1 SciTime, ticker SITM
 * B   149–228   3-for-1, this one is real
 * C   228–638   Dec 3 record / Dec 4 arrive / Dec 7 new price
 * D   638–820   timing chips for data centers + AI
 * E   820–1114  Q3 revenue $298.7M, +257%
 * F  1114–1288  Renesas deal, ~$86M of it
 * G  1288–1409  without the deal, still 154%
 * H  1409–1610  the twist: nowhere near high (~$900)
 * I  1610–1792  Nov 18 ~$412, cut in half at announcement
 * J  1792–1960  stays there -> ~$137 a share
 * K  1960–2186  the catch: GAAP $4.4M, 14 cents
 * L  2186–2372  adjusted $4.01 leaves out SBC + acquisition costs
 * M  2372–2546  insiders sold 24x, bought none
 * N  2546–2688  CEO sold 12,000 shares in Sept ~$600
 * O  2688–2772  some prearranged, but still
 * Q  2772–2956  analysts divided: Raymond James vs Wells Fargo
 * R  2956–3201  real company, demanding price; split = packaging
 */
export const Scene3: React.FC = () => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    <Audio src={staticFile("narration/scene3/scene3.mp3")} />

    <Beat from={0} to={149}>
      <T {...A.num} text="#1" x={150} y={170} fontSize={360} color={P.terracotta} />
      <T {...A.name} text="SCITIME" x={700} y={200} fontSize={190} />
      <T {...A.tick} text="TICKER" x={700} y={450} fontSize={60} color={P.mutedInk} />
      <T {...A.sym} text="SITM" x={700} y={540} fontSize={200} color={P.crimson} />
    </Beat>

    <Beat from={149} to={228}>
      <T {...B.ratio} text="3-FOR-1" x={110} y={250} fontSize={200} color={P.terracotta} />
      <Pic {...B.img} src={IMG.split} x={1060} y={170} size={760} rotate={2} />
      <T {...B.real} text="THIS ONE'S REAL." x={110} y={520} fontSize={90} color={P.sageDark} />
    </Beat>

    <Beat from={228} to={638}>
      <Pic {...C.img} src={IMG.timeline} x={100} y={90} size={900} />
      <T {...C.cap1} text="ON THE BOOKS" x={900} y={95} fontSize={46} color={P.mutedInk} />
      <T {...C.d3} text="THU DEC 3" x={900} y={150} fontSize={100} />
      <T {...C.x2} text="+2 SHARES PER 1" x={900} y={265} fontSize={60} color={P.terracotta} />
      <T {...C.cap2} text="NEW SHARES ARRIVE" x={900} y={370} fontSize={46} color={P.mutedInk} />
      <T {...C.d4} text="FRI DEC 4" x={900} y={425} fontSize={100} />
      <T {...C.cap3} text="TRADES AT NEW PRICE" x={900} y={585} fontSize={46} color={P.mutedInk} />
      <T {...C.d7} text="MON DEC 7" x={900} y={640} fontSize={100} color={P.sageDark} />
    </Beat>

    <Beat from={638} to={820}>
      <T {...D.l1} text="SCITIME" x={110} y={110} fontSize={140} />
      <T {...D.l2} text="TIMING CHIPS" x={110} y={270} fontSize={110} color={P.terracotta} />
      <Pic {...D.img} src={IMG.chip} x={1130} y={170} size={700} rotate={2} />
      <T {...D.l3} text="DATA CENTERS" x={110} y={470} fontSize={80} color={P.slate} />
      <T {...D.l4} text="+ AI HARDWARE" x={110} y={580} fontSize={80} color={P.slate} />
      <T {...D.l5} text="IN SYNC" x={110} y={720} fontSize={120} color={P.sageDark} />
    </Beat>

    <Beat from={820} to={1114}>
      <T {...E.head} text="THE NUMBERS ARE WILD" x={880} y={100} fontSize={70} />
      <Pic {...E.img} src={IMG.rocket} x={110} y={190} size={700} rotate={-2} />
      <T {...E.q3} text="Q3 REVENUE" x={880} y={260} fontSize={64} color={P.mutedInk} />
      <T {...E.rev} text="$298.7M" x={880} y={340} fontSize={200} color={P.terracotta} />
      <T {...E.up} text="+257%" x={880} y={580} fontSize={200} color={P.sageDark} />
      <T {...E.yoy} text="VS A YEAR AGO" x={880} y={830} fontSize={60} color={P.slate} />
    </Beat>

    <Beat from={1114} to={1288}>
      <T {...F.l1} text="A CHUNK CAME FROM" x={880} y={150} fontSize={60} color={P.mutedInk} />
      <Pic {...F.img} src={IMG.deal} x={110} y={170} size={700} rotate={-2} />
      <T {...F.l2} text="RENESAS" x={880} y={300} fontSize={150} />
      <T {...F.l3} text="~$86M" x={880} y={500} fontSize={230} color={P.terracotta} />
      <T {...F.l4} text="OF THE GROWTH" x={880} y={800} fontSize={60} color={P.slate} />
    </Beat>

    <Beat from={1288} to={1409}>
      <T {...G.l1} text="WITHOUT THE DEAL" x={330} y={120} fontSize={100} />
      <T {...G.l2} text="GROWTH WAS STILL" x={330} y={290} fontSize={80} color={P.slate} />
      <T {...G.l3} text="154%" x={330} y={430} fontSize={260} color={P.sageDark} />
    </Beat>

    <Beat from={1409} to={1610}>
      <T {...H.l1} text="HERE'S THE TWIST" x={110} y={90} fontSize={110} color={P.crimson} />
      <T {...H.l2} text="NOWHERE NEAR ITS HIGH" x={110} y={250} fontSize={60} color={P.slate} />
      <Pic {...H.img} src={IMG.peak} x={1130} y={180} size={700} rotate={2} />
      <T {...H.l3} text="OVER THE PAST YEAR" x={110} y={460} fontSize={56} color={P.mutedInk} />
      <T {...H.l4} text="~$900" x={110} y={550} fontSize={230} color={P.terracotta} />
    </Beat>

    <Beat from={1610} to={1792}>
      <T {...I.date} text="NOV 18" x={330} y={120} fontSize={110} color={P.slate} />
      <T {...I.px} text="~$412" x={330} y={270} fontSize={250} color={P.crimson} />
      <T {...I.cut} text="CUT ROUGHLY IN HALF" x={330} y={580} fontSize={90} />
      <T {...I.ann} text="AS THE SPLIT WAS ANNOUNCED" x={330} y={760} fontSize={52} color={P.mutedInk} />
    </Beat>

    <Beat from={1792} to={1960}>
      <T {...J.l1} text="IF IT STAYS THERE" x={880} y={150} fontSize={64} color={P.mutedInk} />
      <Pic {...J.img} src={IMG.scissors} x={110} y={170} size={700} rotate={-2} />
      <T {...J.px} text="~$137" x={880} y={300} fontSize={240} color={P.terracotta} />
      <T {...J.sh} text="A SHARE" x={880} y={580} fontSize={100} color={P.slate} />
    </Beat>

    <Beat from={1960} to={2186}>
      <T {...K.catch} text="THE CATCH" x={880} y={100} fontSize={120} color={P.crimson} />
      <Pic {...K.img} src={IMG.mag} x={110} y={170} size={700} rotate={-2} />
      <T {...K.gaap} text="STANDARD ACCOUNTING" x={880} y={270} fontSize={56} color={P.slate} />
      <T {...K.eps} text="$4.4M" x={880} y={380} fontSize={230} color={P.terracotta} />
      <T {...K.cents} text="14 CENTS A SHARE" x={880} y={680} fontSize={76} />
    </Beat>

    <Beat from={2186} to={2372}>
      <T {...L.adj} text="ADJUSTED" x={330} y={90} fontSize={100} color={P.slate} />
      <T {...L.px} text="$4.01" x={330} y={220} fontSize={240} color={P.sageDark} />
      <T {...L.out} text="LEAVES OUT:" x={330} y={520} fontSize={56} color={P.mutedInk} />
      <T {...L.comp} text="STOCK COMPENSATION" x={330} y={610} fontSize={80} color={P.crimson} />
      <T {...L.acq} text="ACQUISITION COSTS" x={330} y={730} fontSize={80} color={P.crimson} />
    </Beat>

    <Beat from={2372} to={2546}>
      <T {...M.l1} text="LAST 6 MONTHS" x={880} y={140} fontSize={64} color={P.mutedInk} />
      <Pic {...M.img} src={IMG.exit} x={110} y={170} size={700} rotate={-2} />
      <T {...M.sold} text="SOLD 24 TIMES" x={880} y={300} fontSize={100} color={P.crimson} />
      <T {...M.bought} text="BOUGHT: 0" x={880} y={520} fontSize={150} color={P.sageDark} />
    </Beat>

    <Beat from={2546} to={2688}>
      <Pic {...N.img} src={IMG.chair} x={1130} y={140} size={720} rotate={2} />
      <T {...N.ceo} text="CEO SOLD" x={110} y={130} fontSize={120} color={P.crimson} />
      <T {...N.shares} text="12,000 SHARES" x={110} y={290} fontSize={110} />
      <T {...N.sep} text="SEPTEMBER" x={110} y={470} fontSize={80} color={P.slate} />
      <T {...N.px} text="~$600" x={110} y={580} fontSize={230} color={P.terracotta} />
    </Beat>

    <Beat from={2688} to={2772}>
      <T {...O.l1} text="SOME WERE PREARRANGED" x={330} y={280} fontSize={76} color={P.slate} />
      <T {...O.l2} text="BUT STILL..." x={330} y={470} fontSize={140} color={P.crimson} />
    </Beat>

    <Beat from={2772} to={2956}>
      <T {...Q.head} text="ANALYSTS ARE DIVIDED" x={440} y={40} fontSize={80} />
      <Pic {...Q.img} src={IMG.scale} x={610} y={190} size={700} />
      <T {...Q.rj} text="RAYMOND JAMES" x={40} y={300} fontSize={52} color={P.mutedInk} />
      <T {...Q.buy} text="STRONG BUY" x={40} y={380} fontSize={84} color={P.sageDark} />
      <T {...Q.wf} text="WELLS FARGO" x={1330} y={300} fontSize={52} color={P.mutedInk} />
      <T {...Q.under} text="UNDERWEIGHT" x={1330} y={380} fontSize={72} color={P.crimson} />
    </Beat>

    <Beat from={2956} to={3201} last>
      <T {...R.l1} text="REAL COMPANY" x={110} y={110} fontSize={100} />
      <T {...R.l2} text="REAL GROWTH" x={110} y={250} fontSize={100} color={P.sageDark} />
      <T {...R.l3} text="DEMANDING PRICE" x={110} y={390} fontSize={100} color={P.crimson} />
      <Pic {...R.img} src={IMG.gift} x={1130} y={150} size={700} rotate={2} />
      <T {...R.s1} text="THE SPLIT IS JUST" x={110} y={620} fontSize={90} color={P.slate} />
      <T {...R.s2} text="THE PACKAGING." x={110} y={740} fontSize={90} color={P.terracotta} />
    </Beat>
  </PaperSurface>
);
