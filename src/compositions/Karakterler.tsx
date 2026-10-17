/** BoyUzama karakter kadrosu (anime tarzı): genç, anne, koç, halterci, basketbolcu. */
import { AbsoluteFill } from "remotion";
import { AnimeTeen, type AnimeExpr, type AnimeLook, type AnimePose } from "../anime/AnimeTeen";
import { BALLER, COACH, LIFTER, MOM } from "../anime/looks";
import { SANS, loadFonts } from "../fonts";

loadFonts();

const DOWN: AnimePose = { elR: [404, 840], wrR: [396, 1000], elL: [676, 846], wrL: [684, 1004], itemL: null };
const CAST: { name: string; look?: AnimeLook; pose: AnimePose; expr: AnimeExpr; s: number }[] = [
  { name: "genç", pose: {}, expr: "grin", s: 0.5 },
  { name: "anne", look: MOM, pose: { ...DOWN, elR: [380, 600], wrR: [330, 470] }, expr: "shout", s: 0.47 },
  { name: "koç", look: COACH, pose: { ...DOWN }, expr: "smile", s: 0.5 },
  { name: "halterci", look: LIFTER, pose: { elR: [372, 520], wrR: [384, 360], elL: [708, 520], wrL: [696, 360], itemL: null }, expr: "ouch", s: 0.4 },
  { name: "basketbolcu", look: BALLER, pose: { ...DOWN }, expr: "grin", s: 0.58 },
];

export const Karakterler: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "linear-gradient(180deg,#1f7fe0,#a8dcff)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {CAST.map((c, i) => {
        const x = i < 3 ? 180 + i * 360 : 330 + (i - 3) * 420;
        const y = i < 3 ? 880 : 1800;
        return (
          <g key={c.name}>
            <g transform={`translate(${x},${y}) scale(${c.s}) translate(-540,-1586)`}>
              <AnimeTeen uid={`k${i}`} look={c.look} pose={c.pose} expr={c.expr} />
            </g>
            <text x={x} y={y + 56} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill="#fff" stroke="#1b1420" strokeWidth={8} paintOrder="stroke">
              {c.name}
            </text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
