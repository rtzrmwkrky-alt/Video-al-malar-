/**
 * "Kasım neden büyümüyor?" (~28 sn) — kullanıcının kurgusu: bir adam (SEN, kırmızı) sürekli spor yapıyor ama gelişmiyor; yanındaki
 * (O, mavi) aynı antrenmanla büyüyor ve SEN buna salonda şahit oluyor → koluna bakıp "?" → iki kolun içi alt alta: O'na protein akar,
 * yırtıklar onarılır, lifler kalınlaşır; SEN'e neredeyse hiçbir şey gelmez, yırtıklar açık kalır → aynı antrenman, fark tabakta →
 * "Kas salonda yorulur… sofrada büyür." → gönder → döngü (son kare = ilk kare).
 * Metin `icerik/kas-neden.seslendirme.txt` (kelime sayıları satır satır aynı olmalı).
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import { CurlyGuy, type CurlyExpr, type CurlyLook, type CurlyPose } from "../avatar/CurlyGuy";
import { Dumbbell, PhoneItem } from "./GeceYemek";
import { DB, GymSign, Particle, Plates, Rack, SPORCU_LOOK, Sweat } from "./BeslenmeSpor";
import { EmptyPlate, Pogaca } from "./BeslenmeSpor3";
import { Lunch } from "./BeslenmeSpor4";
import { Chip, FLEX, Tape, curl } from "./BeslenmeSpor5";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const BLUE = "#3d8ef0";
const GREEN = "#2fbf62";
const FLOOR = 1400;

export const KN_LINES: Line[] = [
  { text: "Aynı salon, aynı ağırlık… ama o büyüyor, sen büyümüyorsun.", hl: ["o", "büyüyor,", "büyümüyorsun."], hold: 0.3 },
  { text: "Haftalar geçiyor. Yanındakiler değişiyor, sen hâlâ aynısın.", hl: ["değişiyor,", "aynısın."], hold: 0.4 },
  { text: "Ve kendine soruyorsun: benim kasım neden büyümüyor?", hl: ["neden", "büyümüyor?"], hold: 0.5 },
  { text: "Gel, iki kolun içine bakalım.", hl: ["içine"], hold: 0.2 },
  { text: "Onunkine sürekli protein geliyor; yırtıklar onarılıyor, lifler kalınlaşıyor.", hl: ["protein", "kalınlaşıyor."], hold: 0.3 },
  { text: "Seninkine ise neredeyse hiçbir şey gelmiyor.", hl: ["hiçbir", "gelmiyor."], hold: 0.5 },
  { text: "Antrenman aynı… fark tabakta.", hl: ["fark", "tabakta."], hold: 0.5 },
  { text: "Kas salonda yorulur… sofrada büyür.", hl: ["sofrada", "büyür."], hold: 0.5 },
  { text: "Bunu hâlâ aynı kolla gezen o arkadaşına gönder.", hl: ["gönder."], hold: 0.6 },
];

export const KN_TAIL = 0.6;
export const KN_TL = timeline(KN_LINES, KN_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of KN_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + KN_TAIL;
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
  const n = words(KN_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (KN_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const out = 1 - sm(t, tl.total - 0.45, tl.total - 0.15);
  if (out <= 0) return null;
  const line = KN_LINES[i];
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
    <div style={{ position: "absolute", left: 40, right: 40, top: 1580, textAlign: "center", opacity: out }}>
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
              fontSize: 88,
              letterSpacing: -1.5,
              color: hl.includes(norm(w)) ? Y : "#ffffff",
              WebkitTextStroke: `14px ${INK}`,
              paintOrder: "stroke",
              textShadow: "0 8px 0 rgba(27,20,32,0.3)",
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

// ------------------------------------------------------------ karakterler

/** salondaki diğer adam: siyah kıvırcık saç, mavi eşofman */
const RIVAL_LOOK: CurlyLook = {
  ...SPORCU_LOOK,
  hairColor: ["#3a3a3a", "#1e1e1e", "#0c0c0c"],
  jacket: ["#6db5ff", "#3d8ef0", "#2662b8"],
  shoeLine: "#3d8ef0",
};

const blinkAt = (t: number) => ((t % 3.5) / 3.5 > 0.96 ? 1 : 0);

const Guy: React.FC<{ uid: string; rival?: boolean; x: number; y?: number; s: number; t: number; pose?: CurlyPose; expr?: CurlyExpr; item?: React.ReactNode }> = ({
  uid,
  rival = false,
  x,
  y = FLOOR,
  s,
  t,
  pose,
  expr,
  item,
}) => (
  <g transform={`translate(${x},${y}) scale(${s}) translate(-200,-880)`}>
    <CurlyGuy id={uid} pose={pose} expr={expr} t={t} item={item} blink={blinkAt(t + x)} look={rival ? RIVAL_LOOK : SPORCU_LOOK} />
  </g>
);

/** kasılmış pazı: üst kol kalınlaşır (sağ kol, pazı kasma pozu) */
const Pump: React.FC<{ x: number; y?: number; s: number; k: number; rival?: boolean }> = ({ x, y = FLOOR, s, k, rival = false }) => {
  if (k <= 0.01) return null;
  const c = rival ? RIVAL_LOOK.jacket! : SPORCU_LOOK.jacket!;
  const w = 50 + 34 * k;
  return (
    <g transform={`translate(${x},${y}) scale(${s}) translate(-200,-880)`}>
      <path d="M262,358 L340,440" stroke={c[2]} strokeWidth={w + 6} strokeLinecap="round" />
      <path d="M262,358 L340,440" stroke={c[1]} strokeWidth={w} strokeLinecap="round" />
      <path d="M262,358 L340,440" stroke={c[0]} strokeWidth={w * 0.25} strokeLinecap="round" opacity={0.55} transform="translate(-6,-10)" />
    </g>
  );
};

const Ground: React.FC = () => (
  <g>
    <rect x={0} y={FLOOR} width={1080} height={520} fill="#2a2a3a" opacity={0.2} />
    <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} opacity={0.5} />
  </g>
);

/** büyük soru işareti */
const Question: React.FC<{ x: number; y: number; o: number; t: number }> = ({ x, y, o, t }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y + Math.sin(t * 3) * 6}) rotate(8)`}>
      <text x={0} y={0} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={220} fill={Y} stroke={INK} strokeWidth={14} paintOrder="stroke">
        ?
      </text>
    </g>
  );

// ------------------------------------------------------------ kolun içi paneli

const TEARS: [number, number][] = [
  [0.28, -0.3],
  [0.5, 0.35],
  [0.66, -0.25],
  [0.42, -0.6],
];

/** kolun içi: solda tabak, oradan kasa giden damar; kas lifleri, yırtıklar, onarım, kalınlaşma */
const MusclePanel: React.FC<{
  uid: string;
  y: number;
  o: number;
  dim: number;
  rival: boolean;
  dmg: number;
  supply: number;
  heal: number;
  grow: number;
  t: number;
}> = ({ uid, y, o, dim, rival, dmg, supply, heal, grow, t }) => {
  if (o <= 0) return null;
  const H = 440;
  const cy = y + H / 2 + 10;
  const mx0 = 360;
  const mx1 = 960;
  const mid = (mx0 + mx1) / 2;
  const h = 64 * (1 + 0.45 * grow);
  const muscle = `M${mx0},${cy} Q${mid},${cy - 2 * h} ${mx1},${cy} Q${mid},${cy + 2 * h} ${mx0},${cy} Z`;
  const src: [number, number] = [190, cy + 20];
  const color = rival ? BLUE : RED;
  return (
    <g opacity={o * (1 - 0.5 * dim)}>
      <defs>
        <clipPath id={`${uid}-c`}>
          <rect x={60} y={y} width={960} height={H} rx={40} />
        </clipPath>
        <linearGradient id={`${uid}-m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={interpolateColors(grow, [0, 1], ["#e5675c", "#f2705f"])} />
          <stop offset="0.5" stopColor={interpolateColors(grow, [0, 1], ["#c63b34", "#d9433a"])} />
          <stop offset="1" stopColor="#8e2420" />
        </linearGradient>
      </defs>
      <rect x={60} y={y} width={960} height={H} rx={40} fill="#fbe1d8" />
      <g clipPath={`url(#${uid}-c)`}>
        {/* damar: tabaktan kasa */}
        <path d={`M${src[0]},${src[1]} C300,${cy + 150} 600,${cy + 150} ${mx1 - 40},${cy + 120}`} fill="none" stroke="#c0392b" strokeWidth={16} strokeLinecap="round" opacity={0.25 + 0.6 * Math.min(1, supply * 1.5)} />
        {/* kas: tendonlar + iğ biçimli karın + lifler */}
        <ellipse cx={mx0 - 12} cy={cy} rx={50} ry={12} fill="#f5f2ea" />
        <ellipse cx={mx1 + 12} cy={cy} rx={50} ry={12} fill="#f5f2ea" />
        <path d={muscle} fill={`url(#${uid}-m)`} stroke="#7a1f1c" strokeWidth={5} />
        {[-0.7, -0.35, 0, 0.35, 0.7].map((f) => (
          <path key={f} d={`M${mx0 + 20},${cy} Q${mid},${cy + 2 * h * f} ${mx1 - 20},${cy}`} fill="none" stroke="#7a1f1c" strokeWidth={3} opacity={0.35} />
        ))}
        <path d={`M${mx0 + 60},${cy - h * 0.35} Q${mid},${cy - 1.6 * h} ${mx1 - 60},${cy - h * 0.35}`} fill="none" stroke="#ffb3a8" strokeWidth={8} opacity={0.5} strokeLinecap="round" />
        {/* yırtıklar */}
        {TEARS.map(([fx, fy], i) => {
          const a = Math.min(1, Math.max(0, dmg * TEARS.length - i));
          const hl = Math.min(1, Math.max(0, heal * TEARS.length - i));
          const x = mx0 + (mx1 - mx0) * fx;
          const ty = cy + fy * h;
          const open = a * (1 - hl);
          const zig = `M${x - 5},${ty - 28} L${x + 9},${ty - 10} L${x - 7},${ty + 5} L${x + 8},${ty + 20} L${x - 2},${ty + 32}`;
          return (
            <g key={i}>
              {hl > 0 ? <ellipse cx={x} cy={ty} rx={30} ry={22} fill={Y} opacity={0.6 * hl * (1 - grow * 0.6)} /> : null}
              {open > 0.01 ? (
                <g opacity={open}>
                  <circle cx={x} cy={ty} r={38 + 6 * Math.sin(t * 6 + i)} fill="#ffd6a0" opacity={0.25} />
                  <path d={zig} fill="none" stroke="#fffaf0" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={zig} fill="none" stroke="#5a1210" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
                </g>
              ) : null}
            </g>
          );
        })}
        {/* protein taneleri: tabaktan yırtıklara */}
        {supply > 0.01
          ? Array.from({ length: 10 }).map((_, k) => {
              if (k / 10 >= supply) return null;
              const [fx, fy] = TEARS[k % TEARS.length];
              const tx = mx0 + (mx1 - mx0) * fx;
              const ty = cy + fy * h;
              const u = (((t * 0.45 + k / 10) % 1) + 1) % 1;
              const cx = (src[0] + tx) / 2;
              const cyy = cy + 150;
              const px = (1 - u) * (1 - u) * src[0] + 2 * (1 - u) * u * cx + u * u * tx;
              const py = (1 - u) * (1 - u) * src[1] + 2 * (1 - u) * u * cyy + u * u * ty;
              return <Particle key={k} x={px} y={py} kind={0} o={Math.min(1, Math.sin(u * Math.PI) * 3)} rot={0} />;
            })
          : null}
      </g>
      <rect x={60} y={y} width={960} height={H} rx={40} fill="none" stroke={INK} strokeWidth={8} />
      {/* tabak (malzemenin geldiği yer) */}
      <circle cx={src[0]} cy={src[1] - 20} r={95} fill="#ffffff" stroke={INK} strokeWidth={6} />
      <g transform={`translate(${src[0]},${src[1] - 20}) scale(${rival ? 0.78 : 0.9})`}>{rival ? <Lunch x={0} y={0} /> : <Pogaca x={0} y={0} />}</g>
      {/* kimin kolu */}
      <Chip x={rival ? 250 : 270} y={y + 2} text={rival ? "ONUN KOLU" : "SENİN KOLUN"} o={1} bg={color} size={50} />
    </g>
  );
};

// ------------------------------------------------------------ ana kompozisyon

export type KasNedenBuyumuyorProps = { audioName: string; data: VoiceoverData | null };

export const KasNedenBuyumuyor: React.FC<KasNedenBuyumuyorProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : KN_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, 0.2);
  const loopIn = sm(t, T - 0.24, T - 0.03);
  const end = t > L(8);
  const tc = end ? t - T : t;
  const rep = 0.5 - 0.5 * Math.cos(tc * 4.2);

  // ===== 0-1: salon — ikisi yan yana; haftalar geçtikçe O büyür, SEN aynı
  const s01 = Math.max(scene(0, 2), loopIn);
  const weeks = end ? 1 : Math.max(1, Math.min(8, 1 + Math.floor(interpolate(t, [L(1), W(1, 4)], [0, 7.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))));
  const flex01 = !end && t > W(1, 3);
  const grow01 = end ? 0 : sm(t, W(1, 3), W(1, 5));
  // ===== 2: soru
  const s2 = scene(2, 3);
  const q = sm(t, W(2, 5) - 0.15, W(2, 5) + 0.2);
  // ===== 3-5: kolların içi
  const s35 = scene(3, 6);
  const dmg = sm(t, W(3, 3) - 0.1, W(3, 4) + 0.3);
  const supO = sm(t, W(4, 1), W(4, 2) + 0.3);
  const healO = sm(t, W(4, 4), W(4, 5) + 0.4);
  const growO = sm(t, W(4, 6), W(4, 7) + 0.5);
  const supS = sm(t, W(5, 0), W(5, 1)) * 0.12;
  const dimS = win(t, L(4), L(5) + 0.1, 0.25);
  const dimO = win(t, L(5), L(6) + 0.1, 0.25);
  // ===== 6: tabaklar
  const s6 = scene(6, 7);
  // ===== 7: replik
  const s7 = scene(7, 8);
  // ===== 8: gönder
  const s8 = win(t, L(8) - 0.02, T - 0.25, 0.18);

  const GYM: [string, string] = ["#5b6b8f", "#3f4b6c"];
  const INSIDE: [string, string] = ["#1b2a4e", "#0e1630"];
  const bgAt: [number, string, string][] = [
    [0, ...GYM],
    [L(3), ...INSIDE],
    [L(6), ...GYM],
    [L(7), ...INSIDE],
    [L(8), ...GYM],
  ];
  let bgTop = bgAt[0][1];
  let bgBot = bgAt[0][2];
  for (let k = 1; k < bgAt.length; k++) {
    bgTop = interpolateColors(t, [bgAt[k][0] - 0.12, bgAt[k][0] + 0.12], [bgTop, bgAt[k][1]]);
    bgBot = interpolateColors(t, [bgAt[k][0] - 0.12, bgAt[k][0] + 0.12], [bgBot, bgAt[k][2]]);
  }

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.28, lead: 0.05 }, // kanca
    { at: W(1, 4), id: 2568, v: 0.16 }, // ölçü
    { at: W(2, 5) - 0.05, id: 2299, v: 0.18, lead: 0.05 }, // ?
    { at: L(3) + 0.05, id: 1143, v: 0.22, lead: 0.14, dur: 1.4, fade: 0.7 }, // kolun içi
    { at: W(4, 7), id: 1120, v: 0.24, lead: 0.1 }, // O kalınlaştı
    { at: W(5, 5) - 0.05, id: 2299, v: 0.16, lead: 0.05 }, // SEN: gelmiyor
    { at: W(6, 2), id: 2568, v: 0.18 }, // fark tabakta
  ];
  const duck = (mt: number) => 1 - 0.35 * win(mt, L(5), L(6) + 0.3, 0.3);

  const Hook = (
    <>
      <text x={540} y={290} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={92} fill="#ffffff" stroke={INK} strokeWidth={16} paintOrder="stroke">
        AYNI ANTRENMAN
      </text>
      <text x={540} y={410} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={116} fill={Y} stroke={INK} strokeWidth={18} paintOrder="stroke">
        FARKLI SONUÇ?
      </text>
    </>
  );

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="kn-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="kn-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#kn-bg)" />

        {/* ===== 0-1: salon, ikisi yan yana ===== */}
        {s01 > 0 ? (
          <g opacity={s01}>
            <Ground />
            <Rack x={330} y={760} />
            <Plates x={540} />
            <g opacity={end ? loopIn : 1 - sm(t, L(1) - 0.15, L(1) + 0.2)}>{Hook}</g>
            <Chip x={540} y={330} text={`${weeks}. HAFTA`} o={end ? 0 : sm(t, L(1), L(1) + 0.3)} bg="#ffffff" fg={INK} size={56} />
            {/* SEN (solda) */}
            <Guy uid="kn-sen" x={250} s={0.88} t={t} pose={flex01 ? FLEX : curl(rep)} item={flex01 ? undefined : DB} expr={flex01 ? "ouch" : rep > 0.55 ? "ouch" : "neutral"} />
            {flex01 ? <Tape x={250} s={0.88} k={0} o={1} /> : null}
            <Sweat t={t} pts={[[190, 760], [300, 750]]} />
            {/* O (sağda) */}
            <Guy uid="kn-o" rival x={830} s={0.88} t={t} pose={flex01 ? FLEX : curl((rep + 0.15) % 1)} item={flex01 ? undefined : DB} expr={flex01 ? "laugh" : "neutral"} />
            {flex01 ? <Pump x={830} s={0.88} k={grow01} rival /> : null}
            {flex01 ? <Tape x={830} s={0.88} k={grow01} o={1} /> : null}
            <Chip x={250} y={1470} text="SEN" o={1} bg={RED} size={50} />
            <Chip x={830} y={1470} text="O" o={1} bg={BLUE} size={50} />
            <Chip x={250} y={600} text="32 CM" o={flex01 ? sm(t, W(1, 4), W(1, 4) + 0.3) : 0} bg={Y} fg={INK} size={50} />
            <Chip x={830} y={600} text={`${Math.round(32 + 4 * grow01)} CM`} o={flex01 ? sm(t, W(1, 4), W(1, 4) + 0.3) : 0} bg={grow01 > 0.6 ? GREEN : Y} fg={grow01 > 0.6 ? "#ffffff" : INK} size={50} />
          </g>
        ) : null}

        {/* ===== 2: benim kasım neden büyümüyor? ===== */}
        {s2 > 0 ? (
          <g opacity={s2}>
            <Ground />
            <g opacity={0.45}>
              <Guy uid="kn-o2" rival x={900} s={0.62} t={t} pose={FLEX} expr="laugh" />
              <Pump x={900} s={0.62} k={1} rival />
            </g>
            <Guy uid="kn-sen2" x={460} s={1.2} t={t} pose={{ ...FLEX, head: 10, lx: 8, ly: 4 }} expr="think" />
            <Tape x={460} s={1.2} k={0} o={1} />
            <Chip x={300} y={560} text="32 CM" o={1} bg={Y} fg={INK} size={56} />
            <Question x={760} y={620} o={q} t={t} />
          </g>
        ) : null}

        {/* ===== 3-5: iki kolun içi ===== */}
        {s35 > 0 ? (
          <g opacity={s35}>
            <text x={540} y={230} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={64} fill="#ffffff">
              KOLUN İÇİ
            </text>
            <MusclePanel uid="kn-po" y={330} o={sm(t, L(3), L(3) + 0.3)} dim={dimO} rival dmg={dmg} supply={supO} heal={healO} grow={growO} t={t} />
            <MusclePanel uid="kn-ps" y={860} o={sm(t, L(3) + 0.15, L(3) + 0.45)} dim={dimS} rival={false} dmg={dmg} supply={supS} heal={0} grow={0} t={t} />
            <Chip x={810} y={332} text="KALINLAŞTI" o={sm(t, W(4, 7) - 0.1, W(4, 7) + 0.2)} bg={GREEN} size={44} />
            <Chip x={810} y={862} text="ONARILMADI" o={sm(t, W(5, 5) - 0.1, W(5, 5) + 0.2)} bg={RED} size={44} />
          </g>
        ) : null}

        {/* ===== 6: aynı antrenman, fark tabakta ===== */}
        {s6 > 0 ? (
          <g opacity={s6}>
            <Ground />
            <Chip x={540} y={230} text="AYNI ANTRENMAN" o={1} bg="#ffffff" fg={INK} size={52} />
            <Chip x={540} y={350} text="FARK TABAKTA" o={sm(t, W(6, 2) - 0.1, W(6, 2) + 0.2)} bg={Y} fg={INK} size={60} />
            {/* SEN: poğaça / boş tabak */}
            <g transform="translate(250,600)">
              <circle r={120} fill="#ffffff" fillOpacity={0.12} stroke="#ffffff" strokeOpacity={0.3} strokeWidth={4} />
              <g transform="scale(1.2)">
                <EmptyPlate x={0} y={20} />
                <Pogaca x={0} y={-6} />
              </g>
            </g>
            <g transform="translate(830,600)">
              <circle r={120} fill="#ffffff" fillOpacity={0.12} stroke="#ffffff" strokeOpacity={0.3} strokeWidth={4} />
              <g transform="scale(1.3)">
                <Lunch x={0} y={0} />
              </g>
            </g>
            <Guy uid="kn-sen6" x={250} s={0.8} t={t} pose={FLEX} expr="ouch" />
            <Tape x={250} s={0.8} k={0} o={1} />
            <Guy uid="kn-o6" rival x={830} s={0.8} t={t} pose={FLEX} expr="laugh" />
            <Pump x={830} s={0.8} k={1} rival />
            <Tape x={830} s={0.8} k={1} o={1} />
            <Chip x={250} y={1470} text="SEN · 32 CM" o={1} bg={RED} size={46} />
            <Chip x={830} y={1470} text="O · 36 CM" o={1} bg={BLUE} size={46} />
          </g>
        ) : null}

        {/* ===== 7: akılda kalan replik ===== */}
        {s7 > 0 ? (
          <g opacity={s7}>
            <g transform="translate(540,600)">
              <circle r={120} fill="#ffffff" fillOpacity={0.08} />
              <Dumbbell x={0} y={0} s={1.0} rot={-15} />
            </g>
            <text x={540} y={830} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={76} fill="#ffffff" opacity={sm(t, L(7) + 0.05, L(7) + 0.35)}>
              Kas salonda yorulur…
            </text>
            <g opacity={sm(t, W(7, 3) - 0.1, W(7, 3) + 0.25)}>
              <g transform="translate(540,1050)">
                <circle r={120} fill="#ffffff" fillOpacity={0.08} />
                <g transform="scale(1.1)">
                  <Lunch x={0} y={0} />
                </g>
              </g>
              <text x={540} y={1290} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={92} fill={Y}>
                sofrada büyür.
              </text>
            </g>
          </g>
        ) : null}

        {/* ===== 8: gönder (sonra kanca karesi geri gelir) ===== */}
        {s8 > 0 ? (
          <g opacity={s8}>
            <Ground />
            <GymSign x={90} y={460} />
            <Guy uid="kn-send" x={480} s={0.95} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="grin" item={<PhoneItem />} />
            <g opacity={sm(t, L(8) + 0.15, L(8) + 0.45)}>
              <text x={540} y={290} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={96} fill="#ffffff" stroke={INK} strokeWidth={16} paintOrder="stroke">
                BUNU ONA
              </text>
              <text x={540} y={410} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={116} fill={Y} stroke={INK} strokeWidth={18} paintOrder="stroke">
                GÖNDER
              </text>
            </g>
          </g>
        ) : null}

        <rect width={1080} height={1920} fill="url(#kn-vig)" />
      </svg>

      <Captions t={t} tl={tl} />
      {data ? <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} /> : null}
      {FX.map((f, k) => (
        <Sequence key={`fx${k}`} from={Math.max(0, Math.round(f.at * fps))} durationInFrames={f.dur ? Math.round(f.dur * fps) : undefined} layout="none">
          <Audio
            src={staticFile(`sfx/${f.id}.mp3`)}
            startFrom={Math.round((f.lead ?? 0) * fps)}
            volume={(q2) => (f.dur && f.fade ? f.v * interpolate(q2 / fps, [0, 0.001, f.dur - f.fade, f.dur], [1, 1, 1, 0], { extrapolateRight: "clamp" }) : f.v)}
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
