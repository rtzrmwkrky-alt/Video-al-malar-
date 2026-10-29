/**
 * "Pilates bir esir kampında doğdu" (~35 sn). SadikMusteri / TupMideSarkma tarzı: kalem çizimi, siyah saçlı genç,
 * canlı anlatıcı (Manitam), sahneler satır başında kesilir. Geçmiş sahneleri sepya.
 * Akış: genç reformerda çalışır → "esir kampında doğdu" (dikenli tel) → 1883 hasta, cılız çocuk → jimnastik/boks/dambıl
 * → 1914 kamp → hasta yatağına yay bağlar → yataklı yay ↔ bugünkü reformer "ATASI BU" → 1926 New York, stüdyo dansçılarla
 * dolar → bugün: bel ağrısı azalır, gövde güçlenir (Cochrane 2015) → tek başına yağ yakmaz: + yürüyüş + ağırlık →
 * Joseph'in sözü 10/20/30 seans → "Bunu Pilates'e başlayacak birine gönder" kâğıt uçak → başa döner (döngü).
 * Metin `icerik/pilates-dogus.seslendirme.txt`.
 */
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { HAND, SANS, loadFonts } from "../fonts";
import { type Line, sm, timeline } from "../ornek/common";
import { LINE, type SketchLook, type SketchPose, SketchDefs, SKETCH_CAST } from "../sketch/SketchPerson";
import { Captions, type EkmekBirakProps, PAPER, RED, type TL, mix, st, voiceTimeline, wordTime } from "./EkmekBirak";
import { Hero, INK, Note, Specks, Tag, handAt } from "./SadikMusteri";
import { Cam, CheckCard, PowerBar, Ring, Stamp } from "./TupMideSarkma";

loadFonts();

export const PD_LINES: Line[] = [
  { text: "Bugün milyonların yaptığı Pilates… bir esir kampında doğdu!", hl: ["milyonların", "Pilates…", "esir", "kampında"], hold: 0.3 },
  { text: "Joseph Pilates, 1883'te Almanya'da hasta, cılız bir çocuktu.", hl: ["Joseph", "1883'te", "hasta,", "cılız"], hold: 0.1 },
  { text: "Ama pes etmedi; jimnastik, boks… her şeyi denedi.", hl: ["pes", "jimnastik,", "boks…", "denedi."], hold: 0.2 },
  { text: "1914'te savaş çıktı, İngiltere'de bir kampa kapatıldı.", hl: ["1914'te", "savaş", "kampa", "kapatıldı."], hold: 0.2 },
  { text: "Yataktan kalkamayanlar için… yataklara yay bağladı.", hl: ["kalkamayanlar", "yay", "bağladı."], hold: 0.4 },
  { text: "Bugünkü pilates aletlerinin atası işte bu!", hl: ["aletlerinin", "atası"], hold: 0.3 },
  { text: "1926'da New York'a geçti; stüdyosu dansçılarla doldu.", hl: ["1926'da", "New", "York'a", "dansçılarla"], hold: 0.2 },
  { text: "Peki işe yarıyor mu? Araştırmalar bel ağrısını azalttığını,", hl: ["işe", "yarıyor", "bel", "azalttığını,"], hold: 0 },
  { text: "gövdeyi güçlendirdiğini gösteriyor.", hl: ["gövdeyi", "güçlendirdiğini"], hold: 0.2 },
  { text: "Ama tek başına yağ yakmaz; yanına yürüyüş ve ağırlık ekle.", hl: ["tek", "yağ", "yakmaz;", "yürüyüş", "ağırlık"], hold: 0.2 },
  { text: "Joseph ne diyordu? On seansta hissedersin, yirmide görürsün,", hl: ["On", "hissedersin,", "yirmide", "görürsün,"], hold: 0 },
  { text: "otuzda yepyeni bir bedenin olur.", hl: ["otuzda", "yepyeni", "bedenin"], hold: 0.3 },
  { text: "Bunu Pilates'e başlayacak birine gönder!", hl: ["başlayacak", "birine", "gönder!"], hold: 0.1 },
];

export const PD_TAIL = 1.15;
export const PD_TL = timeline(PD_LINES, PD_TAIL);

const HERO = SKETCH_CAST.siyah.look;
export const JOSEPH: SketchLook = { skin: "#f6e6d6", hair: "#9a7b55", hairStyle: "side", top: "#e9e2d0", bottom: "#4a4a52", shoe: "#3b3530" };
const JOSEPH_KID: SketchLook = { ...JOSEPH, top: "#c9b99a", bottom: "#6b5a48" };
const JOSEPH_OLD: SketchLook = { ...JOSEPH, hair: "#ebe7e0", top: "#f4f1ea", bottom: "#2f3b5a" };
const PATIENT: SketchLook = { ...SKETCH_CAST.sari.look, top: "#dcd7cc", bottom: "#8d8e92" };
const DANCER: SketchLook = { ...SKETCH_CAST.kiz.look, top: "#f2b6c8", bottom: "#3b3557" };
const DANCER2: SketchLook = { ...SKETCH_CAST.kiz.look, hair: "#1e1a1c", top: "#9fd3e8", bottom: "#3b3557" };
const WOOD = "#a77b4f";

type S = { t: number; u: number; W: (k: number) => number; d: number };

/** Hero yerel kutusundaki noktayı sahneye çevirir */
export const toScene = (x: number, foot: number, s: number, p: [number, number]): [number, number] => [x + (p[0] - 200) * s, foot + (p[1] - 800) * s];

// ------------------------------------------------------------ parçalar

/** iki nokta arasında zikzak yay */
export const Spring: React.FC<{ a: [number, number]; b: [number, number]; n?: number; amp?: number; w?: number; color?: string }> = ({ a, b, n = 12, amp = 12, w = 4, color = "#8d8e92" }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts: string[] = [`M${a[0]},${a[1]}`];
  for (let i = 1; i < n * 2; i++) {
    const k = i / (n * 2);
    const sgn = i % 2 ? 1 : -1;
    pts.push(`L${(a[0] + dx * k + nx * amp * sgn).toFixed(1)},${(a[1] + dy * k + ny * amp * sgn).toFixed(1)}`);
  }
  pts.push(`L${b[0]},${b[1]}`);
  const d = pts.join(" ");
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={LINE} strokeWidth={w + 3} />
      <path d={d} stroke={color} strokeWidth={w} />
    </g>
  );
};

/** reformer: çerçeve, kayan araba (car = kayma), üstünde kutu, ayak barı, sol uçta makara direği */
export const Reformer: React.FC<{ x: number; y: number; s?: number; car: number; box?: boolean }> = ({ x, y, s = 1, car, box = true }) => {
  const cx = 360 + car;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* ayaklar */}
      {[-380, 380].map((d) => (
        <rect key={d} x={d - 14} y={40} width={28} height={70} fill="#6b4a32" {...st} />
      ))}
      {/* çerçeve */}
      <rect x={-420} y={0} width={840} height={46} rx={10} fill={WOOD} {...st} strokeWidth={4} />
      <path d="M-400,23 L400,23" stroke="#5a3a26" strokeWidth={3} opacity={0.5} />
      {/* yaylar: sol uç → araba */}
      {[-6, 8].map((o, i) => (
        <Spring key={i} a={[-400, 10 + o]} b={[cx - 520, 10 + o]} n={9} amp={7} w={3} color={i ? "#c9a24a" : "#d9574e"} />
      ))}
      {/* araba */}
      <rect x={cx - 520} y={-34} width={300} height={40} rx={10} fill="#3d6fc4" {...st} strokeWidth={4} />
      {box ? <rect x={cx - 500} y={-150} width={260} height={116} rx={10} fill="#e9dcc0" {...st} strokeWidth={4} /> : null}
      {/* ayak barı */}
      <path d="M380,0 L380,-150 Q380,-170 360,-170 L330,-170" fill="none" stroke={LINE} strokeWidth={14} strokeLinecap="round" />
      <path d="M380,0 L380,-150 Q380,-170 360,-170 L330,-170" fill="none" stroke="#b9b3a8" strokeWidth={8} strokeLinecap="round" />
      {/* makara direği */}
      <rect x={-418} y={-300} width={22} height={300} rx={6} fill="#6b4a32" {...st} />
      <circle cx={-407} cy={-300} r={18} fill="#b9b3a8" {...st} />
    </g>
  );
};

export const StudioBg: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill="#f1e2c8" />
    {/* ayna */}
    <rect x={120} y={360} width={840} height={620} rx={12} fill="#dcecf1" {...st} strokeWidth={5} />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M${220 + i * 300},400 l-80,200 M${260 + i * 300},400 l-50,120`} stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.75} />
    ))}
    {/* bitki */}
    <g transform="translate(980,1180)">
      <path d="M-40,0 L40,0 L30,90 L-30,90 Z" fill="#c98a4a" {...st} />
      {[-50, -20, 10, 40].map((a, i) => (
        <path key={i} d={`M0,0 Q${a},-80 ${a * 1.6},-150 Q${a * 0.6},-70 0,0`} fill="#6aa35a" {...st} strokeWidth={3} />
      ))}
    </g>
    <rect x={0} y={1380} width={1080} height={540} fill="#c9a77e" />
    {Array.from({ length: 9 }).map((_, i) => (
      <path key={i} d={`M${i * 140 - 40},1380 L${i * 140 - 160},1920`} stroke="#a7845d" strokeWidth={3} />
    ))}
    <path d="M0,1380 L1080,1380" stroke={LINE} strokeWidth={4} />
  </g>
);

/** reformerda kürek çeken genç (kayan araba + kollar + kayışlar) */
export const RowingHero: React.FC<{ t: number; expr?: "grin" | "smile" | "surprise" | "think" | "worry"; item?: SketchPose["itemR"]; pull?: number; look?: SketchLook; seed?: number }> = ({ t, expr = "grin", item, pull, look = HERO, seed }) => {
  const k = pull ?? 0.5 - 0.5 * Math.cos(t * 2.4);
  const car = mix(0, -110, k);
  const s = 0.95;
  const hx = 560 + car;
  const foot = 1150 + 320 * s;
  const pose: SketchPose = {
    sit: true,
    legSide: 1,
    turn: 0.55,
    itemR: item,
    l: { a: mix(60, 20, k), e: mix(40, 100, k) },
    r: item ? { a: 40, e: 110 } : { a: mix(60, 20, k), e: mix(40, 100, k) },
  };
  const lh = toScene(hx, foot, s, handAt(pose.l!, -1));
  const rh = toScene(hx, foot, s, handAt(pose.r!, 1));
  const post: [number, number] = [540 - 407, 1300 - 300];
  return (
    <g>
      <Reformer x={540} y={1300} car={car} />
      <path d={`M${post[0]},${post[1]} L${lh[0]},${lh[1]}`} stroke={LINE} strokeWidth={4} />
      {!item ? <path d={`M${post[0]},${post[1] + 6} L${rh[0]},${rh[1]}`} stroke={LINE} strokeWidth={4} /> : null}
      <Hero x={hx} foot={foot} s={s} t={t} look={look} seed={seed} pose={pose} expr={expr} />
    </g>
  );
};

/** dikenli tel çit */
const Fence: React.FC<{ y: number; o?: number }> = ({ y, o = 1 }) => (
  <g opacity={o}>
    {[60, 330, 600, 870].map((x) => (
      <rect key={x} x={x - 12} y={y - 340} width={24} height={360} fill="#7a5638" {...st} />
    ))}
    {[0, 1, 2, 3].map((r) => {
      const yy = y - 300 + r * 90;
      return (
        <g key={r}>
          <path d={`M0,${yy} Q270,${yy + 18} 540,${yy} T1080,${yy}`} fill="none" stroke={LINE} strokeWidth={4} />
          {Array.from({ length: 12 }).map((_, i) => {
            const x = 40 + i * 90 + (r % 2) * 40;
            const y2 = yy + 6 * Math.sin((x / 1080) * Math.PI * 2);
            return <path key={i} d={`M${x - 12},${y2 - 12} L${x + 12},${y2 + 12} M${x + 12},${y2 - 12} L${x - 12},${y2 + 12}`} stroke={LINE} strokeWidth={3.4} strokeLinecap="round" />;
          })}
        </g>
      );
    })}
  </g>
);

const CampBg: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect width={1080} height={1920} fill="#c9c4b8" />
    {[0, 1, 2].map((i) => (
      <ellipse key={i} cx={((i * 430 + t * 10) % 1400) - 150} cy={260 + i * 110} rx={190} ry={46} fill="#e3e0d8" opacity={0.8} />
    ))}
    {/* baraka */}
    <g transform="translate(540,1060)">
      <path d="M-460,-160 L0,-300 L460,-160 Z" fill="#6b5a48" {...st} strokeWidth={4} />
      <rect x={-430} y={-160} width={860} height={300} fill="#a68a66" {...st} strokeWidth={4} />
      {Array.from({ length: 10 }).map((_, i) => (
        <path key={i} d={`M${-430 + i * 86},-160 L${-430 + i * 86},140`} stroke="#7d6447" strokeWidth={3} />
      ))}
      {[-300, -60, 180].map((x) => (
        <rect key={x} x={x} y={-90} width={110} height={90} fill="#3f4651" {...st} />
      ))}
    </g>
    <rect x={0} y={1200} width={1080} height={720} fill="#9b9483" />
    <Specks y0={1220} y1={1900} c="#6f6a5e" n={40} />
    <path d="M0,1200 L1080,1200" stroke={LINE} strokeWidth={4} />
  </g>
);

export const OldRoomBg: React.FC<{ fill?: string }> = ({ fill = "#e3d3b4" }) => (
  <g>
    <rect width={1080} height={1920} fill={fill} />
    {Array.from({ length: 11 }).map((_, i) => (
      <path key={i} d={`M${i * 110},0 L${i * 110},1330`} stroke="#d2bf9c" strokeWidth={6} />
    ))}
    <rect x={0} y={1330} width={1080} height={590} fill="#9a7552" />
    {Array.from({ length: 6 }).map((_, i) => (
      <path key={i} d={`M0,${1400 + i * 90} L1080,${1400 + i * 90}`} stroke="#7d5c3f" strokeWidth={3} />
    ))}
    <path d="M0,1330 L1080,1330" stroke={LINE} strokeWidth={4} />
  </g>
);

/** demir hasta yatağı + üst bar; hasta yatarak üst bardan sarkan yayı çeker */
export const SpringBed: React.FC<{ t: number; x: number; y: number; s?: number; spring: number; pull: number; seed?: number }> = ({ t, x, y, s = 1, spring, pull, seed = 0 }) => {
  const barY = -520;
  const handY = mix(-250, -310, pull);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* üst bar ve direkler */}
      <path d={`M-380,40 L-380,${barY} L380,${barY} L380,40`} fill="none" stroke={LINE} strokeWidth={16} strokeLinejoin="round" />
      <path d={`M-380,40 L-380,${barY} L380,${barY} L380,40`} fill="none" stroke="#c9c4b8" strokeWidth={9} strokeLinejoin="round" />
      {/* yatak */}
      <rect x={-380} y={-60} width={760} height={70} rx={10} fill="#efe9dc" {...st} strokeWidth={4} />
      <path d="M-380,10 L380,10" stroke={LINE} strokeWidth={10} />
      <path d="M-380,10 L380,10" stroke="#c9c4b8" strokeWidth={5} />
      {/* hasta: yastıkta yatar (figür -90° döner: baş solda) */}
      <ellipse cx={-280} cy={-70} rx={80} ry={30} fill="#fbfbf7" {...st} />
      <g transform="translate(-300,-120) rotate(-90) scale(0.62) translate(-200,-150)">
        <g transform={`translate(0,0)`}>
          <SketchPersonLying t={t} pull={pull} seed={seed} />
        </g>
      </g>
      {/* battaniye */}
      <path d="M-210,-150 Q0,-185 330,-130 L350,-50 L-220,-50 Z" fill="#8a9a7a" {...st} strokeWidth={4} />
      <path d="M-150,-150 l30,90 M-40,-160 l20,100 M80,-160 l10,100 M200,-150 l0,100" stroke="#6d7c5f" strokeWidth={3} />
      {/* yay: üst bar → el */}
      {spring > 0 ? (
        <g opacity={spring}>
          <Spring a={[-205, barY]} b={[-205, mix(barY + 40, handY - 14, spring)]} n={10} amp={12} w={4} color="#b9b3a8" />
          <rect x={-232} y={handY - 22} width={54} height={14} rx={6} fill="#6b4a32" {...st} />
        </g>
      ) : null}
    </g>
  );
};

/** yatan hasta: sadece kafa + omuz + yukarı uzanan kol (dönmüş koordinatta) */
const SketchPersonLying: React.FC<{ t: number; pull: number; seed: number }> = ({ t, pull, seed }) => (
  <Hero
    x={200}
    foot={800}
    s={1}
    t={t}
    look={PATIENT}
    seed={seed}
    pose={{ turn: 0, l: { a: 10, e: 4 }, r: { a: mix(84, 94, pull), e: mix(14, 2, pull) } }}
    expr={pull > 0.4 ? "grin" : "flat"}
  />
);

/** el yazısı yıl rozeti (Tag gibi, büyük) */
export const Year: React.FC<{ x: number; y: number; text: string; o: number }> = ({ x, y, text, o }) => <Tag x={x} y={y} text={text} o={o} size={64} />;

export const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; o: number }> = ({ x1, y1, x2, y2, o }) => {
  if (o <= 0) return null;
  const ex = mix(x1, x2, o);
  const ey = mix(y1, y2, o);
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (d: number) => `${ex - 34 * Math.cos(a + d)},${ey - 34 * Math.sin(a + d)}`;
  return (
    <g fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${x1},${y1} Q${(x1 + ex) / 2 + 40},${(y1 + ey) / 2} ${ex},${ey}`} />
      <path d={`M${h(0.5)} L${ex},${ey} L${h(-0.5)}`} />
    </g>
  );
};

const Skyline: React.FC = () => (
  <g>
    {[
      [0, 520, 140],
      [130, 380, 120],
      [240, 300, 90],
      [320, 450, 150],
      [460, 220, 80],
      [530, 360, 130],
      [650, 480, 110],
      [750, 270, 140],
      [880, 410, 100],
      [970, 330, 120],
    ].map(([x, h, w], i) => (
      <g key={i}>
        <rect x={x} y={1000 - h} width={w} height={h} fill={i % 2 ? "#8f98a3" : "#a8b0b8"} {...st} />
        {Array.from({ length: Math.floor(h / 60) }).map((_, r) => (
          <path key={r} d={`M${x + 18},${1000 - h + 30 + r * 60} l${w - 36},0`} stroke="#e9e4c8" strokeWidth={8} strokeDasharray="12 14" />
        ))}
      </g>
    ))}
    {/* Empire State benzeri kule */}
    <path d="M470,780 L470,560 L490,560 L490,500 L505,500 L505,440 L515,440 L515,500 L530,500 L530,560 L550,560 L550,780 Z" fill="#7d8792" {...st} />
  </g>
);

/** Joseph'in çerçeveli portresi */
const Portrait: React.FC<{ t: number; x: number; y: number; o: number }> = ({ t, x, y, o }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x},${y + (1 - o) * 16}) rotate(-2)`}>
      <rect x={-200 + 8} y={-250 + 10} width={400} height={500} rx={8} fill="#5a3a26" opacity={0.18} />
      <rect x={-200} y={-250} width={400} height={500} rx={8} fill="#8a6440" {...st} strokeWidth={5} />
      <rect x={-170} y={-220} width={340} height={440} fill="#e9dcc0" {...st} />
      <clipPath id="pd-portrait">
        <rect x={-170} y={-220} width={340} height={440} />
      </clipPath>
      <g clipPath="url(#pd-portrait)" filter="url(#sepia)">
        <Hero x={0} foot={470} s={0.9} t={t} look={JOSEPH_OLD} pose={{ turn: 0.15, l: { a: 30, e: 80 }, r: { a: 30, e: 80 } }} expr="smile" seed={6} />
      </g>
      <text x={0} y={300} textAnchor="middle" fontFamily={HAND} fontSize={48} fill={LINE}>
        Joseph Pilates
      </text>
    </g>
  );

/** 10/20/30 seans kartı */
const SessionCard: React.FC<{ x: number; y: number; n: number; text: string; o: number; on?: number }> = ({ x, y, n, text, o, on = 0 }) =>
  o <= 0 ? null : (
    <g opacity={o} transform={`translate(${x + (1 - o) * 30},${y})`}>
      <rect x={-210 + 6} y={-70 + 8} width={420} height={140} rx={16} fill="#5a3a26" opacity={0.15} />
      <rect x={-210} y={-70} width={420} height={140} rx={16} fill={PAPER} {...st} strokeWidth={4} />
      {on > 0 ? <rect x={-210} y={-70} width={420} height={140} rx={16} fill="none" stroke={INK} strokeWidth={8} opacity={on} /> : null}
      <circle cx={-140} cy={0} r={50} fill={INK} {...st} />
      <text x={-140} y={18} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={50} fill="#fff">
        {n}
      </text>
      <text x={50} y={16} textAnchor="middle" fontFamily={HAND} fontSize={50} fill={LINE}>
        {text}
      </text>
    </g>
  );

// ------------------------------------------------------------ sahneler

/** 0: genç reformerda → "esir kampında" dikenli tele geçer */
const Hook: React.FC<S> = ({ t, W }) => {
  const camp = sm(t, W(5) - 0.25, W(5) + 0.15);
  const zoom = mix(1.12, 1, sm(t, 0, 1.4));
  return (
    <g>
      <Cam cx={540} cy={1150} k={zoom}>
        <StudioBg />
        <RowingHero t={t} expr={camp > 0.3 ? "surprise" : "grin"} />
      </Cam>
      <Note x={760} y={250} text="milyonlar yapıyor" o={sm(t, W(1) - 0.15, W(1) + 0.2) * (1 - camp)} tilt={2} />
      {camp > 0 ? (
        <g opacity={camp}>
          <g filter="url(#sepia)">
            <CampBg t={t} />
            <Fence y={1360} />
          </g>
          <Note x={540} y={300} text="esir kampı?" o={sm(t, W(6) - 0.1, W(6) + 0.2)} color={RED} tilt={-3} />
        </g>
      ) : null}
    </g>
  );
};

/** 1: 1883 — hasta, cılız çocuk */
const Kid: React.FC<S> = ({ t, u, W }) => {
  const cough = Math.max(0, Math.sin(t * 5)) * sm(t, W(5) - 0.1, W(5) + 0.1);
  return (
    <g filter="url(#sepia)">
      <OldRoomBg />
      <g transform="translate(250,400)">
        <rect x={-140} y={-130} width={280} height={260} fill="#bcd0d8" {...st} strokeWidth={5} />
        <path d="M0,-130 L0,130 M-140,0 L140,0" stroke={LINE} strokeWidth={6} />
      </g>
      <Year x={760} y={300} text="1883 · Almanya" o={sm(t, W(2) - 0.15, W(2) + 0.2)} />
      <Cam cx={540} cy={1250} k={1 + 0.25 * sm(u, 0, 2.2)}>
        <Hero x={540} foot={1560} s={0.62} t={t} look={JOSEPH_KID} pose={{ turn: 0.1, belly: 0, l: { a: 8, e: 4 }, r: { a: mix(8, 40, cough), e: mix(4, 120, cough) } }} expr={cough > 0.2 ? "worry" : "flat"} />
      </Cam>
      <Note x={250} y={820} text="hasta" o={sm(t, W(5) - 0.1, W(5) + 0.2)} color={RED} tilt={-4} />
      <Note x={830} y={900} text="cılız" o={sm(t, W(6) - 0.1, W(6) + 0.2)} color={RED} tilt={3} />
    </g>
  );
};

/** 2: pes etmedi — jimnastik, boks, dambıl */
const Training: React.FC<S> = ({ t, W }) => {
  const ph = t < W(4) - 0.15 ? 0 : t < W(5) - 0.1 ? 1 : 2;
  const v = t - (ph === 0 ? W(3) : ph === 1 ? W(4) : W(5));
  const jab = Math.max(0, Math.sin(v * 9));
  const curl = 0.5 - 0.5 * Math.cos(Math.max(0, v) * 4.5);
  const pose: SketchPose =
    t < W(3) - 0.15
      ? { turn: 0.2, l: { a: 10, e: 6 }, r: { a: 10, e: 6 } }
      : ph === 0
        ? { turn: 0, l: { a: 155, e: 0 }, r: { a: 155, e: 0 } }
        : ph === 1
          ? { turn: 0.6, l: { a: 30, e: 125 }, r: { a: mix(30, 80, jab), e: mix(125, 20, jab) } }
          : { turn: 0.2, itemR: "dumbbell", l: { a: 10, e: 6 }, r: { a: 8, e: mix(10, 140, curl) } };
  const s = 1.0;
  const x = 540;
  const foot = 1560;
  const gloves = ph === 1 && t > W(3) ? [toScene(x, foot, s, handAt(pose.l!, -1)), toScene(x, foot, s, handAt(pose.r!, 1))] : [];
  return (
    <g filter="url(#sepia)">
      <OldRoomBg fill="#e6d7b8" />
      {/* jimnastik halkaları */}
      <g opacity={ph === 0 && t > W(3) - 0.15 ? 1 : 0.35}>
        <path d="M380,0 L380,430 M700,0 L700,430" stroke={LINE} strokeWidth={4} />
        <circle cx={380} cy={470} r={40} fill="none" stroke="#8a6440" strokeWidth={10} />
        <circle cx={700} cy={470} r={40} fill="none" stroke="#8a6440" strokeWidth={10} />
      </g>
      <Hero x={x} foot={foot} s={s} t={t} look={JOSEPH} pose={pose} expr={t > W(1) - 0.1 ? "grin" : "flat"} />
      {gloves.map(([gx, gy], i) => (
        <g key={i}>
          <circle cx={gx} cy={gy} r={30} fill="#b8322a" {...st} strokeWidth={3.6} />
          <path d={`M${gx - 14},${gy + 10} q14,8 28,0`} fill="none" stroke="#7d1f1a" strokeWidth={3} />
        </g>
      ))}
      <Note x={220} y={760} text="jimnastik" o={sm(t, W(3) - 0.1, W(3) + 0.2)} tilt={-4} />
      <Note x={860} y={760} text="boks" o={sm(t, W(4) - 0.1, W(4) + 0.2)} tilt={3} />
      <Note x={540} y={290} text="pes etmedi" o={sm(t, W(1) - 0.1, W(1) + 0.2)} tilt={-2} />
    </g>
  );
};

/** 3: 1914 — İngiltere'de kamp */
const Camp: React.FC<S> = ({ t, u, W }) => (
  <g filter="url(#sepia)">
    <Cam cx={540} cy={1150} k={1 + 0.18 * sm(u, 0, 2.6)}>
      <CampBg t={t} />
      <Hero x={540} foot={1500} s={0.95} t={t} look={JOSEPH} pose={{ turn: 0, l: { a: 8, e: 4 }, r: { a: 8, e: 4 } }} expr={t > W(5) - 0.2 ? "worry" : "flat"} />
      <Fence y={1560} o={sm(t, W(5) - 0.3, W(6))} />
    </Cam>
    <Year x={210} y={290} text="1914" o={sm(u, 0, 0.25)} />
    <Note x={760} y={420} text="İngiltere" o={sm(t, W(3) - 0.15, W(3) + 0.2)} tilt={3} />
  </g>
);

/** 4: hasta yatağına yay bağlar */
const Beds: React.FC<S> = ({ t, W }) => {
  const spring = sm(t, W(3) - 0.2, W(4) + 0.2);
  const pull = spring >= 1 ? 0.5 - 0.5 * Math.cos((t - W(4) - 0.2) * 3) : 0;
  const jx = 760;
  const reach = sm(t, W(3) - 0.4, W(3)) * (1 - sm(t, W(4) + 0.2, W(5)));
  return (
    <g filter="url(#sepia)">
      <OldRoomBg fill="#ddd2bc" />
      <Cam cx={500} cy={1100} k={1 + 0.15 * sm(t, W(3), W(5) + 0.4)}>
        <SpringBed t={t} x={470} y={1320} s={1} spring={spring} pull={pull} seed={3} />
        <Hero x={jx} foot={1560} s={0.95} t={t} look={JOSEPH} flip pose={{ turn: 0.4, l: { a: 10, e: 6 }, r: { a: mix(12, 150, reach), e: mix(6, 10, reach) } }} expr="smile" />
      </Cam>
      <Note x={540} y={290} text="yatağa yay" o={sm(t, W(4) - 0.1, W(4) + 0.2)} tilt={-2} />
    </g>
  );
};

/** 5: yataklı yay → bugünkü reformer, "ATASI BU" */
const Ancestor: React.FC<S> = ({ t, u, W }) => {
  const now = sm(u, 0.3, 0.8);
  const car = mix(0, -90, 0.5 - 0.5 * Math.cos(t * 2.4));
  return (
    <g>
      <rect width={1080} height={1920} fill="#ece0c6" />
      <g filter="url(#sepia)">
        <g transform="translate(540,620) scale(0.62) translate(-470,-1320)">
          <SpringBed t={t} x={470} y={1320} spring={1} pull={0.5 - 0.5 * Math.cos(t * 3)} seed={3} />
        </g>
      </g>
      <Tag x={190} y={320} text="1918" o={sm(u, 0, 0.25)} />
      <Arrow x1={540} y1={720} x2={540} y2={990} o={now} />
      <g opacity={now}>
        <Reformer x={540} y={1300} s={0.85} car={car} box={false} />
      </g>
      <Tag x={190} y={1130} text="bugün" o={now} />
      <Stamp x={800} y={900} text="ATASI BU" k={sm(t, W(3) - 0.1, W(3) + 0.15)} />
    </g>
  );
};

/** 6: 1926 New York — stüdyo dansçılarla dolar */
const NewYork: React.FC<S> = ({ t, u, W }) => {
  const studio = W(4) - 0.15;
  if (t < studio)
    return (
      <g filter="url(#sepia)">
        <rect width={1080} height={1920} fill="#d6dde2" />
        <Skyline />
        <rect x={0} y={1000} width={1080} height={920} fill="#7d8792" />
        {/* gemi */}
        <g transform={`translate(${mix(-200, 420, sm(u, 0, studio - (t - u)))},1180)`}>
          <path d="M-260,0 L260,0 L210,110 L-210,110 Z" fill="#3b3a3f" {...st} strokeWidth={4} />
          <rect x={-180} y={-80} width={360} height={80} fill="#efe9dc" {...st} />
          {[-110, 0, 110].map((x) => (
            <rect key={x} x={x - 22} y={-170} width={44} height={90} fill="#b8322a" {...st} />
          ))}
        </g>
        <Year x={220} y={290} text="1926" o={sm(u, 0, 0.25)} />
        <Note x={760} y={420} text="New York" o={sm(t, W(1) - 0.15, W(1) + 0.2)} tilt={3} />
      </g>
    );
  const dancers = [W(5) - 0.2, W(5) + 0.15, W(6) - 0.1];
  return (
    <g filter="url(#sepia)">
      <rect width={1080} height={1920} fill="#eadfc8" />
      <rect x={110} y={330} width={860} height={560} fill="#d6dde2" {...st} strokeWidth={5} />
      <g transform="translate(110,330) scale(0.8) translate(0,-420)">
        <Skyline />
      </g>
      <rect x={110} y={330} width={860} height={560} fill="none" {...st} strokeWidth={6} />
      <path d="M540,330 L540,890" stroke={LINE} strokeWidth={6} />
      {/* bale barı */}
      <path d="M0,1100 L1080,1100" stroke={LINE} strokeWidth={14} />
      <path d="M0,1100 L1080,1100" stroke="#c9a24a" strokeWidth={8} />
      <rect x={0} y={1330} width={1080} height={590} fill="#a7845d" />
      <path d="M0,1330 L1080,1330" stroke={LINE} strokeWidth={4} />
      <Hero x={200} foot={1580} s={0.85} t={t} look={JOSEPH} pose={{ turn: 0.5, l: { a: 10, e: 6 }, r: { a: 50, e: 60 } }} expr="grin" />
      {dancers.map((at, i) => {
        const o = sm(t, at, at + 0.3);
        if (o <= 0) return null;
        const xs = [470, 690, 900][i];
        const sway = Math.sin(t * 2 + i) * 6;
        return (
          <g key={i} opacity={o} transform={`translate(${(1 - o) * 40},0)`}>
            <Hero
              x={xs}
              foot={1580}
              s={0.8}
              t={t}
              look={i === 1 ? DANCER2 : DANCER}
              seed={i + 2}
              pose={{ turn: i === 1 ? -0.3 : 0.2, l: { a: 150 + sway, e: 30 }, r: { a: 150 - sway, e: 30 } }}
              expr="smile"
            />
          </g>
        );
      })}
      <Note x={720} y={250} text="stüdyo dolu" o={sm(t, W(6) - 0.1, W(6) + 0.2)} tilt={2} />
    </g>
  );
};

/** 7-8: bugün — bel ağrısı azalır, gövde güçlenir */
const Science: React.FC<S & { W8: (k: number) => number }> = ({ t, W, W8 }) => {
  const pain = 1 - sm(t, W(7) - 0.1, W(7) + 0.6);
  const core = sm(t, W8(0) - 0.15, W8(1) + 0.4);
  const zz = (x: number, y: number) => `M${x},${y} l14,-14 l10,18 l14,-16 l10,18`;
  return (
    <g>
      <rect width={1080} height={1920} fill="#e8eef0" />
      <rect x={0} y={1380} width={1080} height={540} fill="#b9ccd4" />
      <path d="M0,1380 L1080,1380" stroke={LINE} strokeWidth={4} />
      <Tag x={290} y={300} text="araştırmalar" o={sm(t, W(4) - 0.15, W(4) + 0.2)} />
      <text x={290} y={380} textAnchor="middle" fontFamily={HAND} fontSize={34} fill={LINE} opacity={sm(t, W(4), W(4) + 0.3) * 0.8}>
        Cochrane, 2015
      </text>
      <Hero x={420} foot={1600} s={1.05} t={t} pose={{ turn: 0.3, l: { a: 14, e: 6 }, r: { a: 14, e: 6 } }} expr={pain > 0.5 && t > W(4) ? "worry" : core > 0.3 ? "grin" : "smile"}>
        {pain > 0 && t > W(5) - 0.2 ? (
          <g opacity={pain * sm(t, W(5) - 0.2, W(5) + 0.1)} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
            <path d={zz(270, 430)} />
            <path d={zz(60, 440)} />
          </g>
        ) : null}
        <Ring x={200} y={400} rx={90} ry={70} label="gövde" o={core} lx={300} ly={300} />
      </Hero>
      <PowerBar x={850} y={1150} level={mix(0.3, 0.95, core)} color="#1f4b8f" />
      <Note x={820} y={560} text="bel ağrısı ↓" o={sm(t, W(6) - 0.1, W(7) + 0.2)} tilt={2} />
    </g>
  );
};

/** 9: tek başına yağ yakmaz → + yürüyüş + ağırlık */
const Combo: React.FC<S> = ({ t, W }) => {
  const curl = 0.5 - 0.5 * Math.cos(Math.max(0, t - W(8)) * 4.5);
  const db = t > W(8) - 0.15;
  return (
    <g>
      <rect width={1080} height={1920} fill="#ece0c6" />
      <rect x={0} y={1380} width={1080} height={540} fill="#c9a77e" />
      <path d="M0,1380 L1080,1380" stroke={LINE} strokeWidth={4} />
      <Note x={540} y={290} text="tek başına yağ yakmaz" o={sm(t, W(3) - 0.15, W(4) + 0.1)} color={RED} tilt={-2} size={54} />
      <CheckCard x={800} y={620} text="pilates" o={sm(t, W(5) - 0.15, W(5) + 0.15)} />
      <CheckCard x={800} y={780} text="yürüyüş" o={sm(t, W(6) - 0.1, W(6) + 0.2)} />
      <CheckCard x={800} y={940} text="ağırlık" o={sm(t, W(8) - 0.1, W(8) + 0.2)} />
      <Hero
        x={330}
        foot={1600}
        s={1.0}
        t={t}
        pose={db ? { turn: 0.3, itemR: "dumbbell", l: { a: 10, e: 6 }, r: { a: 8, e: mix(10, 140, curl) } } : { turn: 0.3, l: { a: 14, e: 6 }, r: { a: 14, e: 6 } }}
        expr={t < W(5) ? "think" : "grin"}
      />
    </g>
  );
};

/** 10-11: Joseph'in sözü — 10/20/30 seans */
const Quote: React.FC<S & { W10: (k: number) => number; W11: (k: number) => number }> = ({ t, W10, W11 }) => {
  const flex = sm(t, W11(1) - 0.2, W11(1) + 0.2);
  return (
    <g>
      <rect width={1080} height={1920} fill="#ece0c6" />
      <Portrait t={t} x={300} y={560} o={sm(t, W10(0) - 0.3, W10(0) + 0.1)} />
      <SessionCard x={760} y={360} n={10} text="hissedersin" o={sm(t, W10(3) - 0.1, W10(3) + 0.2)} on={sm(t, W10(4), W10(5) + 0.1) * (1 - sm(t, W10(6) - 0.1, W10(6)))} />
      <SessionCard x={760} y={540} n={20} text="görürsün" o={sm(t, W10(6) - 0.1, W10(6) + 0.2)} on={sm(t, W10(6), W10(7) + 0.1) * (1 - sm(t, W11(0) - 0.1, W11(0)))} />
      <SessionCard x={760} y={720} n={30} text="yepyeni beden" o={sm(t, W11(0) - 0.1, W11(0) + 0.2)} on={sm(t, W11(0), W11(1))} />
      <g opacity={sm(t, W11(0) - 0.2, W11(0) + 0.2)}>
        <Hero x={760} foot={1580} s={0.9} t={t} pose={{ turn: 0, l: { a: mix(12, 95, flex), e: mix(6, 95, flex) }, r: { a: mix(12, 95, flex), e: mix(6, 95, flex) } }} expr="grin" />
      </g>
    </g>
  );
};

/** 12: gönder — reformer + telefon, kâğıt uçak */
const Send: React.FC<S> = ({ t, W }) => {
  const fly = sm(t, W(4) - 0.15, W(4) + 0.8);
  return (
    <g>
      <StudioBg />
      <RowingHero t={t} item="phone" pull={0} expr="grin" />
      {fly > 0 && fly < 1 ? (
        <g transform={`translate(${mix(640, 1200, fly)},${mix(1020, 260, fly) - Math.sin(fly * Math.PI) * 120}) rotate(${-30 + fly * 10}) scale(${mix(0.6, 1.6, fly)})`}>
          <path d="M-60,10 L70,-30 L-20,40 Z" fill={PAPER} {...st} />
          <path d="M-20,40 L-10,12 L70,-30" fill="#e8dcc4" {...st} />
        </g>
      ) : null}
    </g>
  );
};

// ------------------------------------------------------------ kompozisyon

export const PilatesDogus: React.FC<EkmekBirakProps & { music?: boolean }> = ({ audioName, data, music = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const base: TL = data ? voiceTimeline(data, PD_LINES) : PD_TL;
  const T = data ? data.durationInSeconds + PD_TAIL : PD_TL.total;
  const tl: TL = { ...base, total: T };
  const L = tl.at;
  const Wt = (line: number, k: number) => wordTime(tl, line, k, PD_LINES);

  const scene = (tt: number, i: number): React.ReactNode => {
    const u = tt - L(i);
    const s: S = { t: tt, u, W: (k) => Wt(i, k), d: L(i + 1) - L(i) };
    switch (i) {
      case 0:
        return <Hook {...s} />;
      case 1:
        return <Kid {...s} />;
      case 2:
        return <Training {...s} />;
      case 3:
        return <Camp {...s} />;
      case 4:
        return <Beds {...s} />;
      case 5:
        return <Ancestor {...s} />;
      case 6:
        return <NewYork {...s} />;
      case 7:
      case 8:
        return <Science {...s} W={(k) => Wt(7, k)} W8={(k) => Wt(8, k)} />;
      case 9:
        return <Combo {...s} />;
      case 10:
      case 11:
        return <Quote {...s} W10={(k) => Wt(10, k)} W11={(k) => Wt(11, k)} />;
      default:
        return <Send {...s} />;
    }
  };

  const i = Math.max(0, tl.idx(t));
  // 7-8 ve 10-11 tek sahne
  const segA = i === 8 || i === 11 ? L(i - 1) : L(i);
  const segB = i === 7 || i === 10 ? L(i + 2) : L(i + 1);
  const push = 1 + 0.05 * sm(t, segA, Math.max(segA + 0.5, segB));
  // döngü: son 0.35 sn'de ilk kareye geçilir (son kare = ilk kare)
  const loopIn = sm(t, T - 0.4, T - 0.03);
  const t0 = t - T;

  const FX: { at: number; id: number; v: number; lead?: number; dur?: number; fade?: number }[] = [
    { at: 0, id: 2299, v: 0.2, lead: 0.05 },
    { at: Wt(0, 5) - 0.2, id: 1143, v: 0.16, lead: 0.14, dur: 1.4, fade: 0.7 },
    { at: L(1) + 0.1, id: 1120, v: 0.14, lead: 0.1 },
    { at: L(3) + 0.1, id: 1120, v: 0.14, lead: 0.1 },
    { at: Wt(5, 3) - 0.1, id: 2182, v: 0.2 },
    { at: L(6) + 0.1, id: 1120, v: 0.14, lead: 0.1 },
    { at: L(7) + 0.1, id: 2568, v: 0.14 },
    { at: Wt(9, 5) - 0.1, id: 2568, v: 0.14 },
    { at: Wt(10, 3) - 0.1, id: 2568, v: 0.14 },
    { at: Wt(12, 4) - 0.2, id: 1143, v: 0.16, lead: 0.14, dur: 1.6, fade: 0.8 },
  ];

  return (
    <AbsoluteFill lang="tr" style={{ background: "#ece0c6", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <SketchDefs />
        <defs>
          {/* %60 sepya: geçmiş sahneleri */}
          <filter id="sepia" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.636 0.461 0.113 0 0  0.209 0.812 0.101 0 0  0.163 0.320 0.479 0 0  0 0 0 1 0" />
          </filter>
        </defs>
        <g filter="url(#pencil)">
          <g transform={`translate(540,960) scale(${push}) translate(-540,-960)`}>{scene(t, i)}</g>
          {loopIn > 0 ? <g opacity={loopIn}>{scene(t0, 0)}</g> : null}
        </g>
      </svg>
      <Captions t={t} tl={tl} lines={PD_LINES} end={T - PD_TAIL + 0.5} />
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
