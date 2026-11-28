import React from "react";
import {staticFile} from "remotion";
import {Audio} from "@remotion/media";
import {CANVAS_PRESETS, HandCircle, HandStrike, PaperSurface} from "../whiteboard";
import {planHand} from "../whiteboard/handPlan";
import {EDITORIAL_PALETTE as P} from "../whiteboard/components/EditorialCard";
import {Beat, Pic, T} from "../whiteboard/components/SceneKit";

export const SCENE7_WIDTH = CANVAS_PRESETS.youtubeLong.width;
export const SCENE7_HEIGHT = CANVAS_PRESETS.youtubeLong.height;
export const SCENE7_FPS = CANVAS_PRESETS.youtubeLong.fps;
/** ~38.2s. mp3 = 611274 B @128kbps. Narration ends 37.52s. Set exact mp3 length if different. */
export const SCENE7_DURATION = 1146;

const img = (name: string) => staticFile(`assets/scene7/${name}`);
const IMG = {
  bar: img("Bar_chart_rising_on_monitor_a77dfff8.jpg"),
  cleaver: img("Cleaver_slicing_gold_coin_be93b75a.jpg"),
  docs: img("Documents_on_desk_with_coffee_3bac8007.jpg"),
  court: img("Empty_courtroom_at_dawn_2d8c3855.jpg"),
  hook: img("Fishing_hook_dangling_gold_coin_9c8bd8e9.jpg"),
  sil: img("Silhouette_choosing_between_glow…_cb624789.jpg"),
} as const;

/* Hand plans. `at` = beat-local frame the pen touches paper (narration word start). */
const A = planHand({buy: {at: 20, draw: 24}}, {label: "scene7/A", limit: 60});
const B = planHand(
  {img: {at: 2, draw: 24}, look: {at: 43, draw: 12}, never: {at: 60, draw: 20}},
  {label: "scene7/B", limit: 124},
);
const C = planHand(
  {
    name: {at: 19, draw: 14},
    img: {at: 112, draw: 24},
    cheap: {at: 210, draw: 18},
    strike: {at: 236, draw: 12},
  },
  {label: "scene7/C", limit: 265},
);
const D = planHand(
  {
    meta: {at: 4, draw: 10},
    img: {at: 20, draw: 22},
    date: {at: 103, draw: 16},
    circle: {at: 118, draw: 8},
  },
  {label: "scene7/D", limit: 149},
);
const E = planHand(
  {chase: {at: 7, draw: 14}, rev: {at: 23, draw: 18}, img: {at: 56, draw: 22}},
  {label: "scene7/E", limit: 131},
);
const F = planHand(
  {nfa: {at: 7, draw: 22}, img: {at: 52, draw: 22}},
  {label: "scene7/F", limit: 112},
);
const H = planHand(
  {
    img: {at: 4, draw: 24},
    a: {at: 85, draw: 14},
    b: {at: 141, draw: 16},
    c: {at: 187, draw: 14},
  },
  {label: "scene7/H", limit: 258},
);
const I = planHand(
  {com: {at: 4, draw: 24}, see: {at: 47, draw: 14}},
  {label: "scene7/I", limit: 103},
);

/**
 * Scene 7 — verdict + CTA. Audio 0.15–37.52s. Beats (abs frames @30fps):
 * A    0–52   "buy now?"
 * B   52–168  split = look, never buy
 * C  168–425  SanDisk; cheaper share is not the point
 * D  425–566  Meta; April 19
 * E  566–689  don't chase reverse splits
 * F  689–793  not financial advice (filings = image)
 * H  793–1043 pick one: SanDisk / Meta trial / stay away
 * I 1043–1146 comments, see you
 * Density: ≤2 texts/beat (H = 3 option nodes), ≤3 words/text.
 */
export const Scene7: React.FC = () => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    <Audio src={staticFile("narration/scene7/scene7.mp3")} />

    <Beat from={0} to={52}>
      <T {...A.buy} text="BUY NOW?" x={400} y={400} fontSize={200} color={P.crimson} />
    </Beat>

    <Beat from={52} to={168}>
      <Pic {...B.img} src={IMG.cleaver} x={110} y={200} size={640} rotate={-2} />
      <T {...B.look} text="LOOK" x={820} y={330} fontSize={160} color={P.sageDark} />
      <T {...B.never} text="NEVER BUY" x={820} y={540} fontSize={130} color={P.crimson} />
    </Beat>

    <Beat from={168} to={425}>
      <T {...C.name} text="SITIME" x={820} y={290} fontSize={150} color={P.terracotta} />
      <Pic {...C.img} src={IMG.bar} x={110} y={200} size={640} rotate={-2} />
      <T {...C.cheap} text="CHEAPER SHARE" x={820} y={600} fontSize={100} color={P.slate} />
      <HandStrike {...C.strike} x={820} y={610} width={910} height={90} />
    </Beat>

    <Beat from={425} to={566}>
      <T {...D.meta} text="META" x={820} y={260} fontSize={150} />
      <Pic {...D.img} src={IMG.court} x={110} y={200} size={640} rotate={-2} />
      <T {...D.date} text="APRIL 19" x={820} y={500} fontSize={170} color={P.crimson} />
      <HandCircle {...D.circle} x={790} y={480} width={1010} height={240} color={P.crimson} />
    </Beat>

    <Beat from={566} to={689}>
      <T {...E.chase} text="DON'T CHASE" x={110} y={370} fontSize={110} color={P.crimson} />
      <T {...E.rev} text="REVERSE SPLITS" x={110} y={520} fontSize={90} />
      <Pic {...E.img} src={IMG.hook} x={1130} y={200} size={640} rotate={2} />
    </Beat>

    <Beat from={689} to={793}>
      <T {...F.nfa} text="NOT FINANCIAL ADVICE" x={110} y={470} fontSize={66} color={P.crimson} />
      <Pic {...F.img} src={IMG.docs} x={1130} y={200} size={640} rotate={2} />
    </Beat>

    <Beat from={793} to={1043}>
      <Pic {...H.img} src={IMG.sil} x={110} y={200} size={600} rotate={-2} />
      <T {...H.a} text="BUY SITIME" x={800} y={280} fontSize={90} color={P.sageDark} />
      <T {...H.b} text="WAIT FOR META" x={800} y={450} fontSize={90} color={P.slate} />
      <T {...H.c} text="STAY AWAY" x={800} y={620} fontSize={90} color={P.crimson} />
    </Beat>

    <Beat from={1043} to={1146} last>
      <T {...I.com} text="IN THE COMMENTS" x={172} y={330} fontSize={150} color={P.sageDark} />
      <T {...I.see} text="SEE YOU" x={666} y={520} fontSize={120} color={P.slate} />
    </Beat>
  </PaperSurface>
);
