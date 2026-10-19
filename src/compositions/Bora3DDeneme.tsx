/** Bora 3B deneme karesi: mercan pembe fon, yumuşak ışık, 3/4 yan görünüm. */
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Bora3D } from "../three/Bora3D";

const BG = "#e86d6f";

export const Bora3DDeneme: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <ThreeCanvas width={width} height={height} shadows="soft" gl={{ antialias: true }} camera={{ position: [1.3, 1.3, 6.6], fov: 26 }}>
        <color attach="background" args={[BG]} />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={["#ffe9e4", "#b5474b", 0.6]} />
        <directionalLight
          shadow-radius={8}
          position={[2, 6, 5]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-2}
          shadow-camera-right={2}
          shadow-camera-top={3}
          shadow-camera-bottom={-1}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#ffd0c8" />
        <group rotation={[0, -0.45 + Math.sin(t) * 0.02, 0]} position={[0, -0.05, 0]}>
          <Bora3D />
        </group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.22} />
        </mesh>
        <CamLook />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

import { useThree } from "@react-three/fiber";
const CamLook: React.FC = () => {
  const cam = useThree((s) => s.camera);
  cam.lookAt(0.05, 1.08, 0);
  return null;
};
