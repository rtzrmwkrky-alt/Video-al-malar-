/**
 * "Tabağını değiştir" (~34 sn) — kullanıcının metni (çok az düzeltme: "attın", "salonda döktüğün o ter").
 * Her cümleye tek görüntü: ayna (tek kas çizgisi yok) → 365 GÜN takvim çöpe → program değişir, ağırlık artar → mutfakta
 * cips/kola/poğaça, FELAKET mührü → kasın içi aç, solgun → kasın içinde tuğla tuğla örülen saray (tuğla = protein), tuğla gelmeyince
 * yarım kalır → salondaki ter damlaları boş tabakta kaybolur → dambıla ✕, tabak dolar, saray tamamlanır → "ANTRENMAN mı, TABAK mı?
 * Yorumlara yaz." → döngü (son kare = ilk kare). Metin `icerik/tabagini-degistir.seslendirme.txt`.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import { Cross, Dumbbell } from "./GeceYemek";
import { DB, HeroAt, Plates, Rack, Sweat } from "./BeslenmeSpor";
import { EmptyPlate, Mirror, Pogaca } from "./BeslenmeSpor3";
import { Lunch } from "./BeslenmeSpor4";
import { Chip, FLEX, curl } from "./BeslenmeSpor5";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const GREEN = "#2fbf62";
const FLOOR = 1400;

export const TD_LINES: Line[] = [
  { text: "Her gün salona gidip istikrarla çalışmana rağmen aynada hiçbir değişiklik göremiyorsun, değil mi?", hl: ["hiçbir", "değişiklik"], hold: 0.15 },
  { text: "1 yılını tamamen çöpe attın.", hl: ["1", "yılını", "çöpe"], hold: 0.2 },
  { text: "Suçu hep antrenman programında aradın, daha ağır kaldırdın.", hl: ["programında", "ağır"], hold: 0.1 },
  { text: "Ama kendine söylediğin dev bir yalan var: beslenmen tam bir felaket.", hl: ["yalan", "felaket."], hold: 0.2 },
  { text: "Kasların salonda değil, mutfakta açlıktan ölüyor.", hl: ["mutfakta", "açlıktan"], hold: 0.1 },
  { text: "Yeterli protein almadan, vücuduna tuğla vermeden saray inşa etmeye çalışıyorsun.", hl: ["protein", "tuğla", "saray"], hold: 0.15 },
  { text: "Salonda döktüğün o ter, mutfakta yok olup gidiyor.", hl: ["ter,", "yok"], hold: 0.1 },
  { text: "Artık bahaneleri bırakma zamanı. Ağırlıkları değil, tabağını değiştirmelisin.", hl: ["tabağını", "değiştirmelisin."], hold: 0.2 },
  { text: "Eğer sen de 1 yılını kaybetmek istemiyorsan dürüst ol: sorun antrenmanında mı, tabağında mı? Yorumlara yaz.", hl: ["antrenmanında", "tabağında", "Yorumlara"], hold: 0.6 },
];

export const TD_TAIL = 0.6;
export const TD_TL = timeline(TD_LINES, TD_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of TD_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + TD_TAIL;
  return {
    starts,
    total,
    frames: Math.ceil(total * 30),
    at: (i: number) => (i >= starts.length ? total : starts[i]),
    idx: (t: number) => {
      let i = -1;
      while (i + 1 < starts.length && t >= starts[i + 1]) i++;
      return i;
    },
    wordAt: (line: number, k: number) => ws(offs[line] + k),
  };
};

const wordTime = (tl: TL, line: number, k: number) => {
  if (tl.wordAt) return tl.wordAt(line, k);
  const n = words(TD_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (TD_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const out = 1 - sm(t, tl.total - 0.45, tl.total - 0.15);
  if (out <= 0) return null;
  const line = TD_LINES[i];
  const ws = words(line);
  const chunks: number[] = [];
  for (let k = 0; k < ws.length; ) {
    chunks.push(k);
    k += ws.length - k === 4 ? 2 : Math.min(3, ws.length - k);
  }
  let c = 0;
  while (c + 1 < chunks.length && t >= wordTime(tl, i, chunks[c + 1]) - 0.04) c++;
  const from = chunks[c];
  const to = c + 1 < chunks.length ? chunks[c + 1] : ws.length;
  const hl = (line.hl ?? []).map(norm);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1580, textAlign: "center", opacity: out }}>
      {ws.slice(from, to).map((w, k) => {
        const wt = tl.wordAt ? wordTime(tl, i, from + k) - 0.06 : wordTime(tl, i, from) + k * 0.05;
        const p = sm(t, wt, wt + 0.16);
        return (
          <span
            key={`${c}-${k}`}
            style={{
              display: "inline-block",
              margin: "0 12px",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 86,
              letterSpacing: -1.5,
              color: hl.includes(norm(w)) ? Y : "#ffffff",
              WebkitTextStroke: `14px ${INK}`,
              paintOrder: "stroke",
              textShadow: "0 8px 0 rgba(27,20,32,0.3)",
              transform: `translateY(${(1 - p) * 12}px)`,
              opacity: p,
            }}
          >
            {w.replace(/[“”…]/g, "")}
          </span>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------ sahne parçaları

const Ground: React.FC = () => (
  <g>
    <rect x={0} y={FLOOR} width={1080} height={520} fill="#2a2a3a" opacity={0.2} />
    <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} opacity={0.5} />
  </g>
);

const BigText: React.FC<{ a: string; b: string; o: number; y?: number; size?: number }> = ({ a, b, o, y = 290, size = 104 }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <text x={540} y={y} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size * 0.82} fill="#ffffff" stroke={INK} strokeWidth={16} paintOrder="stroke">
        {a}
      </text>
      <text x={540} y={y + size * 1.1} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} fill={Y} stroke={INK} strokeWidth={18} paintOrder="stroke">
        {b}
      </text>
    </g>
  );

/** aynaya yapıştırılmış HEDEF fotoğrafı: kocaman pazılı kol */
const GoalPhoto: React.FC<{ x: number; y: number; rot?: number; glow?: number }> = ({ x, y, rot = 6, glow = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    {glow > 0 ? <rect x={-140} y={-170} width={280} height={340} rx={24} fill={Y} opacity={0.35 * glow} /> : null}
    <rect x={-120} y={-150} width={240} height={300} rx={14} fill="#ffffff" stroke={INK} strokeWidth={6} />
    <rect x={-104} y={-134} width={208} height={210} rx={8} fill="#cfe7ff" />
    {/* güçlü kol: üst kol + kocaman pazı + ön kol + yumruk */}
    <path d="M-90,40 L10,40" stroke="#d9a07e" strokeWidth={56} strokeLinecap="round" />
    <ellipse cx={-30} cy={14} rx={58} ry={44} fill="#e8b48f" />
    <ellipse cx={-44} cy={0} rx={22} ry={12} fill="#f8d6bd" />
    <path d="M10,40 L44,-60" stroke="#d9a07e" strokeWidth={46} strokeLinecap="round" />
    <circle cx={48} cy={-80} r={30} fill="#e8b48f" />
    <text x={0} y={122} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46} fill={GREEN}>
      HEDEF
    </text>
    <rect x={-40} y={-166} width={80} height={28} rx={4} fill="#f6e7a6" opacity={0.85} transform="rotate(-4)" />
  </g>
);

/** çöp kutusu */
const Bin: React.FC<{ x: number; y: number; lid: number }> = ({ x, y, lid }) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-150,-260 L150,-260 L120,0 L-120,0 Z" fill="#7d8597" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    {[-70, 0, 70].map((dx) => (
      <line key={dx} x1={dx} y1={-220} x2={dx * 0.85} y2={-30} stroke={INK} strokeWidth={6} opacity={0.4} />
    ))}
    <g transform={`translate(-170,-268) rotate(${-35 * lid})`}>
      <rect x={0} y={-26} width={340} height={30} rx={10} fill="#9aa2b3" stroke={INK} strokeWidth={8} />
      <rect x={140} y={-50} width={60} height={26} rx={8} fill="#9aa2b3" stroke={INK} strokeWidth={6} />
    </g>
  </g>
);

/** takvim kartı (1 YIL) */
const YearCard: React.FC<{ x: number; y: number; rot: number; s: number }> = ({ x, y, rot, s }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-170} y={-200} width={340} height={400} rx={26} fill="#ffffff" stroke={INK} strokeWidth={8} />
    <path d="M-170,-174 Q-170,-200 -144,-200 L144,-200 Q170,-200 170,-174 L170,-110 L-170,-110 Z" fill={RED} stroke={INK} strokeWidth={8} />
    <text x={0} y={-140} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill="#ffffff">
      1 YIL
    </text>
    <text x={0} y={30} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={120} fill={INK}>
      365
    </text>
    <text x={0} y={110} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={48} fill={INK} opacity={0.6}>
      GÜN
    </text>
  </g>
);

/** cips paketi */
const Chips: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-60,-150 L60,-150 L70,0 L-70,0 Z" fill="#ffb02e" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-60,-150 L-50,-170 L50,-170 L60,-150" fill="#ff8a1f" stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={-80} r={34} fill="#ff5a4e" stroke={INK} strokeWidth={5} />
    <text x={0} y={-68} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={28} fill="#ffffff">
      CİPS
    </text>
  </g>
);

/** kola kutusu */
const Soda: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-40} y={-130} width={80} height={130} rx={12} fill="#e03a3a" stroke={INK} strokeWidth={7} />
    <rect x={-34} y={-140} width={68} height={16} rx={6} fill="#c9ced8" stroke={INK} strokeWidth={5} />
    <path d="M-40,-80 Q0,-60 40,-80" fill="none" stroke="#ffffff" strokeWidth={8} />
  </g>
);

// ---------- kolun içi (anatomik): kemik, pazı kası lif demetleri, mikro yırtıklar, kan damarı, protein (amino asit zinciri)

const SH = [70, 1112] as const; // omuz başı
const EL = [812, 1112] as const; // dirsek
const WR = [742, 590] as const; // bilek
const BX0 = 250; // pazı karnı başlangıcı
const BX1 = 720; // pazı karnı sonu
const BCY = 1062; // pazı taban ekseni
const HMIN = 70;
const HMAX = 250;
const NF = 6; // lif demeti sayısı
/** mikro yırtıklar: (demet, konum 0-1); sıra = onarılma sırası */
const TEARS: [number, number][] = [
  [2, 0.5],
  [4, 0.36],
  [1, 0.66],
  [3, 0.24],
  [0, 0.44],
  [5, 0.58],
  [3, 0.72],
  [1, 0.3],
];
/** protein molekülünün damardan çıktığı nokta (pazının üstü) */
const VEND: [number, number] = [470, 0];

const bulge = (u: number) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.85);
const bTop = (u: number, H: number) => BCY - H * bulge(u);
const bBot = (u: number) => BCY + 24 * bulge(u);
const bx = (u: number) => BX0 + (BX1 - BX0) * u;
/** demet j içindeki v (0 alt, 1 üst) yüksekliğinde nokta */
const fy = (u: number, v: number, H: number) => bBot(u) + (bTop(u, H) - bBot(u)) * v;
const US = Array.from({ length: 25 }, (_, k) => k / 24);

const bellyPath = (H: number) =>
  `M${bx(0)},${BCY} ` + US.map((u) => `L${bx(u)},${bTop(u, H)}`).join(" ") + " " + [...US].reverse().map((u) => `L${bx(u)},${bBot(u)}`).join(" ") + " Z";

const strandPath = (j: number, H: number) => {
  const a = (j + 0.06) / NF;
  const b = (j + 0.94) / NF;
  return "M" + US.map((u) => `${bx(u)},${fy(u, b, H)}`).join(" L") + " L" + [...US].reverse().map((u) => `${bx(u)},${fy(u, a, H)}`).join(" L") + " Z";
};

const strandMid = (j: number, H: number) => "M" + US.map((u) => `${bx(u)},${fy(u, (j + 0.5) / NF, H)}`).join(" L");

/** protein: renkli amino asit boncuklarından kısa zincir */
const Amino: React.FC<{ x: number; y: number; o?: number; rot?: number; s?: number }> = ({ x, y, o = 1, rot = 0, s = 1 }) =>
  o <= 0.01 ? null : (
    <g opacity={o} transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <path d="M-20,4 L0,-6 L20,4" fill="none" stroke="#ffffff" strokeWidth={4} opacity={0.8} />
      {[
        [-20, 4, "#ffd23f"],
        [0, -6, "#45c4d9"],
        [20, 4, "#a98bff"],
      ].map(([cx, cy, c]) => (
        <g key={String(cx)}>
          <circle cx={cx as number} cy={cy as number} r={10} fill={c as string} stroke={INK} strokeWidth={3} />
          <circle cx={(cx as number) - 3} cy={(cy as number) - 3} r={3} fill="#ffffff" opacity={0.7} />
        </g>
      ))}
    </g>
  );

const tearPos = (i: number, H: number): [number, number] => {
  const [j, u] = TEARS[i];
  return [bx(u), fy(u, (j + 0.5) / NF, H)];
};

const Label: React.FC<{ x: number; y: number; tx: number; ty: number; text: string; o: number }> = ({ x, y, tx, ty, text, o }) =>
  o <= 0.01 ? null : (
    <g opacity={o}>
      <line x1={tx} y1={ty} x2={x} y2={y} stroke="#ffffff" strokeWidth={3} opacity={0.85} />
      <circle cx={x} cy={y} r={6} fill="#ffffff" />
      <text x={tx} y={ty - 12} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill="#ffffff" stroke="#0e1630" strokeWidth={6} paintOrder="stroke" letterSpacing={1}>
        {text}
      </text>
    </g>
  );

/**
 * size: pazının hacmi (0 küçük – 1 hedef), pale: açlıktan solma, repaired: onarılan yırtık oranı,
 * inflow: damardan gelen protein akışı (0-1), outflow: kastan çıkıp giden protein (yıkım), labels: anatomi etiketleri
 */
const MuscleView: React.FC<{ t: number; uid: string; size: number; pale: number; repaired: number; inflow: number; outflow: number; target: number; labels?: number }> = ({
  t,
  uid,
  size,
  pale,
  repaired,
  inflow,
  outflow,
  target,
  labels = 0,
}) => {
  const H = HMIN + (HMAX - HMIN) * size;
  const top = bTop(0.5, H);
  const vend: [number, number] = [VEND[0], top + 6];
  const red = interpolateColors(pale, [0, 1], ["#d8443d", "#b98b88"]);
  const redHi = interpolateColors(pale, [0, 1], ["#f07a66", "#d4b1ac"]);
  const redLo = interpolateColors(pale, [0, 1], ["#8f1f22", "#7e5d5c"]);
  const nRep = repaired * TEARS.length;
  // damar: tabaktan (sol üst) pazının üstüne
  const vessel = `M345,729 C345,860 ${vend[0] - 160},${vend[1] - 170} ${vend[0]},${vend[1]}`;
  const vp = (u: number): [number, number] => {
    const p0 = [345, 729];
    const p1 = [345, 860];
    const p2 = [vend[0] - 160, vend[1] - 170];
    const p3 = vend;
    const m = 1 - u;
    return [
      m ** 3 * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u ** 3 * p3[0],
      m ** 3 * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u ** 3 * p3[1],
    ];
  };
  // kol silueti (yarı saydam deri): üst kol kası ve kemiği sarar
  const armW = SH[1] + 50 - (BCY - H) + 40;
  const armY = (SH[1] + 50 + BCY - H) / 2;
  const skin = `M-60,${armY} L${EL[0]},${armY + 10} L${WR[0] + 10},${WR[1] - 40}`;
  return (
    <g transform="translate(440,1120) scale(1.55) translate(-480,-1000)">
      <defs>
        <linearGradient id={`${uid}-bone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf4e4" />
          <stop offset="1" stopColor="#d8ccb0" />
        </linearGradient>
        <linearGradient id={`${uid}-belly`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={redHi} />
          <stop offset="0.55" stopColor={red} />
          <stop offset="1" stopColor={redLo} />
        </linearGradient>
        <clipPath id={`${uid}-bc`}>
          <path d={bellyPath(H)} />
        </clipPath>
      </defs>
      {/* deri: yarı saydam röntgen gibi */}
      <path d={skin} fill="none" stroke="#f6d3c0" strokeOpacity={0.07} strokeWidth={armW} strokeLinecap="round" strokeLinejoin="round" />
      {/* kemikler: pazı kemiği (humerus), ön kol kemikleri */}
      <g stroke="#8a7d62" strokeWidth={4}>
        <line x1={SH[0] + 30} y1={SH[1]} x2={EL[0] - 20} y2={EL[1]} stroke="#efe6d2" strokeWidth={48} strokeLinecap="round" />
        <line x1={SH[0] + 40} y1={SH[1] - 10} x2={EL[0] - 30} y2={EL[1] - 10} stroke="#fffaf0" strokeWidth={10} strokeLinecap="round" opacity={0.8} />
        <path d={`M${SH[0] + 30},${SH[1] - 24} L${EL[0] - 20},${EL[1] - 24} M${SH[0] + 30},${SH[1] + 24} L${EL[0] - 20},${EL[1] + 24}`} fill="none" />
        <ellipse cx={SH[0] + 24} cy={SH[1] - 4} rx={52} ry={50} fill={`url(#${uid}-bone)`} />
        <ellipse cx={EL[0]} cy={EL[1]} rx={46} ry={40} fill={`url(#${uid}-bone)`} />
        <line x1={EL[0] + 4} y1={EL[1] - 20} x2={WR[0] - 22} y2={WR[1] + 10} stroke="#8a7d62" strokeWidth={38} strokeLinecap="round" />
        <line x1={EL[0] + 4} y1={EL[1] - 20} x2={WR[0] - 22} y2={WR[1] + 10} stroke={`url(#${uid}-bone)`} strokeWidth={30} strokeLinecap="round" />
        <line x1={EL[0] + 40} y1={EL[1] - 10} x2={WR[0] + 24} y2={WR[1] + 4} stroke="#8a7d62" strokeWidth={34} strokeLinecap="round" />
        <line x1={EL[0] + 40} y1={EL[1] - 10} x2={WR[0] + 24} y2={WR[1] + 4} stroke={`url(#${uid}-bone)`} strokeWidth={26} strokeLinecap="round" />
      </g>
      {/* kan damarı (arka) */}
      <path d={vessel} fill="none" stroke="#5c1230" strokeWidth={40} strokeLinecap="round" />
      <path d={vessel} fill="none" stroke="#a3243f" strokeWidth={30} strokeLinecap="round" />
      <path d={vessel} fill="none" stroke="#e0566c" strokeWidth={8} strokeLinecap="round" opacity={0.5} transform="translate(-6,-4)" />
      {/* hedef pazı: kesikli siluet */}
      {target > 0.01 ? <path d={bellyPath(HMAX)} fill="#ffffff" fillOpacity={0.06 * target} stroke="#ffffff" strokeOpacity={0.7 * target} strokeWidth={4} strokeDasharray="14 12" /> : null}
      {/* tendonlar */}
      <path d={`M${SH[0] + 60},${SH[1] - 52} Q170,${BCY - 6} ${BX0 + 20},${BCY}`} fill="none" stroke="#e9e3d6" strokeWidth={22} strokeLinecap="round" />
      <path d={`M${BX1 - 20},${BCY} Q790,${BCY - 4} ${EL[0] + 18},${EL[1] - 70}`} fill="none" stroke="#e9e3d6" strokeWidth={24} strokeLinecap="round" />
      <path d={`M${BX1 - 10},${BCY - 4} Q785,${BCY - 10} ${EL[0] + 12},${EL[1] - 76}`} fill="none" stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      {/* pazı kası: kas zarı + lif demetleri */}
      <path d={bellyPath(H)} fill={`url(#${uid}-belly)`} />
      <g clipPath={`url(#${uid}-bc)`}>
        {Array.from({ length: NF }).map((_, j) => (
          <g key={j}>
            <path d={strandPath(j, H)} fill={j % 2 ? red : redHi} fillOpacity={0.55} stroke={redLo} strokeWidth={3} />
            {/* çizgili kas: enine bantlar */}
            <path d={strandMid(j, H)} fill="none" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={(H / NF) * 0.7} strokeDasharray="3 9" />
            <path d={strandMid(j, H)} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={2} />
          </g>
        ))}
        {/* parlaklık */}
        <path d={bellyPath(H)} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={10} transform="translate(0,10)" />
      </g>
      <path d={bellyPath(H)} fill="none" stroke={INK} strokeWidth={6} opacity={0.8} />
      {/* mikro yırtıklar: onarılınca kapanır, kısa bir parıltı */}
      {TEARS.map((_, i) => {
        const r = Math.min(1, Math.max(0, nRep - i));
        const [x, y] = tearPos(i, H);
        const h = (H / NF) * 0.75 * bulge(TEARS[i][1]);
        const open = 1 - r;
        const flash = r > 0 && r < 1 ? Math.sin(r * Math.PI) : 0;
        return (
          <g key={i}>
            {open > 0.02 ? (
              <path
                d={`M${x - 3},${y - h / 2} L${x + 6},${y - h / 4} L${x - 5},${y} L${x + 6},${y + h / 4} L${x - 3},${y + h / 2} L${x + 13},${y + h / 2} L${x + 24},${y + h / 4} L${x + 11},${y} L${x + 24},${y - h / 4} L${x + 13},${y - h / 2} Z`}
                fill="#2a070b"
                opacity={0.85 * open}
                transform={`translate(${x},${y}) scale(${0.4 + 0.6 * open}) translate(${-x},${-y})`}
              />
            ) : null}
            {flash > 0 ? <circle cx={x + 6} cy={y} r={14 + 22 * r} fill="none" stroke="#ffe27a" strokeWidth={6} opacity={flash} /> : null}
          </g>
        );
      })}
      {/* protein akışı: damar boyunca, sonra sıradaki yırtığa */}
      {inflow > 0.01
        ? [0, 1, 2, 3, 4, 5].map((k) => {
            const u = (((t * 0.55 + k / 6) % 1) + 1) % 1;
            const tgt = tearPos(Math.min(TEARS.length - 1, Math.floor(nRep) + (k % 3)), H);
            let p: [number, number];
            if (u < 0.7) p = vp(u / 0.7);
            else {
              const w = (u - 0.7) / 0.3;
              p = [vend[0] + (tgt[0] - vend[0]) * w, vend[1] + (tgt[1] - vend[1]) * w];
            }
            const o = inflow * Math.min(1, u * 8) * (u > 0.9 ? (1 - u) * 10 : 1);
            return <Amino key={k} x={p[0]} y={p[1]} o={o} rot={t * 90 + k * 60} s={0.9} />;
          })
        : null}
      {/* yıkım: açken kasın proteini sökülüp damara geri gider */}
      {outflow > 0.01
        ? [0, 1, 2, 3].map((k) => {
            const u = (((t * 0.45 + k / 4) % 1) + 1) % 1;
            const [sx, sy] = tearPos(k * 2, H);
            const w = Math.min(1, u / 0.3);
            const q = u < 0.3 ? [sx + (vend[0] - sx) * w, sy + (vend[1] - sy) * w] : vp(1 - (u - 0.3) / 0.7);
            const o = outflow * Math.min(1, u * 6) * (u > 0.85 ? (1 - u) * 6.6 : 1);
            return <Amino key={k} x={q[0]} y={q[1]} o={o * 0.8} rot={-t * 80 + k * 50} s={0.8} />;
          })
        : null}
      <Label x={bx(0.38)} y={fy(0.38, 0.75, H)} tx={640} ty={830} text="KAS LİFLERİ" o={labels * 1} />
      <Label x={tearPos(0, H)[0] + 6} y={tearPos(0, H)[1]} tx={600} ty={1175} text="MİKRO YIRTIK" o={labels} />
      <Label x={420} y={SH[1] + 20} tx={300} ty={1175} text="KEMİK" o={labels} />
    </g>
  );
};

// ------------------------------------------------------------ ana kompozisyon

export type TabaginiDegistirProps = { audioName: string; data: VoiceoverData | null };

export const TabaginiDegistir: React.FC<TabaginiDegistirProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : TD_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, 0.18);
  const loopIn = sm(t, T - 0.24, T - 0.03);
  const end = t > L(8);
  // her satırda yavaş yaklaşma (hiçbir kare durmasın)
  const li = Math.max(0, tl.idx(t));
  const push = end && t > T - 0.3 ? 1 : 1 + 0.06 * Math.min(1, Math.max(0, (t - L(li)) / Math.max(0.5, L(li + 1) - L(li))));
  const rep = 0.5 - 0.5 * Math.cos((end ? t - T : t) * 4.2);

  const s0 = Math.max(scene(0, 1), loopIn);
  const mirrorAt = W(0, 7); // "aynada"
  const hookA = end ? loopIn : 1 - sm(t, mirrorAt - 0.2, mirrorAt);
  const hookB = end ? 0 : sm(t, mirrorAt - 0.05, mirrorAt + 0.15);
  const flexNow = !end && t > mirrorAt - 0.1;
  const s1 = scene(1, 2);
  const s2 = scene(2, 3);
  const s3 = scene(3, 4);
  const s4 = scene(4, 5);
  const s5 = scene(5, 6);
  const s6 = scene(6, 7);
  const s7 = scene(7, 8);
  const s8 = win(t, L(8) - 0.02, T - 0.25, 0.18);

  // kolun içi: 4'te protein yok → kas erir; 5'te poğaçadan az protein → yarım; 7'de tabak değişir → yırtıklar kapanır, kas büyür
  const melt = sm(t, W(4, 3), W(4, 5) + 0.4);
  const grow7 = sm(t, W(7, 6), W(7, 7) + 0.45);

  const GYM: [string, string] = ["#5b6b8f", "#3f4b6c"];
  const INSIDE: [string, string] = ["#1b2a4e", "#0e1630"];
  const KITCHEN: [string, string] = ["#e8d9c4", "#cdb89c"];
  const bgAt: [number, string, string][] = [
    [0, ...GYM],
    [L(1), "#3a3550", "#211d33"],
    [L(2), ...GYM],
    [L(3), ...KITCHEN],
    [L(4), ...INSIDE],
    [L(6), ...GYM],
    [L(7), ...INSIDE],
    [L(8), ...GYM],
  ];
  let bgTop = bgAt[0][1];
  let bgBot = bgAt[0][2];
  for (let k = 1; k < bgAt.length; k++) {
    bgTop = interpolateColors(t, [bgAt[k][0] - 0.12, bgAt[k][0] + 0.12], [bgTop, bgAt[k][1]]);
    bgBot = interpolateColors(t, [bgAt[k][0] - 0.12, bgAt[k][0] + 0.12], [bgBot, bgAt[k][2]]);
  }
  bgTop = interpolateColors(loopIn, [0, 1], [bgTop, GYM[0]]);
  bgBot = interpolateColors(loopIn, [0, 1], [bgBot, GYM[1]]);

  // Az ve yerinde: sadece birkaç olay anı, tok/alçak vuruş ve hışırtı yok
  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: W(3, 10) - 0.05, id: 2182, v: 0.2 }, // FELAKET mührü
    { at: W(7, 6), id: 2933, v: 0.2 }, // dolu tabak konur
    { at: W(7, 7) + 0.25, id: 1120, v: 0.24 }, // kas büyüdü
    { at: W(8, 14), id: 2568, v: 0.16 }, // yorumlara yaz
  ];
  const duck = (mt: number) => 1 - 0.35 * win(mt, L(3), L(4) + 0.3, 0.3);

  const mirrorFlex = { l: { el: [60, 440] as [number, number], wr: [82, 318] as [number, number], hand: "fist" as const }, head: -4, lx: -6, ly: -2 };

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="td-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <linearGradient id="td-kit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff4e2" stopOpacity={0.5} />
            <stop offset="1" stopColor="#b49a7a" stopOpacity={0.5} />
          </linearGradient>
          <radialGradient id="td-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#td-bg)" />
        <g transform={`translate(540,900) scale(${push}) translate(-540,-900)`}>

        {/* ===== 0: ayna — tek kas çizgisi yok ===== */}
        {s0 > 0 ? (
          <g opacity={s0}>
            <Ground />
            <Mirror x={600} y={560} w={400} h={820} uid="td-m">
              <HeroAt uid="td-mr" x={760} y={1430} s={0.9} t={t} pose={flexNow ? { l: { el: [60, 440], wr: [82, 318], hand: "fist" }, head: -4, lx: -6, ly: -2 } : { l: { el: [102, 530], wr: [94 + 20 * rep, 690 - 270 * rep] }, head: 2 }} expr={flexNow ? "ouch" : rep > 0.5 ? "ouch" : "neutral"} />
              <rect x={600} y={560} width={400} height={820} fill="#bcd3e8" opacity={0.25} />
            </Mirror>
            <g transform="translate(930,650) scale(0.75) translate(-930,-650)"><GoalPhoto x={930} y={650} glow={flexNow ? sm(t, mirrorAt, mirrorAt + 0.4) * (0.6 + 0.4 * Math.sin(t * 5)) : 0} /></g>
            <HeroAt uid="td-h0" x={300} s={1} t={t} pose={flexNow ? FLEX : curl(rep)} item={flexNow ? undefined : DB} expr={flexNow ? "ouch" : rep > 0.5 ? "ouch" : "neutral"} />
            {!flexNow ? <Sweat t={t} pts={[[230, 700], [370, 690]]} /> : null}
            <BigText a="12 AY ANTRENMAN" b="SONUÇ: SIFIR" o={hookA} y={260} size={100} />
            <BigText a="HEDEF BU…" b="AYNADAKİ BU" o={hookB} y={260} size={100} />
            <Chip x={300} y={560} text="HİÇ DEĞİŞMEDİ" o={hookB * sm(t, W(0, 10) - 0.1, W(0, 10) + 0.2)} bg={RED} size={46} />
          </g>
        ) : null}

        {/* ===== 1: 1 yıl çöpe ===== */}
        {s1 > 0 ? (
          <g opacity={s1}>
            {(() => {
              const drop = sm(t, W(1, 2), W(1, 4) + 0.2);
              return (
                <g>
                  <Bin x={540} y={1380} lid={sm(t, L(1), W(1, 2)) * (1 - sm(t, W(1, 4) + 0.1, W(1, 4) + 0.4))} />
                  <g opacity={1 - sm(t, W(1, 4), W(1, 4) + 0.2)}>
                    <YearCard x={540} y={620 + 600 * drop * drop} rot={-8 + 40 * drop} s={1 - 0.45 * drop} />
                  </g>
                  <BigText a="1 YIL" b="ÇÖPE GİTTİ" o={sm(t, W(1, 4) - 0.1, W(1, 4) + 0.2)} y={330} />
                </g>
              );
            })()}
          </g>
        ) : null}

        {/* ===== 2: program değişir, ağırlık artar ===== */}
        {s2 > 0 ? (
          <g opacity={s2}>
            <Ground />
            <Rack x={600} y={700} />
            <Plates x={160} />
            <HeroAt uid="td-h2" x={420} s={1} t={t} pose={curl(rep)} item={DB} expr={rep > 0.5 ? "ouch" : "neutral"} />
            <Sweat t={t} pts={[[350, 700], [490, 690]]} />
            {["PROGRAM A", "PROGRAM B", "PROGRAM C"].map((p, k) => {
              const at = L(2) + 0.15 + k * 0.45;
              return (
                <g key={p} opacity={sm(t, at, at + 0.2)}>
                  <Chip x={250} y={300 + k * 110} text={p} o={1} bg="#ffffff" fg={INK} size={44} />
                  <line x1={110} y1={300 + k * 110} x2={390} y2={300 + k * 110} stroke={RED} strokeWidth={8} strokeLinecap="round" opacity={sm(t, at + 0.25, at + 0.4)} />
                </g>
              );
            })}
            {(() => {
              const kg = 20 + 10 * Math.min(3, Math.floor(interpolate(t, [W(2, 5), W(2, 7) + 0.3], [0, 3.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
              return <Chip x={810} y={420} text={`${kg} KG`} o={sm(t, W(2, 5) - 0.1, W(2, 5) + 0.2)} bg={Y} fg={INK} size={70} />;
            })()}
          </g>
        ) : null}

        {/* ===== 3: mutfak — beslenme felaket ===== */}
        {s3 > 0 ? (
          <g opacity={s3}>
            <rect x={70} y={1060} width={940} height={40} rx={14} fill="#c98b5a" stroke={INK} strokeWidth={7} />
            <rect x={120} y={1100} width={30} height={300} fill="#a86e44" stroke={INK} strokeWidth={6} />
            <rect x={930} y={1100} width={30} height={300} fill="#a86e44" stroke={INK} strokeWidth={6} />
            <g opacity={sm(t, L(3), L(3) + 0.3)}>
              <Chips x={470} y={1060} />
              <Soda x={650} y={1060} />
              <g transform="translate(850,1040) scale(1.3) translate(-850,-1040)">
                <EmptyPlate x={850} y={1040} />
              </g>
            </g>
            <HeroAt uid="td-h3" x={210} y={1400} s={0.95} t={t} pose={{ r: { el: [300, 560], wr: [262, 420 + 12 * Math.sin(t * 6)] }, head: 3 }} item={<g transform="translate(0,-30) scale(0.55)"><Pogaca x={0} y={0} /></g>} expr="chew" />
            <BigText a="DEV BİR" b="YALAN" o={sm(t, W(3, 3) - 0.1, W(3, 3) + 0.2) * (1 - sm(t, W(3, 7) - 0.2, W(3, 7)))} y={330} />
            {(() => {
              const p = sm(t, W(3, 10) - 0.08, W(3, 10) + 0.25);
              return p > 0 ? (
                <g opacity={p} transform={`translate(540,640) rotate(-8) scale(${1.15 - 0.15 * p})`}>
                  <rect x={-330} y={-100} width={660} height={200} rx={28} fill="#ffffff" fillOpacity={0.55} stroke={RED} strokeWidth={16} />
                  <text x={0} y={38} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={120} fill={RED} letterSpacing={6}>
                    FELAKET
                  </text>
                </g>
              ) : null;
            })()}
          </g>
        ) : null}

        {/* ===== 4: kolun içi — açlıktan eriyor ===== */}
        {s4 > 0 ? (
          <g opacity={s4}>
            <Chip x={540} y={230} text="KOLUNUN İÇİ" o={1} bg="#ffffff" fg={INK} size={56} />
            <MuscleView
              uid="td-mv4"
              t={t}
              size={0.3 - 0.2 * melt}
              pale={0.1 + 0.65 * melt}
              repaired={0}
              inflow={0}
              outflow={sm(t, W(4, 3) - 0.1, W(4, 3) + 0.3)}
              target={0}
              labels={sm(t, L(4) + 0.1, L(4) + 0.4) * (1 - sm(t, W(4, 3), W(4, 4) - 0.1))}
            />
            <circle cx={230} cy={520} r={110} fill="#ffffff" stroke={INK} strokeWidth={7} />
            <g transform="translate(230,520) scale(1.25)">
              <EmptyPlate x={0} y={10} />
            </g>
            <Cross x={230} y={520} s={40} p={sm(t, W(4, 3) - 0.1, W(4, 3) + 0.3)} />
            <Chip x={230} y={670} text="MUTFAK" o={1} bg={RED} size={40} />
            <Chip x={540} y={1460} text="KAS ERİYOR" o={sm(t, W(4, 4) - 0.1, W(4, 4) + 0.2)} bg={RED} size={56} />
          </g>
        ) : null}

        {/* ===== 5 ve 7: protein = kasın tuğlası ===== */}
        {Math.max(s5, s7) > 0 ? (
          <g opacity={Math.max(s5, s7)}>
            {s7 > s5 ? (
              <Chip x={540} y={230} text="TABAK DEĞİŞTİ" o={1} bg={GREEN} size={56} />
            ) : (
              <g>
                <Chip x={590} y={230} text="PROTEİN = KASIN TUĞLASI" o={1} bg={Y} fg={INK} size={46} />
                <Amino x={150} y={232} s={1.6} />
              </g>
            )}
            <MuscleView
              uid="td-mv"
              t={t}
              size={s7 > s5 ? 0.18 + 0.82 * grow7 : 0.1 + 0.08 * sm(t, W(5, 1), W(5, 8))}
              pale={s7 > s5 ? 0.4 * (1 - grow7) : 0.75 - 0.35 * sm(t, W(5, 1), W(5, 8))}
              repaired={s7 > s5 ? 0.25 + 0.75 * grow7 : 0.25 * sm(t, W(5, 1), W(5, 8))}
              inflow={s7 > s5 ? sm(t, W(7, 6) - 0.1, W(7, 6) + 0.2) * (1 - sm(t, W(7, 7) + 0.35, W(7, 7) + 0.6)) : 0.35 * sm(t, L(5), W(5, 1)) * (1 - sm(t, W(5, 6), W(5, 8)))}
              outflow={0}
              target={s7 > s5 ? 1 : sm(t, W(5, 6) - 0.1, W(5, 6) + 0.3)}
            />
            {/* proteinin geldiği tabak */}
            <circle cx={230} cy={520} r={110} fill="#ffffff" stroke={INK} strokeWidth={7} />
            <g transform="translate(230,520) scale(0.95)">{s7 > s5 && t > W(7, 6) - 0.05 ? <Lunch x={0} y={0} /> : s7 > s5 ? <EmptyPlate x={0} y={10} /> : <Pogaca x={0} y={0} />}</g>
            <Chip x={230} y={670} text={s7 > s5 ? (t > W(7, 6) - 0.05 ? "PROTEİN" : "MUTFAK") : "POĞAÇA"} o={1} bg={s7 > s5 && t > W(7, 6) - 0.05 ? GREEN : RED} size={40} />
            <Chip x={540} y={1460} text={s7 > s5 ? "KAS BÜYÜDÜ" : "KAS YARIM KALDI"} o={s7 > s5 ? sm(t, W(7, 7) + 0.2, W(7, 7) + 0.45) : sm(t, W(5, 7) - 0.1, W(5, 7) + 0.2)} bg={s7 > s5 ? GREEN : RED} size={54} />
            {s7 > s5 ? (
              <g opacity={sm(t, L(7), L(7) + 0.3) * (1 - sm(t, W(7, 6) - 0.2, W(7, 6)))}>
                <g transform="translate(600,560)">
                  <circle r={120} fill="#ffffff" fillOpacity={0.92} stroke={INK} strokeWidth={6} />
                  <Dumbbell x={0} y={0} s={1.0} rot={-10} />
                </g>
                <Cross x={600} y={560} s={70} p={sm(t, W(7, 4), W(7, 5))} />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ===== 6: salonda dökülen ter, mutfakta buhar olup gider ===== */}
        {s6 > 0 ? (
          <g opacity={s6}>
            {/* üst: salon */}
            {[0, 1, 2].map((k) => (
              <ellipse key={k} cx={880} cy={986 - k * 24} rx={88 - k * 14} ry={18} fill={k % 2 ? "#3b3f58" : "#2b2f45"} stroke={INK} strokeWidth={6} />
            ))}
            <Dumbbell x={660} y={975} s={0.7} />
            <Dumbbell x={700} y={940} s={0.7} rot={-8} />
            <rect x={0} y={1000} width={1080} height={10} fill={INK} opacity={0.5} />
            <HeroAt uid="td-h6" x={300} y={1000} s={0.85} t={t} pose={curl(rep)} item={DB} expr="ouch" />
            <Sweat t={t} pts={[[252, 377], [385, 368]]} />
            {/* alt: mutfak */}
            <rect x={0} y={1010} width={1080} height={910} fill="#e8d9c4" />
            <rect x={0} y={1010} width={1080} height={910} fill="url(#td-kit)" />
            {Array.from({ length: 6 }).map((_, k) => (
              <line key={k} x1={0} y1={1090 + k * 80} x2={1080} y2={1090 + k * 80} stroke="#cdb89c" strokeWidth={3} opacity={0.6} />
            ))}
            <rect x={0} y={1006} width={1080} height={10} fill={INK} opacity={0.6} />
            <rect x={360} y={1390} width={690} height={36} rx={12} fill="#c98b5a" stroke={INK} strokeWidth={7} />
            <rect x={400} y={1426} width={26} height={140} fill="#a86e44" stroke={INK} strokeWidth={6} />
            <rect x={990} y={1426} width={26} height={140} fill="#a86e44" stroke={INK} strokeWidth={6} />
            <g transform="translate(470,1390) scale(0.75) translate(-470,-1390)">
              <Chips x={470} y={1390} />
            </g>
            <g transform="translate(960,1390) scale(0.8) translate(-960,-1390)">
              <Soda x={960} y={1390} />
            </g>
            <g transform="translate(720,1372) scale(1.4) translate(-720,-1372)">
              <EmptyPlate x={720} y={1372} />
            </g>
            {/* ter damlaları salondan düşer, boş tabağa varınca buhar olur */}
            {[0, 1, 2, 3, 4].map((k) => {
              const u = (((t * 0.55 + k / 5) % 1) + 1) % 1;
              const P = [[400, 380], [620, 200], [790, 760], [720, 1350]];
              const m = 1 - u;
              const x = m ** 3 * P[0][0] + 3 * m * m * u * P[1][0] + 3 * m * u * u * P[2][0] + u ** 3 * P[3][0];
              const y = m ** 3 * P[0][1] + 3 * m * m * u * P[1][1] + 3 * m * u * u * P[2][1] + u ** 3 * P[3][1];
              const o = Math.min(1, u * 6) * (u > 0.9 ? (1 - u) * 10 : 1);
              return <path key={k} d={`M${x},${y - 24} Q${x + 17},${y} ${x},${y + 11} Q${x - 17},${y} ${x},${y - 24} Z`} fill="#9fd8ff" stroke={INK} strokeWidth={3} opacity={o} />;
            })}
            {[0, 1, 2].map((k) => {
              const u = (((t * 0.7 + k / 3) % 1) + 1) % 1;
              const x = 690 + k * 30;
              const y = 1340 - u * 190;
              return (
                <path
                  key={k}
                  d={`M${x},${y} q-18,-25 0,-50 q18,-25 0,-50`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={10}
                  strokeLinecap="round"
                  opacity={Math.sin(u * Math.PI) * 0.75 * sm(t, L(6) + 0.3, L(6) + 0.6)}
                />
              );
            })}
            <Chip x={160} y={250} text="SALON" o={1} bg="#ffffff" fg={INK} size={48} />
            <Chip x={170} y={1090} text="MUTFAK" o={1} bg="#ffffff" fg={INK} size={48} />
            <Chip x={720} y={1110} text="YOK OLDU" o={sm(t, W(6, 5) - 0.1, W(6, 5) + 0.2)} bg={RED} size={50} />
          </g>
        ) : null}

        {/* ===== 8: sorun antrenmanında mı, tabağında mı? ===== */}
        {s8 > 0 ? (
          <g opacity={s8}>
            <Ground />
            <BigText a="DÜRÜST OL:" b="SORUN NEREDE?" o={sm(t, L(8) + 0.05, L(8) + 0.35)} y={290} size={96} />
            {[
              { x: 290, label: "ANTRENMAN", k: 10, icon: <Dumbbell x={0} y={0} s={1.1} rot={-15} /> },
              { x: 790, label: "TABAK", k: 12, icon: <g transform="scale(1.1)"><Lunch x={0} y={0} /></g> },
            ].map(({ x, label, k, icon }) => {
              const on = sm(t, W(8, k) - 0.1, W(8, k) + 0.2);
              return (
                <g key={label} opacity={0.35 + 0.65 * on} transform={`translate(${x},790) scale(${1 + 0.03 * on * Math.sin(t * 4 + x)}) translate(${-x},-790)`}>
                  <rect x={x - 220} y={560} width={440} height={460} rx={40} fill="#ffffff" stroke={INK} strokeWidth={8} />
                  <g transform={`translate(${x},740)`}>{icon}</g>
                  <text x={x} y={960} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={58} fill={INK}>
                    {label}
                  </text>
                </g>
              );
            })}
            <text x={540} y={830} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={70} fill="#ffffff" stroke={INK} strokeWidth={12} paintOrder="stroke">
              mı?
            </text>
            <Chip x={540} y={1090} text="YORUMLARA YAZ" o={sm(t, W(8, 14) - 0.1, W(8, 14) + 0.2)} bg={Y} fg={INK} size={60} />
            {/* düşünen genç: bir karta bir ötekine bakar */}
            <HeroAt uid="td-h8" x={540} y={1560} s={0.44} t={t} pose={{ r: { el: [300, 520], wr: [300, 430] }, head: Math.sin(t * 2.2) * 8, lx: Math.sin(t * 2.2) * 8 }} expr="think" />
          </g>
        ) : null}

        </g>
        <rect width={1080} height={1920} fill="url(#td-vig)" />
      </svg>

      <Captions t={t} tl={tl} />
      {data ? <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} /> : null}
      {FX.map((f, k) => (
        <Sequence key={`fx${k}`} from={Math.max(0, Math.round(f.at * fps))} durationInFrames={f.dur ? Math.round(f.dur * fps) : undefined} layout="none">
          <Audio
            src={staticFile(`sfx/${f.id}.mp3`)}
            startFrom={Math.round((f.lead ?? 0) * fps)}
            volume={(q) => (f.dur && f.fade ? f.v * interpolate(q / fps, [0, 0.001, f.dur - f.fade, f.dur], [1, 1, 1, 0], { extrapolateRight: "clamp" }) : f.v)}
          />
        </Sequence>
      ))}
      <Audio
        src={staticFile("music/623.mp3")}
        volume={(f) => {
          const mt = f / fps;
          const base = interpolate(mt, [0, 0.4], [0.015, 0.03], { extrapolateRight: "clamp" });
          return base * duck(mt) * interpolate(mt, [T - 0.6, T], [1, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        }}
      />
    </AbsoluteFill>
  );
};
