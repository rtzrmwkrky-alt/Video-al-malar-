/**
 * BeslenmeSpor v3 (~32 sn) — anlatım güçlendirildi: ters köşe kanca ("Salonda kas yapmıyorsun. Kas, salondan çıkınca yapılıyor."),
 * kasın içinde iki kişilik tamir ekibi karşılıklı konuşur (çırak: "Şefim, kol kası yine hasarlı!" — şef: "Malzeme ne durumda?" —
 * çırak: "Kahvaltı atlanmış, öğlen bir poğaça… adam gece üçte yatmış." — şef: "Tamam, bugün de tamir yok."), sonra ayna (haftalar
 * geçiyor, değişen yok), akılda kalan replik ("Kas salonda yorulur… sofrada ve yatakta büyür.") ve döngü.
 * Ortak parçalar `BeslenmeSpor.tsx`'ten. Metin `icerik/beslenme-spor-v3.seslendirme.txt` (kelime sayıları satır satır aynı olmalı).
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import type { CurlyPose } from "../avatar/CurlyGuy";
import { Clock, Cross, Floor, PhoneItem, Pill, Txt } from "./GeceYemek";
import { Crate, Crew, DB, GymSign, HeroAt, MuscleView, Plates, Rack, Sweat, rowY, type CrewExpr, type CrewPose } from "./BeslenmeSpor";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const FLOOR = 1400;

export const B3_LINES: Line[] = [
  { text: "Salonda kas yapmıyorsun. Kas, salondan çıkınca yapılıyor.", hl: ["yapmıyorsun.", "çıkınca"], hold: 0.4 },
  { text: "Ağırlığı kaldırdığında kasında minicik hasarlar açılır.", hl: ["minicik", "hasarlar"], hold: 0.2 },
  { text: "Ve içeride tamir ekibi telsize sarılır:", hl: ["tamir", "ekibi"], hold: 0.2 },
  { text: "“Şefim, kol kası yine hasarlı!”", hl: ["hasarlı!"], hold: 0.3 },
  { text: "“Malzeme ne durumda?”", hl: ["Malzeme"], hold: 0.3 },
  { text: "“Kahvaltı atlanmış, öğlen bir poğaça… adam gece üçte yatmış.”", hl: ["atlanmış,", "poğaça…", "üçte"], hold: 0.4 },
  { text: "“Tamam, bugün de tamir yok.”", hl: ["yok.”"], hold: 0.4 },
  { text: "İşte bu yüzden haftalar geçiyor ama aynada hiçbir şey değişmiyor.", hl: ["hiçbir", "değişmiyor."], hold: 0.3 },
  { text: "Kas salonda yorulur… sofrada ve yatakta büyür.", hl: ["sofrada", "yatakta", "büyür."], hold: 0.4 },
  { text: "Bunu, her gün salona gidip hâlâ değişmeyen o arkadaşına gönder.", hl: ["gönder."], hold: 0.6 },
];

/** tamir ekibinin konuşmaları (altyazı açık mavi) */
const QUOTE = [3, 4, 5, 6];

/** döngü: son cümleden sonra kısa bekleme, sonra kanca karesine yumuşak geçiş (son kare = ilk kare) */
export const B3_TAIL = 0.6;
export const B3_TL = timeline(B3_LINES, B3_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

/** seslendirmeden zaman çizelgesi: her satır ilk kelimesinin başladığı anda başlar */
const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of B3_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + B3_TAIL;
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
  const n = words(B3_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (B3_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const out = 1 - sm(t, tl.total - 0.45, tl.total - 0.15);
  if (out <= 0) return null;
  const line = B3_LINES[i];
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
  const hl = line.hl ?? [];
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1560, textAlign: "center", opacity: out }}>
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
              color: hl.map(norm).includes(norm(w)) ? Y : QUOTE.includes(i) ? "#bfe6ff" : "#ffffff",
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

/** pazu kasma: dirsek yanda, yumruk yukarıda */
const FLEX: CurlyPose = { r: { el: [340, 440], wr: [318, 318], hand: "fist" }, head: 4, lx: 6, ly: -2 };

/** boy aynası; içindeki yansıma kırpılır */
const Mirror: React.FC<{ x: number; y: number; w: number; h: number; uid: string; children: React.ReactNode }> = ({ x, y, w, h, uid, children }) => (
  <g>
    <defs>
      <clipPath id={`${uid}-clip`}>
        <rect x={x} y={y} width={w} height={h} rx={30} />
      </clipPath>
      <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e9f3fb" />
        <stop offset="1" stopColor="#b9cfe2" />
      </linearGradient>
    </defs>
    <rect x={x - 18} y={y - 18} width={w + 36} height={h + 36} rx={44} fill="#8b93a6" stroke={INK} strokeWidth={8} />
    <rect x={x} y={y} width={w} height={h} rx={30} fill={`url(#${uid}-glass)`} stroke={INK} strokeWidth={6} />
    <g clipPath={`url(#${uid}-clip)`}>
      {children}
      <path d={`M${x + w * 0.15},${y + h * 0.3} L${x + w * 0.5},${y + h * 0.1}`} stroke="#ffffff" strokeWidth={22} strokeLinecap="round" opacity={0.35} />
      <path d={`M${x + w * 0.18},${y + h * 0.4} L${x + w * 0.42},${y + h * 0.26}`} stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.3} />
    </g>
  </g>
);

/** boş tabak */
const EmptyPlate: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={0} rx={78} ry={30} fill="#ffffff" stroke={INK} strokeWidth={6} />
    <ellipse cx={0} cy={-3} rx={50} ry={17} fill="none" stroke={INK} strokeWidth={3} opacity={0.25} />
  </g>
);

/** tek poğaça */
const Pogaca: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-70,22 Q-78,-34 0,-40 Q78,-34 70,22 Q0,36 -70,22 Z" fill="#e8a24c" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-50,-14 Q0,-34 50,-14" fill="none" stroke="#f6c97a" strokeWidth={10} strokeLinecap="round" />
    {[
      [-30, -22],
      [-8, -28],
      [16, -26],
      [36, -18],
      [4, -14],
    ].map(([sx, sy], k) => (
      <ellipse key={k} cx={sx} cy={sy} rx={4} ry={2.5} fill="#fff8e0" transform={`rotate(${k * 30} ${sx} ${sy})`} />
    ))}
  </g>
);

/** günlük rapor panosu: kahvaltı / öğle / uyku */
const Report: React.FC<{ o: number; rows: number[]; t: number }> = ({ o, rows, t }) => {
  if (o <= 0) return null;
  const row = (k: number, icon: React.ReactNode, label: string, value: string, bad: boolean) => {
    const p = rows[k];
    if (p <= 0) return null;
    const y = 500 + k * 205;
    return (
      <g key={k} opacity={p} transform={`translate(0,${(1 - p) * 14})`}>
        <g transform={`translate(260,${y}) scale(1.3)`}>{icon}</g>
        <text x={400} y={y - 14} fontFamily={SANS} fontWeight={800} fontSize={44} fill={INK} opacity={0.55}>
          {label}
        </text>
        <text x={400} y={y + 58} fontFamily={SANS} fontWeight={800} fontSize={70} fill={bad ? RED : INK}>
          {value}
        </text>
      </g>
    );
  };
  return (
    <g opacity={o} transform={`translate(0,${(1 - o) * 18})`}>
      <rect x={90} y={250} width={900} height={800} rx={40} fill="#ffffff" stroke={INK} strokeWidth={9} />
      <rect x={430} y={232} width={220} height={56} rx={16} fill="#8b93a6" stroke={INK} strokeWidth={6} />
      <text x={540} y={355} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={50} fill={INK} letterSpacing={2}>
        GÜNLÜK RAPOR
      </text>
      <line x1={160} y1={385} x2={920} y2={385} stroke={INK} strokeWidth={4} opacity={0.15} />
      {row(
        0,
        <g>
          <EmptyPlate x={0} y={10} />
          <Cross x={0} y={4} s={30} p={rows[0]} />
        </g>,
        "KAHVALTI",
        "ATLANDI",
        true,
      )}
      {row(1, <Pogaca x={0} y={10} />, "ÖĞLE", "1 POĞAÇA", true)}
      {row(
        2,
        <g>
          <Clock x={0} y={10} r={62} h={3} m={0} />
          <circle cx={58} cy={-46} r={4} fill={Y} opacity={0.6 + 0.4 * Math.sin(t * 4)} />
        </g>,
        "YATIŞ",
        "GECE 03:00",
        true,
      )}
    </g>
  );
};

// ------------------------------------------------------------ ana kompozisyon

export type BeslenmeSpor3Props = { audioName: string; data: VoiceoverData | null };

export const BeslenmeSpor3: React.FC<BeslenmeSpor3Props> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : B3_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, 0.21);
  const loopIn = sm(t, T - 0.24, T - 0.03);

  // ===== 0-1: salonda dambıl; "kasında" kelimesinde pazıya dalınır
  const enter = W(1, 2); // "kasında"
  const s0 = Math.max(win(t, -1, enter + 0.02, 0.21), loopIn);
  const tc = t > L(9) ? t - T : t; // döngüde kanca aynı hareketle gelir
  const rep = 0.5 - 0.5 * Math.cos(tc * 4.2);
  const dive = sm(t, enter - 0.6, enter + 0.02);
  const twist = W(0, 3); // "Kas, salondan çıkınca yapılıyor"
  // ===== 1-6: kasın içi + tamir ekibi
  const sIn = win(t, enter - 0.02, L(7) + 0.02, 0.21);
  const dmg = sm(t, W(1, 3) - 0.2, W(1, 5) + 0.3);
  const crewIn = sm(t, L(2) + 0.05, L(2) + 0.4);
  const radio = W(2, 4); // "telsize"
  const report = win(t, L(5) - 0.05, L(6) + 0.05, 0.25);
  const rows = [sm(t, W(5, 0) - 0.1, W(5, 0) + 0.25), sm(t, W(5, 4) - 0.15, W(5, 4) + 0.2), sm(t, W(5, 7) - 0.15, W(5, 7) + 0.2)];
  const noRepair = L(6);
  // ===== 7: ayna — haftalar geçiyor, değişen yok
  const s7 = scene(7, 8);
  const weeks = Math.max(1, Math.min(8, 1 + Math.floor(interpolate(t, [L(7) + 0.2, W(7, 4)], [0, 7.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))));
  const same = W(7, 7); // "hiçbir"
  // ===== 8: sofrada ve yatakta büyür
  const s8 = scene(8, 9);
  const fed = sm(t, W(8, 3) - 0.1, W(8, 3) + 0.4);
  const full = interpolate(t, [W(8, 3), W(8, 6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const grow = sm(t, W(8, 6) - 0.15, W(8, 6) + 0.6);
  // ===== 9: gönder → döngü
  const s9 = win(t, L(9) - 0.02, T - 0.25, 0.18);

  const gym = Math.max(win(t, -1, enter + 0.02, 0.21), s7, win(t, L(9) - 0.02, T + 1, 0.21));
  const HX = 540;
  const bicep: [number, number] = [HX + 82, FLOOR - 434];
  const zoom = t > enter + 0.1 ? 1 : 1 + 3.4 * dive * dive;
  const diveT = `translate(${bicep[0]},${bicep[1]}) scale(${zoom}) translate(${-bicep[0]},${-bicep[1]})`;

  // ekip: çırak (solda, sarı baret) ve şef (sağda, beyaz baret, bıyık)
  const c1Talk = (t > L(3) && t < L(4) - 0.15) || (t > L(5) && t < L(6) - 0.15);
  const c2Talk = (t > L(4) && t < L(5) - 0.15) || (t > L(6) && t < L(7) - 0.2);
  const c1: CrewPose = t < radio - 0.1 ? "idle" : t < L(6) ? "talk" : "shrug";
  const c2: CrewPose = t < L(6) ? "idle" : "shrug";
  const cExpr = (talking: boolean): CrewExpr => (t < L(3) ? "happy" : t < L(6) ? (talking ? "alert" : "alert") : "sad");

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number; fin?: number }[] = [
    { at: 0, id: 2299, v: 0.3, lead: 0.05 }, // kanca
    { at: twist - 0.05, id: 2568, v: 0.14 }, // ters köşe
    { at: enter - 0.95, id: 790, v: 0.16, lead: 0.61, dur: 1.0, fade: 0.3 }, // içeri giriş
    { at: enter + 0.05, id: 1143, v: 0.22, lead: 0.14, dur: 1.4, fade: 0.7 }, // kasın içi
    { at: radio - 0.05, id: 2568, v: 0.16 }, // telsiz
    { at: W(5, 0) - 0.08, id: 2568, v: 0.16 }, // rapor satırları
    { at: W(5, 4) - 0.08, id: 2568, v: 0.16 },
    { at: W(5, 7) - 0.08, id: 2568, v: 0.16 },
    { at: noRepair - 0.05, id: 2299, v: 0.16, lead: 0.05 }, // "bugün de tamir yok"
    { at: same - 0.05, id: 2299, v: 0.14, lead: 0.05 }, // "hiçbir şey değişmiyor"
    { at: W(8, 6) - 0.05, id: 1120, v: 0.3, lead: 0.1 }, // büyür ✓
  ];
  const duck = (mt: number) => 1 - 0.4 * win(mt, noRepair - 0.1, L(8), 0.4);

  const GYM: [string, string] = ["#5b6b8f", "#3f4b6c"];
  const bgAt: [number, string, string][] = [
    [0, ...GYM],
    [enter, "#fbe3dc", "#f2c9bd"], // kasın içi
    [L(7), ...GYM], // ayna: salon
    [L(8), "#ffe3b8", "#f8c98f"], // büyür: sıcak
    [L(9), ...GYM], // kapanış = kanca
  ];
  let bgTop = bgAt[0][1];
  let bgBot = bgAt[0][2];
  for (let k = 1; k < bgAt.length; k++) {
    const at = bgAt[k][0];
    bgTop = interpolateColors(t, [at - 0.15, at + 0.25], [bgTop, bgAt[k][1]]);
    bgBot = interpolateColors(t, [at - 0.15, at + 0.25], [bgBot, bgAt[k][2]]);
  }

  const inside = Math.max(sIn, s8);
  const mv =
    t < L(8) - 0.1
      ? { dmg, sig: sm(t, L(2), L(2) + 0.4) * (1 - sm(t, noRepair, noRepair + 0.4) * 0.5), supply: 0, repair: 0, grow: 0, empty: sm(t, L(4), L(4) + 0.4) }
      : { dmg: 1, sig: 0.5 * (1 - fed), supply: 0.08 + 0.92 * fed, repair: full, grow, empty: 1 - fed };
  const insideIn = sm(t, enter - 0.05, enter + 0.55);

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="b3-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="b3-glow" cx="50%" cy="40%" r="55%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.3} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="b3-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#b3-bg)" />
        <rect width={1080} height={1920} fill="url(#b3-glow)" />

        {/* ===== salon (ortak fon) ===== */}
        <g opacity={gym}>
          <Floor tint="#2a2a3a" />
        </g>
        {gym > 0 ? (
          <g opacity={gym} transform={diveT}>
            <GymSign x={90} y={170} />
            {s7 > 0.01 ? null : <Rack x={620} y={560} />}
            <Plates x={170} />
          </g>
        ) : null}

        {/* ===== 0-1: ters köşe kanca + dambıl, sonra pazıya dalış ===== */}
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
              <HeroAt
                uid="b30"
                x={HX}
                s={1}
                t={t}
                pose={{ r: { el: [298, 530], wr: [306 - 20 * rep, 690 - 270 * rep] }, head: -2 }}
                item={DB}
                expr={rep > 0.55 ? "ouch" : "neutral"}
              />
              <Sweat t={t} pts={[[470, 700], [610, 690]]} />
            </g>
          </g>
        ) : null}

        {/* ===== kasın içi ===== */}
        {inside > 0 ? (
          <g opacity={inside}>
            <g opacity={1 - report * 0.85} transform={`translate(540,680) scale(${t < L(2) ? 1.25 - 0.25 * insideIn : 1}) translate(-540,-680)`}>
              <MuscleView t={t} {...mv} />
            </g>
            <Pill x={540} y={150} text="KASIN İÇİ" o={sIn * sm(t, enter + 0.2, enter + 0.5) * (1 - sm(t, L(3) - 0.2, L(3)))} size={50} />
            <Pill x={380} y={rowY(1) - 95} text="HASAR" o={sIn * sm(t, W(1, 4) - 0.1, W(1, 4) + 0.2) * (1 - sm(t, L(2) - 0.2, L(2)))} color="#ffffff" size={44} />
            <Pill x={540} y={150} text="KOL KASI: HASARLI" o={sIn * sm(t, L(3) + 0.1, L(3) + 0.4) * (1 - sm(t, L(5) - 0.2, L(5)))} color={Y} size={48} />
            <Report o={sIn * report} rows={rows} t={t} />
            <Pill x={540} y={150} text="TAMİR YOK" o={sIn * sm(t, noRepair + 0.05, noRepair + 0.35)} color={RED} ink="#fff" size={54} />

            {/* tamir ekibi (benzetme) */}
            <g opacity={sIn * crewIn}>
              <Pill x={540} y={1160} text="TAMİR EKİBİ" o={1 - sm(t, L(3) - 0.2, L(3))} size={40} />
              <Crate x={540} y={1435} full={0} t={t} o={sm(t, L(4) + 0.1, L(4) + 0.4)} />
              <Crew x={290} y={1435} s={1.25} t={t} pose={c1} expr={cExpr(c1Talk)} talk={c1Talk} />
              <Crew x={790} y={1435} s={1.25} t={t} pose={c2} expr={cExpr(c2Talk)} talk={c2Talk} body="#ffe0b8" flip chief />
              {/* konuşanın başında küçük işaret */}
              {[
                [290, c1Talk],
                [790, c2Talk],
              ].map(([x, on], k) => (on ? <path key={k} d={`M${(x as number) - 16},1150 L${(x as number) + 16},1150 L${x as number},1172 Z`} fill={Y} stroke={INK} strokeWidth={4} /> : null))}
              <text x={540} y={1478} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={28} fill={INK} opacity={0.45}>
                benzetme
              </text>
            </g>

            {/* 8: sofrada + yatakta büyür — ekip malzemeyle çalışır */}
            <g opacity={s8}>
              <Pill x={540} y={150} text="SALONDA YORULUR" o={sm(t, L(8) + 0.1, L(8) + 0.4) * (1 - sm(t, W(8, 3) - 0.2, W(8, 3)))} size={50} />
              <Pill x={540} y={150} text="SOFRADA + YATAKTA BÜYÜR" o={sm(t, W(8, 3) + 0.05, W(8, 3) + 0.35)} color={Y} size={48} />
              <Crate x={540} y={1435} full={fed} t={t} o={1} />
              <Crew x={290} y={1435} s={1.25} t={t} pose={t > W(8, 3) ? "work" : "idle"} expr="happy" />
              <Crew x={790} y={1435} s={1.25} t={t} pose={t > W(8, 6) ? "salute" : "work"} expr="happy" body="#ffe0b8" flip chief />
            </g>
          </g>
        ) : null}

        {/* ===== 7: ayna — haftalar geçiyor, hiçbir şey değişmiyor ===== */}
        {s7 > 0 ? (
          <g opacity={s7}>
            <Mirror x={600} y={330} w={400} h={1050} uid="b3m">
              <HeroAt uid="b3r" x={800} y={1430} s={0.95} t={t} pose={{ l: { el: [60, 440], wr: [82, 318], hand: "fist" }, head: -4, lx: -6, ly: -2 }} expr={t > same ? "ouch" : "grin"} />
              <rect x={600} y={330} width={400} height={1050} fill="#bcd3e8" opacity={0.25} />
            </Mirror>
            <Pill x={280} y={360} text={`${weeks}. HAFTA`} o={sm(t, L(7) + 0.1, L(7) + 0.4)} color={Y} size={56} />
            <Pill x={800} y={250} text="HÂLÂ AYNI" o={sm(t, same, same + 0.3)} color={RED} ink="#fff" size={56} />
            {(() => {
              const p = sm(t, same - 0.15, same + 0.45);
              const c: [number, number] = [800 - 120 * 0.95, 1430 - 500 * 0.95];
              return p > 0 ? (
                <ellipse cx={c[0]} cy={c[1]} rx={95} ry={115} fill="none" stroke={RED} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} transform={`rotate(-90 ${c[0]} ${c[1]})`} strokeLinecap="round" />
              ) : null;
            })()}
            <HeroAt uid="b37" x={300} s={1.02} t={t} pose={t > same ? { lx: 5, ly: 3, head: 3 } : FLEX} expr={t > same ? "ouch" : "grin"} />
          </g>
        ) : null}

        {/* ===== 9: gönder (sonra kanca karesi geri gelir) ===== */}
        {s9 > 0 ? (
          <g opacity={s9}>
            <HeroAt uid="b39" x={480} s={0.86} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="grin" item={<PhoneItem />} />
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

        <rect width={1080} height={1920} fill="url(#b3-vig)" />
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
