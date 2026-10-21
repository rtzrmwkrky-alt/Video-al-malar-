/**
 * BeslenmeSpor v4 (~32 sn) — kullanıcı: "seslendirme olmadan da görüntüye bakarak anlamalıyım". Hikâye görüntüyle anlatılır:
 * salonda dambıl → büyüteçle pazının içi, liflerde yırtıklar → tamir ekibi hazır ama yol boş → gencin kötü günü üç panelde
 * (kahvaltı yok, tek poğaça, gece 03:00 telefon) → malzeme kamyonu BOŞ gelir, ekip omuz silker, TAMİR YOK → ayna: 8. hafta, aynı kol →
 * iyi gün üç panelde (yumurtalı kahvaltı, dolu tabak, 23:00 uyku) → kamyon DOLU gelir, ekip onarır, lifler kalınlaşır →
 * ayna: 12. hafta, pazı belirgin → gönder → döngü.
 * Ortak parçalar `BeslenmeSpor.tsx` ve `BeslenmeSpor3.tsx`'ten. Metin `icerik/beslenme-spor-v4.seslendirme.txt`.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import type { CurlyPose } from "../avatar/CurlyGuy";
import { Check, Clock, Cross, Floor, Moon, PhoneItem, Pill, Txt } from "./GeceYemek";
import { Crew, DB, GymSign, HeroAt, MuscleView, Particle, Plates, Rack, Sweat, rowY } from "./BeslenmeSpor";
import { EmptyPlate, Mirror, Pogaca } from "./BeslenmeSpor3";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const GREEN = "#47c96b";
const FLOOR = 1400;
/** kasın içi görünümünün üst kenarı (yol ve ekip için altta yer kalır) */
const MV_TOP = 200;

export const B4_LINES: Line[] = [
  { text: "Salonda kas yapmıyorsun. Kas, salondan çıkınca yapılıyor.", hl: ["yapmıyorsun.", "çıkınca"], hold: 0.4 },
  { text: "Ağırlık kaldırınca kasında minicik yırtıklar oluşur.", hl: ["minicik", "yırtıklar"], hold: 0.2 },
  { text: "Tamir ekibi hemen işe koyulur… ama malzeme lazım.", hl: ["malzeme", "lazım."], hold: 0.2 },
  { text: "Sabah kahvaltı yok. Öğlen bir poğaça. Gece üçte yatış.", hl: ["yok.", "poğaça.", "üçte"], hold: 0.3 },
  { text: "Kamyon boş gelir: “Şefim, bugün de tamir yok.”", hl: ["boş", "yok.”"], hold: 0.4 },
  { text: "Haftalar geçer… aynada hiçbir şey değişmez.", hl: ["hiçbir", "değişmez."], hold: 0.4 },
  { text: "Ama kahvaltını yaparsan, öğününü atlamazsan, erken yatarsan…", hl: ["kahvaltını", "öğününü", "erken"], hold: 0.2 },
  { text: "Kamyon dolu gelir, ekip çalışır, kas büyür.", hl: ["dolu", "büyür."], hold: 0.3 },
  { text: "Kas salonda yorulur… sofrada ve yatakta büyür.", hl: ["sofrada", "yatakta", "büyür."], hold: 0.4 },
  { text: "Bunu hâlâ değişmeyen o arkadaşına gönder.", hl: ["gönder."], hold: 0.6 },
];

/** tamir ekibinin konuşması (altyazı açık mavi) — sadece 4. satırın tırnak içi */
const QUOTE_FROM: [number, number] = [4, 3];

export const B4_TAIL = 0.6;
export const B4_TL = timeline(B4_LINES, B4_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of B4_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + B4_TAIL;
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
  const n = words(B4_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (B4_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const out = 1 - sm(t, tl.total - 0.45, tl.total - 0.15);
  if (out <= 0) return null;
  const line = B4_LINES[i];
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
    <div style={{ position: "absolute", left: 40, right: 40, top: 1560, textAlign: "center", opacity: out }}>
      {ws.slice(from, to).map((w, k) => {
        const wt = tl.wordAt ? wordTime(tl, i, from + k) - 0.06 : wordTime(tl, i, from) + k * 0.05;
        const p = sm(t, wt, wt + 0.16);
        const quote = i === QUOTE_FROM[0] && from + k >= QUOTE_FROM[1];
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
              color: hl.includes(norm(w)) ? Y : quote ? "#bfe6ff" : "#ffffff",
              WebkitTextStroke: `14px ${INK}`,
              paintOrder: "stroke",
              textShadow: "0 8px 0 rgba(27,20,32,0.3)",
              transform: `translateY(${(1 - p) * 14}px)`,
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

const FLEX: CurlyPose = { r: { el: [340, 440], wr: [318, 318], hand: "fist" }, head: 4, lx: 6, ly: -2 };
const FLEX_MIRROR: CurlyPose = { l: { el: [60, 440], wr: [82, 318], hand: "fist" }, head: -4, lx: -6, ly: -2 };

/** kasılmış pazı: kahramanın koordinatlarında (ayak ortası x,y; ölçek s), kolun üst yanında şişkinlik */
const Bulge: React.FC<{ x: number; y?: number; s: number; side: "r" | "l"; k: number }> = ({ x, y = FLOOR, s, side, k }) =>
  k <= 0.01 ? null : (
    <g transform={`translate(${x},${y}) scale(${s}) translate(-200,-880)`}>
      {(() => {
        const d = side === "r" ? "M262,358 L340,440" : "M138,358 L60,440";
        const [mx, my] = side === "r" ? [301, 399] : [99, 399];
        const w = 50 + 34 * k;
        return (
          <g>
            <path d={d} stroke="#b8302a" strokeWidth={w + 6} strokeLinecap="round" />
            <path d={d} stroke="#e8463c" strokeWidth={w} strokeLinecap="round" />
            <path d={d} stroke="#ff9a8c" strokeWidth={w * 0.25} strokeLinecap="round" opacity={0.55} transform={`translate(${side === "r" ? -6 : 6},-10)`} />
            <circle cx={mx} cy={my} r={w * 0.08} fill="#ffffff" opacity={0} />
          </g>
        );
      })()}
    </g>
  );

/** kahve bardağı */
const Cup: React.FC = () => (
  <g transform="translate(0,-40)">
    <path d="M-22,-30 L22,-30 L17,28 L-17,28 Z" fill="#ffffff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-24} y={-40} width={48} height={12} rx={5} fill="#7a4a2a" stroke={INK} strokeWidth={4} />
    <rect x={-20} y={-6} width={40} height={14} fill="#b77a4a" />
  </g>
);

/** yumurtalı kahvaltı tabağı */
const Breakfast: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={0} rx={92} ry={36} fill="#ffffff" stroke={INK} strokeWidth={6} />
    {[-30, 26].map((dx) => (
      <g key={dx}>
        <ellipse cx={dx} cy={-6} rx={30} ry={15} fill="#fffaf0" stroke={INK} strokeWidth={4} />
        <circle cx={dx + 2} cy={-8} r={9} fill="#ffc533" stroke={INK} strokeWidth={3} />
      </g>
    ))}
    <rect x={44} y={-30} width={40} height={20} rx={6} fill="#e9b26a" stroke={INK} strokeWidth={4} transform="rotate(-12 64 -20)" />
    <circle cx={-66} cy={-14} r={10} fill="#ff5a4e" stroke={INK} strokeWidth={3} />
  </g>
);

/** dolu öğle tabağı: pilav, tavuk, salata */
const Lunch: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={0} rx={96} ry={38} fill="#ffffff" stroke={INK} strokeWidth={6} />
    <ellipse cx={-34} cy={-10} rx={34} ry={18} fill="#fffaf0" stroke={INK} strokeWidth={4} />
    <path d="M6,-4 Q20,-34 52,-24 Q66,-8 50,6 Q22,10 6,-4 Z" fill="#d9853b" stroke={INK} strokeWidth={4} />
    <path d="M-10,12 Q-2,-6 18,6 Q6,20 -10,12 Z" fill="#7ccf4a" stroke={INK} strokeWidth={3} />
    <circle cx={-60} cy={6} r={9} fill="#ff5a4e" stroke={INK} strokeWidth={3} />
  </g>
);

/** gencin günü: bir panel (sabah / öğle / gece) */
const DayPanel: React.FC<{
  y: number;
  o: number;
  label: string;
  night?: boolean;
  mark: "x" | "v";
  mp: number;
  children: React.ReactNode;
}> = ({ y, o, label, night = false, mark, mp, children }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${(1 - o) * -40},0)`}>
      <defs>
        <clipPath id={`dp-${y}`}>
          <rect x={70} y={y} width={940} height={320} rx={34} />
        </clipPath>
      </defs>
      <rect x={70} y={y} width={940} height={320} rx={34} fill={night ? "#2b3a6b" : "#fff8ec"} />
      <g clipPath={`url(#dp-${y})`}>{children}</g>
      <rect x={70} y={y} width={940} height={320} rx={34} fill="none" stroke={INK} strokeWidth={8} />
      <rect x={96} y={y + 22} width={label.length * 30 + 40} height={56} rx={28} fill={night ? Y : INK} />
      <text x={116} y={y + 62} fontFamily={SANS} fontWeight={800} fontSize={40} fill={night ? INK : "#ffffff"} letterSpacing={2}>
        {label}
      </text>
      {mp > 0 ? (
        <g>
          <circle cx={925} cy={y + 160} r={58 * Math.min(1, mp * 1.4)} fill={mark === "x" ? "#ffe3df" : "#e3f6e8"} stroke={INK} strokeWidth={6} />
          {mark === "x" ? <Cross x={925} y={y + 160} s={30} p={mp} /> : <Check x={925} y={y + 172} s={32} p={mp} />}
        </g>
      ) : null}
    </g>
  );

/** malzeme kamyonu (yandan, sağa gider); dolu ise kasada malzeme */
const Truck: React.FC<{ x: number; y: number; full: number; t: number; moving: boolean }> = ({ x, y, full, t, moving }) => {
  const spin = moving ? t * 600 : 0;
  const bob = moving ? Math.sin(t * 30) * 2 : 0;
  return (
    <g transform={`translate(${x},${y + bob})`}>
      {/* kasa yükü */}
      {full > 0.01
        ? [0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
            <Particle key={k} x={-200 + (k % 4) * 50} y={-138 - Math.floor(k / 4) * 34 - (k % 2) * 6} kind={k % 3} o={full} rot={(k * 37) % 40 - 20} />
          ))
        : null}
      {/* kasa */}
      <rect x={-240} y={-122} width={230} height={82} rx={10} fill="#4a90d9" stroke={INK} strokeWidth={7} />
      <text x={-125} y={-68} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill="#ffffff">
        MALZEME
      </text>
      {/* kabin */}
      <path d="M-10,-40 L-10,-140 L60,-140 Q90,-138 100,-100 L106,-40 Z" fill={Y} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M8,-122 L54,-122 Q74,-120 82,-92 L8,-92 Z" fill="#bfe6ff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-246} y={-44} width={358} height={22} rx={8} fill="#3b3f58" stroke={INK} strokeWidth={6} />
      {[-180, 50].map((wx) => (
        <g key={wx} transform={`translate(${wx},-18)`}>
          <circle r={32} fill="#2b2f45" stroke={INK} strokeWidth={6} />
          <circle r={13} fill="#c9ced8" />
          <g transform={`rotate(${spin})`}>
            <line x1={-13} y1={0} x2={13} y2={0} stroke={INK} strokeWidth={4} />
          </g>
        </g>
      ))}
    </g>
  );
};

/** kasın altındaki yol (malzeme buradan gelir) */
const Road: React.FC<{ t: number; moving: boolean }> = ({ t, moving }) => (
  <g>
    <rect x={0} y={1290} width={1080} height={130} fill="#c9b8b0" />
    <line x1={0} y1={1290} x2={1080} y2={1290} stroke={INK} strokeWidth={6} opacity={0.5} />
    {Array.from({ length: 9 }).map((_, k) => {
      const off = moving ? (t * 300) % 140 : 0;
      return <rect key={k} x={k * 140 - off} y={1350} width={70} height={10} rx={5} fill="#ffffff" opacity={0.7} />;
    })}
  </g>
);

// ------------------------------------------------------------ ana kompozisyon

export type BeslenmeSpor4Props = { audioName: string; data: VoiceoverData | null };

export const BeslenmeSpor4: React.FC<BeslenmeSpor4Props> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : B4_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, 0.21);
  const loopIn = sm(t, T - 0.24, T - 0.03);

  // ===== 0-1: salon, ters köşe kanca; "kasında" kelimesinde pazıya dalınır
  const enter = W(1, 2);
  const twist = W(0, 3);
  const s0 = Math.max(win(t, -1, enter + 0.02, 0.21), loopIn);
  const tc = t > L(9) ? t - T : t;
  const rep = 0.5 - 0.5 * Math.cos(tc * 4.2);
  const dive = sm(t, enter - 0.6, enter + 0.02);
  // ===== kasın içi (1-2, 4, 7)
  const sA = win(t, enter - 0.02, L(3) + 0.02, 0.21);
  const s4 = scene(4, 5);
  const s7 = scene(7, 8);
  const inside = Math.max(sA, s4, s7);
  const dmg = sm(t, W(1, 3) - 0.2, W(1, 5) + 0.3);
  // ===== 3 ve 6: gencin günü
  const s3 = scene(3, 4);
  const s6 = scene(6, 7);
  // ===== 5 ve 8: ayna
  const s5 = scene(5, 6);
  const s8 = scene(8, 9);
  // ===== 9: gönder → döngü
  const s9 = win(t, L(9) - 0.02, T - 0.25, 0.18);

  // kamyon: 4'te boş, 7'de dolu gelir (soldan, yavaşlayarak durur)
  const arrive = (a: number, b: number) => interpolate(sm(t, a, b), [0, 1], [-300, 380]);
  const truckX = t < L(7) - 0.1 ? arrive(L(4) - 0.05, W(4, 2) + 0.15) : arrive(L(7) - 0.05, W(7, 2) + 0.15);
  const truckMoving = t < L(7) - 0.1 ? t > L(4) - 0.05 && t < W(4, 2) + 0.1 : t > L(7) - 0.05 && t < W(7, 2) + 0.1;
  const unload = sm(t, W(7, 3) - 0.1, W(7, 3) + 0.5); // ekip boşaltır → kasaya akar
  const full7 = interpolate(t, [W(7, 3), W(7, 6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const grow = sm(t, W(7, 6) - 0.15, W(7, 6) + 0.6);
  const mv =
    t < L(4) - 0.1
      ? { dmg, sig: sm(t, L(2), L(2) + 0.4), supply: 0, repair: 0, grow: 0, empty: sm(t, W(2, 6) - 0.1, W(2, 6) + 0.3) }
      : t < L(7) - 0.1
        ? { dmg: 1, sig: 0.5, supply: 0, repair: 0, grow: 0, empty: 1 }
        : { dmg: 1, sig: 0.5 * (1 - unload), supply: 0.08 + 0.92 * unload, repair: full7, grow, empty: 1 - unload };

  // ekip: çırak (sarı baret) ve şef (beyaz baret)
  const chiefTalk = t > W(4, 3) - 0.05 && t < L(5) - 0.2;
  const crewPose = t < L(3) ? (t < W(2, 5) ? "work" : "idle") : t < L(7) ? (t > W(4, 3) - 0.1 ? "shrug" : "idle") : t > W(7, 3) ? "work" : "idle";
  const crewExpr = t < W(2, 5) ? "happy" : t < L(7) ? (t > W(4, 1) ? "sad" : "alert") : "happy";

  const gym = Math.max(win(t, -1, enter + 0.02, 0.21), s5, s8, win(t, L(9) - 0.02, T + 1, 0.21));
  const HX = 540;
  const bicep: [number, number] = [HX + 82, FLOOR - 434];
  const zoom = t > enter + 0.1 ? 1 : 1 + 3.4 * dive * dive;
  const diveT = `translate(${bicep[0]},${bicep[1]}) scale(${zoom}) translate(${-bicep[0]},${-bicep[1]})`;

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number; fin?: number }[] = [
    { at: 0, id: 2299, v: 0.3, lead: 0.05 },
    { at: twist - 0.05, id: 2568, v: 0.14 },
    { at: enter - 0.95, id: 790, v: 0.16, lead: 0.61, dur: 1.0, fade: 0.3 },
    { at: enter + 0.05, id: 1143, v: 0.22, lead: 0.14, dur: 1.4, fade: 0.7 },
    { at: W(3, 2) - 0.05, id: 2568, v: 0.16 }, // ✕ sabah
    { at: W(3, 5) - 0.05, id: 2568, v: 0.16 }, // ✕ öğle
    { at: W(3, 8) - 0.05, id: 2568, v: 0.16 }, // ✕ gece
    { at: W(4, 6) - 0.05, id: 2299, v: 0.16, lead: 0.05 }, // TAMİR YOK
    { at: W(5, 3) - 0.05, id: 2299, v: 0.14, lead: 0.05 }, // hiçbir şey değişmez
    { at: W(6, 2) - 0.05, id: 1120, v: 0.2, lead: 0.1 }, // ✓ sabah
    { at: W(6, 4) - 0.05, id: 1120, v: 0.2, lead: 0.1 }, // ✓ öğle
    { at: W(6, 6) - 0.05, id: 1120, v: 0.2, lead: 0.1 }, // ✓ gece
    { at: W(7, 6) - 0.05, id: 1143, v: 0.2, lead: 0.14, dur: 1.2, fade: 0.6 }, // kas büyür
    { at: W(8, 7) - 0.05, id: 1120, v: 0.3, lead: 0.1 }, // ayna ✓
  ];
  const duck = (mt: number) => 1 - 0.4 * win(mt, W(4, 3) - 0.1, L(6), 0.4);

  const GYM: [string, string] = ["#5b6b8f", "#3f4b6c"];
  const PINK: [string, string] = ["#fbe3dc", "#f2c9bd"];
  const bgAt: [number, string, string][] = [
    [0, ...GYM],
    [enter, ...PINK],
    [L(3), "#d9d3e6", "#bdb3d3"], // kötü gün: soluk lila
    [L(4), ...PINK],
    [L(5), ...GYM],
    [L(6), "#d4ebe0", "#b9dccb"], // iyi gün: mint
    [L(7), "#ffe3b8", "#f8c98f"], // kamyon dolu: sıcak
    [L(8), ...GYM],
  ];
  let bgTop = bgAt[0][1];
  let bgBot = bgAt[0][2];
  for (let k = 1; k < bgAt.length; k++) {
    const at = bgAt[k][0];
    bgTop = interpolateColors(t, [at - 0.15, at + 0.25], [bgTop, bgAt[k][1]]);
    bgBot = interpolateColors(t, [at - 0.15, at + 0.25], [bgBot, bgAt[k][2]]);
  }

  const insideIn = sm(t, enter - 0.05, enter + 0.55);
  // kasın içi küçük gösterilir (altta yol + ekip): üstten ölçekle
  const mvT = `translate(540,${MV_TOP}) scale(${t < L(2) ? 1.25 - 0.25 * insideIn : 1} ${t < L(2) ? 1.25 - 0.25 * insideIn : 1}) scale(0.86) translate(-540,-250)`;

  const panelO = (line: number, k: number) => sm(t, W(line, k) - 0.2, W(line, k) + 0.15);
  const markP = (line: number, k: number) => sm(t, W(line, k) - 0.1, W(line, k) + 0.3);

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="b4-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="b4-glow" cx="50%" cy="40%" r="55%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.3} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="b4-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#b4-bg)" />
        <rect width={1080} height={1920} fill="url(#b4-glow)" />

        {/* ===== salon ===== */}
        <g opacity={gym}>
          <Floor tint="#2a2a3a" />
        </g>
        {gym > 0 ? (
          <g opacity={gym} transform={diveT}>
            <GymSign x={90} y={170} />
            {Math.max(s5, s8) > 0.01 ? null : <Rack x={620} y={560} />}
            <Plates x={170} />
          </g>
        ) : null}

        {/* ===== 0-1: kanca + dambıl, pazıya dalış ===== */}
        {s0 > 0 ? (
          <g opacity={s0}>
            <g opacity={(1 - sm(t, L(1) - 0.1, L(1) + 0.3)) * (t > L(9) ? loopIn : 1)}>
              <g opacity={1 - sm(t, twist - 0.15, twist + 0.1) * (t > L(9) ? 0 : 1)}>
                <Txt x={540} y={380} size={86} fill="#ffffff" sw={16}>
                  SALONDA KAS
                </Txt>
                <Txt x={540} y={505} size={112} fill={Y} sw={18}>
                  YAPMIYORSUN.
                </Txt>
              </g>
              <g opacity={sm(t, twist - 0.05, twist + 0.2) * (t > L(9) ? 0 : 1)}>
                <Txt x={540} y={380} size={78} fill="#ffffff" sw={16}>
                  KAS, SALONDAN
                </Txt>
                <Txt x={540} y={505} size={100} fill={Y} sw={18}>
                  ÇIKINCA YAPILIYOR.
                </Txt>
              </g>
            </g>
            <g transform={diveT}>
              <HeroAt uid="b40" x={HX} s={1} t={t} pose={{ r: { el: [298, 530], wr: [306 - 20 * rep, 690 - 270 * rep] }, head: -2 }} item={DB} expr={rep > 0.55 ? "ouch" : "neutral"} />
              <Sweat t={t} pts={[[470, 700], [610, 690]]} />
            </g>
          </g>
        ) : null}

        {/* ===== kasın içi + yol + ekip + kamyon ===== */}
        {inside > 0 ? (
          <g opacity={inside}>
            <g transform={mvT}>
              <MuscleView t={t} {...mv} />
            </g>
            {/* nerede olduğumuz: köşede küçük genç, kolunda büyüteç */}
            <g opacity={sA * sm(t, enter + 0.3, enter + 0.7)}>
              <circle cx={930} cy={240} r={92} fill="#ffffff" stroke={INK} strokeWidth={7} />
              <g transform="translate(930,240) scale(0.42) translate(-930,-240)">
                <HeroAt uid="b4mini" x={930} y={600} s={0.62} t={t} pose={FLEX} expr="grin" />
              </g>
              <circle cx={944} cy={204} r={22} fill="none" stroke={Y} strokeWidth={6} />
              <text x={930} y={366} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={INK}>
                PAZI
              </text>
            </g>
            <Pill x={380} y={MV_TOP + rowY(1) * 0.86 - 250 * 0.86 - 70} text="YIRTIK" o={sA * sm(t, W(1, 4) - 0.1, W(1, 4) + 0.2) * (1 - sm(t, L(2) - 0.2, L(2)))} color="#ffffff" size={44} />

            <Road t={t} moving={truckMoving} />
            {/* kamyon (4: boş, 7: dolu) */}
            {Math.max(s4, s7) > 0.01 ? <Truck x={truckX} y={1405} full={t < L(7) - 0.1 ? 0 : 1 - unload} t={t} moving={truckMoving} /> : null}
            {/* 2: malzeme bekleniyor */}
            <g opacity={sA * sm(t, W(2, 6) - 0.1, W(2, 6) + 0.2)}>
              <path d="M90,1350 L330,1350" stroke={INK} strokeWidth={6} strokeDasharray="18 14" strokeDashoffset={-t * 40} opacity={0.5} />
              <Pill x={210} y={1240} text="MALZEME ?" o={1} color="#ffffff" size={44} />
            </g>
            {/* 4: boş kasa → TAMİR YOK */}
            <g opacity={s4}>
              <Pill x={250} y={1150} text="BOŞ!" o={sm(t, W(4, 1) - 0.1, W(4, 1) + 0.2)} color={RED} ink="#fff" size={48} />
              <Pill x={540} y={140} text="TAMİR YOK" o={sm(t, W(4, 6) - 0.1, W(4, 6) + 0.25)} color={RED} ink="#fff" size={56} />
            </g>
            {/* 7: dolu kasa → onarım → büyür */}
            <g opacity={s7}>
              <Pill x={250} y={1150} text="DOLU!" o={sm(t, W(7, 1) - 0.1, W(7, 1) + 0.2) * (1 - unload)} color={GREEN} ink="#fff" size={48} />
              <Pill x={540} y={140} text="KAS BÜYÜYOR" o={sm(t, W(7, 5) - 0.1, W(7, 5) + 0.25)} color={GREEN} ink="#fff" size={56} />
            </g>
            {/* tamir ekibi (yolun sağında) */}
            <g opacity={sm(t, L(2) + 0.05, L(2) + 0.4)}>
              <Crew x={700} y={1430} s={1.05} t={t} pose={crewPose} expr={crewExpr} />
              <Crew x={910} y={1430} s={1.05} t={t} pose={crewPose} expr={crewExpr} talk={chiefTalk} body="#ffe0b8" flip chief />
            </g>
          </g>
        ) : null}

        {/* ===== 3: kötü gün ===== */}
        {s3 > 0 ? (
          <g opacity={s3}>
            <DayPanel y={200} o={panelO(3, 0)} label="SABAH" mark="x" mp={markP(3, 2)}>
              <HeroAt uid="b4d1" x={330} y={735} s={0.58} t={t} pose={{ r: { el: [300, 540], wr: [262, 440] }, head: -6 }} expr="yawn" item={<Cup />} />
              <g transform="translate(560,420) scale(1.5) translate(-560,-420)"><EmptyPlate x={560} y={420} /></g>
              <Clock x={790} y={320} r={56} h={8} m={0} />
            </DayPanel>
            <DayPanel y={560} o={panelO(3, 3)} label="ÖĞLE" mark="x" mp={markP(3, 5)}>
              <HeroAt uid="b4d2" x={330} y={1095} s={0.58} t={t} pose={{ r: { el: [300, 560], wr: [262, 420] } }} expr="chew" />
              <g transform="translate(590,740) scale(1.6) translate(-590,-740)"><Pogaca x={590} y={740} /></g>
              <Txt x={590} y={850} size={48} fill={INK} sw={0}>
                SADECE 1
              </Txt>
            </DayPanel>
            <DayPanel y={920} o={panelO(3, 6)} label="GECE" night mark="x" mp={markP(3, 8)}>
              <Moon x={680} y={1010} r={40} />
              <HeroAt uid="b4d3" x={330} y={1455} s={0.58} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5 }} expr="yawn" item={<PhoneItem />} />
              <circle cx={300} cy={1080} r={60} fill="#9fd8ff" opacity={0.18} />
              <Clock x={560} y={1090} r={56} h={3} m={0} />
              <Txt x={760} y={1110} size={56} fill={Y} sw={0}>
                03:00
              </Txt>
            </DayPanel>
          </g>
        ) : null}

        {/* ===== 6: iyi gün ===== */}
        {s6 > 0 ? (
          <g opacity={s6}>
            <DayPanel y={200} o={panelO(6, 1)} label="SABAH" mark="v" mp={markP(6, 2)}>
              <HeroAt uid="b4g1" x={330} y={735} s={0.58} t={t} pose={{ r: { el: [310, 560], wr: [330, 470], hand: "thumb" } }} expr="smile" />
              <g transform="translate(560,420) scale(1.5) translate(-560,-420)"><Breakfast x={560} y={420} /></g>
              <Clock x={790} y={330} r={56} h={8} m={0} />
            </DayPanel>
            <DayPanel y={560} o={panelO(6, 3)} label="ÖĞLE" mark="v" mp={markP(6, 4)}>
              <HeroAt uid="b4g2" x={330} y={1095} s={0.58} t={t} pose={{ r: { el: [300, 560], wr: [262, 420] } }} expr="chew" />
              <g transform="translate(590,770) scale(1.6) translate(-590,-770)"><Lunch x={590} y={770} /></g>
            </DayPanel>
            <DayPanel y={920} o={panelO(6, 5)} label="GECE" night mark="v" mp={markP(6, 6)}>
              <Moon x={680} y={1010} r={40} />
              <HeroAt uid="b4g3" x={330} y={1455} s={0.58} t={t} pose={{ head: 10 }} expr="happy" />
              <Txt x={400} y={1010} size={48} fill="#ffffff" sw={0}>
                z z
              </Txt>
              <Clock x={560} y={1090} r={56} h={11} m={0} />
              <Txt x={760} y={1110} size={56} fill={Y} sw={0}>
                23:00
              </Txt>
            </DayPanel>
          </g>
        ) : null}

        {/* ===== 5 ve 8: ayna ===== */}
        {Math.max(s5, s8) > 0 ? (
          <g opacity={Math.max(s5, s8)}>
            {(() => {
              const after = s8 > s5;
              const same = W(5, 3);
              const big = after ? sm(t, L(8) + 0.2, W(8, 2)) : 0;
              const weeks = after ? 12 : Math.max(1, Math.min(8, 1 + Math.floor(interpolate(t, [L(5) + 0.1, W(5, 2)], [0, 7.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))));
              const sad = !after && t > same;
              return (
                <g>
                  <Mirror x={600} y={330} w={400} h={1050} uid="b4m">
                    <HeroAt uid="b4r" x={800} y={1430} s={0.95} t={t} pose={FLEX_MIRROR} expr={sad ? "ouch" : "grin"} />
                    <Bulge x={800} y={1430} s={0.95} side="l" k={big} />
                    <rect x={600} y={330} width={400} height={1050} fill="#bcd3e8" opacity={0.25} />
                  </Mirror>
                  <Pill x={280} y={360} text={`${weeks}. HAFTA`} o={1} color={Y} size={56} />
                  {!after ? (
                    <g>
                      <Pill x={800} y={250} text="HÂLÂ AYNI" o={sm(t, same, same + 0.3)} color={RED} ink="#fff" size={56} />
                      {(() => {
                        const p = sm(t, same - 0.15, same + 0.45);
                        const c: [number, number] = [800 - 120 * 0.95, 1430 - 500 * 0.95];
                        return p > 0 ? (
                          <ellipse cx={c[0]} cy={c[1]} rx={95} ry={115} fill="none" stroke={RED} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} transform={`rotate(-90 ${c[0]} ${c[1]})`} strokeLinecap="round" />
                        ) : null;
                      })()}
                    </g>
                  ) : (
                    <g>
                      <Pill x={800} y={250} text="FARK VAR" o={sm(t, W(8, 6) - 0.1, W(8, 6) + 0.2)} color={GREEN} ink="#fff" size={56} />
                    </g>
                  )}
                  <HeroAt uid="b4f" x={300} s={1.02} t={t} pose={sad ? { lx: 5, ly: 3, head: 3 } : FLEX} expr={sad ? "ouch" : after ? "laugh" : "grin"} />
                  <Bulge x={300} s={1.02} side="r" k={big} />
                </g>
              );
            })()}
          </g>
        ) : null}

        {/* ===== 9: gönder (sonra kanca karesi geri gelir) ===== */}
        {s9 > 0 ? (
          <g opacity={s9}>
            <HeroAt uid="b49" x={480} s={0.86} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="grin" item={<PhoneItem />} />
            <g opacity={sm(t, L(9) + 0.15, L(9) + 0.45)}>
              <Txt x={540} y={420} size={92} fill="#ffffff" sw={16}>
                BUNU ONA
              </Txt>
              <Txt x={540} y={540} size={110} fill={Y} sw={16}>
                GÖNDER
              </Txt>
              <g transform={`translate(880,${640 + Math.sin(t * 4) * 10})`}>
                <path d="M0,-50 L0,30 M-34,0 L0,36 L34,0" fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0,-50 L0,30 M-34,0 L0,36 L34,0" fill="none" stroke={Y} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>
          </g>
        ) : null}

        <rect width={1080} height={1920} fill="url(#b4-vig)" />
      </svg>

      <Captions t={t} tl={tl} />
      {data ? <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} /> : null}
      {FX.map((f, i) => (
        <Sequence key={`fx${i}`} from={Math.max(0, Math.round(f.at * fps))} durationInFrames={f.dur ? Math.round(f.dur * fps) : undefined} layout="none">
          <Audio
            src={staticFile(`sfx/${f.id}.mp3`)}
            startFrom={Math.round((f.lead ?? 0) * fps)}
            volume={(k) => (f.dur && f.fade ? f.v * interpolate(k / fps, [0, f.fin ?? 0.001, f.dur - f.fade, f.dur], [f.fin ? 0 : 1, 1, 1, 0], { extrapolateRight: "clamp" }) : f.v)}
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

