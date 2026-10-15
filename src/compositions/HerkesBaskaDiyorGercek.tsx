/**
 * "Her kafadan bir ses" — gerçek insan görüntüleriyle (Mixkit stok videoları).
 *
 * Kahraman: karanlık spor salonundaki kadın (52xxx serisi) — video onunla açılır
 * ve kapanır. Tavsiye verenler: koç, küçük dambıllı kadın, pilates eğitmeni.
 * Çekim listesi `SHOTS`, zamanlar seslendirmedeki kelimelere göre (saniye).
 * Klip kaynakları: icerik/stok-kaynaklar.md
 */
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SANS, loadFonts } from "../fonts";
import type { VoiceoverData } from "../types";
import { Bubble, Captions, Meter, Pop, Small, Sticker } from "../ui/overlays";

loadFonts();

export type HerkesBaskaDiyorGercekProps = {
  audioName: string;
  data: VoiceoverData | null;
};

const COL = {
  orange: "#FF8A3D",
  purple: "#A47BFF",
  green: "#2FBF71",
  red: "#FF3B30",
  yellow: "#FFD60A",
  lime: "#B8F03A",
};

/** Tek klip: hangi dosya, klibin kaçıncı saniyesinden, yatayda nereye odaklanılacak, zoom. */
type Clip = {
  id: string;
  /** klibin içinden başlangıç (sn) */
  from: number;
  /** yatay odak 0 (sol) – 1 (sağ) */
  x?: number;
  /** zoom'un dikey merkezi 0 (üst) – 1 (alt) */
  y?: number;
  zoom?: [number, number];
  rate?: number;
  look?: "normal" | "tired" | "faded";
};

type Shot = { at: number; clip?: Clip; split?: Clip[] };

const SPLIT3: Clip[] = [
  { id: "24305", from: 4, x: 0.58 },
  { id: "42899", from: 2, x: 0.5 },
  { id: "48548", from: 3, x: 0.74 },
];
const SPLIT2: Clip[] = [
  { id: "42899", from: 4, x: 0.5, zoom: [1.15, 1.2] },
  { id: "52109", from: 1, x: 0.5, zoom: [1.05, 1.1] },
];

const SHOTS: Shot[] = [
  { at: 0, clip: { id: "52107", from: 3.5, x: 0.45, zoom: [1.0, 1.15] } },
  { at: 2.15, clip: { id: "24305", from: 2, x: 0.58, zoom: [1.05, 1.15] } },
  { at: 4.5, clip: { id: "42899", from: 1, x: 0.5, zoom: [1.0, 1.1] } },
  { at: 7.65, clip: { id: "48548", from: 1, x: 0.74, zoom: [1.0, 1.1] } },
  { at: 10.6, clip: { id: "15776", from: 1, x: 0.5, zoom: [1.1, 1.25] } },
  { at: 12.2, split: SPLIT3 },
  { at: 15.0, clip: { id: "52127", from: 0.5, x: 0.33, zoom: [1.0, 1.08] } },
  { at: 16.05, clip: { id: "52128", from: 3.5, x: 0.4, zoom: [1.05, 1.12], look: "tired" } },
  { at: 17.2, clip: { id: "52106", from: 2, x: 0.5, zoom: [1.1, 1.18], rate: 0.7, look: "tired" } },
  { at: 18.4, clip: { id: "44434", from: 13, x: 0.5, zoom: [1.0, 1.08] } },
  { at: 21.05, clip: { id: "32807", from: 0.5, zoom: [1.0, 1.05] } },
  { at: 23.7, split: SPLIT2 },
  { at: 25.8, clip: { id: "12794", from: 5, x: 0.74, y: 0.1, zoom: [1.0, 1.15] } },
  { at: 28.55, split: SPLIT2 },
  { at: 30.95, clip: { id: "52094", from: 2, x: 0.47, zoom: [1.5, 1.6] } },
  { at: 33.7, clip: { id: "48552", from: 2, x: 0.45, zoom: [1.0, 1.08] } },
  { at: 36.8, clip: { id: "50965", from: 0.5, x: 0.55, zoom: [1.0, 1.06] } },
  { at: 38.5, clip: { id: "52111", from: 3, x: 0.55, zoom: [1.0, 1.06] } },
  { at: 41.1, clip: { id: "48556", from: 4, x: 0.5, zoom: [1.0, 1.08], look: "faded" } },
  { at: 43.9, clip: { id: "52117", from: 0.5, x: 0.5, zoom: [1.0, 1.1] } },
  { at: 46.9, clip: { id: "52107", from: 8, x: 0.45, zoom: [1.1, 1.4] } },
];

// ------------------------------------------------------------ görüntü

const ClipView: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [z0, z1] = clip.zoom ?? [1, 1.05];
  const z = interpolate(frame, [0, dur * fps], [z0, z1], { extrapolateRight: "clamp" });
  const filter =
    clip.look === "faded"
      ? "grayscale(0.85) brightness(0.55) contrast(1.05)"
      : "contrast(1.06) saturate(1.08)";
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(`stock/${clip.id}.mp4`)}
        trimBefore={Math.round(clip.from * fps)}
        playbackRate={clip.rate ?? 1}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${(clip.x ?? 0.5) * 100}% 50%`,
          transform: `scale(${z})`,
          transformOrigin: `50% ${(clip.y ?? 0.5) * 100}%`,
          filter,
        }}
      />
      {clip.look === "tired" ? (
        <AbsoluteFill
          style={{
            background: "radial-gradient(ellipse 90% 60% at 50% 85%, rgba(255,40,30,0.45), transparent 70%)",
            mixBlendMode: "screen",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const ShotView: React.FC<{ shot: Shot; dur: number }> = ({ shot, dur }) => {
  if (shot.clip) return <ClipView clip={shot.clip} dur={dur} />;
  const parts = shot.split ?? [];
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", gap: 8, background: "#000" }}>
      {parts.map((c, i) => (
        <div key={i} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <ClipView clip={c} dur={dur} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ üst katman

const Check: React.FC<{ ok: boolean; at: number; t: number; size?: number }> = ({ ok, at, t, size = 96 }) => {
  if (t < at) return null;
  const s = interpolate(t, [at, at + 0.12, at + 0.25], [0.5, 1.2, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        background: ok ? COL.green : COL.red,
        color: "white",
        fontSize: size * 0.62,
        fontWeight: 900,
        fontFamily: SANS,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "6px solid white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        transform: `scale(${s})`,
      }}
    >
      {ok ? "✓" : "✕"}
    </div>
  );
};

const Overlays: React.FC<{ t: number }> = ({ t }) => {
  if (t < 2.15) {
    const items: [string, number, number, number, string][] = [
      ["Önce kardiyo!", 0.05, 260, 330, COL.orange],
      ["Ağır kaldır!", 0.3, 800, 470, COL.purple],
      ["Pilates yap!", 0.55, 270, 980, COL.green],
      ["Hafif, çok tekrar!", 0.8, 760, 820, COL.red],
      ["Her gün koş!", 1.05, 560, 210, COL.yellow],
      ["Sadece yürü!", 1.3, 800, 1120, "#3aa8ff"],
    ];
    return (
      <>
        {items.map(([text, a, x, y, c], i) => (
          <Pop key={i} at={a} t={t} tilt={i % 2 ? 4 : -4} style={{ left: x, top: y }}>
            <Bubble text={text} color={c} size={46} tail={x < 540 ? "right" : "left"} />
          </Pop>
        ))}
      </>
    );
  }
  if (t < 10.6) {
    const [text, color, at] =
      t < 4.5
        ? ["Önce kardiyo yap!", COL.orange, 3.1]
        : t < 7.65
          ? ["Hafif ağırlık, çok tekrar!", COL.purple, 5.2]
          : ["Pilates her şeyi çözer!", COL.green, 8.7];
    return (
      <Pop at={at} t={t} style={{ left: 540, top: 330 }}>
        <Bubble text={text} color={color} size={58} />
      </Pop>
    );
  }
  if (t < 12.2) {
    return (
      <Pop at={10.75} t={t} tilt={-3} style={{ left: 540, top: 360 }}>
        <Sticker size={64}>Hangisi doğru? 🤔</Sticker>
      </Pop>
    );
  }
  if (t < 15.0) {
    const labels: [string, string][] = [
      ["Önce kardiyo", COL.orange],
      ["Hafif + çok tekrar", COL.purple],
      ["Pilates", COL.green],
    ];
    const panel = 1920 / 3;
    return (
      <>
        {labels.map(([text, c], i) => (
          <div key={i}>
            <Pop at={12.25 + i * 0.1} t={t} style={{ left: 330, top: i === 2 ? 1580 : panel * i + 110 }}>
              <Bubble text={text} color={c} size={42} />
            </Pop>
            <div style={{ position: "absolute", left: 860, top: i === 2 ? 1530 : panel * i + 70 }}>
              <Check ok={t < 13.95} at={t < 13.95 ? 12.85 + i * 0.1 : 13.95 + i * 0.06} t={t} />
            </div>
          </div>
        ))}
      </>
    );
  }
  if (t < 18.4) {
    return (
      <>
        <Pop at={15.15} t={t} style={{ left: 540, top: 300 }}>
          <Meter label="BACAK YORGUNLUĞU" value={interpolate(t, [15.2, 17.6], [0.05, 0.88], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} color={COL.red} />
        </Pop>
        {t >= 17.3 ? (
          <Pop at={17.3} t={t} tilt={-3} style={{ left: 540, top: 470 }}>
            <Sticker bg={COL.red} color="white">
              ⚠ Yorgun bacak = zayıf set
            </Sticker>
          </Pop>
        ) : null}
      </>
    );
  }
  if (t < 23.7) {
    const guc = t < 21.05;
    return (
      <Pop at={guc ? 18.5 : 21.15} t={t} tilt={guc ? -2 : 2} style={{ left: 540, top: 380 }}>
        <Sticker size={54}>
          <Small>{guc ? "HEDEF: GÜÇLENMEK" : "HEDEF: KOŞU / DAYANIKLILIK"}</Small>
          <div>1. {guc ? "Ağırlık" : "Kardiyo"}</div>
          <div style={{ color: "#999" }}>2. {guc ? "Kardiyo" : "Ağırlık"}</div>
        </Sticker>
      </Pop>
    );
  }
  if (t < 25.8 || (t >= 28.55 && t < 30.95)) {
    const grow = t >= 28.55;
    return (
      <>
        <Pop at={grow ? 28.6 : 23.8} t={t} style={{ left: 250, top: 110 }}>
          <Sticker size={40}>
            <Small>HAFİF</Small>15–20 tekrar
          </Sticker>
        </Pop>
        <Pop at={grow ? 28.7 : 24.0} t={t} style={{ left: 250, top: 1070 }}>
          <Sticker size={40}>
            <Small>AĞIR</Small>6–8 tekrar
          </Sticker>
        </Pop>
        {grow ? (
          <>
            <div style={{ position: "absolute", left: 880, top: 80 }}>
              <Check ok at={28.75} t={t} />
            </div>
            <div style={{ position: "absolute", left: 880, top: 1040 }}>
              <Check ok at={28.85} t={t} />
            </div>
            <Pop at={29.0} t={t} tilt={-2} style={{ left: 540, top: 960 }}>
              <Sticker bg={COL.green} color="white" size={56}>
                İkisinde de kas büyür
              </Sticker>
            </Pop>
          </>
        ) : null}
      </>
    );
  }
  if (t < 28.55) {
    const v = interpolate(t, [25.84, 27.6], [0.3, 0.96], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <>
        <Pop at={25.9} t={t} style={{ left: 540, top: 300 }}>
          <Meter label="ZORLANMA" value={v} color={v > 0.8 ? COL.red : COL.yellow} />
        </Pop>
        <Pop at={26.6} t={t} tilt={2} style={{ left: 540, top: 470 }}>
          <Sticker size={50}>Son 2–3 tekrar zor olmalı</Sticker>
        </Pop>
      </>
    );
  }
  if (t < 33.7) {
    return (
      <Pop at={31.1} t={t} tilt={2} style={{ left: 540, top: 360 }}>
        <Sticker bg={COL.yellow} size={58}>
          Güç için: ağır yük 🏋️
        </Sticker>
      </Pop>
    );
  }
  if (t < 41.1) {
    return (
      <>
        {t < 36.8 ? (
          <Pop at={34.85} t={t} tilt={-2} style={{ left: 540, top: 360 }}>
            <Sticker bg={COL.green} color="white" size={56}>
              Karın + duruş ✓
            </Sticker>
          </Pop>
        ) : t < 38.5 ? (
          <Pop at={36.95} t={t} tilt={2} style={{ left: 540, top: 360 }}>
            <Sticker size={56}>
              <Small>KALBİN İÇİN</Small>❤️ Kardiyo
            </Sticker>
          </Pop>
        ) : (
          <Pop at={38.6} t={t} tilt={-2} style={{ left: 540, top: 360 }}>
            <Sticker size={56}>
              <Small>KASLARIN İÇİN</Small>🏋️ Daha fazla yük
            </Sticker>
          </Pop>
        )}
      </>
    );
  }
  if (t < 46.9) {
    if (t < 43.9) {
      const fade = interpolate(t, [42.2, 43.8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const items: [string, number, number][] = [
        ["Kardiyo!", 280, 420],
        ["Çok tekrar!", 760, 620],
        ["Pilates!", 330, 860],
      ];
      return (
        <>
          {items.map(([text, x, y], i) => (
            <div key={i} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", opacity: fade }}>
              <Bubble text={text} color="#777" size={42} dim />
            </div>
          ))}
        </>
      );
    }
    return (
      <Pop at={44.0} t={t} style={{ left: 540, top: 360 }}>
        <Sticker bg={COL.lime} size={56}>
          Senin vücudun, senin ihtiyacın
        </Sticker>
      </Pop>
    );
  }
  return (
    <>
      <Pop at={48.45} t={t} style={{ left: 540, top: 380 }}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 140,
            letterSpacing: -4,
            color: "white",
            textAlign: "center",
            lineHeight: 0.95,
            WebkitTextStroke: "7px #111",
            paintOrder: "stroke",
            textShadow: "0 12px 40px rgba(0,0,0,0.45)",
          }}
        >
          HEDEFİN
          <br />
          <span style={{ color: COL.yellow }}>NE?</span>
        </div>
      </Pop>
      <Pop at={49.6} t={t} style={{ left: 540, top: 1700 }}>
        <Sticker size={38}>📌 Kaydet, lazım olacak</Sticker>
      </Pop>
    </>
  );
};

// ------------------------------------------------------------ ana video

export const HerkesBaskaDiyorGercek: React.FC<HerkesBaskaDiyorGercekProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  // kesmelerde hızlı "whip" geçişi: bulanıklık + kayma
  const near = SHOTS.slice(1)
    .map((s) => t - s.at)
    .find((d) => d > -0.08 && d < 0.12);
  const whip = near === undefined ? 0 : 1 - Math.abs(near) / 0.12;

  return (
    <AbsoluteFill lang="tr" style={{ background: "#000" }}>
      <AbsoluteFill
        style={{
          filter: whip > 0 ? `blur(${whip * 16}px)` : undefined,
          transform: whip > 0 ? `translateX(${(near ?? 0) * -600}px) scale(${1 + whip * 0.08})` : undefined,
        }}
      >
        {SHOTS.map((s, i) => {
          const from = Math.round(s.at * fps);
          const to = i + 1 < SHOTS.length ? Math.round(SHOTS[i + 1].at * fps) : durationInFrames;
          return (
            <Sequence key={i} from={from} durationInFrames={to - from} name={s.clip?.id ?? "split"}>
              <ShotView shot={s} dur={(to - from) / fps} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      {/* altyazı okunsun diye alt kısımda yumuşak karartma */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, transparent 58%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.45) 80%, transparent 92%)",
        }}
      />
      <Overlays t={t} />
      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          <Captions words={data.words} t={t} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
