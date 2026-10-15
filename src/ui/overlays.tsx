/**
 * Videolarda ortak kullanılan ekran üstü parçalar: balon, etiket, ölçer, altyazı.
 * Zaman `t` (saniye) dışarıdan verilir.
 */
import { interpolate, spring, useVideoConfig } from "remotion";
import { MONO, SANS } from "../fonts";
import type { Word } from "../types";

export const Pop: React.FC<{ at: number; t: number; children: React.ReactNode; style?: React.CSSProperties; tilt?: number }> = ({
  at,
  t,
  children,
  style,
  tilt = 0,
}) => {
  const { fps } = useVideoConfig();
  if (t < at) return null;
  const p = spring({ frame: Math.round((t - at) * fps), fps, config: { damping: 12, mass: 0.5 } });
  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(-50%, -50%) scale(${interpolate(p, [0, 1], [0.4, 1])}) rotate(${tilt}deg)`,
        opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Konuşma balonu */
export const Bubble: React.FC<{ text: string; color: string; tail?: "left" | "right" | "down"; size?: number; dim?: boolean }> = ({
  text,
  color,
  tail = "down",
  size = 50,
  dim,
}) => (
  <div
    style={{
      position: "relative",
      background: "white",
      color: "#111",
      borderRadius: 40,
      padding: `${size * 0.45}px ${size * 0.7}px`,
      fontFamily: SANS,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: -1,
      whiteSpace: "nowrap",
      boxShadow: `0 10px 0 ${color}, 0 24px 50px rgba(0,0,0,0.35)`,
      border: `5px solid ${color}`,
      opacity: dim ? 0.55 : 1,
    }}
  >
    {text}
    <div
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        borderLeft: "22px solid transparent",
        borderRight: "22px solid transparent",
        borderTop: `34px solid ${color}`,
        bottom: -38,
        left: tail === "left" ? 50 : tail === "right" ? undefined : "50%",
        right: tail === "right" ? 50 : undefined,
        marginLeft: tail === "down" ? -22 : 0,
      }}
    />
  </div>
);

/** Bilgi kartı (sticker gibi) */
export const Sticker: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number }> = ({
  children,
  bg = "white",
  color = "#111",
  size = 46,
}) => (
  <div
    style={{
      background: bg,
      color,
      fontFamily: SANS,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: -0.5,
      padding: `${size * 0.4}px ${size * 0.65}px`,
      borderRadius: 26,
      boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
      whiteSpace: "nowrap",
      lineHeight: 1.15,
    }}
  >
    {children}
  </div>
);

export const Small: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "#666" }) => (
  <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color, fontWeight: 500, marginBottom: 8 }}>{children}</div>
);

export const Meter: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ width: 520 }}>
    <div
      style={{
        fontFamily: MONO,
        fontSize: 28,
        letterSpacing: 5,
        color: "white",
        textShadow: "0 2px 8px rgba(0,0,0,0.6)",
        marginBottom: 12,
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span>{label}</span>
      <span>%{Math.round(value * 100)}</span>
    </div>
    <div style={{ height: 26, borderRadius: 20, background: "rgba(0,0,0,0.35)", border: "3px solid white", overflow: "hidden" }}>
      <div style={{ width: `${value * 100}%`, height: "100%", background: color }} />
    </div>
  </div>
);

/** Tırnak işaretleri altyazıda görünmez; sayfa cümle sonunda veya 3 kelimede biter. */
const stripQuotes = (s: string) => s.replace(/["“”«»]/g, "");

const toPages = (words: Word[]): Word[][] => {
  const pages: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length === 3 || /[.?!:…,]$/.test(stripQuotes(w.text))) {
      pages.push(cur);
      cur = [];
    }
  }
  if (cur.length) pages.push(cur);
  return pages;
};

const clean = (s: string) => stripQuotes(s).replace(/\.\.\.$/, "").replace(/[.,:]$/, "");

export const Captions: React.FC<{ words: Word[]; t: number }> = ({ words, t }) => {
  const { fps } = useVideoConfig();
  const pages = toPages(words);
  const idx = pages.findIndex((p, i) => t >= p[0].start - 0.05 && t < (pages[i + 1]?.[0].start ?? Infinity) - 0.05);
  if (idx < 0) return null;
  const page = pages[idx];
  if (t > page[page.length - 1].end + 0.6) return null;
  const pop = spring({ frame: Math.round((t - page[0].start + 0.05) * fps), fps, config: { damping: 12, mass: 0.45 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 1330,
        left: 60,
        right: 60,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 24px",
        transform: `scale(${interpolate(pop, [0, 1], [0.8, 1])})`,
      }}
    >
      {page.map((w, i) => {
        const on = t >= w.start - 0.03;
        return (
          <span
            key={i}
            style={{
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 96,
              letterSpacing: -2,
              lineHeight: 1.1,
              color: on ? "white" : "rgba(255,255,255,0.0)",
              WebkitTextStroke: on ? "7px #111" : "0",
              paintOrder: "stroke",
              textShadow: on ? "0 8px 24px rgba(0,0,0,0.45)" : "none",
            }}
          >
            {clean(w.text)}
          </span>
        );
      })}
    </div>
  );
};

