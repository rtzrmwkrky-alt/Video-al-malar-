/**
 * Kas ağrısı — düz çizgi karikatür sürümü (≤30 sn, Reels). Bej kâğıt zemin, kalın konturlu kız,
 * kasın içinde sevimli "tamir hücreleri". Altyazı 3 kelimelik parçalar, vurgu sarı.
 * Sessiz örnek: zaman satırlardan hesaplanır.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS, loadFonts } from "../fonts";
import { type Line, pop, sm, timeline, win } from "../ornek/common";
import { INK, ToonGirl2D, blinkAt, type Expr, type ToonPose } from "../cartoon/ToonGirl2D";

loadFonts();

const Y = "#FFD43B"; // vurgu sarısı
const PAPER = "#eadcc0";
const MUSCLE = "#e8707a";
const MUSCLE_D = "#c94e5a";

export const TOON_LINES: Line[] = [
  { text: "Spordan iki gün sonra merdiven inemiyor musun?", hl: ["iki", "gün", "sonra"] },
  { text: "Suçlu laktik asit değil.", hl: ["değil."] },
  { text: "Gel, bacağının içine bakalım.", hl: ["içine"] },
  { text: "Squatta inerken kas lifleri gerilir…", hl: ["gerilir…"] },
  { text: "…ve minicik yırtıklar oluşur.", hl: ["yırtıklar"] },
  { text: "Vücut hemen tamir ekibini yollar.", hl: ["tamir", "ekibini"] },
  { text: "Bölge şişer, sinirler beyne “acıyor!” diye haber verir.", hl: ["“acıyor!”"] },
  { text: "Ağrı en çok 1–3 gün sonra zirve yapar.", hl: ["1–3", "gün"] },
  { text: "Tamir bitince kas eskisinden güçlü olur.", hl: ["güçlü"] },
  { text: "Hafifletmek için: yürüyüş, uyku, protein, su.", hl: ["yürüyüş,", "uyku,", "protein,", "su."] },
  { text: "Kaydet, ilk ağrıda hatırla!", hl: ["kaydet,"], hold: 0.8 },
];

export const TOON_TL = timeline(TOON_LINES, 0.2);

// ------------------------------------------------------------ zemin

const Paper: React.FC<{ t: number; tint?: string }> = ({ t, tint }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="pp" cx="50%" cy="45%" r="75%">
        <stop offset="0" stopColor={tint ?? "#f3e8d0"} />
        <stop offset="0.65" stopColor={tint ? tint : PAPER} />
        <stop offset="1" stopColor="#b9a47f" />
      </radialGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={3} />
        <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.15  0 0 0 0.18 0" />
      </filter>
    </defs>
    <rect width={1080} height={1920} fill="url(#pp)" />
    <rect width={1080} height={1920} filter="url(#grain)" />
    {Array.from({ length: 22 }).map((_, i) => {
      const x = (i * 197 + 30) % 1080;
      const y = (i * 331 + 100 - t * (12 + (i % 5) * 4)) % 1920;
      return <circle key={i} cx={x} cy={(y + 1920) % 1920} r={2 + (i % 3)} fill="#fff" opacity={0.55} />;
    })}
  </svg>
);

// ------------------------------------------------------------ altyazı (3 kelimelik parçalar)

const norm = (w: string) => w.toLocaleLowerCase("tr-TR").replace(/[.,!?…:;"“”'’]/g, "");

const Captions: React.FC<{ t: number; tl: ReturnType<typeof timeline>; top?: number }> = ({ t, tl, top = 1440 }) => {
  const i = tl.idx(t);
  if (i < 0) return null;
  const line = TOON_LINES[i];
  const words = line.text.split(/\s+/);
  const chunks: string[][] = [];
  for (let k = 0; k < words.length; ) {
    const n = words.length - k === 4 ? 2 : Math.min(3, words.length - k);
    chunks.push(words.slice(k, k + n));
    k += n;
  }
  const s = tl.at(i);
  const e = tl.at(i + 1) - (line.hold ?? 0);
  const per = (e - s) / chunks.length;
  const c = Math.min(chunks.length - 1, Math.floor((t - s) / per));
  const cs = s + c * per;
  const hl = (line.hl ?? []).map(norm);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top, textAlign: "center" }}>
      {chunks[c].map((w, k) => {
        const p = pop(t, cs + k * 0.07, 30, 10);
        const isHl = hl.includes(norm(w));
        return (
          <span
            key={`${c}-${k}`}
            style={{
              display: "inline-block",
              margin: "0 12px",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 92,
              letterSpacing: -1.5,
              color: isHl ? Y : "#fffaf0",
              WebkitTextStroke: `14px ${INK}`,
              paintOrder: "stroke",
              textShadow: "0 8px 0 rgba(43,29,20,0.35)",
              transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 20}px)`,
              opacity: Math.min(1, p * 3),
            }}
          >
            {w.replace(/[“”]/g, "")}
          </span>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------ çizim parçaları

const Stairs: React.FC = () => (
  <g>
    {[0, 1, 2, 3, 4].map((k) => (
      <rect key={k} x={140 + k * 170} y={1030 + k * 95} width={1000} height={95} fill={k % 2 ? "#d9c39b" : "#cfb68b"} stroke={INK} strokeWidth={7} />
    ))}
    <line x1={60} y1={1030} x2={140} y2={1030} stroke={INK} strokeWidth={7} />
    <rect x={-20} y={1030} width={160} height={600} fill="#cfb68b" stroke={INK} strokeWidth={7} />
  </g>
);

const Sweat: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const k = (t * 1.6) % 1;
  return <path transform={`translate(${x},${y + k * 60})`} d="M0,-22 C14,0 16,10 0,20 C-16,10 -14,0 0,-22 Z" fill="#8fd3ff" stroke={INK} strokeWidth={5} opacity={1 - k} />;
};

const Burst: React.FC<{ x: number; y: number; text: string; p: number; color?: string; rot?: number; size?: number }> = ({ x, y, text, p, color = "#ff5a4e", rot = -8, size = 1 }) => {
  if (p <= 0) return null;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 ? 95 : 130;
    return `${Math.cos(a) * r * 1.3},${Math.sin(a) * r}`;
  }).join(" ");
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${p * size})`}>
      <polygon points={pts} fill={color} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <text y={22} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={68} fill="#fff" stroke={INK} strokeWidth={10} paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};

const Bottle: React.FC<{ x: number; y: number; p: number; cross: number }> = ({ x, y, p, cross }) => (
  <g transform={`translate(${x},${y}) scale(${p}) rotate(${(1 - p) * 20})`} opacity={Math.min(1, p * 2)}>
    <rect x={-35} y={-210} width={70} height={60} rx={10} fill="#e0e6ee" stroke={INK} strokeWidth={7} />
    <path d="M-35,-150 L-100,40 Q-110,90 -60,90 L60,90 Q110,90 100,40 L35,-150 Z" fill="#cfeeff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-80,0 L80,0 L98,45 Q105,82 60,82 L-60,82 Q-105,82 -98,45 Z" fill="#9ae6b4" opacity={0.9} />
    <rect x={-85} y={-80} width={170} height={56} rx={10} fill="#fff" stroke={INK} strokeWidth={5} />
    <text y={-42} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={26} fill={INK}>
      LAKTİK ASİT
    </text>
    <g opacity={cross > 0 ? 1 : 0}>
      <line x1={-150} y1={-230} x2={-150 + 300 * cross} y2={-230 + 340 * cross} stroke="#ff4b3e" strokeWidth={26} strokeLinecap="round" />
      <line x1={150} y1={-230} x2={150 - 300 * cross} y2={-230 + 340 * cross} stroke="#ff4b3e" strokeWidth={26} strokeLinecap="round" />
    </g>
  </g>
);

/** kasın içi: çizgili lif sosisleri */
const FIBERS = [760, 930, 1100];
const FiberRow: React.FC<{ y: number; stretch: number; thick: number; t: number; idx: number }> = ({ y, stretch, thick, t, idx }) => {
  const w = 860 * (1 + 0.12 * stretch);
  const h = 130 * thick;
  const x = 540 - w / 2;
  return (
    <g>
      <rect x={x} y={y - h / 2} width={w} height={h} rx={h / 2} fill={MUSCLE} stroke={INK} strokeWidth={8} />
      {Array.from({ length: 22 }).map((_, k) => {
        const sx = x + 40 + k * ((w - 80) / 21);
        return <line key={k} x1={sx} y1={y - h / 2 + 14} x2={sx} y2={y + h / 2 - 14} stroke={MUSCLE_D} strokeWidth={6} strokeLinecap="round" opacity={0.75} />;
      })}
      <rect x={x + 30} y={y - h / 2 + 14} width={w - 60} height={14} rx={7} fill="#fff" opacity={0.35} />
      {/* gerilme okları */}
      {stretch > 0.05 && idx === 1 ? (
        <g opacity={stretch} stroke={INK} strokeWidth={9} strokeLinecap="round" fill="none">
          <path d={`M${x - 30},${y} l-60,0 m25,-25 l-25,25 l25,25`} />
          <path d={`M${x + w + 30},${y} l60,0 m-25,-25 l25,25 l-25,25`} />
        </g>
      ) : null}
      {void t}
    </g>
  );
};

const TEARS: [number, number][] = [
  [330, 760],
  [640, 930],
  [430, 1100],
  [760, 1100],
];

const Tear: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) =>
  p > 0 ? (
    <g transform={`translate(${x},${y}) scale(${p})`}>
      <path d="M-10,-60 L12,-25 L-12,0 L12,25 L-10,60" stroke="#5a1520" strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-10,-60 L12,-25 L-12,0 L12,25 L-10,60" stroke="#ff9a9a" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ) : null;

const Star: React.FC<{ x: number; y: number; s: number; color?: string }> = ({ x, y, s, color = Y }) => (
  <path
    transform={`translate(${x},${y}) scale(${s})`}
    d="M0,-30 L8,-9 L30,-9 L12,4 L19,26 L0,12 L-19,26 L-12,4 L-30,-9 L-8,-9 Z"
    fill={color}
    stroke={INK}
    strokeWidth={5}
    strokeLinejoin="round"
  />
);

/** sevimli tamir hücresi: kask + anahtar */
const Fixer: React.FC<{ x: number; y: number; t: number; k: number }> = ({ x, y, t, k }) => {
  const hop = Math.abs(Math.sin(t * 9 + k)) * -18;
  return (
    <g transform={`translate(${x},${y + hop})`}>
      <circle r={46} fill="#fffaf0" stroke={INK} strokeWidth={7} />
      <circle cx={-15} cy={-4} r={6} fill={INK} />
      <circle cx={15} cy={-4} r={6} fill={INK} />
      <path d="M-14,14 Q0,26 14,14" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M-46,-22 Q-44,-70 0,-72 Q44,-70 46,-22 Z" fill="#f2c94c" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-54} y={-28} width={108} height={14} rx={7} fill="#f2c94c" stroke={INK} strokeWidth={6} />
      <g transform={`translate(50,20) rotate(${Math.sin(t * 10 + k) * 25})`}>
        <rect x={-6} y={-6} width={12} height={46} rx={5} fill="#b8c0cc" stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={-10} r={13} fill="#b8c0cc" stroke={INK} strokeWidth={5} />
      </g>
    </g>
  );
};

const Bandage: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) =>
  p > 0 ? (
    <g transform={`translate(${x},${y}) rotate(-20) scale(${p})`}>
      <rect x={-70} y={-26} width={140} height={52} rx={26} fill="#f7d7b0" stroke={INK} strokeWidth={6} />
      <rect x={-24} y={-26} width={48} height={52} fill="#efc394" stroke={INK} strokeWidth={4} />
      {[-10, 10].map((dx) => [-10, 10].map((dy) => <circle key={`${dx}${dy}`} cx={dx} cy={dy} r={3} fill={INK} opacity={0.5} />))}
    </g>
  ) : null;

const Brain: React.FC<{ x: number; y: number; t: number; p: number }> = ({ x, y, t, p }) => (
  <g transform={`translate(${x},${y}) scale(${p})`}>
    <path d="M-90,10 C-120,-40 -80,-95 -30,-85 C-10,-120 60,-115 70,-70 C120,-60 120,10 85,25 C85,70 20,80 0,55 C-30,80 -100,65 -90,10 Z" fill="#f6b3c4" stroke={INK} strokeWidth={7} />
    <path d="M-50,-40 Q-20,-20 -40,10 M10,-70 Q0,-30 30,-20 M40,10 Q20,30 50,45" stroke="#c97a8f" strokeWidth={6} fill="none" strokeLinecap="round" />
    <circle cx={-25} cy={-5} r={7} fill={INK} />
    <circle cx={25} cy={-5} r={7} fill={INK} />
    <ellipse cx={0} cy={25} rx={12} ry={14} fill="#7a2a2a" stroke={INK} strokeWidth={4} transform={`scale(1,${0.8 + 0.2 * Math.sin(t * 12)})`} />
  </g>
);

const Bubble: React.FC<{ x: number; y: number; text: string; p: number }> = ({ x, y, text, p }) =>
  p > 0 ? (
    <g transform={`translate(${x},${y}) scale(${p})`}>
      <rect x={-150} y={-60} width={300} height={110} rx={50} fill="#fff" stroke={INK} strokeWidth={7} />
      <path d="M-30,48 L-60,95 L10,48 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={-34} y={40} width={50} height={12} fill="#fff" />
      <text y={14} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={58} fill="#e5383b">
        {text}
      </text>
    </g>
  ) : null;

/** 1–3 gün kartları */
const DayCards: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const lv = [0.35, 0.95, 0.65];
  const ex: Expr[] = ["think", "ouch", "grit"];
  return (
    <g>
      {[0, 1, 2].map((d) => {
        const p = pop(t, s + d * 0.22, 30, 11);
        const x = 220 + d * 320;
        const fill = lv[d] * sm(t, s + 0.4 + d * 0.2, s + 0.9 + d * 0.2);
        return (
          <g key={d} transform={`translate(${x},1000) scale(${p})`} opacity={Math.min(1, p * 2)}>
            <rect x={-140} y={-300} width={280} height={560} rx={36} fill="#fffaf0" stroke={INK} strokeWidth={8} />
            <text y={-230} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={50} fill={INK}>
              {d + 1}. GÜN
            </text>
            <g transform="translate(0,150) scale(0.36)">
              <ToonGirl2D expr={ex[d]} pose={{}} />
            </g>
            <rect x={-100} y={185} width={200} height={40} rx={20} fill="#efe2c8" stroke={INK} strokeWidth={6} />
            <rect x={-97} y={188} width={194 * fill} height={34} rx={17} fill={d === 1 ? "#ff5a4e" : "#ffa94d"} />
          </g>
        );
      })}
    </g>
  );
};

/** öneri simgeleri */
const Tip: React.FC<{ x: number; y: number; p: number; kind: number; t: number }> = ({ x, y, p, kind, t }) => (
  <g transform={`translate(${x},${y}) scale(${p})`} opacity={Math.min(1, p * 2)}>
    <circle r={105} fill="#fffaf0" stroke={INK} strokeWidth={8} />
    {kind === 0 ? (
      <g>
        <path d="M-60,20 Q-62,-30 -30,-30 L10,-28 Q30,-10 55,-2 Q75,4 70,30 L-60,30 Z" fill="#5fa89a" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <rect x={-64} y={28} width={138} height={16} rx={8} fill="#fff" stroke={INK} strokeWidth={6} />
      </g>
    ) : null}
    {kind === 1 ? (
      <g>
        <path d="M20,-60 A62,62 0 1 0 50,40 A50,50 0 1 1 20,-60 Z" fill="#f2c94c" stroke={INK} strokeWidth={7} />
        <text x={40} y={-30} fontFamily={SANS} fontWeight={800} fontSize={38} fill={INK} opacity={0.5 + 0.5 * Math.sin(t * 4)}>
          z
        </text>
      </g>
    ) : null}
    {kind === 2 ? (
      <g>
        <ellipse rx={56} ry={70} fill="#fff" stroke={INK} strokeWidth={7} />
        <circle cy={10} r={30} fill="#ffb627" stroke={INK} strokeWidth={5} />
      </g>
    ) : null}
    {kind === 3 ? (
      <g>
        <path d="M-45,-60 L45,-60 L35,70 L-35,70 Z" fill="#dff4ff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d={`M-40,${-5 + Math.sin(t * 3) * 5} L40,${-5 - Math.sin(t * 3) * 5} L35,66 L-35,66 Z`} fill="#6cc4ff" />
        <path d="M-45,-60 L45,-60 L35,70 L-35,70 Z" fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      </g>
    ) : null}
    <g transform="translate(70,70)" opacity={p > 0.9 ? 1 : 0}>
      <circle r={30} fill="#3ccf6e" stroke={INK} strokeWidth={6} />
      <path d="M-12,0 L-3,10 L14,-10" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </g>
);

// ------------------------------------------------------------ ana video

export const KasAgrisiToon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl = TOON_TL;
  const L = tl.at;
  const blink = blinkAt(t);

  // sahneler: dış (0–2), iç (2–6), dış (7–10)
  const zoomIn = sm(t, L(2) + 0.7, L(2) + 1.4); // bacağa dalış
  const inside = t > L(2) + 0.9 && t < L(7) + 0.3;
  const insideIn = sm(t, L(2) + 0.9, L(2) + 1.4);
  const insideOut = sm(t, L(7) - 0.25, L(7) + 0.2);

  // kızın pozu ve yüzü
  let pose: ToonPose = { armL: 10, armR: 10 };
  let expr: Expr = "smile";
  let gx = 540;
  let gy = 1330;
  let shake = 0;
  let gScale = 1;
  if (t < L(1)) {
    // merdiven: titrek bacaklar, bir basamak iner
    const step = sm(t, 0.9, 1.5);
    gx = 360 + step * 170;
    gy = 1030 + step * 95 - Math.sin(step * Math.PI) * 40;
    pose = { armL: 35 + Math.sin(t * 9) * 8, armR: 35, elbowL: 20, elbowR: 20, legL: -8 + step * 14, legR: 8 - step * 10, lean: -4 };
    expr = "ouch";
    shake = 1;
    gScale = 0.82;
  } else if (t < L(2)) {
    gx = 330;
    gy = 1330;
    pose = { armL: 20, armR: 60, elbowR: 70, head: -6 };
    expr = "think";
  } else if (t < L(7)) {
    gx = 540;
    gy = 1330;
    pose = { armL: 10, armR: 10 };
    expr = "grit";
    shake = 0.4;
  } else if (t < L(8)) {
    gx = 540;
    gy = 1350;
    pose = { armL: 10, armR: 10 };
    expr = "ouch";
  } else if (t < L(9)) {
    const f = sm(t, L(8), L(8) + 0.4);
    pose = { armL: 10, armR: 90 * f, elbowR: 110 * f };
    expr = "happy";
  } else if (t < L(10)) {
    pose = { armL: 25, armR: 25 };
    expr = "smile";
  } else {
    pose = { armL: 10, armR: 120, elbowR: 40 + Math.sin(t * 10) * 15 };
    expr = "wink";
  }
  const showGirl = t < L(2) + 1.5 || t > L(8);
  const girlAt9 = t >= L(9) && t < L(10); // öneriler: kız küçük ortada
  if (girlAt9) {
    gScale = 0.62;
    gy = 1180;
  }

  const zoomTf = `translate(${540},${1100}) scale(${1 + zoomIn * 5}) translate(${-540 + 0},${-1100})`;

  return (
    <AbsoluteFill lang="tr" style={{ background: PAPER, overflow: "hidden" }}>
      <Paper t={t} />

      {/* ---- dış sahneler ---- */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={t > L(2) && t < L(7) ? zoomTf : undefined} opacity={t > L(2) && t < L(7) ? 1 - insideIn : 1}>
          {t < L(1) + 0.2 ? (
            <g opacity={1 - sm(t, L(1) - 0.15, L(1) + 0.15)}>
              <Stairs />
              <Burst x={760} y={560} text="AH!" p={pop(t, 0.35, 30, 9)} />
              <Sweat x={gx + 100} y={gy - 760} t={t} />
              <Sweat x={gx - 110} y={gy - 720} t={t + 0.4} />
            </g>
          ) : null}
          {t >= L(1) - 0.1 && t < L(2) + 0.3 ? (
            <g opacity={win(t, L(1) - 0.1, L(2) + 0.3, 0.2)}>
              <Bottle x={760} y={1000} p={pop(t, L(1), 30, 11)} cross={sm(t, L(1) + 0.6, L(1) + 0.9)} />
            </g>
          ) : null}
          {showGirl && !girlAt9 ? (
            <ToonGirl2D x={t >= L(2) && t < L(7) ? 540 : gx} y={gy} scale={gScale} pose={pose} expr={expr} blink={blink} shake={shake} t={t} />
          ) : null}
          {/* büyüteç: bacağa iner */}
          {t > L(2) - 0.05 && t < L(2) + 1.0 ? (
            <g opacity={sm(t, L(2), L(2) + 0.2)} transform={`translate(${interpolate(sm(t, L(2), L(2) + 0.6), [0, 1], [820, 500])},${interpolate(sm(t, L(2), L(2) + 0.6), [0, 1], [700, 1100])})`}>
              <circle r={90} fill="#ffffff" opacity={0.35} stroke={INK} strokeWidth={12} />
              <line x1={64} y1={64} x2={150} y2={150} stroke={INK} strokeWidth={26} strokeLinecap="round" />
            </g>
          ) : null}
        </g>

        {/* güçlü kas (8): kol yanında yıldızlar */}
        {t > L(8) && t < L(9) ? (
          <g>
            {[0, 1, 2].map((k) => (
              <Star key={k} x={720 + k * 60} y={620 - k * 70} s={pop(t, L(8) + 0.4 + k * 0.15) * (0.9 + 0.2 * Math.sin(t * 8 + k))} />
            ))}
            <Burst x={260} y={520} text="GÜÇLÜ!" p={pop(t, L(8) + 0.5, 30, 9)} color="#3ccf6e" rot={6} size={0.9} />
          </g>
        ) : null}

        {/* 1–3 gün (7) */}
        {t > L(7) - 0.1 && t < L(8) ? <g opacity={win(t, L(7) - 0.1, L(8), 0.2)}><DayCards t={t} s={L(7)} /></g> : null}

        {/* öneriler (9) */}
        {girlAt9 ? (
          <g>
            <ToonGirl2D x={540} y={gy} scale={gScale} pose={pose} expr={expr} blink={blink} t={t} />
            {[
              [250, 640],
              [830, 640],
              [250, 1020],
              [830, 1020],
            ].map(([x, y], k) => (
              <Tip key={k} x={x} y={y} p={pop(t, L(9) + 0.1 + k * 0.4, 30, 10)} kind={k} t={t} />
            ))}
          </g>
        ) : null}

        {/* kaydet (10) */}
        {t > L(10) ? (
          <g transform={`translate(540,330) scale(${pop(t, L(10) + 0.2, 30, 10) * (1 - 0.08 * Math.max(0, Math.sin((t - L(10) - 0.9) * 6)) * (t > L(10) + 0.9 && t < L(10) + 1.4 ? 1 : 0))})`}>
            <rect x={-240} y={-80} width={480} height={160} rx={80} fill="#ff5a4e" stroke={INK} strokeWidth={9} />
            <path d="M-170,-40 H-110 V48 L-140,26 L-170,48 Z" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <text x={40} y={24} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={72} fill="#fff" stroke={INK} strokeWidth={10} paintOrder="stroke">
              KAYDET
            </text>
            {/* parmak dokunuşu */}
            {t > L(10) + 0.8 ? <circle cx={150} cy={10} r={30 + 40 * sm(t, L(10) + 0.9, L(10) + 1.4)} fill="none" stroke="#fff" strokeWidth={8} opacity={1 - sm(t, L(10) + 0.9, L(10) + 1.4)} /> : null}
          </g>
        ) : null}
      </svg>

      {/* ---- kasın içi ---- */}
      {inside ? (
        <AbsoluteFill style={{ opacity: insideIn * (1 - insideOut) }}>
          <Paper t={t} tint="#f7dccf" />
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <clipPath id="dive">
                <circle cx={540} cy={1000} r={80 + 1400 * insideIn} />
              </clipPath>
            </defs>
            <g clipPath="url(#dive)">
              {(() => {
                const stretch = t > L(3) && t < L(5) ? (1 - Math.cos((t - L(3)) * 3.2)) / 2 : 0;
                const swell = sm(t, L(6), L(6) + 0.6) * (1 - sm(t, L(7) - 0.4, L(7)));
                return FIBERS.map((y, k) => <FiberRow key={k} y={y} stretch={stretch} thick={1 + 0.12 * swell} t={t} idx={k} />);
              })()}
              {/* yırtıklar */}
              {TEARS.map(([x, y], k) => (
                <Tear key={k} x={x} y={y} p={pop(t, L(4) + 0.15 + k * 0.18, 30, 8) * (1 - sm(t, L(5) + 1.0 + k * 0.15, L(5) + 1.3 + k * 0.15))} />
              ))}
              {t > L(4) && t < L(5) + 0.3
                ? TEARS.map(([x, y], k) => <Star key={k} x={x + 50} y={y - 60} s={pop(t, L(4) + 0.2 + k * 0.18) * Math.max(0, Math.sin((t - L(4)) * 7 + k))} color="#ff8a5c" />)
                : null}
              {t > L(4) + 0.4 && t < L(5) ? <Burst x={820} y={560} text="ÇIT!" p={pop(t, L(4) + 0.4, 30, 9)} size={0.75} /> : null}
              {/* tamir ekibi */}
              {t > L(5) - 0.1
                ? TEARS.map(([x, y], k) => {
                    const st = L(5) + k * 0.15;
                    const p = sm(t, st, st + 0.9);
                    const fx = -100 + (x + 40 + 100) * p;
                    return <Fixer key={k} x={fx} y={y - 110} t={t} k={k} />;
                  })
                : null}
              {TEARS.map(([x, y], k) => (
                <Bandage key={k} x={x} y={y} p={pop(t, L(5) + 1.0 + k * 0.15, 30, 10)} />
              ))}
              {/* sinir → beyin */}
              {t > L(6) - 0.1 ? (
                <g opacity={sm(t, L(6) - 0.1, L(6) + 0.3)}>
                  <path d="M640,930 C660,800 760,720 820,600 C850,540 860,470 860,420" stroke="#f2c94c" strokeWidth={14} fill="none" strokeLinecap="round" />
                  <path d="M640,930 C660,800 760,720 820,600 C850,540 860,470 860,420" stroke={INK} strokeWidth={4} fill="none" strokeDasharray="2 22" strokeLinecap="round" />
                  {[0, 1, 2].map((k) => {
                    const u = (t * 1.6 + k / 3) % 1;
                    const bx = 640 + (860 - 640) * u + Math.sin(u * Math.PI) * 120;
                    const by = 930 + (420 - 930) * u;
                    return <circle key={k} cx={bx} cy={by} r={14} fill="#fff6a8" stroke={INK} strokeWidth={4} />;
                  })}
                  <Brain x={860} y={330} t={t} p={pop(t, L(6) + 0.2, 30, 10)} />
                  <Bubble x={500} y={260} text="ACIYOR!" p={pop(t, L(6) + 0.7, 30, 9)} />
                  {/* şişlik: su damlaları */}
                  {Array.from({ length: 8 }).map((_, k) => (
                    <path
                      key={k}
                      transform={`translate(${180 + k * 100},${k % 2 ? 1230 : 640}) scale(${pop(t, L(6) + k * 0.06)})`}
                      d="M0,-20 C12,0 14,8 0,18 C-14,8 -12,0 0,-20 Z"
                      fill="#8fd3ff"
                      stroke={INK}
                      strokeWidth={4}
                    />
                  ))}
                </g>
              ) : null}
            </g>
          </svg>
        </AbsoluteFill>
      ) : null}

      <Captions t={t} tl={tl} />
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: interpolate(t, [0, 0.12, tl.total - 0.3, tl.total], [0.6, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
