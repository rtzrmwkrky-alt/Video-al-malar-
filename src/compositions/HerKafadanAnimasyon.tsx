/**
 * "Her kafadan bir ses" — 3D animasyon sürümü (referans: Zack D. Films tarzı).
 *
 * Tek, kesintisiz 3D sahne: kamera karakterler arasında yumuşakça süzülür (kesme yok).
 * Ana karakter ortada; etrafında üç "tavsiyeci" kendi önerisini yapar:
 *   turuncu → yerinde koşu (kardiyo), mor → hızlı hafif dambıl, yeşil → matta plank (pilates).
 * Zamanlama seslendirmedeki kelime sırasına bağlı (ses değişse de uyumlu kalır).
 */
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SANS, SERIF, loadFonts } from "../fonts";
import { CameraRig, Character, useGltf, type Clip } from "../three/Character";
import {
  Backdrop,
  Floor,
  Mat,
  PLANK,
  curl,
  faceTo,
  lerp3,
  makeDumbbell,
  project,
  rep,
  type Cam,
  type V3,
} from "../three/scene";
import type { VoiceoverData, Word } from "../types";
import { Bubble, Captions } from "../ui/overlays";

loadFonts();

export type HerKafadanAnimasyonProps = {
  audioName: string;
  data: VoiceoverData | null;
};

const COL = { orange: "#FF8A3D", purple: "#A47BFF", green: "#36D27E", lime: "#C8F53C" };

/** Cümle başlarının kelime sıraları (metne göre). */
const WD = { biri: 7, oburu: 12, baskasi: 17, sen: 23, durust: 31, senin: 40, vucut: 41, neye: 42, ihtiyac: 43, asil: 46, final: 49 };

const POS = {
  main: [0, 0, 0] as V3,
  a: [-1.6, 0, 1.5] as V3,
  b: [1.6, 0, 1.5] as V3,
  /** plank: ayaklar burada, baş ana karaktere doğru */
  cFeet: [0, 0.3, 3.65] as V3,
  cHead: [0, 0.75, 1.95] as V3,
};

const smooth = Easing.bezier(0.45, 0, 0.25, 1);
const sm = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: smooth, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ------------------------------------------------------------ kamera

type Setup = { from: Cam; to: Cam } | ((k: number) => Cam);

const orbit = (k: number): Cam => {
  const a = 0.35 - 0.7 * k; // sağdan sola, karakterin önünden geçerek
  return { pos: [Math.sin(a) * 2.2, 1.25, Math.cos(a) * 2.2], target: [0, 0.98, 0], fov: 40 };
};

const SETUPS: { word: number; setup: Setup; move?: number }[] = [
  { word: 0, setup: { from: { pos: [0.6, 1.45, 3.4], target: [0, 1.15, 0], fov: 38 }, to: { pos: [0.3, 1.5, 2.6], target: [0, 1.3, 0], fov: 38 } } },
  { word: WD.biri, setup: { from: { pos: [1.3, 1.4, 0.7], target: [-1.6, 1.15, 1.5], fov: 40 }, to: { pos: [1.0, 1.42, 0.8], target: [-1.6, 1.2, 1.5], fov: 38 } } },
  { word: WD.oburu, setup: { from: { pos: [-1.3, 1.4, 0.7], target: [1.6, 1.1, 1.5], fov: 40 }, to: { pos: [-1.0, 1.42, 0.8], target: [1.6, 1.15, 1.5], fov: 38 } } },
  { word: WD.baskasi, setup: { from: { pos: [1.3, 1.6, 5.6], target: [0, 0.45, 2.4], fov: 40 }, to: { pos: [0.9, 1.4, 5.1], target: [0, 0.45, 2.4], fov: 40 } } },
  { word: WD.sen, setup: { from: { pos: [0, 1.4, 3.3], target: [0, 1.05, 0], fov: 40 }, to: { pos: [0, 1.38, 2.6], target: [0, 1.1, 0], fov: 40 } } },
  { word: WD.durust, setup: { from: { pos: [0.3, 3.9, -4.6], target: [0, 0.7, 1.4], fov: 52 }, to: { pos: [0.1, 3.4, -4.0], target: [0, 0.75, 1.4], fov: 52 } } },
  { word: WD.senin, setup: orbit },
  { word: WD.asil, setup: { from: { pos: [0, 1.45, 2.4], target: [0, 1.3, 0], fov: 38 }, to: { pos: [0, 1.5, 1.85], target: [0, 1.4, 0], fov: 38 } } },
  { word: WD.final, move: 0.35, setup: { from: { pos: [0, 1.58, 1.05], target: [0, 1.53, 0], fov: 38 }, to: { pos: [0, 1.6, 0.82], target: [0, 1.56, 0], fov: 38 } } },
];

const cutTime = (words: Word[], w: number) => (w === 0 ? 0 : (words[w]?.start ?? w * 0.45) - 0.1);

const poseOf = (s: Setup, k: number): Cam => {
  if (typeof s === "function") return s(k);
  const e = smooth(Math.min(1, Math.max(0, k)));
  return {
    pos: lerp3(s.from.pos, s.to.pos, e),
    target: lerp3(s.from.target, s.to.target, e),
    fov: s.from.fov + (s.to.fov - s.from.fov) * e,
  };
};

/** Her an için kamera: her kurulumun içinde yavaş kayma + kurulumlar arası yumuşak geçiş. */
const cameraAt = (t: number, words: Word[], end: number): Cam => {
  const starts = SETUPS.map((s) => cutTime(words, s.word));
  let i = 0;
  while (i + 1 < SETUPS.length && t >= starts[i + 1]) i++;
  const segEnd = (n: number) => (n + 1 < SETUPS.length ? starts[n + 1] : end);
  const local = (n: number) => poseOf(SETUPS[n].setup, (t - starts[n]) / Math.max(0.1, segEnd(n) - starts[n]));
  const cur = local(i);
  const move = SETUPS[i].move ?? 0.75;
  if (i === 0 || t > starts[i] + move) return cur;
  // önceki kurulumdan bu kuruluma geçiş (önceki çekim donmuş gibi değil, kaymaya devam ederken)
  const prev = poseOf(SETUPS[i - 1].setup, 1);
  const k = sm(t, starts[i] - 0.05, starts[i] + move);
  return { pos: lerp3(prev.pos, cur.pos, k), target: lerp3(prev.target, cur.target, k), fov: prev.fov + (cur.fov - prev.fov) * k };
};

// ------------------------------------------------------------ 3D dünya

const World: React.FC<{ t: number; bot: GLTF; cam: Cam; W: (i: number) => number }> = ({ t, bot, cam, W }) => {
  const db = useMemo(() => ({ l1: makeDumbbell(3.2), l2: makeDumbbell(3.2) }), []);

  // ana karakter: dinlerken başını konuşana çevirir, "yol alamıyorsun"da yerinde koşar
  const runW = sm(t, W(WD.sen) - 0.1, W(WD.sen) + 0.3) * (1 - sm(t, W(WD.durust) - 0.2, W(WD.durust) + 0.3));
  const shakeW = 1 - sm(t, W(WD.biri) - 0.3, W(WD.biri) + 0.2);
  const mainClips: Clip[] = [
    { name: "headShake", weight: shakeW * (1 - runW) },
    { name: "idle", weight: (1 - shakeW) * (1 - runW) },
    { name: "run", weight: runW },
  ];
  const look =
    sm(t, W(WD.biri) - 0.2, W(WD.biri) + 0.3) * faceTo(POS.main, POS.a) * 0.55 +
    sm(t, W(WD.oburu) - 0.2, W(WD.oburu) + 0.3) * (faceTo(POS.main, POS.b) - faceTo(POS.main, POS.a)) * 0.55 -
    sm(t, W(WD.baskasi) - 0.2, W(WD.baskasi) + 0.3) * faceTo(POS.main, POS.b) * 0.55;
  const glowAmt = (w: number) => sm(t, W(w) - 0.1, W(w) + 0.3) * (1 - sm(t, W(WD.asil) - 0.1, W(WD.asil) + 0.5)) * 0.7;

  const breathe = Math.sin(t * 2.4) * 0.006;

  return (
    <>
      <CameraRig position={cam.pos} target={cam.target} fov={cam.fov} />
      <hemisphereLight args={["#d6ecff", "#7a5a44", 1.25]} />
      <directionalLight
        position={[2.5, 5, 3.5]}
        intensity={2.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-3, 2.5, -4]} intensity={1.4} color="#9fd2ff" />
      <Floor />

      <Character
        gltf={bot}
        clips={mainClips}
        rotationY={look}
        glow={{
          legs: [COL.lime, glowAmt(WD.vucut)],
          arms: [COL.lime, glowAmt(WD.neye)],
          core: [COL.lime, glowAmt(WD.ihtiyac)],
        }}
      />

      {/* turuncu: "önce kardiyo" → yerinde koşu */}
      <Character
        gltf={bot}
        tint={COL.orange}
        clips={[{ name: "run", weight: 1 }]}
        position={POS.a}
        rotationY={faceTo(POS.a, POS.main)}
      />

      {/* mor: "hafif ağırlık, çok tekrar" → hızlı biceps curl */}
      <Character
        gltf={bot}
        tint={COL.purple}
        clips={[{ name: "idle", weight: 1, time: t + 0.7 }]}
        position={POS.b}
        rotationY={faceTo(POS.b, POS.main)}
        aims={curl(rep(t, 0.62))}
        attach={[
          { bone: "LeftHand", object: db.l1 },
          { bone: "RightHand", object: db.l2 },
        ]}
      />

      {/* yeşil: "pilates her şeyi çözer" → matta plank */}
      <group position={[0, 0, 2.75]}>
        <Mat />
      </group>
      <Character
        gltf={bot}
        tint={COL.green}
        clips={[{ name: "idle", weight: 1, time: 0 }]}
        rotationY={Math.PI}
        rootRotation={[Math.PI / 2, 0, 0]}
        position={[POS.cFeet[0], POS.cFeet[1] + breathe, POS.cFeet[2]]}
        aims={PLANK}
      />
    </>
  );
};

// ------------------------------------------------------------ ekran üstü

const PopAt: React.FC<{
  t: number;
  at: number;
  out?: number;
  x: number;
  y: number;
  visible?: boolean;
  children: React.ReactNode;
}> = ({ t, at, out, x, y, visible = true, children }) => {
  const { fps } = useVideoConfig();
  if (t < at || !visible) return null;
  const p = spring({ frame: Math.round((t - at) * fps), fps, config: { damping: 13, mass: 0.5 } });
  const o = out === undefined ? 1 : interpolate(t, [out, out + 0.3], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: Math.min(Math.max(x, 250), 830),
        top: Math.max(y, 200),
        transform: `translate(-50%, -100%) scale(${interpolate(p, [0, 1], [0.5, 1]) * (0.85 + 0.15 * o)})`,
        opacity: Math.min(1, p * 3) * o,
      }}
    >
      {children}
    </div>
  );
};

const Overlays: React.FC<{ t: number; cam: Cam; W: (i: number) => number }> = ({ t, cam, W }) => {
  const P = (p: V3) => project(cam, p);
  const headMain = P([0, 1.95, 0]);
  const els: React.ReactNode[] = [];

  // giriş: her kafadan bir ses — ana karakterin etrafında üç balon
  const hookOut = W(WD.biri) - 0.25;
  ([
    ["Önce kardiyo!", COL.orange, -330, 120, 0.45],
    ["Çok tekrar!", COL.purple, 330, 40, 0.85],
    ["Pilates!", COL.green, -60, -170, 1.25],
  ] as const).forEach(([text, c, dx, dy, at], i) =>
    els.push(
      <PopAt key={`h${i}`} t={t} at={at} out={hookOut} x={headMain.x + dx} y={headMain.y + dy}>
        <Bubble text={text} color={c} size={46} />
      </PopAt>,
    ),
  );

  // konuşanlar tek tek
  const speaker = (key: string, p: V3, text: string, c: string, at: number, out: number) => {
    const s = P(p);
    els.push(
      <PopAt key={key} t={t} at={at} out={out} x={s.x} y={s.y - 20} visible={s.visible}>
        <Bubble text={text} color={c} size={54} />
      </PopAt>,
    );
  };
  speaker("a", [POS.a[0], 2.05, POS.a[2]], "Önce kardiyo yap!", COL.orange, W(WD.biri + 1), W(WD.oburu) - 0.3);
  speaker("b", [POS.b[0], 2.05, POS.b[2]], "Hafif ağırlık, çok tekrar!", COL.purple, W(WD.oburu + 1), W(WD.baskasi) - 0.3);
  speaker("c", POS.cHead, "Pilates her şeyi çözer!", COL.green, W(WD.baskasi + 2), W(WD.sen) - 0.3);

  // "yol alamıyorsun": balonlar ana karakterin başı etrafında döner
  if (t > W(WD.sen) - 0.1 && t < W(WD.durust) + 0.3) {
    (["Kardiyo!", "Çok tekrar!", "Pilates!"] as const).forEach((text, k) => {
      const a = t * 1.7 + (k * Math.PI * 2) / 3;
      const p = P([Math.sin(a) * 0.75, 1.95 + Math.sin(a * 2) * 0.05, Math.cos(a) * 0.75]);
      const front = Math.cos(a) > -0.2;
      els.push(
        <PopAt key={`o${k}`} t={t} at={W(WD.sen) + k * 0.15} out={W(WD.durust) - 0.1} x={p.x} y={p.y} visible={p.visible}>
          <div style={{ opacity: front ? 1 : 0.45 }}>
            <Bubble text={text} color={[COL.orange, COL.purple, COL.green][k]} size={40} />
          </div>
        </PopAt>,
      );
    });
  }

  // geniş plan: herkes kendi bildiğini söylüyor
  ([
    [[POS.a[0], 2.05, POS.a[2]], "Kardiyo!", COL.orange],
    [[POS.b[0], 2.05, POS.b[2]], "Çok tekrar!", COL.purple],
    [POS.cHead, "Pilates!", COL.green],
  ] as const).forEach(([p, text, c], k) => {
    const s = P(p as V3);
    els.push(
      <PopAt key={`w${k}`} t={t} at={W(WD.durust + 2) + k * 0.15} out={W(WD.senin) - 0.2} x={s.x} y={s.y} visible={s.visible}>
        <Bubble text={text} color={c} size={44} />
      </PopAt>,
    );
  });

  return <>{els}</>;
};

const EndTitle: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const { fps } = useVideoConfig();
  if (t < at) return null;
  const p = spring({ frame: Math.round((t - at) * fps), fps, config: { damping: 18, mass: 0.7 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 1250,
        textAlign: "center",
        opacity: p,
        transform: `scale(${interpolate(p, [0, 1], [0.85, 1])})`,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 104,
          color: "white",
          letterSpacing: -2.5,
          lineHeight: 1,
          WebkitTextStroke: "6px #111",
          paintOrder: "stroke",
          textShadow: "0 8px 30px rgba(0,0,0,0.45)",
        }}
      >
        Senin hedefin
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 170,
          color: COL.lime,
          lineHeight: 1.05,
          WebkitTextStroke: "6px #111",
          paintOrder: "stroke",
        }}
      >
        ne?
      </div>
    </div>
  );
};

// ------------------------------------------------------------ ana video

const MUSIC = { file: "music/623.mp3", dropInTrack: 15.35, introFrom: 99 };

export const HerKafadanAnimasyon: React.FC<HerKafadanAnimasyonProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const total = durationInFrames / fps;
  const bot = useGltf("models/Xbot.glb");
  const words = data?.words ?? [];
  const voiceEnd = data?.durationInSeconds ?? 24;
  const W = (i: number) => cutTime(words, i);
  const cam = cameraAt(t, words, total);
  const titleAt = W(WD.final);
  const musicStart = titleAt - MUSIC.dropInTrack;

  const fade = interpolate(t, [0, 0.25, total - 0.6, total], [1, 0, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill lang="tr" style={{ background: "#2a84d8", overflow: "hidden" }}>
      <Backdrop t={t} />
      {bot ? (
        <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
          <World t={t} bot={bot} cam={cam} W={W} />
        </ThreeCanvas>
      ) : null}
      <Overlays t={t} cam={cam} W={W} />
      {data ? (
        <>
          <Audio src={staticFile(`audio/${audioName}.mp3`)} />
          {t < titleAt - 0.05 ? <Captions words={data.words} t={t} /> : null}
        </>
      ) : null}
      <EndTitle t={t} at={titleAt + 0.1} />

      {/* müzik: girişte sakin bölüm, bas girişi kapanış sorusunda */}
      <Sequence durationInFrames={Math.max(1, Math.round((musicStart + 0.6) * fps))} name="müzik-giriş">
        <Audio
          src={staticFile(MUSIC.file)}
          trimBefore={Math.round(MUSIC.introFrom * fps)}
          volume={(f) =>
            0.11 * interpolate(f / fps, [0, 0.4, musicStart, musicStart + 0.6], [0, 1, 1, 0], { extrapolateRight: "clamp" })
          }
        />
      </Sequence>
      <Sequence from={Math.round(Math.max(0, musicStart) * fps)} name="müzik">
        <Audio
          src={staticFile(MUSIC.file)}
          volume={(f) => {
            const vt = musicStart + f / fps;
            const base = vt < voiceEnd ? 0.11 : 0.3;
            const outro = interpolate(vt, [total - 1.2, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return base * outro * interpolate(f / fps, [0, 0.6], [0, 1], { extrapolateRight: "clamp" });
          }}
        />
      </Sequence>

      <AbsoluteFill style={{ background: "#000", opacity: fade, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
