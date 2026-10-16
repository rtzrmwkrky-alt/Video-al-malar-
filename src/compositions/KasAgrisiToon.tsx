/**
 * Kas ağrısı — düz çizgi karikatür sürümü (≤30 sn, Reels). Bej kâğıt zemin, kalın konturlu kız,
 * kasın içinde sevimli "tamir hücreleri". Altyazı 3 kelimelik parçalar, vurgu sarı.
 * Seslendirme varsa (public/audio/<ad>.json) satır ve altyazı zamanları kelime zamanlarından gelir;
 * yoksa okuma hızından hesaplanır (sessiz önizleme).
 */
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, pop as rawPop, sm, timeline, win } from "../ornek/common";
import { INK, ToonGirl2D, blinkAt, type Expr, type ToonPose } from "../cartoon/ToonGirl2D";

loadFonts();

/** yumuşak beliriş: zıplamasız, göz yormayan yay */
const pop = (t: number, at: number, fps = 30, damping = 20) => rawPop(t, at, fps, Math.max(20, damping));

const Y = "#FF6B5B"; // vurgu (mercan)
const PAPER = "#cfe6f2";
const MUSCLE = "#e8707a";
const MUSCLE_D = "#c94e5a";

export const TOON_LINES: Line[] = [
  { text: "Spordan iki gün sonra merdivenleri böyle iniyorsan…", hl: ["iki", "gün", "sonra"], hold: 0.4 },
  { text: "Suçlu laktik asit değil. O, bir saat içinde kanından temizlenir.", hl: ["değil.", "bir", "saat"] },
  { text: "Asıl hikâye kasının içinde. Hadi yakından bakalım.", hl: ["kasının", "içinde."], hold: 2.4 },
  { text: "Squatta aşağı inerken kas hem uzar hem kasılır.", hl: ["uzar", "kasılır."], hold: 0.4 },
  { text: "Bu zorlanma, kas liflerinde mikroskobik yırtıklar açar.", hl: ["mikroskobik", "yırtıklar"], hold: 0.4 },
  { text: "Birkaç saat sonra vücut alarm verir, bağışıklık hücreleri bölgeye akın eder.", hl: ["bağışıklık", "hücreleri"], hold: 0.4 },
  { text: "Bölgede sıvı toplanır, sinir uçları hassaslaşır. Ağrının kaynağı bu.", hl: ["sinir", "uçları"], hold: 0.4 },
  { text: "Bu yüzden ağrı 24 ile 72 saat arasında zirve yapar.", hl: ["24", "72", "saat"] },
  { text: "Bu sırada uydu hücreler devreye girer ve lifleri onarır.", hl: ["uydu", "hücreler"], hold: 0.4 },
  { text: "Onarılan lif daha güçlü olur. Aynı antrenman bir dahaki sefere çok daha az acıtır.", hl: ["güçlü", "az"] },
  { text: "Ağrıyı hafifletmek için hafif yürüyüş, iyi uyku, yeterli protein ve bol su.", hl: ["yürüyüş,", "uyku,", "protein", "su."], hold: 0.4 },
  { text: "Bu videoyu kaydet, ilk ağrıda hatırla!", hl: ["kaydet,"], hold: 1.0 },
];

export const TOON_TL = timeline(TOON_LINES, 0.2);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

/** seslendirmeden zaman çizelgesi: her satır ilk kelimesinin başladığı anda başlar */
export const VOICE_TAIL = 1.8;
const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of TOON_LINES) {
    offs.push(o);
    o += l.text.split(/\s+/).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + VOICE_TAIL;
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

// ------------------------------------------------------------ zemin

const Paper: React.FC<{ t: number; tint?: string }> = ({ t, tint }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="pp" cx="50%" cy="45%" r="75%">
        <stop offset="0" stopColor={tint ?? "#e9f5fb"} />
        <stop offset="0.65" stopColor={tint ? tint : PAPER} />
        <stop offset="1" stopColor={tint ? "#e7b3a8" : "#9cc3d8"} />
      </radialGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={3} />
        <feColorMatrix values="0 0 0 0 0.12  0 0 0 0 0.16  0 0 0 0 0.27  0 0 0 0.08 0" />
      </filter>
    </defs>
    <rect width={1080} height={1920} fill="url(#pp)" />
    <rect width={1080} height={1920} filter="url(#grain)" />
    {Array.from({ length: 9 }).map((_, i) => {
      const x = (i * 271 + 90) % 1080;
      const y = ((i * 431 + 200 - t * (8 + (i % 3) * 3)) % 1920 + 1920) % 1920;
      return <circle key={i} cx={x} cy={y} r={30 + (i % 4) * 22} fill="#fff" opacity={0.18} />;
    })}
  </svg>
);

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL; top?: number }> = ({ t, tl, top = 1440 }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const line = TOON_LINES[i];
  const words = line.text.split(/\s+/);
  const chunks: string[][] = [];
  for (let k = 0; k < words.length; ) {
    const n = words.length - k === 4 ? 2 : Math.min(3, words.length - k);
    chunks.push(words.slice(k, k + n));
    k += n;
  }
  const s = tl.at(i);
  const e = tl.at(i + 1) - (line.hold ?? 0);
  const per = (e - s) / chunks.length;
  const firstIdx = chunks.map((_, n) => chunks.slice(0, n).reduce((a, ch) => a + ch.length, 0));
  let c = Math.min(chunks.length - 1, Math.floor((t - s) / per));
  if (tl.wordAt) {
    c = 0;
    while (c + 1 < chunks.length && t >= tl.wordAt(i, firstIdx[c + 1]) - 0.04) c++;
  }
  const cs = s + c * per;
  const wordT = (k: number) => (tl.wordAt ? tl.wordAt(i, firstIdx[c] + k) - 0.06 : cs + k * 0.05);
  const hl = (line.hl ?? []).map(norm);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top, textAlign: "center" }}>
      {chunks[c].map((w, k) => {
        const p = sm(t, wordT(k), wordT(k) + 0.16);
        const isHl = hl.includes(norm(w));
        return (
          <span
            key={`${c}-${k}`}
            style={{
              display: "inline-block",
              margin: "0 12px",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 92,
              letterSpacing: -1.5,
              color: isHl ? Y : "#ffffff",
              WebkitTextStroke: `14px ${INK}`,
              paintOrder: "stroke",
              textShadow: "0 8px 0 rgba(31,42,68,0.3)",
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

// ------------------------------------------------------------ çizim parçaları

const Stairs: React.FC = () => (
  <g>
    {[0, 1, 2, 3, 4].map((k) => (
      <rect key={k} x={140 + k * 170} y={1030 + k * 95} width={1000} height={95} fill={k % 2 ? "#f4f0e8" : "#e6dfd2"} stroke={INK} strokeWidth={7} />
    ))}
    <line x1={60} y1={1030} x2={140} y2={1030} stroke={INK} strokeWidth={7} />
    <rect x={-20} y={1030} width={160} height={600} fill="#e6dfd2" stroke={INK} strokeWidth={7} />
  </g>
);

const Sweat: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const k = (t * 1.6) % 1;
  return <path transform={`translate(${x},${y + k * 60})`} d="M0,-22 C14,0 16,10 0,20 C-16,10 -14,0 0,-22 Z" fill="#8fd3ff" stroke={INK} strokeWidth={5} opacity={1 - k} />;
};

const Burst: React.FC<{ x: number; y: number; text: string; p: number; color?: string; rot?: number; size?: number }> = ({ x, y, text, p, color = "#ff5a4e", rot = -8, size = 1 }) => {
  if (p <= 0) return null;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 ? 95 : 130;
    return `${Math.cos(a) * r * 1.3},${Math.sin(a) * r}`;
  }).join(" ");
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${p * size})`}>
      <polygon points={pts} fill={color} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <text y={22} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={68} fill="#fff" stroke={INK} strokeWidth={10} paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};

const Bottle: React.FC<{ x: number; y: number; p: number; cross: number }> = ({ x, y, p, cross }) => (
  <g transform={`translate(${x},${y}) scale(${p}) rotate(${(1 - p) * 20})`} opacity={Math.min(1, p * 2)}>
    <rect x={-35} y={-210} width={70} height={60} rx={10} fill="#e0e6ee" stroke={INK} strokeWidth={7} />
    <path d="M-35,-150 L-100,40 Q-110,90 -60,90 L60,90 Q110,90 100,40 L35,-150 Z" fill="#cfeeff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-80,0 L80,0 L98,45 Q105,82 60,82 L-60,82 Q-105,82 -98,45 Z" fill="#9ae6b4" opacity={0.9} />
    <rect x={-85} y={-80} width={170} height={56} rx={10} fill="#fff" stroke={INK} strokeWidth={5} />
    <text y={-42} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill={INK}>
      LAKTİK ASİT
    </text>
    <g opacity={cross > 0 ? 1 : 0}>
      <line x1={-150} y1={-230} x2={-150 + 300 * cross} y2={-230 + 340 * cross} stroke="#ff4b3e" strokeWidth={26} strokeLinecap="round" />
      <line x1={150} y1={-230} x2={150 - 300 * cross} y2={-230 + 340 * cross} stroke="#ff4b3e" strokeWidth={26} strokeLinecap="round" />
    </g>
  </g>
);

/** kasın içi: çizgili lif sosisleri */
const FIBERS = [760, 930, 1100];
const FiberRow: React.FC<{ y: number; stretch: number; thick: number; t: number; idx: number }> = ({ y, stretch, thick, t, idx }) => {
  const w = 860 * (1 + 0.12 * stretch);
  const h = 130 * thick;
  const x = 540 - w / 2;
  return (
    <g>
      <rect x={x} y={y - h / 2} width={w} height={h} rx={h / 2} fill={MUSCLE} stroke={INK} strokeWidth={8} />
      {Array.from({ length: 22 }).map((_, k) => {
        const sx = x + 40 + k * ((w - 80) / 21);
        return <line key={k} x1={sx} y1={y - h / 2 + 14} x2={sx} y2={y + h / 2 - 14} stroke={MUSCLE_D} strokeWidth={6} strokeLinecap="round" opacity={0.75} />;
      })}
      <rect x={x + 30} y={y - h / 2 + 14} width={w - 60} height={14} rx={7} fill="#fff" opacity={0.35} />
      {/* gerilme okları */}
      {stretch > 0.05 && idx === 1 ? (
        <g opacity={stretch} stroke={INK} strokeWidth={9} strokeLinecap="round" fill="none">
          <path d={`M${x - 30},${y} l-60,0 m25,-25 l-25,25 l25,25`} />
          <path d={`M${x + w + 30},${y} l60,0 m-25,-25 l25,25 l-25,25`} />
        </g>
      ) : null}
      {void t}
    </g>
  );
};

const TEARS: [number, number][] = [
  [330, 760],
  [640, 930],
  [430, 1100],
  [760, 1100],
];

const Tear: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) =>
  p > 0 ? (
    <g transform={`translate(${x},${y}) scale(${p})`}>
      <path d="M-10,-60 L12,-25 L-12,0 L12,25 L-10,60" stroke="#5a1520" strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-10,-60 L12,-25 L-12,0 L12,25 L-10,60" stroke="#ff9a9a" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ) : null;

const Star: React.FC<{ x: number; y: number; s: number; color?: string }> = ({ x, y, s, color = Y }) => (
  <path
    transform={`translate(${x},${y}) scale(${s})`}
    d="M0,-30 L8,-9 L30,-9 L12,4 L19,26 L0,12 L-19,26 L-12,4 L-30,-9 L-8,-9 Z"
    fill={color}
    stroke={INK}
    strokeWidth={5}
    strokeLinejoin="round"
  />
);

/** sevimli tamir hücresi: kask + anahtar */
const Fixer: React.FC<{ x: number; y: number; t: number; k: number }> = ({ x, y, t, k }) => {
  const hop = Math.abs(Math.sin(t * 5 + k)) * -12;
  return (
    <g transform={`translate(${x},${y + hop})`}>
      <circle r={46} fill="#fffaf0" stroke={INK} strokeWidth={7} />
      <circle cx={-15} cy={-4} r={6} fill={INK} />
      <circle cx={15} cy={-4} r={6} fill={INK} />
      <path d="M-14,14 Q0,26 14,14" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M-46,-22 Q-44,-70 0,-72 Q44,-70 46,-22 Z" fill="#f2c94c" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-54} y={-28} width={108} height={14} rx={7} fill="#f2c94c" stroke={INK} strokeWidth={6} />
      <g transform={`translate(50,20) rotate(${Math.sin(t * 10 + k) * 25})`}>
        <rect x={-6} y={-6} width={12} height={46} rx={5} fill="#b8c0cc" stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={-10} r={13} fill="#b8c0cc" stroke={INK} strokeWidth={5} />
      </g>
    </g>
  );
};

const Bandage: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) =>
  p > 0 ? (
    <g transform={`translate(${x},${y}) rotate(-20) scale(${p})`}>
      <rect x={-70} y={-26} width={140} height={52} rx={26} fill="#f7d7b0" stroke={INK} strokeWidth={6} />
      <rect x={-24} y={-26} width={48} height={52} fill="#efc394" stroke={INK} strokeWidth={4} />
      {[-10, 10].map((dx) => [-10, 10].map((dy) => <circle key={`${dx}${dy}`} cx={dx} cy={dy} r={3} fill={INK} opacity={0.5} />))}
    </g>
  ) : null;

const Brain: React.FC<{ x: number; y: number; t: number; p: number }> = ({ x, y, t, p }) => (
  <g transform={`translate(${x},${y}) scale(${p})`}>
    <path d="M-90,10 C-120,-40 -80,-95 -30,-85 C-10,-120 60,-115 70,-70 C120,-60 120,10 85,25 C85,70 20,80 0,55 C-30,80 -100,65 -90,10 Z" fill="#f6b3c4" stroke={INK} strokeWidth={7} />
    <path d="M-50,-40 Q-20,-20 -40,10 M10,-70 Q0,-30 30,-20 M40,10 Q20,30 50,45" stroke="#c97a8f" strokeWidth={6} fill="none" strokeLinecap="round" />
    <circle cx={-25} cy={-5} r={7} fill={INK} />
    <circle cx={25} cy={-5} r={7} fill={INK} />
    <ellipse cx={0} cy={25} rx={12} ry={14} fill="#7a2a2a" stroke={INK} strokeWidth={4} transform={`scale(1,${0.85 + 0.15 * Math.sin(t * 6)})`} />
  </g>
);

const Bubble: React.FC<{ x: number; y: number; text: string; p: number }> = ({ x, y, text, p }) =>
  p > 0 ? (
    <g transform={`translate(${x},${y}) scale(${p})`}>
      <rect x={-150} y={-60} width={300} height={110} rx={50} fill="#fff" stroke={INK} strokeWidth={7} />
      <path d="M-30,48 L-60,95 L10,48 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-34} y={40} width={50} height={12} fill="#fff" />
      <text y={14} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={58} fill="#e5383b">
        {text}
      </text>
    </g>
  ) : null;

/** 1–3 gün kartları */
const DayCards: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const lv = [0.35, 0.95, 0.65];
  const ex: Expr[] = ["think", "ouch", "grit"];
  return (
    <g>
      {[0, 1, 2].map((d) => {
        const p = pop(t, s + d * 0.22, 30, 11);
        const x = 220 + d * 320;
        const fill = lv[d] * sm(t, s + 0.4 + d * 0.2, s + 0.9 + d * 0.2);
        return (
          <g key={d} transform={`translate(${x},1000) scale(${p})`} opacity={Math.min(1, p * 2)}>
            <rect x={-140} y={-300} width={280} height={560} rx={36} fill="#fffaf0" stroke={INK} strokeWidth={8} />
            <text y={-235} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={50} fill={INK}>
              {(d + 1) * 24} SAAT
            </text>
            <text y={-188} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={32} fill={INK} opacity={0.6}>
              {d + 1}. gün
            </text>
            <g transform="translate(0,150) scale(0.36)">
              <ToonGirl2D expr={ex[d]} pose={{}} />
            </g>
            <rect x={-100} y={185} width={200} height={40} rx={20} fill="#efe2c8" stroke={INK} strokeWidth={6} />
            <rect x={-97} y={188} width={194 * fill} height={34} rx={17} fill={d === 1 ? "#ff5a4e" : "#ffa94d"} />
          </g>
        );
      })}
    </g>
  );
};

/** öneri simgeleri */
const Tip: React.FC<{ x: number; y: number; p: number; kind: number; t: number }> = ({ x, y, p, kind, t }) => (
  <g transform={`translate(${x},${y}) scale(${p})`} opacity={Math.min(1, p * 2)}>
    <circle r={105} fill="#fffaf0" stroke={INK} strokeWidth={8} />
    {kind === 0 ? (
      <g>
        <path d="M-60,20 Q-62,-30 -30,-30 L10,-28 Q30,-10 55,-2 Q75,4 70,30 L-60,30 Z" fill="#ff7a6b" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <rect x={-64} y={28} width={138} height={16} rx={8} fill="#fff" stroke={INK} strokeWidth={6} />
      </g>
    ) : null}
    {kind === 1 ? (
      <g>
        <path d="M20,-60 A62,62 0 1 0 50,40 A50,50 0 1 1 20,-60 Z" fill="#f2c94c" stroke={INK} strokeWidth={7} />
        <text x={40} y={-30} fontFamily={SANS} fontWeight={800} fontSize={38} fill={INK} opacity={0.5 + 0.5 * Math.sin(t * 4)}>
          z
        </text>
      </g>
    ) : null}
    {kind === 2 ? (
      <g>
        <ellipse rx={56} ry={70} fill="#fff" stroke={INK} strokeWidth={7} />
        <circle cy={10} r={30} fill="#ffb627" stroke={INK} strokeWidth={5} />
      </g>
    ) : null}
    {kind === 3 ? (
      <g>
        <path d="M-45,-60 L45,-60 L35,70 L-35,70 Z" fill="#dff4ff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d={`M-40,${-5 + Math.sin(t * 3) * 5} L40,${-5 - Math.sin(t * 3) * 5} L35,66 L-35,66 Z`} fill="#6cc4ff" />
        <path d="M-45,-60 L45,-60 L35,70 L-35,70 Z" fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      </g>
    ) : null}
    <g transform="translate(70,70)" opacity={p > 0.9 ? 1 : 0}>
      <circle r={30} fill="#3ccf6e" stroke={INK} strokeWidth={6} />
      <path d="M-12,0 L-3,10 L14,-10" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </g>
);

// ------------------------------------------------------------ detaylı anatomi (karikatür)

/** küçük etiket: beyaz hap + çizgi */
const Tag: React.FC<{ x: number; y: number; tx: number; ty: number; text: string; o: number; color?: string }> = ({ x, y, tx, ty, text, o, color = "#fff" }) =>
  o > 0 ? (
    <g opacity={o}>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke={INK} strokeWidth={6} />
      <circle cx={x} cy={y} r={10} fill={INK} />
      <g transform={`translate(${tx},${ty}) scale(${0.85 + 0.15 * o})`}>
        <rect x={-(text.length * 17 + 50) / 2} y={-38} width={text.length * 17 + 50} height={72} rx={36} fill={color} stroke={INK} strokeWidth={6} />
        <text y={12} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill={INK}>
          {text}
        </text>
      </g>
    </g>
  ) : null;

/** A: bacak — taytın içinden kas görünür (kesit penceresi) */
const CLeg: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <path d="M380,520 C350,700 360,900 400,1080 L420,1300 L660,1300 L680,1080 C720,900 730,700 700,520 Z" fill="#2f4a7a" stroke={INK} strokeWidth={9} />
    <line x1={640} y1={540} x2={650} y2={1290} stroke="#9fd8ff" strokeWidth={10} />
    {/* kesit penceresi */}
    <clipPath id="legwin">
      <ellipse cx={540} cy={830} rx={135} ry={230} />
    </clipPath>
    <g clipPath="url(#legwin)">
      <rect x={380} y={580} width={320} height={500} fill="#f3a3a3" />
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M${430 + k * 70},600 C${415 + k * 70},760 ${420 + k * 70},900 ${450 + k * 60},1060 L${490 + k * 60},1060 C${470 + k * 70},900 ${465 + k * 70},760 ${480 + k * 70},600 Z`} fill={MUSCLE} stroke={INK} strokeWidth={6} />
      ))}
    </g>
    <ellipse cx={540} cy={830} rx={135} ry={230} fill="none" stroke={INK} strokeWidth={9} strokeDasharray="22 14" />
    <circle cx={540} cy={830} r={190} fill="#ff6b5b" opacity={0.12 + 0.08 * Math.sin(t * 6)} />
  </g>
);

/** B: kas demetleri (kesit) */
const CBundles: React.FC = () => {
  const rows = [3, 4, 5, 4, 3];
  const els: React.ReactNode[] = [];
  rows.forEach((n, r) =>
    Array.from({ length: n }).forEach((_, k) => {
      const x = 540 + (k - (n - 1) / 2) * 140;
      const y = 640 + r * 135;
      els.push(
        <g key={`${r}${k}`}>
          <circle cx={x} cy={y} r={62} fill={MUSCLE} stroke={INK} strokeWidth={7} />
          {[0, 1, 2, 3, 4, 5, 6].map((j) => {
            const a = (j / 6) * Math.PI * 2;
            const rr = j === 6 ? 0 : 33;
            return <circle key={j} cx={x + Math.cos(a) * rr} cy={y + Math.sin(a) * rr} r={13} fill="#f7b0b0" stroke={INK} strokeWidth={3} />;
          })}
        </g>,
      );
    }),
  );
  return (
    <g>
      <ellipse cx={540} cy={910} rx={390} ry={355} fill="#f7d7cf" stroke={INK} strokeWidth={9} />
      {els}
    </g>
  );
};

/** C: tek büyük lif */
const CFiber: React.FC<{ y?: number; thick?: number; glow?: number }> = ({ y = 930, thick = 1, glow = 0 }) => {
  const h = 230 * thick;
  return (
    <g>
      {glow > 0 ? <rect x={86} y={y - h / 2 - 24} width={908} height={h + 48} rx={h / 2 + 24} fill="#7ee08a" opacity={0.35 * glow} /> : null}
      <rect x={110} y={y - h / 2} width={860} height={h} rx={h / 2} fill={MUSCLE} stroke={INK} strokeWidth={9} />
      {Array.from({ length: 24 }).map((_, k) => (
        <line key={k} x1={170 + k * 32} y1={y - h / 2 + 20} x2={170 + k * 32} y2={y + h / 2 - 20} stroke={MUSCLE_D} strokeWidth={7} strokeLinecap="round" opacity={0.7} />
      ))}
      <rect x={150} y={y - h / 2 + 18} width={780} height={18} rx={9} fill="#fff" opacity={0.35} />
      {[260, 520, 780].map((nx, k) => (
        <ellipse key={k} cx={nx} cy={y + h / 2 - 22} rx={38} ry={14} fill="#7b5cc4" stroke={INK} strokeWidth={4} />
      ))}
    </g>
  );
};

/** D: sarkomer — Z çizgileri, miyozin (mor), aktin (mavi) */
const CSarcomere: React.FC<{ t: number; stretch: number; torn: number }> = ({ t, stretch, torn }) => {
  const cx = 540;
  const half = 185 * (1 + 0.25 * stretch);
  const y0 = 760;
  const rows = 4;
  const dy = 95;
  const zs = [cx - half * 2, cx, cx + half * 2];
  const els: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * dy;
    const wob = torn * Math.sin(r * 2.1 + t * 4) * 12;
    zs.forEach((zx, k) => {
      if (k > 0) els.push(<rect key={`al${r}${k}`} x={zx - 150} y={y + 22 + wob} width={150} height={12} rx={6} fill="#6cc4ff" stroke={INK} strokeWidth={3} />);
      if (k < 2) els.push(<rect key={`ar${r}${k}`} x={zx} y={y + 22 + wob} width={150} height={12} rx={6} fill="#6cc4ff" stroke={INK} strokeWidth={3} />);
    });
    [cx - half, cx + half].forEach((mc, k) => {
      els.push(<rect key={`m${r}${k}`} x={mc - 115} y={y - 14 + wob} width={230} height={26} rx={13} fill="#a78bfa" stroke={INK} strokeWidth={4} />);
      for (let h = 0; h < 8; h++) {
        const hx = mc - 98 + h * 28;
        const a = Math.sin(t * 5 + h + r) * 0.5 + (h < 4 ? -0.5 : 0.5);
        els.push(<circle key={`h${r}${k}${h}`} cx={hx + Math.sin(a) * 10} cy={y - 26 + wob} r={7} fill="#d6c7ff" stroke={INK} strokeWidth={3} />);
      }
    });
  }
  zs.forEach((zx, k) => {
    const pts: string[] = [];
    for (let s = 0; s <= 9; s++) {
      const yy = y0 - 60 + s * 46;
      const brk = torn * (k === 1 ? 1 : 0.55) * (s % 2 ? 1 : -1) * (s > 2 && s < 7 ? 30 : 6);
      pts.push(`${zx + (s % 2 ? 12 : -12) + brk},${yy}`);
    }
    els.push(<polyline key={`z${k}`} points={pts.join(" ")} fill="none" stroke={INK} strokeWidth={11} strokeLinejoin="round" />);
    els.push(<polyline key={`zw${k}`} points={pts.join(" ")} fill="none" stroke="#fff6e8" strokeWidth={5} strokeLinejoin="round" />);
  });
  return (
    <g>
      <rect x={60} y={y0 - 100} width={960} height={rows * dy + 120} rx={40} fill="#fff4ef" stroke={INK} strokeWidth={9} />
      {els}
    </g>
  );
};

/** squat yapan mini kız (sarkomer sahnesinde köşede) */
const MiniSquat: React.FC<{ t: number; o: number }> = ({ t, o }) => {
  const k = (1 - Math.cos(t * 3.2)) / 2;
  const down = Math.sin(t * 3.2) > 0;
  return o > 0 ? (
    <g opacity={o}>
      <rect x={760} y={300} width={240} height={330} rx={30} fill="#fff" stroke={down ? "#ff6b5b" : INK} strokeWidth={8} />
      <g transform={`translate(880,610) scale(0.28)`}>
        <ToonGirl2D pose={{ armL: 80, armR: 80, legL: -25 * k, legR: 25 * k, bob: 160 * k, lean: 0 }} expr="grit" />
      </g>
      <text x={880} y={350} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={down ? "#ff6b5b" : INK}>
        {down ? "İNERKEN ↓" : "ÇIKARKEN ↑"}
      </text>
    </g>
  ) : null;
};

/** bağışıklık hücreleri: nötrofil (beyaz, mor loblu), makrofaj (turuncu, koca ağız) */
const Neutro: React.FC<{ x: number; y: number; t: number; k: number }> = ({ x, y, t, k }) => (
  <g transform={`translate(${x},${y + Math.abs(Math.sin(t * 5 + k)) * -10})`}>
    <circle r={44} fill="#fff" stroke={INK} strokeWidth={7} />
    {[
      [-14, -16],
      [14, -18],
      [0, 6],
    ].map(([a, b], j) => (
      <circle key={j} cx={a} cy={b + 6} r={11} fill="#c4b5fd" stroke={INK} strokeWidth={3} />
    ))}
    <circle cx={-12} cy={-6} r={5} fill={INK} />
    <circle cx={12} cy={-6} r={5} fill={INK} />
    <path d="M-10,14 Q0,22 10,14" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
  </g>
);
const Macro: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const pts = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const r = 62 + 10 * Math.sin(a * 3 + t * 3);
    return `${Math.cos(a) * r},${Math.sin(a) * r}`;
  }).join(" ");
  const chomp = (Math.sin(t * 5) + 1) / 2;
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={pts} fill="#ffb454" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <circle cx={-18} cy={-14} r={7} fill={INK} />
      <circle cx={18} cy={-14} r={7} fill={INK} />
      <ellipse cx={0} cy={18} rx={20} ry={6 + 12 * chomp} fill="#7a2a2a" stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** uydu hücre: yeşil, sevimli */
const Sat: React.FC<{ x: number; y: number; t: number; k: number; s?: number }> = ({ x, y, t, k, s = 1 }) => (
  <g transform={`translate(${x},${y + Math.abs(Math.sin(t * 5 + k)) * -10}) scale(${s})`}>
    <circle r={40} fill="#7ee08a" stroke={INK} strokeWidth={7} />
    <circle cx={-12} cy={-6} r={5} fill={INK} />
    <circle cx={12} cy={-6} r={5} fill={INK} />
    <path d="M-10,10 Q0,20 10,10" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M-6,-40 Q0,-62 10,-58" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
    <circle cx={12} cy={-58} r={7} fill="#7ee08a" stroke={INK} strokeWidth={4} />
  </g>
);

/** yakınlaşma geçişi */
const Zoom: React.FC<{ t: number; a: number; b: number; fx: number; fy: number; first?: boolean; children: React.ReactNode }> = ({ t, a, b, fx, fy, first, children }) => {
  // önce eski kaybolur, sonra yeni gelir (üst üste binmez)
  const inK = first ? 1 : sm(t, a, a + 0.35);
  const outK = sm(t, b - 0.35, b);
  if (inK <= 0 || outK >= 1) return null;
  const s = (0.94 + 0.06 * inK) * (1 + outK * 0.12);
  return (
    <g opacity={inK * (1 - outK)} transform={`translate(${fx},${fy}) scale(${s}) translate(${-fx},${-fy})`}>
      {children}
    </g>
  );
};

/** saat rozeti */
const Clock: React.FC<{ x: number; y: number; p: number; t: number }> = ({ x, y, p, t }) =>
  p > 0 ? (
    <g transform={`translate(${x},${y}) scale(${p})`}>
      <circle r={80} fill="#fff" stroke={INK} strokeWidth={8} />
      <line x1={0} y1={0} x2={0} y2={-52} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${t * 240})`} />
      <line x1={0} y1={0} x2={34} y2={0} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <rect x={-110} y={95} width={220} height={64} rx={32} fill="#7ee08a" stroke={INK} strokeWidth={6} />
      <text y={140} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill={INK}>
        ~1 SAAT
      </text>
    </g>
  ) : null;

// ------------------------------------------------------------ ana video

export type KasAgrisiToonProps = { audioName: string; data: VoiceoverData | null };

export const KasAgrisiToon: React.FC<KasAgrisiToonProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : TOON_TL;
  const L = tl.at;
  const blink = blinkAt(t);

  const zoomIn = sm(t, L(2) + 0.3, L(2) + 1.3);
  const inside = t > L(2) + 0.6 && t < L(7) + 0.3;
  const insideIn = sm(t, L(2) + 0.6, L(2) + 1.3);
  const insideOut = sm(t, L(7) - 0.4, L(7) + 0.3);
  // yakınlaşma zinciri zamanları (satır 2 içinde)
  // yakınlaşma zinciri satır 2'nin süresine yayılır
  const d2 = L(3) - L(2);
  const zA = L(2) + d2 * 0.22;
  const zB = L(2) + d2 * 0.42;
  const zC = L(2) + d2 * 0.62;
  const zD = L(2) + d2 * 0.82;

  let pose: ToonPose = { armL: 10, armR: 10 };
  let expr: Expr = "smile";
  let gx = 540;
  let gy = 1330;
  let shake = 0;
  let gScale = 1;
  if (t < L(1)) {
    const step = sm(t, 0.9, 1.5);
    gx = 360 + step * 170;
    gy = 1030 + step * 95 - Math.sin(step * Math.PI) * 40;
    pose = { armL: 35 + Math.sin(t * 5) * 5, armR: 35, elbowL: 20, elbowR: 20, legL: -8 + step * 14, legR: 8 - step * 10, lean: -4 };
    expr = "ouch";
    shake = 1;
    gScale = 0.82;
  } else if (t < L(2)) {
    gx = 300;
    pose = { armL: 20, armR: 60, elbowR: 70, head: -6 };
    expr = "think";
  } else if (t < L(7)) {
    expr = "grit";
    shake = 0.4;
  } else if (t < L(9)) {
    expr = "ouch";
  } else if (t < L(10)) {
    const f = sm(t, L(9), L(9) + 0.4);
    pose = { armL: 10, armR: 90 * f, elbowR: 110 * f };
    expr = "happy";
    gx = 330;
  } else if (t < L(11)) {
    pose = { armL: 25, armR: 25 };
    gScale = 0.62;
    gy = 1180;
  } else {
    pose = { armL: 10, armR: 120, elbowR: 40 + Math.sin(t * 6) * 12 };
    expr = "wink";
  }
  const showGirl = t < L(2) + 1.2 || t > L(9);
  const zoomTf = `translate(540,1100) scale(${1 + zoomIn * 0.35}) translate(-540,-1100)`;

  return (
    <AbsoluteFill lang="tr" style={{ background: PAPER, overflow: "hidden" }}>
      <Paper t={t} />

      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={t > L(2) && t < L(7) ? zoomTf : undefined} opacity={t > L(2) && t < L(7) ? 1 - insideIn : 1}>
          {t < L(1) + 0.3 ? (
            <g opacity={1 - sm(t, L(1) - 0.3, L(1) + 0.3)}>
              <Stairs />
              <Burst x={760} y={560} text="AH!" p={pop(t, 0.35, 30, 9)} />
              <Sweat x={gx + 100} y={gy - 760} t={t} />
              <Sweat x={gx - 110} y={gy - 720} t={t + 0.4} />
            </g>
          ) : null}
          {t >= L(1) - 0.1 && t < L(2) + 0.3 ? (
            <g opacity={win(t, L(1) - 0.2, L(2) + 0.4, 0.4)}>
              <Bottle x={760} y={900} p={pop(t, L(1), 30, 11)} cross={sm(t, L(1) + 0.6, L(1) + 0.9)} />
              <Clock x={760} y={1180} p={pop(t, L(1) + 1.4, 30, 10)} t={t} />
            </g>
          ) : null}
          {showGirl && t < L(10) ? (
            <g opacity={t > L(9) - 0.1 ? sm(t, L(9), L(9) + 0.35) : 1}>
            <ToonGirl2D x={t >= L(2) && t < L(7) ? 540 : gx} y={gy} scale={gScale} pose={pose} expr={expr} blink={blink} shake={shake} t={t} />
            </g>
          ) : null}
          {t > L(2) - 0.05 && t < L(2) + 0.8 ? (
            <g opacity={sm(t, L(2), L(2) + 0.2)} transform={`translate(${interpolate(sm(t, L(2), L(2) + 0.5), [0, 1], [820, 500])},${interpolate(sm(t, L(2), L(2) + 0.5), [0, 1], [700, 1100])})`}>
              <circle r={90} fill="#ffffff" opacity={0.35} stroke={INK} strokeWidth={12} />
              <line x1={64} y1={64} x2={150} y2={150} stroke={INK} strokeWidth={26} strokeLinecap="round" />
            </g>
          ) : null}
        </g>

        {/* 24–72 saat (7) */}
        {t > L(7) - 0.2 && t < L(8) + 0.2 ? <g opacity={win(t, L(7) - 0.2, L(8) + 0.2, 0.4)}><DayCards t={t} s={L(7)} /></g> : null}

        {/* uydu hücreler (8): lif üzerinde yırtıkları kapatır */}
        {t > L(8) - 0.2 && t < L(9) ? (
          <g opacity={win(t, L(8) - 0.2, L(9), 0.35)}>
            <CFiber thick={1 + 0.15 * sm(t, L(8) + 2.0, L(8) + 2.8)} glow={sm(t, L(8) + 2.0, L(8) + 2.6)} />
            {[330, 620, 820].map((x, k) => (
              <Tear key={k} x={x} y={930} p={1 - sm(t, L(8) + 1.4 + k * 0.15, L(8) + 1.8 + k * 0.15)} />
            ))}
            {[330, 620, 820].map((x, k) => {
              const p = sm(t, L(8) + 0.2 + k * 0.2, L(8) + 1.2 + k * 0.2);
              return <Sat key={k} x={-80 + (x + 80) * p} y={930 - 175 + (1 - p) * 300} t={t} k={k} s={1 - 0.4 * sm(t, L(8) + 1.6 + k * 0.15, L(8) + 2.0 + k * 0.15)} />;
            })}
            <Tag x={260} y={780} tx={300} ty={560} text="uydu hücre" o={win(t, L(8) + 0.9, L(9), 0.2)} color="#c9f5cf" />
            <Tag x={540} y={810} tx={700} ty={1250} text="+ daha kalın lif" o={win(t, L(8) + 2.2, L(9), 0.2)} color="#c9f5cf" />
          </g>
        ) : null}

        {/* daha güçlü (9): kız kas yapar + ağrı çubukları */}
        {t > L(9) && t < L(10) ? (
          <g>
            {[0, 1, 2].map((k) => (
              <Star key={k} x={560 + k * 60} y={620 - k * 70} s={pop(t, L(9) + 0.4 + k * 0.15) * (0.95 + 0.08 * Math.sin(t * 4 + k))} />
            ))}
            <Burst x={780} y={430} text="GÜÇLÜ!" p={pop(t, L(9) + 0.5, 30, 9)} color="#3ccf6e" rot={6} size={0.8} />
            {[0.9, 0.35].map((v, k) => {
              const p = sm(t, L(9) + 1.4 + k * 0.5, L(9) + 2.0 + k * 0.5);
              return (
                <g key={k} transform={`translate(590,${1020 + k * 150})`} opacity={sm(t, L(9) + 1.2 + k * 0.5, L(9) + 1.5 + k * 0.5)}>
                  <text x={0} y={-20} fontFamily={SANS} fontWeight={800} fontSize={40} fill={INK}>
                    {k === 0 ? "1. sefer ağrı" : "2. sefer ağrı"}
                  </text>
                  <rect x={0} y={0} width={400} height={56} rx={28} fill="#fff" stroke={INK} strokeWidth={6} />
                  <rect x={4} y={4} width={392 * v * p} height={48} rx={24} fill={k === 0 ? "#ff6b5b" : "#7ee08a"} />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* öneriler (10) */}
        {t >= L(10) && t < L(11) ? (
          <g>
            <g opacity={sm(t, L(10), L(10) + 0.35)}><ToonGirl2D x={540} y={gy} scale={gScale} pose={pose} expr="smile" blink={blink} t={t} /></g>
            {[
              [250, 640],
              [830, 640],
              [250, 1020],
              [830, 1020],
            ].map(([x, y], k) => (
              <Tip key={k} x={x} y={y} p={pop(t, L(10) + 0.2 + k * 0.45, 30, 10)} kind={k} t={t} />
            ))}
          </g>
        ) : null}

        {/* kaydet (11) */}
        {t > L(11) ? (
          <g>
            <ToonGirl2D x={540} y={1330} pose={pose} expr="wink" blink={0} t={t} />
            <g transform={`translate(540,330) scale(${pop(t, L(11) + 0.2, 30, 10)})`}>
              <rect x={-240} y={-80} width={480} height={160} rx={80} fill="#ff6b5b" stroke={INK} strokeWidth={9} />
              <path d="M-170,-40 H-110 V48 L-140,26 L-170,48 Z" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
              <text x={40} y={24} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={72} fill="#fff" stroke={INK} strokeWidth={10} paintOrder="stroke">
                KAYDET
              </text>
              {t > L(11) + 0.8 ? <circle cx={150} cy={10} r={30 + 40 * sm(t, L(11) + 0.9, L(11) + 1.4)} fill="none" stroke="#fff" strokeWidth={8} opacity={1 - sm(t, L(11) + 0.9, L(11) + 1.4)} /> : null}
            </g>
          </g>
        ) : null}
      </svg>

      {/* ---- kasın içi ---- */}
      {inside ? (
        <AbsoluteFill style={{ opacity: insideIn * (1 - insideOut) }}>
          <Paper t={t} tint="#fde3dc" />
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <clipPath id="dive">
                <circle cx={540} cy={960} r={2000} />
              </clipPath>
            </defs>
            <g clipPath="url(#dive)">
              {/* yakınlaşma zinciri */}
              <Zoom t={t} a={zA} b={zB} fx={540} fy={830} first>
                <CLeg t={t} />
                <Tag x={540} y={830} tx={820} ty={560} text="ön bacak kası" o={win(t, zA + 0.2, zB, 0.2)} color="#ffd6d0" />
              </Zoom>
              <Zoom t={t} a={zB} b={zC} fx={540} fy={910}>
                <CBundles />
                <Tag x={540} y={910} tx={800} ty={500} text="kas demeti" o={win(t, zB + 0.3, zC, 0.2)} color="#ffd6d0" />
              </Zoom>
              <Zoom t={t} a={zC} b={zD} fx={540} fy={930}>
                <CFiber />
                <Tag x={540} y={815} tx={720} ty={600} text="kas lifi" o={win(t, zC + 0.3, zD, 0.2)} color="#ffd6d0" />
              </Zoom>

              {/* sarkomer: uzama (3), yırtık (4) */}
              {t > zD - 0.15 && t < L(5) + 0.3 ? (
                <g opacity={sm(t, zD - 0.25, zD + 0.35) * (1 - sm(t, L(5) - 0.35, L(5) + 0.3))}>
                  <CSarcomere t={t} stretch={t > L(3) ? (1 - Math.cos((t - L(3)) * 3.2)) / 2 : 0} torn={sm(t, L(4) + 0.2, L(4) + 0.9)} />
                  <Tag x={540 - 370} y={700} tx={230} ty={560} text="Z çizgisi" o={win(t, zD + 0.3, L(5), 0.2)} />
                  <Tag x={540 - 190} y={746} tx={520} ty={560} text="miyozin" o={win(t, zD + 0.5, L(4), 0.2)} color="#e4dbff" />
                  <Tag x={620} y={1077} tx={760} ty={1250} text="aktin" o={win(t, zD + 0.7, L(4), 0.2)} color="#d6efff" />
                  <MiniSquat t={t - L(3)} o={win(t, L(3), L(4) + 0.3, 0.25)} />
                  {t > L(4) + 0.3 ? <Burst x={820} y={560} text="ÇIT!" p={pop(t, L(4) + 0.35, 30, 9)} size={0.75} /> : null}
                  <Tag x={540} y={930} tx={420} ty={1250} text="mikro yırtık" o={win(t, L(4) + 0.6, L(5), 0.2)} color="#ffd6d0" />
                </g>
              ) : null}

              {/* lif: bağışıklık (5), sıvı + sinir (6) */}
              {t > L(5) - 0.2 && t < L(7) + 0.2 ? (
                <g opacity={sm(t, L(5) - 0.3, L(5) + 0.35)}>
                  {/* kılcal damar */}
                  <rect x={70} y={1170} width={940} height={80} rx={40} fill="#d8323f" stroke={INK} strokeWidth={8} />
                  {Array.from({ length: 9 }).map((_, k) => (
                    <ellipse key={k} cx={((k * 120 + t * 170) % 960) + 60} cy={1210} rx={26} ry={15} fill="#ff8a8a" stroke={INK} strokeWidth={3} />
                  ))}
                  <g transform={`translate(540,930) scale(${1 + 0.07 * sm(t, L(6), L(6) + 0.8)}) translate(-540,-930)`}>
                    <CFiber />
                  </g>
                  {[330, 620, 820].map((x, k) => (
                    <Tear key={k} x={x} y={930} p={1} />
                  ))}
                  {/* hücreler damardan çıkar */}
                  {[330, 620, 820].map((x, k) => {
                    const p = sm(t, L(5) + 0.4 + k * 0.3, L(5) + 1.4 + k * 0.3);
                    return p > 0 ? <Neutro key={k} x={x + 60} y={1210 - p * 445} t={t} k={k} /> : null;
                  })}
                  {[470, 720].map((x, k) => {
                    const p = sm(t, L(5) + 1.3 + k * 0.4, L(5) + 2.3 + k * 0.4);
                    return p > 0 ? <Macro key={k} x={x} y={1210 - p * 120} t={t} /> : null;
                  })}
                  <Tag x={390} y={740} tx={250} ty={520} text="nötrofil" o={win(t, L(5) + 1.5, L(6), 0.2)} color="#efe9ff" />
                  <Tag x={470} y={1060} tx={300} ty={1330} text="makrofaj" o={win(t, L(5) + 2.4, L(6), 0.2)} color="#ffe2b8" />
                  {/* sıvı + sinir → beyin */}
                  {t > L(6) - 0.1 ? (
                    <g opacity={sm(t, L(6) - 0.1, L(6) + 0.3)}>
                      {Array.from({ length: 8 }).map((_, k) => (
                        <path
                          key={k}
                          transform={`translate(${170 + k * 105},${k % 2 ? 1110 : 750}) scale(${pop(t, L(6) + k * 0.06)})`}
                          d="M0,-24 C14,0 17,10 0,22 C-17,10 -14,0 0,-24 Z"
                          fill="#8fd3ff"
                          stroke={INK}
                          strokeWidth={4}
                        />
                      ))}
                      <path d="M660,880 C680,760 770,680 820,590 C850,530 860,470 860,420" stroke="#f2c94c" strokeWidth={16} fill="none" strokeLinecap="round" />
                      {[0, 1, 2].map((k) => {
                        const u = (t * 1.6 + k / 3) % 1;
                        const bx = 660 + (860 - 660) * u + Math.sin(u * Math.PI) * 110;
                        const by = 880 + (420 - 880) * u;
                        return <circle key={k} cx={bx} cy={by} r={15} fill="#fff6a8" stroke={INK} strokeWidth={4} />;
                      })}
                      <Brain x={860} y={330} t={t} p={pop(t, L(6) + 0.3, 30, 10)} />
                      <Bubble x={480} y={300} text="ACIYOR!" p={pop(t, L(6) + 0.8, 30, 9)} />
                      <Tag x={760} y={640} tx={300} ty={560} text="sinir ucu" o={win(t, L(6) + 1.2, L(7), 0.2)} color="#fff3b0" />
                    </g>
                  ) : null}
                </g>
              ) : null}
            </g>
          </svg>
        </AbsoluteFill>
      ) : null}

      <Captions t={t} tl={tl} />
      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          {/* konuşmanın altında kısık müzik; kapanışta biraz yükselir */}
          <Sequence name="müzik">
            <Audio
              src={staticFile("music/623.mp3")}
              volume={(f) => {
                const mt = f / fps;
                const end = data.durationInSeconds;
                const base = interpolate(mt, [0, 0.6, end, end + 0.5], [0, 0.07, 0.07, 0.16], { extrapolateRight: "clamp" });
                return base * interpolate(mt, [tl.total - 1.0, tl.total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              }}
            />
          </Sequence>
        </>
      ) : null}
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: interpolate(t, [0, 0.12, tl.total - 0.3, tl.total], [0.6, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
