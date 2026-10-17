/**
 * "Erken yaşta ağırlık kaldırmak boy uzamasını engeller mi?" — düz çizgi karikatür (gençlere, tek anlatıcı).
 * Bej kâğıt zemin, kalın konturlu genç; kemiğin içindeki büyüme bölgesi "minik inşaat" olarak anlatılır.
 * Metin `icerik/boy-uzama.txt`. Seslendirme varsa (public/audio/<ad>.json) satır ve altyazı zamanları
 * kelime zamanlarından gelir; yoksa okuma hızından hesaplanır (sessiz taslak).
 */
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, pop as rawPop, sm, timeline, win } from "../ornek/common";
import { AnimeTeen, type AnimeExpr, type AnimeLook, type AnimePose } from "../anime/AnimeTeen";
import { BALLER as A_BALLER, COACH as A_COACH, LIFTER as A_LIFTER, MOM as A_MOM } from "../anime/looks";
import { THEMES, type BoyStyle, type CapTheme } from "./boyUzamaStyles";
import { INK, ToonGirl2D, blinkAt, type Expr, type ToonLook, type ToonPose } from "../cartoon/ToonGirl2D";

loadFonts();

/** yumuşak beliriş: zıplamasız, göz yormayan yay */
const pop = (t: number, at: number, damping = 20) => rawPop(t, at, 30, Math.max(20, damping));

const Y = "#FFC83D"; // vurgu (sarı)
const PAPER = "#f3e6cf";
const RED = "#ff5a4e";

export const BOY_LINES: Line[] = [
  { text: "“Ağırlık kaldırma, boyun kısa kalır!” Tanıdık geldi mi?", hl: ["kısa", "kalır!”"], hold: 0.3 },
  { text: "Bunu ben de çok duydum. Gel, bir de kemiğin içine bakalım.", hl: ["kemiğin", "içine"], hold: 1.0 },
  { text: "Kemiklerinin uçlarında büyüme plağı denen yumuşak bir bölge var.", hl: ["büyüme", "plağı"], hold: 0.4 },
  { text: "Buradaki hücreler bölünür, üst üste dizilir, sonra sertleşip kemiğe dönüşür. Boyun aslında böyle uzar.", hl: ["bölünür,", "dizilir,", "kemiğe"], hold: 0.3 },
  { text: "Peki sen ağırlık kaldırınca ne olur? Hiçbir şey durmaz. Hatta kemiklerin daha da sağlamlaşır.", hl: ["durmaz.", "sağlamlaşır."], hold: 0.3 },
  { text: "Ergenlik bitince bu plak kendiliğinden kapanır. Röntgende o çizgi kaybolur, gider.", hl: ["ergenlik", "bitince", "kaybolur,"], hold: 0.4 },
  { text: "Ne zaman kapanacağına dambıl değil, genlerin ve hormonların karar verir.", hl: ["genlerin", "hormonların"], hold: 0.4 },
  { text: "“İyi de halterciler hep kısa!” dediğini duyar gibiyim. Haklısın, ama halter onları kısaltmadı.", hl: ["kısaltmadı."], hold: 0.3 },
  { text: "Kısa boylular bu sporda avantajlı, o yüzden halterde hep onları görüyoruz. Basketbol da kimseyi uzatmadı, uzunlar seçildi.", hl: ["avantajlı,", "uzatmadı,"], hold: 0.3 },
  { text: "Asıl tehlike ne, biliyor musun? Koçsuz, bozuk teknikle, kaldıramayacağın yükü zorlamak.", hl: ["koçsuz,", "bozuk", "kaldıramayacağın"], hold: 0.3 },
  { text: "O yüzden önce tekniği öğren, hafiften başla, mümkünse bir koçla çalış.", hl: ["tekniği", "hafiften", "koçla"], hold: 0.4 },
  { text: "Bir de boyun için asıl iş gece yapılır: iyi uyku ve iyi beslenme.", hl: ["uyku", "beslenme."], hold: 0.3 },
  { text: "Hadi, şimdi bu videoyu sana bunu söyleyene gönder.", hl: ["gönder."], hold: 1.0 },
];

export const BOY_TL = timeline(BOY_LINES, 0.3);

/** kısa sürüm (~38 sn): orijinal satır numaralarından kalanlar; 1. satırın başı kesildi (scripts/boy-uzama-kisa.py) */
const KISA_KEEP = [0, 1, 2, 3, 4, 5, 9, 10, 12];
const KISA_LINES: Line[] = KISA_KEEP.map((i) => (i === 1 ? { text: "Gel, bir de kemiğin içine bakalım.", hl: ["kemiğin", "içine"], hold: 0.6 } : BOY_LINES[i]));
export const BOY_TAIL = 1.6;

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

/** seslendirmeden zaman çizelgesi: her satır ilk kelimesinin başladığı anda başlar */
const voiceTimeline = (data: VoiceoverData, lines: Line[]): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of lines) {
    offs.push(o);
    o += l.text.split(/\s+/).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + BOY_TAIL;
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

// ------------------------------------------------------------ karakter görünümleri

const TEEN: ToonLook = {
  hair: "short",
  colors: { shirt: "#3fa7ff", shirtD: "#ffffff", stripe: "#ffd23f", pants: "#3b3f58", hair: "#3b2a20", hairD: "#2a1d15", sole: "#ffd23f", iris: "#4a2e1c" },
};
const MOM: ToonLook = {
  hair: "bun",
  stripe: false,
  colors: { shirt: "#b06cd6", pants: "#4a3a5a", hair: "#2b1d16", hairD: "#1c120d", band: "#2b1d16" },
};
const LIFTER: ToonLook = {
  hair: "short",
  colors: { shirt: "#e84a4a", shirtD: "#ffffff", stripe: "#ffffff", pants: "#2b2b38", skin: "#e8b28c", hair: "#1e1a18" },
};
const BALLER: ToonLook = {
  hair: "short",
  colors: { shirt: "#ff8a3d", shirtD: "#ffffff", stripe: "#7a3cff", pants: "#ff8a3d", skin: "#9a6646", hair: "#151010", iris: "#2a1a10" },
};
const COACH: ToonLook = {
  hair: "short",
  stripe: false,
  colors: { shirt: "#2fb37a", pants: "#25344f", skin: "#f1c6a4", hair: "#6b4a2e" },
};

// ------------------------------------------------------------ zemin

const Paper: React.FC<{ tint?: string }> = ({ tint }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="bp" cx="50%" cy="42%" r="78%">
        <stop offset="0" stopColor="#fbf3e4" />
        <stop offset="0.62" stopColor={tint ?? PAPER} />
        <stop offset="1" stopColor="#dcc39c" />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#bp)" />
    {Array.from({ length: 140 }).map((_, i) => (
      <circle key={i} cx={(i * 397) % 1080} cy={(i * 733) % 1920} r={1.6 + (i % 3)} fill="#8a6a3c" opacity={0.08} />
    ))}
  </svg>
);

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL; top?: number; cap: CapTheme; lines: Line[] }> = ({ t, tl, top = 1300, cap, lines }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const line = lines[i];
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
      <div
        style={
          cap.box
            ? {
                display: "inline-block",
                background: cap.box.bg,
                border: cap.box.border,
                borderRadius: 40,
                padding: "6px 22px 12px",
                transform: `rotate(${cap.box.rot ?? 0}deg)`,
                opacity: sm(t, s, s + 0.15),
              }
            : { display: "inline" }
        }
      >
      {chunks[c].map((w, k) => {
        const p = sm(t, wordT(k), wordT(k) + 0.16);
        return (
          <span
            key={`${c}-${k}`}
            style={{
              display: "inline-block",
              margin: "0 12px",
              fontFamily: cap.font,
              fontWeight: cap.weight,
              fontStyle: cap.italic ? "italic" : "normal",
              fontSize: 90,
              letterSpacing: -1.5,
              color: hl.includes(norm(w)) ? cap.hl : cap.color,
              ...(cap.stroke ? { WebkitTextStroke: `${cap.stroke.w}px ${cap.stroke.c}`, paintOrder: "stroke" } : {}),
              textShadow: cap.shadow,
              transform: `translateY(${(1 - p) * 14}px)`,
              opacity: p,
            }}
          >
            {w.replace(/[“”;]/g, "")}
          </span>
        );
      })}
      </div>
    </div>
  );
};

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

/** elde tutulan dambıl (yerel eksen: kol +y yönünde, dambıl ona dik) */
const Dumbbell: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-70} y={-9} width={140} height={18} rx={8} fill="#8b93a6" stroke={INK} strokeWidth={6} />
    <rect x={-92} y={-38} width={34} height={76} rx={10} fill="#3b3f58" stroke={INK} strokeWidth={6} />
    <rect x={58} y={-38} width={34} height={76} rx={10} fill="#3b3f58" stroke={INK} strokeWidth={6} />
  </g>
);

const Phone: React.FC = () => (
  <g transform="rotate(180)">
    <rect x={-40} y={-20} width={80} height={140} rx={16} fill="#2b2f45" stroke={INK} strokeWidth={6} />
    <rect x={-30} y={-6} width={60} height={104} rx={8} fill="#9fd8ff" />
    <path d="M-14,40 L16,52 L-14,64 Z" fill="#fff" />
  </g>
);

const Whistle: React.FC = () => (
  <g>
    <rect x={-26} y={4} width={52} height={30} rx={14} fill="#ffd23f" stroke={INK} strokeWidth={5} />
    <rect x={18} y={8} width={30} height={14} rx={4} fill="#ffd23f" stroke={INK} strokeWidth={5} />
  </g>
);

const Burst: React.FC<{ x: number; y: number; text: string; p: number; color?: string; rot?: number; size?: number }> = ({ x, y, text, p, color = RED, rot = -8, size = 1 }) => {
  if (p <= 0) return null;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 ? 95 : 130;
    return `${Math.cos(a) * r * 1.3},${Math.sin(a) * r}`;
  }).join(" ");
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${p * size})`}>
      <polygon points={pts} fill={color} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <Txt x={0} y={24} size={70}>
        {text}
      </Txt>
    </g>
  );
};

/** konuşma balonu (kuyruk tx,ty noktasına) */
const Bubble: React.FC<{ x: number; y: number; w: number; h: number; tx: number; ty: number; p: number; lines: string[]; size?: number; color?: string }> = ({
  x,
  y,
  w,
  h,
  tx,
  ty,
  p,
  lines,
  size = 54,
  color = "#fff",
}) => {
  if (p <= 0) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const bx = Math.min(Math.max(tx, x + 60), x + w - 60);
  const by = ty > cy ? y + h - 4 : y + 4;
  return (
    <g transform={`translate(${cx},${cy}) scale(${p}) translate(${-cx},${-cy})`}>
      <path d={`M${bx - 34},${by} L${tx},${ty} L${bx + 34},${by} Z`} fill={color} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={h} rx={44} fill={color} stroke={INK} strokeWidth={7} />
      <path d={`M${bx - 30},${by} L${bx + 30},${by}`} stroke={color} strokeWidth={12} />
      {lines.map((l, k) => (
        <text key={k} x={cx} y={cy + (k - (lines.length - 1) / 2) * size * 1.15 + size * 0.36} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} fill={INK} letterSpacing={-0.5}>
          {l}
        </text>
      ))}
    </g>
  );
};

/** etiket: noktadan çizgiyle kutuya */
const Tag: React.FC<{ x: number; y: number; tx: number; ty: number; text: string; o: number; color?: string; size?: number }> = ({ x, y, tx, ty, text, o, color = "#fff", size = 44 }) => {
  if (o <= 0) return null;
  const w = text.length * size * 0.56 + 48;
  return (
    <g opacity={o}>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke={INK} strokeWidth={6} />
      <circle cx={x} cy={y} r={11} fill={INK} />
      <rect x={tx - w / 2} y={ty - size * 0.8} width={w} height={size * 1.6} rx={size * 0.5} fill={color} stroke={INK} strokeWidth={6} />
      <text x={tx} y={ty + size * 0.34} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} fill={INK}>
        {text}
      </text>
    </g>
  );
};

const RedX: React.FC<{ x: number; y: number; s: number; p: number }> = ({ x, y, s, p }) =>
  p <= 0 ? null : (
    <g transform={`translate(${x},${y})`} opacity={Math.min(1, p * 2)}>
      <line x1={-s} y1={-s} x2={-s + 2 * s * p} y2={-s + 2 * s * p} stroke={RED} strokeWidth={s * 0.22} strokeLinecap="round" />
      <line x1={s} y1={-s} x2={s - 2 * s * Math.max(0, p * 1.4 - 0.4)} y2={-s + 2 * s * Math.max(0, p * 1.4 - 0.4)} stroke={RED} strokeWidth={s * 0.22} strokeLinecap="round" />
    </g>
  );

// ------------------------------------------------------------ oda (kapı pervazı + boy çizgileri)

const DOOR_X = 110;
const DOOR_W = 290;
const FLOOR = 1330;

const Room: React.FC<{ marks: number; newMark?: number }> = ({ marks, newMark = 0 }) => (
  <g>
    {/* duvar şeritleri */}
    {Array.from({ length: 7 }).map((_, i) => (
      <rect key={i} x={i * 160 + 40} y={0} width={70} height={FLOOR} fill="#ecd9b8" opacity={0.35} />
    ))}
    {/* zemin */}
    <rect x={0} y={FLOOR} width={1080} height={600} fill="#d9b98a" />
    <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} />
    {/* kapı boşluğu */}
    <rect x={DOOR_X} y={330} width={DOOR_W} height={FLOOR - 330} fill="#8c6f52" />
    <rect x={DOOR_X} y={330} width={DOOR_W} height={FLOOR - 330} fill="#000" opacity={0.18} />
  </g>
);

/** pervaz kapının önünde çizilir (anne arkasında kalsın) */
const DoorFrame: React.FC<{ marks: number; newMark?: number }> = ({ marks, newMark = 0 }) => {
  const MARKS = [
    { y: 1010, label: "8" },
    { y: 920, label: "10" },
    { y: 830, label: "12" },
  ];
  return (
    <g>
      <rect x={DOOR_X - 34} y={300} width={34} height={FLOOR - 300} fill="#fff6e6" stroke={INK} strokeWidth={7} />
      <rect x={DOOR_X + DOOR_W} y={300} width={34} height={FLOOR - 300} fill="#fff6e6" stroke={INK} strokeWidth={7} />
      <rect x={DOOR_X - 34} y={296} width={DOOR_W + 68} height={38} fill="#fff6e6" stroke={INK} strokeWidth={7} />
      {MARKS.slice(0, marks).map((m) => (
        <g key={m.label}>
          <line x1={DOOR_X + DOOR_W + 4} y1={m.y} x2={DOOR_X + DOOR_W + 30} y2={m.y} stroke="#5a4a8a" strokeWidth={6} strokeLinecap="round" />
          <text x={DOOR_X + DOOR_W + 44} y={m.y + 12} fontFamily={SANS} fontWeight={800} fontSize={34} fill="#5a4a8a">
            {m.label}
          </text>
        </g>
      ))}
      {newMark > 0 ? (
        <g>
          <line x1={DOOR_X + DOOR_W + 4} y1={560} x2={DOOR_X + DOOR_W + 4 + 26 * newMark} y2={560} stroke={RED} strokeWidth={7} strokeLinecap="round" />
          <text x={DOOR_X + DOOR_W + 44} y={572} fontFamily={SANS} fontWeight={800} fontSize={38} fill={RED} opacity={newMark}>
            16
          </text>
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------ kemik sahnesi

const PLATE_Y = 640; // büyüme bölgesinin (kapanmadan önce) üst kenarı
const BONE_L = 360;
const BONE_R = 720;
const CELL_COLS = 6;

/** sevimli kıkırdak hücresi */
const Cell: React.FC<{ x: number; y: number; r: number; t: number; k: number; sleepy?: number; bone?: number }> = ({ x, y, r, t, k, sleepy = 0, bone = 0 }) => {
  const sq = 1 + Math.sin(t * 4 + k * 1.7) * 0.05;
  const fill = bone > 0.5 ? "#f1dcb2" : "#bfe6ff";
  const eyeY = y - r * 0.12;
  return (
    <g transform={`translate(${x},${y}) scale(${sq},${2 - sq}) translate(${-x},${-y})`}>
      <circle cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={4} />
      {bone < 0.8 ? (
        <g opacity={1 - bone}>
          <circle cx={x - r * 0.18} cy={y - r * 0.05} r={r * 0.3} fill="#7cc4f2" opacity={0.7} />
          {sleepy > 0.5 ? (
            <>
              <path d={`M${x - r * 0.5},${eyeY} q${r * 0.15},${r * 0.12} ${r * 0.3},0`} stroke={INK} strokeWidth={3} fill="none" />
              <path d={`M${x + r * 0.2},${eyeY} q${r * 0.15},${r * 0.12} ${r * 0.3},0`} stroke={INK} strokeWidth={3} fill="none" />
            </>
          ) : (
            <>
              <circle cx={x - r * 0.35} cy={eyeY} r={r * 0.13} fill={INK} />
              <circle cx={x + r * 0.35} cy={eyeY} r={r * 0.13} fill={INK} />
            </>
          )}
          <path d={`M${x - r * 0.25},${y + r * 0.3} Q${x},${y + r * 0.5} ${x + r * 0.25},${y + r * 0.3}`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
};

/** bölünen tek hücre (büyütülmüş yuvarlak pencere) */
const Dividing: React.FC<{ x: number; y: number; t: number; o: number }> = ({ x, y, t, o }) => {
  if (o <= 0) return null;
  const u = (t * 0.55) % 1;
  const d = sm(u, 0.15, 0.7) * 46; // iki yavru hücre arası
  const pinch = 1 - sm(u, 0.4, 0.7);
  return (
    <g opacity={o}>
      <circle cx={x} cy={y} r={150} fill="#e9f6ff" stroke={INK} strokeWidth={8} />
      {pinch > 0.05 ? <ellipse cx={x} cy={y} rx={14 + d * 0.9} ry={54 * pinch + 6} fill="#bfe6ff" /> : null}
      <Cell x={x} y={y - d} r={56} t={t} k={1} />
      <Cell x={x} y={y + d} r={56} t={t} k={2} />
    </g>
  );
};

/** uzun kemik (üst uç + büyüme bölgesi + gövde). grow: kemik ucu yukarı kayar; open: bölge açıklığı (1 açık, 0 kapalı) */
const Bone: React.FC<{ grow: number; open: number; strong: number; glow: number; t: number; flow: number; sleepy: number }> = ({ grow, open, strong, glow, t, flow, sleepy }) => {
  const plateH = 26 + 150 * open;
  const top = PLATE_Y - grow; // bölgenin üst kenarı
  const capTop = top - 250;
  return (
    <g>
      {/* gövde */}
      <rect x={BONE_L + 20} y={top + plateH - 10} width={BONE_R - BONE_L - 40} height={1400} fill="#fbf3e2" stroke={INK} strokeWidth={8} />
      {/* iç doku: sağlamlaştıkça kalınlaşan çizgiler */}
      {Array.from({ length: 7 }).map((_, i) => (
        <path
          key={i}
          d={`M${BONE_L + 60 + i * 40},${top + plateH + 20} C${BONE_L + 40 + i * 44},${top + plateH + 260} ${BONE_L + 80 + i * 36},${top + plateH + 520} ${BONE_L + 70 + i * 38},1500`}
          stroke="#e4cfa6"
          strokeWidth={5 + strong * 9}
          fill="none"
          opacity={0.75}
        />
      ))}
      {/* yeni oluşan kemik katmanları */}
      {Array.from({ length: Math.floor(grow / 22) }).map((_, i) => (
        <g key={i}>
          {Array.from({ length: 5 }).map((__, j) => (
            <rect key={j} x={BONE_L + 32 + j * 60 + (i % 2) * 30} y={top + plateH + 4 + i * 22} width={56} height={18} rx={4} fill="#f1dcb2" stroke="#d4b98a" strokeWidth={3} />
          ))}
        </g>
      ))}
      {/* büyüme bölgesi (kıkırdak sütunları) */}
      <g>
        <rect x={BONE_L + 6} y={top - 6} width={BONE_R - BONE_L - 12} height={plateH + 12} rx={12} fill={Y} opacity={0.5 * glow * (0.6 + 0.4 * Math.sin(t * 5))} />
        <rect x={BONE_L + 14} y={top} width={BONE_R - BONE_L - 28} height={plateH} rx={8} fill={open > 0.3 ? "#a8dcff" : "#c9ccd6"} stroke={INK} strokeWidth={7} />
        <clipPath id="plate">
          <rect x={BONE_L + 14} y={top} width={BONE_R - BONE_L - 28} height={plateH} rx={8} />
        </clipPath>
        {open > 0.15 ? (
          <g clipPath="url(#plate)">
            {Array.from({ length: 5 }).map((_, row) =>
              Array.from({ length: CELL_COLS }).map((__, c) => {
                // satırlar aşağı akar: üstte bölünerek doğar, altta sertleşip kemiğe dönüşür
                const yy = top + 32 + (row - 1 + flow) * 56;
                const cx = BONE_L + 52 + c * 51;
                const born = row === 0 ? sm(flow, 0.1, 0.9) : 1;
                const bone = row >= 3 ? sm(row - 1 + flow, 2.0, 2.8) : 0;
                return born > 0.05 ? (
                  <g key={`${row}-${c}`} transform={`translate(${cx},${yy}) scale(${born}) translate(${-cx},${-yy})`}>
                    <Cell x={cx} y={yy} r={24} t={t} k={row * 7 + c} sleepy={sleepy} bone={bone} />
                  </g>
                ) : null;
              }),
            )}
          </g>
        ) : null}
      </g>
      {/* üst uç (eklem başı) */}
      <path
        d={`M${BONE_L},${top} C${BONE_L - 40},${top - 90} ${BONE_L - 30},${capTop + 40} ${BONE_L + 70},${capTop}
           C${BONE_L + 130},${capTop - 14} ${540 - 30},${capTop + 40} 540,${capTop + 70}
           C${540 + 30},${capTop + 40} ${BONE_R - 130},${capTop - 14} ${BONE_R - 70},${capTop}
           C${BONE_R + 30},${capTop + 40} ${BONE_R + 40},${top - 90} ${BONE_R},${top} Z`}
        fill="#fbf3e2"
        stroke={INK}
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <path d={`M${BONE_L + 70},${capTop + 70} Q540,${capTop + 150} ${BONE_R - 70},${capTop + 70}`} stroke="#e4cfa6" strokeWidth={8} fill="none" />
      {/* sağlamlık parıltısı */}
      {strong > 0.05 ? (
        <g opacity={strong}>
          <path d={`M${BONE_L + 40},${top + 200} L${BONE_L + 40},${top + 600}`} stroke="#fff" strokeWidth={16} strokeLinecap="round" opacity={0.8} />
          <path d={`M${BONE_L + 70},${top + 230} L${BONE_L + 70},${top + 380}`} stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.8} />
        </g>
      ) : null}
    </g>
  );
};

/** cetvel (sağda): boy artışını gösterir */
const Ruler: React.FC<{ x: number; y0: number; y1: number; mark: number; o: number }> = ({ x, y0, y1, mark, o }) => (
  <g opacity={o}>
    <rect x={x - 40} y={y0} width={80} height={y1 - y0} rx={10} fill="#fff6d6" stroke={INK} strokeWidth={6} />
    {Array.from({ length: Math.floor((y1 - y0) / 30) }).map((_, i) => (
      <line key={i} x1={x - 40} y1={y0 + 15 + i * 30} x2={x - 40 + (i % 5 === 0 ? 40 : 22)} y2={y0 + 15 + i * 30} stroke={INK} strokeWidth={4} />
    ))}
    <path d={`M${x - 70},${mark} L${x - 44},${mark - 16} L${x - 44},${mark + 16} Z`} fill={RED} stroke={INK} strokeWidth={4} />
  </g>
);

const Dna: React.FC<{ x: number; y: number; p: number; t: number }> = ({ x, y, p, t }) =>
  p <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${p})`}>
      <circle r={130} fill="#fff" stroke={INK} strokeWidth={7} />
      {Array.from({ length: 9 }).map((_, i) => {
        const yy = -90 + i * 22.5;
        const ph = i * 0.7 + t * 2;
        const a = Math.sin(ph) * 50;
        return (
          <g key={i}>
            <line x1={-a} y1={yy} x2={a} y2={yy} stroke="#c9ccd6" strokeWidth={5} />
            <circle cx={-a} cy={yy} r={10} fill="#ff6b8a" stroke={INK} strokeWidth={4} />
            <circle cx={a} cy={yy} r={10} fill="#5aa9e6" stroke={INK} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );

const Flask: React.FC<{ x: number; y: number; p: number; t: number }> = ({ x, y, p, t }) =>
  p <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${p})`}>
      <circle r={130} fill="#fff" stroke={INK} strokeWidth={7} />
      <path d="M-26,-80 L-26,-24 L-70,60 Q-78,84 -50,84 L50,84 Q78,84 70,60 L26,-24 L26,-80 Z" fill="#e9f6ff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M-50,30 L50,30 L68,62 Q74,78 50,78 L-50,78 Q-74,78 -68,62 Z" fill="#b48cff" />
      {[0, 1, 2].map((k) => {
        const u = (t * 0.8 + k / 3) % 1;
        return <circle key={k} cx={-20 + k * 20} cy={60 - u * 110} r={8 - u * 4} fill="#b48cff" stroke={INK} strokeWidth={3} opacity={1 - u} />;
      })}
      <rect x={-36} y={-96} width={72} height={18} rx={6} fill="#c9ccd6" stroke={INK} strokeWidth={5} />
    </g>
  );

/** stilize diz röntgeni: open=1 büyüme plağı koyu çizgi olarak görünür, 0 kapanmış */
const Xray: React.FC<{ x: number; y: number; open: boolean; label: string; p: number }> = ({ x, y, open, label, p }) =>
  p <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${p})`}>
      <rect x={-170} y={-260} width={340} height={520} rx={22} fill="#141a2b" stroke={INK} strokeWidth={8} />
      <g fill="#d9e1ee" opacity={0.92}>
        {/* uyluk kemiği */}
        <rect x={-62} y={-262} width={124} height={190} />
        <path d="M-62,-80 C-70,-30 -120,-20 -112,20 Q-60,44 0,22 Q60,44 112,20 C120,-20 70,-30 62,-80 Z" />
        {/* kaval kemiği */}
        <path d="M-104,70 Q0,52 104,70 L96,118 C70,130 64,150 60,262 L-60,262 C-64,150 -70,130 -96,118 Z" />
      </g>
      <g fill="#ffffff" opacity={0.35}>
        <rect x={-30} y={-262} width={26} height={180} />
        <rect x={-30} y={130} width={24} height={132} />
      </g>
      {open ? (
        <g fill="#141a2b">
          <path d="M-100,-20 Q-50,-6 0,-16 Q50,-6 100,-20 L100,-6 Q50,8 0,-2 Q-50,8 -100,-6 Z" />
          <path d="M-92,92 Q0,80 92,92 L92,104 Q0,92 -92,104 Z" />
        </g>
      ) : (
        <g stroke="#ffffff" strokeWidth={3} opacity={0.5} fill="none">
          <path d="M-100,-13 Q-50,1 0,-9 Q50,1 100,-13" />
          <path d="M-92,98 Q0,86 92,98" />
        </g>
      )}
      <Txt x={0} y={330} size={54}>
        {label}
      </Txt>
    </g>
  );

const Hoop: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-10} y={-120} width={150} height={110} rx={8} fill="#fff" stroke={INK} strokeWidth={6} />
    <rect x={30} y={-90} width={60} height={46} fill="none" stroke={RED} strokeWidth={6} />
    <ellipse cx={30} cy={-20} rx={56} ry={14} fill="none" stroke={RED} strokeWidth={8} />
    {Array.from({ length: 5 }).map((_, i) => (
      <line key={i} x1={-20 + i * 25} y1={-14} x2={-10 + i * 20} y2={50} stroke="#fff" strokeWidth={4} />
    ))}
  </g>
);

const Ball: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <circle r={52} fill="#ff8a3d" stroke={INK} strokeWidth={6} />
    <path d="M-52,0 L52,0 M0,-52 L0,52" stroke={INK} strokeWidth={4} />
    <path d="M-36,-38 Q-10,0 -36,38 M36,-38 Q10,0 36,38" stroke={INK} strokeWidth={4} fill="none" />
  </g>
);

const Barbell: React.FC<{ x: number; y: number; w: number; plate: number; bend?: number }> = ({ x, y, w, plate, bend = 0 }) => (
  <g transform={`translate(${x},${y})`}>
    <path d={`M${-w / 2},${bend} Q0,${-bend} ${w / 2},${bend}`} stroke="#8b93a6" strokeWidth={16} fill="none" strokeLinecap="round" />
    <path d={`M${-w / 2},${bend} Q0,${-bend} ${w / 2},${bend}`} stroke={INK} strokeWidth={4} fill="none" opacity={0.4} />
    {[-1, 1].map((sd) => (
      <g key={sd} transform={`translate(${(sd * w) / 2 - sd * 40},${bend})`}>
        <rect x={-22} y={-plate / 2} width={44} height={plate} rx={10} fill="#3b3f58" stroke={INK} strokeWidth={6} />
        <rect x={sd * 26 - 14} y={-plate * 0.38} width={28} height={plate * 0.76} rx={8} fill="#5a5f7a" stroke={INK} strokeWidth={5} />
      </g>
    ))}
  </g>
);

const Card: React.FC<{ x: number; y: number; n: number; title: string[]; p: number; icon: React.ReactNode; color: string }> = ({ x, y, n, title, p, icon, color }) =>
  p <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${p}) rotate(${(n - 2) * 3})`}>
      <rect x={-140} y={-170} width={280} height={340} rx={26} fill={color} stroke={INK} strokeWidth={7} />
      <circle cx={-100} cy={-130} r={34} fill="#fff" stroke={INK} strokeWidth={6} />
      <Txt x={-100} y={-116} size={40} fill={INK} sw={0}>
        {n}
      </Txt>
      <g transform="translate(0,-40)">{icon}</g>
      {title.map((l, k) => (
        <Txt key={k} x={0} y={78 + k * 48} size={40} fill={INK} sw={0}>
          {l}
        </Txt>
      ))}
    </g>
  );

const Moon: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) =>
  p <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${p})`}>
      <circle r={120} fill="#2f3a66" stroke={INK} strokeWidth={7} />
      <path d="M20,-70 A70,70 0 1,0 50,40 A56,56 0 1,1 20,-70 Z" fill="#ffe27a" stroke={INK} strokeWidth={5} />
      <text x={-52} y={-30} fontFamily={SANS} fontWeight={800} fontSize={34} fill="#fff">
        z
      </text>
      <text x={-74} y={-60} fontFamily={SANS} fontWeight={800} fontSize={26} fill="#fff">
        z
      </text>
    </g>
  );

const Plate: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) =>
  p <= 0 ? null : (
    <g transform={`translate(${x},${y}) scale(${p})`}>
      <circle r={120} fill="#fff" stroke={INK} strokeWidth={7} />
      <circle r={84} fill="#f6f6f6" stroke={INK} strokeWidth={5} />
      <ellipse cx={-26} cy={-14} rx={36} ry={26} fill="#ffcf6b" stroke={INK} strokeWidth={4} />
      <circle cx={30} cy={-24} r={20} fill="#ff6b5b" stroke={INK} strokeWidth={4} />
      <path d="M-40,30 Q0,10 40,30 Q30,52 0,54 Q-30,52 -40,30 Z" fill="#7bd17b" stroke={INK} strokeWidth={4} />
    </g>
  );

const Plane: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <g transform={`translate(${x},${y}) rotate(${r})`}>
    <path d="M-60,0 L60,-36 L-10,46 L-14,10 Z" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-14,10 L60,-36" stroke={INK} strokeWidth={4} />
  </g>
);

// ------------------------------------------------------------ kahraman (anime figür)

/** eski karikatür ölçeğini (ToonGirl2D ~890 birim boy) anime figüre (~1300 birim) çevirir */
const HERO_K = 0.685;
type P2 = [number, number];
const mixP = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

const Hero: React.FC<{ x: number; y: number; scale: number; pose?: AnimePose; expr?: AnimeExpr; t: number; uid: string; look?: AnimeLook }> = ({ x, y, scale, pose, expr, t, uid, look }) => (
  <g transform={`translate(${x},${y}) scale(${scale * HERO_K}) translate(-540,-1586)`}>
    <AnimeTeen uid={uid} pose={pose} expr={expr} t={t} look={look} />
  </g>
);

/** kollar aşağıda (sağ) + sol elde dambıl; c: 0 aşağı, 1 yukarı (curl) */
/** kollar aşağıda, eller boş */
const DOWN: AnimePose = { elR: [404, 840], wrR: [396, 1000], elL: [676, 846], wrL: [684, 1004], itemL: null };

const curlPose = (c: number, both = false): AnimePose => ({
  elR: [404, 840],
  wrR: both ? mixP([396, 1000], [410, 720], c) : [396, 1000],
  itemR: both ? "dumbbell" : null,
  elL: [700, 840],
  wrL: mixP([724, 1000], [690, 720], c),
});

// ------------------------------------------------------------ ana kompozisyon

export type BoyUzamaProps = { audioName: string; data: VoiceoverData | null; look?: BoyStyle };

export const BoyUzama: React.FC<BoyUzamaProps> = ({ audioName, data, look = "kagit" }) => {
  const th = THEMES[look];
  const Back = th.Back;
  const Over = th.Over;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const kisa = audioName.endsWith("-kisa");
  const lines = kisa ? KISA_LINES : BOY_LINES;
  const tl: TL = data ? voiceTimeline(data, lines) : BOY_TL;
  /** sahneler orijinal satır numaralarıyla yazıldı; kısa sürümde çıkarılan satır, sonraki kalan satırın başına düşer */
  const L = (i: number) => {
    if (!kisa || !data) return tl.at(i);
    const j = KISA_KEEP.findIndex((k) => k >= i);
    return j < 0 ? tl.total : tl.at(j);
  };
  const has = (i: number) => !kisa || !data || KISA_KEEP.includes(i);
  const blink = blinkAt(t);

  // sahne aralıkları
  const zoomS = L(1) + (L(2) - L(1)) * 0.5;
  const zoomE = L(2) + 0.2;
  const zoomK = sm(t, zoomS, zoomE);
  const room = t < zoomE + 0.1;
  const bone = t > zoomS + 0.3 && t < L(7) + 0.3;
  const boneIn = sm(t, zoomS + 0.3, zoomE + 0.1);
  const boneOut = sm(t, L(7) - 0.3, L(7) + 0.3);
  const stage = t > L(7) - 0.3 && t < L(9) + 0.3;
  const danger = t > L(9) - 0.3 && t < L(10) + 0.3;
  const rules = t > L(10) - 0.3 && t < L(11) + 0.3;
  const sleep = t > L(11) - 0.3 && t < L(12) + 0.3;
  const outro = t > L(12) - 0.3;

  // --- oda: genç dambıl çalışıyor
  const curl = (1 - Math.cos(t * 5)) / 2;
  // önce dambıl çalışır, annenin sözünden sonra eli çenesinde düşünür
  const thinkK = sm(t, L(0) + (L(1) - L(0)) * 0.45, L(0) + (L(1) - L(0)) * 0.45 + 0.4);
  const base = curlPose(curl * (1 - thinkK));
  const tPose: AnimePose = {
    ...base,
    elR: mixP(base.elR!, [430, 860], thinkK),
    wrR: mixP(base.wrR!, [500, 640], thinkK),
    wrL: mixP(base.wrL!, [724, 1000], thinkK),
    head: -5 * thinkK,
  };
  const tExpr: AnimeExpr = thinkK > 0.5 ? "think" : "grin";

  // --- kemik
  const grow = interpolate(t, [L(3), L(5)], [0, 88], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const open = 1 - sm(t, L(5) + 0.5, L(5) + 1.6);
  const strong = sm(t, L(4) + 1.2, L(4) + 2.2);
  const glow = win(t, L(2) + 0.2, L(3) + 0.4, 0.3);
  // hücre akışı: satır 3'te başlar, plak kapanırken durur
  const flow = t > L(3) ? ((t - L(3)) * 0.9) % 1 : 0;
  const sleepy = t > L(5) + 0.3 ? 1 : 0;
  // satır 5'in ikinci cümlesi: röntgen
  const xr = tl.wordAt ? tl.wordAt(5, 6) - 0.1 : L(5) + (L(6) - L(5)) * 0.5;
  // hücreler anlatılırken plağa yumuşak yaklaşma
  const zk = 1 + 0.45 * sm(t, L(2) + 0.3, L(2) + 1.4) * (1 - sm(t, L(4) + 0.1, L(4) + 1.0));
  const zcy = PLATE_Y - grow + 60;
  const zx = (x: number) => 540 + (x - 540) * zk;
  const zy = (y: number) => zcy + (y - zcy) * zk;

  // --- bitiş fade
  const fade = interpolate(t, [0, 0.12, tl.total - 0.3, tl.total], [0.6, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill lang="tr" className={`th-${look}`} style={{ background: th.bg, overflow: "hidden" }}>
      {th.css ? <style>{th.css}</style> : null}
      {Back ? <Back /> : <Paper />}

      <svg className="scene" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* ===== 0–1: oda ===== */}
        {room ? (
          <g
            opacity={1 - sm(t, zoomS + 0.3, zoomE)}
            transform={`translate(660,1090) scale(${1 + zoomK * 3.2}) translate(-660,-1090)`}
          >
            <Room marks={3} />
            {/* anne kapıda */}
            <g opacity={sm(t, 0.05, 0.3)}>
              {(() => {
                // konuşurken parmağını kaldırıp "dikkat!" der, sonra gence sevecen bir gülümsemeyle bakar
                const talkEnd = L(0) + (L(1) - L(0)) * 0.5;
                const talking = t < talkEnd;
                const down = sm(t, talkEnd - 0.1, talkEnd + 0.35);
                const mouth = talking ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13)) : 0;
                const pose: AnimePose = {
                  elR: mixP([404, 700], [404, 840], down),
                  wrR: mixP([432, 540 + Math.sin(t * 6) * 6], [396, 1000], down),
                  handR: down > 0.5 ? "fist" : "point",
                  elL: [736, 800],
                  wrL: [640, 922],
                  itemL: null,
                  head: 4 - 6 * down,
                  mouth,
                };
                return <Hero uid="anne" look={A_MOM} x={DOOR_X + DOOR_W / 2} y={FLOOR} scale={0.92} pose={pose} expr={talking ? "worry" : "smile"} t={t} />;
              })()}
            </g>
            <DoorFrame marks={3} />
            <Hero uid="oda" x={680} y={FLOOR} scale={0.92} pose={tPose} expr={tExpr} t={t} />
            <Bubble x={420} y={250} w={600} h={230} tx={300} ty={600} p={pop(t, 0.25) * (1 - sm(t, L(0) + (L(1) - L(0)) * 0.5, L(0) + (L(1) - L(0)) * 0.5 + 0.3))} lines={["AĞIRLIK KALDIRMA,", "BOYUN KISA KALIR!"]} size={50} />
            {/* soru işareti */}
            {t > L(0) + (L(1) - L(0)) * 0.5 ? (
              <g transform={`translate(860,${420 + Math.sin(t * 3) * 10}) scale(${pop(t, L(0) + (L(1) - L(0)) * 0.5 + 0.1)})`}>
                <Txt x={0} y={0} size={220} fill={Y} sw={14}>
                  ?
                </Txt>
              </g>
            ) : null}
            {/* büyüteç bacağa gelir */}
            {t > L(1) + 0.3 ? (
              <g
                opacity={sm(t, L(1) + 0.3, L(1) + 0.6)}
                transform={`translate(${interpolate(sm(t, L(1) + 0.3, zoomS), [0, 1], [900, 660])},${interpolate(sm(t, L(1) + 0.3, zoomS), [0, 1], [760, 1090])})`}
              >
                <circle r={80} fill="#ffffff" opacity={0.35} stroke={INK} strokeWidth={12} />
                <line x1={58} y1={58} x2={140} y2={140} stroke={INK} strokeWidth={24} strokeLinecap="round" />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ===== 2–6: kemiğin içi ===== */}
        {bone ? (
          <g opacity={boneIn * (1 - boneOut)} transform={`translate(540,700) scale(${0.9 + 0.1 * boneIn}) translate(-540,-700)`}>
            <rect x={-100} y={-100} width={1280} height={2200} fill="#f7d7cc" />
            {Array.from({ length: 11 }).map((_, i) => (
              <path key={i} d={`M${i * 110 - 40},-50 C${i * 110 + 30},600 ${i * 110 - 60},1200 ${i * 110 + 10},2000`} stroke="#eebcaf" strokeWidth={26} fill="none" opacity={0.6} />
            ))}
            <g opacity={1 - 0.75 * Math.max(sm(t, xr - 0.2, xr + 0.3), sm(t, L(6), L(6) + 0.4))}>
              <g transform={`translate(540,${zcy}) scale(${zk}) translate(-540,${-zcy})`}>
                <Bone grow={grow} open={open} strong={strong} glow={glow} t={t} flow={open > 0.5 ? flow : 0} sleepy={sleepy} />
              </g>
              <Tag x={zx(BONE_R - 30)} y={zy(PLATE_Y - grow + 40)} tx={760} ty={160} text="büyüme plağı" o={win(t, L(2) + 0.5, L(3) + 0.2, 0.25)} color="#d6efff" />
              <Ruler x={950} y0={420} y1={1300} mark={PLATE_Y + 20 - grow} o={sm(t, L(3), L(3) + 0.4) * (1 - sm(t, L(6), L(6) + 0.3))} />
              {/* bölünür → dizilir → kemiğe dönüşür */}
              {t > L(3) - 0.1 && t < L(4) + 0.2 ? (
                <g opacity={win(t, L(3) - 0.1, L(4) + 0.2, 0.3)}>
                  <Dividing x={170} y={1080} t={t - L(3)} o={sm(t, L(3), L(3) + 0.4)} />
                  <Tag x={zx(BONE_L + 60)} y={zy(PLATE_Y - grow + 24)} tx={260} ty={160} text="bölünür" o={sm(t, L(3) + 0.3, L(3) + 0.6)} color="#d6efff" />
                  <Tag x={zx(BONE_R - 50)} y={zy(PLATE_Y - grow + 80)} tx={820} ty={160} text="dizilir" o={sm(t, L(3) + (L(4) - L(3)) * 0.25, L(3) + (L(4) - L(3)) * 0.25 + 0.3)} color="#d6efff" />
                  <Tag x={zx(BONE_R - 80)} y={zy(PLATE_Y - grow + 165)} tx={700} ty={1200} text="kemiğe dönüşür" o={sm(t, L(3) + (L(4) - L(3)) * 0.45, L(3) + (L(4) - L(3)) * 0.45 + 0.3)} color="#fff3b0" />
                </g>
              ) : null}
              {/* ağırlık kaldıran genç (küçük pencere) */}
              {t > L(4) - 0.1 && t < L(5) + 0.2 ? (
                <g opacity={win(t, L(4) - 0.1, L(5) + 0.2, 0.3)}>
                  <circle cx={190} cy={1000} r={150} fill="#fff6e6" stroke={INK} strokeWidth={8} />
                  <clipPath id="inset">
                    <circle cx={190} cy={1000} r={146} />
                  </clipPath>
                  <g clipPath="url(#inset)">
                    <Hero uid="pencere" x={190} y={1290} scale={0.4} pose={curlPose(curl, true)} expr="grin" t={t} />
                  </g>
                  <Bubble x={600} y={170} w={380} h={130} tx={510} ty={PLATE_Y - grow + 30} p={pop(t, L(4) + 0.6)} lines={["Biz devam!"]} size={50} />
                  <Tag x={BONE_L + 60} y={PLATE_Y + 400} tx={250} ty={760} text="daha sağlam" o={sm(t, L(4) + 1.6, L(4) + 2.0)} color="#fff3b0" />
                </g>
              ) : null}
              {/* ergenlik bitince kapanır */}
              {t > L(5) - 0.1 ? (
                <g opacity={1 - sm(t, xr - 0.3, xr)}>
                  <g opacity={sm(t, L(5), L(5) + 0.3)}>
                    <rect x={330} y={170} width={420} height={110} rx={55} fill="#fff" stroke={INK} strokeWidth={7} />
                    <Txt x={540} y={244} size={56} fill={INK} sw={0}>
                      {`${Math.round(interpolate(t, [L(5) + 0.2, L(5) + 1.6], [12, 18], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))} yaş`}
                    </Txt>
                  </g>
                  <Tag x={BONE_R - 40} y={PLATE_Y - grow + 14} tx={850} ty={480} text="plak kapandı" o={sm(t, L(5) + 1.5, L(5) + 1.8)} color="#e8e9ef" />
                </g>
              ) : null}
            </g>
            {/* röntgende çizgi kaybolur */}
            {t > xr - 0.1 && t < L(6) + 0.3 ? (
              <g opacity={1 - sm(t, L(6) - 0.2, L(6) + 0.3)}>
                <Xray x={300} y={760} open label="12 YAŞ" p={pop(t, xr)} />
                <Xray x={780} y={760} open={false} label="18 YAŞ" p={pop(t, xr + 0.35)} />
                <Tag x={300 + 90} y={760 - 12} tx={300} ty={400} text="açık plak" o={sm(t, xr + 0.6, xr + 0.9)} color="#d6efff" />
                <Tag x={780 + 90} y={760 - 8} tx={780} ty={400} text="çizgi yok" o={sm(t, xr + 1.0, xr + 1.3)} color="#fff3b0" />
              </g>
            ) : null}
            {/* kararı veren: genler + hormonlar */}
            {has(6) && t > L(6) - 0.1 ? (
              <g>
                <RedX x={540} y={480} s={110} p={sm(t, L(6) + 0.5, L(6) + 0.9)} />
                <g transform={`translate(540,480) scale(${pop(t, L(6) + 0.05)})`}>
                  <Dumbbell s={1.3} />
                </g>
                <Dna x={300} y={900} p={pop(t, L(6) + 1.0)} t={t} />
                <Flask x={780} y={900} p={pop(t, L(6) + 1.4)} t={t} />
                <g opacity={sm(t, L(6) + 1.2, L(6) + 1.5)}>
                  <Txt x={300} y={1105} size={50}>
                    GENLER
                  </Txt>
                </g>
                <g opacity={sm(t, L(6) + 1.6, L(6) + 1.9)}>
                  <Txt x={780} y={1105} size={50}>
                    HORMONLAR
                  </Txt>
                </g>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ===== 7–8: halterci ve basketbolcu ===== */}
        {stage && has(7) ? (
          <g opacity={win(t, L(7) - 0.3, L(9) + 0.3, 0.4)}>
            <rect x={0} y={FLOOR} width={1080} height={600} fill="#d9b98a" />
            <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} />
            {/* arka cetvel */}
            <g opacity={0.5}>
              {Array.from({ length: 11 }).map((_, i) => (
                <g key={i}>
                  <line x1={40} y1={FLOOR - i * 100} x2={1040} y2={FLOOR - i * 100} stroke="#c7a878" strokeWidth={3} strokeDasharray="14 14" />
                </g>
              ))}
            </g>
            {/* halterci (kısa, geniş) */}
            <Hero uid="halterci" look={A_LIFTER} x={300} y={FLOOR} scale={0.7} pose={{ elR: [372, 520], wrR: [384, 360], elL: [708, 520], wrL: [696, 360], itemL: null }} expr="ouch" t={t} />
            <Barbell x={300} y={FLOOR - (1586 - 384) * 0.7 * HERO_K} w={520} plate={150} bend={6} />
            {/* basketbolcu (uzun) */}
            <Hero uid="basket" look={A_BALLER} x={780} y={FLOOR} scale={1.12} pose={{ ...DOWN, elR: [384, 860], wrR: [372, 1000] }} expr="grin" t={t} />
            <Ball x={780 + (540 + (372 - 540) * 0.9 - 540) * 1.12 * HERO_K} y={FLOOR - (1586 - 1060) * 1.12 * HERO_K} />
            {/* etiketler */}
            <g opacity={sm(t, L(7) + 1.4, L(7) + 1.7)}>
              <rect x={110} y={330} width={380} height={96} rx={48} fill="#fff" stroke={INK} strokeWidth={7} />
              <Txt x={300} y={394} size={46} fill={INK} sw={0}>
                kısaltmadı
              </Txt>
            </g>
            {t > L(8) - 0.1 ? (
              <g>
                <g opacity={sm(t, L(8) + 0.2, L(8) + 0.5) * (1 - sm(t, L(8) + (L(9) - L(8)) * 0.55, L(8) + (L(9) - L(8)) * 0.55 + 0.3))}>
                  <path d="M120,620 L120,1000" stroke={RED} strokeWidth={10} strokeLinecap="round" />
                  <path d="M96,650 L120,610 L144,650 Z M96,970 L120,1010 L144,970 Z" fill={RED} />
                  <Tag x={140} y={800} tx={330} ty={200} text="kısa yol = avantaj" o={1} color="#fff3b0" size={40} />
                </g>
                <g opacity={sm(t, L(8) + (L(9) - L(8)) * 0.55, L(8) + (L(9) - L(8)) * 0.55 + 0.3)}>
                  <rect x={560} y={150} width={440} height={96} rx={48} fill="#fff" stroke={INK} strokeWidth={7} />
                  <Txt x={780} y={214} size={46} fill={INK} sw={0}>
                    uzatmadı
                  </Txt>
                </g>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ===== 9: asıl tehlike ===== */}
        {danger ? (
          <g opacity={win(t, L(9) - 0.3, L(10) + 0.3, 0.4)}>
            <rect x={0} y={FLOOR} width={1080} height={600} fill="#d9b98a" />
            <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} />
            {(() => {
              const wob = Math.sin(t * 7) * 4;
              return (
                <g transform={`rotate(${8 + wob},540,${FLOOR})`}>
                  <Hero uid="tehlike" x={540} y={FLOOR} scale={0.86} pose={{ elR: [372, 520], wrR: [384, 360], elL: [708, 520], wrL: [696, 360], itemL: null, head: 6 }} expr="ouch" t={t} />
                  <Barbell x={540} y={FLOOR - (1586 - 384) * 0.86 * HERO_K} w={900} plate={300} bend={-40} />
                </g>
              );
            })()}
            <Burst x={840} y={300} text="DUR!" p={pop(t, L(9) + 0.5, 9)} />
            <Tag x={600} y={FLOOR - 470} tx={860} ty={1180} text="bozuk teknik" o={sm(t, L(9) + 1.2, L(9) + 1.5)} color="#ffd6d0" />
            <Tag x={170} y={FLOOR - 900} tx={240} ty={300} text="aşırı yük" o={sm(t, L(9) + 1.7, L(9) + 2.0)} color="#ffd6d0" />
            <g opacity={sm(t, L(9) + 0.9, L(9) + 1.2)}>
              <rect x={60} y={1150} width={300} height={96} rx={48} fill="#fff" stroke={INK} strokeWidth={7} />
              <Txt x={210} y={1214} size={44} fill={INK} sw={0}>
                koç yok
              </Txt>
            </g>
          </g>
        ) : null}

        {/* ===== 10: kurallar ===== */}
        {rules ? (
          <g opacity={win(t, L(10) - 0.3, L(11) + 0.3, 0.4)}>
            <rect x={0} y={FLOOR} width={1080} height={600} fill="#d9b98a" />
            <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} />
            {(() => {
              const k = (1 - Math.cos(t * 3)) / 2;
              return (
                <Hero
                  uid="squat"
                  x={430}
                  y={FLOOR}
                  scale={0.66}
                  pose={{ elR: [380, 900], wrR: [360, 1060], elL: [700, 900], wrL: [720, 1060], itemR: "dumbbell", squat: k }}
                  expr="grin"
                  t={t}
                />
              );
            })()}
            <Hero uid="koc" look={A_COACH} x={840} y={FLOOR} scale={0.7} pose={{ ...DOWN, elL: [720, 600], wrL: [770 + Math.sin(t * 6) * 14, 470] }} expr="smile" t={t} />
            <Card x={200} y={430} n={1} title={["ÖNCE", "TEKNİK"]} p={pop(t, L(10) + 0.5)} color="#d6efff" icon={<line x1={-80} y1={0} x2={80} y2={0} stroke="#b07a4a" strokeWidth={14} strokeLinecap="round" />} />
            <Card x={540} y={430} n={2} title={["HAFİFTEN", "BAŞLA"]} p={pop(t, L(10) + 1.1)} color="#fff3b0" icon={<Dumbbell s={0.7} />} />
            <Card x={880} y={430} n={3} title={["KOÇLA", "ÇALIŞ"]} p={pop(t, L(10) + 1.8)} color="#c9f5cf" icon={<g transform="scale(1.6)"><Whistle /></g>} />
          </g>
        ) : null}

        {/* ===== 11: uyku + beslenme (kapıya dönüş) ===== */}
        {sleep && has(11) ? (
          <g opacity={win(t, L(11) - 0.3, L(12) + 0.3, 0.4)}>
            <Room marks={3} />
            <DoorFrame marks={3} newMark={sm(t, L(11) + 0.4, L(11) + 0.9)} />
            <Hero uid="kapi" x={DOOR_X + DOOR_W / 2 + 40} y={FLOOR} scale={0.92 * (1 + 0.04 * sm(t, L(11) + 0.2, L(11) + 0.7))} pose={{ elR: [404, 840], wrR: [396, 1000], elL: [676, 846], wrL: [684, 1004], itemL: null }} expr="happy" t={t} />
            <Moon x={760} y={620} p={pop(t, L(11) + 1.0)} />
            <Plate x={760} y={1010} p={pop(t, L(11) + 1.6)} />
            <g opacity={sm(t, L(11) + 1.1, L(11) + 1.4)}>
              <Txt x={760} y={800} size={48}>
                UYKU
              </Txt>
            </g>
            <g opacity={sm(t, L(11) + 1.7, L(11) + 2.0)}>
              <Txt x={760} y={1190} size={48}>
                BESLENME
              </Txt>
            </g>
          </g>
        ) : null}

        {/* ===== 12: kapanış ===== */}
        {outro ? (
          <g opacity={sm(t, L(12) - 0.3, L(12) + 0.1)}>
            <rect x={0} y={FLOOR} width={1080} height={600} fill="#d9b98a" />
            <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} />
            <Hero uid="son" x={540} y={FLOOR} scale={0.92} pose={{ elR: [404, 840], wrR: [396, 1000], elL: [730, 790], wrL: [700, 620], itemL: "phone" }} expr="wink" t={t} />
            {(() => {
              const u = sm(t, L(12) + 0.5, L(12) + 1.8);
              return u > 0 && u < 1 ? <Plane x={700 + u * 420} y={560 - u * 420 + Math.sin(u * 6) * 30} r={-20} /> : null;
            })()}
            <g transform={`translate(540,330) scale(${pop(t, L(12) + 0.3)})`}>
              <rect x={-230} y={-70} width={460} height={140} rx={70} fill={Y} stroke={INK} strokeWidth={8} />
              <Txt x={0} y={22} size={64} fill={INK} sw={0}>
                GÖNDER ➤
              </Txt>
            </g>
          </g>
        ) : null}
      </svg>

      {Over ? <Over /> : null}
      <Captions t={t} tl={tl} cap={th.cap} lines={lines} />
      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          {/* konuşmanın altında kısık müzik; kapanışta biraz yükselir */}
          <Audio
            src={staticFile("music/623.mp3")}
            volume={(f) => {
              const mt = f / fps;
              const end = data.durationInSeconds;
              const base = interpolate(mt, [0, 0.6, end, end + 0.5], [0, 0.06, 0.06, 0.14], { extrapolateRight: "clamp" });
              return base * interpolate(mt, [tl.total - 1.0, tl.total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            }}
          />
        </>
      ) : null}
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
