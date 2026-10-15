/**
 * Kız karakter seçimi (Michelle tabanlı, yeniden boyanmış + farklı saç): üç aday yan yana,
 * sonra tek tek yakın plan, en sonda birlikte yürürler.
 */
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS, loadFonts } from "../fonts";
import { sm } from "../ornek/common";
import { CameraRig, useGltf, type Clip } from "../three/Character";
import { Girl, useImage, useLabels, type GirlLook } from "../three/Girl";
import { Backdrop, Floor, lerp3, type Cam } from "../three/scene";

loadFonts();

export const GIRLS: Record<string, GirlLook> = {
  ada: { skin: "#c58a64", hair: "#5b3420", style: "long", top: "#ff8577", bottom: "#2f3b5c", shoe: "#f4f4f4", accent: "#ffffff" },
  mina: { skin: "#9c6a48", hair: "#1c1513", style: "ponytail", top: "#a98bff", bottom: "#23263a", shoe: "#ffffff", accent: "#ffd84d" },
  zeynep: { skin: "#e3b391", hair: "#a8482a", style: "bun", top: "#36c7a0", bottom: "#eceef3", shoe: "#2b3a55", accent: "#ff7aa2" },
};

const NAMES = ["ada", "mina", "zeynep"] as const;
const LABEL: Record<string, string> = { ada: "1 · Ada", mina: "2 · Mina", zeynep: "3 · Zeynep" };
const X = [-0.85, 0, 0.85];

const SHOTS: { at: number; cam: Cam }[] = [
  { at: 0, cam: { pos: [0, 1.25, 4.6], target: [0, 0.9, 0], fov: 40 } },
  { at: 3, cam: { pos: [X[0] + 0.1, 1.5, 0.95], target: [X[0], 1.45, 0], fov: 36 } },
  { at: 5.5, cam: { pos: [X[1] + 0.1, 1.5, 0.95], target: [X[1], 1.45, 0], fov: 36 } },
  { at: 8, cam: { pos: [X[2] + 0.1, 1.5, 0.95], target: [X[2], 1.45, 0], fov: 36 } },
  { at: 10.5, cam: { pos: [2.6, 1.25, 3.4], target: [0, 0.9, 0.4], fov: 40 } },
];

const camAt = (t: number): Cam => {
  let i = 0;
  while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].at) i++;
  const cur = SHOTS[i].cam;
  if (i === 0) return cur;
  const prev = SHOTS[i - 1].cam;
  const k = sm(t, SHOTS[i].at - 0.1, SHOTS[i].at + 0.7);
  return { pos: lerp3(prev.pos, cur.pos, k), target: lerp3(prev.target, cur.target, k), fov: prev.fov + (cur.fov - prev.fov) * k };
};

export const KarakterSecim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const gltf = useGltf("models/Michelle.glb");
  const anim = useGltf("models/Xbot.glb");
  const labels = useLabels();
  const uvl = useImage("models/michelle-uvlabels.png");
  const cam = camAt(t);
  const walk = sm(t, 10.6, 11.2);
  const focus = t < 3 ? -1 : t < 5.5 ? 0 : t < 8 ? 1 : t < 10.5 ? 2 : -1;
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
          {NAMES.map((n, i) => {
            const nod = focus === i ? sm(t, SHOTS[i + 1].at + 0.7, SHOTS[i + 1].at + 1.0) * (1 - sm(t, SHOTS[i + 1].at + 2.0, SHOTS[i + 1].at + 2.3)) : 0;
            const clips: Clip[] = [
              { name: "idle", weight: Math.max(0, 1 - walk - nod), time: t + i * 0.9 },
              { name: "agree", weight: nod * (1 - walk) },
              { name: "walk", weight: walk, time: t + i * 0.3 },
            ];
            return <Girl key={n} gltf={gltf} anim={anim} labels={labels} uvLabels={uvl} look={GIRLS[n]} clips={clips} position={[X[i], 0, walk > 0 ? Math.max(0, (t - 10.6) * 0.7) : 0]} />;
          })}
        </ThreeCanvas>
      ) : null}
      {focus >= 0 ? (
        <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 96, color: "white", WebkitTextStroke: "7px #111", paintOrder: "stroke", opacity: interpolate(t % 2.5, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }) }}>
          {LABEL[NAMES[focus as 0 | 1 | 2]]}
        </div>
      ) : (
        <div style={{ position: "absolute", top: 1450, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "0 60px", fontFamily: SANS, fontWeight: 800, fontSize: 56, color: "white", WebkitTextStroke: "5px #111", paintOrder: "stroke" }}>
          {NAMES.map((n) => (
            <span key={n}>{LABEL[n]}</span>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
