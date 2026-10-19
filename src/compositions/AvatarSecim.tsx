/** Kanal avatarı seçimi: 4 aday 2x2 ızgarada, sırayla konuşur (sessiz önizleme). */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AVATARS, talkAt } from "../avatar/Avatars";
import { loadFonts, ROUND } from "../fonts";

loadFonts();

export const AVATAR_FRAMES = 30 * 10;

const CW = 500;
const CH = 800;

export const AvatarSecim: React.FC = () => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill lang="tr" style={{ background: "#0f1020" }}>
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: ROUND, fontWeight: 800, fontSize: 92, color: "#fff" }}>
        Avatarını seç
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {AVATARS.map((a, i) => {
          const x = 27 + (i % 2) * (CW + 26);
          const y = 230 + Math.floor(i / 2) * (CH + 30);
          const A = a.C;
          return (
            <g key={a.key} transform={`translate(${x},${y})`}>
              <defs>
                <linearGradient id={`bg-${a.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={a.bg[0]} />
                  <stop offset="1" stopColor={a.bg[1]} />
                </linearGradient>
                <clipPath id={`card-${a.key}`}>
                  <rect width={CW} height={CH} rx={44} />
                </clipPath>
              </defs>
              <rect width={CW} height={CH} rx={44} fill={`url(#bg-${a.key})`} />
              <g clipPath={`url(#card-${a.key})`}>
                <circle cx={CW / 2} cy={380} r={230} fill="#fff" opacity={0.18} />
                <g transform={`translate(${(CW - 600 * 0.86) / 2},${CH - 700 * 0.86 - 110}) scale(0.86)`}>
                  <A t={t} talk={talkAt(t, i * 0.8)} id={`av${i}`} />
                </g>
                <rect y={CH - 120} width={CW} height={120} fill="#0f1020" opacity={0.82} />
              </g>
              <circle cx={58} cy={58} r={36} fill="#fff" />
              <text x={58} y={76} textAnchor="middle" fontFamily={ROUND} fontWeight={800} fontSize={50} fill="#0f1020">
                {i + 1}
              </text>
              <text x={CW / 2} y={CH - 64} textAnchor="middle" fontFamily={ROUND} fontWeight={800} fontSize={50} fill="#fff">
                {a.name}
              </text>
              <text x={CW / 2} y={CH - 24} textAnchor="middle" fontFamily={ROUND} fontWeight={600} fontSize={30} fill="#cfd3ea">
                {a.desc}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
