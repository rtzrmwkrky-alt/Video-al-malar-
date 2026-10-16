/**
 * Wilma Rudolph — belgesel tarzı motivasyon reels'i (~67 sn).
 *
 * Ses: public/audio/wilma.(mp3|json)  (metin: icerik/wilma.seslendirme.txt)
 * Müzik + efekt: scripts/wilma-audio.py ile sentezlenir → public/wilma/muzik.wav, efekt.wav
 * Görseller: public/wilma/ (kullanıcının fotoğrafları, telefon ekranından kırpıldı)
 *
 * Sahneler kelime sırasına bağlı (W(i) = i. kelimenin başladığı saniye): ses değişirse
 * kesmeler yine cümle başında kalır. Efekt zamanları da aynı kelime numaralarını kullanır.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFonts, MONO, PLAYFAIR, SCRIPT } from "../fonts";
import type { VoiceoverData } from "../types";

loadFonts();

export const WILMA_TAIL = 2.8; // scripts/wilma-audio.py içindeki TAIL ile aynı
export type WilmaProps = { audioName: string; data: VoiceoverData | null };

const INK = "#3b2a1c";
const GOLD = "#e8c36a";
const CREAM = "#f3e9d2";
const RED = "#a23b2a";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);
/** t'nin [a, a+d] aralığındaki ilerlemesi (0→1, yumuşak). */
const prog = (t: number, a: number, d = 0.6) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: ease });

// ---------------------------------------------------------------- altyazı
/** Seslendirmede okunuş için yazılanları ekranda doğru yazıma çevirir (kelime aralığı → metin). */
const DISPLAY: [number, number, string][] = [
  [7, 9, "16 yıl"],
  [17, 17, "Wilma"],
  [18, 18, "Rudolph."],
  [19, 22, "1940'ta,"],
  [23, 24, "22"],
  [26, 26, "20.si"],
  [31, 32, "2 kilo"],
  [40, 40, "4"],
  [60, 60, "80"],
  [68, 68, "4"],
  [72, 73, "12"],
  [80, 81, "16'sında,"],
  [87, 90, "1960,"],
  [92, 93, "100 metre..."],
  [94, 96, "200 metre..."],
  [100, 100, "3"],
  [109, 109, "Wilma"],
];

type Tok = { text: string; start: number; end: number; i: number };
const tokens = (data: VoiceoverData): Tok[] => {
  const out: Tok[] = [];
  const w = data.words;
  for (let i = 0; i < w.length; i++) {
    const m = DISPLAY.find(([a]) => a === i);
    const b = m ? m[1] : i;
    out.push({ text: (m ? m[2] : w[i].text).replace(/\.\.\./g, "").replace(/…/g, ""), start: w[i].start, end: w[b].end, i });
    i = b;
  }
  return out;
};

const pages = (toks: Tok[]) => {
  const res: Tok[][] = [];
  let cur: Tok[] = [];
  for (const t of toks) {
    cur.push(t);
    const raw = t.text;
    if (cur.length >= 3 || /[.:!?]$/.test(raw)) {
      res.push(cur);
      cur = [];
    }
  }
  if (cur.length) res.push(cur);
  return res;
};

const Captions: React.FC<{ t: number; data: VoiceoverData; hidden: (t: number) => boolean }> = ({ t, data, hidden }) => {
  const pg = React.useMemo(() => pages(tokens(data)), [data]);
  if (hidden(t)) return null;
  const idx = pg.findIndex((p, k) => t >= p[0].start - 0.05 && (k === pg.length - 1 || t < pg[k + 1][0].start - 0.05));
  if (idx < 0) return null;
  const p = pg[idx];
  const last = p[p.length - 1];
  if (t > last.end + 0.7) return null;
  const o = interpolate(t, [p[0].start - 0.05, p[0].start + 0.1], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1470, textAlign: "center", opacity: o }}>
      <span
        style={{
          fontFamily: PLAYFAIR,
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: 76,
          lineHeight: 1.15,
          color: CREAM,
          textShadow: "0 3px 18px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.9)",
        }}
      >
        {p.map((w, k) => (
          <span key={k} style={{ color: t >= w.start ? (t < w.end + 0.15 ? GOLD : CREAM) : "rgba(243,233,210,0.55)" }}>
            {w.text}
            {k < p.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------- yardımcılar
/** Sahne: [a, b) aralığında görünür; girişte `fi`, çıkışta `fo` saniyelik geçiş. */
const Scene: React.FC<{ t: number; a: number; b: number; fi?: number; fo?: number; children: (lt: number) => React.ReactNode }> = ({
  t,
  a,
  b,
  fi = 0.35,
  fo = 0.35,
  children,
}) => {
  if (t < a - 0.001 || t >= b + fo) return null;
  const o = Math.min(fi > 0 ? interpolate(t, [a, a + fi], [0, 1], clamp) : 1, fo > 0 ? interpolate(t, [b, b + fo], [1, 0], clamp) : 1);
  return <AbsoluteFill style={{ opacity: o }}>{children(t - a)}</AbsoluteFill>;
};

/** Tam ekran fotoğraf; (fx, fy) odak noktası, z0→z1 yavaş yakınlaşma (Ken Burns). */
const Photo: React.FC<{ src: string; lt: number; dur: number; fx?: number; fy?: number; z0?: number; z1?: number; dx?: number; dy?: number; dim?: number }> = ({
  src,
  lt,
  dur,
  fx = 50,
  fy = 50,
  z0 = 1.02,
  z1 = 1.12,
  dx = 0,
  dy = 0,
  dim = 0,
}) => {
  const p = interpolate(lt, [0, dur], [0, 1], clamp);
  const z = z0 + (z1 - z0) * p;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${fx}% ${fy}%`,
          transform: `translate(${dx * p}px, ${dy * p}px) scale(${z})`,
          transformOrigin: `${fx}% ${fy}%`,
          filter: "grayscale(1) contrast(1.12)",
        }}
      />
      {dim ? <AbsoluteFill style={{ background: `rgba(10,8,6,${dim})` }} /> : null}
    </AbsoluteFill>
  );
};

const Paper: React.FC = () => <Img src={staticFile("wilma/kagit.jpg")} style={{ position: "absolute", width: "100%", height: "100%" }} />;

/** El yazısı gibi soldan sağa açılan metin. */
const Hand: React.FC<{ text: string; p: number; size: number; color?: string; style?: React.CSSProperties }> = ({ text, p, size, color = INK, style }) => (
  <div
    style={{
      fontFamily: SCRIPT,
      fontWeight: 700,
      fontSize: size,
      color,
      whiteSpace: "nowrap",
      clipPath: `inset(-20% ${100 - p * 100}% -20% -5%)`,
      ...style,
    }}
  >
    {text}
  </div>
);

/** Daktilo: harf harf yazılır. */
const Typed: React.FC<{ text: string; p: number; size?: number; color?: string; style?: React.CSSProperties }> = ({ text, p, size = 40, color = INK, style }) => {
  const n = Math.floor(text.length * p);
  return (
    <div style={{ fontFamily: MONO, fontSize: size, color, letterSpacing: 1, whiteSpace: "pre", ...style }}>
      {text.slice(0, n)}
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </div>
  );
};

const Medal: React.FC<{ color: "gold" | "bronze"; size: number; label?: string }> = ({ color, size, label }) => {
  const c = color === "gold" ? ["#fff1b8", "#e2b23c", "#8a6417"] : ["#f3c9a0", "#b3743f", "#5c3519"];
  const id = `m-${color}`;
  return (
    <svg width={size} height={size * 1.55} viewBox="0 0 200 310">
      <defs>
        <radialGradient id={id} cx="38%" cy="35%" r="70%">
          <stop offset="0%" stopColor={c[0]} />
          <stop offset="55%" stopColor={c[1]} />
          <stop offset="100%" stopColor={c[2]} />
        </radialGradient>
      </defs>
      <path d="M55 0 L100 120 L145 0 L118 0 L100 60 L82 0 Z" fill="#7a1f1f" />
      <path d="M82 0 L100 60 L118 0 Z" fill="#c9c2b0" />
      <circle cx="100" cy="205" r="95" fill={`url(#${id})`} stroke={c[2]} strokeWidth="4" />
      <circle cx="100" cy="205" r="72" fill="none" stroke={c[2]} strokeOpacity="0.5" strokeWidth="3" />
      {label ? (
        <text x="100" y="228" textAnchor="middle" fontFamily={PLAYFAIR} fontStyle="italic" fontWeight="700" fontSize="58" fill={c[2]}>
          {label}
        </text>
      ) : null}
    </svg>
  );
};

/** Kübik bezier üzerinde nokta. */
const bez = (p: number, P: number[][]) => {
  const u = 1 - p;
  return [0, 1].map((k) => u * u * u * P[0][k] + 3 * u * u * p * P[1][k] + 3 * u * p * p * P[2][k] + p * p * p * P[3][k]);
};

// ---------------------------------------------------------------- film efektleri
const FilmLook: React.FC<{ frame: number }> = ({ frame }) => {
  const gx = Math.floor(random(`gx${frame}`) * 400);
  const gy = Math.floor(random(`gy${frame}`) * 700);
  const scratch = random(`s${Math.floor(frame / 3)}`) < 0.22;
  const sx = random(`sx${Math.floor(frame / 3)}`) * 1080;
  const specks = Array.from({ length: 3 }, (_, k) => ({
    on: random(`d${frame}-${k}`) < 0.35,
    x: random(`dx${frame}-${k}`) * 1080,
    y: random(`dy${frame}-${k}`) * 1920,
    r: 2 + random(`dr${frame}-${k}`) * 5,
    light: random(`dl${frame}-${k}`) < 0.5,
  }));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* sıcak eski film tonu */}
      <AbsoluteFill style={{ background: "#7a5530", mixBlendMode: "soft-light", opacity: 0.55 }} />
      {/* gren */}
      <div
        style={{
          position: "absolute",
          left: -gx,
          top: -gy,
          width: 1080 + 400,
          height: 1920 + 700,
          backgroundImage: `url(${staticFile(`wilma/grain-${frame % 6}.png`)})`,
          backgroundSize: "540px 960px",
          mixBlendMode: "overlay",
          opacity: 0.22,
        }}
      />
      {scratch ? <div style={{ position: "absolute", left: sx, top: 0, width: 2, height: 1920, background: "rgba(240,230,210,0.22)" }} /> : null}
      {specks.map((s, k) =>
        s.on ? (
          <div
            key={k}
            style={{ position: "absolute", left: s.x, top: s.y, width: s.r, height: s.r * 0.8, borderRadius: "50%", background: s.light ? "rgba(255,248,230,0.6)" : "rgba(20,14,8,0.7)" }}
          />
        ) : null,
      )}
      {/* vinyet */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 62% at 50% 46%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.88) 100%)" }} />
      {/* ışık titremesi */}
      <AbsoluteFill style={{ background: "#000", opacity: 0.05 + 0.05 * random(`f${frame}`) }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- sahneler
const Legs: React.FC<{ p: number; bad: number }> = ({ p, bad }) => {
  const leg = (side: 1 | -1) => {
    const x = 300 + side * 62;
    return `M${x - 48} 40 C ${x - 60} 200, ${x - 44} 320, ${x - 34} 420 C ${x - 26} 520, ${x - 36} 600, ${x - 30} 650 L ${x - 34 + side * 20} 682 L ${x + 34 + side * 30} 682 L ${x + 26} 650 C ${x + 30} 580, ${x + 46} 500, ${x + 40} 420 C ${x + 50} 320, ${x + 58} 200, ${x + 48} 40`;
  };
  return (
    <svg width={600} height={720} viewBox="0 0 600 720">
      <path d="M190 40 Q300 0 410 40" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
      <path d={leg(-1)} fill="none" stroke={INK} strokeWidth="6" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
      <path d={leg(1)} fill={`rgba(162,59,42,${0.35 * bad})`} stroke={bad > 0.5 ? RED : INK} strokeWidth="6" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
    </svg>
  );
};

const Track: React.FC<{ lt: number }> = ({ lt }) => {
  const vy = 760;
  const speed = 0.4 + lt * 0.9;
  const ph = lt * speed;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <rect width="1080" height="1920" fill="#1b1611" />
      <rect y={vy} width="1080" height={1920 - vy} fill="#4a3424" />
      {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) => (
        <line key={k} x1={540 + k * 18} y1={vy} x2={540 + k * 330} y2={1920} stroke={CREAM} strokeOpacity="0.8" strokeWidth="5" />
      ))}
      {Array.from({ length: 10 }, (_, i) => {
        const q = (i / 10 + ph) % 1;
        const y = vy + (1920 - vy) * q * q;
        return <line key={i} x1={0} x2={1080} y1={y} y2={y} stroke={CREAM} strokeOpacity={0.12 * q} strokeWidth={2 + 10 * q} />;
      })}
      <rect width="1080" height={vy} fill="url(#sky)" />
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d0b09" />
          <stop offset="100%" stopColor="#5a4430" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ---------------------------------------------------------------- ana bileşen
export const WilmaRudolph: React.FC<WilmaProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  if (!data) return <AbsoluteFill style={{ background: "#000" }} />;
  const W = (i: number) => data.words[i].start;
  const total = durationInFrames / fps;
  const vEnd = data.durationInSeconds;

  // hafif kare kayması (eski projektör), çok küçük
  const weaveX = (random(`wx${Math.floor(frame / 2)}`) - 0.5) * 1.2;
  const weaveY = (random(`wy${Math.floor(frame / 2)}`) - 0.5) * 1.6;

  const flash = (at: number, d = 0.35) => (t >= at && t < at + d ? interpolate(t, [at, at + d], [0.85, 0], clamp) : 0);

  return (
    <AbsoluteFill lang="tr" style={{ background: "#0d0b09", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${weaveX}px, ${weaveY}px)` }}>
        {/* 1. KANCA — demir destek, "asla yürüyemeyecek" */}
        <Scene t={t} a={0} b={W(7)} fi={0} fo={0}>
          {(lt) => (
            <>
              <Photo src="wilma/destek.png" lt={lt} dur={W(7)} fx={50} fy={45} z0={1.15} z1={1.32} dim={0.45} />
              <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center" }}>
                <Typed text="TENNESSEE · 1944" p={prog(lt, 0.2, 1.0)} size={36} color={CREAM} style={{ opacity: 0.8, letterSpacing: 8 }} />
              </div>
              <div style={{ position: "absolute", top: 640, left: 80, right: 80, textAlign: "center", fontFamily: PLAYFAIR, fontStyle: "italic", color: CREAM, textShadow: "0 4px 24px rgba(0,0,0,0.9)" }}>
                <div style={{ fontSize: 56, opacity: prog(t, W(0), 0.4), marginBottom: 30 }}>Doktorlar dedi ki:</div>
                <div style={{ fontSize: 104, fontWeight: 700, lineHeight: 1.08 }}>
                  {["“Bir", "daha", "asla", "yürüyemeyecek.”"].map((w, k) => {
                    const at = W([2, 3, 4, 5][k]);
                    return (
                      <span key={k} style={{ opacity: prog(t, at - 0.05, 0.3), color: k === 2 ? GOLD : CREAM, display: "inline-block", marginRight: 22, transform: `translateY(${(1 - prog(t, at - 0.05, 0.4)) * 20}px)` }}>
                        {w}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </Scene>

        {/* 2. 16 yıl sonra — Roma bitiş çizgisi */}
        <Scene t={t} a={W(7)} b={W(16)} fi={0}>
          {(lt) => {
            const yr = Math.round(interpolate(t, [W(7) + 0.1, W(10) + 0.4], [1944, 1960], { ...clamp, easing: Easing.out(Easing.cubic) }));
            return (
              <>
                <Photo src="wilma/roma.png" lt={lt} dur={W(16) - W(7)} fx={74} fy={45} z0={1.0} z1={1.14} dim={0.25} />
                <div style={{ position: "absolute", top: 210, left: 0, right: 0, textAlign: "center", fontFamily: PLAYFAIR, fontWeight: 800, fontSize: 210, color: CREAM, letterSpacing: 4, textShadow: "0 6px 30px rgba(0,0,0,0.8)" }}>
                  {yr}
                </div>
                <div style={{ position: "absolute", top: 470, left: 0, right: 0, textAlign: "center", fontFamily: SCRIPT, fontWeight: 700, fontSize: 84, color: GOLD, opacity: prog(t, W(7), 0.5), textShadow: "0 4px 20px rgba(0,0,0,0.9)" }}>
                  16 yıl sonra...
                </div>
                <div style={{ position: "absolute", top: 1180, left: 60, right: 60, textAlign: "center", fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 700, fontSize: 96, lineHeight: 1.05, color: CREAM, textShadow: "0 4px 24px rgba(0,0,0,0.95)", opacity: prog(t, W(11) - 0.05, 0.4), transform: `scale(${1.06 - 0.06 * prog(t, W(11) - 0.05, 0.8)})` }}>
                  Dünyanın
                  <br />
                  <span style={{ color: GOLD }}>en hızlı</span> kadını.
                </div>
              </>
            );
          }}
        </Scene>

        {/* 3. Wilma Rudolph — portre, isim, 1940, 22 kardeş */}
        <Scene t={t} a={W(16)} b={W(29)}>
          {(lt) => (
            <>
              <Photo src="wilma/portre.jpg" lt={lt} dur={W(29) - W(16)} fx={52} fy={30} z0={1.08} z1={1.2} />
              <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0) 30%, rgba(10,8,6,0) 50%, rgba(10,8,6,0.85) 78%)" }} />
              <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                <Hand text="Wilma Rudolph" p={prog(t, W(17), 1.4)} size={150} color={CREAM} style={{ textShadow: "0 4px 20px rgba(0,0,0,0.8)" }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 400,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  opacity: prog(t, W(19), 0.15),
                  transform: `scale(${1.6 - 0.6 * prog(t, W(19), 0.18)}) rotate(-3deg)`,
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 44, color: GOLD, border: `4px solid ${GOLD}`, padding: "8px 26px", letterSpacing: 6, background: "rgba(13,11,9,0.7)" }}>23 HAZİRAN 1940 · TENNESSEE</span>
              </div>
              {/* 22 kardeş: 20.si parlar */}
              <div style={{ position: "absolute", top: 1130, left: 0, right: 0, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, padding: "0 150px", opacity: t < W(29) ? 1 : 0 }}>
                {Array.from({ length: 22 }, (_, k) => {
                  const on = prog(t, W(23) + k * 0.055, 0.2);
                  const hi = k === 19 ? prog(t, W(26), 0.4) : 0;
                  return (
                    <div
                      key={k}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        background: hi > 0 ? GOLD : "rgba(243,233,210,0.75)",
                        opacity: on * (1 - 0.6 * prog(t, W(26), 0.4) * (k === 19 ? 0 : 1)),
                        transform: `scale(${on * (1 + 0.45 * hi)})`,
                        boxShadow: hi > 0 ? `0 0 ${30 * hi}px ${GOLD}` : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
        </Scene>

        {/* 4. Kâğıt: doğum kaydı + hastalık dosyası + bacak çizimi */}
        <Scene t={t} a={W(29)} b={W(48)}>
          {(lt) => {
            const cardIn = prog(lt, 0, 0.7);
            const stamp = prog(t, W(43), 0.18);
            return (
              <>
                <Paper />
                <div
                  style={{
                    position: "absolute",
                    top: 190,
                    left: 110,
                    width: 860,
                    padding: "50px 56px 150px",
                    background: "#efe4c8",
                    boxShadow: "0 18px 40px rgba(60,40,20,0.35)",
                    transform: `rotate(-1.5deg) translateY(${(1 - cardIn) * 60}px)`,
                    opacity: cardIn,
                    border: "1px solid rgba(59,42,28,0.25)",
                  }}
                >
                  <div style={{ fontFamily: MONO, fontSize: 30, color: INK, opacity: 0.7, letterSpacing: 6, borderBottom: `2px solid ${INK}`, paddingBottom: 14, marginBottom: 26 }}>
                    HASTA KAYDI — W. RUDOLPH
                  </div>
                  <Typed text="Doğum      : erken (prematüre)" p={prog(lt, 0.3, 0.9)} />
                  <div style={{ position: "relative", marginTop: 14 }}>
                    <Typed text="Ağırlık    : ~2 kg (4,5 libre)" p={prog(t, W(31) - 0.1, 0.8)} />
                    <svg width={260} height={110} style={{ position: "absolute", left: 250, top: -28 }}>
                      <ellipse cx="130" cy="55" rx="120" ry="44" fill="none" stroke={RED} strokeWidth="5" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog(t, W(33), 0.6)} transform="rotate(-4 130 55)" />
                    </svg>
                  </div>
                  <div style={{ height: 30 }} />
                  <Typed text="1. Zatürre" p={prog(t, W(36) - 0.15, 0.45)} size={42} />
                  <Typed text="2. Kızıl" p={prog(t, W(38) - 0.15, 0.4)} size={42} style={{ marginTop: 10 }} />
                  <Typed text="3. Çocuk felci (4 yaş)" p={prog(t, W(42) - 0.15, 0.5)} size={42} style={{ marginTop: 10, color: RED }} />
                  <div
                    style={{
                      position: "absolute",
                      right: 40,
                      bottom: 36,
                      fontFamily: MONO,
                      fontWeight: 500,
                      fontSize: 56,
                      color: RED,
                      border: `6px solid ${RED}`,
                      padding: "6px 22px",
                      letterSpacing: 8,
                      opacity: stamp * 0.85,
                      transform: `rotate(-12deg) scale(${1.8 - 0.8 * stamp})`,
                    }}
                  >
                    POLİO
                  </div>
                </div>
                <div style={{ position: "absolute", top: 900, left: 240, transform: "scale(0.75)", transformOrigin: "50% 0%", opacity: prog(t, W(44) - 0.3, 0.3) }}>
                  <Legs p={prog(t, W(44) - 0.3, 1.0)} bad={prog(t, W(46), 0.6)} />
                </div>
                <div style={{ position: "absolute", top: 980, left: 620, opacity: prog(t, W(46), 0.4) }}>
                  <Hand text="sol bacak" p={prog(t, W(46), 0.8)} size={64} color={RED} />
                  <svg width={160} height={120} style={{ marginLeft: -40 }}>
                    <path d="M120 10 Q 60 30, 30 100 M30 100 L 28 70 M30 100 L 56 88" fill="none" stroke={RED} strokeWidth="5" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog(t, W(46) + 0.3, 0.5)} />
                  </svg>
                </div>
              </>
            );
          }}
        </Scene>

        {/* 5. Demir destek */}
        <Scene t={t} a={W(48)} b={W(53)}>
          {(lt) => (
            <>
              <Photo src="wilma/destek.png" lt={lt} dur={W(53) - W(48)} fx={50} fy={30} z0={1.25} z1={1.1} dy={-60} dim={0.15} />
              <div style={{ position: "absolute", top: 220, left: 0, right: 0, textAlign: "center" }}>
                <Hand text="Yıllarca..." p={prog(lt, 0.1, 0.9)} size={110} color={CREAM} style={{ display: "inline-block", textShadow: "0 4px 20px rgba(0,0,0,0.9)" }} />
              </div>
              <div style={{ position: "absolute", top: 1360, right: 50, fontFamily: MONO, fontSize: 24, color: CREAM, opacity: 0.55 }}>temsilî bacak desteği</div>
            </>
          )}
        </Scene>

        {/* 6. Anne: Clarksville → Nashville haritası, günde 4 masaj */}
        <Scene t={t} a={W(53)} b={W(72)}>
          {(lt) => {
            const P = [
              [250, 560],
              [640, 600],
              [330, 960],
              [800, 1040],
            ];
            const road = prog(t, W(59), W(64) - W(59));
            const car = bez(road, P);
            const weeks = Math.floor(interpolate(t, [W(57), W(64) + 1], [0, 52], clamp));
            return (
              <>
                <Paper />
                <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                  <Hand text="Annesi pes etmedi." p={prog(lt, 0.1, 1.1)} size={104} />
                </div>
                <svg width={1080} height={1920} style={{ position: "absolute", opacity: prog(lt, 0.4, 0.6) }}>
                  {/* nehir ve sınır izleri (hayalî, el çizimi) */}
                  <path d="M0 760 C 200 700, 380 840, 560 780 S 900 860, 1080 820" fill="none" stroke="#6b8aa0" strokeOpacity="0.45" strokeWidth="6" />
                  <path d="M60 420 L 1020 420 L 1020 1200 L 60 1200 Z" fill="none" stroke={INK} strokeOpacity="0.25" strokeWidth="3" strokeDasharray="14 10" />
                  <text x="540" y="1250" textAnchor="middle" fontFamily={MONO} fontSize="30" letterSpacing="14" fill={INK} opacity="0.5">TENNESSEE</text>
                  <path d={`M${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]}, ${P[2][0]} ${P[2][1]}, ${P[3][0]} ${P[3][1]}`} fill="none" stroke={RED} strokeWidth="7" strokeDasharray="18 12" strokeLinecap="round" />
                  <path d={`M${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]}, ${P[2][0]} ${P[2][1]}, ${P[3][0]} ${P[3][1]}`} fill="none" stroke="#efe4c8" strokeWidth="11" pathLength={1} strokeDasharray="1" strokeDashoffset={-road} />
                  {[P[0], P[3]].map(([x, y], k) => (
                    <g key={k}>
                      <circle cx={x} cy={y} r="18" fill={INK} />
                      <circle cx={x} cy={y} r="30" fill="none" stroke={INK} strokeWidth="3" />
                    </g>
                  ))}
                  <text x={P[0][0] - 10} y={P[0][1] - 50} textAnchor="middle" fontFamily={SCRIPT} fontWeight="700" fontSize="60" fill={INK}>Clarksville</text>
                  <text x={P[3][0] - 20} y={P[3][1] + 80} textAnchor="middle" fontFamily={SCRIPT} fontWeight="700" fontSize="60" fill={INK}>Nashville</text>
                  {road > 0 && road < 1 ? <circle cx={car[0]} cy={car[1]} r="14" fill={RED} /> : null}
                  <g opacity={prog(t, W(60), 0.4)} transform="translate(660 720) rotate(-6)">
                    <rect x="-20" y="-62" width="250" height="90" fill="#efe4c8" stroke={RED} strokeWidth="4" />
                    <text x="105" y="2" textAnchor="middle" fontFamily={PLAYFAIR} fontStyle="italic" fontWeight="700" fontSize="62" fill={RED}>80 km</text>
                  </g>
                </svg>
                <div style={{ position: "absolute", top: 1290, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 36, color: INK, opacity: prog(t, W(57), 0.4) * (1 - prog(t, W(65) - 0.2, 0.3)) }}>
                  her hafta · {weeks} hafta / yıl
                </div>
                {/* kardeşler: günde 4 kez masaj */}
                <div style={{ position: "absolute", top: 1290, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 30, opacity: prog(t, W(65) - 0.1, 0.35) }}>
                  <Hand text="günde" p={prog(t, W(67), 0.4)} size={84} />
                  <svg width={200} height={120}>
                    {[0, 1, 2, 3].map((k) => (
                      <line key={k} x1={30 + k * 40} y1={10} x2={24 + k * 40} y2={110} stroke={RED} strokeWidth="9" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog(t, W(68) + k * 0.2, 0.18)} />
                    ))}
                  </svg>
                  <Hand text="kez" p={prog(t, W(69), 0.3)} size={84} />
                </div>
              </>
            );
          }}
        </Scene>

        {/* 7. 12 yaşında destek çıkar */}
        <Scene t={t} a={W(72)} b={W(77)}>
          {(lt) => {
            const off = prog(t, W(76), 0.9);
            return (
              <>
                <AbsoluteFill style={{ transform: `translateY(${off * 700}px) rotate(${off * 8}deg)`, opacity: 1 - off * 0.9 }}>
                  <Photo src="wilma/destek.png" lt={lt} dur={5} fx={50} fy={50} z0={1.05} z1={1.1} dim={0.2} />
                </AbsoluteFill>
                <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 800, fontSize: 260, color: CREAM, textShadow: "0 6px 30px rgba(0,0,0,0.9)", opacity: prog(lt, 0.0, 0.4) }}>
                  12
                </div>
                <div style={{ position: "absolute", top: 600, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: CREAM, opacity: prog(lt, 0.2, 0.4) }}>
                  YAŞINDA
                </div>
              </>
            );
          }}
        </Scene>

        {/* 8. Koşmaya başladı — pist */}
        <Scene t={t} a={W(77)} b={W(80)} fi={0.25}>
          {(lt) => (
            <>
              <Track lt={lt} />
              <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                <Hand text="ve koşmaya başladı" p={prog(lt, 0.05, 1.0)} size={92} color={GOLD} style={{ textShadow: "0 4px 20px rgba(0,0,0,0.9)" }} />
              </div>
            </>
          )}
        </Scene>

        {/* 9. 1956 Melbourne bronz */}
        <Scene t={t} a={W(80)} b={W(86)}>
          {(lt) => {
            const drop = prog(t, W(84) - 0.3, 0.6);
            return (
              <>
                <Paper />
                <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                  <Hand text="Melbourne, 1956" p={prog(lt, 0.1, 1.0)} size={110} />
                </div>
                <div style={{ position: "absolute", top: 420, left: 0, right: 0, textAlign: "center" }}>
                  <Typed text="16 YAŞ · 4×100 M BAYRAK" p={prog(lt, 0.6, 0.8)} size={38} style={{ letterSpacing: 6 }} />
                </div>
                <div style={{ position: "absolute", top: 600, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${(1 - drop) * -500}px) rotate(${(1 - drop) * -20}deg)`, opacity: drop }}>
                  <Medal color="bronze" size={360} label="III" />
                </div>
              </>
            );
          }}
        </Scene>

        {/* 10. 1960, Roma — başlık kartı */}
        <Scene t={t} a={W(86)} b={W(92)} fo={0}>
          {(lt) => {
            const z = 1 + lt * 0.03;
            return (
              <AbsoluteFill style={{ background: "#0d0b09", transform: `scale(${z})` }}>
                <svg width={1080} height={600} viewBox="0 0 1080 600" style={{ position: "absolute", top: 380 }}>
                  {[
                    [330, 220],
                    [540, 220],
                    [750, 220],
                    [435, 330],
                    [645, 330],
                  ].map(([x, y], k) => (
                    <circle key={k} cx={x} cy={y} r="95" fill="none" stroke={CREAM} strokeOpacity="0.85" strokeWidth="12" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog(lt, 0.1 + k * 0.15, 0.7)} />
                  ))}
                </svg>
                <div style={{ position: "absolute", top: 1000, left: 0, right: 0, textAlign: "center", fontFamily: PLAYFAIR, fontWeight: 800, fontSize: 170, letterSpacing: 18, color: CREAM, opacity: prog(t, W(87), 0.5) }}>
                  1960
                </div>
                <div style={{ position: "absolute", top: 1170, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                  <Hand text="Roma" p={prog(t, W(91), 0.6)} size={190} color={GOLD} />
                </div>
              </AbsoluteFill>
            );
          }}
        </Scene>

        {/* 11. Roma yarışı: 100 m, 200 m, bayrak */}
        <Scene t={t} a={W(92)} b={W(100)} fi={0}>
          {(lt) => (
            <>
              <Photo src="wilma/roma.png" lt={lt} dur={W(100) - W(92)} fx={76} fy={42} z0={1.0} z1={1.22} dim={0.2} />
              <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,8,6,0.75) 0%, rgba(10,8,6,0) 40%)" }} />
              <div style={{ position: "absolute", top: 200, left: 120 }}>
                {[
                  ["100 m", 92],
                  ["200 m", 94],
                  ["4×100 m bayrak", 98],
                ].map(([label, wi], k) => {
                  const p = prog(t, W(wi as number) - 0.05, 0.4);
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 26, marginBottom: 22, opacity: p, transform: `translateX(${(1 - p) * -40}px)` }}>
                      <svg width={70} height={70}>
                        <circle cx="35" cy="35" r="30" fill="none" stroke={GOLD} strokeWidth="4" />
                        <path d="M20 36 L31 47 L51 24" fill="none" stroke={GOLD} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog(t, W(wi as number) + 0.2, 0.3)} />
                      </svg>
                      <span style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 700, fontSize: 76, color: CREAM, textShadow: "0 3px 16px rgba(0,0,0,0.9)" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Scene>

        {/* 12. 3 altın + kürsü */}
        <Scene t={t} a={W(100)} b={W(109)}>
          {(lt) => (
            <>
              <Paper />
              <AbsoluteFill style={{ background: "rgba(13,11,9,0.82)" }} />
              <div style={{ position: "absolute", top: 860, left: 60, width: 960, height: 541, transform: `rotate(1deg) scale(${1 + lt * 0.01})`, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", border: `14px solid ${CREAM}` }}>
                <Img src={staticFile("wilma/podyum.png")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.1)" }} />
              </div>
              <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 20 }}>
                {[100, 101, 102].map((wi, k) => {
                  const p = prog(t, W(wi) - 0.12, 0.45);
                  return (
                    <div key={k} style={{ opacity: p, transform: `translateY(${(1 - p) * -260}px) rotate(${(k - 1) * 6}deg)` }}>
                      <Medal color="gold" size={250} label="I" />
                    </div>
                  );
                })}
              </div>
              <div style={{ position: "absolute", top: 670, left: 0, right: 0, textAlign: "center", fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 800, fontSize: 92, color: GOLD, opacity: prog(t, W(102), 0.4), textShadow: "0 4px 20px rgba(0,0,0,0.9)" }}>
                3 altın madalya
              </div>
            </>
          )}
        </Scene>

        {/* 13. Alıntı — el yazısı */}
        <Scene t={t} a={W(109)} b={W(121)}>
          {(lt) => {
            const line = (txt: string, a: number, b: number, color = INK, size = 82) => (
              <Hand text={txt} p={prog(t, W(a) - 0.1, W(b) - W(a) + 0.35)} size={size} color={color} style={{ marginBottom: 26 }} />
            );
            return (
              <>
                <Paper />
                <div style={{ position: "absolute", top: 140, left: 330, width: 420, height: 520, background: "#f7f0de", padding: 18, boxShadow: "0 16px 36px rgba(60,40,20,0.4)", transform: `rotate(-3deg) translateY(${(1 - prog(lt, 0, 0.7)) * -80}px)` }}>
                  <div style={{ width: "100%", height: 420, overflow: "hidden" }}>
                    <Img src={staticFile("wilma/portre.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "55% 22%", transform: "scale(1.6)", transformOrigin: "55% 25%", filter: "grayscale(1) sepia(0.35) contrast(1.1)" }} />
                  </div>
                  <div style={{ fontFamily: SCRIPT, fontWeight: 700, fontSize: 44, color: INK, textAlign: "center", marginTop: 14 }}>Wilma</div>
                </div>
                <div style={{ position: "absolute", top: 760, left: 90, right: 60 }}>
                  {line("Doktor: “Yürüyemezsin” dedi.", 112, 114)}
                  {line("Annem: “Yürüyeceksin” dedi.", 115, 117)}
                  {line("Ben anneme inandım.", 118, 120, RED, 104)}
                  <svg width={760} height={40} style={{ marginTop: -20 }}>
                    <path d="M10 20 C 200 34, 500 6, 740 22" fill="none" stroke={RED} strokeWidth="6" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog(t, W(120), 0.5)} />
                  </svg>
                </div>
                <div style={{ position: "absolute", top: 1360, right: 110, fontFamily: MONO, fontSize: 26, color: INK, opacity: 0.6 * prog(t, W(120), 0.5) }}>— Wilma Rudolph, otobiyografisinden</div>
              </>
            );
          }}
        </Scene>

        {/* 14. Final mesaj + kapanış */}
        <Scene t={t} a={W(121)} b={total} fo={0}>
          {(lt) => {
            const endCard = prog(t, vEnd + 0.4, 0.8);
            return (
              <>
                <Photo src="wilma/roma.png" lt={lt} dur={total - W(121)} fx={78} fy={38} z0={1.25} z1={1.45} dim={0.55} />
                <div style={{ position: "absolute", top: 560, left: 70, right: 70, textAlign: "center", fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 700, color: CREAM, textShadow: "0 4px 26px rgba(0,0,0,0.95)", opacity: 1 - endCard }}>
                  <div style={{ fontSize: 84, lineHeight: 1.12, opacity: prog(t, W(121) - 0.05, 0.5) }}>
                    Sana <span style={{ color: "rgba(243,233,210,0.6)", textDecoration: "line-through", textDecorationColor: RED, textDecorationThickness: 6 }}>imkânsız</span> diyenlere değil...
                  </div>
                  <div style={{ fontSize: 104, lineHeight: 1.1, marginTop: 70, opacity: prog(t, W(125) - 0.05, 0.5), transform: `translateY(${(1 - prog(t, W(125) - 0.05, 0.6)) * 30}px)` }}>
                    sana <span style={{ color: GOLD }}>inananlara</span>
                    <br />
                    kulak ver.
                  </div>
                </div>
                <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center", opacity: endCard }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Hand text="Wilma Rudolph" p={prog(t, vEnd + 0.5, 1.2)} size={140} color={CREAM} />
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: GOLD, marginTop: 20 }}>1940 – 1994</div>
                  <div style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 50, color: CREAM, marginTop: 120, opacity: prog(t, vEnd + 1.2, 0.6) }}>
                    Bu hikâyeyi ihtiyacı olana gönder.
                  </div>
                </div>
              </>
            );
          }}
        </Scene>

        {/* flaşlar: kanca kesmesi ve kürsü */}
        <AbsoluteFill style={{ background: "#fff8e8", opacity: Math.max(flash(W(7), 0.4), flash(W(92) - 0.05, 0.3)), pointerEvents: "none" }} />
      </AbsoluteFill>

      <FilmLook frame={frame} />
      {/* kürsüde foto makinesi flaşları (efekt sesleriyle aynı rastgele düzende değil, görsel olarak hafif) */}
      {t >= W(103) && t < W(103) + 2.6 ? (
        <AbsoluteFill style={{ background: "#fff", opacity: random(`fl${Math.floor(frame / 2)}`) < 0.12 ? 0.18 : 0, pointerEvents: "none" }} />
      ) : null}

      <Captions t={t} data={data} hidden={(x) => x < W(16) - 0.05 || x >= W(112) - 0.05} />

      <Audio src={staticFile(`audio/${audioName}.mp3`)} />
      <Audio
        src={staticFile("wilma/muzik.wav")}
        volume={(f) => {
          const mt = f / fps;
          return interpolate(mt, [0, 0.3, vEnd - 0.2, vEnd + 0.6], [0.3, 0.17, 0.17, 0.42], clamp);
        }}
      />
      <Audio src={staticFile("wilma/efekt.wav")} volume={0.55} />

      {/* başta/sonda siyahtan açılış/kararma */}
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(t, [0, 0.25, total - 0.6, total], [1, 0, 0, 1], clamp), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
