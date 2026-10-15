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


// ------------------------------------------------------------ spor salonu eşyaları
// Ölçüler metre. Basit şekillerden yapıldı; hepsi gölge düşürür.

const M = {
  metal: { color: "#2b2b2e", metalness: 0.6, roughness: 0.35 },
  chrome: { color: "#b9bcc2", metalness: 0.9, roughness: 0.25 },
  pad: { color: "#18181b", roughness: 0.8 },
  red: { color: "#d83a34", roughness: 0.6 },
  rubber: { color: "#1f2023", roughness: 0.95 },
};

const Box: React.FC<{ p: V3; s: V3; m: object; r?: V3 }> = ({ p, s, m, r }) => (
  <mesh position={p} rotation={r} castShadow receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial {...m} />
  </mesh>
);
const Cyl: React.FC<{ p: V3; r: number; h: number; m: object; rot?: V3; seg?: number }> = ({ p, r, h, m, rot, seg = 24 }) => (
  <mesh position={p} rotation={rot} castShadow receiveShadow>
    <cylinderGeometry args={[r, r, h, seg]} />
    <meshStandardMaterial {...m} />
  </mesh>
);

/** Yerde duran dambıl (yatay) */
const FloorDumbbell: React.FC<{ p: V3; size?: number; rotY?: number }> = ({ p, size = 1, rotY = 0 }) => (
  <group position={p} rotation={[0, rotY, 0]} scale={size}>
    <Cyl p={[0, 0, 0]} r={0.016} h={0.3} m={M.chrome} rot={[0, 0, Math.PI / 2]} />
    <Cyl p={[-0.13, 0, 0]} r={0.06} h={0.07} m={M.metal} rot={[0, 0, Math.PI / 2]} seg={6} />
    <Cyl p={[0.13, 0, 0]} r={0.06} h={0.07} m={M.metal} rot={[0, 0, Math.PI / 2]} seg={6} />
  </group>
);

/** İki katlı dambıl rafı */
export const DumbbellRack: React.FC<{ p: V3; rotY?: number }> = ({ p, rotY = 0 }) => (
  <group position={p} rotation={[0, rotY, 0]}>
    {[-0.85, 0.85].map((x) => (
      <Box key={x} p={[x, 0.4, 0]} s={[0.06, 0.8, 0.5]} m={M.metal} />
    ))}
    <Box p={[0, 0.45, 0.08]} s={[1.8, 0.04, 0.22]} m={M.metal} r={[-0.25, 0, 0]} />
    <Box p={[0, 0.8, -0.1]} s={[1.8, 0.04, 0.22]} m={M.metal} r={[-0.25, 0, 0]} />
    {Array.from({ length: 6 }, (_, i) => (
      <FloorDumbbell key={`a${i}`} p={[-0.7 + i * 0.28, 0.53, 0.08]} size={0.75 + i * 0.07} rotY={Math.PI / 2} />
    ))}
    {Array.from({ length: 6 }, (_, i) => (
      <FloorDumbbell key={`b${i}`} p={[-0.7 + i * 0.28, 0.88, -0.1]} size={0.6 + i * 0.05} rotY={Math.PI / 2} />
    ))}
  </group>
);

/** Squat kafesi + barbell */
export const SquatRack: React.FC<{ p: V3; rotY?: number }> = ({ p, rotY = 0 }) => (
  <group position={p} rotation={[0, rotY, 0]}>
    {[-0.6, 0.6].flatMap((x) =>
      [-0.6, 0.6].map((z) => <Box key={`${x}${z}`} p={[x, 1.1, z]} s={[0.07, 2.2, 0.07]} m={M.metal} />),
    )}
    {[-0.6, 0.6].map((z) => (
      <Box key={`t${z}`} p={[0, 2.2, z]} s={[1.27, 0.07, 0.07]} m={M.metal} />
    ))}
    {[-0.6, 0.6].map((x) => (
      <Box key={`s${x}`} p={[x, 2.2, 0]} s={[0.07, 0.07, 1.27]} m={M.metal} />
    ))}
    <Box p={[0, 0.02, 0]} s={[1.6, 0.04, 1.6]} m={M.rubber} />
    {/* barbell */}
    <Cyl p={[0, 1.35, 0.62]} r={0.016} h={2.1} m={M.chrome} rot={[0, 0, Math.PI / 2]} />
    {[-1, 1].map((s) => (
      <group key={s}>
        <Cyl p={[s * 0.82, 1.35, 0.62]} r={0.225} h={0.06} m={M.red} rot={[0, 0, Math.PI / 2]} seg={32} />
        <Cyl p={[s * 0.89, 1.35, 0.62]} r={0.17} h={0.05} m={M.metal} rot={[0, 0, Math.PI / 2]} seg={32} />
      </group>
    ))}
  </group>
);

/** Düz bench */
export const Bench: React.FC<{ p: V3; rotY?: number }> = ({ p, rotY = 0 }) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <Box p={[0, 0.45, 0]} s={[0.3, 0.09, 1.15]} m={M.pad} />
    <Box p={[0, 0.22, -0.42]} s={[0.36, 0.44, 0.06]} m={M.metal} />
    <Box p={[0, 0.22, 0.42]} s={[0.36, 0.44, 0.06]} m={M.metal} />
    <Box p={[0, 0.03, 0]} s={[0.12, 0.05, 1.0]} m={M.metal} />
  </group>
);

/** Koşu bandı */
export const Treadmill: React.FC<{ p: V3; rotY?: number }> = ({ p, rotY = 0 }) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <Box p={[0, 0.12, 0]} s={[0.8, 0.22, 1.9]} m={M.metal} />
    <Box p={[0, 0.235, 0.05]} s={[0.56, 0.02, 1.6]} m={M.rubber} />
    {[-0.36, 0.36].map((x) => (
      <Box key={x} p={[x, 0.75, -0.8]} s={[0.06, 1.1, 0.06]} m={M.metal} r={[-0.2, 0, 0]} />
    ))}
    <Box p={[0, 1.3, -0.92]} s={[0.78, 0.3, 0.12]} m={M.pad} r={[0.5, 0, 0]} />
    <Box p={[0, 1.31, -0.85]} s={[0.5, 0.18, 0.02]} m={{ color: "#2f8fe4", emissive: "#2f8fe4", emissiveIntensity: 0.6 }} r={[0.5, 0, 0]} />
  </group>
);

/** Kettlebell */
export const Kettlebell: React.FC<{ p: V3; size?: number; color?: string }> = ({ p, size = 1, color = "#2b2b2e" }) => (
  <group position={p} scale={size}>
    <mesh position={[0, 0.11, 0]} castShadow>
      <sphereGeometry args={[0.11, 24, 16]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.25, 0]} castShadow>
      <torusGeometry args={[0.065, 0.016, 10, 24, Math.PI]} />
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
    </mesh>
  </group>
);

/** Plaka ağacı */
export const PlateTree: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <Box p={[0, 0.03, 0]} s={[0.5, 0.06, 0.5]} m={M.metal} />
    <Cyl p={[0, 0.55, 0]} r={0.03} h={1.1} m={M.metal} />
    {[0.25, 0.55, 0.85].map((y, i) =>
      [-1, 1].map((s) => (
        <group key={`${y}${s}`}>
          <Cyl p={[s * 0.12, y, 0]} r={0.015} h={0.2} m={M.chrome} rot={[0, 0, Math.PI / 2]} />
          <Cyl p={[s * 0.2, y, 0]} r={0.2 - i * 0.04} h={0.05} m={i === 0 ? M.red : M.metal} rot={[0, 0, Math.PI / 2]} seg={32} />
        </group>
      )),
    )}
  </group>
);

/** Pilates/denge topu */
export const GymBall: React.FC<{ p: V3; color?: string; r?: number }> = ({ p, color = "#e8573d", r = 0.32 }) => (
  <mesh position={[p[0], r, p[2]]} castShadow receiveShadow>
    <sphereGeometry args={[r, 32, 24]} />
    <meshStandardMaterial color={color} roughness={0.45} />
  </mesh>
);

/** Yerde plaka yığını */
export const PlateStack: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    {[0, 1, 2, 3].map((i) => (
      <Cyl key={i} p={[0, 0.03 + i * 0.06, 0]} r={0.22 - i * 0.025} h={0.05} m={i % 2 ? M.metal : M.red} seg={32} />
    ))}
  </group>
);

/**
 * Salon düzeni: ana karakter (0,0,0) etrafındaki boşluğu ve kamera yollarını kapatmadan
 * her çekimin arka planını doldurur.
 */
export const GymProps: React.FC = () => (
  <group>
    {/* ana karakterin arkası (ön çekimlerin arka planı) */}
    <SquatRack p={[0.8, 0, -3.6]} rotY={-0.15} />
    <DumbbellRack p={[-2.7, 0, -2.6]} rotY={0.55} />
    <Treadmill p={[2.8, 0, -2.6]} rotY={-0.5} />
    <Treadmill p={[3.9, 0, -1.4]} rotY={-0.9} />
    <Bench p={[-1.5, 0, -4.4]} rotY={0.3} />
    <Kettlebell p={[1.3, 0, -2.1]} size={1.1} />
    <Kettlebell p={[1.6, 0, -2.0]} size={0.9} color="#d83a34" />
    <Kettlebell p={[1.45, 0, -2.35]} size={0.8} />
    {/* turuncunun arkası */}
    <Bench p={[-4.1, 0, 2.3]} rotY={1.1} />
    <PlateTree p={[-4.4, 0, 1.0]} />
    <GymBall p={[-3.5, 0, 3.7]} color="#2f8fe4" />
    <FloorDumbbell p={[-3.3, 0.06, 2.0]} rotY={0.4} />
    {/* morun arkası */}
    <DumbbellRack p={[4.2, 0, 2.2]} rotY={-1.35} />
    <Kettlebell p={[3.4, 0, 3.7]} size={1.2} color="#d83a34" />
    <Kettlebell p={[3.7, 0, 3.9]} size={0.9} />
    <GymBall p={[4.3, 0, 0.6]} color="#e8573d" />
    {/* geniş planın uzak tarafı */}
    <PlateStack p={[2.7, 0, 6.2]} />
    <GymBall p={[-2.4, 0, 5.8]} color="#36d27e" r={0.28} />
    <Bench p={[-3.2, 0, 6.6]} rotY={-0.4} />
  </group>
);
