/**
 * Örnek 3 — "Taş ustası" (eski kâğıt üstüne karakalem çizim, kısa hikâye → spor dersi).
 * Sessiz örnek: zaman satırlardan hesaplanır, ses yok.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS, SERIF, loadFonts } from "../fonts";
import { type Line, Subtitle, pop, sm, timeline, win } from "../ornek/common";

loadFonts();

const INK = "#2b2117";
const C = { paper: "#e8d9b8", gold: "#ffd23f", red: "#c8322b", nerve: "#f2b51c" };

export const TAS_LINES: Line[] = [
  { text: "Bir taş ustası, dev bir kayaya vurmaya başladı.", hl: ["kayaya"] },
  { text: "Bir, iki, on, elli… Kayada tek bir çizik bile yok.", hl: ["tek", "çizik"] },
  { text: "Yine de vurmaya devam etti.", hl: ["devam"] },
  { text: "Yüz birinci vuruşta kaya ikiye ayrıldı.", hl: ["ikiye"] },
  { text: "Peki kayayı o son vuruş mu kırdı?", hl: ["son", "vuruş"] },
  { text: "Hayır. Ondan önceki yüz vuruş.", hl: ["yüz", "vuruş."] },
  { text: "Spor da böyle. İlk haftalarda aynada fark göremezsin.", hl: ["fark", "göremezsin."] },
  { text: "Ama içeride değişim başladı: sinir sistemin, kaslarını daha iyi kullanmayı öğreniyor.", hl: ["sinir", "sistemin,"] },
  { text: "Görünen değişim, görünmeyen tekrarların üstüne gelir.", hl: ["görünmeyen", "tekrarların"] },
  { text: "Sen şu an kaçıncı vuruştasın?", hl: ["kaçıncı"], hold: 1.2 },
];

export const TAS_TL = timeline(TAS_LINES, 0.3);

// ------------------------------------------------------------ kâğıt

const Paper: React.FC<{ t: number }> = ({ t }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} />
        <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0.35 0" />
      </filter>
      <filter id="blot">
        <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={9} />
        <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.15  0 0 0 0.5 -0.1" />
      </filter>
      <radialGradient id="pv" cx="50%" cy="45%" r="75%">
        <stop offset="0.45" stopColor="#5a3d1c" stopOpacity={0} />
        <stop offset="1" stopColor="#3b240c" stopOpacity={0.75} />
      </radialGradient>
      <linearGradient id="ray" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff6dc" stopOpacity={0.55} />
        <stop offset="1" stopColor="#fff6dc" stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill={C.paper} />
    <rect width={1080} height={1920} filter="url(#blot)" />
    <rect width={1080} height={1920} filter="url(#noise)" opacity={0.5} />
    {[0, 1, 2, 3].map((i) => (
      <polygon
        key={i}
        points={`${-100 + i * 170},-50 ${40 + i * 170},-50 ${720 + i * 260},1500 ${520 + i * 230},1500`}
        fill="url(#ray)"
        opacity={0.35 + 0.15 * Math.sin(t * 0.8 + i)}
      />
    ))}
    <rect width={1080} height={1920} fill="url(#pv)" />
  </svg>
);

/** Kalemle çiziliyormuş gibi beliren yol */
const Draw: React.FC<{ d: string; k: number; w?: number; color?: string; fill?: string }> = ({ d, k, w = 9, color = INK, fill = "none" }) => (
  <path
    d={d}
    pathLength={1}
    strokeDasharray={1}
    strokeDashoffset={1 - k}
    stroke={color}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
    fill={fill}
  />
);

const Ground: React.FC<{ k: number }> = ({ k }) => (
  <g opacity={0.8}>
    <Draw d="M60,1215 C300,1205 700,1225 1020,1212" k={k} w={6} />
    <Draw d="M140,1260 l60,25 l90,-10 M420,1250 l50,40 l110,5 M700,1265 l80,-15 l70,30 M250,1320 l120,10 M620,1330 l90,-12" k={k} w={4} />
  </g>
);

/** Çöp adam: omuz noktasına göre kollar açıyla verilir */
const Stick: React.FC<{
  x: number;
  y: number;
  k: number;
  armR: number;
  armL: number;
  lean?: number;
  children?: React.ReactNode;
  scale?: number;
}> = ({ x, y, k, armR, armL, lean = 0, children, scale = 1 }) => {
  const sh = { x: 0, y: -235 };
  const hand = (a: number) => `M${sh.x},${sh.y} L${sh.x + Math.sin(a) * 120},${sh.y + Math.cos(a) * 120}`;
  return (
    <g transform={`translate(${x},${y}) scale(${scale}) rotate(${lean})`}>
      <Draw d="M0,-150 L-45,0 M0,-150 L45,0" k={k} />
      <Draw d="M0,-150 L0,-260" k={k} />
      <circle cx={0} cy={-300} r={40} fill={C.paper} stroke={INK} strokeWidth={9} opacity={k} />
      <Draw d={hand(armL)} k={k} />
      <g>
        <Draw d={hand(armR)} k={k} />
        {children ? (
          <g transform={`translate(${sh.x + Math.sin(armR) * 120},${sh.y + Math.cos(armR) * 120}) rotate(${(-armR * 180) / Math.PI})`} opacity={k}>
            {children}
          </g>
        ) : null}
      </g>
    </g>
  );
};

const Hammer: React.FC = () => (
  <g>
    <line x1={0} y1={0} x2={0} y2={110} stroke="#6b4a2a" strokeWidth={12} strokeLinecap="round" />
    <rect x={-45} y={95} width={90} height={42} rx={6} fill="#4a4a4a" stroke={INK} strokeWidth={6} />
  </g>
);

const ROCK = "M560,1215 L585,960 L650,850 L760,800 L880,830 L960,930 L985,1080 L975,1215 Z";
const ROCK_L = "M560,1215 L585,960 L650,850 L760,800 L775,900 L745,1010 L790,1110 L760,1215 Z";
const ROCK_R = "M760,800 L880,830 L960,930 L985,1080 L975,1215 L760,1215 L790,1110 L745,1010 L775,900 Z";
const CRACK = "M760,800 L775,900 L745,1010 L790,1110 L760,1215";

const Hatch: React.FC<{ clip: string; id: string }> = ({ clip, id }) => (
  <g>
    <clipPath id={id}>
      <path d={clip} />
    </clipPath>
    <g clipPath={`url(#${id})`} opacity={0.35}>
      {Array.from({ length: 30 }).map((_, i) => (
        <line key={i} x1={560 + i * 22} y1={1215} x2={760 + i * 22} y2={800} stroke={INK} strokeWidth={3} />
      ))}
      <rect x={860} y={780} width={200} height={460} fill="#5b4329" opacity={0.6} />
    </g>
  </g>
);

const Dust: React.FC<{ t: number; at: number; x: number; y: number }> = ({ t, at, x, y }) => {
  const k = sm(t, at, at + 1.2);
  if (k <= 0 || k >= 1) return null;
  return (
    <g opacity={1 - k}>
      {Array.from({ length: 9 }).map((_, i) => {
        const a = (i / 9) * Math.PI - Math.PI;
        return <circle key={i} cx={x + Math.cos(a) * 140 * k} cy={y + Math.sin(a) * 90 * k} r={18 + 30 * k} fill="#b59a72" opacity={0.6} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------ sahneler

/** 1–5. satırlar: usta ve kaya */
const RockScene: React.FC<{ t: number; L: (i: number) => number }> = ({ t, L }) => {
  const k = sm(t, L(0), L(0) + 1.2);
  // vuruş temposu: başta yavaş, sayaçla hızlanır
  const hitPeriod = t < L(1) ? 0.9 : t < L(2) ? 0.42 : 0.6;
  const phase = ((t - L(0)) % hitPeriod) / hitPeriod;
  const swinging = t > L(0) + 0.8 && t < L(3) + 0.5;
  const swing = swinging ? (phase < 0.75 ? -2.6 + 2.0 * (phase / 0.75) : -0.6 - 2.0 * ((phase - 0.75) / 0.25)) : -0.6;
  const armR = Math.PI - (Math.PI + swing);
  const split = sm(t, L(3) + 0.5, L(3) + 1.1);
  const crack = sm(t, L(3) + 0.1, L(3) + 0.5);
  const hitShake = swinging && phase < 0.08 ? Math.sin(t * 120) * 4 : 0;
  const count = Math.round(
    interpolate(t, [L(0) + 0.8, L(1), L(2), L(3)], [1, 4, 60, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  const shown = t > L(3) + 0.2 ? 101 : count;
  return (
    <g>
      <Ground k={k} />
      <g transform={`translate(${hitShake},0)`}>
        <g transform={`translate(${-60 * split},0) rotate(${-6 * split},560,1215)`}>
          <path d={split > 0 ? ROCK_L : ROCK} fill="#c9b48d" opacity={k} />
          <Hatch clip={split > 0 ? ROCK_L : ROCK} id="hl" />
          <Draw d={split > 0 ? ROCK_L : ROCK} k={k} w={8} />
        </g>
        {split > 0 ? (
          <g transform={`translate(${60 * split},0) rotate(${6 * split},975,1215)`}>
            <path d={ROCK_R} fill="#c9b48d" />
            <Hatch clip={ROCK_R} id="hr" />
            <Draw d={ROCK_R} k={1} w={8} />
          </g>
        ) : null}
        {crack > 0 && split === 0 ? <Draw d={CRACK} k={crack} w={7} color={C.red} /> : null}
      </g>
      <Dust t={t} at={L(3) + 0.5} x={770} y={1200} />
      <Stick x={360} y={1215} k={k} armR={armR} armL={0.5} lean={swinging ? 4 : 0}>
        <Hammer />
      </Stick>
      {/* vuruş sayacı */}
      <g opacity={sm(t, L(0) + 0.8, L(0) + 1.1) * (1 - sm(t, L(4) - 0.2, L(4)))}>
        <text x={540} y={560} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={shown === 101 ? 230 : 200} fill={shown === 101 ? C.red : INK}>
          {shown}
        </text>
        <text x={540} y={640} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={40} fill={INK} letterSpacing={6}>
          VURUŞ
        </text>
      </g>
    </g>
  );
};

/** 5–6. satırlar: 100 çentik + 1 kırmızı */
const Tally: React.FC<{ t: number; L: (i: number) => number }> = ({ t, L }) => {
  const one = pop(t, L(4) + 0.2);
  const many = sm(t, L(5) + 0.2, L(5) + 1.6);
  return (
    <g>
      <g transform={`translate(540,520) scale(${one})`}>
        <line x1={0} y1={-90} x2={0} y2={90} stroke={C.red} strokeWidth={16} strokeLinecap="round" />
        <text y={160} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={60} fill={C.red}>
          101.
        </text>
      </g>
      {Array.from({ length: 100 }).map((_, i) => {
        const col = i % 20;
        const row = Math.floor(i / 20);
        const x = 160 + col * 38;
        const y = 790 + row * 105;
        const shown = i / 100 < many;
        if (!shown) return null;
        return <line key={i} x1={x} y1={y} x2={x + (col % 5 === 4 ? -130 : 4)} y2={y + 70} stroke={INK} strokeWidth={7} strokeLinecap="round" opacity={col % 5 === 4 ? 0.85 : 1} />;
      })}
    </g>
  );
};

/** 7. satır: ayna */
const Mirror: React.FC<{ t: number; L: (i: number) => number }> = ({ t, L }) => {
  const k = sm(t, L(6), L(6) + 1.0);
  const curl = (Math.sin((t - L(6)) * 4) + 1) / 2;
  const armR = 0.3 + curl * 2.3;
  const db = (
    <g>
      <rect x={-40} y={-10} width={80} height={20} fill={INK} />
      <rect x={-55} y={-28} width={22} height={56} rx={5} fill={INK} />
      <rect x={33} y={-28} width={22} height={56} rx={5} fill={INK} />
    </g>
  );
  const q = pop(t, L(6) + 1.0);
  return (
    <g>
      <Ground k={k} />
      <Stick x={330} y={1215} k={k} armR={armR} armL={0.15}>
        {db}
      </Stick>
      <g opacity={k}>
        <rect x={600} y={620} width={340} height={600} rx={170} fill="#d9e3e3" stroke={INK} strokeWidth={10} />
        <line x1={650} y1={720} x2={720} y2={650} stroke="white" strokeWidth={10} strokeLinecap="round" opacity={0.8} />
        <g transform="translate(770,1150) scale(-0.65,0.65)" opacity={0.75}>
          <Stick x={0} y={0} k={1} armR={armR} armL={0.15}>
            {db}
          </Stick>
        </g>
      </g>
      <g transform={`translate(770,560) scale(${q})`}>
        <text textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={200} fill={C.red}>
          ?
        </text>
      </g>
    </g>
  );
};

/** 8. satır: sinir ağı parlıyor */
const Nerves: React.FC<{ t: number; L: (i: number) => number }> = ({ t, L }) => {
  const k = sm(t, L(7) + 0.3, L(7) + 1.8);
  const pulse = 0.6 + 0.4 * Math.sin(t * 8);
  const paths = [
    "M540,640 L540,820 L540,960",
    "M540,800 L470,860 L420,950",
    "M540,800 L610,860 L660,950",
    "M540,960 L500,1080 L480,1200",
    "M540,960 L580,1080 L600,1200",
  ];
  return (
    <g>
      <g transform="translate(540,1215) scale(1.6) translate(-540,-1215)" opacity={0.35}>
        <Stick x={540} y={1215} k={1} armR={0.5} armL={-0.5} />
      </g>
      <circle cx={540} cy={560} r={70} fill={C.nerve} opacity={0.25 * k * pulse} />
      {paths.map((d, i) => (
        <g key={i}>
          <Draw d={d} k={k} w={20} color={C.nerve} />
          <Draw d={d} k={k} w={6} color="#fff3c4" />
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((i) => {
        const p = ((t * 0.9 + i * 0.2) % 1) * k;
        const d = [
          [540, 640, 540, 960],
          [540, 800, 420, 950],
          [540, 800, 660, 950],
          [540, 960, 480, 1200],
          [540, 960, 600, 1200],
        ][i];
        return <circle key={i} cx={d[0] + (d[2] - d[0]) * p} cy={d[1] + (d[3] - d[1]) * p} r={14} fill="white" opacity={k} />;
      })}
    </g>
  );
};

/** 9. satır: buzdağı gibi — yerin altında görünmeyen bloklar */
const Blocks: React.FC<{ t: number; L: (i: number) => number }> = ({ t, L }) => {
  const s = L(8);
  const rows = [5, 4, 4, 3, 3, 2];
  let n = 0;
  return (
    <g>
      <rect x={0} y={760} width={1080} height={560} fill="#3b2a18" opacity={0.18} />
      <line x1={60} y1={760} x2={1020} y2={760} stroke={INK} strokeWidth={6} />
      <text x={90} y={740} fontFamily={SANS} fontWeight={700} fontSize={34} fill={INK} letterSpacing={4}>
        GÖRÜNEN
      </text>
      <text x={90} y={1290} fontFamily={SANS} fontWeight={700} fontSize={34} fill={INK} opacity={0.75} letterSpacing={4}>
        GÖRÜNMEYEN
      </text>
      {rows.map((cnt, r) =>
        Array.from({ length: cnt }).map((_, c) => {
          const i = n++;
          const p = pop(t, s + 0.15 + i * 0.06, 30, 14);
          const w = 130;
          const x = 540 - (cnt * w) / 2 + c * w;
          const y = 1170 - r * 82;
          return <rect key={`${r}-${c}`} x={x + 4} y={y - 80 * p + 80} width={w - 8} height={74} rx={6} fill="#c9b48d" stroke={INK} strokeWidth={6} opacity={p} />;
        }),
      )}
      {(() => {
        const p = pop(t, s + 1.6, 30, 10);
        return (
          <g transform={`translate(540,690) scale(${p})`}>
            <rect x={-80} y={-80} width={160} height={110} rx={8} fill={C.gold} stroke={INK} strokeWidth={7} />
          </g>
        );
      })()}
    </g>
  );
};

const Finale: React.FC<{ t: number; L: (i: number) => number }> = ({ t, L }) => {
  const k = sm(t, L(9), L(9) + 0.8);
  const p = pop(t, L(9) + 0.4, 30, 12);
  return (
    <g>
      <Ground k={k} />
      <Stick x={540} y={1215} k={k} armR={2.6} armL={0.4}>
        <Hammer />
      </Stick>
      <g transform={`translate(540,600) scale(${p})`}>
        <text textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={180} fill={INK}>
          ___. vuruş
        </text>
      </g>
    </g>
  );
};

// ------------------------------------------------------------ ana video

export const OrnekTasUstasi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tl = TAS_TL;
  const L = tl.at;
  const seg = (a: number, b: number, el: React.ReactNode) => {
    const o = win(t, L(a) - (a === 0 ? 0.4 : 0.15), L(b) + 0.15, 0.3);
    return o > 0 ? <g opacity={o}>{el}</g> : null;
  };
  return (
    <AbsoluteFill lang="tr" style={{ background: C.paper, overflow: "hidden" }}>
      <Paper t={t} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {seg(0, 4, <RockScene t={t} L={L} />)}
        {seg(4, 6, <Tally t={t} L={L} />)}
        {seg(6, 7, <Mirror t={t} L={L} />)}
        {seg(7, 8, <Nerves t={t} L={L} />)}
        {seg(8, 9, <Blocks t={t} L={L} />)}
        {seg(9, 10, <Finale t={t} L={L} />)}
      </svg>
      <Subtitle lines={TAS_LINES} tl={tl} t={t} color={C.gold} top={1420} size={60} stroke="#2b2117" />
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: interpolate(t, [0, 0.3, tl.total - 0.4, tl.total], [1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
