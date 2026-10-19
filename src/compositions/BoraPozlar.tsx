/** Bora'nın videoda kullanılacak poz ve ifadeleri (kontrol tablosu). */
import { AbsoluteFill } from "remotion";
import { Bora, type BoraExpr, type BoraPose } from "../avatar/Bora";
import { SANS, loadFonts } from "../fonts";

loadFonts();

export const BORA_POZLAR: { name: string; pose: BoraPose; expr: BoraExpr }[] = [
  { name: "yiyor", pose: { el: [292, 440], wr: [302, 280] }, expr: "chew" },
  { name: "şaşkın", pose: { el: [292, 450], wr: [318, 330] }, expr: "surprise" },
  { name: "anlatıyor", pose: { el: [312, 370], wr: [322, 250], hand: "point", handRot: 20 }, expr: "grin" },
  { name: "düşünüyor", pose: { el: [300, 450], wr: [278, 275] }, expr: "think" },
  { name: "mide", pose: { el: [252, 470], wr: [290, 432], hand: "open", head: 6 }, expr: "ouch" },
  { name: "esniyor", pose: {}, expr: "yawn" },
  { name: "elma", pose: { el: [284, 450], wr: [350, 400] }, expr: "happy" },
  { name: "süper", pose: { el: [290, 452], wr: [342, 384], hand: "thumb" }, expr: "smile" },
  { name: "telefon", pose: { el: [290, 444], wr: [330, 336], head: 8, ly: 3 }, expr: "laugh" },
];

export const BoraPozlar: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "linear-gradient(180deg,#f4e6cc,#e6cfa8)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {BORA_POZLAR.map((p, i) => {
        const x = 180 + (i % 3) * 360;
        const y = 600 + Math.floor(i / 3) * 620;
        return (
          <g key={p.name}>
            <g transform={`translate(${x},${y}) scale(0.62) translate(-220,-850)`}>
              <Bora id={`bp${i}`} pose={p.pose} expr={p.expr} />
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
