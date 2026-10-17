/**
 * Anime / TV çizgi film tarzı genç karakter (One Piece, Avatar havası; özgün tasarım).
 * Gerçekçi oranlar (~7 baş boy), kalın mürekkep konturu, iki tonlu gölge (ışık sol üstten).
 * Koordinatlar 1080x1920 kadraja göre; poz şimdilik sabit (taslak).
 */
type P = [number, number];

export const INK = "#1b1420";
const W = 6; // kontur

export const C = {
  skin: "#ffd2ab",
  skinS: "#e9a57f",
  hair: "#3a2418",
  hairS: "#24150d",
  hairH: "#6b4532",
  band: "#e8423a",
  bandS: "#b52a24",
  top: "#ff7a2b",
  topS: "#d9541a",
  trim: "#ffffff",
  shorts: "#22305a",
  shortsS: "#16203f",
  shoe: "#ffffff",
  shoeS: "#c9cfdc",
  sole: "#e8423a",
  iris: "#7a4a1f",
  irisL: "#c98a3c",
  wrist: "#2f7bd9",
  metal: "#8b93a6",
  plate: "#3b3f58",
};

/** uzuv: a→b arası, uçlarda yuvarlak, ortada isteğe bağlı kas şişkinliği */
const limbPath = (a: P, b: P, wa: number, wb: number, bulge = 0) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  const m: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const wm = (wa + wb) / 4 + bulge;
  const p = (q: P, s: number, w: number) => `${q[0] + nx * w * s},${q[1] + ny * w * s}`;
  return `M${p(a, 1, wa / 2)} Q${p(m, 1, wm * 1.25)} ${p(b, 1, wb / 2)} A${wb / 2},${wb / 2} 0 0 0 ${p(b, -1, wb / 2)} Q${p(m, -1, wm * 1.25)} ${p(a, -1, wa / 2)} A${wa / 2},${wa / 2} 0 0 0 ${p(a, 1, wa / 2)} Z`;
};

/** gölgeli uzuv: açık renk taban, gölge tarafı (ışığın tersi) koyu şerit, en üstte kontur */
const Limb: React.FC<{ a: P; b: P; wa: number; wb: number; bulge?: number; fill: string; shade: string; id: string }> = ({ a, b, wa, wb, bulge = 0, fill, shade, id }) => {
  const d = limbPath(a, b, wa, wb, bulge);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  // ışık sol üstten: gölge, normalin +x tarafına düşen kenarda
  let nx = -dy / L;
  let ny = dx / L;
  if (nx < 0) {
    nx = -nx;
    ny = -ny;
  }
  const off = Math.min(wa, wb) * 0.42;
  return (
    <g>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={fill} />
      <path d={d} fill={shade} clipPath={`url(#${id})`} transform={`translate(${nx * off},${ny * off})`} opacity={0} />
      <g clipPath={`url(#${id})`}>
        <path d={limbPath([a[0] + nx * off, a[1] + ny * off], [b[0] + nx * off, b[1] + ny * off], wa, wb, bulge)} fill={shade} />
        <path d={d} fill={fill} transform={`translate(${-nx * off * 1.35},${-ny * off * 1.35})`} />
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    </g>
  );
};

/** kararlı / gülen göz */
const Eye: React.FC<{ x: number; y: number; flip?: boolean }> = ({ x, y, flip }) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -1 : 1},1)`}>
    {/* göz akı */}
    <path d="M-30,-4 Q-6,-26 28,-14 Q24,12 0,16 Q-22,14 -30,-4 Z" fill="#ffffff" />
    {/* iris */}
    <ellipse cx={0} cy={0} rx={15} ry={19} fill={C.iris} />
    <ellipse cx={0} cy={6} rx={12} ry={11} fill={C.irisL} opacity={0.75} />
    <ellipse cx={0} cy={0} rx={7} ry={10} fill="#140c08" />
    <circle cx={-6} cy={-8} r={5.5} fill="#ffffff" />
    <circle cx={6} cy={8} r={2.5} fill="#ffffff" opacity={0.9} />
    {/* üst kirpik çizgisi (kalın) */}
    <path d="M-34,-2 Q-10,-30 32,-16 L34,-10 Q-6,-22 -32,4 Z" fill={INK} />
    <path d="M32,-16 L40,-22" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    {/* alt çizgi */}
    <path d="M-20,14 Q0,20 20,12" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
  </g>
);

/** kısa kıvırcık saç bukleleri [x, y, r]: kafaya yakın, kenar boyunca küçük bukleler */
const CURLS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * (1.0 + (i / 14) * 1.0);
    out.push([540 + Math.cos(a) * 96, 424 + Math.sin(a) * 92, 21 + (i % 2) * 4]);
  }
  return out;
})();

/** kafayı saran saç tabanı (bukleler bunun kenarına oturur) */
const HAIR_CAP = "M446,440 Q440,350 540,334 Q640,350 634,440 L620,420 Q540,380 460,420 Z";

const FRINGE: [number, number, number][] = [
  [476, 424, 17],
  [508, 420, 15],
  [604, 420, 16],
];

export const AnimeTeen: React.FC<{ t?: number }> = ({ t = 0 }) => {
  // eklemler
  const shR: P = [430, 668]; // karakterin sağ omzu (ekranda solda) — yukarıyı gösteren kol
  const elR: P = [368, 512];
  const wrR: P = [388, 352];
  const shL: P = [652, 668];
  const elL: P = [706, 842];
  const wrL: P = [724, 1000];
  const hipR: P = [492, 1010];
  const hipL: P = [590, 1010];
  const knR: P = [458, 1270];
  const knL: P = [626, 1270];
  const anR: P = [440, 1530];
  const anL: P = [646, 1530];
  const breathe = Math.sin(t * 2) * 3;

  return (
    <g transform={`translate(0,${breathe})`}>
      {/* ---------------- bacaklar ---------------- */}
      <Limb id="lgR2" a={knR} b={anR} wa={84} wb={52} bulge={14} fill={C.skin} shade={C.skinS} />
      <Limb id="lgL2" a={knL} b={anL} wa={84} wb={52} bulge={14} fill={C.skin} shade={C.skinS} />
      <Limb id="lgR1" a={hipR} b={knR} wa={100} wb={84} bulge={10} fill={C.skin} shade={C.skinS} />
      <Limb id="lgL1" a={hipL} b={knL} wa={100} wb={84} bulge={10} fill={C.skin} shade={C.skinS} />
      {/* çoraplar + ayakkabılar */}
      {[anR, anL].map((a, k) => {
        const dir = k === 0 ? -1 : 1;
        return (
          <g key={k}>
            <rect x={a[0] - 26} y={a[1] - 40} width={52} height={40} rx={8} fill="#ffffff" stroke={INK} strokeWidth={W - 1} />
            <path
              d={`M${a[0] - 36},${a[1] - 6} Q${a[0]},${a[1] - 26} ${a[0] + 36},${a[1] - 6} L${a[0] + 36 + dir * 40 * (dir > 0 ? 1 : 0)},${a[1] + 40} L${a[0] - 36 + dir * 40 * (dir < 0 ? 1 : 0)},${a[1] + 40} Z`}
              fill={C.shoe}
              stroke={INK}
              strokeWidth={W}
              strokeLinejoin="round"
            />
            <path d={`M${a[0] - 40 + (dir < 0 ? -40 : 0)},${a[1] + 40} L${a[0] + 40 + (dir > 0 ? 40 : 0)},${a[1] + 40} L${a[0] + 38 + (dir > 0 ? 40 : 0)},${a[1] + 56} L${a[0] - 38 + (dir < 0 ? -40 : 0)},${a[1] + 56} Z`} fill={C.sole} stroke={INK} strokeWidth={W - 1} strokeLinejoin="round" />
            <path d={`M${a[0] - 10},${a[1] + 4} L${a[0] + 22 * dir},${a[1] + 22}`} stroke={C.sole} strokeWidth={8} strokeLinecap="round" />
          </g>
        );
      })}

      {/* ---------------- şort ---------------- */}
      <path
        d="M462,930 L618,930 L668,1210 Q612,1230 556,1212 L540,1080 L524,1212 Q468,1230 412,1210 Z"
        fill={C.shorts}
        stroke={INK}
        strokeWidth={W}
        strokeLinejoin="round"
      />
      <path d="M566,940 L618,940 L664,1200 Q620,1214 586,1208 Z" fill={C.shortsS} />
      <path d="M440,1100 L470,1105 M650,1100 L620,1105" stroke="#fff" strokeWidth={0} />
      <path d="M418,1196 Q468,1212 518,1200" stroke="#ffffff" strokeWidth={9} fill="none" />
      <path d="M562,1200 Q612,1212 662,1196" stroke="#ffffff" strokeWidth={9} fill="none" />

      {/* ---------------- sol kol (aşağıda, dambıl) — gövdenin arkasında kalan omuz ---------------- */}
      <Limb id="arL2" a={elL} b={wrL} wa={62} wb={44} bulge={8} fill={C.skin} shade={C.skinS} />
      <Limb id="arL1" a={shL} b={elL} wa={84} wb={58} bulge={14} fill={C.skin} shade={C.skinS} />

      {/* omuz kasları */}
      <circle cx={shL[0] - 4} cy={shL[1] + 6} r={46} fill={C.skin} stroke={INK} strokeWidth={W} />
      <path d={`M${shL[0] + 10},${shL[1] - 34} A46,46 0 0 1 ${shL[0] + 26},${shL[1] + 44} Q${shL[0] + 10},${shL[1] + 10} ${shL[0] + 10},${shL[1] - 34} Z`} fill={C.skinS} />
      {/* ---------------- gövde (atlet) ---------------- */}
      <path d="M512,610 L568,610 L572,660 L508,660 Z" fill={C.skin} stroke={INK} strokeWidth={W} />
      <path d="M548,612 L568,612 L571,656 L552,650 Z" fill={C.skinS} />
      <path
        d="M440,676 Q470,650 500,652 Q540,700 580,652 Q612,650 642,676 L630,800 Q624,880 616,950 Q540,972 464,950 Q456,880 450,800 Z"
        fill={C.top}
        stroke={INK}
        strokeWidth={W}
        strokeLinejoin="round"
      />
      {/* atlet gölgesi + kesim */}
      <path d="M590,690 Q612,670 636,684 L626,800 Q620,880 614,944 Q590,952 566,956 Q600,880 594,780 Z" fill={C.topS} />
      <path d="M500,652 Q540,700 580,652" stroke={C.trim} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M500,652 Q540,700 580,652" stroke={INK} strokeWidth={3} fill="none" opacity={0.5} />
      {/* göğüs numarası */}
      <text x={522} y={850} textAnchor="middle" fontFamily="Geist, sans-serif" fontWeight={800} fontSize={92} fill={C.trim} stroke={INK} strokeWidth={5} paintOrder="stroke" transform="rotate(-3,522,830)">
        16
      </text>
      <path d="M466,946 Q540,964 614,946" stroke={INK} strokeWidth={4} fill="none" opacity={0.5} />

      {/* ---------------- sağ kol (yukarı) ---------------- */}
      <circle cx={shR[0] + 2} cy={shR[1] - 4} r={46} fill={C.skin} stroke={INK} strokeWidth={W} />
      <Limb id="arR1" a={shR} b={elR} wa={84} wb={58} bulge={16} fill={C.skin} shade={C.skinS} />
      <Limb id="arR2" a={elR} b={wrR} wa={62} wb={44} bulge={8} fill={C.skin} shade={C.skinS} />
      {/* bileklik */}
      <path d={limbPath([elR[0] + (wrR[0] - elR[0]) * 0.72, elR[1] + (wrR[1] - elR[1]) * 0.72], [elR[0] + (wrR[0] - elR[0]) * 0.9, elR[1] + (wrR[1] - elR[1]) * 0.9], 50, 46)} fill={C.wrist} stroke={INK} strokeWidth={W - 1} />
      {/* yukarıyı gösteren el */}
      <g transform={`translate(${wrR[0]},${wrR[1]})`}>
        <path d="M-30,-6 Q-38,-48 -14,-60 L22,-60 Q40,-50 34,-14 Q30,6 0,8 Q-26,8 -30,-6 Z" fill={C.skin} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        <path d="M10,-58 L28,-58 Q38,-44 32,-16 Q24,0 8,4 Z" fill={C.skinS} />
        {/* işaret parmağı */}
        <path d="M-12,-56 L-14,-150 Q-12,-170 4,-170 Q18,-168 18,-150 L16,-58" fill={C.skin} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        <path d="M8,-160 Q16,-158 16,-140 L14,-60 L6,-60 Z" fill={C.skinS} />
        <path d="M-6,-152 Q4,-158 12,-152" stroke={INK} strokeWidth={3} fill="none" />
        {/* başparmak */}
        <path d="M-30,-30 Q-50,-44 -44,-64 Q-36,-74 -24,-58" fill={C.skin} stroke={INK} strokeWidth={W - 1} strokeLinejoin="round" />
        <path d="M-20,-30 L18,-32 M-20,-14 L20,-16" stroke={INK} strokeWidth={3} />
      </g>

      {/* ---------------- dambıl (sol el) ---------------- */}
      <g transform={`translate(${wrL[0] + 6},${wrL[1] + 30})`}>
        <rect x={-74} y={-9} width={148} height={18} rx={8} fill={C.metal} stroke={INK} strokeWidth={W - 1} />
        {[-1, 1].map((s) => (
          <g key={s}>
            <rect x={s * 74 - 20} y={-48} width={40} height={96} rx={12} fill={C.plate} stroke={INK} strokeWidth={W} />
            <rect x={s * 74 - 12} y={-40} width={10} height={80} rx={5} fill="#5a5f7a" />
          </g>
        ))}
        {/* yumruk */}
        <path d="M-30,-34 Q-36,-6 -24,22 Q0,32 26,22 Q36,-6 28,-34 Q0,-44 -30,-34 Z" fill={C.skin} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        <path d="M8,-38 Q30,-34 30,-10 Q30,14 20,22 Q8,0 8,-38 Z" fill={C.skinS} />
        <path d="M-26,-8 L24,-8 M-24,8 L22,8" stroke={INK} strokeWidth={3} />
      </g>

      {/* ---------------- baş ---------------- */}
      {/* kulaklar */}
      <path d="M448,470 Q428,462 430,494 Q434,522 456,520" fill={C.skin} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
      <path d="M632,470 Q652,462 650,494 Q646,522 624,520" fill={C.skinS} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
      {/* yüz */}
      <path d="M450,430 Q446,540 486,584 Q514,612 540,616 Q566,612 594,584 Q634,540 630,430 Q624,352 540,350 Q456,352 450,430 Z" fill={C.skin} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
      {/* yüz gölgesi (sağ yanak + çene altı) */}
      <path d="M600,420 Q634,430 628,470 Q622,544 592,584 Q570,604 548,612 Q596,560 606,500 Q610,456 600,420 Z" fill={C.skinS} />
      {/* kaşlar */}
      <path d="M474,438 Q500,422 528,436 L526,446 Q500,436 476,450 Z" fill={INK} />
      <path d="M606,438 Q580,422 552,436 L554,446 Q580,436 604,450 Z" fill={INK} />
      <Eye x={501} y={474} />
      <Eye x={580} y={474} flip />
      {/* burun */}
      <path d="M546,500 L554,528 L540,532" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* geniş sırıtış */}
      <path d="M494,552 Q540,548 588,548 Q582,592 540,596 Q500,592 494,552 Z" fill="#7a1f24" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
      <path d="M498,556 Q540,552 584,552 L582,566 Q540,570 500,568 Z" fill="#ffffff" />
      <path d="M512,584 Q540,592 568,584 Q556,594 540,594 Q524,594 512,584 Z" fill="#e2626a" />
      <path d="M486,548 Q490,544 496,550 M592,546 Q588,542 582,548" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />

      {/* ---------------- saç + kafa bandı ---------------- */}
      {/* kısa kıvırcık saç: taban + kenarda küçük bukleler (önce konturlar, sonra dolgular) */}
      <g>
        <path d={HAIR_CAP} fill={INK} stroke={INK} strokeWidth={W * 2} strokeLinejoin="round" />
        {CURLS.map(([x, y, r], i) => (
          <circle key={`o${i}`} cx={x} cy={y} r={r + W / 2} fill={INK} />
        ))}
        <path d={HAIR_CAP} fill={C.hair} />
        {CURLS.map(([x, y, r], i) => (
          <circle key={`f${i}`} cx={x} cy={y} r={r - W / 2} fill={C.hair} />
        ))}
        {/* bukle kıvrımları */}
        {CURLS.map(([x, y, r], i) =>
          i % 2 === 0 ? (
            <path key={`c${i}`} d={`M${x - r * 0.4},${y + r * 0.1} a${r * 0.38},${r * 0.38} 0 1 1 ${r * 0.45},${r * 0.3}`} stroke={C.hairS} strokeWidth={4} fill="none" strokeLinecap="round" />
          ) : null,
        )}
        {[
          [500, 372],
          [548, 360],
          [590, 378],
        ].map(([x, y], i) => (
          <path key={`i${i}`} d={`M${x - 10},${y + 4} a12,12 0 1 1 14,9`} stroke={i === 1 ? C.hairH : C.hairS} strokeWidth={4} fill="none" strokeLinecap="round" />
        ))}
      </g>
      {/* kafa bandı */}
      <path d="M448,396 Q540,360 632,396 L630,426 Q540,392 450,426 Z" fill={C.band} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
      <path d="M590,382 Q616,388 632,396 L630,426 Q612,416 588,408 Z" fill={C.bandS} />
      {/* bandın uçları (rüzgârda) */}
      <path d="M636,408 Q690,396 724,424 Q700,428 690,444 Q672,424 640,426 Z" fill={C.band} stroke={INK} strokeWidth={W - 1} strokeLinejoin="round" />
      <path d="M636,418 Q680,434 700,474 Q676,466 660,474 Q656,444 634,432 Z" fill={C.bandS} stroke={INK} strokeWidth={W - 1} strokeLinejoin="round" />
      {/* bandın altından alına düşen birkaç bukle */}
      {FRINGE.map(([x, y, r], i) => (
        <g key={`fr${i}`}>
          <circle cx={x} cy={y} r={r + W / 2} fill={INK} />
          <circle cx={x} cy={y} r={r - W / 2} fill={C.hair} />
          <path d={`M${x - r * 0.4},${y} a${r * 0.38},${r * 0.38} 0 1 1 ${r * 0.45},${r * 0.3}`} stroke={C.hairH} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};
