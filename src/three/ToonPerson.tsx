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
  hairStyle: "long" | "ponytail" | "bun";
  /** saç parlama rengi */
  hairShine?: string;
  /** üst giysi şerit/aksan rengi */
  accent?: string;
  top: string;
  bottom: string;
  shoe: string;
  sole: string;
  iris: string;
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
// ------------------------------------------------------------ malzemeler / dokular

/** Göz dokusu: beyaz zemin + degrade iris + halka + göz bebeği (küre UV'sine göre çizilir). */
const eyeTexture = (iris: string) => {
  const W = 1024;
  const H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#fbf8f6";
  c.fillRect(0, 0, W, H);
  const cx = W / 2;
  const cy = H / 2;
  const R = 112; // açısal yarıçap (piksel; 1024 genişlik = 360°)
  const base = new THREE.Color(iris);
  const light = base.clone().lerp(new THREE.Color("#ffffff"), 0.45).getStyle();
  const dark = base.clone().multiplyScalar(0.45).getStyle();
  const g = c.createRadialGradient(cx, cy + R * 0.25, R * 0.1, cx, cy, R);
  g.addColorStop(0, light);
  g.addColorStop(0.55, base.getStyle());
  g.addColorStop(1, dark);
  c.fillStyle = g;
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.fill();
  // iris çizgileri
  c.strokeStyle = "rgba(0,0,0,0.12)";
  c.lineWidth = 2;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * R * 0.4, cy + Math.sin(a) * R * 0.4);
    c.lineTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92);
    c.stroke();
  }
  c.strokeStyle = "rgba(20,10,5,0.75)";
  c.lineWidth = 9;
  c.beginPath();
  c.arc(cx, cy, R - 4, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = "#0a0808";
  c.beginPath();
  c.arc(cx, cy, R * 0.42, 0, Math.PI * 2);
  c.fill();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const useMats = (look: Look) =>
  useMemo(() => {
    const std = (color: string, rough = 0.65, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
      new THREE.MeshPhysicalMaterial({ color, roughness: rough, ...extra });
    const top = new THREE.Color(look.top);
    return {
      skin: std(look.skin, 0.5, { sheen: 0.6, sheenColor: new THREE.Color("#ff9d8a"), sheenRoughness: 0.5, clearcoat: 0.08, clearcoatRoughness: 0.6 }),
      hair: std(look.hair, 0.38, { sheen: 1, sheenColor: new THREE.Color(look.hairShine ?? "#ffd9b0"), sheenRoughness: 0.35, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
      top: std(look.top, 0.8, { sheen: 0.6, sheenColor: new THREE.Color("#ffffff"), sheenRoughness: 0.6 }),
      trim: std(look.accent ?? top.clone().lerp(new THREE.Color("#ffffff"), 0.6).getStyle(), 0.7),
      bottom: std(look.bottom, 0.75, { sheen: 0.4, sheenColor: new THREE.Color("#ffffff") }),
      shoe: std(look.shoe, 0.45, { clearcoat: 0.3 }),
      sole: std(look.sole, 0.6),
      eye: new THREE.MeshPhysicalMaterial({ map: eyeTexture(look.iris), roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02 }),
      shine: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      lash: std("#1b1110", 0.6),
      lips: std(look.lips ?? "#d06a6f", 0.35, { clearcoat: 0.4 }),
      inner: std("#5a1a1e", 0.8),
      teeth: std("#ffffff", 0.3),
      blush: new THREE.MeshBasicMaterial({ color: "#ff5f78", transparent: true, opacity: 0.16, depthWrite: false }),
      brow: std(new THREE.Color(look.hair).multiplyScalar(0.8).getStyle(), 0.8),
    };
  }, [look]);

// ------------------------------------------------------------ saç

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Yumuşak tutam: eğri boyunca incelen pürüzsüz tüp, uçları yuvarlak */
const Lock: React.FC<{ pts: V3[]; r0: number; r1: number; mat: THREE.Material; flat?: number }> = ({ pts, r0, r1, mat, flat = 1 }) => {
  const key = JSON.stringify(pts);
  const { geo, end, start } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const tub = 40;
    const rad = 12;
    const g = new THREE.TubeGeometry(curve, tub, 1, rad, false);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const frames = curve.computeFrenetFrames(tub, false);
    for (let i = 0; i <= tub; i++) {
      const u = i / tub;
      const c = curve.getPointAt(u);
      const rr = r0 + (r1 - r0) * u;
      for (let j = 0; j <= rad; j++) {
        const k = i * (rad + 1) + j;
        const v = new THREE.Vector3(pos.getX(k), pos.getY(k), pos.getZ(k)).sub(c);
        // yassılık: binormal yönünde incelt
        const bn = frames.binormals[i];
        const d = v.dot(bn);
        v.addScaledVector(bn, -d * (1 - flat));
        v.multiplyScalar(rr);
        pos.setXYZ(k, c.x + v.x, c.y + v.y, c.z + v.z);
      }
    }
    g.computeVertexNormals();
    return { geo: g, start: curve.getPointAt(0), end: curve.getPointAt(1) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, r0, r1, flat]);
  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow />
      <mesh material={mat} position={start}>
        <sphereGeometry args={[r0 * 0.98, 16, 12]} />
      </mesh>
      <mesh material={mat} position={end}>
        <sphereGeometry args={[r1 * 0.98, 12, 10]} />
      </mesh>
    </group>
  );
};

const Hair: React.FC<{ look: Look; mat: THREE.Material; r: number; t: number; headTurn: number }> = ({ look, mat, r, t, headTurn }) => {
  const sway = Math.sin(t * 2.6) * 0.015 - headTurn * 0.05;
  const cap = (
    <>
      {/* yukarı/geri kaydırılmış küre → alında yumuşak saç çizgisi */}
      <mesh material={mat} position={[0, r * 0.3, -r * 0.2]} castShadow>
        <sphereGeometry args={[r * 1.06, 96, 64]} />
      </mesh>
    </>
  );

  if (look.hairStyle === "long") {
    const side = (s: 1 | -1, k: number): V3[] => [
      [s * r * 0.85, r * 0.3, r * 0.15],
      [s * r * 1.0, -r * 0.3, r * 0.12],
      [s * r * (1.08 + sway * s), -r * 0.95, r * 0.18 + k],
      [s * r * (0.98 + sway * s * 2), -r * 1.6, r * 0.28 + k],
      [s * r * (1.12 + sway * s * 3), -r * 2.15, r * 0.3 + k],
    ];
    return (
      <group>
        {cap}
        {/* arka kütle: omuzların altına dökülen saç */}
        <mesh material={mat} position={[sway * r, -r * 0.75, -r * 0.42]} scale={[1.05, 1, 0.62]} castShadow>
          <capsuleGeometry args={[r * 0.95, r * 1.6, 16, 32]} />
        </mesh>
        <Lock pts={side(1, 0)} r0={r * 0.22} r1={r * 0.14} mat={mat} />
        <Lock pts={side(-1, 0)} r0={r * 0.22} r1={r * 0.14} mat={mat} />
        {/* uçlarda dalga */}
        {[1, -1].map((s) => (
          <mesh key={s} material={mat} position={[s * r * (1.0 + sway * 4), -r * 2.35, r * 0.18]} rotation={[0, 0, s * 0.5]} castShadow>
            <torusGeometry args={[r * 0.12, r * 0.07, 10, 18, Math.PI * 1.2]} />
          </mesh>
        ))}
      </group>
    );
  }
  if (look.hairStyle === "bun") {
    return (
      <group>
        {cap}
        <group position={[0, r * 1.05, -r * 0.35]}>
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const e = (rnd(i) - 0.5) * 0.9;
            return (
              <mesh key={i} material={mat} position={[Math.cos(a) * r * 0.32, Math.sin(e) * r * 0.25 + r * 0.05, Math.sin(a) * r * 0.3]} castShadow>
                <sphereGeometry args={[r * (0.2 + rnd(i + 9) * 0.06), 18, 14]} />
              </mesh>
            );
          })}
          <mesh material={mat} position={[0, r * 0.12, 0]} castShadow>
            <sphereGeometry args={[r * 0.34, 24, 18]} />
          </mesh>
        </group>
        {/* yüzü çerçeveleyen ince tutamlar */}
        {[1, -1].map((s) => (
          <Lock
            key={s}
            pts={[
              [s * r * 0.8, r * 0.45, r * 0.45],
              [s * r * (0.92 + sway * s), -r * 0.1, r * 0.55],
              [s * r * (0.85 + sway * s * 2), -r * 0.65, r * 0.5],
            ]}
            r0={r * 0.06}
            r1={r * 0.035}
            mat={mat}
          />
        ))}
      </group>
    );
  }
  // ponytail: tepeden sallanan uzun at kuyruğu
  const sw = Math.sin(t * 3.0) * 0.18 - headTurn * 0.6;
  return (
    <group>
      {cap}
      <group position={[0, r * 0.95, -r * 0.78]} rotation={[0.2, 0, sw]}>
        <mesh material={mat} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[r * 0.14, r * 0.06, 10, 20]} />
        </mesh>
        <Lock
          pts={[
            [0, 0, -r * 0.1],
            [0, -r * 0.2, -r * 0.55],
            [0, -r * 0.9, -r * 0.62],
            [0, -r * 1.6, -r * 0.45],
            [r * 0.1, -r * 2.1, -r * 0.3],
          ]}
          r0={r * 0.3}
          r1={r * 0.1}
          mat={mat}
        />
      </group>
    </group>
  );
};

// ------------------------------------------------------------ yüz

const Eye: React.FC<{ x: number; m: ReturnType<typeof useMats>; face: Face; r: number; side: 1 | -1 }> = ({ x, m, face, r, side }) => {
  const er = r * 0.25;
  const gx = (face.gaze?.[0] ?? 0) * 0.35;
  const gy = (face.gaze?.[1] ?? 0) * 0.3;
  const blink = face.blink ?? 0;
  const lid = -1.0 + blink * 1.75 - (face.brow ?? 0) * 0.12 + Math.max(0, face.smile ?? 0) * 0.08;
  const lowLid = 2.92 - Math.max(0, face.smile ?? 0) * 0.15; // gülerken alt kapak hafif kalkar
  return (
    <group position={[x, r * 0.04, r * 0.72]} rotation={[0, side * 0.32, 0]} scale={[1.05, 1.08, 1]}>
      {/* göz küresi: doku +x'ten +z'ye çevrilir */}
      <group rotation={[-gy, gx, 0]}>
        <mesh material={m.eye} rotation={[0, -Math.PI / 2, 0]}>
          <sphereGeometry args={[er, 48, 32]} />
        </mesh>
      </group>
      {/* parıltılar (bakışla dönmez) */}
      <mesh material={m.shine} position={[er * 0.28 * side * 0 + er * 0.25, er * 0.3, er * 0.97]}>
        <sphereGeometry args={[er * 0.14, 12, 10]} />
      </mesh>
      <mesh material={m.shine} position={[-er * 0.2, -er * 0.22, er * 0.98]}>
        <sphereGeometry args={[er * 0.06, 10, 8]} />
      </mesh>
      {/* üst kapak + kirpik çizgisi */}
      <group rotation={[lid, 0, 0]}>
        <mesh material={m.skin}>
          <sphereGeometry args={[er * 1.06, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        <mesh material={m.lash} rotation={[Math.PI / 2, 0, Math.PI * 0.06]}>
          <torusGeometry args={[er * 1.06, er * 0.075, 8, 40, Math.PI * 0.88]} />
        </mesh>
        {/* dış köşede kalkık kirpik */}
        <mesh material={m.lash} position={[side * er * 0.98, 0, er * 0.3]} rotation={[0, 0, side * -0.9]} scale={[0.5, 1, 0.5]}>
          <coneGeometry args={[er * 0.12, er * 0.42, 10]} />
        </mesh>
      </group>
      {/* alt kapak */}
      <group rotation={[lowLid, 0, 0]}>
        <mesh material={m.skin}>
          <sphereGeometry args={[er * 1.03, 40, 12, 0, Math.PI * 2, 0, Math.PI * 0.2]} />
        </mesh>
      </group>
    </group>
  );
};

const FaceParts: React.FC<{ m: ReturnType<typeof useMats>; face: Face; r: number }> = ({ m, face, r }) => {
  const smile = face.smile ?? 0.4;
  const open = face.open ?? 0;
  const brow = face.brow ?? 0;
  const ex = r * 0.37;
  return (
    <group>
      <Eye x={ex} m={m} face={face} r={r} side={1} />
      <Eye x={-ex} m={m} face={face} r={r} side={-1} />
      {/* ince, kavisli kaşlar */}
      {[1, -1].map((s) => (
        <group key={s} position={[s * ex, r * 0.31 + brow * 0.022, r * 0.9]} rotation={[-0.4, s * 0.3, s * (-0.12 - brow * 0.18)]}>
          <mesh material={m.brow} rotation={[0, 0, Math.PI / 2 + Math.PI * 0.08]} position={[0, -r * 0.16, 0]}>
            <torusGeometry args={[r * 0.2, r * 0.022, 6, 24, Math.PI * 0.42]} />
          </mesh>
        </group>
      ))}
      {/* küçük, kalkık burun */}
      <mesh material={m.skin} position={[0, -r * 0.14, r * 0.95]} rotation={[-0.3, 0, 0]} scale={[1.05, 0.8, 0.9]}>
        <sphereGeometry args={[r * 0.1, 20, 16]} />
      </mesh>
      {/* allık */}
      {[1, -1].map((s) => (
        <mesh key={s} material={m.blush} position={[s * r * 0.5, -r * 0.2, r * 0.76]} scale={[1, 0.65, 0.35]}>
          <sphereGeometry args={[r * 0.17, 16, 12]} />
        </mesh>
      ))}
      {/* dudaklar */}
      <group position={[0, -r * 0.43, r * 0.86]} rotation={[0.45, 0, 0]}>
        {open > 0.02 ? (
          <group>
            <mesh material={m.inner} scale={[1.0, 0.25 + open * 0.8, 0.4]}>
              <sphereGeometry args={[r * 0.15, 24, 16]} />
            </mesh>
            <mesh material={m.teeth} position={[0, r * 0.05 + open * r * 0.06, r * 0.03]} scale={[1, 0.25, 0.3]}>
              <sphereGeometry args={[r * 0.11, 20, 12]} />
            </mesh>
          </group>
        ) : null}
        {/* alt dudak: gülümseme yayı */}
        <mesh material={m.lips} rotation={[0, 0, smile >= 0 ? Math.PI : 0]} position={[0, smile >= 0 ? r * 0.035 : -r * 0.035, 0]} scale={[1, 0.3 + Math.abs(smile) * 0.6, 1]}>
          <torusGeometry args={[r * 0.13, r * 0.032, 10, 28, Math.PI]} />
        </mesh>
        {/* üst dudak */}
        <mesh material={m.lips} position={[0, r * 0.04 + open * r * 0.08, -r * 0.005]} scale={[1.6, 0.45, 0.6]}>
          <sphereGeometry args={[r * 0.06, 16, 10]} />
        </mesh>
      </group>
    </group>
  );
};

// ------------------------------------------------------------ gövde

/** Yumurta biçimli baş: çeneye doğru incelir */
const useHeadGeo = (r: number) =>
  useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI;
      const lower = a > Math.PI / 2 ? Math.pow((a - Math.PI / 2) / (Math.PI / 2), 1.5) : 0;
      const rad = Math.max(0.0001, r * Math.sin(a) * (1 - 0.34 * lower));
      pts.push(new THREE.Vector2(rad, r * Math.cos(a) * 1.06));
    }
    return new THREE.LatheGeometry(pts.reverse(), 64);
  }, [r]);

/** İnce bel, göğüs ve omuz kıvrımı olan gövde */
const useTorsoGeo = (b: number) =>
  useMemo(() => {
    const prof: [number, number][] = [
      [0.0001, -0.02],
      [0.12, 0.0],
      [0.128, 0.06],
      [0.112, 0.15],
      [0.13, 0.25],
      [0.148, 0.33],
      [0.145, 0.4],
      [0.118, 0.45],
      [0.06, 0.48],
      [0.0001, 0.485],
    ];
    const g = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 48);
    g.scale(1.12 * b, 1, 0.74);
    g.computeVertexNormals();
    return g;
  }, [b]);

const Limb: React.FC<{ len: number; rad: number; mat: THREE.Material }> = ({ len, rad, mat }) => (
  <mesh material={mat} position={[0, -len / 2, 0]} castShadow>
    <capsuleGeometry args={[rad, len - rad, 8, 16]} />
  </mesh>
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
  const r = 0.19;
  const head = useHeadGeo(r);
  const torso = useTorsoGeo(b);
  const HIP = 0.88;
  const THIGH = 0.42;
  const SHIN = 0.41;
  const UA = 0.26;
  const FA = 0.24;
  const e = (v?: V3): V3 => v ?? [0, 0, 0];
  const legMat = look.shorts ? m.skin : m.bottom;
  const forearmMat = look.shortSleeve ? m.skin : m.top;

  const leg = (side: 1 | -1, hip: V3, knee: number) => (
    <group position={[side * 0.085, 0, 0]} rotation={hip}>
      <Limb len={THIGH} rad={0.068} mat={m.bottom} />
      {look.shorts ? (
        <mesh material={m.trim} position={[0, -THIGH * 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.071, 0.012, 8, 24]} />
        </mesh>
      ) : null}
      <group position={[0, -THIGH, 0]} rotation={[knee, 0, 0]}>
        {look.shorts ? <Limb len={SHIN} rad={0.05} mat={legMat} /> : <Limb len={SHIN} rad={0.054} mat={m.bottom} />}
        <group position={[0, -SHIN, 0]} rotation={[-knee * 0.4, 0, 0]}>
          <mesh material={m.shoe} position={[0, -0.02, 0.055]} rotation={[Math.PI / 2, 0, 0]} scale={[1.05, 1, 0.8]} castShadow>
            <capsuleGeometry args={[0.055, 0.12, 8, 16]} />
          </mesh>
          <mesh material={m.sole} position={[0, -0.06, 0.055]} scale={[1.12, 0.25, 1.05]}>
            <capsuleGeometry args={[0.055, 0.13, 6, 12]} />
          </mesh>
        </group>
      </group>
    </group>
  );

  const arm = (side: 1 | -1, sh: V3, el: number) => (
    <group position={[side * 0.17 * b, 0.4, 0]} rotation={sh}>
      <mesh material={m.top} castShadow>
        <sphereGeometry args={[0.052, 16, 12]} />
      </mesh>
      <Limb len={UA} rad={0.045} mat={look.shortSleeve ? m.skin : m.top} />
      {look.shortSleeve ? (
        <group>
          <mesh material={m.top} position={[0, -0.055, 0]} castShadow>
            <capsuleGeometry args={[0.056, 0.07, 8, 16]} />
          </mesh>
          <mesh material={m.trim} position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.055, 0.009, 8, 24]} />
          </mesh>
        </group>
      ) : null}
      <group position={[0, -UA, 0]} rotation={[el, 0, 0]}>
        <Limb len={FA} rad={0.038} mat={forearmMat} />
        <mesh material={m.skin} position={[0, -FA - 0.025, 0.005]} scale={[0.8, 1.1, 0.55]} castShadow>
          <sphereGeometry args={[0.048, 16, 12]} />
        </mesh>
        <mesh material={m.skin} position={[-side * 0.03, -FA - 0.008, 0.025]} rotation={[0.3, 0, side * 0.5]}>
          <capsuleGeometry args={[0.013, 0.026, 4, 8]} />
        </mesh>
      </group>
    </group>
  );

  const headRot = e(pose.head);
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <group position={[0, HIP + (pose.bob ?? 0), 0]}>
        <mesh material={m.bottom} scale={[1.02, 0.72, 0.8]} position={[0, 0.02, 0]} castShadow>
          <sphereGeometry args={[0.155, 24, 18]} />
        </mesh>
        {/* bel bandı */}
        <mesh material={m.trim} position={[0, 0.085, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.12, 0.78, 1]}>
          <torusGeometry args={[0.122, 0.014, 8, 40]} />
        </mesh>
        {leg(1, e(pose.hipL), pose.kneeL ?? 0)}
        {leg(-1, e(pose.hipR), pose.kneeR ?? 0)}
        <group rotation={e(pose.spine)}>
          <mesh geometry={torso} material={m.top} position={[0, 0.06, 0]} castShadow />
          {/* göğüste şerit */}
          <mesh material={m.trim} position={[0, 0.33, 0.004]} rotation={[Math.PI / 2, 0, 0]} scale={[1.12 * b, 0.74, 1]}>
            <torusGeometry args={[0.148, 0.012, 8, 48]} />
          </mesh>
          {arm(1, e(pose.shL), pose.elL ?? 0)}
          {arm(-1, e(pose.shR), pose.elR ?? 0)}
          <mesh material={m.trim} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 0.85, 1]}>
            <torusGeometry args={[0.058, 0.014, 10, 32]} />
          </mesh>
          <mesh material={m.skin} position={[0, 0.54, 0]}>
            <cylinderGeometry args={[0.042, 0.05, 0.1, 16]} />
          </mesh>
          <group position={[0, 0.545, 0]} rotation={headRot}>
            <group position={[0, r * 0.98, 0.01]}>
              <mesh geometry={head} material={m.skin} scale={[0.94, 1, 0.94]} castShadow />
              {/* kulaklar (saçın altında kalır) */}
              {[1, -1].map((s) => (
                <mesh key={s} material={m.skin} position={[s * r * 0.92, 0, 0]} scale={[0.45, 1, 0.7]}>
                  <sphereGeometry args={[r * 0.17, 16, 12]} />
                </mesh>
              ))}
              <FaceParts m={m} face={face} r={r} />
              <Hair look={look} mat={m.hair} r={r} t={t} headTurn={headRot[1]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

// ------------------------------------------------------------ adaylar (kız)

export const LOOKS: Record<string, Look> = {
  ada: {
    skin: "#f2c7a5",
    hair: "#5a3220",
    hairShine: "#ffcf9e",
    hairStyle: "long",
    top: "#ff8a7a",
    accent: "#ffffff",
    bottom: "#3d4a6b",
    shoe: "#ffffff",
    sole: "#ff8a7a",
    iris: "#7a4a22",
    lips: "#d9666f",
    shortSleeve: true,
  },
  mina: {
    skin: "#d9a07a",
    hair: "#17110f",
    hairShine: "#cfc4e8",
    hairStyle: "ponytail",
    top: "#a98bff",
    accent: "#2a1f4a",
    bottom: "#2a2d3e",
    shoe: "#f5f5f5",
    sole: "#a98bff",
    iris: "#4a2a12",
    lips: "#c25b67",
    shortSleeve: true,
  },
  zeynep: {
    skin: "#f7d6c0",
    hair: "#b5532a",
    hairShine: "#ffd2a0",
    hairStyle: "bun",
    top: "#3ccfa6",
    accent: "#ffffff",
    bottom: "#f2f2f2",
    shoe: "#2b3a55",
    sole: "#ffffff",
    iris: "#3e8a5a",
    lips: "#e0727a",
    shortSleeve: true,
    shorts: true,
  },
};
