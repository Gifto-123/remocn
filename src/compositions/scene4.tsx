import React from "react";
import {staticFile} from "remotion";
import {Audio} from "@remotion/media";
import {CANVAS_PRESETS, PaperSurface} from "../whiteboard";
import {planHand} from "../whiteboard/handPlan";
import {EDITORIAL_PALETTE as P} from "../whiteboard/components/EditorialCard";
import {Beat, Pic, T} from "../whiteboard/components/SceneKit";

export const SCENE4_WIDTH = CANVAS_PRESETS.youtubeLong.width;
export const SCENE4_HEIGHT = CANVAS_PRESETS.youtubeLong.height;
export const SCENE4_FPS = CANVAS_PRESETS.youtubeLong.fps;
/** mp3 = 75.81s. Narration ends 75.84s (2275f). +1.2s tail. */
export const SCENE4_DURATION = 2310;

const img = (name: string) => staticFile(`assets/scene4/${name}`);
const IMG = {
  cert: img("Blue_stock_certificate_on_desk_41f69ad9.jpg"),
  copier: img("Photocopier_scanning_stock_certi…_29ae9967.jpg"),
  ballot: img("Key_locked_ballot_box_fd3407f1.jpg"),
  calendar: img("Date_circled_on_wall_calendar_b5a0a1a2.jpg"),
  filing: img("Legal_document_with_filing_stamp_7ba55c42.jpg"),
  lawsuit: img("Gavel_and_lawsuit_papers_on_52e04595.jpg"),
  gavel: img("Judge's_gavel_on_desk_9a91ade5.jpg"),
  ice: img("Stock_certificate_frozen_in_ice_42c8af28.jpg"),
  money: img("Money_bag_in_data_center_a47aa2a1.jpg"),
  pipe: img("Blocked_pipeline_stopping_gold_c…_9bd31df2.jpg"),
  waiver: img("Contract_waiver_expiring_with_sa…_d5e7e92a.jpg"),
  redx: img("Hand-drawn_red_X_on_calendar_3d2fe610.jpg"),
} as const;

/* `at` = beat-local frame the pen touches paper = (word start s × 30) − beat start. */
const A = planHand({title: {at: 35, draw: 20}, img: {at: 80, draw: 24}}, {label: "scene4/A", limit: 150});
const B = planHand({never: {at: 16, draw: 22}}, {label: "scene4/B", limit: 74});
const C = planHand({oct: {at: 2, draw: 18}, ratio: {at: 78, draw: 20}}, {label: "scene4/C", limit: 124});
const D = planHand(
  {img: {at: 4, draw: 28}, nv: {at: 38, draw: 18}, cls: {at: 95, draw: 18}},
  {label: "scene4/D", limit: 231},
);
const E = planHand(
  {img: {at: 4, draw: 22}, keep: {at: 28, draw: 14}, novote: {at: 101, draw: 16}},
  {label: "scene4/E", limit: 128},
);
const F = planHand(
  {img: {at: 4, draw: 22}, jan: {at: 51, draw: 18}, yr: {at: 87, draw: 14}},
  {label: "scene4/F", limit: 131},
);
const G = planHand({img: {at: 10, draw: 22}, fil: {at: 42, draw: 18}}, {label: "scene4/G", limit: 90});
const H = planHand(
  {img: {at: 2, draw: 18}, sued: {at: 22, draw: 18}, nocls: {at: 137, draw: 16}},
  {label: "scene4/H", limit: 247},
);
const I = planHand({img: {at: 3, draw: 24}, apr: {at: 49, draw: 18}}, {label: "scene4/I", limit: 91});
const J = planHand({img: {at: 6, draw: 30}, frz: {at: 59, draw: 18}}, {label: "scene4/J", limit: 90});
const K = planHand({twist: {at: 22, draw: 20}, cheap: {at: 76, draw: 18}}, {label: "scene4/K", limit: 155});
const L = planHand(
  {img: {at: 9, draw: 28}, sixty: {at: 43, draw: 18}, ai: {at: 174, draw: 16}},
  {label: "scene4/L", limit: 212},
);
const M = planHand({sale: {at: 10, draw: 20}, until: {at: 39, draw: 20}}, {label: "scene4/M", limit: 100});
const N = planHand(
  {img: {at: 4, draw: 24}, both: {at: 43, draw: 18}, same: {at: 104, draw: 16}},
  {label: "scene4/N", limit: 138},
);
const O = planHand(
  {img: {at: 18, draw: 28}, jun: {at: 132, draw: 18}, yr: {at: 188, draw: 16}},
  {label: "scene4/O", limit: 235},
);
const Q = planHand(
  {bl: {at: 2, draw: 18}, img: {at: 128, draw: 26}, gone: {at: 158, draw: 18}},
  {label: "scene4/Q", limit: 233},
);

/**
 * Scene 4 — Meta Class C plan, frozen by lawsuit. Audio 0–75.84s. Beats (abs frames @30fps):
 * A     0–142   #2 Meta, supposed blockbuster
 * B   142–208   never split its stock
 * C   208–324   October plan ~ 2-for-1
 * D   324–547   Class C non-voting, one per share
 * E   547–667   Zuckerberg keeps control, no vote
 * F   667–790   set to begin Jan 19, 2027
 * G   790–872   filing dropped
 * H   872–1111  sued in Delaware; no Class C issued
 * I  1111–1194  trial Apr 19
 * J  1194–1276  January split frozen
 * K  1276–1423  the twist: not only about cheaper shares
 * L  1423–1627  $60B plan to fund AI
 * M  1627–1720  sale can't start until shares exist
 * N  1720–1850  lawsuit freezes split + funding
 * O  1850–2077  waiver runs out Jun 30, 2027
 * Q  2077–2310  buying a date that no longer exists
 */
export const Scene4: React.FC = () => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    <Audio src={staticFile("narration/scene4/scene4.mp3")} />

    <Beat from={0} to={142}>
      <T
        {...A.title}
        parts={[{text: "#2 ", color: P.terracotta}, {text: "META"}]}
        x={110}
        y={330}
        fontSize={170}
      />
      <Pic {...A.img} src={IMG.cert} x={1130} y={170} size={700} rotate={2} />
    </Beat>

    <Beat from={142} to={208}>
      <T {...B.never} text="NEVER SPLIT" x={230} y={330} fontSize={190} color={P.crimson} />
    </Beat>

    <Beat from={208} to={324}>
      <T {...C.oct} text="OCTOBER" x={110} y={220} fontSize={150} color={P.slate} />
      <T {...C.ratio} text="2-FOR-1" x={110} y={470} fontSize={220} color={P.terracotta} />
    </Beat>

    <Beat from={324} to={547}>
      <Pic {...D.img} src={IMG.copier} x={110} y={170} size={700} rotate={-2} />
      <T {...D.nv} text="NON-VOTING" x={880} y={250} fontSize={130} color={P.slate} />
      <T {...D.cls} text="CLASS C" x={880} y={450} fontSize={200} color={P.terracotta} />
    </Beat>

    <Beat from={547} to={667}>
      <Pic {...E.img} src={IMG.ballot} x={110} y={170} size={700} rotate={-2} />
      <T {...E.keep} text="KEEPS CONTROL" x={880} y={270} fontSize={100} color={P.sageDark} />
      <T {...E.novote} text="NO VOTE" x={880} y={480} fontSize={180} color={P.crimson} />
    </Beat>

    <Beat from={667} to={790}>
      <Pic {...F.img} src={IMG.calendar} x={110} y={170} size={700} rotate={-2} />
      <T {...F.jan} text="JAN 19" x={880} y={260} fontSize={220} color={P.terracotta} />
      <T {...F.yr} text="2027" x={880} y={540} fontSize={170} color={P.slate} />
    </Beat>

    <Beat from={790} to={872}>
      <T {...G.fil} text="FILING DROPPED" x={110} y={380} fontSize={100} color={P.crimson} />
      <Pic {...G.img} src={IMG.filing} x={1130} y={170} size={700} rotate={2} />
    </Beat>

    <Beat from={872} to={1111}>
      <Pic {...H.img} src={IMG.lawsuit} x={110} y={170} size={700} rotate={-2} />
      <T {...H.sued} text="SUED IN DELAWARE" x={880} y={260} fontSize={86} color={P.crimson} />
      <T {...H.nocls} text="NO CLASS C" x={880} y={470} fontSize={140} color={P.slate} />
    </Beat>

    <Beat from={1111} to={1194}>
      <Pic {...I.img} src={IMG.gavel} x={110} y={170} size={700} rotate={-2} />
      <T {...I.apr} text="APR 19" x={880} y={330} fontSize={220} color={P.terracotta} />
    </Beat>

    <Beat from={1194} to={1276}>
      <Pic {...J.img} src={IMG.ice} x={110} y={170} size={700} rotate={-2} />
      <T {...J.frz} text="FROZEN" x={880} y={330} fontSize={200} color={P.slate} />
    </Beat>

    <Beat from={1276} to={1423}>
      <T {...K.twist} text="THE TWIST" x={110} y={230} fontSize={170} color={P.crimson} />
      <T {...K.cheap} text="NOT JUST CHEAPER" x={110} y={480} fontSize={110} color={P.slate} />
    </Beat>

    <Beat from={1423} to={1627}>
      <Pic {...L.img} src={IMG.money} x={110} y={170} size={700} rotate={-2} />
      <T {...L.sixty} text="$60B" x={880} y={250} fontSize={260} color={P.terracotta} />
      <T {...L.ai} text="FUNDS AI" x={880} y={540} fontSize={130} color={P.sageDark} />
    </Beat>

    <Beat from={1627} to={1720}>
      <T {...M.sale} text="SALE CAN'T START" x={270} y={250} fontSize={120} color={P.crimson} />
      <T {...M.until} text="UNTIL SHARES EXIST" x={270} y={470} fontSize={90} color={P.slate} />
    </Beat>

    <Beat from={1720} to={1850}>
      <T {...N.both} text="BOTH FROZEN" x={110} y={250} fontSize={120} color={P.slate} />
      <Pic {...N.img} src={IMG.pipe} x={1130} y={170} size={700} rotate={2} />
      <T {...N.same} text="SAME TIME" x={110} y={470} fontSize={100} color={P.crimson} />
    </Beat>

    <Beat from={1850} to={2077}>
      <Pic {...O.img} src={IMG.waiver} x={110} y={170} size={700} rotate={-2} />
      <T {...O.jun} text="JUNE 30" x={880} y={250} fontSize={200} color={P.terracotta} />
      <T {...O.yr} text="2027 AT LATEST" x={880} y={520} fontSize={90} color={P.slate} />
    </Beat>

    <Beat from={2077} to={2310} last>
      <T {...Q.bl} text="BOTTOM LINE" x={110} y={220} fontSize={110} color={P.slate} />
      <T {...Q.gone} text="NO LONGER EXISTS" x={110} y={440} fontSize={80} color={P.crimson} />
      <Pic {...Q.img} src={IMG.redx} x={1130} y={170} size={700} rotate={2} />
    </Beat>
  </PaperSurface>
);
