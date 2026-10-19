/** 3 numaralı figürün (dikenli saç, kapüşonlu) kendine özel 4 hâli: renk + imza eşya + zemin. Sessiz önizleme. */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { talkAt } from "../avatar/Avatars";
import { Doodle, DoodleLook } from "../avatar/Doodle";
import { loadFonts, ROUND } from "../fonts";

loadFonts();

export const FIGUR_UC_FRAMES = 30 * 10;

const CW = 500;
const CH = 800;
const INK = "#f4ead6";
const base: DoodleLook = {
  skin: "#f0bf96",
  hair: "#3b2a4a",
  hairStyle: "spiky",
  top: "",
  topS: "",
  longSleeve: true,
  hood: true,
  bottom: "#5b6b8a",
  longPants: true,
  shoe: "#2a2a2a",
};

const VARS: { desc: string; bg: string; line: string; look: DoodleLook }[] = [
  { desc: "Sarı kapüşonlu + turkuaz atkı", bg: "#1f3d33", line: "#2f5a4b", look: { ...base, top: "#f7c948", topS: "#d19f1f", scarf: "#2ec4b6" } },
  { desc: "Turkuaz kapüşonlu + kırmızı bant", bg: "#4a1f2c", line: "#66303f", look: { ...base, top: "#2ec4b6", topS: "#1f978b", headband: "#ef4444", bottom: "#3a3a46" } },
  { desc: "Turuncu kapüşonlu + mavi bileklik", bg: "#22343b", line: "#334c55", look: { ...base, hair: "#4a2e1f", top: "#ff8a3d", topS: "#d9651c", wrist: "#3b82f6", bottom: "#2f3e66" } },
  { desc: "Kırmızı kapüşonlu + sarı kulaklık", bg: "#2a2a30", line: "#3d3d46", look: { ...base, top: "#ef4b4b", topS: "#b92f2f", phones: "#f7c948", bottom: "#4b5563", shoe: "#ffffff" } },
];

export const FigurUc: React.FC = () => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill lang="tr" style={{ background: "#14151f" }}>
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: ROUND, fontWeight: 800, fontSize: 80, color: "#fff" }}>
        3'ün yeni hâlleri
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="wob3" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={3} />
            <feDisplacementMap in="SourceGraphic" scale={4} />
          </filter>
        </defs>
        {VARS.map((v, i) => {
          const x = 27 + (i % 2) * (CW + 26);
          const y = 230 + Math.floor(i / 2) * (CH + 30);
          return (
            <g key={i} transform={`translate(${x},${y})`}>
              <defs>
                <pattern id={`g3-${i}`} width={44} height={44} patternUnits="userSpaceOnUse">
                  <path d="M44,0 L0,0 0,44" fill="none" stroke={v.line} strokeWidth={2} />
                </pattern>
                <clipPath id={`c3-${i}`}>
                  <rect width={CW} height={CH} rx={40} />
                </clipPath>
              </defs>
              <g clipPath={`url(#c3-${i})`}>
                <rect width={CW} height={CH} fill={v.bg} />
                <rect width={CW} height={CH} fill={`url(#g3-${i})`} />
                <g transform={`translate(${CW / 2 - 200 * 1.08},${CH - 96 - 575 * 1.08}) scale(1.08)`}>
                  <Doodle t={t} talk={talkAt(t, i * 0.7)} look={v.look} ink={INK} seed={i * 0.9} filterId="wob3" />
                </g>
              </g>
              <circle cx={54} cy={54} r={34} fill="#fff" />
              <text x={54} y={71} textAnchor="middle" fontFamily={ROUND} fontWeight={800} fontSize={46} fill="#14151f">
                {String.fromCharCode(65 + i)}
              </text>
              <rect x={20} y={CH - 70} width={CW - 40} height={50} rx={25} fill="#14151f" opacity={0.75} />
              <text x={CW / 2} y={CH - 35} textAnchor="middle" fontFamily={ROUND} fontWeight={700} fontSize={29} fill="#fff">
                {v.desc}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
