/**
 * "Sürekli spor yapıyorsun ama sonuç yok" — üç gizli hırsız (~33 sn). EkmekEv'in ev kesiti tarzı: önü açık iki katlı ev,
 * kamera odadan odaya kesmeden süzülür. Spor odasında genç dambıl çalışır, her tekrarda "EMEK" kavanozuna boncuk düşer;
 * üç hırsız (çizgili tişört, maske, çuval) boncukları aşırır: 1 spor odası "AYNI YÜK" (takvim döner, dambıl hep 10 kg),
 * 2 mutfak "BOŞ TABAK" (tek poğaça; kas kartında yırtıklar onarılmaz), 3 yatak odası "GECE 03:00" (telefon, toparlanma
 * yarım) → çözüm: oda oda düzelir (12 kg, dolu tabak, 23:00 uyku), hırsızlar kaçar → 4 salon: "aranıyor" afişleri,
 * genç yorum yazar → ev → spor odası (döngü; son kare = ilk kare). Metin `icerik/uc-hirsiz.seslendirme.txt`.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline, win } from "../ornek/common";
import { LINE, type SketchPose, SketchDefs, SketchPerson, SKETCH_CAST } from "../sketch/SketchPerson";
import {
  Captions,
  Card,
  Check,
  Cross,
  type EkmekBirakProps,
  GREEN,
  PAPER,
  Pill,
  Plate,
  RED,
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

export const UH_LINES: Line[] = [
  { text: "Her gün spor yapıp hiç değişmiyorsan… sorun salonda değil, evinde.", hl: ["değişmiyorsan…", "evinde."], hold: 0.3 },
  { text: "Çünkü emeğini sessizce çalan üç hırsız var.", hl: ["üç", "hırsız"], hold: 0.3 },
  { text: "Birincisi: aynı yük. Aylardır aynı dambıl… Vücut alışınca değişmek için bir sebep bulamaz.", hl: ["aynı", "yük.", "alışınca"], hold: 0.1 },
  { text: "İkincisi: boş tabak. Kas antrenmanda yıpranır, onarmak için protein ister. Tabak boşsa tamir de yok.", hl: ["boş", "tabak.", "protein"], hold: 0.1 },
  { text: "Üçüncüsü: gece üç. Kas en çok uyurken onarılır… Sen telefondaysan o iş yarım kalır.", hl: ["gece", "üç.", "uyurken"], hold: 0.1 },
  { text: "Çözüm basit: her hafta bir tekrar ya da bir kilo fazlası, her öğünde protein, gece yedi sekiz saat uyku.", hl: ["fazlası,", "protein,", "uyku."], hold: 0.2 },
  { text: "Sende hangi hırsız var? Yorumlara yaz.", hl: ["hangi", "Yorumlara"], hold: 0.4 },
];

export const UH_TAIL = 2.4;
export const UH_TL = timeline(UH_LINES, UH_TAIL);

const HERO = SKETCH_CAST.siyah.look;
const GOLD = "#e8b84a";

const WW = 2600;
const WH = 4400;
const RW = 1080;
const RH = 1800;
const ROOMS = {
  spor: { x: 180, y: 560 },
  mutfak: { x: 1340, y: 560 },
  yatak: { x: 180, y: 2440 },
  salon: { x: 1340, y: 2440 },
} as const;
const center = (r: { x: number; y: number }) => [r.x + RW / 2, r.y + RH / 2] as const;

type Ctx = { t: number; L: (i: number) => number; W: (l: number, k: number) => number; T: number };

// ------------------------------------------------------------ zaman yardımcıları (oda ve kamera ortak)

/** dambıl tekrarı: 0 aşağı … 1 yukarı */
const REP = 1.5;
const curl = (t: number) => 0.5 - 0.5 * Math.cos((t / REP) * Math.PI * 2);

/** EMEK kavanozu doluluğu */
const jarLevel = (c: Ctx) => {
  const { t, L, W, T } = c;
  const reps = Math.min(4, Math.floor(Math.max(0, t) / REP));
  let v = 0.3 + 0.1 * reps * (t < L(1) ? 1 : 0);
  if (t >= L(1)) v = mix(0.7, 0.12, sm(t, W(1, 4), W(1, 4) + 1.6));
  v += (1 - 0.12) * sm(t, W(5, 18), W(5, 18) + 1.2) * (t >= L(5) ? 1 : 0);
  return mix(v, 0.3, sm(t, T - 0.9, T - 0.35));
};

/** hırsızların görünürlüğü: 1. satırda belirir, çözümde kaçar */
const thiefO = (c: Ctx, i: number, fixAt: number) => {
  const { t, W } = c;
  return sm(t, W(1, 4) + i * 0.25, W(1, 4) + i * 0.25 + 0.4) * (1 - sm(t, fixAt + 0.2, fixAt + 0.9));
};

const fix1 = (c: Ctx) => c.W(5, 8);
const fix2 = (c: Ctx) => c.W(5, 12);
const fix3 = (c: Ctx) => c.W(5, 14) + 0.3;

// ------------------------------------------------------------ hırsız (çizgili tişört, maske, bere, çuval)

const Thief: React.FC<{ x: number; foot: number; s: number; dir: 1 | -1; t: number; o: number; label: string; run?: number; seed?: number }> = ({
  x,
  foot,
  s,
  dir,
  t,
  o,
  label,
  run = 0,
  seed = 0,
}) => {
  if (o <= 0) return null;
  const bob = Math.abs(Math.sin(t * 5 + seed)) * 6;
  const reach = Math.sin(t * 2.2 + seed) * 8;
  const skin = "#f1dccb";
  const dark = "#2f2b33";
  const limb = (pts: [number, number][], w: number, fill: string) => {
    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} stroke={LINE} strokeWidth={w + 7} />
        <path d={d} stroke={fill} strokeWidth={w} />
      </g>
    );
  };
  return (
    <g opacity={o} transform={`translate(${x + run * dir * -260},${foot - bob}) scale(${s * dir},${s})`}>
      <ellipse cx={0} cy={bob + 4} rx={90} ry={11} fill="#5a3a26" opacity={0.13} />
      {/* çuval (sırtta) */}
      <g transform="translate(-92,-400) rotate(-12)">
        <path d="M-70,-10 Q-90,90 -50,140 Q0,170 50,140 Q90,90 70,-10 Q40,-40 0,-30 Q-40,-40 -70,-10 Z" fill="#d9c49a" {...st} />
        <path d="M-24,-34 Q0,-60 24,-34" fill="none" {...st} strokeWidth={6} />
        <g transform={`scale(${dir},1)`}>
          <text x={0} y={70} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={label.length > 7 ? 24 : 30} fill={LINE}>
            {label}
          </text>
        </g>
      </g>
      {/* parmak ucu bacaklar */}
      {limb([[-22, -250], [-40, -130], [-14, -12]], 30, dark)}
      {limb([[22, -250], [40, -140], [30, -16]], 30, dark)}
      <path d="M-30,-14 L4,-6 M18,-16 L52,-8" stroke={LINE} strokeWidth={14} strokeLinecap="round" />
      {/* gövde: çizgili tişört */}
      <clipPath id={`thief-body-${seed}`}>
        <path d="M-64,-470 Q0,-486 64,-470 Q74,-360 62,-240 Q0,-228 -62,-240 Q-74,-360 -64,-470 Z" />
      </clipPath>
      <path d="M-64,-470 Q0,-486 64,-470 Q74,-360 62,-240 Q0,-228 -62,-240 Q-74,-360 -64,-470 Z" fill="#f4efe6" />
      <g clipPath={`url(#thief-body-${seed})`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={-90} y={-470 + i * 42} width={180} height={20} fill={dark} />
        ))}
      </g>
      <path d="M-64,-470 Q0,-486 64,-470 Q74,-360 62,-240 Q0,-228 -62,-240 Q-74,-360 -64,-470 Z" fill="none" {...st} />
      {/* kollar: biri çuvalı tutar, biri öne uzanır */}
      {limb([[-52, -456], [-96, -420], [-100, -470]], 20, skin)}
      {limb([[52, -456], [112, -470 + reach], [166, -500 + reach]], 20, skin)}
      <circle cx={170} cy={-502 + reach} r={14} fill={skin} {...st} strokeWidth={2.8} />
      {/* kafa: bere + maske */}
      <ellipse cx={8} cy={-548} rx={64} ry={68} fill={skin} {...st} />
      <path d="M-58,-566 Q-60,-640 8,-646 Q76,-640 74,-566 Z" fill={dark} {...st} />
      <path d="M-60,-566 L76,-566" stroke="#5a5560" strokeWidth={10} />
      <path d="M-58,-546 Q8,-560 74,-546 L74,-520 Q8,-532 -58,-520 Z" fill="#111" {...st} strokeWidth={2.6} />
      <ellipse cx={-6} cy={-534} rx={9} ry={7} fill="#fff" />
      <ellipse cx={40} cy={-534} rx={9} ry={7} fill="#fff" />
      <circle cx={-2} cy={-534} r={3.4} fill="#111" />
      <circle cx={44} cy={-534} r={3.4} fill="#111" />
      <path d="M14,-496 q12,8 24,0" fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

// ------------------------------------------------------------ küçük parçalar

/** EMEK kavanozu; level 0-1 (altın boncuklar) */
const Jar: React.FC<{ x: number; y: number; level: number }> = ({ x, y, level }) => {
  const w = 170;
  const h = 210;
  const n = Math.round(level * 18);
  const beads: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    beads.push(<circle key={i} cx={x - 54 + col * 36 + (row % 2) * 10} cy={y - 30 - row * 32} r={16} fill={GOLD} stroke={LINE} strokeWidth={2.2} />);
  }
  return (
    <g>
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={26} fill="#eaf4f7" fillOpacity={0.55} {...st} />
      {beads}
      <rect x={x - w / 2 - 8} y={y - h - 28} width={w + 16} height={34} rx={9} fill="#c76a4a" {...st} />
      <rect x={x - 62} y={y - h + 34} width={124} height={46} rx={8} fill={PAPER} {...st} strokeWidth={2.4} />
      <text x={x} y={y - h + 68} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={LINE}>
        EMEK
      </text>
      <path d={`M${x - w / 2 + 16},${y - h + 20} L${x - w / 2 + 16},${y - 30}`} stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.6} />
    </g>
  );
};

/** kas kartı: iğ biçimli kas, lifler; yırtıklar ve onarım */
const Muscle: React.FC<{ x: number; y: number; tear: number; heal: number; s?: number }> = ({ x, y, tear, heal, s = 1 }) => {
  const k = 1 + 0.16 * heal;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-200,0 L-150,0" stroke="#f4efe6" strokeWidth={22} strokeLinecap="round" />
      <path d="M150,0 L200,0" stroke="#f4efe6" strokeWidth={22} strokeLinecap="round" />
      <path d="M-200,0 L-150,0 M150,0 L200,0" stroke={LINE} strokeWidth={2.4} fill="none" opacity={0.6} />
      <g transform={`scale(1,${k})`}>
        <path d="M-160,0 Q-90,-70 0,-74 Q90,-70 160,0 Q90,70 0,74 Q-90,70 -160,0 Z" fill="#d9675e" {...st} />
        {[-48, -24, 0, 24, 48].map((dy) => (
          <path key={dy} d={`M-130,${dy * 0.5} Q0,${dy * 1.3} 130,${dy * 0.5}`} fill="none" stroke="#f0a59c" strokeWidth={4} opacity={0.8} />
        ))}
      </g>
      {tear > 0
        ? [
            [-70, -30],
            [10, 10],
            [80, -20],
          ].map(([a, b], i) => (
            <path
              key={i}
              d={`M${a - 16},${b - 18} l10,10 l-8,8 l12,10 l-6,10`}
              fill="none"
              stroke="#7a1f1a"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={tear * (1 - heal)}
            />
          ))
        : null}
    </g>
  );
};

const PhoneGlow: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <ellipse cx={x} cy={y + 30} rx={150} ry={110} fill="#9fd3e8" opacity={0.25} />
      <g transform={`translate(${x},${y}) rotate(-15)`}>
        <rect x={-22} y={-40} width={44} height={76} rx={8} fill="#2b2b33" {...st} strokeWidth={2.6} />
        <rect x={-16} y={-33} width={32} height={58} rx={4} fill="#bfe8f5" />
      </g>
    </g>
  );

const ZZZ: React.FC<{ x: number; y: number; t: number; o: number }> = ({ x, y, t, o }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      {[0, 1, 2].map((i) => {
        const ph = (t * 0.5 + i / 3) % 1;
        return (
          <text key={i} x={x + ph * 70} y={y - ph * 150} fontFamily={SANS} fontWeight={800} fontSize={40 + ph * 26} fill="#f4ecd0" opacity={Math.sin(ph * Math.PI)}>
            z
          </text>
        );
      })}
    </g>
  );

const Bar: React.FC<{ x: number; y: number; w: number; v: number; label: string; color: string; o: number; dark?: boolean }> = ({ x, y, w, v, label, color, o, dark }) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <text x={x} y={y - 22} fontFamily={SANS} fontWeight={800} fontSize={34} fill={dark ? "#f4ecd0" : LINE}>
        {label}
      </text>
      <rect x={x} y={y} width={w} height={46} rx={23} fill={dark ? "#1f2747" : "#efe4d3"} {...st} />
      {v > 0.01 ? <rect x={x + 6} y={y + 6} width={(w - 12) * v} height={34} rx={17} fill={color} /> : null}
      <text x={x + w + 20} y={y + 36} fontFamily={SANS} fontWeight={800} fontSize={36} fill={dark ? "#f4ecd0" : LINE}>
        %{Math.round(v * 100)}
      </text>
    </g>
  );

// ------------------------------------------------------------ 1 · spor odası

const Spor: React.FC<Ctx> = (c) => {
  const { t, L, W, T } = c;
  const reset = t > T - 0.6;
  const fixed = !reset && t > fix1(c);
  const months = reset ? 1 : Math.max(1, Math.round(1 + 5 * sm(t, 0.2, W(0, 4)) + 3 * sm(t, W(2, 3), W(2, 6))));
  const k = curl(t);
  const pose: SketchPose = { r: { a: 24, e: -20 - 120 * k }, l: { a: 10, e: 6 }, itemR: "dumbbell", turn: 0.5 };
  const bored = !reset && t > W(2, 7) && t < L(5);
  const expr = reset || t < W(0, 7) ? "grin" : fixed ? "grin" : bored ? "flat" : "worry";
  const hero = <SketchPerson t={t} seed={1.3} look={HERO} pose={pose} expr={expr} />;
  // her tekrarda kavanoza boncuk
  const beads: React.ReactNode[] = [];
  const beadPhase = (t % REP) / REP;
  const giving = (t < L(1) && t > REP * 0.5) || (fixed && t < T - 1);
  if (giving && beadPhase > 0.45) {
    const u = (beadPhase - 0.45) / 0.55;
    beads.push(<circle key="b" cx={mix(590, 180, u)} cy={mix(1030, 1000, u) - Math.sin(u * Math.PI) * 160} r={16} fill={GOLD} stroke={LINE} strokeWidth={2.2} opacity={Math.min(1, (1 - u) * 5)} />);
  }
  const kg = fixed ? 12 : 10;
  return (
    <g>
      <rect width={RW} height={RH} fill="#dfe9e4" />
      {Array.from({ length: 22 }).map((_, i) => (
        <path key={i} d={`M${i * 50},0 L${i * 50},1480`} stroke="#cddbd3" strokeWidth={10} opacity={0.4} />
      ))}
      <Floor y={1480} a="#c9a77e" b="#a8835a" />
      <rect x={260} y={1470} width={560} height={40} rx={8} fill="#4d5a66" {...st} strokeWidth={2.4} />
      <Window x={80} y={200} w={220} h={260} t={t} />
      {/* takvim */}
      <g transform="translate(-20,300) rotate(-3,450,330)">
        <rect x={360} y={220} width={190} height={210} rx={10} fill="#fff" {...st} />
        <rect x={360} y={220} width={190} height={52} rx={10} fill={RED} {...st} />
        {[400, 450, 500].map((x) => (
          <circle key={x} cx={x} cy={222} r={7} fill={PAPER} {...st} strokeWidth={2} />
        ))}
        <Txt x={455} y={372} size={84}>
          {months}
        </Txt>
        <Txt x={455} y={414} size={28} w={700}>
          . AY
        </Txt>
      </g>
      {/* dambıl rafı */}
      <rect x={60} y={1170} width={250} height={20} rx={6} fill="#8a5f42" {...st} />
      {[90, 280].map((x) => (
        <rect key={x} x={x - 8} y={1190} width={16} height={290} fill="#7a5640" {...st} />
      ))}
      <rect x={60} y={1330} width={250} height={18} rx={6} fill="#8a5f42" {...st} />
      {[110, 180, 250].map((x, i) => (
        <g key={x} transform={`translate(${x},1310)`}>
          <rect x={-26} y={-6} width={52} height={10} rx={3} fill="#8d8e92" stroke={LINE} strokeWidth={2} />
          <rect x={-34} y={-20} width={16} height={36} rx={4} fill={["#3a3a40", "#d9534f", "#4f8fd0"][i]} stroke={LINE} strokeWidth={2.4} />
          <rect x={18} y={-20} width={16} height={36} rx={4} fill={["#3a3a40", "#d9534f", "#4f8fd0"][i]} stroke={LINE} strokeWidth={2.4} />
        </g>
      ))}
      <Jar x={185} y={1168} level={jarLevel(c)} />
      {/* ayna + yansıma */}
      <rect x={700} y={300} width={320} height={1180} rx={14} fill="#7a5640" {...st} />
      <clipPath id="uh-mirror">
        <rect x={718} y={318} width={284} height={1144} rx={8} />
      </clipPath>
      <rect x={718} y={318} width={284} height={1144} rx={8} fill="#d5e6ec" />
      <g clipPath="url(#uh-mirror)" opacity={0.55}>
        <g transform="translate(1720,0) scale(-1,1)">
          <Person x={860} foot={1500} s={1.0}>
            {hero}
          </Person>
        </g>
      </g>
      <g clipPath="url(#uh-mirror)">
        <path d="M740,500 L860,380 M740,640 L960,420 M780,1300 L980,1100" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.45} />
      </g>
      <Plant x={1000} y={1570} s={0.75} />
      <Thief x={330} foot={1520} s={0.85} dir={-1} t={t} o={reset ? 0 : thiefO(c, 0, fix1(c))} run={sm(t, fix1(c), fix1(c) + 0.9)} label="AYNI YÜK" seed={1} />
      <Person x={580} foot={1500} s={1.0}>
        {hero}
      </Person>
      {beads}
      <Pill x={600} y={790} text={`${kg} KG`} o={reset ? 0 : win(t, W(2, 4) - 0.1, L(3) + 0.3, 0.2) + win(t, W(5, 8) - 0.1, T - 0.7, 0.25)} bg={fixed ? GREEN : "#3a3a40"} size={50} />
      <Pill x={600} y={680} text="+1 TEKRAR" o={reset ? 0 : win(t, W(5, 4) - 0.1, T - 0.7, 0.25)} bg={GREEN} size={44} />
      <Pill x={560} y={1400} text="VÜCUT ALIŞTI" o={win(t, W(2, 7) - 0.1, L(3) + 0.3, 0.25)} bg={RED} size={44} />
    </g>
  );
};

// ------------------------------------------------------------ 2 · mutfak

const Mutfak: React.FC<Ctx> = (c) => {
  const { t, L, W, T } = c;
  const fixed = t > fix2(c) && t < T - 0.6;
  const eatA = W(3, 1);
  const eating = t > eatA && t < L(4) && !fixed;
  const ate = t > eatA + 0.4 && !fixed;
  const pose: SketchPose = eating
    ? poseAt(t, [
        { at: -1, pose: { r: { a: 50, e: -10 }, l: { a: 14, e: 6 }, turn: 0.5 } },
        { at: eatA + 0.3, pose: { r: { a: 40, e: -150 }, l: { a: 14, e: 6 }, itemR: "pogaca", turn: 0.3 } },
      ])
    : fixed
      ? { r: { a: 40, e: -60 }, l: { a: 14, e: 6 }, turn: 0.5 }
      : { r: { a: 14, e: 6 }, l: { a: 14, e: 6 }, turn: 0.5 };
  const chew = eating && t > eatA + 0.4 ? 0.3 + 0.3 * Math.sin(t * 16) : 0;
  const tear = sm(t, W(3, 5) - 0.1, W(3, 5) + 0.3);
  const heal = sm(t, fix2(c), fix2(c) + 0.8) * (t < T - 0.6 ? 1 : 0);
  const cardO = win(t, W(3, 3) - 0.2, L(4) + 0.4, 0.25) + win(t, fix2(c) - 0.3, W(5, 14) + 0.6, 0.25);
  return (
    <g>
      <rect width={RW} height={RH} fill="#f6e6c4" />
      {[60, 200].map((x) => (
        <g key={x}>
          <rect x={x} y={200} width={130} height={340} fill="#9cc6b0" {...st} />
          <circle cx={x + 110} cy={480} r={8} fill={LINE} />
        </g>
      ))}
      <Window x={390} y={230} w={300} h={300} t={t} />
      <path d="M370,214 L710,214" {...st} strokeWidth={6} />
      <path d="M380,214 Q420,380 386,540 L370,540 Z M700,214 Q660,380 694,540 L710,540 Z" fill="#e8a0a0" {...st} strokeWidth={2.4} />
      {[740, 880].map((x) => (
        <g key={x}>
          <rect x={x} y={200} width={130} height={340} fill="#9cc6b0" {...st} />
          <circle cx={x + 20} cy={480} r={8} fill={LINE} />
        </g>
      ))}
      <rect x={0} y={600} width={RW} height={450} fill="#fbf3e6" />
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={i} d={`M${i * 70},600 L${i * 70},1050`} {...thin} opacity={0.2} />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} d={`M0,${600 + i * 70} L${RW},${600 + i * 70}`} {...thin} opacity={0.2} />
      ))}
      <rect x={0} y={1050} width={RW} height={44} fill="#c99a6a" {...st} />
      <rect x={0} y={1094} width={RW} height={360} fill="#9cc6b0" {...st} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={20 + i * 212} y={1120} width={190} height={310} rx={8} fill="none" stroke={LINE} strokeWidth={2.4} />
          <rect x={95 + i * 212} y={1140} width={40} height={10} rx={4} fill={LINE} />
        </g>
      ))}
      <Floor y={1480} a="#d9b48a" b="#b98e62" />
      {/* tabak */}
      {fixed ? (
        <g opacity={sm(t, fix2(c), fix2(c) + 0.4)}>
          <g transform="translate(700,1030) scale(0.85)">
            <Plate x={0} y={0} />
          </g>
          <Check x={700} y={930} r={38} o={sm(t, fix2(c) + 0.2, fix2(c) + 0.5)} />
        </g>
      ) : (
        <g>
          <ellipse cx={700} cy={1036} rx={120} ry={30} fill="#fbfbf7" {...st} />
          <ellipse cx={700} cy={1036} rx={84} ry={18} fill="none" stroke={LINE} strokeWidth={2} opacity={0.4} />
          {!ate ? (
            <g transform="translate(700,1034)">
              <path d="M-30,8 Q-34,-22 0,-26 Q34,-22 30,8 Q0,14 -30,8 Z" fill="#e2a95a" {...st} strokeWidth={2.6} />
            </g>
          ) : null}
        </g>
      )}
      <Cross x={700} y={1000} r={46} o={!fixed ? win(t, W(3, 10) - 0.1, L(4) + 0.3, 0.2) : 0} />
      {/* kas kartı */}
      {cardO > 0 ? (
        <g opacity={Math.min(1, cardO)}>
          <rect x={560} y={620} width={480} height={300} rx={18} fill={PAPER} {...st} />
          <text x={800} y={672} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill={LINE}>
            KAS
          </text>
          <Muscle x={800} y={770} tear={tear} heal={heal} s={0.95} />
          <g opacity={sm(t, W(3, 8) - 0.1, W(3, 8) + 0.3)}>
            <rect x={640} y={846} width={320} height={58} rx={12} fill={fixed ? "#dff2e2" : "#fff"} stroke={fixed ? GREEN : LINE} strokeWidth={3} strokeDasharray={fixed ? undefined : "10 8"} />
            <text x={800} y={888} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={32} fill={fixed ? GREEN : RED}>
              {fixed ? "PROTEİN ✓" : "PROTEİN ?"}
            </text>
          </g>
        </g>
      ) : null}
      <Thief x={950} foot={1660} s={1.0} dir={-1} t={t} o={t > T - 0.6 ? 0 : thiefO(c, 1, fix2(c))} run={sm(t, fix2(c), fix2(c) + 0.9)} label="BOŞ TABAK" seed={2} />
      <Person x={420} foot={1640} s={1.15}>
        <SketchPerson t={t} seed={1.3} look={HERO} pose={pose} expr={fixed ? "grin" : ate && t > W(3, 10) ? "worry" : "smile"} talk={chew} />
      </Person>
      <Pill x={540} y={1420} text="TAMİR YOK" o={!fixed ? win(t, W(3, 12) - 0.1, L(4) + 0.3, 0.2) : 0} bg={RED} size={50} />
    </g>
  );
};

// ------------------------------------------------------------ 3 · yatak odası

const Yatak: React.FC<Ctx> = (c) => {
  const { t, L, W, T } = c;
  const fixed = t > fix3(c) - 0.3 && t < T - 0.6;
  const light = sm(t, fix3(c) - 0.3, fix3(c) + 0.3) * (t < T - 0.6 ? 1 : 0);
  const rec = fixed ? mix(0.5, 1, sm(t, fix3(c), fix3(c) + 1.0)) : 0.5 * sm(t, W(4, 6), W(4, 8));
  const clock = fixed ? "23:00" : "03:00";
  return (
    <g>
      <rect width={RW} height={RH} fill={`rgb(${mix(52, 40, light)},${mix(64, 48, light)},${mix(107, 84, light)})`} />
      <Floor y={1480} a="#6e5644" b="#5a4535" />
      <Window x={90} y={220} w={240} h={300} t={t} night />
      <circle cx={260} cy={300} r={34} fill="#f4ecd0" {...st} strokeWidth={2.4} />
      <Frame x={420} y={250} w={160} h={130} c="#7fa6c9" />
      <Bar x={420} y={560} w={420} v={rec} label="TOPARLANMA" color={fixed ? "#6bd07a" : "#e8b84a"} o={win(t, W(4, 3) - 0.2, L(5) + 0.3, 0.25) + win(t, fix3(c) - 0.3, T - 0.8, 0.25)} dark />
      <Pill x={630} y={720} text="YARIM KALDI" o={!fixed ? win(t, W(4, 12) - 0.1, L(5) + 0.3, 0.2) : 0} bg={RED} size={42} />
      {/* hırsız yatağın arkasında */}
      <Thief x={780} foot={1250} s={0.9} dir={-1} t={t} o={t > T - 0.6 ? 0 : thiefO(c, 2, fix3(c))} run={sm(t, fix3(c), fix3(c) + 0.9)} label="GECE 03:00" seed={3} />
      {/* yatak */}
      <rect x={90} y={880} width={60} height={540} rx={14} fill="#8a5f42" {...st} />
      <rect x={110} y={1180} width={780} height={110} rx={14} fill="#efe4d3" {...st} />
      <rect x={110} y={1290} width={780} height={60} fill="#7a5640" {...st} />
      {[130, 870].map((x) => (
        <rect key={x} x={x - 12} y={1350} width={24} height={110} fill="#7a5640" {...st} />
      ))}
      <ellipse cx={240} cy={1150} rx={100} ry={44} fill="#fbfbf7" {...st} />
      {/* yatan genç: başı yastıkta */}
      <g transform="translate(118,1290) rotate(-90) scale(0.85)">
        <SketchPerson t={t} seed={1.3} look={HERO} pose={{ r: fixed ? { a: 14, e: 6 } : { a: 30, e: -120 }, l: { a: 14, e: 6 }, turn: 0.2 }} expr={fixed ? "sleep" : "flat"} />
      </g>
      <path d="M370,1100 Q420,1060 620,1070 Q820,1070 880,1110 L890,1200 L360,1200 Z" fill="#4f8fd0" {...st} />
      <path d="M420,1110 Q600,1090 860,1120" fill="none" stroke="#fff" strokeWidth={4} opacity={0.5} />
      <PhoneGlow x={330} y={940} o={1 - light} />
      <ZZZ x={300} y={980} t={t} o={light} />
      {/* komodin + saat + lamba */}
      <rect x={910} y={1150} width={150} height={320} rx={8} fill="#8a5f42" {...st} />
      <rect x={930} y={1080} width={110} height={64} rx={10} fill="#1d1d22" {...st} />
      <text x={985} y={1126} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={34} fill={fixed ? "#7fd3ff" : "#ff5a4a"}>
        {clock}
      </text>
      <path d="M985,1080 L985,980 M945,980 L1025,980 L1005,920 L965,920 Z" fill={fixed ? "#8a8a70" : "#f2d64a"} {...st} />
      {!fixed ? <ellipse cx={985} cy={1000} rx={110} ry={90} fill="#ffe08a" opacity={0.15} /> : null}
      <Check x={630} y={720} r={40} o={fixed ? sm(t, fix3(c) + 0.8, fix3(c) + 1.1) : 0} />
    </g>
  );
};

// ------------------------------------------------------------ 4 · salon (aranıyor afişleri + yorum)

const Salon: React.FC<Ctx> = (c) => {
  const { t, L, W, T } = c;
  const poster = (i: number) => sm(t, W(6, 1) + i * 0.2 - 0.1, W(6, 1) + i * 0.2 + 0.3);
  const typed = "Bende 2. hırsız var…";
  const tw = sm(t, W(6, 4), W(6, 4) + 1.2);
  const n = Math.round(typed.length * tw);
  const labels = ["AYNI YÜK", "BOŞ TABAK", "GECE 03:00"];
  return (
    <g>
      <rect width={RW} height={RH} fill="#f4dcc6" />
      <Floor y={1480} a="#e9caa8" b="#cfa883" />
      <path d="M0,150 Q540,260 1080,150" {...thin} />
      {Array.from({ length: 10 }).map((_, i) => {
        const u = (i + 0.5) / 10;
        const x = u * 1080;
        const y = 150 + Math.sin(u * Math.PI) * 55;
        const sw = Math.sin(t * 2 + i) * 3;
        return <path key={i} d={`M${x - 22},${y} L${x + 22},${y} L${x + sw},${y + 50} Z`} fill={["#e8b84a", "#4fa3c7", "#d9534f", "#6bb36a", "#9b7bc4"][i % 5]} {...st} strokeWidth={2.2} />;
      })}
      {/* aranıyor afişleri */}
      {labels.map((lb, i) => {
        const o = t < L(6) - 0.2 ? 0.25 : poster(i);
        const x = 90 + i * 320;
        return (
          <g key={lb} opacity={o} transform={`rotate(${[-3, 2, -2][i]},${x + 140},500)`}>
            <rect x={x} y={420} width={280} height={340} fill="#f3e2b8" {...st} />
            <circle cx={x + 140} cy={430} r={8} fill={RED} {...st} strokeWidth={2} />
            <text x={x + 140} y={478} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill={LINE}>
              ARANIYOR
            </text>
            <g transform={`translate(${x + 128},738) scale(0.38)`}>
              <ellipse cx={8} cy={-548} rx={64} ry={68} fill="#f1dccb" {...st} />
              <path d="M-58,-566 Q-60,-640 8,-646 Q76,-640 74,-566 Z" fill="#2f2b33" {...st} />
              <path d="M-58,-546 Q8,-560 74,-546 L74,-520 Q8,-532 -58,-520 Z" fill="#111" />
              <ellipse cx={-6} cy={-534} rx={9} ry={7} fill="#fff" />
              <ellipse cx={40} cy={-534} rx={9} ry={7} fill="#fff" />
            </g>
            <text x={x + 140} y={676} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={64} fill={RED}>
              {i + 1}
            </text>
            <text x={x + 140} y={734} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={lb.length > 8 ? 30 : 34} fill={LINE}>
              {lb}
            </text>
          </g>
        );
      })}
      {/* kanepe */}
      <path d="M150,1040 Q150,1000 200,1000 L880,1000 Q930,1000 930,1040 L930,1250 L150,1250 Z" fill="#7fa6c9" {...st} />
      <Person x={480} foot={1250} s={1.0} sit>
        <SketchPerson t={t} seed={1.3} look={HERO} pose={{ sit: true, r: { a: 30, e: -110 }, l: { a: 30, e: -90 }, itemR: "phone", turn: 0.3 }} expr={t > W(6, 4) ? "grin" : "think"} />
      </Person>
      <path d="M120,1250 L960,1250 L960,1330 L120,1330 Z" fill="#6f95ba" {...st} />
      <path d="M80,1100 Q80,1060 130,1060 L170,1060 Q210,1060 210,1100 L210,1330 L80,1330 Z" fill="#7fa6c9" {...st} />
      <path d="M870,1100 Q870,1060 910,1060 L950,1060 Q1000,1060 1000,1100 L1000,1330 L870,1330 Z" fill="#7fa6c9" {...st} />
      <Plant x={1000} y={1560} s={0.8} />
      {/* yorum balonu */}
      {n > 0 && t < T - 0.4 ? (
        <g opacity={1 - sm(t, T - 1.0, T - 0.5)}>
          <rect x={580} y={790} width={470} height={100} rx={24} fill="#fff" {...st} />
          <path d="M610,880 L560,930 L660,880 Z" fill="#fff" {...st} />
          <rect x={600} y={872} width={80} height={14} fill="#fff" />
          <text x={604} y={854} fontFamily={SANS} fontWeight={800} fontSize={36} fill={LINE}>
            {typed.slice(0, n)}
          </text>
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------ hırsızlığa giden boncuklar (dünya koordinatı)

const StolenBeads: React.FC<Ctx> = ({ t, W }) => {
  const a = W(1, 4);
  const b = a + 1.8;
  if (t < a || t > b + 0.4) return null;
  const from: [number, number] = [ROOMS.spor.x + 185, ROOMS.spor.y + 1000];
  const to: [number, number][] = [
    [ROOMS.spor.x + 110, ROOMS.spor.y + 1100],
    [ROOMS.mutfak.x + 1040, ROOMS.mutfak.y + 1250],
    [ROOMS.yatak.x + 740, ROOMS.yatak.y + 900],
  ];
  const out: React.ReactNode[] = [];
  to.forEach(([x, y], j) => {
    for (let i = 0; i < 5; i++) {
      const s0 = a + j * 0.25 + i * 0.22;
      const u = (t - s0) / 0.9;
      if (u < 0 || u > 1) continue;
      const lift = j === 0 ? 120 : 420;
      out.push(
        <circle
          key={`${j}-${i}`}
          cx={mix(from[0], x, u)}
          cy={mix(from[1], y, u) - Math.sin(u * Math.PI) * lift}
          r={22}
          fill={GOLD}
          stroke={LINE}
          strokeWidth={3}
          opacity={Math.min(1, u * 6) * Math.min(1, (1 - u) * 6)}
        />,
      );
    }
  });
  return <g>{out}</g>;
};

// ------------------------------------------------------------ kompozisyon

export const UcHirsiz: React.FC<EkmekBirakProps & { music?: boolean }> = ({ audioName, data, music = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const base: TL = data ? voiceTimeline(data, UH_LINES) : UH_TL;
  const T = data ? data.durationInSeconds + UH_TAIL : UH_TL.total;
  const tl: TL = { ...base, total: T };
  const L = tl.at;
  const W = (line: number, k: number) => wordTime(tl, line, k, UH_LINES);
  const ctx: Ctx = { t, L, W, T };

  const [sx, sy] = center(ROOMS.spor);
  const [mx, my] = center(ROOMS.mutfak);
  const [yx, yy] = center(ROOMS.yatak);
  const [ax, ay] = center(ROOMS.salon);
  const ov: [number, number, number] = [WW / 2, WH / 2 + 10, 0.415];
  const hook: [number, number, number] = [sx, sy, 1.06];
  const across = (at: number, a: [number, number], b: [number, number]): CamKey[] => [
    [at, a[0], a[1], 1.0],
    [at + 0.4, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[1] === b[1] ? 0.6 : 0.48],
    [at + 0.9, b[0], b[1], 1.0],
  ];
  const keys: CamKey[] = [
    [-1, ...hook],
    [W(0, 6) - 0.1, sx, sy + 20, 1.12], // salonda yavaş yaklaşma
    [W(0, 9) + 0.25, ...ov], // "evinde": kamera geri çekilir, bütün ev
    [L(2) - 0.15, ...ov],
    [L(2) + 0.6, sx, sy, 1.0],
    [W(2, 4), sx - 60, sy + 40, 1.1],
    ...across(L(3) - 0.15, [sx, sy], [mx, my]),
    [W(3, 4), ROOMS.mutfak.x + 760, ROOMS.mutfak.y + 820, 1.3], // kas kartı
    [W(3, 10), mx, my + 20, 1.02],
    ...across(L(4) - 0.15, [mx, my], [yx, yy]),
    [W(4, 8), ROOMS.yatak.x + 420, ROOMS.yatak.y + 900, 1.25], // telefon + çubuk
    [W(4, 12), yx, yy, 1.02],
    ...across(L(5) - 0.15, [yx, yy], [sx, sy]),
    ...across(W(5, 11) - 0.2, [sx, sy], [mx, my]),
    ...across(W(5, 14) - 0.2, [mx, my], [yx, yy]),
    ...across(L(6) - 0.15, [yx, yy], [ax, ay]),
    [W(6, 5) + 0.4, ax, ay, 1.04],
    [W(6, 5) + 1.3, ...ov],
    [T - 0.95, ...ov],
    [T, ...hook],
  ];
  const [, cx, cy, z] = camAt(t, keys);
  const loopIn = sm(t, T - 0.35, T - 0.03);

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.24, lead: 0.05 },
    { at: W(1, 4), id: 1120, v: 0.18, lead: 0.1 },
    { at: W(2, 7), id: 2568, v: 0.14 },
    { at: W(3, 12), id: 1120, v: 0.14, lead: 0.1 },
    { at: W(4, 12), id: 1120, v: 0.14, lead: 0.1 },
    { at: fix1(ctx), id: 2568, v: 0.14 },
    { at: fix2(ctx), id: 2568, v: 0.14 },
    { at: fix3(ctx), id: 2568, v: 0.14 },
    { at: W(6, 5) + 0.4, id: 1143, v: 0.16, lead: 0.14, dur: 1.6, fade: 0.8 },
  ];

  const room = (r: { x: number; y: number }, id: string, el: React.ReactNode) => (
    <g transform={`translate(${r.x},${r.y})`}>
      <clipPath id={`uh-${id}`}>
        <rect width={RW} height={RH} />
      </clipPath>
      <g clipPath={`url(#uh-${id})`}>{el}</g>
      <rect width={RW} height={RH} fill="none" stroke={LINE} strokeWidth={6} />
    </g>
  );

  return (
    <AbsoluteFill lang="tr" style={{ background: "#f6e3cf", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <SketchDefs />
        <g transform={`translate(540,960) scale(${z}) translate(${-cx},${-cy})`}>
          <g filter="url(#pencil)">
            <Outside t={t} />
            {room(ROOMS.spor, "s", <Spor {...ctx} />)}
            {room(ROOMS.mutfak, "m", <Mutfak {...ctx} />)}
            {room(ROOMS.yatak, "y", <Yatak {...ctx} />)}
            {room(ROOMS.salon, "a", <Salon {...ctx} />)}
            <StolenBeads {...ctx} />
          </g>
        </g>

        {/* ekran kartları */}
        <Card x={540} y={300} w={860} h={250} o={Math.max(win(t, -1, W(0, 6), 0.25), loopIn)}>
          <Txt x={0} y={-22} size={76}>
            HER GÜN SPOR…
          </Txt>
          <Txt x={0} y={72} size={80} fill={RED}>
            HİÇ DEĞİŞİM YOK?
          </Txt>
        </Card>
        <Card x={540} y={250} w={760} h={170} o={win(t, W(0, 9) - 0.15, L(1) + 0.25, 0.25)} tilt={-1}>
          <Txt x={0} y={24} size={70}>
            SORUN <tspan fill={RED}>EVİNDE</tspan>
          </Txt>
        </Card>
        <Card x={540} y={250} w={760} h={170} o={win(t, L(1) + 0.4, L(2) + 0.1, 0.25)} tilt={1}>
          <Txt x={0} y={24} size={70}>
            <tspan fill={RED}>3</tspan> GİZLİ HIRSIZ
          </Txt>
        </Card>
        {[
          { i: 2, n: 1, lb: "AYNI YÜK" },
          { i: 3, n: 2, lb: "BOŞ TABAK" },
          { i: 4, n: 3, lb: "GECE 03:00" },
        ].map(({ i, n, lb }) => (
          <Card key={i} x={540} y={250} w={700} h={150} o={win(t, L(i) + 0.5, L(i + 1) - 0.15, 0.25)} tilt={n % 2 ? -1.2 : 1}>
            <Txt x={0} y={20} size={56}>
              <tspan fill={RED}>{n}. HIRSIZ: </tspan>
              {lb}
            </Txt>
          </Card>
        ))}
        <Card x={540} y={250} w={520} h={150} o={win(t, L(5) + 0.4, L(6) - 0.15, 0.25)} tilt={1}>
          <Txt x={0} y={22} size={64} fill={GREEN}>
            ÇÖZÜM
          </Txt>
        </Card>
        <Card x={540} y={290} w={900} h={220} o={win(t, L(6) + 0.3, T - 0.6, 0.3)}>
          <Txt x={0} y={-14} size={60}>
            SENDE HANGİ HIRSIZ VAR?
          </Txt>
          <Txt x={0} y={66} size={60} fill={RED}>
            YORUMLARA YAZ ✎
          </Txt>
        </Card>
      </svg>

      <Captions t={t} tl={tl} lines={UH_LINES} end={T - UH_TAIL + 0.6} />
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
