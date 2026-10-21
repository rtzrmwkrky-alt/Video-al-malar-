/**
 * "Beslenmene dikkat etmeden spor yaparsan ne olur?" (~38 sn) — kullanıcının metni hikâyeleştirildi: önce acı (her gün salonda,
 * haftalar geçti, aynada değişen bir şey yok), sonra bilim (kasın içi: antrenman liflerde minik hasar açar → "güçlen" sinyali →
 * tamir için protein, enerji, uyku gerekir; öğün atlanınca malzeme gelmez, tamir yarım kalır), en son tavsiye (daha çok çalışmak
 * ≠ daha iyi sonuç; kas salonda yorulur, sofrada ve yatakta büyür) ve döngü: son cümle tamamlanır, görüntü kancaya döner.
 * Kahraman Bora'nın tarzında sporcu bir genç (`CurlyGuy` + `SPORCU_LOOK`; Bora spor yapmaz).
 * Metin `icerik/beslenme-spor.seslendirme.txt` (kelime sayıları satır satır aynı olmalı). Ses yoksa zamanlar okuma hızından (sessiz taslak).
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { VoiceoverData } from "../types";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { INK } from "../anime/AnimeTeen";
import { CurlyGuy, type CurlyExpr, type CurlyLook, type CurlyPose } from "../avatar/CurlyGuy";
import { Burger, Check, Cross, Dumbbell, Floor, Moon, PhoneItem, Pill, Pizza, Txt } from "./GeceYemek";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const GREEN = "#47c96b";
const BLUE = "#4aa3ff";
const PURPLE = "#9a7cf0";
const FLOOR = 1400;

export const BS_LINES: Line[] = [
  { text: "Her gün salona gidip hâlâ kas yapamıyorsan… sebebi bu.", hl: ["hâlâ", "bu."], hold: 0.3 },
  { text: "Ağırlık kaldırıyor, ter döküyor, sınırlarını zorluyordu.", hl: ["zorluyordu."], hold: 0.2 },
  { text: "Haftalar geçti… aynada hiçbir şey değişmedi.", hl: ["hiçbir", "değişmedi."], hold: 0.5 },
  { text: "Neden mi? Gel, kasın içine girelim.", hl: ["kasın", "içine"], hold: 0.3 },
  { text: "Antrenman, kas liflerinde minicik hasarlar açar.", hl: ["minicik", "hasarlar"], hold: 0.2 },
  { text: "Bu bir sinyal: beni daha güçlü yap.", hl: ["güçlü"], hold: 0.3 },
  { text: "Ama tamir için malzeme lazım: protein, enerji ve uyku.", hl: ["protein,", "enerji", "uyku."], hold: 0.3 },
  { text: "O ise ya öğün atlıyor, ya da gelişigüzel yiyordu.", hl: ["atlıyor,", "gelişigüzel"], hold: 0.2 },
  { text: "Malzeme gelmeyince, tamir de yarım kaldı.", hl: ["yarım", "kaldı."], hold: 0.4 },
  { text: "Yani daha çok çalışmak, her zaman daha iyi sonuç demek değil.", hl: ["çok", "değil."], hold: 0.3 },
  { text: "Kas salonda yorulur… ama sofrada ve yatakta büyür.", hl: ["sofrada", "yatakta", "büyür."], hold: 0.4 },
  { text: "Bunu, salona gidip hâlâ değişmeyen o arkadaşına gönder.", hl: ["gönder."], hold: 0.6 },
];

/** kanca ekrandaki büyük yazıyla aynı olduğu için altyazısı gösterilmez */
const NO_CAPTION = [0];

/** döngü: son cümleden sonra kısa bekleme, sonra kanca karesine yumuşak geçiş (son kare = ilk kare) */
export const BS_TAIL = 0.8;
export const BS_TL = timeline(BS_LINES, BS_TAIL);

/** Bora'nın tarzında sporcu genç: koyu kıvırcık saç, gözlüksüz, kırmızı eşofman ceketi, beyaz tişört, siyah eşofman */
export const SPORCU_LOOK: CurlyLook = {
  hair: "curly",
  hairColor: ["#5a3a22", "#3a2414", "#1e120a"],
  glasses: false,
  jacket: ["#ff6a5a", "#e8463c", "#b8302a"],
  teddy: false,
  sweater: "#ffffff",
  knit: false,
  pants: ["#3a3d48", "#262832"],
  cuff: "#2e303a",
  shoe: ["#ffffff", "#d8d8d8"],
  shoeLine: "#e8463c",
  strap: false,
  lashes: false,
  earrings: "",
};

type TL = ReturnType<typeof timeline> & { wordAt?: (line: number, k: number) => number };

const words = (l: Line) => l.text.split(/\s+/);

/** seslendirmeden zaman çizelgesi: her satır ilk kelimesinin başladığı anda başlar */
const voiceTimeline = (data: VoiceoverData): TL => {
  const offs: number[] = [];
  let o = 0;
  for (const l of BS_LINES) {
    offs.push(o);
    o += words(l).length;
  }
  const w = data.words;
  const ws = (i: number) => w[Math.min(w.length - 1, i)]?.start ?? 0;
  const starts = offs.map((off, i) => (i === 0 ? 0 : ws(off) - 0.06));
  const total = data.durationInSeconds + BS_TAIL;
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
  const n = words(BS_LINES[line]).length;
  const s = tl.at(line);
  const e = tl.at(line + 1) - (BS_LINES[line].hold ?? 0);
  return s + ((e - s) * k) / n;
};

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: TL }> = ({ t, tl }) => {
  const i = tl.idx(t);
  if (i < 0 || NO_CAPTION.includes(i)) return null;
  const out = 1 - sm(t, tl.total - 0.45, tl.total - 0.15);
  if (out <= 0) return null;
  const line = BS_LINES[i];
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

// ------------------------------------------------------------ sporcu genç

const blinkAt = (t: number) => ((t % 3.5) / 3.5 > 0.96 ? 1 : 0);

/** sporcu: ayak ortası (x, y), s ölçek (~880 birim boy) */
const HeroAt: React.FC<{ x: number; y?: number; s: number; pose?: CurlyPose; expr?: CurlyExpr; t: number; uid: string; item?: React.ReactNode }> = ({
  x,
  y = FLOOR,
  s,
  pose,
  expr,
  t,
  uid,
  item,
}) => (
  <g transform={`translate(${x},${y}) scale(${s}) translate(-200,-880)`}>
    <CurlyGuy id={uid} pose={pose} expr={expr} t={t} item={item} blink={blinkAt(t + x)} look={SPORCU_LOOK} />
  </g>
);

/** elde dambıl (kol ucunda) */
const DB = <Dumbbell x={0} y={0} s={0.5} />;

/** pazu kasma: dirsek yanda, yumruk yukarıda */
const FLEX: CurlyPose = { r: { el: [340, 440], wr: [318, 318], hand: "fist" }, head: 4, lx: 6, ly: -2 };

const Drop: React.FC<{ x: number; y: number; o: number; fill?: string }> = ({ x, y, o, fill = "#9fd8ff" }) => (
  <path d={`M${x},${y - 16} Q${x + 12},${y} ${x},${y + 8} Q${x - 12},${y} ${x},${y - 16} Z`} fill={fill} stroke={INK} strokeWidth={3} opacity={o} />
);

/** alından süzülen ter */
const Sweat: React.FC<{ t: number; pts: [number, number][]; o?: number }> = ({ t, pts, o = 1 }) => (
  <g>
    {pts.map(([x, y], k) => {
      const p = (((t * 0.8 + k * 0.45) % 1) + 1) % 1;
      return <Drop key={k} x={x} y={y + p * 60} o={Math.sin(p * Math.PI) * 0.9 * o} />;
    })}
  </g>
);

// ------------------------------------------------------------ salon

/** duvardaki dambıl rafı */
const Rack: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <rect x={x} y={y + 70} width={420} height={22} rx={8} fill="#8b93a6" stroke={INK} strokeWidth={6} />
    <rect x={x + 20} y={y + 92} width={18} height={FLOOR - y - 92} fill="#6c7386" stroke={INK} strokeWidth={5} />
    <rect x={x + 382} y={y + 92} width={18} height={FLOOR - y - 92} fill="#6c7386" stroke={INK} strokeWidth={5} />
    <rect x={x} y={y + 300} width={420} height={22} rx={8} fill="#8b93a6" stroke={INK} strokeWidth={6} />
    {[0, 1, 2, 3].map((k) => (
      <Dumbbell key={`a${k}`} x={x + 62 + k * 98} y={y + 40} s={0.42} />
    ))}
    {[0, 1, 2].map((k) => (
      <Dumbbell key={`b${k}`} x={x + 80 + k * 130} y={y + 262} s={0.58} />
    ))}
  </g>
);

/** duvar saati yerine salon panosu: "SALON" yazısı */
const GymSign: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <rect x={x} y={y} width={300} height={110} rx={20} fill="#2b2f45" stroke={INK} strokeWidth={7} />
    <text x={x + 150} y={y + 74} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={58} fill={Y} letterSpacing={6}>
      SALON
    </text>
  </g>
);

/** yerde ağırlık plakaları */
const Plates: React.FC<{ x: number }> = ({ x }) => (
  <g>
    {[0, 1, 2].map((k) => (
      <ellipse key={k} cx={x} cy={FLOOR - 14 - k * 26} rx={92 - k * 14} ry={20} fill={k % 2 ? "#3b3f58" : "#2b2f45"} stroke={INK} strokeWidth={6} />
    ))}
  </g>
);

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

/** takvim: haftalar sırayla işaretlenir (✓ = antrenman yapıldı) */
const Weeks: React.FC<{ x: number; y: number; p: number; o: number }> = ({ x, y, p, o }) => {
  const n = Math.floor(p * 8 + 0.0001);
  return (
    <g opacity={o}>
      <rect x={x} y={y} width={360} height={330} rx={24} fill="#ffffff" stroke={INK} strokeWidth={7} />
      <path d={`M${x},${y + 24} Q${x},${y} ${x + 24},${y} L${x + 336},${y} Q${x + 360},${y} ${x + 360},${y + 24} L${x + 360},${y + 80} L${x},${y + 80} Z`} fill={RED} stroke={INK} strokeWidth={7} />
      <text x={x + 180} y={y + 56} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill="#fff" letterSpacing={2}>
        HAFTALAR
      </text>
      {Array.from({ length: 8 }).map((_, i) => {
        const cx = x + 30 + (i % 4) * 78;
        const cy = y + 100 + Math.floor(i / 4) * 105;
        const on = i < n;
        return (
          <g key={i}>
            <rect x={cx} y={cy} width={66} height={90} rx={10} fill={on ? "#e3f6e8" : "#f3f1ee"} />
            <text x={cx + 33} y={cy + 34} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={24} fill={INK} opacity={0.5}>
              {i + 1}
            </text>
            {on ? <path d={`M${cx + 16},${cy + 60} L${cx + 29},${cy + 72} L${cx + 52},${cy + 48}`} fill="none" stroke={GREEN} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" /> : null}
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------ kasın içi: lif demetleri, hasar, sinyal, malzeme

const MV = { x: 70, y: 250, w: 940, h: 860 };
const ROWS = 6;
const rowY = (r: number) => MV.y + 95 + r * 135;

/** hasar noktaları (lif satırı, x) */
const CRACKS: [number, number][] = [
  [1, 380],
  [3, 700],
  [0, 760],
  [4, 300],
  [2, 560],
  [5, 820],
];

/** malzeme parçacıkları: 0 protein (mavi boncuk zinciri), 1 enerji (sarı şimşek), 2 uyku (mor ay) */
const Particle: React.FC<{ x: number; y: number; kind: number; o: number; rot: number }> = ({ x, y, kind, o, rot }) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`} opacity={o}>
    {kind === 0 ? (
      <g>
        <path d="M-22,0 L0,-6 L22,0" fill="none" stroke={INK} strokeWidth={4} />
        {[-22, 0, 22].map((dx, k) => (
          <circle key={k} cx={dx} cy={k === 1 ? -6 : 0} r={11} fill={BLUE} stroke={INK} strokeWidth={4} />
        ))}
      </g>
    ) : kind === 1 ? (
      <path d="M6,-26 L-14,4 L0,4 L-6,26 L14,-6 L0,-6 Z" fill={Y} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    ) : (
      <g>
        <circle r={18} fill={PURPLE} stroke={INK} strokeWidth={4} />
        <circle cx={9} cy={-6} r={15} fill="#e9e2ff" />
      </g>
    )}
  </g>
);

const N_PART = 18;

const MuscleView: React.FC<{
  t: number;
  /** hasar (0-1, sırayla açılır) */
  dmg: number;
  /** sinyal halkaları */
  sig: number;
  /** gelen malzeme miktarı (0 yok, 1 bol) */
  supply: number;
  /** tamir edilen hasar oranı */
  repair: number;
  /** liflerin kalınlaşması */
  grow: number;
  /** malzeme yollarının boş görünmesi (kesik çizgi) */
  empty: number;
}> = ({ t, dmg, sig, supply, repair, grow, empty }) => {
  const fh = 96 * (1 + 0.2 * grow);
  return (
    <g>
      <defs>
        <clipPath id="bs-mv">
          <rect x={MV.x} y={MV.y} width={MV.w} height={MV.h} rx={52} />
        </clipPath>
        <linearGradient id="bs-fiber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={interpolateColors(grow, [0, 1], ["#ef7468", "#ff7a62"])} />
          <stop offset="0.45" stopColor={interpolateColors(grow, [0, 1], ["#d9443c", "#ea3f34"])} />
          <stop offset="1" stopColor="#9a2a26" />
        </linearGradient>
      </defs>
      <g clipPath="url(#bs-mv)">
        {/* lifler arası bağ dokusu */}
        <rect x={MV.x} y={MV.y} width={MV.w} height={MV.h} fill="#f9d9cf" />
        {Array.from({ length: ROWS }).map((_, r) => {
          const cy = rowY(r) + Math.sin(t * 1.6 + r) * 3;
          const x0 = MV.x - 60 + (r % 2 ? 40 : 0);
          const w = MV.w + 120;
          return (
            <g key={r}>
              <rect x={x0} y={cy - fh / 2} width={w} height={fh} rx={fh / 2} fill="url(#bs-fiber)" stroke="#7a1f1c" strokeWidth={5} />
              {/* enine çizgiler (kas lifinin çizgili görünümü) */}
              {Array.from({ length: 34 }).map((__, k) => {
                const xx = x0 + 40 + k * 30;
                return <line key={k} x1={xx} y1={cy - fh * 0.38} x2={xx} y2={cy + fh * 0.38} stroke="#7a1f1c" strokeWidth={3} opacity={0.22} />;
              })}
              <path d={`M${x0 + 30},${cy - fh * 0.28} L${x0 + w - 30},${cy - fh * 0.28}`} stroke="#ffc2b6" strokeWidth={7} strokeLinecap="round" opacity={0.6} />
            </g>
          );
        })}

        {/* malzeme yolları: boşken kesik çizgi */}
        {empty > 0.01
          ? CRACKS.map(([r, x], k) => (
              <path
                key={`e${k}`}
                d={`M${MV.x - 10},${rowY(r) + (k % 2 ? -50 : 50)} Q${(MV.x + x) / 2},${rowY(r) + (k % 2 ? -80 : 80)} ${x},${rowY(r)}`}
                fill="none"
                stroke={INK}
                strokeWidth={5}
                strokeDasharray="14 14"
                strokeDashoffset={-t * 30}
                opacity={0.35 * empty}
              />
            ))
          : null}

        {/* hasarlar: sırayla açılır, tamir edilince kapanır ve parlar */}
        {CRACKS.map(([r, x], k) => {
          const a = Math.min(1, Math.max(0, dmg * CRACKS.length - k));
          const heal = Math.min(1, Math.max(0, repair * CRACKS.length - k));
          const cy = rowY(r) + Math.sin(t * 1.6 + r) * 3;
          const open = a * (1 - heal);
          return (
            <g key={`c${k}`}>
              {heal > 0 ? <ellipse cx={x} cy={cy} rx={60} ry={fh * 0.42} fill="#ffb08f" opacity={0.7 * heal * (1 - grow * 0.6)} /> : null}
              {open > 0.01 ? (
                <g opacity={open}>
                  <path
                    d={`M${x - 8},${cy - fh * 0.48} L${x + 12},${cy - fh * 0.2} L${x - 10},${cy} L${x + 14},${cy + fh * 0.22} L${x - 4},${cy + fh * 0.48}`}
                    fill="none"
                    stroke="#fff6ee"
                    strokeWidth={10 * open}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={`M${x - 8},${cy - fh * 0.48} L${x + 12},${cy - fh * 0.2} L${x - 10},${cy} L${x + 14},${cy + fh * 0.22} L${x - 4},${cy + fh * 0.48}`}
                    fill="none"
                    stroke="#5a1210"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.6}
                  />
                </g>
              ) : null}
              {/* sinyal halkaları */}
              {sig > 0.01 && open > 0.2
                ? [0, 1].map((q) => {
                    const ph = (((t * 0.9 + k * 0.17 + q * 0.5) % 1) + 1) % 1;
                    return <circle key={q} cx={x} cy={cy} r={24 + ph * 90} fill="none" stroke={Y} strokeWidth={7 * (1 - ph)} opacity={sig * (1 - ph)} />;
                  })
                : null}
            </g>
          );
        })}

        {/* malzeme: soldan gelir, hasarlara doğru akar */}
        {supply > 0.01
          ? Array.from({ length: N_PART }).map((_, i) => {
              const [r, x] = CRACKS[i % CRACKS.length];
              const ph = (((t * 0.32 + i / N_PART) % 1) + 1) % 1;
              const y0 = rowY(r) + (i % 2 ? -50 : 50);
              const cx = (MV.x + x) / 2;
              const cyc = rowY(r) + (i % 2 ? -80 : 80);
              const u = ph;
              const px = (1 - u) * (1 - u) * (MV.x - 40) + 2 * (1 - u) * u * cx + u * u * x;
              const py = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cyc + u * u * rowY(r);
              // bol malzemede hepsi görünür; azken sadece birkaçı
              const visible = i / N_PART < supply ? 1 : 0;
              return <Particle key={i} x={px} y={py} kind={i % 3} o={visible * Math.min(1, Math.sin(ph * Math.PI) * 2)} rot={Math.sin(t * 2 + i) * 20} />;
            })
          : null}

        {/* kalınlaşan lif: hafif parıltı */}
        <rect x={MV.x} y={MV.y} width={MV.w} height={MV.h} fill="#ffdd88" opacity={0.12 * grow} />
      </g>
      <rect x={MV.x} y={MV.y} width={MV.w} height={MV.h} rx={52} fill="none" stroke={INK} strokeWidth={9} />
    </g>
  );
};

/** yatay ölçek çubuğu (etiket + doluluk) */
const Bar: React.FC<{ x: number; y: number; w: number; label: string; v: number; color: string; o: number }> = ({ x, y, w, label, v, color, o }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <text x={x} y={y - 22} fontFamily={SANS} fontWeight={800} fontSize={46} fill={INK}>
        {label}
      </text>
      <rect x={x} y={y} width={w} height={70} rx={35} fill="#ffffff" stroke={INK} strokeWidth={7} />
      {v > 0.02 ? <rect x={x + 8} y={y + 8} width={(w - 16) * v} height={54} rx={27} fill={color} /> : null}
      <text x={x + w - 26} y={y + 50} textAnchor="end" fontFamily={SANS} fontWeight={800} fontSize={36} fill={INK}>
        %{Math.round(v * 100)}
      </text>
    </g>
  );

// ------------------------------------------------------------ ana kompozisyon

export type BeslenmeSporProps = { audioName: string; data: VoiceoverData | null };

export const BeslenmeSpor: React.FC<BeslenmeSporProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl: TL = data ? voiceTimeline(data) : BS_TL;
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k);
  const T = tl.total;
  // önceki sahne tamamen sönünce yenisi gelir (üst üste binen hayalet görüntü olmasın)
  const scene = (a: number, b: number) => win(t, a === 0 ? -1 : L(a) - 0.02, L(b) + 0.02, 0.21);
  const loopIn = sm(t, T - 0.3, T - 0.05);

  // ===== 0: kanca (+ döngü sonu)
  const s0 = Math.max(scene(0, 1), loopIn);
  // ===== 1: antrenman (dambıl kaldırır)
  const s1 = scene(1, 2);
  const rep = 0.5 - 0.5 * Math.cos((t - L(1)) * 4.2);
  const reps = Math.max(1, Math.min(12, Math.floor((t - L(1)) * (4.2 / (2 * Math.PI))) + 1));
  // ===== 2: haftalar geçti, ayna
  const s2 = scene(2, 3);
  const weeks = interpolate(t, [L(2) + 0.1, W(2, 2) - 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const nothing = W(2, 3); // "hiçbir şey değişmedi"
  // ===== 3: kola yaklaşma → kasın içine giriş
  const s3 = scene(3, 4);
  const dive = sm(t, L(4) - 0.55, L(4) + 0.02);
  // ===== 4-6: kasın içi
  const sIn1 = scene(4, 7);
  const dmg = sm(t, W(4, 3) - 0.2, W(4, 6) + 0.2);
  const sig = sm(t, L(5), L(5) + 0.4);
  const need = (k: number) => sm(t, W(6, 5 + k) - 0.15, W(6, 5 + k) + 0.2);
  // ===== 7: evde: öğün atlanır / gelişigüzel yemek
  const s7 = scene(7, 8);
  const skip = W(7, 4);
  const junk = W(7, 7);
  // ===== 8: malzeme gelmeyince tamir yarım
  const s8 = scene(8, 9);
  const half = interpolate(t, [L(8) + 0.2, W(8, 4)], [0, 0.34], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // ===== 9: daha çok ≠ daha iyi
  const s9 = scene(9, 10);
  const neq = W(9, 9);
  // ===== 10: sofrada ve yatakta büyür (tamir tamamlanır, lifler kalınlaşır)
  const s10 = scene(10, 11);
  const fed = sm(t, W(10, 3) - 0.1, W(10, 4) + 0.2);
  const full = interpolate(t, [W(10, 4), W(10, 7)], [0.34, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const grow = sm(t, W(10, 7) - 0.15, W(10, 7) + 0.6);
  // ===== 11: gönder → döngü
  const s11 = win(t, L(11) - 0.02, T - 0.31, 0.2);

  // salon: kanca, antrenman, ayna, kola yaklaşma ve kapanışta ortak; içeri girişte kahramanla birlikte büyür
  const gym = Math.max(scene(0, 4), win(t, L(11) - 0.02, T + 1, 0.21));
  const HS = 1.45;
  const bicep: [number, number] = [540 + (300 - 200) * HS, FLOOR - (880 - 392) * HS];
  const zoom = t > L(4) + 0.1 ? 1 : 1 + 0.05 * sm(t, L(3), L(4) - 0.55) + 3.2 * dive * dive;
  const diveT = `translate(${bicep[0]},${bicep[1]}) scale(${zoom}) translate(${-bicep[0]},${-bicep[1]})`;

  // ses efektleri (Mixkit, public/sfx): az, kısık, olay anında. Pop/woosh/komik efekt yok.
  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number; fin?: number }[] = [
    { at: 0, id: 2299, v: 0.3, lead: 0.05 }, // kanca: yumuşak bas
    { at: nothing - 0.08, id: 2299, v: 0.16, lead: 0.05 }, // "hiçbir şey değişmedi": tok, kısık vuruş
    { at: L(4) - 0.95, id: 790, v: 0.16, lead: 0.61, dur: 1.0, fade: 0.3 }, // içeri giriş: hafif yükseliş
    { at: L(4) + 0.05, id: 1143, v: 0.22, lead: 0.14, dur: 1.4, fade: 0.7 }, // kasın içi açılır
    { at: L(5) + 0.05, id: 2568, v: 0.16 }, // sinyal
    { at: W(6, 5) - 0.08, id: 2568, v: 0.18 }, // protein
    { at: W(6, 6) - 0.08, id: 2568, v: 0.18 }, // enerji
    { at: W(6, 8) - 0.08, id: 2568, v: 0.18 }, // uyku
    { at: skip - 0.05, id: 2182, v: 0.22 }, // ÖĞÜN ATLANDI mührü
    { at: W(8, 4) - 0.08, id: 2299, v: 0.14, lead: 0.05 }, // "yarım kaldı"
    { at: neq - 0.05, id: 1143, v: 0.2, lead: 0.14, dur: 1.2, fade: 0.6 }, // ≠
    { at: W(10, 7) - 0.05, id: 1120, v: 0.3, lead: 0.1 }, // büyür ✓
  ];
  /** müzik acı anında ("hiçbir şey değişmedi") ve "yarım kaldı"da hafifçe kısılır */
  const duck = (mt: number) => Math.min(1 - 0.45 * win(mt, nothing - 0.2, L(3) + 0.3, 0.4), 1 - 0.35 * win(mt, W(8, 3) - 0.1, L(9) + 0.2, 0.3));

  // fon rengi sahneye göre değişir; son sahne = ilk sahne (döngü)
  const GYM: [string, string] = ["#5b6b8f", "#3f4b6c"];
  const SCENE_BG: [number, string, string][] = [
    [0, ...GYM],
    [4, "#fbe3dc", "#f2c9bd"], // kasın içi: açık pembe
    [7, "#e6dcf5", "#cfc0ea"], // evde: lila
    [8, "#fbe3dc", "#f2c9bd"], // kasın içi
    [9, "#d4ebe0", "#b9dccb"], // karşılaştırma: mint
    [10, "#ffe3b8", "#f8c98f"], // büyür: sıcak
    [11, ...GYM], // kapanış = kanca
  ];
  let bgTop = SCENE_BG[0][1];
  let bgBot = SCENE_BG[0][2];
  for (let k = 1; k < SCENE_BG.length; k++) {
    const at = L(SCENE_BG[k][0]);
    bgTop = interpolateColors(t, [at - 0.15, at + 0.25], [bgTop, SCENE_BG[k][1]]);
    bgBot = interpolateColors(t, [at - 0.15, at + 0.25], [bgBot, SCENE_BG[k][2]]);
  }

  // kasın içi: üç bölümde aynı görünüm farklı durumlarla
  const inside = Math.max(sIn1, s8, s10);
  const mv =
    t < L(7)
      ? { dmg, sig: sig * (1 - need(0) * 0.5), supply: 0.15 * need(0) + 0.3 * need(1) + 0.55 * need(2), repair: 0.34 * need(2), grow: 0, empty: 0 }
      : t < L(10) - 0.1
        ? { dmg: 1, sig: 0.5, supply: 0.12, repair: half, grow: 0, empty: 1 }
        : { dmg: 1, sig: 0.5 * (1 - fed), supply: 0.12 + 0.88 * fed, repair: full, grow, empty: 1 - fed };
  const insideIn = sm(t, L(4) - 0.05, L(4) + 0.55);

  return (
    <AbsoluteFill lang="tr" style={{ background: bgTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="bs-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBot} />
          </linearGradient>
          <radialGradient id="bs-glow" cx="50%" cy="40%" r="55%">
            <stop offset="0" stopColor="#ffffff" stopOpacity={0.3} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="bs-vig" cx="50%" cy="45%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.22} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#bs-bg)" />
        <rect width={1080} height={1920} fill="url(#bs-glow)" />

        {/* ===== salon (ortak fon) ===== */}
        <g opacity={1 - inside}>
          <Floor tint="#2a2a3a" />
        </g>
        {gym > 0 ? (
          <g opacity={gym} transform={diveT}>
            <GymSign x={90} y={170} />
            <Rack x={600} y={520} />
            <Plates x={180} />
          </g>
        ) : null}

        {/* ===== 0: kanca (ilk karede ekranda; döngüde son karede de) ===== */}
        {s0 > 0 ? (
          <g opacity={s0}>
            <Txt x={540} y={430} size={84} fill="#ffffff" sw={16}>
              HER GÜN SALONDA…
            </Txt>
            <Txt x={540} y={560} size={124} fill={Y} sw={18}>
              KAS YOK?
            </Txt>
            <HeroAt uid="bs0" x={400} s={0.92} t={t} pose={{ r: { el: [300, 540], wr: [296, 690] }, head: 3, lx: 4, ly: 4 }} item={DB} expr="ouch" />
            <Sweat t={t} pts={[[330, 760], [440, 740]]} />
          </g>
        ) : null}

        {/* ===== 1: ağırlık kaldırıyor, ter döküyor ===== */}
        {s1 > 0 ? (
          <g opacity={s1}>
            <HeroAt
              uid="bs1"
              x={400}
              s={1.0}
              t={t}
              pose={{
                r: { el: [298, 530], wr: [306 - 20 * rep, 690 - 270 * rep] },
                head: -2,
              }}
              item={DB}
              expr={rep > 0.6 ? "ouch" : "neutral"}
            />
            <Sweat t={t} pts={[[330, 640], [460, 620], [400, 600]]} />
            <Pill x={820} y={360} text={`${reps}. TEKRAR`} o={sm(t, L(1) + 0.2, L(1) + 0.5)} color={Y} size={54} />
            <Pill x={820} y={480} text="4. SET" o={sm(t, W(1, 2) - 0.1, W(1, 2) + 0.2)} size={46} />
            <Pill x={820} y={600} text="SINIR!" o={sm(t, W(1, 4) - 0.1, W(1, 4) + 0.2)} color={RED} ink="#fff" size={50} />
          </g>
        ) : null}

        {/* ===== 2: haftalar geçti… aynada hiçbir şey değişmedi ===== */}
        {s2 > 0 ? (
          <g opacity={s2}>
            <Weeks x={80} y={180} p={weeks} o={sm(t, L(2), L(2) + 0.3) * (1 - sm(t, nothing - 0.3, nothing))} />
            <Mirror x={600} y={330} w={400} h={1050} uid="bs2m">
              <HeroAt uid="bs2r" x={800} y={1430} s={0.95} t={t} pose={{ l: { el: [60, 440], wr: [82, 318], hand: "fist" }, head: -4, lx: -6, ly: -2 }} expr={t > nothing ? "ouch" : "grin"} />
              <rect x={600} y={330} width={400} height={1050} fill="#bcd3e8" opacity={0.25} />
            </Mirror>
            {(() => {
              const p = sm(t, nothing - 0.15, nothing + 0.45);
              const c: [number, number] = [800 - (200 - 80) * 0.95, 1430 - (880 - 380) * 0.95];
              return p > 0 ? (
                <ellipse cx={c[0]} cy={c[1]} rx={95} ry={115} fill="none" stroke={RED} strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} transform={`rotate(-90 ${c[0]} ${c[1]})`} strokeLinecap="round" />
              ) : null;
            })()}
            <Pill x={800} y={250} text="HÂLÂ AYNI" o={sm(t, nothing, nothing + 0.3)} color={RED} ink="#fff" size={56} />
            <Pill x={280} y={360} text="8. HAFTA" o={sm(t, nothing - 0.1, nothing + 0.2)} color={Y} size={56} />
            <HeroAt uid="bs2" x={300} s={1.02} t={t} pose={t > nothing ? { lx: 5, ly: 3, head: 3 } : FLEX} expr={t > nothing ? "ouch" : "grin"} />
          </g>
        ) : null}

        {/* ===== 3: neden mi? kola yaklaşılır, kasın içine girilir ===== */}
        {s3 > 0 ? (
          <g opacity={s3 * (1 - sm(t, L(4) - 0.2, L(4) + 0.02))} transform={diveT}>
            <HeroAt uid="bs3" x={540} s={HS} t={t} pose={t < W(3, 2) - 0.1 ? { head: 3, lx: 3 } : { ...FLEX, r: { el: [340, 440], wr: [318, 318], hand: "fist" } }} expr={t < W(3, 2) - 0.1 ? "think" : "smile"} />
            {/* kasa doğru hedef halkası */}
            {(() => {
              const p = sm(t, W(3, 3) - 0.1, W(3, 3) + 0.3);
              return p > 0 ? <circle cx={bicep[0]} cy={bicep[1]} r={70} fill="none" stroke={Y} strokeWidth={9} opacity={p} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} /> : null;
            })()}
          </g>
        ) : null}

        {/* ===== 4-6, 8, 10: kasın içi ===== */}
        {inside > 0 ? (
          <g opacity={inside}>
            <g transform={`translate(540,680) scale(${t < L(5) ? 1.25 - 0.25 * insideIn : 1}) translate(-540,-680)`}>
              <MuscleView t={t} {...mv} />
            </g>
            {/* başlıklar */}
            <Pill x={540} y={150} text="KASIN İÇİ" o={sIn1 * sm(t, L(4) + 0.2, L(4) + 0.5) * (1 - sm(t, L(5) - 0.2, L(5)))} size={50} />
            <Pill x={540} y={150} text="SİNYAL: GÜÇLEN!" o={sIn1 * sm(t, L(5) + 0.1, L(5) + 0.4) * (1 - sm(t, L(6) - 0.2, L(6)))} color={Y} size={52} />
            <Pill x={540} y={150} text="TAMİR İÇİN MALZEME" o={sIn1 * sm(t, L(6) + 0.1, L(6) + 0.4)} size={50} />
            {/* hasar etiketi */}
            <Pill x={380} y={rowY(1) - 95} text="HASAR" o={sIn1 * sm(t, W(4, 5) - 0.1, W(4, 5) + 0.2) * (1 - sm(t, L(5) - 0.2, L(5)))} color="#ffffff" size={44} />
            {/* üç malzeme */}
            {[
              ["PROTEİN", BLUE, 0],
              ["ENERJİ", Y, 1],
              ["UYKU", PURPLE, 2],
            ].map(([label, color, k]) => {
              const kk = k as number;
              const o = sIn1 * need(kk === 2 ? 3 : kk);
              return <Pill key={kk} x={200 + kk * 340} y={1230} text={label as string} o={o} color={color as string} ink={kk === 1 ? INK : "#ffffff"} size={50} />;
            })}
            {/* 8: malzeme yok, tamir yarım */}
            <Pill x={540} y={150} text="MALZEME YOK" o={s8 * sm(t, L(8) + 0.1, L(8) + 0.4)} color={RED} ink="#fff" size={52} />
            <g opacity={Math.max(s8, s10)}>
              <Bar x={170} y={1225} w={740} label="TAMİR" v={t < L(10) ? half : full} color={t < L(10) ? RED : GREEN} o={1} />
            </g>
            {/* 10: sofrada + yatakta büyür */}
            <Pill x={540} y={150} text="SALONDA YORULUR" o={s10 * sm(t, L(10) + 0.1, L(10) + 0.4) * (1 - sm(t, W(10, 3) - 0.2, W(10, 3)))} size={50} />
            <Pill x={540} y={150} text="SOFRADA + YATAKTA BÜYÜR" o={s10 * sm(t, W(10, 3) + 0.05, W(10, 3) + 0.35)} color={Y} size={48} />
            <Check x={930} y={1255} s={34} p={s10 * sm(t, W(10, 7), W(10, 7) + 0.4)} />
          </g>
        ) : null}

        {/* ===== 7: evde: öğün atlar, gelişigüzel yer ===== */}
        {s7 > 0 ? (
          <g opacity={s7}>
            {/* masa */}
            <rect x={80} y={1080} width={920} height={40} rx={14} fill="#c98b5a" stroke={INK} strokeWidth={7} />
            <rect x={130} y={1120} width={30} height={280} fill="#a86e44" stroke={INK} strokeWidth={6} />
            <rect x={920} y={1120} width={30} height={280} fill="#a86e44" stroke={INK} strokeWidth={6} />
            {/* boş tabak */}
            <g opacity={sm(t, L(7) + 0.1, L(7) + 0.4)}>
              <ellipse cx={300} cy={1060} rx={150} ry={40} fill="#ffffff" stroke={INK} strokeWidth={7} />
              <ellipse cx={300} cy={1056} rx={100} ry={24} fill="none" stroke={INK} strokeWidth={3} opacity={0.25} />
              <Cross x={300} y={940} s={50} p={sm(t, skip - 0.05, skip + 0.3)} />
            </g>
            <Pill x={270} y={700} text="ÖĞÜN ATLANDI" o={sm(t, skip, skip + 0.3)} color={RED} ink="#fff" size={48} />
            {/* gelişigüzel: hamburger + pizza */}
            <g opacity={sm(t, junk - 0.15, junk + 0.2)}>
              <Burger x={850} y={1010} s={0.9} />
              <Pill x={820} y={820} text="NE BULURSA" o={1} color={Y} size={48} />
            </g>
            <HeroAt
              uid="bs7"
              x={560}
              s={0.88}
              t={t}
              pose={t < junk - 0.1 ? { head: -3, lx: -4, ly: 2 } : { r: { el: [300, 560], wr: [262, 420] }, head: 3 }}
              item={t < junk - 0.1 ? undefined : <Pizza x={0} y={-20} s={0.55} rot={-20} />}
              expr={t < junk - 0.1 ? "neutral" : "chew"}
            />
            <Moon x={900} y={330} r={60} />
          </g>
        ) : null}

        {/* ===== 9: daha çok çalışmak ≠ daha iyi sonuç ===== */}
        {s9 > 0 ? (
          <g opacity={s9}>
            <g opacity={sm(t, L(9) + 0.05, L(9) + 0.35)}>
              <rect x={70} y={190} width={940} height={330} rx={44} fill="#ffffff" stroke={INK} strokeWidth={9} />
              <Txt x={540} y={300} size={68} fill={INK} sw={0}>
                DAHA ÇOK ÇALIŞMAK
              </Txt>
              <g opacity={sm(t, neq - 0.1, neq + 0.25)}>
                <Txt x={540} y={385} size={70} fill={RED} sw={0}>
                  ≠
                </Txt>
              </g>
              <g opacity={sm(t, W(9, 5) - 0.1, W(9, 5) + 0.25)}>
                <Txt x={540} y={470} size={68} fill={INK} sw={0}>
                  DAHA İYİ SONUÇ
                </Txt>
              </g>
            </g>
            <Bar x={110} y={680} w={860} label="ANTRENMAN" v={0.98 * sm(t, L(9) + 0.3, L(9) + 1.0)} color={RED} o={sm(t, L(9) + 0.2, L(9) + 0.5)} />
            <Bar x={110} y={870} w={860} label="BESLENME" v={0.25 * sm(t, L(9) + 0.7, L(9) + 1.4)} color={BLUE} o={sm(t, L(9) + 0.6, L(9) + 0.9)} />
            <Bar x={110} y={1060} w={860} label="UYKU" v={0.3 * sm(t, L(9) + 1.1, L(9) + 1.8)} color={PURPLE} o={sm(t, L(9) + 1.0, L(9) + 1.3)} />
          </g>
        ) : null}

        {/* ===== 11: gönder (sonra kanca karesi geri gelir) ===== */}
        {s11 > 0 ? (
          <g opacity={s11}>
            <HeroAt uid="bs11" x={480} s={0.86} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="grin" item={<PhoneItem />} />
            <g opacity={sm(t, L(11) + 0.15, L(11) + 0.45)}>
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

        <rect width={1080} height={1920} fill="url(#bs-vig)" />
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
      {/* konuşmanın altında kısık müzik; döngü için sonda hafifçe söner */}
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
