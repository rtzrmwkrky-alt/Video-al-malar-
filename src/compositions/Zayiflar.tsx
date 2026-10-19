/**
 * "Zayıfların sakladığı o sır!" — 3 yalan (~40 sn), tek anlatıcı (Chris). Metin kullanıcının (2. sürüm).
 * Hikâye: her şeyi yiyen ama kilo almayan kız ("o") ↔ Bora ("sen" / "biz").
 * Her maddede önce ekranı kaplayan dev rakam (kullanıcı ipucu), sonra efsane kartı + kırmızı YALAN mührü,
 * cevap sahnede gösterilir → "şans değil, alışkanlık" → yorum çağrısı.
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
import { Apple, Bubble, Burger, Check, Clock, Cross, Dumbbell, Flame, Moon, Nuts, Pill, Pizza, Txt } from "./GeceYemek";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const GREEN = "#3ccf7a";
const FLOOR = 1400;

export const ZAYIF_LINES: Line[] = [
  { text: "Zayıfların sakladığı o sır!", hold: 0.2 },
  { text: "Bu kız her şeyi yiyor ama gram kilo almıyor.", hl: ["her", "şeyi", "gram", "almıyor."], hold: 0.2 },
  { text: "“Şanslı” deyip geçme, kandırıldığımız 3 yalan var!", hl: ["3", "yalan"], hold: 0.3 },
  { text: "1. “Az yiyorlar.”", hold: 0.2 },
  { text: "Az yemiyorlar! Doydukları an tabağı bırakıyorlar.", hl: ["doydukları", "bırakıyorlar."], hold: 0.2 },
  { text: "Biz ise tabağı bitirmek için kendimizi zorluyoruz.", hl: ["zorluyoruz."], hold: 0.3 },
  { text: "2. “Gece yemek kilo aldırır.”", hold: 0.2 },
  { text: "Vücut saate bakmaz!", hl: ["saate", "bakmaz!"], hold: 0.2 },
  { text: "Sen gün boyu “sağlıklı” diye avuç avuç kuruyemişle 3 bin kaloriyi deviriyorsun.", hl: ["avuç", "3", "bin"], hold: 0.3 },
  { text: "3. Şanslı değiller!", hold: 0.2 },
  { text: "Fark etmeden sürekli hareket ediyorlar.", hl: ["sürekli", "hareket"], hold: 0.2 },
  { text: "Sen 1 saat spor yapıp yatarken, o oturduğu yerde bile kalori yakıyor.", hl: ["yatarken,", "kalori", "yakıyor."], hold: 0.3 },
  { text: "Zayıflık şans değil, alışkanlık.", hl: ["alışkanlık."], hold: 0.4 },
  { text: "Hangisine inanıyordun? Yorumlara yaz!", hl: ["yorumlara", "yaz!"], hold: 0.6 },
];

/** ekrandaki büyük yazıyla aynı olduğu için altyazısı gösterilmeyen satırlar (kanca + efsane kartları) */
const NO_CAPTION = [0, 3, 6, 9];

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
const Stamp: React.FC<{ x: number; y: number; p: number; text?: string; size?: number }> = ({ x, y, p, text = "YALAN", size = 92 }) => {
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

/** kanepe (Bora'nın "yatarken"i) */
const Sofa: React.FC<{ x: number; w?: number }> = ({ x, w = 420 }) => (
  <g>
    <rect x={x} y={1060} width={w} height={200} rx={50} fill="#7a8fd6" stroke={INK} strokeWidth={8} />
    <rect x={x - 30} y={1160} width={w + 60} height={180} rx={40} fill="#8fa3e6" stroke={INK} strokeWidth={8} />
    <rect x={x - 50} y={1120} width={80} height={220} rx={36} fill="#7a8fd6" stroke={INK} strokeWidth={8} />
    <rect x={x + w - 30} y={1120} width={80} height={220} rx={36} fill="#7a8fd6" stroke={INK} strokeWidth={8} />
    <rect x={x} y={1340} width={24} height={60} fill="#6b4a32" stroke={INK} strokeWidth={6} />
    <rect x={x + w - 24} y={1340} width={24} height={60} fill="#6b4a32" stroke={INK} strokeWidth={6} />
  </g>
);

/** ekranı kaplayan dev rakam (madde başında izleyiciyi tutar); yumuşak gelir, hafif küçülerek söner */
const BigNum: React.FC<{ n: number; t: number; at: number }> = ({ n, t, at }) => {
  const o = win(t, at - 0.08, at + 0.75, 0.18);
  if (o <= 0) return null;
  const k = sm(t, at - 0.08, at + 0.75);
  return (
    <g opacity={o}>
      <rect width={1080} height={1920} fill="#000" opacity={0.25 * o} />
      <g transform={`translate(540,${1060}) scale(${1.06 - 0.12 * k})`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={900} fill={Y} stroke={INK} strokeWidth={36} paintOrder="stroke" letterSpacing={-20}>
          {n}
        </text>
      </g>
    </g>
  );
};

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
  const fmt = (n: number) => n.toLocaleString("tr-TR");
  /** kart açılışı: dev rakam sönerken gelir */
  const cardIn = (line: number) => sm(t, L(line) + 0.45, L(line) + 0.8);

  // fon rengi sahneye göre (son sahne = ilk sahne: döngüde dikiş görünmez)
  const SCENE_BG: [number, string, string][] = [
    [0, "#ffd6c9", "#f6b5a2"], // kanca: şeftali
    [2, "#d9e6f4", "#bcd1ea"], // şanslı mı?: açık mavi
    [3, "#fbe9b6", "#f2d684"], // 1: tereyağı sarısı
    [6, "#e3ddf6", "#c9bfee"], // 2: lavanta
    [9, "#d4ebe0", "#b6dac9"], // 3: mint
    [12, "#f1e6d2", "#e2d2b6"], // özet: krem
    [13, "#ffd6c9", "#f6b5a2"], // kapanış: şeftali
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
  const eat0 = bite(4.2);

  // ===== 2: "şanslı" deyip geçme → 3 yalan
  const s2 = scene(2, 3);
  const three = sm(t, W(2, 4) - 0.15, W(2, 4) + 0.2);

  // ===== 3-5: 1. yalan
  const s3 = scene(3, 6);
  const full = W(4, 2); // "Doydukları an"
  const T5 = L(5);
  const girlO = 1 - sm(t, T5 - 0.2, T5);
  const boraO = sm(t, T5, T5 + 0.2);
  const biteN = Math.max(0, Math.min(2, Math.floor((t - L(3) - 0.3) / 0.9)));
  const eatK = t < full - 0.2 && t > L(3) + 0.3 ? bite((Math.PI * 2) / 0.9, -(L(3) + 0.3) * ((Math.PI * 2) / 0.9)) : 0;
  const fullV = interpolate(t, [L(3) + 0.5, full], [0.25, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Bora: aynı masada zorla bitiriyor (tabak 6 → 0, ölçer taşar)
  const forced = W(5, 6); // "zorluyoruz"
  const boraBite = interpolate(t, [T5, forced], [0, 6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const boraEat = t < forced ? bite(7.5) : 0;
  const overV = interpolate(t, [T5, forced], [0.6, 1.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ===== 6-8: 2. yalan
  const s6 = scene(6, 9);
  const nutT = [W(8, 0), W(8, 2), W(8, 4), W(8, 5), W(8, 7)];
  const kcal = Math.round(interpolate(t, [nutT[0], W(8, 9) + 0.2], [0, 3000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) / 10) * 10;

  // ===== 9-11: 3. yalan
  const s9 = scene(9, 12);
  const climb = interpolate(t, [L(10), L(11) - 0.1], [0, STEPS - 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stepK = Math.floor(climb);
  const stepF = sm(climb - stepK, 0.15, 0.85);
  const stairPos = (k: number): P => [STEP_X0 + k * STEP_W + STEP_W * 0.55, FLOOR - (k + 1) * STEP_H];
  const girlP = mixP(stairPos(stepK), stairPos(Math.min(STEPS - 1, stepK + 1)), stepF);
  const hop = Math.sin(stepF * Math.PI) * 26;
  const steps = Math.round(interpolate(t, [L(10), L(11) - 0.1], [2400, 11800], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) / 7) * 7;
  const st = sm(t, L(10) - 0.2, L(10)) * (1 - sm(t, L(11) - 0.2, L(11))); // merdiven bölümü
  const sp = sm(t, L(11), L(11) + 0.25); // spor ↔ kanepe bölümü
  const lazy = W(11, 4); // "yatarken"

  // ===== 12: şans değil, alışkanlık
  const s12 = scene(12, 13);

  // ===== 13: kapanış (sona kadar kalır; döngü için siyaha kararmaz)
  const s13 = win(t, L(13) - 0.02, tl.total + 1, X * 0.6);

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
            <Who uid="kiz0" look={GIRL_LOOK} x={540} s={1.12} t={t} pose={{ r: eatArm(eat0) }} expr="chew" item={<Burger x={0} y={-14} s={0.55} />} />
            <Table x0={90} x1={990} y={1130} />
            <Fries x={210} y={1090} s={0.95} />
            <Pizza x={860} y={1080} s={0.85} rot={200} />
            <Donut x={380} y={1110} s={0.8} />
            <Apple x={700} y={1105} s={0.6} />
            {/* kanca yazısı: ilk karede tam görünür (kapak) */}
            <g transform={`translate(0,${Math.sin(t * 2) * 4})`}>
              <Txt x={540} y={290} size={140} fill="#ffffff" sw={22}>
                ZAYIFLARIN
              </Txt>
              <Txt x={540} y={420} size={104} fill={Y} sw={20}>
                SAKLADIĞI O SIR!
              </Txt>
            </g>
            <Pill x={230} y={620} text="KİLO: AYNI" o={sm(t, W(1, 6) - 0.1, W(1, 6) + 0.2)} color={GREEN} ink="#fff" size={50} />
          </g>
        ) : null}

        {/* ===== 2: şanslı mı? ===== */}
        {s2 > 0 ? (
          <g opacity={s2}>
            <Who uid="bora2" x={280} s={1.06} t={t} pose={{ r: { el: [320, 430], wr: [328, 310], hand: "point", handRot: 20 } }} expr={t < W(2, 2) ? "grin" : "surprise"} />
            <Who uid="kiz2" look={GIRL_LOOK} x={800} s={1.06} t={t} pose={{ r: eatArm(bite(4.6, 1)) }} expr="chew" item={<Pizza x={0} y={-20} s={0.5} rot={180} />} />
            <g opacity={1 - three}>
              <Bubble x={60} y={250} w={460} h={170} tx={330} ty={560} o={sm(t, L(2) - 0.05, L(2) + 0.2)} lines={["ŞANSLI!"]} size={70} />
              <Clover x={600} y={320} s={0.7} />
              <Cross x={290} y={335} s={70} p={sm(t, W(2, 2) - 0.1, W(2, 2) + 0.3)} />
            </g>
            {[0, 1, 2].map((k) => {
              const x = 240 + k * 300;
              const o = sm(t, W(2, 4) - 0.15 + k * 0.1, W(2, 4) + 0.15 + k * 0.1);
              return (
                <g key={k} opacity={o} transform={`translate(0,${(1 - o) * 20})`}>
                  <rect x={x - 115} y={250} width={230} height={260} rx={30} fill="#ffffff" stroke={INK} strokeWidth={8} />
                  <Txt x={x} y={420} size={150} fill={Y} sw={14}>
                    {String(k + 1)}
                  </Txt>
                </g>
              );
            })}
            <Pill x={540} y={600} text="3 YALAN" o={three} color={RED} ink="#fff" size={64} />
          </g>
        ) : null}

        {/* ===== 3-5: 1. "Az yiyorlar" ===== */}
        {s3 > 0 ? (
          <g opacity={s3}>
            {girlO > 0 ? (
              <g opacity={girlO}>
                <Who
                  uid="kiz3"
                  look={GIRL_LOOK}
                  x={430}
                  s={1.02}
                  t={t}
                  pose={
                    t < full - 0.2
                      ? { r: { el: mixP([310, 500], EAT_UP[0], eatK), wr: mixP([296, 600], EAT_UP[1], eatK) } }
                      : { r: { el: [320, 520], wr: [380, 600], hand: "open", handRot: 60 }, head: -4 }
                  }
                  expr={t < full - 0.2 ? "chew" : "happy"}
                />
              </g>
            ) : null}
            {boraO > 0 ? (
              <g opacity={boraO}>
                <Who
                  uid="bora3"
                  x={430}
                  s={1.02}
                  t={t}
                  pose={
                    t < forced
                      ? { r: eatArm(boraEat), head: Math.sin(t * 7) * 2 }
                      : { r: { el: [292, 560], wr: [236, 560], hand: "open" }, l: { el: [108, 560], wr: [164, 560], hand: "open" }, head: 5 }
                  }
                  expr={t < forced ? "chew" : "ouch"}
                />
              </g>
            ) : null}
            <Table x0={60} x1={1020} y={1150} />
            <Plate x={530} y={1150} n={t < T5 ? 6 - biteN : 6 - Math.floor(boraBite)} />
            {/* tokluk ölçeri: kızda yeşil "doydum", Bora'da taşar */}
            <FullMeter x={810} y={640} v={Math.min(1, t < T5 ? fullV : overV)} o={sm(t, L(3) + 0.6, L(3) + 0.9)} done={sm(t, full, full + 0.4) * girlO} />
            {t > T5 && overV > 1 ? (
              <g opacity={sm(overV, 1, 1.1)}>
                <rect x={822} y={660 - (overV - 1) * 300} width={66} height={(overV - 1) * 300 + 20} rx={20} fill={RED} />
                <Pill x={855} y={1120} text="FAZLA!" o={1} color={RED} ink="#fff" size={44} />
              </g>
            ) : null}
            <g opacity={girlO}>
              <Bubble x={40} y={560} w={380} h={150} tx={330} ty={760} o={sm(t, full - 0.1, full + 0.2)} lines={["DOYDUM!"]} size={62} />
              <Pill x={600} y={1290} text="TABAKTA KALDI" o={sm(t, W(4, 4) - 0.1, W(4, 4) + 0.2)} color={Y} size={44} />
            </g>
            <Pill x={560} y={1290} text="BİTİRMEK ZORUNDAYIM" o={boraO * sm(t, W(5, 2) - 0.1, W(5, 2) + 0.2)} color="#ffffff" size={42} />
            <BigNum n={1} t={t} at={L(3)} />
            <MythCard n={1} lines={["“AZ", "YİYORLAR”"]} p={cardIn(3)} stamp={sm(t, L(4) - 0.05, L(4) + 0.25)} />
          </g>
        ) : null}

        {/* ===== 6-8: 2. "Gece yemek kilo aldırır" ===== */}
        {s6 > 0 ? (
          <g opacity={s6}>
            {/* gün boyu avuç avuç kuruyemiş */}
            <g opacity={sm(t, L(8) - 0.1, L(8) + 0.2)}>
              <line x1={110} y1={560} x2={970} y2={560} stroke={INK} strokeWidth={8} strokeLinecap="round" opacity={0.6} />
              {["10:00", "12:00", "15:00", "17:00", "20:00"].map((h, k) => {
                const x = 150 + k * 195;
                const o = sm(t, nutT[k] - 0.1, nutT[k] + 0.2);
                return (
                  <g key={h}>
                    <circle cx={x} cy={560} r={12} fill={o > 0.5 ? RED : "#ffffff"} stroke={INK} strokeWidth={5} />
                    <Txt x={x} y={630} size={36} fill="#ffffff" sw={8}>
                      {h}
                    </Txt>
                    <g opacity={o} transform={`translate(0,${(1 - o) * 16})`}>
                      <Nuts x={x} y={490} s={0.75} />
                    </g>
                  </g>
                );
              })}
            </g>
            <Who
              uid="bora6"
              x={660}
              s={0.98}
              t={t}
              pose={t > L(8) - 0.1 ? { r: eatArm(bite(5)) } : { r: { el: [290, 500], wr: [228, 300] } }}
              expr={t > L(8) - 0.1 ? "chew" : "think"}
              item={t > L(8) - 0.1 ? <Nuts x={0} y={-30} s={0.45} /> : undefined}
            />
            {/* "vücut saate bakmaz" */}
            <g opacity={win(t, L(7) - 0.05, L(8), 0.25)}>
              <Clock x={240} y={900} r={130} h={11} m={0} />
              <Moon x={360} y={760} r={44} />
              <Cross x={240} y={900} s={95} p={sm(t, W(7, 2) - 0.1, W(7, 2) + 0.3)} />
            </g>
            <g opacity={sm(t, nutT[0], nutT[0] + 0.25)}>
              <Pill x={250} y={1020} text={`+${fmt(kcal)} kcal`} o={1} color={RED} ink="#fff" size={56} />
              <Pill x={250} y={1135} text="“SAĞLIKLI” DİYE" o={1} color="#ffffff" size={38} />
            </g>
            <BigNum n={2} t={t} at={L(6)} />
            <MythCard
              n={2}
              lines={["“GECE YEMEK", "KİLO ALDIRIR”"]}
              p={cardIn(6) * (1 - sm(t, L(8) - 0.3, L(8)))}
              stamp={sm(t, L(7) - 0.05, L(7) + 0.25)}
            />
            <Pill x={540} y={260} text="SAAT DEĞİL, TOPLAM KALORİ" o={sm(t, L(8) - 0.1, L(8) + 0.2)} color={Y} size={48} />
          </g>
        ) : null}

        {/* ===== 9-11: 3. "Şanslı değiller" ===== */}
        {s9 > 0 ? (
          <g opacity={s9}>
            {t < L(10) ? (
              <Who uid="kiz9" look={GIRL_LOOK} x={540} s={1.0} t={t} pose={{ r: { el: [300, 540], wr: [320, 450], hand: "open" }, head: 6 }} expr="grin" />
            ) : null}
            {/* merdiven: fark etmeden sürekli hareket */}
            {st > 0 ? (
              <g opacity={st}>
                <Stairs />
                <Who
                  uid="kiz10"
                  look={GIRL_LOOK}
                  x={girlP[0]}
                  y={girlP[1] - hop}
                  s={0.72}
                  t={t}
                  pose={{ r: { el: [300, 500], wr: mixP([290, 600], [320, 560], stepF) }, l: { el: [100, 500], wr: mixP([110, 560], [80, 600], stepF) } }}
                  expr="smile"
                />
                <rect x={70} y={420} width={400} height={170} rx={34} fill="#ffffff" stroke={INK} strokeWidth={8} />
                <Txt x={270} y={480} size={38} fill={INK} sw={0}>
                  BUGÜN ADIM
                </Txt>
                <Txt x={270} y={560} size={74} fill={GREEN} sw={0}>
                  {fmt(steps)}
                </Txt>
                <Pill x={540} y={300} text="FARK ETMEDEN HAREKET" o={1} color={Y} size={50} />
              </g>
            ) : null}
            {/* sen: 1 saat spor → kanepe | o: oturduğu yerde bile kıpır kıpır */}
            {sp > 0 ? (
              <g opacity={sp}>
                <line x1={540} y1={220} x2={540} y2={FLOOR} stroke={INK} strokeWidth={5} strokeDasharray="18 18" opacity={0.3} />
                <g opacity={sm(t, lazy - 0.2, lazy + 0.1)}>
                  <Sofa x={60} />
                </g>
                <Who
                  uid="bora11"
                  x={270}
                  s={0.86}
                  t={t}
                  pose={t < lazy - 0.1 ? { r: { el: [330, 470], wr: [330, 340 + Math.sin(t * 6) * 40] } } : { r: { el: [300, 470], wr: [236, 286], hand: "open" }, head: 6 }}
                  expr={t < lazy - 0.1 ? "grin" : "yawn"}
                  item={t < lazy - 0.1 ? <Dumbbell x={0} y={0} s={0.45} rot={90} /> : undefined}
                />
                <Who
                  uid="kiz11"
                  look={GIRL_LOOK}
                  x={810}
                  y={FLOOR - Math.abs(Math.sin(t * 5)) * 12}
                  s={0.86}
                  t={t}
                  pose={{ r: { el: [300, 500], wr: [330 + Math.sin(t * 5) * 20, 580] }, l: { el: [100, 500], wr: [70 - Math.sin(t * 5) * 20, 580] } }}
                  expr="smile"
                />
                <Pill x={270} y={400} text={t < lazy - 0.1 ? "1 SAAT SPOR" : "SONRA KANEPE"} o={1} color="#ffffff" size={46} />
                <Pill x={810} y={400} text="BÜTÜN GÜN HAREKET" o={1} color={GREEN} ink="#fff" size={40} />
                {t > lazy ? (
                  <g opacity={sm(t, lazy, lazy + 0.3)}>
                    {["Z", "z"].map((z, k) => (
                      <Txt key={k} x={380 + k * 50} y={620 - k * 60 - ((t * 30) % 20)} size={70 - k * 16} fill="#ffffff">
                        {z}
                      </Txt>
                    ))}
                  </g>
                ) : null}
                {[0, 1, 2].map((k) => {
                  const ph = ((t * 0.9 + k / 3) % 1 + 1) % 1;
                  return (
                    <g key={k} opacity={sm(t, W(11, 7), W(11, 7) + 0.3) * Math.sin(ph * Math.PI)}>
                      <Flame x={700 + k * 110} y={700 - ph * 160} s={0.5} t={t} />
                    </g>
                  );
                })}
              </g>
            ) : null}
            <BigNum n={3} t={t} at={L(9)} />
            <MythCard n={3} lines={["“ONLAR", "ŞANSLI”"]} p={cardIn(9) * (1 - sm(t, L(10) - 0.3, L(10)))} stamp={sm(t, W(9, 2) - 0.05, W(9, 2) + 0.25)} icon={<Clover x={700} y={330} s={0.9} />} />
          </g>
        ) : null}

        {/* ===== 12: şans değil, alışkanlık ===== */}
        {s12 > 0 ? (
          <g opacity={s12}>
            <Who uid="bora12" x={300} s={1.05} t={t} pose={{ r: { el: [300, 560], wr: [330, 470], hand: "thumb" } }} expr="smile" />
            <Who uid="kiz12" look={GIRL_LOOK} x={780} s={1.05} t={t} pose={{ l: { el: [100, 560], wr: [70, 470], hand: "thumb" } }} expr="grin" />
            <g opacity={sm(t, W(12, 1) - 0.2, W(12, 1) + 0.1)}>
              <Pill x={540} y={300} text="ŞANS" o={1} color="#ffffff" size={76} />
              <line x1={420} y1={300} x2={660} y2={276} stroke={RED} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sm(t, W(12, 2) - 0.1, W(12, 2) + 0.3)} />
            </g>
            <g opacity={sm(t, W(12, 3) - 0.15, W(12, 3) + 0.15)}>
              <Pill x={540} y={470} text="ALIŞKANLIK" o={1} color={GREEN} ink="#fff" size={84} />
              <Check x={860} y={455} s={44} p={sm(t, W(12, 3), W(12, 3) + 0.4)} />
            </g>
          </g>
        ) : null}

        {/* ===== 13: kapanış — yorum ===== */}
        {s13 > 0 ? (
          <g opacity={s13}>
            <Who uid="bora13" x={300} s={0.8} t={t} pose={{ r: { el: [290, 500], wr: [228, 300] } }} expr="think" />
            <Who uid="kiz13" look={GIRL_LOOK} x={780} s={0.8} t={t} pose={{ r: { el: [320, 430], wr: [328, 310], hand: "point", handRot: -20 } }} expr="grin" />
            <Txt x={540} y={230} size={100} fill="#ffffff" sw={18}>
              HANGİSİNE
            </Txt>
            <Txt x={540} y={340} size={100} fill="#ffffff" sw={18}>
              İNANIYORDUN?
            </Txt>
            {["AZ YİYOR", "GECE", "ŞANS"].map((s, k) => {
              const x = 230 + k * 310;
              const o = sm(t, L(13) + 0.15 + k * 0.12, L(13) + 0.45 + k * 0.12);
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
            <g opacity={sm(t, W(13, 2) - 0.15, W(13, 2) + 0.15)}>
              <CommentIcon x={200} y={650 + Math.sin(t * 3) * 6} s={0.9} />
              <Txt x={600} y={676} size={80} fill={Y} sw={16}>
                YORUMLARA YAZ!
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
