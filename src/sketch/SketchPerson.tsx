/**
 * Kurşun kalem + kuru boya tarzı sade figür (kullanıcının gösterdiği "azamaoz" örneği gibi):
 * büyük yuvarlak açık tenli kafa, nokta gözler, C kulak, kıvrık burun, ince kahve kontur,
 * düz renk tişört + pantolon, ince kollar, parmaklı eller. Grenli boya dokusu `SketchDefs` filtresinden gelir.
 * 400x820 yerel kutu; ayakta yer çizgisi y=800, oturunca kalça y=480 (koltuk seviyesi).
 */
import React from "react";
import { blink } from "../avatar/Avatars";

export const LINE = "#3b2b22";

export type SketchHair = "tuft" | "short" | "side" | "grandpa" | "bun";

export type SketchLook = {
  skin: string;
  hair: string;
  hairStyle: SketchHair;
  top: string;
  bottom: string;
  shoe: string;
  mustache?: boolean;
  glasses?: boolean;
  lashes?: boolean;
};

export type SketchExpr = "smile" | "grin" | "surprise" | "worry" | "think" | "flat";

/** kol: omuzdan aşağıya göre açı (derece, + = dışa), dirsek bükümü (derece) */
export type Arm = { a: number; e: number };

export type SketchPose = {
  sit?: boolean;
  l?: Arm;
  r?: Arm;
  /** yüzün döndüğü yön (-1 sol … 1 sağ) */
  turn?: number;
  /** elde tutulan şey */
  itemR?: "tea" | "phone" | "remote";
  /** oturunca bacakların uzandığı taraf (varsayılan: yüzün döndüğü taraf) */
  legSide?: -1 | 1;
};

const HX = 200;
const HY = 150;
const RX = 80;
const RY = 86;
const SW = 3.6;

const rad = (d: number) => (d * Math.PI) / 180;

/** ince konturlu uzuv (kol/bacak) */
const Limb: React.FC<{ pts: [number, number][]; fill: string; w: number }> = ({ pts, fill, w }) => {
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={LINE} strokeWidth={w + SW * 2} />
      <path d={d} stroke={fill} strokeWidth={w} />
    </g>
  );
};

/** dört parmaklı küçük el; açı = kolun yönü */
const Hand: React.FC<{ x: number; y: number; ang: number; skin: string; flip?: boolean }> = ({ x, y, ang, skin, flip }) => (
  <g transform={`translate(${x},${y}) rotate(${ang}) scale(${flip ? -1 : 1},1)`}>
    <path
      d="M-10,-4 Q-13,10 -9,20 Q-8,25 -5,21 L-5,14 Q-4,27 0,27 Q3,26 2,15 Q5,27 8,25 Q10,23 7,13 Q11,22 13,19 Q15,15 10,4 Q12,-4 4,-6 L-6,-6 Z"
      fill={skin}
      stroke={LINE}
      strokeWidth={2.8}
      strokeLinejoin="round"
    />
    <path d="M-10,2 Q-17,6 -15,12 Q-12,14 -9,9" fill={skin} stroke={LINE} strokeWidth={2.6} strokeLinejoin="round" />
  </g>
);

/** side: -1 sol, 1 sağ. açılar aşağı yönden, + = dışa doğru */
const armPts = (sx: number, sy: number, arm: Arm, side: -1 | 1) => {
  const a1 = rad(arm.a);
  const e: [number, number] = [sx + side * Math.sin(a1) * 100, sy + Math.cos(a1) * 100];
  const a2 = rad(arm.a + arm.e);
  const h: [number, number] = [e[0] + side * Math.sin(a2) * 88, e[1] + Math.cos(a2) * 88];
  return { e, h, ang: -side * (arm.a + arm.e) };
};

const Item: React.FC<{ kind: NonNullable<SketchPose["itemR"]> }> = ({ kind }) => {
  if (kind === "tea")
    return (
      <g>
        <path d="M-14,-30 L14,-30 Q16,-6 10,4 L-10,4 Q-16,-6 -14,-30 Z" fill="#f6efe6" fillOpacity={0.75} stroke={LINE} strokeWidth={2.6} />
        <path d="M-12,-20 L12,-20 Q13,-6 9,2 L-9,2 Q-13,-6 -12,-20 Z" fill="#b5321f" />
        <ellipse cx={0} cy={-30} rx={14} ry={4} fill="none" stroke={LINE} strokeWidth={2.4} />
      </g>
    );
  if (kind === "phone")
    return (
      <g>
        <rect x={-14} y={-34} width={28} height={50} rx={6} fill="#2b2b33" stroke={LINE} strokeWidth={2.6} />
        <rect x={-10} y={-29} width={20} height={38} rx={3} fill="#9fd3e8" />
      </g>
    );
  return <rect x={-8} y={-30} width={16} height={44} rx={5} fill="#3a3a40" stroke={LINE} strokeWidth={2.6} />;
};

const Hair: React.FC<{ look: SketchLook; turn: number }> = ({ look, turn }) => {
  const s = { fill: look.hair, stroke: LINE, strokeWidth: SW, strokeLinejoin: "round" as const };
  const o = turn * 10;
  switch (look.hairStyle) {
    case "tuft":
      // açık renk, kalemle çekilmiş dik tutamlar (soldaki çocuk gibi)
      return (
        <g stroke={LINE} strokeWidth={3} strokeLinecap="round" fill="none">
          {[-58, -42, -26, -10, 6, 22, 38, 52].map((x, i) => {
            const bx = HX + x + o;
            const by = HY - RY + 18 + Math.abs(x) * 0.28;
            const len = 26 + ((i * 7) % 11);
            const lean = x * 0.25 + (i % 2 ? 6 : -4);
            return (
              <g key={i}>
                <path d={`M${bx - 6},${by + 4} Q${bx + lean * 0.3},${by - len * 0.5} ${bx + lean},${by - len} Q${bx + lean * 0.4 + 4},${by - len * 0.4} ${bx + 7},${by + 4}`} fill={look.hair} />
              </g>
            );
          })}
        </g>
      );
    case "short":
      // koyu dolu saç, üstte birkaç sivri uç (ortadaki çocuk gibi)
      return (
        <path
          d={`M${HX - RX + 2},${HY - 8} Q${HX - RX - 6},${HY - RY + 6} ${HX - 40},${HY - RY - 4} L${HX - 32},${HY - RY - 22} L${HX - 14},${HY - RY - 6} L${HX + 2},${HY - RY - 26} L${HX + 16},${HY - RY - 6} L${HX + 38},${HY - RY - 18} L${HX + 40},${HY - RY + 2} Q${HX + RX + 6},${HY - RY + 18} ${HX + RX - 2},${HY - 4} Q${HX + 54},${HY - 46} ${HX + 20 + o},${HY - 44} Q${HX - 4 + o},${HY - 30} ${HX - 30 + o},${HY - 40} Q${HX - 62},${HY - 42} ${HX - RX + 2},${HY - 8} Z`}
          {...s}
        />
      );
    case "side":
      // yana taranmış saç
      return (
        <path
          d={`M${HX - RX + 1},${HY} Q${HX - RX - 8},${HY - RY - 6} ${HX + 4},${HY - RY - 10} Q${HX + RX + 10},${HY - RY} ${HX + RX - 1},${HY - 6} Q${HX + 60},${HY - 52} ${HX + 26},${HY - 50} Q${HX - 30},${HY - 54} ${HX - 50},${HY - 30} Q${HX - 64},${HY - 18} ${HX - RX + 1},${HY} Z`}
          {...s}
        />
      );
    case "bun":
      return (
        <g>
          <circle cx={HX + 4} cy={HY - RY - 18} r={30} {...s} />
          <path
            d={`M${HX - RX},${HY + 30} Q${HX - RX - 12},${HY - RY - 4} ${HX},${HY - RY - 6} Q${HX + RX + 12},${HY - RY - 4} ${HX + RX},${HY + 30} Q${HX + RX - 6},${HY - 36} ${HX + 20},${HY - 50} Q${HX - 20},${HY - 30} ${HX - 60},${HY - 34} Q${HX - RX + 6},${HY - 10} ${HX - RX},${HY + 30} Z`}
            {...s}
          />
        </g>
      );
    case "grandpa":
      // kel tepe, yanlarda gri tutamlar
      return (
        <g {...s}>
          <path d={`M${HX - RX + 2},${HY + 10} Q${HX - RX - 14},${HY - 30} ${HX - RX + 14},${HY - 52} Q${HX - RX + 6},${HY - 26} ${HX - RX + 18},${HY - 6} Z`} />
          <path d={`M${HX + RX - 2},${HY + 10} Q${HX + RX + 14},${HY - 30} ${HX + RX - 14},${HY - 52} Q${HX + RX - 6},${HY - 26} ${HX + RX - 18},${HY - 6} Z`} />
          <path d={`M${HX - 18},${HY - RY + 4} q6,-14 2,-24 M${HX + 4},${HY - RY + 2} q8,-10 6,-20`} fill="none" />
        </g>
      );
  }
};

const Face: React.FC<{ look: SketchLook; t: number; seed: number; talk: number; expr: SketchExpr; turn: number }> = ({ look, t, seed, talk, expr, turn }) => {
  const shut = blink(t, seed) > 0.4;
  const fx = HX + turn * 18;
  const ey = HY + 4;
  const eyeR = expr === "surprise" ? 7.5 : 6;
  const brow =
    expr === "worry"
      ? [`M${fx - 40},${ey - 22} q12,-10 20,-4`, `M${fx + 20},${ey - 26} q8,-6 20,4`]
      : expr === "surprise"
        ? [`M${fx - 40},${ey - 28} q10,-8 20,-2`, `M${fx + 20},${ey - 30} q10,-6 20,2`]
        : expr === "think"
          ? [`M${fx - 40},${ey - 18} q10,-4 20,0`, `M${fx + 20},${ey - 28} q10,-6 20,2`]
          : [`M${fx - 40},${ey - 20} q10,-6 20,-2`, `M${fx + 20},${ey - 22} q10,-4 20,2`];
  const nose = turn >= 0 ? `M${fx + 4},${ey + 14} q12,6 2,14` : `M${fx - 4},${ey + 14} q-12,6 -2,14`;
  const my = ey + 44;
  let mouth: React.ReactNode;
  if (talk > 0.08) {
    const h = 6 + talk * 16;
    mouth = (
      <path
        d={`M${fx - 16},${my} Q${fx},${my + 4} ${fx + 16},${my} Q${fx + 12},${my + h} ${fx},${my + h + 1} Q${fx - 12},${my + h} ${fx - 16},${my} Z`}
        fill="#7a2f2a"
        stroke={LINE}
        strokeWidth={2.8}
        strokeLinejoin="round"
      />
    );
  } else if (expr === "surprise") {
    mouth = <ellipse cx={fx} cy={my + 6} rx={8} ry={11} fill="#7a2f2a" stroke={LINE} strokeWidth={2.8} />;
  } else if (expr === "worry") {
    mouth = <path d={`M${fx - 14},${my + 8} q14,-10 28,0`} fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" />;
  } else if (expr === "flat" || expr === "think") {
    mouth = <path d={`M${fx - 12},${my + 4} q14,${expr === "think" ? -4 : 0} 26,2`} fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" />;
  } else if (expr === "grin") {
    mouth = <path d={`M${fx - 20},${my - 2} Q${fx},${my + 26} ${fx + 20},${my - 2} Z`} fill="#fff" stroke={LINE} strokeWidth={2.8} strokeLinejoin="round" />;
  } else {
    mouth = <path d={`M${fx - 18},${my} q18,16 36,-2`} fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" />;
  }
  return (
    <g>
      {/* allık */}
      <ellipse cx={fx - 42} cy={ey + 30} rx={13} ry={7} fill="#e9897a" opacity={0.28} />
      <ellipse cx={fx + 42} cy={ey + 30} rx={13} ry={7} fill="#e9897a" opacity={0.28} />
      {/* kaşlar */}
      <g fill="none" stroke={LINE} strokeWidth={2.8} strokeLinecap="round">
        {brow.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* gözler */}
      {shut ? (
        <path d={`M${fx - 36},${ey + 2} q7,5 14,0 M${fx + 22},${ey + 2} q7,5 14,0`} fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" />
      ) : (
        <g>
          <ellipse cx={fx - 29} cy={ey} rx={eyeR} ry={eyeR + 1.5} fill="#1f1714" />
          <ellipse cx={fx + 29} cy={ey} rx={eyeR} ry={eyeR + 1.5} fill="#1f1714" />
          <circle cx={fx - 27} cy={ey - 3} r={1.8} fill="#fff" />
          <circle cx={fx + 31} cy={ey - 3} r={1.8} fill="#fff" />
          {look.lashes ? <path d={`M${fx - 35},${ey - 5} l-6,-4 M${fx + 35},${ey - 5} l6,-4`} stroke={LINE} strokeWidth={2.4} strokeLinecap="round" /> : null}
        </g>
      )}
      {look.glasses ? (
        <g fill="none" stroke={LINE} strokeWidth={2.6}>
          <circle cx={fx - 29} cy={ey} r={17} />
          <circle cx={fx + 29} cy={ey} r={17} />
          <path d={`M${fx - 12},${ey - 2} q12,-6 24,0`} />
        </g>
      ) : null}
      <path d={nose} fill="none" stroke={LINE} strokeWidth={2.8} strokeLinecap="round" />
      {look.mustache ? (
        <path d={`M${fx - 24},${my - 4} Q${fx - 12},${my - 16} ${fx},${my - 8} Q${fx + 12},${my - 16} ${fx + 24},${my - 4} Q${fx + 12},${my} ${fx},${my - 4} Q${fx - 12},${my} ${fx - 24},${my - 4} Z`} fill={look.hair} stroke={LINE} strokeWidth={2.6} strokeLinejoin="round" />
      ) : null}
      {mouth}
    </g>
  );
};

export const SketchPerson: React.FC<{
  t: number;
  look: SketchLook;
  pose?: SketchPose;
  expr?: SketchExpr;
  talk?: number;
  seed?: number;
}> = ({ t, look, pose = {}, expr = "smile", talk = 0, seed = 0 }) => {
  const turn = pose.turn ?? 0.3;
  const breath = Math.sin(t * 2 + seed) * 2;
  const l = pose.l ?? { a: 12, e: 6 };
  const r = pose.r ?? { a: 12, e: 6 };
  const sit = !!pose.sit;
  const SY = 278;
  const L = armPts(150, SY, l, -1);
  const R = armPts(250, SY, r, 1);
  const leftE = L.e;
  const leftH = L.h;
  const rightE = R.e;
  const rightH = R.h;
  const legW = 38;
  const sd = pose.legSide ?? (turn >= 0 ? 1 : -1);
  return (
    <g>
      <ellipse cx={sit ? 200 + sd * 100 : 200} cy={sit ? 732 : 806} rx={110} ry={13} fill="#5a3a26" opacity={0.13} />
      {/* bacaklar */}
      {sit ? (
        <g>
          {/* oturuş: yüz dönük tarafa uyluk yana uzanır (3/4 görünüş), baldır aşağı sarkar */}
          <Limb pts={[[222, 478], [222 + sd * 92, 494], [222 + sd * 100, 690]]} fill={look.bottom} w={legW} />
          <Limb pts={[[178, 486], [178 + sd * 92, 506], [178 + sd * 96, 706]]} fill={look.bottom} w={legW} />
          <path d={`M${178 + sd * 70},${488} q${sd * 22},4 ${sd * 30},18`} fill="none" stroke={LINE} strokeWidth={2} opacity={0.45} />
        </g>
      ) : (
        <g>
          <Limb pts={[[178, 470], [174, 772]]} fill={look.bottom} w={legW} />
          <Limb pts={[[222, 470], [226, 772]]} fill={look.bottom} w={legW} />
          <path d="M176,600 q4,20 -2,40 M224,640 q-4,20 2,36" fill="none" stroke={LINE} strokeWidth={2} opacity={0.4} />
        </g>
      )}
      {/* ayakkabılar */}
      {(sit ? [[178 + sd * 100, 718], [222 + sd * 104, 702]] : [[166, 788], [234, 788]]).map(([x, y], i) => (
        <path
          key={i}
          d={`M${x - 22},${y - 14} Q${x - 26},${y + 10} ${x - 6 + (i ? 10 : -10)},${y + 12} L${x + 20 + (i ? 10 : -10)},${y + 12} Q${x + 30 + (i ? 10 : -10)},${y + 4} ${x + 18},${y - 6} Q${x},${y - 18} ${x - 22},${y - 14} Z`}
          fill={look.shoe}
          stroke={LINE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      ))}
      <g transform={`translate(0,${breath * 0.5})`}>
        {/* pantolon üstü */}
        <path d="M148,452 L252,452 L258,500 L148,500 Z" fill={look.bottom} stroke={LINE} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M200,460 L200,498" stroke={LINE} strokeWidth={2} opacity={0.5} />
        {/* tişört gövde */}
        <path
          d={`M148,262 Q200,250 252,262 Q262,360 256,${470 + breath} Q200,${480 + breath} 144,${470 + breath} Q138,360 148,262 Z`}
          fill={look.top}
          stroke={LINE}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {/* kollar (kol derisi) */}
        <Limb pts={[[150, SY], leftE, leftH]} fill={look.skin} w={22} />
        <Limb pts={[[250, SY], rightE, rightH]} fill={look.skin} w={22} />
        <Hand x={leftH[0]} y={leftH[1]} ang={L.ang} skin={look.skin} flip />
        <g>
          {pose.itemR ? (
            <g transform={`translate(${rightH[0] + 2},${rightH[1] + 14})`}>
              <Item kind={pose.itemR} />
            </g>
          ) : null}
          <Hand x={rightH[0]} y={rightH[1]} ang={R.ang} skin={look.skin} />
        </g>
        {/* kollar: tişört kolları */}
        {[
          { s: [150, SY] as [number, number], e: leftE },
          { s: [250, SY] as [number, number], e: rightE },
        ].map(({ s: sh, e }, i) => {
          const dx = e[0] - sh[0];
          const dy = e[1] - sh[1];
          const len = Math.hypot(dx, dy);
          const m: [number, number] = [sh[0] + (dx / len) * 46, sh[1] + (dy / len) * 46];
          return (
            <g key={i}>
              <Limb pts={[[sh[0] + (i ? -6 : 6), sh[1] - 6], m]} fill={look.top} w={40} />
              <path d={`M${sh[0] + (i ? -10 : 10)},${sh[1] - 6} L${sh[0] + (i ? -10 : 10)},${sh[1] + 30}`} stroke={look.top} strokeWidth={22} />
            </g>
          );
        })}
        {/* yaka + kırışık çizgileri */}
        <path d="M178,258 Q200,276 222,258" fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" />
        <path d="M170,330 q8,30 0,60 M232,350 q-6,24 2,50" fill="none" stroke={LINE} strokeWidth={2} opacity={0.35} />
        {/* boyun */}
        <path d="M186,226 L186,262 Q200,270 214,262 L214,226 Z" fill={look.skin} stroke={LINE} strokeWidth={SW} strokeLinejoin="round" />
        {/* kafa */}
        <g transform={`rotate(${Math.sin(t * 1.3 + seed) * 1.5},200,230)`}>
          {/* kulak (yüzün döndüğü yönün tersinde) */}
          {turn >= 0 ? (
            <path d={`M${HX - RX + 6},${HY - 4} q-22,-6 -20,16 q2,18 22,14`} fill={look.skin} stroke={LINE} strokeWidth={SW} strokeLinejoin="round" />
          ) : (
            <path d={`M${HX + RX - 6},${HY - 4} q22,-6 20,16 q-2,18 -22,14`} fill={look.skin} stroke={LINE} strokeWidth={SW} strokeLinejoin="round" />
          )}
          <ellipse cx={HX} cy={HY} rx={RX} ry={RY} fill={look.skin} stroke={LINE} strokeWidth={SW} />
          {turn >= 0 ? (
            <path d={`M${HX - RX - 6},${HY + 2} q-8,8 2,14`} fill="none" stroke={LINE} strokeWidth={2.4} strokeLinecap="round" />
          ) : (
            <path d={`M${HX + RX + 6},${HY + 2} q8,8 -2,14`} fill="none" stroke={LINE} strokeWidth={2.4} strokeLinecap="round" />
          )}
          <Hair look={look} turn={turn} />
          <Face look={look} t={t} seed={seed} talk={talk} expr={expr} turn={turn} />
        </g>
      </g>
    </g>
  );
};

/** kalem çizgisi titremesi + kuru boya greni; figürleri ve odayı bununla sar */
export const SketchDefs: React.FC = () => (
  <defs>
    <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={7} result="wob" />
      <feDisplacementMap in="SourceGraphic" in2="wob" scale={3} result="wobbled" />
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={3} result="grain" />
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.17  0 0 0 0 0.12  0 0 0 -2.2 1.35" result="speck" />
      <feComposite in="speck" in2="wobbled" operator="in" result="speckIn" />
      <feComponentTransfer in="speckIn" result="speckSoft">
        <feFuncA type="linear" slope={0.35} />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="wobbled" />
        <feMergeNode in="speckSoft" />
      </feMerge>
    </filter>
  </defs>
);

export const SKETCH_CAST: Record<string, { name: string; look: SketchLook }> = {
  sari: {
    name: "Sarı saçlı",
    look: { skin: "#fbf1e6", hair: "#f3e3b8", hairStyle: "tuft", top: "#d9453b", bottom: "#4f9a4c", shoe: "#5a4a40" },
  },
  siyah: {
    name: "Siyah saçlı",
    look: { skin: "#f9ece0", hair: "#1e1a1c", hairStyle: "short", top: "#4f8fd0", bottom: "#8d8e92", shoe: "#f2ece4" },
  },
  dede: {
    name: "Dede",
    look: { skin: "#f5e4d4", hair: "#bdb6ae", hairStyle: "grandpa", top: "#f08a3a", bottom: "#7a5638", shoe: "#5c5550", mustache: true, glasses: true },
  },
  kiz: {
    name: "Kız",
    look: { skin: "#fbefe4", hair: "#6b3f26", hairStyle: "bun", top: "#e58fb2", bottom: "#3f5a8a", shoe: "#f2ece4", lashes: true },
  },
};
