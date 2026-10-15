/**
 * 3D videolarda ortak: yardımcı hesaplar, zemin, pist, mat, dambıl, egzersiz pozları,
 * mavi halkalı arka plan. (HerkesBaskaDiyor ve HerKafadanAnimasyon kullanır.)
 */
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import * as THREE from "three";
import type { Aim } from "./Character";

const W = 1080;
const H = 1920;

export type V3 = [number, number, number];
export const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const kf = (t: number, ts: number[], vs: number[]) =>
  interpolate(t, ts, vs, { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
export const lerp3 = (a: V3, b: V3, k: number): V3 => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];
export const norm = (v: V3): V3 => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
export const faceTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);
/** 0→1→0 tekrar hareketi */
export const rep = (t: number, period: number) => (1 - Math.cos((2 * Math.PI * Math.max(0, t)) / period)) / 2;
export type Cam = { pos: V3; target: V3; fov: number };
export const project = (cam: Cam, p: V3) => {
  const c = new THREE.PerspectiveCamera(cam.fov, W / H, 0.05, 200);
  c.position.set(...cam.pos);
  c.lookAt(...cam.target);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(c);
  // z > 1: nokta kameranın arkasında (ekranda gösterilmemeli)
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H, visible: v.z < 1 && v.z > -1 };
};
export const makeDumbbell = (plate: number, bar = 16) => {
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

export const Floor: React.FC = () => {
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
export const Track: React.FC<{ t: number; speed: number }> = ({ t, speed }) => {
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

export const Mat: React.FC = () => (
  <mesh position={[0, 0.008, 0]} receiveShadow>
    <boxGeometry args={[0.75, 0.016, 2.1]} />
    <meshStandardMaterial color="#5B3FA8" roughness={0.9} />
  </mesh>
);

export const STAND_LEGS: Aim[] = [
  ["LeftUpLeg", [0.08, -1, 0]],
  ["RightUpLeg", [-0.08, -1, 0]],
  ["LeftLeg", [0.02, -1, -0.02]],
  ["RightLeg", [-0.02, -1, -0.02]],
];

/** Goblet squat: k = 0 ayakta, 1 aşağıda. */
export const squat = (k: number, shake = 0): { aims: Aim[]; drop: number } => {
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
export const curl = (k: number, shake = 0): Aim[] => {
  const fore = norm(lerp3([0.02, -1, 0.15], [0.05, 0.75, 0.7], k));
  return [
    ["LeftArm", [0.06, -1, 0.06]],
    ["RightArm", [-0.06, -1, 0.06]],
    ["LeftForeArm", [fore[0] + shake * 0.05, fore[1], fore[2]]],
    ["RightForeArm", [-fore[0] - shake * 0.05, fore[1], fore[2]]],
  ];
};

export const POINT: Aim[] = [
  ["RightArm", [-0.15, 0.05, 1]],
  ["RightForeArm", [-0.1, 0.12, 1]],
];

export const PLANK: Aim[] = [
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

export const Backdrop: React.FC<{ t: number }> = ({ t }) => {
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

