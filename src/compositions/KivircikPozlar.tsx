/** Kıvırcık Bora'nın videoda kullanılacak poz ve ifadeleri (kontrol tablosu). */
import { AbsoluteFill } from "remotion";
import { CurlyGuy, type CurlyExpr, type CurlyPose } from "../avatar/CurlyGuy";
import { SANS, loadFonts } from "../fonts";

loadFonts();

export const KIVIRCIK_POZLAR: { name: string; pose: CurlyPose; expr: CurlyExpr }[] = [
  { name: "yiyor", pose: { r: { el: [300, 480], wr: [238, 300] } }, expr: "chew" },
  { name: "şaşkın", pose: { r: { el: [300, 500], wr: [300, 400] } }, expr: "surprise" },
  { name: "anlatıyor", pose: { r: { el: [320, 430], wr: [328, 310], hand: "point", handRot: 10 } }, expr: "grin" },
  { name: "düşünüyor", pose: { r: { el: [290, 500], wr: [228, 300] } }, expr: "think" },
  { name: "mide", pose: { r: { el: [292, 560], wr: [236, 560], hand: "open" }, l: { el: [108, 560], wr: [164, 560], hand: "open" }, head: 4 }, expr: "ouch" },
  { name: "esniyor", pose: { r: { el: [300, 470], wr: [236, 286], hand: "open" } }, expr: "yawn" },
  { name: "elma", pose: { r: { el: [300, 560], wr: [330, 470] } }, expr: "happy" },
  { name: "süper", pose: { r: { el: [300, 560], wr: [330, 470], hand: "thumb" } }, expr: "smile" },
  { name: "telefon", pose: { r: { el: [290, 560], wr: [252, 440] }, head: 5, ly: 4 }, expr: "laugh" },
];

export const KivircikPozlar: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "radial-gradient(circle at 50% 40%, #dcd2c5, #c4b6a4)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {KIVIRCIK_POZLAR.map((p, i) => {
        const x = 180 + (i % 3) * 360;
        const y = 600 + Math.floor(i / 3) * 620;
        return (
          <g key={p.name}>
            <g transform={`translate(${x},${y}) scale(0.62) translate(-200,-880)`}>
              <CurlyGuy id={`kp${i}`} pose={p.pose} expr={p.expr} />
            </g>
            <text x={x} y={y + 50} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill="#3a2a1a">
              {p.name}
            </text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
