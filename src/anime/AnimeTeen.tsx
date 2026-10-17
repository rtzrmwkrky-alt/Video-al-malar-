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
type EyeMode = "open" | "closed" | "squeeze";
const Eye: React.FC<{ x: number; y: number; flip?: boolean; mode?: EyeMode; lx?: number; ly?: number }> = ({ x, y, flip, mode = "open", lx = 0, ly = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -1 : 1},1)`}>
    {mode === "closed" ? (
      /* mutlu kapalı göz: yukarı kavis */
      <path d="M-30,6 Q0,-24 30,6" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
    ) : mode === "squeeze" ? (
      /* sıkılmış göz: > < */
      <path d="M-28,-14 L18,0 L-28,14" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <>
        {/* göz akı */}
        <path d="M-30,-4 Q-6,-26 28,-14 Q24,12 0,16 Q-22,14 -30,-4 Z" fill="#ffffff" />
        <g transform={`translate(${flip ? -lx : lx},${ly})`}>
          {/* iris */}
          <ellipse cx={0} cy={0} rx={15} ry={19} fill={C.iris} />
          <ellipse cx={0} cy={6} rx={12} ry={11} fill={C.irisL} opacity={0.75} />
          <ellipse cx={0} cy={0} rx={7} ry={10} fill="#140c08" />
          <circle cx={-6} cy={-8} r={5.5} fill="#ffffff" />
          <circle cx={6} cy={8} r={2.5} fill="#ffffff" opacity={0.9} />
        </g>
        {/* üst kirpik çizgisi (kalın) */}
        <path d="M-34,-2 Q-10,-30 32,-16 L34,-10 Q-6,-22 -32,4 Z" fill={INK} />
        <path d="M-33,0 L-42,-6" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        {/* alt çizgi */}
        <path d="M-20,14 Q0,20 20,12" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      </>
    )}
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

export type HairStyle = "curly" | "wavy" | "side" | "quiff" | "messy";

/** kontur + dolgu saç parçası */
const HairPart: React.FC<{ d: string; fill?: string }> = ({ d, fill = C.hair }) => (
  <path d={d} fill={fill} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
);

const Hair: React.FC<{ style: HairStyle }> = ({ style }) => {
  if (style === "wavy")
    return (
      <g>
        <HairPart d="M440,476 C426,404 448,334 530,318 C610,304 664,350 646,432 C642,452 638,466 632,478 C630,452 624,432 614,420 L466,420 C458,436 452,456 450,478 Z" />
        <path d="M600,330 C640,350 654,390 646,432 C640,454 636,468 632,478 C630,452 624,432 614,420 L600,420 Z" fill={C.hairS} />
        <HairPart d="M452,438 C462,384 520,358 584,364 C628,370 650,396 646,428 C632,410 612,404 596,408 C604,418 604,432 596,442 C584,422 562,412 538,414 C516,416 500,426 490,444 C484,430 470,426 452,438 Z" />
        <path d="M476,352 C500,338 520,350 540,338 M556,334 C580,326 602,340 622,354 M512,392 C540,382 568,384 600,392" stroke={C.hairH} strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
    );
  if (style === "side")
    return (
      <g>
        <HairPart d="M444,474 C434,386 468,336 540,332 C612,334 648,384 636,474 C632,446 626,424 616,412 C580,402 540,400 506,404 C490,396 476,394 464,404 C456,420 450,444 448,474 Z" />
        <path d="M600,342 C632,360 646,400 636,474 C632,446 626,424 616,412 L604,408 Z" fill={C.hairS} />
        <path d="M498,338 Q504,370 502,402" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M514,356 Q560,346 608,368 M516,378 Q562,370 612,390" stroke={C.hairH} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M486,350 Q470,368 466,394" stroke={C.hairH} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
    );
  if (style === "quiff")
    return (
      <g>
        {/* yanlar kısa (fade) */}
        <path d="M446,478 C440,430 446,400 462,386 L620,386 C636,400 642,430 634,478 C628,456 624,440 618,430 L462,430 C456,440 452,456 450,478 Z" fill="#5a4034" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        {/* üst: kabarık, öne kalkık */}
        <HairPart d="M458,410 C450,352 482,300 548,290 C604,284 644,314 632,358 C626,380 614,398 598,404 C578,396 540,396 500,404 C484,408 468,416 458,410 Z" />
        <path d="M596,300 C630,316 642,340 632,358 C626,380 614,398 598,404 C610,370 612,330 596,300 Z" fill={C.hairS} />
        <path d="M486,342 C516,310 566,302 604,318 M480,372 C514,346 566,340 610,352" stroke={C.hairH} strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
    );
  if (style === "messy")
    return (
      <g>
        <HairPart d="M440,470 C424,430 432,392 448,380 C436,356 452,330 478,330 C482,306 512,296 532,310 C548,290 584,294 594,318 C620,310 646,330 640,356 C660,372 656,408 640,420 C646,440 644,460 634,476 C628,452 622,434 612,424 C604,440 590,440 586,428 C578,446 560,446 556,428 C546,446 528,446 524,428 C514,444 496,444 494,426 C484,440 468,438 466,424 C458,438 452,456 450,476 Z" />
        <path d="M600,330 C630,336 646,356 640,370 C656,390 650,410 640,420 C644,440 642,460 634,476 C628,452 622,434 612,424 C618,390 614,356 600,330 Z" fill={C.hairS} />
        <path d="M480,352 Q500,336 524,340 M548,322 Q570,316 588,330 M506,392 Q540,380 574,390" stroke={C.hairH} strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
    );
  return null;
};

export type AnimeExpr = "grin" | "happy" | "wink" | "think" | "ouch";
export type AnimeItem = "dumbbell" | "phone" | null;
export type AnimePose = {
  /** dirsek / bilek konumları (karakterin sağı = ekranda sol) */
  elR?: P;
  wrR?: P;
  elL?: P;
  wrL?: P;
  /** sağ el: yukarıyı gösteren parmak ya da yumruk */
  handR?: "point" | "fist";
  itemR?: AnimeItem;
  itemL?: AnimeItem;
  /** 0-1: çömelme (squat) */
  squat?: number;
  /** gözbebeği bakışı */
  lx?: number;
  ly?: number;
  /** baş eğimi (derece) */
  head?: number;
};

/** yumruk + elde tutulan nesne */
const Fist: React.FC<{ at: P; item?: AnimeItem }> = ({ at, item }) => (
  <g transform={`translate(${at[0]},${at[1] + 24})`}>
    {item === "dumbbell" ? (
      <g>
        <rect x={-74} y={-9} width={148} height={18} rx={8} fill={C.metal} stroke={INK} strokeWidth={W - 1} />
        {[-1, 1].map((s) => (
          <g key={s}>
            <rect x={s * 74 - 20} y={-48} width={40} height={96} rx={12} fill={C.plate} stroke={INK} strokeWidth={W} />
            <rect x={s * 74 - 12} y={-40} width={10} height={80} rx={5} fill="#5a5f7a" />
          </g>
        ))}
      </g>
    ) : null}
    {item === "phone" ? (
      <g transform="translate(0,-60)">
        <rect x={-34} y={-70} width={68} height={128} rx={14} fill="#2b2f45" stroke={INK} strokeWidth={W} />
        <rect x={-26} y={-60} width={52} height={104} rx={8} fill="#7fd0ff" />
        <path d="M-12,-14 L14,-2 L-12,10 Z" fill="#ffffff" />
      </g>
    ) : null}
    <path d="M-30,-34 Q-36,-6 -24,22 Q0,32 26,22 Q36,-6 28,-34 Q0,-44 -30,-34 Z" fill={C.skin} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    <path d="M8,-38 Q30,-34 30,-10 Q30,14 20,22 Q8,0 8,-38 Z" fill={C.skinS} />
    <path d="M-26,-8 L24,-8 M-24,8 L22,8" stroke={INK} strokeWidth={3} />
  </g>
);

/** yukarıyı gösteren el (bilekte) */
const PointHand: React.FC<{ at: P }> = ({ at }) => (
  <g transform={`translate(${at[0]},${at[1]})`}>
    <path d="M-30,-6 Q-38,-48 -14,-60 L22,-60 Q40,-50 34,-14 Q30,6 0,8 Q-26,8 -30,-6 Z" fill={C.skin} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    <path d="M10,-58 L28,-58 Q38,-44 32,-16 Q24,0 8,4 Z" fill={C.skinS} />
    <path d="M-12,-56 L-14,-150 Q-12,-170 4,-170 Q18,-168 18,-150 L16,-58" fill={C.skin} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    <path d="M8,-160 Q16,-158 16,-140 L14,-60 L6,-60 Z" fill={C.skinS} />
    <path d="M-6,-152 Q4,-158 12,-152" stroke={INK} strokeWidth={3} fill="none" />
    <path d="M-30,-30 Q-50,-44 -44,-64 Q-36,-74 -24,-58" fill={C.skin} stroke={INK} strokeWidth={W - 1} strokeLinejoin="round" />
    <path d="M-20,-30 L18,-32 M-20,-14 L20,-16" stroke={INK} strokeWidth={3} />
  </g>
);

const at = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/**
 * Anime tarzı genç. Ayak tabanı (540, 1586) noktasındadır; sahnede yerleştirmek için
 * `translate(x,y) scale(s) translate(-540,-1586)` kullan. Aynı SVG'de birden fazla kopya varsa `uid` ver.
 */
export const AnimeTeen: React.FC<{ t?: number; hair?: HairStyle; band?: boolean; pose?: AnimePose; expr?: AnimeExpr; uid?: string }> = ({
  t = 0,
  hair = "messy",
  band = true,
  pose = {},
  expr = "grin",
  uid = "a",
}) => {
  const sq = pose.squat ?? 0;
  const drop = 150 * sq;
  // eklemler (üst gövde çömelmeyle aşağı iner)
  const shR: P = [430, 668 + drop];
  const shL: P = [652, 668 + drop];
  const D = (q: P | undefined, def: P): P => (q ? q : [def[0], def[1] + drop]);
  const handR = pose.handR ?? (pose.wrR ? "fist" : "point");
  const elR = D(pose.elR, [368, 512]);
  const wrR = D(pose.wrR, [388, 352]);
  const elL = D(pose.elL, [706, 842]);
  const wrL = D(pose.wrL, [724, 1000]);
  const itemL = pose.itemL === undefined ? "dumbbell" : pose.itemL;
  const itemR = pose.itemR ?? null;
  const hipR: P = [492, 1010 + drop];
  const hipL: P = [590, 1010 + drop];
  const knR: P = [458 - 70 * sq, 1270 + 40 * sq];
  const knL: P = [626 + 70 * sq, 1270 + 40 * sq];
  const anR: P = [440, 1530];
  const anL: P = [646, 1530];
  const breathe = Math.sin(t * 2) * 3;
  const id = (k: string) => `${uid}-${k}`;
  const eyeMode: [EyeMode, EyeMode] =
    expr === "happy" ? ["closed", "closed"] : expr === "wink" ? ["open", "closed"] : expr === "ouch" ? ["squeeze", "squeeze"] : ["open", "open"];
  const lx = pose.lx ?? (expr === "think" ? -7 : 0);
  const ly = pose.ly ?? (expr === "think" ? -7 : 0);

  return (
    <g transform={`translate(0,${breathe})`}>
      {/* ---------------- bacaklar ---------------- */}
      <Limb id={id("lgR2")} a={knR} b={anR} wa={84} wb={52} bulge={14} fill={C.skin} shade={C.skinS} />
      <Limb id={id("lgL2")} a={knL} b={anL} wa={84} wb={52} bulge={14} fill={C.skin} shade={C.skinS} />
      <Limb id={id("lgR1")} a={hipR} b={knR} wa={100} wb={84} bulge={10} fill={C.skin} shade={C.skinS} />
      <Limb id={id("lgL1")} a={hipL} b={knL} wa={100} wb={84} bulge={10} fill={C.skin} shade={C.skinS} />
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

      <g transform={`translate(0,${drop})`}>
        {/* ---------------- şort ---------------- */}
        <path d="M462,930 L618,930 L668,1210 Q612,1230 556,1212 L540,1080 L524,1212 Q468,1230 412,1210 Z" fill={C.shorts} stroke={INK} strokeWidth={W} strokeLinejoin="round" transform={sq > 0 ? `translate(540,930) scale(${1 + 0.25 * sq},${1 - 0.35 * sq}) translate(-540,-930)` : undefined} />
        <path d="M566,940 L618,940 L664,1200 Q620,1214 586,1208 Z" fill={C.shortsS} transform={sq > 0 ? `translate(540,930) scale(${1 + 0.25 * sq},${1 - 0.35 * sq}) translate(-540,-930)` : undefined} />
        <g transform={sq > 0 ? `translate(540,930) scale(${1 + 0.25 * sq},${1 - 0.35 * sq}) translate(-540,-930)` : undefined}>
          <path d="M418,1196 Q468,1212 518,1200" stroke="#ffffff" strokeWidth={9} fill="none" />
          <path d="M562,1200 Q612,1212 662,1196" stroke="#ffffff" strokeWidth={9} fill="none" />
        </g>
      </g>

      {/* ---------------- sol kol (gövdenin arkasında) ---------------- */}
      <Limb id={id("arL2")} a={elL} b={wrL} wa={62} wb={44} bulge={8} fill={C.skin} shade={C.skinS} />
      <Limb id={id("arL1")} a={shL} b={elL} wa={84} wb={58} bulge={14} fill={C.skin} shade={C.skinS} />
      <Fist at={wrL} item={itemL} />

      <g transform={`translate(0,${drop})`}>
        {/* omuz kasları */}
        <circle cx={652 - 4} cy={668 + 6} r={46} fill={C.skin} stroke={INK} strokeWidth={W} />
        <path d="M662,634 A46,46 0 0 1 678,712 Q662,678 662,634 Z" fill={C.skinS} />
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
        <path d="M590,690 Q612,670 636,684 L626,800 Q620,880 614,944 Q590,952 566,956 Q600,880 594,780 Z" fill={C.topS} />
        <path d="M500,652 Q540,700 580,652" stroke={C.trim} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d="M500,652 Q540,700 580,652" stroke={INK} strokeWidth={3} fill="none" opacity={0.5} />
        <text x={522} y={850} textAnchor="middle" fontFamily="Geist, sans-serif" fontWeight={800} fontSize={92} fill={C.trim} stroke={INK} strokeWidth={5} paintOrder="stroke" transform="rotate(-3,522,830)">
          16
        </text>
        <path d="M466,946 Q540,964 614,946" stroke={INK} strokeWidth={4} fill="none" opacity={0.5} />
        <circle cx={430 + 2} cy={668 - 4} r={46} fill={C.skin} stroke={INK} strokeWidth={W} />
      </g>

      {/* ---------------- sağ kol (önde) ---------------- */}
      <Limb id={id("arR1")} a={shR} b={elR} wa={84} wb={58} bulge={16} fill={C.skin} shade={C.skinS} />
      <Limb id={id("arR2")} a={elR} b={wrR} wa={62} wb={44} bulge={8} fill={C.skin} shade={C.skinS} />
      {/* bileklik */}
      <path d={limbPath(at(elR, wrR, 0.72), at(elR, wrR, 0.9), 50, 46)} fill={C.wrist} stroke={INK} strokeWidth={W - 1} />
      {handR === "point" ? <PointHand at={wrR} /> : <Fist at={wrR} item={itemR} />}

      {/* ---------------- baş ---------------- */}
      <g transform={`translate(0,${drop}) rotate(${pose.head ?? 0},540,610)`}>
        <path d="M448,470 Q428,462 430,494 Q434,522 456,520" fill={C.skin} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        <path d="M632,470 Q652,462 650,494 Q646,522 624,520" fill={C.skinS} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        <path d="M450,430 Q446,540 486,584 Q514,612 540,616 Q566,612 594,584 Q634,540 630,430 Q624,352 540,350 Q456,352 450,430 Z" fill={C.skin} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        <path d="M600,420 Q634,430 628,470 Q622,544 592,584 Q570,604 548,612 Q596,560 606,500 Q610,456 600,420 Z" fill={C.skinS} />
        {/* kaşlar */}
        {expr === "ouch" ? (
          <>
            <path d="M474,428 Q500,440 528,446 L526,456 Q500,452 476,440 Z" fill={INK} />
            <path d="M606,428 Q580,440 552,446 L554,456 Q580,452 604,440 Z" fill={INK} />
          </>
        ) : expr === "think" ? (
          <>
            <path d="M474,430 Q500,412 528,426 L526,436 Q500,426 476,442 Z" fill={INK} />
            <path d="M606,446 Q580,436 552,444 L554,454 Q580,446 604,456 Z" fill={INK} />
          </>
        ) : (
          <>
            <path d="M474,438 Q500,422 528,436 L526,446 Q500,436 476,450 Z" fill={INK} />
            <path d="M606,438 Q580,422 552,436 L554,446 Q580,436 604,450 Z" fill={INK} />
          </>
        )}
        <Eye x={501} y={474} mode={eyeMode[0]} lx={lx} ly={ly} />
        <Eye x={580} y={474} flip mode={eyeMode[1]} lx={lx} ly={ly} />
        <path d="M546,500 L554,528 L540,532" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* ağız */}
        {expr === "think" ? (
          <path d="M512,566 Q536,562 566,554" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        ) : expr === "ouch" ? (
          <g>
            <path d="M494,548 Q540,540 586,548 L582,580 Q540,588 498,580 Z" fill="#ffffff" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
            <path d="M496,564 Q540,560 584,564 M516,546 L516,584 M540,542 L540,586 M564,546 L564,584" stroke={INK} strokeWidth={3} fill="none" />
          </g>
        ) : (
          <g>
            <path d="M494,552 Q540,548 588,548 Q582,592 540,596 Q500,592 494,552 Z" fill="#7a1f24" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
            <path d="M498,556 Q540,552 584,552 L582,566 Q540,570 500,568 Z" fill="#ffffff" />
            <path d="M512,584 Q540,592 568,584 Q556,594 540,594 Q524,594 512,584 Z" fill="#e2626a" />
            <path d="M486,548 Q490,544 496,550 M592,546 Q588,542 582,548" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          </g>
        )}
        {/* ter damlası (zorlanma) */}
        {expr === "ouch" ? <path d="M640,410 C656,440 660,456 644,466 C628,456 632,440 640,410 Z" fill="#bfeaff" stroke={INK} strokeWidth={4} /> : null}

        {/* ---------------- saç + kafa bandı ---------------- */}
        <Hair style={hair} />
        {band ? (
          <g>
            <path d="M448,396 Q540,360 632,396 L630,426 Q540,392 450,426 Z" fill={C.band} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
            <path d="M590,382 Q616,388 632,396 L630,426 Q612,416 588,408 Z" fill={C.bandS} />
            <g transform={`rotate(${Math.sin(t * 5) * 4},636,416)`}>
              <path d="M636,408 Q690,396 724,424 Q700,428 690,444 Q672,424 640,426 Z" fill={C.band} stroke={INK} strokeWidth={W - 1} strokeLinejoin="round" />
              <path d="M636,418 Q680,434 700,474 Q676,466 660,474 Q656,444 634,432 Z" fill={C.bandS} stroke={INK} strokeWidth={W - 1} strokeLinejoin="round" />
            </g>
          </g>
        ) : null}
      </g>
    </g>
  );
};
