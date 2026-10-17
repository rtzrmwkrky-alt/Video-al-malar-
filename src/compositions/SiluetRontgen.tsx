/**
 * Yeni karakter denemesi: "silüet + röntgen". Genç simsiyah bir gölge; tarayıcı ışığı geçince içindeki
 * parlayan iskelet görünür, büyüme plakları yanar. Sessiz, ~7 sn.
 */
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SANS, loadFonts } from "../fonts";
import { sm } from "../ornek/common";

loadFonts();

export const SILUET_FRAMES = 30 * 7;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type P = [number, number];
const lerp = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** omuz presi pozu: p=0 bar omuzda, p=1 bar yukarıda */
const pose = (p: number) => {
  const hL: P = [372, 650 - 250 * p];
  const hR: P = [708, 650 - 250 * p];
  return {
    head: [540, 505] as P,
    neck: [540, 590] as P,
    shL: [458, 648] as P,
    shR: [622, 648] as P,
    elL: lerp([392, 770], [372, 540], p),
    elR: lerp([688, 770], [708, 540], p),
    hL,
    hR,
    hipL: [503, 950] as P,
    hipR: [577, 950] as P,
    knL: [490, 1145] as P,
    knR: [590, 1145] as P,
    anL: [484, 1318] as P,
    anR: [596, 1318] as P,
  };
};

const seg = (a: P, b: P) => `M${a[0]},${a[1]} L${b[0]},${b[1]}`;

const Barbell: React.FC<{ y: number; fill: string; plate?: string }> = ({ y, fill, plate }) => (
  <g>
    <rect x={232} y={y - 8} width={616} height={16} rx={8} fill={fill} />
    {[262, 300, 780, 818].map((x, i) => (
      <rect key={i} x={x - 18} y={y - (i % 3 === 0 ? 70 : 92)} width={36} height={i % 3 === 0 ? 140 : 184} rx={10} fill={plate ?? fill} />
    ))}
  </g>
);

/** simsiyah gölge genç */
const Silhouette: React.FC<{ p: number; c: string }> = ({ p, c }) => {
  const j = pose(p);
  const limb = (a: P, b: P, w: number) => <path d={seg(a, b)} stroke={c} strokeWidth={w} strokeLinecap="round" />;
  return (
    <g>
      <Barbell y={j.hL[1] - 6} fill={c} />
      {limb(j.hipL, j.knL, 82)}
      {limb(j.hipR, j.knR, 82)}
      {limb(j.knL, j.anL, 62)}
      {limb(j.knR, j.anR, 62)}
      <ellipse cx={j.anL[0] - 14} cy={1330} rx={52} ry={22} fill={c} />
      <ellipse cx={j.anR[0] + 14} cy={1330} rx={52} ry={22} fill={c} />
      <path d={`M${j.shL[0] - 22},${j.shL[1] - 8} Q540,${j.shL[1] - 34} ${j.shR[0] + 22},${j.shR[1] - 8} L600,890 Q590,975 540,978 Q490,975 480,890 Z`} fill={c} />
      <rect x={514} y={560} width={52} height={80} rx={18} fill={c} />
      {limb(j.shL, j.elL, 58)}
      {limb(j.shR, j.elR, 58)}
      {limb(j.elL, j.hL, 48)}
      {limb(j.elR, j.hR, 48)}
      <circle cx={j.hL[0]} cy={j.hL[1]} r={30} fill={c} />
      <circle cx={j.hR[0]} cy={j.hR[1]} r={30} fill={c} />
      {/* baş + dağınık saç */}
      <ellipse cx={540} cy={505} rx={70} ry={80} fill={c} />
      <path d="M468,492 L462,440 L490,452 L494,418 L524,440 L540,404 L560,438 L590,414 L594,452 L620,440 L614,494 Z" fill={c} />
    </g>
  );
};

const BONE = "#e9f7ff";

/** parlayan iskelet (aynı poz) */
const Skeleton: React.FC<{ p: number; glow: number; t: number }> = ({ p, glow, t }) => {
  const j = pose(p);
  const bone = (a: P, b: P, w: number) => (
    <g>
      <path d={seg(a, b)} stroke={BONE} strokeWidth={w} strokeLinecap="round" />
      <circle cx={a[0]} cy={a[1]} r={w * 0.85} fill={BONE} />
      <circle cx={b[0]} cy={b[1]} r={w * 0.85} fill={BONE} />
    </g>
  );
  /** büyüme plağı: kemik ucuna yakın parlayan bant */
  const plate = (a: P, b: P, k: number, w: number) => {
    const m = lerp(a, b, k);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy);
    const nx = (-dy / L) * w;
    const ny = (dx / L) * w;
    const pulse = 0.65 + 0.35 * Math.sin(t * 6);
    return (
      <path
        d={`M${m[0] - nx},${m[1] - ny} L${m[0] + nx},${m[1] + ny}`}
        stroke="#ffd23f"
        strokeWidth={9}
        strokeLinecap="round"
        opacity={glow * pulse}
        style={{ filter: "drop-shadow(0 0 10px #ffd23f) drop-shadow(0 0 22px #ff9f1c)" }}
      />
    );
  };
  return (
    <g>
      <Barbell y={j.hL[1] - 6} fill="rgba(233,247,255,0.35)" plate="rgba(233,247,255,0.22)" />
      <g style={{ filter: "drop-shadow(0 0 8px rgba(120,220,255,0.9))" }}>
        {/* bacaklar */}
        {bone(j.hipL, j.knL, 20)}
        {bone(j.hipR, j.knR, 20)}
        {bone(j.knL, j.anL, 16)}
        {bone(j.knR, j.anR, 16)}
        <circle cx={j.knL[0]} cy={j.knL[1]} r={14} fill="#bfe6ff" />
        <circle cx={j.knR[0]} cy={j.knR[1]} r={14} fill="#bfe6ff" />
        <path d={`M${j.anL[0]},${j.anL[1]} l-56,14`} stroke={BONE} strokeWidth={16} strokeLinecap="round" />
        <path d={`M${j.anR[0]},${j.anR[1]} l56,14`} stroke={BONE} strokeWidth={16} strokeLinecap="round" />
        {/* leğen */}
        <path d="M470,905 Q540,880 610,905 Q622,950 590,975 L560,960 Q540,990 520,960 L490,975 Q458,950 470,905 Z" fill={BONE} />
        {/* omurga */}
        {Array.from({ length: 11 }).map((_, i) => (
          <rect key={i} x={528} y={600 + i * 27} width={24} height={20} rx={6} fill={BONE} />
        ))}
        {/* kaburgalar */}
        {Array.from({ length: 6 }).map((_, i) => {
          const y = 668 + i * 30;
          const w = 80 - Math.abs(i - 2) * 6;
          return (
            <g key={i} fill="none" stroke={BONE} strokeWidth={8} strokeLinecap="round">
              <path d={`M532,${y} Q${540 - w},${y - 6} ${540 - w + 4},${y + 30}`} />
              <path d={`M548,${y} Q${540 + w},${y - 6} ${540 + w - 4},${y + 30}`} />
            </g>
          );
        })}
        {/* köprücük kemikleri */}
        <path d={`M${j.shL[0]},${j.shL[1]} Q500,628 534,620`} stroke={BONE} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d={`M${j.shR[0]},${j.shR[1]} Q580,628 546,620`} stroke={BONE} strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* kollar */}
        {bone(j.shL, j.elL, 14)}
        {bone(j.shR, j.elR, 14)}
        {bone(j.elL, j.hL, 11)}
        {bone(j.elR, j.hR, 11)}
        {[j.hL, j.hR].map((h, k) => (
          <g key={k}>
            {[-16, -5, 6, 17].map((dx) => (
              <path key={dx} d={`M${h[0] + dx},${h[1] + 10} l0,-30`} stroke={BONE} strokeWidth={7} strokeLinecap="round" />
            ))}
          </g>
        ))}
        {/* kafatası */}
        <path d="M480,500 C478,438 510,420 540,420 C570,420 602,438 600,500 C600,530 586,548 574,556 L572,580 L508,580 L506,556 C494,548 480,530 480,500 Z" fill={BONE} />
        <ellipse cx={516} cy={500} rx={17} ry={20} fill="#0a1a33" />
        <ellipse cx={564} cy={500} rx={17} ry={20} fill="#0a1a33" />
        <path d="M540,520 l-9,20 l18,0 Z" fill="#0a1a33" />
        {[514, 527, 540, 553, 566].map((x) => (
          <line key={x} x1={x} y1={562} x2={x} y2={578} stroke="#0a1a33" strokeWidth={3} />
        ))}
      </g>
      {/* büyüme plakları: uyluk alt ucu, kaval üst ucu, ön kol */}
      {plate(j.hipL, j.knL, 0.86, 26)}
      {plate(j.hipR, j.knR, 0.86, 26)}
      {plate(j.knL, j.anL, 0.12, 22)}
      {plate(j.knR, j.anR, 0.12, 22)}
      {plate(j.elL, j.hL, 0.85, 18)}
      {plate(j.elR, j.hR, 0.85, 18)}
    </g>
  );
};

export const SiluetRontgen: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const p = (1 - Math.cos(t * 2.4)) / 2;
  const scanY = interpolate(t, [1.6, 3.4], [-40, 1960], clamp);
  const plates = sm(t, 3.4, 4.0);
  return (
    <AbsoluteFill lang="tr" style={{ background: "#14081f", overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a0f4a" />
            <stop offset="0.45" stopColor="#ff3d7f" />
            <stop offset="0.75" stopColor="#ff8a3d" />
            <stop offset="1" stopColor="#ffc36b" />
          </linearGradient>
          <radialGradient id="xr" cx="50%" cy="45%" r="70%">
            <stop offset="0" stopColor="#0f3060" />
            <stop offset="1" stopColor="#040c1c" />
          </radialGradient>
          <clipPath id="scan">
            <rect x={0} y={0} width={1080} height={Math.max(0, scanY)} />
          </clipPath>
        </defs>
        {/* gün batımı + silüet */}
        <rect width={1080} height={1920} fill="url(#sky)" />
        <circle cx={540} cy={820} r={380} fill="#ffd36b" opacity={0.9} />
        <circle cx={540} cy={820} r={460} fill="#ffd36b" opacity={0.15} />
        <rect x={0} y={1350} width={1080} height={570} fill="#12061c" />
        <Silhouette p={p} c="#12061c" />
        {/* röntgen katmanı (tarayıcı geçtikçe açılır) */}
        <g clipPath="url(#scan)">
          <rect width={1080} height={1920} fill="url(#xr)" />
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={i} x1={0} y1={i * 80} x2={1080} y2={i * 80} stroke="#5fd0ff" strokeWidth={1} opacity={0.08} />
          ))}
          {/* gölge vücut ana hattı */}
          <g opacity={0.18}>
            <Silhouette p={p} c="#7fd6ff" />
          </g>
          <Skeleton p={p} glow={plates} t={t} />
        </g>
        {/* tarayıcı çizgisi */}
        {t > 1.6 && t < 3.45 ? (
          <g>
            <rect x={0} y={scanY - 60} width={1080} height={60} fill="#5ff4ff" opacity={0.15} />
            <rect x={0} y={scanY - 4} width={1080} height={8} fill="#c9fbff" style={{ filter: "drop-shadow(0 0 18px #5ff4ff)" }} />
          </g>
        ) : null}
        {/* büyüme plağı etiketi */}
        <g opacity={sm(t, 4.0, 4.4)}>
          <path d="M600,1110 L760,1010" stroke="#ffd23f" strokeWidth={4} />
          <rect x={700} y={950} width={330} height={70} rx={35} fill="rgba(4,12,28,0.85)" stroke="#ffd23f" strokeWidth={3} />
          <text x={865} y={996} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={36} fill="#ffd23f">
            büyüme plağı
          </text>
        </g>
      </svg>
      {/* başlık */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 170,
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 92,
          lineHeight: 1.02,
          letterSpacing: -3,
          color: "#ffffff",
          textShadow: "0 6px 30px rgba(0,0,0,0.45)",
          opacity: interpolate(t, [0.1, 0.5], [0, 1], clamp),
        }}
      >
        {t < 3.4 ? (
          <>
            AĞIRLIK BOYU
            <br />
            <span style={{ color: "#ffd23f" }}>KISALTIR MI?</span>
          </>
        ) : (
          <>
            CEVAP
            <br />
            <span style={{ color: "#5ff4ff" }}>KEMİKLERİNDE</span>
          </>
        )}
      </div>
      {/* altyazı örneği */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 1520, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 70, color: "#fff", textShadow: "0 4px 18px rgba(0,0,0,0.7)" }}>
        {t < 1.6 ? "“Ağırlık kaldırma," : t < 3.4 ? "Gel, içine bakalım." : "Boy buradan uzar."}
      </div>
    </AbsoluteFill>
  );
};
