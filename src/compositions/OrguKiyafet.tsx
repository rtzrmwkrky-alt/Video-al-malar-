/** Örgü tarzı erkek karakter için 4 kıyafet seçeneği (sessiz önizleme). */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BORA_SPOR, KNIT_OUTFITS, KnitGuy } from "../avatar/KnitGuy";
import { loadFonts, ROUND } from "../fonts";

loadFonts();

export const ORGU_FRAMES = 30 * 6;

const CW = 500;
const CH = 820;

export const OrguKiyafet: React.FC<{ set?: "orgu" | "spor" }> = ({ set = "orgu" }) => {
  const t = useCurrentFrame() / 30;
  const items = set === "spor" ? BORA_SPOR : KNIT_OUTFITS;
  return (
    <AbsoluteFill lang="tr" style={{ background: "#14151f" }}>
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: ROUND, fontWeight: 800, fontSize: 80, color: "#fff" }}>
        {set === "spor" ? "Bora: spor kıyafeti seç" : "Kıyafetini seç"}
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {items.map((k, i) => {
          const x = 27 + (i % 2) * (CW + 26);
          const y = 220 + Math.floor(i / 2) * (CH + 30);
          return (
            <g key={i} transform={`translate(${x},${y})`}>
              <clipPath id={`ok${i}`}>
                <rect width={CW} height={CH} rx={40} />
              </clipPath>
              <g clipPath={`url(#ok${i})`}>
                <rect width={CW} height={CH} fill={k.bg} />
                <rect y={CH * 0.72} width={CW} height={CH * 0.28} fill="#000" opacity={0.06} />
                <g transform={`translate(${CW / 2 - 220 * 0.78},${CH - 110 - 850 * 0.78}) scale(0.78)`}>
                  <KnitGuy o={k.o} id={`kg${i}`} t={t + i} />
                </g>
              </g>
              <circle cx={54} cy={54} r={34} fill="#fff" />
              <text x={54} y={71} textAnchor="middle" fontFamily={ROUND} fontWeight={800} fontSize={46} fill="#14151f">
                {i + 1}
              </text>
              <rect x={20} y={CH - 96} width={CW - 40} height={80} rx={24} fill="#14151f" opacity={0.78} />
              <text x={CW / 2} y={CH - 60} textAnchor="middle" fontFamily={ROUND} fontWeight={800} fontSize={34} fill="#fff">
                {k.name}
              </text>
              <text x={CW / 2} y={CH - 28} textAnchor="middle" fontFamily={ROUND} fontWeight={600} fontSize={25} fill="#d6d8e6">
                {k.desc}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
