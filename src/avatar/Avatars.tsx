/**
 * Kanal avatarı adayları (videoda ekrana konuşan sabit karakter / sunucu).
 * Her biri 600x700'lük yerel kutuda omuz plan (göğüsten yukarı) çizilir;
 * göz kırpma, konuşurken ağız oynatma ve hafif nefes/baş sallama hareketi var.
 *  1 Deniz  – anime tarzı sporcu kız (kalın kontur, iki tonlu gölge)
 *  2 Kaan   – anime tarzı genç koç (şapka, düdük, kirli sakal)
 *  3 Bobo   – sevimli maskot ayı (yumuşak 3B hissi, ter bandı)
 *  4 Efe    – Pixar tarzı büyük gözlü sevimli genç (yumuşak gölgeler)
 */
import React from "react";

export const INK = "#1d1424";

export type AvatarProps = { t: number; talk?: number; id: string };

/** 0 = açık, 1 = kapalı; her ~3.4 sn'de bir kısa kırpma */
export const blink = (t: number, offset = 0) => {
  const p = (t + offset) % 3.4;
  return p < 0.16 ? Math.sin((p / 0.16) * Math.PI) : 0;
};

/** konuşma ağız açıklığı (0-1): 2.2 sn konuş, 1 sn sus */
export const talkAt = (t: number, offset = 0) => {
  const p = (t + offset) % 3.2;
  if (p > 2.2) return 0;
  const v = 0.45 + Math.sin(t * 15) * 0.35 + Math.sin(t * 23 + 1) * 0.25;
  const env = Math.min(1, p / 0.15, (2.2 - p) / 0.15);
  return Math.max(0, Math.min(1, v)) * env;
};

const eyeScale = (x: number, y: number, open: number) =>
  `translate(${x},${y}) scale(1,${Math.max(0.06, open)}) translate(${-x},${-y})`;

/** anime ağzı: kapalıyken gülümseme çizgisi, açıkken koyu ağız + dil */
const AnimeMouth: React.FC<{ x: number; y: number; w: number; m: number; id: string; teeth?: boolean }> = ({ x, y, w, m, id, teeth }) => {
  if (m < 0.08)
    return <path d={`M${x - w / 2},${y} Q${x},${y + 14} ${x + w / 2},${y}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  const h = 10 + m * 34;
  const d = `M${x - w / 2},${y} Q${x},${y + 6} ${x + w / 2},${y} Q${x + w * 0.35},${y + h} ${x},${y + h} Q${x - w * 0.35},${y + h} ${x - w / 2},${y} Z`;
  return (
    <g>
      <clipPath id={`${id}-mc`}>
        <path d={d} />
      </clipPath>
      <path d={d} fill="#7a1f2b" />
      <g clipPath={`url(#${id}-mc)`}>
        <ellipse cx={x} cy={y + h + 4} rx={w * 0.3} ry={h * 0.45} fill="#e8687a" />
        {teeth ? <rect x={x - w / 2} y={y - 4} width={w} height={9} fill="#fff" /> : null}
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    </g>
  );
};

// ---------------------------------------------------------------- 1 DENİZ
export const Deniz: React.FC<AvatarProps> = ({ t, talk = 0, id }) => {
  const open = 1 - blink(t, 0.4);
  const bob = Math.sin(t * 2.2) * 4;
  const tilt = Math.sin(t * 1.3) * 1.6;
  const tail = Math.sin(t * 2.2 + 0.8) * 4;
  const skin = "#ffd9b8";
  const skinS = "#f0ab86";
  const hair = "#2b2f5c";
  const hairS = "#1a1d3d";
  const hairH = "#5964a8";
  const eye = (x: number, flip: boolean) => {
    const s = flip ? -1 : 1;
    return (
      <g transform={eyeScale(x, 292, open)}>
        <path d={`M${x - 34 * s},${290} Q${x - 4 * s},${252} ${x + 32 * s},${270} L${x + 30 * s},${318} Q${x},${330} ${x - 30 * s},${312} Z`} fill="#fff" />
        <ellipse cx={x + 2 * s} cy={295} rx={23} ry={30} fill={`url(#${id}-iris)`} />
        <ellipse cx={x + 2 * s} cy={298} rx={11} ry={15} fill="#101030" />
        <ellipse cx={x - 7 * s} cy={283} rx={8} ry={10} fill="#fff" />
        <circle cx={x + 10 * s} cy={310} r={4} fill="#fff" opacity={0.9} />
        <path d={`M${x - 40 * s},${293} Q${x - 6 * s},${250} ${x + 38 * s},${268}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M${x + 36 * s},${268} l${12 * s},-8`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <path d={`M${x - 22 * s},${322} Q${x},${328} ${x + 22 * s},${318}`} fill="none" stroke={INK} strokeWidth={3} opacity={0.6} strokeLinecap="round" />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-iris`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f3a7a" />
          <stop offset="1" stopColor="#3fb5d9" />
        </linearGradient>
      </defs>
      {/* gövde: turkuaz eşofman ceketi */}
      <g transform={`translate(0,${bob * 0.4 - 28})`}>
        <path d="M60,760 Q70,560 190,520 L262,496 L338,496 L410,520 Q530,560 540,760 Z" fill="#14b8a6" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M60,760 Q70,600 150,548 Q140,640 150,760 Z" fill="#0e8f82" />
        <path d="M450,548 Q530,600 540,760 L460,760 Q470,640 450,548 Z" fill="#0e8f82" />
        {/* omuz şeritleri */}
        <path d="M120,560 Q170,528 225,512" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" />
        <path d="M480,560 Q430,528 375,512" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" />
        {/* boyun */}
        <path d="M262,400 L262,500 Q300,520 338,500 L338,400 Z" fill={skin} stroke={INK} strokeWidth={5} />
        <path d="M262,420 Q300,460 338,420 L338,445 Q300,480 262,445 Z" fill={skinS} />
        {/* dik yaka + fermuar */}
        <path d="M240,490 Q300,530 360,490 L372,540 Q300,575 228,540 Z" fill="#17c9b5" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M300,532 L300,720" stroke={INK} strokeWidth={4} />
        <path d="M300,532 L300,720" stroke="#e9f5f3" strokeWidth={2} strokeDasharray="4 6" />
        <rect x={292} y={548} width={16} height={26} rx={4} fill="#d9dde6" stroke={INK} strokeWidth={3} />
      </g>
      <g transform={`translate(0,${bob}) rotate(${tilt},300,420)`}>
        {/* at kuyruğu (başın arkasında) */}
        <g transform={`rotate(${tail},400,170)`}>
          <path d="M370,150 Q470,120 500,210 Q530,300 470,400 Q500,300 440,250 Q420,300 380,330 Q430,240 370,150 Z" fill={hair} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M455,170 Q495,230 480,330" fill="none" stroke={hairH} strokeWidth={5} strokeLinecap="round" />
        </g>
        {/* arka saç */}
        <path d="M182,330 Q160,120 300,100 Q440,120 418,330 Q414,380 392,400 L208,400 Q186,380 182,330 Z" fill={hairS} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* kulaklar */}
        <ellipse cx={192} cy={292} rx={18} ry={28} fill={skin} stroke={INK} strokeWidth={5} />
        <ellipse cx={408} cy={292} rx={18} ry={28} fill={skin} stroke={INK} strokeWidth={5} />
        {/* yüz */}
        <path d="M192,240 Q192,160 300,150 Q408,160 408,240 Q408,330 362,384 Q330,418 300,420 Q270,418 238,384 Q192,330 192,240 Z" fill={skin} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M196,250 Q205,340 250,392 Q215,330 222,250 Z" fill={skinS} opacity={0.55} />
        {/* yanaklar */}
        <ellipse cx={232} cy={345} rx={26} ry={12} fill="#ff7f8f" opacity={0.35} />
        <ellipse cx={368} cy={345} rx={26} ry={12} fill="#ff7f8f" opacity={0.35} />
        {/* ön saç / kâkül */}
        <path
          d="M178,300 Q160,150 260,108 Q350,80 410,140 Q440,190 424,300 Q410,240 396,210 Q392,250 372,262 Q376,215 352,190 Q336,240 300,250 Q318,210 306,180 Q280,230 236,246 Q258,212 252,190 Q220,220 200,270 Q196,290 178,300 Z"
          fill={hair}
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {/* yan perçemler */}
        <path d="M200,226 Q178,320 206,412 Q212,360 222,330 Q218,280 226,250 Z" fill={hair} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M400,226 Q422,320 394,412 Q388,360 378,330 Q382,280 374,250 Z" fill={hair} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M228,140 Q270,118 320,120" fill="none" stroke={hairH} strokeWidth={9} strokeLinecap="round" />
        <path d="M246,150 Q262,146 280,146" fill="none" stroke="#9aa6e6" strokeWidth={5} strokeLinecap="round" />
        {/* bant: kırmızı lastik + perçem */}
        <circle cx={392} cy={150} r={11} fill="#ff4d5e" stroke={INK} strokeWidth={4} />
        {/* kaşlar */}
        <path d="M222,250 Q248,238 272,246" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <path d="M378,250 Q352,238 328,246" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        {eye(250, false)}
        {eye(350, true)}
        {/* burun */}
        <path d="M303,330 Q308,346 298,350" fill="none" stroke={skinS} strokeWidth={5} strokeLinecap="round" />
        <AnimeMouth x={300} y={374} w={46} m={talk} id={id} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- 2 KAAN
export const Kaan: React.FC<AvatarProps> = ({ t, talk = 0, id }) => {
  const open = 1 - blink(t, 1.6);
  const bob = Math.sin(t * 2.0 + 1) * 4;
  const tilt = Math.sin(t * 1.1 + 0.5) * 1.5;
  const skin = "#e8b48a";
  const skinS = "#c98a62";
  const eye = (x: number, flip: boolean) => {
    const s = flip ? -1 : 1;
    return (
      <g transform={eyeScale(x, 300, open)}>
        <path d={`M${x - 32 * s},${300} Q${x},${276} ${x + 30 * s},${290} Q${x + 4 * s},${318} ${x - 32 * s},${300} Z`} fill="#fff" />
        <circle cx={x + 2 * s} cy={298} r={15} fill="#5a3a1c" />
        <circle cx={x + 2 * s} cy={298} r={7} fill="#1a0f08" />
        <circle cx={x - 3 * s} cy={292} r={4.5} fill="#fff" />
        <path d={`M${x - 36 * s},${302} Q${x},${272} ${x + 34 * s},${288}`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      </g>
    );
  };
  return (
    <g>
      {/* gövde: lacivert tişört, geniş omuz */}
      <g transform={`translate(0,${bob * 0.4 - 20})`}>
        <path d="M30,760 Q40,560 170,515 L250,492 L350,492 L430,515 Q560,560 570,760 Z" fill="#26346b" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M30,760 Q40,600 120,545 Q125,640 140,760 Z" fill="#1a2550" />
        <path d="M480,545 Q560,600 570,760 L460,760 Q475,640 480,545 Z" fill="#1a2550" />
        {/* göğüs kası gölgesi */}
        <path d="M190,640 Q245,664 296,640 M304,640 Q355,664 410,640" fill="none" stroke="#1a2550" strokeWidth={6} strokeLinecap="round" />
        {/* boyun */}
        <path d="M250,390 L250,500 Q300,530 350,500 L350,390 Z" fill={skin} stroke={INK} strokeWidth={5} />
        <path d="M250,410 Q300,470 350,410 L350,440 Q300,490 250,440 Z" fill={skinS} />
        {/* yaka */}
        <path d="M244,496 Q300,540 356,496" fill="none" stroke="#f2c230" strokeWidth={12} strokeLinecap="round" />
        {/* düdük ipi + düdük */}
        <path d="M262,505 Q280,590 346,610 M338,505 Q330,560 346,610" fill="none" stroke="#f2c230" strokeWidth={5} />
        <g transform="translate(346,612) rotate(-18)">
          <rect x={-6} y={-12} width={50} height={26} rx={10} fill="#c7ccd6" stroke={INK} strokeWidth={4} />
          <circle cx={30} cy={1} r={16} fill="#c7ccd6" stroke={INK} strokeWidth={4} />
          <path d="M0,-6 L34,-6" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
        </g>
      </g>
      <g transform={`translate(0,${bob}) rotate(${tilt},300,420)`}>
        {/* kulaklar */}
        <ellipse cx={196} cy={300} rx={20} ry={30} fill={skin} stroke={INK} strokeWidth={5} />
        <ellipse cx={404} cy={300} rx={20} ry={30} fill={skin} stroke={INK} strokeWidth={5} />
        {/* yüz: köşeli çene */}
        <path d="M198,240 Q198,170 300,160 Q402,170 402,240 L398,318 Q390,372 344,404 L300,416 L256,404 Q210,372 202,318 Z" fill={skin} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M204,250 L208,320 Q218,370 258,400 Q228,350 228,260 Z" fill={skinS} opacity={0.6} />
        {/* kirli sakal */}
        <path d="M212,330 Q222,380 258,402 L300,414 L342,402 Q378,380 388,330 Q376,372 340,384 Q300,392 260,384 Q224,372 212,330 Z" fill="#5c4a52" opacity={0.28} />
        <path d="M262,352 Q300,340 338,352 Q300,360 262,352 Z" fill="#3a2a2e" opacity={0.55} />
        {/* favoriler */}
        <path d="M200,232 L200,296 L214,296 L214,232 Z M386,232 L386,296 L400,296 L400,232 Z" fill="#2a1a12" />
        {/* şapka (ters değil, düz siper) */}
        <path d="M186,240 Q182,108 300,98 Q418,108 414,240 Z" fill="#1f2937" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M300,100 L300,236 M232,120 Q214,180 220,238 M368,120 Q386,180 380,238" fill="none" stroke="#111827" strokeWidth={4} />
        <path d="M210,140 Q250,112 290,108" fill="none" stroke="#4b5563" strokeWidth={8} strokeLinecap="round" />
        <circle cx={300} cy={100} r={10} fill="#1f2937" stroke={INK} strokeWidth={4} />
        <g fill="#f2c230">
          <rect x={268} y={176} width={64} height={10} rx={4} />
          <rect x={262} y={162} width={14} height={38} rx={5} />
          <rect x={324} y={162} width={14} height={38} rx={5} />
          <rect x={252} y={170} width={10} height={22} rx={4} />
          <rect x={338} y={170} width={10} height={22} rx={4} />
        </g>
        {/* siper */}
        <path d="M176,236 Q300,214 426,236 Q438,262 410,268 Q300,250 190,268 Q164,262 176,236 Z" fill="#111827" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* kaşlar: kalın, kendinden emin */}
        <path d="M222,276 L274,270" stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <path d="M378,272 L326,270" stroke={INK} strokeWidth={11} strokeLinecap="round" />
        {eye(250, false)}
        {eye(350, true)}
        {/* burun */}
        <path d="M300,300 L292,344 Q300,350 312,344" fill="none" stroke={skinS} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {/* ağız: sırıtış */}
        {talk < 0.08 ? (
          <g>
            <path d="M262,370 Q300,396 340,366 Q300,384 262,370 Z" fill="#fff" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
            <path d="M338,366 l8,-6" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          </g>
        ) : (
          <AnimeMouth x={300} y={370} w={58} m={talk} id={id} teeth />
        )}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- 3 BOBO
export const Bobo: React.FC<AvatarProps> = ({ t, talk = 0, id }) => {
  const open = 1 - blink(t, 2.3);
  const bob = Math.sin(t * 2.4 + 2) * 6;
  const tilt = Math.sin(t * 1.5 + 2) * 2.5;
  const ear = (x: number) => (
    <g>
      <circle cx={x} cy={140} r={58} fill={`url(#${id}-fur)`} />
      <circle cx={x} cy={146} r={32} fill="#e9a77a" />
    </g>
  );
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-fur`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#c98a5a" />
          <stop offset="0.6" stopColor="#9a5f36" />
          <stop offset="1" stopColor="#6e3f20" />
        </radialGradient>
        <radialGradient id={`${id}-muz`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff3e2" />
          <stop offset="1" stopColor="#e8c9a4" />
        </radialGradient>
        <radialGradient id={`${id}-eye`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#4a3326" />
          <stop offset="1" stopColor="#0b0705" />
        </radialGradient>
        <linearGradient id={`${id}-shirt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#f4a51c" />
        </linearGradient>
      </defs>
      {/* gövde + atlet */}
      <g transform={`translate(0,${bob * 0.4})`}>
        <ellipse cx={300} cy={720} rx={250} ry={250} fill={`url(#${id}-fur)`} />
        <path d="M150,720 Q150,560 205,500 Q300,540 395,500 Q450,560 450,720 Z" fill={`url(#${id}-shirt)`} />
        <path d="M205,500 Q300,560 395,500" fill="none" stroke="#e08a10" strokeWidth={8} strokeLinecap="round" />
        <ellipse cx={300} cy={640} rx={52} ry={52} fill="#fff" opacity={0.9} />
        <text x={300} y={662} textAnchor="middle" fontFamily="'Baloo 2', sans-serif" fontWeight={800} fontSize={64} fill="#f4a51c">
          B
        </text>
        {/* kollar (dambıl kaldırır gibi yukarı) */}
        <ellipse cx={92} cy={610} rx={62} ry={80} fill={`url(#${id}-fur)`} transform="rotate(25,92,610)" />
        <ellipse cx={508} cy={610} rx={62} ry={80} fill={`url(#${id}-fur)`} transform="rotate(-25,508,610)" />
      </g>
      <g transform={`translate(0,${bob}) rotate(${tilt},300,480)`}>
        {ear(160)}
        {ear(440)}
        {/* kafa */}
        <ellipse cx={300} cy={300} rx={196} ry={180} fill={`url(#${id}-fur)`} />
        <ellipse cx={240} cy={190} rx={70} ry={36} fill="#fff" opacity={0.12} transform="rotate(-20,240,190)" />
        {/* ter bandı */}
        <clipPath id={`${id}-head`}>
          <ellipse cx={300} cy={300} rx={196} ry={180} />
        </clipPath>
        <g clipPath={`url(#${id}-head)`}>
          <path d="M90,196 Q300,140 510,196 L510,240 Q300,184 90,240 Z" fill="#ff4d6d" />
          <path d="M90,214 Q300,158 510,214" fill="none" stroke="#fff" strokeWidth={7} />
        </g>
        {/* yanaklar */}
        <ellipse cx={175} cy={350} rx={34} ry={20} fill="#ff6f8a" opacity={0.45} />
        <ellipse cx={425} cy={350} rx={34} ry={20} fill="#ff6f8a" opacity={0.45} />
        {/* gözler */}
        {[220, 380].map((x) => (
          <g key={x} transform={eyeScale(x, 290, open)}>
            <ellipse cx={x} cy={290} rx={26} ry={32} fill={`url(#${id}-eye)`} />
            <circle cx={x - 8} cy={278} r={10} fill="#fff" />
            <circle cx={x + 9} cy={302} r={4.5} fill="#fff" opacity={0.85} />
          </g>
        ))}
        {/* kaşlar */}
        <path d="M196,244 Q220,232 244,242" fill="none" stroke="#4a2a14" strokeWidth={8} strokeLinecap="round" />
        <path d="M404,244 Q380,232 356,242" fill="none" stroke="#4a2a14" strokeWidth={8} strokeLinecap="round" />
        {/* ağız bölgesi */}
        <ellipse cx={300} cy={378} rx={104} ry={80} fill={`url(#${id}-muz)`} />
        {/* burun */}
        <path d="M268,334 Q300,318 332,334 Q332,362 300,372 Q268,362 268,334 Z" fill="#2a1a12" />
        <ellipse cx={290} cy={334} rx={12} ry={6} fill="#fff" opacity={0.55} />
        <path d="M300,372 L300,392" stroke="#2a1a12" strokeWidth={5} strokeLinecap="round" />
        {talk < 0.08 ? (
          <path d="M262,394 Q280,412 300,394 Q320,412 338,394" fill="none" stroke="#2a1a12" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <g>
            <path d={`M262,394 Q300,${404 + talk * 60} 338,394 Q300,404 262,394 Z`} fill="#7a1f2b" stroke="#2a1a12" strokeWidth={5} strokeLinejoin="round" />
            <ellipse cx={300} cy={400 + talk * 40} rx={18} ry={6 + talk * 8} fill="#ff7f92" />
          </g>
        )}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- 4 EFE
export const Efe: React.FC<AvatarProps> = ({ t, talk = 0, id }) => {
  const open = 1 - blink(t, 0.9);
  const bob = Math.sin(t * 2.1 + 3) * 5;
  const tilt = Math.sin(t * 1.2 + 3) * 2;
  const look = Math.sin(t * 0.7) * 4;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-skin`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffe2cc" />
          <stop offset="0.7" stopColor="#f6bf98" />
          <stop offset="1" stopColor="#d9926a" />
        </radialGradient>
        <radialGradient id={`${id}-hair`} cx="0.4" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#8a5530" />
          <stop offset="0.6" stopColor="#5a3218" />
          <stop offset="1" stopColor="#36190a" />
        </radialGradient>
        <radialGradient id={`${id}-iris`} cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#7fe0b0" />
          <stop offset="0.6" stopColor="#2a9a78" />
          <stop offset="1" stopColor="#0f4a3c" />
        </radialGradient>
        <linearGradient id={`${id}-hood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8a3d" />
          <stop offset="1" stopColor="#e85d1a" />
        </linearGradient>
        <radialGradient id={`${id}-sclera`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe3ee" />
        </radialGradient>
      </defs>
      {/* gövde: kapüşonlu */}
      <g transform={`translate(0,${bob * 0.4})`}>
        <path d="M90,720 Q100,560 210,520 Q300,500 390,520 Q500,560 510,720 Z" fill={`url(#${id}-hood)`} />
        <path d="M170,540 Q300,620 430,540 Q420,500 300,488 Q180,500 170,540 Z" fill="#d94e12" />
        <path d="M262,560 L254,650 M338,560 L346,650" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
        <circle cx={254} cy={654} r={8} fill="#fff" />
        <circle cx={346} cy={654} r={8} fill="#fff" />
        <path d="M250,486 Q300,520 350,486 L350,530 Q300,556 250,530 Z" fill="#e9a77c" />
      </g>
      <g transform={`translate(0,${bob}) rotate(${tilt},300,480)`}>
        {/* kulaklar */}
        <ellipse cx={128} cy={318} rx={30} ry={40} fill={`url(#${id}-skin)`} />
        <ellipse cx={472} cy={318} rx={30} ry={40} fill={`url(#${id}-skin)`} />
        {/* kafa (büyük, yuvarlak) */}
        <path d="M120,290 Q120,120 300,112 Q480,120 480,290 Q480,430 380,476 Q300,500 220,476 Q120,430 120,290 Z" fill={`url(#${id}-skin)`} />
        {/* saç: yumuşak hacimli, önde kıvrık perçem */}
        <path
          d="M112,300 Q90,150 200,92 Q300,40 410,88 Q500,140 488,300 Q470,230 440,200 Q420,170 380,176 Q330,150 290,182 Q240,150 200,190 Q150,210 140,280 Z"
          fill={`url(#${id}-hair)`}
        />
        <path d="M200,110 Q190,50 250,64 Q262,10 320,40 Q370,0 392,60 Q450,50 430,110 Q330,80 200,110 Z" fill={`url(#${id}-hair)`} />
        <path d="M290,182 Q300,120 360,110 Q330,140 340,170 Q320,160 290,182 Z" fill="#6b3d1f" />
        <path d="M190,110 Q260,70 340,78" fill="none" stroke="#b37a4a" strokeWidth={14} strokeLinecap="round" opacity={0.6} />
        {/* kaşlar */}
        <path d="M188,232 Q222,214 258,226" fill="none" stroke="#4a2a14" strokeWidth={12} strokeLinecap="round" />
        <path d="M412,232 Q378,214 342,226" fill="none" stroke="#4a2a14" strokeWidth={12} strokeLinecap="round" />
        {/* büyük gözler */}
        {[222, 378].map((x) => (
          <g key={x} transform={eyeScale(x, 292, open)}>
            <ellipse cx={x} cy={292} rx={50} ry={56} fill={`url(#${id}-sclera)`} />
            <ellipse cx={x + look} cy={298} rx={34} ry={38} fill={`url(#${id}-iris)`} />
            <ellipse cx={x + look} cy={300} rx={17} ry={20} fill="#0a1a16" />
            <ellipse cx={x + look - 12} cy={284} rx={11} ry={13} fill="#fff" />
            <circle cx={x + look + 12} cy={314} r={5} fill="#fff" opacity={0.8} />
            <path d={`M${x - 52},${282} Q${x},${226} ${x + 52},${282}`} fill="none" stroke="#2a160a" strokeWidth={7} strokeLinecap="round" />
          </g>
        ))}
        {/* yanaklar */}
        <ellipse cx={170} cy={380} rx={38} ry={22} fill="#ff7a8a" opacity={0.35} />
        <ellipse cx={430} cy={380} rx={38} ry={22} fill="#ff7a8a" opacity={0.35} />
        {/* burun */}
        <ellipse cx={300} cy={366} rx={20} ry={14} fill="#e8a07a" />
        <ellipse cx={294} cy={361} rx={7} ry={4} fill="#fff" opacity={0.6} />
        {/* ağız */}
        {talk < 0.08 ? (
          <path d="M262,410 Q300,440 338,410" fill="none" stroke="#7a2a20" strokeWidth={7} strokeLinecap="round" />
        ) : (
          <g>
            <path d={`M258,408 Q300,416 342,408 Q332,${430 + talk * 40} 300,${432 + talk * 40} Q268,${430 + talk * 40} 258,408 Z`} fill="#6a1a22" />
            <path d="M266,410 Q300,418 334,410 L330,420 Q300,426 270,420 Z" fill="#fff" />
            <ellipse cx={300} cy={428 + talk * 34} rx={22} ry={6 + talk * 6} fill="#ff7f8f" />
          </g>
        )}
      </g>
    </g>
  );
};

export const AVATARS = [
  { key: "deniz", name: "Deniz", desc: "Anime tarzı sporcu kız", C: Deniz, bg: ["#7dd3fc", "#2563eb"] },
  { key: "kaan", name: "Kaan Koç", desc: "Anime tarzı genç koç", C: Kaan, bg: ["#fde68a", "#f97316"] },
  { key: "bobo", name: "Bobo", desc: "Sevimli maskot ayı", C: Bobo, bg: ["#bbf7d0", "#14b8a6"] },
  { key: "efe", name: "Efe", desc: "Pixar tarzı sevimli genç", C: Efe, bg: ["#e9d5ff", "#8b5cf6"] },
] as const;
