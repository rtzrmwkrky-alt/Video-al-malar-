/**
 * Kız karakter denemesi (Michelle tabanlı): yakın plan yüz, boy planı, yürüyüş, koşu.
 */
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFonts } from "../fonts";
import { sm } from "../ornek/common";
import { CameraRig, useGltf, type Clip } from "../three/Character";
import { Girl, useLabels } from "../three/Girl";
import { Backdrop, Floor, lerp3, type Cam } from "../three/scene";

loadFonts();

const camAt = (t: number): Cam => {
  const face: Cam = { pos: [0.12, 1.5, 0.75], target: [0, 1.46, 0], fov: 36 };
  const full: Cam = { pos: [0.5, 1.2, 3.2], target: [0, 0.9, 0], fov: 40 };
  const side: Cam = { pos: [-2.0, 1.2, 1.8], target: [0, 0.95, 0], fov: 40 };
  const k1 = sm(t, 2.0, 2.8);
  const k2 = sm(t, 5.0, 5.8);
  const a = { pos: lerp3(face.pos, full.pos, k1), target: lerp3(face.target, full.target, k1), fov: 36 + 4 * k1 };
  return { pos: lerp3(a.pos, side.pos, k2), target: lerp3(a.target, side.target, k2), fov: a.fov };
};

export const KizDeneme: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const gltf = useGltf("models/Michelle.glb");
  const anim = useGltf("models/Xbot.glb");
  const labels = useLabels();
  const walk = sm(t, 2.6, 3.0) * (1 - sm(t, 5.0, 5.4));
  const run = sm(t, 5.2, 5.6);
  const clips: Clip[] = [
    { name: "idle", weight: Math.max(0, 1 - walk - run) },
    { name: "walk", weight: walk },
    { name: "run", weight: run },
  ];
  const cam = camAt(t);
  return (
    <AbsoluteFill style={{ background: "#2a84d8" }}>
      <Backdrop t={t} />
      {gltf && anim && labels ? (
        <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
          <CameraRig position={cam.pos} target={cam.target} fov={cam.fov} />
          <hemisphereLight args={["#eef6ff", "#8a6a50", 1.5]} />
          <directionalLight position={[1.5, 3.5, 4]} intensity={2.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} />
          <directionalLight position={[-3, 2.5, -2]} intensity={1.4} color="#a8d8ff" />
          <Floor />
          <Girl gltf={gltf} anim={anim} labels={labels} clips={clips} />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
