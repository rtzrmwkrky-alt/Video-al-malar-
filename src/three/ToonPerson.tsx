/**
 * Kendi çizdiğimiz animasyon karakteri (hazır model değil): iri baş, büyük gözler,
 * mimikler (kaş, gülümseme, göz kırpma), saç tipleri. İskelet basit eklem gruplarından oluşur;
 * pozlar açılarla verilir (her kare için kesin, tekrarlanabilir).
 *
 * Yönler: karakter +z'ye bakar, solu +x. Bacak/kol x-dönüşü: negatif = ileri.
 */
import { useMemo } from "react";
import * as THREE from "three";

export type Look = {
  skin: string;
  hair: string;
  hairStyle: "curly" | "short" | "ponytail";
  top: string;
  bottom: string;
  shoe: string;
  sole: string;
  iris: string;
  beard?: boolean;
  lashes?: boolean;
  lips?: string;
  /** omuz genişliği çarpanı */
  build?: number;
  /** kol: kısa kollu (ön kol çıplak) */
  shortSleeve?: boolean;
  /** şort (diz altı çıplak) */
  shorts?: boolean;
};

export type V3 = [number, number, number];

export type Pose = {
  spine?: V3;
  head?: V3;
  hipL?: V3;
  hipR?: V3;
  kneeL?: number;
  kneeR?: number;
  shL?: V3;
  shR?: V3;
  elL?: number;
  elR?: number;
  /** kalça yükseklik farkı (m) */
  bob?: number;
};

export type Face = {
  /** -1 üzgün/endişeli … 0 … 1 şaşkın/mutlu kaş */
  brow?: number;
  /** -1 somurtma … 1 gülümseme */
  smile?: number;
  /** 0..1 ağız açık */
  open?: number;
  /** 0 açık … 1 kapalı göz */
  blink?: number;
  /** göz bebeği bakış yönü */
  gaze?: [number, number];
};

// ------------------------------------------------------------ hazır pozlar

const S = Math.sin;
export const idlePose = (t: number): Pose => ({
  spine: [0.02 * S(t * 1.6), 0, 0],
  head: [0.03 * S(t * 1.1 + 1), 0.06 * S(t * 0.7), 0],
  shL: [0.03 * S(t * 1.6), 0, 0.12],
  shR: [0.03 * S(t * 1.6), 0, -0.12],
  elL: -0.18,
  elR: -0.18,
  kneeL: 0.04,
  kneeR: 0.04,
  bob: 0.004 * S(t * 1.6),
});

export const walkPose = (t: number, speed = 1): Pose => {
  const p = t * speed * Math.PI * 1.9;
  return {
    spine: [0.05, 0.06 * S(p), 0],
    head: [-0.03, -0.04 * S(p), 0],
    hipL: [-0.42 * S(p), 0, 0],
    hipR: [0.42 * S(p), 0, 0],
    kneeL: 0.1 + 0.65 * Math.max(0, S(p - 1.9)),
    kneeR: 0.1 + 0.65 * Math.max(0, S(p - 1.9 + Math.PI)),
    shL: [0.38 * S(p), 0, 0.1],
    shR: [-0.38 * S(p), 0, -0.1],
    elL: -0.35,
    elR: -0.35,
    bob: 0.03 * Math.abs(Math.cos(p)) - 0.02,
  };
};

export const runPose = (t: number, speed = 1): Pose => {
  const p = t * speed * Math.PI * 2.8;
  return {
    spine: [0.2, 0.1 * S(p), 0],
    head: [-0.15, -0.06 * S(p), 0],
    hipL: [-0.75 * S(p) - 0.15, 0, 0],
    hipR: [0.75 * S(p) - 0.15, 0, 0],
    kneeL: 0.3 + 1.1 * Math.max(0, S(p - 1.6)),
    kneeR: 0.3 + 1.1 * Math.max(0, S(p - 1.6 + Math.PI)),
    shL: [0.8 * S(p), 0, 0.12],
    shR: [-0.8 * S(p), 0, -0.12],
    elL: -1.4,
    elR: -1.4,
    bob: 0.06 * Math.abs(Math.cos(p)) - 0.05,
  };
};

/** sağ el sallama */
export const wavePose = (t: number): Pose => ({
  ...idlePose(t),
  shR: [-0.2, 0, -2.5],
  elR: -0.5 - 0.35 * (1 + S(t * 9)) * 0.5,
  head: [0, 0.08, -0.06],
});

/** iki pozu karıştır */
export const mix = (a: Pose, b: Pose, k: number): Pose => {
  const v = (x?: V3, y?: V3): V3 => {
    const p = x ?? [0, 0, 0];
    const q = y ?? [0, 0, 0];
    return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
  };
  const n = (x?: number, y?: number) => (x ?? 0) + ((y ?? 0) - (x ?? 0)) * k;
  return {
    spine: v(a.spine, b.spine),
    head: v(a.head, b.head),
    hipL: v(a.hipL, b.hipL),
    hipR: v(a.hipR, b.hipR),
    shL: v(a.shL, b.shL),
    shR: v(a.shR, b.shR),
    kneeL: n(a.kneeL, b.kneeL),
    kneeR: n(a.kneeR, b.kneeR),
    elL: n(a.elL, b.elL),
    elR: n(a.elR, b.elR),
    bob: n(a.bob, b.bob),
  };
};

/** doğal göz kırpma (her ~3.5 sn) */
export const autoBlink = (t: number, seed = 0) => {
  const period = 3.4 + (seed % 3) * 0.4;
  const x = ((t + seed * 1.3) % period) / period;
  const d = Math.abs(x - 0.5) * period;
  return d < 0.07 ? 1 - d / 0.07 : 0;
};

// ------------------------------------------------------------ malzemeler

const useMats = (look: Look) =>
  useMemo(() => {
    const std = (color: string, rough = 0.65, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
      new THREE.MeshPhysicalMaterial({ color, roughness: rough, ...extra });
    return {
      skin: std(look.skin, 0.55, { sheen: 0.4, sheenColor: new THREE.Color("#ffb4a0"), clearcoat: 0.05 }),
      hair: std(look.hair, 0.45, { sheen: 0.6, sheenColor: new THREE.Color("#ffffff"), sheenRoughness: 0.4 }),
      top: std(look.top, 0.85, { sheen: 0.5, sheenColor: new THREE.Color("#ffffff") }),
      bottom: std(look.bottom, 0.85, { sheen: 0.3 }),
      shoe: std(look.shoe, 0.5),
      sole: std(look.sole, 0.6),
      white: std("#fbfbfb", 0.15, { clearcoat: 1 }),
      iris: std(look.iris, 0.25, { clearcoat: 1 }),
      pupil: std("#0b0b0d", 0.2, { clearcoat: 1 }),
      shine: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      mouth: std(look.lips ?? "#9c3b3b", 0.5),
      inner: std("#4a1416", 0.8),
      teeth: std("#ffffff", 0.3),
      blush: new THREE.MeshBasicMaterial({ color: "#ff6f7d", transparent: true, opacity: 0.18, depthWrite: false }),
      brow: std(look.hair, 0.7),
      dark: std("#1a1a1a", 0.6),
      stubble: new THREE.MeshStandardMaterial({ color: look.hair, roughness: 1, transparent: true, opacity: 0.42, depthWrite: false }),
      collar: std(new THREE.Color(look.top).multiplyScalar(0.8).getStyle(), 0.85),
    };
  }, [look]);

// ------------------------------------------------------------ saç

/** basit sözde-rastgele (tekrarlanabilir) */
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Hair: React.FC<{ look: Look; mat: THREE.Material; r: number; t: number }> = ({ look, mat, r, t }) => {
  const curls = useMemo(() => {
    if (look.hairStyle !== "curly") return [];
    const out: { p: V3; s: number }[] = [];
    for (let i = 0; i < 150; i++) {
      const el = 0.05 + rnd(i) * 1.45; // yükseklik açısı (0 ekvator, π/2 tepe)
      const az = rnd(i + 99) * Math.PI * 2;
      const x = Math.cos(el) * Math.sin(az);
      const z = Math.cos(el) * Math.cos(az);
      const y = Math.sin(el);
      // yüzü açık bırak: önde ve alçakta saç yok
      if (z > 0.35 && y < 0.55) continue;
      if (z > 0 && y < 0.15) continue;
      const rr = r * (1.0 + 0.12 * rnd(i + 7));
      out.push({ p: [x * rr, y * rr * 1.02 + 0.01, z * rr - 0.01], s: 0.045 + rnd(i + 3) * 0.035 });
    }
    // yanlarda ve arkada omuza doğru dökülen bukleler
    for (let i = 0; i < 46; i++) {
      const az = Math.PI * 0.35 + rnd(i + 500) * Math.PI * 1.3;
      const y = -0.05 - rnd(i + 600) * 0.2;
      const rr = r * (0.95 + 0.15 * rnd(i + 700));
      out.push({ p: [Math.sin(az) * rr, y, Math.cos(az) * rr - 0.02], s: 0.05 + rnd(i + 800) * 0.03 });
    }
    return out;
  }, [look.hairStyle, r]);

  if (look.hairStyle === "curly") {
    return (
      <group>
        {curls.map((c, i) => (
          <mesh key={i} position={c.p} material={mat} castShadow>
            <icosahedronGeometry args={[c.s, 1]} />
          </mesh>
        ))}
      </group>
    );
  }
  if (look.hairStyle === "short") {
    return (
      <group>
        {/* öne/aşağı kaydırılmış küre: alnın üstünde doğal saç çizgisi oluşturur */}
        <mesh material={mat} position={[0, r * 0.24, -r * 0.2]} castShadow>
          <sphereGeometry args={[r * 1.06, 64, 40]} />
        </mesh>
        <mesh material={mat} position={[r * 0.08, r * 0.86, r * 0.42]} rotation={[0.9, 0, -0.4]} scale={[1.7, 0.55, 0.9]} castShadow>
          <sphereGeometry args={[0.055, 20, 14]} />
        </mesh>
      </group>
    );
  }
  // ponytail: başı saran saç + sallanan at kuyruğu
  const sway = Math.sin(t * 3.2) * 0.12;
  return (
    <group>
      <mesh material={mat} position={[0, r * 0.22, -r * 0.19]} castShadow>
        <sphereGeometry args={[r * 1.07, 64, 40]} />
      </mesh>
      {/* yandan ayrılan kâkül */}
      <mesh material={mat} position={[-0.05, r * 0.72, r * 0.6]} rotation={[0.7, 0.3, 0.6]} scale={[1.9, 0.5, 0.8]} castShadow>
        <sphereGeometry args={[0.06, 20, 14]} />
      </mesh>
      <group position={[0, r * 0.55, -r * 0.92]} rotation={[0.35 + Math.abs(sway) * 0.3, 0, sway]}>
        <mesh material={mat}>
          <torusGeometry args={[0.03, 0.012, 8, 16]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} material={mat} position={[0, -0.05 - i * 0.065, -0.02 - i * 0.012]} scale={[1, 1.3, 1]} castShadow>
            <sphereGeometry args={[0.05 - i * 0.008, 18, 14]} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ------------------------------------------------------------ yüz

const Eye: React.FC<{ x: number; m: ReturnType<typeof useMats>; face: Face; r: number; side: 1 | -1; lashes?: boolean }> = ({
  x,
  m,
  face,
  r,
  side,
  lashes,
}) => {
  const er = r * 0.235;
  const gx = (face.gaze?.[0] ?? 0) * 0.35;
  const gy = (face.gaze?.[1] ?? 0) * 0.3;
  const blink = face.blink ?? 0;
  const lid = -1.05 + blink * 1.9 - (face.brow ?? 0) * 0.15;
  return (
    <group position={[x, r * 0.06, r * 0.74]} rotation={[0, side * 0.3, 0]}>
      <mesh material={m.white}>
        <sphereGeometry args={[er, 32, 24]} />
      </mesh>
      <group rotation={[-gy, gx, 0]}>
        <mesh material={m.iris} position={[0, 0, er * 0.8]} scale={[1, 1.05, 0.45]}>
          <sphereGeometry args={[er * 0.6, 32, 24]} />
        </mesh>
        <mesh material={m.pupil} position={[0, 0, er * 0.95]} scale={[1, 1, 0.4]}>
          <sphereGeometry args={[er * 0.3, 24, 16]} />
        </mesh>
        <mesh material={m.shine} position={[er * 0.2, er * 0.24, er * 1.07]}>
          <sphereGeometry args={[er * 0.12, 12, 10]} />
        </mesh>
        <mesh material={m.shine} position={[-er * 0.17, -er * 0.18, er * 1.06]}>
          <sphereGeometry args={[er * 0.05, 10, 8]} />
        </mesh>
      </group>
      {/* üst göz kapağı */}
      <mesh material={m.skin} rotation={[lid, 0, 0]}>
        <sphereGeometry args={[er * 1.07, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </mesh>
    </group>
  );
};

const FaceParts: React.FC<{ look: Look; m: ReturnType<typeof useMats>; face: Face; r: number }> = ({ look, m, face, r }) => {
  const smile = face.smile ?? 0.4;
  const open = face.open ?? 0;
  const brow = face.brow ?? 0;
  const ex = r * 0.36;
  return (
    <group>
      <Eye x={ex} m={m} face={face} r={r} side={1} lashes={look.lashes} />
      <Eye x={-ex} m={m} face={face} r={r} side={-1} lashes={look.lashes} />
      {/* kaşlar */}
      {[1, -1].map((s) => (
        <mesh
          key={s}
          material={m.brow}
          position={[s * ex, r * 0.31 + brow * 0.02, r * 0.93]}
          rotation={[-0.35, s * 0.3, Math.PI / 2 - s * (0.1 + brow * 0.25)]}
          scale={[0.55, 1, 0.5]}
        >
          <capsuleGeometry args={[r * 0.065, r * 0.32, 6, 12]} />
        </mesh>
      ))}
      {/* burun */}
      <mesh material={m.skin} position={[0, -r * 0.12, r * 1.0]} scale={[1.1, 0.85, 1]}>
        <sphereGeometry args={[r * 0.13, 20, 16]} />
      </mesh>
      {/* yanaklar */}
      {[1, -1].map((s) => (
        <mesh key={s} material={m.blush} position={[s * r * 0.55, -r * 0.2, r * 0.78]} scale={[1, 0.7, 0.4]}>
          <sphereGeometry args={[r * 0.17, 16, 12]} />
        </mesh>
      ))}
      {/* ağız */}
      <group position={[0, -r * 0.42, r * 0.9]} rotation={[0.35, 0, 0]}>
        {open > 0.02 ? (
          <group>
            <mesh material={m.inner} scale={[1.0, 0.25 + open * 0.75, 0.4]}>
              <sphereGeometry args={[r * 0.2, 24, 16]} />
            </mesh>
            <mesh material={m.teeth} position={[0, r * 0.07 + open * r * 0.08, r * 0.04]} scale={[1, 0.25, 0.3]}>
              <sphereGeometry args={[r * 0.14, 20, 12]} />
            </mesh>
          </group>
        ) : null}
        <mesh material={m.mouth} rotation={[0, 0, smile >= 0 ? Math.PI : 0]} position={[0, smile >= 0 ? r * 0.06 : -r * 0.06, 0]} scale={[1, 0.25 + Math.abs(smile) * 0.75, 1]}>
          <torusGeometry args={[r * 0.18, r * 0.03, 10, 28, Math.PI]} />
        </mesh>
      </group>
      {/* sakal */}
      {look.beard ? (
        <mesh material={m.stubble} scale={[0.96, 1.045, 0.96]}>
          <sphereGeometry args={[r * 1.0, 40, 24, Math.PI * 0.02, Math.PI * 0.96, Math.PI * 0.65, Math.PI * 0.3]} />
        </mesh>
      ) : null}
      {/* kulaklar */}
      {[1, -1].map((s) => (
        <mesh key={s} material={m.skin} position={[s * r * 0.98, 0, 0]} scale={[0.5, 1, 0.75]}>
          <sphereGeometry args={[r * 0.2, 16, 12]} />
        </mesh>
      ))}
    </group>
  );
};

// ------------------------------------------------------------ gövde

const Limb: React.FC<{ len: number; rad: number; mat: THREE.Material; rad2?: number }> = ({ len, rad, mat, rad2 }) => (
  <group>
    <mesh material={mat} position={[0, -len / 2, 0]} castShadow>
      <capsuleGeometry args={[rad2 ? (rad + rad2) / 2 : rad, len - rad, 8, 16]} />
    </mesh>
  </group>
);

export const ToonPerson: React.FC<{
  look: Look;
  pose?: Pose;
  face?: Face;
  position?: V3;
  rotationY?: number;
  t?: number;
  scale?: number;
}> = ({ look, pose = {}, face = {}, position = [0, 0, 0], rotationY = 0, t = 0, scale = 1 }) => {
  const m = useMats(look);
  const b = look.build ?? 1;
  const r = 0.2; // baş yarıçapı (bilerek iri: animasyon oranı)
  const HIP = 0.86;
  const THIGH = 0.4;
  const SHIN = 0.4;
  const UA = 0.27;
  const FA = 0.25;
  const e = (v?: V3): V3 => v ?? [0, 0, 0];
  const legMat = look.shorts ? m.skin : m.bottom;
  const forearmMat = look.shortSleeve ? m.skin : m.top;

  const leg = (side: 1 | -1, hip: V3, knee: number) => (
    <group position={[side * 0.095, 0, 0]} rotation={hip}>
      <Limb len={THIGH} rad={0.072} mat={m.bottom} />
      <group position={[0, -THIGH, 0]} rotation={[knee, 0, 0]}>
        <Limb len={SHIN} rad={0.056} mat={legMat} />
        {/* ayakkabı */}
        <group position={[0, -SHIN, 0.0]} rotation={[-knee * 0.4 + (hip[0] < 0 ? 0 : 0), 0, 0]}>
          <mesh material={m.shoe} position={[0, -0.02, 0.06]} rotation={[Math.PI / 2, 0, 0]} scale={[1.15, 1, 0.8]} castShadow>
            <capsuleGeometry args={[0.06, 0.12, 8, 16]} />
          </mesh>
          <mesh material={m.sole} position={[0, -0.065, 0.06]} scale={[1.2, 0.25, 1.05]}>
            <capsuleGeometry args={[0.06, 0.13, 6, 12]} />
          </mesh>
        </group>
      </group>
    </group>
  );

  const arm = (side: 1 | -1, sh: V3, el: number) => (
    <group position={[side * 0.2 * b, 0.43, 0]} rotation={sh}>
      <mesh material={m.top} castShadow>
        <sphereGeometry args={[0.058, 16, 12]} />
      </mesh>
      <Limb len={UA} rad={0.054} mat={m.top} />
      <group position={[0, -UA, 0]} rotation={[el, 0, 0]}>
        <Limb len={FA} rad={0.045} mat={forearmMat} />
        <mesh material={m.skin} position={[0, -FA - 0.03, 0.005]} scale={[0.85, 1.1, 0.6]} castShadow>
          <sphereGeometry args={[0.055, 16, 12]} />
        </mesh>
        {/* başparmak */}
        <mesh material={m.skin} position={[-side * 0.035, -FA - 0.01, 0.03]} rotation={[0.3, 0, side * 0.5]}>
          <capsuleGeometry args={[0.016, 0.03, 4, 8]} />
        </mesh>
      </group>
    </group>
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <group position={[0, HIP + (pose.bob ?? 0), 0]}>
        {/* kalça */}
        <mesh material={m.bottom} scale={[1.0 * Math.max(1, b * 0.95), 0.75, 0.82]} position={[0, 0.02, 0]} castShadow>
          <sphereGeometry args={[0.17, 24, 18]} />
        </mesh>
        {leg(1, e(pose.hipL), pose.kneeL ?? 0)}
        {leg(-1, e(pose.hipR), pose.kneeR ?? 0)}
        <group rotation={e(pose.spine)}>
          {/* gövde */}
          <mesh material={m.top} position={[0, 0.24, 0]} scale={[1.08 * b, 1, 0.75]} castShadow>
            <capsuleGeometry args={[0.17, 0.24, 10, 24]} />
          </mesh>
          {arm(1, e(pose.shL), pose.elL ?? 0)}
          {arm(-1, e(pose.shR), pose.elR ?? 0)}
          {/* yaka */}
          <mesh material={m.collar} position={[0, 0.465, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.15 * b, 0.8, 1]}>
            <torusGeometry args={[0.075, 0.018, 10, 32]} />
          </mesh>
          {/* boyun + baş */}
          <mesh material={m.skin} position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.12, 16]} />
          </mesh>
          <group position={[0, 0.56, 0]} rotation={e(pose.head)}>
            <group position={[0, r * 0.95, 0.01]}>
              <mesh material={m.skin} scale={[0.95, 1.04, 0.95]} castShadow>
                <sphereGeometry args={[r, 64, 48]} />
              </mesh>
              <FaceParts look={look} m={m} face={face} r={r} />
              <Hair look={look} mat={m.hair} r={r} t={t} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

// ------------------------------------------------------------ adaylar

export const LOOKS: Record<string, Look> = {
  deniz: {
    skin: "#d79a72",
    hair: "#3a2216",
    hairStyle: "curly",
    top: "#8f6fe0",
    bottom: "#2b2d3a",
    shoe: "#f5f5f5",
    sole: "#c8f53c",
    iris: "#5a3418",
    lashes: true,
    lips: "#b0464c",
    build: 1,
    shortSleeve: true,
  },
  can: {
    skin: "#f0c09c",
    hair: "#241a14",
    hairStyle: "short",
    top: "#ff7a3d",
    bottom: "#555b68",
    shoe: "#1f2430",
    sole: "#f5f5f5",
    iris: "#3e5f2a",
    beard: true,
    build: 1.15,
  },
  elif: {
    skin: "#f5cdb0",
    hair: "#a54a25",
    hairStyle: "ponytail",
    top: "#2fc69c",
    bottom: "#24345c",
    shoe: "#ffffff",
    sole: "#ff6b8a",
    iris: "#2f6fb0",
    lashes: true,
    lips: "#c4505a",
    build: 0.95,
    shortSleeve: true,
    shorts: true,
  },
};
