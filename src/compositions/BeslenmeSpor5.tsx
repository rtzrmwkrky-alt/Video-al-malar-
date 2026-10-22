/**
 * BeslenmeSpor v5 (~33 sn) — kullanıcı: "sessizken de anlaşılsın, örnek videodaki gibi vücudun içine girip göstersin, acıya dokunsun".
 * Örnek videonun dili (koyu lacivert kareli fon, her bölümde kısa başlık + el yazısı alt başlık, vücudun içi kendi şeklinin içinde
 * açılır, Kişi A / Kişi B) ile, çizgi film benzetmesi olmadan, gerçek fizyoloji:
 * kanca "Spor yapıp kas yapamıyorsan… sorun salonda değil." (3 ay salon, kol mezurada hâlâ 32 cm) → kolun içi (deri, yağ, pazı kası, kemik) → antrenman liflerde mikro yırtık → onarılan lif
 * kalınlaşır → malzeme yolu: tabak → mide → kan → pazı (protein taneleri akar) → öğün atlanınca kan boş, yırtık açık → uyku:
 * 8 saat %100 onarım, gece 03:00 → 4 saat %50 → aynı antrenman, 3 ay sonra: Kişi A (yedi + uyudu) 36 cm, Kişi B (atladı) 32 cm →
 * "Kas salonda yorulur… sofrada ve yatakta büyür." → gönder → döngü.
 * Metin `icerik/beslenme-spor-v5.seslendirme.txt` (kelime sayıları satır satır aynı olmalı).
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, SERIF, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import type { CurlyPose } from "../avatar/CurlyGuy";
import { Check, Clock, Cross, Dumbbell, Moon, PhoneItem } from "./GeceYemek";
import { DB, HeroAt, Particle } from "./BeslenmeSpor";
import { EmptyPlate } from "./BeslenmeSpor3";
import { Bulge, Lunch } from "./BeslenmeSpor4";

loadFonts();

const Y = "#FFC83D";
const TEAL = "#6ee7c8";
const RED = "#ff5a4e";
const GREEN = "#47c96b";
const NAVY: [string, string] = ["#1b2a4e", "#0e1630"];
const FLOOR = 1400;

export const B5_LINES: Line[] = [
  { text: "Spor yapıp kas yapamıyorsan… sorun salonda değil.", hl: ["sorun", "değil."], hold: 0.5 },
  { text: "Gel, kolunun içine bakalım.", hl: ["içine"], hold: 0.3 },
  { text: "Her antrenmanda kas liflerinde minicik yırtıklar oluşur.", hl: ["minicik", "yırtıklar"], hold: 0.3 },
  { text: "Kası büyüten, bu yırtıkların onarılmasıdır.", hl: ["onarılmasıdır."], hold: 0.4 },
  { text: "Onarım malzemesi tabağından gelir: protein, kana karışıp kasa taşınır.", hl: ["tabağından", "protein,"], hold: 0.3 },
  { text: "Öğün atlarsan kan boş akar, yırtıklar açık kalır.", hl: ["boş", "açık"], hold: 0.4 },
  { text: "Asıl onarım uykuda olur. Gece üçte yatarsan, iş yarım kalır.", hl: ["uykuda", "yarım"], hold: 0.4 },
  { text: "Aynı antrenman, üç ay sonra:", hl: ["üç", "ay"], hold: 0.2 },
  { text: "Biri yiyip uyudu, biri atladı.", hl: ["uyudu,", "atladı."], hold: 0.8 },
  { text: "Kas salonda yorulur… sofrada ve yatakta büyür.", hl: ["sofrada", "yatakta", "büyür."], hold: 0.5 },
  { text: "Bunu hâlâ değişmeyen o arkadaşına gönder.", hl: ["gönder."], hold: 0.6 },
];

/** her satırın ekrandaki başlığı + el yazısı alt başlığı (örnek videodaki gibi) */
const TITLES: ([string, string] | null)[] = [
  ["Spor var, kas yok?", "Sorun salonda değil."],
  ["Kolun içi", "Deri, kas, kemik."],
  ["Antrenman", "Liflerde minik yırtıklar."],
  ["Onarım = büyüme", "Tamir edilen lif kalınlaşır."],
  ["Malzeme nereden?", "Tabak → kan → kas."],
  ["Öğün atlanırsa", "Kan boş akar."],
  ["Uyku", "Onarım gece yapılır."],
  ["Aynı antrenman", "Aynı program, aynı ağırlık."],
  ["3 ay sonra", "Fark tabakta ve yatakta."],
  null,
  null,
];

export const B5_TAIL = 0.6;
export const B5_TL = timeline(B5_LINES, B5_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of B5_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + B5_TAIL;
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
  const n = words(B5_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (B5_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı (örnek videodaki gibi sade, gölgeli)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const out = 1 - sm(t, tl.total - 0.45, tl.total - 0.15);
  if (out <= 0) return null;
  const line = B5_LINES[i];
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
    <div style={{ position: "absolute", left: 60, right: 60, top: 1540, textAlign: "center", opacity: out }}>
      {ws.slice(from, to).map((w, k) => {
        const wt = tl.wordAt ? wordTime(tl, i, from + k) - 0.06 : wordTime(tl, i, from) + k * 0.05;
        const p = sm(t, wt, wt + 0.16);
        return (
          <span
            key={`${c}-${k}`}
            style={{
              display: "inline-block",
              margin: "0 10px",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 76,
              letterSpacing: -1,
              color: hl.includes(norm(w)) ? Y : "#ffffff",
              textShadow: "0 4px 18px rgba(0,0,0,0.75), 0 2px 0 rgba(0,0,0,0.5)",
              transform: `translateY(${(1 - p) * 10}px)`,
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

// ------------------------------------------------------------ ortak görünüm

/** başlık + el yazısı alt başlık */
const Title: React.FC<{ title: string; sub: string; o: number }> = ({ title, sub, o }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(0,${(1 - o) * 10})`}>
      <text x={540} y={250} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={70} fill="#ffffff" letterSpacing={-1}>
        {title}
      </text>
      <text x={540} y={320} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={56} fill={TEAL}>
        {sub}
      </text>
    </g>
  );

/** koyu fonda etiket (çizgiyle bağlanır) */
const Tag: React.FC<{ x: number; y: number; to?: [number, number]; text: string; o: number; color?: string }> = ({ x, y, to, text, o, color = "#ffffff" }) => {
  if (o <= 0) return null;
  const w = text.length * 26 + 44;
  return (
    <g opacity={o}>
      {to ? <line x1={x} y1={y} x2={to[0]} y2={to[1]} stroke={color} strokeWidth={4} opacity={0.8} /> : null}
      {to ? <circle cx={to[0]} cy={to[1]} r={8} fill={color} /> : null}
      <rect x={x - w / 2} y={y - 32} width={w} height={64} rx={14} fill={color} />
      <text x={x} y={y + 13} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill="#14213d">
        {text}
      </text>
    </g>
  );
};

/** bilgi rozeti (pill) koyu fonda */
export const Chip: React.FC<{ x: number; y: number; text: string; o: number; bg: string; fg?: string; size?: number }> = ({ x, y, text, o, bg, fg = "#ffffff", size = 46 }) => {
  if (o <= 0) return null;
  const w = text.length * size * 0.6 + 50;
  return (
    <g opacity={o} transform={`translate(0,${(1 - o) * 10})`}>
      <rect x={x - w / 2} y={y - size * 0.8} width={w} height={size * 1.6} rx={size * 0.8} fill={bg} />
      <text x={x} y={y + size * 0.35} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} fill={fg}>
        {text}
      </text>
    </g>
  );
};

/** kolun etrafındaki mezura (kahramanın koordinatlarında, sağ kol pazı kasma pozunda) */
export const Tape: React.FC<{ x: number; y?: number; s: number; k: number; o: number }> = ({ x, y = FLOOR, s, k, o }) => {
  if (o <= 0) return null;
  const half = 33 + 17 * k;
  return (
    <g opacity={o} transform={`translate(${x},${y}) scale(${s}) translate(-200,-880)`}>
      <g transform="translate(301,399) rotate(46.4)">
        <rect x={-10} y={-half} width={20} height={half * 2} rx={4} fill={Y} stroke={INK} strokeWidth={3} />
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={i} x1={-10} y1={-half + 8 + i * ((half * 2 - 16) / 6)} x2={0} y2={-half + 8 + i * ((half * 2 - 16) / 6)} stroke={INK} strokeWidth={2} />
        ))}
      </g>
    </g>
  );
};

export const FLEX: CurlyPose = { r: { el: [340, 440], wr: [318, 318], hand: "fist" }, head: 4, lx: 6, ly: -2 };
export const curl = (rep: number): CurlyPose => ({ r: { el: [298, 530], wr: [306 - 20 * rep, 690 - 270 * rep] }, head: -2 });

// ------------------------------------------------------------ kolun içi (kesit)

const Y0 = 1090; // üst kolun ekseni
const AX0 = 60;
const AX1 = 830;

const TEARS: [number, number][] = [
  [0.3, -0.35],
  [0.52, 0.3],
  [0.7, -0.1],
  [0.42, 0.55],
  [0.6, -0.55],
];

/** yakın plan kol: üst kol yatay (omuz solda), dirsekten yukarı ön kol ve yumruk. cut: kolun içi açılır */
export const ArmCut: React.FC<{ t: number; cut: number; dmg: number; heal: number; grow: number; pulse: number; labels: number }> = ({ t, cut, dmg, heal, grow, pulse, labels }) => {
  const T = 300 + 60 * grow;
  const top = Y0 - T / 2;
  const cap = (inset: number) => `M${AX0 + inset},${top + inset} L${AX1 - inset},${top + inset} A${T / 2 - inset},${T / 2 - inset} 0 0 1 ${AX1 - inset},${Y0 + T / 2 - inset} L${AX0 + inset},${Y0 + T / 2 - inset} Z`;
  const cm = Y0 - T * 0.1;
  const h = T * 0.27 * (1 + 0.28 * grow) * (1 + 0.1 * pulse);
  const mx0 = 170;
  const mx1 = 770;
  const mid = (mx0 + mx1) / 2;
  const muscle = `M${mx0},${cm} Q${mid},${cm - 2 * h} ${mx1},${cm} Q${mid},${cm + 2 * h} ${mx0},${cm} Z`;
  const sleeve = ["#ff6a5a", "#e8463c", "#b8302a"];
  return (
    <g>
      <defs>
        <clipPath id="b5-arm">
          <path d={cap(0)} />
        </clipPath>
        <linearGradient id="b5-mus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={interpolateColors(grow, [0, 1], ["#e5675c", "#f2705f"])} />
          <stop offset="0.5" stopColor={interpolateColors(grow, [0, 1], ["#c63b34", "#d9433a"])} />
          <stop offset="1" stopColor="#8e2420" />
        </linearGradient>
        <linearGradient id="b5-slv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sleeve[0]} />
          <stop offset="0.6" stopColor={sleeve[1]} />
          <stop offset="1" stopColor={sleeve[2]} />
        </linearGradient>
      </defs>
      {/* ön kol (kol kıvrık, yumruk yukarıda) */}
      <path d={`M${AX1 - 20},${Y0 + 10} L${AX1 - 90},${Y0 - 520}`} stroke={sleeve[2]} strokeWidth={250} strokeLinecap="round" />
      <path d={`M${AX1 - 20},${Y0 + 10} L${AX1 - 90},${Y0 - 520}`} stroke="url(#b5-slv)" strokeWidth={236} strokeLinecap="round" />
      <ellipse cx={AX1 - 100} cy={Y0 - 650} rx={92} ry={100} fill="#f6d3c0" />
      <ellipse cx={AX1 - 125} cy={Y0 - 680} rx={34} ry={22} fill="#fde4d6" opacity={0.7} />
      {/* üst kol: deri → yağ → kas + kemik */}
      <path d={cap(0)} fill="#f6d3c0" />
      <g clipPath="url(#b5-arm)">
        <path d={cap(16)} fill="#ffe3a0" />
        <path d={cap(34)} fill="#f7c3b4" />
        {/* kemik */}
        <rect x={AX0 + 50} y={Y0 + T * 0.2} width={AX1 - AX0 - 80} height={44} rx={22} fill="#efe6d2" stroke="#c9bda2" strokeWidth={4} />
        <circle cx={AX0 + 60} cy={Y0 + T * 0.2 + 22} r={36} fill="#efe6d2" stroke="#c9bda2" strokeWidth={4} />
        <circle cx={AX1 - 30} cy={Y0 + T * 0.2 + 22} r={36} fill="#efe6d2" stroke="#c9bda2" strokeWidth={4} />
        {/* kas: iğ biçimli pazı, uçlarda tendon */}
        <ellipse cx={mx0 - 10} cy={cm} rx={60} ry={14} fill="#f5f2ea" />
        <ellipse cx={mx1 + 10} cy={cm} rx={60} ry={14} fill="#f5f2ea" />
        <path d={muscle} fill="url(#b5-mus)" stroke="#7a1f1c" strokeWidth={5} />
        {[-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((f) => (
          <path key={f} d={`M${mx0 + 20},${cm} Q${mid},${cm + 2 * h * f} ${mx1 - 20},${cm}`} fill="none" stroke="#7a1f1c" strokeWidth={3} opacity={0.35} />
        ))}
        <path d={`M${mx0 + 60},${cm - h * 0.35} Q${mid},${cm - 1.6 * h} ${mx1 - 60},${cm - h * 0.35}`} fill="none" stroke="#ffb3a8" strokeWidth={8} opacity={0.5} strokeLinecap="round" />
        {/* yırtıklar: sırayla açılır, onarılınca altın renkli yamayla kapanır */}
        {TEARS.map(([fx, fy], i) => {
          const a = Math.min(1, Math.max(0, dmg * TEARS.length - i));
          const hl = Math.min(1, Math.max(0, heal * TEARS.length - i));
          const x = mx0 + (mx1 - mx0) * fx;
          const y = cm + fy * h;
          const open = a * (1 - hl);
          const zig = `M${x - 6},${y - 34} L${x + 10},${y - 12} L${x - 8},${y + 6} L${x + 9},${y + 24} L${x - 2},${y + 38}`;
          return (
            <g key={i}>
              {hl > 0 ? <ellipse cx={x} cy={y} rx={34} ry={26} fill={Y} opacity={0.55 * hl * (1 - grow * 0.7)} /> : null}
              {open > 0.01 ? (
                <g opacity={open}>
                  <circle cx={x} cy={y} r={44 + 6 * Math.sin(t * 6 + i)} fill="#ffd6a0" opacity={0.25} />
                  <path d={zig} fill="none" stroke="#fffaf0" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={zig} fill="none" stroke="#5a1210" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
                </g>
              ) : null}
            </g>
          );
        })}
      </g>
      {/* kol: kumaş kesilip açılır */}
      <g opacity={1 - cut}>
        <path d={cap(0)} fill="url(#b5-slv)" />
        <path d={`M${AX0 + 40},${top + 40} L${AX1 - 60},${top + 40}`} stroke="#ff9a8c" strokeWidth={14} strokeLinecap="round" opacity={0.5} />
      </g>
      <path d={cap(0)} fill="none" stroke={INK} strokeWidth={6} opacity={0.5} />
      {/* etiketler */}
      <Tag x={190} y={top - 70} to={[200, top + 10]} text="DERİ" o={labels} color="#f6d3c0" />
      <Tag x={430} y={top - 70} to={[440, cm - h * 0.6]} text="PAZI KASI" o={labels} color="#ff9a8c" />
      <Tag x={420} y={Y0 + T / 2 + 80} to={[430, Y0 + T * 0.2 + 22]} text="KEMİK" o={labels} color="#efe6d2" />
    </g>
  );
};

/** büyüteçte tek kas lifi: yırtık → altın yama → daha kalın */
const FiberInset: React.FC<{ x: number; y: number; r: number; o: number; p: number; torn?: boolean; uid: string }> = ({ x, y, r, o, p, torn = false, uid }) => {
  if (o <= 0) return null;
  const th = 70 * (1 + 0.45 * p);
  const gap = 46 * (1 - p);
  return (
    <g opacity={o}>
      <defs>
        <clipPath id={uid}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={r} fill="#f9d9cf" />
      <g clipPath={`url(#${uid})`}>
        <rect x={x - r - 20} y={y - th / 2} width={r + 20 - gap / 2} height={th} rx={th / 2} fill="#d9443c" stroke="#7a1f1c" strokeWidth={4} />
        <rect x={x + gap / 2} y={y - th / 2} width={r + 20} height={th} rx={th / 2} fill="#d9443c" stroke="#7a1f1c" strokeWidth={4} />
        {Array.from({ length: 14 }).map((_, k) => {
          const xx = x - r + 10 + k * 24;
          return Math.abs(xx - x) > gap / 2 + 6 ? <line key={k} x1={xx} y1={y - th * 0.38} x2={xx} y2={y + th * 0.38} stroke="#7a1f1c" strokeWidth={3} opacity={0.3} /> : null;
        })}
        {p > 0.02 && !torn ? <rect x={x - 30} y={y - th / 2} width={60} height={th} rx={14} fill={Y} opacity={0.8 * Math.min(1, p * 2) * (1 - Math.max(0, p - 0.8) * 3)} /> : null}
        {torn ? <path d={`M${x - 4},${y - th / 2 - 6} L${x + 8},${y - 10} L${x - 8},${y + 8} L${x + 4},${y + th / 2 + 6}`} stroke="#fffaf0" strokeWidth={8} fill="none" strokeLinecap="round" /> : null}
      </g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#ffffff" strokeWidth={8} />
    </g>
  );
};

// ------------------------------------------------------------ malzeme yolu: tabak → ağız → mide → kan → pazı

const PATH_PTS: [number, number][] = [
  [820, 700], // tabak
  [600, 640],
  [362, 770], // ağız
  [350, 900],
  [330, 1010], // mide
  [400, 960],
  [440, 880], // pazı
];
const segLen = PATH_PTS.slice(1).map((p, i) => Math.hypot(p[0] - PATH_PTS[i][0], p[1] - PATH_PTS[i][1]));
const totalLen = segLen.reduce((a, b) => a + b, 0);
const along = (u: number): [number, number] => {
  let d = u * totalLen;
  for (let i = 0; i < segLen.length; i++) {
    if (d <= segLen[i]) {
      const k = d / segLen[i];
      return [PATH_PTS[i][0] + (PATH_PTS[i + 1][0] - PATH_PTS[i][0]) * k, PATH_PTS[i][1] + (PATH_PTS[i + 1][1] - PATH_PTS[i][1]) * k];
    }
    d -= segLen[i];
  }
  return PATH_PTS[PATH_PTS.length - 1];
};

// ------------------------------------------------------------ uyku satırı

const SleepRow: React.FC<{ y: number; o: number; from: [number, string]; hours: string; v: number; color: string; pct: string; t: number }> = ({ y, o, from, hours, v, color, pct, t }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(0,${(1 - o) * 14})`}>
      <rect x={60} y={y} width={960} height={300} rx={34} fill="#ffffff" fillOpacity={0.06} stroke="#ffffff" strokeOpacity={0.2} strokeWidth={3} />
      <Clock x={170} y={y + 150} r={74} h={from[0]} m={0} />
      <text x={290} y={y + 100} fontFamily={SANS} fontWeight={800} fontSize={52} fill="#ffffff">
        {from[1]} → 07:00
      </text>
      <text x={290} y={y + 160} fontFamily={SERIF} fontStyle="italic" fontSize={46} fill={TEAL}>
        {hours}
      </text>
      <rect x={290} y={y + 196} width={560} height={54} rx={27} fill="#ffffff" fillOpacity={0.12} />
      {v > 0.02 ? <rect x={296} y={y + 202} width={548 * v} height={42} rx={21} fill={color} /> : null}
      <text x={980} y={y + 238} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={46} fill={color}>
        {pct}
      </text>
      <text x={300} y={y + 238} fontFamily={SANS} fontWeight={800} fontSize={30} fill="#14213d" opacity={v > 0.25 ? 0.8 : 0}>
        ONARIM
      </text>
      <Moon x={930} y={y + 90} r={34} />
      {[0, 1, 2].map((k) => (
        <circle key={k} cx={880 - k * 40} cy={y + 60 + k * 8} r={3} fill="#fff4c2" opacity={0.5 + 0.5 * Math.sin(t * 3 + k)} />
      ))}
    </g>
  );

// ------------------------------------------------------------ ana kompozisyon

export type BeslenmeSpor5Props = { audioName: string; data: VoiceoverData | null };

export const BeslenmeSpor5: React.FC<BeslenmeSpor5Props> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : B5_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, 0.21);
  const loopIn = sm(t, T - 0.24, T - 0.03);
  const tc = t > L(10) ? t - T : t;
  const rep = 0.5 - 0.5 * Math.cos(tc * 4.2);

  // ===== 0: kanca — 3 ay, mezura hâlâ 32 cm
  const enter = W(1, 1); // "kolunun" → kola dalış
  const s0 = Math.max(win(t, -1, W(1, 2) + 0.1, 0.25), loopIn);
  const month = t > L(10) ? 1 : Math.max(1, Math.min(3, 1 + Math.floor(interpolate(t, [0.3, W(0, 2) + 0.2], [0, 2.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))));
  const flex = t > W(0, 3) - 0.1 && t < L(10);
  const tapeO = t > L(10) ? 0 : sm(t, W(0, 4) - 0.1, W(0, 4) + 0.2);
  const dive = t > L(10) ? 0 : sm(t, enter - 0.3, W(1, 2) + 0.1);
  // ===== 1-3: kolun içi
  const sArm = win(t, enter - 0.05, L(4) + 0.02, 0.25);
  const armIn = sm(t, enter - 0.05, W(1, 2) + 0.1);
  const cut = sm(t, W(1, 2), W(1, 3) + 0.3);
  const labels = sm(t, W(1, 3), W(1, 3) + 0.3) * (1 - sm(t, L(2) + 0.2, L(2) + 0.5));
  const dmg = sm(t, W(2, 4) - 0.2, W(2, 6) + 0.3);
  const pulse = win(t, W(2, 0), W(2, 3), 0.25) * (0.5 + 0.5 * Math.sin(t * 9));
  const inset3 = sm(t, L(3) + 0.05, L(3) + 0.35);
  const repair3 = sm(t, W(3, 2), W(3, 4) + 0.2);
  // ===== 4-5: malzeme yolu
  const s45 = scene(4, 6);
  const skip = t > L(5) - 0.05;
  const flowOn = skip ? 0 : sm(t, W(4, 2) - 0.1, W(4, 2) + 0.4);
  // ===== 6: uyku
  const s6 = scene(6, 7);
  // ===== 7-8: Kişi A / Kişi B
  const s78 = scene(7, 9);
  const after = sm(t, W(8, 3) + 0.1, W(8, 4) + 0.6); // 3 ay sonra: A büyür
  const abFlex = t > W(8, 3);
  // ===== 9: replik
  const s9 = scene(9, 10);
  // ===== 10: gönder → döngü
  const s10 = win(t, L(10) - 0.02, T - 0.25, 0.18);

  const i = tl.idx(t);
  const titleO = (k: number) => (i === k || (k === 0 && i < 0) ? sm(t, k === 0 ? -1 : L(k) + 0.05, k === 0 ? 0 : L(k) + 0.35) * (1 - sm(t, L(k + 1) - 0.2, L(k + 1))) : 0);

  const HX = 540;
  const bicep: [number, number] = [HX + 101, FLOOR - 481];
  const zoom = 1 + 4 * dive * dive;
  const diveT = `translate(${bicep[0]},${bicep[1]}) scale(${zoom}) translate(${-bicep[0]},${-bicep[1]})`;
  const armScale = 0.55 + 0.45 * armIn;
  const armT = `translate(470,${Y0}) scale(${armScale}) translate(-470,${-Y0})`;

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number; fin?: number }[] = [
    { at: 0, id: 2299, v: 0.28, lead: 0.05 },
    { at: W(0, 4) - 0.05, id: 2568, v: 0.16 }, // mezura
    { at: enter - 0.6, id: 790, v: 0.16, lead: 0.61, dur: 1.0, fade: 0.3 }, // kola dalış
    { at: W(1, 2) + 0.05, id: 1143, v: 0.22, lead: 0.14, dur: 1.4, fade: 0.7 }, // kolun içi açılır
    { at: W(2, 5) - 0.05, id: 2568, v: 0.14 }, // yırtık
    { at: W(3, 3) - 0.05, id: 1120, v: 0.22, lead: 0.1 }, // onarım
    { at: W(4, 2) - 0.05, id: 2568, v: 0.16 }, // tabak
    { at: W(5, 1) - 0.05, id: 2299, v: 0.16, lead: 0.05 }, // öğün atlanır
    { at: W(6, 0) - 0.05, id: 2568, v: 0.14 }, // 8 saat
    { at: W(6, 4) - 0.05, id: 2299, v: 0.14, lead: 0.05 }, // 03:00
    { at: W(8, 4) + 0.2, id: 1120, v: 0.3, lead: 0.1 }, // A büyüdü
  ];
  const duck = (mt: number) => 1 - 0.35 * win(mt, L(5) - 0.1, L(7), 0.4);

  const bg = interpolateColors(s6, [0, 1], [NAVY[0], "#141d3a"]);

  return (
    <AbsoluteFill lang="tr" style={{ background: NAVY[1], overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="b5-bg" cx="50%" cy="38%" r="75%">
            <stop offset="0" stopColor={bg} />
            <stop offset="1" stopColor={NAVY[1]} />
          </radialGradient>
          <pattern id="b5-grid" width={60} height={60} patternUnits="userSpaceOnUse">
            <path d="M60,0 L0,0 L0,60" fill="none" stroke="#ffffff" strokeOpacity={0.05} strokeWidth={2} />
          </pattern>
          <radialGradient id="b5-red" cx="0%" cy="0%" r="70%">
            <stop offset="0" stopColor="#ff4d4d" stopOpacity={0.12} />
            <stop offset="1" stopColor="#ff4d4d" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#b5-bg)" />
        <rect width={1080} height={1920} fill="url(#b5-grid)" />
        <rect width={1080} height={1920} fill="url(#b5-red)" />

        {/* üst başlıklar */}
        {TITLES.map((tt, k) => (tt ? <Title key={k} title={tt[0]} sub={tt[1]} o={k === 0 ? Math.max(titleO(0), loopIn) * (t > L(10) && loopIn === 0 ? 0 : 1) : titleO(k)} /> : null))}

        {/* ===== 0: kanca ===== */}
        {s0 > 0 ? (
          <g opacity={s0}>
            <g transform={diveT}>
              <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke="#ffffff" strokeOpacity={0.15} strokeWidth={4} />
              <HeroAt uid="b50" x={HX} s={1} t={t} pose={flex ? FLEX : curl(rep)} item={flex ? undefined : DB} expr={flex ? (t > W(0, 5) ? "ouch" : "grin") : rep > 0.55 ? "ouch" : "neutral"} />
              <Tape x={HX} s={1} k={0} o={tapeO} />
            </g>
            <g opacity={1 - dive}>
              <Chip x={540} y={440} text={`${month}. AY · 32 CM`} o={1} bg="#ffffff" fg="#14213d" size={46} />
              <Chip x={830} y={620} text="32 CM" o={tapeO} bg={Y} fg="#14213d" size={50} />
              <Chip x={830} y={720} text="AYNI" o={t > L(10) ? 0 : sm(t, W(0, 6) - 0.1, W(0, 6) + 0.2)} bg={RED} size={46} />
            </g>
          </g>
        ) : null}

        {/* ===== 1-3: kolun içi ===== */}
        {sArm > 0 ? (
          <g opacity={sArm}>
            <g transform={armT}>
              <ArmCut t={t} cut={cut} dmg={dmg} heal={0} grow={0} pulse={pulse} labels={labels} />
            </g>
            <Chip x={330} y={700} text="MİKRO YIRTIK" o={sm(t, W(2, 6) - 0.1, W(2, 6) + 0.2) * (1 - sm(t, L(3) - 0.2, L(3)))} bg={RED} size={46} />
            {/* 3: büyüteçte tek lif onarılır */}
            <g opacity={inset3}>
              <line x1={420} y1={600} x2={450} y2={Y0 - 80} stroke="#ffffff" strokeWidth={4} opacity={0.6} />
              <FiberInset x={300} y={520} r={150} o={1} p={repair3} uid="b5i3" />
              <Chip x={300} y={720} text={repair3 > 0.6 ? "DAHA KALIN" : "ONARILIYOR"} o={sm(t, W(3, 2) - 0.1, W(3, 2) + 0.2)} bg={repair3 > 0.6 ? GREEN : Y} fg={repair3 > 0.6 ? "#ffffff" : "#14213d"} size={40} />
            </g>
          </g>
        ) : null}

        {/* ===== 4-5: tabak → mide → kan → pazı ===== */}
        {s45 > 0 ? (
          <g opacity={s45}>
            <HeroAt uid="b54" x={330} s={1} t={t} pose={FLEX} expr={skip ? "ouch" : "smile"} />
            {/* gövdede kesit penceresi: mide */}
            <circle cx={330} cy={1010} r={92} fill="#0e1630" fillOpacity={0.9} stroke={TEAL} strokeWidth={5} strokeDasharray="14 10" />
            <path d="M290,975 Q340,950 372,985 Q392,1030 350,1052 Q312,1066 300,1035 Q318,1022 312,1005 Q296,996 290,975 Z" fill="#f4a3a8" stroke="#b5565e" strokeWidth={4} />
            {/* pazıda kesit penceresi */}
            <circle cx={440} cy={880} r={46} fill="none" stroke={skip ? RED : Y} strokeWidth={6} />
            {/* yol: yemek (kesikli) + kan damarı (kırmızı) */}
            <path d={`M${PATH_PTS[0][0]},${PATH_PTS[0][1]} Q600,560 ${PATH_PTS[2][0]},${PATH_PTS[2][1]}`} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={4} strokeDasharray="12 12" />
            <path d={`M330,1010 Q420,990 440,880`} fill="none" stroke={RED} strokeWidth={14} strokeLinecap="round" opacity={skip ? 0.3 : 0.85} />
            {/* akan protein taneleri */}
            {flowOn > 0.01
              ? Array.from({ length: 9 }).map((_, k) => {
                  const u = (((t * 0.28 + k / 9) % 1) + 1) % 1;
                  const [px, py] = along(u);
                  return <Particle key={k} x={px} y={py} kind={k % 3 === 2 ? 1 : 0} o={flowOn * Math.min(1, Math.sin(u * Math.PI) * 3)} rot={0} />;
                })
              : null}
            {/* tabak: dolu → öğün atlanınca boş */}
            <g transform="translate(830,720) scale(1.6) translate(-830,-720)">
              {skip ? <EmptyPlate x={830} y={720} /> : <Lunch x={830} y={720} />}
            </g>
            {skip ? <Cross x={830} y={600} s={40} p={sm(t, W(5, 1) - 0.1, W(5, 1) + 0.3)} /> : null}
            <Tag x={830} y={860} text={skip ? "ÖĞÜN YOK" : "TABAK"} o={sm(t, L(4) + 0.1, L(4) + 0.4)} color={skip ? RED : "#ffffff"} />
            <Tag x={160} y={1150} to={[300, 1040]} text="MİDE" o={sm(t, W(4, 3) - 0.1, W(4, 3) + 0.2)} color="#f4a3a8" />
            <Tag x={640} y={1010} to={[410, 960]} text={skip ? "KAN BOŞ" : "KAN"} o={sm(t, W(4, 5) - 0.1, W(4, 5) + 0.2)} color={skip ? RED : "#ff9a8c"} />
            <Tag x={640} y={880} to={[486, 880]} text="PAZI" o={sm(t, W(4, 7) - 0.1, W(4, 7) + 0.2)} color={Y} />
            <Chip x={540} y={440} text="PROTEİN" o={skip ? 0 : sm(t, W(4, 4) - 0.1, W(4, 4) + 0.2)} bg="#4aa3ff" size={46} />
            {/* öğün atlanınca: pazıdaki yırtık açık kalır */}
            <g opacity={skip ? sm(t, W(5, 5) - 0.15, W(5, 5) + 0.2) : 0}>
              <line x1={480} y1={850} x2={700} y2={640} stroke="#ffffff" strokeWidth={4} opacity={0.6} />
              <FiberInset x={790} y={560} r={120} o={1} p={0} torn uid="b5i5" />
              <Chip x={790} y={720} text="AÇIK KALDI" o={1} bg={RED} size={40} />
            </g>
          </g>
        ) : null}

        {/* ===== 6: uyku ===== */}
        {s6 > 0 ? (
          <g opacity={s6}>
            <SleepRow
              y={470}
              o={sm(t, L(6) + 0.05, L(6) + 0.4)}
              from={[11, "23:00"]}
              hours="8 saat uyku"
              v={sm(t, L(6) + 0.3, W(6, 3) + 0.3)}
              color={GREEN}
              pct="%100"
              t={t}
            />
            <SleepRow
              y={850}
              o={sm(t, W(6, 4) - 0.15, W(6, 4) + 0.2)}
              from={[3, "03:00"]}
              hours="4 saat uyku"
              v={0.5 * sm(t, W(6, 5), W(6, 8))}
              color={RED}
              pct="%50"
              t={t}
            />
            <Chip x={540} y={1260} text="İŞ YARIM KALIR" o={sm(t, W(6, 8) - 0.1, W(6, 8) + 0.2)} bg={RED} size={50} />
          </g>
        ) : null}

        {/* ===== 7-8: Kişi A / Kişi B ===== */}
        {s78 > 0 ? (
          <g opacity={s78}>
            <line x1={540} y1={520} x2={540} y2={1420} stroke="#ffffff" strokeOpacity={0.15} strokeWidth={3} strokeDasharray="10 12" />
            {[
              { x: 290, who: "KİŞİ A", good: true },
              { x: 790, who: "KİŞİ B", good: false },
            ].map(({ x, who, good }) => {
              const k = good ? after : 0;
              return (
                <g key={who}>
                  <HeroAt
                    uid={good ? "b5abA" : "b5abB"}
                    x={x}
                    s={0.8}
                    t={t}
                    pose={abFlex ? FLEX : curl(rep)}
                    item={abFlex ? undefined : DB}
                    expr={abFlex ? (good ? (after > 0.6 ? "laugh" : "grin") : after > 0.6 ? "ouch" : "neutral") : rep > 0.55 ? "ouch" : "neutral"}
                  />
                  {abFlex ? <Bulge x={x} s={0.8} side="r" k={k} /> : null}
                  {abFlex ? <Tape x={x} s={0.8} k={k} o={sm(t, W(8, 3), W(8, 3) + 0.3)} /> : null}
                  <text x={x} y={1470} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46} fill="#ffffff">
                    {who}
                  </text>
                  {/* beslenme + uyku rozetleri */}
                  <g opacity={sm(t, W(8, good ? 1 : 4) - 0.1, W(8, good ? 1 : 4) + 0.2)}>
                    <g transform={`translate(${x - 70},600)`}>
                      <circle r={50} fill="#ffffff" fillOpacity={0.1} stroke="#ffffff" strokeOpacity={0.3} strokeWidth={3} />
                      <g transform="scale(0.55)">
                        {good ? <Lunch x={0} y={0} /> : <EmptyPlate x={0} y={0} />}
                      </g>
                    </g>
                    <g transform={`translate(${x + 70},600)`}>
                      <circle r={50} fill="#ffffff" fillOpacity={0.1} stroke="#ffffff" strokeOpacity={0.3} strokeWidth={3} />
                      <Moon x={0} y={0} r={26} />
                    </g>
                    {good ? <Check x={x} y={690} s={26} p={1} /> : <Cross x={x} y={680} s={22} p={1} />}
                  </g>
                  <Chip x={x} y={790} text={good ? `${Math.round(32 + 4 * after)} CM` : "32 CM"} o={sm(t, W(8, 3), W(8, 3) + 0.3)} bg={good ? (after > 0.6 ? GREEN : Y) : Y} fg={good && after > 0.6 ? "#ffffff" : "#14213d"} size={48} />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* ===== 9: akılda kalan replik ===== */}
        {s9 > 0 ? (
          <g opacity={s9}>
            <g opacity={sm(t, L(9) + 0.05, L(9) + 0.35)}>
              <g transform="translate(540,560)">
                <circle r={110} fill="#ffffff" fillOpacity={0.08} />
                <Dumbbell x={0} y={0} s={0.95} rot={-15} />
              </g>
              <text x={540} y={800} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={70} fill="#ffffff">
                Kas salonda yorulur…
              </text>
            </g>
            <g opacity={sm(t, W(9, 3) - 0.1, W(9, 3) + 0.25)}>
              <g transform="translate(400,1020)">
                <circle r={110} fill="#ffffff" fillOpacity={0.08} />
                <g transform="scale(0.95)">
                  <Lunch x={0} y={0} />
                </g>
              </g>
              <g transform="translate(680,1020)">
                <circle r={110} fill="#ffffff" fillOpacity={0.08} />
                <Moon x={0} y={0} r={52} />
              </g>
              <text x={540} y={1250} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={84} fill={TEAL}>
                sofrada ve yatakta büyür.
              </text>
            </g>
          </g>
        ) : null}

        {/* ===== 10: gönder (sonra kanca karesi geri gelir) ===== */}
        {s10 > 0 ? (
          <g opacity={s10}>
            <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke="#ffffff" strokeOpacity={0.15} strokeWidth={4} />
            <HeroAt uid="b510" x={540} s={0.9} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="grin" item={<PhoneItem />} />
            <g opacity={sm(t, L(10) + 0.15, L(10) + 0.45)}>
              <text x={540} y={300} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={74} fill="#ffffff">
                Bunu ona gönder.
              </text>
              <text x={540} y={380} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={56} fill={TEAL}>
                Hâlâ aynı kalan arkadaşına.
              </text>
            </g>
          </g>
        ) : null}
      </svg>

      <Captions t={t} tl={tl} />
      {data ? <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} /> : null}
      {FX.map((f, k) => (
        <Sequence key={`fx${k}`} from={Math.max(0, Math.round(f.at * fps))} durationInFrames={f.dur ? Math.round(f.dur * fps) : undefined} layout="none">
          <Audio
            src={staticFile(`sfx/${f.id}.mp3`)}
            startFrom={Math.round((f.lead ?? 0) * fps)}
            volume={(q) => (f.dur && f.fade ? f.v * interpolate(q / fps, [0, f.fin ?? 0.001, f.dur - f.fade, f.dur], [f.fin ? 0 : 1, 1, 1, 0], { extrapolateRight: "clamp" }) : f.v)}
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
