/**
 * "Spordan 2 gün sonra neden ağrır?" — seçilen kız karakterle açılış (hook), sonra kasın içine
 * adım adım yakınlaşan detaylı çizimler: bacak → kas demeti → kas lifi → sarkomer; mikro yırtık,
 * bağışıklık hücreleri, sinir uçları, uydu hücrelerle onarım. Sessiz örnek (seslendirme yok).
 */
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MONO, SANS, SERIF, loadFonts } from "../fonts";
import { type Line, Subtitle, pop, sm, timeline, win } from "../ornek/common";
import { CameraRig, useGltf, type Clip } from "../three/Character";
import { Girl, KIZ, useImage, useLabels } from "../three/Girl";
import { lerp3, project, type Cam, type V3 } from "../three/scene";

loadFonts();

const C = {
  bg: "#080a11",
  panel: "#11151f",
  line: "#273047",
  coral: "#FF5E5B",
  amber: "#FFB547",
  cyan: "#4FD1FF",
  green: "#5BE38B",
  purple: "#A78BFA",
  muscle: "#de4f5c",
  muscleD: "#9b2c3a",
  skin: "#f1c9ad",
  text: "#f4f1ec",
  dim: "#8b93a7",
};

export const KAS2_LINES: Line[] = [
  { text: "Spordan iki gün sonra merdivenleri böyle iniyorsan…", hl: ["iki", "gün", "sonra"], hold: 0.6 },
  { text: "Suçlu laktik asit değil. O, bir saat içinde kanından temizlenir.", hl: ["değil.", "bir", "saat"] },
  { text: "Asıl hikâye kasının içinde. Hadi yakından bakalım.", hl: ["kasının", "içinde."], hold: 2.6 },
  { text: "Squatta aşağı inerken kas hem uzar hem kasılır.", hl: ["uzar", "kasılır."], hold: 0.4 },
  { text: "Bu zorlanma, kas liflerinde mikroskobik yırtıklar açar.", hl: ["mikroskobik", "yırtıklar"], hold: 0.4 },
  { text: "Birkaç saat sonra vücut alarm verir, bağışıklık hücreleri bölgeye akın eder.", hl: ["bağışıklık", "hücreleri"], hold: 0.4 },
  { text: "Bölgede sıvı toplanır, sinir uçları hassaslaşır. Ağrının kaynağı bu.", hl: ["sinir", "uçları"], hold: 0.4 },
  { text: "Bu yüzden ağrı 24 ile 72 saat arasında zirve yapar.", hl: ["24", "72", "saat"] },
  { text: "Bu sırada uydu hücreler devreye girer ve lifleri onarır.", hl: ["uydu", "hücreler"], hold: 0.6 },
  { text: "Onarılan lif daha güçlü olur. Aynı antrenman bir dahaki sefere çok daha az acıtır.", hl: ["güçlü", "az"] },
  { text: "Ağrıyı hafifletmek için hafif yürüyüş, iyi uyku, yeterli protein ve bol su.", hl: ["yürüyüş,", "uyku,", "protein", "su."], hold: 0.6 },
  { text: "Bu videoyu kaydet, ilk ağrıda hatırla.", hl: ["kaydet,"], hold: 1.4 },
];

export const KAS2_TL = timeline(KAS2_LINES, 0.3);

/** Büyük başlık: [üst, vurgulu alt] */
const HEADS: [string, string][] = [
  ["2 GÜN", "SONRA…"],
  ["LAKTİK ASİT?", "DEĞİL"],
  ["KASIN", "İÇİNE"],
  ["UZARKEN", "KASILMA"],
  ["MİKRO", "YIRTIK"],
  ["ALARM", "DURUMU"],
  ["AĞRI", "SİNYALİ"],
  ["24–72", "SAAT"],
  ["ONARIM", "EKİBİ"],
  ["DAHA", "GÜÇLÜ"],
  ["NE", "YAPMALI?"],
  ["KAYDET", "& HATIRLA"],
];

// ------------------------------------------------------------ zemin ve yazılar

const Background: React.FC<{ t: number }> = ({ t }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="bgr" cx="50%" cy="42%" r="75%">
        <stop offset="0" stopColor="#1a2033" />
        <stop offset="0.6" stopColor="#0b0e17" />
        <stop offset="1" stopColor="#05060a" />
      </radialGradient>
      <pattern id="grid" width={60} height={60} patternUnits="userSpaceOnUse">
        <path d="M60 0H0V60" fill="none" stroke="#fff" strokeOpacity={0.03} />
      </pattern>
    </defs>
    <rect width={1080} height={1920} fill="url(#bgr)" />
    <rect width={1080} height={1920} fill="url(#grid)" />
    {Array.from({ length: 16 }).map((_, i) => {
      const x = (i * 263 + 40) % 1080;
      const y = 200 + ((i * 397) % 1500) - ((t * (10 + (i % 4) * 5)) % 260);
      return <circle key={i} cx={x} cy={y} r={14 + (i % 5) * 12} fill={i % 3 ? C.coral : C.cyan} opacity={0.045} />;
    })}
  </svg>
);

const Headline: React.FC<{ t: number; i: number; s: number; e: number }> = ({ t, i, s, e }) => {
  const [a, b] = HEADS[i];
  const pa = pop(t, s, 30, 11);
  const pb = pop(t, s + 0.22, 30, 9);
  const o = 1 - sm(t, e - 0.18, e);
  const sweep = sm(t, s + 0.3, s + 0.8);
  return (
    <div style={{ position: "absolute", top: 190, left: 0, right: 0, textAlign: "center", opacity: o }}>
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 104,
          letterSpacing: -3,
          lineHeight: 0.95,
          color: C.text,
          transform: `translateY(${(1 - pa) * 40}px) scale(${0.85 + 0.15 * pa})`,
          opacity: Math.min(1, pa * 2),
        }}
      >
        {a}
      </div>
      <div
        style={{
          display: "inline-block",
          position: "relative",
          marginTop: 6,
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 118,
          lineHeight: 1,
          color: C.coral,
          transform: `scale(${0.6 + 0.4 * pb}) rotate(${(1 - pb) * -6}deg)`,
          opacity: Math.min(1, pb * 2),
        }}
      >
        {b}
        <div style={{ position: "absolute", left: 0, bottom: 4, height: 8, width: `${sweep * 100}%`, background: C.coral, borderRadius: 4, opacity: 0.5 }} />
      </div>
    </div>
  );
};

const Progress: React.FC<{ t: number; total: number }> = ({ t, total }) => (
  <div style={{ position: "absolute", top: 90, left: 70, right: 70, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.12)" }}>
    <div style={{ width: `${Math.min(100, (t / total) * 100)}%`, height: "100%", borderRadius: 3, background: C.coral }} />
  </div>
);

/** küçük etiket (çizgiyle bir noktaya bağlı) */
const Tag: React.FC<{ x: number; y: number; tx: number; ty: number; text: string; o: number; color?: string }> = ({ x, y, tx, ty, text, o, color = C.text }) => (
  <g opacity={o}>
    <line x1={x} y1={y} x2={tx} y2={ty} stroke={color} strokeWidth={2.5} opacity={0.7} />
    <circle cx={x} cy={y} r={7} fill={color} />
    <rect x={tx - (text.length * 15 + 36) / 2} y={ty - 30} width={text.length * 15 + 36} height={56} rx={28} fill="#151a27" stroke={color} strokeWidth={2.5} />
    <text x={tx} y={ty + 9} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={color}>
      {text}
    </text>
  </g>
);

// ------------------------------------------------------------ anatomi çizimleri

/** A: bacak ve ön bacak kası */
const LevelLeg: React.FC<{ t: number }> = ({ t }) => {
  const pulse = 0.55 + 0.45 * Math.sin(t * 6);
  return (
    <g>
      <defs>
        <linearGradient id="quad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.muscleD} />
          <stop offset="0.5" stopColor={C.muscle} />
          <stop offset="1" stopColor={C.muscleD} />
        </linearGradient>
        <radialGradient id="hot" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={C.coral} stopOpacity={0.9} />
          <stop offset="1" stopColor={C.coral} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* bacak silueti */}
      <path d="M420,560 C380,700 380,900 420,1060 C430,1120 440,1170 450,1260 L610,1260 C620,1170 640,1110 660,1050 C700,900 700,700 660,560 Z" fill={C.skin} opacity={0.18} stroke={C.skin} strokeOpacity={0.5} strokeWidth={4} />
      {/* kuadriseps: dört baş */}
      <path d="M470,600 C440,720 445,880 490,1010 L530,1010 C520,880 515,720 520,600 Z" fill="url(#quad)" />
      <path d="M530,590 C525,720 525,880 535,1015 L575,1012 C590,880 600,720 590,590 Z" fill="url(#quad)" />
      <path d="M598,600 C630,720 635,880 590,1010 L560,1010 C590,880 600,720 598,600 Z" fill="url(#quad)" opacity={0.9} />
      {/* liflerin yönü */}
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M${478 + i * 13},${620} C${470 + i * 13},${760} ${475 + i * 13},${880} ${500 + i * 9},${1000}`} stroke="#ff9aa2" strokeWidth={2} fill="none" opacity={0.35} />
      ))}
      {/* diz kapağı + tendon */}
      <ellipse cx={540} cy={1060} rx={46} ry={38} fill="#e9dccb" opacity={0.85} />
      <rect x={526} y={1095} width={28} height={120} rx={14} fill="#e9dccb" opacity={0.55} />
      <circle cx={540} cy={820} r={150} fill="url(#hot)" opacity={0.45 * pulse} />
    </g>
  );
};

/** B: kas kesiti — demetler (fasikül) */
const FASC: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  const rows = [3, 4, 5, 4, 3];
  rows.forEach((n, r) => {
    for (let k = 0; k < n; k++) out.push([540 + (k - (n - 1) / 2) * 150, 640 + r * 140, 64 + ((r * 7 + k * 3) % 3) * 6]);
  });
  return out;
})();

const LevelBundles: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <ellipse cx={540} cy={920} rx={400} ry={360} fill="#2a1418" stroke="#f3d9c9" strokeOpacity={0.5} strokeWidth={6} />
    {FASC.map(([x, y, r], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r={r} fill={C.muscle} stroke="#f7c9c0" strokeOpacity={0.6} strokeWidth={4} />
        {Array.from({ length: 9 }).map((_, j) => {
          const a = (j / 9) * Math.PI * 2 + i;
          const rr = j === 0 ? 0 : r * 0.55;
          return <circle key={j} cx={x + Math.cos(a) * rr} cy={y + Math.sin(a) * rr} r={r * 0.24} fill="#f07a84" opacity={0.85} />;
        })}
      </g>
    ))}
    {/* kılcal damarlar */}
    {[0, 1, 2].map((k) => (
      <circle key={k} cx={360 + k * 180} cy={790 + (k % 2) * 260} r={10} fill="#b31b2c" opacity={0.6 + 0.4 * Math.sin(t * 4 + k)} />
    ))}
  </g>
);

/** C: tek kas lifi (silindir), çizgili; çekirdekler, uydu hücre */
const FIBER_Y = 900;
const Fiber: React.FC<{ thick?: number; notch?: number[]; notchFill?: number; glow?: number; id: string; y?: number; x0?: number; x1?: number }> = ({
  thick = 1,
  notch = [],
  notchFill = 0,
  glow = 0,
  id,
  y = FIBER_Y,
  x0 = 110,
  x1 = 970,
}) => {
  const h = 210 * thick;
  return (
    <g>
      <defs>
        <linearGradient id={`fg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f58a92" />
          <stop offset="0.45" stopColor={C.muscle} />
          <stop offset="1" stopColor="#8e2533" />
        </linearGradient>
        <pattern id={`st${id}`} width={26} height={20} patternUnits="userSpaceOnUse">
          <rect width={9} height={20} fill="#000" opacity={0.16} />
          <rect x={9} width={2} height={20} fill="#fff" opacity={0.08} />
        </pattern>
        <clipPath id={`fc${id}`}>
          <rect x={x0} y={y - h / 2} width={x1 - x0} height={h} rx={h / 2} />
        </clipPath>
      </defs>
      {glow > 0 ? <rect x={x0 - 14} y={y - h / 2 - 14} width={x1 - x0 + 28} height={h + 28} rx={h / 2 + 14} fill={C.green} opacity={0.18 * glow} /> : null}
      <rect x={x0} y={y - h / 2} width={x1 - x0} height={h} rx={h / 2} fill={`url(#fg${id})`} />
      <g clipPath={`url(#fc${id})`}>
        <rect x={x0} y={y - h / 2} width={x1 - x0} height={h} fill={`url(#st${id})`} />
        {/* miyofibril çizgileri */}
        {Array.from({ length: 6 }).map((_, k) => (
          <line key={k} x1={x0} y1={y - h / 2 + (h / 7) * (k + 1)} x2={x1} y2={y - h / 2 + (h / 7) * (k + 1)} stroke="#ffd0d0" strokeOpacity={0.12} strokeWidth={2} />
        ))}
        {/* yırtık çentikleri */}
        {notch.map((nx, k) => (
          <g key={k}>
            <path d={`M${nx - 18},${y - h / 2} L${nx},${y - h / 2 + h * 0.42} L${nx + 18},${y - h / 2}`} fill="#1a0a0d" />
            <path d={`M${nx - 18},${y - h / 2} L${nx},${y - h / 2 + h * 0.42} L${nx + 18},${y - h / 2}`} fill={C.green} opacity={notchFill} />
          </g>
        ))}
      </g>
      {/* çekirdekler kenarda */}
      {[220, 470, 720, 900].map((nx, k) => (
        <ellipse key={k} cx={nx} cy={y + h / 2 - 14} rx={34} ry={11} fill="#5b2a6e" opacity={0.85} />
      ))}
    </g>
  );
};

/** D: sarkomer — Z çizgileri, aktin (ince), miyozin (kalın) */
const Sarcomere: React.FC<{ t: number; stretch?: number; torn?: number }> = ({ t, stretch = 0, torn = 0 }) => {
  const cx = 540;
  const half = 190 * (1 + 0.28 * stretch); // Z çizgisinden M çizgisine
  const rows = 5;
  const y0 = 720;
  const dy = 85;
  const zLines = [cx - half * 2, cx, cx + half * 2];
  const els: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * dy;
    const wob = torn * Math.sin(r * 2.3 + t * 3) * 10;
    // miyozin: her sarkomerin ortasında
    [cx - half, cx + half].forEach((mc, k) => {
      els.push(<rect key={`m${r}${k}`} x={mc - 120} y={y - 9 + wob} width={240} height={18} rx={9} fill={C.purple} />);
      for (let h = 0; h < 9; h++) {
        const hx = mc - 105 + h * 26;
        const ang = Math.sin(t * 8 + h + r) * 0.4;
        els.push(<line key={`h${r}${k}${h}`} x1={hx} y1={y - 9 + wob} x2={hx + 9 * Math.sin(ang + (h < 4 ? -0.6 : 0.6))} y2={y - 22 + wob} stroke="#d6c7ff" strokeWidth={3} />);
      }
    });
    // aktin: Z'den içe
    zLines.forEach((zx, k) => {
      const len = 150;
      if (k > 0) els.push(<line key={`al${r}${k}`} x1={zx} y1={y + 24 + wob} x2={zx - len} y2={y + 24 + wob} stroke={C.cyan} strokeWidth={6} strokeLinecap="round" />);
      if (k < 2) els.push(<line key={`ar${r}${k}`} x1={zx} y1={y + 24 + wob} x2={zx + len} y2={y + 24 + wob} stroke={C.cyan} strokeWidth={6} strokeLinecap="round" />);
    });
  }
  // Z çizgileri (yırtılınca kırılır)
  zLines.forEach((zx, k) => {
    const pts: string[] = [];
    for (let s = 0; s <= 10; s++) {
      const yy = y0 - 50 + s * 41;
      const brk = torn * (k === 1 ? 1 : 0.6) * (s % 2 ? 1 : -1) * (s > 3 && s < 8 ? 28 : 8);
      pts.push(`${zx + (s % 2 ? 10 : -10) + brk},${yy}`);
    }
    els.push(<polyline key={`z${k}`} points={pts.join(" ")} fill="none" stroke="#f3e6d8" strokeWidth={8} strokeLinejoin="round" />);
  });
  return (
    <g>
      <rect x={70} y={y0 - 90} width={940} height={rows * dy + 110} rx={30} fill="#141826" stroke={C.line} strokeWidth={3} />
      {els}
      {torn > 0
        ? [0, 1, 2].map((k) => {
            const fl = Math.max(0, Math.sin(t * 9 + k * 2));
            return <circle key={k} cx={cx + (k - 1) * 30} cy={y0 + 60 + k * 110} r={60} fill={C.coral} opacity={0.35 * torn * fl} />;
          })
        : null}
    </g>
  );
};

/** zoom geçişi: bir seviye büyüyerek kaybolur, sonraki küçükten gelir */
const ZoomLevel: React.FC<{ t: number; a: number; b: number; fx: number; fy: number; children: React.ReactNode; first?: boolean }> = ({
  t,
  a,
  b,
  fx,
  fy,
  children,
  first,
}) => {
  const inK = first ? 1 : sm(t, a - 0.1, a + 0.5);
  const outK = sm(t, b - 0.35, b + 0.25);
  if (inK <= 0 || outK >= 1) return null;
  const s = (0.35 + 0.65 * inK) * (1 + outK * 3.2);
  const o = inK * (1 - outK);
  return (
    <g opacity={o} transform={`translate(${fx},${fy}) scale(${s}) translate(${-fx},${-fy})`}>
      {children}
    </g>
  );
};

/** squat yapan küçük çöp kız (eksantrik faz göstergesi) */
const SquatInset: React.FC<{ t: number; o: number }> = ({ t, o }) => {
  const k = (1 - Math.cos(t * 2.2)) / 2; // 0 ayakta … 1 aşağıda
  const hipY = -150 + 70 * k;
  const knee = { x: 40 * k + 10, y: -80 + 10 * k };
  const down = Math.sin(t * 2.2) > 0;
  return (
    <g transform="translate(880,700)" opacity={o}>
      <rect x={-100} y={-280} width={200} height={300} rx={24} fill="#141826" stroke={down ? C.coral : C.line} strokeWidth={4} />
      <g stroke={C.text} strokeWidth={9} strokeLinecap="round" fill="none">
        <path d={`M-20,0 L${knee.x},${knee.y} L0,${hipY}`} />
        <path d={`M0,${hipY} L${-10 - 20 * k},${hipY - 90}`} />
        <path d={`M${-10 - 20 * k},${hipY - 70} L${50},${hipY - 60}`} />
        <circle cx={-14 - 22 * k} cy={hipY - 120} r={22} fill="#141826" />
      </g>
      <text x={0} y={-240} textAnchor="middle" fontFamily={MONO} fontSize={22} fill={down ? C.coral : C.dim}>
        {down ? "İNERKEN ↓" : "ÇIKARKEN ↑"}
      </text>
    </g>
  );
};

/** nötrofil / makrofaj */
const Neutrophil: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <circle r={30} fill="#eef1ff" opacity={0.92} />
    <circle cx={-10} cy={-6} r={9} fill="#7b5cc4" />
    <circle cx={8} cy={-8} r={8} fill="#7b5cc4" />
    <circle cx={2} cy={10} r={9} fill="#7b5cc4" />
  </g>
);
const Macrophage: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const r = 46 + 12 * Math.sin(a * 3 + t * 3);
    return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
  }).join(" ");
  return (
    <g>
      <polygon points={pts} fill={C.amber} opacity={0.85} />
      <circle cx={x - 6} cy={y - 4} r={16} fill="#8a4b10" opacity={0.85} />
    </g>
  );
};

/** saat grafiği */
const PainGraph: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const x0 = 170;
  const y0 = 1180;
  const w = 760;
  const h = 460;
  const k = sm(t, s + 0.2, s + 1.8);
  const f = (u: number) => Math.max(0.03, Math.exp(-Math.pow((u * 96 - 44) / 24, 2)) * 0.92);
  let d = "";
  for (let i = 0; i <= 80 * k; i++) d += `${i === 0 ? "M" : "L"}${x0 + (i / 80) * w},${y0 - f(i / 80) * h} `;
  const band = sm(t, s + 1.2, s + 1.8);
  return (
    <g opacity={sm(t, s, s + 0.3)}>
      <rect x={x0 - 70} y={y0 - h - 80} width={w + 140} height={h + 190} rx={30} fill="#141826" stroke={C.line} strokeWidth={3} />
      <rect x={x0 + w * 0.25} y={y0 - h} width={w * 0.5 * band} height={h} fill={C.coral} opacity={0.14} />
      <line x1={x0} y1={y0} x2={x0 + w} y2={y0} stroke="#56607a" strokeWidth={3} />
      {["0", "24", "48", "72", "96 sa"].map((l, i) => (
        <text key={l} x={x0 + (w * i) / 4} y={y0 + 50} fill={C.dim} fontFamily={MONO} fontSize={28} textAnchor="middle">
          {l}
        </text>
      ))}
      <path d={d} fill="none" stroke={C.coral} strokeWidth={10} strokeLinecap="round" />
      <text x={x0 + w * 0.5} y={y0 - h - 24} fill={C.coral} fontFamily={MONO} fontSize={30} textAnchor="middle" opacity={band}>
        ZİRVE
      </text>
    </g>
  );
};

/** 2x2 öneri kartları */
const Tips: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const items: { label: string; draw: React.ReactNode; color: string }[] = [
    {
      label: "Hafif yürüyüş",
      color: C.green,
      draw: (
        <g stroke={C.green} strokeWidth={10} strokeLinecap="round" fill="none">
          <path d={`M0,10 L${Math.sin(t * 6) * 30},70 M0,10 L${-Math.sin(t * 6) * 30},70 M0,10 L0,-50 M0,-35 L${-Math.sin(t * 6) * 26},10 M0,-35 L${Math.sin(t * 6) * 26},10`} />
          <circle cx={0} cy={-75} r={20} fill="#141826" />
        </g>
      ),
    },
    {
      label: "İyi uyku",
      color: C.purple,
      draw: (
        <g>
          <path d="M20,-60 A60,60 0 1 0 40,40 A48,48 0 1 1 20,-60 Z" fill={C.purple} />
          <text x={40} y={-40} fontFamily={SANS} fontWeight={800} fontSize={34} fill={C.purple} opacity={0.6 + 0.4 * Math.sin(t * 3)}>
            z
          </text>
        </g>
      ),
    },
    {
      label: "Yeterli protein",
      color: C.amber,
      draw: (
        <g>
          <ellipse cx={0} cy={0} rx={52} ry={66} fill="#fff6e6" />
          <circle cx={0} cy={8} r={28} fill={C.amber} />
        </g>
      ),
    },
    {
      label: "Bol su",
      color: C.cyan,
      draw: (
        <g>
          <path d="M-40,-60 L40,-60 L30,70 L-30,70 Z" fill="none" stroke={C.cyan} strokeWidth={8} />
          <path d={`M-34,${-10 + Math.sin(t * 3) * 4} L34,${-10 - Math.sin(t * 3) * 4} L30,66 L-30,66 Z`} fill={C.cyan} opacity={0.7} />
        </g>
      ),
    },
  ];
  return (
    <g>
      {items.map((it, i) => {
        const p = pop(t, s + 0.15 + i * 0.35, 30, 11);
        const x = i % 2 === 0 ? 300 : 780;
        const y = i < 2 ? 760 : 1110;
        return (
          <g key={i} opacity={Math.min(1, p * 2)} transform={`translate(${x},${y}) scale(${0.6 + 0.4 * p})`}>
            <rect x={-215} y={-160} width={430} height={310} rx={36} fill="#141826" stroke={it.color} strokeWidth={4} />
            <g transform="translate(0,-30)">{it.draw}</g>
            <text y={110} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={C.text}>
              {it.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------ 3B kız sahneleri

const camAt = (t: number, L: (i: number) => number): Cam => {
  const hook: Cam = { pos: [1.2, 1.25, 2.9], target: [0, 1.05, 0], fov: 40 };
  const hook2: Cam = { pos: [0.85, 1.1, 2.2], target: [0, 0.95, 0], fov: 40 };
  const talk: Cam = { pos: [0, 1.3, 2.6], target: [0, 1.05, 0], fov: 40 };
  const thigh: Cam = { pos: [-0.25, 0.75, 0.75], target: [-0.09, 0.68, 0.0], fov: 36 };
  const close: Cam = { pos: [0.1, 1.38, 1.9], target: [0, 1.22, 0], fov: 38 };
  const lp = (a: Cam, b: Cam, k: number): Cam => ({ pos: lerp3(a.pos, b.pos, k), target: lerp3(a.target, b.target, k), fov: a.fov + (b.fov - a.fov) * k });
  if (t < L(1)) return lp(hook, hook2, sm(t, 0, L(1)));
  if (t < L(2)) return lp(hook2, talk, sm(t, L(1) - 0.1, L(1) + 0.6));
  if (t < L(11)) return lp(talk, thigh, sm(t, L(2) + 0.1, L(2) + 1.2));
  return close;
};

const GirlWorld: React.FC<{ t: number; L: (i: number) => number; girl: GLTF; bot: GLTF; labels: Uint8Array; uvl: HTMLImageElement; cam: Cam }> = ({
  t,
  L,
  girl,
  bot,
  labels,
  uvl,
  cam,
}) => {
  const limp = t < L(1) + 0.3 ? 1 - sm(t, L(1) - 0.2, L(1) + 0.3) : 0;
  const end = t >= L(11) - 0.2;
  const nod = end ? sm(t, L(11) + 0.6, L(11) + 0.9) * (1 - sm(t, L(11) + 2.0, L(11) + 2.3)) : 0;
  const clips: Clip[] = [
    { name: "idle", weight: Math.max(0, 1 - limp - nod) },
    { name: "walk", weight: limp * 0.75, speed: 0.55 },
    { name: "sad_pose", weight: limp * 0.3 },
    { name: "agree", weight: nod },
  ];
  return (
    <>
      <CameraRig position={cam.pos} target={cam.target} fov={cam.fov} />
      <hemisphereLight args={["#cfe0ff", "#1a1420", 1.1]} />
      <directionalLight position={[2, 3.5, 3]} intensity={2.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} />
      <directionalLight position={[-2.5, 2.2, -2]} intensity={1.3} color={C.coral} />
      <pointLight position={[0, 1.5, 2]} intensity={1.2} color="#fff1e0" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5, 64]} />
        <meshStandardMaterial color="#0d1019" roughness={0.85} />
      </mesh>
      <Girl gltf={girl} anim={bot} labels={labels} uvLabels={uvl} look={KIZ} clips={clips} rotationY={t < L(1) ? 0.5 : 0} />
    </>
  );
};

/** ağrı nabzı: bacaklarda kırmızı parlama + şimşek */
const PainPulse: React.FC<{ t: number; cam: Cam; o: number }> = ({ t, cam, o }) => {
  if (o <= 0) return null;
  const pts: V3[] = [
    [0.1, 0.74, 0.08],
    [-0.1, 0.74, 0.08],
    [0.1, 0.5, 0.08],
    [-0.1, 0.5, 0.08],
  ];
  return (
    <>
      {pts.map((p, i) => {
        const s = project(cam, p);
        const k = 0.5 + 0.5 * Math.sin(t * 7 + i * 1.3);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x - 150,
              top: s.y - 150,
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: `radial-gradient(circle, #ff2a3aee 0%, #ff2a3a88 30%, #ff2a3a00 68%)`,
              opacity: o * (0.45 + 0.5 * k),
            }}
          />
        );
      })}
    </>
  );
};

// ------------------------------------------------------------ ana video

export const KasAgrisiKiz: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const tl = KAS2_TL;
  const L = tl.at;
  const i = Math.max(0, tl.idx(t));
  const girl = useGltf("models/Michelle.glb");
  const bot = useGltf("models/Xbot.glb");
  const labels = useLabels();
  const uvl = useImage("models/michelle-uvlabels.png");
  const cam = camAt(t, L);

  // 3B görünür mü (açılış + kapanış)
  const lens = sm(t, L(2) + 0.9, L(2) + 1.5); // bacaktan kasın içine dairesel geçiş
  const show3d = (t < L(2) + 1.6) || t >= L(11) - 0.3;
  const endIn = sm(t, L(11) - 0.3, L(11) + 0.3);
  const thighScreen = project(cam, [-0.09, 0.68, 0.06]);

  // anatomi sahnesi zaman çizgisi
  const zA = L(2) + 1.0;
  const zB = L(2) + 2.2;
  const zC = L(2) + 3.3;
  const zD = L(2) + 4.4;
  const S = (n: number) => L(n);

  const lacticX = sm(t, L(1) + 1.2, L(1) + 1.6);

  return (
    <AbsoluteFill lang="tr" style={{ background: C.bg, overflow: "hidden" }}>
      <Background t={t} />

      {/* 3B kız */}
      {show3d && girl && bot && labels && uvl ? (
        <AbsoluteFill style={{ opacity: t >= L(11) - 0.3 ? endIn : 1 - lens }}>
          <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
            <GirlWorld t={t} L={L} girl={girl} bot={bot} labels={labels} uvl={uvl} cam={cam} />
          </ThreeCanvas>
          <PainPulse t={t} cam={cam} o={win(t, 0.3, L(1) + 0.2, 0.3) + win(t, L(2) + 0.6, L(2) + 1.6, 0.3)} />
          {/* laktik asit sahnesinde kız arka planda kararır */}
          <AbsoluteFill style={{ background: "#05060a", opacity: 0.62 * win(t, L(1), L(2) + 0.3, 0.3) }} />
        </AbsoluteFill>
      ) : null}

      {/* laktik asit: üstü çizilen rozet + 1 saat */}
      {t > L(1) - 0.1 && t < L(2) + 0.2 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: win(t, L(1), L(2) + 0.2, 0.25) }}>
          <g transform={`translate(540,900) scale(${pop(t, L(1) + 0.1)})`}>
            {[0, 1, 2, 3, 4, 5].map((k) => {
              const a = (k / 6) * Math.PI * 2 + t * 0.7;
              return <circle key={k} cx={Math.cos(a) * 200} cy={Math.sin(a) * 200} r={26} fill={k % 2 ? C.coral : "#f2f4f8"} />;
            })}
            <circle r={160} fill="#141826" stroke={C.cyan} strokeWidth={6} />
            <text y={-10} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={54} fill={C.text}>
              LAKTİK
            </text>
            <text y={54} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={54} fill={C.text}>
              ASİT
            </text>
            <line x1={-180} y1={-180} x2={-180 + 360 * lacticX} y2={-180 + 360 * lacticX} stroke={C.coral} strokeWidth={24} strokeLinecap="round" />
            <line x1={180} y1={-180} x2={180 - 360 * lacticX} y2={-180 + 360 * lacticX} stroke={C.coral} strokeWidth={24} strokeLinecap="round" opacity={lacticX > 0 ? 1 : 0} />
          </g>
          <g opacity={sm(t, L(1) + 1.8, L(1) + 2.2)} transform="translate(540,1200)">
            <rect x={-230} y={-50} width={460} height={100} rx={50} fill="#141826" stroke={C.green} strokeWidth={4} />
            <text y={14} textAnchor="middle" fontFamily={MONO} fontSize={36} fill={C.green}>
              ~1 saatte temizlenir
            </text>
          </g>
        </svg>
      ) : null}

      {/* anatomi: dairesel mercekle açılır */}
      {t > L(2) + 0.8 && t < L(11) ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <clipPath id="lens">
              <circle cx={interpolate(lens, [0, 1], [thighScreen.x, 540])} cy={interpolate(lens, [0, 1], [thighScreen.y, 920])} r={interpolate(lens, [0, 1], [0, 1300])} />
            </clipPath>
          </defs>
          <g clipPath="url(#lens)" opacity={1 - sm(t, L(11) - 0.35, L(11))}>
            <rect width={1080} height={1920} fill="url(#bgr)" />
            {/* yakınlaşma zinciri */}
            <ZoomLevel t={t} a={zA} b={zB} fx={540} fy={820} first>
              <LevelLeg t={t} />
              <Tag x={540} y={820} tx={830} ty={600} text="ön bacak kası" o={win(t, zA + 0.3, zB, 0.2)} color={C.coral} />
            </ZoomLevel>
            <ZoomLevel t={t} a={zB} b={zC} fx={540} fy={920}>
              <LevelBundles t={t} />
              <Tag x={540} y={920} tx={820} ty={560} text="kas demeti" o={win(t, zB + 0.4, zC, 0.2)} color={C.amber} />
            </ZoomLevel>
            <ZoomLevel t={t} a={zC} b={zD} fx={540} fy={FIBER_Y}>
              <Fiber id="z" />
              <Tag x={540} y={FIBER_Y - 105} tx={760} ty={640} text="kas lifi" o={win(t, zC + 0.4, zD, 0.2)} color={C.text} />
            </ZoomLevel>

            {/* sarkomer: uzama (3) ve yırtık (4) */}
            {t > zD - 0.15 && t < S(5) + 0.3 ? (
              <g opacity={sm(t, zD - 0.1, zD + 0.4) * (1 - sm(t, S(5) - 0.2, S(5) + 0.2))}>
                <Sarcomere t={t} stretch={t > S(3) ? (1 - Math.cos((t - S(3)) * 2.2)) / 2 : 0} torn={sm(t, S(4) + 0.2, S(4) + 1.0)} />
                <Tag x={540 - 380} y={640} tx={250} ty={560} text="Z çizgisi" o={win(t, zD + 0.3, S(5), 0.2)} color="#f3e6d8" />
                <Tag x={540 - 190} y={720} tx={560} ty={560} text="miyozin" o={win(t, zD + 0.6, S(4), 0.2)} color={C.purple} />
                <Tag x={540 + 70} y={1145} tx={820} ty={1240} text="aktin" o={win(t, zD + 0.9, S(4), 0.2)} color={C.cyan} />
                <SquatInset t={t - S(3)} o={win(t, S(3), S(4) + 0.4, 0.3)} />
                <Tag x={540} y={900} tx={540} ty={1240} text="mikro yırtık!" o={win(t, S(4) + 0.6, S(5), 0.2)} color={C.coral} />
              </g>
            ) : null}

            {/* lif: bağışıklık hücreleri (5), sıvı + sinir (6) */}
            {t > S(5) - 0.2 && t < S(7) + 0.2 ? (
              <g opacity={sm(t, S(5) - 0.15, S(5) + 0.3) * (1 - sm(t, S(7) - 0.2, S(7) + 0.2))}>
                {/* kılcal damar */}
                <rect x={90} y={1130} width={900} height={70} rx={35} fill="#6d1424" />
                {Array.from({ length: 10 }).map((_, k) => (
                  <ellipse key={k} cx={((k * 110 + t * 160) % 980) + 70} cy={1165} rx={22} ry={13} fill="#d8323f" />
                ))}
                <g transform={`translate(540,${FIBER_Y}) scale(${1 + 0.06 * sm(t, S(6), S(6) + 1)}) translate(-540,${-FIBER_Y})`}>
                  <Fiber id="i" notch={[330, 610, 820]} />
                </g>
                {/* hücreler damardan çıkıp yırtıklara gider */}
                {[330, 610, 820, 470, 700].map((nx, k) => {
                  const st = S(5) + 0.4 + k * 0.3;
                  const p = sm(t, st, st + 1.4);
                  const x = nx + (1 - p) * 40;
                  const y = 1160 + (FIBER_Y - 130 - 1160) * p;
                  return k < 3 ? <Neutrophil key={k} x={x} y={y} s={p > 0 ? 1 : 0} /> : p > 0 ? <Macrophage key={k} x={x} y={y + 20} t={t} /> : null;
                })}
                <Tag x={330} y={FIBER_Y - 160} tx={250} ty={600} text="nötrofil" o={win(t, S(5) + 1.6, S(6), 0.2)} color="#c9c2ff" />
                <Tag x={470} y={FIBER_Y - 110} tx={720} ty={600} text="makrofaj" o={win(t, S(5) + 2.4, S(6), 0.2)} color={C.amber} />
                {/* sıvı damlaları */}
                {Array.from({ length: 14 }).map((_, k) => {
                  const p = sm(t, S(6) + k * 0.06, S(6) + 0.6 + k * 0.06);
                  const x = 140 + ((k * 137) % 800);
                  const y = FIBER_Y + (k % 2 ? 150 : -150) + Math.sin(t * 2 + k) * 10;
                  return <circle key={k} cx={x} cy={y} r={12 + (k % 3) * 5} fill={C.cyan} opacity={0.35 * p} />;
                })}
                {/* sinir ucu + ağrı sinyali beyne */}
                <g opacity={sm(t, S(6) + 0.3, S(6) + 0.8)}>
                  <path d="M610,800 C640,700 700,640 760,560 C800,500 860,460 900,420" stroke="#ffd34d" strokeWidth={8} fill="none" />
                  <path d="M610,800 L560,760 M610,800 L650,770 M760,560 L720,520" stroke="#ffd34d" strokeWidth={5} fill="none" />
                  {[0, 1, 2].map((k) => {
                    const u = ((t * 1.3 + k / 3) % 1);
                    const bx = 610 + (900 - 610) * u;
                    const by = 800 + (420 - 800) * u - Math.sin(u * Math.PI) * 30;
                    return <circle key={k} cx={bx} cy={by} r={13} fill="#fff6c8" />;
                  })}
                  {/* beyin simgesi */}
                  <g transform="translate(930,400)">
                    <path d="M-40,10 C-60,-20 -40,-50 -10,-45 C0,-65 40,-60 45,-35 C70,-30 70,5 50,15 C50,40 10,45 0,30 C-20,45 -50,35 -40,10 Z" fill="#f6b8c8" stroke="#fff" strokeWidth={3} opacity={0.6 + 0.4 * Math.abs(Math.sin(t * 6))} />
                  </g>
                  <Tag x={760} y={560} tx={420} ty={560} text="ağrı sinyali" o={win(t, S(6) + 0.8, S(7), 0.2)} color="#ffd34d" />
                </g>
              </g>
            ) : null}

            {/* grafik (7) */}
            {t > S(7) - 0.1 && t < S(8) + 0.2 ? <g opacity={1 - sm(t, S(8) - 0.2, S(8) + 0.2)}><PainGraph t={t} s={S(7)} /></g> : null}

            {/* uydu hücrelerle onarım (8) */}
            {t > S(8) - 0.15 && t < S(9) + 0.2 ? (
              <g opacity={sm(t, S(8) - 0.15, S(8) + 0.3) * (1 - sm(t, S(9) - 0.2, S(9) + 0.2))}>
                <Fiber id="r" notch={[330, 610, 820]} notchFill={sm(t, S(8) + 1.8, S(8) + 2.6)} thick={1 + 0.15 * sm(t, S(8) + 2.4, S(8) + 3.2)} glow={sm(t, S(8) + 2.4, S(8) + 3.0)} />
                {[330, 610, 820].map((nx, k) => {
                  const st = S(8) + 0.3 + k * 0.25;
                  const p = sm(t, st, st + 1.2);
                  const fuse = sm(t, S(8) + 1.8, S(8) + 2.6);
                  const x = 180 + k * 300 + (nx - 180 - k * 300) * p;
                  const y = FIBER_Y + 128 - p * 228;
                  return (
                    <g key={k} opacity={1 - fuse}>
                      <circle cx={x} cy={y} r={24} fill={C.green} />
                      <circle cx={x} cy={y} r={34} fill={C.green} opacity={0.25 + 0.2 * Math.sin(t * 8)} />
                    </g>
                  );
                })}
                <Tag x={180} y={FIBER_Y + 128} tx={300} ty={1250} text="uydu hücre" o={win(t, S(8) + 0.2, S(8) + 1.8, 0.2)} color={C.green} />
                <Tag x={540} y={FIBER_Y - 120} tx={540} ty={620} text="+ kalınlaşan lif" o={win(t, S(8) + 2.6, S(9), 0.2)} color={C.green} />
              </g>
            ) : null}

            {/* önce / sonra (9) */}
            {t > S(9) - 0.15 && t < S(10) + 0.2 ? (
              <g opacity={sm(t, S(9) - 0.15, S(9) + 0.3) * (1 - sm(t, S(10) - 0.2, S(10) + 0.2))}>
                <text x={540} y={640} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={C.dim}>
                  ÖNCE
                </text>
                <Fiber id="b" thick={0.55} y={720} x0={200} x1={880} />
                <text x={540} y={880} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={C.green}>
                  SONRA
                </text>
                <Fiber id="a" thick={0.55 + 0.25 * sm(t, S(9) + 0.3, S(9) + 1.1)} y={990} x0={200} x1={880} glow={1} />
                {/* tekrar eden yük: ağrı çubukları */}
                {[0.9, 0.35].map((v, k) => {
                  const p = sm(t, S(9) + 1.0 + k * 0.4, S(9) + 1.6 + k * 0.4);
                  return (
                    <g key={k}>
                      <text x={200} y={1200 + k * 70} fontFamily={SANS} fontWeight={700} fontSize={34} fill={C.text}>
                        {k === 0 ? "1. sefer" : "2. sefer"}
                      </text>
                      <rect x={380} y={1172 + k * 70} width={500 * v * p} height={36} rx={18} fill={k === 0 ? C.coral : C.green} />
                    </g>
                  );
                })}
              </g>
            ) : null}

            {/* öneriler (10) */}
            {t > S(10) - 0.15 ? <g opacity={sm(t, S(10) - 0.15, S(10) + 0.3)}><Tips t={t} s={S(10)} /></g> : null}
          </g>
        </svg>
      ) : null}

      {/* kapanış: kaydet simgesi */}
      {t > L(11) ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1180, textAlign: "center", transform: `scale(${pop(t, L(11) + 0.4, 30, 10)})` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 22, background: C.coral, color: "#fff", padding: "22px 44px", borderRadius: 60, fontFamily: SANS, fontWeight: 800, fontSize: 56, boxShadow: "0 18px 50px rgba(255,94,91,0.4)" }}>
            <svg width={44} height={56} viewBox="0 0 44 56">
              <path d="M4,4 H40 V52 L22,40 L4,52 Z" fill="#fff" />
            </svg>
            Kaydet
          </div>
        </div>
      ) : null}

      <Headline t={t} i={i} s={(() => {
        let k = i;
        while (k > 0 && HEADS[k - 1][0] === HEADS[i][0]) k--;
        return L(k);
      })()} e={L(i + 1)} />
      <Progress t={t} total={tl.total} />
      <Subtitle lines={KAS2_LINES} tl={tl} t={t} color={C.amber} top={1420} size={58} stroke="#05060a" />
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: interpolate(t, [0, 0.25, tl.total - 0.4, tl.total], [1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
