/**
 * Kullanıcının beğendiği kız (Michelle) — beyaz tenli, düz saçlı. İki hâli yan yana:
 * Gözlük/kulaklık yok; takılar (küpe, kolye, bileklik), belirgin göz ve kirpik.
 */
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFonts } from "../fonts";
import { sm } from "../ornek/common";
import { CameraRig, useGltf, type Clip } from "../three/Character";
import { Girl, useImage, useLabels, type GirlLook } from "../three/Girl";
import { Backdrop, Floor, lerp3, type Cam } from "../three/scene";

loadFonts();

const BASE: GirlLook = { skin: "#f3cdb2", hair: "#2a1c16", style: "straight", eyes: "#6b4423", jewelry: true };
const VARIANTS: GirlLook[] = [BASE];
const X = [0];

const SHOTS: { at: number; cam: Cam }[] = [
  { at: 0, cam: { pos: [0.08, 1.46, 0.62], target: [0, 1.44, 0], fov: 36 } },
  { at: 1.6, cam: { pos: [0.35, 1.42, 1.3], target: [0, 1.36, 0], fov: 38 } },
  { at: 3, cam: { pos: [0, 1.15, 3.6], target: [0, 0.9, 0], fov: 40 } },
  { at: 6, cam: { pos: [2.4, 1.2, 2.6], target: [0, 0.95, 0.4], fov: 40 } },
];

const camAt = (t: number): Cam => {
  let i = 0;
  while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].at) i++;
  const cur = SHOTS[i].cam;
  if (i === 0) return cur;
  const prev = SHOTS[i - 1].cam;
  const k = sm(t, SHOTS[i].at - 0.1, SHOTS[i].at + 0.8);
  return { pos: lerp3(prev.pos, cur.pos, k), target: lerp3(prev.target, cur.target, k), fov: prev.fov + (cur.fov - prev.fov) * k };
};

export const KizBeyaz: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const gltf = useGltf("models/Michelle.glb");
  const anim = useGltf("models/Xbot.glb");
  const labels = useLabels();
  const uvl = useImage("models/michelle-uvlabels.png");
  const cam = camAt(t);
  const walk = sm(t, 6.1, 6.6);
  return (
    <AbsoluteFill lang="tr" style={{ background: "#2a84d8" }}>
      <Backdrop t={t} />
      {gltf && anim && labels && uvl ? (
        <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
          <CameraRig position={cam.pos} target={cam.target} fov={cam.fov} />
          <hemisphereLight args={["#eef6ff", "#8a6a50", 1.5]} />
          <directionalLight position={[1.5, 3.5, 4]} intensity={2.3} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} />
          <directionalLight position={[-3, 2.5, -2]} intensity={1.4} color="#a8d8ff" />
          <pointLight position={[0, 1.6, 2.2]} intensity={1.5} color="#fff1e0" />
          <Floor />
          {VARIANTS.map((look, i) => {
            const clips: Clip[] = [
              { name: "idle", weight: 1 - walk, time: t + i * 0.9 },
              { name: "walk", weight: walk, time: t + i * 0.3 },
            ];
            return <Girl key={i} gltf={gltf} anim={anim} labels={labels} uvLabels={uvl} look={look} clips={clips} position={[X[i], 0, walk > 0 ? Math.min(0.9, Math.max(0, (t - 6.1) * 0.5)) : 0]} />;
          })}
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
