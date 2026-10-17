/** Anime tarzı karakter taslağı: bulutlu gökyüzünde genç (tek kare / kısa nefes alma). */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AnimeTeen, INK } from "../anime/AnimeTeen";
import { loadFonts } from "../fonts";

loadFonts();

export const ANIME_FRAMES = 90;

/** çizgi film bulutu: beyaz, alt tarafı mavi-gri gölgeli, mürekkep konturlu */
const Cloud: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <path
      d="M-180,40 Q-200,-10 -150,-20 Q-150,-80 -80,-70 Q-60,-130 10,-110 Q60,-150 110,-100 Q180,-110 180,-40 Q230,-20 200,40 Z"
      fill="#ffffff"
      stroke={INK}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M-176,36 Q-120,10 -60,24 Q0,4 60,22 Q130,4 196,36 Z" fill="#cfe0f2" />
  </g>
);

export const AnimeKarakter: React.FC = () => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill lang="tr" style={{ overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f7fe0" />
            <stop offset="0.6" stopColor="#4fa9f2" />
            <stop offset="1" stopColor="#a8dcff" />
          </linearGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#sky)" />
        <Cloud x={170} y={300} s={1.1} />
        <Cloud x={930} y={520} s={0.9} />
        <Cloud x={120} y={1180} s={1.3} />
        <Cloud x={960} y={1420} s={1.2} />
        <Cloud x={540} y={1800} s={2.2} />
        <AnimeTeen t={t} />
      </svg>
    </AbsoluteFill>
  );
};
