/**
 * "Göbek yağı için yaptığın en büyük hata" (~38 sn) — kullanıcının metni hikâyeleştirildi: önce acı (her gece yüzlerce mekik,
 * aynada göbek hâlâ orada), sonra bilim (karnın içi: üstte yağ, altta kas; mekik kası şişirir, yağa dokunmaz; yağ tüm vücuttan
 * yakılır; bölgesel yağ yakımı mit; sırayı genetik belirler), en son tavsiye (kuvvet, beslenme, sabır → göbek gider) ve döngü:
 * son cümle "Çünkü bu…" ile biter, video kancayla ("Göbek yağı için yaptığın en büyük hata") baştan başlar; son kare = ilk kare.
 * Bora (`CurlyGuy`) spor yapmaz (kullanıcı isteği); mekik takvimde/sayıda, kasın şişmesi kesit animasyonunda gösterilir.
 * Metin `icerik/gobek-yagi.seslendirme.txt` (kelime sayıları satır satır aynı olmalı). Ses yoksa zamanlar okuma hızından (sessiz taslak).
 */
import { AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import { CurlyGuy, type CurlyExpr, type CurlyPose } from "../avatar/CurlyGuy";
import { Apple, Check, Cross, Dumbbell, Flame, Floor, PhoneItem, Pill, Txt, Window } from "./GeceYemek";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const FLOOR = 1400;

export const GY_LINES: Line[] = [
  { text: "Göbek yağı için yaptığın en büyük hata…", hl: ["en", "büyük", "hata…"], hold: 0.3 },
  { text: "Her gece yüzlerce mekik. Haftalarca.", hl: ["yüzlerce", "Haftalarca."], hold: 0.2 },
  { text: "Aynaya bakıyorsun… göbek hâlâ orada.", hl: ["hâlâ", "orada."], hold: 0.5 },
  { text: "Suç sende değil. Sana yanlış anlatıldı.", hl: ["değil.", "yanlış"], hold: 0.3 },
  { text: "Karnında iki kat var: üstte yağ, altta kas.", hl: ["yağ,", "kas."], hold: 0.2 },
  { text: "Mekik çekince kas çalışır, güçlenir. Ama üstündeki yağa dokunmaz.", hl: ["güçlenir.", "dokunmaz."], hold: 0.4 },
  { text: "Çünkü vücut yağı tek bir yerden değil, her yerden yakar.", hl: ["her", "yerden", "yakar."], hold: 0.2 },
  { text: "Bölgesel yağ yakımı tamamen bir mit.", hl: ["mit."], hold: 0.5 },
  { text: "Yağın önce nereden gideceğine genetik karar verir. Ne kadar gideceğine ise sen.", hl: ["genetik", "sen."], hold: 0.3 },
  { text: "Kuvvet antrenmanı, doğru beslenme ve sabır.", hl: ["Kuvvet", "beslenme", "sabır."], hold: 0.3 },
  { text: "Genel yağ oranın düştükçe, o inatçı göbek de sonunda gider.", hl: ["düştükçe,", "gider."], hold: 0.3 },
  { text: "Bunu hâlâ mekikle göbek eritmeye çalışan birine gönder. Çünkü bu…", hl: ["gönder."], hold: 0 },
];

/** ekrandaki büyük yazıyla aynı olduğu için altyazısı gösterilmeyen satır (kanca) */
const NO_CAPTION = [0];

/** döngü: son cümleden sonra kısa bekleme, sonra kanca karesine yumuşak geçiş (son kare = ilk kare) */
export const GY_TAIL = 0.5;
export const GY_TL = timeline(GY_LINES, GY_TAIL);

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

/** seslendirmeden zaman çizelgesi: her satır ilk kelimesinin başladığı anda başlar */
const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of GY_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + GY_TAIL;
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
  const n = words(GY_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (GY_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0 || NO_CAPTION.includes(i)) return null;
  // döngü geçişinde son satır kanca karesiyle birlikte söner
  const out = 1 - sm(t, tl.total - 0.45, tl.total - 0.15);
  if (out <= 0) return null;
  const line = GY_LINES[i];
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
              color: hl.includes(norm(w)) ? Y : "#ffffff",
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

// ------------------------------------------------------------ Bora

const blinkAt = (t: number) => ((t % 3.5) / 3.5 > 0.96 ? 1 : 0);

/** Bora: ayak ortası (x, y), s ölçek (~880 birim boy) */
const BoraAt: React.FC<{ x: number; y?: number; s: number; pose?: CurlyPose; expr?: CurlyExpr; t: number; uid: string; item?: React.ReactNode; belly?: number }> = ({
  x,
  y = FLOOR,
  s,
  pose,
  expr,
  t,
  uid,
  item,
  belly,
}) => (
  <g transform={`translate(${x},${y}) scale(${s}) translate(-200,-880)`}>
    <CurlyGuy id={uid} pose={pose} expr={expr} t={t} item={item} blink={blinkAt(t + x)} belly={belly} />
  </g>
);

/** eller göbekte (kanca + ayna) */
const HANDS_ON_BELLY: CurlyPose = {
  r: { el: [300, 520], wr: [250, 590], hand: "open", handRot: -20 },
  l: { el: [100, 520], wr: [150, 590], hand: "open", handRot: 20 },
  head: 4,
  ly: 6,
};

// ------------------------------------------------------------ sahne parçaları

/** yerdeki minder (Bora üstünde spor yapmaz; sadece "her gece mekik" hikâyesinin eşyası) */
const Mat: React.FC = () => (
  <g>
    <path d={`M600,${FLOOR + 18} L1000,${FLOOR + 18} L1050,${FLOOR + 92} L560,${FLOOR + 92} Z`} fill="#8a74d6" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d={`M610,${FLOOR + 40} L1010,${FLOOR + 40}`} stroke="#ffffff" strokeWidth={4} opacity={0.3} />
    {/* rulo ucu */}
    <ellipse cx={1010} cy={FLOOR + 55} rx={26} ry={40} fill="#6f5bc0" stroke={INK} strokeWidth={6} />
    <ellipse cx={1010} cy={FLOOR + 55} rx={10} ry={16} fill="none" stroke={INK} strokeWidth={4} />
  </g>
);

/** duvar takvimi: günler sırayla "100" ile işaretlenir */
const Calendar: React.FC<{ x: number; y: number; p: number; o: number }> = ({ x, y, p, o }) => {
  const cols = 7;
  const rows = 4;
  const cw = 62;
  const ch = 66;
  const w = cols * cw + 40;
  const h = rows * ch + 140;
  const n = Math.floor(p * cols * rows + 0.0001);
  return (
    <g opacity={o}>
      <rect x={x} y={y} width={w} height={h} rx={22} fill="#ffffff" stroke={INK} strokeWidth={7} />
      <path d={`M${x},${y + 22} Q${x},${y} ${x + 22},${y} L${x + w - 22},${y} Q${x + w},${y} ${x + w},${y + 22} L${x + w},${y + 90} L${x},${y + 90} Z`} fill={RED} stroke={INK} strokeWidth={7} />
      <text x={x + w / 2} y={y + 64} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46} fill="#fff" letterSpacing={2}>
        MEKİK
      </text>
      {[0.25, 0.75].map((k) => (
        <rect key={k} x={x + w * k - 8} y={y - 22} width={16} height={40} rx={8} fill="#8b93a6" stroke={INK} strokeWidth={5} />
      ))}
      {Array.from({ length: cols * rows }).map((_, i) => {
        const cx = x + 20 + (i % cols) * cw;
        const cy = y + 110 + Math.floor(i / cols) * ch;
        const on = i < n;
        return (
          <g key={i}>
            <rect x={cx + 4} y={cy + 4} width={cw - 8} height={ch - 8} rx={8} fill={on ? "#ffe3df" : "#f3f1ee"} />
            {on ? (
              <text x={cx + cw / 2} y={cy + ch / 2 + 9} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={RED}>
                100
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/** boy aynası; içindeki yansıma kırpılır */
const Mirror: React.FC<{ x: number; y: number; w: number; h: number; uid: string; children: React.ReactNode }> = ({ x, y, w, h, uid, children }) => (
  <g>
    <defs>
      <clipPath id={`${uid}-clip`}>
        <rect x={x} y={y} width={w} height={h} rx={w / 2} />
      </clipPath>
      <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e9f3fb" />
        <stop offset="1" stopColor="#b9cfe2" />
      </linearGradient>
    </defs>
    <rect x={x - 22} y={y - 22} width={w + 44} height={h + 44} rx={w / 2 + 22} fill="#b77a4a" stroke={INK} strokeWidth={8} />
    <rect x={x} y={y} width={w} height={h} rx={w / 2} fill={`url(#${uid}-glass)`} stroke={INK} strokeWidth={6} />
    <g clipPath={`url(#${uid}-clip)`}>
      {children}
      <path d={`M${x + w * 0.15},${y + h * 0.35} L${x + w * 0.45},${y + h * 0.12}`} stroke="#ffffff" strokeWidth={22} strokeLinecap="round" opacity={0.35} />
      <path d={`M${x + w * 0.18},${y + h * 0.45} L${x + w * 0.38},${y + h * 0.3}`} stroke="#ffffff" strokeWidth={10} strokeLinecap="round" opacity={0.3} />
    </g>
  </g>
);

/** gündüz penceresi (sabah: güneş, bulut) */
const DayWindow: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={14} fill="#a8dcff" stroke={INK} strokeWidth={8} />
    <circle cx={x + w * 0.68} cy={y + h * 0.36} r={Math.min(w, h) * 0.17} fill={Y} stroke={INK} strokeWidth={6} />
    <ellipse cx={x + w * 0.3} cy={y + h * 0.72} rx={50} ry={20} fill="#ffffff" />
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={INK} strokeWidth={7} />
    <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={INK} strokeWidth={7} />
  </g>
);

// ---------- karnın kesiti: üstte deri, ortada yağ hücreleri, altta kas lifleri

const SEC = { x: 90, y: 230, w: 900, h: 900, skin: 300, fat: 700 };

const FAT_CELLS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 11; c++) out.push([110 + c * 92 + (r % 2 ? 46 : 0), 345 + r * 78]);
  }
  return out;
})();

const Section: React.FC<{ t: number; work: number; pump: number; fatHl: number }> = ({ t, work, pump, fatHl }) => {
  // mekikte kas kasılıp gevşer (work), sonra kalıcı olarak dolgunlaşır (pump); yağ hücreleri hiç küçülmez
  const c = work * (0.5 + 0.5 * Math.sin(t * 9));
  const lift = 18 * pump + 10 * c; // kas yukarı doğru kabarır, yağ katmanı biraz itilir
  return (
    <g>
      <defs>
        <clipPath id="gy-sec">
          <rect x={SEC.x} y={SEC.y} width={SEC.w} height={SEC.h} rx={48} />
        </clipPath>
      </defs>
      <g clipPath="url(#gy-sec)">
        {/* yağ katmanı */}
        <rect x={SEC.x} y={SEC.y} width={SEC.w} height={SEC.h} fill="#ffeeb8" />
        <g transform={`translate(0,${-lift * 0.6})`}>
          {FAT_CELLS.map(([x, y], i) => {
            const r = 40 + Math.sin(t * 2 + i) * 1.2;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={r} fill="#ffd766" stroke="#d99a1e" strokeWidth={5} />
                <circle cx={x - 12} cy={y - 13} r={9} fill="#fff6cf" opacity={0.8} />
              </g>
            );
          })}
        </g>
        {/* kas katmanı */}
        <g transform={`translate(0,${-lift})`}>
          <rect x={SEC.x} y={SEC.fat} width={SEC.w} height={SEC.y + SEC.h - SEC.fat + 60} fill={interpolateColors(pump, [0, 1], ["#a8342e", "#c22e2a"])} />
          <line x1={SEC.x} y1={SEC.fat} x2={SEC.x + SEC.w} y2={SEC.fat} stroke="#f2f0e8" strokeWidth={10} opacity={0.9} />
          {Array.from({ length: 6 }).map((_, r) =>
            [0, 1, 2, 3].map((k) => {
              const cx = SEC.x + 40 + k * 290 - (r % 2 ? 145 : 0);
              const cy = SEC.fat + 48 + r * 78;
              const rx = 140 * (1 - 0.08 * c);
              const ry = 30 * (1 + 0.18 * c + 0.28 * pump);
              return (
                <g key={`${r}-${k}`}>
                  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={interpolateColors(pump + c * 0.4, [0, 1], ["#e05a50", "#ff6a5a"])} stroke="#8a2420" strokeWidth={4} />
                  <path d={`M${cx - rx * 0.7},${cy - ry * 0.3} Q${cx},${cy - ry * 0.8} ${cx + rx * 0.7},${cy - ry * 0.3}`} fill="none" stroke="#ffb3a8" strokeWidth={5} opacity={0.7} strokeLinecap="round" />
                  {[-0.4, 0, 0.4].map((s) => (
                    <line key={s} x1={cx + rx * s} y1={cy - ry * 0.75} x2={cx + rx * s} y2={cy + ry * 0.75} stroke="#8a2420" strokeWidth={2.5} opacity={0.35} />
                  ))}
                </g>
              );
            }),
          )}
          {/* güçlenen kas: hafif parıltı */}
          <rect x={SEC.x} y={SEC.fat} width={SEC.w} height={SEC.h} fill="#ffdd88" opacity={0.12 * pump + 0.1 * c} />
        </g>
        {/* deri */}
        <rect x={SEC.x} y={SEC.y} width={SEC.w} height={SEC.skin - SEC.y} fill="#f6d3c0" />
        <line x1={SEC.x} y1={SEC.skin} x2={SEC.x + SEC.w} y2={SEC.skin} stroke="#e2ad97" strokeWidth={8} />
        {/* yağ katmanı vurgusu: kesik çizgili çerçeve */}
        {fatHl > 0 ? (
          <rect
            x={SEC.x + 14}
            y={SEC.skin + 12}
            width={SEC.w - 28}
            height={SEC.fat - SEC.skin - lift - 24}
            rx={30}
            fill="none"
            stroke={INK}
            strokeWidth={8}
            strokeDasharray="26 18"
            strokeDashoffset={-t * 40}
            opacity={fatHl}
          />
        ) : null}
      </g>
      <rect x={SEC.x} y={SEC.y} width={SEC.w} height={SEC.h} rx={48} fill="none" stroke={INK} strokeWidth={9} />
    </g>
  );
};

// ---------- vücut silueti: yağ bölgeleri + kana karışan yağ damlaları

type Zone = { c: [number, number]; dots: [number, number][] };
const ZONES: Zone[] = [
  { c: [400, 640], dots: [[408, 590], [392, 640], [380, 690]] }, // sol kol
  { c: [680, 640], dots: [[672, 590], [688, 640], [700, 690]] }, // sağ kol
  { c: [540, 400], dots: [[500, 410], [580, 410], [540, 445]] }, // yüz
  { c: [495, 990], dots: [[492, 940], [494, 995], [497, 1050]] }, // sol bacak
  { c: [585, 990], dots: [[588, 940], [586, 995], [583, 1050]] }, // sağ bacak
  { c: [540, 750], dots: [[500, 715], [540, 700], [580, 715], [505, 765], [575, 765], [540, 805], [540, 752]] }, // göbek
];
const HEART: [number, number] = [540, 560];
const Z_ARM_L = 0;
const Z_ARM_R = 1;
const Z_FACE = 2;
const Z_LEG_L = 3;
const Z_BELLY = 5;

const Drop: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => (
  <path d={`M${x},${y - 16} Q${x + 12},${y} ${x},${y + 8} Q${x - 12},${y} ${x},${y - 16} Z`} fill="#ffc533" stroke={INK} strokeWidth={3} opacity={o} />
);

const Body: React.FC<{ t: number; fat: number[]; flow: number[]; glow?: number[]; flame: number }> = ({ t, fat, flow, glow = [], flame }) => {
  const limbs: [string, number][] = [
    ["M440,510 L390,700 L372,880", 58],
    ["M640,510 L690,700 L708,880", 58],
    ["M492,870 L486,1080 L482,1290", 74],
    ["M588,870 L594,1080 L598,1290", 74],
    ["M540,420 L540,500", 50],
  ];
  const torso = "M430,500 Q540,470 650,500 L655,600 Q668,760 625,885 L455,885 Q412,760 425,600 Z";
  const skin = "#cfe3f2";
  return (
    <g>
      {limbs.map(([d, w], i) => (
        <path key={`o${i}`} d={d} fill="none" stroke={INK} strokeWidth={w + 16} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <path d={torso} fill={INK} stroke={INK} strokeWidth={16} strokeLinejoin="round" />
      <circle cx={540} cy={370} r={84} fill={INK} />
      {limbs.map(([d, w], i) => (
        <path key={`f${i}`} d={d} fill="none" stroke={skin} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <path d={torso} fill={skin} />
      <circle cx={540} cy={370} r={76} fill={skin} />
      <ellipse cx={515} cy={345} rx={22} ry={14} fill="#fff" opacity={0.45} />
      {/* kan yolu: kalpte toplanır */}
      {ZONES.map((z, i) => (
        <path key={`v${i}`} d={`M${z.c[0]},${z.c[1]} L${HEART[0]},${HEART[1]}`} stroke={RED} strokeWidth={6} opacity={0.35 * flow[i]} strokeLinecap="round" />
      ))}
      {/* yağ hücreleri */}
      {ZONES.map((z, i) =>
        fat[i] > 0.01 ? (
          <g key={`z${i}`}>
            {glow[i] ? <circle cx={z.c[0]} cy={z.c[1]} r={i === Z_BELLY ? 110 : 70} fill={Y} opacity={0.35 * glow[i]} /> : null}
            {z.dots.map(([x, y], k) => (
              <circle key={k} cx={x} cy={y} r={(i === Z_BELLY ? 20 : 15) * (0.4 + 0.6 * fat[i])} fill="#ffd766" stroke="#c98a12" strokeWidth={4} opacity={Math.min(1, fat[i] * 1.5)} />
            ))}
          </g>
        ) : null,
      )}
      {/* damlalar: bölgeden kalbe */}
      {ZONES.map((z, i) =>
        flow[i] > 0.01
          ? [0, 1, 2].map((k) => {
              const p = (((t * 0.9 + k / 3 + i * 0.13) % 1) + 1) % 1;
              return <Drop key={`d${i}-${k}`} x={z.c[0] + (HEART[0] - z.c[0]) * p} y={z.c[1] + (HEART[1] - z.c[1]) * p} o={flow[i] * Math.sin(p * Math.PI)} />;
            })
          : null,
      )}
      {flame > 0.01 ? (
        <g opacity={flame}>
          <circle cx={HEART[0]} cy={HEART[1]} r={58} fill="#ffb347" opacity={0.3} />
          <Flame x={HEART[0]} y={HEART[1] - 6} s={0.55 + 0.25 * flame} t={t} />
        </g>
      ) : null}
    </g>
  );
};

const Badge: React.FC<{ x: number; y: number; n: string; o: number; fill?: string }> = ({ x, y, n, o, fill = "#ffffff" }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y}) scale(${0.85 + 0.15 * o})`}>
      <circle r={34} fill={fill} stroke={INK} strokeWidth={6} />
      <text y={14} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={n.length > 2 ? 26 : 38} fill={INK}>
        {n}
      </text>
    </g>
  );

const Dna: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g transform={`translate(${x},${y})`}>
    {Array.from({ length: 7 }).map((_, k) => {
      const yy = -78 + k * 26;
      const a = Math.sin(k * 0.9 + t * 2) * 34;
      return <line key={k} x1={-a} y1={yy} x2={a} y2={yy} stroke={INK} strokeWidth={5} opacity={0.6} />;
    })}
    {[1, -1].map((s) => (
      <path
        key={s}
        d={Array.from({ length: 25 })
          .map((_, k) => {
            const yy = -78 + k * 6.5;
            return `${k ? "L" : "M"}${s * Math.sin((k / 4) * 0.9 + t * 2) * 34},${yy}`;
          })
          .join(" ")}
        fill="none"
        stroke={s > 0 ? "#3aa0ff" : RED}
        strokeWidth={9}
        strokeLinecap="round"
      />
    ))}
  </g>
);

const Plate: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={10} rx={96} ry={78} fill="#ffffff" stroke={INK} strokeWidth={6} />
    <ellipse cx={0} cy={10} rx={70} ry={54} fill="none" stroke={INK} strokeWidth={3} opacity={0.25} />
    <path d="M-60,10 Q-50,-30 -10,-20 Q-30,10 -60,10 Z" fill="#7ccf4a" stroke={INK} strokeWidth={4} />
    <path d="M-50,30 Q-20,0 0,30 Q-24,50 -50,30 Z" fill="#5fb83a" stroke={INK} strokeWidth={4} />
    <rect x={8} y={14} width={52} height={30} rx={12} fill="#f4a76b" stroke={INK} strokeWidth={4} />
    <Apple x={30} y={-14} s={0.42} />
  </g>
);

const Hourglass: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const p = (t * 0.25) % 1;
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M-50,-80 L50,-80 L8,0 L50,80 L-50,80 L-8,0 Z" fill="#e8f4ff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${-40 + 34 * p},${-70 + 62 * p} L${40 - 34 * p},${-70 + 62 * p} L6,-4 L-6,-4 Z`} fill={Y} />
      <path d={`M-42,72 L42,72 L${30 - 22 * (1 - p)},${72 - 50 * p} L${-30 + 22 * (1 - p)},${72 - 50 * p} Z`} fill={Y} />
      <rect x={-64} y={-96} width={128} height={18} rx={8} fill="#b77a4a" stroke={INK} strokeWidth={5} />
      <rect x={-64} y={78} width={128} height={18} rx={8} fill="#b77a4a" stroke={INK} strokeWidth={5} />
    </g>
  );
};

const Card: React.FC<{ x: number; y: number; w: number; h: number; o: number; label: string; children: React.ReactNode }> = ({ x, y, w, h, o, label, children }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(0,${(1 - o) * 18})`}>
      <rect x={x} y={y} width={w} height={h} rx={36} fill="#ffffff" stroke={INK} strokeWidth={8} />
      {children}
      <text x={x + w / 2} y={y + h - 40} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill={INK}>
        {label}
      </text>
    </g>
  );

// ------------------------------------------------------------ ana kompozisyon

export type GobekYagiProps = { audioName: string; data: VoiceoverData | null };

export const GobekYagi: React.FC<GobekYagiProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : GY_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  // önceki sahne tamamen sönünce yenisi gelir (üst üste binen hayalet görüntü olmasın)
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, 0.21);
  // döngü: son cümleden sonra kanca karesi geri gelir; son kare = ilk kare
  const loopIn = sm(t, T - 0.3, T - 0.05);

  // ===== 0: kanca (+ döngü sonu)
  const s0 = Math.max(scene(0, 1), loopIn);
  // ===== 1: takvim
  const s1 = scene(1, 2);
  const days = interpolate(t, [L(1) + 0.15, L(2) - 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // ===== 2: ayna
  const s2 = scene(2, 3);
  const still = W(2, 3); // "hâlâ orada"
  // ===== 3: Bora kameraya döner; sonunda göbeğine doğru içeri girilir
  const s3 = scene(3, 4);
  const dive = sm(t, L(4) - 0.5, L(4) + 0.02);
  // ===== 4-5: karnın kesiti
  const s45 = scene(4, 6);
  const secIn = sm(t, L(4) - 0.05, L(4) + 0.55);
  const work = win(t, W(5, 0) - 0.1, W(5, 4) + 0.2, 0.2);
  const pump = sm(t, W(5, 4) - 0.15, W(5, 4) + 0.5);
  const fatHl = sm(t, W(5, 6) - 0.1, W(5, 6) + 0.3);
  const same = W(5, 8); // "dokunmaz"
  // ===== 6: yağ tüm vücuttan yakılır
  const s6 = scene(6, 7);
  const oneSpot = sm(t, W(6, 3) - 0.1, W(6, 3) + 0.3);
  const notOne = sm(t, W(6, 6) - 0.1, W(6, 6) + 0.3);
  const all = sm(t, W(6, 7) - 0.1, W(6, 7) + 0.4);
  // ===== 7: MİT
  const s7 = scene(7, 8);
  const myth = W(7, 5);
  // ===== 8: genetik sıra / ne kadar: sen
  const s8 = scene(8, 9);
  const melt = (i: number) => {
    // kollar → yüz → bacaklar → en son göbek
    const rank = i === Z_ARM_L || i === Z_ARM_R ? 0 : i === Z_FACE ? 1 : i === Z_BELLY ? 3 : 2;
    const a = W(8, 1) + rank * ((W(8, 6) - W(8, 1)) / 4);
    return sm(t, a, a + 0.5);
  };
  const you = W(8, 7);
  // ===== 9: kuvvet / beslenme / sabır
  const s9 = scene(9, 10);
  // ===== 10: aylar sonra ayna (sabah)
  const s10 = scene(10, 11);
  const lose = sm(t, W(10, 0), L(11) - 0.5);
  const fatPct = Math.round(28 - 12 * lose);
  // ===== 11: gönder → döngü
  const s11 = win(t, L(11) - 0.02, T - 0.31, 0.2);

  // oda (gece): kanca, takvim, ayna, kameraya dönüş ve kapanışta ortak; içeri girişte Bora ile birlikte büyür
  const room = Math.max(scene(0, 4), win(t, L(11) - 0.02, T + 1, 0.21));
  const bellyPt: [number, number] = [540, FLOOR - (880 - 570) * 1.45];
  const zoom = 1 + 0.05 * sm(t, L(3), L(4) - 0.5) + 2.6 * dive * dive;
  const diveT = `translate(${bellyPt[0]},${bellyPt[1]}) scale(${zoom}) translate(${-bellyPt[0]},${-bellyPt[1]})`;

  // ses efektleri (Mixkit, public/sfx): az, kısık, olay anında. Pop/woosh/komik efekt yok.
  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number; fin?: number }[] = [
    { at: 0, id: 2299, v: 0.3, lead: 0.05 }, // kanca: yumuşak bas
    { at: L(1) + 0.1, id: 1060, v: 0.07, dur: L(2) - L(1) - 0.1, fade: 0.5, fin: 0.3 }, // duvar saati: günler geçiyor
    { at: still - 0.08, id: 2299, v: 0.16, lead: 0.05 }, // "hâlâ orada": tok, kısık vuruş
    { at: L(4) - 0.9, id: 790, v: 0.16, lead: 0.61, dur: 0.95, fade: 0.3 }, // içeri giriş: hafif yükseliş
    { at: L(4) + 0.05, id: 1143, v: 0.22, lead: 0.14, dur: 1.4, fade: 0.7 }, // kesit açılır
    { at: W(4, 6) - 0.08, id: 2568, v: 0.18 }, // YAĞ etiketi
    { at: W(4, 8) - 0.08, id: 2568, v: 0.18 }, // KAS etiketi
    { at: W(5, 4), id: 1120, v: 0.3, lead: 0.1 }, // güçlenir ✓
    { at: myth - 1.0, id: 790, v: 0.16, lead: 0.61, dur: 1.0, fade: 0.2 }, // MİT öncesi gerilim
    { at: myth - 0.05, id: 2182, v: 0.3 }, // MİT mührü
    { at: W(8, 4) - 0.08, id: 2568, v: 0.18 }, // GENETİK
    { at: you - 0.05, id: 1143, v: 0.2, lead: 0.14, dur: 1.2, fade: 0.6 }, // "sen"
    { at: W(9, 0) - 0.08, id: 2568, v: 0.2 }, // kuvvet
    { at: W(9, 2) - 0.08, id: 2568, v: 0.2 }, // beslenme
    { at: W(9, 5) - 0.08, id: 2568, v: 0.2 }, // sabır
    { at: W(10, 10) - 0.05, id: 1120, v: 0.32, lead: 0.1 }, // göbek gider ✓
  ];
  /** müzik acı anında ("hâlâ orada", "suç sende değil") ve MİT vuruşunda hafifçe kısılır */
  const duck = (mt: number) => Math.min(1 - 0.45 * win(mt, still - 0.2, L(4) - 0.4, 0.4), 1 - 0.35 * win(mt, myth - 0.1, myth + 1.0, 0.3));

  // fon rengi sahneye göre değişir; geçişte yumuşak renk kayması; son sahne = ilk sahne (döngü)
  const NIGHT: [string, string] = ["#4a557f", "#2f375a"];
  const SCENE_BG: [number, string, string][] = [
    [0, ...NIGHT],
    [4, "#f4ead8", "#e6d6bb"], // karnın içi: krem
    [6, "#d4ebe0", "#b9dccb"], // tüm vücut: mint
    [7, "#e6dcf5", "#cfc0ea"], // MİT: açık lila
    [8, "#d6e6f5", "#b8d0ea"], // genetik: açık mavi
    [9, "#f7cdb0", "#eeb08a"], // tavsiye: şeftali
    [10, "#ffe3b8", "#f8c98f"], // aylar sonra sabah: sıcak
    [11, ...NIGHT], // kapanış = kanca
  ];
  let bgTop = SCENE_BG[0][1];
  let bgBot = SCENE_BG[0][2];
  for (let k = 1; k < SCENE_BG.length; k++) {
    const at = L(SCENE_BG[k][0]);
    bgTop = interpolateColors(t, [at - 0.15, at + 0.25], [bgTop, SCENE_BG[k][1]]);
    bgBot = interpolateColors(t, [at - 0.15, at + 0.25], [bgBot, SCENE_BG[k][2]]);
  }
  const tint = "#2a2a3a";

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="gy-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="gy-glow" cx="50%" cy="40%" r="55%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.35} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gy-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#gy-bg)" />
        <rect width={1080} height={1920} fill="url(#gy-glow)" />

        {/* ===== gece odası (ortak fon) ===== */}
        <Floor tint={tint} />
        {room > 0 ? (
          <g opacity={room} transform={diveT}>
            <Window x={110} y={190} w={250} h={220} t={t} />
            <Mat />
          </g>
        ) : null}

        {/* ===== 0: kanca (ilk karede ekranda; döngüde son karede de) ===== */}
        {s0 > 0 ? (
          <g opacity={s0}>
            <Txt x={540} y={300} size={92} fill="#ffffff" sw={16}>
              GÖBEK YAĞI İÇİN
            </Txt>
            <Txt x={540} y={430} size={128} fill={Y} sw={18}>
              EN BÜYÜK HATA
            </Txt>
            <BoraAt uid="gy0" x={480} s={0.98} t={t} pose={HANDS_ON_BELLY} expr="neutral" belly={1} />
          </g>
        ) : null}

        {/* ===== 1: her gece yüzlerce mekik, haftalarca ===== */}
        {s1 > 0 ? (
          <g opacity={s1}>
            <Calendar x={520} y={250} p={days} o={sm(t, L(1), L(1) + 0.3)} />
            <Pill x={760} y={820} text={`${Math.round(days * 28) * 100} MEKİK`.replace(/(\d)(\d{3}) /, "$1.$2 ")} o={sm(t, L(1) + 0.2, L(1) + 0.5)} color={Y} size={54} />
            <Pill x={760} y={940} text={`${Math.max(1, Math.ceil(days * 4))}. HAFTA`} o={sm(t, W(1, 4) - 0.1, W(1, 4) + 0.2)} size={44} />
            <BoraAt
              uid="gy1"
              x={290}
              s={0.95}
              t={t}
              pose={{ r: { el: [300, 520], wr: [250, 590], hand: "open", handRot: -20 }, head: -3, lx: 4, ly: -2 }}
              expr="ouch"
              belly={1}
            />
            {/* yorgunluk: alından ter damlası */}
            {[0, 1].map((k) => {
              const p = (((t * 0.7 + k * 0.5) % 1) + 1) % 1;
              return <Drop key={k} x={190 + k * 200} y={560 + p * 70} o={Math.sin(p * Math.PI) * 0.9} />;
            })}
          </g>
        ) : null}

        {/* ===== 2: aynaya bakıyorsun… göbek hâlâ orada ===== */}
        {s2 > 0 ? (
          <g opacity={s2}>
            <Mirror x={600} y={330} w={380} h={1050} uid="gy2m">
              <BoraAt uid="gy2r" x={790} y={1430} s={0.95} t={t} pose={HANDS_ON_BELLY} expr="neutral" belly={1} />
              <rect x={600} y={330} width={380} height={1050} fill="#bcd3e8" opacity={0.25} />
            </Mirror>
            {(() => {
              const p = sm(t, still - 0.15, still + 0.45);
              const c: [number, number] = [790, 1430 - (880 - 565) * 0.95];
              return p > 0 ? (
                <ellipse cx={c[0]} cy={c[1]} rx={130} ry={115} fill="none" stroke={RED} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} transform={`rotate(-90 ${c[0]} ${c[1]})`} strokeLinecap="round" />
              ) : null;
            })()}
            <Pill x={790} y={250} text="HÂLÂ AYNI" o={sm(t, still, still + 0.3)} color={RED} ink="#fff" size={56} />
            <BoraAt uid="gy2" x={300} s={1.02} t={t} pose={{ ...HANDS_ON_BELLY, lx: 5, ly: 2, head: 3 }} expr={t > still ? "ouch" : "neutral"} belly={1} />
          </g>
        ) : null}

        {/* ===== 3: suç sende değil — kameraya döner, sonra göbeğin içine girilir ===== */}
        {s3 > 0 ? (
          <g opacity={s3 * (1 - sm(t, L(4) - 0.2, L(4) + 0.02))} transform={diveT}>
            <BoraAt
              uid="gy3"
              x={540}
              s={1.45}
              t={t}
              pose={
                t < W(3, 3) - 0.1
                  ? { r: { el: [318, 480], wr: [318, 380], hand: "open" }, head: -3 }
                  : { r: { el: [310, 470], wr: [300, 360], hand: "point", handRot: 10 }, head: 2 }
              }
              expr={t < W(3, 3) - 0.1 ? "smile" : "think"}
              belly={1}
            />
          </g>
        ) : null}

        {/* ===== 4-5: karnın içi ===== */}
        {s45 > 0 ? (
          <g opacity={s45}>
            {/* nereye baktığımız: küçük Bora'nın göbeğinden büyüteç */}
            <g opacity={sm(t, L(4) + 0.3, L(4) + 0.7)}>
              <path d={`M540,${FLOOR - (880 - 570) * 0.32} L${SEC.x + 140},${SEC.y + SEC.h} L${SEC.x + SEC.w - 140},${SEC.y + SEC.h} Z`} fill="#ffffff" opacity={0.5} />
              <BoraAt uid="gy4b" x={540} s={0.32} t={t} pose={{}} expr="neutral" belly={1} />
              <circle cx={540} cy={FLOOR - (880 - 570) * 0.32} r={30} fill="none" stroke={INK} strokeWidth={5} />
            </g>
            <g transform={`translate(540,680) scale(${1.25 - 0.25 * secIn}) translate(-540,-680)`}>
              <Section t={t} work={work} pump={pump} fatHl={fatHl} />
              <Pill x={830} y={392} text="YAĞ" o={sm(t, W(4, 6) - 0.1, W(4, 6) + 0.2)} color={Y} size={56} />
              <Pill x={830} y={835 - 18 * pump} text="KAS" o={sm(t, W(4, 8) - 0.1, W(4, 8) + 0.2)} color="#ffffff" size={56} />
              <Check x={960} y={820 - 18 * pump} s={34} p={sm(t, W(5, 4), W(5, 4) + 0.4)} />
              {/* yağ: aynı kaldı */}
              <g opacity={sm(t, same - 0.1, same + 0.3)}>
                <Pill x={540} y={500} text="YAĞ: AYNI" o={1} color={RED} ink="#fff" size={60} />
              </g>
            </g>
            <Pill x={540} y={140} text="KARNININ İÇİ" o={sm(t, L(4) + 0.2, L(4) + 0.5) * (1 - sm(t, same, same + 0.25))} size={50} />
            <Pill x={540} y={140} text="MEKİK, YAĞI ERİTMEZ" o={sm(t, same + 0.2, same + 0.5)} color={Y} size={54} />
          </g>
        ) : null}

        {/* ===== 6: yağ tek yerden değil, her yerden yakılır ===== */}
        {s6 > 0 ? (
          <g opacity={s6}>
            <g transform="translate(0,40)">
              <Body
                t={t}
                fat={[1, 1, 1, 1, 1, 1]}
                flow={ZONES.map((_, i) => (i === Z_BELLY ? oneSpot * (1 - notOne * 0.7) + all * 0.7 : all))}
                glow={ZONES.map((_, i) => (i === Z_BELLY ? oneSpot * (1 - all) : 0))}
                flame={sm(t, W(6, 9) - 0.3, W(6, 9) + 0.2) + all * 0.6}
              />
            </g>
            <g opacity={1 - sm(t, W(6, 7) - 0.15, W(6, 7) + 0.1)}>
              <Pill x={540} y={160} text="TEK BÖLGE" o={oneSpot} size={54} />
              <Cross x={540} y={150} s={52} p={notOne} />
            </g>
            <Pill x={540} y={160} text="TÜM VÜCUT" o={sm(t, W(6, 7), W(6, 7) + 0.3)} color={Y} size={58} />
          </g>
        ) : null}

        {/* ===== 7: bölgesel yağ yakımı = MİT ===== */}
        {s7 > 0 ? (
          <g opacity={s7}>
            <g opacity={sm(t, L(7), L(7) + 0.3)}>
              <rect x={110} y={250} width={860} height={640} rx={44} fill="#ffffff" stroke={INK} strokeWidth={9} />
              <Txt x={540} y={360} size={62} fill={INK} sw={0}>
                BÖLGESEL YAĞ YAKIMI
              </Txt>
              <line x1={160} y1={420} x2={920} y2={420} stroke={INK} strokeWidth={4} opacity={0.2} />
              {[
                ["MEKİK", "GÖBEK", 0],
                ["SQUAT", "KALÇA", 1],
                ["KOL ÇALIŞ", "KOL YAĞI", 2],
              ].map(([a, b, k]) => {
                const yy = 520 + (k as number) * 130;
                const o = sm(t, L(7) + 0.2 + (k as number) * 0.25, L(7) + 0.45 + (k as number) * 0.25);
                return (
                  <g key={k as number} opacity={o}>
                    <Txt x={180} y={yy} size={56} fill={INK} sw={0} anchor="start">
                      {a as string}
                    </Txt>
                    <path d={`M505,${yy - 18} L585,${yy - 18} M565,${yy - 36} L587,${yy - 18} L565,${yy}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                    <Txt x={620} y={yy} size={56} fill={INK} sw={0} anchor="start">
                      {b as string}
                    </Txt>
                    <line x1={170} y1={yy - 18} x2={900} y2={yy - 18} stroke={RED} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sm(t, W(7, 3) + (k as number) * 0.12, W(7, 3) + 0.35 + (k as number) * 0.12)} />
                  </g>
                );
              })}
            </g>
            {(() => {
              const p = sm(t, myth - 0.05, myth + 0.3);
              return p > 0 ? (
                <g opacity={p} transform={`translate(400,1110) rotate(-10) scale(${1.15 - 0.15 * p})`}>
                  <rect x={-190} y={-90} width={380} height={180} rx={26} fill="#ffffff" fillOpacity={0.6} stroke={RED} strokeWidth={16} />
                  <text x={0} y={42} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={128} fill={RED} letterSpacing={8}>
                    MİT
                  </text>
                </g>
              ) : null;
            })()}
            <BoraAt
              uid="gy7"
              x={850}
              s={0.58}
              t={t}
              pose={t < myth - 0.1 ? { r: { el: [300, 520], wr: [300, 430] } } : { l: { el: [90, 460], wr: [40, 380], hand: "point", handRot: -40 } }}
              expr={t < myth - 0.1 ? "think" : "grin"}
              belly={1}
            />
          </g>
        ) : null}

        {/* ===== 8: nereden → genetik, ne kadar → sen ===== */}
        {s8 > 0 ? (
          <g opacity={s8}>
            <g transform="translate(-250,120) scale(1.0)">
              <Body t={t} fat={ZONES.map((_, i) => 1 - melt(i) * (i === Z_BELLY ? 0.5 : 0.85))} flow={ZONES.map(() => 0)} flame={0} />
              {/* sıra numaraları: göbek en son */}
              <Badge x={330} y={560} n="1" o={melt(Z_ARM_L)} />
              <Badge x={750} y={560} n="1" o={melt(Z_ARM_R)} />
              <Badge x={640} y={300} n="2" o={melt(Z_FACE)} />
              <Badge x={410} y={1150} n="3" o={melt(Z_LEG_L)} />
              <Badge x={540} y={760} n="SON" o={melt(Z_BELLY)} fill={Y} />
            </g>
            <g opacity={sm(t, L(8) + 0.1, L(8) + 0.4)}>
              <rect x={590} y={210} width={430} height={380} rx={40} fill="#ffffff" stroke={INK} strokeWidth={8} />
              <Txt x={805} y={290} size={46} fill={INK} sw={0}>
                NEREDEN?
              </Txt>
              <g opacity={sm(t, W(8, 4) - 0.1, W(8, 4) + 0.3)}>
                <Dna x={700} y={440} t={t} />
                <Txt x={860} y={460} size={50} fill={INK} sw={0}>
                  GENETİK
                </Txt>
              </g>
            </g>
            <g opacity={sm(t, W(8, 7) - 0.1, W(8, 7) + 0.25)}>
              <rect x={590} y={630} width={430} height={240} rx={40} fill={Y} stroke={INK} strokeWidth={8} />
              <Txt x={805} y={710} size={46} fill={INK} sw={0}>
                NE KADAR?
              </Txt>
              <Txt x={805} y={820} size={84} fill={INK} sw={0}>
                SEN
              </Txt>
            </g>
            <g opacity={sm(t, you - 0.15, you + 0.2)}>
              <BoraAt uid="gy8" x={820} s={0.55} t={t} pose={{ r: { el: [320, 470], wr: [300, 380], hand: "point", handRot: 5 } }} expr="grin" belly={0.6} />
            </g>
          </g>
        ) : null}

        {/* ===== 9: kuvvet / beslenme / sabır ===== */}
        {s9 > 0 ? (
          <g opacity={s9}>
            <Card x={50} y={260} w={310} h={400} o={sm(t, W(9, 0) - 0.15, W(9, 0) + 0.15)} label="KUVVET">
              <Dumbbell x={205} y={430} s={1.0} rot={-15} />
            </Card>
            <Card x={385} y={260} w={310} h={400} o={sm(t, W(9, 2) - 0.15, W(9, 2) + 0.15)} label="BESLENME">
              <Plate x={540} y={430} />
            </Card>
            <Card x={720} y={260} w={310} h={400} o={sm(t, W(9, 5) - 0.15, W(9, 5) + 0.15)} label="SABIR">
              <Hourglass x={875} y={430} t={t} />
            </Card>
            <BoraAt uid="gy9" x={540} s={0.72} t={t} pose={{ r: { el: [310, 560], wr: [330, 470], hand: "thumb" } }} expr="smile" belly={0.6} />
          </g>
        ) : null}

        {/* ===== 10: aylar sonra: ayna, göbek eriyerek gider ===== */}
        {s10 > 0 ? (
          <g opacity={s10}>
            <DayWindow x={110} y={190} w={250} h={220} />
            <Mirror x={600} y={330} w={380} h={1050} uid="gy10m">
              <BoraAt uid="gy10r" x={790} y={1430} s={0.95} t={t} pose={{ r: { el: [300, 520], wr: [250, 590], hand: "open", handRot: -20 }, head: -2 }} expr={lose > 0.9 ? "happy" : "smile"} belly={1 - lose} />
              <rect x={600} y={330} width={380} height={1050} fill="#bcd3e8" opacity={0.2} />
            </Mirror>
            <Pill x={790} y={250} text={`YAĞ ORANI %${fatPct}`} o={sm(t, L(10) + 0.1, L(10) + 0.4)} color="#ffffff" size={50} />
            <Pill x={300} y={520} text={`${Math.min(3, 1 + Math.floor(lose * 3))}. AY`} o={sm(t, L(10) + 0.2, L(10) + 0.5)} color={Y} size={56} />
            <Check x={930} y={1000} s={44} p={sm(t, W(10, 10), W(10, 10) + 0.4)} />
            <BoraAt uid="gy10" x={300} s={1.02} t={t} pose={{ r: { el: [300, 520], wr: [250, 590], hand: "open", handRot: -20 }, lx: 5, ly: 2 }} expr={lose > 0.9 ? "laugh" : "smile"} belly={1 - lose} />
          </g>
        ) : null}

        {/* ===== 11: gönder (sonra kanca karesi geri gelir) ===== */}
        {s11 > 0 ? (
          <g opacity={s11}>
            <BoraAt uid="gy11" x={500} s={0.98} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="grin" item={<PhoneItem />} />
            <g opacity={sm(t, L(11) + 0.15, L(11) + 0.45)}>
              <Txt x={540} y={300} size={92} fill="#ffffff" sw={16}>
                BUNU ONA
              </Txt>
              <Txt x={540} y={420} size={110} fill={Y} sw={16}>
                GÖNDER
              </Txt>
              <g transform={`translate(860,${520 + Math.sin(t * 4) * 10})`}>
                <path d="M0,-50 L0,30 M-34,0 L0,36 L34,0" fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0,-50 L0,30 M-34,0 L0,36 L34,0" fill="none" stroke={Y} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>
          </g>
        ) : null}

        <rect width={1080} height={1920} fill="url(#gy-vig)" />
      </svg>

      <Captions t={t} tl={tl} />
      {data ? (
        /* ana ses müzik ve efektlerin üstünde kalsın: ~+4 dB */
        <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} />
      ) : null}
      {FX.map((f, i) => (
        <Sequence key={`fx${i}`} from={Math.max(0, Math.round(f.at * fps))} durationInFrames={f.dur ? Math.round(f.dur * fps) : undefined} layout="none">
          <Audio
            src={staticFile(`sfx/${f.id}.mp3`)}
            startFrom={Math.round((f.lead ?? 0) * fps)}
            volume={(k) => (f.dur && f.fade ? f.v * interpolate(k / fps, [0, f.fin ?? 0.001, f.dur - f.fade, f.dur], [f.fin ? 0 : 1, 1, 1, 0], { extrapolateRight: "clamp" }) : f.v)}
          />
        </Sequence>
      ))}
      {/* konuşmanın altında kısık müzik; döngü için sonda hafifçe söner */}
      <Audio
        src={staticFile("music/623.mp3")}
        volume={(f) => {
          const mt = f / fps;
          const base = interpolate(mt, [0, 0.4], [0.02, 0.04], { extrapolateRight: "clamp" });
          return base * duck(mt) * interpolate(mt, [T - 0.6, T], [1, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        }}
      />
    </AbsoluteFill>
  );
};
