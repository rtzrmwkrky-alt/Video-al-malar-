/**
 * "Mat mı, reformer mı?" (~33 sn). SadikMusteri / TupMideSarkma tarzı kalem çizimi; tek anlatıcı (Manitam, canlı).
 * Hikâye: CAN evde matta (siyah saçlı genç), ECE stüdyoda reformerda. Kanca kıyasla acıya dokunur ("matta aylardır
 * terliyorsun… reformerdaki senden önce mi şekle giriyor?") → ekran ikiye bölünür, isimler → tarihe iniş (sepya): Pilates
 * matta doğdu, 34 hareket, alet sonra yataklı yaylardan → fark: matta destek yok, iş karında / reformerda yay hem zorlar hem
 * destek olur → kime uygun → araştırma: ikisi de gövdeyi güçlendirir → fark haftada kaç gün → Ece iki haftada bir, Can her
 * akşam → "Ece mi, Can mı? Yorumlara yaz." → başa döner (döngü). Metin `icerik/mat-reformer.seslendirme.txt`.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { HAND, SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline } from "../ornek/common";
import { LINE, type SketchLook, type SketchPose, SketchDefs, SKETCH_CAST } from "../sketch/SketchPerson";
import { Captions, type EkmekBirakProps, PAPER, RED, type TL, mix, st, voiceTimeline, wordTime } from "./EkmekBirak";
import { Hero, INK, Note, Tag } from "./SadikMusteri";
import { PowerBar, Ring, Stamp } from "./TupMideSarkma";
import { JOSEPH, OldRoomBg, RowingHero, SpringBed, StudioBg } from "./PilatesDogus";

loadFonts();

export const MR_LINES: Line[] = [
  { text: "Matta aylardır terliyorsun…", hl: ["Matta", "aylardır"], hold: 0 },
  { text: "reformerdaki senden önce mi şekle giriyor?", hl: ["reformerdaki", "önce", "şekle"], hold: 0.1 },
  { text: "Ece reformerda çalışıyor. Can evde, matta.", hl: ["Ece", "reformerda", "Can", "matta."], hold: 0.2 },
  { text: "Önce şunu bil: Pilates matta doğdu.", hl: ["Pilates", "matta", "doğdu."], hold: 0.1 },
  { text: "Joseph Pilates ilk otuz dört hareketi yerde, sadece vücut ağırlığıyla yazdı.", hl: ["otuz", "dört", "yerde,", "ağırlığıyla"], hold: 0 },
  { text: "Aleti sonra, yataktan kalkamayan hastalar için yaylarla yaptı.", hl: ["Aleti", "hastalar", "yaylarla"], hold: 0.2 },
  { text: "Fark tam burada.", hl: ["Fark"], hold: 0 },
  { text: "Matta seni tutan hiçbir şey yok, bütün iş karın kasında.", hl: ["tutan", "yok,", "karın"], hold: 0.1 },
  { text: "Reformerdaki yay ise hem zorlar hem destek olur.", hl: ["yay", "zorlar", "destek"], hold: 0.1 },
  { text: "Yeni başlayana, beli ağrıyana, daha çok güç isteyene birebir.", hl: ["başlayana,", "ağrıyana,", "güç", "birebir."], hold: 0.2 },
  { text: "Peki hangisi daha iyi? Araştırmalarda ikisi de gövdeyi güçlendiriyor.", hl: ["hangisi", "ikisi", "güçlendiriyor."], hold: 0.1 },
  { text: "Farkı aletten çok, haftada kaç gün yaptığın yaratıyor.", hl: ["aletten", "haftada", "kaç", "gün"], hold: 0.2 },
  { text: "Ece iki haftada bir gidiyor… Can her akşam matta.", hl: ["iki", "haftada", "her", "akşam"], hold: 0.1 },
  { text: "Sence üç ay sonra kim daha güçlü? Ece mi, Can mı? Yorumlara yaz.", hl: ["kim", "güçlü?", "Ece", "Can", "Yorumlara"], hold: 0.2 },
];

export const MR_TAIL = 0.9;
export const MR_TL = timeline(MR_LINES, MR_TAIL);

const CAN = SKETCH_CAST.siyah.look;
const ECE: SketchLook = { ...SKETCH_CAST.kiz.look, top: "#e58fb2", bottom: "#3f5a8a" };
const MAT = "#8e6bbf";
const FLOOR = 1400;

type S = { t: number; u: number; W: (k: number) => number; d: number };

// ------------------------------------------------------------ parçalar

/** ev: duvar, pencere, bitki, ahşap zemin */
const HomeBg: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill="#f3dcbc" />
    <g transform="translate(800,620)">
      <rect x={-170} y={-200} width={340} height={360} fill="#bcdcee" {...st} strokeWidth={5} />
      <path d="M0,-200 L0,160 M-170,-20 L170,-20" stroke={LINE} strokeWidth={6} />
      <path d="M-200,-220 Q-120,-150 -190,170 L-210,170 Z M200,-220 Q120,-150 190,170 L210,170 Z" fill="#e58f6f" {...st} />
    </g>
    <g transform="translate(230,560)">
      <rect x={-90} y={-70} width={180} height={140} fill="#f6efe2" {...st} strokeWidth={4} />
      <path d="M-70,50 L-20,-10 L20,30 L45,5 L70,50 Z" fill="#7fb07a" />
      <circle cx={40} cy={-30} r={14} fill="#f6d36b" />
    </g>
    <g transform={`translate(110,${FLOOR})`}>
      <path d="M-40,0 L40,0 L30,-90 L-30,-90 Z" fill="#c98a4a" {...st} />
      {[-50, -20, 10, 40].map((a, i) => (
        <path key={i} d={`M0,-90 Q${a},-170 ${a * 1.6},-240 Q${a * 0.6},-160 0,-90`} fill="#6aa35a" {...st} strokeWidth={3} />
      ))}
    </g>
    <rect x={0} y={FLOOR} width={1080} height={1920 - FLOOR} fill="#c9a77e" />
    {Array.from({ length: 6 }).map((_, i) => (
      <path key={i} d={`M0,${FLOOR + 60 + i * 90} L1080,${FLOOR + 60 + i * 90}`} stroke="#a7845d" strokeWidth={3} />
    ))}
    <path d={`M0,${FLOOR} L1080,${FLOOR}`} stroke={LINE} strokeWidth={4} />
  </g>
);

const Mat: React.FC<{ x?: number; color?: string }> = ({ x = 0, color = MAT }) => (
  <path d={`M${200 + x},${FLOOR + 12} L${930 + x},${FLOOR + 12} L${980 + x},${FLOOR + 62} L${150 + x},${FLOOR + 62} Z`} fill={color} {...st} strokeWidth={4} />
);

/** matta teaser: f 0 → bacaklar yerde, 1 → V; kollar bacaklara uzanır; titreme + ter */
const MatHero: React.FC<{ t: number; f: number; look?: SketchLook; expr?: "grin" | "worry" | "smile" | "surprise" | "flat"; shake?: number; sweat?: number; x?: number; seed?: number; children?: React.ReactNode }> = ({
  t,
  f,
  look = CAN,
  expr = "worry",
  shake = 0,
  sweat = 0,
  x = 360,
  seed = 0,
  children,
}) => {
  const s = 1.0;
  const jitter = Math.sin(t * 38) * 3 * shake;
  const arm = mix(70, 82, f);
  const pose: SketchPose = { sit: true, floor: f, legSide: 1, turn: 0.55, l: { a: -arm + jitter, e: 6 }, r: { a: arm + jitter, e: 6 } };
  const foot = FLOOR + 14 + 320 * s;
  return (
    <g transform={`translate(${jitter * 0.6},0)`}>
      <Hero x={x} foot={foot} s={s} t={t} look={look} pose={pose} expr={expr} seed={seed}>
        {children}
      </Hero>
      {sweat > 0
        ? [0, 1, 2].map((i) => {
            const ph = (t * 0.9 + i * 0.33) % 1;
            const dx = [-70, 80, 40][i];
            return (
              <path
                key={i}
                d="M0,-16 Q10,0 0,10 Q-10,0 0,-16 Z"
                transform={`translate(${x + dx},${foot - 760 * s + ph * 120}) scale(1.4)`}
                fill="#7cc4e8"
                stroke={LINE}
                strokeWidth={2}
                opacity={sweat * (1 - ph)}
              />
            );
          })
        : null}
    </g>
  );
};

/** iki panelli bölünmüş ekran: üstte Can (ev), altta Ece (stüdyo) */
const Split: React.FC<{ top: React.ReactNode; bottom: React.ReactNode; k?: number }> = ({ top, bottom, k = 1 }) => (
  <g>
    <clipPath id="mr-top">
      <rect x={0} y={0} width={1080} height={958} />
    </clipPath>
    <clipPath id="mr-bot">
      <rect x={0} y={962} width={1080} height={958} />
    </clipPath>
    <g clipPath="url(#mr-top)">
      <g transform={`translate(0,${mix(0, -690, k)})`}>{top}</g>
    </g>
    <g clipPath="url(#mr-bot)">
      <g transform={`translate(0,${mix(0, 250, k)})`}>{bottom}</g>
    </g>
    <path d="M0,960 L1080,960" stroke={LINE} strokeWidth={8} opacity={k} />
  </g>
);

const CanPanel: React.FC<{ t: number; f?: number; expr?: "grin" | "worry" | "smile" | "surprise" | "flat"; sweat?: number }> = ({ t, f, expr = "worry", sweat = 0.8 }) => (
  <g>
    <HomeBg />
    <Mat />
    <MatHero t={t} f={f ?? 0.55 + 0.35 * Math.sin(t * 2.2)} expr={expr} sweat={sweat} shake={0.4} />
  </g>
);

const EcePanel: React.FC<{ t: number; expr?: "grin" | "worry" | "smile" | "surprise" }> = ({ t, expr = "grin" }) => (
  <g>
    <StudioBg />
    <RowingHero t={t} look={ECE} expr={expr} seed={4} />
  </g>
);

/** isim etiketi (panel içinde) */
const Name: React.FC<{ x: number; y: number; text: string; o: number; color?: string }> = ({ x, y, text, o, color = INK }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y + (1 - o) * 12}) rotate(-3)`}>
      <rect x={-110 + 6} y={-46 + 8} width={220} height={92} rx={14} fill="#5a3a26" opacity={0.15} />
      <rect x={-110} y={-46} width={220} height={92} rx={14} fill={color} {...st} strokeWidth={4} />
      <text x={0} y={20} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={58} fill="#fff" letterSpacing={3}>
        {text}
      </text>
    </g>
  );

const WideCheck: React.FC<{ x: number; y: number; text: string; o: number; w?: number }> = ({ x, y, text, o, w = 520 }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x + (1 - o) * 30},${y})`}>
      <rect x={-w / 2 + 6} y={-52 + 8} width={w} height={104} rx={16} fill="#5a3a26" opacity={0.15} />
      <rect x={-w / 2} y={-52} width={w} height={104} rx={16} fill={PAPER} {...st} strokeWidth={4} />
      <text x={-w / 2 + 34} y={17} fontFamily={HAND} fontSize={52} fill={LINE}>
        {text}
      </text>
      <path d={`M${w / 2 - 80},0 L${w / 2 - 60},24 L${w / 2 - 26},-24`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );

/** aylık takvim: n kutu, checks tanesi işaretli (sırası order) */
const Calendar: React.FC<{ x: number; y: number; s?: number; marks: number[]; k: number; title: string; color?: string }> = ({ x, y, s = 1, marks, k, title, color = INK }) => {
  const shown = Math.floor(k * marks.length + 0.001);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-230 + 6} y={-190 + 8} width={460} height={380} rx={16} fill="#5a3a26" opacity={0.15} />
      <rect x={-230} y={-190} width={460} height={380} rx={16} fill={PAPER} {...st} strokeWidth={4} />
      <rect x={-230} y={-190} width={460} height={70} rx={16} fill={color} {...st} strokeWidth={4} />
      <text x={0} y={-142} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={38} fill="#fff" letterSpacing={2}>
        {title}
      </text>
      {Array.from({ length: 28 }).map((_, i) => {
        const cx = -195 + (i % 7) * 65 + 0;
        const cy = -95 + Math.floor(i / 7) * 68;
        const on = marks.slice(0, shown).includes(i);
        return (
          <g key={i}>
            <rect x={cx - 26} y={cy - 26} width={52} height={52} rx={8} fill="none" stroke={LINE} strokeWidth={2.4} opacity={0.5} />
            {on ? <path d={`M${cx - 14},${cy} L${cx - 3},${cy + 12} L${cx + 16},${cy - 14}`} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /> : null}
          </g>
        );
      })}
    </g>
  );
};

/** haftalık şerit: 7 gün, checks tanesi işaretli */
const Week: React.FC<{ x: number; y: number; on: number }> = ({ x, y, on }) => (
  <g transform={`translate(${x},${y})`}>
    {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d, i) => {
      const cx = -390 + i * 130;
      const o = sm(on, i, i + 0.6);
      return (
        <g key={d}>
          <rect x={cx - 56 + 5} y={-80 + 7} width={112} height={170} rx={14} fill="#5a3a26" opacity={0.15} />
          <rect x={cx - 56} y={-80} width={112} height={170} rx={14} fill={PAPER} {...st} strokeWidth={4} />
          <text x={cx} y={-34} textAnchor="middle" fontFamily={HAND} fontSize={40} fill={LINE}>
            {d}
          </text>
          {o > 0 ? (
            <path d={`M${cx - 26},${30} L${cx - 6},${52} L${cx + 30},${4}`} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
          ) : null}
        </g>
      );
    })}
  </g>
);

// ------------------------------------------------------------ sahneler

/** 0: Can matta, titrer, ter */
const Hook: React.FC<S> = ({ t, u, W }) => {
  const zoom = mix(1.15, 1, sm(u, 0, 1.6));
  return (
    <g transform={`translate(540,1150) scale(${zoom}) translate(-540,-1150)`}>
      <HomeBg />
      <Mat />
      <MatHero t={t} f={0.6 + 0.3 * Math.sin(t * 2.2)} expr="worry" sweat={1} shake={0.7} />
      <Note x={760} y={300} text="3. ay…" o={sm(t, W(1) - 0.15, W(1) + 0.2)} color={RED} tilt={3} />
    </g>
  );
};

/** 1-2: ekran ikiye bölünür (Can üstte, Ece altta); isimler */
const Versus: React.FC<S & { W1: (k: number) => number; W2: (k: number) => number }> = ({ t, W1, W2 }) => {
  const k = sm(t, W1(0) - 0.2, W1(0) + 0.35);
  const glow = sm(t, W1(4) - 0.15, W1(4) + 0.3);
  return (
    <g>
      <Split
        k={k}
        top={<CanPanel t={t} expr="worry" />}
        bottom={
          <g>
            <EcePanel t={t} />
            {glow > 0 ? <circle cx={540} cy={1000} r={260} fill="#f6d36b" opacity={0.18 * glow} /> : null}
          </g>
        }
      />
      <Name x={170} y={110} text="CAN" o={sm(t, W2(3) - 0.15, W2(3) + 0.15)} color="#3d6fc4" />
      <Name x={170} y={1050} text="ECE" o={sm(t, W2(0) - 0.15, W2(0) + 0.15)} color="#c95b88" />
      <Note x={820} y={1070} text="şekle giriyor?" o={glow * (1 - sm(t, W2(0) - 0.1, W2(0) + 0.1))} color={RED} tilt={3} size={50} />
      <Tag x={820} y={120} text="evde · mat" o={sm(t, W2(4) - 0.15, W2(4) + 0.15)} size={44} />
      <Tag x={820} y={1060} text="stüdyo · reformer" o={sm(t, W2(1) - 0.15, W2(1) + 0.15)} size={44} />
    </g>
  );
};

/** 3: (sepya) Pilates matta doğdu — Joseph matta */
const Born: React.FC<S> = ({ t, u, W }) => (
  <g filter="url(#sepia)">
    <OldRoomBg />
    <g transform={`translate(540,1150) scale(${1 + 0.12 * sm(u, 0, 2)}) translate(-540,-1150)`}>
      <path d={`M200,${FLOOR - 58} L930,${FLOOR - 58} L980,${FLOOR - 8} L150,${FLOOR - 8} Z`} fill="#7a6a58" {...st} strokeWidth={4} />
      <g transform="translate(0,-70)">
        <MatHero t={t} f={0.15 + 0.1 * Math.sin(t * 2)} look={JOSEPH} expr="smile" seed={6} />
      </g>
    </g>
    <Note x={540} y={330} text="matta doğdu" o={sm(t, W(4) - 0.15, W(4) + 0.2)} tilt={-2} />
  </g>
);

/** 4: (sepya) 34 hareket, sadece vücut ağırlığı */
const ThirtyFour: React.FC<S> = ({ t, W }) => {
  const count = Math.round(mix(1, 34, sm(t, W(3) - 0.1, W(5) + 0.3)));
  const f = 0.5 + 0.5 * Math.sin(t * 3);
  return (
    <g filter="url(#sepia)">
      <OldRoomBg />
      <path d={`M200,${FLOOR - 58} L930,${FLOOR - 58} L980,${FLOOR - 8} L150,${FLOOR - 8} Z`} fill="#7a6a58" {...st} strokeWidth={4} />
      <g transform="translate(0,-70)">
        <MatHero t={t} f={f} look={JOSEPH} expr="grin" seed={6} />
      </g>
      {/* defter */}
      <g opacity={sm(t, W(2) - 0.2, W(2) + 0.1)} transform="translate(540,470) rotate(-2)">
        <rect x={-230 + 8} y={-150 + 10} width={460} height={300} rx={10} fill="#5a3a26" opacity={0.18} />
        <rect x={-230} y={-150} width={460} height={300} rx={10} fill={PAPER} {...st} strokeWidth={4} />
        <path d="M0,-150 L0,150" stroke={LINE} strokeWidth={3} />
        <text x={-115} y={40} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={120} fill={INK}>
          {count}
        </text>
        <text x={115} y={-10} textAnchor="middle" fontFamily={HAND} fontSize={50} fill={LINE}>
          hareket
        </text>
        <text x={115} y={50} textAnchor="middle" fontFamily={HAND} fontSize={40} fill={LINE} opacity={sm(t, W(6) - 0.1, W(6) + 0.2)}>
          hepsi yerde
        </text>
      </g>
      <Note x={540} y={830} text="sadece vücut ağırlığı" o={sm(t, W(8) - 0.15, W(8) + 0.2)} tilt={2} size={52} />
    </g>
  );
};

/** 5: (sepya) alet sonra: yataklara yay */
const Springs: React.FC<S> = ({ t, W }) => {
  const spring = sm(t, W(5) - 0.3, W(6) + 0.2);
  const pull = spring >= 1 ? 0.5 - 0.5 * Math.cos((t - W(6) - 0.2) * 3) : 0;
  const reach = sm(t, W(5) - 0.5, W(5) - 0.1) * (1 - sm(t, W(6) + 0.2, W(7) + 0.2));
  return (
    <g filter="url(#sepia)">
      <OldRoomBg fill="#ddd2bc" />
      <SpringBed t={t} x={470} y={1320} spring={spring} pull={pull} seed={3} />
      <Hero x={760} foot={1560} s={0.95} t={t} look={JOSEPH} flip pose={{ turn: 0.4, l: { a: 10, e: 6 }, r: { a: mix(12, 150, reach), e: mix(6, 10, reach) } }} expr="smile" />
      <Note x={540} y={300} text="alet sonra geldi" o={sm(t, W(0) - 0.1, W(1) + 0.1)} tilt={-2} />
      <Note x={300} y={460} text="yaylar" o={sm(t, W(6) - 0.1, W(6) + 0.2)} color={RED} tilt={3} />
    </g>
  );
};

/** 6: fark tam burada — bölünmüş ekran geri gelir */
const Diff: React.FC<S> = ({ t, u }) => (
  <g>
    <Split k={1} top={<CanPanel t={t} expr="flat" sweat={0.4} />} bottom={<EcePanel t={t} expr="smile" />} />
    <g opacity={sm(u, 0.1, 0.4)} transform="translate(800,960) rotate(-4)">
      <rect x={-150 + 6} y={-62 + 8} width={300} height={124} rx={18} fill="#5a3a26" opacity={0.18} />
      <rect x={-150} y={-62} width={300} height={124} rx={18} fill="#f6d36b" {...st} strokeWidth={5} />
      <text x={0} y={24} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={68} fill={LINE} letterSpacing={4}>
        FARK
      </text>
    </g>
  </g>
);

/** 7: matta destek yok, iş karında */
const NoSupport: React.FC<S> = ({ t, u, W }) => {
  const zoom = 1 + 0.25 * sm(u, 0, 1.6);
  const core = sm(t, W(8) - 0.15, W(8) + 0.2);
  return (
    <g>
      <g transform={`translate(420,1200) scale(${zoom}) translate(-420,-1200)`}>
        <HomeBg />
        <Mat />
        <MatHero t={t} f={0.85} expr="worry" sweat={1} shake={1}>
          <Ring x={200} y={420} rx={86} ry={70} label="karın" o={core} lx={-150} ly={360} />
        </MatHero>
      </g>
      <Note x={760} y={330} text="destek yok" o={sm(t, W(4) - 0.15, W(5) + 0.1)} color={RED} tilt={3} />
    </g>
  );
};

/** 8: reformerda yay hem zorlar hem destek olur */
const SpringHelp: React.FC<S> = ({ t, u, W }) => {
  const zoom = 1 + 0.15 * sm(u, 0, 1.8);
  const hl = sm(t, W(1) - 0.15, W(1) + 0.2);
  return (
    <g>
      <g transform={`translate(380,1300) scale(${zoom}) translate(-380,-1300)`}>
        <StudioBg />
        <RowingHero t={t} look={ECE} expr="grin" seed={4} />
        {hl > 0 ? <ellipse cx={240} cy={1316} rx={170} ry={46} fill="none" stroke={INK} strokeWidth={6} strokeDasharray="16 10" opacity={hl} /> : null}
      </g>
      <Note x={300} y={300} text="zorlar" o={sm(t, W(4) - 0.15, W(4) + 0.2)} color={RED} tilt={-3} />
      <Note x={760} y={420} text="destek olur" o={sm(t, W(6) - 0.15, W(6) + 0.2)} tilt={3} />
    </g>
  );
};

/** 9: kime birebir */
const WhoFor: React.FC<S> = ({ t, W }) => (
  <g>
    <StudioBg />
    <RowingHero t={t} look={ECE} expr="smile" seed={4} />
    <rect width={1080} height={1920} fill="#f1e2c8" opacity={0.35} />
    <WideCheck x={540} y={330} text="yeni başlayan" o={sm(t, W(1) - 0.15, W(1) + 0.15)} />
    <WideCheck x={540} y={470} text="beli ağrıyan" o={sm(t, W(3) - 0.15, W(3) + 0.15)} />
    <WideCheck x={540} y={610} text="daha çok güç isteyen" o={sm(t, W(7) - 0.15, W(7) + 0.15)} w={620} />
  </g>
);

/** 10: araştırma — ikisi de gövdeyi güçlendirir */
const Research: React.FC<S> = ({ t, W }) => {
  const lv = mix(0.25, 0.92, sm(t, W(7) - 0.1, W(8) + 0.5));
  return (
    <g>
      <Split
        k={1}
        top={
          <g>
            <CanPanel t={t} expr={lv > 0.6 ? "grin" : "flat"} sweat={0.3} />
            <PowerBar x={960} y={1300} level={lv} color="#3d6fc4" />
          </g>
        }
        bottom={
          <g>
            <EcePanel t={t} />
            <PowerBar x={960} y={1260} level={lv} color="#c95b88" />
          </g>
        }
      />
      <g opacity={sm(t, W(0) - 0.1, W(0) + 0.2)} transform="translate(540,960) rotate(-3)">
        <rect x={-210 + 6} y={-62 + 8} width={420} height={124} rx={18} fill="#5a3a26" opacity={0.18} />
        <rect x={-210} y={-62} width={420} height={124} rx={18} fill="#f6d36b" {...st} strokeWidth={5} />
        <text x={0} y={22} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={56} fill={LINE}>
          {t > W(5) - 0.1 ? "İKİSİ DE ✓" : "HANGİSİ?"}
        </text>
      </g>
      <Tag x={250} y={780} text="araştırmalar" o={sm(t, W(4) - 0.15, W(4) + 0.2)} size={44} />
    </g>
  );
};

/** 11: fark haftada kaç gün */
const Days: React.FC<S> = ({ t, u, W }) => (
  <g>
    <rect width={1080} height={1920} fill="#ece0c6" />
    <Note x={540} y={360} text="alet değil…" o={sm(t, W(1) - 0.15, W(1) + 0.2)} color={RED} tilt={-3} />
    <Note x={540} y={540} text="haftada kaç gün?" o={sm(t, W(3) - 0.15, W(3) + 0.2)} tilt={2} />
    <Week x={540} y={860} on={mix(0, 7, sm(t, W(4), W(7) + 0.3))} />
    <g opacity={sm(u, 0.1, 0.5)}>
      <Mat x={-60} />
      <MatHero t={t} f={0.5 + 0.4 * Math.sin(t * 2.4)} expr="grin" x={300} />
    </g>
  </g>
);

/** 12: Ece iki haftada bir / Can her akşam */
const Habits: React.FC<S> = ({ t, W }) => {
  const ece = sm(t, W(1) - 0.1, W(4) + 0.1);
  const can = sm(t, W(6) - 0.1, W(8) + 0.4);
  return (
    <Split
      k={1}
      top={
        <g>
          <CanPanel t={t} expr="grin" sweat={0.5} />
          <Calendar x={790} y={880} s={0.72} marks={Array.from({ length: 26 }, (_, i) => i)} k={can} title="CAN" color="#3d6fc4" />
        </g>
      }
      bottom={
        <g>
          <EcePanel t={t} expr="smile" />
          <Calendar x={870} y={760} s={0.62} marks={[3, 17]} k={ece} title="ECE" color="#c95b88" />
        </g>
      }
    />
  );
};

/** 13: Ece mi, Can mı? Yorumlara yaz */
const Question: React.FC<S> = ({ t, W }) => {
  const pulse = (a: number) => 1 + 0.04 * Math.sin(t * 5 + a);
  return (
    <g>
      <Split k={1} top={<CanPanel t={t} expr="grin" sweat={0.4} />} bottom={<EcePanel t={t} expr="grin" />} />
      <Note x={540} y={960} text="3 ay sonra kim daha güçlü?" o={sm(t, W(0) - 0.15, W(1) + 0.1)} tilt={-2} size={52} />
      <g opacity={sm(t, W(9) - 0.15, W(9) + 0.15)} transform={`translate(830,140) scale(${pulse(0)})`}>
        <Name x={0} y={0} text="CAN?" o={1} color="#3d6fc4" />
      </g>
      <g opacity={sm(t, W(7) - 0.15, W(7) + 0.15)} transform={`translate(830,1080) scale(${pulse(1.5)})`}>
        <Name x={0} y={0} text="ECE?" o={1} color="#c95b88" />
      </g>
      <Stamp x={540} y={1460} text="YORUMLARA YAZ" k={sm(t, W(11) - 0.1, W(11) + 0.15)} />
    </g>
  );
};

// ------------------------------------------------------------ kompozisyon

export const MatReformer: React.FC<EkmekBirakProps & { music?: boolean }> = ({ audioName, data, music = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const base: TL = data ? voiceTimeline(data, MR_LINES) : MR_TL;
  const T = data ? data.durationInSeconds + MR_TAIL : MR_TL.total;
  const tl: TL = { ...base, total: T };
  const L = tl.at;
  const Wt = (line: number, k: number) => wordTime(tl, line, k, MR_LINES);

  const scene = (tt: number, i: number): React.ReactNode => {
    const u = tt - L(i);
    const s: S = { t: tt, u, W: (k) => Wt(i, k), d: L(i + 1) - L(i) };
    switch (i) {
      case 0:
        return <Hook {...s} />;
      case 1:
      case 2:
        return <Versus {...s} W1={(k) => Wt(1, k)} W2={(k) => Wt(2, k)} />;
      case 3:
        return <Born {...s} />;
      case 4:
        return <ThirtyFour {...s} />;
      case 5:
        return <Springs {...s} />;
      case 6:
        return <Diff {...s} />;
      case 7:
        return <NoSupport {...s} />;
      case 8:
        return <SpringHelp {...s} />;
      case 9:
        return <WhoFor {...s} />;
      case 10:
        return <Research {...s} />;
      case 11:
        return <Days {...s} />;
      case 12:
        return <Habits {...s} />;
      default:
        return <Question {...s} />;
    }
  };

  const i = Math.max(0, tl.idx(t));
  // 1-2 tek sahne (0 ile de kesintisiz: bölünme 1. satırda açılır)
  const segA = i === 2 ? L(1) : L(i);
  const segB = i === 1 ? L(3) : L(i + 1);
  const split = i === 1 || i === 2 || i === 6 || i === 10 || i === 12 || i === 13;
  const push = split ? 1 : 1 + 0.05 * sm(t, segA, Math.max(segA + 0.5, segB));
  const loopIn = sm(t, T - 0.4, T - 0.03);
  const t0 = t - T;

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.2, lead: 0.05 },
    { at: L(1) - 0.05, id: 1120, v: 0.14, lead: 0.1 },
    { at: L(3) + 0.05, id: 1143, v: 0.14, lead: 0.14, dur: 1.4, fade: 0.7 },
    { at: L(6) + 0.05, id: 2568, v: 0.15 },
    { at: Wt(9, 1) - 0.1, id: 2568, v: 0.12 },
    { at: Wt(9, 3) - 0.1, id: 2568, v: 0.12 },
    { at: Wt(9, 7) - 0.1, id: 2568, v: 0.12 },
    { at: L(10) + 0.05, id: 1120, v: 0.14, lead: 0.1 },
    { at: L(12) + 0.05, id: 1120, v: 0.14, lead: 0.1 },
    { at: Wt(13, 11) - 0.1, id: 2182, v: 0.18 },
  ];

  return (
    <AbsoluteFill lang="tr" style={{ background: "#ece0c6", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <SketchDefs />
        <defs>
          <filter id="sepia" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.636 0.461 0.113 0 0  0.209 0.812 0.101 0 0  0.163 0.320 0.479 0 0  0 0 0 1 0" />
          </filter>
        </defs>
        <g filter="url(#pencil)">
          <g transform={`translate(540,960) scale(${push}) translate(-540,-960)`}>{scene(t, i)}</g>
          {loopIn > 0 ? <g opacity={loopIn}>{scene(t0, 0)}</g> : null}
        </g>
      </svg>
      <Captions t={t} tl={tl} lines={MR_LINES} end={T - MR_TAIL + 0.5} />
      {data ? <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} /> : null}
      {music ? (
        <Audio
          src={staticFile("audio/tup-sarkma-orijinal.mp3")}
          volume={(f) => {
            const mt = f / fps;
            const b = data ? 0.13 : 0.5;
            return b * interpolate(mt, [0, 0.3, T - 0.9, T - 0.1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          }}
        />
      ) : null}
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
