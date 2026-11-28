import React from "react";
import {DrawOn} from "../core/DrawOn";
import {EDITORIAL_FONTS, EDITORIAL_PALETTE as P} from "../core/theme";

/**
 * Shared code-drawn props (SVG). Reveal them with <Draw> so the hand draws them.
 * No AI images: every shape here is vector.
 */
export const INK = {stroke: P.ink, strokeLinecap: "round", strokeLinejoin: "round"} as const;

/** Slot-driven drawing of any SVG/DOM child. Spread a planHand slot into it. */
export const Draw: React.FC<
  Omit<React.ComponentProps<typeof DrawOn>, "src"> & {children: React.ReactNode}
> = ({children, ...rest}) => (
  <DrawOn bands={4} {...rest}>
    {children}
  </DrawOn>
);

type Sz = {size: number};

/** Split card: one certificate forking into `parts` smaller ones. 360x440 viewBox. */
export const SplitCard: React.FC<{parts: number; width: number}> = ({parts, width}) => {
  const gap = 14;
  const mw = (296 - gap * (parts - 1)) / parts;
  const minis = Array.from({length: parts}, (_, i) => {
    const x = 32 + i * (mw + gap);
    return {x, cx: x + mw / 2};
  });
  const first = minis[0].cx;
  const last = minis[parts - 1].cx;
  return (
    <svg width={width} height={(width * 440) / 360} viewBox="0 0 360 440">
      <rect x={6} y={6} width={348} height={428} rx={32} fill={P.paperCard} strokeWidth={6} {...INK} />
      <rect x={70} y={40} width={220} height={130} rx={14} fill={P.paperAlt} strokeWidth={5} {...INK} />
      <circle cx={180} cy={105} r={26} fill={P.mustard} strokeWidth={4} {...INK} />
      <path d="M92 66h64M204 66h64M92 146h176" fill="none" strokeWidth={4} {...INK} />
      <path d="M180 174v40" fill="none" strokeWidth={6} {...INK} />
      <path d={`M${first} 214H${last}`} fill="none" strokeWidth={6} {...INK} />
      {minis.map((m, i) => (
        <g key={i}>
          <path d={`M${m.cx} 214V252M${m.cx - 9} 242l9 11 9-11`} fill="none" strokeWidth={5} {...INK} />
          <rect x={m.x} y={266} width={mw} height={120} rx={8} fill={P.paperCard} strokeWidth={5} {...INK} />
          <circle cx={m.cx} cy={326} r={Math.min(14, mw / 4)} fill={P.mustard} strokeWidth={3} {...INK} />
        </g>
      ))}
    </svg>
  );
};

/** Big drawn question mark. */
export const QMark: React.FC<{width: number}> = ({width}) => (
  <svg width={width} height={(width * 280) / 200} viewBox="-80 -140 200 280">
    <path
      d="M-42 -50 C-42 -120 62 -120 62 -50 C62 -8 12 0 12 56"
      fill="none"
      stroke={P.crimson}
      strokeWidth={24}
      strokeLinecap="round"
    />
    <circle cx={12} cy={102} r={14} fill={P.crimson} />
  </svg>
);

/** SD memory card. */
export const MemoryCard: React.FC<Sz> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    <path
      d="M90 50H230L290 112V300Q290 322 268 322H90Q68 322 68 300V72Q68 50 90 50Z"
      fill={P.slate}
      strokeWidth={9}
      {...INK}
    />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={104 + i * 34} y={72} width={22} height={58} rx={4} fill={P.mustard} strokeWidth={4} {...INK} />
    ))}
    <rect x={104} y={170} width={150} height={100} rx={10} fill={P.paperCard} strokeWidth={5} {...INK} />
    <path d="M124 200h110M124 232h70" fill="none" strokeWidth={5} {...INK} />
    <path d="M290 150h-26M290 190h-26" fill="none" strokeWidth={5} {...INK} />
  </svg>
);

/** Microchip with pins. */
export const Chip: React.FC<Sz> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const o = 112 + i * 27;
      return (
        <g key={i}>
          <path d={`M${o} 56V94M${o} 266V304M56 ${o}H94M266 ${o}H304`} fill="none" strokeWidth={9} {...INK} />
        </g>
      );
    })}
    <rect x={90} y={90} width={180} height={180} rx={16} fill={P.slate} strokeWidth={9} {...INK} />
    <rect x={132} y={132} width={96} height={96} rx={10} fill={P.paperAlt} strokeWidth={6} {...INK} />
    <circle cx={180} cy={180} r={20} fill={P.mustard} strokeWidth={5} {...INK} />
  </svg>
);

/** Passenger jet, side view, climbing. */
export const Jet: React.FC<Sz> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    <path d="M18 250H92M40 280H120" fill="none" strokeWidth={7} strokeDasharray="14 12" {...INK} />
    <path d="M70 168L44 96H100L136 158Z" fill={P.crimson} strokeWidth={7} {...INK} />
    <path
      d="M40 206Q56 156 140 156H292Q336 156 336 192Q336 222 292 222H140Q64 232 40 206Z"
      fill={P.paperCard}
      strokeWidth={9}
      {...INK}
    />
    <path d="M178 196L132 290H196L262 200Z" fill={P.slate} strokeWidth={7} {...INK} />
    {[0, 1, 2, 3, 4].map((i) => (
      <circle key={i} cx={156 + i * 30} cy={182} r={8} fill={P.slate} strokeWidth={3} {...INK} />
    ))}
    <ellipse cx={206} cy={262} rx={30} ry={14} fill={P.paperAlt} strokeWidth={6} {...INK} />
  </svg>
);

/** Steel can spilling corn. */
export const CornCan: React.FC<Sz> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    {[
      [130, 78],
      [166, 58],
      [204, 66],
      [238, 84],
      [150, 100],
      [196, 96],
    ].map(([cx, cy], i) => (
      <ellipse key={i} cx={cx} cy={cy} rx={13} ry={17} fill={P.mustard} strokeWidth={4} {...INK} />
    ))}
    <path d="M86 112V292A94 30 0 0 0 274 292V112" fill={P.sage} strokeWidth={9} {...INK} />
    <ellipse cx={180} cy={112} rx={94} ry={30} fill={P.paperAlt} strokeWidth={9} {...INK} />
    <rect x={87} y={178} width={186} height={82} fill={P.paperCard} strokeWidth={5} {...INK} />
    <ellipse cx={180} cy={219} rx={20} ry={30} fill={P.mustard} strokeWidth={5} {...INK} />
    <path d="M140 232Q160 190 180 190Q200 190 220 232" fill="none" stroke={P.sageDark} strokeWidth={7} strokeLinecap="round" />
  </svg>
);

/** Company building. `tags` hangs 0–2 price tags off the right side. */
export const Building: React.FC<Sz & {tags?: 0 | 1 | 2}> = ({size, tags = 0}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    <path d="M20 330H340" fill="none" strokeWidth={9} {...INK} />
    <rect x={70} y={120} width={190} height={210} fill={P.paperAlt} strokeWidth={8} {...INK} />
    <path d="M58 120H272L165 66Z" fill={P.slate} strokeWidth={8} {...INK} />
    <path d="M165 66V26" fill="none" strokeWidth={7} {...INK} />
    <path d="M165 26H208L192 40L208 54H165Z" fill={P.crimson} strokeWidth={5} {...INK} />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <rect key={`${r}${c}`} x={92 + c * 56} y={142 + r * 50} width={34} height={32} fill={P.paperCard} strokeWidth={5} {...INK} />
      )),
    )}
    <rect x={142} y={288} width={46} height={42} fill={P.terracotta} strokeWidth={6} {...INK} />
    {tags >= 1 ? (
      <g>
        <path d="M260 200H302" fill="none" strokeWidth={5} {...INK} />
        <path d="M302 178H336L346 200L336 222H302Z" fill={P.mustard} strokeWidth={5} {...INK} />
      </g>
    ) : null}
    {tags >= 2 ? (
      <g>
        <path d="M260 260H302" fill="none" strokeWidth={5} {...INK} />
        <path d="M302 238H336L346 260L336 282H302Z" fill={P.mustard} strokeWidth={5} {...INK} />
      </g>
    ) : null}
  </svg>
);

/** Banknote with corner numerals. 520x250 viewBox. */
export const Bill: React.FC<{value: number; width: number}> = ({value, width}) => (
  <svg width={width} height={(width * 250) / 520} viewBox="0 0 520 250">
    <rect x={6} y={6} width={508} height={238} rx={18} fill="#D3E6C9" strokeWidth={7} {...INK} />
    <rect x={30} y={28} width={460} height={194} rx={12} fill="none" strokeWidth={4} {...INK} />
    <ellipse cx={260} cy={125} rx={70} ry={80} fill="#B9D4AC" strokeWidth={5} {...INK} />
    <text
      x={260}
      y={147}
      textAnchor="middle"
      fontFamily={EDITORIAL_FONTS.head}
      fontWeight={800}
      fontSize={72}
      fill={P.ink}
    >
      {value}
    </text>
    {[
      [58, 80],
      [462, 80],
      [58, 214],
      [462, 214],
    ].map(([x, y], i) => (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        fontFamily={EDITORIAL_FONTS.head}
        fontWeight={800}
        fontSize={34}
        fill={P.ink}
      >
        {value}
      </text>
    ))}
  </svg>
);

/** Magnifying glass. */
export const Magnifier: React.FC<Sz> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    <path d="M214 214L318 318" fill="none" stroke={P.terracotta} strokeWidth={36} strokeLinecap="round" />
    <path d="M214 214L318 318" fill="none" stroke={P.ink} strokeWidth={8} strokeLinecap="round" />
    <circle cx={140} cy={140} r={104} fill="rgba(255,253,247,0.35)" strokeWidth={14} {...INK} />
    <path d="M86 112Q106 78 146 70" fill="none" stroke={P.paper} strokeWidth={10} strokeLinecap="round" />
  </svg>
);

/** Equals sign. */
export const Equals: React.FC<Sz> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <path d="M30 70H170M30 130H170" fill="none" stroke={P.ink} strokeWidth={22} strokeLinecap="round" />
  </svg>
);

/** Rubber stamp. */
export const Stamp: React.FC<{text: string; width: number; height: number; fontSize: number}> = ({
  text,
  width,
  height,
  fontSize,
}) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
    <rect
      x={8}
      y={8}
      width={width - 16}
      height={height - 16}
      rx={28}
      fill="rgba(250,243,227,0.9)"
      stroke={P.crimson}
      strokeWidth={14}
    />
    <text
      x={width / 2}
      y={height / 2 + fontSize * 0.35}
      textAnchor="middle"
      fontFamily={EDITORIAL_FONTS.head}
      fontWeight={800}
      fontSize={fontSize}
      fill={P.crimson}
    >
      {text}
    </text>
  </svg>
);
