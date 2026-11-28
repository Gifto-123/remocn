import React from "react";
import {staticFile} from "remotion";
import {Audio} from "@remotion/media";
import {CANVAS_PRESETS, HandUnderline, PaperSurface} from "../whiteboard";
import {planHand} from "../whiteboard/handPlan";
import {EDITORIAL_PALETTE as P} from "../whiteboard/components/EditorialCard";
import {Beat, Pic, T} from "../whiteboard/components/SceneKit";

export const SCENE6_WIDTH = CANVAS_PRESETS.youtubeLong.width;
export const SCENE6_HEIGHT = CANVAS_PRESETS.youtubeLong.height;
export const SCENE6_FPS = CANVAS_PRESETS.youtubeLong.fps;
/** ~46.85s. mp3 = 749619 B @128kbps. Narration ends 45.88s. Set exact mp3 length if different. */
export const SCENE6_DURATION = 1406;

const img = (name: string) => staticFile(`assets/scene6/${name}`);
const IMG = {
  car: img("Car_driving_from_dusk_to_4b89196c.jpg"),
  desk: img("Desk_lamp_illuminating_ledger_37d7f445.jpg"),
  mag: img("Magnifying_glass_examining_resea…_9955f703.jpg"),
  monitor: img("Monitor_showing_two_line_graphs_8189bac7.jpg"),
  red: img("Red_line_sliding_downward_chart_f7b8ee77.jpg"),
} as const;

/* Hand plans. `at` = beat-local frame the pen touches paper (narration word start). */
const A = planHand({hist: {at: 28, draw: 24}}, {label: "scene6/A", limit: 73});
const B = planHand(
  {img: {at: 4, draw: 26}, num: {at: 50, draw: 20}},
  {label: "scene6/B", limit: 206},
);
const C = planHand(
  {img: {at: 6, draw: 26}, seven: {at: 68, draw: 14}, twelve: {at: 180, draw: 16}},
  {label: "scene6/C", limit: 249},
);
const D = planHand(
  {img: {at: 4, draw: 24}, eleven: {at: 92, draw: 14}, tf: {at: 156, draw: 14}},
  {label: "scene6/D", limit: 232},
);
const E = planHand(
  {study: {at: 28, draw: 34}, under: {at: 123, draw: 24}, line: {at: 150, draw: 14}},
  {label: "scene6/E", limit: 202},
);
const F = planHand(
  {two: {at: 4, draw: 16}, avg: {at: 55, draw: 14}, img: {at: 81, draw: 18}},
  {label: "scene6/F", limit: 112},
);
const G = planHand(
  {img: {at: 4, draw: 14}, cant: {at: 18, draw: 16}},
  {label: "scene6/G", limit: 84},
);
const H = planHand(
  {gm: {at: 17, draw: 22}, trail: {at: 173, draw: 30}, line: {at: 227, draw: 12}},
  {label: "scene6/H", limit: 304},
);

/**
 * Scene 6 — what history says. Audio 0.14–45.88s. Beats (abs frames @30fps):
 * A    0–65   "history says?"
 * B   65–263  5,500 splits (research image)
 * C  263–504  ~7% yr 1, ~12% over 3 yrs
 * D  504–728  reverse splits ~11% / 34%
 * E  728–922  1,600 reverse splits underperformed
 * F  922–1026 2 warnings: averages; old data = ledger image
 * G 1026–1102 can't tell (what this time does next)
 * H 1102–1406 George Mason: trailed by 6+ points
 * Density: ≤2 texts/beat, ≤3 words/text. Qualifiers stay in narration.
 */
export const Scene6: React.FC = () => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    <Audio src={staticFile("narration/scene6/scene6.mp3")} />

    <Beat from={0} to={65}>
      <T {...A.hist} text="HISTORY SAYS?" x={141} y={400} fontSize={180} color={P.sageDark} />
    </Beat>

    <Beat from={65} to={263}>
      <Pic {...B.img} src={IMG.mag} x={110} y={200} size={640} rotate={-2} />
      <T {...B.num} text="5,500 SPLITS" x={820} y={430} fontSize={110} color={P.terracotta} />
    </Beat>

    <Beat from={263} to={504}>
      <Pic {...C.img} src={IMG.monitor} x={1130} y={200} size={640} rotate={2} />
      <T {...C.seven} text="~7%" x={300} y={240} fontSize={220} color={P.sageDark} />
      <T {...C.twelve} text="~12%" x={300} y={520} fontSize={220} color={P.sageDark} />
    </Beat>

    <Beat from={504} to={728}>
      <Pic {...D.img} src={IMG.red} x={110} y={200} size={640} rotate={-2} />
      <T {...D.eleven} text="~11%" x={820} y={250} fontSize={200} color={P.crimson} />
      <T {...D.tf} text="34%" x={820} y={520} fontSize={200} color={P.crimson} />
    </Beat>

    <Beat from={728} to={922}>
      <T {...E.study} text="1,600 REVERSE SPLITS" x={260} y={350} fontSize={100} />
      <T {...E.under} text="UNDERPERFORMED" x={323} y={540} fontSize={130} color={P.crimson} />
      <HandUnderline {...E.line} x={323} y={700} width={1274} color={P.crimson} strokeWidth={9} />
    </Beat>

    <Beat from={922} to={1026}>
      <T {...F.two} text="2 WARNINGS" x={200} y={340} fontSize={110} color={P.crimson} />
      <T {...F.avg} text="AVERAGES" x={200} y={520} fontSize={110} />
      <Pic {...F.img} src={IMG.desk} x={1130} y={200} size={640} rotate={2} />
    </Beat>

    <Beat from={1026} to={1102}>
      <Pic {...G.img} src={IMG.car} x={1130} y={200} size={640} rotate={2} />
      <T {...G.cant} text="CAN'T TELL" x={110} y={440} fontSize={130} color={P.crimson} />
    </Beat>

    <Beat from={1102} to={1406} last>
      <T {...H.gm} text="GEORGE MASON" x={372} y={300} fontSize={140} color={P.slate} />
      <T {...H.trail} text="TRAILED BY 6+ POINTS" x={260} y={560} fontSize={100} color={P.crimson} />
      <HandUnderline {...H.line} x={260} y={690} width={1400} color={P.crimson} strokeWidth={9} />
    </Beat>
  </PaperSurface>
);