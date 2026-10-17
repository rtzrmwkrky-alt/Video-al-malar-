/** Anime figürünün videoda kullanılacak poz ve ifadeleri (kontrol tablosu). */
import { AbsoluteFill } from "remotion";
import { AnimeTeen, type AnimeExpr, type AnimePose } from "../anime/AnimeTeen";
import { SANS, loadFonts } from "../fonts";

loadFonts();

export const POZLAR: { name: string; pose: AnimePose; expr: AnimeExpr }[] = [
  { name: "dambıl", pose: { elR: [404, 840], wrR: [396, 1000], elL: [700, 840], wrL: [690, 720] }, expr: "grin" },
  { name: "düşünme", pose: { elR: [430, 860], wrR: [500, 640], elL: [706, 842], wrL: [724, 1000] }, expr: "think" },
  { name: "zorlanma", pose: { elR: [372, 520], wrR: [384, 360], elL: [708, 520], wrL: [696, 360], itemL: null }, expr: "ouch" },
  { name: "squat", pose: { elR: [380, 900], wrR: [360, 1060], elL: [700, 900], wrL: [720, 1060], itemR: "dumbbell", squat: 1 }, expr: "grin" },
  { name: "mutlu", pose: { elR: [404, 840], wrR: [396, 1000], elL: [676, 846], wrL: [684, 1004], itemL: null }, expr: "happy" },
  { name: "telefon", pose: { elR: [404, 840], wrR: [396, 1000], elL: [730, 790], wrL: [700, 620], itemL: "phone" }, expr: "wink" },
];

export const FigurPozlar: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "linear-gradient(180deg,#1f7fe0,#a8dcff)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {POZLAR.map((p, i) => {
        const x = 180 + (i % 3) * 360;
        const y = 900 + Math.floor(i / 3) * 900;
        return (
          <g key={p.name}>
            <g transform={`translate(${x},${y}) scale(0.52) translate(-540,-1586)`}>
              <AnimeTeen uid={`p${i}`} pose={p.pose} expr={p.expr} />
            </g>
            <text x={x} y={y + 60} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill="#fff" stroke="#1b1420" strokeWidth={8} paintOrder="stroke">
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
