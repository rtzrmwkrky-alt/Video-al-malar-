/**
 * "Ekmeği bırakırsan zayıflarsın" (~30 sn) — kalem çizimi salon, tek kahraman (siyah saçlı genç) hiç konuşmaz;
 * hikâyeyi arkadan anlatıcı (Manitam) anlatır. Tartıda −2 kg → üstünden süzülen damlalar kovaya dolar (giden yağ değil, su)
 * → kart: 1 gr depo karbonhidrat ≈ 3 gr su → ekmeğe dönünce su kovadan geri gelir, tartı +2 → Stanford (JAMA 2018, 609 kişi,
 * 1 yıl): karbonhidratı azaltan da yağı azaltan da neredeyse aynı kiloyu verdi → sofrada 1-2 dilim tam buğday, tabağı ekmekle
 * silmek yok → arkadaşına gönder → döngü (son kare = ilk kare). Metin `icerik/ekmek-birak.seslendirme.txt`.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { LINE, type SketchPose, SketchDefs, SketchPerson, SKETCH_CAST } from "../sketch/SketchPerson";
import { SketchRoom, SofaFront } from "../sketch/SketchRoom";

loadFonts();

export const PAPER = "#fbf3e6";
export const WATER = "#5aa8d8";
export const RED = "#d9453b";
export const GREEN = "#3f9a4c";
export const Y = "#ffd45a";

export const EB_LINES: Line[] = [
  { text: "Ekmeği bırakırsan zayıflarsın… derler.", hl: ["zayıflarsın…"], hold: 0.2 },
  { text: "Bir hafta dene, tartıda iki kilo gider. Ama giden yağ değil… su.", hl: ["iki", "kilo", "su."], hold: 0.2 },
  { text: "Vücut, depoladığı her gram karbonhidratı üç gram suyla tutar. Ekmeği kesince depo boşalır, su da gider.", hl: ["üç", "gram", "suyla"], hold: 0.1 },
  { text: "Ekmeğe dönünce mi? Su geri gelir, kilo da.", hl: ["geri", "kilo"], hold: 0.1 },
  { text: "Stanford'da 609 kişi bir yıl takip edildi. Ekmeği, makarnayı azaltan da… yağı azaltan da aynı kiloyu verdi.", hl: ["609", "aynı", "kiloyu"], hold: 0.1 },
  { text: "Yani sorun ekmek değil. Günde bir iki dilim, tam buğday olsun. Tabağı ekmekle silmek yok.", hl: ["değil.", "tam", "buğday"], hold: 0.1 },
  { text: "Ekmeği bırakan arkadaşına gönder.", hl: ["arkadaşına"], hold: 0.4 },
];

export const EB_TAIL = 0.6;
export const EB_TL = timeline(EB_LINES, EB_TAIL);

export type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

export const voiceTimeline = (data: VoiceoverData, lines: Line[] = EB_LINES): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of lines) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + EB_TAIL;
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

export const wordTime = (tl: TL, line: number, k: number, lines: Line[] = EB_LINES) => {
  if (tl.wordAt) return tl.wordAt(line, k);
  const n = words(lines[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (lines[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

/** `end`: altyazının sönüp bittiği an (varsayılan: video sonu) */
export const Captions: React.FC<{ t: number; tl: TL; lines?: Line[]; end?: number }> = ({ t, tl, lines = EB_LINES, end }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const e = end ?? tl.total - 0.15;
  const out = 1 - sm(t, e - 0.3, e);
  if (out <= 0) return null;
  const line = lines[i];
  const ws = words(line);
  const chunks: number[] = [];
  for (let k = 0; k < ws.length; ) {
    chunks.push(k);
    k += ws.length - k === 4 ? 2 : Math.min(3, ws.length - k);
  }
  let c = 0;
  while (c + 1 < chunks.length && t >= wordTime(tl, i, chunks[c + 1], lines) - 0.04) c++;
  const from = chunks[c];
  const to = c + 1 < chunks.length ? chunks[c + 1] : ws.length;
  const hl = (line.hl ?? []).map(norm);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1600, textAlign: "center", opacity: out }}>
      {ws.slice(from, to).map((w, k) => {
        const wt = tl.wordAt ? wordTime(tl, i, from + k, lines) - 0.06 : wordTime(tl, i, from, lines) + k * 0.05;
        const p = sm(t, wt, wt + 0.16);
        return (
          <span
            key={`${c}-${k}`}
            style={{
              display: "inline-block",
              margin: "0 12px",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 84,
              letterSpacing: -1.5,
              color: hl.includes(norm(w)) ? Y : "#ffffff",
              WebkitTextStroke: `14px ${LINE}`,
              paintOrder: "stroke",
              textShadow: "0 7px 0 rgba(59,43,34,0.25)",
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

// ------------------------------------------------------------ çizim parçaları (kalem tarzı)

export const st = { stroke: LINE, strokeWidth: 3.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** banyo tartısı; üstünde rakam penceresi */
export const Scale: React.FC<{ x: number; y: number; kg: number }> = ({ x, y, kg }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={44} rx={190} ry={16} fill="#5a3a26" opacity={0.13} />
    <path d="M-170,0 Q-176,30 -150,40 L150,40 Q176,30 170,0 Z" fill="#cfd3d6" {...st} />
    <path d="M-160,-18 L160,-18 Q174,-16 170,0 L-170,0 Q-174,-16 -160,-18 Z" fill="#eef0f1" {...st} />
    <rect x={-58} y={4} width={116} height={30} rx={6} fill="#2e3a36" {...st} strokeWidth={2.6} />
    <text x={0} y={28} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill="#9cf0b8">
      {kg.toFixed(1).replace(".", ",")}
    </text>
  </g>
);

/** tartının büyük okunuşu (izleyici rakamı rahat okusun) */
export const Readout: React.FC<{ x: number; y: number; kg: number; o: number; delta: number }> = ({ x, y, kg, o, delta }) => {
  if (o <= 0) return null;
  return (
    <g opacity={o} transform={`translate(${x},${y})`}>
      <path d="M-40,62 L-120,170" fill="none" stroke={LINE} strokeWidth={2.4} strokeDasharray="6 8" opacity={0.6} />
      <rect x={-150} y={-62} width={300} height={124} rx={22} fill="#2e3a36" {...st} />
      <text x={0} y={22} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={74} fill="#9cf0b8">
        {kg.toFixed(1).replace(".", ",")}
      </text>
      <text x={120} y={44} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={22} fill="#9cf0b8" opacity={0.7}>
        kg
      </text>
      {Math.abs(delta) > 0.05 ? (
        <g transform="translate(0,-100)">
          <rect x={-96} y={-34} width={192} height={64} rx={32} fill={delta < 0 ? GREEN : RED} {...st} strokeWidth={2.6} />
          <text x={0} y={12} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill="#fff">
            {delta < 0 ? "−" : "+"}
            {Math.abs(delta).toFixed(1).replace(".", ",")} KG
          </text>
        </g>
      ) : null}
    </g>
  );
};

export const Drop: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) => (
  <path
    transform={`translate(${x},${y}) scale(${s})`}
    d="M0,-22 Q14,-2 12,8 Q10,20 0,20 Q-10,20 -12,8 Q-14,-2 0,-22 Z"
    fill={WATER}
    stroke={LINE}
    strokeWidth={2.4}
    opacity={o}
  />
);

/** kova; level 0-1 */
export const Bucket: React.FC<{ x: number; y: number; level: number; o: number }> = ({ x, y, level, o }) => {
  if (o <= 0) return null;
  const h = 150;
  const top = y - h;
  const wy = y - 12 - (h - 30) * level;
  const half = (yy: number) => 78 - ((y - yy) / h) * -18 - 18; // tabana doğru daralır
  return (
    <g opacity={o}>
      <ellipse cx={x} cy={y + 6} rx={92} ry={12} fill="#5a3a26" opacity={0.13} />
      <path d={`M${x - 96},${top} L${x - 72},${y} L${x + 72},${y} L${x + 96},${top} Z`} fill="#e6e1d8" {...st} />
      {level > 0.01 ? (
        <path d={`M${x - half(wy) - 6},${wy} L${x - 72},${y} L${x + 72},${y} L${x + half(wy) + 6},${wy} Z`} fill={WATER} opacity={0.85} />
      ) : null}
      {level > 0.01 ? <ellipse cx={x} cy={wy} rx={half(wy) + 6} ry={9} fill="#8fcbec" stroke={LINE} strokeWidth={2} /> : null}
      <path d={`M${x - 96},${top} L${x - 72},${y} L${x + 72},${y} L${x + 96},${top}`} fill="none" {...st} />
      <ellipse cx={x} cy={top} rx={96} ry={14} fill="none" {...st} />
      <path d={`M${x - 92},${top} Q${x},${top - 120} ${x + 92},${top}`} fill="none" {...st} strokeWidth={4} />
      <text x={x} y={y - 46} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={LINE} opacity={0.85}>
        SU
      </text>
    </g>
  );
};

export const BreadSlice: React.FC<{ x: number; y: number; s?: number; dark?: boolean }> = ({ x, y, s = 1, dark }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-48,40 L-48,-24 Q-60,-66 -24,-74 Q0,-90 24,-74 Q60,-66 48,-24 L48,40 Z" fill={dark ? "#8a5a34" : "#c98a4a"} {...st} />
    <path d="M-38,32 L-38,-24 Q-46,-56 -18,-62 Q0,-74 18,-62 Q46,-56 38,-24 L38,32 Z" fill={dark ? "#c99a6a" : "#f6e3bf"} />
    {dark
      ? [[-18, -30], [10, -40], [-4, 0], [20, 10], [-20, 18]].map(([a, b], i) => <ellipse key={i} cx={a} cy={b} rx={4} ry={2.5} fill="#6e4528" />)
      : <path d="M-14,-40 l5,3 M12,-24 l3,5 M-8,6 l6,2" stroke="#c9a46e" strokeWidth={3} strokeLinecap="round" />}
  </g>
);

export const Cross: React.FC<{ x: number; y: number; r: number; o: number }> = ({ x, y, r, o }) =>
  o <= 0 ? null : (
    <g opacity={o} stroke={RED} strokeWidth={r * 0.22} strokeLinecap="round">
      <path d={`M${x - r},${y - r} L${x - r + 2 * r * Math.min(1, o * 1.6)},${y - r + 2 * r * Math.min(1, o * 1.6)}`} />
      {o > 0.5 ? <path d={`M${x + r},${y - r} L${x + r - 2 * r * Math.min(1, (o - 0.5) * 2)},${y - r + 2 * r * Math.min(1, (o - 0.5) * 2)}`} /> : null}
    </g>
  );

export const Check: React.FC<{ x: number; y: number; r: number; o: number }> = ({ x, y, r, o }) =>
  o <= 0 ? null : (
    <path d={`M${x - r},${y} L${x - r * 0.3},${y + r * 0.7} L${x + r},${y - r * 0.7}`} fill="none" stroke={GREEN} strokeWidth={r * 0.24} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
  );

/** el yazısı gibi kâğıt kart */
export const Card: React.FC<{ x: number; y: number; w: number; h: number; o: number; tilt?: number; children?: React.ReactNode }> = ({ x, y, w, h, o, tilt = -1.2, children }) => {
  if (o <= 0) return null;
  return (
    <g opacity={o} transform={`translate(${x},${y + (1 - o) * 14}) rotate(${tilt})`}>
      <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} rx={20} fill="#5a3a26" opacity={0.12} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={20} fill={PAPER} {...st} />
      {children}
    </g>
  );
};

export const Txt: React.FC<{ x: number; y: number; size: number; children: React.ReactNode; fill?: string; w?: number; o?: number }> = ({ x, y, size, children, fill = LINE, w = 800, o = 1 }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={SANS} fontWeight={w} fontSize={size} fill={fill} opacity={o} letterSpacing={-1}>
    {children}
  </text>
);

export const Pill: React.FC<{ x: number; y: number; text: string; o: number; bg: string; fg?: string; size?: number }> = ({ x, y, text, o, bg, fg = "#fff", size = 44 }) => {
  if (o <= 0) return null;
  const w = text.length * size * 0.6 + 56;
  return (
    <g opacity={o} transform={`translate(0,${(1 - o) * 10})`}>
      <rect x={x - w / 2} y={y - size * 0.82} width={w} height={size * 1.64} rx={size * 0.82} fill={bg} {...st} strokeWidth={3} />
      <text x={x} y={y + size * 0.35} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} fill={fg}>
        {text}
      </text>
    </g>
  );
};

export const OilBottle: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-10,-70 L10,-70 L10,-50 Q30,-30 30,0 L30,50 Q30,60 20,60 L-20,60 Q-30,60 -30,50 L-30,0 Q-30,-30 -10,-50 Z" fill="#f2d24a" {...st} />
    <rect x={-12} y={-84} width={24} height={16} rx={4} fill={GREEN} {...st} strokeWidth={2.6} />
    <rect x={-22} y={0} width={44} height={34} rx={6} fill={PAPER} {...st} strokeWidth={2.4} />
  </g>
);

export const Plate: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={10} rx={150} ry={46} fill="#5a3a26" opacity={0.12} />
    <ellipse cx={0} cy={0} rx={150} ry={46} fill="#fbfbf7" {...st} />
    <ellipse cx={0} cy={0} rx={110} ry={32} fill="none" stroke={LINE} strokeWidth={2} opacity={0.4} />
    {/* tavuk, pilav değil: sebze + et + salata */}
    <ellipse cx={-40} cy={-6} rx={44} ry={20} fill="#a8653a" {...st} strokeWidth={2.6} />
    {[[30, -10], [52, 2], [36, 12], [62, -14]].map(([a, b], i) => (
      <circle key={i} cx={a} cy={b} r={12} fill={i % 2 ? "#6bb36a" : "#d9534f"} {...st} strokeWidth={2.2} />
    ))}
    <path d="M-4,10 q10,-16 22,-4 q8,-10 18,0" fill="none" stroke="#5f8f4a" strokeWidth={6} strokeLinecap="round" />
  </g>
);

const Table: React.FC<{ y: number }> = ({ y }) => (
  <g>
    <path d={`M200,${y} L880,${y} L920,${y + 60} L160,${y + 60} Z`} fill="#c99a6a" {...st} />
    <path d={`M160,${y + 60} L920,${y + 60} L920,${y + 86} L160,${y + 86} Z`} fill="#8a5f42" {...st} />
    {[200, 880].map((x) => (
      <path key={x} d={`M${x - 14},${y + 86} L${x - 10},${y + 300} L${x + 14},${y + 300} L${x + 18},${y + 86} Z`} fill="#7a5640" {...st} />
    ))}
  </g>
);

// ------------------------------------------------------------ poz harmanı

export type Key = { at: number; pose: SketchPose };
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const poseAt = (t: number, keys: Key[], blend = 0.35): SketchPose => {
  let i = 0;
  while (i + 1 < keys.length && t >= keys[i + 1].at) i++;
  const cur = keys[i].pose;
  const prev = i > 0 ? keys[i - 1].pose : cur;
  const k = i > 0 ? sm(t, keys[i].at, keys[i].at + blend) : 1;
  const arm = (p?: { a: number; e: number }, c?: { a: number; e: number }) => {
    const P = p ?? { a: 12, e: 6 };
    const C = c ?? { a: 12, e: 6 };
    return { a: mix(P.a, C.a, k), e: mix(P.e, C.e, k) };
  };
  return { ...cur, l: arm(prev.l, cur.l), r: arm(prev.r, cur.r), turn: mix(prev.turn ?? 0.3, cur.turn ?? 0.3, k) };
};

// ------------------------------------------------------------ kompozisyon

export type EkmekBirakProps = { audioName: string; data: VoiceoverData | null };

const HERO = SKETCH_CAST.siyah.look;
const HS = 1.3;
const HX = 540;
const FEET = 1460;

export const EkmekBirak: React.FC<EkmekBirakProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : EB_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  const loopIn = sm(t, T - 0.3, T - 0.03);
  const end = t > L(6) + 0.3;
  const li = Math.max(0, tl.idx(t));
  // her satırda yavaş yaklaşma (kare hiç durmasın); döngü anında 1'e döner
  const push = 1 + 0.05 * Math.min(1, Math.max(0, (t - L(li)) / Math.max(0.6, L(li + 1) - L(li)))) * (1 - loopIn);

  // sahne pencereleri
  const stats = win(t, L(4) - 0.05, L(5) + 0.05, 0.3); // Stanford kâğıdı
  const tableO = win(t, L(5) - 0.1, T + 1, 0.3) * (1 - loopIn);
  const scaleO = Math.max(1 - sm(t, L(5) - 0.2, L(5) + 0.1), loopIn);

  // tartı ve kova
  const kgDrop = sm(t, W(1, 3), W(1, 6) + 0.2);
  const kgBack = sm(t, W(3, 3), W(3, 7) + 0.2);
  const kg = end ? 72 : 72 - 2 * kgDrop + 2 * kgBack;
  const delta = end ? 0 : -2 * kgDrop + 2 * kgBack + (kgBack > 0.98 ? 0 : 0);
  const drainA = W(1, 9);
  const level = end ? 0 : sm(t, drainA, drainA + 1.3) - sm(t, W(3, 3), W(3, 6) + 0.5);
  const bucketO = Math.max(0, win(t, drainA - 0.4, L(4) + 0.05, 0.3));
  const readO = end ? loopIn : Math.max(win(t, -1, L(4), 0.3), loopIn);

  // damlalar: süzülme (L1) ve geri dönüş (L3)
  const drops: React.ReactNode[] = [];
  const N = 9;
  const bodyPts: [number, number][] = [[470, 820], [610, 860], [520, 960], [590, 1010], [480, 1080], [600, 1120], [540, 900], [500, 1180], [585, 1220]];
  const bx = 250;
  const by = FEET - 140;
  const flow = (a: number, b: number, dir: 1 | -1, key: string) => {
    if (t < a || t > b + 0.6) return;
    for (let i = 0; i < N; i++) {
      const ph = ((t - a) * 1.4 + i / N) % 1;
      if (t - a < (i / N) / 1.4) continue;
      if (t > b && ph > ((b + 0.6 - t) / 0.6)) continue;
      const [sx, sy] = bodyPts[i];
      const u = dir === 1 ? ph : 1 - ph;
      const x = mix(sx, bx, u);
      const y = mix(sy, by, u) - Math.sin(u * Math.PI) * 120;
      drops.push(<Drop key={`${key}${i}`} x={x} y={y} s={0.9 + 0.3 * Math.sin(i)} o={Math.min(1, ph * 6) * Math.min(1, (1 - ph) * 6)} />);
    }
  };
  if (!end) {
    flow(drainA, drainA + 1.4, 1, "d");
    flow(W(3, 3), W(3, 6) + 0.3, -1, "u");
  }

  // kahramanın pozları
  const BREAD: SketchPose = { r: { a: 30, e: -100 }, l: { a: 14, e: 6 }, itemR: "bread", turn: 0.25 };
  const keys: Key[] = [
    { at: -1, pose: BREAD },
    { at: W(1, 0), pose: { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.2 } },
    { at: W(1, 6), pose: { r: { a: 150, e: -20 }, l: { a: 150, e: -20 }, turn: 0.1 } },
    { at: W(1, 9), pose: { r: { a: 20, e: -20 }, l: { a: 30, e: -60 }, turn: -0.4 } },
    { at: L(2), pose: { r: { a: 14, e: 6 }, l: { a: 26, e: -120 }, turn: 0.3 } },
    { at: L(3), pose: { r: { a: 40, e: -150 }, l: { a: 14, e: 6 }, itemR: "bread", turn: 0.2 } },
    { at: L(5), pose: { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.2 } },
    { at: L(6), pose: { r: { a: 30, e: -110 }, l: { a: 14, e: 6 }, itemR: "phone", turn: 0.3 } },
  ];
  const pose = end && loopIn > 0.5 ? BREAD : poseAt(t, keys);
  const chew = t > L(3) && t < L(4) ? 0.35 + 0.35 * Math.sin(t * 16) : 0;
  const expr =
    end && loopIn > 0.5
      ? "think"
      : t < W(0, 3)
        ? "think"
        : t < W(1, 6)
          ? "smile"
          : t < W(1, 9)
            ? "grin"
            : t < L(2)
              ? "surprise"
              : t < L(3)
                ? "think"
                : t < L(4)
                  ? "worry"
                  : t < L(6)
                    ? "smile"
                    : "grin";

  // kancadaki kart (döngüde geri gelir)
  const hookO = end ? loopIn : win(t, -1, W(1, 0), 0.25);

  // L2 kartı: 1 gr karbonhidrat ≈ 3 gr su
  const c2 = win(t, L(2) - 0.05, L(3) + 0.05, 0.3);
  const c2drops = [W(2, 5), W(2, 5) + 0.15, W(2, 5) + 0.3];
  const empty = sm(t, W(2, 12), W(2, 12) + 0.8);

  // L4 sayaçlar
  const months = Math.max(1, Math.round(1 + 11 * sm(t, W(4, 3), W(4, 13))));
  const lossA = 6.0 * sm(t, W(4, 7), W(4, 15));
  const lossB = 5.3 * sm(t, W(4, 11), W(4, 15));
  const same = sm(t, W(4, 14) - 0.1, W(4, 14) + 0.25);

  // L5 sofra
  const tick1 = sm(t, W(5, 5) - 0.05, W(5, 5) + 0.3);
  const tick2 = sm(t, W(5, 8) - 0.05, W(5, 8) + 0.3);
  const wipe = win(t, W(5, 11) - 0.1, T + 1, 0.2);
  const wipeX = Math.sin(t * 9) * 60;
  const noWipe = sm(t, W(5, 13) - 0.1, W(5, 13) + 0.35);

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.24, lead: 0.05 },
    { at: W(1, 4), id: 2568, v: 0.14 }, // tartı
    { at: W(1, 11) - 0.05, id: 1120, v: 0.18, lead: 0.1 }, // su
    { at: W(3, 5), id: 2568, v: 0.14 }, // tartı geri
    { at: L(4) + 0.05, id: 1143, v: 0.2, lead: 0.14, dur: 1.4, fade: 0.7 }, // araştırma
    { at: W(4, 14), id: 1120, v: 0.2, lead: 0.1 }, // aynı
    { at: W(5, 13), id: 2568, v: 0.14 }, // ✕
    { at: W(6, 3), id: 2568, v: 0.16 }, // gönder
  ];

  const heroT = `translate(${HX - 200 * HS},${FEET - 800 * HS}) scale(${HS})`;

  return (
    <AbsoluteFill lang="tr" style={{ background: "#f4dcc6", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <SketchDefs />
        <g transform={`translate(540,900) scale(${push}) translate(-540,-900)`}>
          <g filter="url(#pencil)">
            <SketchRoom t={t} />
            <SofaFront />
            {scaleO > 0 ? (
              <g opacity={scaleO}>
                <Scale x={HX} y={FEET + 4} kg={kg} />
              </g>
            ) : null}
            <Bucket x={bx} y={FEET + 30} level={level} o={bucketO} />
            <g transform={heroT}>
              <SketchPerson t={t} seed={1.3} look={HERO} pose={pose} expr={expr} talk={chew} />
            </g>
            {drops}
            {tableO > 0 ? (
              <g opacity={tableO}>
                <Table y={1290} />
                <Plate x={500} y={1320} />
                <BreadSlice x={760} y={1310} s={0.62} dark />
                <BreadSlice x={830} y={1318} s={0.62} dark />
              </g>
            ) : null}
          </g>

          <Readout x={850} y={1150} kg={kg} o={readO * (1 - stats)} delta={delta} />

          {/* ===== 0: kanca kartı ===== */}
          <Card x={540} y={300} w={900} h={250} o={hookO}>
            <Txt x={0} y={-22} size={74}>
              EKMEĞİ BIRAKIRSAN
            </Txt>
            <Txt x={0} y={70} size={92} fill={RED}>
              ZAYIFLARSIN?
            </Txt>
          </Card>

          {/* ===== 1: yağ değil, su ===== */}
          <Pill x={250} y={250} text="7 GÜN" o={win(t, W(1, 0), L(2), 0.25)} bg="#4f8fd0" size={52} />
          <Card x={600} y={300} w={640} h={170} o={win(t, W(1, 8) - 0.1, L(2) + 0.05, 0.25)} tilt={1}>
            <Txt x={0} y={22} size={62}>
              <tspan>YAĞ DEĞİL… </tspan>
              <tspan fill={WATER}>SU</tspan>
            </Txt>
          </Card>

          {/* ===== 2: 1 gr karbonhidrat ≈ 3 gr su ===== */}
          <Card x={540} y={300} w={920} h={390} o={c2}>
            <g transform="translate(-250,-50)">
              <BreadSlice x={0} y={0} s={1.0} />
              <Cross x={0} y={-10} r={70} o={sm(t, W(2, 9) - 0.05, W(2, 9) + 0.4)} />
              <Txt x={0} y={104} size={44}>
                1 gr karbonhidrat
              </Txt>
            </g>
            <Txt x={-30} y={-30} size={110} o={sm(t, W(2, 5) - 0.2, W(2, 5))}>
              +
            </Txt>
            <g transform="translate(230,-50)">
              {c2drops.map((at, i) => {
                const o = sm(t, at - 0.1, at + 0.15) * (1 - empty);
                return <Drop key={i} x={-80 + i * 80} y={-10 + empty * 260} s={2.2} o={o} />;
              })}
              <Txt x={0} y={104} size={44} fill={WATER} o={sm(t, W(2, 5), W(2, 7))}>
                ≈ 3 gr su
              </Txt>
            </g>
            <Txt x={0} y={164} size={40} w={700} o={sm(t, W(2, 9), W(2, 11))}>
              Depo boşalınca su da gider.
            </Txt>
          </Card>

          {/* ===== 3: ekmeğe dönünce ===== */}
          <Card x={600} y={300} w={620} h={170} o={win(t, W(3, 3) - 0.1, L(4), 0.25)} tilt={1.2}>
            <Txt x={0} y={22} size={58} fill={RED}>
              SU GERİ GELDİ
            </Txt>
          </Card>

          {/* ===== 4: Stanford ===== */}
          {stats > 0 ? (
            <g opacity={stats}>
              <rect width={1080} height={1920} fill="#f6ead9" />
              <g filter="url(#pencil)">
                <rect x={0} y={0} width={1080} height={1920} fill="none" />
                {[0, 1].map((side) => {
                  const cx = side ? 790 : 290;
                  const look = side ? SKETCH_CAST.sari.look : HERO;
                  return (
                    <g key={side}>
                      <g transform={`translate(${cx - 200 * 0.78},${1300 - 800 * 0.78}) scale(0.78)`}>
                        <SketchPerson t={t} seed={side ? 0 : 1.3} look={look} pose={{ turn: side ? -0.3 : 0.3, l: { a: 14, e: 6 }, r: { a: 14, e: 6 } }} expr={same > 0.5 ? "grin" : "smile"} />
                      </g>
                      <ellipse cx={cx} cy={1306} rx={140} ry={14} fill="#5a3a26" opacity={0.1} />
                    </g>
                  );
                })}
                <path d="M540,640 L540,1320" stroke={LINE} strokeWidth={3} strokeDasharray="10 14" opacity={0.4} />
              </g>
              <Txt x={540} y={250} size={70}>
                STANFORD ARAŞTIRMASI
              </Txt>
              <Txt x={540} y={330} size={46} w={700} o={sm(t, W(4, 1) - 0.1, W(4, 1) + 0.2)}>
                609 kişi · 1 yıl takip
              </Txt>
              <Pill x={540} y={440} text={`${months}. AY`} o={sm(t, W(4, 3) - 0.1, W(4, 3) + 0.2)} bg="#4f8fd0" size={50} />
              {/* sol: karbonhidrat azaltan */}
              <g opacity={sm(t, W(4, 7) - 0.1, W(4, 7) + 0.25)}>
                <g filter="url(#pencil)">
                  <BreadSlice x={290} y={520} s={0.8} />
                  <Cross x={290} y={512} r={52} o={sm(t, W(4, 7), W(4, 8))} />
                </g>
                <Txt x={290} y={640} size={38}>
                  EKMEK, MAKARNA ↓
                </Txt>
                <Txt x={290} y={1420} size={84} fill={GREEN}>
                  −{lossA.toFixed(1).replace(".", ",")} kg
                </Txt>
              </g>
              {/* sağ: yağ azaltan */}
              <g opacity={sm(t, W(4, 11) - 0.1, W(4, 11) + 0.25)}>
                <g filter="url(#pencil)">
                  <OilBottle x={790} y={520} s={1.0} />
                  <Cross x={790} y={512} r={52} o={sm(t, W(4, 11), W(4, 12))} />
                </g>
                <Txt x={790} y={640} size={38}>
                  YAĞ ↓
                </Txt>
                <Txt x={790} y={1420} size={84} fill={GREEN}>
                  −{lossB.toFixed(1).replace(".", ",")} kg
                </Txt>
              </g>
              <Txt x={540} y={1430} size={110} o={same}>
                ≈
              </Txt>
              <Pill x={540} y={1530} text="NEREDEYSE AYNI" o={same} bg={LINE} size={46} />
              <Txt x={540} y={1880} size={24} w={600} o={0.75}>
                Kaynak: Gardner ve ark., JAMA 2018 (DIETFITS)
              </Txt>
            </g>
          ) : null}

          {/* ===== 5: sofra ===== */}
          <Card x={540} y={290} w={760} h={160} o={win(t, L(5), L(6), 0.25)}>
            <Txt x={0} y={22} size={64}>
              SORUN EKMEK DEĞİL
            </Txt>
          </Card>
          <g opacity={win(t, L(5), L(6) + 0.1, 0.25)}>
            <g opacity={tick1}>
              <Pill x={300} y={480} text="1-2 DİLİM" o={1} bg={GREEN} size={44} />
              <Check x={482} y={474} r={22} o={1} />
            </g>
            <g opacity={tick2}>
              <Pill x={780} y={480} text="TAM BUĞDAY" o={1} bg="#8a5f42" size={44} />
              <Check x={978} y={474} r={22} o={1} />
            </g>
          </g>
          {wipe > 0 && t < L(6) + 0.1 ? (
            <g opacity={wipe * (1 - sm(t, L(6) - 0.1, L(6) + 0.1))}>
              <g filter="url(#pencil)">
                <BreadSlice x={500 + wipeX} y={1300} s={0.5} />
              </g>
              <Cross x={500} y={1300} r={90} o={noWipe} />
              <Pill x={540} y={1470} text="TABAĞI EKMEKLE SİLMEK YOK" o={noWipe} bg={RED} size={40} />
            </g>
          ) : null}

          {/* ===== 6: gönder ===== */}
          <Card x={540} y={300} w={900} h={210} o={win(t, L(6), T - 0.25, 0.25)}>
            <Txt x={0} y={-12} size={56}>
              EKMEĞİ BIRAKAN
            </Txt>
            <Txt x={0} y={66} size={64} fill={RED}>
              ARKADAŞINA GÖNDER ➤
            </Txt>
          </Card>
        </g>
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
    </AbsoluteFill>
  );
};
