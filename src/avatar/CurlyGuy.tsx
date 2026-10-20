/**
 * Kıvırcık saçlı, iri yuvarlak gözlüklü genç (kullanıcının Pinterest referansı: "3D Stylized Character").
 * Uzun ince boyun, iri kulaklar, pembe burun; koyu kuzu yünü (teddy) fermuarlı ceket, krem örgü kazak,
 * dar koyu gri pantolon (paça katlı), turuncu-kırmızı bilekli spor ayakkabı. Önden; 400x900 kutu, yer y=880.
 */
import React from "react";

const SKIN = "#f6d3c0";
const SKIN_S = "#e2ad97";
const PINK = "#f08a7e";
const HAIR = "#8a5a32";

/** kıvırcık saç buklelerinin yerleri (deterministik) */
const CURLS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  // üç sıra küçük bukle: alında daha seyrek, tepede kabarık
  const rows: [number, number, number, number][] = [
    [96, 9, 150, 250], [112, 10, 140, 262], [128, 10, 138, 264], [144, 8, 142, 258],
  ];
  rows.forEach(([y, n, x0, x1], ri) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / (n - 1) + (ri % 2 ? 6 : -4);
      out.push([x, y - Math.sin((i / (n - 1)) * Math.PI) * 18 + ((i * 7) % 5), 15 + ((i + ri) % 3) * 2]);
    }
  });
  out.push([136, 160, 12], [264, 160, 12], [190, 70, 16], [214, 66, 16]);
  return out;
})();

type P = [number, number];
export type CurlyHand = "fist" | "point" | "thumb" | "open";
export type CurlyArm = { el: P; wr: P; hand?: CurlyHand; handRot?: number };
export type CurlyExpr = "neutral" | "smile" | "grin" | "chew" | "surprise" | "think" | "ouch" | "yawn" | "happy" | "laugh";
export type CurlyPose = {
  /** ekranda sağdaki kol (karakterin solu) / soldaki kol; verilmezse eller cepte */
  r?: CurlyArm;
  l?: CurlyArm;
  /** baş eğimi (derece) */
  head?: number;
  lx?: number;
  ly?: number;
};

/** kıyafet/saç seçenekleri; verilmezse Bora (kıvırcık saç, gözlük, koyu kuzu yünü ceket) */
export type CurlyLook = {
  hair?: "curly" | "long";
  /** saç: açık, orta, koyu ton */
  hairColor?: [string, string, string];
  glasses?: boolean;
  /** ceket gradyanı: açık, orta, koyu */
  jacket?: [string, string, string];
  teddy?: boolean;
  sweater?: string;
  knit?: boolean;
  pants?: [string, string];
  cuff?: string;
  shoe?: [string, string];
  shoeLine?: string;
  strap?: boolean;
  lashes?: boolean;
  earrings?: string;
};

const BORA_LOOK: Required<CurlyLook> = {
  hair: "curly",
  hairColor: ["#c08a55", HAIR, "#5a3518"],
  glasses: true,
  jacket: ["#4a4d55", "#33363d", "#1f2126"],
  teddy: true,
  sweater: "#e9e1d2",
  knit: true,
  pants: ["#5a5a5e", "#3a3a3e"],
  cuff: "#4a4a4e",
  shoe: ["#e2774e", "#b8472b"],
  shoeLine: "#c45a3a",
  strap: true,
  lashes: false,
  earrings: "",
};

/** "Zayıflar bunu saklıyor" videosundaki kız: uzun koyu saç, kâküllü, mercan hırka, açık kot, beyaz ayakkabı */
export const GIRL_LOOK: CurlyLook = {
  hair: "long",
  hairColor: ["#8a5a3a", "#4a2a18", "#2a160c"],
  glasses: false,
  jacket: ["#ff9a86", "#f2685c", "#c84a42"],
  teddy: false,
  sweater: "#fff7ee",
  knit: false,
  pants: ["#a9cdee", "#82acd6"],
  cuff: "#9cc0e4",
  shoe: ["#ffffff", "#dcdcdc"],
  shoeLine: "#f2685c",
  strap: false,
  lashes: true,
  earrings: "#f5c542",
};

const SH_R: P = [262, 358];
const SH_L: P = [138, 358];

/** elin konumu: bilekten kol doğrultusunda biraz ileri */
export const curlyHandAt = (a: CurlyArm): P => {
  const dx = a.wr[0] - a.el[0];
  const dy = a.wr[1] - a.el[1];
  const L = Math.hypot(dx, dy) || 1;
  return [a.wr[0] + (dx / L) * 18, a.wr[1] + (dy / L) * 18];
};

const Hand: React.FC<{ at: P; type: CurlyHand; rot: number }> = ({ at, type, rot }) => (
  <g transform={`translate(${at[0]},${at[1]}) rotate(${rot})`}>
    {type === "point" ? <rect x={-6} y={-42} width={12} height={34} rx={6} fill={SKIN} /> : null}
    {type === "thumb" ? <rect x={-7} y={-40} width={14} height={30} rx={7} fill={SKIN} /> : null}
    {type === "open" ? <ellipse cx={0} cy={0} rx={15} ry={22} fill={SKIN} /> : <circle cx={0} cy={0} r={18} fill={SKIN} />}
    <circle cx={-5} cy={-5} r={7} fill="#fde4d6" opacity={0.6} />
    {type !== "open" ? <path d="M-9,6 Q0,11 9,6" fill="none" stroke={SKIN_S} strokeWidth={2.5} strokeLinecap="round" /> : null}
  </g>
);

export const CurlyGuy: React.FC<{
  id: string;
  t?: number;
  blink?: number;
  pose?: CurlyPose;
  expr?: CurlyExpr;
  item?: React.ReactNode;
  look?: CurlyLook;
  /** göbek (0 yok, 1 belirgin): açık ceketin arasından kazak öne taşar */
  belly?: number;
}> = ({
  id,
  t = 0,
  blink = 0,
  pose = {},
  expr = "neutral",
  item,
  look: lk = {},
  belly = 0,
}) => {
  const look = { ...BORA_LOOK, ...lk };
  const long = look.hair === "long";
  const breathe = Math.sin(t * 2) * 1.5;
  const tilt = Math.sin(t * 1.2) * 1.5 + (pose.head ?? 0);
  const closedEyes = expr === "happy" || expr === "laugh";
  const open = expr === "yawn" ? 0.45 : 1 - blink;
  const lx = pose.lx ?? (expr === "think" ? -3 : 0);
  const ly = pose.ly ?? (expr === "think" ? -4 : 0);
  const eyeR = expr === "surprise" ? 1.2 : 1;
  const arm = (a: CurlyArm, sh: P, k: string, withItem: boolean) => {
    const hand = curlyHandAt(a);
    const d = `M${sh[0]},${sh[1]} L${a.el[0]},${a.el[1]} L${a.wr[0]},${a.wr[1]}`;
    return (
      <g key={k}>
        <path d={d} fill="none" stroke={look.jacket[2]} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={look.teddy ? "#3a3d45" : look.jacket[1]} strokeWidth={44} strokeLinecap="round" strokeLinejoin="round" />
        {look.teddy ? <path d={d} fill="none" stroke={`url(#${id}-teddy)`} strokeWidth={44} strokeLinecap="round" strokeLinejoin="round" /> : null}
        <circle cx={a.wr[0]} cy={a.wr[1]} r={17} fill={look.sweater} />
        {withItem && item ? <g transform={`translate(${hand[0]},${hand[1]})`}>{item}</g> : null}
        <Hand at={hand} type={a.hand ?? "fist"} rot={a.handRot ?? 0} />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-skin`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#fde4d6" />
          <stop offset="0.7" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_S} />
        </radialGradient>
        <radialGradient id={`${id}-curl`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor={look.hairColor[0]} />
          <stop offset="0.6" stopColor={look.hairColor[1]} />
          <stop offset="1" stopColor={look.hairColor[2]} />
        </radialGradient>
        <radialGradient id={`${id}-ear`} cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#f7b2a4" />
          <stop offset="1" stopColor={PINK} />
        </radialGradient>
        <linearGradient id={`${id}-jacket`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={look.jacket[0]} />
          <stop offset="0.5" stopColor={look.jacket[1]} />
          <stop offset="1" stopColor={look.jacket[2]} />
        </linearGradient>
        <linearGradient id={`${id}-pants`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={look.pants[0]} />
          <stop offset="1" stopColor={look.pants[1]} />
        </linearGradient>
        <linearGradient id={`${id}-shoe`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={look.shoe[0]} />
          <stop offset="1" stopColor={look.shoe[1]} />
        </linearGradient>
        {/* kuzu yünü dokusu */}
        <pattern id={`${id}-teddy`} width={12} height={12} patternUnits="userSpaceOnUse">
          <circle cx={3} cy={3} r={2.6} fill="#fff" opacity={0.1} />
          <circle cx={9} cy={8} r={2.6} fill="#fff" opacity={0.08} />
          <circle cx={4} cy={10} r={1.6} fill="#000" opacity={0.18} />
        </pattern>
        <pattern id={`${id}-knit`} width={10} height={12} patternUnits="userSpaceOnUse">
          <path d="M5,0 L5,12" stroke="#b9ad98" strokeWidth={3} opacity={0.6} />
        </pattern>
      </defs>
      <ellipse cx={200} cy={882} rx={120} ry={12} fill="#000" opacity={0.14} />
      {/* ayakkabılar (bilekli) */}
      {[166, 238].map((x, i) => (
        <g key={i}>
          <path d={`M${x - 26},876 L${x - 26},818 Q${x - 24},800 ${x},800 Q${x + 22},800 ${x + 24},818 L${x + 34},846 Q${x + 44},858 ${x + 44},876 Z`} fill={`url(#${id}-shoe)`} />
          <path d={`M${x - 28},864 L${x + 46},864 L${x + 46},880 Q${x + 10},884 ${x - 28},880 Z`} fill="#f2ede4" />
          <path d={`M${x + 18},846 Q${x + 36},846 ${x + 44},864 L${x + 14},864 Z`} fill="#f2ede4" />
          <path d={`M${x - 8},816 l18,0 M${x - 6},828 l20,0 M${x - 4},840 l22,0`} stroke={look.teddy ? "#fff" : look.shoeLine} strokeWidth={3.5} strokeLinecap="round" />
          <path d={`M${x - 28},868 L${x + 46},868`} stroke={look.shoeLine} strokeWidth={2} />
        </g>
      ))}
      {/* çoraplar */}
      <rect x={146} y={784} width={40} height={20} rx={6} fill="#efe9de" />
      <rect x={218} y={784} width={40} height={20} rx={6} fill="#efe9de" />
      {/* pantolon */}
      <path d="M156,620 L198,620 L196,790 L162,790 Z" fill={`url(#${id}-pants)`} />
      <path d="M204,620 L246,620 L242,790 L208,790 Z" fill={`url(#${id}-pants)`} />
      <rect x={154} y={766} width={46} height={24} rx={8} fill={look.cuff} />
      <rect x={204} y={766} width={46} height={24} rx={8} fill={look.cuff} />
      <path d="M156,778 L200,778 M206,778 L250,778" stroke="#2e2e32" strokeWidth={2} />
      <g transform={`translate(0,${breathe})`}>
        {/* uzun saçın arkası (omuzlara dökülür) */}
        {long ? (
          <g transform={`rotate(${tilt},200,230)`}>
            <path d="M136,190 Q130,104 200,100 Q270,104 264,190 L276,372 Q242,392 200,384 Q158,392 124,372 Z" fill={`url(#${id}-curl)`} />
          </g>
        ) : null}
        {/* boyun */}
        <rect x={189} y={220} width={22} height={110} rx={10} fill={`url(#${id}-skin)`} />
        <rect x={189} y={226} width={8} height={96} rx={4} fill={SKIN_S} opacity={0.4} />
        {/* kazak (açık cekette görünen) */}
        <path d="M172,320 L228,320 L234,640 L166,640 Z" fill={look.sweater} />
        {look.knit ? <path d="M172,320 L228,320 L234,640 L166,640 Z" fill={`url(#${id}-knit)`} /> : null}
        <rect x={180} y={300} width={40} height={30} rx={12} fill={look.sweater} />
        {look.knit ? <rect x={180} y={300} width={40} height={30} rx={12} fill={`url(#${id}-knit)`} /> : null}
        {/* çanta askısı */}
        {look.strap ? <path d="M184,334 L220,560" stroke="#2b2a2a" strokeWidth={4} /> : null}
        {/* ceket: iki ön parça, eller cepte */}
        {[-1, 1].map((s) => {
          const d =
            s < 0
              ? "M178,330 Q140,326 128,360 Q112,470 118,600 Q120,640 132,650 L186,652 Q182,520 182,330 Z"
              : "M222,330 Q260,326 272,360 Q288,470 282,600 Q280,640 268,650 L214,652 Q218,520 218,330 Z";
          return (
            <g key={s}>
              <path d={d} fill={`url(#${id}-jacket)`} />
              {look.teddy ? <path d={d} fill={`url(#${id}-teddy)`} /> : null}
            </g>
          );
        })}
        {/* fermuar kenarları + cep çizgileri */}
        <path d="M184,346 L186,648 M216,346 L214,648" stroke="#17181c" strokeWidth={3} />
        <path d="M134,560 Q150,566 160,600 M266,560 Q250,566 240,600" fill="none" stroke="#17181c" strokeWidth={3} opacity={0.7} />
        {/* dik yaka / kapüşon */}
        <path d="M164,352 Q146,312 162,282 Q182,266 194,292 L194,342 Z" fill={`url(#${id}-jacket)`} />
        <path d="M236,352 Q254,312 238,282 Q218,266 206,292 L206,342 Z" fill={`url(#${id}-jacket)`} />
        {look.teddy ? (
          <>
            <path d="M164,352 Q146,312 162,282 Q182,266 194,292 L194,342 Z" fill={`url(#${id}-teddy)`} />
            <path d="M236,352 Q254,312 238,282 Q218,266 206,292 L206,342 Z" fill={`url(#${id}-teddy)`} />
          </>
        ) : null}
        {/* göbek: kazak öne taşar, ceketin ön kenarları yanlara açılır */}
        {belly > 0.01
          ? (() => {
              const rx = 34 + 58 * belly;
              const ry = 70 + 22 * belly;
              const cy = 560;
              return (
                <g>
                  <ellipse cx={200} cy={cy} rx={rx} ry={ry} fill={look.sweater} />
                  {look.knit ? <ellipse cx={200} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-knit)`} /> : null}
                  <path d={`M${200 - rx * 0.9},${cy + ry * 0.35} Q200,${cy + ry * 1.05} ${200 + rx * 0.9},${cy + ry * 0.35}`} fill="none" stroke="#000" strokeWidth={8} opacity={0.08} />
                  <ellipse cx={200 - rx * 0.35} cy={cy - ry * 0.35} rx={rx * 0.3} ry={ry * 0.22} fill="#fff" opacity={0.25} />
                  {[-1, 1].map((s) => (
                    <path
                      key={s}
                      d={`M${200 + s * 16},${cy - ry - 40} Q${200 + s * (rx + 14)},${cy - ry * 0.2} ${200 + s * (rx * 0.75 + 10)},${cy + ry + 6}`}
                      fill="none"
                      stroke={look.jacket[1]}
                      strokeWidth={18}
                      strokeLinecap="round"
                    />
                  ))}
                </g>
              );
            })()
          : null}
        {/* kafa */}
        <g transform={`rotate(${tilt},200,230)`}>
          {long ? null : (
            <>
              <circle cx={146} cy={200} r={22} fill={`url(#${id}-ear)`} />
              <circle cx={254} cy={200} r={22} fill={`url(#${id}-ear)`} />
            </>
          )}
          <path d="M150,180 Q150,128 200,126 Q250,128 250,180 Q250,222 230,240 Q214,252 200,252 Q186,252 170,240 Q150,222 150,180 Z" fill={`url(#${id}-skin)`} />
          {/* gözler (gözlüğün arkasında, hafif yukarı bakıyor) */}
          {[180, 220].map((x) => (
            closedEyes ? (
              <path key={x} d={`M${x - 9},190 Q${x},178 ${x + 9},190`} fill="none" stroke="#2a1a10" strokeWidth={3.5} strokeLinecap="round" />
            ) : expr === "ouch" ? (
              <path key={x} d={x < 200 ? `M${x - 8},180 L${x + 6},187 L${x - 8},194` : `M${x + 8},180 L${x - 6},187 L${x + 8},194`} fill="none" stroke="#2a1a10" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <g key={x} transform={`translate(${x},186) scale(${eyeR * (look.glasses ? 1 : 1.25)},${Math.max(0.08, open) * eyeR * (look.glasses ? 1 : 1.25)}) translate(${-x},-186)`}>
                <ellipse cx={x} cy={186} rx={9} ry={10} fill="#fbf8f2" />
                <circle cx={x + 1 + lx} cy={182 + ly} r={5.5} fill="#2a1a10" />
                <circle cx={x + 3 + lx} cy={180 + ly} r={1.8} fill="#fff" />
                {look.lashes ? (
                  <path
                    d={x < 200 ? `M${x - 10},183 Q${x},173 ${x + 10},181 M${x - 9},180 L${x - 14},175 M${x - 5},177 L${x - 8},171` : `M${x + 10},183 Q${x},173 ${x - 10},181 M${x + 9},180 L${x + 14},175 M${x + 5},177 L${x + 8},171`}
                    fill="none"
                    stroke="#2a1a10"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            )
          ))}
          {/* kaşlar (hafif endişeli) */}
          <path
            d={
              expr === "surprise" || expr === "think"
                ? "M166,152 Q178,144 190,150 M210,150 Q222,144 234,152"
                : expr === "smile" || expr === "happy" || expr === "laugh" || expr === "grin" || expr === "chew"
                  ? "M166,160 Q178,153 190,158 M210,158 Q222,153 234,160"
                  : expr === "ouch"
                    ? "M166,158 Q178,160 190,166 M210,166 Q222,160 234,158"
                    : "M166,162 Q178,154 190,160 M210,160 Q222,154 234,162"
            }
            fill="none"
            stroke="#6a4224"
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* gözlük */}
          {look.glasses ? (
          <>
          <circle cx={178} cy={186} r={23} fill="#fff" fillOpacity={0.08} stroke="#141414" strokeWidth={6} />
          <circle cx={222} cy={186} r={23} fill="#fff" fillOpacity={0.08} stroke="#141414" strokeWidth={6} />
          <path d="M197,182 Q200,178 203,182" fill="none" stroke="#141414" strokeWidth={5} />
          <path d="M155,182 L148,180 M245,182 L252,180" stroke="#141414" strokeWidth={5} />
          <path d="M168,174 Q174,168 182,168" fill="none" stroke="#fff" strokeWidth={3} opacity={0.5} />
          </>
          ) : (
            <>
              <ellipse cx={168} cy={214} rx={12} ry={7} fill={PINK} opacity={0.35} />
              <ellipse cx={232} cy={214} rx={12} ry={7} fill={PINK} opacity={0.35} />
            </>
          )}
          {/* burun */}
          <ellipse cx={200} cy={208} rx={12} ry={11} fill={PINK} />
          <ellipse cx={196} cy={204} rx={4} ry={3} fill="#fff" opacity={0.45} />
          {/* ağız */}
          {expr === "smile" || expr === "happy" ? (
            <path d="M188,228 Q200,240 212,228" fill="none" stroke="#7a3a2c" strokeWidth={3.5} strokeLinecap="round" />
          ) : expr === "grin" || expr === "laugh" ? (
            <g>
              <path d="M186,226 Q200,248 214,226 Z" fill="#5a1e16" />
              <path d="M188,227 L212,227 L210,232 Q200,234 190,232 Z" fill="#fff" />
            </g>
          ) : expr === "surprise" || expr === "yawn" ? (
            <ellipse cx={200} cy={236} rx={expr === "yawn" ? 9 : 6} ry={expr === "yawn" ? 12 : 8} fill="#5a1e16" />
          ) : expr === "chew" ? (
            <g>
              <circle cx={176} cy={226} r={10 + Math.sin(t * 12) * 1.5} fill={SKIN} />
              <path d="M192,232 Q200,236 208,232" fill="none" stroke="#7a3a2c" strokeWidth={3} strokeLinecap="round" />
            </g>
          ) : expr === "ouch" ? (
            <path d="M190,236 Q195,230 200,235 Q205,230 210,236" fill="none" stroke="#7a3a2c" strokeWidth={3} strokeLinecap="round" />
          ) : expr === "think" ? (
            <path d="M194,234 Q202,232 208,228" fill="none" stroke="#7a3a2c" strokeWidth={3} strokeLinecap="round" />
          ) : (
            <path d="M193,232 Q200,230 207,232" fill="none" stroke="#7a3a2c" strokeWidth={3} strokeLinecap="round" />
          )}
          {long ? (
            <g>
              {/* kâkül + yüzü çerçeveleyen tutamlar (kulakları örter) */}
              <path d="M142,200 Q138,112 200,110 Q262,112 258,200 Q252,160 236,150 Q222,160 204,146 Q186,162 166,152 Q150,162 142,200 Z" fill={`url(#${id}-curl)`} />
              <path d="M144,170 Q128,250 140,330 L162,330 Q152,250 160,176 Z" fill={`url(#${id}-curl)`} />
              <path d="M256,170 Q272,250 260,330 L238,330 Q248,250 240,176 Z" fill={`url(#${id}-curl)`} />
              <path d="M170,124 Q196,114 226,122" fill="none" stroke={look.hairColor[0]} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
              {look.earrings ? (
                <>
                  <circle cx={150} cy={238} r={6} fill="none" stroke={look.earrings} strokeWidth={3.5} />
                  <circle cx={250} cy={238} r={6} fill="none" stroke={look.earrings} strokeWidth={3.5} />
                </>
              ) : null}
            </g>
          ) : (
            CURLS.map(([x, y, r], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r={r} fill={`url(#${id}-curl)`} />
                <path d={`M${x - r * 0.5},${y} Q${x},${y - r * 0.6} ${x + r * 0.5},${y}`} fill="none" stroke="#d9a46a" strokeWidth={3} opacity={0.6} />
              </g>
            ))
          )}
        </g>
        {/* kollar (cepten çıkınca) */}
        {pose.l ? arm(pose.l, SH_L, "l", !pose.r) : null}
        {pose.r ? arm(pose.r, SH_R, "r", true) : null}
      </g>
    </g>
  );
};
