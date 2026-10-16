/**
 * Düz çizgi karikatür kız (SVG): kalın kahverengi kontur, yuvarlak baş, nokta gözler,
 * pembe yanaklar. Referans: kullanıcının gösterdiği sade karikatür tarzı.
 * Koordinatlar: (0,0) ayakların ortası, yukarı negatif y. Boy ~900 birim.
 */
export const INK = "#2b1d14";

export type Expr = "smile" | "ouch" | "grit" | "wink" | "happy" | "think";

export type ToonPose = {
  /** omuz açıları (derece, 0 = aşağı sarkık, + = öne/yana kalkar) */
  armL?: number;
  armR?: number;
  /** dirsek bükümü (derece) */
  elbowL?: number;
  elbowR?: number;
  /** bacak açıları (derece) */
  legL?: number;
  legR?: number;
  /** gövde eğimi */
  lean?: number;
  /** baş eğimi */
  head?: number;
  /** dikey zıplama */
  bob?: number;
};

export const COLORS = {
  skin: "#f6c9a4",
  hair: "#8a5a3a",
  hairD: "#6e4529",
  shirt: "#5fa89a",
  shirtD: "#4c8f82",
  pants: "#4c3d7a",
  shoe: "#2b1d14",
  cheek: "#f08a8a",
};

const W = 7; // kontur kalınlığı

const Limb: React.FC<{ x: number; y: number; angle: number; len: number; w: number; fill: string; elbow?: number; len2?: number; fill2?: string; hand?: boolean; shoe?: boolean }> = ({
  x,
  y,
  angle,
  len,
  w,
  fill,
  elbow,
  len2,
  fill2,
  hand,
  shoe,
}) => (
  <g transform={`translate(${x},${y}) rotate(${angle})`}>
    {elbow === undefined ? (
      <>
        <rect x={-w / 2} y={-w / 2} width={w} height={len + w / 2} rx={w / 2} fill={fill} stroke={INK} strokeWidth={W} />
        {hand ? <circle cx={0} cy={len + 4} r={w * 0.62} fill={COLORS.skin} stroke={INK} strokeWidth={W} /> : null}
        {shoe ? <ellipse cx={8} cy={len + 6} rx={w * 0.95} ry={w * 0.5} fill={COLORS.shoe} stroke={INK} strokeWidth={W} /> : null}
      </>
    ) : (
      <>
        <g transform={`translate(0,${len}) rotate(${elbow})`}>
          <rect x={-w / 2} y={-w / 2} width={w} height={(len2 ?? len) + w / 2} rx={w / 2} fill={fill2 ?? fill} stroke={INK} strokeWidth={W} />
          {hand ? <circle cx={0} cy={(len2 ?? len) + 4} r={w * 0.62} fill={COLORS.skin} stroke={INK} strokeWidth={W} /> : null}
        </g>
        <rect x={-w / 2} y={-w / 2} width={w} height={len + w / 2} rx={w / 2} fill={fill} stroke={INK} strokeWidth={W} />
      </>
    )}
  </g>
);

const Face: React.FC<{ expr: Expr; blink: number }> = ({ expr, blink }) => {
  const eyeH = 15 * (1 - blink);
  const eye = (x: number, closed: boolean) =>
    closed || eyeH < 3 ? (
      <path d={`M${x - 13},-688 Q${x},-678 ${x + 13},-688`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
    ) : (
      <g>
        <ellipse cx={x} cy={-690} rx={11} ry={eyeH} fill={INK} />
        <circle cx={x + 4} cy={-695} r={3.5} fill="#fff" />
      </g>
    );
  const brow = expr === "ouch" || expr === "grit" ? 10 : expr === "think" ? -6 : 0;
  return (
    <g>
      {/* kaşlar */}
      <path d={`M-62,${-728 + brow * 0.3} Q-44,${-740 - brow * 0.2} -24,${-731 + brow}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={`M24,${-731 + brow} Q44,${-740 - brow * 0.2} 62,${-728 + brow * 0.3}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
      {expr === "ouch" ? (
        <>
          <path d="M-56,-700 L-30,-688 L-56,-678" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M56,-700 L30,-688 L56,-678" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          {eye(-42, false)}
          {eye(42, expr === "wink")}
        </>
      )}
      {/* burun */}
      <path d="M-2,-672 Q8,-662 -2,-654" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* yanaklar */}
      <ellipse cx={-70} cy={-655} rx={20} ry={13} fill={COLORS.cheek} opacity={0.55} />
      <ellipse cx={70} cy={-655} rx={20} ry={13} fill={COLORS.cheek} opacity={0.55} />
      {/* ağız */}
      {expr === "smile" || expr === "wink" ? <path d="M-26,-632 Q0,-608 26,-632" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" /> : null}
      {expr === "happy" ? <path d="M-30,-636 Q0,-596 30,-636 Z" fill="#7a2a2a" stroke={INK} strokeWidth={6} strokeLinejoin="round" /> : null}
      {expr === "ouch" ? <ellipse cx={0} cy={-624} rx={16} ry={20} fill="#7a2a2a" stroke={INK} strokeWidth={6} /> : null}
      {expr === "grit" ? (
        <g>
          <rect x={-28} y={-640} width={56} height={22} rx={8} fill="#fff" stroke={INK} strokeWidth={6} />
          <line x1={-10} y1={-640} x2={-10} y2={-618} stroke={INK} strokeWidth={3} />
          <line x1={10} y1={-640} x2={10} y2={-618} stroke={INK} strokeWidth={3} />
        </g>
      ) : null}
      {expr === "think" ? <path d="M-18,-628 L20,-632" stroke={INK} strokeWidth={6} strokeLinecap="round" /> : null}
    </g>
  );
};

export const ToonGirl2D: React.FC<{
  pose?: ToonPose;
  expr?: Expr;
  blink?: number;
  x?: number;
  y?: number;
  scale?: number;
  /** bacaklarda titreme (0-1) */
  shake?: number;
  t?: number;
}> = ({ pose = {}, expr = "smile", blink = 0, x = 0, y = 0, scale = 1, shake = 0, t = 0 }) => {
  const j = (k: number) => shake * Math.sin(t * 55 + k) * 5;
  const lean = pose.lean ?? 0;
  return (
    <g transform={`translate(${x},${y + (pose.bob ?? 0)}) scale(${scale})`}>
      {/* gölge */}
      <ellipse cx={0} cy={12} rx={150} ry={22} fill={INK} opacity={0.12} />
      {/* bacaklar (tayt) */}
      <Limb x={-48} y={-330} angle={(pose.legL ?? 0) + j(1)} len={318} w={72} fill={COLORS.pants} shoe />
      <Limb x={48} y={-330} angle={(pose.legR ?? 0) + j(2)} len={318} w={72} fill={COLORS.pants} shoe />
      <g transform={`rotate(${lean},0,-330)`}>
        {/* arka saç (at kuyruğu) */}
        <path d="M70,-760 C160,-760 175,-640 140,-560 C120,-520 95,-540 105,-590 C115,-640 100,-700 60,-720 Z" fill={COLORS.hair} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        {/* arka kol */}
        <Limb x={118} y={-540} angle={-(pose.armR ?? 8)} len={130} len2={120} elbow={-(pose.elbowR ?? 0)} w={50} fill={COLORS.shirt} fill2={COLORS.skin} hand />
        {/* gövde */}
        <path d="M-118,-560 Q-128,-440 -112,-318 L112,-318 Q128,-440 118,-560 Q0,-590 -118,-560 Z" fill={COLORS.shirt} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        <path d="M-112,-345 L112,-345" stroke={COLORS.shirtD} strokeWidth={10} />
        {/* boyun */}
        <rect x={-24} y={-600} width={48} height={50} fill={COLORS.skin} stroke={INK} strokeWidth={W} />
        <path d="M-40,-566 Q0,-540 40,-566" stroke={INK} strokeWidth={W} fill="none" />
        {/* ön kol */}
        <Limb x={-118} y={-540} angle={pose.armL ?? 8} len={130} len2={120} elbow={pose.elbowL ?? 0} w={50} fill={COLORS.shirt} fill2={COLORS.skin} hand />
        {/* baş */}
        <g transform={`rotate(${pose.head ?? 0},0,-600)`}>
          <circle cx={0} cy={-690} r={112} fill={COLORS.skin} stroke={INK} strokeWidth={W} />
          {/* kulaklar */}
          <circle cx={-112} cy={-680} r={18} fill={COLORS.skin} stroke={INK} strokeWidth={W} />
          {/* saç üstü + kakül */}
          <path
            d="M-118,-690 C-125,-790 -40,-830 20,-815 C95,-805 130,-750 118,-690 C100,-735 70,-748 40,-742 C30,-765 0,-770 -20,-748 C-55,-760 -95,-740 -118,-690 Z"
            fill={COLORS.hair}
            stroke={INK}
            strokeWidth={W}
            strokeLinejoin="round"
          />
          {/* saç tokası */}
          <circle cx={92} cy={-760} r={14} fill="#f2c94c" stroke={INK} strokeWidth={5} />
          <Face expr={expr} blink={blink} />
        </g>
      </g>
    </g>
  );
};

/** doğal göz kırpma */
export const blinkAt = (t: number, seed = 0) => {
  const p = 3.2 + (seed % 3) * 0.5;
  const x = ((t + seed) % p) / p;
  const d = Math.abs(x - 0.5) * p;
  return d < 0.07 ? 1 - d / 0.07 : 0;
};
