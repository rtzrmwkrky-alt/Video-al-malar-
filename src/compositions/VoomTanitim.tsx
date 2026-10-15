/**
 * Voom uygulaması tanıtım videosu (Reels / TikTok / Shorts).
 *
 * Sahneler seslendirmedeki cümlelere göre zamanlandı (saniye cinsinden).
 * Metin değişirse `S` tablosundaki zamanları yeni JSON'a göre güncelle.
 */
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MONO, SANS, SERIF, loadFonts } from "../fonts";
import type { VoiceoverData, Word } from "../types";

loadFonts();

// Uygulamanın kendi renkleri (ekran görüntülerinden)
const C = {
  bg: "#000000",
  card: "#0D0D0D",
  border: "#262626",
  lime: "#D4F24A",
  gray: "#8C8C8C",
  dim: "#5A5A5A",
  white: "#F5F5F5",
  red: "#FF5A4E",
};

export type VoomTanitimProps = {
  audioName: string;
  /** calculateMetadata tarafından doldurulur */
  data: VoiceoverData | null;
};

/** Sahne başlangıçları (saniye) — seslendirme zamanlamasından. */
const S = {
  hook: 0,
  logo: 5.62,
  kurulum: 6.62,
  gunluk: 13.5,
  checkin: 18.1,
  yorgun: 22.7,
  hareket: 24.55,
  kilo: 28.95,
  insta: 33.45,
  final: 39.3,
};

// ---------------------------------------------------------------- yardımcılar

const useSec = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** Belirli bir saniyeden itibaren yaylı 0→1 animasyon (sahne içi saniye). */
const usePop = (atSec: number, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - Math.round(atSec * fps),
    fps,
    config: { damping, mass: 0.6 },
  });
};

const ease = Easing.bezier(0.65, 0, 0.35, 1);

/** Anahtar karelerden yumuşak geçiş. */
const keyframes = (t: number, ts: number[], vs: number[]) =>
  interpolate(t, ts, vs, {
    easing: ease,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Label: React.FC<{
  children: React.ReactNode;
  color?: string;
  dot?: boolean;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, color = C.gray, dot, size = 30, style }) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: size,
      letterSpacing: size * 0.22,
      color,
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: size * 0.6,
      ...style,
    }}
  >
    {dot ? (
      <span
        style={{
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: 99,
          background: C.lime,
          boxShadow: `0 0 ${size * 0.5}px ${C.lime}`,
        }}
      />
    ) : null}
    {children}
  </div>
);

/** Sahne girişinde hafif "punch-in" ve elde çekilmiş gibi küçük titreşim. */
const Camera: React.FC<{ children: React.ReactNode; punch?: number }> = ({
  children,
  punch = 0.06,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 18, mass: 0.5 } });
  const drift = 1 + frame * 0.0006;
  const x = Math.sin(frame / 23) * 3 + Math.sin(frame / 7.3) * 0.8;
  const y = Math.cos(frame / 19) * 3 + Math.cos(frame / 6.1) * 0.8;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}px, ${y}px) scale(${(1 + punch - punch * p) * drift})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Film greni — temiz "şablon" görüntüsünü kırar. */
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 50;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.09, mixBlendMode: "screen" }}>
      <svg width="1080" height="1920">
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Kenarlarda hafif karartma. */
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(0,0,0,0.65) 100%)",
    }}
  />
);

// ---------------------------------------------------------------- telefon

const SCREEN_W = 600;
const SCREEN_H = Math.round((SCREEN_W * 2532) / 1170);

type Cam = { t: number; y: number; s: number };

/**
 * Ekran görüntüsünü telefon çerçevesinde gösterir ve "kamera" ile
 * ekranın belli bir noktasına odaklanır (y: 0 üst, 1 alt).
 */
const Phone: React.FC<{
  src: string;
  cams: Cam[];
  centerY?: number;
  children?: React.ReactNode;
  enter?: boolean;
}> = ({ src, cams, centerY = 800, children, enter = true }) => {
  const t = useSec();
  const ts = cams.map((c) => c.t);
  const fy = cams.length > 1 ? keyframes(t, ts, cams.map((c) => c.y)) : cams[0].y;
  const s = cams.length > 1 ? keyframes(t, ts, cams.map((c) => c.s)) : cams[0].s;
  const inP = usePop(0, 16);
  const enterY = enter ? interpolate(inP, [0, 1], [260, 0]) : 0;
  const ty = -s * (fy - 0.5) * SCREEN_H;

  return (
    <div
      style={{
        position: "absolute",
        left: 540 - SCREEN_W / 2,
        top: centerY - SCREEN_H / 2,
        width: SCREEN_W,
        height: SCREEN_H,
        transform: `translateY(${ty + enterY}px) scale(${s})`,
        opacity: enter ? interpolate(inP, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }) : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -14,
          borderRadius: 86,
          background: "#1A1A1A",
          boxShadow: "0 0 0 2px #333, 0 40px 120px rgba(0,0,0,0.8), 0 0 140px rgba(212,242,74,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 72,
          overflow: "hidden",
          background: "#000",
        }}
      >
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%" }} />
        {children}
      </div>
    </div>
  );
};

/** Parmakla dokunma efekti. */
const Tap: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const t = useSec();
  const d = t - at;
  if (d < -0.15 || d > 0.9) return null;
  const p = interpolate(d, [-0.15, 0, 0.9], [0, 0, 1], { extrapolateRight: "clamp" });
  const press = interpolate(d, [-0.15, 0, 0.15], [0.6, 1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 40,
          top: y - 40,
          width: 80,
          height: 80,
          borderRadius: 99,
          background: "rgba(255,255,255,0.35)",
          transform: `scale(${press})`,
          opacity: interpolate(d, [0.3, 0.9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 40,
          top: y - 40,
          width: 80,
          height: 80,
          borderRadius: 99,
          border: `3px solid ${C.lime}`,
          transform: `scale(${1 + p * 1.8})`,
          opacity: 1 - p,
        }}
      />
    </>
  );
};

// ---------------------------------------------------------------- kartlar

const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  pop?: number;
}> = ({ children, style, pop = 1 }) => (
  <div
    style={{
      background: C.card,
      border: `2px solid ${C.border}`,
      borderRadius: 44,
      padding: "40px 44px",
      transform: `translateY(${interpolate(pop, [0, 1], [50, 0])}px) scale(${interpolate(pop, [0, 1], [0.94, 1])})`,
      opacity: interpolate(pop, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }),
      ...style,
    }}
  >
    {children}
  </div>
);

const Pill: React.FC<{
  children: React.ReactNode;
  active?: number;
  style?: React.CSSProperties;
}> = ({ children, active = 0, style }) => (
  <div
    style={{
      border: `2px solid ${active > 0.5 ? "#5C6B1E" : C.border}`,
      background: active > 0.5 ? "#151A05" : "#121212",
      color: active > 0.5 ? C.lime : C.white,
      borderRadius: 999,
      padding: "26px 40px",
      fontFamily: SANS,
      fontSize: 40,
      fontWeight: 500,
      transform: `scale(${1 + Math.sin(Math.min(active, 1) * Math.PI) * 0.06})`,
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------- sahneler

/** 0 — Hook: haftalık takvim, atlanan gün kırmızı; koç mesajı düşüyor. */
const HookScene: React.FC<{ coach?: boolean }> = ({ coach = true }) => {
  const t = useSec();
  const days = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];
  const miss = 3; // PER
  const missP = usePop(1.2, 9);
  const shake = t > 1.2 && t < 1.6 ? Math.sin(t * 90) * 10 * (1.6 - t) * 2.5 : 0;
  const phoneP = usePop(coach ? 2.35 : 99, 15);
  const msgP = usePop(4.1, 12);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Camera punch={0.1}>
        <div
          style={{
            position: "absolute",
            top: coach ? 230 : 420,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 40,
            transform: `translateY(${interpolate(phoneP, [0, 1], [180, -40])}px) scale(${interpolate(phoneP, [0, 1], [1, 0.82])})`,
          }}
        >
          <Label dot>Geçen hafta</Label>
          <div style={{ display: "flex", gap: 14 }}>
            {days.map((d, i) => {
              const isMiss = i === miss;
              const appear = usePop(i * 0.07, 16);
              return (
                <div
                  key={d}
                  style={{
                    width: 128,
                    height: 150,
                    borderRadius: 30,
                    border: `3px ${i > 4 ? "dashed" : "solid"} ${isMiss && missP > 0.3 ? C.red : C.border}`,
                    background: isMiss && missP > 0.3 ? "rgba(255,90,78,0.12)" : "#0F0F0F",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 18,
                    transform: `translateX(${isMiss ? shake : 0}px) translateY(${interpolate(appear, [0, 1], [40, 0])}px)`,
                    opacity: appear,
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 30,
                      letterSpacing: 4,
                      color: isMiss && missP > 0.3 ? C.red : C.gray,
                    }}
                  >
                    {d}
                  </span>
                  {isMiss && missP > 0.3 ? (
                    <span
                      style={{
                        color: C.red,
                        fontSize: 46,
                        fontFamily: SANS,
                        fontWeight: 700,
                        transform: `scale(${missP})`,
                      }}
                    >
                      ✕
                    </span>
                  ) : (
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 99,
                        background: i < 5 ? C.lime : "transparent",
                        border: i < 5 ? "none" : `2px solid ${C.dim}`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 30,
              letterSpacing: 6,
              color: C.red,
              opacity: missP,
            }}
          >
            PERŞEMBE · ATLANDI
          </div>
        </div>

        {/* koç bildirimi */}
        {coach ? (
        <div
          style={{
            position: "absolute",
            top: 820,
            left: 90,
            right: 90,
            opacity: interpolate(phoneP, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(phoneP, [0, 1], [120, 0])}px)`,
          }}
        >
          <Card style={{ padding: "44px 48px" }}>
            <Label dot size={26} style={{ marginBottom: 26 }}>
              Voom · Koç
            </Label>
            <div style={{ fontFamily: SANS, fontSize: 46, lineHeight: 1.35, color: C.white }}>
              Perşembe gelmedin. Bu hafta
              <span style={{ color: C.lime }}> o seti telafi ediyoruz.</span>
            </div>
            <div
              style={{
                marginTop: 34,
                display: "flex",
                gap: 18,
                opacity: msgP,
                transform: `translateY(${interpolate(msgP, [0, 1], [20, 0])}px)`,
              }}
            >
              <Pill>Neden gelmedin?</Pill>
            </div>
          </Card>
        </div>
        ) : null}
      </Camera>
    </AbsoluteFill>
  );
};

/** 1 — Logo çarpması. */
const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const p = usePop(0, 11);
  const flash = interpolate(frame, [0, 4], [0.35, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 50,
          transform: `scale(${interpolate(p, [0, 1], [1.6, 1])})`,
          opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
          marginTop: -200,
        }}
      >
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: 99,
            background: C.lime,
            boxShadow: `0 0 60px ${C.lime}`,
          }}
        />
        <span
          style={{
            fontFamily: MONO,
            fontSize: 190,
            letterSpacing: 60,
            color: C.white,
            fontWeight: 500,
          }}
        >
          VOOM
        </span>
      </div>
      <AbsoluteFill style={{ background: C.lime, opacity: flash }} />
    </AbsoluteFill>
  );
};

/** 2 — Kurulum: yaş, boy, kilo, hedef → program hazırlanıyor → salon / ev. */
type KurulumTiming = {
  rows: [string, string, number][];
  loadStart: number;
  loadDur: number;
  salon: number;
  ev: number;
};

const KURULUM_UZUN: KurulumTiming = {
  rows: [
    ["Yaş", "27", 0.1],
    ["Boy", "168 cm", 0.82],
    ["Kilo", "61 kg", 1.5],
    ["Hedef", "Şekillenme", 2.18],
  ],
  loadStart: 3.62,
  loadDur: 1.3,
  salon: 5.26,
  ev: 6.1,
};

const KurulumScene: React.FC<{ tm?: KurulumTiming }> = ({ tm = KURULUM_UZUN }) => {
  const t = useSec();
  const rows = tm.rows;
  const loadStart = tm.loadStart;
  const load = keyframes(t, [loadStart, loadStart + tm.loadDur], [0, 1]);
  const loadP = usePop(loadStart, 16);
  const salonP = usePop(tm.salon, 10);
  const evP = usePop(tm.ev, 10);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Camera>
        <div
          style={{
            position: "absolute",
            top: 200,
            left: 90,
            right: 90,
            display: "flex",
            flexDirection: "column",
            gap: 26,
          }}
        >
          <Label dot style={{ marginBottom: 20 }}>
            Seni tanıyalım
          </Label>
          {rows.map(([k, v, at]) => {
            const p = usePop(at, 13);
            return (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "34px 44px",
                  borderRadius: 36,
                  border: `2px solid ${C.border}`,
                  background: C.card,
                  opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                  transform: `translateX(${interpolate(p, [0, 1], [-80, 0])}px)`,
                }}
              >
                <Label size={28}>{k}</Label>
                <span
                  style={{
                    fontFamily: k === "Hedef" ? SERIF : MONO,
                    fontStyle: k === "Hedef" ? "italic" : "normal",
                    fontSize: k === "Hedef" ? 64 : 50,
                    color: C.white,
                  }}
                >
                  {v}
                </span>
              </div>
            );
          })}

          <div
            style={{
              marginTop: 30,
              opacity: interpolate(loadP, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            <Label size={26} color={load >= 1 ? C.lime : C.gray}>
              {load >= 1 ? "✓ Programın hazır" : "Programın yazılıyor…"}
            </Label>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const seg = Math.min(1, Math.max(0, load * 6 - i));
                return (
                  <div key={i} style={{ flex: 1, height: 10, borderRadius: 9, background: "#262626" }}>
                    <div
                      style={{
                        width: `${seg * 100}%`,
                        height: "100%",
                        borderRadius: 9,
                        background: C.lime,
                        boxShadow: seg > 0 ? `0 0 14px ${C.lime}` : "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 22, marginTop: 30 }}>
            {(
              [
                ["Salon", salonP],
                ["Ev", evP],
              ] as const
            ).map(([k, p]) => (
              <Pill
                key={k}
                active={p}
                style={{
                  flex: 1,
                  textAlign: "center",
                  opacity: interpolate(p, [0, 0.3], [0.25, 1], { extrapolateRight: "clamp" }),
                }}
              >
                {k}
              </Pill>
            ))}
          </div>
        </div>
      </Camera>
    </AbsoluteFill>
  );
};

/** 3 — Günlük ekran: rutin → makrolar → suplement → uyku. */
const GunlukScene: React.FC = () => {
  const t = useSec();
  const uykuP = usePop(3.2, 12);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Camera>
        <Phone
          src="voom/rutin.png"
          centerY={760}
          cams={[
            { t: 0, y: 0.5, s: 1.25 },
            { t: 1.05, y: 0.5, s: 1.3 },
            { t: 1.35, y: 0.17, s: 1.5 },
            { t: 1.75, y: 0.17, s: 1.55 },
            { t: 2.0, y: 0.81, s: 1.5 },
            { t: 2.95, y: 0.81, s: 1.55 },
            { t: 3.45, y: 0.5, s: 0.95 },
          ]}
        />
        <div
          style={{
            position: "absolute",
            top: 470,
            left: 110,
            right: 110,
          }}
        >
          <Card pop={uykuP} style={{ boxShadow: "0 30px 90px rgba(0,0,0,0.9)" }}>
            <Label dot size={26} style={{ marginBottom: 24 }}>
              Uyku
            </Label>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
              <span style={{ fontFamily: MONO, fontSize: 84, color: C.white }}>23:30</span>
              <span style={{ fontFamily: MONO, fontSize: 40, color: C.dim }}>→</span>
              <span style={{ fontFamily: MONO, fontSize: 84, color: C.white }}>07:00</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 36, color: C.gray, marginTop: 14 }}>
              Yatmadan 1 saat önce ekranı bırak.
            </div>
          </Card>
        </div>
      </Camera>
    </AbsoluteFill>
  );
};

/** 4 — Antrenman öncesi: "Bugün nasılsın?" */
const CheckinScene: React.FC = () => {
  const qP = usePop(0.05, 14);
  const opts = ["Harika", "İyi", "Yorgun", "Bitik"];
  const pick = usePop(3.3, 9);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Camera>
        <div style={{ position: "absolute", top: 300, left: 90, right: 90 }}>
          <div
            style={{
              opacity: qP,
              transform: `translateY(${interpolate(qP, [0, 1], [40, 0])}px)`,
            }}
          >
            <Label dot style={{ marginBottom: 34 }}>
              Antrenman öncesi
            </Label>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 104,
                lineHeight: 1.02,
                fontWeight: 600,
                color: C.white,
                letterSpacing: -3,
              }}
            >
              Bugün
              <br />
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, letterSpacing: 0 }}>
                nasılsın?
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 22, marginTop: 70 }}>
            {opts.map((o, i) => {
              const p = usePop(2.1 + i * 0.09, 14);
              return (
                <div
                  key={o}
                  style={{
                    opacity: p,
                    transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
                  }}
                >
                  <Pill active={o === "Yorgun" ? pick : 0}>{o}</Pill>
                </div>
              );
            })}
          </div>
        </div>
      </Camera>
    </AbsoluteFill>
  );
};

/** 5 — Koç ekranı: "Bugün çok yorgunum" dokunuşu + koçun cevabı. */
const YorgunScene: React.FC = () => {
  const replyP = usePop(0.55, 13);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Camera>
        <Phone
          src="voom/koc.png"
          centerY={720}
          enter={false}
          cams={[
            { t: 0, y: 0.47, s: 1.45 },
            { t: 1.8, y: 0.45, s: 1.55 },
          ]}
        >
          <Tap at={0.15} x={0.3 * SCREEN_W} y={0.481 * SCREEN_H} />
        </Phone>
        <div style={{ position: "absolute", top: 930, left: 90, right: 90 }}>
          <Card pop={replyP} style={{ boxShadow: "0 30px 90px rgba(0,0,0,0.9)" }}>
            <Label dot size={24} style={{ marginBottom: 20 }}>
              Voom · Koç
            </Label>
            <div style={{ fontFamily: SANS, fontSize: 42, lineHeight: 1.35, color: C.white }}>
              Tamam. Bugün 2 set eksik yapıyoruz,
              <span style={{ color: C.lime }}> dinlenmeyi uzattım.</span>
            </div>
          </Card>
        </div>
      </Camera>
    </AbsoluteFill>
  );
};

/** 6 — Hareket kartı: video + ipucu → değiştir → alternatif. */
const HareketScene: React.FC<{ swap?: boolean }> = ({ swap = true }) => {
  const frame = useCurrentFrame();
  const t = useSec();
  const swapAt = swap ? 3.1 : 99;
  const swapped = t >= swapAt;
  const flip = keyframes(t, [swapAt - 0.2, swapAt, swapAt + 0.2], [0, 90, 0]);
  const btnPress = usePop(1.95, 9);
  const name = swapped ? "Dambıl Glute Bridge" : "Barbell Hip Thrust";
  const sub = swapped ? "Alternatif · 3 × 12" : "4 × 10 · RPE 8";
  const progress = (frame % 75) / 75;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Camera>
        <div
          style={{
            position: "absolute",
            top: 230,
            left: 90,
            right: 90,
            transform: `perspective(2000px) rotateY(${flip}deg)`,
          }}
        >
          <Label dot style={{ marginBottom: 30 }}>
            Hareket 1 / 8
          </Label>
          <div
            style={{
              height: 560,
              borderRadius: 44,
              border: `2px solid ${C.border}`,
              background: "linear-gradient(160deg, #161616, #0A0A0A)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* basit hareket animasyonu: kalça yukarı-aşağı */}
            <svg width="620" height="340" viewBox="0 0 620 340">
              {(() => {
                const up = (Math.sin(frame / 9) + 1) / 2;
                const hipY = 230 - up * 70;
                return (
                  <g stroke={C.white} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.9">
                    <line x1="60" y1="300" x2="560" y2="300" stroke="#2A2A2A" />
                    <circle cx="110" cy="200" r="30" fill={C.white} stroke="none" />
                    <line x1="140" y1="210" x2="300" y2={hipY} />
                    <line x1="300" y1={hipY} x2="420" y2={hipY + 10 - up * 10} />
                    <line x1="420" y1={hipY + 10 - up * 10} x2="440" y2="295" />
                    {swapped ? null : (
                      <circle cx="300" cy={hipY - 30} r="22" stroke={C.lime} strokeWidth="10" />
                    )}
                  </g>
                );
              })()}
            </svg>
            <div style={{ position: "absolute", left: 30, right: 30, bottom: 26, height: 6, borderRadius: 9, background: "#2A2A2A" }}>
              <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 9, background: C.white }} />
            </div>
            <div style={{ position: "absolute", top: 28, left: 34 }}>
              <Label size={22}>▶ Video</Label>
            </div>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 66, fontWeight: 600, color: C.white, marginTop: 40, letterSpacing: -1.5 }}>
            {name}
          </div>
          <Label size={28} style={{ marginTop: 14 }}>
            {sub}
          </Label>
          <div
            style={{
              marginTop: 34,
              borderLeft: `5px solid ${C.lime}`,
              paddingLeft: 30,
              fontFamily: SANS,
              fontSize: 36,
              color: C.gray,
              lineHeight: 1.4,
            }}
          >
            <Label size={24} color={C.lime} style={{ marginBottom: 10 }}>
              İpucu
            </Label>
            {swapped ? "Topuklarından it, tepede 1 sn bekle." : "Çeneni göğsüne yakın tut, belini kavisleme."}
          </div>
          {swap && !swapped ? (
            <div style={{ display: "flex", marginTop: 34 }}>
              <Pill active={btnPress} style={{ fontSize: 36, padding: "22px 36px" }}>
                ⇄  Hareketi değiştir
              </Pill>
            </div>
          ) : null}
        </div>
      </Camera>
    </AbsoluteFill>
  );
};

/** 7 — Set kaydı + dinlenme sayacı + haftaya hedef. */
const KiloScene: React.FC<{ pace?: number }> = ({ pace = 1 }) => {
  const t = useSec() * pace;
  const sets: [string, number][] = [
    ["60 kg × 10", 0.15 / pace],
    ["60 kg × 10", 0.75 / pace],
    ["60 kg × 9", 1.35 / pace],
  ];
  const restLeft = Math.max(0, 90 - Math.floor(keyframes(t, [1.45, 1.95], [0, 18])));
  const restP = keyframes(t, [1.45, 1.95], [0, 0.2]);
  const nextP = usePop(1.95 / pace, 11);
  const fmt = (s: number) => `0${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Camera>
        <div style={{ position: "absolute", top: 220, left: 90, right: 90 }}>
          <Label dot style={{ marginBottom: 26 }}>
            Barbell Hip Thrust
          </Label>
          {sets.map(([v, at], i) => {
            const p = usePop(at, 13);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "30px 0",
                  borderBottom: `2px solid ${C.border}`,
                  opacity: interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
                  transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
                }}
              >
                <Label size={28}>Set {i + 1}</Label>
                <span style={{ fontFamily: MONO, fontSize: 52, color: C.white }}>{v}</span>
                <span style={{ color: C.lime, fontSize: 44, fontFamily: SANS }}>✓</span>
              </div>
            );
          })}

          <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 50 }}>
            <svg width="190" height="190" viewBox="0 0 190 190">
              <circle cx="95" cy="95" r="80" stroke="#262626" strokeWidth="12" fill="none" />
              <circle
                cx="95"
                cy="95"
                r="80"
                stroke={C.lime}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * restP}`}
                transform="rotate(-90 95 95)"
              />
            </svg>
            <div>
              <Label size={26}>Dinlenme</Label>
              <div style={{ fontFamily: MONO, fontSize: 88, color: C.white }}>{fmt(restLeft)}</div>
            </div>
          </div>

          <div style={{ marginTop: 50 }}>
            <Card pop={nextP} style={{ borderColor: "#5C6B1E", background: "#10140A" }}>
              <Label size={26} color={C.lime} style={{ marginBottom: 16 }}>
                Haftaya
              </Label>
              <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
                <span style={{ fontFamily: MONO, fontSize: 96, color: C.white }}>62,5 kg</span>
                <span style={{ fontFamily: MONO, fontSize: 40, color: C.lime }}>↑ 2,5</span>
              </div>
            </Card>
          </div>
        </div>
      </Camera>
    </AbsoluteFill>
  );
};

/** 8 — Koça hareket atma: uygun mu, saçmalık mı? */
const InstaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const t = useSec();
  const vidP = usePop(0.05, 13);
  const qP = usePop(1.75, 13);
  const typing = t > 2.4 && t < 3.95;
  const ansP = usePop(3.95, 12);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Camera>
        <div style={{ position: "absolute", top: 170, left: 80, right: 80 }}>
          <div style={{ paddingBottom: 30, borderBottom: `2px solid ${C.border}`, marginBottom: 50 }}>
            <Label size={30} color={C.white}>
              ←  Voom · Koç
            </Label>
          </div>

          {/* kullanıcı: video + soru */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 18 }}>
            <div
              style={{
                width: 360,
                height: 460,
                borderRadius: 36,
                background: "linear-gradient(200deg, #3a2a20, #120d0b)",
                border: `2px solid ${C.border}`,
                position: "relative",
                overflow: "hidden",
                opacity: vidP,
                transform: `translateY(${interpolate(vidP, [0, 1], [40, 0])}px) rotate(${interpolate(vidP, [0, 1], [4, 0])}deg)`,
              }}
            >
              {/* "garip" bir hareket — tek ayak üstünde ağırlıkla dönüş */}
              <svg width="360" height="460" viewBox="0 0 360 460">
                {(() => {
                  const a = Math.sin(frame / 7) * 0.5;
                  return (
                    <g stroke="#EDE3D9" strokeWidth="11" strokeLinecap="round" fill="none">
                      <circle cx={180 + Math.sin(a) * 30} cy="110" r="26" fill="#EDE3D9" stroke="none" />
                      <line x1={180 + Math.sin(a) * 30} y1="140" x2="180" y2="270" />
                      <line x1="180" y1="270" x2="180" y2="400" />
                      <line x1="180" y1="270" x2={240} y2={330} />
                      <line x1={180 + Math.sin(a) * 20} y1="170" x2={180 + Math.cos(a) * 110} y2={150 + Math.sin(a) * 60} />
                      <rect x={170 + Math.cos(a) * 110} y={130 + Math.sin(a) * 60} width="40" height="40" fill="#EDE3D9" stroke="none" />
                    </g>
                  );
                })()}
              </svg>
              <div style={{ position: "absolute", left: 22, bottom: 20 }}>
                <Label size={20} color="#EDE3D9">▶ 0:12</Label>
              </div>
            </div>
            <div
              style={{
                background: "#1C1C1C",
                borderRadius: 40,
                padding: "28px 38px",
                fontFamily: SANS,
                fontSize: 42,
                color: C.white,
                opacity: qP,
                transform: `translateY(${interpolate(qP, [0, 1], [24, 0])}px)`,
              }}
            >
              Bunu denesem mi?
            </div>
          </div>

          {/* koç */}
          <div style={{ marginTop: 50 }}>
            {typing ? (
              <div style={{ display: "flex", gap: 14, padding: "20px 0" }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 99,
                      background: C.gray,
                      opacity: 0.35 + 0.65 * ((Math.sin(frame / 3 - i) + 1) / 2),
                    }}
                  />
                ))}
              </div>
            ) : null}
            {t >= 3.95 ? (
              <div
                style={{
                  opacity: ansP,
                  transform: `translateY(${interpolate(ansP, [0, 1], [24, 0])}px)`,
                }}
              >
                <Label dot size={24} style={{ marginBottom: 20 }}>
                  Voom · Koç
                </Label>
                <div style={{ fontFamily: SANS, fontSize: 46, lineHeight: 1.35, color: C.white }}>
                  Deneme. Belin için risk, kalçaya da faydası yok.
                  <span style={{ color: C.lime }}> Yerine Romanian Deadlift ekledim.</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Camera>
    </AbsoluteFill>
  );
};

/** 9 — Kapanış: "cebinde bir koç" → logo. */
const FinalScene: React.FC<{ logoAt?: number }> = ({ logoAt = 2.2 }) => {
  const t = useSec();
  const logoP = usePop(logoAt, 13);
  const phoneOut = keyframes(t, [logoAt - 0.2, logoAt + 0.5], [0, 1]);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Camera punch={0.04}>
        <div style={{ opacity: 1 - phoneOut, transform: `translateY(${-phoneOut * 120}px)` }}>
          <Phone
            src="voom/bugun.png"
            centerY={760}
            cams={[
              { t: 0, y: 0.3, s: 1.2 },
              { t: logoAt - 0.2, y: 0.42, s: 0.95 },
            ]}
          />
        </div>
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            opacity: logoP,
            transform: `scale(${interpolate(logoP, [0, 1], [1.15, 1])})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 34, marginTop: -260 }}>
            <span style={{ width: 34, height: 34, borderRadius: 99, background: C.lime, boxShadow: `0 0 50px ${C.lime}` }} />
            <span style={{ fontFamily: MONO, fontSize: 150, letterSpacing: 46, color: C.white }}>VOOM</span>
          </div>
          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 72,
              color: C.gray,
              marginTop: 30,
            }}
          >
            cebindeki koç
          </div>
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- altyazı

/** Cümle sonlarında sayfayı böler, en fazla 3 kelime. */
const toPages = (words: Word[]): Word[][] => {
  const pages: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length === 3 || /[.?!:…,]$/.test(w.text)) {
      pages.push(cur);
      cur = [];
    }
  }
  if (cur.length) pages.push(cur);
  return pages;
};

/** Seslendirmede okunuşa göre yazılan kelimeler ekranda doğru yazılsın. */
const DISPLAY: Record<string, string> = { Vum: "Voom" };

const clean = (s: string) => {
  const w = s.replace(/\.\.\.$/, "").replace(/[.,:]$/, "");
  return DISPLAY[w] ?? w;
};

const Captions: React.FC<{ words: Word[]; plain?: boolean }> = ({ words, plain }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pages = toPages(words);
  const idx = pages.findIndex(
    (p, i) => t >= p[0].start - 0.05 && t < (pages[i + 1]?.[0].start ?? Infinity) - 0.05,
  );
  if (idx < 0) return null;
  const page = pages[idx];
  // Uzun sessizlikte altyazıyı kaldır
  if (t > page[page.length - 1].end + 0.6) return null;
  const pop = spring({
    frame: frame - Math.round((page[0].start - 0.05) * fps),
    fps,
    config: { damping: 13, mass: 0.5 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 1420,
        left: 70,
        right: 70,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 22px",
        transform: plain
          ? undefined
          : `translateY(${interpolate(pop, [0, 1], [24, 0])}px) scale(${interpolate(pop, [0, 1], [0.92, 1])})`,
        opacity: interpolate(pop, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
      }}
    >
      {page.map((w, i) => {
        const spoken = plain || t >= w.start - 0.03;
        const key = !plain && /vum|voom|kaytar|saçmalık|koç|ektin/i.test(w.text);
        return (
          <span
            key={i}
            style={{
              fontFamily: SANS,
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.12,
              color: spoken ? (key ? C.lime : C.white) : "rgba(255,255,255,0.35)",
              textShadow: "0 4px 30px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.9)",
            }}
          >
            {clean(w.text)}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- ana video

export const VoomTanitim: React.FC<VoomTanitimProps> = ({ audioName, data }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const order: [keyof typeof S, React.FC][] = [
    ["hook", HookScene],
    ["logo", LogoScene],
    ["kurulum", KurulumScene],
    ["gunluk", GunlukScene],
    ["checkin", CheckinScene],
    ["yorgun", YorgunScene],
    ["hareket", HareketScene],
    ["kilo", KiloScene],
    ["insta", InstaScene],
    ["final", FinalScene],
  ];

  return (
    <AbsoluteFill lang="tr" style={{ background: C.bg }}>
      {order.map(([k, Scene], i) => {
        const from = Math.round(S[k] * fps);
        const next = order[i + 1];
        const to = next ? Math.round(S[next[0]] * fps) : durationInFrames;
        return (
          <Sequence key={k} from={from} durationInFrames={to - from} name={k}>
            <Scene />
          </Sequence>
        );
      })}
      <Vignette />
      {/* altyazı okunsun diye alt kısımda yumuşak karartma */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, transparent 0%, transparent 66%, rgba(0,0,0,0.82) 76%, rgba(0,0,0,0.82) 88%, transparent 100%)",
        }}
      />
      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          <Captions words={data.words} />
        </>
      ) : null}
      <Grain />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- kısa sürüm (15 sn)

/**
 * 15 saniyelik kısa sürüm. Metin `icerik/voom-kisa.txt`.
 * Koçla sohbet / "yapay zeka" hissi veren sahneler yok; altyazı sade (kelime kelime vurgu yok).
 */
const K = {
  hook: 0,
  logo: 2.45,
  kurulum: 4.7,
  hareket: 10.8,
  kilo: 13.1,
  final: 15.15,
};

const KURULUM_KISA: KurulumTiming = {
  rows: [
    ["Yaş", "27", 0.15],
    ["Kilo", "61 kg", 0.8],
    ["Hedef", "Şekillenme", 1.4],
  ],
  loadStart: 2.3,
  loadDur: 0.8,
  salon: 4.35,
  ev: 5.3,
};

export const VoomKisa: React.FC<VoomTanitimProps> = ({ audioName, data }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const order: [keyof typeof K, React.ReactNode][] = [
    ["hook", <HookScene coach={false} />],
    ["logo", <LogoScene />],
    ["kurulum", <KurulumScene tm={KURULUM_KISA} />],
    ["hareket", <HareketScene swap={false} />],
    ["kilo", <KiloScene pace={1.6} />],
    ["final", <FinalScene logoAt={1.1} />],
  ];

  return (
    <AbsoluteFill lang="tr" style={{ background: C.bg }}>
      {order.map(([k, scene], i) => {
        const from = Math.round(K[k] * fps);
        const next = order[i + 1];
        const to = next ? Math.round(K[next[0]] * fps) : durationInFrames;
        return (
          <Sequence key={k} from={from} durationInFrames={to - from} name={k}>
            {scene}
          </Sequence>
        );
      })}
      <Vignette />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, transparent 0%, transparent 66%, rgba(0,0,0,0.82) 76%, rgba(0,0,0,0.82) 88%, transparent 100%)",
        }}
      />
      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          <Captions words={data.words} plain />
        </>
      ) : null}
      <Grain />
    </AbsoluteFill>
  );
};
