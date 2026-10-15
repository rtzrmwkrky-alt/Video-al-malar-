/**
 * Yeni animasyon karakteri seçimi: üç aday (Ada, Mina, Zeynep) yan yana, sonra tek tek yakın plan.
 */
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS, loadFonts } from "../fonts";
import { sm } from "../ornek/common";
import { CameraRig } from "../three/Character";
import { Backdrop, Floor, lerp3, type Cam } from "../three/scene";
import { LOOKS, ToonPerson, autoBlink, idlePose, mix, walkPose, wavePose } from "../three/ToonPerson";

loadFonts();

const NAMES = ["ada", "mina", "zeynep"] as const;
const LABEL: Record<string, string> = { ada: "1 · Ada", mina: "2 · Mina", zeynep: "3 · Zeynep" };
const X = [-0.95, 0, 0.95];

// zaman çizelgesi: 0-3 hepsi, 3-5.5 Deniz, 5.5-8 Can, 8-10.5 Elif, 10.5-13 hepsi yürür
const SHOTS: { at: number; cam: Cam }[] = [
  { at: 0, cam: { pos: [0, 1.3, 5.6], target: [0, 0.95, 0], fov: 40 } },
  { at: 3, cam: { pos: [X[0] + 0.12, 1.66, 1.25], target: [X[0], 1.6, 0], fov: 36 } },
  { at: 5.5, cam: { pos: [X[1] + 0.12, 1.66, 1.25], target: [X[1], 1.6, 0], fov: 36 } },
  { at: 8, cam: { pos: [X[2] + 0.12, 1.66, 1.25], target: [X[2], 1.6, 0], fov: 36 } },
  { at: 10.5, cam: { pos: [2.6, 1.3, 3.6], target: [0, 0.95, 0.3], fov: 40 } },
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
  const cam = camAt(t);
  const walk = sm(t, 10.6, 11.2);
  const focus = t < 3 ? -1 : t < 5.5 ? 0 : t < 8 ? 1 : t < 10.5 ? 2 : -1;
  return (
    <AbsoluteFill lang="tr" style={{ background: "#2a84d8" }}>
      <Backdrop t={t} />
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
        <CameraRig position={cam.pos} target={cam.target} fov={cam.fov} />
        <hemisphereLight args={["#eaf4ff", "#8a6a50", 1.3]} />
        <directionalLight position={[2, 4, 4]} intensity={2.3} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} />
        <directionalLight position={[-3, 2.5, -3]} intensity={1.6} color="#a8d8ff" />
        <pointLight position={[0, 1.6, 2.5]} intensity={1.2} color="#fff1e0" />
        <Floor />
        {NAMES.map((n, i) => {
          const tt = t + i * 0.7;
          const waving = focus === i ? sm(t, SHOTS[i + 1].at + 0.6, SHOTS[i + 1].at + 1.0) * (1 - sm(t, SHOTS[i + 1].at + 2.0, SHOTS[i + 1].at + 2.4)) : 0;
          const base = mix(idlePose(tt), wavePose(tt), waving);
          const pose = mix(base, walkPose(tt), walk);
          const z = walk > 0 ? ((t - 10.6) * 0.75) % 3 : 0;
          return (
            <ToonPerson
              key={n}
              look={LOOKS[n]}
              t={tt}
              position={[X[i], 0, Math.max(0, z)]}
              pose={pose}
              face={{
                smile: 0.45 + 0.4 * waving,
                open: 0.35 * waving,
                brow: 0.25 * waving,
                blink: autoBlink(t, i),
                gaze: [Math.sin(t * 0.6 + i) * 0.3, 0.05],
              }}
            />
          );
        })}
      </ThreeCanvas>
      {focus >= 0 ? (
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 96,
            color: "white",
            WebkitTextStroke: "7px #111",
            paintOrder: "stroke",
            opacity: interpolate(t % 2.5, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
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
