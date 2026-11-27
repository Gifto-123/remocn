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
  {title: {at: 30, draw: 24}, sym: {at: 103, draw: 18}},
  {label: "scene3/A", limit: 149},
);
const B = planHand(
  {ratio: {at: 2, draw: 16}, img: {at: 26, draw: 22}, real: {at: 56, draw: 14}},
  {label: "scene3/B", limit: 79},
);
const C = planHand(
  {
    img: {at: 6, draw: 30},
    d3: {at: 57, draw: 18},
    d4: {at: 253, draw: 16},
    d7: {at: 355, draw: 16},
  },
  {label: "scene3/C", limit: 410},
);
const D = planHand(
  {name: {at: 27, draw: 16}, img: {at: 61, draw: 26}, use: {at: 104, draw: 18}},
  {label: "scene3/D", limit: 182},
);
const E = planHand(
  {img: {at: 51, draw: 26}, rev: {at: 130, draw: 20}, up: {at: 206, draw: 18}},
  {label: "scene3/E", limit: 294},
);
const F = planHand(
  {img: {at: 45, draw: 28}, name: {at: 90, draw: 14}, amt: {at: 121, draw: 20}},
  {label: "scene3/F", limit: 174},
);
const G = planHand(
  {l1: {at: 4, draw: 16}, pct: {at: 74, draw: 20}},
  {label: "scene3/G", limit: 121},
);
const H = planHand(
  {twist: {at: 4, draw: 22}, img: {at: 66, draw: 28}, high: {at: 175, draw: 18}},
  {label: "scene3/H", limit: 201},
);
const I = planHand(
  {date: {at: 7, draw: 14}, px: {at: 72, draw: 20}},
  {label: "scene3/I", limit: 182},
);
const J = planHand(
  {img: {at: 50, draw: 26}, px: {at: 87, draw: 22}, sh: {at: 126, draw: 14}},
  {label: "scene3/J", limit: 168},
);
const K = planHand(
  {hook: {at: 9, draw: 14}, img: {at: 30, draw: 24}, eps: {at: 112, draw: 20}},
  {label: "scene3/K", limit: 226},
);
const L = planHand(
  {adj: {at: 16, draw: 40}, out: {at: 94, draw: 18}},
  {label: "scene3/L", limit: 186},
);
const M = planHand(
  {img: {at: 49, draw: 28}, sold: {at: 95, draw: 18}, bought: {at: 133, draw: 18}},
  {label: "scene3/M", limit: 174},
);
const N = planHand(
  {img: {at: 7, draw: 18}, shares: {at: 56, draw: 18}, px: {at: 109, draw: 16}},
  {label: "scene3/N", limit: 142},
);
const O = planHand(
  {l1: {at: 14, draw: 18}, l2: {at: 59, draw: 14}},
  {label: "scene3/O", limit: 84},
);
const Q = planHand(
  {img: {at: 24, draw: 28}, buy: {at: 95, draw: 16}, under: {at: 156, draw: 16}},
  {label: "scene3/Q", limit: 184},
);
const R = planHand(
  {real: {at: 32, draw: 16}, price: {at: 116, draw: 18}, img: {at: 137, draw: 22}},
  {label: "scene3/R", limit: 245},
);

/**
 * Scene 3 — SciTime (SITM) 3-for-1 split. Audio 0.05–105.46s. Beats (abs frames @30fps):
 * A     0–149   #1 SciTime, ticker SITM
 * B   149–228   3-for-1, this one is real
 * C   228–638   Dec 3 record / Dec 4 arrive / Dec 7 new price (timeline: 1 label per node)
 * D   638–820   timing chips for data centers + AI
 * E   820–1114  Q3 revenue $298.7M, +257%
 * F  1114–1288  Renesas deal, ~$86M of it
 * G  1288–1409  without the deal, still 154%
 * H  1409–1610  the twist: nowhere near high (~$900)
 * I  1610–1792  Nov 18 ~$412, cut in half at announcement
 * J  1792–1960  stays there -> ~$137 a share
 * K  1960–2186  the catch: GAAP $4.4M
 * L  2186–2372  adjusted $4.01 leaves out costs
 * M  2372–2546  insiders sold 24x, bought none
 * N  2546–2688  CEO sold 12,000 shares ~$600
 * O  2688–2772  some prearranged, but still
 * Q  2772–2956  analysts divided: strong buy vs underweight
 * R  2956–3201  real company, demanding price; split = packaging (gift box)
 * Text density: max 2 MarkerText per beat (3 only for timeline beats); see CLAUDE.md.
 */
export const Scene3: React.FC = () => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    <Audio src={staticFile("narration/scene3/scene3.mp3")} />

    <Beat from={0} to={149}>
      <T
        {...A.title}
        parts={[{text: "#1 ", color: P.terracotta}, {text: "SCITIME"}]}
        x={200}
        y={250}
        fontSize={170}
      />
      <T {...A.sym} text="SITM" x={200} y={500} fontSize={200} color={P.crimson} />
    </Beat>

    <Beat from={149} to={228}>
      <T {...B.ratio} text="3-FOR-1" x={110} y={250} fontSize={200} color={P.terracotta} />
      <Pic {...B.img} src={IMG.split} x={1060} y={170} size={760} rotate={2} />
      <T {...B.real} text="THIS ONE'S REAL." x={110} y={520} fontSize={90} color={P.sageDark} />
    </Beat>

    <Beat from={228} to={638}>
      <Pic {...C.img} src={IMG.timeline} x={100} y={90} size={900} />
      <T {...C.d3} text="DEC 3" x={1060} y={166} fontSize={120} />
      <T {...C.d4} text="DEC 4" x={1060} y={382} fontSize={120} />
      <T {...C.d7} text="DEC 7" x={1060} y={593} fontSize={120} color={P.sageDark} />
    </Beat>

    <Beat from={638} to={820}>
      <T {...D.name} text="TIMING CHIPS" x={110} y={330} fontSize={110} color={P.terracotta} />
      <Pic {...D.img} src={IMG.chip} x={1130} y={170} size={700} rotate={2} />
      <T {...D.use} text="DATA CENTERS & AI" x={110} y={520} fontSize={76} color={P.slate} />
    </Beat>

    <Beat from={820} to={1114}>
      <Pic {...E.img} src={IMG.rocket} x={110} y={190} size={700} rotate={-2} />
      <T {...E.rev} text="$298.7M" x={880} y={250} fontSize={200} color={P.terracotta} />
      <T {...E.up} text="+257%" x={880} y={510} fontSize={200} color={P.sageDark} />
    </Beat>

    <Beat from={1114} to={1288}>
      <Pic {...F.img} src={IMG.deal} x={110} y={170} size={700} rotate={-2} />
      <T {...F.name} text="RENESAS" x={880} y={250} fontSize={150} />
      <T {...F.amt} text="~$86M" x={880} y={460} fontSize={230} color={P.terracotta} />
    </Beat>

    <Beat from={1288} to={1409}>
      <T {...G.l1} text="WITHOUT THE DEAL" x={330} y={200} fontSize={100} />
      <T {...G.pct} text="154%" x={330} y={400} fontSize={260} color={P.sageDark} />
    </Beat>

    <Beat from={1409} to={1610}>
      <T {...H.twist} text="THE TWIST" x={110} y={250} fontSize={130} color={P.crimson} />
      <Pic {...H.img} src={IMG.peak} x={1130} y={180} size={700} rotate={2} />
      <T {...H.high} text="~$900" x={110} y={460} fontSize={230} color={P.terracotta} />
    </Beat>

    <Beat from={1610} to={1792}>
      <T {...I.date} text="NOV 18" x={330} y={200} fontSize={130} color={P.slate} />
      <T {...I.px} text="~$412" x={330} y={400} fontSize={250} color={P.crimson} />
    </Beat>

    <Beat from={1792} to={1960}>
      <Pic {...J.img} src={IMG.scissors} x={110} y={170} size={700} rotate={-2} />
      <T {...J.px} text="~$137" x={880} y={300} fontSize={240} color={P.terracotta} />
      <T {...J.sh} text="A SHARE" x={880} y={600} fontSize={100} color={P.slate} />
    </Beat>

    <Beat from={1960} to={2186}>
      <T {...K.hook} text="THE CATCH" x={880} y={200} fontSize={130} color={P.crimson} />
      <Pic {...K.img} src={IMG.mag} x={110} y={170} size={700} rotate={-2} />
      <T {...K.eps} text="$4.4M" x={880} y={440} fontSize={230} color={P.terracotta} />
    </Beat>

    <Beat from={2186} to={2372}>
      <T
        {...L.adj}
        parts={[{text: "ADJUSTED ", color: P.slate}, {text: "$4.01", color: P.sageDark}]}
        x={330}
        y={300}
        fontSize={130}
      />
      <T {...L.out} text="LEAVES OUT COSTS" x={330} y={520} fontSize={90} color={P.crimson} />
    </Beat>

    <Beat from={2372} to={2546}>
      <Pic {...M.img} src={IMG.exit} x={110} y={170} size={700} rotate={-2} />
      <T {...M.sold} text="SOLD 24 TIMES" x={880} y={300} fontSize={100} color={P.crimson} />
      <T {...M.bought} text="BOUGHT: 0" x={880} y={520} fontSize={150} color={P.sageDark} />
    </Beat>

    <Beat from={2546} to={2688}>
      <Pic {...N.img} src={IMG.chair} x={1130} y={140} size={720} rotate={2} />
      <T {...N.shares} text="12,000 SHARES" x={110} y={250} fontSize={100} />
      <T {...N.px} text="~$600" x={110} y={450} fontSize={230} color={P.terracotta} />
    </Beat>

    <Beat from={2688} to={2772}>
      <T {...O.l1} text="SOME WERE PREARRANGED" x={330} y={280} fontSize={76} color={P.slate} />
      <T {...O.l2} text="BUT STILL..." x={330} y={470} fontSize={140} color={P.crimson} />
    </Beat>

    <Beat from={2772} to={2956}>
      <Pic {...Q.img} src={IMG.scale} x={630} y={210} size={660} />
      <T {...Q.buy} text="STRONG BUY" x={40} y={360} fontSize={68} color={P.sageDark} />
      <T {...Q.under} text="UNDERWEIGHT" x={1330} y={360} fontSize={68} color={P.crimson} />
    </Beat>

    <Beat from={2956} to={3201} last>
      <T {...R.real} text="REAL COMPANY" x={110} y={200} fontSize={100} color={P.sageDark} />
      <T {...R.price} text="DEMANDING PRICE" x={110} y={400} fontSize={90} color={P.crimson} />
      <Pic {...R.img} src={IMG.gift} x={1130} y={150} size={700} rotate={2} />
    </Beat>
  </PaperSurface>
);
