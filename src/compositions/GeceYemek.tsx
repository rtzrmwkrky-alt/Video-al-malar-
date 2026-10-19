/**
 * "Geç saatte yemek yeme, kilo alırsın!" efsanesi — anime tarzı genç (tek karakter; kullanıcı anne/koç istemedi), tek anlatıcı.
 * Açılıştaki "Gece gece yeme!" sesi ekran dışından (aralık kapıdan) gelir.
 * Turkuaz arka fon (kullanıcı seçimi; `bg` prop'u ile değişir), sahne nesneleri fonun üstünde sade çizim.
 * Metin `icerik/gece-yemek.txt`. Seslendirme varsa (public/audio/<ad>.json) satır ve altyazı zamanları
 * kelime zamanlarından gelir; yoksa okuma hızından hesaplanır (sessiz taslak).
 */
import { AbsoluteFill, Audio, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { AnimeTeen, INK, type AnimeExpr, type AnimeLook, type AnimePose } from "../anime/AnimeTeen";
import { Bora, type BoraExpr, type BoraPose } from "../avatar/BoraYan";
import { CurlyGuy, type CurlyExpr, type CurlyPose } from "../avatar/CurlyGuy";

loadFonts();

const Y = "#FFC83D"; // vurgu (sarı)
const RED = "#ff5a4e";
const GREEN = "#3ccf7a";
const FLOOR = 1400;

export const GECE_LINES: Line[] = [
  { text: "“Gece gece yeme, kilo alırsın!” Kaç kere duydun bunu?", hl: ["kilo", "alırsın!”"], hold: 0.3 },
  { text: "Peki doğru mu? Kilonun saati yok, matematiği var.", hl: ["saati", "yok,", "matematiği"], hold: 0.5 },
  { text: "Gün boyu aldığın kaloriyle harcadığını teraziye koy.", hl: ["aldığın", "harcadığını"], hold: 0.3 },
  { text: "Alınan fazlaysa kilo alırsın, harcanan fazlaysa verirsin.", hl: ["alırsın,", "verirsin."], hold: 0.3 },
  { text: "Yani gün içinde açıktaysan, gece yesen bile kilo almazsın.", hl: ["açıktaysan,", "almazsın."], hold: 0.6 },
  { text: "Ama gece ağır, yağlı yemekler midene yük olur.", hl: ["ağır,", "yağlı"], hold: 0.3 },
  { text: "Uykun bölünür, sabah yorgun uyanırsın.", hl: ["uykun", "bölünür,"], hold: 0.4 },
  { text: "Acıktıysan hafif seç: yoğurt, meyve ya da kuruyemiş.", hl: ["hafif"], hold: 0.4 },
  { text: "Önemli olan saat değil, günün toplamı.", hl: ["saat", "değil,", "toplamı."], hold: 0.6 },
  { text: "Bu videoyu sana “gece yeme” diyene gönder.", hl: ["gönder."], hold: 1.0 },
];

export const GECE_TAIL = 1.6;
export const GECE_TL = timeline(GECE_LINES, GECE_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

/** seslendirmeden zaman çizelgesi: her satır ilk kelimesinin başladığı anda başlar */
const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of GECE_LINES) {
    offs.push(o);
    o += l.text.split(/\s+/).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + GECE_TAIL;
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

/** satır içindeki k. kelimenin yaklaşık zamanı (ses yoksa satıra eşit yayılır) */
const wordTime = (tl: TL, line: number, k: number) => {
  if (tl.wordAt) return tl.wordAt(line, k);
  const n = GECE_LINES[line].text.split(/\s+/).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (GECE_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const line = GECE_LINES[i];
  const words = line.text.split(/\s+/);
  const chunks: number[] = [];
  for (let k = 0; k < words.length; ) {
    chunks.push(k);
    k += words.length - k === 4 ? 2 : Math.min(3, words.length - k);
  }
  let c = 0;
  while (c + 1 < chunks.length && t >= wordTime(tl, i, chunks[c + 1]) - 0.04) c++;
  const from = chunks[c];
  const to = c + 1 < chunks.length ? chunks[c + 1] : words.length;
  const hl = (line.hl ?? []).map(norm);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1560, textAlign: "center" }}>
      {words.slice(from, to).map((w, k) => {
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

// ------------------------------------------------------------ karakter yerleştirme

type P = [number, number];
const mixP = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** figür: ayak tabanı (x, y); s ölçek (figür ~1300 birim boy) */
const Fig: React.FC<{ x: number; y: number; s: number; pose?: AnimePose; expr?: AnimeExpr; t: number; uid: string; look?: AnimeLook }> = ({ x, y, s, pose, expr, t, uid, look }) => (
  <g transform={`translate(${x},${y}) scale(${s}) translate(-540,-1586)`}>
    <AnimeTeen uid={uid} pose={pose} expr={expr} t={t} look={look} />
  </g>
);

/** figür içindeki bir noktanın sahnedeki yeri (ör. elde tutulan nesne için) */
const figPt = (x: number, y: number, s: number, p: P, wide = 1): P => [x + (540 + (p[0] - 540) * wide - 540) * s, y + (p[1] - 1586) * s];

const DOWN: AnimePose = { elR: [404, 840], wrR: [396, 1000], elL: [676, 846], wrL: [684, 1004], itemL: null };

/** Bora (kanal karakteri): ayak ortası (x, y), s ölçek (~810 birim boy) */
const BoraAt: React.FC<{ x: number; y?: number; s: number; pose?: BoraPose; expr?: BoraExpr; t: number; uid: string; item?: React.ReactNode }> = ({ x, y = FLOOR, s, pose, expr, t, uid, item }) => (
  <g transform={`translate(${x},${y}) scale(${s}) translate(-220,-850)`}>
    <Bora id={uid} pose={pose} expr={expr} t={t} item={item} blink={blinkAt(t + x)} />
  </g>
);
const boraPt = (x: number, s: number, p: P): P => [x + (p[0] - 220) * s, FLOOR + (p[1] - 850) * s];

/** Kıvırcık Bora (güncel kanal karakteri, önden): ayak ortası (x, FLOOR) */
const CurlyAt: React.FC<{ x: number; s: number; pose?: CurlyPose; expr?: CurlyExpr; t: number; uid: string; item?: React.ReactNode }> = ({ x, s, pose, expr, t, uid, item }) => (
  <g transform={`translate(${x},${FLOOR}) scale(${s}) translate(-200,-880)`}>
    <CurlyGuy id={uid} pose={pose} expr={expr} t={t} item={item} blink={blinkAt(t + x)} />
  </g>
);
const curlyPt = (x: number, s: number, p: P): P => [x + (p[0] - 200) * s, FLOOR + (p[1] - 880) * s];
/** göz kırpma (her ~3.5 sn kısa bir an) */
const blinkAt = (t: number) => {
  const x = (t % 3.5) / 3.5;
  return x > 0.96 ? 1 : 0;
};

const PhoneItem: React.FC = () => (
  <g transform="translate(0,-58)">
    <rect x={-30} y={-60} width={60} height={112} rx={12} fill="#2b2f45" stroke={INK} strokeWidth={5} />
    <rect x={-23} y={-51} width={46} height={92} rx={7} fill="#9fd8ff" />
    <path d="M-10,-12 L12,-2 L-10,8 Z" fill="#ffffff" />
  </g>
);

// ------------------------------------------------------------ küçük çizim parçaları

const Txt: React.FC<{ x: number; y: number; size: number; children: React.ReactNode; fill?: string; anchor?: "middle" | "start" | "end"; sw?: number }> = ({
  x,
  y,
  size,
  children,
  fill = "#fff",
  anchor = "middle",
  sw = 10,
}) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={SANS} fontWeight={800} fontSize={size} fill={fill} stroke={INK} strokeWidth={sw} paintOrder="stroke" letterSpacing={-0.5}>
    {children}
  </text>
);

/** konuşma balonu (kuyruk tx,ty noktasına); yumuşak solarak gelir */
const Bubble: React.FC<{ x: number; y: number; w: number; h: number; tx: number; ty: number; o: number; lines: string[]; size?: number }> = ({ x, y, w, h, tx, ty, o, lines, size = 50 }) => {
  if (o <= 0) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const bx = Math.min(Math.max(tx, x + 70), x + w - 70);
  const by = ty > cy ? y + h - 4 : y + 4;
  return (
    <g opacity={o} transform={`translate(0,${(1 - o) * 16})`}>
      <path d={`M${bx - 34},${by} L${tx},${ty} L${bx + 34},${by} Z`} fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={h} rx={44} fill="#fff" stroke={INK} strokeWidth={7} />
      <path d={`M${bx - 30},${by} L${bx + 30},${by}`} stroke="#fff" strokeWidth={12} />
      {lines.map((l, k) => (
        <text key={k} x={cx} y={cy + (k - (lines.length - 1) / 2) * size * 1.15 + size * 0.36} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} fill={INK} letterSpacing={-0.5}>
          {l}
        </text>
      ))}
    </g>
  );
};

/** yazılı etiket kutusu */
const Pill: React.FC<{ x: number; y: number; text: string; o: number; color?: string; size?: number; ink?: string }> = ({ x, y, text, o, color = "#fff", size = 46, ink = INK }) => {
  if (o <= 0) return null;
  const w = text.length * size * 0.6 + 56;
  return (
    <g opacity={o} transform={`translate(0,${(1 - o) * 12})`}>
      <rect x={x - w / 2} y={y - size * 0.82} width={w} height={size * 1.64} rx={size * 0.82} fill={color} stroke={INK} strokeWidth={6} />
      <text x={x} y={y + size * 0.34} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} fill={ink}>
        {text}
      </text>
    </g>
  );
};

const Check: React.FC<{ x: number; y: number; s: number; p: number }> = ({ x, y, s, p }) =>
  p <= 0 ? null : (
    <path
      d={`M${x - s},${y} L${x - s * 0.3},${y + s * 0.7} L${x + s},${y - s * 0.7}`}
      stroke={GREEN}
      strokeWidth={s * 0.3}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
    />
  );

const Cross: React.FC<{ x: number; y: number; s: number; p: number }> = ({ x, y, s, p }) =>
  p <= 0 ? null : (
    <g stroke={RED} strokeWidth={s * 0.3} strokeLinecap="round">
      <line x1={x - s} y1={y - s} x2={x - s + 2 * s * Math.min(1, p * 2)} y2={y - s + 2 * s * Math.min(1, p * 2)} />
      {p > 0.5 ? <line x1={x + s} y1={y - s} x2={x + s - 2 * s * (p * 2 - 1)} y2={y - s + 2 * s * (p * 2 - 1)} /> : null}
    </g>
  );

const Sandwich: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-70,10 Q-74,-30 -40,-40 L40,-40 Q74,-30 70,10 Z" fill="#f2b65a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-76,8 Q-60,-6 -40,8 Q-20,-6 0,8 Q20,-6 40,8 Q60,-6 76,8 L74,20 L-74,20 Z" fill="#7ccf4a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-66} y={18} width={132} height={14} rx={6} fill="#ff5a4e" stroke={INK} strokeWidth={5} />
    <path d="M-70,32 L70,32 Q72,58 50,60 L-50,60 Q-72,58 -70,32 Z" fill="#f2b65a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

const Burger: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-60,0 Q-60,-56 0,-56 Q60,-56 60,0 Z" fill="#e8a23e" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={-20} cy={-34} r={4} fill="#fff3cf" />
    <circle cx={14} cy={-40} r={4} fill="#fff3cf" />
    <path d="M-66,4 Q-44,-10 -22,4 Q0,-10 22,4 Q44,-10 66,4 L64,14 L-64,14 Z" fill="#7ccf4a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-62} y={12} width={124} height={22} rx={10} fill="#7a3f22" stroke={INK} strokeWidth={6} />
    <path d="M-58,34 L58,34 Q58,58 0,58 Q-58,58 -58,34 Z" fill="#e8a23e" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

const Pizza: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-60,-50 Q0,-74 60,-50 L0,70 Z" fill="#ffd66b" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-60,-50 Q0,-74 60,-50 L54,-36 Q0,-58 -54,-36 Z" fill="#d98a3a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={-16} cy={-14} r={11} fill="#e8423a" stroke={INK} strokeWidth={4} />
    <circle cx={18} cy={-4} r={10} fill="#e8423a" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={28} r={8} fill="#e8423a" stroke={INK} strokeWidth={4} />
  </g>
);

const Apple: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M0,-30 C-30,-50 -62,-20 -52,16 C-44,46 -20,56 0,46 C20,56 44,46 52,16 C62,-20 30,-50 0,-30 Z" fill="#ff5a4e" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-30,-18 Q-38,0 -32,14" stroke="#ffb3a8" strokeWidth={8} fill="none" strokeLinecap="round" />
    <path d="M0,-30 Q2,-46 8,-54" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M6,-46 Q26,-62 40,-48 Q22,-36 6,-46 Z" fill="#7ccf4a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </g>
);

const Yogurt: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-50,-30 L50,-30 L40,54 Q0,62 -40,54 Z" fill="#ffffff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-58} y={-46} width={116} height={20} rx={8} fill="#7fc8ff" stroke={INK} strokeWidth={6} />
    <path d="M-44,4 L44,4 L41,26 L-41,26 Z" fill="#7fc8ff" />
  </g>
);

const Nuts: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {[
      [-30, -14],
      [0, -24],
      [28, -12],
      [-12, -4],
      [16, -2],
    ].map(([a, b], k) => (
      <ellipse key={k} cx={a} cy={b} rx={18} ry={13} transform={`rotate(${k * 37} ${a} ${b})`} fill="#c98a4a" stroke={INK} strokeWidth={4} />
    ))}
    <path d="M-66,0 L66,0 Q60,52 0,54 Q-60,52 -66,0 Z" fill="#9b6b44" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

const Flame: React.FC<{ x: number; y: number; s?: number; t: number }> = ({ x, y, s = 1, t }) => {
  const f = 1 + Math.sin(t * 9 + x) * 0.05;
  return (
    <g transform={`translate(${x},${y}) scale(${s},${s * f})`}>
      <path d="M0,50 C-44,50 -54,10 -36,-18 C-30,0 -18,4 -14,-6 C-22,-36 0,-56 10,-70 C14,-40 52,-24 44,14 C40,38 22,50 0,50 Z" fill="#ff8a3d" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M0,46 C-20,46 -24,26 -14,12 C-8,22 2,18 2,6 C14,16 22,26 18,36 C14,44 8,46 0,46 Z" fill="#ffd23f" />
    </g>
  );
};

const Dumbbell: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-70} y={-9} width={140} height={18} rx={8} fill="#8b93a6" stroke={INK} strokeWidth={6} />
    <rect x={-92} y={-38} width={34} height={76} rx={10} fill="#3b3f58" stroke={INK} strokeWidth={6} />
    <rect x={58} y={-38} width={34} height={76} rx={10} fill="#3b3f58" stroke={INK} strokeWidth={6} />
  </g>
);

const Moon: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#fff4c2" stroke={INK} strokeWidth={6} />
    <circle cx={x + r * 0.45} cy={y - r * 0.2} r={r * 0.85} fill="#2b3a6b" />
  </g>
);

/** gece penceresi (lacivert gökyüzü, ay, yıldızlar) */
const Window: React.FC<{ x: number; y: number; w: number; h: number; t: number }> = ({ x, y, w, h, t }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={14} fill="#2b3a6b" stroke={INK} strokeWidth={8} />
    <Moon x={x + w * 0.68} y={y + h * 0.36} r={Math.min(w, h) * 0.17} />
    {[
      [0.2, 0.25],
      [0.35, 0.7],
      [0.15, 0.6],
      [0.85, 0.78],
    ].map(([a, b], k) => (
      <circle key={k} cx={x + w * a} cy={y + h * b} r={5} fill="#fff4c2" opacity={0.6 + 0.4 * Math.sin(t * 3 + k * 2)} />
    ))}
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={INK} strokeWidth={7} />
    <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={INK} strokeWidth={7} />
  </g>
);

/** zemin: fon renginin koyu tonu (fon rengi değişse de uyar) */
const Floor: React.FC<{ tint: string }> = ({ tint }) => (
  <g>
    <rect x={0} y={FLOOR} width={1080} height={1920 - FLOOR} fill={tint} opacity={0.35} />
    <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} opacity={0.6} />
  </g>
);

/** açık buzdolabı (iç ışığı yanıyor) */
const Fridge: React.FC<{ x: number; t: number }> = ({ x, t }) => {
  const w = 300;
  const top = 560;
  const glow = 0.5 + 0.06 * Math.sin(t * 2);
  return (
    <g>
      <path d={`M${x + w},${FLOOR} L${x + w + 380},${FLOOR + 220} L${x - 40},${FLOOR + 220} L${x},${FLOOR} Z`} fill="#fff4c2" opacity={glow * 0.5} />
      <rect x={x} y={top} width={w} height={FLOOR - top} rx={22} fill="#e8eef6" stroke={INK} strokeWidth={8} />
      <rect x={x + 20} y={top + 20} width={w - 40} height={FLOOR - top - 40} rx={12} fill="#fff4c2" stroke={INK} strokeWidth={6} />
      {[0.3, 0.55, 0.78].map((k) => (
        <line key={k} x1={x + 20} y1={top + (FLOOR - top) * k} x2={x + w - 20} y2={top + (FLOOR - top) * k} stroke={INK} strokeWidth={5} />
      ))}
      {/* raflardaki şeyler */}
      <rect x={x + 50} y={top + 90} width={50} height={140} rx={14} fill="#ffffff" stroke={INK} strokeWidth={5} />
      <rect x={x + 50} y={top + 90} width={50} height={36} rx={10} fill="#7fc8ff" stroke={INK} strokeWidth={5} />
      <Apple x={x + 180} y={top + 200} s={0.55} />
      <Pizza x={x + 150} y={top + 360} s={0.6} rot={90} />
      <Yogurt x={x + 210} y={top + 560} s={0.6} />
      {/* açık kapak (perspektifte) */}
      <path d={`M${x},${top} L${x - 90},${top - 50} L${x - 90},${FLOOR + 40} L${x},${FLOOR}`} fill="#d5dde8" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <line x1={x - 70} y1={top + 160} x2={x - 70} y2={top + 320} stroke={INK} strokeWidth={10} strokeLinecap="round" />
    </g>
  );
};

/** kefeli terazi; a: eğim (derece, + sağ kefe aşağı) */
const Scale: React.FC<{ a: number; left: React.ReactNode; right: React.ReactNode }> = ({ a, left, right }) => {
  const px = 540;
  const py = 640;
  const L = 360;
  const r = (a * Math.PI) / 180;
  const ends: P[] = [
    [px - L * Math.cos(r), py - L * Math.sin(r)],
    [px + L * Math.cos(r), py + L * Math.sin(r)],
  ];
  return (
    <g>
      <path d={`M${px - 140},1300 L${px + 140},1300 L${px + 100},1250 L${px - 100},1250 Z`} fill="#3b3f58" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <rect x={px - 18} y={py} width={36} height={1255 - py} fill="#8b93a6" stroke={INK} strokeWidth={7} />
      <line x1={ends[0][0]} y1={ends[0][1]} x2={ends[1][0]} y2={ends[1][1]} stroke={INK} strokeWidth={26} strokeLinecap="round" />
      <line x1={ends[0][0]} y1={ends[0][1]} x2={ends[1][0]} y2={ends[1][1]} stroke="#8b93a6" strokeWidth={12} strokeLinecap="round" />
      <circle cx={px} cy={py} r={30} fill={Y} stroke={INK} strokeWidth={7} />
      {ends.map((e, k) => (
        <g key={k}>
          <line x1={e[0]} y1={e[1]} x2={e[0] - 120} y2={e[1] + 230} stroke={INK} strokeWidth={5} />
          <line x1={e[0]} y1={e[1]} x2={e[0] + 120} y2={e[1] + 230} stroke={INK} strokeWidth={5} />
          <g transform={`translate(${e[0]},${e[1] + 230})`}>
            {k === 0 ? left : right}
            <path d="M-150,0 L150,0 Q130,58 0,60 Q-130,58 -150,0 Z" fill="#c9cfdc" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          </g>
          <circle cx={e[0]} cy={e[1]} r={12} fill={INK} />
        </g>
      ))}
    </g>
  );
};

/** saat; h: saat ibresi (0-12), m: dakika ibresi (0-60) */
const Clock: React.FC<{ x: number; y: number; r: number; h: number; m: number }> = ({ x, y, r, h, m }) => {
  const ha = (h / 12) * 360;
  const ma = (m / 60) * 360;
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={r} fill="#ffffff" stroke={INK} strokeWidth={9} />
      {Array.from({ length: 12 }).map((_, k) => (
        <line key={k} x1={0} y1={-r + 14} x2={0} y2={-r + (k % 3 ? 26 : 36)} stroke={INK} strokeWidth={k % 3 ? 4 : 8} transform={`rotate(${k * 30})`} strokeLinecap="round" />
      ))}
      <line x1={0} y1={0} x2={0} y2={-r * 0.5} stroke={INK} strokeWidth={12} strokeLinecap="round" transform={`rotate(${ha})`} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.75} stroke={RED} strokeWidth={7} strokeLinecap="round" transform={`rotate(${ma})`} />
      <circle r={10} fill={INK} />
    </g>
  );
};

/** yatak (karakterin arkasında) */
const Bed: React.FC = () => (
  <g>
    <rect x={600} y={1060} width={30} height={340} rx={10} fill="#8c5a3c" stroke={INK} strokeWidth={7} />
    <rect x={620} y={1200} width={480} height={150} rx={20} fill="#ffffff" stroke={INK} strokeWidth={7} />
    <rect x={620} y={1250} width={480} height={100} rx={16} fill="#7fa8ff" stroke={INK} strokeWidth={7} />
    <rect x={650} y={1150} width={190} height={70} rx={34} fill="#ffffff" stroke={INK} strokeWidth={7} />
    <rect x={640} y={1350} width={26} height={50} fill="#8c5a3c" stroke={INK} strokeWidth={6} />
  </g>
);

/** uyku ölçer (pil gibi) */
const SleepBar: React.FC<{ x: number; y: number; v: number; o: number }> = ({ x, y, v, o }) => {
  if (o <= 0) return null;
  const col = v > 0.6 ? GREEN : v > 0.3 ? Y : RED;
  return (
    <g opacity={o}>
      <Txt x={x} y={y - 24} size={46} anchor="start">
        UYKU
      </Txt>
      <rect x={x} y={y} width={300} height={70} rx={18} fill="#ffffff" stroke={INK} strokeWidth={7} />
      <rect x={x + 300} y={y + 20} width={18} height={30} rx={5} fill={INK} />
      <rect x={x + 10} y={y + 10} width={280 * v} height={50} rx={10} fill={col} />
    </g>
  );
};

// ------------------------------------------------------------ ana kompozisyon

/** bg: [üst, alt] gradyan renkleri */
export type GeceYemekProps = { audioName: string; data: VoiceoverData | null; bg?: [string, string]; hero?: "anime" | "bora" | "kivircik" };

export const GeceYemek: React.FC<GeceYemekProps> = ({ audioName, data, bg = ["#1cb5ad", "#48d8cc"], hero = "anime" }) => {
  const isBora = hero === "bora";
  const isCurly = hero === "kivircik";
  /** zemin/kapı tonu: fona uysun */
  const tint = isCurly ? "#2a2a3a" : isBora ? "#8e2f33" : "#0d5b5e";
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : GECE_TL;
  const L = tl.at;
  const X = 0.35; // sahne geçişi (yumuşak solma)
  /** sahne görünürlüğü: a. satırdan b. satıra kadar */
  // önceki sahne tamamen sönünce yenisi gelir (üst üste binen hayalet görüntü olmasın)
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, X * 0.6);
  const W = (line: number, k: number) => wordTime(tl, line, k);

  // ===== 0: mutfak, gece
  const s0 = scene(0, 1);
  const shoutAt = 0.25;
  const caught = sm(t, W(0, 5) - 0.1, W(0, 5) + 0.3); // "Kaç kere…" → genç düşünür
  const teenX = 600;
  const teenS = 0.72;
  const bite = (1 - Math.cos(t * 4)) / 2 * (1 - caught);
  const teenPose: AnimePose = {
    ...DOWN,
    elL: [700, 820],
    wrL: mixP([660, 700 - 30 * bite], [700, 980], caught),
    head: -4 * caught,
    lx: -6 * caught,
  };
  const sw = figPt(teenX, FLOOR, teenS, teenPose.wrL!);

  // ===== 1: cevap
  const s1 = scene(1, 2);

  // ===== 2-4: terazi
  const s2 = scene(2, 5);
  const mid3 = W(3, 5); // "harcanan fazlaysa…"
  const clock3 = L(4) - 0.15; // saat 4. satırın başında dönmeye başlar
  const drop4 = W(4, 5); // "gece yesen bile"
  let tilt = interpolate(t, [L(3) - 0.1, L(3) + 0.6], [0, -12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  tilt = interpolate(t, [mid3 - 0.1, mid3 + 0.7], [tilt, 12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // gece yenen sandviç sol kefeye düşer: terazi sallanır ama sağda kalır
  const fall = sm(t, drop4, drop4 + 0.6);
  const wob = t > drop4 + 0.5 ? Math.sin((t - drop4 - 0.5) * 9) * 4 * Math.exp(-(t - drop4 - 0.5) * 2.5) : 0;
  tilt = tilt - 3 * sm(t, drop4 + 0.4, drop4 + 0.7) + wob;
  // saat: "Saat kaç olursa olsun"da hızla döner, 4. satırda gece yarısında durur
  const spin = interpolate(t, [clock3, W(4, 4) + 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spinE = 1 - (1 - spin) ** 3;
  const clockM = 60 * 9 * spinE; // 9 tur → 12:00
  const clockH = 3 + 9 * spinE;

  // ===== 5-6: yatak odası
  const s5 = scene(5, 7);
  const sleep6 = W(6, 0) + 0.1; // "uykun bölünür"
  const ouchPose: AnimePose = { elR: [420, 880], wrR: [520, 900], elL: [664, 880], wrL: [570, 930], itemL: null, head: 5 };

  // ===== 7: hafif atıştırmalık
  const s7 = scene(7, 8);
  const snack = [W(7, 3), W(7, 4), W(7, 7)];

  // ===== 8: özet kartı
  const s8 = scene(8, 9);

  // ===== 9: kapanış
  const s9 = scene(9, 10);

  // fon rengi sahneye göre değişir (kıvırcık Bora sürümü): gece mutfak → cevap → terazi → yatak odası → atıştırmalık → özet → kapanış
  const SCENE_BG: [number, string, string][] = [
    [0, "#5f6f96", "#46557a"], // gece, mutfak: akşam mavisi
    [1, "#cfe1f3", "#b3cbe6"], // cevap: açık gök mavisi (gece mavisinden yumuşak geçiş; sarı istenmedi)
    [2, "#d4ebe0", "#b9dccb"], // terazi: ferah mint
    [5, "#8c84b6", "#6d6699"], // yatak odası, gece: lavanta
    [7, "#dcefc2", "#c3e3a0"], // hafif atıştırmalık: taze yeşil
    [8, "#f1e6d2", "#e2d2b6"], // özet: krem
    [9, "#f7cdb0", "#eeb08a"], // kapanış: şeftali
  ];
  let bgTop = bg[0];
  let bgBot = bg[1];
  if (isCurly) {
    bgTop = SCENE_BG[0][1];
    bgBot = SCENE_BG[0][2];
    for (let k = 1; k < SCENE_BG.length; k++) {
      const at = L(SCENE_BG[k][0]);
      bgTop = interpolateColors(t, [at - 0.15, at + 0.25], [bgTop, SCENE_BG[k][1]]);
      bgBot = interpolateColors(t, [at - 0.15, at + 0.25], [bgBot, SCENE_BG[k][2]]);
    }
  }
  const fade = interpolate(t, [0, 0.12, tl.total - 0.3, tl.total], [0.6, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="gy-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="gy-glow" cx="50%" cy="40%" r="55%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.4} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gy-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#gy-bg)" />
        <rect width={1080} height={1920} fill="url(#gy-glow)" />
        <Floor tint={tint} />

        {/* ===== 0: mutfak ===== */}
        {s0 > 0 ? (
          <g opacity={s0}>
            <Window x={140} y={150} w={250} h={210} t={t} />
            <Fridge x={110} t={t} />
            {isCurly ? (
              <CurlyAt
                uid="kiv0"
                x={560}
                s={1.15}
                t={t}
                pose={{ r: { el: mixP([300, 480], [300, 500], caught), wr: mixP([238, 300 + 14 * bite], [300, 400], caught) }, head: -3 * caught }}
                expr={caught > 0.5 ? "surprise" : "chew"}
                item={<Sandwich x={0} y={-12} s={0.5} rot={-10 + 20 * caught} />}
              />
            ) : isBora ? (
              <BoraAt
                uid="bora0"
                x={560}
                s={1.12}
                t={t}
                pose={{ el: mixP([292, 440], [292, 450], caught), wr: mixP([302, 290 - 18 * bite], [318, 340], caught), head: -3 * caught }}
                expr={caught > 0.5 ? "surprise" : "chew"}
                item={<Sandwich x={0} y={-14} s={0.55} rot={-10 + 20 * caught} />}
              />
            ) : (
              <>
                <Fig uid="genc0" x={teenX} y={FLOOR} s={teenS} pose={teenPose} expr={caught > 0.5 ? "think" : bite > 0.6 ? "happy" : "grin"} t={t} />
                <Sandwich x={sw[0]} y={sw[1] - 10} s={0.62} rot={-10 + 20 * caught} />
              </>
            )}
            {/* aralık kapı: ses buradan gelir */}
            <rect x={930} y={420} width={170} height={FLOOR - 420} fill={tint} opacity={0.55} />
            <rect x={930} y={420} width={170} height={FLOOR - 420} fill="none" stroke={INK} strokeWidth={8} opacity={0.6} />
            <path d={`M930,${FLOOR} L860,${FLOOR + 160} L1080,${FLOOR + 160} L1080,${FLOOR} Z`} fill="#fff4c2" opacity={0.18} />
            <Bubble x={440} y={210} w={580} h={200} tx={985} ty={560} o={sm(t, shoutAt, shoutAt + 0.3) * (1 - sm(t, W(0, 5) - 0.2, W(0, 5) + 0.1))} lines={["GECE GECE YEME,", "KİLO ALIRSIN!"]} size={48} />
            <Pill x={680} y={110} text="EFSANE Mİ, GERÇEK Mİ?" o={caught} color={Y} size={50} />
            {caught > 0 ? (
              <g opacity={caught} transform={`translate(${teenX + 150},${560 + Math.sin(t * 3) * 10})`}>
                <Txt x={0} y={0} size={200} fill={Y} sw={14}>
                  ?
                </Txt>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ===== 1: cevap ===== */}
        {s1 > 0 ? (
          <g opacity={s1}>
            {["+", "−", "=", "×"].map((c, k) => (
              <g key={c} opacity={0.35} transform={`translate(${[120, 960, 930, 950][k]},${[900, 760, 1150, 560][k] + Math.sin(t * 2 + k) * 14})`}>
                <Txt x={0} y={0} size={120} fill="#fff" sw={0}>
                  {c}
                </Txt>
              </g>
            ))}
            {(() => {
              const p = sm(t, W(1, 3) - 0.1, W(1, 3) + 0.35);
              return p > 0 ? (
                <g opacity={p} transform={`translate(260,1200) rotate(-12) scale(${1.15 - 0.15 * p})`}>
                  <rect x={-210} y={-70} width={420} height={140} rx={22} fill="none" stroke={isBora ? "#ffffff" : RED} strokeWidth={14} />
                  <text x={0} y={30} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={88} fill={isBora ? "#ffffff" : RED} letterSpacing={4}>
                    EFSANE
                  </text>
                </g>
              ) : null;
            })()}
            {isCurly ? (
              <CurlyAt
                uid="kiv1"
                x={720}
                s={1.1}
                t={t}
                pose={t < W(1, 3) - 0.25 ? { r: { el: [290, 500], wr: [228, 300] } } : { r: { el: [320, 430], wr: [328, 310], hand: "point", handRot: 10 } }}
                expr={t < W(1, 3) - 0.25 ? "think" : "grin"}
              />
            ) : isBora ? (
              <BoraAt uid="bora1" x={700} s={1.1} t={t} pose={{ el: [312, 370], wr: [322, 250], hand: "point", handRot: 20 }} expr="grin" />
            ) : (
              <Fig uid="genc1" x={760} y={FLOOR} s={0.76} pose={{ ...DOWN, elL: [700, 840], wrL: [690, 720] }} expr="grin" t={t} />
            )}
            <Bubble x={30} y={170} w={600} h={240} tx={isCurly ? 652 : isBora ? 765 : 690} ty={isCurly ? 700 : isBora ? 695 : 560} o={sm(t, W(1, 3) - 0.25, W(1, 3) - 0.05)} lines={["KİLONUN SAATİ YOK,", "MATEMATİĞİ VAR!"]} size={54} />
            <g opacity={sm(t, W(1, 4), W(1, 4) + 0.3)}>
              <Clock x={230} y={700} r={95} h={11} m={58} />
              <Cross x={230} y={700} s={70} p={sm(t, W(1, 5), W(1, 5) + 0.4)} />
            </g>
            <g opacity={sm(t, W(1, 6), W(1, 6) + 0.3)}>
              <rect x={110} y={880} width={240} height={140} rx={24} fill="#fff" stroke={INK} strokeWidth={7} />
              <Txt x={230} y={975} size={66} fill={INK} sw={0}>
                + − =
              </Txt>
              <Check x={360} y={870} s={44} p={sm(t, W(1, 6) + 0.3, W(1, 6) + 0.7)} />
            </g>
          </g>
        ) : null}

        {/* ===== 2-4: terazi ===== */}
        {s2 > 0 ? (
          <g opacity={s2}>
            <Scale
              a={tilt}
              left={
                <g>
                  <Burger x={-70} y={-60} s={0.8} />
                  <Apple x={50} y={-48} s={0.7} />
                  {fall > 0 ? <Sandwich x={10 + 0 * fall} y={-150 - (1 - fall) * 700} s={0.6} rot={(1 - fall) * 40} /> : null}
                </g>
              }
              right={
                <g>
                  <Flame x={-60} y={-52} s={0.8} t={t} />
                  <Dumbbell x={60} y={-30} s={0.55} rot={-10} />
                </g>
              }
            />
            <Pill x={190} y={1110 + 180 * Math.sin((tilt * Math.PI) / 180) * -1} text="ALINAN" o={sm(t, W(2, 2), W(2, 2) + 0.3)} color={Y} size={44} />
            <Pill x={890} y={1110 + 180 * Math.sin((tilt * Math.PI) / 180)} text="HARCANAN" o={sm(t, W(2, 4), W(2, 4) + 0.3)} color={Y} size={44} />
            {/* 3: alınan fazla → kilo +, harcanan fazla → kilo − */}
            <Pill x={250} y={330} text="KİLO ▲" o={win(t, L(3) + 0.4, mid3, 0.25)} color={RED} ink="#fff" size={60} />
            <Pill x={830} y={330} text="KİLO ▼" o={win(t, mid3 + 0.5, clock3 + 0.1, 0.25)} color={GREEN} ink="#fff" size={60} />
            {/* saat: kaç olursa olsun */}
            <g opacity={sm(t, clock3 - 0.1, clock3 + 0.2)}>
              <Clock x={540} y={330} r={120} h={clockH} m={clockM} />
              <g opacity={sm(t, L(4) + 0.5, L(4) + 0.9)}>
                <Moon x={720} y={250} r={50} />
                <Pill x={540} y={520} text="00:00" o={1} size={44} />
              </g>
            </g>
            {/* 4: açık → gece yesen bile almazsın */}
            <Pill x={830} y={720} text="KALORİ AÇIĞI" o={sm(t, W(4, 3) - 0.1, W(4, 3) + 0.2)} color={GREEN} ink="#fff" size={44} />
            <g opacity={sm(t, W(4, 8) - 0.1, W(4, 8) + 0.2)}>
              <Pill x={500} y={1395} text="KİLO ALMAZSIN" o={1} color="#fff" size={48} />
              <Check x={790} y={1385} s={46} p={sm(t, W(4, 8), W(4, 8) + 0.4)} />
            </g>
          </g>
        ) : null}

        {/* ===== 5-6: yatak odası ===== */}
        {s5 > 0 ? (
          <g opacity={s5}>
            <Window x={90} y={220} w={260} h={220} t={t} />
            <Bed />
            {isCurly ? (
              <CurlyAt
                uid="kiv5"
                x={430}
                s={1.12}
                t={t}
                pose={
                  t > W(6, 2) - 0.1
                    ? { r: { el: [300, 470], wr: [252, 300], hand: "open" }, head: 4 }
                    : { r: { el: [292, 560], wr: [236, 560], hand: "open" }, l: { el: [108, 560], wr: [164, 560], hand: "open" }, head: 4 }
                }
                expr={t > W(6, 2) - 0.1 ? "yawn" : t > W(5, 5) ? "ouch" : "think"}
              />
            ) : isBora ? (
              <BoraAt
                uid="bora5"
                x={430}
                s={1.12}
                t={t}
                pose={t > W(6, 2) - 0.1 ? { head: 4 } : { el: [252, 470], wr: [290, 432], hand: "open", head: 6 }}
                expr={t > W(6, 2) - 0.1 ? "yawn" : t > W(5, 5) ? "ouch" : "think"}
              />
            ) : (
              <Fig uid="genc5" x={470} y={FLOOR} s={0.74} pose={ouchPose} expr={t > W(5, 5) ? "ouch" : "think"} t={t} />
            )}
            {/* ağır, yağlı yemekler mideye iner */}
            {(() => {
              const d = sm(t, W(5, 5) - 0.2, W(5, 5) + 0.7); // "midene yük olur"
              const belly = isCurly ? curlyPt(430, 1.12, [200, 560]) : isBora ? boraPt(430, 1.12, [300, 440]) : figPt(470, FLOOR, 0.74, [540, 880]);
              const o = sm(t, W(5, 2) - 0.2, W(5, 2) + 0.2) * (1 - d * 0.9);
              return (
                <g opacity={o}>
                  <g transform={`translate(${mixP([720, 560], belly, d).join(",")}) scale(${1 - 0.6 * d})`}>
                    <Burger x={0} y={0} s={1.1} />
                  </g>
                  <g transform={`translate(${mixP([900, 760], belly, d).join(",")}) scale(${1 - 0.6 * d})`}>
                    <Pizza x={0} y={0} s={1.1} rot={-15} />
                  </g>
                  <Pill x={810} y={430} text="AĞIR + YAĞLI" o={1 - d} color={RED} ink="#fff" size={46} />
                </g>
              );
            })()}
            {/* mide: yük */}
            {(() => {
              const belly = isCurly ? curlyPt(430, 1.12, [200, 560]) : isBora ? boraPt(430, 1.12, [300, 440]) : figPt(470, FLOOR, 0.74, [540, 880]);
              const o = sm(t, W(5, 6), W(5, 6) + 0.3);
              return o > 0 ? (
                <g opacity={o}>
                  {[0, 1, 2].map((k) => {
                    const a = t * 2.4 + (k * Math.PI * 2) / 3;
                    return (
                      <path
                        key={k}
                        d={`M${belly[0] + Math.cos(a) * 130},${belly[1] + Math.sin(a) * 70} q20,-20 40,0 q20,20 40,0`}
                        stroke="#ffffff"
                        strokeWidth={8}
                        fill="none"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </g>
              ) : null;
            })()}
            {/* 6: uyku bölünür */}
            <SleepBar x={640} y={300} v={interpolate(t, [sleep6, sleep6 + 1.4], [0.95, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} o={sm(t, L(6) + 0.1, L(6) + 0.4)} />
            {t > L(6) ? (
              <g opacity={sm(t, L(6), L(6) + 0.3)}>
                {["Z", "z", "z"].map((z, k) => {
                  const broken = sm(t, sleep6 + k * 0.15, sleep6 + 0.4 + k * 0.15);
                  return (
                    <g key={k} opacity={1 - broken * 0.8} transform={`translate(${760 + k * 70},${600 - k * 70 + broken * 160}) rotate(${broken * (k % 2 ? 40 : -40)})`}>
                      <Txt x={0} y={0} size={90 - k * 16} fill="#ffffff">
                        {z}
                      </Txt>
                    </g>
                  );
                })}
              </g>
            ) : null}
            <Pill x={810} y={1000} text="SABAH YORGUN" o={sm(t, W(6, 3) - 0.1, W(6, 3) + 0.2)} color="#fff" size={44} />
          </g>
        ) : null}

        {/* ===== 7: hafif atıştırmalık ===== */}
        {s7 > 0 ? (
          <g opacity={s7}>
            {isCurly ? (
              <CurlyAt
                uid="kiv7"
                x={500}
                s={0.92}
                t={t}
                pose={{ r: { el: [300, 560], wr: [330, 470] } }}
                expr={t > snack[1] ? "happy" : "smile"}
                item={<g opacity={sm(t, snack[1] - 0.1, snack[1] + 0.25)}><Apple x={0} y={-50} s={0.6} /></g>}
              />
            ) : isBora ? (
              <BoraAt
                uid="bora7"
                x={500}
                s={0.92}
                t={t}
                pose={{ el: [284, 450], wr: [350, 400] }}
                expr={t > snack[1] ? "happy" : "smile"}
                item={<g opacity={sm(t, snack[1] - 0.1, snack[1] + 0.25)}><Apple x={0} y={-58} s={0.7} /></g>}
              />
            ) : (
              <Fig uid="genc7" x={540} y={FLOOR} s={0.64} pose={{ ...DOWN, elL: [700, 840], wrL: [690, 720] }} expr={t > snack[0] ? "happy" : "grin"} t={t} />
            )}
            <Pill x={540} y={190} text="HAFİF SEÇ" o={sm(t, W(7, 1) - 0.1, W(7, 1) + 0.2)} color={GREEN} ink="#fff" size={56} />
            {[
              { x: 200, el: <Yogurt x={200} y={400} s={1.1} />, l: "yoğurt" },
              { x: 540, el: <Apple x={540} y={400} s={1.2} />, l: "meyve" },
              { x: 880, el: <Nuts x={880} y={420} s={1.1} />, l: "kuruyemiş" },
            ].map((s, k) => {
              const o = sm(t, snack[k] - 0.1, snack[k] + 0.25);
              return o > 0 ? (
                <g key={k} opacity={o} transform={`translate(0,${(1 - o) * 20})`}>
                  <circle cx={s.x} cy={410} r={115} fill="#ffffff" opacity={0.25} />
                  {s.el}
                  <Txt x={s.x} y={590} size={46}>
                    {s.l}
                  </Txt>
                </g>
              ) : null;
            })}
          </g>
        ) : null}

        {/* ===== 8: özet ===== */}
        {s8 > 0 ? (
          <g opacity={s8}>
            <rect x={90} y={200} width={900} height={500} rx={44} fill="#ffffff" stroke={INK} strokeWidth={9} />
            <g opacity={sm(t, W(8, 2) - 0.1, W(8, 2) + 0.2)}>
              <Clock x={230} y={340} r={70} h={12} m={0} />
              <Txt x={340} y={365} size={76} fill={INK} sw={0} anchor="start">
                SAAT
              </Txt>
              <Cross x={860} y={340} s={50} p={sm(t, W(8, 3), W(8, 3) + 0.4)} />
            </g>
            <line x1={140} y1={450} x2={940} y2={450} stroke={INK} strokeWidth={4} opacity={0.2} />
            <g opacity={sm(t, W(8, 4) - 0.1, W(8, 4) + 0.2)}>
              <Txt x={150} y={590} size={70} fill={INK} sw={0} anchor="start">
                GÜNÜN TOPLAMI
              </Txt>
              <Check x={860} y={560} s={50} p={sm(t, W(8, 5), W(8, 5) + 0.4)} />
            </g>
            {isCurly ? (
              <CurlyAt uid="kiv8" x={510} s={0.78} t={t} pose={{ r: { el: [300, 560], wr: [330, 470], hand: "thumb" } }} expr="smile" />
            ) : isBora ? (
              <BoraAt uid="bora8" x={510} s={0.78} t={t} pose={{ el: [290, 452], wr: [342, 384], hand: "thumb" }} expr="smile" />
            ) : (
              <Fig uid="genc8" x={540} y={FLOOR} s={0.52} pose={DOWN} expr="happy" t={t} />
            )}
          </g>
        ) : null}

        {/* ===== 9: kapanış ===== */}
        {s9 > 0 ? (
          <g opacity={s9}>
            {isCurly ? (
              <CurlyAt uid="kiv9" x={500} s={1.0} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="laugh" item={<PhoneItem />} />
            ) : isBora ? (
              <BoraAt uid="bora9" x={500} s={1.0} t={t} pose={{ el: [290, 444], wr: [330, 336], head: 8, ly: 3 }} expr="laugh" item={<PhoneItem />} />
            ) : (
              <Fig uid="genc9" x={540} y={FLOOR} s={0.66} pose={{ ...DOWN, elL: [730, 790], wrL: [700, 620], itemL: "phone" }} expr="wink" t={t + 2} />
            )}
            <g opacity={sm(t, L(9) + 0.2, L(9) + 0.5)}>
              <Txt x={540} y={330} size={84} fill="#ffffff" sw={14}>
                “GECE YEME”
              </Txt>
              <Txt x={540} y={430} size={84} fill={Y} sw={14}>
                DİYENE GÖNDER!
              </Txt>
            </g>
          </g>
        ) : null}

        <rect width={1080} height={1920} fill="url(#gy-vig)" />
      </svg>

      <Captions t={t} tl={tl} />
      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          {/* konuşmanın altında kısık müzik; kapanışta biraz yükselir */}
          <Audio
            src={staticFile("music/623.mp3")}
            volume={(f) => {
              const mt = f / fps;
              const end = data.durationInSeconds;
              const base = interpolate(mt, [0, 0.6, end, end + 0.5], [0, 0.04, 0.04, 0.09], { extrapolateRight: "clamp" });
              return base * interpolate(mt, [tl.total - 1.0, tl.total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            }}
          />
        </>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
