/**
 * "Isınma" videosu karakterleri (parlak, yuvarlak hatlı çizgi film):
 * - ToonGuy: arkaya dönük şapkalı sporcu
 * - KasKarakter: iğ biçimli, lif demetli, iki ucu parlak tendonlu kas; üşürken atkı + bere; `w` ile soğuk→sıcak renk
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
  /** üst parçanın üstüne çizilecek şey (ör. pazu kası), parçanın kendi koordinatında */
  over1?: React.ReactNode;
}> = ({ x, y, s, L1, L2, w1, w2, f1, f2, end, over1 }) => (
  <g transform={`translate(${x},${y}) rotate(${s.a})`}>
    <g transform={`translate(0,${L1}) rotate(${s.e})`}>
      <rect x={-w2 / 2} y={-w2 / 2} width={w2} height={L2 + w2 / 2} rx={w2 / 2} fill={f2} stroke={INK} strokeWidth={SW} />
      <g transform={`translate(0,${L2})`}>{end}</g>
    </g>
    <rect x={-w1 / 2} y={-w1 / 2} width={w1} height={L1 + w1 / 2} rx={w1 / 2} fill={f1} stroke={INK} strokeWidth={SW} />
    <circle cx={0} cy={L1} r={w2 / 2 - SW / 2} fill={f2} />
    {over1}
  </g>
);

/** sporcunun kolundaki pazu kası (konuşan kas onun kası: kas konuşurken parlar) */
const Bicep: React.FC<{ glow: number; color: string; dark: string }> = ({ glow, color, dark }) => (
  <g>
    {glow > 0.02 ? <ellipse cx={0} cy={64} rx={34} ry={70} fill={color} opacity={glow * 0.35} /> : null}
    <ellipse cx={0} cy={64} rx={17} ry={48} fill={color} opacity={0.5 + 0.5 * glow} stroke={dark} strokeWidth={3} />
    {[-8, 0, 8].map((x) => (
      <path key={x} d={`M${x * 0.6},20 Q${x * 1.4},64 ${x * 0.6},108`} stroke={dark} strokeWidth={2.5} fill="none" opacity={0.45 + 0.4 * glow} />
    ))}
    <ellipse cx={-6} cy={46} rx={4} ry={14} fill="#fff" opacity={0.35} />
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

const GuyFace: React.FC<{ e: GuyExpr; blink: number; look: number; talk: number }> = ({ e, blink, look, talk }) => {
  const talking = talk > 0.06 && e !== "grit";
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
      {!talking && e === "focus" ? <path d="M-20,-626 Q0,-614 20,-626" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" /> : null}
      {!talking && e === "smirk" ? <path d="M-22,-622 Q8,-614 26,-634" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" /> : null}
      {!talking && e === "shock" ? <ellipse cx={0} cy={-618} rx={16} ry={21} fill="#6b1f2a" stroke={INK} strokeWidth={5} /> : null}
      {!talking && e === "happy" ? <path d="M-30,-634 Q0,-590 30,-634 Z" fill="#6b1f2a" stroke={INK} strokeWidth={5} strokeLinejoin="round" /> : null}
      {!talking && e === "sheepish" ? <path d="M-22,-626 Q-8,-618 4,-626 Q14,-632 22,-624" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" /> : null}
      {talking ? <ellipse cx={0} cy={-622} rx={18 + talk * 5} ry={4 + talk * 17} fill="#6b1f2a" stroke={INK} strokeWidth={5} /> : null}
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
  talk?: number;
  /** pazu kası parlaklığı (0-1) ve rengi */
  bicep?: { glow: number; color: string; dark: string };
  /** ellerde tutulan şey (karakter koordinatında çizilir, kollardan önce) */
  held?: React.ReactNode;
}> = ({ pose, expr = "focus", blink = 0, look = 0, talk = 0, bicep, held }) => {
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
        <Limb x={-112} y={shY} s={armL} L1={130} L2={122} w1={48} w2={44} f1={G.skin} f2={G.skin} end={hand} over1={bicep ? <Bicep {...bicep} /> : null} />
        <Limb x={112} y={shY} s={armR} L1={130} L2={122} w1={48} w2={44} f1={G.skin} f2={G.skin} end={hand} over1={bicep ? <Bicep {...bicep} /> : null} />
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
          <GuyFace e={expr} blink={blink} look={look} talk={talk} />
        </g>
      </g>
    </g>
  );
};

// ============================================================ kas karakteri

export type KasExpr = "shout" | "sleepy" | "annoyed" | "strain" | "shock" | "shiver" | "smile" | "happy" | "stern" | "wink" | "worried";

export type KasPose = { handL: Pt; handR: Pt; footL?: Pt; footR?: Pt; tilt?: number };

const K = {
  warm: "#e8404f",
  warmL: "#ff7a80",
  warmD: "#a81e33",
  cold: "#e3909c",
  coldL: "#f7c8cf",
  coldD: "#a85a6e",
  tendon: "#f6f2ea",
  tendonD: "#cfc6d6",
};

export const kasStand = (): KasPose => ({ handL: { x: -205, y: -250 }, handR: { x: 205, y: -250 } });

/** kas karnı (iğ biçimi) */
const BELLY = "M-44,-690 C-120,-640 -168,-540 -166,-430 C-164,-310 -110,-226 -40,-186 L40,-186 C110,-226 164,-310 166,-430 C168,-540 120,-640 44,-690 Z";
/** lif demetleri arasındaki çizgiler (k = -6..6) */
const meridian = (k: number) => `M${k * 7.3},-692 Q${k * 30},-430 ${k * 6.6},-184`;

const KasFace: React.FC<{ e: KasExpr; blink: number; look: number; t: number; lidColor: string; talk: number }> = ({ e, blink, look, t, lidColor, talk }) => {
  const lid = e === "sleepy" ? 0.55 : e === "annoyed" ? 0.35 : 0;
  const big = e === "shock" || e === "shout" ? 1.12 : 1;
  const eye = (x: number, wink = false) => {
    if (wink || blink > 0.6 || e === "happy")
      return <path d={`M${x - 26},-472 Q${x},${e === "happy" ? -500 : -460} ${x + 26},-472`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />;
    return (
      <g>
        <ellipse cx={x} cy={-475} rx={36 * big} ry={42 * big} fill="#fff" stroke={INK} strokeWidth={6} />
        <circle cx={x + look * 10} cy={-468} r={e === "shock" ? 12 : 18} fill={INK} />
        <circle cx={x + look * 10 + 7} cy={-476} r={6} fill="#fff" />
        {lid > 0 ? (
          <path
            d={`M${x - 38},-475 A38,44 0 0 1 ${x + 38},-475 L${x + 38},${-517 + 84 * lid} L${x - 38},${-517 + 84 * lid} Z`}
            fill={lidColor}
            stroke={INK}
            strokeWidth={5}
          />
        ) : null}
      </g>
    );
  };
  const ang = e === "shout" || e === "stern" || e === "strain";
  const br = ang ? 14 : e === "shock" ? -18 : e === "shiver" || e === "sleepy" || e === "worried" ? -8 : 0;
  const worried = e === "worried" || e === "shiver";
  const chat = Math.sin(t * 40) > 0 ? 3 : -3;
  const talking = talk > 0.06;
  const openSmile = e === "happy" || e === "shout";
  return (
    <g>
      <path
        d={`M-86,${-530 - (ang ? 0 : br * 0.4) + (worried ? 10 : 0)} Q-58,${-548 - br * 0.3} -24,${-530 + (ang ? br : -br * 0.2) - (worried ? 8 : 0)}`}
        stroke={INK}
        strokeWidth={10}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M24,${-530 + (ang ? br : -br * 0.2) - (worried ? 8 : 0)} Q58,${-548 - br * 0.3} 86,${-530 - (ang ? 0 : br * 0.4) + (worried ? 10 : 0)}`}
        stroke={INK}
        strokeWidth={10}
        fill="none"
        strokeLinecap="round"
      />
      {eye(-54)}
      {eye(54, e === "wink")}
      <ellipse cx={-98} cy={-412} rx={22} ry={12} fill="#ffb3c0" opacity={0.7} />
      <ellipse cx={98} cy={-412} rx={22} ry={12} fill="#ffb3c0" opacity={0.7} />
      {talking ? (
        <g>
          {openSmile ? (
            <path d={`M-42,-408 Q0,${-396 + talk * 70} 42,-408 Z`} fill="#5c1626" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          ) : (
            <ellipse cx={0} cy={-390} rx={22 + talk * 8} ry={5 + talk * 26} fill="#5c1626" stroke={INK} strokeWidth={6} />
          )}
          {talk > 0.45 ? <ellipse cx={0} cy={openSmile ? -392 + talk * 30 : -380 + talk * 12} rx={12} ry={6} fill="#ff8a9a" /> : null}
        </g>
      ) : (
        <>
          {e === "shout" ? <path d="M-46,-404 Q0,-426 46,-404 Q30,-338 0,-336 Q-30,-338 -46,-404 Z" fill="#5c1626" stroke={INK} strokeWidth={6} strokeLinejoin="round" /> : null}
          {e === "shout" ? <path d="M-20,-354 Q0,-366 20,-354 Q10,-340 0,-340 Q-10,-340 -20,-354 Z" fill="#ff8a9a" /> : null}
          {e === "sleepy" ? <ellipse cx={0} cy={-386} rx={22} ry={26} fill="#5c1626" stroke={INK} strokeWidth={6} /> : null}
          {e === "annoyed" ? <path d="M-26,-390 L26,-396" stroke={INK} strokeWidth={7} strokeLinecap="round" /> : null}
          {e === "worried" ? <path d="M-30,-384 Q0,-404 30,-384" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" /> : null}
          {e === "shock" ? <ellipse cx={0} cy={-380} rx={20} ry={28} fill="#5c1626" stroke={INK} strokeWidth={6} /> : null}
          {e === "smile" || e === "wink" || e === "stern" ? <path d="M-34,-402 Q0,-372 34,-402" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" /> : null}
          {e === "happy" ? <path d="M-44,-410 Q0,-346 44,-410 Z" fill="#5c1626" stroke={INK} strokeWidth={6} strokeLinejoin="round" /> : null}
          {e === "strain" || e === "shiver" ? (
            <g transform={`translate(${e === "shiver" ? chat : 0},0)`}>
              <rect x={-40} y={-410} width={80} height={30} rx={10} fill="#fff" stroke={INK} strokeWidth={6} />
              {[-20, 0, 20].map((x) => (
                <line key={x} x1={x} y1={-410} x2={x} y2={-380} stroke={INK} strokeWidth={3} />
              ))}
              <line x1={-40} y1={-395} x2={40} y2={-395} stroke={INK} strokeWidth={3} />
            </g>
          ) : null}
        </>
      )}
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
  /** atkı + bere: 0 = üstünde, 1 = uçup gitti */
  blanketOff?: number;
  /** konuşma (ağız açıklığı 0-1) */
  talk?: number;
  /** ellerin önünde çizilecek şey (karakter koordinatında) */
  front?: React.ReactNode;
}> = ({ pose, expr = "smile", w = 1, blink = 0, look = 0, t = 0, shiver = 0, blanketOff = 0, talk = 0, front }) => {
  const body = mix(K.cold, K.warm, w);
  const bodyL = mix(K.coldL, K.warmL, w);
  const bodyD = mix(K.coldD, K.warmD, w);
  const jx = shiver * Math.sin(t * 55) * 5;
  const fL = pose.footL ?? { x: -62, y: 0 };
  const fR = pose.footR ?? { x: 62, y: 0 };
  const legL = ik(fL.x + 52, fL.y + 206, 104, 104, 1);
  const legR = ik(fR.x - 52, fR.y + 206, 104, 104, -1);
  const armL = ik(pose.handL.x + 166, pose.handL.y + 430, 104, 98, 1);
  const armR = ik(pose.handR.x - 166, pose.handR.y + 430, 104, 98, -1);
  const shoe = (
    <g>
      <ellipse cx={0} cy={8} rx={38} ry={22} fill="#ffb627" stroke={INK} strokeWidth={SW} />
      <path d="M-32,14 Q0,28 32,14" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" />
    </g>
  );
  const hand = <circle cx={0} cy={6} r={26} fill={bodyL} stroke={INK} strokeWidth={SW} />;
  const bo = blanketOff;
  return (
    <g transform={`translate(${jx},0)`}>
      <defs>
        <clipPath id="kasBelly">
          <path d={BELLY} />
        </clipPath>
        <linearGradient id="tendonG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={K.tendonD} />
          <stop offset="0.45" stopColor="#ffffff" />
          <stop offset="1" stopColor={K.tendonD} />
        </linearGradient>
      </defs>
      <ellipse cx={0} cy={14} rx={130} ry={18} fill={INK} opacity={0.14} />
      <Limb x={-52} y={-206} s={legL} L1={104} L2={104} w1={34} w2={30} f1={body} f2={body} end={shoe} />
      <Limb x={52} y={-206} s={legR} L1={104} L2={104} w1={34} w2={30} f1={body} f2={body} end={shoe} />
      <g transform={`rotate(${pose.tilt ?? 0},0,-206)`}>
        {/* alt tendon */}
        <path d="M-32,-196 C-26,-182 -22,-168 -22,-158 A22,18 0 0 0 22,-158 C22,-168 26,-182 32,-196 Z" fill="url(#tendonG)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        {/* üst tendon */}
        <path d="M-44,-680 C-34,-712 -30,-740 -30,-760 A30,26 0 0 1 30,-760 C30,-740 34,-712 44,-680 Z" fill="url(#tendonG)" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M-8,-690 L-8,-772 M10,-690 L10,-770" stroke={K.tendonD} strokeWidth={3} opacity={0.8} />
        {/* kas karnı: lif demetleri */}
        <path d={BELLY} fill={body} />
        <g clipPath="url(#kasBelly)">
          {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((k) => (
            <path
              key={k}
              d={`${meridian(k)} L${(k + 1) * 6.6},-184 Q${(k + 1) * 30},-430 ${(k + 1) * 7.3},-692 Z`}
              fill={k % 2 ? body : mix(body, bodyD, 0.18)}
            />
          ))}
          {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((k) => (
            <path key={k} d={meridian(k)} stroke={bodyD} strokeWidth={5.5} fill="none" opacity={0.75} />
          ))}
          {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((k) => (
            <path key={k} d={meridian(k + 0.5)} stroke={bodyL} strokeWidth={6} fill="none" opacity={0.45} strokeLinecap="round" />
          ))}
          {/* enine çizgiler (iskelet kası dokusu) */}
          {Array.from({ length: 50 }).map((_, j) => (
            <line key={j} x1={-200} y1={-680 + j * 10} x2={200} y2={-680 + j * 10} stroke={bodyD} strokeWidth={1.6} opacity={0.16} />
          ))}
          {/* tendon yelpazesi: kirişin kasın içine yayılması */}
          <path d="M-46,-694 Q-24,-650 0,-596 Q24,-650 46,-694 Z" fill="url(#tendonG)" opacity={0.95} />
          <path d="M-40,-178 Q-20,-206 0,-246 Q20,-206 40,-178 Z" fill="url(#tendonG)" opacity={0.95} />
          {/* gölge + parlaklık */}
          <path d="M140,-600 Q200,-430 110,-220" stroke={bodyD} strokeWidth={56} fill="none" opacity={0.35} />
          <ellipse cx={-96} cy={-560} rx={30} ry={80} fill="#fff" opacity={0.3} transform="rotate(20,-96,-560)" />
          <ellipse cx={-130} cy={-460} rx={10} ry={26} fill="#fff" opacity={0.4} transform="rotate(10,-130,-460)" />
        </g>
        <path d={BELLY} fill="none" stroke={INK} strokeWidth={SW} />
        {/* buz (soğukken) */}
        {w < 0.7 ? (
          <g opacity={1 - w / 0.7}>
            {[-150, -110, 100, 145].map((x, i) => (
              <path
                key={x}
                d={`M${x - 11},${-300 + Math.abs(x) * 0.25 + (i % 2) * 30} l11,${28 + (i % 2) * 16} l11,${-28 - (i % 2) * 16} Z`}
                fill="#e6f7ff"
                stroke={INK}
                strokeWidth={4}
                strokeLinejoin="round"
              />
            ))}
            <path d="M-120,-600 q20,-14 40,-4 q20,-14 40,-2" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.85} />
          </g>
        ) : null}
        <KasFace e={expr} blink={blink} look={look} t={t} lidColor={body} talk={talk} />
        {/* atkı + bere (soğukken) */}
        {bo < 1 ? (
          <g transform={`translate(${bo * 560},${-bo * 900}) rotate(${bo * 200},0,-560)`} opacity={1 - bo * 0.3}>
            <path d="M-110,-616 Q0,-576 110,-616 L122,-576 Q0,-534 -122,-576 Z" fill="#18b5a4" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            {[-80, -40, 0, 40, 80].map((x) => (
              <line key={x} x1={x} y1={-598 + Math.abs(x) * 0.15} x2={x} y2={-558 + Math.abs(x) * 0.15} stroke="#ffd166" strokeWidth={7} />
            ))}
            <path d="M66,-572 L90,-440 L126,-446 L102,-578 Z" fill="#18b5a4" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M90,-440 l-4,22 M102,-442 l0,22 M114,-444 l4,22" stroke={INK} strokeWidth={5} strokeLinecap="round" />
            {/* bere tendonun ucunda */}
            <path d="M-46,-740 C-46,-810 46,-810 46,-740 Z" fill="#ffd166" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
            <rect x={-52} y={-752} width={104} height={24} rx={12} fill="#ff9f43" stroke={INK} strokeWidth={SW} />
            <circle cx={0} cy={-812} r={18} fill="#fff" stroke={INK} strokeWidth={SW} />
          </g>
        ) : null}
        {front}
        <Limb x={-166} y={-430} s={armL} L1={104} L2={98} w1={32} w2={30} f1={body} f2={body} end={hand} />
        <Limb x={166} y={-430} s={armR} L1={104} L2={98} w1={32} w2={30} f1={body} f2={body} end={hand} />
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
