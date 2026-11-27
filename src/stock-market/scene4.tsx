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

const SCENE_START = 125700; // w384 "And"
const SCENE_END = 170360; // w509 "To" (Scene 5 starts here)
export const SCENE_4_DURATION = f(SCENE_END) - f(SCENE_START); // 1340 frames
const loc = (ms: number) => f(ms) - f(SCENE_START);

const T = {
  b1: { start: 125700, end: 128220 }, // w384 "And" .. w390 "problem"
  b2: { start: 128220, end: 133620 }, // w391 "Investors" .. w407 "happening"
  b3: { start: 133620, end: 145180 }, // w408 "Technology" .. w436 "models"
  b4: { start: 145180, end: 146960 }, // w437 "The" .. w440 "enormous"
  b5: { start: 146960, end: 153860 }, // w441 "But" .. w459 "things"
  b6: { start: 153860, end: 160010 }, // w460 "Investors" .. w477 "tomorrow"
  b7: { start: 160010, end: 163360 }, // w478 "And" .. w490 "story"
  b8: { start: 163360, end: 170360 }, // w491 "Is" .. w508 "opportunity"

  // b1
  facing: 126740, // w388 "facing"
  another: 127020, // w389 "another"
  problem: 127440, // w390 "problem"

  // b2
  beginning: 128770, // w393 "beginning"
  question: 129350, // w395 "question"
  economics: 129930, // w397 "economics"
  ai: 130690, // w401 "AI"
  think: 131520, // w403 "Think"
  happening: 132430, // w405 "what's"

  // b3
  committing: 133620, // w408 "Technology"
  enormousAmt: 134880, // w412 "enormous"
  toAi: 136160, // w417 "artificial"
  building: 137870, // w421 "building"
  dataCenters: 138280, // w422 "data"
  purchasing: 139160, // w424 "purchasing"
  chips: 139560, // w425 "advanced"
  expanding: 140640, // w427 "expanding"
  electricity: 140940, // w428 "electricity"
  competing: 142480, // w432 "competing"
  models: 144030, // w435 "powerful"

  // b4
  opportunity: 145240, // w438 "opportunity"
  enormous: 146130, // w440 "enormous"

  // b5
  but: 146960, // w441 "But"
  spending: 147240, // w442 "spending"
  billions: 147640, // w443 "billions"
  generating: 149440, // w449 "generating"
  attractive: 150000, // w451 "attractive"
  ret: 150420, // w452 "return"
  notEqual: 151920, // w455 "are"
  different: 152080, // w457 "completely"

  // b6
  investors: 153860, // w460
  demand: 154730, // w464
  evidence: 155020, // w465
  spent: 156000, // w469 "being"
  today: 156560, // w471 "today"
  translate: 157130, // w473 "translate"
  sustainable: 157950, // w475 "sustainable"
  profits: 158660, // w476 "profits"
  tomorrow: 159100, // w477 "tomorrow"

  // b7
  bringsUs: 160010, // w478 "And"
  mostImportant: 160980, // w484 "most"
  questionW: 161710, // w486 "question"
  entire: 162510, // w489 "entire"

  // b8
  isAi: 163360, // w491 "Is"
  losing: 165400, // w495 "losing"
  momentum: 165780, // w496 "momentum"
  or: 166320, // w497 "Or"
  simply: 167170, // w500 "simply"
  less: 167900, // w502 "less"
  same: 168510, // w506 "same"
  longTerm: 168740, // w507 "long"
};

/* whoosh accents: start ~100 ms before the beat they announce */
const SFX = [
  { at: 125700, file: "transition-smooth-whoosh", frames: 14 }, // scene handover
  { at: 133520, file: "whoosh-short", frames: 12 }, // b3 spend list
  { at: 146860, file: "whoosh-short", frames: 12 }, // b5 "But"
  { at: 159910, file: "transition-smooth-whoosh", frames: 14 }, // b7 key question
  { at: 166220, file: "whoosh-short", frames: 12 }, // b8 "Or"
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
/* Icons (viewBox 200 x 200)                                           */
/* ------------------------------------------------------------------ */

const ChipIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    {[70, 100, 130].map((p) => (
      <React.Fragment key={p}>
        <line x1={p} y1={14} x2={p} y2={44} stroke={C.steel} strokeWidth={8} strokeLinecap="round" />
        <line x1={p} y1={156} x2={p} y2={186} stroke={C.steel} strokeWidth={8} strokeLinecap="round" />
        <line x1={14} y1={p} x2={44} y2={p} stroke={C.steel} strokeWidth={8} strokeLinecap="round" />
        <line x1={156} y1={p} x2={186} y2={p} stroke={C.steel} strokeWidth={8} strokeLinecap="round" />
      </React.Fragment>
    ))}
    <rect x={40} y={40} width={120} height={120} rx={16} fill={C.steel} />
    <rect x={68} y={68} width={64} height={64} rx={8} fill={C.slate} />
  </svg>
);

const ServerIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    {[28, 78, 128].map((y) => (
      <React.Fragment key={y}>
        <rect x={24} y={y} width={152} height={44} rx={8} fill={C.steel} />
        <circle cx={52} cy={y + 22} r={7} fill={C.ivory} />
        <circle cx={78} cy={y + 22} r={7} fill={C.ivory} />
        <rect x={110} y={y + 17} width={50} height={10} rx={5} fill={C.slate} />
      </React.Fragment>
    ))}
  </svg>
);

const BoltIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <polygon points="116,14 48,112 92,112 78,186 152,84 106,84" fill={C.ivory} />
  </svg>
);

const ModelIcon: React.FC<{ size: number }> = ({ size }) => {
  const nodes: Array<[number, number]> = [
    [44, 56],
    [44, 144],
    [100, 100],
    [156, 56],
    [156, 144],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      {nodes.map(([x1, y1], i) =>
        nodes.map(([x2, y2], j) =>
          j > i && (i === 2 || j === 2) ? (
            <line key={`${i}-${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.steel} strokeWidth={5} />
          ) : null,
        ),
      )}
      {nodes.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={16} fill={C.ivory} />
      ))}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* b1  typography-led: "Nvidia was already facing another problem"    */
/* ------------------------------------------------------------------ */

const B1: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b1.start);

  // change b1 @127020 ms, w389 "another": headline slams in
  const p = prog(frame, at(T.another), 12, EASE.snap);
  const bar = prog(frame, at(T.problem), 16, EASE.snap);

  return (
    <BeatBg color={C.midnight}>
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse 55% 45% at 30% 70%, ${C.risk}44, transparent 70%)` }}
      />
      <div style={{ position: "absolute", left: SAFE_X, top: 340, display: "flex", gap: 22, ...txt(56, FONT.body, C.neutral, { letterSpacing: "0.12em" }) }}>
        <span style={slideIn(frame, 0)}>AND NVIDIA WAS</span>
        <span style={slideIn(frame, at(T.facing))}>ALREADY FACING</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 430,
          ...txt(170, FONT.head, C.ivory),
          opacity: p,
          scale: `${1.12 - p * 0.12}`,
          transformOrigin: "0% 50%",
        }}
      >
        ANOTHER
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 610, ...txt(170, FONT.head, C.risk), ...slideIn(frame, at(T.problem), 14, 80) }}>
        PROBLEM
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 820,
          width: 1000,
          height: 10,
          backgroundColor: C.risk,
          transformOrigin: "0% 50%",
          scale: `${bar} 1`,
        }}
      />
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b2  typography-led: investors question the economics of AI          */
/* ------------------------------------------------------------------ */

const B2: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b2.start);

  // change b2 @129350 ms, w395 "question": question badge pops
  const badge = prog(frame, at(T.question), 10, EASE.snap);
  // change b2 @130690 ms, w401 "AI": chip appears
  const chip = prog(frame, at(T.ai), 18, EASE.snap);

  return (
    <BeatBg color={C.ivory}>
      <div style={{ position: "absolute", left: SAFE_X, top: 110, ...txt(130, FONT.head, C.midnight), ...slideIn(frame, 0, 16, 80) }}>
        INVESTORS
      </div>
      {/* change b2 @128770 ms, w393 "beginning" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 250, ...txt(130, FONT.head, C.risk), ...slideIn(frame, at(T.beginning), 16, 80) }}>
        BEGAN TO QUESTION
      </div>
      {/* change b2 @129930 ms, w397 "economics" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 420, ...txt(52, FONT.body, C.slate), ...rise(frame, at(T.economics), 16, 24) }}>
        THE ECONOMICS OF THE AI BOOM ITSELF
      </div>
      {/* change b2 @131520 ms, w403 "Think" and @132430 ms, w405 "what's" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 760, ...txt(70, FONT.head, C.slate), ...rise(frame, at(T.think), 16, 24) }}>
        THINK ABOUT
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 850, ...txt(70, FONT.head, C.midnight), ...rise(frame, at(T.happening), 16, 24) }}>
        WHAT&apos;S HAPPENING
      </div>

      <div style={{ position: "absolute", left: 1380, top: 560, opacity: chip, scale: `${0.7 + chip * 0.3}` }}>
        <ChipIcon size={360} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 1580,
          top: 300,
          width: 180,
          height: 180,
          borderRadius: 180,
          backgroundColor: C.analysis,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: badge,
          scale: `${1.5 - badge * 0.5}`,
          ...txt(130, FONT.head, C.ivory),
        }}
      >
        ?
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b3  data-viz style: four things the money is going into             */
/* ------------------------------------------------------------------ */

const TILES = [
  { x: 96, verb: "BUILDING", verbMs: T.building, label: ["DATA", "CENTERS"], ms: T.dataCenters, icon: "server" },
  { x: 542, verb: "PURCHASING", verbMs: T.purchasing, label: ["ADVANCED", "CHIPS"], ms: T.chips, icon: "chip" },
  { x: 988, verb: "EXPANDING", verbMs: T.expanding, label: ["ELECTRICITY", "INFRASTRUCTURE"], ms: T.electricity, icon: "bolt" },
  { x: 1434, verb: "COMPETING TO DEVELOP", verbMs: T.competing, label: ["POWERFUL", "MODELS"], ms: T.models, icon: "model" },
] as const;

const B3: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b3.start);

  const TILE_Y = 500;

  return (
    <BeatBg color={C.midnight}>
      <div style={{ position: "absolute", left: SAFE_X, top: 80, ...txt(40, FONT.body, C.neutral, { letterSpacing: "0.1em" }), ...rise(frame, 0, 16, 20) }}>
        TECHNOLOGY COMPANIES ARE COMMITTING
      </div>
      {/* change b3 @134880 ms, w412 "enormous" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 140, ...txt(90, FONT.head, C.ivory), ...slideIn(frame, at(T.enormousAmt), 16, 80) }}>
        ENORMOUS AMOUNTS OF MONEY
      </div>
      {/* change b3 @136160 ms, w417 "artificial" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 260, ...txt(48, FONT.body, C.neutral), ...rise(frame, at(T.toAi), 16, 20) }}>
        TO ARTIFICIAL INTELLIGENCE
      </div>

      {TILES.map((t) => {
        const p = prog(frame, at(t.ms), 16, EASE.snap);
        // a gold coin drops from the header into each tile as its word is spoken
        const drop = prog(frame, at(t.ms) - 8, 10, EASE.inOut);
        const coinOut = prog(frame, at(t.ms) + 2, 8, EASE.linear);
        return (
          <React.Fragment key={t.x}>
            <div style={{ position: "absolute", left: t.x, top: TILE_Y - 56, ...txt(30, FONT.body, C.neutral, { letterSpacing: "0.08em" }), ...rise(frame, at(t.verbMs), 12, 14) }}>
              {t.verb}
            </div>
            <div
              style={{
                position: "absolute",
                left: t.x + 177,
                top: 350,
                width: 36,
                height: 36,
                borderRadius: 36,
                backgroundColor: C.gold,
                opacity: drop > 0 ? 1 - coinOut : 0,
                translate: `0px ${drop * (TILE_Y - 350)}px`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: t.x,
                top: TILE_Y,
                width: 390,
                height: 440,
                borderRadius: 24,
                backgroundColor: C.slate,
                opacity: p,
                translate: `0px ${(1 - p) * 60}px`,
              }}
            >
              <div style={{ position: "absolute", left: 95, top: 40 }}>
                {t.icon === "server" ? <ServerIcon size={200} /> : null}
                {t.icon === "chip" ? <ChipIcon size={200} /> : null}
                {t.icon === "bolt" ? <BoltIcon size={200} /> : null}
                {t.icon === "model" ? <ModelIcon size={200} /> : null}
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", ...txt(44, FONT.head, C.ivory), lineHeight: 1.15 }}>
                {t.label.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b4  typography-led: "The opportunity is enormous"                   */
/* ------------------------------------------------------------------ */

const B4: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b4.start);

  // change b4 @146130 ms, w440 "enormous": gold word slams in
  const p = prog(frame, at(T.enormous), 10, EASE.snap);

  return (
    <BeatBg color={C.slate}>
      <div style={{ position: "absolute", left: SAFE_X, top: 300, ...txt(140, FONT.head, C.ivory), ...slideIn(frame, 0, 16, 80) }}>
        THE OPPORTUNITY IS
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 470,
          ...txt(230, FONT.head, C.gold),
          opacity: p,
          scale: `${1.15 - p * 0.15}`,
          transformOrigin: "0% 50%",
        }}
      >
        ENORMOUS
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b5  comparison: spending is not the same as return                  */
/* ------------------------------------------------------------------ */

const B5: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b5.start);

  // change b5 @151920 ms, w455 "are": the not-equal sign pops between the two cards
  const ne = prog(frame, at(T.notEqual), 10, EASE.snap);
  // change b5 @150420 ms, w452 "return": the empty return box shows its question mark
  const q = prog(frame, at(T.ret), 12, EASE.snap);

  return (
    <BeatBg color={C.ivory}>
      <div style={{ position: "absolute", left: SAFE_X, top: 70, ...txt(60, FONT.head, C.risk), ...slideIn(frame, 0, 16, 60) }}>
        BUT
      </div>

      {/* spending card */}
      <div style={{ position: "absolute", left: 96, top: 180, width: 800, height: 640, borderRadius: 28, backgroundColor: C.slate }}>
        {/* change b5 @147240 ms, w442 "spending" */}
        <div style={{ position: "absolute", left: 48, top: 44, ...txt(84, FONT.head, C.ivory), ...rise(frame, at(T.spending), 14, 24) }}>
          SPENDING
        </div>
        {/* change b5 @147640 ms, w443 "billions" */}
        <div style={{ position: "absolute", left: 48, top: 150, ...txt(34, FONT.body, C.neutral), ...rise(frame, at(T.billions), 14, 20) }}>
          BILLIONS ON AI INFRASTRUCTURE
        </div>
        {Array.from({ length: 6 }).map((_, i) => {
          const p = prog(frame, at(T.billions) + i * 5, 8, EASE.snap);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 400 - 110,
                top: 560 - i * 44,
                width: 220,
                height: 44,
                borderRadius: 22,
                backgroundColor: C.gold,
                border: `4px solid ${C.slate}`,
                boxSizing: "border-box",
                opacity: p,
                translate: `0px ${(1 - p) * -60}px`,
              }}
            />
          );
        })}
      </div>

      {/* return card */}
      <div style={{ position: "absolute", left: 1024, top: 180, width: 800, height: 640, borderRadius: 28, backgroundColor: C.slate }}>
        {/* change b5 @149440 ms, w449 "generating" */}
        <div style={{ position: "absolute", left: 48, top: 44, ...txt(84, FONT.head, C.ivory), ...rise(frame, at(T.generating), 14, 24) }}>
          RETURN
        </div>
        {/* change b5 @150000 ms, w451 "attractive" */}
        <div style={{ position: "absolute", left: 48, top: 150, ...txt(34, FONT.body, C.neutral), ...rise(frame, at(T.attractive), 14, 20) }}>
          ATTRACTIVE RETURN ON THAT INVESTMENT
        </div>
        <div
          style={{
            position: "absolute",
            left: 200,
            top: 270,
            width: 400,
            height: 310,
            borderRadius: 24,
            border: `6px dashed ${C.neutral}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: q,
            ...txt(200, FONT.head, C.analysis),
          }}
        >
          ?
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 880,
          top: 380,
          width: 160,
          textAlign: "center",
          ...txt(200, FONT.data, C.risk),
          opacity: ne,
          scale: `${1.6 - ne * 0.6}`,
        }}
      >
        {"\u2260"}
      </div>

      {/* change b5 @152080 ms, w457 "completely" */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 890, textAlign: "center", ...txt(64, FONT.head, C.midnight), ...rise(frame, at(T.different), 14, 24) }}>
        TWO COMPLETELY DIFFERENT THINGS
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b6  timeline: evidence that today's spend becomes tomorrow's profit */
/* ------------------------------------------------------------------ */

const B6: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b6.start);

  const LINE_Y = 640;
  const AX = 300;
  const BX = 1620;
  // change b6 @157130-158660 ms, w473 "translate" .. w476 "profits": the arrow draws from today to tomorrow
  const arrow = prog(frame, at(T.translate), at(T.profits) - at(T.translate), EASE.inOut);
  const nodeA = prog(frame, at(T.spent), 14, EASE.snap);
  const nodeB = prog(frame, at(T.sustainable), 14, EASE.snap);

  return (
    <BeatBg color={C.midnight}>
      <div style={{ position: "absolute", left: SAFE_X, top: 100, ...txt(100, FONT.head, C.ivory), ...slideIn(frame, 0, 16, 80) }}>
        INVESTORS DEMAND
      </div>
      {/* change b6 @155020 ms, w465 "evidence" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 220, ...txt(150, FONT.head, C.analysis), ...slideIn(frame, at(T.evidence), 16, 80) }}>
        EVIDENCE
      </div>

      {/* today node */}
      <div
        style={{
          position: "absolute",
          left: AX - 60,
          top: LINE_Y - 60,
          width: 120,
          height: 120,
          borderRadius: 120,
          backgroundColor: C.gold,
          opacity: nodeA,
          scale: `${0.5 + nodeA * 0.5}`,
        }}
      />
      <div style={{ position: "absolute", left: AX - 200, top: LINE_Y + 90, width: 400, textAlign: "center", ...txt(40, FONT.body, C.neutral), ...rise(frame, at(T.spent), 14, 16) }}>
        MONEY BEING SPENT
      </div>
      {/* change b6 @156560 ms, w471 "today" */}
      <div style={{ position: "absolute", left: AX - 200, top: LINE_Y + 150, width: 400, textAlign: "center", ...txt(64, FONT.head, C.ivory), ...rise(frame, at(T.today), 14, 20) }}>
        TODAY
      </div>

      {/* arrow */}
      <div
        style={{
          position: "absolute",
          left: AX + 90,
          top: LINE_Y - 4,
          width: BX - AX - 180,
          height: 8,
          backgroundColor: C.neutral,
          transformOrigin: "0% 50%",
          scale: `${arrow} 1`,
        }}
      />

      {/* tomorrow node */}
      <div
        style={{
          position: "absolute",
          left: BX - 60,
          top: LINE_Y - 60,
          width: 120,
          height: 120,
          borderRadius: 120,
          backgroundColor: C.growth,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: nodeB,
          scale: `${0.5 + nodeB * 0.5}`,
          ...txt(72, FONT.head, C.ivory),
        }}
      >
        {"\u2191"}
      </div>
      <div style={{ position: "absolute", left: BX - 260, top: LINE_Y + 90, width: 520, textAlign: "center", ...txt(40, FONT.body, C.neutral), ...rise(frame, at(T.sustainable), 14, 16) }}>
        SUSTAINABLE PROFITS
      </div>
      {/* change b6 @159100 ms, w477 "tomorrow" */}
      <div style={{ position: "absolute", left: BX - 260, top: LINE_Y + 150, width: 520, textAlign: "center", ...txt(64, FONT.head, C.ivory), ...rise(frame, at(T.tomorrow), 14, 20) }}>
        TOMORROW
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b7  typography-led: the most important question                     */
/* ------------------------------------------------------------------ */

const B7: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b7.start);

  // change b7 @161710 ms, w486 "question": word slams in
  const p = prog(frame, at(T.questionW), 10, EASE.snap);

  return (
    <BeatBg color={C.slate}>
      <div style={{ position: "absolute", left: SAFE_X, top: 170, ...txt(48, FONT.body, C.neutral, { letterSpacing: "0.1em" }), ...slideIn(frame, 0) }}>
        AND THAT BRINGS US TO
      </div>
      {/* change b7 @160980 ms, w484 "most" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 260, ...txt(120, FONT.head, C.ivory), ...rise(frame, at(T.mostImportant), 16, 30) }}>
        THE MOST IMPORTANT
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 400,
          ...txt(220, FONT.head, C.analysis),
          opacity: p,
          scale: `${1.15 - p * 0.15}`,
          transformOrigin: "0% 50%",
        }}
      >
        QUESTION
      </div>
      {/* change b7 @162510 ms, w489 "entire" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 700, ...txt(56, FONT.body, C.neutral), ...rise(frame, at(T.entire), 16, 24) }}>
        IN THIS ENTIRE STORY
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b8  split screen: losing momentum, or the same opportunity cheaper? */
/* ------------------------------------------------------------------ */

const B8: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b8.start);

  // change b8 @166320 ms, w497 "Or": the right panel wipes in from the right edge
  const wipe = prog(frame, at(T.or), 16, EASE.snap);
  // change b8 @165780 ms, w496 "momentum": the down arrow lands
  const arrow = prog(frame, at(T.momentum), 14, EASE.snap);
  // change b8 @167900 ms, w502 "less": the price tag drops
  const tag = prog(frame, at(T.less), 14, EASE.snap);

  const rightLines = [
    { t: "OR ARE INVESTORS", ms: T.or },
    { t: "SIMPLY PAYING LESS", ms: T.simply },
    { t: "FOR THE SAME", ms: T.same - 360 },
    { t: "LONG-TERM OPPORTUNITY?", ms: T.longTerm },
  ];

  return (
    <BeatBg color={C.midnight}>
      {/* left panel */}
      <div style={{ position: "absolute", left: 96, top: 160, width: 840, height: 760, borderRadius: 28, backgroundColor: C.risk }}>
        <div style={{ position: "absolute", left: 40, top: 70, ...txt(60, FONT.head, C.ivory), ...slideIn(frame, 0, 16, 60) }}>
          IS AI ACTUALLY
        </div>
        {/* change b8 @165400 ms, w495 "losing" */}
        <div style={{ position: "absolute", left: 40, top: 150, ...txt(60, FONT.head, C.ivory), ...slideIn(frame, at(T.losing), 16, 60) }}>
          LOSING MOMENTUM?
        </div>
        <svg
          width={260}
          height={260}
          viewBox="0 0 300 300"
          style={{ position: "absolute", left: 290, top: 380, opacity: arrow, translate: `0px ${(1 - arrow) * -80}px` }}
        >
          <polygon points="150,270 270,130 190,130 190,30 110,30 110,130 30,130" fill={C.ivory} />
        </svg>
      </div>

      {/* right panel */}
      <div
        style={{
          position: "absolute",
          left: 984,
          top: 160,
          width: 840,
          height: 760,
          borderRadius: 28,
          backgroundColor: C.steel,
          clipPath: `inset(0 0 0 ${(1 - wipe) * 100}%)`,
        }}
      >
        {rightLines.map((l, i) => (
          <div key={l.t} style={{ position: "absolute", left: 40, top: 70 + i * 80, ...txt(52, FONT.head, C.ivory), ...rise(frame, at(l.ms), 14, 20) }}>
            {l.t}
          </div>
        ))}
        <svg
          width={260}
          height={260}
          viewBox="0 0 200 200"
          style={{ position: "absolute", left: 290, top: 420, opacity: tag, translate: `0px ${(1 - tag) * -80}px` }}
        >
          <polygon points="30,40 130,40 182,100 130,160 30,160" fill={C.ivory} />
          <circle cx={62} cy={100} r={13} fill={C.steel} />
          <rect x={86} y={92} width={50} height={16} rx={8} fill={C.steel} />
        </svg>
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

const beatSeq = (b: { start: number; end: number }, last = false) => ({
  from: loc(b.start),
  durationInFrames: (last ? SCENE_4_DURATION : loc(b.end) + OVERLAP) - loc(b.start),
});

export const Scene4: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.midnight }}>
    <Audio
      src={staticFile(`${PUB}/stock-market.wav`)}
      trimBefore={f(SCENE_START)}
      trimAfter={f(SCENE_START) + SCENE_4_DURATION}
    />

    <Sequence name="b1 another problem" {...beatSeq(T.b1)} premountFor={FPS}>
      <B1 />
    </Sequence>
    <Sequence name="b2 question the economics" {...beatSeq(T.b2)} premountFor={FPS}>
      <B2 />
    </Sequence>
    <Sequence name="b3 where the money goes" {...beatSeq(T.b3)} premountFor={FPS}>
      <B3 />
    </Sequence>
    <Sequence name="b4 opportunity enormous" {...beatSeq(T.b4)} premountFor={FPS}>
      <B4 />
    </Sequence>
    <Sequence name="b5 spending is not return" {...beatSeq(T.b5)} premountFor={FPS}>
      <B5 />
    </Sequence>
    <Sequence name="b6 evidence timeline" {...beatSeq(T.b6)} premountFor={FPS}>
      <B6 />
    </Sequence>
    <Sequence name="b7 most important question" {...beatSeq(T.b7)} premountFor={FPS}>
      <B7 />
    </Sequence>
    <Sequence name="b8 two explanations" {...beatSeq(T.b8, true)} premountFor={FPS}>
      <B8 />
    </Sequence>

    {SFX.map((s) => (
      <Sequence key={s.at} name={`sfx ${s.file}`} from={loc(s.at)} durationInFrames={s.frames} layout="none">
        <Sfx file={s.file} frames={s.frames} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
