/**
 * "Her kafadan bir ses" — akıcı, profesyonel kurgu (~35 sn).
 *
 * Kurgu ilkeleri:
 * - Kesmeler cümle başlarında, sesten ~2 kare önce (görüntü sesi taşır). Efekt geçişi yok.
 * - Tüm kliplere aynı renk ayarı + vinyet + hafif gren → tek film gibi.
 * - Her çekimde yavaş "push-in"; zoom merkezi yüzde (yüz konumları OpenCV ile ölçüldü).
 * - Müzik (Mixkit "Deep Urban") bas girişi "Dünya Sağlık Örgütü" cümlesine denk getirildi.
 * - Ekranda: sade altyazı + DSÖ bilgisi için tek alt bant + kapanış başlığı.
 */
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MONO, SANS, SERIF, loadFonts } from "../fonts";
import type { VoiceoverData, Word } from "../types";

loadFonts();

export type HerKafadanAkiciProps = {
  audioName: string;
  data: VoiceoverData | null;
};

type Shot = {
  /** kesme anı (sn) */
  at: number;
  id: string;
  /** klibin içinden başlangıç (sn) */
  from: number;
  /** kaynakta yüzün yeri (0-1); yoksa ortalanır */
  face?: [number, number];
  /** push-in miktarı */
  push?: number;
  /** başlangıç büyütmesi ("daha yakına kes" için) */
  base?: number;
  rate?: number;
};

const SHOTS: Shot[] = [
  { at: 0, id: "52107", from: 4.0, face: [0.56, 0.37], push: 0.08 },
  { at: 2.2, id: "32807", from: 1.0 },
  { at: 4.56, id: "42899", from: 1.0, face: [0.45, 0.46] },
  { at: 7.22, id: "48564", from: 7.5, face: [0.35, 0.27] },
  { at: 10.28, id: "52108", from: 3.0, face: [0.49, 0.3] },
  { at: 13.44, id: "48556", from: 4.0, face: [0.5, 0.4], rate: 0.85 },
  { at: 17.12, id: "52117", from: 0.3, face: [0.6, 0.45], push: 0.1 },
  { at: 20.45, id: "52106", from: 0.0, face: [0.54, 0.73], push: 0.05 },
  { at: 23.96, id: "52110", from: 0.0, face: [0.55, 0.5] },
  { at: 26.6, id: "52111", from: 11.0, face: [0.58, 0.51] },
  { at: 29.12, id: "52107", from: 0.5, face: [0.54, 0.3], push: 0.05 },
  { at: 31.2, id: "52107", from: 9.0, face: [0.5, 0.26], push: 0.08, base: 1.3 },
];

/** Müzik: bas girişi (parçada 15.35 sn) → videoda "Dünya" (20.45 sn). */
const MUSIC = { file: "music/623.mp3", dropInTrack: 15.35, dropInVideo: 20.45, introFrom: 99 };

// ------------------------------------------------------------ görüntü

/** 16:9 kaynağı 9:16 kadraja "cover" ile koyarken yüzü ortalayan yatay konum (%). */
const objectX = (fx: number) => {
  const visible = 9 / 16 / (16 / 9);
  return Math.min(1, Math.max(0, (fx - visible / 2) / (1 - visible))) * 100;
};

const ShotView: React.FC<{ shot: Shot; dur: number }> = ({ shot, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = frame / (dur * fps);
  // yumuşak, sabit hızlı itme (ease-out)
  const z = (shot.base ?? 1) + (shot.push ?? 0.06) * (1 - Math.pow(1 - Math.min(1, k), 1.6));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(`stock/${shot.id}.mp4`)}
        trimBefore={Math.round(shot.from * fps)}
        playbackRate={shot.rate ?? 1}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${shot.face ? objectX(shot.face[0]) : 50}% 50%`,
          transformOrigin: `50% ${(shot.face?.[1] ?? 0.45) * 100}%`,
          transform: `scale(${z})`,
          // ortak renk: biraz kontrast, biraz az doygunluk, sıcak orta tonlar
          filter: "contrast(1.08) saturate(0.88) brightness(0.97) sepia(0.08)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Tek film hissi: soğuk gölge / sıcak ışık tonu, vinyet ve hafif gren. */
const Grade: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 24;
  return (
    <>
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(20,60,80,0.18), rgba(0,0,0,0) 40%, rgba(255,150,80,0.08))",
          mixBlendMode: "soft-light",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)" }}
      />
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay" }}>
        <svg width="1080" height="1920">
          <filter id={`n${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
          </filter>
          <rect width="1080" height="1920" filter={`url(#n${seed})`} />
        </svg>
      </AbsoluteFill>
    </>
  );
};

// ------------------------------------------------------------ yazılar

/** Sade altyazı: cümle parçaları (en fazla 5 kelime), söylenen kelime tam beyaz. */
const pagesOf = (words: Word[]) => {
  const strip = (s: string) => s.replace(/["“”]/g, "");
  const pages: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length === 5 || /[.?!:,]$/.test(strip(w.text))) {
      pages.push(cur);
      cur = [];
    }
  }
  if (cur.length) pages.push(cur);
  return pages;
};
const show = (s: string) =>
  s
    .replace(/["“”]/g, "")
    .replace(/[.,:]$/, "");

const Subtitles: React.FC<{ words: Word[]; t: number; hideAfter: number }> = ({ words, t, hideAfter }) => {
  const { fps } = useVideoConfig();
  if (t > hideAfter) return null;
  const pages = pagesOf(words);
  const i = pages.findIndex((p, n) => t >= p[0].start - 0.06 && t < (pages[n + 1]?.[0].start ?? Infinity) - 0.06);
  if (i < 0) return null;
  const page = pages[i];
  if (t > page[page.length - 1].end + 0.5) return null;
  const p = spring({ frame: Math.round((t - page[0].start + 0.06) * fps), fps, config: { damping: 20, mass: 0.6 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: 1340,
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 70,
        lineHeight: 1.15,
        letterSpacing: -1.2,
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
        textShadow: "0 2px 18px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.5)",
      }}
    >
      {page.map((w, n) => (
        <span key={n} style={{ color: t >= w.start - 0.04 ? "#FFFFFF" : "rgba(255,255,255,0.45)" }}>
          {show(w.text)}
          {n < page.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

/** DSÖ alt bandı: cümleyle birlikte satır satır açılır. */
const WhoBand: React.FC<{ t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();
  const start = 21.2;
  const end = 29.0;
  if (t < start || t > end + 0.4) return null;
  const inP = spring({ frame: Math.round((t - start) * fps), fps, config: { damping: 22 } });
  const out = interpolate(t, [end, end + 0.4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const row = (at: number, big: string, small: string) => {
    const r = spring({ frame: Math.round((t - at) * fps), fps, config: { damping: 22 } });
    return (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 22,
          marginTop: 18,
          opacity: t < at ? 0 : r,
          transform: `translateX(${(1 - r) * -20}px)`,
        }}
      >
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, color: "white", letterSpacing: -1.5 }}>{big}</span>
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 36, color: "rgba(255,255,255,0.8)" }}>{small}</span>
      </div>
    );
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        top: 250,
        opacity: inP * out,
        transform: `translateY(${(1 - inP) * 16}px)`,
        borderLeft: "6px solid #E8FF59",
        paddingLeft: 30,
        textShadow: "0 2px 16px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: "#E8FF59" }}>DÜNYA SAĞLIK ÖRGÜTÜ</div>
      {row(24.9, "150+ dk", "her hafta hareket")}
      {row(27.2, "2 gün", "her hafta kuvvet")}
      <div style={{ fontFamily: SANS, fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 16 }}>
        Kaynak: WHO Fiziksel Aktivite Rehberi, 2020
      </div>
    </div>
  );
};

/** Kapanış başlığı. */
const EndTitle: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const { fps } = useVideoConfig();
  if (t < at) return null;
  const p = spring({ frame: Math.round((t - at) * fps), fps, config: { damping: 24, mass: 0.8 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          marginTop: 620,
          textAlign: "center",
          opacity: p,
          transform: `translateY(${(1 - p) * 24}px)`,
          textShadow: "0 4px 30px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 92, color: "white", letterSpacing: -2.5, lineHeight: 1 }}>
          Senin hedefin
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 150, color: "#E8FF59", lineHeight: 1.05 }}>ne?</div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ ana video

export const HerKafadanAkici: React.FC<HerKafadanAkiciProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const total = durationInFrames / fps;
  const voiceEnd = data?.durationInSeconds ?? 32.6;
  const titleAt = 31.2;

  // siyahtan açılış / siyaha kapanış
  const fade = interpolate(t, [0, 0.25, total - 0.6, total], [1, 0, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const musicStart = MUSIC.dropInVideo - MUSIC.dropInTrack; // ana parçanın videoda başladığı an
  const musicVol = (vt: number) => {
    // konuşma altında kısık, sonda biraz açılır, en sonda kısılır
    const base = vt < voiceEnd ? 0.11 : 0.24;
    const outro = interpolate(vt, [total - 1.2, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return base * outro;
  };

  return (
    <AbsoluteFill lang="tr" style={{ background: "#000" }}>
      {SHOTS.map((s, i) => {
        const from = Math.round(s.at * fps);
        const to = i + 1 < SHOTS.length ? Math.round(SHOTS[i + 1].at * fps) : durationInFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from} name={`${i + 1}-${s.id}`}>
            <ShotView shot={s} dur={(to - from) / fps} />
          </Sequence>
        );
      })}
      <Grade />
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25), transparent 22%, transparent 62%, rgba(0,0,0,0.5) 85%)" }}
      />

      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          <Subtitles words={data.words} t={t} hideAfter={titleAt - 0.05} />
        </>
      ) : null}
      <WhoBand t={t} />
      <EndTitle t={t} at={titleAt + 0.1} />

      {/* müzik: girişte parçanın sakin bölümü, sonra ana parça (bas girişi DSÖ cümlesinde) */}
      <Sequence durationInFrames={Math.round((musicStart + 0.6) * fps)} name="müzik-giriş">
        <Audio
          src={staticFile(MUSIC.file)}
          trimBefore={Math.round(MUSIC.introFrom * fps)}
          volume={(f) =>
            0.11 * interpolate(f / fps, [0, 0.4, musicStart, musicStart + 0.6], [0, 1, 1, 0], { extrapolateRight: "clamp" })
          }
        />
      </Sequence>
      <Sequence from={Math.round(musicStart * fps)} name="müzik">
        <Audio
          src={staticFile(MUSIC.file)}
          volume={(f) => musicVol(musicStart + f / fps) * interpolate(f / fps, [0, 0.6], [0, 1], { extrapolateRight: "clamp" })}
        />
      </Sequence>

      <AbsoluteFill style={{ background: "#000", opacity: fade, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
