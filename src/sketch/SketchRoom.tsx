/**
 * Kurşun kalem + kuru boya tarzı sıcak salon (1080x1920): şeftali tonlu duvar, gece penceresi,
 * çerçeveli aile resimleri, saksı bitki, yanan lambadaki sarı ışık, kitaplık, renkli bayrak süsü, bej kanepe.
 * Soluk tutulur ki önündeki figürler öne çıksın.
 */
import React from "react";
import { LINE } from "./SketchPerson";

const W = 1080;
const s = { stroke: LINE, strokeWidth: 3.2, strokeLinejoin: "round" as const };
const thin = { stroke: LINE, strokeWidth: 2, fill: "none", opacity: 0.7 };

const Frame: React.FC<{ x: number; y: number; w: number; h: number; faces: number }> = ({ x, y, w, h, faces }) => (
  <g>
    <path d={`M${x + w / 2},${y - 26} L${x + 8},${y} M${x + w / 2},${y - 26} L${x + w - 8},${y}`} {...thin} />
    <rect x={x} y={y} width={w} height={h} fill="#7a5640" {...s} />
    <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} fill="#efe4d3" {...s} strokeWidth={2} />
    {Array.from({ length: faces }).map((_, i) => {
      const cx = x + (w / (faces + 1)) * (i + 1);
      const cy = y + h * 0.45;
      const r = Math.min(w, h) * 0.13;
      return (
        <g key={i} stroke={LINE} strokeWidth={1.8}>
          <path d={`M${cx - r * 1.2},${y + h - 11} q${r * 1.2},${-r * 2.2} ${r * 2.4},0 Z`} fill={i % 2 ? "#d9876e" : "#7fa6c9"} />
          <circle cx={cx} cy={cy} r={r} fill="#f8eadb" />
          <circle cx={cx - r * 0.35} cy={cy - r * 0.1} r={1.6} fill={LINE} />
          <circle cx={cx + r * 0.35} cy={cy - r * 0.1} r={1.6} fill={LINE} />
          <path d={`M${cx - r * 0.4},${cy + r * 0.3} q${r * 0.4},${r * 0.35} ${r * 0.8},0`} fill="none" />
        </g>
      );
    })}
  </g>
);

export const SketchRoom: React.FC<{ t: number }> = ({ t }) => {
  const flag = ["#e8b84a", "#4fa3c7", "#d9534f", "#6bb36a", "#9b7bc4", "#ef8a4a"];
  const bunting = (x0: number, y0: number, x1: number, y1: number, sag: number, n: number, ph: number) => {
    const pts = Array.from({ length: n }).map((_, i) => {
      const u = (i + 0.5) / n;
      const x = x0 + (x1 - x0) * u;
      const y = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag;
      return [x, y, u] as const;
    });
    return (
      <g>
        <path d={`M${x0},${y0} Q${(x0 + x1) / 2},${(y0 + y1) / 2 + sag * 2} ${x1},${y1}`} {...thin} opacity={0.8} />
        {pts.map(([x, y], i) => {
          const sw = Math.sin(t * 2 + i * 0.8 + ph) * 3;
          return <path key={i} d={`M${x - 22},${y} L${x + 22},${y} L${x + sw},${y + 52} Z`} fill={flag[(i + ph) % flag.length]} {...s} strokeWidth={2.4} />;
        })}
      </g>
    );
  };
  return (
    <g>
      {/* duvarlar, tavan, zemin */}
      <rect width={W} height={1920} fill="#f4dcc6" />
      <path d="M0,0 L120,150 L120,1180 L0,1340 Z" fill="#ecd0b6" {...s} strokeWidth={2.4} />
      <path d={`M${W},0 L${W - 120},150 L${W - 120},1180 L${W},1340 Z`} fill="#ecd0b6" {...s} strokeWidth={2.4} />
      <path d={`M0,0 L${W},0 L${W - 120},150 L120,150 Z`} fill="#f7e5d3" {...s} strokeWidth={2.4} />
      <path d={`M0,1340 L120,1180 L${W - 120},1180 L${W},1340 L${W},1920 L0,1920 Z`} fill="#e9caa8" {...s} strokeWidth={2.4} />
      {/* parke çizgileri */}
      {Array.from({ length: 9 }).map((_, i) => {
        const x = 120 + ((W - 240) / 8) * i;
        return <path key={i} d={`M${x},1180 L${(x - W / 2) * 2.2 + W / 2},1920`} {...thin} opacity={0.25} />;
      })}
      {/* duvar alt pervazı */}
      <path d={`M120,1150 L${W - 120},1150`} {...thin} />
      {/* pencere */}
      <g>
        <rect x={150} y={330} width={240} height={330} fill="#2c3a63" {...s} />
        <path d="M270,330 L270,660 M150,495 L390,495" {...s} strokeWidth={6} stroke="#efe4d3" />
        <rect x={150} y={330} width={240} height={330} fill="none" {...s} />
        {[[180, 370], [330, 400], [220, 440], [360, 560], [200, 600], [300, 620]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5 + (i % 2)} fill="#f4ecd0" opacity={0.6 + 0.4 * Math.sin(t * 3 + i)} />
        ))}
        <path d="M395,320 L395,690 Q420,640 410,520 Q430,420 415,320 Z" fill="#e3c9c0" {...s} strokeWidth={2.4} />
        <path d="M140,316 L420,316" {...s} strokeWidth={6} />
        {[150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400].map((x) => (
          <circle key={x} cx={x} cy={316} r={6} fill="#efe4d3" {...s} strokeWidth={2} />
        ))}
      </g>
      {/* çerçeveler */}
      <Frame x={470} y={330} w={170} h={140} faces={2} />
      <Frame x={680} y={360} w={130} h={170} faces={2} />
      <Frame x={480} y={520} w={80} h={100} faces={1} />
      <Frame x={580} y={520} w={80} h={100} faces={1} />
      {/* tavan lambası */}
      <path d="M560,150 L560,240" {...thin} opacity={0.8} />
      <path d="M480,300 Q480,236 560,236 Q640,236 640,300 Z" fill="#f2e3cf" {...s} strokeWidth={2.4} opacity={0.7} />
      {/* kitaplık */}
      <g>
        <path d="M850,560 L960,520 L960,1210 L850,1250 Z" fill="#8a5f42" {...s} />
        {[640, 780, 920, 1060].map((y, i) => (
          <path key={y} d={`M850,${y + 40 - i * 0} L960,${y}`} {...s} strokeWidth={4} />
        ))}
        {[
          [0, "#3f7f8c"], [1, "#c95a4a"], [2, "#e2b04a"], [3, "#5c8a52"], [4, "#9b6ba8"], [5, "#4f6fa8"], [6, "#d77b4e"], [7, "#3f7f8c"],
        ].map(([i, c]) => {
          const shelf = Math.floor((i as number) / 3);
          const j = (i as number) % 3;
          const x = 862 + j * 30;
          const y = 640 + shelf * 140 + 40 - j * 11;
          return <path key={i as number} d={`M${x},${y} L${x},${y - 84} L${x + 22},${y - 92} L${x + 22},${y - 8} Z`} fill={c as string} {...s} strokeWidth={2.2} />;
        })}
        <ellipse cx={920} cy={905} rx={24} ry={14} fill="#c9b8a0" {...s} strokeWidth={2} />
      </g>
      {/* ayaklı lamba + sıcak ışık */}
      <g>
        <defs>
          <radialGradient id="lampGlow">
            <stop offset="0" stopColor="#ffe08a" stopOpacity={0.55 + Math.sin(t * 1.5) * 0.04} />
            <stop offset="1" stopColor="#ffe08a" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={770} cy={700} rx={260} ry={300} fill="url(#lampGlow)" />
        <path d="M770,700 L770,1120 M740,1124 L800,1124" {...s} strokeWidth={5} />
        <path d="M720,700 L820,700 L795,590 L745,590 Z" fill="#f2d64a" {...s} />
      </g>
      {/* saksı bitki (sol köşe, zeminde) */}
      <g transform="translate(985,1240) scale(1.1)">
        {[-60, -35, -15, 5, 25, 45, 65].map((a, i) => (
          <path key={i} d={`M0,0 Q${a * 1.2},${-110 - Math.abs(a) * 0.5} ${a * 2.2},${-230 + Math.abs(a) * 1.6}`} fill="none" stroke="#5f8f4a" strokeWidth={14} strokeLinecap="round" opacity={0.85} />
        ))}
        {[-60, -35, -15, 5, 25, 45, 65].map((a, i) => (
          <path key={i} d={`M0,0 Q${a * 1.2},${-110 - Math.abs(a) * 0.5} ${a * 2.2},${-230 + Math.abs(a) * 1.6}`} {...thin} opacity={0.6} />
        ))}
        <path d="M-55,-5 L55,-5 L40,110 L-40,110 Z" fill="#c76a4a" {...s} />
      </g>
      {/* bayrak süsü */}
      {bunting(-20, 250, 560, 200, 60, 9, 0)}
      {bunting(560, 200, 1100, 300, 50, 8, 3)}
      {/* kanepe arkalığı */}
      <g>
        <path d="M190,1000 Q190,960 240,960 L840,960 Q890,960 890,1000 L890,1200 L190,1200 Z" fill="#efe1cc" {...s} />
        <path d="M200,1010 L880,1010 M200,1050 L880,1050 M200,1090 L880,1090" {...thin} opacity={0.18} />
        <path d="M410,966 L410,1170 M670,966 L670,1170" {...thin} opacity={0.4} />
      </g>
    </g>
  );
};

/** kanepenin oturma minderi + kolçaklar (figürlerin önüne çizilir) */
export const SofaFront: React.FC = () => (
  <g>
    <path d="M210,1236 L870,1236 L880,1300 L200,1300 Z" fill="#ebdac2" {...s} />
    <path d="M214,1242 Q540,1230 866,1242" {...thin} opacity={0.4} />
    <path d="M140,1300 L940,1300 L940,1370 L140,1370 Z" fill="#dcc8ac" {...s} />
    {[170, 900].map((x) => (
      <path key={x} d={`M${x - 10},1370 L${x - 6},1405 L${x + 16},1405 L${x + 20},1370 Z`} fill="#6e4c36" {...s} />
    ))}
    <path d="M90,1110 Q90,1070 140,1070 L190,1070 Q230,1070 230,1110 L230,1370 L90,1370 Z" fill="#eadbc4" {...s} />
    <path d="M850,1110 Q850,1070 890,1070 L940,1070 Q990,1070 990,1110 L990,1370 L850,1370 Z" fill="#eadbc4" {...s} />
    <path d="M108,1120 L108,1350 M972,1120 L972,1350" {...thin} opacity={0.3} />
  </g>
);
