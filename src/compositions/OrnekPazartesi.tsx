/**
 * Örnek 2 — "Pazartesi başlarım" (3D manken ile kısa hikâye, Zack D. Films havası).
 * Sessiz örnek: zaman satırlardan hesaplanır, ses yok.
 */
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SANS, SERIF, loadFonts } from "../fonts";
import { type Line, Subtitle, pop, sm, timeline, win } from "../ornek/common";
import { CameraRig, Character, useGltf, type Clip } from "../three/Character";
import { Backdrop, Floor, Track, lerp3, project, type Cam, type V3 } from "../three/scene";
import { Bubble, Sticker } from "../ui/overlays";

loadFonts();

const COL = { lime: "#C8F53C", red: "#FF5A4E", ink: "#111" };

export const PAZ_LINES: Line[] = [
  { text: "Her pazar akşamı aynı söz:", hl: ["söz:"] },
  { text: "“Yarın spora başlıyorum!”", hl: ["yarın"] },
  { text: "Pazartesi geliyor… ama bugün çok yorgunsun.", hl: ["pazartesi"] },
  { text: "“Haftaya kesin başlarım.”", hl: ["haftaya"] },
  { text: "Bir hafta, bir hafta daha… derken bir yıl geçiyor.", hl: ["bir", "yıl"] },
  { text: "Peki ya başlamak bu kadar büyük bir şey olmasaydı?", hl: ["büyük"] },
  { text: "Sadece bugün. Sadece 10 dakika yürüsen?", hl: ["10", "dakika"] },
  { text: "Bir ayda 300 dakika eder. Tam 5 saat hareket.", hl: ["300", "5", "saat"] },
  { text: "Bacakların, kalbin, uykun, moralin… hepsi fark ediyor.", hl: ["hepsi"] },
  { text: "Büyük başlangıçlar değil, her gün tekrar eden küçük adımlar kazandırır.", hl: ["küçük", "adımlar"] },
  { text: "Pazartesiyi bekleme.", hl: ["bekleme."], hold: 1.6 },
];

export const PAZ_TL = timeline(PAZ_LINES, 0.3);

// ------------------------------------------------------------ kamera (satır başına bir kurulum)

const SHOTS: { from: Cam; to: Cam }[] = [
  { from: { pos: [0.5, 1.6, 3.8], target: [0, 1.45, 0], fov: 40 }, to: { pos: [0.3, 1.6, 3.3], target: [0, 1.5, 0], fov: 40 } },
  { from: { pos: [0.3, 1.7, 2.8], target: [0, 1.65, 0], fov: 40 }, to: { pos: [0.2, 1.7, 2.5], target: [0, 1.7, 0], fov: 40 } },
  { from: { pos: [-1.4, 1.5, 3.2], target: [0, 1.5, 0], fov: 40 }, to: { pos: [-1.2, 1.5, 2.9], target: [0, 1.5, 0], fov: 40 } },
  { from: { pos: [-0.3, 1.7, 2.8], target: [0, 1.65, 0], fov: 40 }, to: { pos: [-0.2, 1.7, 2.5], target: [0, 1.7, 0], fov: 40 } },
  { from: { pos: [0, 2.6, 4.2], target: [0, 1.4, 0], fov: 42 }, to: { pos: [0, 4.0, 6.4], target: [0, 1.6, 0], fov: 42 } },
  { from: { pos: [0, 1.5, 3.4], target: [0, 1.5, 0], fov: 40 }, to: { pos: [0, 1.6, 2.7], target: [0, 1.6, 0], fov: 40 } },
  { from: { pos: [2.2, 1.3, 2.8], target: [0, 1.3, 0], fov: 40 }, to: { pos: [2.4, 1.3, 2.0], target: [0, 1.3, 0], fov: 40 } },
  { from: { pos: [1.0, 1.2, 3.8], target: [0, 1.6, 0], fov: 40 }, to: { pos: [0.6, 1.2, 3.4], target: [0, 1.6, 0], fov: 40 } },
  { from: { pos: [-0.3, 1.3, 3.0], target: [0, 1.1, 0], fov: 38 }, to: { pos: [0.3, 1.3, 2.8], target: [0, 1.1, 0], fov: 38 } },
  { from: { pos: [-2.4, 1.1, 1.6], target: [0, 1.2, 0], fov: 42 }, to: { pos: [-1.6, 0.9, 2.6], target: [0, 1.25, 0], fov: 42 } },
  { from: { pos: [0, 1.5, 2.8], target: [0, 1.35, 0], fov: 40 }, to: { pos: [0, 1.55, 2.3], target: [0, 1.4, 0], fov: 40 } },
];

const ease = (k: number) => {
  const c = Math.min(1, Math.max(0, k));
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
};

const cameraAt = (t: number, L: (i: number) => number, idx: number): Cam => {
  const i = Math.max(0, idx);
  const s = SHOTS[i];
  const k = (t - L(i)) / Math.max(0.1, L(i + 1) - L(i));
  const pose = (sh: { from: Cam; to: Cam }, kk: number): Cam => ({
    pos: lerp3(sh.from.pos, sh.to.pos, ease(kk)),
    target: lerp3(sh.from.target, sh.to.target, ease(kk)),
    fov: sh.from.fov + (sh.to.fov - sh.from.fov) * ease(kk),
  });
  const cur = pose(s, k);
  // ardışık kurulumlar arasında 0.6 sn yumuşak geçiş (kesme yok)
  const m = sm(t, L(i) - 0.05, L(i) + 0.6);
  if (i === 0 || m >= 1) return cur;
  const prev = pose(SHOTS[i - 1], 1);
  return { pos: lerp3(prev.pos, cur.pos, m), target: lerp3(prev.target, cur.target, m), fov: prev.fov + (cur.fov - prev.fov) * m };
};

// ------------------------------------------------------------ 3D

const Sofa: React.FC = () => (
  <group position={[0, 0, -1.3]}>
    <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.4, 0.5, 0.9]} />
      <meshStandardMaterial color="#c05a3c" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.75, -0.35]} castShadow>
      <boxGeometry args={[2.4, 0.8, 0.25]} />
      <meshStandardMaterial color="#b0503a" roughness={0.9} />
    </mesh>
    {[-1.15, 1.15].map((x) => (
      <mesh key={x} position={[x, 0.55, 0]} castShadow>
        <boxGeometry args={[0.25, 0.6, 0.9]} />
        <meshStandardMaterial color="#a64a35" roughness={0.9} />
      </mesh>
    ))}
  </group>
);

const World: React.FC<{ t: number; bot: GLTF; cam: Cam; L: (i: number) => number }> = ({ t, bot, cam, L }) => {
  const agree = win(t, L(1), L(2), 0.3);
  const sad = win(t, L(2), L(5), 0.4);
  const shake = win(t, L(3), L(4), 0.3);
  const walk = win(t, L(6), L(9), 0.4);
  const run = sm(t, L(9) - 0.2, L(9) + 0.3) * (1 - sm(t, L(10), L(10) + 0.5));
  const rest = Math.max(0, 1 - agree - sad - walk - run);
  const clips: Clip[] = [
    { name: "idle", weight: rest },
    { name: "agree", weight: agree * (1 - sad) },
    { name: "sad_pose", weight: sad * (1 - shake) },
    { name: "headShake", weight: shake },
    { name: "walk", weight: walk * (1 - run) },
    { name: "run", weight: run },
  ];
  const glow = (i: number, d: number) => sm(t, L(i) + d, L(i) + d + 0.3) * (1 - sm(t, L(i + 1) - 0.2, L(i + 1) + 0.3)) * 0.75;
  const moving = walk + run;
  const sofaOut = sm(t, L(5), L(6));
  return (
    <>
      <CameraRig position={cam.pos} target={cam.target} fov={cam.fov} />
      <hemisphereLight args={["#d6ecff", "#7a5a44", 1.25]} />
      <directionalLight position={[2.5, 5, 3.5]} intensity={2.6} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-3, 2.5, -4]} intensity={1.4} color="#9fd2ff" />
      <Floor />
      {sofaOut < 1 ? (
        <group position={[0, -2.5 * sofaOut, 0]}>
          <Sofa />
        </group>
      ) : null}
      {moving > 0.05 ? <Track t={t} speed={1.2 + run * 2.2} /> : null}
      <Character
        gltf={bot}
        clips={clips}
        glow={{
          legs: [COL.lime, glow(8, 0)],
          core: [COL.lime, glow(8, 0.5)],
          arms: [COL.lime, glow(8, 1.0)],
        }}
      />
    </>
  );
};

// ------------------------------------------------------------ ekran üstü

const PopBox: React.FC<{ t: number; at: number; out: number; x: number; y: number; children: React.ReactNode }> = ({ t, at, out, x, y, children }) => {
  const p = pop(t, at);
  const o = 1 - sm(t, out - 0.2, out);
  if (p <= 0 || o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: Math.max(y, 330), transform: `translate(-50%,-100%) scale(${0.5 + 0.5 * p})`, opacity: Math.min(1, p * 3) * o }}>
      {children}
    </div>
  );
};

const DAYS = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];

/** Takvim: pazartesi sayfaları hızla geçer */
const Calendar: React.FC<{ t: number; L: (i: number) => number }> = ({ t, L }) => {
  const o = win(t, L(2), L(3) + 0.1, 0.3) + win(t, L(4) - 0.1, L(5), 0.3);
  if (o <= 0) return null;
  const flips = Math.floor(interpolate(t, [L(4) + 0.2, L(5) - 0.4], [1, 52], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => x * x }));
  const p = pop(t, L(2));
  return (
    <div style={{ position: "absolute", left: 540, top: 250, transform: `translateX(-50%) scale(${0.6 + 0.4 * p}) rotate(-3deg)`, opacity: o }}>
      <div style={{ width: 420, borderRadius: 34, overflow: "hidden", background: "white", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ background: COL.red, color: "white", fontFamily: SANS, fontWeight: 800, fontSize: 44, textAlign: "center", padding: "16px 0", letterSpacing: 2 }}>
          PAZARTESİ
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 170, textAlign: "center", color: COL.ink, lineHeight: 1.15 }}>{flips}.</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, paddingBottom: 22 }}>
          {DAYS.map((d, i) => (
            <div key={d} style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, color: i === 0 ? COL.red : "#999" }}>
              {d}
            </div>
          ))}
        </div>
      </div>
      {t > L(4) + 0.3 ? (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Sticker bg={COL.ink} color="white" size={40}>
            “Haftaya…” × {flips}
          </Sticker>
        </div>
      ) : null}
    </div>
  );
};

/** 30 günlük işaret tablosu + dakika sayacı */
const Month: React.FC<{ t: number; L: (i: number) => number }> = ({ t, L }) => {
  const o = win(t, L(6) + 0.6, L(8), 0.3);
  if (o <= 0) return null;
  const days = Math.round(interpolate(t, [L(7) - 0.2, L(7) + 1.6], [1, 30], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const mins = days * 10;
  return (
    <div style={{ position: "absolute", left: 540, top: 230, transform: "translateX(-50%)", opacity: o, textAlign: "center" }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 130, color: "white", WebkitTextStroke: "7px #111", paintOrder: "stroke", letterSpacing: -3, lineHeight: 1 }}>
        {mins} <span style={{ fontSize: 70 }}>dk</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 52px)", gap: 10, marginTop: 24, background: "rgba(255,255,255,0.92)", padding: 22, borderRadius: 28 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: i < days ? COL.lime : "#e6e6e6",
              border: "3px solid #111",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 30,
              lineHeight: "46px",
              color: "#111",
            }}
          >
            {i < days ? <div style={{ width: 14, height: 26, borderRight: "6px solid #111", borderBottom: "6px solid #111", transform: "rotate(45deg)", margin: "6px auto 0" }} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

const Overlays: React.FC<{ t: number; cam: Cam; L: (i: number) => number }> = ({ t, cam, L }) => {
  const head = project(cam, [0, 1.95, 0] as V3);
  const P = (p: V3) => project(cam, p);
  const leg = P([0.3, 0.5, 0]);
  const chest = P([-0.35, 1.25, 0]);
  const arm = P([0.4, 1.35, 0]);
  return (
    <>
      <PopBox t={t} at={L(1) + 0.1} out={L(2)} x={head.x + 60} y={head.y - 10}>
        <Bubble text="Yarın başlıyorum!" color={COL.lime} size={58} />
      </PopBox>
      <PopBox t={t} at={L(3) + 0.1} out={L(4)} x={head.x + 40} y={head.y - 10}>
        <Bubble text="Haftaya kesin!" color={COL.red} size={58} />
      </PopBox>
      <PopBox t={t} at={L(6) + 0.2} out={L(7)} x={540} y={520}>
        <Sticker bg={COL.lime} size={70}>
          10 dakika
        </Sticker>
      </PopBox>
      <PopBox t={t} at={L(8) + 0.1} out={L(9)} x={leg.x + 170} y={leg.y}>
        <Sticker size={40}>bacaklar</Sticker>
      </PopBox>
      <PopBox t={t} at={L(8) + 0.6} out={L(9)} x={chest.x - 160} y={chest.y}>
        <Sticker size={40}>kalp</Sticker>
      </PopBox>
      <PopBox t={t} at={L(8) + 1.1} out={L(9)} x={arm.x + 160} y={arm.y - 40}>
        <Sticker size={40}>uyku</Sticker>
      </PopBox>
      <PopBox t={t} at={L(8) + 1.5} out={L(9)} x={head.x - 150} y={head.y - 30}>
        <Sticker size={40}>moral</Sticker>
      </PopBox>
    </>
  );
};

const EndTitle: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const p = pop(t, at, 30, 18);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1180, textAlign: "center", opacity: p, transform: `scale(${0.85 + 0.15 * p})` }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 100, color: "white", letterSpacing: -2.5, lineHeight: 1, WebkitTextStroke: "6px #111", paintOrder: "stroke" }}>
        Bugün
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 180, color: COL.lime, lineHeight: 1.05, WebkitTextStroke: "6px #111", paintOrder: "stroke" }}>
        10 dakika?
      </div>
    </div>
  );
};

// ------------------------------------------------------------ ana video

export const OrnekPazartesi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const tl = PAZ_TL;
  const L = tl.at;
  const bot = useGltf("models/Xbot.glb");
  const cam = cameraAt(t, L, tl.idx(t));
  const endAt = L(10) + 0.2;
  return (
    <AbsoluteFill lang="tr" style={{ background: "#2a84d8", overflow: "hidden" }}>
      <Backdrop t={t} />
      {bot ? (
        <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
          <World t={t} bot={bot} cam={cam} L={L} />
        </ThreeCanvas>
      ) : null}
      <Calendar t={t} L={L} />
      <Month t={t} L={L} />
      <Overlays t={t} cam={cam} L={L} />
      <Subtitle lines={PAZ_LINES} tl={tl} t={t} color={COL.lime} top={1470} size={66} stroke="#111" />
      <EndTitle t={t} at={endAt + 0.4} />
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: interpolate(t, [0, 0.3, tl.total - 0.4, tl.total], [1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
