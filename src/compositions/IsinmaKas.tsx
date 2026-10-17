/**
 * "Isınmadan başlama!" — konuşan kas karakteri ile komik, her yaşa uygun Reels (≤40 sn, sessiz taslak).
 * Hikâye: sabah sporcu doğruca halterlere koşar; üşüyen, uykulu bacak kası onu durdurur ve
 * buz gibi lastikle ("ÇAT!") soğuk kasın neden incindiğini gösterir; 5-10 dk ısınmayla kas
 * soluk pembeden canlı kırmızıya döner, kaldırış rahat olur. Sonunda sporcu "Söz!" der ve ertesi sabah
 * yine halterlere koşar → video başa sarınca kesintisiz devam eder (loop).
 * Pozlar satır başına tanımlı (`guyAt`/`kasAt`); satır geçişlerinde yumuşak harmanlanır (`BLEND`).
 * Zamanlama seslendirmeden: her satır, konuşmanın süresi (`isinma-ses.json`, `RATE` hızında) + kısa ara kadar sürer.
 * Ses: `public/audio/isinma-NN.mp3` (kas = Jessica, sporcu = Liam), müzik/efekt `public/isinma/` (scripts/isinma-audio.py).
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ROUND, loadFonts } from "../fonts";
import { type Line, pop as rawPop, sm, win } from "../ornek/common";
import SES from "./isinma-ses.json";
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
  type Pt,
} from "../cartoon/IsinmaChars";

loadFonts();

const pop = (t: number, at: number) => rawPop(t, at, 30, 16);

type Who = "kas" | "adam" | "fx" | "chip" | "card" | "act";
/** say: seslendirmede okunan metin (ekrandakinden farklıysa) */
type ILine = Line & { who: Who; say?: string };

export const ISINMA_LINES: ILine[] = [
  { who: "kas", text: "Hop hop! Nereye böyle?", hl: ["nereye"] },
  { who: "adam", text: "Halter kaldıracağım. Ne var?", hl: ["halter"] },
  { who: "kas", text: "Daha uyanmadım… Buz gibiyim!", hl: ["buz"] },
  { who: "adam", text: "Abartma istersen, ne olacak ki?", hl: ["abartma"] },
  { who: "act", text: "" }, // kas lastiği çıkarır (sessiz)
  { who: "kas", text: "Bu lastik soğukken çekilirse…", hl: ["soğukken"] },
  { who: "fx", text: "ÇAT!" },
  { who: "kas", text: "Isınmadan yüklenirsen ben de incinirim.", hl: ["incinirim."] },
  { who: "adam", text: "Peki ne yapayım?" },
  { who: "kas", text: "Beni sadece 5-10 dakika ısıt.", say: "Beni sadece beş on dakika ısıt.", hl: ["5-10", "dakika", "ısıt."] },
  { who: "chip", text: "Hafif koşu" },
  { who: "chip", text: "Kol çevirme" },
  { who: "chip", text: "Bacak sallama" },
  { who: "kas", text: "Oh be! Kan geldi, ısındım!", hl: ["ısındım!"] },
  { who: "kas", text: "Şimdi hazırım. Kaldır bakalım!", hl: ["kaldır"] },
  {
    who: "card",
    text: "Isınma 5 dakika. Ama sakatlanırsan aylarca sürebilir.",
    say: "Isınma beş dakika... ama sakatlanırsan aylarca sürebilir.",
  },
  { who: "kas", text: "Yarın sabah da ısınıyoruz, tamam mı?", hl: ["yarın", "sabah"] },
  { who: "adam", text: "Söz!" },
];

const speaks = (l: ILine) => l.who === "kas" || l.who === "adam" || l.who === "card";
/** seslendirme metni ("…" → "...") */
export const sayOf = (l: ILine) => (l.say ?? l.text).replace(/…/g, "...");

/** döngü kesiti: sonda koşu başlar, başta devam eder */
const LOOP_END = 0.63;
const LOOP_START = 0.77;

/** seslendirme çalma hızı (1 = olduğu gibi; yumuşak, acele etmeyen konuşma) */
const RATE = 1.0;
const GAP = 0.15;
/** seslendirme sürümü: isinma-ses.json bununla aynı değilse sesler eski kabul edilir → süreler tahmini, ses çalınmaz */
const VOICE_VERSION = "v2-yumusak";
type SesLine = { file: string; lead: number; speech: number; text?: string; words?: number[] };
const SES_T = SES as { version?: string; lines: Record<string, SesLine> };
const VOICED = SES_T.version === VOICE_VERSION;
const sesOf = (i: number): SesLine | undefined => {
  const l = SES_T.lines[String(i)];
  return VOICED && l && l.text === sayOf(ISINMA_LINES[i]) ? l : undefined;
};
/** satırın konuşma süresi (video saniyesi); ses yoksa okuma hızından tahmin */
const speechOf = (i: number) => {
  const line = ISINMA_LINES[i];
  if (!line || !speaks(line)) return 0;
  const l = sesOf(i);
  return l ? (l.speech - l.lead) / RATE : sayOf(line).length * 0.072;
};
/** satırdaki k. kelimenin başlama anı (satır başına göre, sn) */
const wordStart = (i: number, k: number, n: number) => {
  const l = sesOf(i);
  const w = l?.words;
  if (w && w.length === n) return (w[k] - l.lead) / RATE;
  return (k / n) * speechOf(i) * 0.92;
};
const FIXED: Record<number, number> = { 4: 1.5, 6: 1.1, 10: 1.5, 11: 1.5, 12: 1.5 };
const EXTRA: Record<number, number> = { 5: 0.15, 14: 0.3, 15: 0.1 };

const buildTimeline = () => {
  const starts: number[] = [];
  let acc = 0.4;
  ISINMA_LINES.forEach((_, i) => {
    starts.push(acc);
    acc += (FIXED[i] ?? Math.max(0.9, speechOf(i) + GAP)) + (EXTRA[i] ?? 0);
  });
  const total = acc + LOOP_END;
  return {
    starts,
    total,
    frames: Math.ceil(total * 30),
    at: (i: number) => (i >= starts.length ? acc : starts[i]),
    idx: (t: number) => {
      let i = -1;
      while (i + 1 < starts.length && t >= starts[i + 1]) i++;
      return i;
    },
  };
};

export const ISINMA_TL = buildTimeline();

const CORAL = "#ff4f64";
const BLUE = "#2f6bff";

// ------------------------------------------------------------ yerleşim

const FLOOR = 1560;
const GUY_X = 280;
const GUY_S = 0.95;
const KAS_X = 800;
const KAS_S = 0.92;
/** geniş plan ölçeği (halter ve karakterler kadraja rahat sığsın) */
const BASE = 0.88;
const BASE_FY = 1000;
/** satır geçişinde poz harmanlama süresi (sn) */
const BLEND = 0.4;

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

const Barbell: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 300 }) => (
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

// ------------------------------------------------------------ altyazı (animasyon tarzı)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

/** kalın konturlu, yuvarlak harfli yazı (kutu yok) */
const toonText = (size: number, stroke = 16): React.CSSProperties => ({
  fontFamily: ROUND,
  fontWeight: 800,
  fontSize: size,
  lineHeight: 1.02,
  letterSpacing: 0.5,
  color: "#fff",
  WebkitTextStroke: `${stroke}px ${INK}`,
  paintOrder: "stroke",
  textShadow: `0 ${stroke * 0.55}px 0 ${INK}, 0 ${stroke}px 22px rgba(43,33,64,0.35)`,
  textAlign: "center",
  textWrap: "balance",
});

/** konuşma altyazısı: tüm cümle görünür, söylenen kelime konuşanın renginde (karaoke); yumuşak geçiş */
const Caption: React.FC<{ i: number; line: ILine; t: number; s: number; e: number; top: number; color: string }> = ({
  i,
  line,
  t,
  s,
  e,
  top,
  color,
}) => {
  const o = win(t, s, e, 0.18);
  if (o <= 0) return null;
  const words = line.text.split(/\s+/);
  const lt = t - s;
  const hl = (line.hl ?? []).map(norm);
  let cur = -1;
  words.forEach((_, k) => {
    if (lt >= wordStart(i, k, words.length) - 0.03) cur = k;
  });
  const done = lt > speechOf(i) + 0.1;
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top,
        opacity: o,
        transform: `translateY(${(1 - sm(t, s, s + 0.25)) * 14}px)`,
        ...toonText(96),
      }}
    >
      {words.map((w, k) => {
        const active = !done && k === cur;
        const said = done || k < cur;
        const c = active ? color : said && hl.includes(norm(w)) ? color : "#fff";
        return (
          <React.Fragment key={k}>
            <span style={{ color: c, whiteSpace: "nowrap", transition: "none" }}>{w}</span>
            {k < words.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------ pozlar

type GuyState = { x: number; pose: GuyPose; expr: GuyExpr; look: number; bar: number | null };
type KasState = { x: number; y: number; pose: KasPose; expr: KasExpr; shiver: number; look: number };

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lp = (a: Pt | undefined, b: Pt | undefined, k: number, d: Pt): Pt => {
  const A = a ?? d;
  const B = b ?? d;
  return { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) };
};
const P = (x: number, y: number): Pt => ({ x, y });

const lerpGuy = (a: GuyState, b: GuyState, k: number): GuyState => ({
  x: lerp(a.x, b.x, k),
  pose: {
    handL: lp(a.pose.handL, b.pose.handL, k, P(-150, -290)),
    handR: lp(a.pose.handR, b.pose.handR, k, P(150, -290)),
    footL: lp(a.pose.footL, b.pose.footL, k, P(-55, 0)),
    footR: lp(a.pose.footR, b.pose.footR, k, P(55, 0)),
    drop: lerp(a.pose.drop ?? 0, b.pose.drop ?? 0, k),
    lean: lerp(a.pose.lean ?? 0, b.pose.lean ?? 0, k),
    head: lerp(a.pose.head ?? 0, b.pose.head ?? 0, k),
  },
  expr: k < 0.35 ? a.expr : b.expr,
  look: lerp(a.look, b.look, k),
  bar: b.bar,
});

const lerpKas = (a: KasState, b: KasState, k: number): KasState => ({
  x: lerp(a.x, b.x, k),
  y: lerp(a.y, b.y, k),
  pose: {
    handL: lp(a.pose.handL, b.pose.handL, k, P(-205, -250)),
    handR: lp(a.pose.handR, b.pose.handR, k, P(205, -250)),
    footL: lp(a.pose.footL, b.pose.footL, k, P(-62, 0)),
    footR: lp(a.pose.footR, b.pose.footR, k, P(62, 0)),
    tilt: lerp(a.pose.tilt ?? 0, b.pose.tilt ?? 0, k),
  },
  expr: k < 0.35 ? a.expr : b.expr,
  shiver: lerp(a.shiver, b.shiver, k),
  look: lerp(a.look, b.look, k),
});

/** nefes alma: hafif sürekli hareket (donuk durmasın) */
const breathe = (t: number, seed: number) => Math.sin(t * 2.1 + seed) * 7;

const TL = ISINMA_TL;
const at = TL.at;

/** sporcunun salona koşusu; p: 0 → 1 (sondan başa kesintisiz) */
const walkGuy = (p: number): GuyState => {
  const x = interpolate(p, [0, 0.8, 1], [-300, GUY_X - 30, GUY_X], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ph = p * Math.PI * 5;
  const amp = 1 - sm(p, 0.75, 1);
  return {
    x,
    pose: {
      footL: P(-55 + Math.sin(ph) * 50 * amp, -Math.max(0, Math.sin(ph)) * 55 * amp),
      footR: P(55 - Math.sin(ph) * 50 * amp, -Math.max(0, -Math.sin(ph)) * 55 * amp),
      handL: P(-150 - Math.sin(ph) * 45 * amp, -300 - Math.max(0, -Math.sin(ph)) * 40 * amp),
      handR: P(150 - Math.sin(ph) * 45 * amp, -300 - Math.max(0, Math.sin(ph)) * 40 * amp),
      drop: Math.abs(Math.cos(ph)) * 14 * amp,
      lean: 6 * amp,
    },
    expr: "focus",
    look: 1,
    bar: null,
  };
};

/** halter: çömel-kavra → kalçaya → baş üstü; L16'da yavaşça indir */
const liftGuy = (t: number): GuyState => {
  const s = at(14);
  const down = sm(t, s, s + 0.45);
  const up1 = sm(t, s + 0.5, s + 1.0);
  const up2 = sm(t, s + 1.1, s + 1.7);
  const lower = sm(t, at(16), at(16) + 1.1);
  const stand2 = sm(t, at(16) + 1.1, at(16) + 1.5);
  let by = lerp(-92, -300, up1);
  by = lerp(by, -810, up2);
  by = lerp(by, -92, lower);
  const drop = (down * (1 - up1) + lower * (1 - stand2)) * 200;
  const stance = lerp(55, 95, Math.min(1, down + up1) * (1 - stand2));
  const gripped = (down > 0.85 || up1 > 0) && stand2 <= 0;
  const grip = (sx: number) => P(sx * 175, by);
  const free = (sx: number) => {
    const g = P(sx * 175, -92);
    const st = P(sx * 150, -290);
    const k = stand2 > 0 ? 1 - stand2 : down;
    return P(lerp(st.x, g.x, k), lerp(st.y, g.y, k));
  };
  const expr: GuyExpr = stand2 > 0 || lower > 0 ? "sheepish" : up2 >= 1 ? "happy" : "grit";
  return {
    x: GUY_X,
    pose: {
      handL: gripped ? grip(-1) : free(-1),
      handR: gripped ? grip(1) : free(1),
      footL: P(-stance, 0),
      footR: P(stance, 0),
      drop,
    },
    expr,
    look: 1,
    bar: gripped ? by : null,
  };
};

const guyAt = (li: number, t: number): GuyState => {
  const lt = t - at(Math.max(0, li));
  const b = breathe(t, 0);
  const rest: GuyState = { x: GUY_X, pose: { ...guyStand(), handL: P(-150, -290 + b), handR: P(150, -290 - b) }, expr: "focus", look: 1, bar: null };
  const pose = (o: Partial<GuyPose>, expr: GuyExpr = "focus", look = 1): GuyState => ({ ...rest, pose: { ...rest.pose, ...o }, expr, look });
  switch (li) {
    case -1:
    case 0: {
      const wk = t < LOOP_START ? walkGuy(0.45 + (t / LOOP_START) * 0.55) : walkGuy(1);
      const shock = pose({ handL: P(-210, -470 + b), handR: P(210, -470 - b), lean: -4 }, "shock");
      return lerpGuy(wk, shock, sm(t, 0.45, 0.85));
    }
    case 1: // "Halter kaldıracağım. Ne var?" — bir el belde, diğeriyle kasa
      return pose({ handL: P(-215, -330), handR: P(250 + Math.sin(lt * 5) * 16, -470 + Math.sin(lt * 7) * 14) }, "focus");
    case 2: // dinliyor: kollar kavuşmuş
      return pose({ handL: P(70, -400 + b * 0.5), handR: P(-70, -380 - b * 0.5), head: 4 }, "smirk");
    case 3: {
      // "Abartma…" — omuz silkme
      const sh = Math.sin(lt * 6) * 10;
      return pose({ handL: P(-265, -440 + sh), handR: P(265, -440 + sh), head: 8 }, "smirk");
    }
    case 4:
    case 5:
      return pose({}, "focus");
    case 6:
    case 7: // eller yanaklarda: şaşkın
      return pose({ handL: P(-125, -650), handR: P(125, -650) }, "shock");
    case 8: // "Peki ne yapayım?" — başını kaşır
      return pose({ handR: P(90, -790 + Math.sin(lt * 14) * 10), handL: P(-150, -290 + b) }, "sheepish");
    case 9: // dinliyor, başını sallar
      return pose({ head: Math.sin(lt * 7) * 5 }, "focus");
    case 10: {
      // yerinde hafif koşu
      const ph = lt * Math.PI * 4.4;
      return pose(
        {
          footL: P(-55, -Math.max(0, Math.sin(ph)) * 110),
          footR: P(55, -Math.max(0, -Math.sin(ph)) * 110),
          handL: P(-140, -420 + Math.sin(ph) * 60),
          handR: P(140, -420 - Math.sin(ph) * 60),
          drop: Math.abs(Math.sin(ph)) * 18,
        },
        "happy",
        0,
      );
    }
    case 11: {
      // kol çevirme
      const a = lt * Math.PI * 2 * 1.2 - Math.PI / 2;
      return pose({ handL: P(-112 - Math.cos(a) * 220, -540 + Math.sin(a) * 220), handR: P(112 + Math.cos(a) * 220, -540 + Math.sin(a) * 220) }, "focus", 0);
    }
    case 12: {
      // bacak sallama (yana)
      const ph = Math.sin(lt * Math.PI * 2.4);
      return pose({ footL: P(-55 - 130 * Math.max(0, ph), -110 * Math.max(0, ph)), handL: P(-300, -560), handR: P(260, -600) }, "happy", 0);
    }
    case 13: // ısındık: yumruklar havada
      return pose({ handL: P(-230, -560 + b), handR: P(230, -560 - b) }, "happy");
    case 14:
    case 15:
    case 16:
      return liftGuy(t);
    default: {
      // "Söz!" — sağ el yemin eder gibi yukarıda, sol el göğüste
      return pose({ handR: P(230, -760), handL: P(-20, -470) }, "happy");
    }
  }
};

const kasAt = (li: number, t: number): KasState => {
  const lt = t - at(Math.max(0, li));
  const b = breathe(t, 1.3);
  const rest: KasState = { x: KAS_X, y: FLOOR, pose: { ...kasStand(), handL: P(-205, -250 + b), handR: P(205, -250 - b) }, expr: "smile", shiver: 0, look: -0.7 };
  const pose = (o: Partial<KasPose>, expr: KasExpr, shiver = 0, look = -0.7): KasState => ({ ...rest, pose: { ...rest.pose, ...o }, expr, shiver, look });
  switch (li) {
    case -1:
    case 0: {
      // sağdan zıplayarak girer, "dur" der gibi eller havada
      const inK = sm(t, 0.22, 0.62);
      const st = pose({ handL: P(-270, -620 + b), handR: P(290, -600 - b) }, t < 1.2 ? "shout" : "stern", 0.3);
      return { ...st, x: lerp(1320, KAS_X, inK), y: FLOOR - Math.sin(inK * Math.PI) * 180 };
    }
    case 1: // esner: el ağızda
      return pose({ handL: P(-120, -330), handR: P(40, -410 + Math.sin(lt * 3) * 8) }, "sleepy", 0.6);
    case 2: // kendine sarılmış, titriyor
      return pose({ handL: P(80, -330), handR: P(-80, -340) }, "shiver", 1);
    case 3: // eller belde, bıkkın
      return pose({ handL: P(-225, -300), handR: P(225, -300) }, "annoyed", 0.4);
    case 4: {
      // lastiği önüne getirir (sessiz an)
      const k = sm(lt, 0.15, 0.6);
      return pose(
        { handL: P(lerp(-205, -70, k), lerp(-250, -330, k)), handR: P(lerp(205, 70, k), lerp(-250, -330, k)) },
        "smile",
        0.3,
        0,
      );
    }
    case 5: {
      // lastiği gerer
      const hx = 70 + 150 * sm(t, at(5), at(6) - 0.05);
      return pose({ handL: P(-hx, -330), handR: P(hx, -330) }, "strain", 0.4, 0);
    }
    case 6: {
      // ÇAT! eller iki yana savrulur
      const k = sm(t, at(6), at(6) + 0.25);
      return pose({ handL: P(-220 - 80 * k, -330 - 80 * k), handR: P(220 + 80 * k, -330 - 80 * k), tilt: -4 * k }, "shock", 0, 0);
    }
    case 7: // "ben de böyle incinebilirim" — kendini tutar, endişeli
      return pose({ handL: P(-70, -300), handR: P(70, -310) }, "worried", 0.5, 0);
    case 8:
      return pose({}, "smile", 0.3);
    case 9: // parmak havada: "5-10 dakika"
      return pose({ handR: P(230, -720 + Math.sin(lt * 6) * 10) }, "smile", 0.3);
    case 10: {
      const ph = lt * Math.PI * 4.4;
      const st = pose(
        {
          handL: P(-190, -330 + Math.sin(ph) * 40),
          handR: P(190, -330 - Math.sin(ph) * 40),
          footL: P(-62, -Math.max(0, Math.sin(ph)) * 70),
          footR: P(62, -Math.max(0, -Math.sin(ph)) * 70),
        },
        "strain",
        0.2,
        0,
      );
      return { ...st, y: FLOOR - Math.abs(Math.sin(ph)) * 14 };
    }
    case 11: {
      const a = lt * Math.PI * 2 * 1.2 - Math.PI / 2;
      return pose({ handL: P(-166 - Math.cos(a) * 150, -430 + Math.sin(a) * 150), handR: P(166 + Math.cos(a) * 150, -430 + Math.sin(a) * 150) }, "smile", 0.1, 0);
    }
    case 12: {
      const ph = Math.sin(lt * Math.PI * 2.4);
      return pose({ handL: P(-225, -300), handR: P(225, -300), footR: P(62 + 110 * Math.max(0, ph), -90 * Math.max(0, ph)) }, "happy", 0, 0);
    }
    case 13: {
      // atkı uçar, gerinir
      const k = sm(lt, 0, 0.45);
      const st = pose({ handL: P(lerp(-205, -300, k), lerp(-250, -720, k)), handR: P(lerp(205, 300, k), lerp(-250, -720, k)) }, "happy", 0);
      return { ...st, y: FLOOR - pop(t, at(13)) * 30 * (1 - sm(lt, 0.6, 1)) };
    }
    case 14:
    case 15: {
      // tezahürat
      const wg = Math.sin(t * 8) * 30;
      const st = pose({ handL: P(-290, -660 + wg), handR: P(290, -660 - wg) }, "happy", 0);
      return { ...st, y: FLOOR - Math.abs(Math.sin(t * 5)) * 22 };
    }
    case 16: // parmak sallar
      return pose({ handR: P(210 + Math.sin(t * 11) * 30, -640) }, "stern", 0);
    default:
      return pose({ handR: P(260, -580) }, "wink", 0);
  }
};

/** satır geçişlerinde yumuşak harmanlama */
const blended = <S,>(fn: (li: number, t: number) => S, mixFn: (a: S, b: S, k: number) => S, t: number): S => {
  const li = TL.idx(t);
  const cur = fn(li, t);
  if (li <= 0) return cur;
  const d = li === 6 ? 0.12 : BLEND;
  const k = sm(t, at(li), at(li) + d);
  return k >= 1 ? cur : mixFn(fn(li - 1, t), cur, k);
};

// ------------------------------------------------------------ ses: seslendirme + müzik + efektler

/** efektler: Mixkit ücretsiz ses efektleri (public/isinma/sfx/<id>.mp3); lead = baştaki sessizlik (sn) */
const FX: { at: number; id: number; v: number; lead?: number; dur?: number }[] = [
  { at: at(5) + 0.05, id: 1009, v: 0.35, lead: 0.08, dur: at(6) - at(5) - 0.05 }, // lastik gıcırtısı
  { at: at(6) - 0.01, id: 2945, v: 0.9 }, // ÇAT
  { at: at(13), id: 2350, v: 0.3 }, // ışıltı: kas ısındı
  { at: at(14) + 0.42, id: 2102, v: 0.45, lead: 0.14 }, // halter kavranır
  { at: at(16) + 1.05, id: 2102, v: 0.35, lead: 0.14 }, // halter bırakılır
];

/** arka plan müziği seçenekleri (Mixkit, public/music/<id>.mp3): başlangıç noktası (sn) */
const MUSIC: Record<string, number> = { "1076": 0 };

const Sounds: React.FC<{ music: string | null }> = ({ music }) => {
  const { fps } = useVideoConfig();
  const vol = (f: number) => {
    const t = f / fps;
    // konuşma yokken (ısınma bölümü) müzik öne çıkar
    return 0.07 + 0.1 * sm(t, at(10) - 0.2, at(10) + 0.3) * (1 - sm(t, at(13) - 0.3, at(13) + 0.2));
  };
  return (
    <>
      {music ? <Audio src={staticFile(`music/${music}.mp3`)} startFrom={Math.round((MUSIC[music] ?? 0) * fps)} volume={vol} /> : null}
      {ISINMA_LINES.map((_, i) => {
        const l = sesOf(i);
        if (!l) return null;
        return (
          <Sequence key={i} from={Math.round(at(i) * fps)} layout="none">
            <Audio src={staticFile(`audio/${l.file}`)} startFrom={Math.round(l.lead * fps)} playbackRate={RATE} />
          </Sequence>
        );
      })}
      {FX.map((f, i) => (
        <Sequence
          key={`fx${i}`}
          from={Math.max(0, Math.round(f.at * fps))}
          durationInFrames={f.dur ? Math.round(f.dur * fps) : undefined}
          layout="none"
        >
          <Audio src={staticFile(`isinma/sfx/${f.id}.mp3`)} startFrom={Math.round((f.lead ?? 0) * fps)} volume={f.v} />
        </Sequence>
      ))}
    </>
  );
};

export type IsinmaProps = { music: string | null };

// ------------------------------------------------------------ ana kompozisyon

export const IsinmaKas: React.FC<IsinmaProps> = ({ music }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const li = TL.idx(t);
  const END = TL.total;
  const loopEnd = t >= END - LOOP_END;

  // ---------- sıcaklık (ısınma ile 0→1)
  const warm = interpolate(t, [at(10), at(13)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const w = loopEnd ? 0 : warm;
  const blanketOff = loopEnd ? 0 : sm(t, at(13) - 0.1, at(13) + 0.8);
  const clockSpin = loopEnd ? 0 : sm(t, at(10), at(13)) * 8;

  // ---------- kamera: lastik sahnesinde kasa yaklaş
  const zoomIn = sm(t, at(4), at(4) + 0.9) * (1 - sm(t, at(8) - 0.1, at(8) + 0.6));
  const cs = lerp(BASE, 1.15, zoomIn);
  const fx = lerp(540, KAS_X + 60, zoomIn);
  const fy = lerp(BASE_FY, 1180, zoomIn);
  const cam = (x: number, y: number) => ({ x: (x - fx) * cs + 540, y: (y - fy) * cs + 960 });

  const guy = loopEnd ? walkGuy(((t - (END - LOOP_END)) / LOOP_END) * 0.45) : blended(guyAt, lerpGuy, t);
  const kas = blended(kasAt, lerpKas, t);
  const showKas = !loopEnd && t > 0.22;

  // ---------- konuşma: konuşanın ağzı oynar
  const line = li >= 0 ? ISINMA_LINES[li] : null;
  const s0 = li >= 0 ? at(li) : 0;
  const e0 = li >= 0 ? at(li + 1) : 0;
  const lt = t - s0;
  const speak = li >= 0 ? speechOf(li) : 0;
  const talkAmt = line && lt < speak ? Math.abs(Math.sin(lt * 13)) * (0.6 + 0.4 * Math.abs(Math.sin(lt * 5.3))) : 0;
  const kasTalk = line?.who === "kas" || line?.who === "card" ? talkAmt : 0;
  const guyTalk = line?.who === "adam" ? talkAmt : 0;

  // ---------- buz lastik (ellerin arasında)
  let band: React.ReactNode = null;
  let burst = 0;
  if (!loopEnd && t > at(4) + 0.45 && t < at(6) + 0.9) {
    const st = sm(t, at(5), at(6) - 0.05);
    const snap = t >= at(6) ? Math.min(1, (t - at(6)) / 0.9) : 0;
    const appear = sm(t, at(4) + 0.45, at(4) + 0.8);
    const a = kas.pose.handL;
    const bb = kas.pose.handR;
    band = (
      <g opacity={Math.min(1, appear * 1.5)}>
        <FrozenBand a={{ x: a.x, y: a.y + 6 }} b={{ x: bb.x, y: bb.y + 6 }} stretch={st} snap={snap} />
      </g>
    );
  }
  if (!loopEnd && t >= at(6)) burst = sm(t, at(6), at(6) + 0.12) * (1 - sm(t, at(7) - 0.25, at(7)));

  const coldTint = 0.14 * (1 - w);
  const zoomLine = li >= 4 && li <= 7;

  return (
    <AbsoluteFill lang="tr" style={{ background: "#ffe8d4", overflow: "hidden" }}>
      <Sounds music={music} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540,960) scale(${cs}) translate(${-fx},${-fy})`}>
          <Gym t={t} warm={w} clockSpin={clockSpin} />
          <g transform={`translate(${guy.x},${FLOOR}) scale(${GUY_S})`}>
            <ToonGuy
              pose={guy.pose}
              expr={guy.expr}
              blink={blinkAt(t, 2)}
              look={guy.look}
              talk={guyTalk}
              held={guy.bar !== null ? <Barbell x={0} y={guy.bar} /> : null}
            />
          </g>
          {guy.bar === null ? (
            <g transform={`translate(${GUY_X},${FLOOR - 92 * GUY_S}) scale(${GUY_S})`}>
              <Barbell x={0} y={0} />
            </g>
          ) : null}
          {showKas ? (
            <g transform={`translate(${kas.x},${kas.y}) scale(${KAS_S})`}>
              <Snow t={t} o={(1 - w) * (li >= 1 ? 1 : 0.5)} cx={0} cy={-60} />
              <BloodFlow t={t} o={win(t, at(10) + 0.3, at(13) + 1.2, 0.4)} cx={0} cy={-420} />
              <KasKarakter
                pose={kas.pose}
                expr={kas.expr}
                w={w}
                blink={blinkAt(t, 1)}
                look={kas.look}
                t={t}
                shiver={kas.shiver * (1 - w)}
                blanketOff={blanketOff}
                talk={kasTalk}
                front={band}
              />
              <Sparkles t={t} o={win(t, at(13), at(16), 0.3)} cx={0} cy={-440} />
              {burst > 0 ? (
                <g transform="translate(0,-340)">
                  <Burst x={0} y={0} s={burst * 0.8} />
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
            top: cam(kas.x, kas.y - 340 * KAS_S).y - 120,
            opacity: win(t, s0, e0, 0.12),
            transform: `rotate(-6deg) translateY(${(1 - sm(t, s0, s0 + 0.15)) * 20}px)`,
            ...toonText(200, 22),
          }}
        >
          ÇAT!
        </div>
      ) : null}

      {/* konuşma altyazısı */}
      {line && (line.who === "kas" || line.who === "adam") ? (
        <Caption i={li} line={line} t={t} s={s0} e={e0} top={zoomLine ? 200 : 360} color={line.who === "kas" ? "#ff6b7d" : "#5ad1ff"} />
      ) : null}

      {/* ısınma: hareket adı + ısı çubuğu */}
      {li >= 10 && li <= 12 && line ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            opacity: win(t, at(10), at(13), 0.25),
          }}
        >
          <div style={{ ...toonText(52, 12), color: "#ffd166" }}>ISINMA {li - 9}/3</div>
          <div key={li} style={{ ...toonText(118, 18), opacity: sm(t, s0, s0 + 0.2) }}>
            {line.text}
          </div>
          <div style={{ width: 600, height: 40, borderRadius: 20, border: `8px solid ${INK}`, background: "rgba(255,255,255,0.85)", overflow: "hidden", position: "relative", marginTop: 8 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${Math.round(warm * 100)}%`,
                background: "linear-gradient(90deg, #6aa8ff, #ffb03a, #ff3b52)",
                backgroundSize: "600px 100%",
              }}
            />
          </div>
        </div>
      ) : null}

      {/* kapanış */}
      {line?.who === "card" ? (
        <div
          style={{
            position: "absolute",
            left: 50,
            right: 50,
            top: 300,
            opacity: win(t, s0, e0, 0.3),
            transform: `translateY(${(1 - sm(t, s0, s0 + 0.35)) * 18}px)`,
          }}
        >
          <div style={toonText(124, 20)}>
            Isınma <span style={{ color: "#7be08f" }}>5 dakika.</span>
          </div>
          <div style={{ ...toonText(82, 15), marginTop: 18 }}>
            Ama sakatlanırsan <span style={{ color: "#ff6b7d" }}>aylarca</span> sürebilir.
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
