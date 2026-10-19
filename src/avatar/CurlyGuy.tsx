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

export const CurlyGuy: React.FC<{ id: string; t?: number; blink?: number }> = ({ id, t = 0, blink = 0 }) => {
  const breathe = Math.sin(t * 2) * 1.5;
  const tilt = Math.sin(t * 1.2) * 1.5;
  const open = 1 - blink;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-skin`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#fde4d6" />
          <stop offset="0.7" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_S} />
        </radialGradient>
        <radialGradient id={`${id}-curl`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#c08a55" />
          <stop offset="0.6" stopColor={HAIR} />
          <stop offset="1" stopColor="#5a3518" />
        </radialGradient>
        <radialGradient id={`${id}-ear`} cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#f7b2a4" />
          <stop offset="1" stopColor={PINK} />
        </radialGradient>
        <linearGradient id={`${id}-jacket`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a4d55" />
          <stop offset="0.5" stopColor="#33363d" />
          <stop offset="1" stopColor="#1f2126" />
        </linearGradient>
        <linearGradient id={`${id}-pants`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a5a5e" />
          <stop offset="1" stopColor="#3a3a3e" />
        </linearGradient>
        <linearGradient id={`${id}-shoe`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e2774e" />
          <stop offset="1" stopColor="#b8472b" />
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
          <path d={`M${x - 8},816 l18,0 M${x - 6},828 l20,0 M${x - 4},840 l22,0`} stroke="#fff" strokeWidth={3.5} strokeLinecap="round" />
          <path d={`M${x - 28},868 L${x + 46},868`} stroke="#c45a3a" strokeWidth={2} />
        </g>
      ))}
      {/* çoraplar */}
      <rect x={146} y={784} width={40} height={20} rx={6} fill="#efe9de" />
      <rect x={218} y={784} width={40} height={20} rx={6} fill="#efe9de" />
      {/* pantolon */}
      <path d="M156,620 L198,620 L196,790 L162,790 Z" fill={`url(#${id}-pants)`} />
      <path d="M204,620 L246,620 L242,790 L208,790 Z" fill={`url(#${id}-pants)`} />
      <rect x={154} y={766} width={46} height={24} rx={8} fill="#4a4a4e" />
      <rect x={204} y={766} width={46} height={24} rx={8} fill="#4a4a4e" />
      <path d="M156,778 L200,778 M206,778 L250,778" stroke="#2e2e32" strokeWidth={2} />
      <g transform={`translate(0,${breathe})`}>
        {/* boyun */}
        <rect x={189} y={220} width={22} height={110} rx={10} fill={`url(#${id}-skin)`} />
        <rect x={189} y={226} width={8} height={96} rx={4} fill={SKIN_S} opacity={0.4} />
        {/* kazak (açık cekette görünen) */}
        <path d="M172,320 L228,320 L234,640 L166,640 Z" fill="#e9e1d2" />
        <path d="M172,320 L228,320 L234,640 L166,640 Z" fill={`url(#${id}-knit)`} />
        <rect x={180} y={300} width={40} height={30} rx={12} fill="#e9e1d2" />
        <rect x={180} y={300} width={40} height={30} rx={12} fill={`url(#${id}-knit)`} />
        {/* çanta askısı */}
        <path d="M184,334 L220,560" stroke="#2b2a2a" strokeWidth={4} />
        {/* ceket: iki ön parça, eller cepte */}
        {[-1, 1].map((s) => {
          const d =
            s < 0
              ? "M178,330 Q140,326 128,360 Q112,470 118,600 Q120,640 132,650 L186,652 Q182,520 182,330 Z"
              : "M222,330 Q260,326 272,360 Q288,470 282,600 Q280,640 268,650 L214,652 Q218,520 218,330 Z";
          return (
            <g key={s}>
              <path d={d} fill={`url(#${id}-jacket)`} />
              <path d={d} fill={`url(#${id}-teddy)`} />
            </g>
          );
        })}
        {/* fermuar kenarları + cep çizgileri */}
        <path d="M184,346 L186,648 M216,346 L214,648" stroke="#17181c" strokeWidth={3} />
        <path d="M134,560 Q150,566 160,600 M266,560 Q250,566 240,600" fill="none" stroke="#17181c" strokeWidth={3} opacity={0.7} />
        {/* dik yaka / kapüşon */}
        <path d="M164,352 Q146,312 162,282 Q182,266 194,292 L194,342 Z" fill={`url(#${id}-jacket)`} />
        <path d="M236,352 Q254,312 238,282 Q218,266 206,292 L206,342 Z" fill={`url(#${id}-jacket)`} />
        <path d="M164,352 Q146,312 162,282 Q182,266 194,292 L194,342 Z" fill={`url(#${id}-teddy)`} />
        <path d="M236,352 Q254,312 238,282 Q218,266 206,292 L206,342 Z" fill={`url(#${id}-teddy)`} />
        {/* kafa */}
        <g transform={`rotate(${tilt},200,230)`}>
          <circle cx={146} cy={200} r={22} fill={`url(#${id}-ear)`} />
          <circle cx={254} cy={200} r={22} fill={`url(#${id}-ear)`} />
          <path d="M150,180 Q150,128 200,126 Q250,128 250,180 Q250,222 230,240 Q214,252 200,252 Q186,252 170,240 Q150,222 150,180 Z" fill={`url(#${id}-skin)`} />
          {/* gözler (gözlüğün arkasında, hafif yukarı bakıyor) */}
          {[180, 220].map((x) => (
            <g key={x} transform={`translate(${x},186) scale(1,${Math.max(0.08, open)}) translate(${-x},-186)`}>
              <ellipse cx={x} cy={186} rx={9} ry={10} fill="#fbf8f2" />
              <circle cx={x + 1} cy={182} r={5.5} fill="#2a1a10" />
              <circle cx={x + 3} cy={180} r={1.8} fill="#fff" />
            </g>
          ))}
          {/* kaşlar (hafif endişeli) */}
          <path d="M166,162 Q178,154 190,160 M210,160 Q222,154 234,162" fill="none" stroke="#6a4224" strokeWidth={4} strokeLinecap="round" />
          {/* gözlük */}
          <circle cx={178} cy={186} r={23} fill="#fff" fillOpacity={0.08} stroke="#141414" strokeWidth={6} />
          <circle cx={222} cy={186} r={23} fill="#fff" fillOpacity={0.08} stroke="#141414" strokeWidth={6} />
          <path d="M197,182 Q200,178 203,182" fill="none" stroke="#141414" strokeWidth={5} />
          <path d="M155,182 L148,180 M245,182 L252,180" stroke="#141414" strokeWidth={5} />
          <path d="M168,174 Q174,168 182,168" fill="none" stroke="#fff" strokeWidth={3} opacity={0.5} />
          {/* burun */}
          <ellipse cx={200} cy={208} rx={12} ry={11} fill={PINK} />
          <ellipse cx={196} cy={204} rx={4} ry={3} fill="#fff" opacity={0.45} />
          {/* ağız */}
          <path d="M193,232 Q200,230 207,232" fill="none" stroke="#7a3a2c" strokeWidth={3} strokeLinecap="round" />
          {/* kıvırcık saç */}
          {CURLS.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={`url(#${id}-curl)`} />
              <path d={`M${x - r * 0.5},${y} Q${x},${y - r * 0.6} ${x + r * 0.5},${y}`} fill="none" stroke="#d9a46a" strokeWidth={3} opacity={0.6} />
            </g>
          ))}
        </g>
      </g>
    </g>
  );
};
