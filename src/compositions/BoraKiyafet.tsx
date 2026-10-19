/** Bora (yandan) için kıyafet seçenekleri: aynı poz, 4 kıyafet. */
import { AbsoluteFill } from "remotion";
import { BORA_OUTFITS, BoraYanFigure } from "./boraKiyafetParts";
import { SANS, loadFonts } from "../fonts";

loadFonts();

export const BoraKiyafet: React.FC = () => (
  <AbsoluteFill lang="tr" style={{ background: "linear-gradient(180deg,#f4e6cc,#e3c9a0)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {BORA_OUTFITS.map((b, i) => {
        const x = 270 + (i % 2) * 540;
        const y = 840 + Math.floor(i / 2) * 900;
        return (
          <g key={b.name}>
            <circle cx={x - 170} cy={y - 760} r={40} fill="#3a2a1a" />
            <text x={x - 170} y={y - 744} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={46} fill="#fff">
              {i + 1}
            </text>
            <BoraYanFigure x={x} y={y} s={0.88} o={b.o} id={`bk${i}`} />
            <text x={x} y={y + 50} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={44} fill="#3a2a1a">
              {b.name}
            </text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
