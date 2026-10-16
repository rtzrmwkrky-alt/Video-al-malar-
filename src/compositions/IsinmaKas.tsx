/**
 * "Isınmadan başlama!" — konuşan kas karakteri ile komik, her yaşa uygun Reels (≤40 sn, sessiz taslak).
 * Uykucu, üşüyen bacak kası sporcuyu halterden önce durdurur; buz gibi lastik çekilince "ÇAT!";
 * 5-10 dk ısınma ile kas soğuk morumsu renkten canlı kırmızıya döner.
 * Döngü (loop): video, sporcunun halterlere koşmasıyla biter ve aynı koşuyla başlar —
 * Instagram başa sardığında kesintisiz devam eder.
 * Zamanlama satırlardan (`timeline`); sahneler satır sırasına (`at(i)`) bağlı, ses gelince sadece zamanlar değişir.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS, loadFonts } from "../fonts";
import { type Line, pop as rawPop, sm, timeline, win } from "../ornek/common";
import {
  INK,
  KasKarakter,
  ToonGuy,
  blinkAt,
  guyStand,
  kasStand,
  type GuyExpr,
  type GuyPose,
  type KasExpr,
  type KasPose,
} from "../cartoon/IsinmaChars";

loadFonts();

const pop = (t: number, at: number) => rawPop(t, at, 30, 16);

type Who = "kas" | "adam" | "fx" | "chip" | "card";
type ILine = Line & { who: Who };

export const ISINMA_LINES: ILine[] = [
  { who: "kas", text: "DUR! DUR! DUR!" },
  { who: "kas", text: "Ben daha uyanmadım!", hl: ["uyanmadım!"], hold: 0.2 },
  { who: "adam", text: "Ne olacak? İki dakikalık iş.", hl: ["iki", "dakikalık"] },
  { who: "kas", text: "Şu lastiğe bak. Buz gibi.", hl: ["buz"] },
  { who: "kas", text: "Soğukken çekersen…", hl: ["soğukken"], hold: 0.3 },
  { who: "fx", text: "ÇAT!" },
  { who: "kas", text: "İşte ben şu an o lastiğim.", hl: ["o", "lastiğim."] },
  { who: "kas", text: "Önce beni ısıt. Sadece 5-10 dakika.", hl: ["ısıt.", "5-10", "dakika."], hold: 0.2 },
  { who: "chip", text: "Hafif koşu", hold: 0.6 },
  { who: "chip", text: "Kol çevirme", hold: 0.6 },
  { who: "chip", text: "Bacak sallama", hold: 0.6 },
  { who: "kas", text: "Kan geldi… ısındım… esnedim!", hl: ["ısındım…"], hold: 0.3 },
  { who: "kas", text: "Şimdi kaldır bakalım!", hl: ["kaldır"], hold: 0.8 },
  { who: "card", text: "Isınma 5 dakika. Sakatlık aylarca.", hold: 0.6 },
  { who: "kas", text: "Yarın da ısınıyoruz, tamam mı?", hl: ["yarın"] },
  { who: "adam", text: "Tamam tamam!", hold: 0.3 },
];

/** döngü kesiti: sonda koşu başlar, başta devam eder */
const LOOP_END = 0.63;
const LOOP_START = 0.77;

export const ISINMA_TL = timeline(ISINMA_LINES, LOOP_END);

const CORAL = "#ff4f64";
const BLUE = "#2f6bff";

// ------------------------------------------------------------ yerleşim

const FLOOR = 1560;
const GUY_X = 280;
const GUY_S = 0.95;
const KAS_X = 800;
const KAS_S = 1.02;

// ------------------------------------------------------------ arka plan

const Gym: React.FC<{ t: number; warm: number; clockSpin: number }> = ({ t, warm, clockSpin }) => {
  const sky1 = warm > 0.5 ? "#ffd27a" : "#ffe3a8";
  return (
    <g>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe8d4" />
          <stop offset="1" stopColor="#ffcfb6" />
        </linearGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fd3ff" />
          <stop offset="0.7" stopColor={sky1} />
          <stop offset="1" stopColor="#ffb08a" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b8c92" />
          <stop offset="1" stopColor="#25606a" />
        </linearGradient>
      </defs>
      <rect x={-600} y={-400} width={2280} height={FLOOR + 400} fill="url(#wall)" />
      {/* pencere */}
      <g>
        <rect x={190} y={420} width={700} height={560} rx={36} fill="url(#sky)" stroke={INK} strokeWidth={10} />
        <circle cx={700} cy={760} r={80} fill="#fff1a8" opacity={0.95} />
        {[
          [210, 840, 90, 140],
          [300, 780, 70, 200],
          [380, 860, 110, 120],
          [500, 800, 80, 180],
          [590, 870, 120, 110],
          [740, 820, 90, 160],
          [820, 860, 70, 120],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill={i % 2 ? "#7fa7d8" : "#6a93c9"} />
        ))}
        {[0, 1, 2].map((i) => {
          const x = ((i * 260 + t * 14) % 900) + 140;
          return <ellipse key={i} cx={x} cy={520 + i * 50} rx={70} ry={22} fill="#fff" opacity={0.8} />;
        })}
        <rect x={190} y={420} width={700} height={560} rx={36} fill="none" stroke={INK} strokeWidth={10} />
        <line x1={540} y1={420} x2={540} y2={980} stroke={INK} strokeWidth={10} />
        <line x1={190} y1={700} x2={890} y2={700} stroke={INK} strokeWidth={10} />
      </g>
      {/* duvar saati (ısınmada akrep-yelkovan döner) */}
      <g transform="translate(990,560)">
        <circle r={62} fill="#fff" stroke={INK} strokeWidth={8} />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={0} y1={-48} x2={0} y2={-40} stroke={INK} strokeWidth={5} transform={`rotate(${i * 30})`} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-26} stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${210 + clockSpin * 30})`} />
        <line x1={0} y1={0} x2={0} y2={-42} stroke={CORAL} strokeWidth={5} strokeLinecap="round" transform={`rotate(${clockSpin * 360})`} />
        <circle r={6} fill={INK} />
      </g>
      {/* dambıl rafı (sol) */}
      <g transform="translate(-40,1180)">
        <rect x={0} y={0} width={190} height={20} rx={8} fill="#5a4a7a" stroke={INK} strokeWidth={6} />
        <rect x={0} y={150} width={190} height={20} rx={8} fill="#5a4a7a" stroke={INK} strokeWidth={6} />
        <rect x={20} y={0} width={18} height={320} fill="#5a4a7a" stroke={INK} strokeWidth={6} />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${60 + i * 46},${-28})`}>
            <rect x={-18} y={0} width={36} height={28} rx={6} fill={["#ff5d73", "#ffc93c", "#18b5a4"][i]} stroke={INK} strokeWidth={5} />
          </g>
        ))}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${60 + i * 46},${122})`}>
            <rect x={-18} y={0} width={36} height={28} rx={6} fill={["#2f6bff", "#ff5d73", "#ffc93c"][i]} stroke={INK} strokeWidth={5} />
          </g>
        ))}
      </g>
      {/* bitki (sağ) */}
      <g transform="translate(1010,1500)">
        <path d="M-50,0 L-40,-110 L40,-110 L50,0 Z" fill="#ff8a5c" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {[-40, -15, 15, 40].map((a, i) => (
          <ellipse key={i} cx={0} cy={-200} rx={26} ry={90} fill={i % 2 ? "#3fbf7f" : "#2fa56b"} stroke={INK} strokeWidth={5} transform={`rotate(${a},0,-110)`} />
        ))}
      </g>
      {/* zemin */}
      <rect x={-600} y={FLOOR - 30} width={2280} height={30} fill="#fff" stroke={INK} strokeWidth={6} />
      <rect x={-600} y={FLOOR} width={2280} height={900} fill="url(#floor)" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={-600} y1={FLOOR + 60 + i * 80} x2={1680} y2={FLOOR + 60 + i * 80} stroke="#fff" strokeWidth={3} opacity={0.12} />
      ))}
    </g>
  );
};

// ------------------------------------------------------------ halter

const Barbell: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 340 }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-w} y={-9} width={w * 2} height={18} rx={9} fill="#cfd6e4" stroke={INK} strokeWidth={6} />
    {[-1, 1].map((s) => (
      <g key={s}>
        <rect x={s > 0 ? w - 120 : -w + 70} y={-92} width={50} height={184} rx={14} fill={CORAL} stroke={INK} strokeWidth={7} />
        <rect x={s > 0 ? w - 70 : -w + 34} y={-70} width={36} height={140} rx={12} fill={BLUE} stroke={INK} strokeWidth={7} />
      </g>
    ))}
  </g>
);

// ------------------------------------------------------------ buz lastik

const FrozenBand: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; stretch: number; snap: number }> = ({ a, b, stretch, snap }) => {
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const th = 30 - stretch * 14;
  if (snap <= 0) {
    return (
      <g>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={th + 12} strokeLinecap="round" />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9ad8ff" strokeWidth={th} strokeLinecap="round" />
        <line x1={a.x + 10} y1={a.y - th * 0.22} x2={b.x - 10} y2={b.y - th * 0.22} stroke="#fff" strokeWidth={5} opacity={0.8} strokeLinecap="round" />
        {[0.25, 0.5, 0.75].map((k, i) => (
          <path
            key={i}
            d={`M${a.x + (b.x - a.x) * k - 10},${a.y + th / 2} l10,${26 + i * 6} l10,${-26 - i * 6} Z`}
            fill="#dff4ff"
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        ))}
        {stretch > 0.35
          ? [0.4, 0.55].map((k, i) => (
              <path
                key={k}
                d={`M${a.x + (b.x - a.x) * k},${a.y - th / 2} l-6,${th * 0.4} l10,${th * 0.25} l-6,${th * 0.4}`}
                stroke={INK}
                strokeWidth={4}
                fill="none"
                opacity={Math.min(1, (stretch - 0.35 - i * 0.15) * 4)}
              />
            ))
          : null}
      </g>
    );
  }
  // koptu: iki parça ellere doğru kıvrılır, buz kırıntıları saçılır
  const k = Math.min(1, snap * 3);
  const piece = (from: { x: number; y: number }, dir: number) => {
    const len = (Math.abs(b.x - a.x) / 2) * (1 - 0.55 * k);
    const ex = from.x + dir * len;
    const ey = from.y + 40 * k;
    return (
      <g>
        <path d={`M${from.x},${from.y} Q${from.x + dir * len * 0.6},${from.y - 50 * k} ${ex},${ey}`} stroke={INK} strokeWidth={th + 12} fill="none" strokeLinecap="round" />
        <path d={`M${from.x},${from.y} Q${from.x + dir * len * 0.6},${from.y - 50 * k} ${ex},${ey}`} stroke="#9ad8ff" strokeWidth={th} fill="none" strokeLinecap="round" />
      </g>
    );
  };
  return (
    <g>
      {piece(a, 1)}
      {piece(b, -1)}
      {Array.from({ length: 10 }).map((_, i) => {
        const ang = (i / 10) * Math.PI * 2 + 0.3;
        const r = 30 + snap * 520;
        return (
          <rect
            key={i}
            x={midX + Math.cos(ang) * r - 9}
            y={midY + Math.sin(ang) * r - 9 + snap * snap * 200}
            width={18}
            height={18}
            fill="#dff4ff"
            stroke={INK}
            strokeWidth={4}
            opacity={1 - Math.min(1, snap * 1.4)}
            transform={`rotate(${i * 37 + snap * 400},${midX + Math.cos(ang) * r},${midY + Math.sin(ang) * r + snap * snap * 200})`}
          />
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------ efektler

const Snow: React.FC<{ t: number; o: number; cx: number; cy: number }> = ({ t, o, cx, cy }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      {Array.from({ length: 12 }).map((_, i) => {
        const x = cx + ((i * 97) % 520) - 260 + Math.sin(t * 1.5 + i) * 18;
        const y = cy - 650 + (((i * 173 + t * (40 + (i % 4) * 12)) % 700) + 700) % 700;
        const r = 9 + (i % 3) * 4;
        return (
          <g key={i} transform={`translate(${x},${y}) rotate(${t * 40 + i * 20})`}>
            {[0, 60, 120].map((a) => (
              <line key={a} x1={-r} y1={0} x2={r} y2={0} stroke="#fff" strokeWidth={4} strokeLinecap="round" transform={`rotate(${a})`} />
            ))}
          </g>
        );
      })}
    </g>
  );

const Sparkles: React.FC<{ t: number; o: number; cx: number; cy: number }> = ({ t, o, cx, cy }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 + t * 0.6;
        const r = 260 + Math.sin(t * 3 + i) * 30;
        const s = 0.6 + 0.4 * Math.abs(Math.sin(t * 4 + i * 1.7));
        return (
          <path
            key={i}
            transform={`translate(${cx + Math.cos(a) * r},${cy + Math.sin(a) * r * 1.1}) scale(${s})`}
            d="M0,-26 C4,-6 6,-4 26,0 C6,4 4,6 0,26 C-4,6 -6,4 -26,0 C-6,-4 -4,-6 0,-26 Z"
            fill="#ffe066"
            stroke={INK}
            strokeWidth={3}
          />
        );
      })}
    </g>
  );

/** kasın içine akan kan damlacıkları (ısınma) */
const BloodFlow: React.FC<{ t: number; o: number; cx: number; cy: number }> = ({ t, o, cx, cy }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      {Array.from({ length: 10 }).map((_, i) => {
        const p = ((t * 0.9 + i / 10) % 1 + 1) % 1;
        const side = i % 2 ? 1 : -1;
        const x = cx + side * (330 - p * 230);
        const y = cy - 80 - Math.sin(p * Math.PI) * 120 + (i % 3) * 40;
        return <circle key={i} cx={x} cy={y} r={13} fill="#ff2e4d" stroke={INK} strokeWidth={4} opacity={Math.sin(p * Math.PI)} />;
      })}
    </g>
  );

const Burst: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const pts = Array.from({ length: 24 })
    .map((_, i) => {
      const a = (i / 24) * Math.PI * 2;
      const r = i % 2 ? 150 : 250;
      return `${Math.cos(a) * r},${Math.sin(a) * r}`;
    })
    .join(" ");
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <polygon points={pts} fill="#ffe066" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <polygon points={pts} fill={CORAL} transform="scale(0.72)" />
    </g>
  );
};

// ------------------------------------------------------------ konuşma balonu

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Bubble: React.FC<{
  line: ILine;
  t: number;
  s: number;
  e: number;
  tailX: number;
  top: number;
  color: string;
  shout?: boolean;
}> = ({ line, t, s, e, tailX, top, color, shout }) => {
  const o = win(t, s, e, 0.14);
  if (o <= 0) return null;
  const p = pop(t, s);
  const words = line.text.split(/\s+/);
  const reveal = interpolate(t, [s, s + Math.min(0.7, words.length * 0.12)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shown = Math.ceil(words.length * reveal);
  const hl = (line.hl ?? []).map(norm);
  const half = Math.min(470, (shout ? 960 : Math.min(820, line.text.length * 40 + 110)) / 2);
  const off = Math.max(-half + 60, Math.min(half - 60, tailX - 540));
  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        right: 50,
        top,
        display: "flex",
        justifyContent: "center",
        opacity: o,
        transform: `scale(${0.85 + 0.15 * p})`,
        transformOrigin: `${540 + off - 50}px 100%`,
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: shout ? 960 : 820,
          background: shout ? "#ffe066" : "#fff",
          border: `9px solid ${INK}`,
          borderRadius: 56,
          padding: shout ? "26px 40px" : "28px 46px",
          boxShadow: `0 12px 0 ${color}`,
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: shout ? 128 : 76,
          lineHeight: 1.08,
          letterSpacing: shout ? 2 : -1,
          color: INK,
          textAlign: "center",
          textWrap: "balance",
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ color: hl.includes(norm(w)) ? color : INK, opacity: i < shown ? 1 : 0 }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
        <div
          style={{
            position: "absolute",
            left: `calc(50% + ${off}px - 26px)`,
            bottom: -46,
            width: 0,
            height: 0,
            borderLeft: "26px solid transparent",
            borderRight: "26px solid transparent",
            borderTop: `46px solid ${INK}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `calc(50% + ${off}px - 15px)`,
            bottom: -28,
            width: 0,
            height: 0,
            borderLeft: "15px solid transparent",
            borderRight: "15px solid transparent",
            borderTop: `30px solid ${shout ? "#ffe066" : "#fff"}`,
          }}
        />
      </div>
    </div>
  );
};

// ------------------------------------------------------------ ana kompozisyon

export const IsinmaKas: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl = ISINMA_TL;
  const at = tl.at;
  const li = tl.idx(t);
  const END = tl.total;
  const loopEnd = t >= END - LOOP_END;
  const inLoopStart = t < LOOP_START;

  // ---------- sıcaklık (ısınma ile 0→1)
  const warm = interpolate(t, [at(8), at(11)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const w = loopEnd ? 0 : warm;
  const blanketOff = loopEnd ? 0 : sm(t, at(11) - 0.15, at(11) + 0.7);
  const clockSpin = sm(t, at(8), at(11)) * 8;

  // ---------- kamera: L3-L6 kasa yaklaş, ısınmada hafif geniş
  const zoomIn = sm(t, at(3) - 0.05, at(3) + 0.55) * (1 - sm(t, at(7) - 0.1, at(7) + 0.5));
  const cs = 1 + 0.25 * zoomIn;
  const fx = 540 + (KAS_X + 70 - 540) * zoomIn;
  const fy = 960 + (1180 - 960) * zoomIn;
  const cam = (x: number, y: number) => ({ x: (x - fx) * cs + 540, y: (y - fy) * cs + 960 });

  // ---------- sporcu
  const gp: GuyPose = guyStand();
  let gx = GUY_X;
  let gExpr: GuyExpr = "focus";
  let look = 1;
  let bar = { x: 0, y: -92, inHands: false }; // karakter koordinatında
  const walk = (p: number) => {
    // p: 0 → 1 (sondan başa kesintisiz)
    gx = interpolate(p, [0, 0.8, 1], [-170, GUY_X - 30, GUY_X], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const ph = p * Math.PI * 5;
    const amp = 1 - sm(p, 0.75, 1);
    gp.footL = { x: -55 + Math.sin(ph) * 60 * amp, y: -Math.max(0, Math.sin(ph)) * 40 * amp };
    gp.footR = { x: 55 - Math.sin(ph) * 60 * amp, y: -Math.max(0, -Math.sin(ph)) * 40 * amp };
    gp.handL = { x: -150 - Math.sin(ph) * 50 * amp, y: -300 + Math.abs(Math.sin(ph)) * 0 };
    gp.handR = { x: 150 - Math.sin(ph) * 50 * amp, y: -300 };
    gp.drop = Math.abs(Math.cos(ph)) * 12 * amp;
    gp.lean = 6 * amp;
    gExpr = "focus";
  };
  if (loopEnd) walk(((t - (END - LOOP_END)) / LOOP_END) * 0.45);
  else if (inLoopStart) walk(0.45 + (t / LOOP_START) * 0.55);
  if (!loopEnd) {
    if (li <= 1 && t > 0.45) {
      // donakaldı
      const k = sm(t, 0.45, 0.75);
      gp.handL = { x: -150 - 60 * k, y: -300 - 200 * k };
      gp.handR = { x: 150 + 60 * k, y: -300 - 200 * k };
      gp.lean = -4 * k;
      gExpr = "shock";
    }
    if (li === 2) {
      // omuz silkme
      const k = sm(t, at(2), at(2) + 0.3);
      const sh = Math.sin((t - at(2)) * 6) * 8;
      gp.handL = { x: -150 - 110 * k, y: -300 - 120 * k + sh };
      gp.handR = { x: 150 + 110 * k, y: -300 - 120 * k + sh };
      gp.head = 8 * k;
      gExpr = "smirk";
    }
    if (li >= 3 && li <= 7) {
      gExpr = li === 5 ? "shock" : "focus";
      look = 1;
    }
    if (li === 8) {
      // yerinde koşu
      const ph = (t - at(8)) * Math.PI * 4.4;
      gp.footL = { x: -55, y: -Math.max(0, Math.sin(ph)) * 110 };
      gp.footR = { x: 55, y: -Math.max(0, -Math.sin(ph)) * 110 };
      gp.handL = { x: -140, y: -420 + Math.sin(ph) * 60 };
      gp.handR = { x: 140, y: -420 - Math.sin(ph) * 60 };
      gp.drop = Math.abs(Math.sin(ph)) * 18;
      gExpr = "happy";
    }
    if (li === 9) {
      // kol çevirme
      const a = (t - at(9)) * Math.PI * 2 * 1.3;
      gp.handL = { x: -112 - Math.cos(a) * 220, y: -540 + Math.sin(a) * 220 };
      gp.handR = { x: 112 + Math.cos(a) * 220, y: -540 + Math.sin(a) * 220 };
      gExpr = "focus";
    }
    if (li === 10) {
      // bacak sallama (yana)
      const ph = Math.sin((t - at(10)) * Math.PI * 2.4);
      gp.footL = { x: -55 - 130 * Math.max(0, ph), y: -110 * Math.max(0, ph) };
      gp.footR = { x: 55, y: 0 };
      gp.handL = { x: -300, y: -560 };
      gp.handR = { x: 260, y: -600 };
      gExpr = "happy";
    }
    if (li === 11) gExpr = "happy";
    if (li >= 12 && li <= 14) {
      // halter: çömel-kavra (0-0.25), kalçaya (0.25-0.55), baş üstü (0.55-0.85); L14'te yavaşça indir
      const s = at(12);
      const down = sm(t, s, s + 0.45);
      const up1 = sm(t, s + 0.5, s + 1.0);
      const up2 = sm(t, s + 1.1, s + 1.7);
      const lower = sm(t, at(14), at(14) + 1.2);
      const by0 = -92;
      let by = interpolate(up1, [0, 1], [by0, -300]);
      by = interpolate(up2, [0, 1], [by, -810]);
      by = interpolate(lower, [0, 1], [by, by0]);
      const drop = (down * (1 - up1) + lower * (1 - sm(t, at(14) + 1.2, at(14) + 1.6))) * 200;
      gp.drop = drop;
      gp.footL = { x: -95, y: 0 };
      gp.footR = { x: 95, y: 0 };
      const gripped = down > 0.9 || up1 > 0;
      if (gripped && !(lower > 0.98)) {
        bar = { x: 0, y: by, inHands: true };
        gp.handL = { x: -175, y: by };
        gp.handR = { x: 175, y: by };
      } else if (down > 0) {
        gp.handL = { x: -150 - 25 * down, y: -300 + down * 120 };
        gp.handR = { x: 150 + 25 * down, y: -300 + down * 120 };
      }
      gExpr = up2 > 0 && up2 < 1 ? "grit" : up2 >= 1 && lower <= 0 ? "happy" : down < 1 || up1 < 1 ? "grit" : "sheepish";
      if (li === 14) gExpr = "sheepish";
    }
    if (li === 15) {
      // "Tamam tamam!" — başparmak yukarı, baş sallama
      const k = sm(t, at(15), at(15) + 0.3);
      gp.handR = { x: 150 + 40 * k, y: -300 - 330 * k };
      gp.head = Math.sin((t - at(15)) * 14) * 6 * k;
      gExpr = "happy";
    }
  }

  // ---------- kas karakteri
  let kx = KAS_X;
  let ky = FLOOR;
  let kp: KasPose = kasStand();
  let kExpr: KasExpr = "smile";
  let shiver = 0;
  let band: React.ReactNode = null;
  let showKas = !loopEnd;
  let burst = 0;
  if (!loopEnd) {
    // giriş: sağdan zıplayarak
    const inK = sm(t, 0.22, 0.62);
    kx = interpolate(inK, [0, 1], [1320, KAS_X]);
    ky = FLOOR - Math.sin(inK * Math.PI) * 180;
    if (inK <= 0) showKas = false;
    if (li <= 0) {
      kExpr = "shout";
      kp = { handL: { x: -260, y: -580 }, handR: { x: 280, y: -580 } };
      shiver = 0.3;
    }
    if (li === 1) {
      kExpr = "sleepy";
      kp = { handL: { x: -110, y: -300 }, handR: { x: 120, y: -320 + Math.sin(t * 3) * 10 } };
      shiver = 0.6;
    }
    if (li === 2) {
      kExpr = "annoyed";
      kp = { handL: { x: -120, y: -300 }, handR: { x: 120, y: -300 } };
      shiver = 0.5;
    }
    if (li >= 3 && li <= 5) {
      // buz lastik: L3 tut, L4 ger, L5 kop
      const st = sm(t, at(4), at(5) - 0.05);
      const snap = t >= at(5) ? Math.min(1, (t - at(5)) / 0.9) : 0;
      const hx = snap > 0 ? 120 + 160 * sm(t, at(5), at(5) + 0.25) : 70 + 150 * st;
      const hy = -330 + (snap > 0 ? -60 * sm(t, at(5), at(5) + 0.25) : 0);
      kp = { handL: { x: -hx, y: hy }, handR: { x: hx, y: hy }, tilt: snap > 0 ? -4 : 0 };
      kExpr = li === 3 ? "shiver" : li === 4 ? "strain" : "shock";
      shiver = li === 3 ? 0.8 : li === 4 ? 0.4 : 0;
      if (snap < 1) band = <FrozenBand a={{ x: -hx, y: hy + 6 }} b={{ x: hx, y: hy + 6 }} stretch={st} snap={snap} />;
      burst = snap > 0 ? pop(t, at(5)) * (1 - sm(t, at(6) - 0.2, at(6))) : 0;
    }
    if (li === 6) {
      kExpr = "shiver";
      shiver = 1;
      kp = { handL: { x: -60, y: -300 }, handR: { x: 170, y: -260 } };
    }
    if (li === 7) {
      kExpr = "smile";
      shiver = 0.4;
      kp = { handL: { x: -170, y: -250 }, handR: { x: 220, y: -640 } };
    }
    if (li >= 8 && li <= 10) {
      kExpr = li === 8 ? "strain" : "smile";
      shiver = 0.25 * (1 - w);
      if (li === 8) {
        const ph = (t - at(8)) * Math.PI * 4.4;
        kp = {
          handL: { x: -160, y: -300 + Math.sin(ph) * 40 },
          handR: { x: 160, y: -300 - Math.sin(ph) * 40 },
          footL: { x: -60, y: -Math.max(0, Math.sin(ph)) * 70 },
          footR: { x: 60, y: -Math.max(0, -Math.sin(ph)) * 70 },
        };
        ky = FLOOR - Math.abs(Math.sin(ph)) * 14;
      }
      if (li === 9) {
        const a = (t - at(9)) * Math.PI * 2 * 1.3;
        kp = {
          handL: { x: -150 - Math.cos(a) * 150, y: -400 + Math.sin(a) * 150 },
          handR: { x: 150 + Math.cos(a) * 150, y: -400 + Math.sin(a) * 150 },
        };
      }
      if (li === 10) {
        const ph = Math.sin((t - at(10)) * Math.PI * 2.4);
        kp = {
          handL: { x: -190, y: -240 },
          handR: { x: 190, y: -240 },
          footR: { x: 60 + 110 * Math.max(0, ph), y: -90 * Math.max(0, ph) },
        };
        kExpr = "happy";
      }
    }
    if (li === 11) {
      kExpr = "happy";
      const k = sm(t, at(11), at(11) + 0.4);
      kp = { handL: { x: -170 - 120 * k, y: -250 - 420 * k }, handR: { x: 170 + 120 * k, y: -250 - 420 * k } };
      ky = FLOOR - pop(t, at(11)) * 30 * (1 - sm(t, at(11) + 0.6, at(11) + 1));
    }
    if (li === 12 || li === 13) {
      kExpr = "happy";
      const wg = Math.sin(t * 9) * 30;
      kp = { handL: { x: -280, y: -620 + wg }, handR: { x: 280, y: -620 - wg } };
      ky = FLOOR - Math.abs(Math.sin(t * 6)) * 24;
    }
    if (li === 14) {
      kExpr = "stern";
      const wag = Math.sin(t * 12) * 30;
      kp = { handL: { x: -150, y: -300 }, handR: { x: 200 + wag, y: -620 } };
    }
    if (li >= 15) {
      kExpr = "wink";
      kp = { handL: { x: -150, y: -300 }, handR: { x: 260, y: -560 } };
    }
  }

  const kasBlink = blinkAt(t, 1);
  const guyBlink = blinkAt(t, 2);

  // ---------- balon konumları (ekran)
  const kasHead = cam(kx, ky - 640 * KAS_S);
  const guyHead = cam(gx, FLOOR - 800 * GUY_S);
  const line = li >= 0 ? ISINMA_LINES[li] : null;
  const s0 = li >= 0 ? at(li) : 0;
  const e0 = li >= 0 ? at(li + 1) : 0;

  const coldTint = 0.16 * (1 - w);
  const barWorld = bar.inHands ? null : { x: GUY_X, y: FLOOR + bar.y * GUY_S };

  return (
    <AbsoluteFill lang="tr" style={{ background: "#ffe8d4", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540,960) scale(${cs}) translate(${-fx},${-fy})`}>
          <Gym t={t} warm={w} clockSpin={clockSpin} />
          <g transform={`translate(${gx},${FLOOR}) scale(${GUY_S})`}>
            <ToonGuy
              pose={gp}
              expr={gExpr}
              blink={guyBlink}
              look={look}
              held={bar.inHands ? <Barbell x={0} y={bar.y} /> : null}
            />
          </g>
          {barWorld ? (
            <g transform={`translate(${barWorld.x},${barWorld.y}) scale(${GUY_S})`}>
              <Barbell x={0} y={0} />
            </g>
          ) : null}
          {showKas ? (
            <g transform={`translate(${kx},${ky}) scale(${KAS_S})`}>
              <Snow t={t} o={(1 - w) * (li >= 1 ? 1 : 0.5)} cx={0} cy={0} />
              <BloodFlow t={t} o={win(t, at(8) + 0.3, at(11) + 1.2, 0.4)} cx={0} cy={-380} />
              <KasKarakter
                pose={kp}
                expr={kExpr}
                w={w}
                blink={kasBlink}
                look={-0.6}
                t={t}
                shiver={shiver}
                blanketOff={blanketOff}
                front={band}
              />
              <Sparkles t={t} o={win(t, at(11), at(14), 0.3)} cx={0} cy={-400} />
              {burst > 0 ? (
                <g transform="translate(0,-560)">
                  <Burst x={0} y={0} s={burst * 0.9} />
                </g>
              ) : null}
            </g>
          ) : null}
        </g>
        {/* soğuk mavi ton (ısındıkça kaybolur) */}
        <rect width={1080} height={1920} fill="#6aa8ff" opacity={coldTint} style={{ mixBlendMode: "multiply" }} />
      </svg>

      {/* ÇAT! */}
      {line?.who === "fx" ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: cam(kx, ky - 560 * KAS_S).y - 110,
            textAlign: "center",
            fontFamily: SANS,
            fontWeight: 900,
            fontSize: 190,
            color: "#fff",
            WebkitTextStroke: `14px ${INK}`,
            paintOrder: "stroke",
            transform: `scale(${0.4 + 0.6 * pop(t, s0)}) rotate(-6deg)`,
            opacity: win(t, s0, e0, 0.12),
          }}
        >
          ÇAT!
        </div>
      ) : null}

      {/* konuşma balonları */}
      {line && (line.who === "kas" || line.who === "adam") ? (
        <Bubble
          line={line}
          t={t}
          s={s0}
          e={e0}
          tailX={line.who === "kas" ? kasHead.x : guyHead.x}
          top={line.who === "kas" && li >= 3 && li <= 6 ? 170 : 430}
          color={line.who === "kas" ? CORAL : BLUE}
          shout={li === 0}
        />
      ) : null}

      {/* ısınma çipi: hareket adı + ısı çubuğu */}
      {li >= 8 && li <= 10 && line ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
            opacity: win(t, at(8), at(11), 0.2),
          }}
        >
          <div
            key={li}
            style={{
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: 92,
              color: INK,
              background: "#fff",
              border: `9px solid ${INK}`,
              borderRadius: 999,
              padding: "14px 56px",
              boxShadow: `0 12px 0 ${CORAL}`,
              transform: `scale(${0.8 + 0.2 * pop(t, s0)})`,
            }}
          >
            <span style={{ color: CORAL }}>{li - 7}.</span> {line.text}
          </div>
          <div style={{ width: 640, height: 44, borderRadius: 22, border: `8px solid ${INK}`, background: "#fff", overflow: "hidden", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${Math.round(warm * 100)}%`,
                background: "linear-gradient(90deg, #6aa8ff, #ffb03a, #ff3b52)",
                backgroundSize: "640px 100%",
              }}
            />
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 46, color: INK, background: "#fff", border: `6px solid ${INK}`, borderRadius: 999, padding: "6px 30px" }}>
            {`${Math.round(1 + warm * 9)} dk`} · {warm > 0.95 ? "kas ısındı!" : "kas ısınıyor…"}
          </div>
        </div>
      ) : null}

      {/* kapanış kartı */}
      {line?.who === "card" ? (
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 300,
            opacity: win(t, s0, e0, 0.2),
            transform: `scale(${0.9 + 0.1 * pop(t, s0)})`,
            background: "#fff",
            border: `10px solid ${INK}`,
            borderRadius: 48,
            boxShadow: `0 16px 0 ${CORAL}`,
            padding: "40px 40px",
            textAlign: "center",
            fontFamily: SANS,
            fontWeight: 900,
            color: INK,
          }}
        >
          <div style={{ fontSize: 96, lineHeight: 1.05 }}>
            Isınma <span style={{ color: "#18a36a" }}>5 dakika.</span>
          </div>
          <div style={{ fontSize: 96, lineHeight: 1.05, marginTop: 14 }}>
            Sakatlık <span style={{ color: CORAL }}>aylarca.</span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
