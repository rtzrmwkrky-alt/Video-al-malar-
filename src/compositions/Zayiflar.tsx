/**
 * "Zayıflar bunu saklıyor!" — 3 yanlış inanış (~32 sn), tek anlatıcı (Chris).
 * Hikâye: her şeyi yiyen ama kilo almayan kız ("o") ↔ diyet yapan Bora ("sen").
 * 3 efsane kartı (YANLIŞ damgası) → her birinin cevabı sahnede gösterilir → "yasak değil, alışkanlık" → yorum çağrısı.
 * Kanca ilk karede ekranda (kapak görseli de olur). Son sahnenin fonu ilk sahneyle aynı: video döngüye girince dikiş görünmez.
 * Metin `icerik/zayiflar.txt`, seslendirme `icerik/zayiflar.seslendirme.txt` (kelime sayıları satır satır aynı olmalı).
 * Ses yoksa zamanlar okuma hızından hesaplanır (sessiz taslak).
 */
import { AbsoluteFill, Audio, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import { CurlyGuy, GIRL_LOOK, type CurlyExpr, type CurlyLook, type CurlyPose } from "../avatar/CurlyGuy";
import { Apple, Bubble, Burger, Check, Clock, Cross, Pill, Pizza, Txt } from "./GeceYemek";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const GREEN = "#3ccf7a";
const FLOOR = 1400;

export const ZAYIF_LINES: Line[] = [
  { text: "Zayıflar bunu saklıyor!", hl: ["saklıyor!"], hold: 0.2 },
  { text: "Bu kız her şeyi yiyor ama kilo almıyor. Sence neden?", hl: ["her", "şeyi", "almıyor.", "neden?"], hold: 0.4 },
  { text: "Sen diyet yapıyorsun, o yapmıyor.", hl: ["diyet", "yapmıyor."], hold: 0.2 },
  { text: "Çünkü herkesin doğru bildiği 3 yanlış var.", hl: ["3", "yanlış"], hold: 0.3 },
  { text: "1. “Zayıflar az yer.”", hold: 0.2 },
  { text: "Az yemiyorlar. Doyunca bırakıyorlar, tabağı bitirmek zorunda hissetmiyorlar.", hl: ["doyunca", "bırakıyorlar,"], hold: 0.3 },
  { text: "2. “Akşam yemek kilo aldırır.”", hold: 0.2 },
  { text: "Saat değil, gün boyu atıştırmak kilo aldırır.", hl: ["saat", "değil,", "atıştırmak"], hold: 0.3 },
  { text: "3. “Onlar şanslı.”", hold: 0.2 },
  { text: "Sadece şans değil. Gün içinde sürekli hareket ediyorlar, farkında bile değilsin.", hl: ["sürekli", "hareket"], hold: 0.3 },
  { text: "Zayıf insanlar yasakla değil, alışkanlıkla yaşar.", hl: ["yasakla", "alışkanlıkla"], hold: 0.4 },
  { text: "Kaçına inanıyordun? Yoruma yaz!", hl: ["yoruma", "yaz!"], hold: 0.6 },
];

/** ekrandaki büyük yazıyla aynı olduğu için altyazısı gösterilmeyen satırlar (kanca + efsane kartları) */
const NO_CAPTION = [0, 4, 6, 8];

export const ZAYIF_TAIL = 1.4;
export const ZAYIF_TL = timeline(ZAYIF_LINES, ZAYIF_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

/** seslendirmeden zaman çizelgesi: her satır ilk kelimesinin başladığı anda başlar */
const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of ZAYIF_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + ZAYIF_TAIL;
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

/** satır içindeki k. kelimenin zamanı (ses yoksa satıra eşit yayılır) */
const wordTime = (tl: TL, line: number, k: number) => {
  if (tl.wordAt) return tl.wordAt(line, k);
  const n = words(ZAYIF_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (ZAYIF_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0 || NO_CAPTION.includes(i)) return null;
  const line = ZAYIF_LINES[i];
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
    <div style={{ position: "absolute", left: 40, right: 40, top: 1560, textAlign: "center" }}>
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
              fontSize: 90,
              letterSpacing: -1.5,
              color: hl.includes(norm(w)) ? Y : "#ffffff",
              WebkitTextStroke: `14px ${INK}`,
              paintOrder: "stroke",
              textShadow: "0 8px 0 rgba(27,20,32,0.3)",
              transform: `translateY(${(1 - p) * 14}px)`,
              opacity: p,
            }}
          >
            {w.replace(/[“”]/g, "")}
          </span>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------ karakterler

type P = [number, number];
const mixP = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

const blinkAt = (t: number) => ((t % 3.5) / 3.5 > 0.96 ? 1 : 0);

/** karakter: ayak ortası (x, y), s ölçek (~810 birim boy). Bora varsayılan görünüm, kız `GIRL_LOOK` */
const Who: React.FC<{ x: number; y?: number; s: number; pose?: CurlyPose; expr?: CurlyExpr; t: number; uid: string; item?: React.ReactNode; look?: CurlyLook }> = ({
  x,
  y = FLOOR,
  s,
  pose,
  expr,
  t,
  uid,
  item,
  look,
}) => (
  <g transform={`translate(${x},${y}) scale(${s}) translate(-200,-880)`}>
    <CurlyGuy id={uid} pose={pose} expr={expr} t={t} item={item} blink={blinkAt(t + x)} look={look} />
  </g>
);

/** ağza götür ↔ aşağı indir (k: 0 aşağı, 1 ağızda) */
const EAT_DOWN: P[] = [
  [300, 520],
  [300, 430],
];
const EAT_UP: P[] = [
  [300, 480],
  [238, 300],
];
const eatArm = (k: number) => ({ el: mixP(EAT_DOWN[0], EAT_UP[0], k), wr: mixP(EAT_DOWN[1], EAT_UP[1], k) });

// ------------------------------------------------------------ çizim parçaları

const Fries: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {[-34, -18, -2, 14, 30].map((dx, k) => (
      <rect key={k} x={dx - 7} y={-100 + (k % 2) * 14} width={14} height={90} rx={4} fill="#ffd23f" stroke={INK} strokeWidth={4} transform={`rotate(${(k - 2) * 6} ${dx} -10)`} />
    ))}
    <path d="M-50,-40 L50,-40 L40,40 L-40,40 Z" fill={RED} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-30,-10 Q0,10 30,-10" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" />
  </g>
);

const Donut: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={62} ry={44} fill="#e3a35a" stroke={INK} strokeWidth={6} />
    <path d="M-56,-6 Q-58,-40 0,-42 Q58,-40 56,-6 Q40,10 20,0 Q0,12 -20,0 Q-40,12 -56,-6 Z" fill="#ff8fbf" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <ellipse cx={0} cy={-12} rx={18} ry={10} fill="#c47a36" stroke={INK} strokeWidth={5} />
    {[
      [-34, -22, "#fff"],
      [30, -26, Y],
      [-10, -34, "#7fc8ff"],
      [40, -10, "#fff"],
      [-42, -6, Y],
    ].map(([a, b, c], k) => (
      <rect key={k} x={(a as number) - 6} y={(b as number) - 2} width={12} height={5} rx={2} fill={c as string} transform={`rotate(${k * 40} ${a} ${b})`} />
    ))}
  </g>
);

/** salata kâsesi (diyet) */
const Salad: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {[-30, -6, 18, 34].map((dx, k) => (
      <path key={k} d={`M${dx - 22},0 Q${dx - 20},-40 ${dx},-46 Q${dx + 20},-40 ${dx + 22},0 Z`} fill={k % 2 ? "#5cbf4a" : "#8fd65a"} stroke={INK} strokeWidth={4} />
    ))}
    <circle cx={-10} cy={-18} r={10} fill={RED} stroke={INK} strokeWidth={4} />
    <path d="M-62,-4 L62,-4 Q56,50 0,52 Q-56,50 -62,-4 Z" fill="#ffffff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

const Chips: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-46,-62 L46,-62 L40,62 L-40,62 Z" fill="#ffb02e" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-46,-62 L-40,-72 L-30,-62 L-20,-72 L-10,-62 L0,-72 L10,-62 L20,-72 L30,-62 L40,-72 L46,-62" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={0} cy={4} r={24} fill="#fff3c4" stroke={INK} strokeWidth={4} />
    <path d="M-36,-40 L36,-40" stroke={RED} strokeWidth={10} />
  </g>
);

const Cookie: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <circle r={46} fill="#d99a52" stroke={INK} strokeWidth={6} />
    {[
      [-16, -14],
      [14, -20],
      [18, 12],
      [-12, 18],
      [0, 0],
    ].map(([a, b], k) => (
      <circle key={k} cx={a} cy={b} r={6} fill="#5a3218" />
    ))}
  </g>
);

const Soda: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-34,-56 L34,-56 L28,56 L-28,56 Z" fill="#ffffff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-31,-20 L31,-20 L28,30 L-28,30 Z" fill={RED} />
    <rect x={-40} y={-70} width={80} height={16} rx={6} fill="#ffffff" stroke={INK} strokeWidth={5} />
    <path d="M8,-70 L20,-110" stroke={INK} strokeWidth={6} strokeLinecap="round" />
  </g>
);

const Clover: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M0,10 Q6,50 -10,80" stroke="#2f9e4a" strokeWidth={10} fill="none" strokeLinecap="round" />
    {[0, 90, 180, 270].map((a) => (
      <g key={a} transform={`rotate(${a + 45})`}>
        <path d="M0,0 C-30,-10 -36,-52 -12,-56 C0,-58 0,-46 0,-40 C0,-46 0,-58 12,-56 C36,-52 30,-10 0,0 Z" fill="#46c35e" stroke={INK} strokeWidth={5} />
      </g>
    ))}
  </g>
);

/** masa (karakterin önünde, bacaklarını örter) */
const Table: React.FC<{ x0: number; x1: number; y: number; color?: string }> = ({ x0, x1, y, color = "#ffffff" }) => (
  <g>
    <rect x={x0 + 40} y={y + 30} width={26} height={FLOOR - y - 30} fill="#c58b5a" stroke={INK} strokeWidth={6} />
    <rect x={x1 - 66} y={y + 30} width={26} height={FLOOR - y - 30} fill="#c58b5a" stroke={INK} strokeWidth={6} />
    <rect x={x0} y={y} width={x1 - x0} height={44} rx={14} fill={color} stroke={INK} strokeWidth={7} />
    <rect x={x0 + 8} y={y + 30} width={x1 - x0 - 16} height={6} fill={INK} opacity={0.12} />
  </g>
);

/** tabak; n: üstünde kalan lokma sayısı (0-6) */
const Plate: React.FC<{ x: number; y: number; n: number }> = ({ x, y, n }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={0} rx={130} ry={36} fill="#ffffff" stroke={INK} strokeWidth={6} />
    <ellipse cx={0} cy={-2} rx={92} ry={22} fill="#f1ece4" />
    {[
      [-54, -14],
      [-18, -20],
      [18, -18],
      [52, -12],
      [-30, -2],
      [26, 0],
    ]
      .slice(0, Math.max(0, Math.min(6, n)))
      .map(([a, b], k) => (
        <g key={k}>
          <circle cx={a} cy={b} r={20} fill="#b4562e" stroke={INK} strokeWidth={4} />
          <circle cx={a - 6} cy={b - 7} r={5} fill="#e08a5a" />
        </g>
      ))}
  </g>
);

/** dikey tokluk ölçeri */
const FullMeter: React.FC<{ x: number; y: number; v: number; o: number; done: number }> = ({ x, y, v, o, done }) => {
  if (o <= 0) return null;
  const h = 420;
  const col = interpolateColors(v, [0, 0.6, 1], [Y, "#a8dc5a", GREEN]);
  return (
    <g opacity={o}>
      <Txt x={x + 45} y={y - 30} size={44}>
        TOKLUK
      </Txt>
      <rect x={x} y={y} width={90} height={h} rx={30} fill="#ffffff" stroke={INK} strokeWidth={7} />
      <rect x={x + 12} y={y + 12 + (h - 24) * (1 - v)} width={66} height={(h - 24) * v} rx={20} fill={col} />
      <Check x={x + 45} y={y + h + 70} s={40} p={done} />
    </g>
  );
};

/** yorum ikonu */
const CommentIcon: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-60,-46 Q-60,-62 -44,-62 L44,-62 Q60,-62 60,-46 L60,22 Q60,38 44,38 L-10,38 L-36,62 L-32,38 L-44,38 Q-60,38 -60,22 Z" fill="#ffffff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    {[-28, 0, 28].map((dx) => (
      <circle key={dx} cx={dx} cy={-12} r={8} fill={INK} />
    ))}
  </g>
);

/** kırmızı mühür (YANLIŞ); p: 0→1 yumuşak gelir, hafif büyükten yerine oturur */
const Stamp: React.FC<{ x: number; y: number; p: number; text?: string; size?: number }> = ({ x, y, p, text = "YANLIŞ", size = 92 }) => {
  if (p <= 0) return null;
  const w = text.length * size * 0.66 + 70;
  return (
    <g opacity={p} transform={`translate(${x},${y}) rotate(-11) scale(${1.12 - 0.12 * p})`}>
      <rect x={-w / 2} y={-size * 0.78} width={w} height={size * 1.56} rx={20} fill="#ffffff" fillOpacity={0.85} stroke={RED} strokeWidth={13} />
      <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} fill={RED} letterSpacing={5}>
        {text}
      </text>
    </g>
  );
};

/** efsane kartı: numara + söz; p görünürlük, stamp mühür */
const MythCard: React.FC<{ n: number; lines: string[]; p: number; stamp: number; icon?: React.ReactNode }> = ({ n, lines, p, stamp, icon }) => {
  if (p <= 0) return null;
  return (
    <g opacity={p} transform={`translate(0,${(1 - p) * 24})`}>
      <rect x={70} y={190} width={940} height={330} rx={46} fill="#ffffff" stroke={INK} strokeWidth={9} />
      <circle cx={190} cy={355} r={78} fill={Y} stroke={INK} strokeWidth={8} />
      <text x={190} y={393} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={110} fill={INK}>
        {n}
      </text>
      {lines.map((l, k) => (
        <text key={k} x={300} y={340 + (k - (lines.length - 1) / 2) * 84 + 26} fontFamily={SANS} fontWeight={800} fontSize={lines.length > 1 && l.length > 9 ? 70 : 80} fill={INK} letterSpacing={-1}>
          {l}
        </text>
      ))}
      {icon}
      <text x={960} y={250} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={36} fill={INK} opacity={0.4}>
        {n}/3
      </text>
      <Stamp x={760} y={470} p={stamp} />
    </g>
  );
};

/** merdiven (soldan sağa yükselir) */
const STEP_W = 150;
const STEP_H = 62;
const STEP_X0 = 40;
const STEPS = 6;
const Stairs: React.FC = () => (
  <g>
    {Array.from({ length: STEPS }).map((_, k) => {
      const x = STEP_X0 + k * STEP_W;
      const top = FLOOR - (k + 1) * STEP_H;
      return (
        <g key={k}>
          <rect x={x} y={top} width={1080 - x + 20} height={FLOOR - top} fill={k % 2 ? "#f4efe6" : "#ebe3d6"} stroke={INK} strokeWidth={6} />
          <rect x={x} y={top} width={1080 - x + 20} height={10} fill={INK} opacity={0.12} />
        </g>
      );
    })}
  </g>
);

// ------------------------------------------------------------ ana kompozisyon

export type ZayiflarProps = { audioName: string; data: VoiceoverData | null };

export const Zayiflar: React.FC<ZayiflarProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : ZAYIF_TL;
  const L = tl.at;
  const X = 0.35;
  // önceki sahne tamamen sönünce yenisi gelir (üst üste binen hayalet görüntü olmasın)
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, X * 0.6);
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const bite = (speed: number, phase = 0) => (1 - Math.cos(t * speed + phase)) / 2;

  // fon rengi sahneye göre (son sahne = ilk sahne: döngüde dikiş görünmez)
  const SCENE_BG: [number, string, string][] = [
    [0, "#ffd6c9", "#f6b5a2"], // kanca: şeftali
    [2, "#d9e6f4", "#bcd1ea"], // sen ↔ o: açık mavi
    [4, "#fbe9b6", "#f2d684"], // 1: tereyağı sarısı
    [6, "#e3ddf6", "#c9bfee"], // 2: lavanta
    [8, "#d4ebe0", "#b6dac9"], // 3: mint
    [10, "#f1e6d2", "#e2d2b6"], // özet: krem
    [11, "#ffd6c9", "#f6b5a2"], // kapanış: şeftali
  ];
  let bgTop = SCENE_BG[0][1];
  let bgBot = SCENE_BG[0][2];
  for (let k = 1; k < SCENE_BG.length; k++) {
    const at = L(SCENE_BG[k][0]);
    bgTop = interpolateColors(t, [at - 0.15, at + 0.25], [bgTop, SCENE_BG[k][1]]);
    bgBot = interpolateColors(t, [at - 0.15, at + 0.25], [bgBot, SCENE_BG[k][2]]);
  }

  // ===== 0-1: kanca — kız her şeyi yiyor
  const s0 = scene(0, 2);
  const why = sm(t, W(1, 8) - 0.2, W(1, 8) + 0.15); // "Sence neden?"
  const eat0 = bite(4.2) * (1 - why);

  // ===== 2-3: sen diyet / o yemiyor
  const s2 = scene(2, 4);
  const three = sm(t, W(3, 4) - 0.1, W(3, 4) + 0.3); // "3 yanlış"

  // ===== 4-5: 1. efsane
  const s4 = scene(4, 6);
  const full = W(5, 2); // "Doyunca"
  const biteN = Math.max(0, Math.min(3, Math.floor((t - L(4) + 0.2) / 1.05)));
  const eatK = t < full - 0.2 ? bite((Math.PI * 2) / 1.05, -(L(4) - 0.2) * ((Math.PI * 2) / 1.05)) : 0;
  const fullV = interpolate(t, [L(4), full], [0.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ===== 6-7: 2. efsane
  const s6 = scene(6, 8);
  const snackT = [W(7, 3), W(7, 3) + 0.35, W(7, 4), W(7, 4) + 0.35, W(7, 5)];
  const snackN = snackT.filter((x) => t >= x).length;
  const kcal = Math.round(interpolate(t, [snackT[0], snackT[4] + 0.3], [0, 1250], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) / 10) * 10;

  // ===== 8-9: 3. efsane
  const s8 = scene(8, 10);
  const climb = interpolate(t, [W(9, 3), L(10) - 0.3], [0, STEPS - 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stepK = Math.floor(climb);
  const stepF = sm(climb - stepK, 0.15, 0.85);
  const stairPos = (k: number): P => [STEP_X0 + k * STEP_W + STEP_W * 0.55, FLOOR - (k + 1) * STEP_H];
  const girlP = mixP(stairPos(stepK), stairPos(Math.min(STEPS - 1, stepK + 1)), stepF);
  const hop = Math.sin(stepF * Math.PI) * 26;
  const steps = Math.round(interpolate(t, [W(9, 3), L(10) - 0.2], [2400, 11800], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) / 7) * 7;

  // ===== 10: yasak değil alışkanlık
  const s10 = scene(10, 11);

  // ===== 11: kapanış
  const s11 = win(t, L(11) - 0.02, tl.total + 1, X * 0.6); // sona kadar kalır (döngü: siyaha kararmaz)
  const fmt = (n: number) => n.toLocaleString("tr-TR");

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="zy-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="zy-glow" cx="50%" cy="42%" r="55%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.45} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="zy-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.18} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#zy-bg)" />
        <rect width={1080} height={1920} fill="url(#zy-glow)" />
        <rect x={0} y={FLOOR} width={1080} height={1920 - FLOOR} fill="#3a2a2a" opacity={0.12} />
        <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} opacity={0.5} />

        {/* ===== 0-1: kanca ===== */}
        {s0 > 0 ? (
          <g opacity={s0}>
            <Who
              uid="kiz0"
              look={GIRL_LOOK}
              x={540}
              s={1.12}
              t={t}
              pose={why > 0.5 ? { r: { el: [300, 540], wr: [320, 450], hand: "thumb" }, head: -6 } : { r: eatArm(eat0) }}
              expr={why > 0.5 ? "happy" : "chew"}
              item={why > 0.5 ? undefined : <Burger x={0} y={-14} s={0.55} />}
            />
            <Table x0={90} x1={990} y={1130} />
            <Fries x={210} y={1090} s={0.95} />
            <Pizza x={860} y={1080} s={0.85} rot={200} />
            <Donut x={380} y={1110} s={0.8} />
            <Apple x={700} y={1105} s={0.6} />
            {/* kanca yazısı: ilk karede tam görünür (kapak) */}
            <g transform={`translate(0,${Math.sin(t * 2) * 4})`}>
              <Txt x={540} y={300} size={150} fill="#ffffff" sw={22}>
                ZAYIFLAR
              </Txt>
              <Txt x={540} y={440} size={118} fill={Y} sw={20}>
                BUNU SAKLIYOR!
              </Txt>
            </g>
            {/* "kilo almıyor": kilo ibresi kıpırdamıyor */}
            <Pill x={230} y={620} text="KİLO: AYNI" o={win(t, W(1, 5) - 0.1, W(1, 8) - 0.1, 0.25)} color={GREEN} ink="#fff" size={46} />
            {why > 0 ? (
              <g opacity={why} transform={`translate(${830},${700 + Math.sin(t * 3) * 10})`}>
                <Txt x={0} y={0} size={230} fill={Y} sw={16}>
                  ?
                </Txt>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ===== 2-3: sen ↔ o ===== */}
        {s2 > 0 ? (
          <g opacity={s2}>
            <Who
              uid="bora2"
              x={280}
              s={1.06}
              t={t}
              pose={{ r: { el: [300, 540], wr: [310, 470] }, head: 5, lx: 5 }}
              expr="ouch"
              item={<Salad x={0} y={-20} s={0.7} />}
            />
            <Who uid="kiz2" look={GIRL_LOOK} x={800} s={1.06} t={t} pose={{ r: eatArm(bite(4.6, 1)) }} expr="chew" item={<Pizza x={0} y={-20} s={0.5} rot={180} />} />
            <g opacity={1 - three}>
              <Pill x={290} y={600} text="SEN: DİYET" o={sm(t, W(2, 0) - 0.1, W(2, 0) + 0.2)} color="#ffffff" size={50} />
              <Pill x={790} y={600} text="O: DİYET YOK" o={sm(t, W(2, 3) - 0.1, W(2, 3) + 0.2)} color={Y} size={50} />
            </g>
            {/* 3 yanlış: üç kapalı kart */}
            <g opacity={sm(t, L(3) + 0.1, L(3) + 0.4)}>
              {[0, 1, 2].map((k) => {
                const x = 240 + k * 300;
                const o = sm(t, L(3) + 0.1 + k * 0.12, L(3) + 0.4 + k * 0.12);
                return (
                  <g key={k} opacity={o} transform={`translate(0,${(1 - o) * 20})`}>
                    <rect x={x - 115} y={250} width={230} height={260} rx={30} fill="#ffffff" stroke={INK} strokeWidth={8} />
                    <Txt x={x} y={420} size={150} fill={Y} sw={14}>
                      {String(k + 1)}
                    </Txt>
                  </g>
                );
              })}
              <Pill x={540} y={600} text="3 YANLIŞ" o={three} color={RED} ink="#fff" size={60} />
            </g>
          </g>
        ) : null}

        {/* ===== 4-5: 1. "Zayıflar az yer" ===== */}
        {s4 > 0 ? (
          <g opacity={s4}>
            <Who
              uid="kiz4"
              look={GIRL_LOOK}
              x={430}
              s={1.02}
              t={t}
              pose={
                t < full - 0.2
                  ? { r: { el: mixP([310, 500], EAT_UP[0], eatK), wr: mixP([296, 600], EAT_UP[1], eatK) } }
                  : { r: { el: [292, 560], wr: [236, 560], hand: "open" }, l: { el: [108, 560], wr: [164, 560], hand: "open" }, head: -4 }
              }
              expr={t < full - 0.2 ? "chew" : "happy"}
            />
            <Table x0={60} x1={1020} y={1150} />
            <Plate x={530} y={1150} n={6 - biteN} />
            <FullMeter x={810} y={640} v={fullV} o={sm(t, L(4) + 0.2, L(4) + 0.5)} done={sm(t, full, full + 0.4)} />
            <Bubble x={60} y={560} w={380} h={150} tx={340} ty={760} o={sm(t, full - 0.1, full + 0.2)} lines={["DOYDUM!"]} size={62} />
            <Pill x={350} y={1290} text="TABAKTA KALABİLİR" o={sm(t, W(5, 4) - 0.1, W(5, 4) + 0.2)} color={Y} size={44} />
            <MythCard n={1} lines={["“ZAYIFLAR", "AZ YER”"]} p={sm(t, L(4) - 0.05, L(4) + 0.3)} stamp={sm(t, L(5) - 0.05, L(5) + 0.25)} />
          </g>
        ) : null}

        {/* ===== 6-7: 2. "Akşam yemek kilo aldırır" ===== */}
        {s6 > 0 ? (
          <g opacity={s6}>
            {/* gün boyu atıştırma çizelgesi */}
            <g opacity={sm(t, W(7, 2) - 0.1, W(7, 2) + 0.2)}>
              <line x1={110} y1={760} x2={970} y2={760} stroke={INK} strokeWidth={8} strokeLinecap="round" opacity={0.6} />
              {["10:00", "13:00", "16:00", "19:00", "22:00"].map((h, k) => {
                const x = 150 + k * 195;
                const o = sm(t, snackT[k] - 0.1, snackT[k] + 0.2);
                const icons = [<Chips key="c" x={x} y={655} s={0.6} />, <Cookie key="k" x={x} y={665} s={0.8} />, <Soda key="s" x={x} y={660} s={0.7} />, <Chips key="c2" x={x} y={655} s={0.6} />, <Donut key="d" x={x} y={670} s={0.6} />];
                return (
                  <g key={h}>
                    <circle cx={x} cy={760} r={12} fill={o > 0.5 ? RED : "#ffffff"} stroke={INK} strokeWidth={5} />
                    <Txt x={x} y={835} size={36} fill="#ffffff" sw={8}>
                      {h}
                    </Txt>
                    <g opacity={o} transform={`translate(0,${(1 - o) * 16})`}>
                      {icons[k]}
                    </g>
                  </g>
                );
              })}
            </g>
            <Who
              uid="bora6"
              x={640}
              s={1.06}
              t={t}
              pose={{ r: eatArm(t > W(7, 2) - 0.2 ? bite(5) : 0) }}
              expr={t > W(7, 2) - 0.2 ? "chew" : "think"}
              item={<g opacity={sm(t, W(7, 2) - 0.2, W(7, 2) + 0.1)}><Chips x={0} y={-30} s={0.5} /></g>}
            />
            {/* "saat değil" */}
            <g opacity={win(t, L(7) - 0.05, W(7, 2), 0.25)}>
              <Clock x={230} y={1000} r={110} h={9} m={0} />
              <Cross x={230} y={1000} s={80} p={sm(t, W(7, 1) - 0.1, W(7, 1) + 0.3)} />
            </g>
            <g opacity={sm(t, snackT[0], snackT[0] + 0.25)}>
              <Pill x={240} y={1020} text={`+${fmt(kcal)} kcal`} o={1} color={RED} ink="#fff" size={52} />
              <Pill x={240} y={1130} text="ATIŞTIRMALIK" o={1} color="#ffffff" size={38} />
            </g>
            <MythCard
              n={2}
              lines={["“AKŞAM YEMEK", "KİLO ALDIRIR”"]}
              p={sm(t, L(6) - 0.05, L(6) + 0.3) * (1 - sm(t, W(7, 2) - 0.3, W(7, 2)))}
              stamp={sm(t, L(7) - 0.05, L(7) + 0.25)}
            />
            {/* kart kalkınca: küçük başlık */}
            <Pill x={540} y={300} text="SAAT DEĞİL, ATIŞTIRMA" o={sm(t, W(7, 2) - 0.1, W(7, 2) + 0.2)} color={Y} size={52} />
          </g>
        ) : null}

        {/* ===== 8-9: 3. "Onlar şanslı" ===== */}
        {s8 > 0 ? (
          <g opacity={s8}>
            <g opacity={sm(t, W(9, 3) - 0.4, W(9, 3))}>
              <Stairs />
            </g>
            {t < W(9, 3) - 0.2 ? (
              <Who uid="kiz8a" look={GIRL_LOOK} x={540} s={1.0} t={t} pose={{ r: { el: [300, 540], wr: [320, 450], hand: "open" }, head: 6 }} expr={t > L(9) ? "smile" : "grin"} />
            ) : (
              <Who
                uid="kiz8b"
                look={GIRL_LOOK}
                x={girlP[0]}
                y={girlP[1] - hop}
                s={0.72}
                t={t}
                pose={{ r: { el: [300, 500], wr: mixP([290, 600], [320, 560], stepF), hand: "fist" }, l: { el: [100, 500], wr: mixP([110, 560], [80, 600], stepF), hand: "fist" } }}
                expr="smile"
              />
            )}
            <g opacity={sm(t, W(9, 3) - 0.1, W(9, 3) + 0.2)}>
              <rect x={70} y={420} width={400} height={170} rx={34} fill="#ffffff" stroke={INK} strokeWidth={8} />
              <Txt x={270} y={480} size={38} fill={INK} sw={0}>
                BUGÜN ADIM
              </Txt>
              <Txt x={270} y={560} size={74} fill={GREEN} sw={0}>
                {fmt(steps)}
              </Txt>
            </g>
            <Pill x={270} y={680} text="FARKINDA BİLE DEĞİL" o={sm(t, W(9, 8) - 0.1, W(9, 8) + 0.2)} color={Y} size={40} />
            <MythCard
              n={3}
              lines={["“ONLAR", "ŞANSLI”"]}
              p={sm(t, L(8) - 0.05, L(8) + 0.3) * (1 - sm(t, W(9, 3) - 0.4, W(9, 3) - 0.1))}
              stamp={sm(t, L(9) - 0.05, L(9) + 0.25)}
              icon={<Clover x={700} y={330} s={0.9} />}
            />
            <Pill x={540} y={300} text="ŞANS DEĞİL, HAREKET" o={sm(t, W(9, 3) - 0.1, W(9, 3) + 0.2)} color={Y} size={52} />
          </g>
        ) : null}

        {/* ===== 10: yasak değil, alışkanlık ===== */}
        {s10 > 0 ? (
          <g opacity={s10}>
            <Who uid="bora10" x={300} s={1.05} t={t} pose={{ r: { el: [300, 560], wr: [330, 470], hand: "thumb" } }} expr="smile" />
            <Who uid="kiz10" look={GIRL_LOOK} x={780} s={1.05} t={t} pose={{ l: { el: [100, 560], wr: [70, 470], hand: "thumb" } }} expr="grin" />
            <g opacity={sm(t, W(10, 2) - 0.2, W(10, 2) + 0.1)}>
              <Pill x={540} y={300} text="YASAK" o={1} color="#ffffff" size={76} />
              <line x1={400} y1={300} x2={680} y2={276} stroke={RED} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sm(t, W(10, 3) - 0.1, W(10, 3) + 0.3)} />
            </g>
            <g opacity={sm(t, W(10, 4) - 0.15, W(10, 4) + 0.15)}>
              <Pill x={540} y={470} text="ALIŞKANLIK" o={1} color={GREEN} ink="#fff" size={84} />
              <Check x={860} y={455} s={44} p={sm(t, W(10, 4), W(10, 4) + 0.4)} />
            </g>
          </g>
        ) : null}

        {/* ===== 11: kapanış — yorum ===== */}
        {s11 > 0 ? (
          <g opacity={s11}>
            <Who uid="bora11" x={300} s={0.8} t={t} pose={{ r: { el: [290, 500], wr: [228, 300] } }} expr="think" />
            <Who uid="kiz11" look={GIRL_LOOK} x={780} s={0.8} t={t} pose={{ r: { el: [320, 430], wr: [328, 310], hand: "point", handRot: -20 } }} expr="grin" />
            <Txt x={540} y={230} size={100} fill="#ffffff" sw={18}>
              KAÇINA
            </Txt>
            <Txt x={540} y={340} size={100} fill="#ffffff" sw={18}>
              İNANIYORDUN?
            </Txt>
            {["AZ YER", "AKŞAM", "ŞANS"].map((s, k) => {
              const x = 230 + k * 310;
              const o = sm(t, L(11) + 0.15 + k * 0.12, L(11) + 0.45 + k * 0.12);
              return (
                <g key={s} opacity={o}>
                  <rect x={x - 130} y={400} width={260} height={150} rx={28} fill="#ffffff" stroke={INK} strokeWidth={7} />
                  <Txt x={x} y={470} size={60} fill={Y} sw={10}>
                    {String(k + 1)}
                  </Txt>
                  <Txt x={x} y={528} size={40} fill={INK} sw={0}>
                    {s}
                  </Txt>
                </g>
              );
            })}
            <g opacity={sm(t, W(11, 2) - 0.15, W(11, 2) + 0.15)}>
              <CommentIcon x={250} y={650 + Math.sin(t * 3) * 6} s={0.9} />
              <Txt x={600} y={676} size={84} fill={Y} sw={16}>
                YORUMA YAZ!
              </Txt>
            </g>
          </g>
        ) : null}

        <rect width={1080} height={1920} fill="url(#zy-vig)" />
      </svg>

      <Captions t={t} tl={tl} />
      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          <Audio
            src={staticFile("music/623.mp3")}
            volume={(f) => {
              const mt = f / fps;
              const end = data.durationInSeconds;
              const base = interpolate(mt, [0, 0.4, end, end + 0.5], [0.02, 0.04, 0.04, 0.09], { extrapolateRight: "clamp" });
              return base * interpolate(mt, [tl.total - 0.8, tl.total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            }}
          />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
