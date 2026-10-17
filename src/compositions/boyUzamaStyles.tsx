/**
 * BoyUzama için görünüm stilleri. Sahneler aynı kalır; stil, çizimlerdeki kontur/dolgu renklerini
 * CSS ile yeniden eşler (öznitelik seçicileri: `[stroke="#1f2a44"]` vb.), arka planı ve altyazıyı değiştirir.
 */
import { ROUND, SANS } from "../fonts";

export type BoyStyle = "kagit" | "tebesir" | "neon" | "pastel" | "comic" | "gok" | "nane" | "gece" | "toprak" | "turkuaz" | "lavanta" | "beton" | "orman" | "mor";

const INK = "#1f2a44";

export type CapTheme = {
  font: string;
  weight: number;
  color: string;
  hl: string;
  /** yazı konturu (yoksa kontursuz) */
  stroke?: { w: number; c: string };
  shadow?: string;
  /** altyazı kutusu */
  box?: { bg: string; border?: string; rot?: number };
  italic?: boolean;
};

export type Theme = {
  bg: string;
  Back?: React.FC;
  /** sahnenin üstüne binen doku (çizgi roman noktaları gibi) */
  Over?: React.FC;
  css: string;
  cap: CapTheme;
};

/** sahne zeminlerini (oda duvarı, yer, kemik içi) şeffaf yapar; arka plan stilden gelir */
const clearGrounds = (k: string) => `
.th-${k} .scene [fill="#ecd9b8"], .th-${k} .scene [fill="#f7d7cc"] { fill: transparent; }
.th-${k} .scene [stroke="#eebcaf"] { stroke: transparent; }
`;

const Chalkboard: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="cb" cx="50%" cy="40%" r="80%">
        <stop offset="0" stopColor="#3d5c48" />
        <stop offset="1" stopColor="#1f3328" />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#cb)" />
    {/* silinmiş tebeşir izleri */}
    {[
      [220, 300, 260, 70, -8],
      [820, 520, 200, 50, 6],
      [300, 1180, 320, 60, 3],
      [760, 1720, 280, 80, -4],
    ].map(([x, y, rx, ry, r], i) => (
      <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${r},${x},${y})`} fill="#ffffff" opacity={0.045} />
    ))}
    {Array.from({ length: 160 }).map((_, i) => (
      <circle key={i} cx={(i * 397) % 1080} cy={(i * 733) % 1920} r={1.4 + (i % 3) * 0.6} fill="#ffffff" opacity={0.06} />
    ))}
  </svg>
);

const NeonNight: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="nn" cx="50%" cy="38%" r="85%">
        <stop offset="0" stopColor="#16204a" />
        <stop offset="1" stopColor="#05070f" />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#nn)" />
    {Array.from({ length: 13 }).map((_, i) => (
      <line key={`v${i}`} x1={i * 90} y1={0} x2={i * 90} y2={1920} stroke="#5ff4ff" strokeWidth={1.5} opacity={0.07} />
    ))}
    {Array.from({ length: 22 }).map((_, i) => (
      <line key={`h${i}`} x1={0} y1={i * 90} x2={1080} y2={i * 90} stroke="#ff4fd8" strokeWidth={1.5} opacity={0.06} />
    ))}
  </svg>
);

const PastelSky: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="ps" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#efe9ff" />
        <stop offset="1" stopColor="#ffe6da" />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#ps)" />
    <circle cx={900} cy={260} r={260} fill="#ffd9e6" opacity={0.55} />
    <circle cx={120} cy={980} r={300} fill="#d9f2ea" opacity={0.5} />
    <circle cx={880} cy={1650} r={280} fill="#fff1c9" opacity={0.55} />
  </svg>
);

const ComicBurst: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <rect width={1080} height={1920} fill="#ffd23f" />
    {Array.from({ length: 24 }).map((_, i) => {
      const a = (i / 24) * Math.PI * 2;
      const b = ((i + 0.5) / 24) * Math.PI * 2;
      return i % 2 ? null : (
        <polygon key={i} points={`540,760 ${540 + Math.cos(a) * 2200},${760 + Math.sin(a) * 2200} ${540 + Math.cos(b) * 2200},${760 + Math.sin(b) * 2200}`} fill="#ffe27a" />
      );
    })}
  </svg>
);

const Halftone: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", pointerEvents: "none" }}>
    <defs>
      <pattern id="dots" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
        <circle cx={7} cy={7} r={2.6} fill="#e8213b" />
      </pattern>
    </defs>
    <rect width={1080} height={1920} fill="url(#dots)" opacity={0.1} />
  </svg>
);

/** düz renkli zemin + yumuşak ışık lekesi */
const Plain = (top: string, bottom: string, glow: string, glowO = 0.35): React.FC => {
  const Comp: React.FC = () => (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={`pl-${top}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <radialGradient id={`gl-${top}`} cx="50%" cy="40%" r="55%">
          <stop offset="0" stopColor={glow} stopOpacity={glowO} />
          <stop offset="1" stopColor={glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#pl-${top})`} />
      <rect width={1080} height={1920} fill={`url(#gl-${top})`} />
    </svg>
  );
  return Comp;
};

/** oda ve kemik zeminlerini palete göre yeniden boyar */
const roomCss = (k: string, o: { stripe: string; floor: string; door: string; frame?: string; flesh?: string; fleshLine?: string }) => `
.th-${k} .scene [fill="#ecd9b8"] { fill: ${o.stripe}; }
.th-${k} .scene [fill="#d9b98a"] { fill: ${o.floor}; }
.th-${k} .scene [fill="#8c6f52"] { fill: ${o.door}; }
${o.frame ? `.th-${k} .scene [fill="#fff6e6"] { fill: ${o.frame}; }` : ""}
${o.flesh ? `.th-${k} .scene [fill="#f7d7cc"] { fill: ${o.flesh}; }` : ""}
${o.fleshLine ? `.th-${k} .scene [stroke="#eebcaf"] { stroke: ${o.fleshLine}; }` : ""}
`;

const CAP_DEFAULT: CapTheme = { font: SANS, weight: 800, color: "#ffffff", hl: "#FFC83D", stroke: { w: 14, c: INK }, shadow: "0 8px 0 rgba(31,42,68,0.3)" };

export const THEMES: Record<BoyStyle, Theme> = {
  turkuaz: {
    bg: "#7fdcd8",
    Back: Plain("#3cc6c4", "#b6eeea", "#ffffff", 0.4),
    css: roomCss("turkuaz", { stripe: "#6ad3cf", floor: "#178b8f", door: "#0d5b5e" }),
    cap: CAP_DEFAULT,
  },
  lavanta: {
    bg: "#d9cdfb",
    Back: Plain("#b9a6f5", "#ece6ff", "#ffffff", 0.45),
    css: roomCss("lavanta", { stripe: "#cbbdf8", floor: "#7a62c9", door: "#4a3a8a" }),
    cap: CAP_DEFAULT,
  },
  beton: {
    bg: "#e4e6ea",
    Back: Plain("#cfd3da", "#f2f3f5", "#ffffff", 0.5),
    css: roomCss("beton", { stripe: "#d9dce2", floor: "#8a919c", door: "#4c525c" }),
    cap: CAP_DEFAULT,
  },
  orman: {
    bg: "#2f6b4f",
    Back: Plain("#1f5a40", "#4f9a72", "#fff6c8", 0.25),
    css: roomCss("orman", { stripe: "#2a644a", floor: "#173d2c", door: "#0f2a1e", frame: "#f1ead8" }),
    cap: CAP_DEFAULT,
  },
  mor: {
    bg: "#3b1f6b",
    Back: Plain("#2a1452", "#7b3fb8", "#ff9ad5", 0.25),
    css: roomCss("mor", { stripe: "#351c62", floor: "#1d0d38", door: "#12082a", frame: "#efe6ff", flesh: "#4a2a6a", fleshLine: "#5a3480" }),
    cap: CAP_DEFAULT,
  },
  gok: {
    bg: "#bfe6ff",
    Back: Plain("#7cc8ff", "#d4efff", "#ffffff", 0.45),
    css: roomCss("gok", { stripe: "#a9dcfb", floor: "#4f9bd6", door: "#2f5f8f" }),
    cap: CAP_DEFAULT,
  },
  nane: {
    bg: "#c8f1e2",
    Back: Plain("#8fe3c8", "#dcf8ee", "#ffffff", 0.45),
    css: roomCss("nane", { stripe: "#b2ead6", floor: "#2fa98d", door: "#1f6f5e" }),
    cap: CAP_DEFAULT,
  },
  gece: {
    bg: "#151d36",
    Back: Plain("#0f1630", "#25305a", "#ffd27a", 0.22),
    css: roomCss("gece", { stripe: "#1d2748", floor: "#0b1124", door: "#070b18", frame: "#e9e2d4", flesh: "#3a2346", fleshLine: "#4a2d58" }),
    cap: CAP_DEFAULT,
  },
  toprak: {
    bg: "#f1c9a6",
    Back: Plain("#e9b48a", "#f7dcc4", "#fff3e6", 0.4),
    css: roomCss("toprak", { stripe: "#e2a87c", floor: "#a8552f", door: "#5e2f1a" }),
    cap: CAP_DEFAULT,
  },
  kagit: {
    bg: "#f3e6cf",
    css: "",
    cap: { font: SANS, weight: 800, color: "#ffffff", hl: "#FFC83D", stroke: { w: 14, c: INK }, shadow: "0 8px 0 rgba(31,42,68,0.3)" },
  },
  tebesir: {
    bg: "#2c4436",
    Back: Chalkboard,
    css:
      clearGrounds("tebesir") +
      `
.th-tebesir .scene [stroke="${INK}"] { stroke: #f4f1e6; }
.th-tebesir .scene [fill="${INK}"] { fill: #f4f1e6; }
.th-tebesir .scene :is(rect, path, circle, ellipse, polygon):not([fill="${INK}"]) { fill-opacity: 0.58; }
.th-tebesir .scene [fill="#d9b98a"] { fill: #1a2a20; }
.th-tebesir .scene text[stroke="${INK}"] { stroke: #2c4436; }
.th-tebesir .scene text[fill="${INK}"] { fill: #1d2f25; }
.th-tebesir .scene { filter: drop-shadow(0 0 1.5px rgba(255,255,255,0.35)); }
`,
    cap: { font: ROUND, weight: 800, color: "#f4f1e6", hl: "#ffe066", stroke: { w: 12, c: "#1d2f25" } },
  },
  neon: {
    bg: "#05070f",
    Back: NeonNight,
    css:
      clearGrounds("neon") +
      `
.th-neon .scene [stroke="${INK}"] { stroke: #5ff4ff; }
.th-neon .scene [fill="${INK}"] { fill: #5ff4ff; }
.th-neon .scene :is(rect, path, circle, ellipse, polygon):not([fill="${INK}"]) { fill-opacity: 0.34; }
.th-neon .scene [fill="#d9b98a"] { fill: #0b1230; }
.th-neon .scene text[stroke="${INK}"] { stroke: #05070f; }
.th-neon .scene text[fill="${INK}"] { fill: #5ff4ff; }
.th-neon .scene { filter: drop-shadow(0 0 7px rgba(95,244,255,0.75)); }
`,
    cap: { font: SANS, weight: 800, color: "#ffffff", hl: "#ff4fd8", stroke: { w: 12, c: "#05070f" }, shadow: "0 0 22px rgba(95,244,255,0.9)" },
  },
  pastel: {
    bg: "#f4eefc",
    Back: PastelSky,
    css:
      clearGrounds("pastel") +
      `
.th-pastel .scene [stroke="${INK}"] { stroke: #56608a; stroke-width: 3.5px; }
.th-pastel .scene [fill="${INK}"] { fill: #3d4566; }
.th-pastel .scene [fill="#d9b98a"] { fill: #f8d9d0; }
.th-pastel .scene text[stroke="${INK}"] { stroke: none; }
.th-pastel .scene text[fill="#fff"] { fill: #3d4566; }
.th-pastel .scene { filter: saturate(0.72) brightness(1.06); }
`,
    cap: { font: ROUND, weight: 700, color: "#3d4566", hl: "#ff6f91", box: { bg: "rgba(255,255,255,0.82)" } },
  },
  comic: {
    bg: "#ffd23f",
    Back: ComicBurst,
    Over: Halftone,
    css:
      clearGrounds("comic") +
      `
.th-comic .scene [stroke="${INK}"] { stroke: #111111; }
.th-comic .scene [fill="${INK}"] { fill: #111111; }
.th-comic .scene [fill="#d9b98a"] { fill: #ff8a3d; }
.th-comic .scene { filter: saturate(1.45) contrast(1.08); }
`,
    cap: { font: SANS, weight: 800, color: "#111111", hl: "#e8213b", italic: true, box: { bg: "#ffffff", border: "6px solid #111", rot: -2 } },
  },
};
