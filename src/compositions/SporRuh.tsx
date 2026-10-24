/**
 * "Spor depresyon ve kaygıya iyi geliyor mu?" (~32 sn, Shorts/Reels) — sessiz taslak.
 * Ses kapalı izleyen de anlasın diye her satır tek görüntü: ilaç kutusu = spor ayakkabısı (kanca) → battaniyeli kanepede telefon,
 * saat 07:00'den 23:00'e döner, kafada karmakarışık düşünce → 1.000+ deney / 128.000 kişi (insan ızgarası dolar) → DEPRESYON / KAYGI
 * göstergeleri orta düzeye iner → terazi: ilaç + terapi ↔ ayakkabı dengelenir → ikiye bölünmüş ekran: KAYGI = yoga, DEPRESYON =
 * ağırlık + grup → terledikçe tempo ve ETKİ artar → ilaç kutusu itilmez, yanına ayakkabı konur (YERİNE ✕ / YANINDA ✓) → açık kapı,
 * 10 DK YÜRÜ, "Seni ne rahatlatıyor? Yorumlara yaz" → döngü (son kare = ilk kare). Metin `icerik/spor-ruh.seslendirme.txt`.
 * Bulgular: BJSM 2023, BMJ 2024, 2026 çalışması (bkz. `icerik/spor-depresyon-senaryo.md`).
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import { CurlyGuy, type CurlyExpr, type CurlyLook, type CurlyPose } from "../avatar/CurlyGuy";
import { Check, Clock, Cross, PhoneItem, Scale } from "./GeceYemek";
import { DB, SPORCU_LOOK, Sweat } from "./BeslenmeSpor";
import { Chip, curl } from "./BeslenmeSpor5";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const GREEN = "#2fbf62";
const FLOOR = 1400;

export const SR_LINES: Line[] = [
  { text: "Bazı araştırmalara göre ilaç kadar etkili olabilen, bedava bir şey var.", hl: ["ilaç", "bedava"], hold: 0.2 },
  { text: "Sabah kalkasın gelmiyor, kafan hiç susmuyor, akşam elinde telefon.", hl: ["kalkasın", "susmuyor,"], hold: 0.1 },
  { text: "Binden fazla deney, yüz yirmi sekiz bin kişi incelendi.", hl: ["Binden", "yüz", "yirmi", "sekiz", "bin"], hold: 0.1 },
  { text: "Sonuç: spor, depresyonu ve kaygıyı orta düzeyde azaltıyor.", hl: ["depresyonu", "kaygıyı", "azaltıyor."], hold: 0.15 },
  { text: "Yeni bir çalışmada etkisi ilaç ve terapiye eşit, hatta daha iyi çıktı.", hl: ["ilaç", "terapiye", "eşit,"], hold: 0.15 },
  { text: "Kaygı için yoga ve hafif programlar, depresyonda ağırlık ve grup sporu öne çıkıyor.", hl: ["Kaygı", "yoga", "depresyonda", "ağırlık", "grup"], hold: 0.1 },
  { text: "Üstelik ne kadar terlersen, etkisi o kadar artıyor.", hl: ["terlersen,", "artıyor."], hold: 0.1 },
  { text: "Ama ağır depresyondaysan spor, tedavinin yerine değil, yanında.", hl: ["yerine", "yanında."], hold: 0.25 },
  { text: "Bugün on dakika yürü. Seni kötü bir günde ne rahatlatıyor? Yorumlara yaz.", hl: ["on", "dakika", "rahatlatıyor?", "Yorumlara"], hold: 0.5 },
];

export const SR_TAIL = 0.5;
export const SR_TL = timeline(SR_LINES, SR_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

/** seslendirmeden zaman çizelgesi: her satır ilk kelimesinin başladığı anda başlar */
const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of SR_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + SR_TAIL;
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
  const n = words(SR_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (SR_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const out = 1 - sm(t, tl.total - 0.45, tl.total - 0.15);
  if (out <= 0) return null;
  const line = SR_LINES[i];
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
              fontSize: 86,
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

const FRIEND_LOOK: CurlyLook = {
  ...SPORCU_LOOK,
  hairColor: ["#3a3a3a", "#1e1e1e", "#0c0c0c"],
  jacket: ["#6db5ff", "#3d8ef0", "#2662b8"],
  shoeLine: "#3d8ef0",
};

/** evde, keyifsiz hâli: gri kapüşonlu */
const HOME_LOOK: CurlyLook = {
  ...SPORCU_LOOK,
  jacket: ["#9aa1ad", "#7c838f", "#5d636e"],
  sweater: "#d9dde3",
  shoeLine: "#7c838f",
};

const blinkAt = (t: number) => ((t % 3.5) / 3.5 > 0.96 ? 1 : 0);

/** genç: ayak ortası (x, y), s ölçek (~880 birim boy) */
const Guy: React.FC<{ uid: string; x: number; y?: number; s: number; t: number; pose?: CurlyPose; expr?: CurlyExpr; item?: React.ReactNode; look?: CurlyLook }> = ({
  uid,
  x,
  y = FLOOR,
  s,
  t,
  pose,
  expr,
  item,
  look = SPORCU_LOOK,
}) => (
  <g transform={`translate(${x},${y}) scale(${s}) translate(-200,-880)`}>
    <CurlyGuy id={uid} pose={pose} expr={expr} t={t} item={item} blink={blinkAt(t + x)} look={look} />
  </g>
);

// ------------------------------------------------------------ çizim parçaları

const BigText: React.FC<{ a: string; b: string; o: number; y?: number; size?: number; bo?: number; bColor?: string }> = ({ a, b, o, y = 290, size = 104, bo = 1, bColor = Y }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <text x={540} y={y} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size * 0.82} fill="#ffffff" stroke={INK} strokeWidth={16} paintOrder="stroke">
        {a}
      </text>
      <g opacity={bo}>
        <text x={540} y={y + size * 1.1} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} fill={bColor} stroke={INK} strokeWidth={18} paintOrder="stroke">
          {b}
        </text>
      </g>
    </g>
  );

/** ilaç kutusu: önünde blister */
const PillBox: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-130} y={-170} width={260} height={300} rx={22} fill="#ffffff" stroke={INK} strokeWidth={8} />
    <rect x={-130} y={-170} width={260} height={70} rx={22} fill="#4a8df0" stroke={INK} strokeWidth={8} />
    <rect x={-122} y={-120} width={244} height={20} fill="#4a8df0" />
    <text x={0} y={-118} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill="#ffffff" letterSpacing={4}>
      İLAÇ
    </text>
    <rect x={-100} y={-70} width={200} height={170} rx={16} fill="#e6ebf2" stroke={INK} strokeWidth={5} />
    {[0, 1, 2].map((r) =>
      [0, 1].map((c) => (
        <g key={`${r}-${c}`} transform={`translate(${-45 + c * 90},${-30 + r * 52}) rotate(-20)`}>
          <rect x={-30} y={-14} width={60} height={28} rx={14} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <path d="M0,-14 L0,14 L16,14 Q30,14 30,0 Q30,-14 16,-14 Z" fill="#ff8a7a" />
          <rect x={-30} y={-14} width={60} height={28} rx={14} fill="none" stroke={INK} strokeWidth={4} />
        </g>
      )),
    )}
  </g>
);

/** spor ayakkabısı (yandan) */
const Sneaker: React.FC<{ x: number; y: number; s?: number; rot?: number; flip?: boolean }> = ({ x, y, s = 1, rot = 0, flip = false }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip ? -s : s},${s})`}>
    <path d="M-150,40 L-150,-40 Q-150,-70 -120,-74 L-60,-80 Q-30,-40 20,-30 Q90,-18 130,0 Q160,14 156,40 Z" fill="#ff6a3d" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M-120,-74 L-60,-80 L-56,-60 L-118,-50 Z" fill="#ffffff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-40,-40 L-10,-10 M-15,-46 L15,-16 M10,-40 L36,-14" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" />
    <path d="M-80,-6 Q-10,20 110,6" fill="none" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" />
    <path d="M-158,40 L164,40 Q166,70 140,72 L-150,72 Q-162,70 -158,40 Z" fill="#ffffff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
  </g>
);

/** terapi: konuşma balonu */
const TalkIcon: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path d="M-80,-60 Q-80,-90 -50,-90 L50,-90 Q80,-90 80,-60 L80,0 Q80,30 50,30 L-10,30 L-44,62 L-36,30 L-50,30 Q-80,30 -80,0 Z" fill="#ffffff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    {[-34, 0, 34].map((dx) => (
      <circle key={dx} cx={dx} cy={-30} r={10} fill={INK} />
    ))}
  </g>
);

/** fiyat etiketi */
const Tag: React.FC<{ x: number; y: number; text: string; o: number; color: string }> = ({ x, y, text, o, color }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y + (1 - o) * 14}) rotate(-6)`}>
      <path d="M-110,-50 L80,-50 L120,0 L80,50 L-110,50 Q-124,50 -124,36 L-124,-36 Q-124,-50 -110,-50 Z" fill={color} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <circle cx={78} cy={0} r={10} fill="#ffffff" stroke={INK} strokeWidth={4} />
      <text x={-24} y={20} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={58} fill={INK}>
        {text}
      </text>
    </g>
  );

/** kafadaki karmakarışık düşünce yumağı */
const Scribble: React.FC<{ x: number; y: number; k: number; t: number }> = ({ x, y, k, t }) => {
  if (k <= 0.01) return null;
  const pts: string[] = [];
  const n = 220;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 14;
    const r = 70 + 34 * Math.sin(a * 0.37 + t * 1.3) + 18 * Math.cos(a * 1.7);
    pts.push(`${(x + r * Math.cos(a + t * 0.6) * 1.35).toFixed(1)},${(y + r * Math.sin(a + t * 0.6) * 0.8).toFixed(1)}`);
  }
  return (
    <g opacity={Math.min(1, k * 1.4)}>
      <ellipse cx={x} cy={y} rx={160 * k + 20} ry={100 * k + 14} fill="#ffffff" opacity={0.18} />
      <polyline points={pts.join(" ")} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} opacity={0.75} />
    </g>
  );
};

/** küçük insan simgesi */
const Person: React.FC<{ x: number; y: number; o: number; c: string }> = ({ x, y, o, c }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y + (1 - o) * 10})`}>
      <circle cx={0} cy={-18} r={11} fill={c} />
      <path d="M-16,16 Q-16,-4 0,-4 Q16,-4 16,16 Z" fill={c} />
    </g>
  );

/** dikey gösterge: v 0-1 */
const Gauge: React.FC<{ x: number; label: string; v: number; color: string }> = ({ x, label, v, color }) => {
  const top = 520;
  const h = 640;
  return (
    <g>
      <rect x={x - 90} y={top} width={180} height={h} rx={40} fill="#ffffff" fillOpacity={0.9} stroke={INK} strokeWidth={8} />
      <rect x={x - 76} y={top + 14 + (h - 28) * (1 - v)} width={152} height={(h - 28) * v} rx={30} fill={color} />
      {[0.25, 0.5, 0.75].map((q) => (
        <line key={q} x1={x - 90} y1={top + h * q} x2={x - 60} y2={top + h * q} stroke={INK} strokeWidth={5} opacity={0.5} />
      ))}
      <text x={x} y={top + h + 80} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={54} fill="#ffffff" stroke={INK} strokeWidth={12} paintOrder="stroke">
        {label}
      </text>
    </g>
  );
};

/** kanepe arkalığı (karakterin arkasında) */
const CouchBack: React.FC = () => (
  <g>
    <rect x={150} y={900} width={780} height={360} rx={70} fill="#6d7fa8" stroke={INK} strokeWidth={8} />
    <rect x={190} y={940} width={330} height={260} rx={50} fill="#7f91ba" />
    <rect x={560} y={940} width={330} height={260} rx={50} fill="#7f91ba" />
  </g>
);

/** kanepe oturağı ve kolçaklar (karakterin önünde: belden aşağısını örter, oturuyormuş gibi) */
const CouchFront: React.FC = () => (
  <g>
    <rect x={190} y={1170} width={700} height={250} rx={40} fill="#6d7fa8" stroke={INK} strokeWidth={8} />
    <line x1={540} y1={1180} x2={540} y2={1300} stroke={INK} strokeWidth={6} opacity={0.35} />
    <path d="M200,1300 L880,1300" stroke={INK} strokeWidth={6} opacity={0.35} />
    <rect x={110} y={1090} width={130} height={340} rx={56} fill="#5c6d96" stroke={INK} strokeWidth={8} />
    <rect x={840} y={1090} width={130} height={340} rx={56} fill="#5c6d96" stroke={INK} strokeWidth={8} />
    <path d="M700,1100 Q760,1060 820,1110 L800,1190 Q740,1210 690,1180 Z" fill="#e9a6a0" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <rect x={150} y={1420} width={40} height={40} fill="#3b3f58" />
    <rect x={890} y={1420} width={40} height={40} fill="#3b3f58" />
  </g>
);

/** pencere: gündüzden geceye */
const SkyWindow: React.FC<{ x: number; y: number; w: number; h: number; night: number }> = ({ x, y, w, h, night }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={14} fill={interpolateColors(night, [0, 1], ["#bfe3ff", "#24305e"])} stroke={INK} strokeWidth={8} />
    <circle cx={x + w * 0.3} cy={y + h * (0.3 + 0.5 * night)} r={30} fill="#ffd66b" opacity={1 - night} />
    <g opacity={night}>
      <circle cx={x + w * 0.68} cy={y + h * 0.32} r={28} fill="#fff4c2" />
      <circle cx={x + w * 0.68 + 13} cy={y + h * 0.32 - 6} r={24} fill="#24305e" />
    </g>
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={INK} strokeWidth={7} />
    <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={INK} strokeWidth={7} />
  </g>
);

/** nabız çizgisi; speed arttıkça atımlar sıklaşır */
const Pulse: React.FC<{ y: number; phase: number; amp: number; o: number }> = ({ y, phase, amp, o }) => {
  if (o <= 0) return null;
  const pts: string[] = [];
  for (let x = 80; x <= 1000; x += 6) {
    const u = ((((x - 80) / 920) * 4 - phase) % 1 + 1) % 1;
    let v = 0;
    if (u > 0.4 && u < 0.45) v = -((u - 0.4) / 0.05);
    else if (u >= 0.45 && u < 0.5) v = -1 + ((u - 0.45) / 0.05) * 1.6;
    else if (u >= 0.5 && u < 0.55) v = 0.6 - ((u - 0.5) / 0.05) * 0.6;
    pts.push(`${x},${(y + v * amp).toFixed(1)}`);
  }
  return (
    <g opacity={o}>
      <rect x={60} y={y - amp - 30} width={960} height={amp * 2 + 60} rx={30} fill="#10172b" opacity={0.55} />
      <polyline points={pts.join(" ")} fill="none" stroke="#ff7a8a" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};

/** yoga matı */
const Mat: React.FC<{ x: number; w: number; color: string }> = ({ x, w, color }) => (
  <path d={`M${x - w / 2},${FLOOR + 6} L${x + w / 2},${FLOOR + 6} L${x + w / 2 - 30},${FLOOR + 40} L${x - w / 2 + 30},${FLOOR + 40} Z`} fill={color} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
);

/** açık kapı: içeri gün ışığı */
const Door: React.FC<{ open: number; t: number }> = ({ open, t }) => {
  const x = 330;
  const w = 420;
  const top = 480;
  const pw = w * (1 - 0.82 * open);
  return (
    <g>
      <rect x={x - 26} y={top - 26} width={w + 52} height={FLOOR - top + 26} rx={10} fill="#c98b5a" stroke={INK} strokeWidth={8} />
      <rect x={x} y={top} width={w} height={FLOOR - top} fill="#fff1c9" />
      <rect x={x} y={top} width={w} height={FLOOR - top} fill="#ffd66b" opacity={0.35 + 0.1 * Math.sin(t * 2)} />
      <path d={`M${x},${FLOOR} L${x + w},${FLOOR} L${x + w + 260},1900 L${x - 260},1900 Z`} fill="#fff1c9" opacity={0.35 * open} />
      <g>
        <path d={`M${x},${top} L${x + pw},${top + 40 * open} L${x + pw},${FLOOR - 40 * open} L${x},${FLOOR} Z`} fill="#8a5a3a" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <circle cx={x + pw - 40 * (1 - open) - 14} cy={(top + FLOOR) / 2} r={14} fill={Y} stroke={INK} strokeWidth={4} />
      </g>
    </g>
  );
};

/** zamanlayıcı halkası */
const Timer: React.FC<{ x: number; y: number; p: number; o: number }> = ({ x, y, p, o }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <circle cx={x} cy={y} r={110} fill="#ffffff" stroke={INK} strokeWidth={8} />
      <circle cx={x} cy={y} r={86} fill="none" stroke="#e8e2d6" strokeWidth={22} />
      <circle cx={x} cy={y} r={86} fill="none" stroke={GREEN} strokeWidth={22} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round" transform={`rotate(-90 ${x} ${y})`} />
      <text x={x} y={y + 6} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={64} fill={INK}>
        10
      </text>
      <text x={x} y={y + 52} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={32} fill={INK} opacity={0.6}>
        DK
      </text>
    </g>
  );

// ------------------------------------------------------------ ana kompozisyon

export type SporRuhProps = { audioName: string; data: VoiceoverData | null };

export const SporRuh: React.FC<SporRuhProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : SR_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, 0.18);
  const loopIn = sm(t, T - 0.24, T - 0.03);
  const end = t > L(8);
  // her satırda yavaş yaklaşma (hiçbir kare durmasın)
  const li = Math.max(0, tl.idx(t));
  const push = end && t > T - 0.3 ? 1 : 1 + 0.05 * Math.min(1, Math.max(0, (t - L(li)) / Math.max(0.5, L(li + 1) - L(li))));

  // kanca: son karede de aynı (döngü)
  const th = end ? 0 : t;
  const s0 = Math.max(scene(0, 1), loopIn);
  const s1 = scene(1, 2);
  const s2 = scene(2, 3);
  const s3 = scene(3, 4);
  const s4 = scene(4, 5);
  const s5 = scene(5, 6);
  const s6 = scene(6, 7);
  const s7 = scene(7, 8);
  const s8 = win(t, L(8) - 0.02, T - 0.25, 0.18);

  const HOOK: [string, string] = ["#26335c", "#141c38"];
  const bgAt: [number, string, string][] = [
    [0, ...HOOK],
    [L(1), "#5d6b86", "#353f57"],
    [L(2), "#1f7a83", "#12505a"],
    [L(4), "#3f5b8f", "#253a66"],
    [L(5), "#1f7a83", "#12505a"],
    [L(6), "#e0703f", "#a8432a"],
    [L(7), "#33405f", "#1d2740"],
    [L(8), "#ffb27a", "#f07a5a"],
  ];
  let bgTop = bgAt[0][1];
  let bgBot = bgAt[0][2];
  for (let k = 1; k < bgAt.length; k++) {
    bgTop = interpolateColors(t, [bgAt[k][0] - 0.12, bgAt[k][0] + 0.12], [bgTop, bgAt[k][1]]);
    bgBot = interpolateColors(t, [bgAt[k][0] - 0.12, bgAt[k][0] + 0.12], [bgBot, bgAt[k][2]]);
  }
  bgTop = interpolateColors(loopIn, [0, 1], [bgTop, HOOK[0]]);
  bgBot = interpolateColors(loopIn, [0, 1], [bgBot, HOOK[1]]);

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.26, lead: 0.05 },
    { at: W(0, 7), id: 2568, v: 0.16 }, // bedava etiketi
    { at: W(2, 5), id: 2568, v: 0.14 }, // 128 bin
    { at: W(4, 7), id: 1120, v: 0.2, lead: 0.1 }, // terazi dengelenir
    { at: W(7, 5), id: 2182, v: 0.18 }, // YERİNE ✕
    { at: W(7, 7), id: 1120, v: 0.22, lead: 0.1 }, // YANINDA ✓
    { at: W(8, 10), id: 2568, v: 0.16 }, // yorumlara yaz
  ];

  // ---- 1: kanepe; saat 07:00 → 23:00
  const day = sm(t, W(1, 6), W(1, 8));
  const hour = 7 + 16 * day;
  const think = sm(t, W(1, 3), W(1, 5));

  // ---- 2: insan ızgarası
  const COLS = 12;
  const ROWS = 13;
  const fillP = sm(t, L(2) + 0.1, W(2, 8));
  const people = Math.round(fillP * 128000);

  // ---- 3: göstergeler orta düzeye iner
  const drop = sm(t, W(3, 5) - 0.2, W(3, 7) + 0.3);

  // ---- 4: terazi: ilaç + terapi ağır → dengelenir → hafif ayakkabı tarafı
  const bal = interpolate(t, [L(4), W(4, 6), W(4, 7) + 0.3, W(4, 10) + 0.2], [-12, -12, 0, 3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ---- 5: sağ yarı "depresyon" kelimesinde açılır
  const right5 = sm(t, W(5, 6) - 0.15, W(5, 6) + 0.25);
  const rep5 = 0.5 - 0.5 * Math.cos(t * 3.4);

  // ---- 6: tempo artar (faz = ∫ω)
  const u6 = Math.max(0, t - L(6));
  const ph6 = 0.55 * u6 + 0.45 * u6 * u6;
  const rep6 = 0.5 - 0.5 * Math.cos(ph6 * Math.PI * 2);
  const effect = sm(t, L(6) + 0.2, W(6, 7) + 0.2);

  // ---- 7: yerine değil, yanında
  const push7 = sm(t, W(7, 3), W(7, 5));
  const back7 = sm(t, W(7, 6), W(7, 7) + 0.15);

  // ---- 8: kapı + soru
  const open8 = sm(t, L(8), L(8) + 0.8);
  const ask = sm(t, W(8, 4) - 0.1, W(8, 4) + 0.25);

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="sr-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="sr-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
          <radialGradient id="sr-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff4c2" stopOpacity={0.55} />
            <stop offset="1" stopColor="#fff4c2" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#sr-bg)" />
        <g transform={`translate(540,900) scale(${push}) translate(-540,-900)`}>
          {/* ===== 0: kanca — ilaç kutusu = ayakkabı, üstelik bedava ===== */}
          {s0 > 0 ? (
            <g opacity={s0}>
              <circle cx={780} cy={860} r={300} fill="url(#sr-glow)" opacity={0.6 + 0.4 * Math.sin(th * 2.4)} />
              <PillBox x={290} y={880 + 10 * Math.sin(th * 2)} rot={-6 + 2 * Math.sin(th * 1.6)} />
              <Sneaker x={790} y={920 + 10 * Math.sin(th * 2 + 1.5)} s={1.15} rot={-8 + 2 * Math.sin(th * 1.4)} />
              <g transform={`translate(540,880) scale(${1 + 0.06 * Math.sin(th * 3)})`}>
                <text x={0} y={36} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={150} fill={Y} stroke={INK} strokeWidth={16} paintOrder="stroke">
                  =
                </text>
              </g>
              <BigText a="İLAÇ KADAR" b="ETKİLİ Mİ?" o={1} y={300} size={110} />
              <Tag x={800} y={1160} text="0 ₺" o={end ? 1 : sm(t, W(0, 7) - 0.1, W(0, 7) + 0.25)} color={GREEN} />
              <Chip x={540} y={1330} text="ÜSTELİK BEDAVA" o={end ? 1 : sm(t, W(0, 7) - 0.1, W(0, 7) + 0.25)} bg="#ffffff" fg={INK} size={56} />
            </g>
          ) : null}

          {/* ===== 1: kanepe, saat ilerler, kafa susmaz ===== */}
          {s1 > 0 ? (
            <g opacity={s1}>
              <SkyWindow x={700} y={330} w={260} h={300} night={day} />
              <Clock x={250} y={470} r={120} h={hour % 12} m={(hour * 60) % 60} />
              <Chip x={250} y={660} text={hour < 15 ? "07:00" : "23:00"} o={1} bg={hour < 15 ? "#ffffff" : RED} fg={hour < 15 ? INK : "#ffffff"} size={48} />
              <CouchBack />
              <defs>
                <clipPath id="sr-seat">
                  <rect x={0} y={0} width={1080} height={1200} />
                </clipPath>
              </defs>
              <g clipPath="url(#sr-seat)">
              <Guy
                uid="sr-h1"
                look={HOME_LOOK}
                x={540}
                y={1600}
                s={1.02}
                t={t}
                pose={{ r: { el: [300, 560], wr: [270, 450] }, head: day > 0.5 ? 6 : 3, ly: day > 0.5 ? 4 : 0 }}
                item={day > 0.3 ? <PhoneItem /> : undefined}
                expr={t < W(1, 3) ? "yawn" : day < 0.5 ? "ouch" : "neutral"}
              />
              </g>
              <CouchFront />
              <Scribble x={540} y={520} k={think} t={t} />
            </g>
          ) : null}

          {/* ===== 2: 1.000+ deney, 128.000 kişi ===== */}
          {s2 > 0 ? (
            <g opacity={s2}>
              <BigText a="1.000+ DENEY" b={people.toLocaleString("tr-TR")} o={1} y={260} size={120} />
              <text x={540} y={500} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={52} fill="#ffffff" stroke={INK} strokeWidth={10} paintOrder="stroke" opacity={sm(t, W(2, 7), W(2, 8))}>
                KİŞİ İNCELENDİ
              </text>
              {Array.from({ length: ROWS * COLS }).map((_, i) => {
                const r = Math.floor(i / COLS);
                const c = i % COLS;
                const order = (r * COLS + c) / (ROWS * COLS);
                const o = sm(fillP, order - 0.03, order + 0.02);
                return <Person key={i} x={130 + c * 74} y={620 + r * 66} o={o} c={(r * 7 + c * 3) % 5 === 0 ? Y : "#ffffff"} />;
              })}
              <Chip x={540} y={1500} text="Br J Sports Med · 2023" o={sm(t, L(2) + 0.3, L(2) + 0.6)} bg="#0e3a42" size={36} />
            </g>
          ) : null}

          {/* ===== 3: depresyon ve kaygı orta düzeyde iner ===== */}
          {s3 > 0 ? (
            <g opacity={s3}>
              <Gauge x={300} label="DEPRESYON" v={0.88 - 0.36 * drop} color={interpolateColors(drop, [0, 1], [RED, "#ffb15a"])} />
              <Gauge x={780} label="KAYGI" v={0.84 - 0.34 * drop} color={interpolateColors(drop, [0, 1], [RED, "#ffb15a"])} />
              {[300, 780].map((x) => (
                <g key={x} opacity={drop}>
                  <path d={`M${x + 120},${720} L${x + 120},${880}`} stroke="#ffffff" strokeWidth={14} strokeLinecap="round" />
                  <path d={`M${x + 92},${850} L${x + 120},${890} L${x + 148},${850}`} fill="none" stroke="#ffffff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ))}
              <BigText a="SPOR SONRASI" b="ORTA DÜZEY ↓" o={1} bo={drop} y={240} size={100} />
            </g>
          ) : null}

          {/* ===== 4: terazi — ilaç + terapi ↔ egzersiz ===== */}
          {s4 > 0 ? (
            <g opacity={s4}>
              <Scale
                a={bal}
                left={
                  <g>
                    <PillBox x={-50} y={-100} s={0.45} rot={-4} />
                    <TalkIcon x={70} y={-70} s={0.7} />
                  </g>
                }
                right={<Sneaker x={0} y={-50} s={0.65} rot={-4} />}
              />
              <Chip x={250} y={430} text="İLAÇ + TERAPİ" o={1} bg="#ffffff" fg={INK} size={46} />
              <Chip x={830} y={430} text="EGZERSİZ" o={1} bg={Y} fg={INK} size={46} />
              <BigText a="" b={t < W(4, 8) ? "EŞİT" : "HATTA DAHA İYİ"} o={sm(t, W(4, 7) - 0.1, W(4, 7) + 0.2)} y={170} size={96} />
              <Chip x={540} y={1400} text="2026 çalışması" o={sm(t, L(4) + 0.3, L(4) + 0.6)} bg="#1d2b52" size={36} />
            </g>
          ) : null}

          {/* ===== 5: kaygı = yoga · depresyon = ağırlık + grup ===== */}
          {s5 > 0 ? (
            <g opacity={s5}>
              <rect x={0} y={0} width={540} height={1920} fill="#7b6fd0" opacity={0.55} />
              <rect x={540} y={0} width={540} height={1920} fill="#e0703f" opacity={0.75 * right5} />
              <line x1={540} y1={180} x2={540} y2={1500} stroke="#ffffff" strokeWidth={6} opacity={0.5} />
              {/* sol: nefesle açılan halka + esneme */}
              <circle cx={270} cy={900} r={190 + 40 * Math.sin(t * 1.6)} fill="none" stroke="#ffffff" strokeWidth={6} opacity={0.35} />
              <Mat x={270} w={380} color="#8fe0c8" />
              <Guy
                uid="sr-h5a"
                x={270}
                s={0.68}
                t={t}
                pose={{ r: { el: [330 + 4 * Math.sin(t * 1.6), 250], wr: [372 + 6 * Math.sin(t * 1.6), 150], hand: "open" }, l: { el: [70 - 4 * Math.sin(t * 1.6), 250], wr: [28 - 6 * Math.sin(t * 1.6), 150], hand: "open" } }}
                expr="happy"
              />
              <text x={270} y={300} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={84} fill="#ffffff" stroke={INK} strokeWidth={14} paintOrder="stroke">
                KAYGI
              </text>
              <Chip x={270} y={410} text="YOGA" o={sm(t, W(5, 2) - 0.1, W(5, 2) + 0.2)} bg="#ffffff" fg={INK} size={44} />
              <Chip x={270} y={500} text="HAFİF, KISA" o={sm(t, W(5, 4) - 0.1, W(5, 4) + 0.2)} bg="#ffffff" fg={INK} size={44} />
              {/* sağ: ağırlık + arkadaş */}
              <g opacity={right5}>
                <Guy uid="sr-h5b" x={720} s={0.58} t={t} pose={curl(rep5)} item={DB} expr={rep5 > 0.5 ? "grin" : "smile"} />
                <Guy uid="sr-h5c" look={FRIEND_LOOK} x={930} y={FLOOR - 10} s={0.52} t={t + 0.7} pose={curl(0.5 - 0.5 * Math.cos(t * 3.4 + 0.8))} item={DB} expr="laugh" />
                <text x={810} y={300} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={74} fill="#ffffff" stroke={INK} strokeWidth={14} paintOrder="stroke">
                  DEPRESYON
                </text>
                <Chip x={810} y={410} text="AĞIRLIK" o={sm(t, W(5, 7) - 0.1, W(5, 7) + 0.2)} bg={Y} fg={INK} size={44} />
                <Chip x={810} y={500} text="GRUPLA" o={sm(t, W(5, 9) - 0.1, W(5, 9) + 0.2)} bg={Y} fg={INK} size={44} />
              </g>
              <rect x={0} y={FLOOR} width={1080} height={520} fill="#000" opacity={0.12} />
            </g>
          ) : null}

          {/* ===== 6: terledikçe etki artar ===== */}
          {s6 > 0 ? (
            <g opacity={s6}>
              <Pulse y={500} phase={ph6 * 0.6} amp={70} o={1} />
              <rect x={0} y={FLOOR} width={1080} height={520} fill="#000" opacity={0.12} />
              <Guy uid="sr-h6" x={420} s={0.95} t={t} pose={curl(rep6)} item={DB} expr={rep6 > 0.5 ? "ouch" : "grin"} />
              <Sweat t={t * (1 + u6 * 0.4)} pts={[[350, 700], [490, 690], [420, 660]]} o={sm(t, L(6), W(6, 4))} />
              {/* ETKİ göstergesi */}
              <g>
                <rect x={830} y={720} width={130} height={600} rx={40} fill="#ffffff" fillOpacity={0.9} stroke={INK} strokeWidth={8} />
                <rect x={844} y={734 + 572 * (1 - (0.2 + 0.75 * effect))} width={102} height={572 * (0.2 + 0.75 * effect)} rx={30} fill={GREEN} />
                <text x={895} y={1390} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={48} fill="#ffffff" stroke={INK} strokeWidth={12} paintOrder="stroke">
                  ETKİ
                </text>
              </g>
              <BigText a="TERLEDİKÇE" b="ETKİ ARTAR ↑" o={1} bo={sm(t, W(6, 4) - 0.1, W(6, 4) + 0.2)} y={250} size={100} />
            </g>
          ) : null}

          {/* ===== 7: tedavinin yerine değil, yanında ===== */}
          {s7 > 0 ? (
            <g opacity={s7}>
              <rect x={120} y={1180} width={840} height={36} rx={14} fill="#c98b5a" stroke={INK} strokeWidth={7} />
              {/* ayakkabı ilacı itip yerini alır (✕), sonra ilaç geri gelir, yan yana (✓) */}
              <g opacity={1 - 0.75 * push7 * (1 - back7)}>
                <PillBox x={330 - 300 * push7 * (1 - back7)} y={1040} s={0.8} rot={-30 * push7 * (1 - back7)} />
              </g>
              <Sneaker x={interpolate(back7, [0, 1], [330 + 420 * (1 - push7), 760])} y={1120} s={0.95} />
              <text x={545} y={1080} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={110} fill="#ffffff" stroke={INK} strokeWidth={14} paintOrder="stroke" opacity={back7}>
                +
              </text>
              <BigText a="AĞIR DEPRESYONDA" b="" o={1} y={260} size={96} />
              <g opacity={push7 * (1 - back7)}>
                <Chip x={540} y={520} text="YERİNE" o={1} bg="#ffffff" fg={INK} size={64} />
                <Cross x={540} y={700} s={70} p={sm(t, W(7, 4), W(7, 5) + 0.1)} />
              </g>
              <g opacity={back7}>
                <Chip x={540} y={520} text="YANINDA" o={1} bg={GREEN} size={64} />
                <Check x={540} y={700} s={70} p={sm(t, W(7, 7), W(7, 7) + 0.3)} />
              </g>
            </g>
          ) : null}

          {/* ===== 8: bugün 10 dk yürü + soru ===== */}
          {s8 > 0 ? (
            <g opacity={s8}>
              <Door open={open8} t={t} />
              <rect x={0} y={FLOOR} width={1080} height={520} fill="#7a3a2a" opacity={0.2} />
              <Guy
                uid="sr-h8"
                x={560}
                s={0.82}
                t={t}
                pose={ask > 0.5 ? { r: { el: [300, 520], wr: [300, 430] }, head: Math.sin(t * 2) * 6 } : { r: { el: [320, 470], wr: [330, 380], hand: "thumb" }, head: 4 }}
                expr={ask > 0.5 ? "think" : "smile"}
              />
              <Timer x={880} y={640} p={sm(t, L(8) + 0.2, W(8, 4))} o={sm(t, L(8) + 0.1, L(8) + 0.35) * (1 - ask)} />
              <BigText a="BUGÜN" b="10 DK YÜRÜ" o={1 - ask} y={250} size={110} bColor="#ffffff" />
              <BigText a="SENİ NE" b="RAHATLATIYOR?" o={ask} y={250} size={104} />
              <Chip x={540} y={1470} text="YORUMLARA YAZ" o={sm(t, W(8, 10) - 0.1, W(8, 10) + 0.2)} bg={Y} fg={INK} size={56} />
            </g>
          ) : null}
        </g>
        <rect width={1080} height={1920} fill="url(#sr-vig)" />
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
      <Audio
        src={staticFile("music/623.mp3")}
        volume={(f) => {
          const mt = f / fps;
          const base = interpolate(mt, [0, 0.4], [0.02, 0.04], { extrapolateRight: "clamp" });
          return base * interpolate(mt, [T - 0.6, T], [1, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        }}
      />
    </AbsoluteFill>
  );
};
