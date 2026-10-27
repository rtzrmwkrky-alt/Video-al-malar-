/**
 * "Tüp mide oldun, kırk kilo verdin…" (~35 sn). Kullanıcının gönderdiği örnek videonun aynı akışı ve metni, bizim kalem
 * çizimi siyah saçlı gencimizle (SadikMusteri gibi): banyo tartısı 119 → 80 kg (−40 kg) → parkta el sallarken kolun altı
 * sallanır → sofrada "Tuzu uzatır mısın?" (tuza uzanan kol sallanır) → 1988: mide 1. adım / bağırsak 2. adım, kesik çizgi
 * → hastalar o kadar kilo verdi ki 2. ADIM'a GEREK KALMADI, geriye tüp mide → 2022: 2.000 hasta → verilen 40 kilonun
 * 8'i yağ değil (10 blok 4 kg, ikisi kırmızı) → kol kesiti: kas gidince deri boşta → salonda deney: ağırlık çalışan daha
 * güçlü → doktor onayı, kol/karın/bacak halkaları → kesitte kas büyür, deriyi tamamen toplamaz ama altını doldurur →
 * Voom koçu (telefon + kol/karın/bacak ✓) → "Bunu tüp mide olan birine gönder." kâğıt uçak → başa döner (döngü).
 * Metin `icerik/tup-mide-sarkma.seslendirme.txt`. Müzik: örnek videonun kendi müziği (`audio/tup-sarkma-orijinal.mp3`).
 */
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { HAND, SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline } from "../ornek/common";
import { LINE, type SketchLook, type SketchPose, SketchDefs, SKETCH_CAST } from "../sketch/SketchPerson";
import { Captions, type EkmekBirakProps, PAPER, RED, type TL, mix, st, voiceTimeline, wordTime } from "./EkmekBirak";
import { GymBg, Hero, INK, Note, Specks, Tag } from "./SadikMusteri";

loadFonts();

export const TS_LINES: Line[] = [
  { text: "Tüp mide oldun, kırk kilo verdin", hl: ["Tüp", "mide", "kırk"], hold: 0.1 },
  { text: "ama el sallarken kolunun altı hâlâ sallanıyor.", hl: ["el", "altı", "sallanıyor."], hold: 0.3 },
  { text: "Yoksa sana da mı biri 'Tuzu uzatır mısın?' dedi?", hl: ["sana", "'Tuzu", "uzatır"], hold: 0.3 },
  { text: "Tüp mide 1988'de büyük bir ameliyatın sadece ilk adımıydı.", hl: ["mide", "1988'de", "ameliyatın", "ilk"], hold: 0.2 },
  { text: "Hastalar o kadar kilo verdi ki ikinci adıma gerek kalmadı.", hl: ["kadar", "verdi", "gerek", "kalmadı."], hold: 0.3 },
  { text: "2022'de iki bin hasta incelendi:", hl: ["2022'de", "iki", "bin"], hold: 0.1 },
  { text: "verilen kilonun sekizi yağ değildi.", hl: ["sekizi", "yağ", "değildi."], hold: 0.3 },
  { text: "Kas gidince deri boşta kalır.", hl: ["gidince", "deri", "boşta"], hold: 0.2 },
  { text: "Bir deneyde ağırlık çalışan hastalar daha güçlü çıktı.", hl: ["deneyde", "ağırlık", "hastalar", "güçlü"], hold: 0.2 },
  { text: "Doktorun izin verince kola, karna, bacağa ağırlık çalış;", hl: ["Doktorun", "izin", "kola,", "karna,", "bacağa", "ağırlık"], hold: 0.1 },
  { text: "deriyi tamamen toplamaz ama altını kas doldurur.", hl: ["tamamen", "ama", "kas", "doldurur."], hold: 0.3 },
  { text: "Nereye ne çalışacağını, VOOM'daki koçun sarkan bölgene göre planlar.", hl: ["Nereye", "ne", "VOOM'daki", "koçun", "bölgene", "planlar."], hold: 0.2 },
  { text: "Bunu tüp mide olan birine gönder.", hl: ["tüp", "birine", "gönder."], hold: 0.1 },
];

export const TS_TAIL = 1.15;
export const TS_TL = timeline(TS_LINES, TS_TAIL);

const HERO = SKETCH_CAST.siyah.look;
const FRIEND: SketchLook = { ...SKETCH_CAST.sari.look, top: "#6f9fd8", bottom: "#8d8e92" };
const PATIENT: SketchLook = { ...SKETCH_CAST.siyah.look, top: "#eeebe3", bottom: "#6f8fb8", hair: "#3a2a22" };
const DOCTOR: SketchLook = { ...SKETCH_CAST.dede.look, top: "#f6f5f0", bottom: "#3b3557" };
const STOMACH = "#cf6d66";

type S = { t: number; u: number; W: (k: number) => number; d: number };

/** kamera: (cx,cy) noktasına k kat yaklaşır */
const Cam: React.FC<{ cx: number; cy: number; k: number; children: React.ReactNode }> = ({ cx, cy, k, children }) => (
  <g transform={`translate(${mix(540, 540, k)},960) scale(${k}) translate(${-mix(540, cx, Math.min(1, (k - 1) * 3))},${-mix(960, cy, Math.min(1, (k - 1) * 3))})`}>
    {children}
  </g>
);

/** el sallama pozu (sağ kol yukarıda) */
const wave = (t: number, flap: number, belly = 0): SketchPose => ({
  turn: 0.1,
  belly,
  flap,
  l: { a: 10, e: 6 },
  r: { a: 112, e: 52 + 18 * Math.sin(t * 7) },
});

// ------------------------------------------------------------ arka planlar

const BathBg: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill="#d6e6e6" />
    {Array.from({ length: 12 }).map((_, i) => (
      <path key={`v${i}`} d={`M${i * 100 + 40},0 L${i * 100 + 40},1300`} stroke="#b4caca" strokeWidth={3} />
    ))}
    {Array.from({ length: 13 }).map((_, i) => (
      <path key={`h${i}`} d={`M0,${i * 100 + 20} L1080,${i * 100 + 20}`} stroke="#b4caca" strokeWidth={3} />
    ))}
    <rect x={0} y={1300} width={1080} height={620} fill="#a9b6b8" />
    <Specks y0={1320} y1={1900} c="#7f8b8e" n={30} />
    <path d="M0,1300 L1080,1300" stroke={LINE} strokeWidth={4} />
  </g>
);

const Tree: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-16} y={-40} width={32} height={180} fill="#7a5638" {...st} />
    <circle cx={0} cy={-140} r={150} fill="#6aa35a" {...st} strokeWidth={4} />
  </g>
);

const ParkBg: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect width={1080} height={1920} fill="#bcdcee" />
    <circle cx={820} cy={220} r={70} fill="#f6d36b" />
    {[0, 1].map((i) => (
      <ellipse key={i} cx={((i * 520 + t * 12) % 1300) - 100} cy={330 + i * 120} rx={110} ry={34} fill="#fff" opacity={0.75} />
    ))}
    <Tree x={110} y={1180} s={1.1} />
    <Tree x={990} y={1120} s={1.4} />
    <rect x={0} y={1290} width={1080} height={630} fill="#8cc06e" />
    <path d="M0,1290 L1080,1290" stroke={LINE} strokeWidth={4} />
    <path d="M0,1560 Q540,1500 1080,1560 L1080,1700 Q540,1640 0,1700 Z" fill="#d9c9a4" {...st} strokeWidth={3} />
  </g>
);

const RoomBg: React.FC<{ fill?: string }> = ({ fill = "#eddcbd" }) => (
  <g>
    <rect width={1080} height={1920} fill={fill} />
    <g transform="translate(250,380)">
      <rect x={-140} y={-130} width={280} height={260} fill="#bcdcee" {...st} strokeWidth={5} />
      <path d="M0,-130 L0,130 M-140,0 L140,0" stroke={LINE} strokeWidth={6} />
    </g>
  </g>
);

const Table: React.FC = () => (
  <g>
    <rect x={-10} y={1230} width={1100} height={60} fill="#8a5a36" {...st} />
    <rect x={0} y={1290} width={1080} height={630} fill="#7a4d2c" />
    <Specks y0={1310} y1={1900} c="#5a3a26" n={30} />
  </g>
);

/** pilav + domates/biber tabağı */
const Dish: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={150} ry={30} fill="#fbfbf7" {...st} />
    <path d="M-110,-6 Q-100,-60 0,-64 Q100,-60 110,-6 Z" fill="#e9b04a" {...st} />
    <circle cx={-40} cy={-34} r={20} fill="#6aa35a" {...st} strokeWidth={2.6} />
    <circle cx={30} cy={-38} r={20} fill="#d9453b" {...st} strokeWidth={2.6} />
  </g>
);

const Salt: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-26,0 L-30,-80 Q0,-100 30,-80 L26,0 Z" fill="#f6f5f0" {...st} />
    {[-10, 0, 10].map((d) => (
      <circle key={d} cx={d} cy={-86} r={2.6} fill={LINE} />
    ))}
  </g>
);

const Bubble: React.FC<{ x: number; y: number; text: string; o: number; tail?: number }> = ({ x, y, text, o, tail = -1 }) => {
  if (o <= 0) return null;
  const w = text.length * 26 + 80;
  return (
    <g opacity={o} transform={`translate(${x},${y + (1 - o) * 10})`}>
      <path
        d={`M${-w / 2},-50 Q${-w / 2},-70 ${-w / 2 + 20},-70 L${w / 2 - 20},-70 Q${w / 2},-70 ${w / 2},-50 L${w / 2},20 Q${w / 2},40 ${w / 2 - 20},40 L${tail * 40 + 30},40 L${tail * 70},110 L${tail * 40 - 10},40 L${-w / 2 + 20},40 Q${-w / 2},40 ${-w / 2},20 Z`}
        fill={PAPER}
        {...st}
        strokeWidth={4}
      />
      <text x={0} y={2} textAnchor="middle" fontFamily={HAND} fontSize={58} fill={LINE}>
        {text}
      </text>
    </g>
  );
};

// ------------------------------------------------------------ parçalar

/** tartı (büyük ekranlı) */
const BigScale: React.FC<{ x: number; y: number; kg: number; s?: number }> = ({ x, y, kg, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={50} rx={230} ry={16} fill="#5a3a26" opacity={0.13} />
    <path d="M-210,-20 L210,-20 Q226,-18 222,10 Q218,46 196,46 L-196,46 Q-218,46 -222,10 Q-226,-18 -210,-20 Z" fill="#eef0f1" {...st} strokeWidth={4} />
    <rect x={-80} y={-6} width={160} height={42} rx={8} fill="#2e3a36" {...st} strokeWidth={3} />
    <text x={0} y={26} textAnchor="middle" fontFamily={HAND} fontSize={34} fill="#9cf0b8">
      {Math.round(kg)} kg
    </text>
  </g>
);

/** 1. ADIM / 2. ADIM kartı */
const StepCard: React.FC<{ x: number; y: number; n: number; sub: string; o: number; on?: number }> = ({ x, y, n, sub, o, on = 0 }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y + (1 - o) * 12})`}>
      <rect x={-150 + 6} y={-70 + 8} width={300} height={140} rx={16} fill="#5a3a26" opacity={0.15} />
      <rect x={-150} y={-70} width={300} height={140} rx={16} fill="#d8c3a0" {...st} strokeWidth={4} />
      {on > 0 ? <rect x={-150} y={-70} width={300} height={140} rx={16} fill="none" stroke={INK} strokeWidth={9} opacity={on} /> : null}
      <text x={0} y={-8} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={42} fill={LINE}>
        {n}. ADIM
      </text>
      <text x={0} y={42} textAnchor="middle" fontFamily={HAND} fontSize={40} fill={LINE}>
        {sub}
      </text>
    </g>
  );

const Stamp: React.FC<{ x: number; y: number; text: string; k: number }> = ({ x, y, text, k }) =>
  k <= 0 ? null : (
    <g opacity={Math.min(1, k * 1.5)} transform={`translate(${x},${y}) rotate(-12) scale(${mix(1.25, 1, k)})`}>
      <rect x={-200} y={-46} width={400} height={92} rx={10} fill="none" stroke={RED} strokeWidth={8} />
      <text x={0} y={20} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={56} fill={RED} letterSpacing={2}>
        {text}
      </text>
    </g>
  );

const BEAN =
  "M470,700 C300,780 250,1080 400,1240 C540,1380 760,1360 820,1300 C720,1240 640,1080 600,880 C585,790 565,730 545,700 Z";
const TUBE = "M508,700 C508,900 520,1090 600,1220 C650,1290 730,1305 800,1290";
const CUT = "M478,712 C470,910 486,1110 568,1250 C626,1340 740,1346 812,1310";

/** mide: tube=0 tam mide, 1 sadece tüp kalır; cut = kesik çizgi */
const Stomach: React.FC<{ tube: number; cut: number; s?: number }> = ({ tube, cut, s = 1 }) => (
  <g transform={`translate(540,1000) scale(${s}) translate(-540,-1000)`}>
    <path d="M482,600 L490,710 M532,600 L524,710" stroke={LINE} strokeWidth={5} strokeLinecap="round" />
    <g opacity={1 - tube}>
      <path d={BEAN} fill={STOMACH} {...st} strokeWidth={5} />
    </g>
    {tube > 0 ? (
      <g opacity={tube}>
        <path d={TUBE} fill="none" stroke={LINE} strokeWidth={86} strokeLinecap="round" />
        <path d={TUBE} fill="none" stroke={STOMACH} strokeWidth={76} strokeLinecap="round" />
      </g>
    ) : null}
    {cut > 0 && tube < 1 ? (
      <path d={CUT} fill="none" stroke={LINE} strokeWidth={5} strokeDasharray="18 12" opacity={cut * (1 - tube)} />
    ) : null}
    {cut > 0 && tube < 1 ? (
      <path d={CUT} fill="none" stroke={STOMACH} strokeWidth={7} strokeDasharray="10 20" opacity={cut * (1 - tube)} />
    ) : null}
  </g>
);

/** kol kesiti: dış deri, deri altı, kas (lifli), kemik. sag = alt kısmın sarkması */
const ArmSection: React.FC<{ muscle: number; sag: number; o?: number }> = ({ muscle, sag, o = 1 }) => {
  const cx = 540;
  const cy = 900;
  const shape = (R: number) => {
    const b = cy + R + sag * 300;
    return `M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy} C${cx + R},${cy + R * 0.6 + sag * 220} ${cx + R * 0.55},${b} ${cx},${b} C${cx - R * 0.55},${b} ${cx - R},${cy + R * 0.6 + sag * 220} ${cx - R},${cy} Z`;
  };
  const m = muscle;
  return (
    <g opacity={o}>
      <path d={shape(260)} fill="#faf1de" {...st} strokeWidth={5} />
      <path d={shape(232)} fill="#f2cdb5" stroke="#c97b5a" strokeWidth={5} />
      <clipPath id="ts-muscle">
        <circle cx={cx} cy={cy - 10} r={m} />
      </clipPath>
      <circle cx={cx} cy={cy - 10} r={m} fill="#d9574e" {...st} strokeWidth={5} />
      <g clipPath="url(#ts-muscle)">
        {[-0.62, -0.31, 0, 0.31, 0.62].map((k) => (
          <path key={k} d={`M${cx - m},${cy - 10 + k * m} Q${cx},${cy - 16 + k * m} ${cx + m},${cy - 10 + k * m}`} fill="none" stroke="#f3b3a8" strokeWidth={4} />
        ))}
      </g>
      <circle cx={cx} cy={cy - 10} r={22} fill="#fbfbf7" {...st} strokeWidth={4} />
      <text x={cx} y={cy - 290} textAnchor="middle" fontFamily={HAND} fontSize={48} fill={LINE}>
        kol
      </text>
    </g>
  );
};

const Person: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y})`}>
      <path d="M-18,30 Q-18,10 0,10 Q18,10 18,30 Z" fill="#6f8fb8" stroke={LINE} strokeWidth={2.4} />
      <circle cx={0} cy={0} r={11} fill="#f2c9a8" stroke={LINE} strokeWidth={2.4} />
    </g>
  );

const Block: React.FC<{ x: number; y: number; red: number; o: number }> = ({ x, y, red, o }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y})`}>
      <rect x={-86} y={-40} width={172} height={80} rx={10} fill={red > 0.5 ? "#b8322a" : "#f2b632"} {...st} strokeWidth={4} />
      <text x={0} y={16} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill={red > 0.5 ? "#fff" : LINE}>
        4 kg
      </text>
    </g>
  );

/** güç tüpü */
const PowerBar: React.FC<{ x: number; y: number; level: number; color: string }> = ({ x, y, level, color }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-36} y={-260} width={72} height={260} rx={12} fill={PAPER} {...st} strokeWidth={4} />
    <rect x={-30} y={-6 - 248 * level} width={60} height={248 * level} rx={8} fill={color} />
    <rect x={-36} y={-260} width={72} height={260} rx={12} fill="none" {...st} strokeWidth={4} />
    <text x={0} y={50} textAnchor="middle" fontFamily={HAND} fontSize={40} fill={LINE}>
      güç
    </text>
  </g>
);

const Ring: React.FC<{ x: number; y: number; rx: number; ry?: number; label: string; o: number; lx?: number; ly?: number }> = ({ x, y, rx, ry, label, o, lx, ly }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <ellipse cx={x} cy={y} rx={rx * mix(0.7, 1, o)} ry={(ry ?? rx) * mix(0.7, 1, o)} fill="none" stroke={INK} strokeWidth={6} strokeDasharray="18 12" />
      <text x={lx ?? x + rx + 18} y={ly ?? y + 14} fontFamily={HAND} fontSize={44} fill={INK}>
        {label}
      </text>
    </g>
  );

const CheckMark: React.FC<{ x: number; y: number; o: number; r?: number }> = ({ x, y, o, r = 60 }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y}) scale(${mix(0.8, 1, o)})`}>
      <circle r={r} fill={PAPER} {...st} strokeWidth={4} />
      <path d={`M${-r * 0.4},0 L${-r * 0.1},${r * 0.32} L${r * 0.45},${-r * 0.35}`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );

const CheckCard: React.FC<{ x: number; y: number; text: string; o: number }> = ({ x, y, text, o }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x + (1 - o) * 30},${y})`}>
      <rect x={-130 + 5} y={-50 + 7} width={260} height={100} rx={14} fill="#5a3a26" opacity={0.15} />
      <rect x={-130} y={-50} width={260} height={100} rx={14} fill={PAPER} {...st} strokeWidth={4} />
      <text x={-30} y={16} textAnchor="middle" fontFamily={HAND} fontSize={50} fill={LINE}>
        {text}
      </text>
      <path d="M62,0 L80,22 L112,-22" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );

const DarkRoomBg: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill="#ddd2b4" />
    <rect x={0} y={1330} width={1080} height={590} fill="#3b3a3f" />
    <Specks y0={1350} y1={1900} c="#8d8a92" />
    <path d="M0,1330 L1080,1330" stroke={LINE} strokeWidth={4} />
  </g>
);

// ------------------------------------------------------------ sahneler

/** 0: banyo tartısı 119 → 80 kg, gövde incelir */
const Weigh: React.FC<S> = ({ t, u, W, d }) => {
  const k = sm(u, 0.25, d - 0.2);
  const zoom = mix(1.18, 1, sm(u, 0, d * 0.7));
  return (
    <g>
      <BathBg />
      <Cam cx={540} cy={1150} k={zoom}>
        <Hero x={540} foot={1560} s={mix(1.22, 1.02, k)} t={t} pose={{ turn: 0.1, belly: 1 - k, l: { a: mix(22, 10, k), e: 6 }, r: { a: mix(22, 10, k), e: 6 } }} expr="smile" />
        <BigScale x={540} y={1575} kg={mix(119, 80, k)} s={mix(1.2, 1, k)} />
      </Cam>
      <Note x={540} y={300} text="−40 kg" o={sm(t, W(3) - 0.1, W(3) + 0.25)} />
    </g>
  );
};

/** 1: parkta el sallar, kolun altı sallanır */
const Waving: React.FC<S> = ({ t, W }) => {
  const flap = sm(t, W(3) - 0.2, W(4) + 0.1);
  const zoom = 1 + 0.9 * sm(t, W(3) - 0.3, W(5));
  const worry = t > W(5) - 0.1;
  return (
    <g>
      <Cam cx={600} cy={1000} k={zoom}>
        <ParkBg t={t} />
        <Hero x={540} foot={1600} s={1.05} t={t} pose={wave(t, flap)} expr={worry ? "worry" : "grin"} />
      </Cam>
      <Note x={540} y={250} text="hâlâ sallanıyor" o={sm(t, W(6) - 0.15, W(6) + 0.2)} color={RED} tilt={-3} />
    </g>
  );
};

/** 2: sofra — "Tuzu uzatır mısın?" tuza uzanan kol sallanır */
const Dinner: React.FC<S> = ({ t, W }) => {
  const reach = sm(t, W(5) - 0.3, W(6));
  const zoom = 1 + 0.45 * sm(t, W(6) - 0.2, W(8));
  const pose: SketchPose = {
    turn: 0.5,
    flap: reach,
    l: { a: 14, e: 30 },
    r: { a: mix(20, 88, reach), e: mix(40, 4, reach) + Math.sin(t * 8) * 4 * reach },
  };
  return (
    <g>
      <Cam cx={500} cy={1050} k={zoom}>
        <RoomBg />
        <Hero x={330} foot={1560} s={1.0} t={t} pose={pose} expr={reach > 0.5 ? "flat" : "smile"} />
        <Hero x={790} foot={1560} s={1.0} t={t} look={FRIEND} pose={{ turn: -0.5 }} expr="smile" seed={2} talk={t > W(5) - 0.1 && t < W(8) ? 1 : 0} />
        <Table />
        <Dish x={320} y={1228} />
        <Dish x={790} y={1228} />
        <Salt x={mix(600, 560, reach)} y={1230} />
      </Cam>
      <Bubble x={720} y={760} text="Tuzu uzatır mısın?" o={sm(t, W(5) - 0.15, W(5) + 0.2)} tail={0.6} />
    </g>
  );
};

/** 3: 1988 — mide, 1. adım / 2. adım, kesik çizgi */
const Surgery: React.FC<S> = ({ t, W }) => (
  <g>
    <rect width={1080} height={1920} fill="#d4bd98" />
    <rect x={0} y={1500} width={1080} height={420} fill="#b9a079" />
    <Tag x={200} y={230} text="1988" o={sm(t, W(2) - 0.15, W(2) + 0.2)} />
    <StepCard x={260} y={400} n={1} sub="mide" o={sm(t, W(5) - 0.15, W(5) + 0.2)} on={sm(t, W(7) - 0.1, W(8))} />
    <StepCard x={800} y={400} n={2} sub="bağırsak" o={sm(t, W(5) + 0.15, W(5) + 0.5)} />
    <Stomach tube={0} cut={sm(t, W(7) - 0.1, W(8) + 0.3)} />
  </g>
);

/** 4: üç hasta kilo verir (140 → 90) → "ikinci adıma gerek kalmadı", geriye tüp mide */
const NoNeed: React.FC<S> = ({ t, u, W }) => {
  const second = W(6) - 0.12;
  if (t < second) {
    const k = sm(u, 0.3, second - (t - u) - 0.1);
    return (
      <g>
        <rect width={1080} height={1920} fill="#d4bd98" />
        <rect x={0} y={1500} width={1080} height={420} fill="#b9a079" />
        <Hero x={230} foot={1470} s={0.8} t={t} look={PATIENT} pose={{ turn: 0.3, belly: 0.8 * (1 - k) }} expr={k > 0.5 ? "smile" : "flat"} seed={1} />
        <Hero x={850} foot={1470} s={0.8} t={t} look={PATIENT} pose={{ turn: -0.3, belly: 0.9 * (1 - k) }} expr={k > 0.5 ? "grin" : "flat"} seed={3} />
        <Hero x={540} foot={1500} s={0.95} t={t} pose={{ turn: 0, belly: 1 - k }} expr={k > 0.5 ? "grin" : "flat"} />
        <BigScale x={540} y={1515} kg={mix(140, 90, k)} s={0.85} />
        <Note x={540} y={460} text="−50 kg" o={sm(t, W(4) - 0.1, W(4) + 0.25)} />
      </g>
    );
  }
  const v = t - second;
  return (
    <g>
      <rect width={1080} height={1920} fill="#d4bd98" />
      <rect x={0} y={1500} width={1080} height={420} fill="#b9a079" />
      <Tag x={200} y={230} text="1988" o={1} />
      <StepCard x={260} y={400} n={1} sub="mide" o={1} on={1} />
      <StepCard x={800} y={400} n={2} sub="bağırsak" o={1} />
      <Stamp x={810} y={400} text="GEREK KALMADI" k={sm(t, W(8) - 0.1, W(8) + 0.15)} />
      <Stomach tube={sm(v, 0.05, 0.6)} cut={1} />
      <Note x={560} y={1420} text="tüp mide" o={sm(v, 0.3, 0.6)} tilt={-3} />
    </g>
  );
};

/** 5: 2022 — 2.000 hasta */
const Crowd: React.FC<S> = ({ t, u, d, W }) => {
  const k = sm(u, 0.15, d - 0.15);
  const n = Math.floor(k * 200);
  const count = Math.round(k * 2000);
  return (
    <g>
      <rect width={1080} height={1920} fill="#ece0c6" />
      <Tag x={190} y={250} text="2022" o={sm(u, 0, 0.25)} />
      <Note x={620} y={250} text={`${count.toLocaleString("tr-TR")} hasta`} o={sm(t, W(2) - 0.2, W(2) + 0.1)} tilt={2} />
      {Array.from({ length: n }).map((_, i) => (
        <Person key={i} x={150 + (i % 10) * 87} y={430 + Math.floor(i / 10) * 52} o={1} />
      ))}
    </g>
  );
};

/** 6: −40 kg = 10 blok 4 kg; ikisi (8 kg) yağ değil */
const Blocks: React.FC<S> = ({ t, u, W }) => {
  const red = sm(t, W(3) - 0.15, W(3) + 0.1);
  return (
    <g>
      <rect width={1080} height={1920} fill="#ece0c6" />
      <Note x={540} y={300} text="−40 kg" o={sm(u, 0, 0.25)} />
      <Note x={540} y={470} text="8 kg yağ değil" o={red} color={RED} tilt={2} />
      {Array.from({ length: 10 }).map((_, i) => {
        const row = Math.floor(i / 2);
        const at = 0.1 + i * 0.12;
        const f = sm(u, at, at + 0.3);
        const y = 1380 - row * 100;
        return <Block key={i} x={i % 2 ? 640 : 440} y={mix(y - 260, y, f)} red={row === 4 ? red : 0} o={f} />;
      })}
    </g>
  );
};

/** 7: kas gidince deri boşta kalır */
const SkinLoose: React.FC<S> = ({ t, u, W }) => {
  const k = sm(t, W(0), W(3) + 0.2);
  return (
    <g>
      <rect width={1080} height={1920} fill="#ece0c6" />
      <ArmSection muscle={mix(150, 85, k)} sag={sm(t, W(2) - 0.2, W(4))} o={sm(u, 0, 0.2)} />
      <Note x={540} y={1560} text="deri boşta" o={sm(t, W(3) - 0.15, W(3) + 0.2)} color={RED} tilt={-3} />
    </g>
  );
};

/** 8: salonda deney — ağırlık çalışan daha güçlü */
const Experiment: React.FC<S> = ({ t, u, W }) => {
  const k = sm(t, W(2), W(7) + 0.2);
  const curl = 0.5 - 0.5 * Math.cos(Math.max(0, u - 0.3) * 4.5);
  return (
    <g>
      <GymBg t={t} />
      <Tag x={560} y={400} text="bir deney" o={sm(u, 0.05, 0.3)} />
      <Note x={330} y={540} text="daha güçlü" o={sm(t, W(7) - 0.15, W(7) + 0.2)} />
      <PowerBar x={330} y={980} level={mix(0.3, 0.97, k)} color="#1f4b8f" />
      <PowerBar x={780} y={980} level={0.3} color="#a8a599" />
      <Hero x={330} foot={1600} s={0.92} t={t} pose={{ turn: 0.3, itemR: "dumbbell", l: { a: 10, e: 6 }, r: { a: 8, e: mix(10, 140, curl) } }} expr="grin" />
      <Hero x={780} foot={1600} s={0.92} t={t} look={PATIENT} pose={{ turn: -0.3 }} expr="flat" seed={4} />
    </g>
  );
};

/** 9: doktor onayı → kol/karın/bacak halkaları */
const DoctorGym: React.FC<S> = ({ t, u, W }) => {
  const gym = W(3) - 0.12;
  if (t < gym)
    return (
      <g>
        <rect width={1080} height={1920} fill="#dcecf1" />
        <rect x={0} y={1380} width={1080} height={540} fill="#b9ccd4" />
        <path d="M0,1380 L1080,1380" stroke={LINE} strokeWidth={4} />
        <Note x={760} y={330} text="doktor onayı" o={sm(u, 0.05, 0.3)} />
        <CheckMark x={560} y={560} o={sm(t, W(1) - 0.1, W(1) + 0.2)} />
        <Hero x={340} foot={1600} s={1.0} t={t} look={DOCTOR} pose={{ turn: 0.4, r: { a: 120, e: 40 + 10 * Math.sin(t * 6) } }} expr="smile" seed={5} talk={1} />
        <Hero x={740} foot={1600} s={1.0} t={t} pose={{ turn: -0.4 }} expr="smile" />
      </g>
    );
  const v = t - gym;
  const curl = 0.5 - 0.5 * Math.cos(v * 4.5);
  return (
    <g>
      <GymBg t={t} />
      <Hero x={540} foot={1600} s={1.05} t={t} pose={{ turn: 0.2, itemR: "dumbbell", l: { a: 10, e: 6 }, r: { a: 8, e: mix(10, 140, curl) } }} expr="grin">
        <Ring x={268} y={330} rx={56} ry={74} label="kol" o={sm(t, W(3) - 0.1, W(3) + 0.2)} lx={330} ly={250} />
        <Ring x={200} y={390} rx={62} ry={80} label="karın" o={sm(t, W(4) - 0.1, W(4) + 0.2)} lx={-30} ly={400} />
        <Ring x={200} y={640} rx={70} ry={150} label="bacak" o={sm(t, W(5) - 0.1, W(5) + 0.2)} lx={280} ly={700} />
      </Hero>
    </g>
  );
};

/** 10: kesitte kas büyür; deriyi tamamen toplamaz */
const MuscleFill: React.FC<S> = ({ t, W }) => {
  const g = sm(t, W(4) - 0.1, W(6) + 0.3);
  return (
    <g>
      <rect width={1080} height={1920} fill="#ece0c6" />
      <Note x={540} y={300} text="tamamen değil" o={sm(t, W(1) - 0.1, W(1) + 0.2)} color={RED} tilt={-3} />
      <ArmSection muscle={mix(85, 200, g)} sag={mix(1, 0.4, g)} />
      <Note x={540} y={1580} text="altını kas doldurur" o={sm(t, W(5) - 0.1, W(5) + 0.25)} tilt={-2} />
    </g>
  );
};

/** 11-12: Voom koçu → gönder (telefon resmi HTML katmanında) */
const Coach: React.FC<S & { line: 11 | 12; W11: (k: number) => number; W12: (k: number) => number }> = ({ t, line, W11, W12 }) => {
  const hold = line === 12 ? sm(t, W12(0) - 0.2, W12(0) + 0.2) : 0;
  const fly = line === 12 ? sm(t, W12(5) - 0.15, W12(5) + 0.8) : 0;
  return (
    <g>
      <DarkRoomBg />
      {phoneO(t, W11) > 0 ? <circle cx={330} cy={640} r={260} fill="#c9d3a8" opacity={0.55 * phoneO(t, W11)} /> : null}
      <CheckCard x={830} y={480} text="kol" o={sm(t, W11(5) - 0.1, W11(5) + 0.2)} />
      <CheckCard x={830} y={620} text="karın" o={sm(t, W11(6) - 0.05, W11(6) + 0.25)} />
      <CheckCard x={830} y={760} text="bacak" o={sm(t, W11(7) - 0.05, W11(7) + 0.3)} />
      <Hero x={540} foot={1680} s={0.95} t={t} pose={{ turn: 0.1, itemR: hold > 0.5 ? "phone" : undefined, r: { a: mix(12, 40, hold), e: mix(6, 120, hold) } }} expr={hold > 0.5 ? "grin" : "smile"} />
      {fly > 0 && fly < 1 ? (
        <g transform={`translate(${mix(690, 1200, fly)},${mix(1150, 300, fly) - Math.sin(fly * Math.PI) * 120}) rotate(${-30 + fly * 10}) scale(${mix(0.6, 1.6, fly)})`}>
          <path d="M-60,10 L70,-30 L-20,40 Z" fill={PAPER} {...st} />
          <path d="M-20,40 L-10,12 L70,-30" fill="#e8dcc4" {...st} />
        </g>
      ) : null}
    </g>
  );
};

const phoneO = (t: number, W11: (k: number) => number) => sm(t, W11(3) - 0.2, W11(3) + 0.2);

// ------------------------------------------------------------ kompozisyon

export const TupMideSarkma: React.FC<EkmekBirakProps & { music?: boolean }> = ({ audioName, data, music = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const base: TL = data ? voiceTimeline(data, TS_LINES) : TS_TL;
  const T = data ? data.durationInSeconds + TS_TAIL : TS_TL.total;
  const tl: TL = { ...base, total: T };
  const L = tl.at;
  const Wt = (line: number, k: number) => wordTime(tl, line, k, TS_LINES);

  const scene = (tt: number, i: number): React.ReactNode => {
    const u = tt - L(i);
    const s: S = { t: tt, u, W: (k) => Wt(i, k), d: L(i + 1) - L(i) };
    switch (i) {
      case 0:
        return <Weigh {...s} />;
      case 1:
        return <Waving {...s} />;
      case 2:
        return <Dinner {...s} />;
      case 3:
        return <Surgery {...s} />;
      case 4:
        return <NoNeed {...s} />;
      case 5:
        return <Crowd {...s} />;
      case 6:
        return <Blocks {...s} />;
      case 7:
        return <SkinLoose {...s} />;
      case 8:
        return <Experiment {...s} />;
      case 9:
        return <DoctorGym {...s} />;
      case 10:
        return <MuscleFill {...s} />;
      default:
        return <Coach {...s} line={i === 12 ? 12 : 11} W11={(k) => Wt(11, k)} W12={(k) => Wt(12, k)} />;
    }
  };

  const i = Math.max(0, tl.idx(t));
  // 11-12 tek sahne; 4 ve 9 kendi içinde ikiye bölünür
  const segA = i === 12 ? L(11) : i === 4 && t >= Wt(4, 6) - 0.12 ? Wt(4, 6) - 0.12 : i === 9 && t >= Wt(9, 3) - 0.12 ? Wt(9, 3) - 0.12 : L(i);
  const segB = i === 11 ? L(13) : i === 4 && t < Wt(4, 6) - 0.12 ? Wt(4, 6) - 0.12 : i === 9 && t < Wt(9, 3) - 0.12 ? Wt(9, 3) - 0.12 : L(i + 1);
  const push = 1 + 0.05 * sm(t, segA, Math.max(segA + 0.5, segB));
  // döngü: son 0.35 sn'de ilk kareye geçilir (son kare = ilk kare)
  const loopIn = sm(t, T - 0.4, T - 0.03);
  const t0 = t - T;
  const phone = i >= 11 ? phoneO(t, (k) => Wt(11, k)) * (1 - loopIn) : 0;

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.2, lead: 0.05 },
    { at: Wt(0, 3) - 0.1, id: 2568, v: 0.16 },
    { at: Wt(2, 5) - 0.15, id: 2568, v: 0.14 },
    { at: L(3) + 0.1, id: 1120, v: 0.14, lead: 0.1 },
    { at: Wt(4, 8) - 0.1, id: 2182, v: 0.2 },
    { at: L(5) + 0.1, id: 1120, v: 0.14, lead: 0.1 },
    { at: L(8) + 0.1, id: 1120, v: 0.14, lead: 0.1 },
    { at: Wt(11, 3) - 0.2, id: 2568, v: 0.16 },
    { at: Wt(12, 5) - 0.2, id: 1143, v: 0.16, lead: 0.14, dur: 1.6, fade: 0.8 },
  ];

  return (
    <AbsoluteFill lang="tr" style={{ background: "#ece0c6", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <SketchDefs />
        <g filter="url(#pencil)">
          <g transform={`translate(540,960) scale(${push}) translate(-540,-960)`}>{scene(t, i)}</g>
          {loopIn > 0 ? <g opacity={loopIn}>{scene(t0, 0)}</g> : null}
        </g>
      </svg>
      {phone > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540 + (330 - 150 - 540) * push,
            top: 960 + (640 - 320 - 960) * push,
            width: 300 * push,
            height: 640 * push,
            borderRadius: 44 * push,
            border: `${12 * push}px solid #24242a`,
            boxShadow: "0 0 0 4px #3b2b22, 10px 14px 0 rgba(90,58,38,0.18)",
            overflow: "hidden",
            opacity: phone,
            transform: `translateY(${(1 - phone) * 20}px)`,
            background: "#111",
          }}
        >
          <Img src={staticFile("voom/koc.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : null}
      <Captions t={t} tl={tl} lines={TS_LINES} end={T - TS_TAIL + 0.5} />
      {data ? <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} /> : null}
      {music ? (
        <Audio
          src={staticFile("audio/tup-sarkma-orijinal.mp3")}
          volume={(f) => {
            const mt = f / fps;
            // örnek videonun kendi müziği; konuşma varken altta kalır
            const b = data ? 0.13 : 0.6;
            return b * interpolate(mt, [0, 0.3, T - 0.9, T - 0.1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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

