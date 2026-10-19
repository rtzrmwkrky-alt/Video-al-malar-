/** BORA kanal karakteri: büyük tanıtım + 6 temel duruş/ifade (sessiz önizleme). */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { talkAt, blink } from "../avatar/Avatars";
import { Bora, BORA_SET } from "../avatar/Bora";
import { loadFonts, ROUND } from "../fonts";

loadFonts();

export const BORA_FRAMES = 30 * 8;
const BG = "#3fbfb2";

export const BoraTanitim: React.FC = () => {
  const t = useCurrentFrame() / 30;
  const cw = 330;
  const ch = 480;
  return (
    <AbsoluteFill lang="tr" style={{ background: `linear-gradient(#4fcfc1, ${BG})` }}>
      <div style={{ position: "absolute", top: 56, width: "100%", textAlign: "center", fontFamily: ROUND, fontWeight: 800, fontSize: 110, color: "#fff", textShadow: "0 6px 0 #2a8f86" }}>
        BORA
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* büyük tanıtım */}
        <g transform="translate(372,200) scale(0.72)">
          <Bora id="hero" pose="pocket" expr={talkAt(t) > 0.05 ? "talk" : "smile"} talk={talkAt(t)} t={t} blink={blink(t)} />
        </g>
        {BORA_SET.map((s, i) => {
          const x = 30 + (i % 3) * (cw + 15);
          const y = 860 + Math.floor(i / 3) * (ch + 18);
          return (
            <g key={i} transform={`translate(${x},${y})`}>
              <rect width={cw} height={ch} rx={30} fill="#fff" opacity={0.16} />
              <g transform={`translate(${cw / 2 - 200 * 0.46},${ch - 60 - 870 * 0.46}) scale(0.46)`}>
                <Bora id={`b${i}`} pose={s.pose} expr={s.expr} talk={talkAt(t, i)} t={t + i} blink={s.expr === "happy" ? 0 : blink(t, i * 0.7)} />
              </g>
              <text x={cw / 2} y={ch - 24} textAnchor="middle" fontFamily={ROUND} fontWeight={800} fontSize={30} fill="#fff">
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
