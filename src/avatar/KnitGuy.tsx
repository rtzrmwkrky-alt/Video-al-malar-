/**
 * Örgü tarzı genç erkek (kullanıcının Pinterest referansı: uzun boyun, bere, kalın örgü kazak, bol kareli
 * pantolon, kalın tabanlı spor ayakkabı, tek renk zemin). Yandan görünüm, sağa bakar.
 * Kıyafet seçimi için çizim; nihai 3B görünüm yapay zekâ resim aracında üretilecek.
 * 400x880 yerel kutu, yer çizgisi y=850.
 */
import React from "react";

export type KnitOutfit = {
  top: string;
  topS: string;
  knit: boolean; // false = düz kumaş kapüşonlu
  pants: string;
  plaid?: string; // kareli desenin ikinci rengi
  stripe?: string; // eşofman yan şeridi
  beanie: string;
  shoe: string;
  glasses?: boolean;
};

const SKIN = "#6b4330";
const SKIN_S = "#4e2f20";
const SKIN_H = "#8a5a40";

const HEAD =
  "M176,150 Q174,92 222,90 Q266,92 268,140 L281,166 Q285,173 270,175 L268,190 Q262,216 236,216 Q196,214 182,190 Q174,172 176,150 Z";
const BODY =
  "M126,334 Q148,282 214,278 Q278,282 300,334 Q320,424 306,524 Q214,546 122,524 Q108,424 126,334 Z";
const SLEEVE =
  "M194,306 Q262,296 276,362 Q290,432 272,494 Q240,510 212,494 Q204,420 194,306 Z";
const PANTS =
  "M140,512 L294,512 Q304,650 300,800 L222,800 Q218,700 214,650 Q208,700 194,800 L144,800 Q134,650 140,512 Z";

/** hacim için sol üstten ışık, sağ alttan gölge */
const Shade: React.FC<{ d: string; id: string }> = ({ d, id }) => (
  <path d={d} fill={`url(#${id}-shade)`} />
);

const Shoe: React.FC<{ x: number; c: string }> = ({ x, c }) => (
  <g transform={`translate(${x},0)`}>
    <path
      d="M0,848 L0,818 Q8,800 40,802 L70,804 Q104,808 112,832 L114,848 Z"
      fill={c}
    />
    <path
      d="M0,818 Q8,800 40,802 L70,804 Q104,808 112,832"
      fill="none"
      stroke="#00000022"
      strokeWidth={4}
    />
    <path
      d="M72,806 Q104,810 112,832 L80,834 Q70,820 72,806 Z"
      fill="#efe6d4"
    />
    <rect x={-2} y={834} width={118} height={16} rx={6} fill="#efe6d4" />
    <path d="M2,842 L112,842" stroke="#c9b99c" strokeWidth={2} />
    <path
      d="M36,806 l8,10 M48,805 l8,10 M60,805 l8,10"
      stroke="#fff"
      strokeWidth={3.5}
      strokeLinecap="round"
    />
  </g>
);

export const KnitGuy: React.FC<{ o: KnitOutfit; id: string; t?: number }> = ({
  o,
  id,
  t = 0,
}) => {
  const breathe = Math.sin(t * 2) * 1.5;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.28} />
        </linearGradient>
        <radialGradient id={`${id}-skin`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={SKIN_H} />
          <stop offset="0.7" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_S} />
        </radialGradient>
        {/* örgü ilmekleri */}
        <pattern
          id={`${id}-knit`}
          width={14}
          height={12}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0,0 L7,10 L14,0"
            fill="none"
            stroke={o.topS}
            strokeWidth={2.4}
            opacity={0.55}
          />
        </pattern>
        <pattern
          id={`${id}-rib`}
          width={8}
          height={10}
          patternUnits="userSpaceOnUse"
        >
          <path d="M4,0 L4,10" stroke="#000" strokeWidth={2.5} opacity={0.18} />
        </pattern>
        <pattern
          id={`${id}-plaid`}
          width={44}
          height={44}
          patternUnits="userSpaceOnUse"
        >
          <rect width={44} height={44} fill={o.pants} />
          <rect
            x={0}
            y={14}
            width={44}
            height={14}
            fill={o.plaid ?? o.pants}
            opacity={0.55}
          />
          <rect
            x={14}
            y={0}
            width={14}
            height={44}
            fill={o.plaid ?? o.pants}
            opacity={0.55}
          />
          <path
            d="M0,36 L44,36 M36,0 L36,44"
            stroke="#fff"
            strokeWidth={2}
            opacity={0.35}
          />
        </pattern>
      </defs>
      {/* zemin gölgesi */}
      <ellipse cx={220} cy={850} rx={150} ry={14} fill="#000" opacity={0.15} />
      <Shoe x={140} c={o.shoe} />
      {/* pantolon */}
      <path d={PANTS} fill={o.plaid ? `url(#${id}-plaid)` : o.pants} />
      <Shade d={PANTS} id={id} />
      {o.stripe ? (
        <path
          d="M286,520 Q296,650 292,796"
          fill="none"
          stroke={o.stripe}
          strokeWidth={9}
        />
      ) : null}
      {/* katlanmış paçalar */}
      <rect
        x={140}
        y={786}
        width={58}
        height={22}
        rx={8}
        fill={o.plaid ? `url(#${id}-plaid)` : o.pants}
      />
      <rect
        x={140}
        y={786}
        width={58}
        height={22}
        rx={8}
        fill="#000"
        opacity={0.12}
      />
      <rect
        x={216}
        y={786}
        width={90}
        height={22}
        rx={8}
        fill={o.plaid ? `url(#${id}-plaid)` : o.pants}
      />
      <rect
        x={216}
        y={786}
        width={90}
        height={22}
        rx={8}
        fill="#000"
        opacity={0.12}
      />
      <Shoe x={204} c={o.shoe} />
      <g transform={`translate(0,${breathe})`}>
        {/* boyun */}
        <rect
          x={203}
          y={196}
          width={26}
          height={100}
          rx={12}
          fill={`url(#${id}-skin)`}
        />
        <rect
          x={203}
          y={200}
          width={10}
          height={90}
          rx={5}
          fill={SKIN_S}
          opacity={0.35}
        />
        {/* gövde */}
        <path d={BODY} fill={o.top} />
        {o.knit ? <path d={BODY} fill={`url(#${id}-knit)`} /> : null}
        <Shade d={BODY} id={id} />
        {o.knit ? (
          <g>
            <rect
              x={122}
              y={506}
              width={186}
              height={28}
              rx={12}
              fill={o.top}
            />
            <rect
              x={122}
              y={506}
              width={186}
              height={28}
              rx={12}
              fill={`url(#${id}-rib)`}
            />
          </g>
        ) : (
          <path
            d="M126,512 Q214,532 304,512"
            fill="none"
            stroke={o.topS}
            strokeWidth={6}
            strokeLinecap="round"
          />
        )}
        {/* yaka */}
        {o.knit ? (
          <g>
            <rect x={188} y={268} width={58} height={36} rx={16} fill={o.top} />
            <rect
              x={188}
              y={268}
              width={58}
              height={36}
              rx={16}
              fill={`url(#${id}-rib)`}
            />
            <rect
              x={188}
              y={268}
              width={58}
              height={36}
              rx={16}
              fill={`url(#${id}-shade)`}
            />
          </g>
        ) : (
          <g>
            {/* kapüşon arkada + ipler */}
            <path d="M150,300 Q150,250 196,262 L200,300 Z" fill={o.topS} />
            <path
              d="M236,296 L240,370 M248,294 L254,364"
              stroke="#f4efe6"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </g>
        )}
        {/* kol (eller cepte) */}
        <path d={SLEEVE} fill={o.top} />
        {o.knit ? <path d={SLEEVE} fill={`url(#${id}-knit)`} /> : null}
        <Shade d={SLEEVE} id={id} />
        <path
          d="M212,492 Q240,506 272,492"
          fill="none"
          stroke={o.topS}
          strokeWidth={5}
          opacity={0.7}
        />
        {/* kafa */}
        <ellipse cx={197} cy={154} rx={12} ry={17} fill={SKIN} />
        <path
          d="M194,146 q6,8 0,16"
          fill="none"
          stroke={SKIN_S}
          strokeWidth={3}
        />
        <path d={HEAD} fill={`url(#${id}-skin)`} />
        <ellipse
          cx={248}
          cy={176}
          rx={14}
          ry={8}
          fill="#c9604a"
          opacity={0.25}
        />
        {/* göz (yandan) */}
        <path d="M238,140 Q248,132 258,140 Q248,148 238,140 Z" fill="#f6efe6" />
        <circle cx={252} cy={140} r={4.5} fill="#1a0f0a" />
        <circle cx={253.5} cy={138.5} r={1.4} fill="#fff" />
        <path
          d="M236,138 Q248,128 260,137"
          fill="none"
          stroke="#1a0f0a"
          strokeWidth={2.6}
          strokeLinecap="round"
        />
        <path
          d="M238,124 Q250,118 262,124"
          fill="none"
          stroke="#1a0f0a"
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* dudak */}
        <path
          d="M262,194 Q268,196 270,192"
          fill="none"
          stroke="#3a1c14"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* bere (gözü kapatmasın diye yukarıda) */}
        <g transform="translate(0,-20)">
          <path d="M168,128 Q164,62 222,58 Q278,60 276,128 Z" fill={o.beanie} />
          <path
            d="M168,128 Q164,62 222,58 Q278,60 276,128 Z"
            fill={`url(#${id}-rib)`}
          />
          <Shade d="M168,128 Q164,62 222,58 Q278,60 276,128 Z" id={id} />
          <path
            d="M164,120 Q222,108 280,120 L280,146 Q222,134 164,146 Z"
            fill={o.beanie}
          />
          <path
            d="M164,120 Q222,108 280,120 L280,146 Q222,134 164,146 Z"
            fill={`url(#${id}-rib)`}
          />
          <path
            d="M164,140 Q222,128 280,140 L280,146 Q222,134 164,146 Z"
            fill="#000"
            opacity={0.15}
          />
          {o.glasses ? (
            <g>
              <circle
                cx={206}
                cy={92}
                r={17}
                fill="#3a2a22"
                stroke="#fff"
                strokeWidth={5}
              />
              <circle
                cx={246}
                cy={92}
                r={17}
                fill="#3a2a22"
                stroke="#fff"
                strokeWidth={5}
              />
              <path d="M223,92 L229,92" stroke="#fff" strokeWidth={4} />
              <ellipse
                cx={242}
                cy={86}
                rx={6}
                ry={3}
                fill="#fff"
                opacity={0.4}
              />
            </g>
          ) : null}
        </g>
      </g>
    </g>
  );
};

export const KNIT_OUTFITS: {
  name: string;
  desc: string;
  bg: string;
  o: KnitOutfit;
}[] = [
  {
    name: "Klasik örgü",
    desc: "Krem kazak, kahve kareli pantolon",
    bg: "#d97a6c",
    o: {
      top: "#efe3cc",
      topS: "#bba98a",
      knit: true,
      pants: "#7a5236",
      plaid: "#e8d6b8",
      beanie: "#2f8f6a",
      shoe: "#2f8f6a",
    },
  },
  {
    name: "Sporcu",
    desc: "Turuncu kapüşonlu, gri eşofman",
    bg: "#5fb3a8",
    o: {
      top: "#ff8a3d",
      topS: "#c9611f",
      knit: false,
      pants: "#8a8f99",
      stripe: "#ffffff",
      beanie: "#26262b",
      shoe: "#ffffff",
    },
  },
  {
    name: "Renkli",
    desc: "Hardal kazak, mavi kareli pantolon",
    bg: "#f08f86",
    o: {
      top: "#e8b73a",
      topS: "#b8871a",
      knit: true,
      pants: "#2f6fd1",
      plaid: "#f2efe6",
      beanie: "#2f6fd1",
      shoe: "#2f6fd1",
    },
  },
  {
    name: "Şık",
    desc: "Yeşil kazak, gözlük berede",
    bg: "#e9c46a",
    o: {
      top: "#4f7a5a",
      topS: "#2f5038",
      knit: true,
      pants: "#efe6d4",
      beanie: "#7a4a2a",
      shoe: "#efe6d4",
      glasses: true,
    },
  },
];
