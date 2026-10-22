/**
 * "Tabağını değiştir" (~34 sn) — kullanıcının metni (çok az düzeltme: "attın", "salonda döktüğün o ter").
 * Her cümleye tek görüntü: ayna (tek kas çizgisi yok) → 365 GÜN takvim çöpe → program değişir, ağırlık artar → mutfakta
 * cips/kola/poğaça, FELAKET mührü → kasın içi aç, solgun → kasın içinde tuğla tuğla örülen saray (tuğla = protein), tuğla gelmeyince
 * yarım kalır → salondaki ter damlaları boş tabakta kaybolur → dambıla ✕, tabak dolar, saray tamamlanır → "ANTRENMAN mı, TABAK mı?
 * Yorumlara yaz." → döngü (son kare = ilk kare). Metin `icerik/tabagini-degistir.seslendirme.txt`.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import { Cross, Dumbbell } from "./GeceYemek";
import { DB, HeroAt, Plates, Rack, Sweat } from "./BeslenmeSpor";
import { EmptyPlate, Mirror, Pogaca } from "./BeslenmeSpor3";
import { Lunch } from "./BeslenmeSpor4";
import { Chip, FLEX, curl } from "./BeslenmeSpor5";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const GREEN = "#2fbf62";
const FLOOR = 1400;

export const TD_LINES: Line[] = [
  { text: "Her gün salona gidip istikrarla çalışmana rağmen aynada hiçbir değişiklik göremiyorsun, değil mi?", hl: ["hiçbir", "değişiklik"], hold: 0.15 },
  { text: "1 yılını tamamen çöpe attın.", hl: ["1", "yılını", "çöpe"], hold: 0.2 },
  { text: "Suçu hep antrenman programında aradın, daha ağır kaldırdın.", hl: ["programında", "ağır"], hold: 0.1 },
  { text: "Ama kendine söylediğin dev bir yalan var: beslenmen tam bir felaket.", hl: ["yalan", "felaket."], hold: 0.2 },
  { text: "Kasların salonda değil, mutfakta açlıktan ölüyor.", hl: ["mutfakta", "açlıktan"], hold: 0.1 },
  { text: "Yeterli protein almadan, vücuduna tuğla vermeden saray inşa etmeye çalışıyorsun.", hl: ["protein", "tuğla", "saray"], hold: 0.15 },
  { text: "Salonda döktüğün o ter, mutfakta yok olup gidiyor.", hl: ["ter,", "yok"], hold: 0.1 },
  { text: "Artık bahaneleri bırakma zamanı. Ağırlıkları değil, tabağını değiştirmelisin.", hl: ["tabağını", "değiştirmelisin."], hold: 0.2 },
  { text: "Eğer sen de 1 yılını kaybetmek istemiyorsan dürüst ol: sorun antrenmanında mı, tabağında mı? Yorumlara yaz.", hl: ["antrenmanında", "tabağında", "Yorumlara"], hold: 0.6 },
];

export const TD_TAIL = 0.6;
export const TD_TL = timeline(TD_LINES, TD_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of TD_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + TD_TAIL;
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
  const n = words(TD_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (TD_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const out = 1 - sm(t, tl.total - 0.45, tl.total - 0.15);
  if (out <= 0) return null;
  const line = TD_LINES[i];
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

// ------------------------------------------------------------ sahne parçaları

const Ground: React.FC = () => (
  <g>
    <rect x={0} y={FLOOR} width={1080} height={520} fill="#2a2a3a" opacity={0.2} />
    <line x1={0} y1={FLOOR} x2={1080} y2={FLOOR} stroke={INK} strokeWidth={8} opacity={0.5} />
  </g>
);

const BigText: React.FC<{ a: string; b: string; o: number; y?: number; size?: number }> = ({ a, b, o, y = 290, size = 104 }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <text x={540} y={y} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size * 0.82} fill="#ffffff" stroke={INK} strokeWidth={16} paintOrder="stroke">
        {a}
      </text>
      <text x={540} y={y + size * 1.1} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={size} fill={Y} stroke={INK} strokeWidth={18} paintOrder="stroke">
        {b}
      </text>
    </g>
  );

/** aynaya yapıştırılmış HEDEF fotoğrafı: kocaman pazılı kol */
const GoalPhoto: React.FC<{ x: number; y: number; rot?: number; glow?: number }> = ({ x, y, rot = 6, glow = 0 }) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`}>
    {glow > 0 ? <rect x={-140} y={-170} width={280} height={340} rx={24} fill={Y} opacity={0.35 * glow} /> : null}
    <rect x={-120} y={-150} width={240} height={300} rx={14} fill="#ffffff" stroke={INK} strokeWidth={6} />
    <rect x={-104} y={-134} width={208} height={210} rx={8} fill="#cfe7ff" />
    {/* güçlü kol: üst kol + kocaman pazı + ön kol + yumruk */}
    <path d="M-90,40 L10,40" stroke="#d9a07e" strokeWidth={56} strokeLinecap="round" />
    <ellipse cx={-30} cy={14} rx={58} ry={44} fill="#e8b48f" />
    <ellipse cx={-44} cy={0} rx={22} ry={12} fill="#f8d6bd" />
    <path d="M10,40 L44,-60" stroke="#d9a07e" strokeWidth={46} strokeLinecap="round" />
    <circle cx={48} cy={-80} r={30} fill="#e8b48f" />
    <text x={0} y={122} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46} fill={GREEN}>
      HEDEF
    </text>
    <rect x={-40} y={-166} width={80} height={28} rx={4} fill="#f6e7a6" opacity={0.85} transform="rotate(-4)" />
  </g>
);

/** çöp kutusu */
const Bin: React.FC<{ x: number; y: number; lid: number }> = ({ x, y, lid }) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-150,-260 L150,-260 L120,0 L-120,0 Z" fill="#7d8597" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    {[-70, 0, 70].map((dx) => (
      <line key={dx} x1={dx} y1={-220} x2={dx * 0.85} y2={-30} stroke={INK} strokeWidth={6} opacity={0.4} />
    ))}
    <g transform={`translate(-170,-268) rotate(${-35 * lid})`}>
      <rect x={0} y={-26} width={340} height={30} rx={10} fill="#9aa2b3" stroke={INK} strokeWidth={8} />
      <rect x={140} y={-50} width={60} height={26} rx={8} fill="#9aa2b3" stroke={INK} strokeWidth={6} />
    </g>
  </g>
);

/** takvim kartı (1 YIL) */
const YearCard: React.FC<{ x: number; y: number; rot: number; s: number }> = ({ x, y, rot, s }) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-170} y={-200} width={340} height={400} rx={26} fill="#ffffff" stroke={INK} strokeWidth={8} />
    <path d="M-170,-174 Q-170,-200 -144,-200 L144,-200 Q170,-200 170,-174 L170,-110 L-170,-110 Z" fill={RED} stroke={INK} strokeWidth={8} />
    <text x={0} y={-140} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill="#ffffff">
      1 YIL
    </text>
    <text x={0} y={30} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={120} fill={INK}>
      365
    </text>
    <text x={0} y={110} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={48} fill={INK} opacity={0.6}>
      GÜN
    </text>
  </g>
);

/** cips paketi */
const Chips: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-60,-150 L60,-150 L70,0 L-70,0 Z" fill="#ffb02e" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-60,-150 L-50,-170 L50,-170 L60,-150" fill="#ff8a1f" stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={-80} r={34} fill="#ff5a4e" stroke={INK} strokeWidth={5} />
    <text x={0} y={-68} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={28} fill="#ffffff">
      CİPS
    </text>
  </g>
);

/** kola kutusu */
const Soda: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-40} y={-130} width={80} height={130} rx={12} fill="#e03a3a" stroke={INK} strokeWidth={7} />
    <rect x={-34} y={-140} width={68} height={16} rx={6} fill="#c9ced8" stroke={INK} strokeWidth={5} />
    <path d="M-40,-80 Q0,-60 40,-80" fill="none" stroke="#ffffff" strokeWidth={8} />
  </g>
);

/** kasın içi zemini: lif dokusu */
const MuscleBg: React.FC<{ pale: number }> = ({ pale }) => (
  <g>
    <rect x={60} y={420} width={960} height={900} rx={48} fill={interpolateColors(pale, [0, 1], ["#f7c3b4", "#e9dcd8"])} stroke={INK} strokeWidth={8} />
    {Array.from({ length: 8 }).map((_, r) => (
      <path key={r} d={`M80,${480 + r * 110} Q540,${450 + r * 110} 1000,${480 + r * 110}`} fill="none" stroke={interpolateColors(pale, [0, 1], ["#e08a7e", "#cbbab5"])} strokeWidth={6} opacity={0.5} />
    ))}
  </g>
);


// ---------- kasılmış kolun içi: pazı kası tuğla tuğla örülür (tuğla = protein)

const AY = 1080; // üst kol ekseni
const MX0 = 170;
const MX1 = 770;
const MCY = AY - 40; // pazının ekseni
const MH = 175; // tam pazının yarı yüksekliği
const KBW = 44;
const KBH = 30;
/** pazının içindeki tuğla yerleri; ortadan dışa doğru dolar */
const MBRICKS: [number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let r = -6; r <= 6; r++) {
    const y = MCY + r * KBH;
    for (let x = MX0 + 10; x + KBW < MX1 - 10; x += KBW) {
      const xc = x + KBW / 2 + (r % 2 ? KBW / 2 : 0);
      if (xc + KBW / 2 > MX1 - 10) continue;
      const half = MH * Math.sin((Math.PI * (xc - MX0)) / (MX1 - MX0));
      if (Math.abs(y - MCY) + KBH / 2 <= half) out.push([xc - KBW / 2, y - KBH / 2, Math.abs(y - MCY) / half + Math.abs(xc - (MX0 + MX1) / 2) / 1200]);
    }
  }
  return out.sort((a, b) => a[2] - b[2]).map(([x, y]) => [x, y]);
})();

const KBrick: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) => (
  <g opacity={o}>
    <rect x={x + 2} y={y + 2} width={KBW - 4} height={KBH - 4} rx={8} fill="#d9443c" stroke="#7a1f1c" strokeWidth={3} />
    <path d={`M${x + 8},${y + 9} L${x + KBW - 10},${y + 9}`} stroke="#ff9a8c" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
  </g>
);

const BrickArm: React.FC<{ fill: number; t: number; flying: number; src: [number, number]; uid: string }> = ({ fill, t, flying, src, uid }) => {
  const n = Math.floor(fill * MBRICKS.length);
  const T2 = 330;
  const top = AY - T2 / 2;
  const cap = `M40,${top} L${MX1 + 60},${top} A${T2 / 2},${T2 / 2} 0 0 1 ${MX1 + 60},${AY + T2 / 2} L40,${AY + T2 / 2} Z`;
  const target = `M${MX0},${MCY} Q${(MX0 + MX1) / 2},${MCY - 2 * MH} ${MX1},${MCY} Q${(MX0 + MX1) / 2},${MCY + 2 * MH} ${MX0},${MCY} Z`;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-c`}>
          <path d={cap} />
        </clipPath>
      </defs>
      {/* ön kol + yumruk (dışı) */}
      <path d={`M${MX1 + 50},${AY + 20} L${MX1 - 40},${AY - 500}`} stroke="#b8302a" strokeWidth={250} strokeLinecap="round" />
      <path d={`M${MX1 + 50},${AY + 20} L${MX1 - 40},${AY - 500}`} stroke="#e8463c" strokeWidth={236} strokeLinecap="round" />
      <ellipse cx={MX1 - 50} cy={AY - 640} rx={95} ry={104} fill="#f6d3c0" />
      <ellipse cx={MX1 - 78} cy={AY - 672} rx={34} ry={22} fill="#fde4d6" opacity={0.7} />
      {/* üst kol: içi açık */}
      <path d={cap} fill="#f6d3c0" />
      <g clipPath={`url(#${uid}-c)`}>
        <path d={cap} fill="#f2b8a8" transform={`translate(0,0)`} />
        <rect x={60} y={AY + 95} width={MX1 + 40} height={44} rx={22} fill="#efe6d2" stroke="#c9bda2" strokeWidth={4} />
        {/* olması gereken pazı: soluk siluet */}
        <path d={target} fill="#ffffff" fillOpacity={0.35} stroke="#7a1f1c" strokeWidth={4} strokeDasharray="12 10" />
        {MBRICKS.slice(0, n).map(([x, y], i) => (
          <KBrick key={i} x={x} y={y} />
        ))}
      </g>
      <path d={cap} fill="none" stroke={INK} strokeWidth={7} opacity={0.6} />
      {/* uçan tuğlalar: tabaktan sıradaki boşluğa */}
      {flying > 0.01
        ? [0, 1, 2, 3, 4].map((k) => {
            const [tx, ty] = MBRICKS[Math.min(MBRICKS.length - 1, n + k)];
            const u = (((t * 1.3 + k / 5) % 1) + 1) % 1;
            const px = src[0] + (tx - src[0]) * u;
            const py = src[1] + (ty - src[1]) * u - Math.sin(u * Math.PI) * 120;
            return <KBrick key={`f${k}`} x={px} y={py} o={flying * Math.min(1, Math.sin(u * Math.PI) * 3)} />;
          })
        : null}
    </g>
  );
};

// ------------------------------------------------------------ ana kompozisyon

export type TabaginiDegistirProps = { audioName: string; data: VoiceoverData | null };

export const TabaginiDegistir: React.FC<TabaginiDegistirProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : TD_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, 0.18);
  const loopIn = sm(t, T - 0.24, T - 0.03);
  const end = t > L(8);
  // her satırda yavaş yaklaşma (hiçbir kare durmasın)
  const li = Math.max(0, tl.idx(t));
  const push = end && t > T - 0.3 ? 1 : 1 + 0.06 * Math.min(1, Math.max(0, (t - L(li)) / Math.max(0.5, L(li + 1) - L(li))));
  const rep = 0.5 - 0.5 * Math.cos((end ? t - T : t) * 4.2);

  const s0 = Math.max(scene(0, 1), loopIn);
  const mirrorAt = W(0, 7); // "aynada"
  const hookA = end ? loopIn : 1 - sm(t, mirrorAt - 0.2, mirrorAt);
  const hookB = end ? 0 : sm(t, mirrorAt - 0.05, mirrorAt + 0.15);
  const flexNow = !end && t > mirrorAt - 0.1;
  const s1 = scene(1, 2);
  const s2 = scene(2, 3);
  const s3 = scene(3, 4);
  const s4 = scene(4, 5);
  const s5 = scene(5, 6);
  const s6 = scene(6, 7);
  const s7 = scene(7, 8);
  const s8 = win(t, L(8) - 0.02, T - 0.25, 0.18);

  // saray: 5'te az tuğla gelir, yarım kalır; 7'de tabak değişince tamamlanır
  const fill5 = 0.22 * sm(t, W(5, 0), W(5, 6));
  const fill7 = 0.22 + 0.78 * sm(t, W(7, 6), W(7, 7) + 0.9);

  const GYM: [string, string] = ["#5b6b8f", "#3f4b6c"];
  const INSIDE: [string, string] = ["#1b2a4e", "#0e1630"];
  const KITCHEN: [string, string] = ["#e8d9c4", "#cdb89c"];
  const bgAt: [number, string, string][] = [
    [0, ...GYM],
    [L(1), "#3a3550", "#211d33"],
    [L(2), ...GYM],
    [L(3), ...KITCHEN],
    [L(4), ...INSIDE],
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
  bgTop = interpolateColors(loopIn, [0, 1], [bgTop, GYM[0]]);
  bgBot = interpolateColors(loopIn, [0, 1], [bgBot, GYM[1]]);

  // ter damlalarının tabağa düştüğü anlar (damla döngüsü: t*0.6 + k/5, u≈0.9'da tabağa iner)
  const drips: number[] = [];
  for (let m = 0; m < 400; m += 2) {
    const d = (m / 5 + 0.9) / 0.6;
    if (d > L(6) + 0.3 && d < L(7) - 0.3) drips.push(d);
  }
  // Gerçek nesne sesleri, olay anında ve kısık (UI tıkı / bas vuruş tekrarı yok)
  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number; fin?: number }[] = [
    { at: 0, id: 2299, v: 0.26, lead: 0.05 }, // kanca: tek bas vuruş
    { at: W(0, 10) - 0.03, id: 490, v: 0.3 }, // "değişiklik": tek kalp atışı
    { at: W(1, 4) - 0.1, id: 2996, v: 0.22, lead: 0.1 }, // takvim buruşup çöpe
    ...[0, 1, 2].map((k) => ({ at: L(2) + 0.15 + k * 0.45, id: 2998, v: 0.2, dur: 0.4, fade: 0.1 })), // program A/B/C kalemle çizilir
    { at: L(3) + 0.35, id: 116, v: 0.12 }, // mutfak: kola kutusu açılır
    { at: W(3, 10) - 0.05, id: 2182, v: 0.24 }, // FELAKET mührü
    { at: L(4) + 0.05, id: 1143, v: 0.22, lead: 0.14, dur: 1.4, fade: 0.7 }, // kolun içi
    { at: W(4, 4) - 0.05, id: 498, v: 0.16, lead: 0.05, dur: 1.2, fade: 0.5 }, // KAS ERİYOR: derin, yavaş vuruş
    ...drips.map((d) => ({ at: d, id: 3179, v: 0.3, dur: 0.5, fade: 0.2 })), // ter tabağa damlar
    { at: L(7) + 0.1, id: 2933, v: 0.2 }, // dolu tabak masaya konur
    { at: W(7, 6), id: 388, v: 0.08, lead: 0.07, dur: 1.2, fade: 0.5 }, // tuğlalar dökülür
    { at: W(7, 7), id: 1120, v: 0.28, lead: 0.1 }, // kas tamam
    { at: W(8, 14), id: 2568, v: 0.18 }, // yorumlara yaz
  ];
  const duck = (mt: number) => 1 - 0.35 * win(mt, L(3), L(4) + 0.3, 0.3);

  const mirrorFlex = { l: { el: [60, 440] as [number, number], wr: [82, 318] as [number, number], hand: "fist" as const }, head: -4, lx: -6, ly: -2 };

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="td-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="td-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#td-bg)" />
        <g transform={`translate(540,900) scale(${push}) translate(-540,-900)`}>

        {/* ===== 0: ayna — tek kas çizgisi yok ===== */}
        {s0 > 0 ? (
          <g opacity={s0}>
            <Ground />
            <Mirror x={600} y={560} w={400} h={820} uid="td-m">
              <HeroAt uid="td-mr" x={760} y={1430} s={0.9} t={t} pose={flexNow ? { l: { el: [60, 440], wr: [82, 318], hand: "fist" }, head: -4, lx: -6, ly: -2 } : { l: { el: [102, 530], wr: [94 + 20 * rep, 690 - 270 * rep] }, head: 2 }} expr={flexNow ? "ouch" : rep > 0.5 ? "ouch" : "neutral"} />
              <rect x={600} y={560} width={400} height={820} fill="#bcd3e8" opacity={0.25} />
            </Mirror>
            <g transform="translate(930,650) scale(0.75) translate(-930,-650)"><GoalPhoto x={930} y={650} glow={flexNow ? sm(t, mirrorAt, mirrorAt + 0.4) * (0.6 + 0.4 * Math.sin(t * 5)) : 0} /></g>
            <HeroAt uid="td-h0" x={300} s={1} t={t} pose={flexNow ? FLEX : curl(rep)} item={flexNow ? undefined : DB} expr={flexNow ? "ouch" : rep > 0.5 ? "ouch" : "neutral"} />
            {!flexNow ? <Sweat t={t} pts={[[230, 700], [370, 690]]} /> : null}
            <BigText a="12 AY ANTRENMAN" b="SONUÇ: SIFIR" o={hookA} y={260} size={100} />
            <BigText a="HEDEF BU…" b="AYNADAKİ BU" o={hookB} y={260} size={100} />
            <Chip x={300} y={560} text="HİÇ DEĞİŞMEDİ" o={hookB * sm(t, W(0, 10) - 0.1, W(0, 10) + 0.2)} bg={RED} size={46} />
          </g>
        ) : null}

        {/* ===== 1: 1 yıl çöpe ===== */}
        {s1 > 0 ? (
          <g opacity={s1}>
            {(() => {
              const drop = sm(t, W(1, 2), W(1, 4) + 0.2);
              return (
                <g>
                  <Bin x={540} y={1380} lid={sm(t, L(1), W(1, 2)) * (1 - sm(t, W(1, 4) + 0.1, W(1, 4) + 0.4))} />
                  <g opacity={1 - sm(t, W(1, 4), W(1, 4) + 0.2)}>
                    <YearCard x={540} y={620 + 600 * drop * drop} rot={-8 + 40 * drop} s={1 - 0.45 * drop} />
                  </g>
                  <BigText a="1 YIL" b="ÇÖPE GİTTİ" o={sm(t, W(1, 4) - 0.1, W(1, 4) + 0.2)} y={330} />
                </g>
              );
            })()}
          </g>
        ) : null}

        {/* ===== 2: program değişir, ağırlık artar ===== */}
        {s2 > 0 ? (
          <g opacity={s2}>
            <Ground />
            <Rack x={600} y={700} />
            <Plates x={160} />
            <HeroAt uid="td-h2" x={420} s={1} t={t} pose={curl(rep)} item={DB} expr={rep > 0.5 ? "ouch" : "neutral"} />
            <Sweat t={t} pts={[[350, 700], [490, 690]]} />
            {["PROGRAM A", "PROGRAM B", "PROGRAM C"].map((p, k) => {
              const at = L(2) + 0.15 + k * 0.45;
              return (
                <g key={p} opacity={sm(t, at, at + 0.2)}>
                  <Chip x={250} y={300 + k * 110} text={p} o={1} bg="#ffffff" fg={INK} size={44} />
                  <line x1={110} y1={300 + k * 110} x2={390} y2={300 + k * 110} stroke={RED} strokeWidth={8} strokeLinecap="round" opacity={sm(t, at + 0.25, at + 0.4)} />
                </g>
              );
            })}
            {(() => {
              const kg = 20 + 10 * Math.min(3, Math.floor(interpolate(t, [W(2, 5), W(2, 7) + 0.3], [0, 3.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
              return <Chip x={810} y={420} text={`${kg} KG`} o={sm(t, W(2, 5) - 0.1, W(2, 5) + 0.2)} bg={Y} fg={INK} size={70} />;
            })()}
          </g>
        ) : null}

        {/* ===== 3: mutfak — beslenme felaket ===== */}
        {s3 > 0 ? (
          <g opacity={s3}>
            <rect x={70} y={1060} width={940} height={40} rx={14} fill="#c98b5a" stroke={INK} strokeWidth={7} />
            <rect x={120} y={1100} width={30} height={300} fill="#a86e44" stroke={INK} strokeWidth={6} />
            <rect x={930} y={1100} width={30} height={300} fill="#a86e44" stroke={INK} strokeWidth={6} />
            <g opacity={sm(t, L(3), L(3) + 0.3)}>
              <Chips x={470} y={1060} />
              <Soda x={650} y={1060} />
              <g transform="translate(850,1040) scale(1.3) translate(-850,-1040)">
                <EmptyPlate x={850} y={1040} />
              </g>
            </g>
            <HeroAt uid="td-h3" x={210} y={1400} s={0.95} t={t} pose={{ r: { el: [300, 560], wr: [262, 420 + 12 * Math.sin(t * 6)] }, head: 3 }} item={<g transform="translate(0,-30) scale(0.55)"><Pogaca x={0} y={0} /></g>} expr="chew" />
            <BigText a="DEV BİR" b="YALAN" o={sm(t, W(3, 3) - 0.1, W(3, 3) + 0.2) * (1 - sm(t, W(3, 7) - 0.2, W(3, 7)))} y={330} />
            {(() => {
              const p = sm(t, W(3, 10) - 0.08, W(3, 10) + 0.25);
              return p > 0 ? (
                <g opacity={p} transform={`translate(540,640) rotate(-8) scale(${1.15 - 0.15 * p})`}>
                  <rect x={-330} y={-100} width={660} height={200} rx={28} fill="#ffffff" fillOpacity={0.55} stroke={RED} strokeWidth={16} />
                  <text x={0} y={38} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={120} fill={RED} letterSpacing={6}>
                    FELAKET
                  </text>
                </g>
              ) : null;
            })()}
          </g>
        ) : null}

        {/* ===== 4: kasın içi — açlıktan ölüyor ===== */}
        {s4 > 0 ? (
          <g opacity={s4}>
            <Chip x={340} y={230} text="KASININ İÇİ" o={1} bg="#ffffff" fg={INK} size={56} />
            {/* kas açlıktan erir: tuğlalar teker teker kaybolur */}
            <g transform="translate(470,1000) scale(1.12) translate(-470,-1000)">
              <BrickArm uid="td-ba4" fill={0.34 - 0.26 * sm(t, W(4, 3), W(4, 5) + 0.4)} t={t} flying={0} src={[230, 520]} />
            </g>
            <circle cx={230} cy={520} r={110} fill="#ffffff" stroke={INK} strokeWidth={7} />
            <g transform="translate(230,520) scale(1.25)">
              <EmptyPlate x={0} y={10} />
            </g>
            <Cross x={230} y={520} s={40} p={sm(t, W(4, 3) - 0.1, W(4, 3) + 0.3)} />
            <Chip x={230} y={670} text="MUTFAK" o={1} bg={RED} size={40} />
            <Chip x={470} y={1370} text="KAS ERİYOR" o={sm(t, W(4, 4) - 0.1, W(4, 4) + 0.2)} bg={RED} size={56} />
          </g>
        ) : null}

        {/* ===== 5 ve 7: kasın içinde tuğla saray ===== */}
        {Math.max(s5, s7) > 0 ? (
          <g opacity={Math.max(s5, s7)}>
            <Chip x={340} y={230} text={s7 > s5 ? "TABAK DEĞİŞTİ" : "TUĞLA = PROTEİN"} o={1} bg={s7 > s5 ? GREEN : Y} fg={s7 > s5 ? "#ffffff" : INK} size={56} />
            <g transform="translate(470,1000) scale(1.12) translate(-470,-1000)">
            <BrickArm uid="td-ba" fill={s7 > s5 ? fill7 : fill5} t={t} flying={s7 > s5 ? sm(t, W(7, 6), W(7, 6) + 0.2) * (1 - sm(t, W(7, 7) + 0.8, W(7, 7) + 1.0)) : 0.3 * (1 - sm(t, W(5, 7), W(5, 9)))} src={[230, 520]} />
            </g>
            {/* tuğlanın geldiği tabak */}
            <circle cx={230} cy={520} r={110} fill="#ffffff" stroke={INK} strokeWidth={7} />
            <g transform="translate(230,520) scale(0.95)">{s7 > s5 ? <Lunch x={0} y={0} /> : <Pogaca x={0} y={0} />}</g>
            <Chip x={230} y={670} text={s7 > s5 ? "PROTEİN" : "POĞAÇA"} o={1} bg={s7 > s5 ? GREEN : RED} size={40} />
            <Chip x={470} y={1370} text={s7 > s5 ? "KAS TAMAMLANDI" : "KAS YARIM KALDI"} o={s7 > s5 ? sm(t, W(7, 7) + 0.5, W(7, 7) + 0.8) : sm(t, W(5, 7) - 0.1, W(5, 7) + 0.2)} bg={s7 > s5 ? GREEN : RED} size={54} />
            {s7 > s5 ? (
              <g opacity={sm(t, L(7), L(7) + 0.3) * (1 - sm(t, W(7, 6) - 0.2, W(7, 6)))}>
                <g transform="translate(560,600)">
                  <circle r={120} fill="#ffffff" fillOpacity={0.9} stroke={INK} strokeWidth={6} />
                  <Dumbbell x={0} y={0} s={1.0} rot={-10} />
                </g>
                <Cross x={560} y={600} s={70} p={sm(t, W(7, 4), W(7, 5))} />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ===== 6: ter mutfakta yok olur ===== */}
        {s6 > 0 ? (
          <g opacity={s6}>
            <Ground />
            <HeroAt uid="td-h6" x={260} s={0.9} t={t} pose={curl(rep)} item={DB} expr="ouch" />
            <Sweat t={t} pts={[[210, 740], [320, 730]]} />
            <path d="M340,700 C520,520 760,560 820,980" fill="none" stroke="#9fd8ff" strokeWidth={6} strokeDasharray="14 14" strokeDashoffset={-t * 40} opacity={0.6} />
            {[0, 1, 2, 3, 4].map((k) => {
              const u = (((t * 0.6 + k / 5) % 1) + 1) % 1;
              const x = (1 - u) ** 3 * 340 + 3 * (1 - u) ** 2 * u * 520 + 3 * (1 - u) * u * u * 760 + u ** 3 * 820;
              const y = (1 - u) ** 3 * 700 + 3 * (1 - u) ** 2 * u * 520 + 3 * (1 - u) * u * u * 560 + u ** 3 * 980;
              return <path key={k} d={`M${x},${y - 22} Q${x + 16},${y} ${x},${y + 10} Q${x - 16},${y} ${x},${y - 22} Z`} fill="#9fd8ff" stroke={INK} strokeWidth={3} opacity={Math.sin(u * Math.PI) * (u > 0.85 ? (1 - u) * 6 : 1)} />;
            })}
            <rect x={640} y={1030} width={380} height={30} rx={12} fill="#c98b5a" stroke={INK} strokeWidth={7} />
            <g transform="translate(820,1010) scale(1.3) translate(-820,-1010)">
              <EmptyPlate x={820} y={1010} />
            </g>
            <Chip x={260} y={420} text="SALON" o={1} bg="#ffffff" fg={INK} size={48} />
            <Chip x={820} y={420} text="MUTFAK" o={1} bg="#ffffff" fg={INK} size={48} />
            <Chip x={820} y={1180} text="YOK OLDU" o={sm(t, W(6, 5) - 0.1, W(6, 5) + 0.2)} bg={RED} size={50} />
          </g>
        ) : null}

        {/* ===== 8: sorun antrenmanında mı, tabağında mı? ===== */}
        {s8 > 0 ? (
          <g opacity={s8}>
            <Ground />
            <BigText a="DÜRÜST OL:" b="SORUN NEREDE?" o={sm(t, L(8) + 0.05, L(8) + 0.35)} y={290} size={96} />
            {[
              { x: 290, label: "ANTRENMAN", k: 10, icon: <Dumbbell x={0} y={0} s={1.1} rot={-15} /> },
              { x: 790, label: "TABAK", k: 12, icon: <g transform="scale(1.1)"><Lunch x={0} y={0} /></g> },
            ].map(({ x, label, k, icon }) => {
              const on = sm(t, W(8, k) - 0.1, W(8, k) + 0.2);
              return (
                <g key={label} opacity={0.35 + 0.65 * on} transform={`translate(${x},790) scale(${1 + 0.03 * on * Math.sin(t * 4 + x)}) translate(${-x},-790)`}>
                  <rect x={x - 220} y={560} width={440} height={460} rx={40} fill="#ffffff" stroke={INK} strokeWidth={8} />
                  <g transform={`translate(${x},740)`}>{icon}</g>
                  <text x={x} y={960} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={58} fill={INK}>
                    {label}
                  </text>
                </g>
              );
            })}
            <text x={540} y={830} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={70} fill="#ffffff" stroke={INK} strokeWidth={12} paintOrder="stroke">
              mı?
            </text>
            <Chip x={540} y={1090} text="YORUMLARA YAZ" o={sm(t, W(8, 14) - 0.1, W(8, 14) + 0.2)} bg={Y} fg={INK} size={60} />
            {/* düşünen genç: bir karta bir ötekine bakar */}
            <HeroAt uid="td-h8" x={540} y={1560} s={0.44} t={t} pose={{ r: { el: [300, 520], wr: [300, 430] }, head: Math.sin(t * 2.2) * 8, lx: Math.sin(t * 2.2) * 8 }} expr="think" />
          </g>
        ) : null}

        </g>
        <rect width={1080} height={1920} fill="url(#td-vig)" />
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
