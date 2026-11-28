import React from "react";
import {EDITORIAL_FONTS, EDITORIAL_PALETTE as P} from "./EditorialCard";
import {INK} from "./DrawnProps";

/** Personal-finance props. All 360x360 viewBox, flat fills, thick ink outline. Reveal with <Draw>. */
type Sz = {size: number};
const Svg: React.FC<Sz & {children: React.ReactNode}> = ({size, children}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    {children}
  </svg>
);

export const Coin: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    <circle cx={180} cy={180} r={140} fill={P.mustard} strokeWidth={9} {...INK} />
    <circle cx={180} cy={180} r={104} fill="none" strokeWidth={5} strokeDasharray="4 14" {...INK} />
    <text x={180} y={228} textAnchor="middle" fontFamily={EDITORIAL_FONTS.head} fontWeight={800} fontSize={150} fill={P.ink}>
      $
    </text>
  </Svg>
);

export const CoinStack: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    {[0, 1, 2, 3].map((i) => {
      const y = 270 - i * 52;
      return (
        <g key={i}>
          <path d={`M80 ${y}V${y + 40}A100 30 0 0 0 280 ${y + 40}V${y}`} fill={P.mustard} strokeWidth={7} {...INK} />
          <ellipse cx={180} cy={y} rx={100} ry={30} fill={P.mustard} strokeWidth={7} {...INK} />
        </g>
      );
    })}
  </Svg>
);

export const PiggyBank: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    <circle cx={180} cy={64} r={34} fill={P.mustard} strokeWidth={6} {...INK} />
    <path d="M54 190Q24 170 40 150Q56 134 44 120" fill="none" strokeWidth={7} {...INK} />
    <rect x={106} y={270} width={38} height={56} rx={10} fill={P.terracotta} strokeWidth={7} {...INK} />
    <rect x={216} y={270} width={38} height={56} rx={10} fill={P.terracotta} strokeWidth={7} {...INK} />
    <ellipse cx={180} cy={206} rx={130} ry={94} fill={P.terracotta} strokeWidth={9} {...INK} />
    <path d="M120 132L134 86L174 122Z" fill={P.terracotta} strokeWidth={7} {...INK} />
    <ellipse cx={304} cy={214} rx={34} ry={28} fill={P.paperAlt} strokeWidth={7} {...INK} />
    <ellipse cx={296} cy={214} rx={5} ry={8} fill={P.ink} />
    <ellipse cx={312} cy={214} rx={5} ry={8} fill={P.ink} />
    <circle cx={262} cy={176} r={8} fill={P.ink} />
    <path d="M150 118H210" fill="none" strokeWidth={9} {...INK} />
  </Svg>
);

export const Wallet: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    <rect x={80} y={56} width={200} height={90} rx={8} fill="#D3E6C9" strokeWidth={6} transform="rotate(-6 180 100)" {...INK} />
    <rect x={90} y={72} width={200} height={90} rx={8} fill="#B9D4AC" strokeWidth={6} transform="rotate(4 190 117)" {...INK} />
    <rect x={40} y={110} width={280} height={200} rx={28} fill={P.terracotta} strokeWidth={9} {...INK} />
    <path d="M40 170H320" fill="none" strokeWidth={6} {...INK} />
    <rect x={240} y={206} width={80} height={60} rx={16} fill={P.mustard} strokeWidth={7} {...INK} />
    <circle cx={278} cy={236} r={10} fill={P.paperCard} strokeWidth={4} {...INK} />
  </Svg>
);

export const CreditCard: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    <rect x={24} y={76} width={312} height={208} rx={26} fill={P.slate} strokeWidth={9} {...INK} />
    <rect x={24} y={112} width={312} height={44} fill={P.ink} />
    <rect x={56} y={182} width={62} height={46} rx={8} fill={P.mustard} strokeWidth={5} {...INK} />
    <path d="M150 204H300M150 238H240" fill="none" stroke={P.paperCard} strokeWidth={9} strokeLinecap="round" />
  </Svg>
);

export const House: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    <rect x={240} y={80} width={32} height={70} fill={P.slate} strokeWidth={7} {...INK} />
    <rect x={70} y={170} width={220} height={150} fill={P.paperAlt} strokeWidth={8} {...INK} />
    <path d="M40 176L180 60L320 176Z" fill={P.crimson} strokeWidth={8} {...INK} />
    <rect x={150} y={232} width={60} height={88} fill={P.terracotta} strokeWidth={6} {...INK} />
    <rect x={90} y={198} width={44} height={44} fill={P.paperCard} strokeWidth={5} {...INK} />
    <rect x={226} y={198} width={44} height={44} fill={P.paperCard} strokeWidth={5} {...INK} />
  </Svg>
);

export const Car: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    <path
      d="M30 220Q30 190 60 184L108 120Q120 108 140 108H220Q240 108 252 122L286 184Q330 190 330 222V250H30Z"
      fill={P.slate}
      strokeWidth={9}
      {...INK}
    />
    <path d="M116 184L142 130H182V184ZM196 130H224L258 184H196Z" fill={P.paperCard} strokeWidth={6} {...INK} />
    <circle cx={100} cy={256} r={40} fill={P.ink} strokeWidth={6} {...INK} />
    <circle cx={100} cy={256} r={16} fill={P.paperAlt} />
    <circle cx={262} cy={256} r={40} fill={P.ink} strokeWidth={6} {...INK} />
    <circle cx={262} cy={256} r={16} fill={P.paperAlt} />
  </Svg>
);

export const Receipt: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    <path
      d="M80 40H280V300L256 280L232 300L208 280L184 300L160 280L136 300L112 280L80 300Z"
      fill={P.paperCard}
      strokeWidth={8}
      {...INK}
    />
    <path d="M116 88H244M116 128H244M116 168H210" fill="none" strokeWidth={7} {...INK} />
    <path d="M116 226H244" fill="none" stroke={P.crimson} strokeWidth={11} strokeLinecap="round" />
  </Svg>
);

export const Calendar: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    <rect x={50} y={70} width={260} height={250} rx={24} fill={P.paperCard} strokeWidth={9} {...INK} />
    <path d="M50 94Q50 70 74 70H286Q310 70 310 94V132H50Z" fill={P.crimson} strokeWidth={9} {...INK} />
    <rect x={106} y={44} width={18} height={52} rx={9} fill={P.paperAlt} strokeWidth={6} {...INK} />
    <rect x={236} y={44} width={18} height={52} rx={9} fill={P.paperAlt} strokeWidth={6} {...INK} />
    {[0, 1, 2].map((r) =>
      [0, 1, 2, 3].map((c) => (
        <rect key={`${r}${c}`} x={80 + c * 54} y={160 + r * 50} width={34} height={30} rx={6} fill={P.paperAlt} strokeWidth={4} {...INK} />
      )),
    )}
  </Svg>
);

export const Safe: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    <rect x={80} y={304} width={40} height={24} fill={P.ink} />
    <rect x={240} y={304} width={40} height={24} fill={P.ink} />
    <rect x={50} y={50} width={260} height={256} rx={22} fill={P.slate} strokeWidth={9} {...INK} />
    <rect x={76} y={76} width={208} height={204} rx={12} fill="none" strokeWidth={5} {...INK} />
    <circle cx={190} cy={178} r={54} fill={P.mustard} strokeWidth={8} {...INK} />
    <circle cx={190} cy={178} r={28} fill={P.paperAlt} strokeWidth={5} {...INK} />
    <path d="M190 124V150M190 206V232M136 178H162M218 178H244" fill="none" strokeWidth={5} {...INK} />
    <path d="M112 140V220" fill="none" strokeWidth={11} {...INK} />
  </Svg>
);

/** Debt: ball and chain. */
export const BallChain: React.FC<Sz> = ({size}) => (
  <Svg size={size}>
    {[0, 1, 2, 3].map((i) => (
      <ellipse
        key={i}
        cx={170 - i * 36}
        cy={160 - i * 30}
        rx={24}
        ry={14}
        transform={`rotate(-40 ${170 - i * 36} ${160 - i * 30})`}
        fill="none"
        strokeWidth={8}
        {...INK}
      />
    ))}
    <circle cx={64} cy={52} r={26} fill="none" strokeWidth={10} {...INK} />
    <circle cx={238} cy={246} r={92} fill={P.slate} strokeWidth={9} {...INK} />
    <path d="M178 214Q196 180 232 172" fill="none" stroke={P.paperAlt} strokeWidth={10} strokeLinecap="round" />
  </Svg>
);

export const Badge: React.FC<Sz & {kind: "dollar" | "percent"}> = ({size, kind}) => (
  <Svg size={size}>
    <circle cx={180} cy={180} r={140} fill={kind === "dollar" ? P.sageDark : P.crimson} strokeWidth={9} {...INK} />
    <text x={180} y={232} textAnchor="middle" fontFamily={EDITORIAL_FONTS.head} fontWeight={800} fontSize={170} fill={P.paperCard}>
      {kind === "dollar" ? "$" : "%"}
    </text>
  </Svg>
);
