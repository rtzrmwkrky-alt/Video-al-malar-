/**
 * "Ekmeği bırakırsan zayıflarsın" — ev kesiti sürümü (kullanıcı isteği: tek büyük resim, 4 bölme, kamera bölmeden bölmeye
 * kesmeden süzülür, gereken yerde yakınlaşır). Önü açık iki katlı ev: 1 banyo (tartı, −2 kg, damlalar kovaya) →
 * 2 mutfak (DEPO kavanozu: 1 gr karbonhidrat ≈ 3 gr su; ekmeği kesince boşalır, yiyince dolar) → 3 çalışma odası (panoda
 * Stanford araştırması) → 4 yemek odası (aile sofrası, 1-2 dilim tam buğday, tabağı ekmekle silmek yok, gönder) →
 * kamera geri çekilip evin tamamını gösterir → banyoya dalar (döngü; son kare = ilk kare). Metin/ses EkmekBirak ile aynı.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { LINE, type SketchPose, SketchDefs, SketchPerson, SKETCH_CAST } from "../sketch/SketchPerson";
import {
  BreadSlice,
  Bucket,
  Captions,
  Card,
  Check,
  Cross,
  Drop,
  type EkmekBirakProps,
  GREEN,
  type Key,
  OilBottle,
  PAPER,
  Pill,
  RED,
  Readout,
  Scale,
  type TL,
  Txt,
  WATER,
  mix,
  poseAt,
  st,
  voiceTimeline,
  wordTime,
} from "./EkmekBirak";

loadFonts();

export const EV_LINES: Line[] = [
  { text: "Ekmeği bırakırsan zayıflarsın… derler.", hl: ["zayıflarsın…"], hold: 0.2 },
  { text: "Bir hafta sonra tartıdasın: iki kilo gitmiş! Ama sevinme… giden yağ değil, su.", hl: ["iki", "kilo", "su."], hold: 0.2 },
  { text: "Vücut, sakladığı her gram karbonhidratı üç gram suyla tutar. Ekmeği kesince depo boşalır… su da peşinden gider.", hl: ["üç", "gram", "suyla"], hold: 0.1 },
  { text: "İlk dilimde mi? Su geri gelir, kilolar da.", hl: ["geri", "kilolar"], hold: 0.1 },
  { text: "Stanford'da 609 kişi bir yıl izlendi. Ekmeği azaltan da, yağı azaltan da… aşağı yukarı aynı kiloyu verdi.", hl: ["609", "aynı", "kiloyu"], hold: 0.1 },
  { text: "Yani mesele ekmek değil, ne kadar yediğin. Günde bir iki dilim tam buğday yeter… ama tabağı ekmekle silmek yok!", hl: ["ne", "kadar", "tam", "buğday"], hold: 0.1 },
  { text: "Ekmeği bırakan arkadaşına bunu gönder.", hl: ["arkadaşına"], hold: 0.4 },
];

export const EV_TAIL = 2.6;
export const EV_TL = timeline(EV_LINES, EV_TAIL);

const HERO = SKETCH_CAST.siyah.look;

// dünya: önü açık iki katlı ev
const WW = 2600;
const WH = 4400;
const RW = 1080;
const RH = 1800;
const ROOMS = {
  banyo: { x: 180, y: 560 },
  mutfak: { x: 1340, y: 560 },
  calisma: { x: 180, y: 2440 },
  yemek: { x: 1340, y: 2440 },
} as const;
const center = (r: { x: number; y: number }) => [r.x + RW / 2, r.y + RH / 2] as const;

const kgTxt = (v: number) => v.toFixed(1).replace(".", ",");

type Ctx = { t: number; L: (i: number) => number; W: (l: number, k: number) => number; T: number };

// ------------------------------------------------------------ ortak oda parçaları

const thin = { stroke: LINE, strokeWidth: 2, fill: "none", opacity: 0.55 };

const Floor: React.FC<{ y: number; a: string; b: string; checker?: boolean }> = ({ y, a, b, checker }) => (
  <g>
    <rect x={0} y={y} width={RW} height={RH - y} fill={a} />
    {checker
      ? Array.from({ length: 12 }).flatMap((_, i) =>
          Array.from({ length: 4 }).map((__, j) => ((i + j) % 2 ? <rect key={`${i}-${j}`} x={i * 90} y={y + j * 90} width={90} height={90} fill={b} /> : null)),
        )
      : Array.from({ length: 8 }).map((_, i) => <path key={i} d={`M0,${y + 40 + i * 44} L${RW},${y + 40 + i * 44}`} {...thin} opacity={0.18} />)}
    <path d={`M0,${y} L${RW},${y}`} stroke={LINE} strokeWidth={3} />
    <rect x={0} y={y - 26} width={RW} height={26} fill={b} stroke={LINE} strokeWidth={2.4} />
  </g>
);

const Window: React.FC<{ x: number; y: number; w: number; h: number; t: number; night?: boolean }> = ({ x, y, w, h, t, night }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={night ? "#2c3a63" : "#bfe0f0"} {...st} />
    {!night ? (
      <g opacity={0.9}>
        <ellipse cx={x + w * 0.3 + Math.sin(t * 0.4) * 10} cy={y + h * 0.3} rx={w * 0.18} ry={h * 0.06} fill="#fff" />
        <ellipse cx={x + w * 0.65 + Math.sin(t * 0.3 + 1) * 8} cy={y + h * 0.55} rx={w * 0.14} ry={h * 0.05} fill="#fff" />
      </g>
    ) : null}
    <path d={`M${x + w / 2},${y} L${x + w / 2},${y + h} M${x},${y + h / 2} L${x + w},${y + h / 2}`} stroke="#efe4d3" strokeWidth={8} />
    <rect x={x} y={y} width={w} height={h} fill="none" {...st} />
    <rect x={x - 14} y={y + h} width={w + 28} height={16} fill="#efe4d3" {...st} strokeWidth={2.4} />
  </g>
);

const Plant: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {[-50, -28, -10, 8, 26, 46].map((a, i) => (
      <path key={i} d={`M0,0 Q${a},${-90 - Math.abs(a)} ${a * 1.9},${-180 + Math.abs(a) * 1.2}`} fill="none" stroke="#5f8f4a" strokeWidth={12} strokeLinecap="round" />
    ))}
    <path d="M-44,-4 L44,-4 L32,86 L-32,86 Z" fill="#c76a4a" {...st} />
  </g>
);

const Frame: React.FC<{ x: number; y: number; w: number; h: number; c: string }> = ({ x, y, w, h, c }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill="#7a5640" {...st} />
    <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} fill="#efe4d3" stroke={LINE} strokeWidth={2} />
    <circle cx={x + w / 2} cy={y + h * 0.42} r={Math.min(w, h) * 0.14} fill="#f8eadb" stroke={LINE} strokeWidth={1.8} />
    <path d={`M${x + w * 0.28},${y + h - 12} q${w * 0.22},${-h * 0.36} ${w * 0.44},0 Z`} fill={c} stroke={LINE} strokeWidth={1.8} />
  </g>
);

/** kişiyi yerel kutuya yerleştir: ayak (veya oturuşta kalça) noktası */
const Person: React.FC<{ x: number; foot: number; s: number; sit?: boolean; children: React.ReactNode }> = ({ x, foot, s, sit, children }) => (
  <g transform={`translate(${x - 200 * s},${foot - (sit ? 480 : 800) * s}) scale(${s})`}>{children}</g>
);

// ------------------------------------------------------------ 1 · banyo

const Banyo: React.FC<Ctx> = ({ t, L, W }) => {
  const reset = t > L(6);
  const kgDrop = sm(t, W(1, 3), W(1, 6) + 0.2);
  const kg = reset ? 72 : 72 - 2 * kgDrop;
  const drainA = W(1, 10);
  const level = reset ? 0 : sm(t, drainA, drainA + 1.3);
  const bucketO = reset ? 0 : sm(t, drainA - 0.4, drainA - 0.1);
  const BREAD: SketchPose = { r: { a: 30, e: -100 }, l: { a: 14, e: 6 }, itemR: "bread", turn: 0.25 };
  const keys: Key[] = [
    { at: -1, pose: BREAD },
    { at: W(1, 0), pose: { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.2 } },
    { at: W(1, 6), pose: { r: { a: 150, e: -20 }, l: { a: 150, e: -20 }, turn: 0.1 } },
    { at: W(1, 8), pose: { r: { a: 20, e: -20 }, l: { a: 30, e: -60 }, turn: -0.4 } },
  ];
  const pose = reset ? BREAD : poseAt(t, keys);
  const expr = reset || t < W(0, 3) ? "think" : t < W(1, 6) ? "smile" : t < W(1, 8) ? "grin" : "surprise";
  // damlalar gövdeden kovaya
  const pts: [number, number][] = [[480, 780], [600, 820], [520, 920], [590, 970], [470, 1040], [600, 1080], [540, 860], [500, 1150], [585, 1190]];
  const drops: React.ReactNode[] = [];
  if (!reset && t > drainA && t < drainA + 2.0) {
    pts.forEach(([sx, sy], i) => {
      const ph = ((t - drainA) * 1.4 + i / pts.length) % 1;
      if (t - drainA < i / pts.length / 1.4) return;
      if (t > drainA + 1.4 && ph > (drainA + 2.0 - t) / 0.6) return;
      const x = mix(sx, 220, ph);
      const y = mix(sy, 1330, ph) - Math.sin(ph * Math.PI) * 110;
      drops.push(<Drop key={i} x={x} y={y} s={0.9 + 0.3 * Math.sin(i)} o={Math.min(1, ph * 6) * Math.min(1, (1 - ph) * 6)} />);
    });
  }
  return (
    <g>
      <rect width={RW} height={RH} fill="#dbeaf0" />
      {Array.from({ length: 13 }).map((_, i) => (
        <path key={`v${i}`} d={`M${i * 90},700 L${i * 90},1360`} {...thin} opacity={0.18} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={`h${i}`} d={`M0,${700 + i * 90} L${RW},${700 + i * 90}`} {...thin} opacity={0.18} />
      ))}
      <rect x={0} y={690} width={RW} height={14} fill="#bcd6df" stroke={LINE} strokeWidth={2} />
      <Floor y={1360} a="#efe7dc" b="#d9cbb9" checker />
      <Window x={90} y={200} w={220} h={280} t={t} />
      {/* ayna + lavabo + raf */}
      <ellipse cx={830} cy={430} rx={130} ry={170} fill="#cfe3ea" {...st} />
      <path d="M760,360 L800,320 M780,420 L860,340" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
      <rect x={720} y={630} width={220} height={20} rx={6} fill="#efe4d3" {...st} strokeWidth={2.4} />
      <path d="M744,600 L744,630 L772,630 L772,600 Z" fill="#7fa6c9" {...st} strokeWidth={2.2} />
      <path d="M752,600 L748,560 M764,600 L770,566" stroke={LINE} strokeWidth={4} strokeLinecap="round" />
      <rect x={800} y={606} width={44} height={24} rx={8} fill="#f2c9d9" {...st} strokeWidth={2.2} />
      <path d="M700,880 L960,880 Q960,960 830,960 Q700,960 700,880 Z" fill="#fbfbf7" {...st} />
      <path d="M800,960 L812,1360 L848,1360 L860,960" fill="#fbfbf7" {...st} />
      <path d="M830,880 L830,840 Q830,826 846,826 L870,826" fill="none" {...st} strokeWidth={6} />
      {/* havlu */}
      <path d="M330,560 L520,560" {...st} strokeWidth={6} />
      <path d="M350,560 L350,820 Q420,840 490,820 L490,560 Z" fill="#e58f6a" {...st} />
      {[640, 680, 720].map((y) => (
        <path key={y} d={`M350,${y} Q420,${y + 8} 490,${y}`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.8} />
      ))}
      <Plant x={960} y={1460} s={0.9} />
      {/* paspas + tartı + kova */}
      <ellipse cx={540} cy={1480} rx={260} ry={40} fill="#9fc3b5" {...st} strokeWidth={2.4} />
      <Scale x={540} y={1454} kg={kg} />
      <Bucket x={220} y={1480} level={level} o={bucketO} />
      <Person x={540} foot={1450} s={1.25}>
        <SketchPerson t={t} seed={1.3} look={HERO} pose={pose} expr={expr} />
      </Person>
      {drops}
      <Readout x={850} y={1160} kg={kg} o={1} delta={reset ? 0 : -2 * kgDrop} />
    </g>
  );
};

// ------------------------------------------------------------ 2 · mutfak (DEPO kavanozu)

const Jar: React.FC<{ x: number; y: number; full: number }> = ({ x, y, full }) => {
  const w = 230;
  const h = 300;
  const top = y - h;
  const lvl = y - 16 - (h - 50) * (0.15 + 0.85 * full);
  const cubes: [number, number][] = [[-60, -40], [0, -50], [58, -38], [-30, -110], [34, -116], [-62, -176], [6, -186], [60, -170]];
  return (
    <g>
      <rect x={x - w / 2} y={top} width={w} height={h} rx={30} fill="#eaf4f7" fillOpacity={0.7} {...st} />
      <path d={`M${x - w / 2 + 6},${lvl} L${x + w / 2 - 6},${lvl} L${x + w / 2 - 6},${y - 20} Q${x + w / 2 - 6},${y - 6} ${x + w / 2 - 22},${y - 6} L${x - w / 2 + 22},${y - 6} Q${x - w / 2 + 6},${y - 6} ${x - w / 2 + 6},${y - 20} Z`} fill={WATER} opacity={0.75} />
      {cubes.map(([dx, dy], i) => {
        const o = Math.max(0, Math.min(1, full * cubes.length - i));
        return o > 0 ? <rect key={i} x={x + dx - 22} y={y + dy - 22 - 8} width={44} height={44} rx={8} fill="#e8b84a" opacity={o} {...st} strokeWidth={2.4} /> : null;
      })}
      <rect x={x - w / 2 - 10} y={top - 34} width={w + 20} height={40} rx={10} fill="#c76a4a" {...st} />
      <rect x={x - 70} y={top + 40} width={140} height={54} rx={8} fill={PAPER} {...st} strokeWidth={2.4} />
      <text x={x} y={top + 80} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill={LINE}>
        DEPO
      </text>
      <path d={`M${x - w / 2 + 20},${top + 30} L${x - w / 2 + 20},${y - 40}`} stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
    </g>
  );
};

const Mutfak: React.FC<Ctx> = ({ t, L, W }) => {
  const empty = sm(t, W(2, 12), W(2, 12) + 1.0);
  const refill = sm(t, W(3, 3), W(3, 6) + 0.4);
  const full = t > L(6) ? 1 : 1 - empty + refill;
  const note = sm(t, W(2, 2) - 0.1, W(2, 2) + 0.3);
  const noteSu = sm(t, W(2, 5) - 0.1, W(2, 5) + 0.3);
  const cut = sm(t, W(2, 9) - 0.05, W(2, 9) + 0.4);
  const eat = t > L(3) - 0.1 && t < L(4) + 0.2;
  const pose: SketchPose = eat
    ? poseAt(t, [
        { at: -1, pose: { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.3 } },
        { at: L(3) - 0.1, pose: { r: { a: 40, e: -150 }, l: { a: 14, e: 6 }, itemR: "bread", turn: 0.2 } },
      ])
    : t < L(3)
      ? poseAt(t, [
          { at: -1, pose: { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.4 } },
          { at: W(2, 9), pose: { r: { a: 70, e: -20 }, l: { a: 14, e: 6 }, turn: 0.5 } },
        ])
      : { r: { a: 40, e: -150 }, l: { a: 14, e: 6 }, itemR: "bread", turn: 0.2 };
  const chew = eat ? 0.35 + 0.35 * Math.sin(t * 16) : 0;
  const expr = eat ? (t > W(3, 5) ? "worry" : "smile") : t > W(2, 12) ? "surprise" : "think";
  // damlalar kavanozdan lavaboya / lavabodan kavanoza
  const drops: React.ReactNode[] = [];
  const flow = (a: number, b: number, rev: boolean) => {
    if (t < a || t > b) return;
    for (let i = 0; i < 8; i++) {
      const ph = ((t - a) * 1.3 + i / 8) % 1;
      if (t - a < i / 8 / 1.3) continue;
      if (b - t < 0.5 && ph > (b - t) / 0.5) continue;
      const u = rev ? 1 - ph : ph;
      drops.push(<Drop key={`${rev}${i}`} x={mix(830, 240, u)} y={mix(860, 1040, u) - Math.sin(u * Math.PI) * 300} s={1.1} o={Math.min(1, ph * 6) * Math.min(1, (1 - ph) * 6)} />);
    }
  };
  flow(W(2, 12), W(2, 12) + 1.6, false);
  flow(W(3, 3), W(3, 6) + 0.8, true);
  return (
    <g>
      <rect width={RW} height={RH} fill="#f6e6c4" />
      {/* üst dolaplar + pencere */}
      {[60, 200].map((x) => (
        <g key={x}>
          <rect x={x} y={200} width={130} height={340} fill="#9cc6b0" {...st} />
          <circle cx={x + 110} cy={480} r={8} fill={LINE} />
        </g>
      ))}
      <Window x={390} y={230} w={300} h={300} t={t} />
      <path d="M370,214 L710,214" {...st} strokeWidth={6} />
      <path d="M380,214 Q420,380 386,540 L370,540 Z M700,214 Q660,380 694,540 L710,540 Z" fill="#e8a0a0" {...st} strokeWidth={2.4} />
      {[740, 880].map((x) => (
        <g key={x}>
          <rect x={x} y={200} width={130} height={340} fill="#9cc6b0" {...st} />
          <circle cx={x + 20} cy={480} r={8} fill={LINE} />
        </g>
      ))}
      {/* fayans bandı */}
      <rect x={0} y={600} width={RW} height={450} fill="#fbf3e6" />
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={i} d={`M${i * 70},600 L${i * 70},1050`} {...thin} opacity={0.2} />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} d={`M0,${600 + i * 70} L${RW},${600 + i * 70}`} {...thin} opacity={0.2} />
      ))}
      {/* tezgâh + alt dolaplar */}
      <rect x={0} y={1050} width={RW} height={44} fill="#c99a6a" {...st} />
      <rect x={0} y={1094} width={RW} height={360} fill="#9cc6b0" {...st} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={20 + i * 212} y={1120} width={190} height={310} rx={8} fill="none" stroke={LINE} strokeWidth={2.4} />
          <rect x={95 + i * 212} y={1140} width={40} height={10} rx={4} fill={LINE} />
        </g>
      ))}
      <Floor y={1480} a="#d9b48a" b="#b98e62" />
      {/* lavabo + musluk */}
      <ellipse cx={240} cy={1052} rx={130} ry={18} fill="#cfd3d6" {...st} />
      <path d="M300,1050 L300,960 Q300,930 270,930 L230,930" fill="none" {...st} strokeWidth={10} />
      {/* çaydanlık, kesme tahtası */}
      <rect x={585} y={1030} width={110} height={20} rx={6} fill="#b98e62" {...st} strokeWidth={2.4} />
      {/* DEPO kavanozu + not */}
      <Jar x={830} y={1050} full={full} />
      <Card x={830} y={640} w={330} h={140} o={note} tilt={2}>
        <Txt x={0} y={-12} size={34} fill="#b8862b">
          1 gr karbonhidrat
        </Txt>
        <Txt x={0} y={38} size={42} fill={WATER} o={noteSu}>
          ≈ 3 gr su
        </Txt>
      </Card>
      <Person x={440} foot={1640} s={1.15}>
        <SketchPerson t={t} seed={1.3} look={HERO} pose={pose} expr={expr} talk={chew} />
      </Person>
      {/* "ekmeği kesince": tahtadaki ekmeğe ✕ */}
      {t > L(2) && t < L(3) ? (
        <g opacity={win(t, W(2, 9) - 0.2, L(3), 0.2)}>
          <BreadSlice x={640} y={1000} s={0.55} />
          <Cross x={640} y={995} r={44} o={cut} />
        </g>
      ) : null}
      {drops}
      <Pill x={440} y={740} text="+2 KG" o={win(t, W(3, 6) - 0.1, L(4) + 0.2, 0.25)} bg={RED} size={52} />
    </g>
  );
};

// ------------------------------------------------------------ 3 · çalışma odası (Stanford panosu)

const Calisma: React.FC<Ctx> = ({ t, L, W }) => {
  const on = (k: number) => sm(t, W(4, k) - 0.1, W(4, k) + 0.25);
  const months = Math.max(1, Math.round(1 + 11 * sm(t, W(4, 3), W(4, 12))));
  const lossA = 6.0 * sm(t, W(4, 6), W(4, 15));
  const lossB = 5.3 * sm(t, W(4, 9), W(4, 15));
  const same = on(14);
  const pose: SketchPose = poseAt(t, [
    { at: -1, pose: { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.4 } },
    { at: L(4) + 0.6, pose: { r: { a: 120, e: -10 }, l: { a: 14, e: 6 }, turn: 0.4 } },
    { at: Math.max(L(4) + 0.7, W(4, 9)), pose: { r: { a: 140, e: -10 }, l: { a: 14, e: 6 }, turn: 0.5 } },
  ]);
  return (
    <g>
      <rect width={RW} height={RH} fill="#dfe6d2" />
      {Array.from({ length: 22 }).map((_, i) => (
        <path key={i} d={`M${i * 50},0 L${i * 50},1480`} stroke="#c9d3b8" strokeWidth={10} opacity={0.35} />
      ))}
      <Floor y={1480} a="#c9a77e" b="#a8835a" />
      {/* mantar pano */}
      <rect x={70} y={210} width={940} height={810} rx={14} fill="#c9a06a" stroke="#7a5640" strokeWidth={18} />
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={100 + ((i * 137) % 880)} cy={240 + ((i * 89) % 760)} r={2} fill="#8a5f42" opacity={0.4} />
      ))}
      <g transform="rotate(-1.5,540,330)">
        <rect x={250} y={250} width={520} height={150} fill={PAPER} {...st} />
        <circle cx={510} cy={262} r={9} fill={RED} {...st} strokeWidth={2} />
        <Txt x={510} y={322} size={46}>
          STANFORD ARAŞTIRMASI
        </Txt>
        <Txt x={510} y={372} size={32} w={700} o={on(1)}>
          609 kişi · 1 yıl takip
        </Txt>
      </g>
      {/* takvim */}
      <g transform="rotate(3,890,330)" opacity={on(3)}>
        <rect x={820} y={250} width={150} height={170} rx={10} fill="#fff" {...st} />
        <rect x={820} y={250} width={150} height={44} rx={10} fill={RED} {...st} />
        <Txt x={895} y={380} size={70}>
          {months}
        </Txt>
        <Txt x={895} y={410} size={24} w={700}>
          . AY
        </Txt>
      </g>
      {/* iki grup */}
      {[
        { x: 130, k: 6, icon: <BreadSlice x={0} y={0} s={0.8} />, label: "EKMEK ↓", v: lossA, rot: -2 },
        { x: 570, k: 9, icon: <OilBottle x={0} y={0} s={1.0} />, label: "YAĞ ↓", v: lossB, rot: 1.5 },
      ].map((g) => (
        <g key={g.x} opacity={on(g.k)} transform={`rotate(${g.rot},${g.x + 190},700)`}>
          <rect x={g.x} y={450} width={380} height={470} fill="#fff" {...st} />
          <circle cx={g.x + 190} cy={464} r={9} fill="#4f8fd0" {...st} strokeWidth={2} />
          <g transform={`translate(${g.x + 190},580)`}>{g.icon}</g>
          <Cross x={g.x + 190} y={572} r={56} o={sm(t, W(4, g.k), W(4, g.k + 1))} />
          <Txt x={g.x + 190} y={720} size={34}>
            {g.label}
          </Txt>
          <Txt x={g.x + 190} y={850} size={88} fill={GREEN}>
            −{kgTxt(g.v)}
          </Txt>
          <Txt x={g.x + 190} y={895} size={30} w={700} fill={GREEN}>
            kg
          </Txt>
        </g>
      ))}
      {/* yapışkan not */}
      <g opacity={same} transform={`rotate(-4,540,960) translate(0,${(1 - same) * 12})`}>
        <rect x={330} y={900} width={420} height={120} fill="#ffe27a" {...st} />
        <Txt x={540} y={978} size={46}>
          ≈ NEREDEYSE AYNI
        </Txt>
      </g>
      <Txt x={540} y={1060} size={22} w={600} o={0.8}>
        Kaynak: Gardner ve ark., JAMA 2018
      </Txt>
      {/* masa: lamba, laptop, kupa */}
      <rect x={600} y={1300} width={440} height={30} fill="#8a5f42" {...st} />
      {[620, 1000].map((x) => (
        <rect key={x} x={x} y={1330} width={22} height={240} fill="#7a5640" {...st} />
      ))}
      <path d="M690,1300 L700,1210 L820,1210 L830,1300 Z" fill="#3a3a40" {...st} />
      <rect x={705} y={1220} width={110} height={70} fill="#9fd3e8" />
      <path d="M940,1300 L940,1180 M900,1180 L980,1180 L960,1130 L920,1130 Z" fill="#f2d64a" {...st} />
      <path d="M860,1300 L860,1262 L896,1262 L896,1300 Z" fill="#d9534f" {...st} strokeWidth={2.4} />
      <Plant x={90} y={1580} s={0.8} />
      <Person x={330} foot={1720} s={0.98}>
        <SketchPerson t={t} seed={1.3} look={HERO} pose={pose} expr={same > 0.5 ? "grin" : "think"} />
      </Person>
    </g>
  );
};

// ------------------------------------------------------------ 4 · yemek odası (aile sofrası)

const Yemek: React.FC<Ctx> = ({ t, L, W }) => {
  const wipe = win(t, W(5, 15) - 0.1, L(6) + 0.1, 0.2);
  const noWipe = sm(t, W(5, 17) - 0.1, W(5, 17) + 0.35);
  const tick1 = sm(t, W(5, 10) - 0.05, W(5, 10) + 0.3);
  const tick2 = sm(t, W(5, 11) - 0.05, W(5, 11) + 0.3);
  const heroPose: SketchPose = poseAt(t, [
    { at: -1, pose: { sit: true, r: { a: 20, e: -60 }, l: { a: 20, e: -60 }, turn: 0.1 } },
    { at: W(5, 7), pose: { sit: true, r: { a: 30, e: -100 }, l: { a: 20, e: -60 }, itemR: "bread", turn: 0.2 } },
    { at: L(6) - 0.2, pose: { sit: true, r: { a: 30, e: -110 }, l: { a: 20, e: -60 }, itemR: "phone", turn: 0.3 } },
  ]);
  const side = (seed: number) => ({ sit: true, r: { a: 20 + Math.sin(t * 1.2 + seed) * 4, e: -70 }, l: { a: 20, e: -60 } });
  return (
    <g>
      <rect width={RW} height={RH} fill="#f4dcc6" />
      <Floor y={1480} a="#e9caa8" b="#cfa883" />
      <Window x={80} y={220} w={240} h={320} t={t} night />
      <Frame x={430} y={250} w={200} h={160} c="#7fa6c9" />
      <Frame x={670} y={230} w={140} h={190} c="#d9876e" />
      <Frame x={840} y={280} w={140} h={130} c="#9b7bc4" />
      {/* bayrak süsü */}
      <path d="M0,150 Q540,260 1080,150" {...thin} />
      {Array.from({ length: 10 }).map((_, i) => {
        const u = (i + 0.5) / 10;
        const x = u * 1080;
        const y = 150 + Math.sin(u * Math.PI) * 55;
        const sw = Math.sin(t * 2 + i) * 3;
        return <path key={i} d={`M${x - 22},${y} L${x + 22},${y} L${x + sw},${y + 50} Z`} fill={["#e8b84a", "#4fa3c7", "#d9534f", "#6bb36a", "#9b7bc4"][i % 5]} {...st} strokeWidth={2.2} />;
      })}
      {/* tavan lambası + ışık */}
      <path d="M540,0 L540,560" {...thin} opacity={0.8} />
      <ellipse cx={540} cy={900} rx={420} ry={360} fill="#ffe08a" opacity={0.18} />
      <path d="M450,640 Q450,560 540,560 Q630,560 630,640 Z" fill="#f2d64a" {...st} />
      {/* sandalye arkalıkları */}
      {[230, 540, 850].map((x) => (
        <path key={x} d={`M${x - 120},1180 L${x - 110},820 Q${x},790 ${x + 110},820 L${x + 120},1180 Z`} fill="#a8724a" {...st} />
      ))}
      <Person x={230} foot={1190} s={1.0} sit>
        <SketchPerson t={t} seed={2.1} look={SKETCH_CAST.dede.look} pose={side(1)} expr="smile" />
      </Person>
      <Person x={850} foot={1190} s={1.0} sit>
        <SketchPerson t={t} seed={0.6} look={SKETCH_CAST.kiz.look} pose={side(2)} expr="smile" />
      </Person>
      <Person x={540} foot={1190} s={1.0} sit>
        <SketchPerson t={t} seed={1.3} look={HERO} pose={heroPose} expr={t > L(6) ? "grin" : wipe > 0.5 && noWipe > 0.5 ? "surprise" : "smile"} />
      </Person>
      {/* masa */}
      <path d="M80,1180 L1000,1180 L1030,1250 L50,1250 Z" fill="#fbfbf7" {...st} />
      <rect x={50} y={1250} width={980} height={70} fill="#fbfbf7" {...st} />
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={50 + i * 70} y={1290} width={35} height={30} fill={RED} opacity={0.8} />
      ))}
      {[120, 960].map((x) => (
        <rect key={x} x={x - 14} y={1320} width={28} height={250} fill="#8a5f42" {...st} />
      ))}
      {/* tabaklar */}
      {[230, 540, 850].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={1212} rx={110} ry={26} fill="#fff" {...st} strokeWidth={2.6} />
          <ellipse cx={x - 20} cy={1206} rx={34} ry={12} fill="#a8653a" stroke={LINE} strokeWidth={2} />
          <circle cx={x + 28} cy={1204} r={10} fill="#6bb36a" stroke={LINE} strokeWidth={2} />
          <circle cx={x + 46} cy={1212} r={9} fill="#d9534f" stroke={LINE} strokeWidth={2} />
        </g>
      ))}
      {/* ekmek sepeti: tam buğday */}
      <path d="M640,1196 L760,1196 L744,1150 L656,1150 Z" fill="#c99a6a" {...st} />
      <BreadSlice x={680} y={1150} s={0.42} dark />
      <BreadSlice x={720} y={1146} s={0.42} dark />
      {/* çipler */}
      <g opacity={win(t, L(5), L(6), 0.25)}>
        <g opacity={tick1}>
          <Pill x={300} y={700} text="1-2 DİLİM" o={1} bg={GREEN} size={44} />
          <Check x={482} y={694} r={22} o={1} />
        </g>
        <g opacity={tick2}>
          <Pill x={780} y={700} text="TAM BUĞDAY" o={1} bg="#8a5f42" size={44} />
          <Check x={978} y={694} r={22} o={1} />
        </g>
      </g>
      {wipe > 0 ? (
        <g opacity={wipe}>
          <BreadSlice x={540 + Math.sin(t * 9) * 50} y={1196} s={0.4} />
          <Cross x={540} y={1200} r={80} o={noWipe} />
          <Pill x={540} y={1400} text="TABAĞI EKMEKLE SİLMEK YOK" o={noWipe} bg={RED} size={40} />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------ dış cephe

const Outside: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <defs>
      <linearGradient id="ev-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#bfe0f0" />
        <stop offset="1" stopColor="#f6e3cf" />
      </linearGradient>
    </defs>
    <rect width={WW} height={WH} fill="url(#ev-sky)" />
    <circle cx={2380} cy={200} r={90} fill="#ffd45a" {...st} />
    {[[300, 180], [1900, 300]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x + Math.sin(t * 0.3 + i) * 20},${y})`}>
        <ellipse cx={0} cy={0} rx={150} ry={46} fill="#fff" {...st} strokeWidth={2.4} />
        <ellipse cx={-50} cy={-30} rx={70} ry={44} fill="#fff" {...st} strokeWidth={2.4} />
        <ellipse cx={40} cy={-34} rx={80} ry={50} fill="#fff" {...st} strokeWidth={2.4} />
        <ellipse cx={0} cy={6} rx={146} ry={40} fill="#fff" />
      </g>
    ))}
    {/* çatı + baca */}
    <rect x={1840} y={180} width={120} height={260} fill="#b5523b" {...st} />
    <path d={`M100,560 L1300,110 L2500,560 Z`} fill="#c8603f" {...st} strokeWidth={5} />
    {Array.from({ length: 7 }).map((_, i) => {
      const y = 170 + i * 60;
      const half = ((y - 110) / 450) * 1200;
      return <path key={i} d={`M${1300 - half},${y} L${1300 + half},${y}`} {...thin} opacity={0.35} />;
    })}
    <circle cx={1300} cy={380} r={70} fill="#f6e3cf" {...st} />
    <path d="M1300,320 L1300,440 M1240,380 L1360,380" stroke={LINE} strokeWidth={4} />
    {/* gövde, kat ayırıcı, ara duvarlar */}
    <rect x={140} y={540} width={2320} height={3720} fill="#e3b98f" {...st} strokeWidth={5} />
    {Array.from({ length: 40 }).map((_, i) => (
      <rect key={i} x={150 + ((i * 263) % 2280)} y={600 + ((i * 397) % 3600)} width={46} height={20} fill="#d4a378" opacity={0.6} />
    ))}
    <rect x={140} y={2360} width={2320} height={80} fill="#9c7656" {...st} />
    {/* zemin + çimen + çalılar */}
    <rect x={0} y={4250} width={WW} height={150} fill="#9cc27a" />
    <path d={`M0,4250 L${WW},4250`} stroke={LINE} strokeWidth={4} />
    {[60, 2540].map((x) => (
      <g key={x}>
        <ellipse cx={x} cy={4220} rx={90} ry={70} fill="#6f9f55" {...st} />
        <ellipse cx={x + (x < 1000 ? 50 : -50)} cy={4180} rx={70} ry={60} fill="#7fb062" {...st} />
      </g>
    ))}
  </g>
);

// ------------------------------------------------------------ kamera

type CamKey = [number, number, number, number]; // zaman, cx, cy, zoom

const camAt = (t: number, raw: CamKey[]) => {
  // zamanlar sıralı olsun (ses kısaysa üst üste binmesin)
  const keys: CamKey[] = [];
  for (const k of raw) keys.push([keys.length ? Math.max(k[0], keys[keys.length - 1][0] + 0.05) : k[0], k[1], k[2], k[3]]);
  if (t <= keys[0][0]) return keys[0];
  for (let i = 0; i + 1 < keys.length; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b[0]) {
      const k = sm(t, a[0], b[0]);
      return [t, mix(a[1], b[1], k), mix(a[2], b[2], k), Math.exp(mix(Math.log(a[3]), Math.log(b[3]), k))] as CamKey;
    }
  }
  return keys[keys.length - 1];
};

// ------------------------------------------------------------ kompozisyon

export const EkmekEv: React.FC<EkmekBirakProps & { music?: boolean }> = ({ audioName, data, music = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const base: TL = data ? voiceTimeline(data, EV_LINES) : EV_TL;
  const T = data ? data.durationInSeconds + EV_TAIL : EV_TL.total;
  const tl: TL = { ...base, total: T };
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k, EV_LINES);
  const ctx: Ctx = { t, L, W, T };

  const [b1x, b1y] = center(ROOMS.banyo);
  const [m2x, m2y] = center(ROOMS.mutfak);
  const [c3x, c3y] = center(ROOMS.calisma);
  const [y4x, y4y] = center(ROOMS.yemek);
  const ov: [number, number, number] = [WW / 2, WH / 2 + 10, 0.415];
  const hook: [number, number, number] = [b1x, b1y, 1.06];
  const keys: CamKey[] = [
    [-1, ...hook],
    [W(1, 2), ...hook],
    [W(1, 4) + 0.15, ROOMS.banyo.x + 660, ROOMS.banyo.y + 1300, 1.45], // tartı + okunuş
    [W(1, 9), b1x, b1y + 60, 1.04],
    [L(2) - 0.15, b1x, b1y + 40, 1.0],
    [L(2) + 0.35, (b1x + m2x) / 2, b1y + 40, 0.6],
    [L(2) + 0.85, m2x, m2y, 1.0],
    [W(2, 3), ROOMS.mutfak.x + 760, ROOMS.mutfak.y + 840, 1.35], // not + kavanoz
    [W(2, 11), m2x, m2y + 20, 1.02],
    [L(3) + 0.3, m2x, m2y + 20, 1.06],
    [L(4) - 0.15, m2x, m2y, 1.0],
    [L(4) + 0.4, WW / 2, 2400, 0.5],
    [L(4) + 0.95, c3x, c3y, 1.0],
    [W(4, 6), ROOMS.calisma.x + 330, ROOMS.calisma.y + 700, 1.3], // sol kâğıt
    [W(4, 9), ROOMS.calisma.x + 760, ROOMS.calisma.y + 700, 1.3], // sağ kâğıt
    [W(4, 14), c3x, ROOMS.calisma.y + 760, 1.08],
    [L(5) - 0.15, c3x, c3y, 1.0],
    [L(5) + 0.35, WW / 2, c3y, 0.6],
    [L(5) + 0.85, y4x, y4y, 1.0],
    [W(5, 13), y4x, y4y, 1.02],
    [W(5, 15) + 0.15, ROOMS.yemek.x + 540, ROOMS.yemek.y + 1150, 1.4], // tabak
    [L(6), y4x, y4y - 40, 1.06],
    [W(6, 4) + 0.35, y4x, y4y - 40, 1.08],
    [W(6, 4) + 1.35, ...ov],
    [T - 0.95, ...ov],
    [T, ...hook],
  ];
  const [, cx, cy, z] = camAt(t, keys);
  const loopIn = sm(t, T - 0.35, T - 0.03);

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.24, lead: 0.05 },
    { at: W(1, 4), id: 2568, v: 0.14 },
    { at: W(1, 12) - 0.05, id: 1120, v: 0.18, lead: 0.1 },
    { at: W(2, 12), id: 1120, v: 0.14, lead: 0.1 },
    { at: W(3, 5), id: 2568, v: 0.14 },
    { at: W(4, 14), id: 1120, v: 0.2, lead: 0.1 },
    { at: W(5, 17), id: 2568, v: 0.14 },
    { at: W(6, 4) + 0.4, id: 1143, v: 0.16, lead: 0.14, dur: 1.6, fade: 0.8 }, // evin tamamı
  ];

  const room = (r: { x: number; y: number }, id: string, el: React.ReactNode) => (
    <g transform={`translate(${r.x},${r.y})`}>
      <clipPath id={`ev-${id}`}>
        <rect width={RW} height={RH} />
      </clipPath>
      <g clipPath={`url(#ev-${id})`}>{el}</g>
      <rect width={RW} height={RH} fill="none" stroke={LINE} strokeWidth={6} />
    </g>
  );

  return (
    <AbsoluteFill lang="tr" style={{ background: "#f6e3cf", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <SketchDefs />
        <g transform={`translate(540,960) scale(${z}) translate(${-cx},${-cy})`}>
          <g filter="url(#pencil)">
            <Outside t={t} />
            {room(ROOMS.banyo, "b", <Banyo {...ctx} />)}
            {room(ROOMS.mutfak, "m", <Mutfak {...ctx} />)}
            {room(ROOMS.calisma, "c", <Calisma {...ctx} />)}
            {room(ROOMS.yemek, "y", <Yemek {...ctx} />)}
          </g>
        </g>

        {/* ekran kartları */}
        <Card x={540} y={300} w={900} h={250} o={Math.max(win(t, -1, W(1, 0), 0.25), loopIn)}>
          <Txt x={0} y={-22} size={74}>
            EKMEĞİ BIRAKIRSAN
          </Txt>
          <Txt x={0} y={70} size={92} fill={RED}>
            ZAYIFLARSIN?
          </Txt>
        </Card>
        <Card x={560} y={280} w={640} h={170} o={win(t, W(1, 9) - 0.1, L(2) - 0.1, 0.25)} tilt={1}>
          <Txt x={0} y={22} size={62}>
            <tspan>YAĞ DEĞİL… </tspan>
            <tspan fill={WATER}>SU</tspan>
          </Txt>
        </Card>
        <Card x={540} y={280} w={620} h={160} o={win(t, W(3, 3) - 0.1, L(4) - 0.1, 0.25)} tilt={1.2}>
          <Txt x={0} y={22} size={58} fill={RED}>
            SU GERİ GELDİ
          </Txt>
        </Card>
        <Card x={540} y={280} w={760} h={160} o={win(t, L(5) + 0.4, W(5, 7), 0.25)}>
          <Txt x={0} y={22} size={64}>
            MESELE EKMEK DEĞİL
          </Txt>
        </Card>
        <Card x={540} y={300} w={900} h={210} o={win(t, L(6), T - 0.6, 0.3)}>
          <Txt x={0} y={-12} size={56}>
            EKMEĞİ BIRAKAN
          </Txt>
          <Txt x={0} y={66} size={64} fill={RED}>
            ARKADAŞINA GÖNDER ➤
          </Txt>
        </Card>
      </svg>

      <Captions t={t} tl={tl} lines={EV_LINES} end={T - EV_TAIL + 0.6} />
      {data ? <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} /> : null}
      {/* konuşmanın altında kısık müzik (623, git'te yok: curl ile indir); kapanışta biraz yükselir, sonda söner */}
      {data && music ? (
        <Audio
          src={staticFile("music/623.mp3")}
          volume={(f) => {
            const mt = f / fps;
            const end = data.durationInSeconds;
            const base = interpolate(mt, [0, 0.6, end, end + 0.5], [0, 0.04, 0.04, 0.08], { extrapolateRight: "clamp" });
            return base * interpolate(mt, [T - 0.9, T - 0.1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          }}
        />
      ) : null}
      {FX.map((f, k) => (
        <Sequence key={`fx${k}`} from={Math.max(0, Math.round(f.at * fps))} durationInFrames={f.dur ? Math.round(f.dur * fps) : undefined} layout="none">
          <Audio
            src={staticFile(`sfx/${f.id}.mp3`)}
            startFrom={Math.round((f.lead ?? 0) * fps)}
            volume={(q) => (f.dur && f.fade ? f.v * interpolate(q / fps, [0, 0.001, f.dur - f.fade, f.dur], [1, 1, 1, 0], { extrapolateRight: "clamp" }) : f.v)}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
