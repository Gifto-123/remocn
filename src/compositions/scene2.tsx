import React from "react";
import {staticFile} from "remotion";
import {Audio} from "@remotion/media";
import {CANVAS_PRESETS, PaperSurface} from "../whiteboard";
import {planHand} from "../whiteboard/handPlan";
import {EDITORIAL_PALETTE as P} from "../whiteboard/components/EditorialCard";
import {Beat, Pic, T} from "../whiteboard/components/SceneKit";

export const SCENE2_WIDTH = CANVAS_PRESETS.youtubeLong.width;
export const SCENE2_HEIGHT = CANVAS_PRESETS.youtubeLong.height;
export const SCENE2_FPS = CANVAS_PRESETS.youtubeLong.fps;
/** ~46.07s. mp3 = 737080 B @128kbps. Narration ends 44.04s. Set exact mp3 length if different. */
export const SCENE2_DURATION = 1382;

const img = (name: string) => staticFile(`assets/scene2/${name}`);
const IMG = {
  cal: img("Calendar_page_with_expired_stamp_c40bd9f1.jpg"),
  corn: img("Canned_corn_illustration_60f77f0e.jpg"),
  clip: img("Clipboard_checklist_illustration_771b6398.jpg"),
  flash: img("Flash_card_and_portable_SSD_782c852e.jpg"),
  mag: img("Magnifying_glass_inspecting_offi…_79bcbc29.jpg"),
  scissors: img("Scissors_cutting_ten_dollar_bill_3f42cb1d.jpg"),
  chip: img("Semiconductor_microchip_on_coin_…_1452c7a5.jpg"),
  jet: img("Small_passenger_jet_taking_off_96383f44.jpg"),
  video: img("Video_player_illustration_on_laptop_c12d38f5.jpg"),
} as const;

/* Hand plans. `at` = beat-local frame the pen touches paper (narration-locked). */
const A = planHand(
  {img: {at: 6, draw: 24}, l1: {at: 38, draw: 16}, l2: {at: 64, draw: 18}},
  {label: "scene2/A", limit: 99},
);
const B = planHand(
  {img: {at: 6, draw: 30}, name: {at: 46, draw: 14}, ratio: {at: 76, draw: 20}},
  {label: "scene2/B", limit: 152},
);
const C = planHand(
  {semi: {at: 14, draw: 28}, img: {at: 58, draw: 26}, ratio: {at: 119, draw: 18}},
  {label: "scene2/C", limit: 192},
);
const D = planHand(
  {name: {at: 4, draw: 10}, ratio: {at: 23, draw: 14}, img: {at: 84, draw: 20}},
  {label: "scene2/D", limit: 133},
);
const E = planHand(
  {name: {at: 4, draw: 18}, ratio: {at: 31, draw: 12}, img: {at: 76, draw: 20}},
  {label: "scene2/E", limit: 116},
);
const F = planHand(
  {video: {at: 36, draw: 24}, buy: {at: 68, draw: 22}, cal: {at: 107, draw: 24}, dead: {at: 138, draw: 22}},
  {label: "scene2/F", limit: 170},
);
const G = planHand(
  {l1: {at: 20, draw: 20}, l2: {at: 62, draw: 12}},
  {label: "scene2/G", limit: 81},
);
const H = planHand(
  {l1: {at: 6, draw: 16}, l2: {at: 28, draw: 22}},
  {label: "scene2/H", limit: 118},
);
const I = planHand(
  {img: {at: 4, draw: 24}, eq: {at: 58, draw: 22}, still: {at: 120, draw: 20}},
  {label: "scene2/I", limit: 157},
);
const J = planHand(
  {q: {at: 12, draw: 30}, img: {at: 96, draw: 24}, des: {at: 135, draw: 26}},
  {label: "scene2/J", limit: 236},
);

/**
 * Scene 2 — the four splits. Audio 0.14–44.04s. Beats (abs frames @30fps):
 * A    0–91   "why the list is so short"
 * B   91–235  SanDisk 8-for-1, Nov 20
 * C  235–419  iShares Semiconductor ETF (SOXX) 3-for-1, Nov 5
 * D  419–544  Embraer 4-for-1 (US shares), mid-Nov
 * E  544–652  Seneca Foods 5-for-1, Nov 17
 * F  652–814  all done; video said buy before; deadline passed
 * G  814–887  the part nobody says out loud
 * H  887–997  a split changes nothing about worth
 * I  997–1146 cut a $10 into two $5 = still $10
 * J 1146–1382 the only real question
 * Text density: max 2 MarkerText per beat; see CLAUDE.md. Dates/tickers stay in narration.
 */
export const Scene2: React.FC = () => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    <Audio src={staticFile("narration/scene2/scene2.mp3")} />

    <Beat from={0} to={91}>
      <Pic {...A.img} src={IMG.clip} x={110} y={190} size={700} rotate={-2} />
      <T {...A.l1} text="WHY THE LIST" x={900} y={300} fontSize={120} />
      <T {...A.l2} text="IS SO SHORT?" x={900} y={450} fontSize={120} color={P.crimson} />
    </Beat>

    <Beat from={91} to={235}>
      <Pic {...B.img} src={IMG.flash} x={110} y={200} size={640} rotate={-2} />
      <T {...B.name} text="SANDISK" x={820} y={300} fontSize={120} />
      <T {...B.ratio} text="8-FOR-1" x={820} y={500} fontSize={200} color={P.terracotta} />
    </Beat>

    <Beat from={235} to={419}>
      <T {...C.semi} text="SEMICONDUCTOR ETF" x={110} y={300} fontSize={76} color={P.mutedInk} />
      <Pic {...C.img} src={IMG.chip} x={1130} y={200} size={640} rotate={2} />
      <T {...C.ratio} text="3-FOR-1" x={110} y={450} fontSize={200} color={P.terracotta} />
    </Beat>

    <Beat from={419} to={544}>
      <T {...D.name} text="EMBRAER" x={820} y={300} fontSize={120} />
      <T {...D.ratio} text="4-FOR-1" x={820} y={500} fontSize={200} color={P.terracotta} />
      <Pic {...D.img} src={IMG.jet} x={110} y={200} size={640} rotate={-2} />
    </Beat>

    <Beat from={544} to={652}>
      <T {...E.name} text="SENECA FOODS" x={110} y={300} fontSize={110} />
      <T {...E.ratio} text="5-FOR-1" x={110} y={500} fontSize={200} color={P.terracotta} />
      <Pic {...E.img} src={IMG.corn} x={1130} y={200} size={640} rotate={2} />
    </Beat>

    <Beat from={652} to={814}>
      <Pic {...F.video} src={IMG.video} x={100} y={160} size={640} rotate={-2} />
      <T {...F.buy} text="BUY BEFORE THESE?" x={780} y={260} fontSize={90} />
      <Pic {...F.cal} src={IMG.cal} x={1150} y={420} size={640} rotate={2} />
      <T {...F.dead} text="DEADLINE PASSED" x={100} y={880} fontSize={80} color={P.crimson} />
    </Beat>

    <Beat from={814} to={887}>
      <T {...G.l1} text="NOBODY SAYS" x={330} y={250} fontSize={150} />
      <T {...G.l2} text="OUT LOUD." x={330} y={480} fontSize={150} color={P.crimson} />
    </Beat>

    <Beat from={887} to={997}>
      <T {...H.l1} text="SPLIT CHANGES" x={330} y={250} fontSize={140} />
      <T {...H.l2} text="NOTHING." x={330} y={450} fontSize={220} color={P.crimson} />
    </Beat>

    <Beat from={997} to={1146}>
      <Pic {...I.img} src={IMG.scissors} x={110} y={200} size={640} rotate={-2} />
      <T {...I.eq} text="= $5 + $5" x={820} y={300} fontSize={130} color={P.terracotta} />
      <T {...I.still} text="STILL $10" x={820} y={520} fontSize={150} color={P.sageDark} />
    </Beat>

    <Beat from={1146} to={1382} last>
      <T {...J.q} text="THE ONLY QUESTION" x={120} y={100} fontSize={110} color={P.crimson} />
      <Pic {...J.img} src={IMG.mag} x={1250} y={240} size={540} rotate={2} />
      <T {...J.des} text="DESERVES YOUR MONEY?" x={120} y={820} fontSize={96} color={P.sageDark} />
    </Beat>
  </PaperSurface>
);
