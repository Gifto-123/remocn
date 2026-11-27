import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexMono";

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

const PUB = "stock-market"; // folder inside public/ that holds stock-market.wav and the whoosh files
const FPS = 30;
const OVERLAP = 15; // frames a beat stays alive under the next one

const FONT = {
  head: loadManrope("normal", { weights: ["800"], subsets: ["latin"] }).fontFamily,
  body: loadInter("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily,
  data: loadPlex("normal", { weights: ["500"], subsets: ["latin"] }).fontFamily,
};

const C = {
  midnight: "#101820",
  slate: "#192B3A",
  ivory: "#F2F0E9",
  gold: "#D6A85F",
  steel: "#477FA8",
  risk: "#A84C45",
  growth: "#4C896F",
  analysis: "#8A7AA8",
  neutral: "#A5A9AD",
  white: "#FFFFFF",
};

const SAFE_X = 96;

const f = (ms: number) => Math.round((ms * FPS) / 1000);

const EASE = {
  snap: Easing.bezier(0.2, 0.9, 0.1, 1),
  reveal: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.45, 0, 0.55, 1),
  linear: Easing.linear,
};

const prog = (
  frame: number,
  start: number,
  dur: number,
  easing: (t: number) => number = EASE.reveal,
) =>
  interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/* ------------------------------------------------------------------ */
/* Timing: absolute ms in stock-market.json (word index in comments)   */
/* ------------------------------------------------------------------ */

const SCENE_START = 170360; // w509 "To"
const SCENE_END = 221120; // w674 "Now" (Scene 6 starts here, on "Now here's where...")
export const SCENE_5_DURATION = f(SCENE_END) - f(SCENE_START); // 1523 frames
const loc = (ms: number) => f(ms) - f(SCENE_START);

const T = {
  b1: { start: 170360, end: 173570 }, // w509 "To" .. w518 "Nvidia"
  b2: { start: 173570, end: 178320 }, // w519 "Because" .. w537 "story"
  b3: { start: 178320, end: 184840 }, // w538 "When" .. w555 "result"
  b4: { start: 184840, end: 191210 }, // w556 "And" .. w574 "capital"
  b5: { start: 191210, end: 193550 }, // w575 "But" .. w582 "sign"
  b6: { start: 193550, end: 194960 }, // w583 "The" .. w586 "spreading"
  b7: { start: 194960, end: 203120 }, // w587 "On" .. w611 "positive"
  b8: { start: 203120, end: 210680 }, // w612 "A" .. w635 "averages"
  b9: { start: 210680, end: 216750 }, // w636 "In" .. w656 "healthy"
  b10: { start: 216750, end: 221120 }, // w657 "The" .. w673 "seriously"

  // b1
  weNeed: 171880, // w513 "we"
  beyond: 172600, // w517 "beyond"
  nvidia: 172950, // w518 "Nvidia"

  // b2
  mistakes: 174330, // w524 "mistakes"
  canMake: 174720, // w525 "investors"
  assuming: 175600, // w528 "is"
  index: 176390, // w532 "market"
  tells: 176980, // w534 "tells"
  complete: 177410, // w536 "complete"

  // b3
  largest: 179130, // w540 "largest"
  dominate: 179950, // w542 "dominate"
  perf: 181450, // w545 "their"
  enormous: 182570, // w550 "enormous"
  overall: 183510, // w553 "on"
  result: 184170, // w555 "result"

  // b4
  particularly: 185090, // w559 "particularly"
  whenA: 186000, // w560 "when"
  tech: 187520, // w566 "technology"
  hasAttracted: 188840, // w569 "has"
  capital: 190340, // w574 "capital"

  // b5
  thereIs: 192150, // w580 "another"
  warning: 192540, // w581 "warning"

  // b6
  weaknessIs: 194060, // w585 "is"
  spreading: 194180, // w586 "spreading"

  // b7
  nov20: 195250, // w588 "November"
  independent: 196330, // w591 "an"
  breadth: 197160, // w594 "breadth"
  calc: 197520, // w595 "calculation"
  showed: 198240, // w596 "showed"
  onlyAround: 198660, // w598 "only"
  twenty: 199330, // w600 "20"
  pct20: 199820, // w601 "%"
  ofIts: 199920, // w602 "of"
  participation: 200970, // w606 "participation"
  positive: 202200, // w610 "was"

  // b8
  snapshot: 203120, // w612 "A"
  onlyAbout: 204880, // w617 "only"
  fortyThree: 205360, // w619 "43"
  pct43: 206250, // w620 "%"
  ofSp: 206400, // w621 "of"
  trading: 207970, // w625 "were"
  fifty: 208790, // w629 "their"

  // b9
  noLonger: 211790, // w641 "no"
  thisIs: 211670, // w639 "this"
  aStory: 212260, // w643 "a"
  aFew: 212870, // w646 "a"
  ai: 213680, // w649 "AI"
  falling: 214400, // w651 "falling"
  everything: 215040, // w653 "everything"
  healthy: 216050, // w656 "healthy"

  // b10
  broader: 216750, // w657 "The"
  signs: 217700, // w661 "showing"
  stress: 218590, // w664 "stress"
  too: 218960, // w665 "too"
  andThats: 219200, // w666 "And"
  investors: 219880, // w670 "investors"
  seriously: 220610, // w673 "seriously"
};

/* whoosh accents: start ~100 ms before the beat they announce */
const SFX = [
  { at: 170360, file: "transition-smooth-whoosh", frames: 14 }, // scene handover
  { at: 191110, file: "transition-smooth-whoosh", frames: 14 }, // b5 "But ... another warning sign"
  { at: 194860, file: "whoosh-short", frames: 12 }, // b7 breadth calculation
  { at: 203020, file: "whoosh-short", frames: 12 }, // b8 separate snapshot
  { at: 216650, file: "whoosh-short", frames: 12 }, // b10 broader market
] as const;

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const txt = (
  size: number,
  font: string,
  color: string,
  extra?: React.CSSProperties,
): React.CSSProperties => ({
  fontFamily: font,
  fontSize: size,
  color,
  lineHeight: 1.05,
  margin: 0,
  whiteSpace: "nowrap",
  ...extra,
});

const BeatBg: React.FC<{ color: string; children: React.ReactNode }> = ({
  color,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        opacity: interpolate(frame, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.reveal,
        }),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** rise-reveal: fade plus upward drift */
const rise = (frame: number, start: number, dur = 18, dy = 40): React.CSSProperties => {
  const p = prog(frame, start, dur);
  return { opacity: p, translate: `0px ${(1 - p) * dy}px` };
};

/** slide-in from the left */
const slideIn = (frame: number, start: number, dur = 16, dx = 60): React.CSSProperties => {
  const p = prog(frame, start, dur, EASE.snap);
  return { opacity: p, translate: `${(1 - p) * -dx}px 0px` };
};

const Sfx: React.FC<{ file: string; frames: number }> = ({ file, frames }) => (
  <Audio src={staticFile(`${PUB}/${file}.wav`)} volume={0.32} trimAfter={frames} />
);

/* ------------------------------------------------------------------ */
/* b1  typography-led: "look beyond Nvidia"                            */
/* ------------------------------------------------------------------ */

const B1: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b1.start);

  // change b1 @172950 ms, w518 "Nvidia": the word lands, then slides off to the right and dims
  const land = prog(frame, at(T.nvidia), 10, EASE.snap);
  const away = prog(frame, at(T.nvidia) + 16, 18, EASE.inOut);

  return (
    <BeatBg color={C.midnight}>
      <div style={{ position: "absolute", left: SAFE_X, top: 300, ...txt(56, FONT.body, C.neutral, { letterSpacing: "0.1em" }), ...slideIn(frame, 0) }}>
        TO UNDERSTAND THE DIFFERENCE
      </div>
      {/* change b1 @171880 ms, w513 "we" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 385, ...txt(56, FONT.body, C.neutral, { letterSpacing: "0.1em" }), ...slideIn(frame, at(T.weNeed)) }}>
        WE NEED TO LOOK
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 480, display: "flex", gap: 40, ...txt(200, FONT.head, C.ivory) }}>
        {/* change b1 @172600 ms, w517 "beyond" */}
        <span style={slideIn(frame, at(T.beyond), 14, 120)}>BEYOND</span>
        <span
          style={{
            color: C.risk,
            opacity: land * (1 - away * 0.65),
            scale: `${1.15 - land * 0.15 - away * 0.2}`,
            translate: `${away * 90}px 0px`,
          }}
        >
          NVIDIA
        </span>
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b2  visual metaphor: one index tile is not the complete picture     */
/* ------------------------------------------------------------------ */

const B2: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b2.start);

  const COLS = 5;
  const ROWS = 3;
  const TILE = 150;
  const GAP = 20;
  const GX = 1000;
  const GY = 300;
  // change b2 @176390 ms, w532 "market index": the index tile lands in the middle
  const idx = prog(frame, at(T.index), 14, EASE.snap);

  return (
    <BeatBg color={C.ivory}>
      <div style={{ position: "absolute", left: SAFE_X, top: 120, ...txt(44, FONT.body, C.slate), ...slideIn(frame, 0) }}>
        ONE OF THE
      </div>
      {/* change b2 @174330 ms, w524 "mistakes" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 190, ...txt(84, FONT.head, C.risk), ...slideIn(frame, at(T.mistakes), 16, 80) }}>
        BIGGEST MISTAKES
      </div>
      {/* change b2 @174720 ms, w525 "investors" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 320, ...txt(48, FONT.body, C.slate), ...rise(frame, at(T.canMake), 16, 24) }}>
        INVESTORS CAN MAKE
      </div>
      {/* change b2 @175600 ms, w528 "is" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 410, ...txt(48, FONT.body, C.slate), ...rise(frame, at(T.assuming), 16, 24) }}>
        IS ASSUMING THAT
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 500, ...txt(84, FONT.head, C.midnight), ...slideIn(frame, at(T.index), 16, 80) }}>
        A MARKET INDEX
      </div>
      {/* change b2 @176980 ms, w534 "tells" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 640, ...txt(48, FONT.body, C.slate), ...rise(frame, at(T.tells), 16, 24) }}>
        TELLS THE
      </div>
      {/* change b2 @177410 ms, w536 "complete" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 710, ...txt(84, FONT.head, C.midnight), ...slideIn(frame, at(T.complete), 16, 80) }}>
        COMPLETE STORY
      </div>

      {Array.from({ length: COLS * ROWS }).map((_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const isIndex = col === 2 && row === 1;
        const x = GX + col * (TILE + GAP);
        const y = GY + row * (TILE + GAP);
        // change b2 @177410 ms: the rest of the picture appears around the index tile
        const rest = prog(frame, at(T.complete) + (col + row) * 2, 10, EASE.snap);
        return isIndex ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: TILE,
              height: TILE,
              borderRadius: 18,
              backgroundColor: C.steel,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: idx,
              scale: `${1.4 - idx * 0.4}`,
              ...txt(34, FONT.head, C.ivory),
            }}
          >
            INDEX
          </div>
        ) : (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: TILE,
              height: TILE,
              borderRadius: 18,
              border: `5px dashed ${C.neutral}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: rest,
              ...txt(64, FONT.head, C.neutral),
            }}
          >
            ?
          </div>
        );
      })}
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b3  visual metaphor: a few big circles drag the whole result down   */
/* ------------------------------------------------------------------ */

const BIG = [
  { x: 330, y: 760, r: 130 },
  { x: 620, y: 800, r: 100 },
];
const MED = [
  { x: 860, y: 820, r: 48 },
  { x: 960, y: 780, r: 48 },
  { x: 1060, y: 830, r: 48 },
  { x: 1160, y: 790, r: 44 },
];
const TINY = Array.from({ length: 14 }).map((_, i) => ({ x: 150 + i * 80, y: 905 - (i % 2) * 34, r: 18 }));

const B3: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b3.start);

  // change b3 @179950 ms, w542 "dominate": the big circles swell
  const swell = prog(frame, at(T.dominate), 20, EASE.snap);
  // change b3 @182570-184170 ms, w550 "enormous" .. w555 "result": the big circles sink and drag the result marker with them
  const drop = prog(frame, at(T.enormous), at(T.result) - at(T.enormous), EASE.inOut);

  const circle = (key: string, x: number, y: number, r: number, color: string, extra?: React.CSSProperties) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: r * 2,
        backgroundColor: color,
        ...extra,
      }}
    />
  );

  return (
    <BeatBg color={C.slate}>
      <div style={{ position: "absolute", left: SAFE_X, top: 80, ...txt(64, FONT.head, C.ivory), ...slideIn(frame, 0, 16, 80) }}>
        WHEN THE LARGEST COMPANIES
      </div>
      {/* change b3 @179950 ms, w542 "dominate" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 170, ...txt(64, FONT.head, C.ivory), ...slideIn(frame, at(T.dominate), 16, 80) }}>
        DOMINATE AN INDEX
      </div>
      {/* change b3 @181450 ms, w545 "their" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 290, ...txt(44, FONT.body, C.neutral), ...rise(frame, at(T.perf), 16, 24) }}>
        THEIR PERFORMANCE CAN HAVE
      </div>
      {/* change b3 @182460 ms, w548 "an" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 360, ...txt(64, FONT.head, C.risk), ...rise(frame, at(T.enormous) - 4, 16, 24) }}>
        AN ENORMOUS INFLUENCE
      </div>
      {/* change b3 @183510 ms, w553 "on" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 455, ...txt(44, FONT.body, C.neutral), ...rise(frame, at(T.overall), 16, 24) }}>
        ON THE OVERALL RESULT
      </div>

      {TINY.map((c, i) =>
        circle(`t${i}`, c.x, c.y, c.r, "rgba(165,169,173,0.45)", { opacity: prog(frame, 4 + i * 2, 8, EASE.snap) }),
      )}
      {MED.map((c, i) =>
        circle(`m${i}`, c.x, c.y, c.r, "rgba(165,169,173,0.7)", { opacity: prog(frame, 14 + i * 3, 8, EASE.snap) }),
      )}
      {BIG.map((c, i) =>
        circle(`b${i}`, c.x, c.y, c.r, drop > 0.3 ? C.risk : C.steel, {
          opacity: prog(frame, at(T.largest) + i * 4, 10, EASE.snap),
          scale: `${1 + swell * 0.22}`,
          translate: `0px ${drop * 60}px`,
        }),
      )}

      {/* result meter */}
      <div
        style={{
          position: "absolute",
          left: 1500,
          top: 300,
          width: 12,
          height: 580,
          backgroundColor: "rgba(242,240,233,0.2)",
          transformOrigin: "50% 0%",
          scale: `1 ${prog(frame, at(T.perf), 16, EASE.snap)}`,
        }}
      />
      <div style={{ position: "absolute", left: 1380, top: 230, width: 252, textAlign: "center", ...txt(32, FONT.body, C.neutral), ...rise(frame, at(T.overall), 14, 14) }}>
        OVERALL RESULT
      </div>
      <div
        style={{
          position: "absolute",
          left: 1506 - 28,
          top: 590 - 28,
          width: 56,
          height: 56,
          borderRadius: 56,
          backgroundColor: drop > 0.3 ? C.risk : C.ivory,
          opacity: prog(frame, at(T.perf), 12),
          translate: `0px ${drop * 220}px`,
        }}
      />
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b4  visual metaphor: investor capital pours into a small group      */
/* ------------------------------------------------------------------ */

const B4: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b4.start);

  const CX = 1450;
  const CY = 720;
  const group = [
    { x: CX - 70, y: CY + 20, r: 70 },
    { x: CX + 60, y: CY - 10, r: 56 },
    { x: CX + 10, y: CY + 90, r: 48 },
    { x: CX - 20, y: CY - 70, r: 44 },
  ];
  // change b4 @186210 ms, w561 "a": the small group appears
  const grp = prog(frame, at(T.whenA) + 6, 14, EASE.snap);

  return (
    <BeatBg color={C.midnight}>
      <div style={{ position: "absolute", left: SAFE_X, top: 120, ...txt(40, FONT.body, C.neutral, { letterSpacing: "0.06em" }), ...slideIn(frame, 0) }}>
        AND THAT&apos;S PARTICULARLY IMPORTANT
      </div>
      {/* change b4 @186000 ms, w560 "when" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 220, ...txt(52, FONT.head, C.ivory), ...rise(frame, at(T.whenA), 16, 24) }}>
        WHEN A RELATIVELY SMALL GROUP
      </div>
      {/* change b4 @187520 ms, w566 "technology" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 300, ...txt(52, FONT.head, C.ivory), ...rise(frame, at(T.tech), 16, 24) }}>
        OF TECHNOLOGY COMPANIES
      </div>
      {/* change b4 @188840 ms, w569 "has" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 470, ...txt(80, FONT.head, C.gold), ...rise(frame, at(T.hasAttracted), 16, 30) }}>
        HAS ATTRACTED
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 570, ...txt(64, FONT.head, C.gold), ...rise(frame, at(T.hasAttracted) + 16, 16, 30) }}>
        SO MUCH INVESTOR CAPITAL
      </div>

      {group.map((g, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: g.x - g.r,
            top: g.y - g.r,
            width: g.r * 2,
            height: g.r * 2,
            borderRadius: g.r * 2,
            backgroundColor: C.steel,
            opacity: grp,
            scale: `${0.6 + grp * 0.4}`,
          }}
        />
      ))}

      {/* change b4 @188840-190340 ms, w569 "has attracted" .. w574 "capital": gold dots stream into the group */}
      {Array.from({ length: 40 }).map((_, i) => {
        const x0 = 1150 + ((i * 97) % 700);
        const y0 = 150 + ((i * 53) % 220);
        const x1 = CX + (((i * 37) % 120) - 60);
        const y1 = CY + (((i * 29) % 100) - 40);
        const p = prog(frame, at(T.hasAttracted) + i * 3, 34, EASE.inOut);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 + (x1 - x0) * p - 11,
              top: y0 + (y1 - y0) * p - 11,
              width: 22,
              height: 22,
              borderRadius: 22,
              backgroundColor: C.gold,
              opacity: p > 0 && p < 0.97 ? 1 : 0,
            }}
          />
        );
      })}
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b5  typography-led: another warning sign                            */
/* ------------------------------------------------------------------ */

const B5: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b5.start);

  // change b5 @192540 ms, w581 "warning": the word wipes in and the warning triangle pops
  const wipe = prog(frame, at(T.warning), 16, EASE.snap);
  const tri = prog(frame, at(T.warning), 12, EASE.snap);

  return (
    <BeatBg color={C.ivory}>
      <div style={{ position: "absolute", left: SAFE_X, top: 240, ...txt(90, FONT.head, C.midnight), ...slideIn(frame, 0, 16, 80) }}>
        BUT THIS TIME
      </div>
      {/* change b5 @192150 ms, w580 "another" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 370, ...txt(60, FONT.body, C.slate), ...rise(frame, at(T.thereIs), 14, 24) }}>
        THERE&apos;S ANOTHER
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 460,
          ...txt(150, FONT.head, C.risk),
          clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
        }}
      >
        WARNING SIGN
      </div>
      <svg
        width={300}
        height={300}
        viewBox="0 0 300 300"
        style={{ position: "absolute", left: 1500, top: 300, opacity: tri, scale: `${1.5 - tri * 0.5}` }}
      >
        <polygon points="150,20 285,265 15,265" fill={C.risk} />
        <rect x={138} y={100} width={24} height={90} rx={10} fill={C.ivory} />
        <circle cx={150} cy={225} r={14} fill={C.ivory} />
      </svg>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b6  visual metaphor: the weakness spreads in rings                  */
/* ------------------------------------------------------------------ */

const B6: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b6.start);

  const CX = 1450;
  const CY = 540;
  const dot = prog(frame, 0, 10, EASE.snap);

  return (
    <BeatBg color={C.midnight}>
      <div style={{ position: "absolute", left: SAFE_X, top: 330, ...txt(130, FONT.head, C.ivory), ...slideIn(frame, 0, 14, 80) }}>
        THE WEAKNESS
      </div>
      {/* change b6 @194060 ms, w585 "is" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 480, ...txt(130, FONT.head, C.risk), ...slideIn(frame, at(T.weaknessIs), 14, 80) }}>
        IS SPREADING
      </div>
      <div
        style={{
          position: "absolute",
          left: CX - 30,
          top: CY - 30,
          width: 60,
          height: 60,
          borderRadius: 60,
          backgroundColor: C.risk,
          opacity: dot,
        }}
      />
      {/* change b6 @194180 ms, w586 "spreading": three rings expand outward */}
      {[0, 10, 20].map((d) => {
        const p = prog(frame, at(T.spreading) + d, 40, EASE.reveal);
        return (
          <div
            key={d}
            style={{
              position: "absolute",
              left: CX - 220,
              top: CY - 220,
              width: 440,
              height: 440,
              borderRadius: 440,
              border: `8px solid ${C.risk}`,
              boxSizing: "border-box",
              opacity: p > 0 ? 1 - p : 0,
              scale: `${0.14 + p * 0.86}`,
            }}
          />
        );
      })}
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b7  data-viz: only about 20 % of the participation measure positive */
/* ------------------------------------------------------------------ */

const B7: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b7.start);

  const CX = 1450;
  const CY = 540;
  const R = 220;
  const CIRC = 2 * Math.PI * R;
  // change b7 @198880-199820 ms, w599 "around" .. w601 "%": the ring fills to 20 %
  const ring = prog(frame, at(T.onlyAround) + 6, at(T.pct20) - at(T.onlyAround) - 6, EASE.snap);
  const ringIn = prog(frame, at(T.onlyAround), 12);

  return (
    <BeatBg color={C.slate}>
      <div style={{ position: "absolute", left: SAFE_X, top: 110, ...txt(76, FONT.head, C.ivory), ...slideIn(frame, at(T.nov20)) }}>
        NOVEMBER 20
      </div>
      {/* change b7 @196330-197520 ms, w591 "an" .. w595 "calculation" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 260, ...txt(44, FONT.body, C.neutral), ...rise(frame, at(T.independent), 14, 20) }}>
        AN INDEPENDENT
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 330, ...txt(72, FONT.head, C.ivory), ...rise(frame, at(T.breadth) - 10, 14, 24) }}>
        MARKET BREADTH
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 420, ...txt(72, FONT.head, C.ivory), ...rise(frame, at(T.calc), 14, 24) }}>
        CALCULATION
      </div>
      {/* change b7 @198240 ms, w596 "showed" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 580, ...txt(44, FONT.body, C.neutral), ...rise(frame, at(T.showed), 14, 20) }}>
        SHOWED THAT ONLY AROUND
      </div>
      {/* change b7 @199920 ms, w602 "of" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 700, ...txt(40, FONT.body, C.ivory), ...rise(frame, at(T.ofIts), 14, 20) }}>
        OF ITS S&amp;P 500 PARTICIPATION MEASURE
      </div>
      {/* change b7 @202200 ms, w610 "was" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 770, ...txt(64, FONT.head, C.growth), ...rise(frame, at(T.positive), 14, 24) }}>
        WAS POSITIVE
      </div>

      <svg
        width={620}
        height={620}
        viewBox="0 0 620 620"
        style={{ position: "absolute", left: CX - 310, top: CY - 310, opacity: ringIn }}
      >
        <circle cx={310} cy={310} r={R} fill="none" stroke="rgba(242,240,233,0.14)" strokeWidth={64} />
        <circle
          cx={310}
          cy={310}
          r={R}
          fill="none"
          stroke={C.growth}
          strokeWidth={64}
          strokeDasharray={`${CIRC * 0.2 * ring} ${CIRC}`}
          transform="rotate(-90 310 310)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: CX - 200,
          top: CY - 70,
          width: 400,
          textAlign: "center",
          ...txt(140, FONT.data, C.ivory),
          fontVariantNumeric: "tabular-nums",
          opacity: ringIn,
        }}
      >
        {`${Math.round(ring * 20)}%`}
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b8  data-viz: 43 of 100 dots lit, S&P 500 above the 50-day average  */
/* ------------------------------------------------------------------ */

const B8: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b8.start);

  // change b8 @205360-206250 ms, w619 "43" .. w620 "%": lit dots count up to 43 of 100
  const lit = prog(frame, at(T.fortyThree), at(T.pct43) - at(T.fortyThree), EASE.snap);
  const n = Math.round(lit * 43);

  return (
    <BeatBg color={C.ivory}>
      <div style={{ position: "absolute", left: SAFE_X, top: 110, ...txt(64, FONT.head, C.midnight), ...slideIn(frame, 0, 16, 80) }}>
        A SEPARATE MARKET SNAPSHOT
      </div>
      {/* change b8 @204880 ms, w617 "only" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 330, ...txt(44, FONT.body, C.slate), ...rise(frame, at(T.onlyAbout), 14, 20) }}>
        SHOWED THAT ONLY ABOUT
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 390,
          ...txt(220, FONT.data, C.growth),
          fontVariantNumeric: "tabular-nums",
          opacity: prog(frame, at(T.fortyThree) - 6, 6),
        }}
      >
        {`${n}%`}
      </div>
      {/* change b8 @206400 ms, w621 "of" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 650, ...txt(52, FONT.head, C.midnight), ...rise(frame, at(T.ofSp), 14, 20) }}>
        OF S&amp;P 500 COMPANIES
      </div>
      {/* change b8 @207970 ms, w625 "were" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 730, ...txt(44, FONT.body, C.slate), ...rise(frame, at(T.trading), 14, 20) }}>
        WERE TRADING ABOVE
      </div>
      {/* change b8 @208790 ms, w629 "their" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 800, ...txt(50, FONT.head, C.midnight), ...rise(frame, at(T.fifty), 14, 20) }}>
        THEIR 50-DAY MOVING AVERAGES
      </div>

      {Array.from({ length: 100 }).map((_, i) => {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const appear = prog(frame, at(T.snapshot) + 20 + (col + row) * 1.5, 8, EASE.snap);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 1130 + col * 70,
              top: 190 + row * 70,
              width: 44,
              height: 44,
              borderRadius: 44,
              backgroundColor: i < n ? C.growth : "rgba(16,24,32,0.16)",
              opacity: appear,
              scale: `${0.5 + appear * 0.5}`,
            }}
          />
        );
      })}
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b9  comparison: "no longer a story about a few AI stocks"           */
/* ------------------------------------------------------------------ */

const B9: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b9.start);

  // change b9 @213680-214400 ms, w649 "AI" .. w651 "falling": the few big circles sink
  const sink = prog(frame, at(T.ai), at(T.falling) - at(T.ai) + 10, EASE.inOut);
  // change b9 @216050 ms, w656 "healthy": the old story is struck out
  const strike1 = prog(frame, at(T.healthy) - 4, 14, EASE.snap);
  const strike2 = prog(frame, at(T.healthy) + 8, 14, EASE.snap);
  const LEN = Math.sqrt(1728 * 1728 + 420 * 420);

  const fewCircles = [
    { x: 250, y: 680, r: 70 },
    { x: 440, y: 710, r: 55 },
    { x: 600, y: 690, r: 45 },
  ];

  return (
    <BeatBg color={C.midnight}>
      <div style={{ position: "absolute", left: SAFE_X, top: 110, display: "flex", gap: 28, ...txt(100, FONT.head, C.ivory) }}>
        <span style={slideIn(frame, at(T.thisIs), 14, 80)}>THIS IS</span>
        <span style={{ color: C.risk, ...slideIn(frame, at(T.noLonger), 14, 80) }}>NO LONGER</span>
      </div>
      {/* change b9 @212260 ms, w643 "a" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 250, ...txt(48, FONT.body, C.neutral), ...rise(frame, at(T.aStory), 14, 20) }}>
        A STORY ABOUT
      </div>

      {/* left panel: the few expensive AI stocks */}
      <div style={{ position: "absolute", left: 96, top: 380, width: 800, height: 520, borderRadius: 28, backgroundColor: C.slate, opacity: prog(frame, at(T.aFew), 14, EASE.snap) }}>
        <div style={{ position: "absolute", left: 36, top: 30, ...txt(34, FONT.body, C.ivory), ...rise(frame, at(T.aFew), 14, 16) }}>
          A FEW EXPENSIVE AI STOCKS FALLING
        </div>
      </div>
      {fewCircles.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: c.x - c.r,
            top: c.y - c.r + 30,
            width: c.r * 2,
            height: c.r * 2,
            borderRadius: c.r * 2,
            backgroundColor: sink > 0.3 ? C.risk : C.steel,
            opacity: prog(frame, at(T.aFew) + 6 + i * 3, 10, EASE.snap),
            translate: `0px ${sink * 90}px`,
          }}
        />
      ))}

      {/* right panel: everything else remains healthy */}
      <div style={{ position: "absolute", left: 1024, top: 380, width: 800, height: 520, borderRadius: 28, backgroundColor: C.slate, opacity: prog(frame, at(T.everything), 14, EASE.snap) }}>
        <div style={{ position: "absolute", left: 36, top: 30, ...txt(34, FONT.body, C.ivory), ...rise(frame, at(T.everything), 14, 16) }}>
          WHILE EVERYTHING ELSE REMAINS HEALTHY
        </div>
      </div>
      {Array.from({ length: 40 }).map((_, i) => {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const p = prog(frame, at(T.everything) + 6 + (col + row) * 2, 8, EASE.snap);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 1070 + col * 74,
              top: 500 + row * 90,
              width: 44,
              height: 44,
              borderRadius: 44,
              backgroundColor: C.growth,
              opacity: p,
              scale: `${0.5 + p * 0.5}`,
            }}
          />
        );
      })}

      {/* strike-through on the old story */}
      <svg width={1728} height={520} viewBox="0 0 1728 520" style={{ position: "absolute", left: 96, top: 380 }}>
        <line x1={0} y1={0} x2={1728} y2={520} stroke={C.risk} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${LEN * strike1} ${LEN * 2}`} />
        <line x1={1728} y1={0} x2={0} y2={520} stroke={C.risk} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${LEN * strike2} ${LEN * 2}`} />
      </svg>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b10  visual metaphor: the broader market cells turn to stress       */
/* ------------------------------------------------------------------ */

const B10: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b10.start);

  // change b10 @220610 ms, w673 "seriously": word slams in
  const ser = prog(frame, at(T.seriously), 10, EASE.snap);

  return (
    <BeatBg color={C.slate}>
      <div style={{ position: "absolute", left: SAFE_X, top: 150, ...txt(84, FONT.head, C.ivory), ...slideIn(frame, 0, 16, 80) }}>
        THE BROADER MARKET
      </div>
      {/* change b10 @217700 ms, w661 "showing" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 265, ...txt(60, FONT.head, C.risk), ...rise(frame, at(T.signs), 16, 24) }}>
        IS SHOWING SIGNS OF STRESS
      </div>
      {/* change b10 @218960 ms, w665 "too" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 360, ...txt(48, FONT.body, C.neutral), ...rise(frame, at(T.too), 12, 16) }}>
        TOO
      </div>

      {/* change b10 @217700-218900 ms, w661 "showing" .. w664 "stress": cells flip to risk in a scattered order */}
      {Array.from({ length: 72 }).map((_, i) => {
        const col = i % 12;
        const row = Math.floor(i / 12);
        const delay = ((i * 37) % 72) * 0.5;
        const flip = prog(frame, at(T.signs) + delay, 8, EASE.snap);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 1200 + col * 52,
              top: 200 + row * 52,
              width: 44,
              height: 44,
              borderRadius: 8,
              backgroundColor: flip > 0.5 ? C.risk : "#2A4256",
              scale: `${1 - Math.sin(flip * Math.PI) * 0.25}`,
            }}
          />
        );
      })}

      {/* change b10 @219200-220610 ms, w666 "And" .. w673 "seriously" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 600, ...txt(44, FONT.body, C.neutral), ...rise(frame, at(T.andThats), 14, 20) }}>
        AND THAT&apos;S SOMETHING
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 665, ...txt(52, FONT.body, C.ivory), ...rise(frame, at(T.investors), 14, 20) }}>
        INVESTORS SHOULD TAKE
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 750,
          ...txt(170, FONT.head, C.risk),
          opacity: ser,
          scale: `${1.15 - ser * 0.15}`,
          transformOrigin: "0% 50%",
        }}
      >
        SERIOUSLY
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

const beatSeq = (b: { start: number; end: number }, last = false) => ({
  from: loc(b.start),
  durationInFrames: (last ? SCENE_5_DURATION : loc(b.end) + OVERLAP) - loc(b.start),
});

export const Scene5: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.midnight }}>
    <Audio
      src={staticFile(`${PUB}/stock-market.wav`)}
      trimBefore={f(SCENE_START)}
      trimAfter={f(SCENE_START) + SCENE_5_DURATION}
    />

    <Sequence name="b1 look beyond nvidia" {...beatSeq(T.b1)} premountFor={FPS}>
      <B1 />
    </Sequence>
    <Sequence name="b2 index is one tile" {...beatSeq(T.b2)} premountFor={FPS}>
      <B2 />
    </Sequence>
    <Sequence name="b3 big circles drag the result" {...beatSeq(T.b3)} premountFor={FPS}>
      <B3 />
    </Sequence>
    <Sequence name="b4 capital pours in" {...beatSeq(T.b4)} premountFor={FPS}>
      <B4 />
    </Sequence>
    <Sequence name="b5 warning sign" {...beatSeq(T.b5)} premountFor={FPS}>
      <B5 />
    </Sequence>
    <Sequence name="b6 weakness spreading" {...beatSeq(T.b6)} premountFor={FPS}>
      <B6 />
    </Sequence>
    <Sequence name="b7 breadth 20 percent" {...beatSeq(T.b7)} premountFor={FPS}>
      <B7 />
    </Sequence>
    <Sequence name="b8 above 50 day 43 percent" {...beatSeq(T.b8)} premountFor={FPS}>
      <B8 />
    </Sequence>
    <Sequence name="b9 no longer a few stocks" {...beatSeq(T.b9)} premountFor={FPS}>
      <B9 />
    </Sequence>
    <Sequence name="b10 broader stress" {...beatSeq(T.b10, true)} premountFor={FPS}>
      <B10 />
    </Sequence>

    {SFX.map((s) => (
      <Sequence key={s.at} name={`sfx ${s.file}`} from={loc(s.at)} durationInFrames={s.frames} layout="none">
        <Sfx file={s.file} frames={s.frames} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
