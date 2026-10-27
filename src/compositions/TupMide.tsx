/**
 * "Tüp mide ameliyatı: tartı her şeyi söylemiyor" (~35 sn). EkmekEv/UcHirsiz'in ev kesiti tarzı: önü açık iki katlı ev,
 * kamera odadan odaya kesmeden süzülür. 1 banyo (tartı 120 → 80, "−40 KG" ama içinde KAS da var) → 2 mutfak (mide kesilir,
 * küçük tüp kalır; minik tabak; kol kesitinde kas incelir) → 3 yatak odası (ayna: deri boşta kalır, sarkma; takvim yıllar,
 * metabolizma ibresi düşer, kilo geri gelir) → 4 spor odası (dambıl: kas dolar, deri toparlanır; aynı kilo sporsuz/sporlu;
 * doktor onayı, yürüyüş, ağırlık, protein) → bütün ev "spor şekillendirir" → gönder → Voom kartı → "Unutma…" ile kamera
 * banyodaki tartıya döner (döngü; son kare = ilk kare, ilk cümle "Tartı her şeyi söylemiyor."). Metin `icerik/tup-mide.seslendirme.txt`.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO, SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { LINE, type SketchPose, SketchDefs, SketchPerson, SKETCH_CAST } from "../sketch/SketchPerson";
import {
  Captions,
  Card,
  Check,
  type EkmekBirakProps,
  GREEN,
  PAPER,
  Pill,
  Plate,
  RED,
  Readout,
  Scale,
  type TL,
  Txt,
  mix,
  poseAt,
  st,
  voiceTimeline,
  wordTime,
} from "./EkmekBirak";
import { type CamKey, Floor, Frame, Outside, Person, Plant, Window, camAt, thin } from "./EkmekEv";

loadFonts();

export const TM_LINES: Line[] = [
  { text: "Tartı her şeyi söylemiyor.", hl: ["Tartı", "söylemiyor."], hold: 0.2 },
  { text: "Tüp mide oldun, kırk kilo verdin… ama o kilonun bir kısmı yağ değil… kas.", hl: ["kırk", "kilo", "kas."], hold: 0.2 },
  { text: "Mide küçülünce az yiyorsun, vücut da açığı kapatmak için kasını harcıyor.", hl: ["az", "kasını", "harcıyor."], hold: 0.1 },
  { text: "Kas gidince deri boşta kalıyor… kollar, karın, bacaklar sarkıyor.", hl: ["deri", "boşta", "sarkıyor."], hold: 0.1 },
  { text: "Metabolizma da yavaşlıyor, kilolar sessizce geri gelmeye başlıyor.", hl: ["yavaşlıyor,", "geri"], hold: 0.1 },
  { text: "İşte tam burada spor şart.", hl: ["spor", "şart."], hold: 0.2 },
  { text: "Ağırlık çalıştığında kasın korunur, derinin altı dolar, vücudun toparlanır.", hl: ["korunur,", "dolar,", "toparlanır."], hold: 0.1 },
  { text: "Sarkmayı tamamen silmez… ama aradaki fark aynada çok net görünür.", hl: ["fark", "aynada"], hold: 0.1 },
  { text: "Doktorun izin verince önce yürüyüş, sonra haftada iki üç gün ağırlık. Her öğünde önce protein.", hl: ["yürüyüş,", "ağırlık.", "protein."], hold: 0.1 },
  { text: "Ameliyat kiloyu verdirir… vücudunu şekillendiren ise spor.", hl: ["şekillendiren", "spor."], hold: 0.2 },
  { text: "Tüp mide olan birine gönder.", hl: ["gönder."], hold: 0.1 },
  { text: "Merak etme, Voom her zaman yanında. Unutma…", hl: ["Voom", "yanında."], hold: 0.1 },
];

export const TM_TAIL = 1.0;
export const TM_TL = timeline(TM_LINES, TM_TAIL);

const HERO = SKETCH_CAST.siyah.look;
const FAT = "#f2c94c";
const LIME = "#D4F24A";

const WW = 2600;
const WH = 4400;
const RW = 1080;
const RH = 1800;
const ROOMS = {
  banyo: { x: 180, y: 560 },
  mutfak: { x: 1340, y: 560 },
  yatak: { x: 180, y: 2440 },
  spor: { x: 1340, y: 2440 },
} as const;
const center = (r: { x: number; y: number }) => [r.x + RW / 2, r.y + RH / 2] as const;

type Ctx = { t: number; L: (i: number) => number; W: (l: number, k: number) => number; T: number };

// ------------------------------------------------------------ kol kesiti (kas + deri) — hikâyenin ana görseli

/** kasın dolgunluğu: 1 tam … 0.45 erimiş; sporla geri gelir */
const muscleAt = ({ t, L, W, T }: Ctx) => {
  if (t > T - 0.6) return 1;
  let m = 1 - 0.55 * sm(t, W(2, 9) - 0.2, W(2, 10) + 0.9);
  m += 0.5 * sm(t, W(6, 1), W(6, 6) + 0.4);
  if (t < L(2)) m = 1;
  return m;
};

/** deri boşluğu (sarkma): 3. satırda açılır, sporla azalır ama tamamen kapanmaz (dürüst kalsın) */
const slackAt = ({ t, W, T }: Ctx) => {
  if (t > T - 0.6) return 0;
  return sm(t, W(3, 1), W(3, 4) + 0.5) * (1 - 0.68 * sm(t, W(6, 4), W(6, 8) + 0.4));
};

const ArmCut: React.FC<{ m: number; slack: number; w?: number; h?: number; title?: string; titleFill?: string; labels?: number; t: number }> = ({
  m,
  slack,
  w = 560,
  h = 360,
  title,
  titleFill = LINE,
  labels = 1,
  t,
}) => {
  const N = 36;
  const id = `arm-${Math.round(w)}-${Math.round(h)}-${title ?? ""}`.replace(/[^a-z0-9-]/gi, "");
  const half = (u: number) => {
    const s = Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, u)))), 0.9);
    return 12 + (18 + 40 * m) * s;
  };
  const droop = (u: number) => slack * 92 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (u - 0.06) / 0.86)))), 1.7);
  const sway = Math.sin(t * 3) * slack * 4;
  const x0 = -w / 2 - 30;
  const x1 = w / 2 + 30;
  const y0 = -14 - slack * 10;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const x = mix(x0, x1, i / N);
    const u = (x + 210) / 420;
    return { x, u, top: y0 - half(u) - 14, mt: y0 - half(u), mb: y0 + half(u), bot: y0 + half(u) + 16 + droop(u) + sway * Math.sin(Math.PI * Math.min(1, Math.max(0, u))) };
  });
  const skin = `M${pts.map((p) => `${p.x.toFixed(1)},${p.top.toFixed(1)}`).join(" L")} L${[...pts]
    .reverse()
    .map((p) => `${p.x.toFixed(1)},${p.bot.toFixed(1)}`)
    .join(" L")} Z`;
  const inner = pts.filter((p) => p.u > 0.02 && p.u < 0.98);
  const muscle = `M${inner.map((p) => `${p.x.toFixed(1)},${p.mt.toFixed(1)}`).join(" L")} L${[...inner]
    .reverse()
    .map((p) => `${p.x.toFixed(1)},${p.mb.toFixed(1)}`)
    .join(" L")} Z`;
  const fiber = (k: number) =>
    `M${inner.map((p) => `${p.x.toFixed(1)},${mix(p.mt, p.mb, k).toFixed(1)}`).join(" L")}`;
  const mid = pts[Math.round(N * 0.48)];
  return (
    <g>
      <clipPath id={id}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} />
      </clipPath>
      <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} rx={18} fill="#5a3a26" opacity={0.12} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill={PAPER} {...st} />
      <g clipPath={`url(#${id})`}>
        {/* deri: içi boşsa açık ten (boş kalan deri) */}
        <path d={skin} fill="#f6dccb" {...st} />
        {/* ince yağ katmanı */}
        <path d={skin} fill="none" stroke={FAT} strokeWidth={10} opacity={0.55} transform="scale(0.985)" />
        {/* kas */}
        <path d={muscle} fill="#d9675e" {...st} strokeWidth={3} />
        {[0.25, 0.5, 0.75].map((k) => (
          <path key={k} d={fiber(k)} fill="none" stroke="#f0a59c" strokeWidth={4} opacity={0.8} />
        ))}
        {/* tendonlar */}
        {[inner[0], inner[inner.length - 1]].map((p, i) => (
          <ellipse key={i} cx={p.x + (i ? 6 : -6)} cy={y0} rx={16} ry={10} fill="#f4efe6" stroke={LINE} strokeWidth={2.4} />
        ))}
        {/* sarkan derinin kıvrımı */}
        {slack > 0.15 ? (
          <path
            d={`M${mid.x - 90},${mid.mb + 24 + slack * 30} q90,${slack * 30} 180,0`}
            fill="none"
            stroke={LINE}
            strokeWidth={2.4}
            opacity={Math.min(0.6, slack)}
          />
        ) : null}
      </g>
      {title ? (
        <text x={0} y={-h / 2 + 50} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={titleFill} letterSpacing={-1}>
          {title}
        </text>
      ) : null}
      {labels > 0 ? (
        <g opacity={labels} fontFamily={SANS} fontWeight={800} fontSize={28} fill={LINE}>
          <text x={-w / 2 + 26} y={h / 2 - 22}>
            KAS
          </text>
          <rect x={-w / 2 + 90} y={h / 2 - 44} width={26} height={26} rx={6} fill="#d9675e" stroke={LINE} strokeWidth={2} />
          <text x={-w / 2 + 140} y={h / 2 - 22}>
            DERİ
          </text>
          <rect x={-w / 2 + 218} y={h / 2 - 44} width={26} height={26} rx={6} fill="#f6dccb" stroke={LINE} strokeWidth={2} />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------ mide (kesilir, küçük tüp kalır)

const STOMACH =
  "M-30,-118 C-110,-150 -170,-60 -140,30 C-110,120 0,170 90,140 C130,125 150,100 140,80 L120,62 C70,80 20,50 5,0 C-5,-40 0,-90 -10,-118 Z";
const SLEEVE = "M-30,-118 C-55,-80 -52,-20 -38,30 C-12,100 60,122 136,94 L120,62 C70,80 20,50 5,0 C-5,-40 0,-90 -10,-118 Z";
const CUT = "M-30,-118 C-55,-80 -52,-20 -38,30 C-12,100 60,122 136,94";

const Stomach: React.FC<{ cut: number; away: number }> = ({ cut, away }) => (
  <g>
    {/* yemek borusu ve onikiparmak */}
    <path d="M-34,-200 L-30,-118 M-10,-118 L-12,-200" fill="none" {...st} />
    <path d="M-34,-200 L-12,-200 L-10,-118 L-30,-118 Z" fill="#e89a8e" stroke="none" />
    <path d="M130,78 Q170,70 190,110" fill="none" stroke="#e89a8e" strokeWidth={22} strokeLinecap="round" />
    <path d="M130,78 Q170,70 190,110" fill="none" stroke={LINE} strokeWidth={2.4} opacity={0.5} />
    {/* alınan kısım: griye döner, aşağı kayar, söner */}
    <g opacity={1 - away} transform={`translate(${-away * 40},${away * 60})`}>
      <path d={STOMACH} fill={cut > 0.5 ? "#cfc6bf" : "#e89a8e"} {...st} />
      {cut < 0.5 ? <path d="M-100,-20 q30,50 90,90 M-60,-70 q10,40 40,60" fill="none" stroke="#f4c2b8" strokeWidth={6} strokeLinecap="round" /> : null}
    </g>
    {/* kalan tüp */}
    <path d={SLEEVE} fill="#e89a8e" {...st} />
    <path d="M-30,-80 q-6,60 10,110" fill="none" stroke="#f4c2b8" strokeWidth={5} strokeLinecap="round" />
    {/* kesik çizgisi çizilir */}
    {cut > 0 && away < 0.95 ? (
      <path d={CUT} fill="none" stroke={RED} strokeWidth={5} strokeDasharray="14 10" pathLength={100} strokeDashoffset={0} opacity={Math.min(1, cut * 3) * (1 - away)} />
    ) : null}
  </g>
);

// ------------------------------------------------------------ küçük parçalar

const Gauge: React.FC<{ x: number; y: number; v: number; o: number }> = ({ x, y, v, o }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y})`}>
      <rect x={-190} y={-170} width={380} height={250} rx={20} fill={PAPER} {...st} />
      <path d="M-130,30 A130,130 0 0 1 130,30" fill="none" stroke="#efe4d3" strokeWidth={30} />
      <path d="M-130,30 A130,130 0 0 1 -65,-82" fill="none" stroke={RED} strokeWidth={30} opacity={0.75} />
      <path d="M65,-82 A130,130 0 0 1 130,30" fill="none" stroke={GREEN} strokeWidth={30} opacity={0.75} />
      <path d="M-130,30 A130,130 0 0 1 130,30" fill="none" {...st} />
      <g transform={`rotate(${mix(-80, 80, v)},0,30)`}>
        <path d="M-7,30 L0,-96 L7,30 Z" fill={LINE} />
      </g>
      <circle cx={0} cy={30} r={14} fill={LINE} />
      <text x={0} y={-130} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={32} fill={LINE}>
        METABOLİZMA
      </text>
    </g>
  );

const Calendar: React.FC<{ x: number; y: number; year: number; o?: number }> = ({ x, y, year, o = 1 }) => (
  <g opacity={o} transform={`translate(${x},${y}) rotate(-3)`}>
    <rect x={-95} y={-105} width={190} height={210} rx={10} fill="#fff" {...st} />
    <rect x={-95} y={-105} width={190} height={52} rx={10} fill={RED} {...st} />
    {[-50, 0, 50].map((cx) => (
      <circle key={cx} cx={cx} cy={-103} r={7} fill={PAPER} {...st} strokeWidth={2} />
    ))}
    <Txt x={0} y={46} size={84}>
      {year}
    </Txt>
    <Txt x={0} y={88} size={28} w={700}>
      . YIL
    </Txt>
  </g>
);

const Mirror: React.FC<{ x: number; y: number; w: number; h: number; id: string; children?: React.ReactNode }> = ({ x, y, w, h, id, children }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={14} fill="#7a5640" {...st} />
    <clipPath id={id}>
      <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} rx={8} />
    </clipPath>
    <rect x={x + 16} y={y + 16} width={w - 32} height={h - 32} rx={8} fill="#d5e6ec" />
    <g clipPath={`url(#${id})`}>
      <g opacity={0.5}>{children}</g>
      <path
        d={`M${x + 40},${y + 200} L${x + 160},${y + 80} M${x + 40},${y + 340} L${x + 260},${y + 120} M${x + 80},${y + h - 200} L${x + 280},${y + h - 400}`}
        stroke="#fff"
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.45}
      />
    </g>
  </g>
);

const Treadmill: React.FC<{ x: number; y: number; t: number; on: boolean }> = ({ x, y, t, on }) => {
  const off = on ? (t * 160) % 40 : 0;
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M150,-10 L190,-420 L220,-420 L182,-10 Z" fill="#8d8e92" {...st} />
      <rect x={130} y={-470} width={140} height={70} rx={12} fill="#3a3a40" {...st} />
      <rect x={146} y={-456} width={108} height={40} rx={6} fill={on ? "#9cf0b8" : "#5a6a62"} />
      <rect x={-210} y={-40} width={420} height={50} rx={22} fill="#3a3a40" {...st} />
      <clipPath id="tm-belt">
        <rect x={-196} y={-34} width={392} height={18} rx={8} />
      </clipPath>
      <g clipPath="url(#tm-belt)">
        {Array.from({ length: 13 }).map((_, i) => (
          <path key={i} d={`M${-220 + i * 40 - off},-34 L${-220 + i * 40 - off},-16`} stroke="#77777f" strokeWidth={4} />
        ))}
      </g>
    </g>
  );
};

const Bench: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-170} y={-120} width={340} height={44} rx={16} fill="#d9453b" {...st} />
    {[-130, 130].map((dx) => (
      <path key={dx} d={`M${dx - 10},-76 L${dx - 14},0 L${dx + 14},0 L${dx + 10},-76 Z`} fill="#3a3a40" {...st} />
    ))}
  </g>
);

const SmallPlate: React.FC<{ x: number; y: number; bite: number }> = ({ x, y, bite }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={6} rx={92} ry={24} fill="#5a3a26" opacity={0.12} />
    <ellipse cx={0} cy={0} rx={92} ry={24} fill="#fbfbf7" {...st} />
    <ellipse cx={0} cy={0} rx={62} ry={14} fill="none" stroke={LINE} strokeWidth={2} opacity={0.4} />
    {bite < 1 ? (
      <g opacity={1 - bite}>
        <ellipse cx={-8} cy={-6} rx={18} ry={9} fill="#a8653a" stroke={LINE} strokeWidth={2.2} />
        <circle cx={18} cy={-6} r={8} fill="#6bb36a" stroke={LINE} strokeWidth={2} />
      </g>
    ) : null}
  </g>
);

// ------------------------------------------------------------ 1 · banyo (tartı)

/** tartıdaki kilo: 80 (kanca) → 120'ye geri sarar → 80'e iner; döngüde 80 */
const kgAt = ({ t, W, L, T }: Ctx) => {
  if (t > L(2) || t > T - 0.6) return 80;
  return 80 + 40 * sm(t, W(1, 0), W(1, 2)) - 40 * sm(t, W(1, 3), W(1, 6) + 0.3);
};

const Banyo: React.FC<Ctx> = (c) => {
  const { t, L, W, T } = c;
  const loop = t > T - 0.6;
  const kg = kgAt(c);
  const ghost = loop ? 0 : sm(t, W(1, 0), W(1, 2)) * (1 - sm(t, W(1, 3), W(1, 6) + 0.3));
  const ghostO = loop ? 0 : win(t, W(1, 0) - 0.1, W(1, 6) + 0.6, 0.3);
  const delta = loop ? 0 : t > W(1, 3) ? kg - 120 : 0;
  const split = loop ? 0 : sm(t, W(1, 9), W(1, 11));
  const kasHl = loop ? 0 : sm(t, W(1, 12), W(1, 13) + 0.1);
  const barO = loop ? 0 : win(t, W(1, 8) - 0.2, L(2) + 0.4, 0.3);
  const expr = t < W(1, 3) ? "think" : t < W(1, 9) || loop ? (t < W(1, 6) && !loop ? "surprise" : "grin") : t > W(1, 12) ? "worry" : "grin";
  const pose: SketchPose =
    t > W(1, 6) && t < W(1, 9) && !loop ? { r: { a: 150, e: -20 }, l: { a: 150, e: -20 }, turn: 0.1 } : { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.4 };
  const hero = (
    <SketchPerson t={t} seed={1.3} look={HERO} pose={poseAt(t, [{ at: -1, pose }])} expr={loop ? "think" : expr} />
  );
  const fatW = 560 * 0.72;
  return (
    <g>
      <rect width={RW} height={RH} fill="#dbeef2" />
      {Array.from({ length: 10 }).flatMap((_, i) =>
        Array.from({ length: 13 }).map((__, j) => <rect key={`${i}-${j}`} x={i * 108} y={j * 112} width={108} height={112} {...thin} opacity={0.18} />),
      )}
      <Floor y={1480} a="#e8e2d6" b="#c9c1b3" checker />
      {/* lavabo + ayna */}
      <Mirror x={720} y={420} w={300} h={420} id="tm-b-mirror">
        <g transform="translate(1740,0) scale(-1,1)">
          <Person x={870} foot={1460} s={1.0}>
            {hero}
          </Person>
        </g>
      </Mirror>
      <path d="M700,1040 L1040,1040 L1010,1110 L730,1110 Z" fill="#fbfbf7" {...st} />
      <rect x={850} y={1110} width={40} height={370} fill="#e6e1d8" {...st} />
      <path d="M860,1040 L860,990 Q860,970 890,970 L910,970" fill="none" {...st} strokeWidth={6} />
      {/* havlu */}
      <rect x={70} y={560} width={150} height={20} rx={8} fill="#8a5f42" {...st} />
      <path d="M86,580 L204,580 L204,860 Q145,880 86,860 Z" fill="#f2a65a" {...st} />
      <path d="M86,800 L204,800" stroke="#fff" strokeWidth={8} opacity={0.7} />
      <Plant x={110} y={1560} s={0.7} />
      {/* eski hâl hayaleti (geniş gövde) */}
      {ghostO > 0 ? (
        <g opacity={0.28 * ghostO}>
          <g transform={`translate(440,0) scale(${1 + 0.55 * ghost},1) translate(-440,0)`}>
            <Person x={440} foot={1452} s={1.12}>
              <SketchPerson t={t} seed={1.3} look={{ ...HERO, top: "#9a9aa2" }} pose={{ r: { a: 18, e: 6 }, l: { a: 18, e: 6 }, turn: 0.4 }} expr="flat" />
            </Person>
          </g>
        </g>
      ) : null}
      <Scale x={440} y={1470} kg={kg} />
      <Person x={440} foot={1452} s={1.12}>
        {hero}
      </Person>
      <Readout x={800} y={900} kg={kg} o={1} delta={delta} />
      {/* −40 KG'nin içi: yağ + kas */}
      {barO > 0 ? (
        <g opacity={barO} transform="translate(540,470)">
          <rect x={-310} y={-120} width={620} height={200} rx={20} fill={PAPER} {...st} />
          <text x={0} y={-62} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={LINE}>
            GİDEN 40 KİLONUN İÇİ
          </text>
          <rect x={-280} y={-30} width={560} height={78} rx={14} fill="#efe4d3" {...st} />
          <rect x={-274} y={-24} width={(fatW - 6) * split + (548) * (1 - split)} height={66} rx={10} fill={split > 0.02 ? FAT : "#c9c1b3"} />
          {split > 0.02 ? (
            <rect x={-280 + fatW} y={-24} width={(560 - fatW - 6) * split} height={66} rx={10} fill={RED} opacity={0.6 + 0.4 * kasHl} />
          ) : null}
          <g opacity={split} fontFamily={SANS} fontWeight={800} fontSize={38}>
            <text x={-280 + fatW / 2} y={20} textAnchor="middle" fill={LINE}>
              YAĞ
            </text>
            <text x={-280 + fatW + (560 - fatW) / 2} y={20} textAnchor="middle" fill="#fff">
              KAS
            </text>
          </g>
          {kasHl > 0 ? (
            <path
              d={`M${-280 + fatW + (560 - fatW) / 2},60 L${-280 + fatW + (560 - fatW) / 2},110`}
              stroke={RED}
              strokeWidth={6}
              strokeLinecap="round"
              opacity={kasHl}
            />
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------ 2 · mutfak (mide + az yemek + kas erir)

const Mutfak: React.FC<Ctx> = (c) => {
  const { t, L, W, T } = c;
  const cut = sm(t, L(2) + 0.1, W(2, 1) + 0.3);
  const away = sm(t, W(2, 1) + 0.2, W(2, 2) + 0.4);
  const reset = t > T - 0.6;
  const bite = sm(t, W(2, 3), W(2, 5));
  const eating = t > W(2, 2) && t < W(2, 6) && !reset;
  const pose: SketchPose = eating
    ? { r: { a: 40, e: -150 }, l: { a: 14, e: 6 }, turn: 0.5 }
    : t > W(2, 8) && t < L(4)
      ? { r: { a: 30, e: -60 }, l: { a: 40, e: 10 }, turn: -0.3 }
      : { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.5 };
  const chew = eating ? 0.3 + 0.3 * Math.sin(t * 16) : 0;
  const m = muscleAt(c);
  return (
    <g>
      <rect width={RW} height={RH} fill="#f6e6c4" />
      <Window x={390} y={150} w={300} h={220} t={t} />
      {/* kartlar: mide + kol */}
      <g transform="translate(290,640)">
        <rect x={-240} y={-260} width={480} height={540} rx={20} fill="#5a3a26" opacity={0.12} transform="translate(8,10)" />
        <rect x={-240} y={-260} width={480} height={540} rx={20} fill={PAPER} {...st} />
        <text x={0} y={-206} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={LINE}>
          MİDE
        </text>
        <g transform="translate(-10,40) scale(1.25)">
          <Stomach cut={reset ? 0 : cut} away={reset ? 0 : away} />
        </g>
        <g opacity={reset ? 0 : sm(t, W(2, 1) + 0.6, W(2, 2) + 0.6)}>
          <Pill x={0} y={236} text="KÜÇÜK MİDE" o={1} bg={RED} size={34} />
        </g>
      </g>
      <g transform="translate(800,640)">
        <g transform="scale(0.82)">
          <ArmCut m={m} slack={0} w={500} h={520} title="KOLUN İÇİ" t={t} labels={0} />
        </g>
        <Pill x={0} y={236} text="KAS ERİYOR" o={reset ? 0 : win(t, W(2, 9), L(3) + 0.3, 0.25)} bg={RED} size={34} />
      </g>
      {/* tezgâh */}
      <rect x={0} y={1120} width={RW} height={44} fill="#c99a6a" {...st} />
      <rect x={0} y={1164} width={RW} height={316} fill="#9cc6b0" {...st} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={20 + i * 212} y={1190} width={190} height={266} rx={8} fill="none" stroke={LINE} strokeWidth={2.4} />
          <rect x={95 + i * 212} y={1210} width={40} height={10} rx={4} fill={LINE} />
        </g>
      ))}
      <Floor y={1480} a="#d9b48a" b="#b98e62" />
      <SmallPlate x={760} y={1110} bite={reset ? 0 : bite} />
      <Pill x={760} y={1020} text="AZ YEMEK" o={reset ? 0 : win(t, W(2, 2), W(2, 8), 0.25)} bg="#3a3a40" size={34} />
      <Person x={380} foot={1720} s={0.95}>
        <SketchPerson t={t} seed={1.3} look={HERO} pose={pose} expr={t > W(2, 9) && !reset ? "worry" : "smile"} talk={chew} />
      </Person>
    </g>
  );
};

// ------------------------------------------------------------ 3 · yatak odası (ayna: sarkma; yıllar, metabolizma)

const Yatak: React.FC<Ctx> = (c) => {
  const { t, L, W, T } = c;
  const reset = t > T - 0.6;
  const m = muscleAt(c);
  const slack = slackAt(c);
  const year = reset ? 1 : Math.max(1, Math.round(1 + 2 * sm(t, W(4, 3), W(4, 7) + 0.4)));
  const meta = mix(0.85, 0.2, sm(t, L(4), W(4, 2) + 0.4));
  const kg = 80 + 9 * sm(t, W(4, 3), W(4, 7) + 0.6);
  const lookArm = t > L(3) && t < L(4);
  const pose: SketchPose = lookArm ? { r: { a: 50, e: -100 }, l: { a: 70, e: 10 }, turn: -0.4 } : { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.4 };
  const expr = reset ? "smile" : t > W(3, 2) ? "worry" : "think";
  const parts = ["KOLLAR", "KARIN", "BACAKLAR"];
  const hero = <SketchPerson t={t} seed={1.3} look={HERO} pose={pose} expr={expr} />;
  return (
    <g>
      <rect width={RW} height={RH} fill="#d9d3ec" />
      <Floor y={1480} a="#8e7560" b="#76604e" />
      <Window x={70} y={160} w={220} h={260} t={t} />
      <Frame x={340} y={200} w={150} h={120} c="#7fa6c9" />
      {/* boy aynası */}
      <Mirror x={700} y={760} w={320} h={720} id="tm-y-mirror">
        <g transform="translate(1720,0) scale(-1,1)">
          <Person x={860} foot={1500} s={0.95}>
            {hero}
          </Person>
        </g>
      </Mirror>
      {/* yatak */}
      <rect x={-20} y={1220} width={420} height={110} rx={14} fill="#efe4d3" {...st} />
      <rect x={-20} y={1330} width={420} height={60} fill="#7a5640" {...st} />
      <path d="M-20,1200 Q120,1170 400,1200 L400,1260 L-20,1260 Z" fill="#9b7bc4" {...st} />
      {/* kol kesiti kartı (büyük) */}
      <g transform="translate(540,600)" opacity={win(t, L(3) - 0.4, L(4) + 0.1, 0.3)}>
        <ArmCut m={m} slack={slack} w={620} h={420} title="DERİ BOŞTA KALIYOR" titleFill={RED} t={t} />
      </g>
      {parts.map((p, i) => (
        <Pill key={p} x={160} y={900 + i * 96} text={p} o={reset ? 0 : win(t, W(3, 5 + i) - 0.1, L(4) + 0.2, 0.2)} bg={RED} size={36} />
      ))}
      <Calendar x={200} y={1000} year={year} o={win(t, L(4) - 0.1, L(5) + 0.4, 0.25)} />
      <Gauge x={400} y={560} v={meta} o={win(t, L(4) - 0.1, L(5) + 0.4, 0.25)} />
      <Readout x={820} y={600} kg={kg} o={win(t, W(4, 3) - 0.1, L(5) + 0.4, 0.25)} delta={kg - 80} />
      <Person x={560} foot={1500} s={0.95}>
        {hero}
      </Person>
    </g>
  );
};

// ------------------------------------------------------------ 4 · spor odası

const REP = 1.4;
const curl = (t: number) => 0.5 - 0.5 * Math.cos((t / REP) * Math.PI * 2);

const Spor: React.FC<Ctx> = (c) => {
  const { t, L, W, T } = c;
  const reset = t > T - 0.6;
  const m = muscleAt(c);
  const slack = slackAt(c);
  const walk = !reset && t > W(8, 3) && t < W(8, 6);
  const sit = !reset && t > L(10) - 0.3;
  const lifting = !reset && !walk && !sit && t > W(5, 4);
  const k = curl(t);
  const liftPose: SketchPose = { r: { a: 24, e: -20 - 120 * k }, l: { a: 10, e: 6 }, itemR: "dumbbell", turn: 0.5 };
  const swing = Math.sin(t * 7);
  const walkPose: SketchPose = { r: { a: 10 + 18 * swing, e: -30 }, l: { a: 10 - 18 * swing, e: -30 }, turn: -0.5 };
  const sitPose: SketchPose = { sit: true, r: { a: 30, e: -110 }, l: { a: 14, e: 6 }, itemR: "phone", turn: 0.3 };
  const hero = (
    <SketchPerson t={t} seed={1.3} look={HERO} pose={lifting ? liftPose : { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.4 }} expr={lifting ? "grin" : "smile"} />
  );
  const armO = win(t, W(5, 4) - 0.2, L(7) + 0.1, 0.3);
  const cmpO = win(t, L(7) + 0.05, L(8) + 0.1, 0.3);
  const plateO = win(t, W(8, 11) - 0.1, L(9) + 0.3, 0.25);
  const mainO = walk || sit ? 0 : 1 - cmpO;
  return (
    <g>
      <rect width={RW} height={RH} fill="#dfe9e4" />
      {Array.from({ length: 22 }).map((_, i) => (
        <path key={i} d={`M${i * 50},0 L${i * 50},1480`} stroke="#cddbd3" strokeWidth={10} opacity={0.4} />
      ))}
      <Floor y={1480} a="#c9a77e" b="#a8835a" />
      <Window x={60} y={160} w={220} h={240} t={t} />
      <Mirror x={760} y={700} w={280} h={780} id="tm-s-mirror">
        <g transform="translate(1720,0) scale(-1,1)">
          <Person x={860} foot={1500} s={1.0}>
            {hero}
          </Person>
        </g>
      </Mirror>
      <Treadmill x={250} y={1480} t={t} on={walk} />
      <g opacity={sm(t, L(10) - 0.6, L(10) - 0.2) * (reset ? 0 : 1)}>
        <Bench x={560} y={1500} />
      </g>
      {/* dambıl rafı */}
      <rect x={30} y={1000} width={200} height={18} rx={6} fill="#8a5f42" {...st} />
      {[60, 130, 200].map((x, i) => (
        <g key={x} transform={`translate(${x},982)`}>
          <rect x={-22} y={-6} width={44} height={10} rx={3} fill="#8d8e92" stroke={LINE} strokeWidth={2} />
          <rect x={-30} y={-18} width={14} height={32} rx={4} fill={["#3a3a40", "#d9534f", "#4f8fd0"][i]} stroke={LINE} strokeWidth={2.2} />
          <rect x={16} y={-18} width={14} height={32} rx={4} fill={["#3a3a40", "#d9534f", "#4f8fd0"][i]} stroke={LINE} strokeWidth={2.2} />
        </g>
      ))}
      {/* protein tabağı (yan sehpa) */}
      <rect x={880} y={1300} width={30} height={180} fill="#7a5640" {...st} />
      <rect x={820} y={1280} width={160} height={24} rx={8} fill="#8a5f42" {...st} />
      <g opacity={Math.max(0.35, plateO)}>
        <g transform="translate(900,1262) scale(0.55)">
          <Plate x={0} y={0} />
        </g>
      </g>
      <Check x={900} y={1180} r={34} o={plateO} />
      {/* kol kesiti: kas dolar, deri toparlanır */}
      {armO > 0 ? (
        <g opacity={armO} transform="translate(540,520)">
          <ArmCut m={m} slack={slack} w={620} h={420} title={t > W(6, 6) ? "KAS DOLDU, DERİ TOPARLANDI" : "KAS GERİ GELİYOR"} titleFill={GREEN} t={t} />
        </g>
      ) : null}
      {/* aynı kilo: sporsuz / sporlu */}
      {cmpO > 0 ? (
        <g opacity={cmpO}>
          <g transform="translate(290,580)">
            <ArmCut m={0.45} slack={1} w={460} h={360} title="SPORSUZ" titleFill={RED} t={t} labels={0} />
            <Pill x={0} y={230} text="80 KG" o={1} bg="#3a3a40" size={38} />
          </g>
          <g transform="translate(790,580)">
            <ArmCut m={0.95} slack={0.32} w={460} h={360} title="SPORLU" titleFill={GREEN} t={t} labels={0} />
            <Pill x={0} y={230} text="80 KG" o={1} bg="#3a3a40" size={38} />
          </g>
        </g>
      ) : null}
      {/* kahraman */}
      <g opacity={mainO}>
        <Person x={560} foot={1520} s={1.0}>
          {hero}
        </Person>
      </g>
      {walk ? (
        <Person x={250} foot={1446 - Math.abs(swing) * 6} s={0.95}>
          <SketchPerson t={t} seed={1.3} look={HERO} pose={walkPose} expr="smile" />
        </Person>
      ) : null}
      {sit ? (
        <Person x={560} foot={1384} s={1.0} sit>
          <SketchPerson t={t} seed={1.3} look={HERO} pose={sitPose} expr="grin" />
        </Person>
      ) : null}
      <Pill x={250} y={800} text="YÜRÜYÜŞ" o={walk ? 1 : 0} bg={GREEN} size={40} />
      <Pill x={300} y={860} text="GÖNDER ➤" o={sit ? win(t, L(10), L(11) + 0.2, 0.25) : 0} bg={GREEN} size={44} />
    </g>
  );
};

// ------------------------------------------------------------ ekran kartları

const VoomCard: React.FC<{ o: number }> = ({ o }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(540,${330 + (1 - o) * 14})`}>
      <rect x={-380} y={-150} width={760} height={300} rx={34} fill="#0d0d0d" stroke={LINE} strokeWidth={4} />
      <circle cx={-232} cy={-24} r={22} fill={LIME} />
      <circle cx={-232} cy={-24} r={40} fill={LIME} opacity={0.18} />
      <text x={36} y={2} textAnchor="middle" fontFamily={MONO} fontWeight={500} fontSize={120} letterSpacing={34} fill="#fff">
        VOOM
      </text>
      <text x={0} y={92} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46} fill={LIME}>
        her zaman yanında
      </text>
    </g>
  );

// ------------------------------------------------------------ kompozisyon

export const TupMide: React.FC<EkmekBirakProps & { music?: boolean }> = ({ audioName, data, music = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const base: TL = data ? voiceTimeline(data, TM_LINES) : TM_TL;
  const T = data ? data.durationInSeconds + TM_TAIL : TM_TL.total;
  const tl: TL = { ...base, total: T };
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k, TM_LINES);
  const ctx: Ctx = { t, L, W, T };

  const [bx, by] = center(ROOMS.banyo);
  const [mx, my] = center(ROOMS.mutfak);
  const [yx, yy] = center(ROOMS.yatak);
  const [sx, sy] = center(ROOMS.spor);
  const ov: [number, number, number] = [WW / 2, WH / 2 + 10, 0.415];
  const hook: [number, number, number] = [bx - 20, by + 40, 1.08];
  const across = (at: number, a: [number, number], b: [number, number]): CamKey[] => [
    [at, a[0], a[1], 1.0],
    [at + 0.4, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[1] === b[1] ? 0.6 : 0.48],
    [at + 0.9, b[0], b[1], 1.0],
  ];
  const keys: CamKey[] = [
    [-1, ...hook],
    [L(1) - 0.1, bx - 10, by + 30, 1.12], // tartıya yavaş yaklaşma
    [W(1, 6), bx, by, 1.0],
    [W(1, 8), bx, by - 120, 1.08], // giden kilonun içi
    ...across(L(2) - 0.15, [bx, by], [mx, my]),
    [W(2, 1) + 0.2, ROOMS.mutfak.x + 290, ROOMS.mutfak.y + 680, 1.4], // mide kesilir
    [W(2, 4), ROOMS.mutfak.x + 290, ROOMS.mutfak.y + 700, 1.3],
    [W(2, 8), ROOMS.mutfak.x + 800, ROOMS.mutfak.y + 680, 1.4], // kas erir
    [L(3) - 0.15, ROOMS.mutfak.x + 760, ROOMS.mutfak.y + 760, 1.1],
    [L(3) + 0.5, (mx + yx) / 2, (my + yy) / 2, 0.48],
    [L(3) + 1.0, ROOMS.yatak.x + 540, ROOMS.yatak.y + 680, 1.25], // deri boşta
    [W(3, 5), yx, yy, 1.0],
    [L(4) + 0.2, yx, yy - 40, 1.05],
    [W(4, 7), yx, yy, 1.1],
    ...across(L(5) - 0.15, [yx, yy], [sx, sy]),
    [W(5, 4), sx, sy - 40, 1.05],
    [W(6, 2), ROOMS.spor.x + 540, ROOMS.spor.y + 640, 1.25], // kas dolar
    [L(7) - 0.05, ROOMS.spor.x + 540, ROOMS.spor.y + 680, 1.08],
    [L(8) - 0.05, ROOMS.spor.x + 540, ROOMS.spor.y + 700, 1.12], // aynı kilo
    [L(8) + 0.4, sx, sy + 60, 1.0],
    [L(9) - 0.1, sx, sy + 60, 1.04],
    [L(9) + 0.9, ...ov], // bütün ev
    [L(10) - 0.2, ...ov],
    [L(10) + 0.6, sx, sy + 80, 1.05],
    [L(11) + 0.1, sx, sy + 80, 1.08],
    [W(11, 6), ...ov], // "Unutma…" geri çekil
    [T - 0.1, ...hook], // banyoya dal (döngü)
    [T, ...hook],
  ];
  const [, cx, cy, z] = camAt(t, keys);
  const loopIn = sm(t, T - 0.4, T - 0.05);

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.24, lead: 0.05 },
    { at: W(1, 3), id: 2568, v: 0.12 },
    { at: W(1, 12), id: 1120, v: 0.16, lead: 0.1 },
    { at: W(2, 1), id: 1120, v: 0.12, lead: 0.1 },
    { at: W(3, 2), id: 1120, v: 0.14, lead: 0.1 },
    { at: W(4, 5), id: 1120, v: 0.12, lead: 0.1 },
    { at: W(5, 3), id: 1143, v: 0.16, lead: 0.14, dur: 1.6, fade: 0.8 },
    { at: W(6, 6), id: 2568, v: 0.14 },
    { at: W(8, 0), id: 2568, v: 0.12 },
    { at: W(8, 11), id: 2568, v: 0.12 },
    { at: L(11), id: 2568, v: 0.14 },
  ];

  const room = (r: { x: number; y: number }, id: string, el: React.ReactNode) => (
    <g transform={`translate(${r.x},${r.y})`}>
      <clipPath id={`tm-${id}`}>
        <rect width={RW} height={RH} />
      </clipPath>
      <g clipPath={`url(#tm-${id})`}>{el}</g>
      <rect width={RW} height={RH} fill="none" stroke={LINE} strokeWidth={6} />
    </g>
  );

  const steps = [
    { at: W(8, 0), n: "✓", txt: "DOKTOR ONAYI" },
    { at: W(8, 3), n: "1", txt: "YÜRÜYÜŞ" },
    { at: W(8, 6), n: "2", txt: "HAFTADA 2-3 GÜN AĞIRLIK" },
    { at: W(8, 11), n: "3", txt: "ÖNCE PROTEİN" },
  ];
  const stepsO = win(t, W(8, 0) - 0.3, L(9) + 0.1, 0.3);

  return (
    <AbsoluteFill lang="tr" style={{ background: "#f6e3cf", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <SketchDefs />
        <g transform={`translate(540,960) scale(${z}) translate(${-cx},${-cy})`}>
          <g filter="url(#pencil)">
            <Outside t={t} />
            {room(ROOMS.banyo, "b", <Banyo {...ctx} />)}
            {room(ROOMS.mutfak, "m", <Mutfak {...ctx} />)}
            {room(ROOMS.yatak, "y", <Yatak {...ctx} />)}
            {room(ROOMS.spor, "s", <Spor {...ctx} />)}
          </g>
        </g>

        {/* ekran kartları */}
        <Card x={540} y={250} w={880} h={230} o={Math.max(win(t, -1, L(1) + 0.1, 0.25), loopIn)}>
          <Txt x={0} y={-16} size={76}>
            TARTI HER ŞEYİ
          </Txt>
          <Txt x={0} y={70} size={76} fill={RED}>
            SÖYLEMİYOR
          </Txt>
        </Card>
        <Card x={540} y={220} w={780} h={150} o={win(t, W(2, 4), L(3) - 0.1, 0.25)} tilt={1}>
          <Txt x={0} y={22} size={58}>
            AZ YEMEK = <tspan fill={RED}>KAS KAYBI</tspan>
          </Txt>
        </Card>
        <Card x={540} y={220} w={720} h={150} o={win(t, W(4, 3), L(5) - 0.1, 0.25)} tilt={-1}>
          <Txt x={0} y={22} size={60}>
            KİLOLAR <tspan fill={RED}>GERİ GELİR</tspan>
          </Txt>
        </Card>
        <Card x={540} y={240} w={620} h={170} o={win(t, W(5, 2), W(6, 2), 0.25)} tilt={1}>
          <Txt x={0} y={26} size={72}>
            ÇÖZÜM: <tspan fill={GREEN}>SPOR</tspan>
          </Txt>
        </Card>
        <Card x={540} y={210} w={860} h={140} o={win(t, L(7) + 0.1, L(8) - 0.05, 0.25)} tilt={-1}>
          <Txt x={0} y={20} size={54}>
            AYNI KİLO, <tspan fill={GREEN}>FARKLI GÖRÜNÜŞ</tspan>
          </Txt>
        </Card>
        {stepsO > 0 ? (
          <g opacity={stepsO} transform={`translate(540,${400 + (1 - stepsO) * 14}) rotate(-1)`}>
            <rect x={-412} y={-212} width={840} height={440} rx={22} fill="#5a3a26" opacity={0.12} />
            <rect x={-420} y={-220} width={840} height={440} rx={22} fill={PAPER} {...st} />
            {steps.map((s, i) => {
              const o = sm(t, s.at - 0.1, s.at + 0.25);
              const y = -150 + i * 100;
              return (
                <g key={i} opacity={o} transform={`translate(${(1 - o) * -20},0)`}>
                  <circle cx={-350} cy={y} r={34} fill={i === 0 ? GREEN : "#3a3a40"} {...st} strokeWidth={3} />
                  <text x={-350} y={y + 14} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={38} fill="#fff">
                    {s.n}
                  </text>
                  <text x={-296} y={y + 16} fontFamily={SANS} fontWeight={800} fontSize={48} fill={LINE} letterSpacing={-1}>
                    {s.txt}
                  </text>
                </g>
              );
            })}
          </g>
        ) : null}
        <Card x={540} y={330} w={900} h={250} o={win(t, L(9) + 0.2, L(10) + 0.1, 0.3)} tilt={1}>
          <Txt x={0} y={-20} size={58}>
            AMELİYAT → <tspan fill={RED}>KİLO VERDİRİR</tspan>
          </Txt>
          <Txt x={0} y={70} size={58}>
            SPOR → <tspan fill={GREEN}>ŞEKİL VERİR</tspan>
          </Txt>
        </Card>
        <VoomCard o={win(t, L(11) - 0.05, W(11, 6) + 0.3, 0.3)} />
      </svg>

      <Captions t={t} tl={tl} lines={TM_LINES} end={T - TM_TAIL + 0.5} />
      {data ? <Audio src={staticFile(`audio/${audioName}.mp3`)} volume={1.6} /> : null}
      {data && music ? (
        <Audio
          src={staticFile("music/623.mp3")}
          volume={(f) => {
            const mt = f / fps;
            const end = data.durationInSeconds;
            const b = interpolate(mt, [0, 0.6, end, end + 0.5], [0, 0.04, 0.04, 0.08], { extrapolateRight: "clamp" });
            return b * interpolate(mt, [T - 0.9, T - 0.1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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
