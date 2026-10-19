/**
 * Bora — yandan görünüm, pozlanabilir (KnitGuy taslağından): uzun ince boyun, bere, sağa bakar.
 * (Önden görünüm: `Bora.tsx`.) Videolarda hareketli sahneler için.
 * Kullanıcı isteği: buğday ten, dikkat çeken spor kıyafeti, bej zemin.
 * Hareketli: yakın kol pozlanır (dirsek/bilek + el biçimi + elde nesne), yüz ifadeleri, baş eğimi.
 * 400x880 yerel kutu, yer çizgisi y=850. Sahnede: translate(x,y) scale(s) translate(-220,-850).
 */
import React from "react";

type P = [number, number];

export type BoraOutfit = {
  top: string;
  topS: string;
  stripe: string;
  pants: string;
  pantsStripe: string;
  beanie: string;
  shoe: string;
  sole: string;
  /** göğüste geniş renk bloğu (renk bloklu ceket) */
  block?: string;
  /** boyun arkasında kapüşon */
  hood?: boolean;
  /** kol boyu: uzun (ceket), kısa (tişört/forma), yok (atlet) */
  sleeves?: "long" | "short" | "none";
  /** alt: eşofman ya da şort */
  bottom?: "pants" | "shorts";
  /** çorap rengi (şortla) */
  socks?: string;
  /** başlık: bere, kep, saç + saç bandı, sadece saç */
  head?: "beanie" | "cap" | "band" | "hair";
  /** formada numara */
  number?: string;
  /** ceket ayrıntıları (fermuar, dik yaka, lastikli bel) */
  jacket?: boolean;
  /** örgü kazak dokusu (üst + kol) */
  knit?: boolean;
  /** kareli pantolon: desenin ikinci rengi */
  plaid?: string;
  /** ayakkabı burnu (krem lastik burun) */
  toe?: string;
};

/** varsayılan: elektrik mavisi eşofman üstü + neon şeritler, siyah jogger, neon tabanlı beyaz ayakkabı */
export const BORA_OUTFITS: { name: string; desc: string; o: BoraOutfit }[] = [
  {
    name: "Basketbolcu",
    desc: "Kolsuz forma 23, uzun şort, saç bandı",
    o: { top: "#e63946", topS: "#b02531", stripe: "#ffffff", sleeves: "none", number: "23", bottom: "shorts", pants: "#e63946", pantsStripe: "#ffffff", socks: "#ffffff", head: "band", beanie: "#ffffff", shoe: "#ffffff", sole: "#e63946" },
  },
  {
    name: "Futbolcu",
    desc: "Sarı-lacivert forma 10, şort, uzun çorap",
    o: { top: "#ffd23f", topS: "#e0a800", stripe: "#1f2a6b", sleeves: "short", number: "10", bottom: "shorts", pants: "#1f2a6b", pantsStripe: "#ffd23f", socks: "#ffd23f", head: "hair", beanie: "#1f2a6b", shoe: "#1f2a6b", sole: "#ffd23f" },
  },
  {
    name: "Koşucu",
    desc: "Neon atlet, siyah şort, kep",
    o: { top: "#c6f432", topS: "#97c214", stripe: "#1c1d22", sleeves: "none", bottom: "shorts", pants: "#1c1d22", pantsStripe: "#c6f432", socks: "#1c1d22", head: "cap", beanie: "#1c1d22", shoe: "#ffffff", sole: "#c6f432" },
  },
  {
    name: "Tenisçi",
    desc: "Beyaz tişört, yeşil şort, yeşil saç bandı",
    o: { top: "#ffffff", topS: "#d6d9de", stripe: "#1f8a4c", sleeves: "short", bottom: "shorts", pants: "#1f8a4c", pantsStripe: "#ffffff", socks: "#ffffff", head: "band", beanie: "#1f8a4c", shoe: "#ffffff", sole: "#1f8a4c" },
  },
];

/** kullanıcının seçtiği görünüm (Pinterest örgü referansı): pembe örgü kazak, mavi kareli pantolon, mavi bere ve ayakkabı */
export const BORA_ORGU: BoraOutfit = {
  top: "#f08b8f",
  topS: "#c9636a",
  stripe: "none",
  knit: true,
  pants: "#2f6fd1",
  plaid: "#f4ead8",
  pantsStripe: "none",
  beanie: "#2f6fd1",
  shoe: "#2f6fd1",
  sole: "#efe3cc",
  toe: "#efe3cc",
};

export const BORA_SPORT: BoraOutfit = {
  top: "#2f6bff",
  topS: "#1d47c2",
  stripe: "#d8ff3a",
  pants: "#24252d",
  pantsStripe: "#d8ff3a",
  beanie: "#26262b",
  shoe: "#ffffff",
  sole: "#d8ff3a",
};

// açık buğday ten (KnitGuy WHEAT_SKIN ile aynı; kullanıcı "biraz daha aç" dedi)
const SKIN = "#eabd93";
const SKIN_S = "#c9946b";
const SKIN_H = "#f7d6b4";
const INK = "#1a0f0a";

export type BoraHand = "fist" | "point" | "thumb" | "open";
export type BoraExpr = "neutral" | "smile" | "grin" | "chew" | "surprise" | "think" | "ouch" | "yawn" | "happy" | "laugh";
export type BoraPose = {
  /** dirsek ve bilek (yerel koordinat); verilmezse eller cepte */
  el?: P;
  wr?: P;
  hand?: BoraHand;
  /** el yönü (derece; 0 = yukarı) — parmak/başparmak için */
  handRot?: number;
  /** baş eğimi (derece, + öne/aşağı) */
  head?: number;
  /** göz bebeği kayması */
  lx?: number;
  ly?: number;
};

const SH: P = [236, 332];

const HEAD =
  "M176,150 Q174,92 222,90 Q266,92 268,140 L281,166 Q285,173 270,175 L268,190 Q262,216 236,216 Q196,214 182,190 Q174,172 176,150 Z";
const BODY = "M126,334 Q148,282 214,278 Q278,282 300,334 Q320,424 306,524 Q214,546 122,524 Q108,424 126,334 Z";
const SLEEVE = "M194,306 Q262,296 276,362 Q290,432 272,494 Q240,510 212,494 Q204,420 194,306 Z";
const SHORTS = "M140,512 L294,512 Q302,590 304,660 L222,660 Q218,630 214,600 Q208,630 196,660 L136,660 Q134,590 140,512 Z";
const PANTS = "M140,512 L294,512 Q304,650 300,800 L222,800 Q218,700 214,650 Q208,700 194,800 L144,800 Q134,650 140,512 Z";
const BEANIE = "M168,128 Q164,62 222,58 Q278,60 276,128 Z";

/** elin sahnedeki konumu: bilekten kol doğrultusunda biraz ileri */
export const boraHandAt = (pose: BoraPose): P | null => {
  if (!pose.el || !pose.wr) return null;
  const dx = pose.wr[0] - pose.el[0];
  const dy = pose.wr[1] - pose.el[1];
  const L = Math.hypot(dx, dy) || 1;
  return [pose.wr[0] + (dx / L) * 26, pose.wr[1] + (dy / L) * 26];
};

const Shoe: React.FC<{ x: number; o: BoraOutfit }> = ({ x, o }) => (
  <g transform={`translate(${x},0)`}>
    <path d="M0,848 L0,818 Q8,800 40,802 L70,804 Q104,808 112,832 L114,848 Z" fill={o.shoe} />
    <path d="M0,818 Q8,800 40,802 L70,804 Q104,808 112,832" fill="none" stroke="#00000022" strokeWidth={4} />
    {o.toe ? <path d="M72,806 Q104,810 112,832 L80,834 Q70,820 72,806 Z" fill={o.toe} /> : <path d="M30,826 Q60,812 96,826" fill="none" stroke={o.sole} strokeWidth={6} strokeLinecap="round" />}
    <rect x={-2} y={834} width={118} height={16} rx={6} fill={o.sole} />
    <path d="M2,842 L112,842" stroke="#00000030" strokeWidth={2} />
    <path d="M36,806 l8,10 M48,805 l8,10 M60,805 l8,10" stroke="#b9bcc6" strokeWidth={3.5} strokeLinecap="round" />
  </g>
);

const Hand: React.FC<{ at: P; type: BoraHand; rot: number }> = ({ at, type, rot }) => (
  <g transform={`translate(${at[0]},${at[1]}) rotate(${rot})`}>
    {type === "point" ? (
      <g>
        <rect x={-9} y={-62} width={18} height={50} rx={9} fill={SKIN} />
        <rect x={-9} y={-62} width={7} height={50} rx={3.5} fill={SKIN_H} opacity={0.6} />
      </g>
    ) : null}
    {type === "thumb" ? (
      <g>
        <rect x={-10} y={-58} width={20} height={42} rx={10} fill={SKIN} />
        <rect x={-10} y={-58} width={7} height={42} rx={3.5} fill={SKIN_H} opacity={0.6} />
      </g>
    ) : null}
    {type === "open" ? (
      <ellipse cx={0} cy={0} rx={22} ry={34} fill={SKIN} />
    ) : (
      <circle cx={0} cy={0} r={27} fill={SKIN} />
    )}
    <circle cx={-8} cy={-8} r={type === "open" ? 10 : 12} fill={SKIN_H} opacity={0.55} />
    {type === "fist" || type === "point" || type === "thumb" ? (
      <path d="M-14,8 Q0,16 14,8" fill="none" stroke={SKIN_S} strokeWidth={3} strokeLinecap="round" />
    ) : null}
  </g>
);

export const Bora: React.FC<{
  id: string;
  t?: number;
  o?: BoraOutfit;
  pose?: BoraPose;
  expr?: BoraExpr;
  /** elde tutulan nesne (yerel koordinatta, el konumuna taşınır; elin arkasında çizilir) */
  item?: React.ReactNode;
  /** göz kırpma (0-1) */
  blink?: number;
}> = ({ id, t = 0, o = BORA_ORGU, pose = {}, expr = "neutral", item, blink = 0 }) => {
  const breathe = Math.sin(t * 2) * 1.5;
  const sleeves = o.sleeves ?? "long";
  const shorts = o.bottom === "shorts";
  const head = o.head ?? "beanie";
  const jacket = o.jacket ?? (sleeves === "long" && !o.hood && !o.knit);
  const pantsFill = o.plaid ? `url(#${id}-plaid)` : o.pants;
  // kolsuz/kısa kolluda eller cepte duramaz: kol yanda sarkar
  if (!pose.el && sleeves !== "long") pose = { ...pose, el: [246, 440], wr: [250, 530] };
  const posed = !!(pose.el && pose.wr);
  const hand = boraHandAt(pose);
  const lx = pose.lx ?? (expr === "think" ? -2 : 0);
  const ly = pose.ly ?? (expr === "think" ? -4 : 0);

  // göz durumu
  const eye: "open" | "wide" | "closed" | "squeeze" | "half" =
    expr === "surprise" ? "wide" : expr === "happy" || expr === "laugh" ? "closed" : expr === "ouch" ? "squeeze" : expr === "yawn" ? "half" : blink > 0.5 ? "closed" : "open";
  const browY = expr === "surprise" || expr === "think" ? -12 : expr === "ouch" ? 4 : 0;
  const browTilt = expr === "ouch" ? 8 : expr === "think" ? -6 : 0;

  // kol: omuz → dirsek → bilek, şerit kolun dış kenarında
  const armPath = posed ? `M${SH[0]},${SH[1]} L${pose.el![0]},${pose.el![1]} L${pose.wr![0]},${pose.wr![1]}` : "";
  const off = (a: P, b: P, d: number): [P, P] => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * d;
    const ny = (dx / L) * d;
    return [
      [a[0] + nx, a[1] + ny],
      [b[0] + nx, b[1] + ny],
    ];
  };

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.26} />
        </linearGradient>
        <radialGradient id={`${id}-skin`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={SKIN_H} />
          <stop offset="0.7" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_S} />
        </radialGradient>
        <pattern id={`${id}-knit`} width={14} height={12} patternUnits="userSpaceOnUse">
          <path d="M0,0 L7,10 L14,0" fill="none" stroke={o.topS} strokeWidth={2.6} opacity={0.6} />
        </pattern>
        <pattern id={`${id}-plaid`} width={46} height={46} patternUnits="userSpaceOnUse">
          <rect width={46} height={46} fill={o.pants} />
          <rect x={0} y={15} width={46} height={15} fill={o.plaid ?? o.pants} opacity={0.6} />
          <rect x={15} y={0} width={15} height={46} fill={o.plaid ?? o.pants} opacity={0.6} />
          <rect x={15} y={15} width={15} height={15} fill={o.plaid ?? o.pants} opacity={0.5} />
        </pattern>
        <pattern id={`${id}-rib`} width={8} height={10} patternUnits="userSpaceOnUse">
          <path d="M4,0 L4,10" stroke="#000" strokeWidth={2.5} opacity={0.2} />
        </pattern>
      </defs>
      {/* zemin gölgesi */}
      <ellipse cx={220} cy={850} rx={150} ry={14} fill="#000" opacity={0.15} />
      {shorts ? (
        <g>
          {/* bacaklar + çoraplar */}
          <rect x={150} y={630} width={40} height={190} rx={18} fill={`url(#${id}-skin)`} />
          <rect x={228} y={630} width={44} height={190} rx={18} fill={`url(#${id}-skin)`} />
          <rect x={148} y={736} width={44} height={84} rx={10} fill={o.socks ?? "#ffffff"} />
          <rect x={226} y={736} width={48} height={84} rx={10} fill={o.socks ?? "#ffffff"} />
          <path d="M148,752 L192,752 M226,752 L274,752" stroke={o.pantsStripe} strokeWidth={6} />
        </g>
      ) : null}
      <Shoe x={140} o={o} />
      {shorts ? (
        <g>
          <path d={SHORTS} fill={o.pants} />
          <path d={SHORTS} fill={`url(#${id}-shade)`} />
          <path d="M288,520 Q296,580 296,656" fill="none" stroke={o.pantsStripe} strokeWidth={9} />
          <path d="M138,650 L214,650 M222,654 L304,654" stroke={o.pantsStripe} strokeWidth={6} />
        </g>
      ) : (
        <g>
          {/* jogger */}
          <path d={PANTS} fill={pantsFill} />
          <path d={PANTS} fill={`url(#${id}-shade)`} />
          <path d="M286,520 Q296,650 292,780" fill="none" stroke={o.pantsStripe} strokeWidth={9} />
          {/* lastikli paçalar */}
          <rect x={140} y={782} width={58} height={26} rx={10} fill={pantsFill} />
          <rect x={140} y={782} width={58} height={26} rx={10} fill={`url(#${id}-rib)`} />
          <rect x={216} y={782} width={88} height={26} rx={10} fill={pantsFill} />
          <rect x={216} y={782} width={88} height={26} rx={10} fill={`url(#${id}-rib)`} />
        </g>
      )}
      <Shoe x={204} o={o} />

      <g transform={`translate(0,${breathe})`}>
        {/* boyun */}
        <rect x={203} y={196} width={26} height={100} rx={12} fill={`url(#${id}-skin)`} />
        <rect x={203} y={200} width={10} height={90} rx={5} fill={SKIN_S} opacity={0.35} />
        {/* kapüşon (boynun arkasında) */}
        {o.hood ? <path d="M146,318 Q140,252 196,256 Q206,284 204,318 Z" fill={o.topS} /> : null}
        {/* eşofman üstü */}
        <path d={BODY} fill={o.top} />
        {o.block ? (
          <g>
            <clipPath id={`${id}-body`}>
              <path d={BODY} />
            </clipPath>
            <rect x={100} y={360} width={240} height={70} fill={o.block} clipPath={`url(#${id}-body)`} />
          </g>
        ) : null}
        {o.knit ? <path d={BODY} fill={`url(#${id}-knit)`} /> : null}
        <path d={BODY} fill={`url(#${id}-shade)`} />
        {o.knit ? (
          <g>
            {/* örgü bel ve balıkçı yaka */}
            <rect x={122} y={504} width={186} height={30} rx={12} fill={o.top} />
            <rect x={122} y={504} width={186} height={30} rx={12} fill={`url(#${id}-rib)`} />
            <rect x={186} y={264} width={62} height={40} rx={18} fill={o.top} />
            <rect x={186} y={264} width={62} height={40} rx={18} fill={`url(#${id}-rib)`} />
            <rect x={186} y={264} width={62} height={40} rx={18} fill={`url(#${id}-shade)`} />
          </g>
        ) : null}
        {/* yan panel şeridi */}
        <path d="M132,350 Q118,430 128,520" fill="none" stroke={o.stripe} strokeWidth={10} strokeLinecap="round" />
        {o.number ? (
          <text x={214} y={470} textAnchor="middle" fontFamily="Geist, Helvetica, Arial, sans-serif" fontWeight={800} fontSize={92} fill={o.stripe} stroke={o.topS} strokeWidth={4} paintOrder="stroke">
            {o.number}
          </text>
        ) : null}
        {jacket ? (
          <g>
            {/* fermuar */}
            <path d="M296,312 Q314,420 304,520" fill="none" stroke="#ffffff" strokeWidth={4} opacity={0.85} />
            <circle cx={300} cy={318} r={6} fill="#ffffff" />
            {/* lastikli bel */}
            <rect x={122} y={506} width={186} height={26} rx={12} fill={o.topS} />
            <rect x={122} y={506} width={186} height={26} rx={12} fill={`url(#${id}-rib)`} />
            {/* dik yaka */}
            <path d="M190,300 L192,266 Q218,256 248,266 L250,300 Z" fill={o.top} />
            <path d="M190,300 L192,266 Q218,256 248,266 L250,300 Z" fill={`url(#${id}-shade)`} />
            <path d="M192,272 Q220,262 248,272" fill="none" stroke={o.stripe} strokeWidth={5} />
          </g>
        ) : (
          <g>
            {/* yuvarlak yaka + etek bandı */}
            <path d="M194,286 Q218,300 244,284" fill="none" stroke={o.stripe} strokeWidth={8} strokeLinecap="round" />
            <path d="M124,516 Q214,536 306,516" fill="none" stroke={o.stripe} strokeWidth={7} strokeLinecap="round" />
          </g>
        )}

        {/* kol */}
        {posed ? (
          <g>
            {sleeves === "long" ? (
              <>
                <path d={armPath} fill="none" stroke={o.topS} strokeWidth={66} strokeLinecap="round" strokeLinejoin="round" />
                <path d={armPath} fill="none" stroke={o.top} strokeWidth={58} strokeLinecap="round" strokeLinejoin="round" />
                {o.knit ? <path d={armPath} fill="none" stroke={`url(#${id}-knit)`} strokeWidth={58} strokeLinecap="round" strokeLinejoin="round" /> : null}
              </>
            ) : (
              <>
                <path d={armPath} fill="none" stroke={SKIN_S} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" />
                <path d={armPath} fill="none" stroke={SKIN} strokeWidth={44} strokeLinecap="round" strokeLinejoin="round" />
                {sleeves === "short" ? (
                  <path d={`M${SH[0]},${SH[1]} L${SH[0] + (pose.el![0] - SH[0]) * 0.5},${SH[1] + (pose.el![1] - SH[1]) * 0.5}`} stroke={o.top} strokeWidth={66} strokeLinecap="round" />
                ) : (
                  <circle cx={SH[0]} cy={SH[1]} r={30} fill={SKIN} />
                )}
              </>
            )}
            {sleeves === "long" ? (() => {
              const [a1, b1] = off(SH, pose.el!, 17);
              const [a2, b2] = off(pose.el!, pose.wr!, 15);
              return (
                <path d={`M${a1[0]},${a1[1]} L${b1[0]},${b1[1]} L${a2[0]},${a2[1]} L${b2[0]},${b2[1]}`} fill="none" stroke={o.stripe} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
              );
            })() : null}
            {o.block && sleeves === "long" ? (
              <path
                d={`M${SH[0] + (pose.el![0] - SH[0]) * 0.35},${SH[1] + (pose.el![1] - SH[1]) * 0.35} L${SH[0] + (pose.el![0] - SH[0]) * 0.75},${SH[1] + (pose.el![1] - SH[1]) * 0.75}`}
                stroke={o.block}
                strokeWidth={58}
              />
            ) : null}
            {sleeves === "long" ? <circle cx={pose.wr![0]} cy={pose.wr![1]} r={29} fill={o.topS} /> : null}
            {item && hand ? <g transform={`translate(${hand[0]},${hand[1]})`}>{item}</g> : null}
            {hand ? <Hand at={hand} type={pose.hand ?? "fist"} rot={pose.handRot ?? 0} /> : null}
          </g>
        ) : (
          <g>
            <path d={SLEEVE} fill={o.top} />
            {o.knit ? <path d={SLEEVE} fill={`url(#${id}-knit)`} /> : null}
            <path d={SLEEVE} fill={`url(#${id}-shade)`} />
            <path d="M262,330 Q284,410 270,490" fill="none" stroke={o.stripe} strokeWidth={7} strokeLinecap="round" />
            {o.block ? <path d="M200,372 Q244,362 280,372 L284,428 Q244,420 206,430 Z" fill={o.block} /> : null}
            <path d="M212,492 Q240,506 272,492" fill="none" stroke={o.topS} strokeWidth={5} opacity={0.7} />
          </g>
        )}

        {/* baş */}
        <g transform={`rotate(${pose.head ?? 0} 216 230)`}>
          <ellipse cx={197} cy={154} rx={12} ry={17} fill={SKIN} />
          <path d="M194,146 q6,8 0,16" fill="none" stroke={SKIN_S} strokeWidth={3} />
          <path d={HEAD} fill={`url(#${id}-skin)`} />
          {/* çiğnerken yanak şişer */}
          {expr === "chew" ? <circle cx={250} cy={184} r={18 + Math.sin(t * 12) * 2} fill={SKIN} /> : null}
          <ellipse cx={248} cy={176} rx={14} ry={8} fill="#e0604a" opacity={expr === "laugh" || expr === "happy" ? 0.4 : 0.25} />

          {/* göz */}
          {eye === "closed" ? (
            <path d="M238,142 Q248,131 258,142" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
          ) : eye === "squeeze" ? (
            <path d="M240,133 L257,140 L240,147" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <g>
              {eye === "wide" ? (
                <ellipse cx={249} cy={139} rx={11} ry={10} fill="#fbf6ef" />
              ) : (
                <path d="M238,140 Q248,132 258,140 Q248,148 238,140 Z" fill="#fbf6ef" />
              )}
              <circle cx={252 + lx} cy={140 + ly} r={eye === "wide" ? 4 : 4.5} fill={INK} />
              <circle cx={253.5 + lx} cy={138.5 + ly} r={1.4} fill="#fff" />
              {eye === "half" ? <path d="M236,132 Q248,128 260,134 L260,140 Q248,138 236,140 Z" fill={SKIN} /> : null}
              <path
                d={eye === "wide" ? "M236,136 Q248,124 261,134" : eye === "half" ? "M236,140 Q248,137 260,140" : "M236,138 Q248,128 260,137"}
                fill="none"
                stroke={INK}
                strokeWidth={2.6}
                strokeLinecap="round"
              />
            </g>
          )}
          {/* kaş */}
          <path
            d="M238,124 Q250,118 262,124"
            fill="none"
            stroke={INK}
            strokeWidth={4}
            strokeLinecap="round"
            transform={`translate(0,${browY}) rotate(${browTilt} 250 122)`}
          />

          {/* ağız */}
          {expr === "smile" || expr === "happy" ? (
            <path d="M252,190 Q264,202 274,189" fill="none" stroke="#7a3424" strokeWidth={3.5} strokeLinecap="round" />
          ) : expr === "grin" || expr === "laugh" ? (
            <g>
              <path d="M250,188 Q264,210 277,187 Z" fill="#5a1e16" />
              <path d="M252,189 L276,188 L274,194 Q263,196 254,194 Z" fill="#ffffff" />
            </g>
          ) : expr === "yawn" || expr === "surprise" ? (
            <ellipse cx={266} cy={197} rx={expr === "yawn" ? 9 : 6} ry={expr === "yawn" ? 14 : 8} fill="#5a1e16" />
          ) : expr === "ouch" ? (
            <path d="M255,198 Q264,190 273,198" fill="none" stroke="#7a3424" strokeWidth={3.5} strokeLinecap="round" />
          ) : expr === "think" ? (
            <path d="M258,195 Q266,193 272,190" fill="none" stroke="#7a3424" strokeWidth={3} strokeLinecap="round" />
          ) : (
            <path d="M262,194 Q268,196 270,192" fill="none" stroke="#7a3424" strokeWidth={3} strokeLinecap="round" />
          )}

          {/* saç (bere yoksa) */}
          {head !== "beanie" ? (
            <path d="M174,150 Q168,90 222,84 Q272,86 270,128 Q254,112 230,114 Q214,116 206,128 Q194,128 186,156 Z" fill="#2a1c14" />
          ) : null}
          {head === "band" ? (
            <g>
              <path d="M172,128 Q222,110 272,122 L270,142 Q222,130 174,150 Z" fill={o.beanie} />
              <path d="M174,140 Q222,124 272,132" fill="none" stroke={o.stripe} strokeWidth={4} />
            </g>
          ) : null}
          {head === "cap" ? (
            <g>
              <path d="M170,132 Q166,76 222,72 Q274,76 274,124 Z" fill={o.beanie} />
              <path d="M170,132 Q166,76 222,72 Q274,76 274,124 Z" fill={`url(#${id}-shade)`} />
              <path d="M262,114 Q308,112 322,128 Q296,134 266,132 Z" fill={o.beanie} />
              <path d="M266,132 Q296,134 322,128" fill="none" stroke="#000" strokeWidth={3} opacity={0.2} />
              <circle cx={222} cy={74} r={6} fill={o.stripe} />
              <path d="M200,100 Q232,92 258,104" fill="none" stroke={o.stripe} strokeWidth={5} />
            </g>
          ) : null}
          {/* bere */}
          {head === "beanie" ? <g transform="translate(0,-20)">
            <path d={BEANIE} fill={o.beanie} />
            <path d={BEANIE} fill={`url(#${id}-rib)`} />
            <path d={BEANIE} fill={`url(#${id}-shade)`} />
            <path d="M164,120 Q222,108 280,120 L280,146 Q222,134 164,146 Z" fill={o.beanie} />
            <path d="M164,120 Q222,108 280,120 L280,146 Q222,134 164,146 Z" fill={`url(#${id}-rib)`} />
            <path d="M164,140 Q222,128 280,140 L280,146 Q222,134 164,146 Z" fill="#000" opacity={0.15} />
            {/* neon etiket */}
            <rect x={246} y={118} width={22} height={14} rx={3} fill={o.stripe} transform="rotate(-6 257 125)" />
          </g> : null}
        </g>
      </g>
    </g>
  );
};
