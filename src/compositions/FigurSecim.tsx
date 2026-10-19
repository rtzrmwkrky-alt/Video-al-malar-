/** Sade el çizimi figür seçenekleri (5 aday), kullanıcının örneklerinin ortası. Sessiz önizleme. */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { talkAt } from "../avatar/Avatars";
import { Doodle, DOODLES } from "../avatar/Doodle";
import { loadFonts, ROUND } from "../fonts";

loadFonts();

export const FIGUR_FRAMES = 30 * 10;

const CW = 500;
const CH = 540;
const BG = {
  wall: { wall: "#efe2c4", floor: "#c9a47c", ink: "#2a1f1a" },
  blue: { wall: "#cfe6f2", floor: "#9fb7c9", ink: "#2a1f1a" },
  grid: { wall: "#262d4a", floor: "#262d4a", ink: "#f4ead6" },
};

export const FigurSecim: React.FC = () => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill lang="tr" style={{ background: "#14151f" }}>
      <div style={{ position: "absolute", top: 50, width: "100%", textAlign: "center", fontFamily: ROUND, fontWeight: 800, fontSize: 78, color: "#fff" }}>
        Figürünü seç
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="wob" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={3} />
            <feDisplacementMap in="SourceGraphic" scale={4} />
          </filter>
          <pattern id="grid" width={44} height={44} patternUnits="userSpaceOnUse">
            <path d="M44,0 L0,0 0,44" fill="none" stroke="#3a4266" strokeWidth={2} />
          </pattern>
        </defs>
        {DOODLES.map((d, i) => {
          const col = i < 4 ? i % 2 : 0.5;
          const x = 27 + col * (CW + 26);
          const y = 180 + Math.floor(i / 2) * (CH + 24);
          const b = BG[d.bg];
          return (
            <g key={i} transform={`translate(${x},${y})`}>
              <clipPath id={`fc${i}`}>
                <rect width={CW} height={CH} rx={36} />
              </clipPath>
              <g clipPath={`url(#fc${i})`}>
                <rect width={CW} height={CH} fill={b.wall} />
                {d.bg === "grid" ? <rect width={CW} height={CH} fill="url(#grid)" /> : <rect y={CH - 92} width={CW} height={92} fill={b.floor} />}
                {d.bg !== "grid" ? <path d={`M0,${CH - 92} L${CW},${CH - 92}`} stroke={b.ink} strokeWidth={5} /> : null}
                <g transform={`translate(${CW / 2 - 200 * 0.8},${CH - 76 - 560 * 0.8}) scale(0.8)`}>
                  <Doodle t={t} talk={talkAt(t, i * 0.7)} look={d.look} ink={b.ink} seed={i * 0.9} filterId="wob" />
                </g>
              </g>
              <circle cx={50} cy={50} r={32} fill="#fff" />
              <text x={50} y={66} textAnchor="middle" fontFamily={ROUND} fontWeight={800} fontSize={44} fill="#14151f">
                {i + 1}
              </text>
              <rect x={CW / 2 - 200} y={CH - 58} width={400} height={44} rx={22} fill="#14151f" opacity={0.75} />
              <text x={CW / 2} y={CH - 27} textAnchor="middle" fontFamily={ROUND} fontWeight={700} fontSize={28} fill="#fff">
                {d.desc}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
