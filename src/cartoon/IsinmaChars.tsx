/**
 * "Isınma" videosu karakterleri (parlak, yuvarlak hatlı çizgi film):
 * - ToonGuy: arkaya dönük şapkalı sporcu
 * - KasKarakter: uykucu, üşüyen bacak kası (gece şapkası + battaniye); `w` ile soğuk→sıcak renk
 * Koordinatlar: (0,0) ayakların ortası, yukarı negatif y. Uzuvlar iki parçalı ve
 * hedef noktaya `ik` ile uzanır (eller/ayaklar istenen yere gider).
 */
import React from "react";

export const INK = "#2b2140";
const SW = 6; // kontur

const mix = (a: string, b: string, k: number) => {
  const p = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, k))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

/** iki parçalı uzuv için açı (derece): omuzdan/kalçadan (dx,dy) hedefe. bend: +1 dirsek -x yönüne */
export const ik = (dx: number, dy: number, L1: number, L2: number, bend: 1 | -1) => {
  const D = Math.max(Math.abs(L1 - L2) + 1, Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01));
  const phi = Math.atan2(-dx, dy);
  const al = Math.acos((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D));
  const be = Math.acos((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2));
  const d = 180 / Math.PI;
  return { a: (phi + bend * al) * d, e: -bend * (Math.PI - be) * d };
};

type Seg = { a: number; e: number };
export type Pt = { x: number; y: number };

const Limb: React.FC<{
  x: number;
  y: number;
  s: Seg;
  L1: number;
  L2: number;
  w1: number;
  w2: number;
  f1: string;
  f2: string;
  end?: React.ReactNode;
}> = ({ x, y, s, L1, L2, w1, w2, f1, f2, end }) => (
  <g transform={`translate(${x},${y}) rotate(${s.a})`}>
    <g transform={`translate(0,${L1}) rotate(${s.e})`}>
      <rect x={-w2 / 2} y={-w2 / 2} width={w2} height={L2 + w2 / 2} rx={w2 / 2} fill={f2} stroke={INK} strokeWidth={SW} />
      <g transform={`translate(0,${L2})`}>{end}</g>
    </g>
    <rect x={-w1 / 2} y={-w1 / 2} width={w1} height={L1 + w1 / 2} rx={w1 / 2} fill={f1} stroke={INK} strokeWidth={SW} />
    <circle cx={0} cy={L1} r={w2 / 2 - SW / 2} fill={f2} />
  </g>
);

// ============================================================ sporcu

export type GuyExpr = "focus" | "shock" | "smirk" | "grit" | "happy" | "sheepish";

export type GuyPose = {
  handL: Pt; // omuza göre değil, karakter koordinatında
  handR: Pt;
  footL: Pt;
  footR: Pt;
  /** gövde aşağı (çömelme) */
  drop?: number;
  lean?: number;
  head?: number;
};

const G = {
  skin: "#f0b48a",
  skinD: "#d9946a",
  hair: "#3b2a22",
  cap: "#18b5a4",
  capD: "#0f8a7d",
  top: "#ffc93c",
  topD: "#f2a51a",
  shorts: "#3a4a9a",
  shoe: "#ffffff",
  sole: "#ff5d73",
};

export const guyStand = (): GuyPose => ({
  handL: { x: -150, y: -290 },
  handR: { x: 150, y: -290 },
  footL: { x: -55, y: 0 },
  footR: { x: 55, y: 0 },
});

const GuyFace: React.FC<{ e: GuyExpr; blink: number; look: number }> = ({ e, blink, look }) => {
  const open = (e === "shock" ? 1.25 : e === "happy" ? 0.15 : 1) * (1 - blink);
  const eye = (x: number) =>
    open < 0.25 ? (
      <path d={`M${x - 16},-690 Q${x},${e === "happy" ? -706 : -680} ${x + 16},-690`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
    ) : (
      <g>
        <ellipse cx={x} cy={-690} rx={17} ry={21 * open} fill="#fff" stroke={INK} strokeWidth={5} />
        <circle cx={x + look * 5} cy={-688} r={Math.min(10, 11 * open)} fill={INK} />
        <circle cx={x + look * 5 + 4} cy={-693} r={3.5} fill="#fff" />
      </g>
    );
  const by = e === "shock" ? -16 : e === "grit" ? 8 : e === "sheepish" ? -8 : 0;
  return (
    <g>
      <path d={`M-62,${-722 + by} Q-42,${-736 + by} -20,${-724 + by + (e === "grit" ? 8 : 0)}`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d={`M20,${-724 + by + (e === "grit" ? 8 : 0)} Q42,${-736 + by + (e === "smirk" ? -8 : 0)} 62,${-722 + by}`} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
      {eye(-40)}
      {eye(40)}
      <path d="M-4,-668 Q10,-654 -4,-646" stroke={G.skinD} strokeWidth={6} fill="none" strokeLinecap="round" />
      <ellipse cx={-66} cy={-650} rx={17} ry={10} fill="#ff7d7d" opacity={0.35} />
      <ellipse cx={66} cy={-650} rx={17} ry={10} fill="#ff7d7d" opacity={0.35} />
      {e === "focus" ? <path d="M-20,-626 Q0,-614 20,-626" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" /> : null}
      {e === "smirk" ? <path d="M-22,-622 Q8,-614 26,-634" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" /> : null}
      {e === "shock" ? <ellipse cx={0} cy={-618} rx={16} ry={21} fill="#6b1f2a" stroke={INK} strokeWidth={5} /> : null}
      {e === "happy" ? <path d="M-30,-634 Q0,-590 30,-634 Z" fill="#6b1f2a" stroke={INK} strokeWidth={5} strokeLinejoin="round" /> : null}
      {e === "sheepish" ? <path d="M-22,-626 Q-8,-618 4,-626 Q14,-632 22,-624" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" /> : null}
      {e === "grit" ? (
        <g>
          <rect x={-28} y={-638} width={56} height={22} rx={8} fill="#fff" stroke={INK} strokeWidth={5} />
          <line x1={-9} y1={-638} x2={-9} y2={-616} stroke={INK} strokeWidth={3} />
          <line x1={9} y1={-638} x2={9} y2={-616} stroke={INK} strokeWidth={3} />
        </g>
      ) : null}
    </g>
  );
};

export const ToonGuy: React.FC<{
  pose: GuyPose;
  expr?: GuyExpr;
  blink?: number;
  look?: number;
  /** ellerde tutulan şey (karakter koordinatında çizilir, kollardan önce) */
  held?: React.ReactNode;
}> = ({ pose, expr = "focus", blink = 0, look = 0, held }) => {
  const d = pose.drop ?? 0;
  const hipY = -330 + d;
  const shY = -540 + d;
  const legL = ik(pose.footL.x + 45, pose.footL.y - hipY, 165, 165, 1);
  const legR = ik(pose.footR.x - 45, pose.footR.y - hipY, 165, 165, -1);
  const armL = ik(pose.handL.x + 112, pose.handL.y - shY, 130, 122, 1);
  const armR = ik(pose.handR.x - 112, pose.handR.y - shY, 130, 122, -1);
  const shoe = (
    <g>
      <ellipse cx={0} cy={6} rx={46} ry={26} fill={G.shoe} stroke={INK} strokeWidth={SW} />
      <path d="M-44,16 Q0,34 44,16" stroke={G.sole} strokeWidth={9} fill="none" strokeLinecap="round" />
    </g>
  );
  const hand = <circle cx={0} cy={6} r={27} fill={G.skin} stroke={INK} strokeWidth={SW} />;
  return (
    <g>
      <ellipse cx={0} cy={14} rx={150} ry={20} fill={INK} opacity={0.14} />
      <Limb x={-45} y={hipY} s={legL} L1={165} L2={165} w1={74} w2={56} f1={G.shorts} f2={G.skin} end={shoe} />
      <Limb x={45} y={hipY} s={legR} L1={165} L2={165} w1={74} w2={56} f1={G.shorts} f2={G.skin} end={shoe} />
      <g transform={`rotate(${pose.lean ?? 0},0,${hipY})`}>
        {/* şort belden */}
        <path d={`M-104,${hipY - 34} L104,${hipY - 34} L110,${hipY + 30} L-110,${hipY + 30} Z`} fill={G.shorts} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        {/* atlet */}
        <path
          d={`M-112,${shY - 14} Q-122,${shY + 100} -104,${hipY - 20} L104,${hipY - 20} Q122,${shY + 100} 112,${shY - 14} Q60,${shY - 40} 40,${shY - 40} Q0,${shY + 20} -40,${shY - 40} Q-60,${shY - 40} -112,${shY - 14} Z`}
          fill={G.top}
          stroke={INK}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <path d={`M-70,${shY + 120} Q0,${shY + 150} 70,${shY + 120}`} stroke={G.topD} strokeWidth={10} fill="none" strokeLinecap="round" />
        <rect x={-24} y={shY - 64} width={48} height={50} fill={G.skin} stroke={INK} strokeWidth={SW} />
        {held}
        <Limb x={-112} y={shY} s={armL} L1={130} L2={122} w1={48} w2={44} f1={G.skin} f2={G.skin} end={hand} />
        <Limb x={112} y={shY} s={armR} L1={130} L2={122} w1={48} w2={44} f1={G.skin} f2={G.skin} end={hand} />
        <g transform={`translate(0,${d}) rotate(${pose.head ?? 0},0,-600)`}>
          <circle cx={-104} cy={-676} r={20} fill={G.skin} stroke={INK} strokeWidth={SW} />
          <circle cx={104} cy={-676} r={20} fill={G.skin} stroke={INK} strokeWidth={SW} />
          <ellipse cx={0} cy={-682} rx={106} ry={110} fill={G.skin} stroke={INK} strokeWidth={SW} />
          {/* favori */}
          <path d="M-100,-700 L-92,-660 L-84,-706 Z" fill={G.hair} />
          <path d="M100,-700 L92,-660 L84,-706 Z" fill={G.hair} />
          {/* ters şapka */}
          <path d="M-108,-708 C-112,-820 112,-820 108,-708 Q0,-728 -108,-708 Z" fill={G.cap} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M-36,-718 Q0,-770 36,-718 Z" fill={G.hair} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M-18,-724 q6,-22 14,-4 q8,-20 16,2" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M-104,-716 Q0,-736 104,-716" stroke={G.capD} strokeWidth={8} fill="none" />
          <circle cx={0} cy={-796} r={9} fill={G.capD} stroke={INK} strokeWidth={4} />
          <GuyFace e={expr} blink={blink} look={look} />
        </g>
      </g>
    </g>
  );
};

// ============================================================ kas karakteri

export type KasExpr = "shout" | "sleepy" | "annoyed" | "strain" | "shock" | "shiver" | "smile" | "happy" | "stern" | "wink";

export type KasPose = { handL: Pt; handR: Pt; footL?: Pt; footR?: Pt; tilt?: number };

const K = {
  warm: "#ff5f6d",
  warmD: "#d9364f",
  cold: "#c7a9cf",
  coldD: "#9c7fae",
  fiber: "#ffd0d4",
  tendon: "#fff4ea",
};

export const kasStand = (): KasPose => ({ handL: { x: -170, y: -250 }, handR: { x: 170, y: -250 } });

const KasFace: React.FC<{ e: KasExpr; blink: number; look: number; t: number; lidColor: string }> = ({ e, blink, look, t, lidColor }) => {
  const lid = e === "sleepy" ? 0.55 : e === "annoyed" ? 0.35 : 0;
  const big = e === "shock" || e === "shout" ? 1.12 : 1;
  const eye = (x: number, wink = false) => {
    if (wink || blink > 0.6 || e === "happy")
      return <path d={`M${x - 26},-452 Q${x},${e === "happy" ? -480 : -440} ${x + 26},-452`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />;
    return (
      <g>
        <ellipse cx={x} cy={-455} rx={38 * big} ry={44 * big} fill="#fff" stroke={INK} strokeWidth={6} />
        <circle cx={x + look * 10} cy={-448} r={e === "shock" ? 12 : 19} fill={INK} />
        <circle cx={x + look * 10 + 7} cy={-456} r={6} fill="#fff" />
        {lid > 0 ? (
          <path
            d={`M${x - 40},-455 A40,46 0 0 1 ${x + 40},-455 L${x + 40},${-499 + 88 * lid} L${x - 40},${-499 + 88 * lid} Z`}
            fill={lidColor}
            stroke={INK}
            strokeWidth={5}
          />
        ) : null}
      </g>
    );
  };
  const br = e === "shout" || e === "stern" || e === "strain" ? 14 : e === "shock" ? -18 : e === "shiver" || e === "sleepy" ? -6 : 0;
  const ang = e === "shout" || e === "stern" || e === "strain";
  const chat = Math.sin(t * 40) > 0 ? 3 : -3;
  return (
    <g>
      <path d={`M-90,${-512 - (ang ? 0 : br * 0.4)} Q-60,${-530 - br * 0.3} -26,${-512 + (ang ? br : -br * 0.2)}`} stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d={`M26,${-512 + (ang ? br : -br * 0.2)} Q60,${-530 - br * 0.3} 90,${-512 - (ang ? 0 : br * 0.4)}`} stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
      {eye(-56)}
      {eye(56, e === "wink")}
      <ellipse cx={-100} cy={-392} rx={22} ry={12} fill="#ff9fb0" opacity={0.6} />
      <ellipse cx={100} cy={-392} rx={22} ry={12} fill="#ff9fb0" opacity={0.6} />
      {e === "shout" ? <path d="M-46,-384 Q0,-406 46,-384 Q30,-318 0,-316 Q-30,-318 -46,-384 Z" fill="#5c1626" stroke={INK} strokeWidth={6} strokeLinejoin="round" /> : null}
      {e === "shout" ? <path d="M-20,-334 Q0,-346 20,-334 Q10,-320 0,-320 Q-10,-320 -20,-334 Z" fill="#ff8a9a" /> : null}
      {e === "sleepy" ? <ellipse cx={0} cy={-366} rx={22} ry={26} fill="#5c1626" stroke={INK} strokeWidth={6} /> : null}
      {e === "annoyed" ? <path d="M-26,-370 L26,-376" stroke={INK} strokeWidth={7} strokeLinecap="round" /> : null}
      {e === "shock" ? <ellipse cx={0} cy={-360} rx={20} ry={28} fill="#5c1626" stroke={INK} strokeWidth={6} /> : null}
      {e === "smile" || e === "wink" || e === "stern" ? <path d="M-34,-382 Q0,-352 34,-382" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" /> : null}
      {e === "happy" ? <path d="M-44,-390 Q0,-326 44,-390 Z" fill="#5c1626" stroke={INK} strokeWidth={6} strokeLinejoin="round" /> : null}
      {e === "strain" || e === "shiver" ? (
        <g transform={`translate(${e === "shiver" ? chat : 0},0)`}>
          <rect x={-40} y={-390} width={80} height={30} rx={10} fill="#fff" stroke={INK} strokeWidth={6} />
          {[-20, 0, 20].map((x) => (
            <line key={x} x1={x} y1={-390} x2={x} y2={-360} stroke={INK} strokeWidth={3} />
          ))}
          <line x1={-40} y1={-375} x2={40} y2={-375} stroke={INK} strokeWidth={3} />
        </g>
      ) : null}
    </g>
  );
};

export const KasKarakter: React.FC<{
  pose: KasPose;
  expr?: KasExpr;
  /** 0 = soğuk (soluk, buzlu), 1 = sıcak (canlı kırmızı) */
  w?: number;
  blink?: number;
  look?: number;
  t?: number;
  /** titreme 0-1 */
  shiver?: number;
  /** battaniye/şapka: 0 = üstünde, 1 = uçup gitti */
  blanketOff?: number;
  /** ellerin önünde çizilecek şey (karakter koordinatında) */
  front?: React.ReactNode;
}> = ({ pose, expr = "smile", w = 1, blink = 0, look = 0, t = 0, shiver = 0, blanketOff = 0, front }) => {
  const body = mix(K.cold, K.warm, w);
  const bodyD = mix(K.coldD, K.warmD, w);
  const jx = shiver * Math.sin(t * 55) * 5;
  const fL = pose.footL ?? { x: -60, y: 0 };
  const fR = pose.footR ?? { x: 60, y: 0 };
  const legL = ik(fL.x + 55, fL.y + 150, 78, 78, 1);
  const legR = ik(fR.x - 55, fR.y + 150, 78, 78, -1);
  const armL = ik(pose.handL.x + 150, pose.handL.y + 400, 100, 95, 1);
  const armR = ik(pose.handR.x - 150, pose.handR.y + 400, 100, 95, -1);
  const shoe = (
    <g>
      <ellipse cx={0} cy={8} rx={36} ry={22} fill="#4aa8ff" stroke={INK} strokeWidth={SW} />
      <path d="M-30,14 Q0,28 30,14" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" />
    </g>
  );
  const hand = <circle cx={0} cy={6} r={25} fill={mix("#e3cde6", "#ff8f99", w)} stroke={INK} strokeWidth={SW} />;
  const bo = blanketOff;
  return (
    <g transform={`translate(${jx},0)`}>
      <ellipse cx={0} cy={14} rx={130} ry={18} fill={INK} opacity={0.14} />
      <Limb x={-55} y={-150} s={legL} L1={78} L2={78} w1={30} w2={28} f1={body} f2={body} end={shoe} />
      <Limb x={55} y={-150} s={legR} L1={78} L2={78} w1={30} w2={28} f1={body} f2={body} end={shoe} />
      <g transform={`rotate(${pose.tilt ?? 0},0,-150)`}>
        {/* alt tendon */}
        <path d="M-40,-170 Q0,-118 40,-170 Z" fill={K.tendon} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        {/* gövde */}
        <path
          d="M0,-650 C130,-650 185,-510 178,-390 C172,-250 105,-158 0,-150 C-105,-158 -172,-250 -178,-390 C-185,-510 -130,-650 0,-650 Z"
          fill={body}
          stroke={INK}
          strokeWidth={SW}
        />
        {/* lifler */}
        {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
          <path key={k} d={`M${k * 22},-632 Q${k * 58},-400 ${k * 20},-170`} stroke={mix("#efe4f4", K.fiber, w)} strokeWidth={7} fill="none" opacity={0.45} strokeLinecap="round" />
        ))}
        <path d={`M-150,-300 Q-120,-190 -40,-162`} stroke={bodyD} strokeWidth={14} fill="none" opacity={0.5} strokeLinecap="round" />
        <ellipse cx={-90} cy={-570} rx={40} ry={22} fill="#fff" opacity={0.35} transform="rotate(-30,-90,-570)" />
        {/* üst tendon (şapka gidince görünen perçem) */}
        <path d="M-10,-648 C-20,-700 30,-716 34,-690 C38,-670 12,-668 14,-684" stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
        <path d="M-10,-648 C-20,-700 30,-716 34,-690 C38,-670 12,-668 14,-684" stroke={K.tendon} strokeWidth={7} fill="none" strokeLinecap="round" />
        {/* buz (soğukken) */}
        {w < 0.7 ? (
          <g opacity={1 - w / 0.7}>
            {[-120, -70, 60, 110].map((x, i) => (
              <path key={x} d={`M${x - 12},${-250 + Math.abs(x) * 0.4} l12,${30 + (i % 2) * 18} l12,${-30 - (i % 2) * 18} Z`} fill="#dff4ff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            ))}
          </g>
        ) : null}
        <KasFace e={expr} blink={blink} look={look} t={t} lidColor={body} />
        {/* battaniye + gece şapkası */}
        {bo < 1 ? (
          <g transform={`translate(${bo * 520},${-bo * 900}) rotate(${bo * 160},0,-450)`} opacity={1 - bo * 0.4}>
            <defs>
              <pattern id="plaid" width="60" height="60" patternUnits="userSpaceOnUse">
                <rect width="60" height="60" fill="#5b8def" />
                <rect width="60" height="16" y="22" fill="#3f6fd1" />
                <rect width="16" height="60" x="22" fill="#3f6fd1" opacity="0.8" />
                <rect width="60" height="4" y="28" fill="#ffd166" />
                <rect width="4" height="60" x="28" fill="#ffd166" />
              </pattern>
            </defs>
            <path
              d="M-196,-230 C-214,-470 -160,-640 0,-650 C160,-640 214,-470 196,-230 L150,-214 C150,-400 118,-520 104,-560 C70,-596 -70,-596 -104,-560 C-118,-520 -150,-400 -150,-214 Z"
              fill="url(#plaid)"
              stroke={INK}
              strokeWidth={SW}
              strokeLinejoin="round"
            />
            <path d="M-150,-214 L-196,-230 M150,-214 L196,-230" stroke="#fff" strokeWidth={10} strokeDasharray="4 10" />
            <path d="M-112,-626 C-60,-760 90,-800 190,-720 C150,-700 120,-690 112,-626 Q0,-648 -112,-626 Z" fill="#7b5cff" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M-118,-628 Q0,-656 118,-628" stroke="#fff" strokeWidth={22} fill="none" strokeLinecap="round" />
            <circle cx={196} cy={-716} r={26} fill="#fff" stroke={INK} strokeWidth={SW} />
          </g>
        ) : null}
        {front}
        <Limb x={-150} y={-400} s={armL} L1={100} L2={95} w1={30} w2={28} f1={body} f2={body} end={hand} />
        <Limb x={150} y={-400} s={armR} L1={100} L2={95} w1={30} w2={28} f1={body} f2={body} end={hand} />
      </g>
    </g>
  );
};

/** doğal göz kırpma */
export const blinkAt = (t: number, seed = 0) => {
  const p = 3.1 + (seed % 3) * 0.6;
  const x = ((t + seed) % p) / p;
  const d = Math.abs(x - 0.5) * p;
  return d < 0.07 ? 1 - d / 0.07 : 0;
};
