/**
 * "Beslenmene dikkat etmeden spor yaparsan ne olur?" (~38 sn). Kullanıcının örnek videosundaki gibi hikâyeleştirildi: kanca izleyicinin
 * kendi sorusu ("Her gün antrenman yapıyorum… neden hâlâ kas yapamıyorum?"), sonra kasın içi ve bir benzetme: baretli "tamir ekibi"
 * hasar mesajını alır ama malzeme yok ("Protein yok, enerji yok, uyku yok"); onarım için üç şey, öğün atlayınca tamir yarım kalır,
 * daha çok çalışmak ≠ daha iyi sonuç, "kas salonda yorulur, sofrada ve yatakta büyür" (ekip malzemeyle çalışır, lifler kalınlaşır)
 * ve döngü: son cümle tamamlanır, görüntü kancaya döner (son kare = ilk kare).
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
import { Burger, Check, Cross, Dumbbell, Floor, PhoneItem, Pill, Pizza, Txt } from "./GeceYemek";

loadFonts();

const Y = "#FFC83D";
const RED = "#ff5a4e";
const GREEN = "#47c96b";
const BLUE = "#4aa3ff";
const PURPLE = "#9a7cf0";
const FLOOR = 1400;

export const BS_LINES: Line[] = [
  { text: "Her gün antrenman yapıyorum… neden hâlâ kas yapamıyorum?", hl: ["hâlâ", "yapamıyorum?"], hold: 0.3 },
  { text: "Sen ağırlığı kaldırırken, kasının içinde minicik hasarlar açılır.", hl: ["minicik", "hasarlar"], hold: 0.2 },
  { text: "Ve vücudundaki tamir ekibine şöyle bir mesaj gider:", hl: ["tamir", "ekibine"], hold: 0.2 },
  { text: "“Kol kası hasarlı! Hemen onarın, daha güçlü yapın!”", hl: ["hasarlı!", "güçlü"], hold: 0.3 },
  { text: "Ekip hazır… ama bir sorun var.", hl: ["sorun"], hold: 0.3 },
  { text: "“Şefim, malzeme gelmedi. Protein yok, enerji yok, uyku yok.”", hl: ["Protein", "enerji", "uyku"], hold: 0.4 },
  { text: "Çünkü onarım için üç şey lazım: protein, yeterli enerji ve uyku.", hl: ["protein,", "enerji", "uyku."], hold: 0.3 },
  { text: "Öğün atlayınca ya da gelişigüzel yiyince, tamir yarım kalır.", hl: ["atlayınca", "gelişigüzel", "yarım"], hold: 0.3 },
  { text: "Yani daha çok çalışmak, her zaman daha iyi sonuç demek değil.", hl: ["çok", "değil."], hold: 0.3 },
  { text: "Kas salonda yorulur… ama sofrada ve yatakta büyür.", hl: ["sofrada", "yatakta", "büyür."], hold: 0.4 },
  { text: "Bunu, her gün salona gidip hâlâ değişmeyen o arkadaşına gönder.", hl: ["gönder."], hold: 0.6 },
];

/** tamir ekibinin konuşmaları (altyazı açık mavi) */
const QUOTE = [3, 5];

/** döngü: son cümleden sonra kısa bekleme, sonra kanca karesine yumuşak geçiş (son kare = ilk kare) */
export const BS_TAIL = 0.5;
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
  if (i < 0) return null;
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
              color: hl.includes(norm(w)) ? Y : QUOTE.includes(i) ? "#bfe6ff" : "#ffffff",
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

// ------------------------------------------------------------ tamir ekibi (benzetme): baretli minik hücreler

type CrewPose = "idle" | "salute" | "shrug" | "talk" | "work";
type CrewExpr = "happy" | "sad" | "alert";

const Wrench: React.FC<{ rot: number }> = ({ rot }) => (
  <g transform={`rotate(${rot})`}>
    <rect x={-6} y={-46} width={12} height={46} rx={5} fill="#8b93a6" stroke={INK} strokeWidth={4} />
    <path d="M-16,-46 Q-18,-64 -4,-68 L-4,-56 L4,-56 L4,-68 Q18,-64 16,-46 Z" fill="#8b93a6" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

/** ayak ortası (x, y); ~170 birim boy */
const Crew: React.FC<{ x: number; y: number; s?: number; t: number; pose?: CrewPose; expr?: CrewExpr; talk?: boolean; body?: string; flip?: boolean; o?: number }> = ({
  x,
  y,
  s = 1,
  t,
  pose = "idle",
  expr = "happy",
  talk = false,
  body = "#ffd2c4",
  flip = false,
  o = 1,
}) => {
  if (o <= 0) return null;
  const bob = Math.sin(t * 3 + x) * 3;
  const sw = Math.sin(t * 8 + x) * 25;
  const hands: Record<CrewPose, [[number, number], [number, number]]> = {
    idle: [[-78, -40], [78, -40]],
    salute: [[-78, -40], [34, -150]],
    shrug: [[-104, -118], [104, -118]],
    talk: [[-78, -40], [36, -92]],
    work: [[-78, -40], [92, -120]],
  };
  const [hl, hr] = hands[pose];
  const mouthOpen = talk ? 0.5 + 0.5 * Math.abs(Math.sin(t * 14)) : 0;
  return (
    <g opacity={o} transform={`translate(${x},${y + bob}) scale(${flip ? -s : s},${s})`}>
      {/* bacaklar */}
      {[-22, 22].map((dx) => (
        <g key={dx}>
          <line x1={dx} y1={-30} x2={dx} y2={-6} stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <ellipse cx={dx + (dx < 0 ? -6 : 6)} cy={-4} rx={16} ry={9} fill="#3b3f58" stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {/* kollar */}
      {([
        [-50, -70, hl],
        [50, -70, hr],
      ] as [number, number, [number, number]][]).map(([sx, sy, h], k) => (
        <g key={k}>
          <path d={`M${sx},${sy} Q${(sx + h[0]) / 2 + (k ? 10 : -10)},${(sy + h[1]) / 2 + 12} ${h[0]},${h[1]}`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
          <path d={`M${sx},${sy} Q${(sx + h[0]) / 2 + (k ? 10 : -10)},${(sy + h[1]) / 2 + 12} ${h[0]},${h[1]}`} fill="none" stroke={body} strokeWidth={8} strokeLinecap="round" />
          <circle cx={h[0]} cy={h[1]} r={11} fill={body} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {pose === "work" ? (
        <g transform={`translate(${hr[0]},${hr[1]})`}>
          <Wrench rot={sw} />
        </g>
      ) : null}
      {pose === "talk" ? (
        <g transform={`translate(${hr[0] + 6},${hr[1] - 10})`}>
          <rect x={-12} y={-28} width={24} height={44} rx={6} fill="#2b2f45" stroke={INK} strokeWidth={4} />
          <line x1={6} y1={-28} x2={8} y2={-46} stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <circle cx={0} cy={-10} r={5} fill={Math.sin(t * 10) > 0 ? GREEN : "#1e6b38"} />
        </g>
      ) : null}
      {/* gövde (hücre) */}
      <ellipse cx={0} cy={-88} rx={64} ry={70} fill={body} stroke={INK} strokeWidth={6} />
      <ellipse cx={-22} cy={-118} rx={18} ry={11} fill="#ffffff" opacity={0.45} />
      <circle cx={18} cy={-70} r={10} fill="#e98f86" opacity={0.5} />
      {/* yelek */}
      <path d="M-50,-50 Q0,-32 50,-50 L44,-26 Q0,-12 -44,-26 Z" fill="#ff9a3d" stroke={INK} strokeWidth={4} />
      <path d="M-46,-38 Q0,-22 46,-38" stroke="#fff6c8" strokeWidth={5} fill="none" />
      {/* yüz */}
      {[-20, 20].map((dx) => (
        <g key={dx}>
          <ellipse cx={dx} cy={-96} rx={7} ry={expr === "alert" ? 10 : 8} fill={INK} />
          <circle cx={dx + 2} cy={-99} r={2.5} fill="#fff" />
          {expr === "sad" ? <line x1={dx - 10} y1={-114 + (dx < 0 ? 4 : -4) * -1} x2={dx + 10} y2={-114 + (dx < 0 ? -4 : 4) * -1} stroke={INK} strokeWidth={4} strokeLinecap="round" /> : null}
        </g>
      ))}
      <circle cx={-34} cy={-80} r={8} fill="#ff8f8f" opacity={0.5} />
      <circle cx={34} cy={-80} r={8} fill="#ff8f8f" opacity={0.5} />
      {mouthOpen > 0 ? (
        <ellipse cx={0} cy={-74} rx={9} ry={4 + 6 * mouthOpen} fill="#7a2a2a" stroke={INK} strokeWidth={3} />
      ) : expr === "sad" ? (
        <path d="M-12,-68 Q0,-78 12,-68" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      ) : expr === "alert" ? (
        <ellipse cx={0} cy={-73} rx={7} ry={6} fill="#7a2a2a" stroke={INK} strokeWidth={3} />
      ) : (
        <path d="M-13,-76 Q0,-62 13,-76" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      )}
      {/* baret */}
      <path d="M-54,-136 Q-52,-188 0,-190 Q52,-188 54,-136 Z" fill={Y} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-68} y={-140} width={136} height={14} rx={7} fill={Y} stroke={INK} strokeWidth={5} />
      <path d="M0,-188 L0,-140" stroke="#e0a320" strokeWidth={8} />
    </g>
  );
};

/** malzeme kasası (boş ya da dolu) */
const Crate: React.FC<{ x: number; y: number; full: number; t: number; o: number }> = ({ x, y, full, t, o }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y})`}>
      <rect x={-90} y={-70} width={180} height={70} rx={8} fill="#3a1f18" />
      {full > 0.01
        ? [0, 1, 2, 3, 4].map((k) => <Particle key={k} x={-60 + k * 30} y={-70 - 6 * Math.sin(k)} kind={k % 3} o={full} rot={Math.sin(t * 2 + k) * 10} />)
        : null}
      <rect x={-96} y={-56} width={192} height={60} rx={10} fill="#c98b5a" stroke={INK} strokeWidth={6} />
      <line x1={-96} y1={-26} x2={96} y2={-26} stroke={INK} strokeWidth={4} opacity={0.4} />
      <text x={0} y={-16} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={INK}>
        MALZEME
      </text>
    </g>
  );

/** kastan ekibe giden mesaj ekranı */
const Message: React.FC<{ x: number; y: number; o: number; t: number; lines: [string, string] }> = ({ x, y, o, t, lines }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y + (1 - o) * 14})`}>
      <rect x={-430} y={-120} width={860} height={240} rx={34} fill="#2b2f45" stroke={INK} strokeWidth={8} />
      <circle cx={-340} cy={0} r={52} fill={RED} stroke={INK} strokeWidth={6} opacity={0.75 + 0.25 * Math.sin(t * 8)} />
      <text x={-340} y={26} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={76} fill="#fff">
        !
      </text>
      <text x={-260} y={-14} fontFamily={SANS} fontWeight={800} fontSize={58} fill="#ffffff">
        {lines[0]}
      </text>
      <text x={-260} y={62} fontFamily={SANS} fontWeight={800} fontSize={40} fill={Y}>
        {lines[1]}
      </text>
    </g>
  );

/** malzeme kartı: ikon + etiket */
const NeedCard: React.FC<{ x: number; o: number; label: string; color: string; children: React.ReactNode }> = ({ x, o, label, color, children }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(0,${(1 - o) * 18})`}>
      <rect x={x} y={330} width={300} height={430} rx={36} fill="#ffffff" stroke={INK} strokeWidth={8} />
      <circle cx={x + 150} cy={500} r={100} fill={color} opacity={0.22} />
      <g transform={`translate(${x + 150},500)`}>{children}</g>
      <text x={x + 150} y={710} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46} fill={INK}>
        {label}
      </text>
    </g>
  );

/** yumurta + tavuk but (protein) */
const ProteinIcon: React.FC = () => (
  <g>
    <ellipse cx={-30} cy={10} rx={40} ry={52} fill="#fff8ec" stroke={INK} strokeWidth={6} />
    <g transform="translate(36,4) rotate(30)">
      <ellipse cx={0} cy={-10} rx={34} ry={42} fill="#d9853b" stroke={INK} strokeWidth={6} />
      <rect x={-8} y={26} width={16} height={36} rx={6} fill="#fff8ec" stroke={INK} strokeWidth={5} />
      <circle cx={-9} cy={64} r={10} fill="#fff8ec" stroke={INK} strokeWidth={5} />
      <circle cx={9} cy={64} r={10} fill="#fff8ec" stroke={INK} strokeWidth={5} />
    </g>
  </g>
);

/** pirinç kâsesi + şimşek (enerji) */
const EnergyIcon: React.FC = () => (
  <g>
    <path d="M-70,0 L70,0 Q64,62 0,66 Q-64,62 -70,0 Z" fill="#7fc8ff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-62,0 Q-40,-36 0,-34 Q40,-36 62,0 Z" fill="#ffffff" stroke={INK} strokeWidth={5} />
    <g transform="translate(46,-56) scale(1.5)">
      <path d="M6,-26 L-14,4 L0,4 L-6,26 L14,-6 L0,-6 Z" fill={Y} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    </g>
  </g>
);

/** yastık + ay (uyku) */
const SleepIcon: React.FC = () => (
  <g>
    <rect x={-74} y={4} width={148} height={64} rx={30} fill="#e9e2ff" stroke={INK} strokeWidth={6} />
    <g transform="translate(10,-46)">
      <circle r={40} fill={PURPLE} stroke={INK} strokeWidth={6} />
      <circle cx={18} cy={-12} r={34} fill="#ffffff" />
    </g>
    <text x={-56} y={-40} fontFamily={SANS} fontWeight={800} fontSize={40} fill={INK}>
      z
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
  const loopIn = sm(t, T - 0.24, T - 0.03);

  // ===== 0-1: salonda dambıl; "kasının içinde" kelimesinde pazıya dalınır
  const enter = W(1, 3); // "kasının"
  const s0 = Math.max(win(t, -1, enter + 0.02, 0.21), loopIn);
  // döngü: son karede kanca, ilk karedeki hareketin aynısıyla gelir
  const tc = t > L(10) ? t - T : t;
  const rep = 0.5 - 0.5 * Math.cos(tc * 4.2);
  const dive = sm(t, enter - 0.6, enter + 0.02);
  // ===== kasın içi: hasar → mesaj → ekip → malzeme yok
  const sIn = win(t, enter - 0.02, L(6) + 0.02, 0.21);
  const dmg = sm(t, W(1, 6) - 0.2, W(1, 8) + 0.3);
  const sig = sm(t, L(2), L(2) + 0.4);
  const crewIn = sm(t, W(2, 2) - 0.2, W(2, 2) + 0.2);
  const msg = win(t, L(3) - 0.05, L(4) + 0.1, 0.25);
  const problem = W(4, 4); // "sorun"
  const no = (k: number) => sm(t, W(5, 4 + 2 * k) - 0.1, W(5, 4 + 2 * k) + 0.25); // protein / enerji / uyku yok
  // ===== 6: üç malzeme kartı
  const s6 = scene(6, 7);
  const need = (k: number) => sm(t, W(6, 6 + 2 * k) - 0.15, W(6, 6 + 2 * k) + 0.2);
  // ===== 7: evde: öğün atlanır / gelişigüzel yemek → tamir yarım
  const s7 = scene(7, 8);
  const skip = W(7, 1);
  const junk = W(7, 4);
  const half = interpolate(t, [W(7, 6), W(7, 8)], [0, 0.34], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // ===== 8: daha çok ≠ daha iyi
  const s8 = scene(8, 9);
  const neq = W(8, 9);
  // ===== 9: sofrada ve yatakta büyür
  const s9 = scene(9, 10);
  const fed = sm(t, W(9, 3) - 0.1, W(9, 4) + 0.2);
  const full = interpolate(t, [W(9, 4), W(9, 7)], [0.34, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const grow = sm(t, W(9, 7) - 0.15, W(9, 7) + 0.6);
  // ===== 10: gönder → döngü
  const s10 = win(t, L(10) - 0.02, T - 0.25, 0.18);

  // salon: kanca ve kapanışta ortak; içeri girişte kahramanla birlikte büyür
  const gym = Math.max(win(t, -1, enter + 0.02, 0.21), win(t, L(10) - 0.02, T + 1, 0.21));
  const HS = 1.0;
  const HX = 540;
  const bicep: [number, number] = [HX + (282 - 200) * HS, FLOOR - (880 - 446) * HS];
  const zoom = t > enter + 0.1 ? 1 : 1 + 3.4 * dive * dive;
  const diveT = `translate(${bicep[0]},${bicep[1]}) scale(${zoom}) translate(${-bicep[0]},${-bicep[1]})`;

  // ses efektleri (Mixkit, public/sfx): az, kısık, olay anında. Pop/woosh/komik efekt yok.
  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number; fin?: number }[] = [
    { at: 0, id: 2299, v: 0.3, lead: 0.05 }, // kanca: yumuşak bas
    { at: enter - 0.95, id: 790, v: 0.16, lead: 0.61, dur: 1.0, fade: 0.3 }, // içeri giriş: hafif yükseliş
    { at: enter + 0.05, id: 1143, v: 0.22, lead: 0.14, dur: 1.4, fade: 0.7 }, // kasın içi açılır
    { at: W(2, 2) - 0.08, id: 2568, v: 0.16 }, // tamir ekibi
    { at: L(3) - 0.02, id: 2568, v: 0.2 }, // mesaj ekranı
    { at: problem - 0.08, id: 2299, v: 0.16, lead: 0.05 }, // "sorun var"
    { at: W(5, 4) - 0.08, id: 2568, v: 0.16 }, // protein yok
    { at: W(5, 6) - 0.08, id: 2568, v: 0.16 }, // enerji yok
    { at: W(5, 8) - 0.08, id: 2568, v: 0.16 }, // uyku yok
    { at: W(6, 6) - 0.08, id: 2568, v: 0.18 }, // protein kartı
    { at: W(6, 8) - 0.08, id: 2568, v: 0.18 }, // enerji kartı
    { at: W(6, 10) - 0.08, id: 2568, v: 0.18 }, // uyku kartı
    { at: skip - 0.05, id: 2182, v: 0.22 }, // ÖĞÜN ATLANDI mührü
    { at: neq - 0.05, id: 1143, v: 0.2, lead: 0.14, dur: 1.2, fade: 0.6 }, // ≠
    { at: W(9, 7) - 0.05, id: 1120, v: 0.3, lead: 0.1 }, // büyür ✓
  ];
  /** müzik "sorun var" anında hafifçe kısılır */
  const duck = (mt: number) => 1 - 0.4 * win(mt, problem - 0.2, L(6), 0.4);

  // fon rengi sahneye göre değişir; son sahne = ilk sahne (döngü)
  const GYM: [string, string] = ["#5b6b8f", "#3f4b6c"];
  const PINK: [string, string] = ["#fbe3dc", "#f2c9bd"];
  const bgAt: [number, string, string][] = [
    [0, ...GYM],
    [enter, ...PINK], // kasın içi
    [L(6), "#d4ebe0", "#b9dccb"], // malzemeler: mint
    [L(7), "#e6dcf5", "#cfc0ea"], // evde: lila
    [L(8), "#d6e6f5", "#b8d0ea"], // karşılaştırma: açık mavi
    [L(9), "#ffe3b8", "#f8c98f"], // büyür: sıcak
    [L(10), ...GYM], // kapanış = kanca
  ];
  let bgTop = bgAt[0][1];
  let bgBot = bgAt[0][2];
  for (let k = 1; k < bgAt.length; k++) {
    const at = bgAt[k][0];
    bgTop = interpolateColors(t, [at - 0.15, at + 0.25], [bgTop, bgAt[k][1]]);
    bgBot = interpolateColors(t, [at - 0.15, at + 0.25], [bgBot, bgAt[k][2]]);
  }

  // kasın içi: iki bölümde aynı görünüm farklı durumlarla
  const inside = Math.max(sIn, s9);
  const mv =
    t < L(7)
      ? { dmg, sig: sig * (1 - no(0) * 0.6), supply: 0, repair: 0, grow: 0, empty: sm(t, problem, problem + 0.4) }
      : { dmg: 1, sig: 0.5 * (1 - fed), supply: 0.08 + 0.92 * fed, repair: full, grow, empty: 1 - fed };
  const insideIn = sm(t, enter - 0.05, enter + 0.55);
  // ekip pozları
  const c1: CrewPose = t < L(3) ? "idle" : t < L(4) ? "talk" : t < problem - 0.1 ? "salute" : "shrug";
  const c2: CrewPose = t < L(3) ? "idle" : t < problem - 0.1 ? "work" : "shrug";
  const cExpr: CrewExpr = t < L(3) ? "happy" : t < problem - 0.1 ? "alert" : "sad";

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
        <g opacity={Math.max(gym, s7)}>
          <Floor tint="#2a2a3a" />
        </g>
        {gym > 0 ? (
          <g opacity={gym} transform={diveT}>
            <GymSign x={90} y={170} />
            <Rack x={620} y={560} />
            <Plates x={170} />
          </g>
        ) : null}

        {/* ===== 0-1: kanca + dambıl, sonra pazıya dalış (döngüde son karede de) ===== */}
        {s0 > 0 ? (
          <g opacity={s0}>
            <g opacity={1 - sm(t, L(1) - 0.1, L(1) + 0.3) + loopIn}>
              <Txt x={540} y={380} size={72} fill="#ffffff" sw={16}>
                HER GÜN ANTRENMAN…
              </Txt>
              <Txt x={540} y={505} size={116} fill={Y} sw={18}>
                KAS NEREDE?
              </Txt>
            </g>
            <g transform={diveT}>
              <HeroAt
                uid="bs0"
                x={HX}
                s={HS}
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
            <g transform={`translate(540,680) scale(${t < L(2) ? 1.25 - 0.25 * insideIn : 1}) translate(-540,-680)`}>
              <MuscleView t={t} {...mv} />
            </g>
            <Pill x={540} y={150} text="KASIN İÇİ" o={sIn * sm(t, enter + 0.2, enter + 0.5) * (1 - sm(t, L(2) - 0.2, L(2)))} size={50} />
            <Pill x={380} y={rowY(1) - 95} text="HASAR" o={sIn * sm(t, W(1, 7) - 0.1, W(1, 7) + 0.2) * (1 - sm(t, L(2) - 0.2, L(2)))} color="#ffffff" size={44} />
            <Pill x={540} y={150} text="SİNYAL GİTTİ" o={sIn * sm(t, L(2) + 0.1, L(2) + 0.4) * (1 - sm(t, L(3) - 0.2, L(3)))} color={Y} size={50} />

            {/* mesaj ekranı */}
            <Message x={540} y={420} o={sIn * msg} t={t} lines={["KOL KASI HASARLI!", "HEMEN ONARIN, GÜÇLENDİRİN"]} />

            {/* sorun: malzeme yok */}
            <Pill x={540} y={150} text="MALZEME YOK" o={sIn * sm(t, problem, problem + 0.3)} color={RED} ink="#fff" size={52} />
            {[
              ["PROTEİN", 0],
              ["ENERJİ", 1],
              ["UYKU", 2],
            ].map(([label, k]) => {
              const kk = k as number;
              const o = sIn * no(kk);
              return o > 0 ? (
                <g key={kk} opacity={o}>
                  <Pill x={200 + kk * 340} y={300} text={label as string} o={1} color="#ffffff" size={48} />
                  <Cross x={200 + kk * 340} y={300} s={34} p={no(kk)} />
                </g>
              ) : null;
            })}

            {/* tamir ekibi (benzetme): kasın altında, sinyalle birlikte gelir */}
            <g opacity={sIn * crewIn}>
              <Pill x={540} y={1160} text="TAMİR EKİBİ" o={1 - sm(t, problem - 0.2, problem)} size={40} />
              <Crate x={540} y={1435} full={0} t={t} o={sm(t, problem - 0.1, problem + 0.3)} />
              <Crew x={290} y={1435} s={1.25} t={t} pose={c1} expr={cExpr} talk={t > W(5, 0) - 0.05 && t < L(6) - 0.2} />
              <Crew x={790} y={1435} s={1.25} t={t} pose={c2} expr={cExpr} body="#ffe0b8" flip />
              <text x={540} y={1478} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={28} fill={INK} opacity={0.45}>
                benzetme
              </text>
            </g>

            {/* 9: sofrada + yatakta büyür — ekip malzemeyle çalışır */}
            <g opacity={s9}>
              <Pill x={540} y={150} text="SALONDA YORULUR" o={sm(t, L(9) + 0.1, L(9) + 0.4) * (1 - sm(t, W(9, 3) - 0.2, W(9, 3)))} size={50} />
              <Pill x={540} y={150} text="SOFRADA + YATAKTA BÜYÜR" o={sm(t, W(9, 3) + 0.05, W(9, 3) + 0.35)} color={Y} size={48} />
              <Crate x={540} y={1435} full={fed} t={t} o={1} />
              <Crew x={290} y={1435} s={1.25} t={t} pose={t > W(9, 4) ? "work" : "idle"} expr="happy" />
              <Crew x={790} y={1435} s={1.25} t={t} pose={t > W(9, 7) ? "salute" : "work"} expr="happy" body="#ffe0b8" flip />
            </g>
          </g>
        ) : null}

        {/* ===== 6: onarım için üç şey ===== */}
        {s6 > 0 ? (
          <g opacity={s6}>
            <Txt x={540} y={230} size={64} fill={INK} sw={0}>
              ONARIM İÇİN 3 ŞEY
            </Txt>
            <NeedCard x={45} o={need(0)} label="PROTEİN" color={BLUE}>
              <ProteinIcon />
            </NeedCard>
            <NeedCard x={390} o={need(1)} label="ENERJİ" color={Y}>
              <EnergyIcon />
            </NeedCard>
            <NeedCard x={735} o={need(2)} label="UYKU" color={PURPLE}>
              <SleepIcon />
            </NeedCard>
            <Crew x={540} y={1300} s={1.5} t={t} pose="talk" expr="happy" talk={t < L(7) - 0.3} />
          </g>
        ) : null}

        {/* ===== 7: evde: öğün atlar, gelişigüzel yer → tamir yarım ===== */}
        {s7 > 0 ? (
          <g opacity={s7}>
            <Bar x={170} y={260} w={740} label="TAMİR" v={half} color={RED} o={sm(t, W(7, 6) - 0.2, W(7, 6) + 0.1)} />
            <rect x={80} y={1080} width={920} height={40} rx={14} fill="#c98b5a" stroke={INK} strokeWidth={7} />
            <rect x={130} y={1120} width={30} height={280} fill="#a86e44" stroke={INK} strokeWidth={6} />
            <rect x={920} y={1120} width={30} height={280} fill="#a86e44" stroke={INK} strokeWidth={6} />
            <g opacity={sm(t, L(7) + 0.1, L(7) + 0.4)}>
              <ellipse cx={270} cy={1060} rx={150} ry={40} fill="#ffffff" stroke={INK} strokeWidth={7} />
              <ellipse cx={270} cy={1056} rx={100} ry={24} fill="none" stroke={INK} strokeWidth={3} opacity={0.25} />
              <Cross x={270} y={940} s={50} p={sm(t, skip - 0.05, skip + 0.3)} />
            </g>
            <Pill x={270} y={760} text="ÖĞÜN ATLANDI" o={sm(t, skip, skip + 0.3)} color={RED} ink="#fff" size={46} />
            <g opacity={sm(t, junk - 0.15, junk + 0.2)}>
              <Burger x={850} y={1010} s={0.9} />
              <Pill x={830} y={820} text="NE BULURSA" o={1} color={Y} size={46} />
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
          </g>
        ) : null}

        {/* ===== 8: daha çok çalışmak ≠ daha iyi sonuç ===== */}
        {s8 > 0 ? (
          <g opacity={s8}>
            <g opacity={sm(t, L(8) + 0.05, L(8) + 0.35)}>
              <rect x={70} y={190} width={940} height={330} rx={44} fill="#ffffff" stroke={INK} strokeWidth={9} />
              <Txt x={540} y={300} size={68} fill={INK} sw={0}>
                DAHA ÇOK ÇALIŞMAK
              </Txt>
              <g opacity={sm(t, neq - 0.1, neq + 0.25)}>
                <Txt x={540} y={385} size={70} fill={RED} sw={0}>
                  ≠
                </Txt>
              </g>
              <g opacity={sm(t, W(8, 5) - 0.1, W(8, 5) + 0.25)}>
                <Txt x={540} y={470} size={68} fill={INK} sw={0}>
                  DAHA İYİ SONUÇ
                </Txt>
              </g>
            </g>
            <Bar x={110} y={680} w={860} label="ANTRENMAN" v={0.95 * sm(t, L(8) + 0.3, L(8) + 1.0)} color={RED} o={sm(t, L(8) + 0.2, L(8) + 0.5)} />
            <Bar x={110} y={870} w={860} label="BESLENME" v={0.25 * sm(t, L(8) + 0.7, L(8) + 1.4)} color={BLUE} o={sm(t, L(8) + 0.6, L(8) + 0.9)} />
            <Bar x={110} y={1060} w={860} label="UYKU" v={0.3 * sm(t, L(8) + 1.1, L(8) + 1.8)} color={PURPLE} o={sm(t, L(8) + 1.0, L(8) + 1.3)} />
          </g>
        ) : null}

        {/* ===== 10: gönder (sonra kanca karesi geri gelir) ===== */}
        {s10 > 0 ? (
          <g opacity={s10}>
            <HeroAt uid="bs10" x={480} s={0.86} t={t} pose={{ r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }} expr="grin" item={<PhoneItem />} />
            <g opacity={sm(t, L(10) + 0.15, L(10) + 0.45)}>
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
