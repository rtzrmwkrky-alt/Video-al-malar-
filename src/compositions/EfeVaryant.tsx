/** Seçilen avatarın (Efe) 4 farklı görünümü + isim önerileri, 2x2 ızgara (sessiz önizleme). */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { talkAt } from "../avatar/Avatars";
import { Chibi, LOOKS } from "../avatar/Chibi";
import { loadFonts, ROUND } from "../fonts";

loadFonts();

export const EFE_VAR_FRAMES = 30 * 10;

const CW = 500;
const CH = 800;

const CARDS = [
  { look: "orijinal", name: "Arda", desc: "Dağınık saç, kapüşonlu", bg: ["#e9d5ff", "#8b5cf6"] },
  { look: "kivircik", name: "Kuzey", desc: "Kıvırcık saç, ter bandı", bg: ["#fde68a", "#fb923c"] },
  { look: "sari", name: "Atlas", desc: "Sarı saç, forma", bg: ["#bae6fd", "#0ea5e9"] },
  { look: "sapka", name: "Poyraz", desc: "Ters şapka, kulaklık", bg: ["#fecdd3", "#f43f5e"] },
] as const;

export const EfeVaryant: React.FC = () => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill lang="tr" style={{ background: "#0f1020" }}>
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: ROUND, fontWeight: 800, fontSize: 84, color: "#fff" }}>
        Hangisi olsun?
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {CARDS.map((c, i) => {
          const x = 27 + (i % 2) * (CW + 26);
          const y = 230 + Math.floor(i / 2) * (CH + 30);
          return (
            <g key={c.look} transform={`translate(${x},${y})`}>
              <defs>
                <linearGradient id={`vbg-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={c.bg[0]} />
                  <stop offset="1" stopColor={c.bg[1]} />
                </linearGradient>
                <clipPath id={`vcard-${i}`}>
                  <rect width={CW} height={CH} rx={44} />
                </clipPath>
              </defs>
              <rect width={CW} height={CH} rx={44} fill={`url(#vbg-${i})`} />
              <g clipPath={`url(#vcard-${i})`}>
                <circle cx={CW / 2} cy={380} r={230} fill="#fff" opacity={0.18} />
                <g transform={`translate(${(CW - 600 * 0.86) / 2},${CH - 700 * 0.86 - 100}) scale(0.86)`}>
                  <Chibi t={t} talk={talkAt(t, i * 0.8)} id={`ch${i}`} look={LOOKS[c.look]} seed={i * 0.7} />
                </g>
                <rect y={CH - 120} width={CW} height={120} fill="#0f1020" opacity={0.85} />
              </g>
              <circle cx={58} cy={58} r={36} fill="#fff" />
              <text x={58} y={76} textAnchor="middle" fontFamily={ROUND} fontWeight={800} fontSize={50} fill="#0f1020">
                {i + 1}
              </text>
              <text x={CW / 2} y={CH - 64} textAnchor="middle" fontFamily={ROUND} fontWeight={800} fontSize={50} fill="#fff">
                {c.name}
              </text>
              <text x={CW / 2} y={CH - 24} textAnchor="middle" fontFamily={ROUND} fontWeight={600} fontSize={30} fill="#cfd3ea">
                {c.desc}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
