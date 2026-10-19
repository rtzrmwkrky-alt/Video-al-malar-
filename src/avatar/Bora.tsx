/**
 * BORA — kanal karakteri (önden). Keçe/oyuncak hissi: yumuşak gradyan gölgeler + ince keçe dokusu.
 * Koyu ten, uzun ince boyun, siyah örgü bere, turuncu kapüşonlu, beyaz şeritli gri eşofman, beyaz ayakkabı.
 * 400x880 yerel kutu, yer y=860. `pose` kol duruşu, `expr` yüz ifadesi, `talk` ağız açıklığı (0-1).
 */
import React from "react";

type P = [number, number];
export type BoraPose = "pocket" | "cheeks" | "point" | "tired" | "cheer" | "phone" | "dumbbell";
export type BoraExpr = "smile" | "talk" | "surprised" | "tired" | "happy" | "smug";

const SKIN = "#5e3a28";
const SKIN_D = "#432819";
const SKIN_L = "#80523a";
const HOOD = "#ff7a2f";
const HOOD_D = "#d9561a";
const HOOD_L = "#ffa063";
const GRAY = "#8f949e";
const GRAY_D = "#6c717b";

/** kol: omuz → dirsek → el (kalın yumuşak kapüşonlu kolu) */
const ARMS: Record<BoraPose, { l: [P, P]; r: [P, P] }> = {
  pocket: { l: [[116, 430], [166, 486]], r: [[284, 430], [234, 486]] },
  cheeks: { l: [[104, 300], [158, 186]], r: [[296, 300], [242, 186]] },
  point: { l: [[116, 430], [166, 486]], r: [[318, 330], [306, 236]] },
  tired: { l: [[118, 440], [122, 540]], r: [[282, 440], [278, 540]] },
  cheer: { l: [[92, 256], [70, 166]], r: [[308, 256], [330, 166]] },
  phone: { l: [[126, 452], [184, 418]], r: [[274, 452], [216, 418]] },
  dumbbell: { l: [[116, 430], [166, 486]], r: [[300, 440], [282, 360]] },
};

const Arm: React.FC<{ s: P; e: P; h: P; id: string }> = ({ s, e, h, id }) => {
  const d = `M${s[0]},${s[1]} Q${e[0]},${e[1]} ${h[0]},${h[1]}`;
  // dirsek noktası kontrol noktası olarak kullanılıyor; kolu biraz dirseğe yaklaştır
  const d2 = `M${s[0]},${s[1]} L${e[0]},${e[1]} L${h[0]},${h[1]}`;
  void d;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d2} stroke={HOOD_D} strokeWidth={50} />
      <path d={d2} stroke={`url(#${id}-hoodH)`} strokeWidth={42} />
      {/* bilek lastiği */}
      <circle cx={h[0] + (e[0] - h[0]) * 0.12} cy={h[1] + (e[1] - h[1]) * 0.12} r={20} fill={HOOD_D} />
      <circle cx={h[0]} cy={h[1]} r={16} fill={`url(#${id}-skin)`} />
    </g>
  );
};

const Face: React.FC<{ expr: BoraExpr; talk: number; blink: number }> = ({ expr, talk, blink }) => {
  const ex = [182, 218];
  const ey = 146;
  const open = expr === "happy" ? 0 : expr === "tired" ? 0.45 : expr === "surprised" ? 1.25 : 1;
  const o = Math.max(0, open * (1 - blink));
  const browY = expr === "surprised" ? -8 : expr === "tired" ? 4 : 0;
  const mouthOpen = expr === "surprised" ? 0.9 : expr === "tired" ? 0.6 : expr === "talk" ? talk : expr === "happy" ? 0.7 : 0;
  return (
    <g>
      {ex.map((x, i) => (
        <g key={i}>
          {o > 0.08 ? (
            <g transform={`translate(${x},${ey}) scale(1,${Math.min(o, 1.3)}) translate(${-x},${-ey})`}>
              <ellipse cx={x} cy={ey} rx={10} ry={12} fill="#f7f1e8" />
              <circle cx={x + 1} cy={ey + 1} r={6.5} fill="#24140c" />
              <circle cx={x + 3} cy={ey - 2} r={2.2} fill="#fff" />
            </g>
          ) : expr === "happy" ? (
            <path d={`M${x - 9},${ey + 3} Q${x},${ey - 8} ${x + 9},${ey + 3}`} fill="none" stroke="#1c0f08" strokeWidth={3.5} strokeLinecap="round" />
          ) : (
            <path d={`M${x - 9},${ey} Q${x},${ey + 5} ${x + 9},${ey}`} fill="none" stroke="#1c0f08" strokeWidth={3} strokeLinecap="round" />
          )}
          {expr === "tired" ? <path d={`M${x - 11},${ey - 3} L${x + 11},${ey - 3}`} stroke={SKIN_D} strokeWidth={6} strokeLinecap="round" /> : null}
        </g>
      ))}
      {/* kaşlar */}
      {expr === "smug" ? (
        <path d="M170,128 Q182,124 192,128 M208,122 Q220,114 230,121" fill="none" stroke="#1c0f08" strokeWidth={4} strokeLinecap="round" />
      ) : expr === "tired" ? (
        <path d={`M170,${128 + browY} Q182,${122 + browY} 192,${126 + browY} M208,${126 + browY} Q218,${122 + browY} 230,${128 + browY}`} fill="none" stroke="#1c0f08" strokeWidth={4} strokeLinecap="round" />
      ) : (
        <path d={`M170,${128 + browY} Q182,${122 + browY} 192,${127 + browY} M208,${127 + browY} Q218,${122 + browY} 230,${128 + browY}`} fill="none" stroke="#1c0f08" strokeWidth={4} strokeLinecap="round" />
      )}
      {/* burun */}
      <path d="M197,154 Q200,170 194,172 Q200,176 206,172" fill="none" stroke={SKIN_D} strokeWidth={3} strokeLinecap="round" />
      {/* yanaklar */}
      <ellipse cx={170} cy={168} rx={9} ry={5} fill="#d9614a" opacity={0.35} />
      <ellipse cx={230} cy={168} rx={9} ry={5} fill="#d9614a" opacity={0.35} />
      {/* ağız */}
      {mouthOpen < 0.08 ? (
        expr === "smug" ? (
          <path d="M190,186 Q202,192 214,182" fill="none" stroke="#2a120a" strokeWidth={3.5} strokeLinecap="round" />
        ) : (
          <path d="M188,184 Q200,194 212,184" fill="none" stroke="#2a120a" strokeWidth={3.5} strokeLinecap="round" />
        )
      ) : expr === "surprised" || expr === "tired" ? (
        <ellipse cx={200} cy={189} rx={6 + mouthOpen * 2} ry={5 + mouthOpen * 7} fill="#3a120c" />
      ) : (
        <g>
          <path d={`M186,182 Q200,186 214,182 Q210,${190 + mouthOpen * 12} 200,${191 + mouthOpen * 12} Q190,${190 + mouthOpen * 12} 186,182 Z`} fill="#3a120c" />
          <path d="M189,183 Q200,186 211,183 L209,187 Q200,189 191,187 Z" fill="#fff" />
        </g>
      )}
    </g>
  );
};

export const Bora: React.FC<{ id: string; pose?: BoraPose; expr?: BoraExpr; talk?: number; t?: number; blink?: number }> = ({
  id,
  pose = "pocket",
  expr = "smile",
  talk = 0,
  t = 0,
  blink = 0,
}) => {
  const a = ARMS[pose];
  const breathe = Math.sin(t * 2) * 1.5;
  const headTilt = pose === "phone" || pose === "tired" ? 6 : Math.sin(t * 1.3) * 1.5;
  const headDrop = pose === "phone" || pose === "tired" ? 6 : 0;
  const pocketHands = pose === "pocket" || pose === "point" || pose === "dumbbell";
  return (
    <g filter={`url(#${id}-felt)`}>
      <defs>
        <filter id={`${id}-felt`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.16 0" result="na" />
          <feComposite in="na" in2="SourceAlpha" operator="in" result="nb" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="nb" />
          </feMerge>
        </filter>
        <radialGradient id={`${id}-skin`} cx="0.35" cy="0.3" r="0.85">
          <stop offset="0" stopColor={SKIN_L} />
          <stop offset="0.65" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_D} />
        </radialGradient>
        <linearGradient id={`${id}-hoodH`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={HOOD_L} />
          <stop offset="0.55" stopColor={HOOD} />
          <stop offset="1" stopColor={HOOD_D} />
        </linearGradient>
        <linearGradient id={`${id}-pants`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a9aeb8" />
          <stop offset="0.5" stopColor={GRAY} />
          <stop offset="1" stopColor={GRAY_D} />
        </linearGradient>
        <linearGradient id={`${id}-beanie`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a4a52" />
          <stop offset="1" stopColor="#141418" />
        </linearGradient>
        <pattern id={`${id}-rib`} width={9} height={10} patternUnits="userSpaceOnUse">
          <path d="M4.5,0 L4.5,10" stroke="#000" strokeWidth={3} opacity={0.35} />
        </pattern>
      </defs>
      <ellipse cx={200} cy={862} rx={130} ry={14} fill="#000" opacity={0.16} />
      {/* ayakkabılar */}
      {[158, 242].map((x) => (
        <g key={x}>
          <path d={`M${x - 42},858 L${x - 42},834 Q${x - 38},808 ${x},806 Q${x + 38},808 ${x + 42},834 L${x + 42},858 Z`} fill="#f7f5f0" />
          <rect x={x - 46} y={842} width={92} height={18} rx={8} fill="#e6dfd2" />
          <path d={`M${x - 14},818 l28,0 M${x - 16},828 l32,0`} stroke="#cfc8ba" strokeWidth={3.5} strokeLinecap="round" />
          <path d={`M${x - 30},834 Q${x},${826} ${x + 30},834`} fill="none" stroke="#fff" strokeWidth={4} opacity={0.8} />
        </g>
      ))}
      {/* eşofman */}
      <path d="M130,520 L270,520 Q282,670 284,812 L208,812 L202,620 L198,620 L192,812 L116,812 Q118,670 130,520 Z" fill={`url(#${id}-pants)`} />
      <path d="M128,540 Q120,680 120,808 M272,540 Q280,680 280,808" fill="none" stroke="#fff" strokeWidth={8} />
      <rect x={114} y={798} width={80} height={20} rx={9} fill={GRAY_D} />
      <rect x={206} y={798} width={80} height={20} rx={9} fill={GRAY_D} />
      <g transform={`translate(0,${breathe})`}>
        {/* kapüşon arkada */}
        <ellipse cx={200} cy={300} rx={70} ry={26} fill={HOOD_D} />
        {/* boyun */}
        <rect x={187} y={186} width={26} height={120} rx={12} fill={`url(#${id}-skin)`} />
        <rect x={187} y={190} width={9} height={110} rx={5} fill={SKIN_D} opacity={0.35} />
        {/* gövde */}
        {pose === "cheer" || pose === "cheeks" ? null : null}
        <path d="M118,334 Q130,292 200,288 Q270,292 282,334 Q300,436 290,540 Q200,560 110,540 Q100,436 118,334 Z" fill={`url(#${id}-hoodH)`} />
        <rect x={110} y={524} width={180} height={30} rx={13} fill={HOOD_D} />
        <rect x={110} y={524} width={180} height={30} rx={13} fill={`url(#${id}-rib)`} opacity={0.4} />
        {/* yaka ve ipler */}
        <path d="M168,300 Q200,326 232,300" fill="none" stroke={HOOD_D} strokeWidth={8} strokeLinecap="round" />
        <path d="M186,312 L183,372 M214,312 L217,372" stroke="#f7f5f0" strokeWidth={4.5} strokeLinecap="round" />
        <circle cx={183} cy={376} r={4.5} fill="#f7f5f0" />
        <circle cx={217} cy={376} r={4.5} fill="#f7f5f0" />
        {/* kollar */}
        <Arm s={[134, 334]} e={a.l[0]} h={a.l[1]} id={id} />
        <Arm s={[266, 334]} e={a.r[0]} h={a.r[1]} id={id} />
        {/* kanguru cebi (eller cepteyse üstte kalır) */}
        {pocketHands ? (
          <path d={pose === "pocket" ? "M140,462 L260,462 L272,520 L128,520 Z" : "M140,462 L200,462 L200,520 L128,520 Z"} fill={HOOD} stroke={HOOD_D} strokeWidth={4} strokeLinejoin="round" />
        ) : (
          <path d="M140,462 L260,462 L272,520 L128,520 Z" fill="none" stroke={HOOD_D} strokeWidth={4} strokeLinejoin="round" />
        )}
        {/* eşyalar */}
        {pose === "point" ? <rect x={300} y={196} width={12} height={34} rx={6} fill={SKIN} /> : null}
        {pose === "phone" ? (
          <g>
            <rect x={176} y={376} width={48} height={74} rx={9} fill="#1a1a1f" />
            <rect x={181} y={382} width={38} height={62} rx={6} fill="#8fd3ff" />
            <circle cx={184} cy={420} r={14} fill={SKIN} />
            <circle cx={216} cy={420} r={14} fill={SKIN} />
          </g>
        ) : null}
        {pose === "dumbbell" ? (
          <g transform="translate(282,356) rotate(-10)">
            <rect x={-46} y={-5} width={92} height={10} rx={5} fill="#6b7280" />
            <rect x={-58} y={-24} width={20} height={48} rx={7} fill="#27272f" />
            <rect x={38} y={-24} width={20} height={48} rx={7} fill="#27272f" />
            <circle cx={0} cy={0} r={16} fill={SKIN} />
          </g>
        ) : null}
        {/* kafa */}
        <g transform={`translate(0,${headDrop}) rotate(${headTilt},200,200)`}>
          <ellipse cx={150} cy={152} rx={10} ry={15} fill={SKIN} />
          <ellipse cx={250} cy={152} rx={10} ry={15} fill={SKIN} />
          <path d="M152,140 Q150,82 200,80 Q250,82 248,140 Q248,184 226,204 Q212,214 200,214 Q188,214 174,204 Q152,184 152,140 Z" fill={`url(#${id}-skin)`} />
          <Face expr={expr} talk={talk} blink={blink} />
          {/* bere */}
          <path d="M146,112 Q144,48 200,44 Q256,48 254,112 Z" fill={`url(#${id}-beanie)`} />
          <path d="M146,112 Q144,48 200,44 Q256,48 254,112 Z" fill={`url(#${id}-rib)`} />
          <path d="M142,104 Q200,92 258,104 L258,128 Q200,116 142,128 Z" fill="#26262c" />
          <path d="M142,104 Q200,92 258,104 L258,128 Q200,116 142,128 Z" fill={`url(#${id}-rib)`} />
          <path d="M162,66 Q184,54 206,54" fill="none" stroke="#fff" strokeWidth={6} opacity={0.18} strokeLinecap="round" />
        </g>
        {/* yanaklara konan eller kafanın önünde */}
        {pose === "cheeks" ? (
          <g>
            <circle cx={158} cy={186} r={17} fill={`url(#${id}-skin)`} />
            <circle cx={242} cy={186} r={17} fill={`url(#${id}-skin)`} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

export const BORA_SET: { pose: BoraPose; expr: BoraExpr; label: string }[] = [
  { pose: "pocket", expr: "smile", label: "Merhaba (ana hâl)" },
  { pose: "cheeks", expr: "surprised", label: "Şaşkın (kanca)" },
  { pose: "point", expr: "talk", label: "Anlatıyor" },
  { pose: "dumbbell", expr: "smug", label: "Dambıllı, emin" },
  { pose: "tired", expr: "tired", label: "Yorgun" },
  { pose: "cheer", expr: "happy", label: "Sevinç" },
];
