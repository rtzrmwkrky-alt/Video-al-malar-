/**
 * "Her kafadan bir ses" — 15 saniyelik sade sürüm (gerçek insan, Mixkit).
 *
 * Kurallar: her çekimde yüz tam görünsün (yüz konumu OpenCV ile ölçüldü, `face`),
 * ekranda yalnızca altyazı + sonda tek bir DSÖ bilgi kartı.
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
import { MONO, SANS, loadFonts } from "../fonts";
import type { VoiceoverData } from "../types";
import { Captions, Pop } from "../ui/overlays";

loadFonts();

export type HerKafadan15Props = {
  audioName: string;
  data: VoiceoverData | null;
};

type Shot = {
  at: number;
  id: string;
  /** klibin içinden başlangıç (sn) */
  from: number;
  /** kaynak videoda yüzün yeri (0-1); dikey kliplerde gerekmez */
  face?: [number, number];
  zoom?: [number, number];
};

const SHOTS: Shot[] = [
  { at: 0, id: "52107", from: 3.5, face: [0.57, 0.49], zoom: [1.0, 1.1] },
  { at: 2.25, id: "32807", from: 1, zoom: [1.0, 1.06] },
  { at: 3.6, id: "42899", from: 1, face: [0.45, 0.46], zoom: [1.05, 1.15] },
  { at: 6.25, id: "48564", from: 7.5, face: [0.35, 0.27], zoom: [1.0, 1.08] },
  { at: 8.25, id: "32019", from: 0.5, face: [0.61, 0.52], zoom: [1.0, 1.06] },
  { at: 10.85, id: "52107", from: 8, face: [0.52, 0.3], zoom: [1.0, 1.15] },
];

/** 16:9 kaynağı 9:16 kadraja "cover" ile yerleştirirken yüzü ortalayan konum (%). */
const objectX = (fx: number) => {
  const visible = (9 / 16) / (16 / 9); // kadrajda görünen genişlik oranı ≈ 0.316
  const p = (fx - visible / 2) / (1 - visible);
  return Math.min(1, Math.max(0, p)) * 100;
};

const ShotView: React.FC<{ shot: Shot; dur: number }> = ({ shot, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [z0, z1] = shot.zoom ?? [1, 1.05];
  const z = interpolate(frame, [0, dur * fps], [z0, z1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(`stock/${shot.id}.mp4`)}
        trimBefore={Math.round(shot.from * fps)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${shot.face ? objectX(shot.face[0]) : 50}% 50%`,
          // zoom yüzün üzerine doğru: yüz kadrajda kalsın
          transformOrigin: `50% ${(shot.face?.[1] ?? 0.5) * 100}%`,
          transform: `scale(${z})`,
          filter: "contrast(1.05) saturate(1.06)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Sondaki tek bilgi kartı: Dünya Sağlık Örgütü önerisi. */
const WhoCard: React.FC<{ t: number; at: number }> = ({ t, at }) => (
  <Pop at={at} t={t} style={{ left: 540, top: 1300 }}>
    <div
      style={{
        width: 900,
        background: "rgba(255,255,255,0.96)",
        borderRadius: 36,
        padding: "40px 46px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        fontFamily: SANS,
        color: "#111",
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: "#666", marginBottom: 16 }}>
        DÜNYA SAĞLIK ÖRGÜTÜ ÖNERİSİ
      </div>
      <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.18, letterSpacing: -1 }}>
        Haftada 150–300 dk hareket
        <br />+ en az 2 gün kuvvet
      </div>
      <div style={{ fontSize: 38, fontWeight: 600, color: "#2FBF71", marginTop: 16 }}>Gerisi senin hedefine göre.</div>
      <div style={{ fontSize: 22, color: "#888", marginTop: 14 }}>Kaynak: WHO, Fiziksel Aktivite Rehberi (2020)</div>
    </div>
  </Pop>
);

export const HerKafadan15: React.FC<HerKafadan15Props> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const voiceEnd = data?.durationInSeconds ?? 14;

  // kesmelerde kısa, hafif kayma geçişi
  const near = SHOTS.slice(1)
    .map((s) => t - s.at)
    .find((d) => d > -0.06 && d < 0.1);
  const whip = near === undefined ? 0 : 1 - Math.abs(near) / 0.1;

  return (
    <AbsoluteFill lang="tr" style={{ background: "#000" }}>
      <AbsoluteFill
        style={{
          filter: whip > 0 ? `blur(${whip * 10}px)` : undefined,
          transform: whip > 0 ? `translateX(${(near ?? 0) * -400}px)` : undefined,
        }}
      >
        {SHOTS.map((s, i) => {
          const from = Math.round(s.at * fps);
          const to = i + 1 < SHOTS.length ? Math.round(SHOTS[i + 1].at * fps) : durationInFrames;
          return (
            <Sequence key={i} from={from} durationInFrames={to - from} name={s.id}>
              <ShotView shot={s} dur={(to - from) / fps} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.4) 72%, rgba(0,0,0,0.4) 80%, transparent 90%)",
        }}
      />
      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          {t < voiceEnd + 0.2 ? <Captions words={data.words} t={t} /> : null}
        </>
      ) : null}
      <WhoCard t={t} at={voiceEnd + 0.15} />
    </AbsoluteFill>
  );
};
