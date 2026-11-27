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

const SCENE_START = 98290; // w308 "So"
const SCENE_END = 125700; // w384 "And" (Scene 4 starts here)
export const SCENE_3_DURATION = f(SCENE_END) - f(SCENE_START); // 822 frames
const loc = (ms: number) => f(ms) - f(SCENE_START);

const T = {
  b1: { start: 98290, end: 102410 }, // w308 "So" .. w316 "Washington"
  b2: { start: 102410, end: 108240 }, // w317 "Reuters" .. w335 "Nvidia"
  b3: { start: 108240, end: 113700 }, // w336 "Now" .. w344 "wrongdoing"
  b4: { start: 113700, end: 118270 }, // w345 "No" .. w360 "investigation"
  b5: { start: 118270, end: 125700 }, // w361 "But" .. w383 "selling"

  // b1
  whatChanged: 98310, // w309 "what"
  oneMajor: 99280, // w311 "One"
  cameFrom: 100680, // w314 "came"
  washington: 101270, // w316 "Washington"

  // b2
  reuters: 102410, // w317
  enforcement: 103280, // w320
  sec: 104350, // w324 "Securities"
  secEnd: 105360, // w327 "Commission"
  examining: 105960, // w329
  potential: 106410, // w330
  accounting: 106860, // w331
  nvidia: 107660, // w334 "at"/"Nvidia" 107760

  // b3
  distinction: 108960, // w337
  investigation: 110990, // w340
  doesNot: 111700, // w341 "does"
  wrongdoing: 112730, // w344

  // b4
  noConclusion: 113700, // w345 "No"
  conduct: 114230, // w347 "about"
  conductBox: 114680, // w349 "company"
  shouldBe: 115520, // w353 "should"
  drawn: 115760, // w355 "drawn"
  existence: 116400, // w359 "existence"
  invBox: 117100, // w360 "investigation"

  // b5
  nervousLead: 118270, // w361 "But"
  nervous: 119820, // w366 "nervous"
  fall: 120630, // w367 "even uncertainty"
  important: 121760, // w370 "one"
  catalyst: 124260, // w380 "catalyst"
  selling: 124890, // w382 "selling"
};

/* whoosh accents: start ~100 ms before the beat they announce */
const SFX = [
  { at: 98290, file: "transition-smooth-whoosh", frames: 14 }, // scene handover
  { at: 102310, file: "whoosh-short", frames: 12 }, // b2 Reuters report
  { at: 108140, file: "whoosh-short", frames: 12 }, // b3 "Now, this distinction"
  { at: 118170, file: "transition-smooth-whoosh", frames: 14 }, // b5 "But"
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
/* b1  typography-led: "So what changed? ... from Washington"          */
/* ------------------------------------------------------------------ */

const B1: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b1.start);

  // change b1 @98310 ms, w309 "what": headline mask-wipes in
  const wipe = prog(frame, at(T.whatChanged), 18, EASE.snap);
  // change b1 @101270 ms, w316 "Washington": word wipes in, obelisk rises
  const wash = prog(frame, at(T.washington), 16, EASE.snap);
  const obelisk = prog(frame, at(T.washington), 22);

  return (
    <BeatBg color={C.midnight}>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 190,
          ...txt(190, FONT.head, C.ivory),
          clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
        }}
      >
        WHAT CHANGED?
      </div>
      {/* change b1 @99280 ms, w311 "One" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 500, ...txt(60, FONT.body, C.neutral), ...rise(frame, at(T.oneMajor), 16, 24) }}>
        ONE MAJOR DEVELOPMENT
      </div>
      {/* change b1 @100680 ms, w314 "came" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 590, ...txt(60, FONT.body, C.neutral), ...rise(frame, at(T.cameFrom), 16, 24) }}>
        CAME FROM
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 670,
          ...txt(150, FONT.head, C.ivory),
          clipPath: `inset(0 ${(1 - wash) * 100}% 0 0)`,
        }}
      >
        WASHINGTON
      </div>

      <svg
        width={170}
        height={560}
        viewBox="0 0 200 600"
        style={{ position: "absolute", left: 1600, top: 420, opacity: obelisk, translate: `0px ${(1 - obelisk) * 120}px` }}
      >
        <polygon points="100,10 122,72 78,72" fill={C.ivory} />
        <polygon points="78,72 122,72 132,500 68,500" fill={C.neutral} />
        <rect x={40} y={500} width={120} height={36} fill={C.neutral} />
        <rect x={16} y={536} width={168} height={32} fill={C.ivory} />
      </svg>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b2  data-viz style: the report chain and the accounting document    */
/* ------------------------------------------------------------------ */

const B2: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b2.start);

  // change b2 @105960 ms, w329 "examining": document appears, magnifier slides over it
  const doc = prog(frame, at(T.examining), 18, EASE.snap);
  const mag = prog(frame, at(T.examining), 22, EASE.reveal);
  const drift = Math.sin(frame * 0.12) * 14 * mag;
  // change b2 @106860 ms, w331 "accounting": two lines of the document flag
  const flag = prog(frame, at(T.accounting), 10, EASE.snap);
  // change b2 @107660 ms, w334 "at": document header names the company
  const head = prog(frame, at(T.nvidia), 12, EASE.snap);

  const chips = [
    { y: 150, h: 120, ms: T.reuters, main: "REUTERS REPORTED", sub: null },
    { y: 330, h: 120, ms: T.enforcement, main: "ENFORCEMENT STAFF", sub: null },
    { y: 510, h: 150, ms: T.sec, main: "SEC", sub: "SECURITIES AND EXCHANGE COMMISSION" },
  ];
  const lineWidths = [560, 620, 480, 600, 540, 420, 580];
  const flagged = [2, 4];

  return (
    <BeatBg color={C.ivory}>
      {chips.map((c, i) => (
        <React.Fragment key={c.main}>
          <div
            style={{
              position: "absolute",
              left: SAFE_X,
              top: c.y,
              width: 780,
              height: c.h,
              borderRadius: 20,
              backgroundColor: C.slate,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 36,
              gap: 6,
              ...slideIn(frame, at(c.ms), 16, 80),
            }}
          >
            <div style={txt(c.sub ? 56 : 44, c.sub ? FONT.head : FONT.body, C.ivory)}>{c.main}</div>
            {c.sub ? <div style={txt(28, FONT.body, C.neutral)}>{c.sub}</div> : null}
          </div>
          {i < chips.length - 1 ? (
            <div
              style={{
                position: "absolute",
                left: SAFE_X + 60,
                top: c.y + c.h,
                width: 6,
                height: 60,
                backgroundColor: C.steel,
                transformOrigin: "50% 0%",
                scale: `1 ${prog(frame, at(chips[i + 1]?.ms ?? c.ms) - 4, 10, EASE.snap)}`,
              }}
            />
          ) : null}
        </React.Fragment>
      ))}

      <div style={{ position: "absolute", left: SAFE_X, top: 730, ...txt(52, FONT.head, C.slate), ...rise(frame, at(T.examining), 14, 20) }}>
        EXAMINING
      </div>
      <div style={{ position: "absolute", left: SAFE_X, top: 805, ...txt(52, FONT.head, C.risk), ...rise(frame, at(T.potential), 14, 20) }}>
        POTENTIAL ACCOUNTING ISSUES
      </div>

      {/* document */}
      <div
        style={{
          position: "absolute",
          left: 1000,
          top: 130,
          width: 760,
          height: 800,
          borderRadius: 24,
          backgroundColor: C.white,
          boxShadow: "0 24px 60px rgba(16,24,32,0.18)",
          overflow: "hidden",
          opacity: doc,
          translate: `0px ${(1 - doc) * 80}px`,
        }}
      >
        <div style={{ height: 130, backgroundColor: C.slate, display: "flex", alignItems: "center", paddingLeft: 40 }}>
          <div style={{ ...txt(60, FONT.head, C.ivory), opacity: head }}>NVIDIA</div>
        </div>
        {lineWidths.map((w, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 40,
              top: 190 + i * 76,
              width: w,
              height: 26,
              borderRadius: 13,
              backgroundColor: flagged.indexOf(i) !== -1 && flag > 0.5 ? C.risk : "rgba(16,24,32,0.14)",
            }}
          />
        ))}
      </div>

      {/* magnifier */}
      <svg
        width={420}
        height={420}
        viewBox="0 0 420 420"
        style={{
          position: "absolute",
          left: 1180,
          top: 300,
          opacity: mag,
          translate: `${(1 - mag) * 360 + drift}px ${(1 - mag) * 200 + drift * 0.5}px`,
        }}
      >
        <circle cx={170} cy={170} r={120} fill="rgba(71,127,168,0.12)" stroke={C.midnight} strokeWidth={16} />
        <line x1={255} y1={255} x2={380} y2={380} stroke={C.midnight} strokeWidth={26} strokeLinecap="round" />
      </svg>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b3  typography-led: investigation does not equal wrongdoing         */
/* ------------------------------------------------------------------ */

const B3: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b3.start);

  // change b3 @111700 ms, w341 "does": the not-equal sign pops in
  const ne = prog(frame, at(T.doesNot), 10, EASE.snap);

  return (
    <BeatBg color={C.slate}>
      {/* change b3 @108960 ms, w337 "this distinction matters" */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", ...txt(48, FONT.body, C.neutral, { letterSpacing: "0.12em" }), ...rise(frame, at(T.distinction), 16, 20) }}>
        THIS DISTINCTION MATTERS
      </div>
      {/* change b3 @110990 ms, w340 "investigation" */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", ...txt(130, FONT.head, C.ivory), ...rise(frame, at(T.investigation), 16, 40) }}>
        INVESTIGATION
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 470,
          textAlign: "center",
          ...txt(200, FONT.data, C.risk),
          opacity: ne,
          scale: `${1.5 - ne * 0.5}`,
        }}
      >
        {"\u2260"}
      </div>
      {/* change b3 @112730 ms, w344 "wrongdoing" */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", ...txt(130, FONT.head, C.ivory), ...rise(frame, at(T.wrongdoing), 16, 40) }}>
        WRONGDOING
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b4  diagram: no conclusion about conduct from an investigation      */
/* ------------------------------------------------------------------ */

const B4: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b4.start);

  const BOX_Y = 640;
  // change b4 @115760 ms, w355 "drawn": blocker lands mid-link
  const block = prog(frame, at(T.drawn), 10, EASE.snap);
  // change b4 @116400-117100 ms, w359 "existence" .. w360 "investigation": dashed link draws from the investigation box and stops at the blocker
  const link = prog(frame, at(T.existence), 18, EASE.snap);

  return (
    <BeatBg color={C.midnight}>
      {/* change b4 @113700 ms, w345 "No" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 120, ...txt(130, FONT.head, C.ivory), ...slideIn(frame, 0, 16, 80) }}>
        NO CONCLUSION
      </div>
      {/* change b4 @114230 ms, w347 "about" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 290, ...txt(56, FONT.body, C.neutral), ...rise(frame, at(T.conduct), 16, 24) }}>
        ABOUT THE COMPANY&apos;S CONDUCT
      </div>
      {/* change b4 @115520 ms, w353 "should" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 370, ...txt(44, FONT.body, C.neutral), ...rise(frame, at(T.shouldBe), 16, 24) }}>
        SHOULD BE DRAWN FROM THE EXISTENCE OF AN INVESTIGATION
      </div>

      {/* boxes */}
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: BOX_Y,
          width: 560,
          height: 190,
          borderRadius: 20,
          border: `5px solid ${C.neutral}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...txt(48, FONT.head, C.ivory),
          ...rise(frame, at(T.conductBox), 16, 30),
        }}
      >
        COMPANY&apos;S CONDUCT
      </div>
      <div
        style={{
          position: "absolute",
          left: 1920 - SAFE_X - 560,
          top: BOX_Y,
          width: 560,
          height: 190,
          borderRadius: 20,
          backgroundColor: C.steel,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...txt(48, FONT.head, C.ivory),
          ...rise(frame, at(T.existence), 16, 30),
        }}
      >
        INVESTIGATION
      </div>

      {/* link: from the right box leftward, stopped by the blocker at x = 960 */}
      <div
        style={{
          position: "absolute",
          left: 960,
          top: BOX_Y + 95 - 3,
          width: 1920 - SAFE_X - 560 - 960,
          height: 0,
          borderTop: `6px dashed ${C.neutral}`,
          transformOrigin: "100% 50%",
          scale: `${link} 1`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 960 - 55,
          top: BOX_Y + 95 - 55,
          width: 110,
          height: 110,
          borderRadius: 110,
          backgroundColor: C.risk,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: block,
          scale: `${1.6 - block * 0.6}`,
          ...txt(72, FONT.head, C.ivory),
        }}
      >
        {"\u2715"}
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* b5  visual metaphor: uncertainty tips the dominoes into selling     */
/* ------------------------------------------------------------------ */

const DOMINOES = Array.from({ length: 9 }).map((_, i) => ({
  i,
  x: 190 + i * 160,
  w: i === 0 ? 96 : 64,
  h: i === 0 ? 320 : 220,
  ms: T.fall + i * 300,
}));

const B5: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (ms: number) => f(ms) - f(T.b5.start);

  const BASE = 770;
  // change b5 @119820 ms, w366 "nervous": word slams in and shakes
  const nerv = prog(frame, at(T.nervous), 8, EASE.snap);
  const shake = Math.sin(frame * 1.6) * 6 * (1 - prog(frame, at(T.nervous) + 8, 20, EASE.linear));

  return (
    <BeatBg color={C.ivory}>
      {/* change b5 @118270 ms, w361 "But" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 80, ...txt(84, FONT.head, C.midnight), ...slideIn(frame, 0, 16, 80) }}>
        BUT WHEN INVESTORS ARE ALREADY
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE_X,
          top: 180,
          ...txt(130, FONT.head, C.risk),
          opacity: nerv,
          scale: `${1.15 - nerv * 0.15}`,
          transformOrigin: "0% 50%",
          translate: `${shake}px 0px`,
        }}
      >
        NERVOUS
      </div>

      {/* change b5 @120630 ms, w367 "even uncertainty": dominoes tip one by one, 300 ms apart */}
      <div style={{ position: "absolute", left: 96, top: BASE, width: 1728, height: 4, backgroundColor: "rgba(16,24,32,0.3)" }} />
      {DOMINOES.map((d) => {
        const p = prog(frame, at(d.ms), 12, EASE.snap);
        return (
          <div
            key={d.i}
            style={{
              position: "absolute",
              left: d.x,
              top: BASE - d.h,
              width: d.w,
              height: d.h,
              borderRadius: 8,
              backgroundColor: p > 0.5 ? C.risk : d.i === 0 ? C.steel : C.midnight,
              transformOrigin: "100% 100%",
              rotate: `${p * 78}deg`,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: 190, top: BASE - 320 - 52, ...txt(36, FONT.body, C.slate), ...rise(frame, at(T.fall), 12, 14) }}>
        UNCERTAINTY
      </div>
      {/* change b5 @121760 ms, w370 "one of the market's most important companies" */}
      <div style={{ position: "absolute", left: 190, top: BASE + 28, ...txt(32, FONT.body, C.slate), ...rise(frame, at(T.important), 14, 14) }}>
        ONE OF THE MARKET&apos;S MOST IMPORTANT COMPANIES
      </div>

      {/* change b5 @124260 ms, w380 "catalyst" .. w382 "selling" */}
      <div style={{ position: "absolute", left: SAFE_X, top: 880, display: "flex", gap: 28, ...txt(110, FONT.head, C.risk) }}>
        <span style={rise(frame, at(T.catalyst), 12, 24)}>A CATALYST FOR</span>
        <span style={rise(frame, at(T.selling), 12, 24)}>SELLING</span>
      </div>
    </BeatBg>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

const beatSeq = (b: { start: number; end: number }, last = false) => ({
  from: loc(b.start),
  durationInFrames: (last ? SCENE_3_DURATION : loc(b.end) + OVERLAP) - loc(b.start),
});

export const Scene3: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.midnight }}>
    <Audio
      src={staticFile(`${PUB}/stock-market.wav`)}
      trimBefore={f(SCENE_START)}
      trimAfter={f(SCENE_START) + SCENE_3_DURATION}
    />

    <Sequence name="b1 what changed" {...beatSeq(T.b1)} premountFor={FPS}>
      <B1 />
    </Sequence>
    <Sequence name="b2 sec report" {...beatSeq(T.b2)} premountFor={FPS}>
      <B2 />
    </Sequence>
    <Sequence name="b3 investigation is not wrongdoing" {...beatSeq(T.b3)} premountFor={FPS}>
      <B3 />
    </Sequence>
    <Sequence name="b4 no conclusion" {...beatSeq(T.b4)} premountFor={FPS}>
      <B4 />
    </Sequence>
    <Sequence name="b5 uncertainty dominoes" {...beatSeq(T.b5, true)} premountFor={FPS}>
      <B5 />
    </Sequence>

    {SFX.map((s) => (
      <Sequence key={s.at} name={`sfx ${s.file}`} from={loc(s.at)} durationInFrames={s.frames} layout="none">
        <Sfx file={s.file} frames={s.frames} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
