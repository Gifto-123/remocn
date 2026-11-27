import React from "react";
import {staticFile} from "remotion";
import {Audio} from "@remotion/media";
import {CANVAS_PRESETS, PaperSurface} from "../whiteboard";
import {planHand} from "../whiteboard/handPlan";
import {EDITORIAL_PALETTE as P} from "../whiteboard/components/EditorialCard";
import {Beat, Pic, T} from "../whiteboard/components/SceneKit";

export const SCENE5_WIDTH = CANVAS_PRESETS.youtubeLong.width;
export const SCENE5_HEIGHT = CANVAS_PRESETS.youtubeLong.height;
export const SCENE5_FPS = CANVAS_PRESETS.youtubeLong.fps;
/** mp3 = 65.07s (1952f). +1.2s tail. */
export const SCENE5_DURATION = 1990;

const img = (name: string) => staticFile(`assets/scene5/${name}`);
const IMG = {
  calendar: img("Wooden_desk_with_calendar_page_a7f98015.jpg"),
  press: img("Hydraulic_press_crushing_silver_…_d2da2c68.jpg"),
  chip: img("Crypto-mining_computer_chip_on_c…_e3fd318d.jpg"),
  coin: img("Copper_coin_on_trading_desk_2597356c.jpg"),
  cash: img("Cash_stacked_beside_legal_documents_069cf0d5.jpg"),
  lidar: img("LIDAR_sensor_scanning_city_street_281d5dab.jpg"),
  ticker: img("Stock_ticker_board_and_hourglass_fed4e635.jpg"),
  fall: img("Gold_coin_falling_through_glass_4c597e7a.jpg"),
} as const;

/* `at` = beat-local frame the pen touches paper = (word start s × 30) − beat start. */
const A = planHand({title: {at: 37, draw: 24}}, {label: "scene5/A", limit: 79});
const B = planHand(
  {img: {at: 6, draw: 24}, dec: {at: 98, draw: 14}, rev: {at: 142, draw: 18}},
  {label: "scene5/B", limit: 230},
);
const C = planHand(
  {img: {at: 3, draw: 22}, sq: {at: 27, draw: 16}, up: {at: 95, draw: 16}},
  {label: "scene5/C", limit: 128},
);
const D = planHand(
  {img: {at: 5, draw: 24}, ratio: {at: 93, draw: 18}, stay: {at: 207, draw: 18}},
  {label: "scene5/D", limit: 261},
);
const E = planHand({img: {at: 6, draw: 22}, px: {at: 53, draw: 18}}, {label: "scene5/E", limit: 91});
const F = planHand({rev: {at: 28, draw: 16}, num: {at: 51, draw: 20}}, {label: "scene5/F", limit: 111});
const G = planHand(
  {img: {at: 3, draw: 22}, cash: {at: 31, draw: 18}, loans: {at: 115, draw: 18}},
  {label: "scene5/G", limit: 201},
);
const H = planHand({img: {at: 3, draw: 24}, ratio: {at: 81, draw: 18}}, {label: "scene5/H", limit: 159});
const I = planHand({from: {at: 34, draw: 18}, to: {at: 102, draw: 18}}, {label: "scene5/I", limit: 146});
const J = planHand(
  {img: {at: 4, draw: 22}, mar: {at: 27, draw: 16}, del: {at: 89, draw: 16}},
  {label: "scene5/J", limit: 127},
);
const K = planHand({etf: {at: 73, draw: 20}, ratio: {at: 233, draw: 20}}, {label: "scene5/K", limit: 286});
const L = planHand(
  {img: {at: 9, draw: 28}, great: {at: 105, draw: 16}, fell: {at: 162, draw: 16}},
  {label: "scene5/L", limit: 267},
);

/**
 * Scene 5 — the trap: reverse splits. Audio 0–65.07s. Beats (abs frames @30fps):
 * A     0–71    #3 the trap
 * B    71–293   December calendar full of reverse splits
 * C   293–413   reverse split squeezes shares, price up
 * D   413–666   Canaan 1-for-25 to stay on Nasdaq
 * E   666–749   ~18 cents
 * F   749–852   revenue $14.5M
 * G   852–1045  $23M cash vs $60M loans
 * H  1045–1196  Innoviz 1-for-20
 * I  1196–1334  300M -> 15M shares
 * J  1334–1453  until March or delisting
 * K  1453–1731  leveraged ETFs, 1-for-40
 * L  1731–1990  why: price fell too low
 */
export const Scene5: React.FC = () => (
  <PaperSurface variant="paper" backgroundColor={P.paper} grain={0.04}>
    <Audio src={staticFile("narration/scene5/scene5.mp3")} />

    <Beat from={0} to={71}>
      <T
        {...A.title}
        parts={[{text: "#3 ", color: P.terracotta}, {text: "THE TRAP", color: P.crimson}]}
        x={300}
        y={330}
        fontSize={170}
      />
    </Beat>

    <Beat from={71} to={293}>
      <Pic {...B.img} src={IMG.calendar} x={110} y={170} size={700} rotate={-2} />
      <T {...B.dec} text="DECEMBER" x={880} y={250} fontSize={130} color={P.slate} />
      <T {...B.rev} text="REVERSE SPLITS" x={880} y={470} fontSize={100} color={P.crimson} />
    </Beat>

    <Beat from={293} to={413}>
      <Pic {...C.img} src={IMG.press} x={110} y={170} size={700} rotate={-2} />
      <T {...C.sq} text="SQUEEZE" x={880} y={250} fontSize={150} color={P.slate} />
      <T {...C.up} text="PRICE UP" x={880} y={480} fontSize={150} color={P.sageDark} />
    </Beat>

    <Beat from={413} to={666}>
      <Pic {...D.img} src={IMG.chip} x={110} y={170} size={700} rotate={-2} />
      <T {...D.ratio} text="1-FOR-25" x={880} y={250} fontSize={150} color={P.terracotta} />
      <T {...D.stay} text="STAY LISTED" x={880} y={480} fontSize={100} color={P.slate} />
    </Beat>

    <Beat from={666} to={749}>
      <Pic {...E.img} src={IMG.coin} x={110} y={170} size={700} rotate={-2} />
      <T {...E.px} text="18¢" x={880} y={300} fontSize={300} color={P.crimson} />
    </Beat>

    <Beat from={749} to={852}>
      <T {...F.rev} text="REVENUE" x={330} y={200} fontSize={110} color={P.slate} />
      <T {...F.num} text="$14.5M" x={330} y={400} fontSize={280} color={P.terracotta} />
    </Beat>

    <Beat from={852} to={1045}>
      <T {...G.cash} text="$23M CASH" x={110} y={250} fontSize={130} color={P.sageDark} />
      <T {...G.loans} text="$60M LOANS" x={110} y={460} fontSize={130} color={P.crimson} />
      <Pic {...G.img} src={IMG.cash} x={1130} y={170} size={700} rotate={2} />
    </Beat>

    <Beat from={1045} to={1196}>
      <Pic {...H.img} src={IMG.lidar} x={110} y={170} size={700} rotate={-2} />
      <T {...H.ratio} text="1-FOR-20" x={880} y={330} fontSize={150} color={P.terracotta} />
    </Beat>

    <Beat from={1196} to={1334}>
      <T {...I.from} text="300M" x={150} y={330} fontSize={240} color={P.slate} />
      <T
        {...I.to}
        parts={[{text: "→ ", color: P.terracotta}, {text: "15M", color: P.crimson}]}
        x={1040}
        y={330}
        fontSize={240}
      />
    </Beat>

    <Beat from={1334} to={1453}>
      <Pic {...J.img} src={IMG.ticker} x={110} y={170} size={700} rotate={-2} />
      <T {...J.mar} text="MARCH" x={880} y={250} fontSize={220} color={P.terracotta} />
      <T {...J.del} text="DELISTING" x={880} y={500} fontSize={110} color={P.crimson} />
    </Beat>

    <Beat from={1453} to={1731}>
      <T {...K.etf} text="LEVERAGED ETFS" x={300} y={250} fontSize={130} color={P.slate} />
      <T {...K.ratio} text="1-FOR-40" x={300} y={480} fontSize={240} color={P.crimson} />
    </Beat>

    <Beat from={1731} to={1990} last>
      <Pic {...L.img} src={IMG.fall} x={110} y={170} size={700} rotate={-2} />
      <T {...L.great} text="NOT GREAT" x={880} y={250} fontSize={140} color={P.slate} />
      <T {...L.fell} text="PRICE FELL" x={880} y={470} fontSize={140} color={P.crimson} />
    </Beat>
  </PaperSurface>
);
