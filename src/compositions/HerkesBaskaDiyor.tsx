/**
 * "Her kafadan bir ses" — bilgilendirici Reels.
 * 3D manken karakter (Mixamo Xbot) + kelime kelime altyazı + bilgi etiketleri.
 *
 * Tek bir 3D sahne tüm video boyunca açık kalır; hangi sahnenin görüneceği
 * seslendirmedeki kelime zamanlarına göre `T` tablosundan seçilir.
 */
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SANS, loadFonts } from "../fonts";
import { CameraRig, Character, useGltf, type Aim } from "../three/Character";
import type { VoiceoverData } from "../types";
import { Bubble, Captions, Meter, Pop, Small, Sticker } from "../ui/overlays";

loadFonts();

export type HerkesBaskaDiyorProps = {
  audioName: string;
  data: VoiceoverData | null;
};

const W = 1080;
const H = 1920;

/** Sahne başlangıçları (saniye) — seslendirmeden. */
const T = {
  hook: 0,
  spkA: 2.15,
  spkB: 4.5,
  spkC: 7.65,
  wide: 10.6,
  run: 15.0,
  tired: 16.65,
  guc: 18.4,
  kosu: 21.05,
  curl: 23.7,
  heavy: 30.95,
  pilates: 33.7,
  others: 41.1,
  final: 46.9,
};
const CUTS = [T.spkA, T.spkB, T.spkC, T.wide, T.run, T.tired, T.guc, T.kosu, T.curl, T.pilates, T.others, T.final];

const COL = {
  orange: "#FF8A3D",
  purple: "#A47BFF",
  green: "#36D27E",
  red: "#FF3B30",
  yellow: "#FFD60A",
  lime: "#B8F03A",
};

// ------------------------------------------------------------ yardımcılar

type V3 = [number, number, number];
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const kf = (t: number, ts: number[], vs: number[]) =>
  interpolate(t, ts, vs, { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const lerp3 = (a: V3, b: V3, k: number): V3 => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];
const norm = (v: V3): V3 => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const faceTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);
/** 0→1→0 tekrar hareketi */
const rep = (t: number, period: number) => (1 - Math.cos((2 * Math.PI * Math.max(0, t)) / period)) / 2;

type Cam = { pos: V3; target: V3; fov: number };

/** Konuşan kişilerin yerleri (ana karakter merkezde, önü +z) */
const POS = {
  main: [0, 0, 0] as V3,
  a: [-1.35, 0, 1.6] as V3,
  b: [1.35, 0, 1.6] as V3,
  c: [0.15, 0, 2.5] as V3,
};

/** Her an için kamera — 3D sahne ve ekran üstü etiketler aynı kamerayı kullanır. */
const cameraAt = (t: number): Cam => {
  const seg = (a: number, b: number, from: Cam, to: Cam): Cam => {
    const k = kf(t, [a, b], [0, 1]);
    return {
      pos: lerp3(from.pos, to.pos, k),
      target: lerp3(from.target, to.target, k),
      fov: from.fov + (to.fov - from.fov) * k,
    };
  };
  let c: Cam;
  if (t < T.spkA) {
    c = seg(0, T.spkA, { pos: [0.55, 1.45, 2.6], target: [0, 1.2, 0], fov: 36 }, { pos: [0.3, 1.5, 1.75], target: [0, 1.32, 0], fov: 36 });
  } else if (t < T.spkB) {
    c = seg(T.spkA, T.spkB, { pos: [1.75, 1.5, 0.7], target: [-1.35, 1.2, 1.6], fov: 36 }, { pos: [1.35, 1.5, 0.85], target: [-1.35, 1.25, 1.6], fov: 34 });
  } else if (t < T.spkC) {
    c = seg(T.spkB, T.spkC, { pos: [-1.75, 1.5, 0.7], target: [1.35, 1.15, 1.6], fov: 36 }, { pos: [-1.35, 1.5, 0.85], target: [1.35, 1.2, 1.6], fov: 34 });
  } else if (t < T.wide) {
    c = seg(T.spkC, T.wide, { pos: [1.9, 1.5, -0.1], target: [0.15, 1.2, 2.5], fov: 36 }, { pos: [1.6, 1.5, 0.25], target: [0.15, 1.25, 2.5], fov: 34 });
  } else if (t < T.run) {
    c = seg(T.wide, T.run, { pos: [0.5, 3.9, -4.6], target: [0, 0.7, 1.3], fov: 52 }, { pos: [0.25, 3.4, -4.0], target: [0, 0.75, 1.3], fov: 52 });
  } else if (t < T.tired) {
    c = seg(T.run, T.tired, { pos: [2.9, 1.15, 0.5], target: [0, 0.95, 0.15], fov: 38 }, { pos: [2.3, 0.95, 0.2], target: [0, 0.8, 0.1], fov: 38 });
  } else if (t < T.guc) {
    c = seg(T.tired, T.guc, { pos: [1.9, 1.15, 2.5], target: [0, 0.8, 0], fov: 38 }, { pos: [1.6, 1.0, 2.1], target: [0, 0.75, 0], fov: 38 });
  } else if (t < T.kosu) {
    c = seg(T.guc, T.kosu, { pos: [-2.0, 0.9, 2.6], target: [0, 0.85, 0], fov: 38 }, { pos: [-1.7, 0.85, 2.3], target: [0, 0.85, 0], fov: 38 });
  } else if (t < T.curl) {
    c = seg(T.kosu, T.curl, { pos: [-2.9, 1.1, 0.4], target: [0, 0.95, 0.1], fov: 38 }, { pos: [-2.6, 1.05, -0.2], target: [0, 0.95, 0.1], fov: 38 });
  } else if (t < T.heavy) {
    c = seg(T.curl, T.heavy, { pos: [0, 1.25, 4.6], target: [0, 1.05, 0], fov: 36 }, { pos: [0, 1.25, 4.1], target: [0, 1.05, 0], fov: 36 });
  } else if (t < T.pilates) {
    c = seg(T.heavy, T.heavy + 0.6, { pos: [0, 1.25, 4.1], target: [0, 1.05, 0], fov: 36 }, { pos: [0.75, 1.35, 2.4], target: [0.55, 1.15, 0], fov: 36 });
  } else if (t < T.others) {
    c = seg(T.pilates, T.others, { pos: [2.4, 1.35, 3.1], target: [0, 0.3, 0.1], fov: 38 }, { pos: [2.0, 1.05, 2.6], target: [0, 0.3, 0.1], fov: 38 });
  } else if (t < T.final) {
    const a = kf(t, [T.others, T.final], [0.9, -0.5]);
    const r = kf(t, [T.others, T.final], [5.0, 4.0]);
    c = { pos: [Math.sin(a) * r, 2.3, Math.cos(a) * r], target: [0, 1.0, 1.0], fov: 38 };
  } else {
    c = seg(T.final, T.final + 3.4, { pos: [0, 1.58, 2.4], target: [0, 1.45, 0], fov: 36 }, { pos: [0, 1.6, 0.85], target: [0, 1.55, 0], fov: 36 });
  }
  // elde çekim titreşimi
  const j = 0.012;
  c.pos = [c.pos[0] + Math.sin(t * 1.7) * j, c.pos[1] + Math.cos(t * 2.3) * j, c.pos[2] + Math.sin(t * 1.1) * j];
  return c;
};

/** 3D noktayı ekran pikseline çevirir (etiketleri karakterlere bağlamak için). */
const project = (cam: Cam, p: V3) => {
  const c = new THREE.PerspectiveCamera(cam.fov, W / H, 0.05, 200);
  c.position.set(...cam.pos);
  c.lookAt(...cam.target);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(c);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
};

// ------------------------------------------------------------ 3D nesneler

const makeDumbbell = (plate: number, bar = 16) => {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: "#2b2b2e", metalness: 0.6, roughness: 0.35 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, bar + plate * 1.2, 16), metal);
  g.add(handle);
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(plate, plate, plate * 0.55 + 2, 24), metal);
    p.position.y = s * (bar / 2 + plate * 0.3);
    g.add(p);
  }
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  // el kemiğinde: avuç içine, parmaklara dik
  g.rotation.z = Math.PI / 2;
  g.position.set(0, 9, 2.5);
  return g;
};

const Floor: React.FC = () => {
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1024;
    const ctx = cv.getContext("2d")!;
    const g = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
    g.addColorStop(0, "rgba(196,150,112,1)");
    g.addColorStop(0.55, "rgba(186,140,104,1)");
    g.addColorStop(1, "rgba(186,140,104,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 1024);
    // toprak/kum dokusu
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const d = Math.hypot(x - 512, y - 512) / 512;
      if (d > 1) continue;
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "255,240,225" : "90,60,40"},${0.12 * (1 - d)})`;
      ctx.fillRect(x, y, 2, 2);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[14, 64]} />
      <meshStandardMaterial map={tex} transparent roughness={1} />
    </mesh>
  );
};

/** Koşu sahnesi: pist çizgileri (koşuyormuş hissi için akar). */
const Track: React.FC<{ t: number; speed: number }> = ({ t, speed }) => {
  const off = (t * speed) % 1.2;
  return (
    <group>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.05, 20]} />
          <meshStandardMaterial color="#f4efe8" />
        </mesh>
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} position={[0, 0.003, -8 + i * 1.2 - off]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.1, 0.04]} />
          <meshStandardMaterial color="#e9e1d6" transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
};

const Mat: React.FC = () => (
  <mesh position={[0, 0.008, 0]} receiveShadow>
    <boxGeometry args={[0.75, 0.016, 2.1]} />
    <meshStandardMaterial color="#5B3FA8" roughness={0.9} />
  </mesh>
);

// ------------------------------------------------------------ pozlar

const STAND_LEGS: Aim[] = [
  ["LeftUpLeg", [0.08, -1, 0]],
  ["RightUpLeg", [-0.08, -1, 0]],
  ["LeftLeg", [0.02, -1, -0.02]],
  ["RightLeg", [-0.02, -1, -0.02]],
];

/** Goblet squat: k = 0 ayakta, 1 aşağıda. */
const squat = (k: number, shake = 0): { aims: Aim[]; drop: number } => {
  const s = shake;
  const up: V3 = [0.25, -1, 0];
  const down: V3 = [0.32, -0.18, 1];
  const lUp = norm(lerp3(up, down, k));
  const rUp: V3 = [-lUp[0], lUp[1], lUp[2]];
  const shin = norm(lerp3([0.05, -1, 0], [0.12, -1, -0.12], k));
  return {
    drop: 46 * k + s * 2,
    aims: [
      ["Spine", norm([s * 0.05, 1, 0.12 + 0.35 * k])],
      ["LeftUpLeg", [lUp[0] + s * 0.06, lUp[1], lUp[2]]],
      ["RightUpLeg", [rUp[0] - s * 0.06, rUp[1], rUp[2]]],
      ["LeftLeg", [shin[0], shin[1], shin[2]]],
      ["RightLeg", [-shin[0], shin[1], shin[2]]],
      ["LeftArm", [0.25, -0.65, 0.45]],
      ["RightArm", [-0.25, -0.65, 0.45]],
      ["LeftForeArm", [-0.35, 1, 0.25]],
      ["RightForeArm", [0.35, 1, 0.25]],
      ["Head", [0, 0.25, 1]],
    ],
  };
};

/** Biceps curl: k = 0 kol aşağıda, 1 yukarıda. */
const curl = (k: number, shake = 0): Aim[] => {
  const fore = norm(lerp3([0.02, -1, 0.15], [0.05, 0.75, 0.7], k));
  return [
    ["LeftArm", [0.06, -1, 0.06]],
    ["RightArm", [-0.06, -1, 0.06]],
    ["LeftForeArm", [fore[0] + shake * 0.05, fore[1], fore[2]]],
    ["RightForeArm", [-fore[0] - shake * 0.05, fore[1], fore[2]]],
  ];
};

const POINT: Aim[] = [
  ["RightArm", [-0.15, 0.05, 1]],
  ["RightForeArm", [-0.1, 0.12, 1]],
];

const PLANK: Aim[] = [
  ["Spine", [0, 0.05, 1]],
  ["LeftUpLeg", [0.04, -0.17, -1]],
  ["RightUpLeg", [-0.04, -0.17, -1]],
  ["LeftLeg", [0.02, -0.17, -1]],
  ["RightLeg", [-0.02, -0.17, -1]],
  ["LeftFoot", [0, -1, -0.15]],
  ["RightFoot", [0, -1, -0.15]],
  ["LeftArm", [0, -1, 0.02]],
  ["RightArm", [0, -1, 0.02]],
  ["LeftForeArm", [0.05, 0, 1]],
  ["RightForeArm", [-0.05, 0, 1]],
  ["Head", [0, -0.25, 1]],
];

// ------------------------------------------------------------ 3D dünya

const World: React.FC<{ t: number; bot: GLTF }> = ({ t, bot }) => {
  const db = useMemo(
    () => ({
      bL1: makeDumbbell(3.2),
      bL2: makeDumbbell(3.2),
      hL1: makeDumbbell(3.4),
      hL2: makeDumbbell(3.4),
      hH1: makeDumbbell(7.5, 14),
      hH2: makeDumbbell(7.5, 14),
      goblet: makeDumbbell(7, 12),
    }),
    [],
  );
  const cam = cameraAt(t);

  const speakers = (mode: "talk" | "dim") => {
    const tint = (c: string) => (mode === "dim" ? "#4a4a52" : c);
    const items: { key: string; pos: V3; color: string; extra?: Partial<React.ComponentProps<typeof Character>> }[] = [
      { key: "a", pos: POS.a, color: COL.orange, extra: { aims: POINT } },
      {
        key: "b",
        pos: POS.b,
        color: COL.purple,
        extra: {
          aims: curl(rep(t, 0.7)),
          attach: [
            { bone: "LeftHand", object: db.bL1 },
            { bone: "RightHand", object: db.bL2 },
          ],
        },
      },
      { key: "c", pos: POS.c, color: COL.green, extra: { aims: POINT } },
    ];
    return items.map((s) => (
      <Character
        key={s.key}
        gltf={bot}
        tint={tint(s.color)}
        clips={[{ name: "agree", weight: 1, time: t + s.pos[0] }]}
        position={s.pos}
        rotationY={faceTo(s.pos, POS.main)}
        {...s.extra}
      />
    ));
  };

  let scene: React.ReactNode = null;

  if (t < T.run) {
    // tanıtım: ana karakter + üç "uzman"
    scene = (
      <>
        <Character
          gltf={bot}
          clips={[{ name: t < T.spkA || t >= T.wide ? "headShake" : "idle", weight: 1 }]}
          position={POS.main}
          rotationY={t >= T.spkA && t < T.wide ? (t < T.spkB ? -0.5 : t < T.spkC ? 0.5 : 0) : 0}
        />
        {t >= T.spkA ? speakers("talk") : null}
      </>
    );
  } else if (t < T.tired || (t >= T.kosu && t < T.curl)) {
    const tired = t < T.tired;
    const fatigue = tired ? kf(t, [T.run + 0.2, T.tired - 0.1], [0, 0.85]) : 0;
    scene = (
      <>
        <Track t={t} speed={tired ? 4.2 - fatigue * 1.5 : 5} />
        <Character
          gltf={bot}
          clips={[{ name: "run", weight: 1, speed: tired ? 1 - fatigue * 0.25 : 1.1 }]}
          position={[0, 0, 0]}
          glow={tired ? { legs: [COL.red, fatigue] } : undefined}
          aims={tired && fatigue > 0.4 ? [["Head", [0, -0.35 * fatigue, 1]]] : undefined}
        />
      </>
    );
  } else if (t < T.kosu) {
    const tired = t < T.guc;
    const local = t - (tired ? T.tired : T.guc);
    const k = tired ? rep(local, 1.7) * 0.85 : rep(local, 1.2);
    const shake = tired ? Math.sin(t * 55) * k : 0;
    const p = squat(k, shake);
    scene = (
      <Character
        gltf={bot}
        clips={[{ name: "idle", weight: 1, time: 0.5 }]}
        aims={p.aims}
        hipsDrop={p.drop}
        glow={tired ? { legs: [COL.red, 0.85] } : { legs: [COL.green, 0.35 + 0.35 * k] }}
        attach={[{ bone: "RightHand", object: db.goblet }]}
      />
    );
  } else if (t < T.pilates) {
    const local = t - T.curl;
    const kL = rep(local, 0.62);
    const kH = rep(local, 1.9) * 0.97;
    const hard = kf(t, [25.84, 27.6], [0, 1]);
    const armsL: [string, number] | undefined = t > 28.55 ? [COL.green, kf(t, [28.55, 29.0], [0, 0.85])] : undefined;
    const armsH: [string, number] | undefined =
      t > T.heavy ? [COL.yellow, 0.95] : t > 28.55 ? [COL.green, kf(t, [28.55, 29.0], [0, 0.85])] : undefined;
    scene = (
      <>
        <Character
          gltf={bot}
          clips={[{ name: "idle", weight: 1 }]}
          position={[-0.5, 0, 0]}
          aims={curl(kL, Math.sin(t * 50) * hard * 0.6 * kL)}
          glow={armsL ? { arms: armsL } : undefined}
          attach={[
            { bone: "LeftHand", object: db.hL1 },
            { bone: "RightHand", object: db.hL2 },
          ]}
        />
        <Character
          gltf={bot}
          clips={[{ name: "idle", weight: 1, time: 1.1 }]}
          position={[0.5, 0, 0]}
          aims={curl(kH, Math.sin(t * 47) * hard * kH)}
          glow={armsH ? { arms: armsH } : undefined}
          attach={[
            { bone: "LeftHand", object: db.hH1 },
            { bone: "RightHand", object: db.hH2 },
          ]}
        />
      </>
    );
  } else if (t < T.others) {
    const breathe = Math.sin(t * 2.2) * 0.008;
    scene = (
      <>
        <Mat />
        <Character
          gltf={bot}
          clips={[{ name: "idle", weight: 1, time: 0 }]}
          rootRotation={[Math.PI / 2, 0, 0]}
          position={[0, 0.3 + breathe, -0.9]}
          aims={PLANK}
          glow={t > 34.75 ? { core: [COL.green, kf(t, [34.75, 35.2], [0, 0.95])] } : undefined}
        />
      </>
    );
  } else {
    const final = t >= T.final;
    const me = t > 43.85 && !final ? kf(t, [43.85, 44.4], [0, 0.55]) : 0;
    scene = (
      <>
        <Character
          gltf={bot}
          clips={[{ name: final ? "idle" : "headShake", weight: 1 }]}
          glow={me > 0 ? { legs: [COL.lime, me], arms: [COL.lime, me], core: [COL.lime, me] } : undefined}
        />
        {!final ? speakers("dim") : null}
      </>
    );
  }

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
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-3, 2.5, -4]} intensity={1.4} color="#9fd2ff" />
      <Floor />
      {scene}
    </>
  );
};

// ------------------------------------------------------------ ekran üstü (2D)

const Overlays: React.FC<{ t: number }> = ({ t }) => {
  const cam = cameraAt(t);
  const P = (p: V3) => project(cam, p);
  const at = (p: V3) => {
    const s = P(p);
    return { left: s.x, top: s.y };
  };

  // 1) her kafadan ses — balonlar her yönden
  if (t < T.spkA) {
    const items: [string, number, number, number, string][] = [
      ["Önce kardiyo!", 0.05, 250, 330, COL.orange],
      ["Ağır kaldır!", 0.3, 800, 470, COL.purple],
      ["Pilates yap!", 0.55, 270, 1020, COL.green],
      ["Hafif, çok tekrar!", 0.8, 760, 880, COL.red],
      ["Her gün koş!", 1.05, 560, 230, COL.yellow],
      ["Sadece yürü!", 1.3, 820, 1130, "#3aa8ff"],
    ];
    return (
      <>
        {items.map(([text, a, x, y, c], i) => (
          <Pop key={i} at={a} t={t} tilt={i % 2 ? 4 : -4} style={{ left: x, top: y }}>
            <Bubble text={text} color={c} size={44} tail={x < 540 ? "right" : "left"} />
          </Pop>
        ))}
      </>
    );
  }

  // 2-4) uzmanlar tek tek konuşuyor
  if (t < T.wide) {
    const [pos, text, color, at0] =
      t < T.spkB
        ? [POS.a, "Önce kardiyo yap!", COL.orange, T.spkA + 0.9]
        : t < T.spkC
          ? [POS.b, "Hafif ağırlık, çok tekrar!", COL.purple, T.spkB + 0.15]
          : [POS.c, "Pilates her şeyi çözer!", COL.green, T.spkC + 0.9];
    const s = P([pos[0], 2.05, pos[2]]);
    return (
      <Pop at={at0} t={t} style={{ left: Math.min(Math.max(s.x, 330), 750), top: Math.max(s.y - 60, 260) }}>
        <Bubble text={text} color={color} size={56} />
      </Pop>
    );
  }

  // 5) hepsi... ve hiçbiri
  if (t < T.run) {
    const all = t >= 12.85;
    const none = t >= 13.95;
    const items: [V3, string, string][] = [
      [POS.a, "Önce kardiyo", COL.orange],
      [POS.b, "Hafif + çok tekrar", COL.purple],
      [POS.c, "Pilates", COL.green],
    ];
    return (
      <>
        {items.map(([p, text, c], i) => {
          const s = P([p[0], 2.1, p[2]]);
          return (
            <Pop key={i} at={T.wide + 0.1 + i * 0.12} t={t} style={{ left: Math.min(Math.max(s.x, 230), 850), top: s.y - 40 }}>
              <div style={{ position: "relative" }}>
                <Bubble text={text} color={c} size={46} />
                {all ? (
                  <div
                    style={{
                      position: "absolute",
                      right: -34,
                      top: -40,
                      width: 84,
                      height: 84,
                      borderRadius: 99,
                      background: none ? COL.red : COL.green,
                      color: "white",
                      fontSize: 54,
                      fontWeight: 900,
                      fontFamily: SANS,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "5px solid white",
                      transform: `scale(${none ? kf(t, [13.95, 14.1, 14.25], [0.7, 1.25, 1]) : kf(t, [12.85 + i * 0.1, 13.05 + i * 0.1], [0, 1])})`,
                    }}
                  >
                    {none ? "✕" : "✓"}
                  </div>
                ) : null}
              </div>
            </Pop>
          );
        })}
      </>
    );
  }

  // 6) koşu → yorgun bacak
  if (t < T.tired) {
    return (
      <Pop at={T.run + 0.25} t={t} style={{ left: 540, top: 300 }}>
        <Meter label="BACAK YORGUNLUĞU" value={kf(t, [T.run + 0.2, T.tired - 0.1], [0.05, 0.85])} color={COL.red} />
      </Pop>
    );
  }
  if (t < T.guc) {
    return (
      <Pop at={T.tired + 0.35} t={t} tilt={-3} style={{ left: 540, top: 330 }}>
        <Sticker bg={COL.red} color="white">
          ⚠ Yorgun bacak = zayıf set
        </Sticker>
      </Pop>
    );
  }
  if (t < T.curl) {
    const guc = t < T.kosu;
    return (
      <Pop at={(guc ? T.guc : T.kosu) + 0.1} t={t} tilt={guc ? -2 : 2} style={{ left: 540, top: 360 }}>
        <Sticker size={50}>
          <Small>{guc ? "HEDEF: GÜÇLENMEK" : "HEDEF: KOŞU / DAYANIKLILIK"}</Small>
          <div>1. {guc ? "Ağırlık" : "Kardiyo"}</div>
          <div style={{ color: "#999" }}>2. {guc ? "Kardiyo" : "Ağırlık"}</div>
        </Sticker>
      </Pop>
    );
  }

  // 7) hafif vs ağır
  if (t < T.pilates) {
    const local = t - T.curl;
    const repsL = Math.floor(local / 0.62);
    const repsH = Math.floor(local / 1.9);
    const hard = kf(t, [25.84, 27.6], [0.25, 0.95]);
    const heavyFocus = t >= T.heavy;
    return (
      <>
        {!heavyFocus ? (
          <>
            <Pop at={T.curl + 0.1} t={t} style={{ left: 300, top: 330 }}>
              <Sticker size={44}>
                <Small>HAFİF</Small>
                {repsL} tekrar
              </Sticker>
            </Pop>
            <Pop at={T.curl + 0.25} t={t} style={{ left: 780, top: 330 }}>
              <Sticker size={44}>
                <Small>AĞIR</Small>
                {repsH} tekrar
              </Sticker>
            </Pop>
            {t >= 25.84 && t < 28.55 ? (
              <Pop at={25.84} t={t} style={{ left: 540, top: 560 }}>
                <Meter label="ZORLANMA" value={hard} color={hard > 0.8 ? COL.red : COL.yellow} />
              </Pop>
            ) : null}
            {t >= 28.55 ? (
              <Pop at={28.55} t={t} tilt={-2} style={{ left: 540, top: 570 }}>
                <Sticker bg={COL.green} color="white" size={50}>
                  İkisinde de kas büyür ✓
                </Sticker>
              </Pop>
            ) : null}
          </>
        ) : (
          <Pop at={T.heavy + 0.3} t={t} tilt={2} style={{ left: 540, top: 330 }}>
            <Sticker bg={COL.yellow} size={54}>
              Güç için: ağır yük 🏋️
            </Sticker>
          </Pop>
        )}
      </>
    );
  }

  // 8) pilates
  if (t < T.others) {
    const head = P([0, 0.62, 0.78]);
    const heel = P([0, 0.5, -0.85]);
    const lineK = kf(t, [34.85, 35.6], [0, 1]);
    const ang = (Math.atan2(head.y - heel.y, head.x - heel.x) * 180) / Math.PI;
    const len = Math.hypot(head.x - heel.x, head.y - heel.y);
    return (
      <>
        {t > 34.85 ? (
          <div
            style={{
              position: "absolute",
              left: heel.x,
              top: heel.y,
              width: len * lineK,
              height: 0,
              borderTop: `8px dashed ${COL.green}`,
              transformOrigin: "0 0",
              transform: `rotate(${ang}deg)`,
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
            }}
          />
        ) : null}
        <Pop at={34.8} t={t} tilt={-2} style={{ left: 540, top: 330 }}>
          <Sticker bg={COL.green} color="white" size={48}>
            Karın + duruş ✓
          </Sticker>
        </Pop>
        <Pop at={36.95} t={t} tilt={2} style={{ left: 300, top: 540 }}>
          <Sticker size={44}>
            <Small>KALP İÇİN</Small>❤️ Kardiyo
          </Sticker>
        </Pop>
        <Pop at={38.55} t={t} tilt={-2} style={{ left: 770, top: 560 }}>
          <Sticker size={44}>
            <Small>KAS İÇİN</Small>🏋️ Daha fazla yük
          </Sticker>
        </Pop>
      </>
    );
  }

  // 9) başkalarının sesi sönüyor
  if (t < T.final) {
    const items: [V3, string][] = [
      [POS.a, "Kardiyo!"],
      [POS.b, "Çok tekrar!"],
      [POS.c, "Pilates!"],
    ];
    return (
      <>
        {items.map(([p, text], i) => {
          const s = P([p[0], 2.05, p[2]]);
          const fade = kf(t, [42.5, 43.9], [1, 0.0]);
          return (
            <div key={i} style={{ position: "absolute", left: s.x, top: s.y, transform: "translate(-50%,-50%)", opacity: fade * 0.9 }}>
              <Bubble text={text} color="#666" size={36} dim />
            </div>
          );
        })}
        {t > 43.85 ? (
          <Pop at={43.85} t={t} style={{ left: 540, top: 330 }}>
            <Sticker bg={COL.lime} size={52}>
              Senin vücudun, senin ihtiyacın
            </Sticker>
          </Pop>
        ) : null}
      </>
    );
  }

  // 10) final
  return (
    <>
      <Pop at={48.45} t={t} style={{ left: 540, top: 360 }}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 132,
            letterSpacing: -4,
            color: "white",
            textAlign: "center",
            lineHeight: 0.95,
            WebkitTextStroke: "6px #111",
            paintOrder: "stroke",
            textShadow: "0 12px 40px rgba(0,0,0,0.45)",
          }}
        >
          HEDEFİN
          <br />
          <span style={{ color: COL.yellow }}>NE?</span>
        </div>
      </Pop>
      <Pop at={49.6} t={t} style={{ left: 540, top: 1720 }}>
        <Sticker size={36}>📌 Kaydet, lazım olacak</Sticker>
      </Pop>
    </>
  );
};

// ------------------------------------------------------------ altyazı

// ------------------------------------------------------------ ana video

/** Referanstaki gibi mavi halkalı "tünel" arka plan */
const Backdrop: React.FC<{ t: number }> = ({ t }) => {
  const shift = (t * 18) % 90;
  return (
    <AbsoluteFill
      style={{
        background: `repeating-radial-gradient(ellipse 120% 70% at 50% 30%, #2f8fe4 ${shift}px, #2a84d8 ${shift + 45}px, #2f8fe4 ${shift + 90}px)`,
      }}
    >
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 28%, rgba(255,255,255,0.28), transparent 60%)" }} />
    </AbsoluteFill>
  );
};

export const HerkesBaskaDiyor: React.FC<HerkesBaskaDiyorProps> = ({ audioName, data }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const bot = useGltf("models/Xbot.glb");

  // kesmelerde hızlı "whip" bulanıklığı
  const near = CUTS.map((c) => t - c).find((d) => d > -0.1 && d < 0.13);
  const whip = near === undefined ? 0 : 1 - Math.abs(near) / 0.13;

  return (
    <AbsoluteFill lang="tr" style={{ background: "#2a84d8", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          filter: whip > 0 ? `blur(${whip * 14}px)` : undefined,
          transform: whip > 0 ? `translateX(${(near ?? 0) * -500}px) scale(${1 + whip * 0.06})` : undefined,
        }}
      >
        <Backdrop t={t} />
        {bot ? (
          <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
            <World t={t} bot={bot} />
          </ThreeCanvas>
        ) : null}
      </AbsoluteFill>
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
