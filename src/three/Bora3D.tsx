/**
 * Bora — 3B oyuncak/örgü figür (kullanıcının Pinterest görseli: uzun boyun, küçük bere, bol örgü kazak,
 * kareli geniş pantolon, krem burunlu spor ayakkabı). Basit geometriler + canvas dokuları (örgü, kareli, lastik).
 * Birim: metre, ayak tabanı y=0, yüz +x yönüne bakar.
 */
import { useMemo } from "react";
import * as THREE from "three";

export type Bora3DLook = {
  skin: string;
  sweater: string;
  sweaterDark: string;
  pants: string;
  plaid: string;
  beanie: string;
  shoe: string;
  sole: string;
};

export const BORA3D_ORGU: Bora3DLook = {
  skin: "#7d4b31",
  sweater: "#eaa49d",
  sweaterDark: "#c97a74",
  pants: "#2f6fd1",
  plaid: "#f2e6d0",
  beanie: "#1d5ad8",
  shoe: "#2f6fd1",
  sole: "#ffffff",
};

const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat: [number, number]) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

/** tüylü yün hissi için ince gürültü */
const fuzz = (c: CanvasRenderingContext2D, w: number, h: number, alpha: number, seed = 1) => {
  let s = seed * 9301;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < (w * h) / 6; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    c.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    c.fillRect(x, y, 1.5, 1.5);
  }
};

/** yün lifleri: kısa, kıvrık, yarı saydam açık/koyu çizgiler */
const fibers = (c: CanvasRenderingContext2D, w: number, h: number, n: number, light: string, dark: string, seed = 1) => {
  let s = seed * 7919;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  c.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const a = rnd() * Math.PI * 2;
    const L = 4 + rnd() * 10;
    c.strokeStyle = rnd() > 0.45 ? light : dark;
    c.lineWidth = 0.8 + rnd() * 0.9;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a + 0.8) * L * 0.6, y + Math.sin(a + 0.8) * L * 0.6, x + Math.cos(a) * L, y + Math.sin(a) * L);
    c.stroke();
  }
};

/** kalın örgü: sütunlarda iki eğik ilmekten oluşan V'ler, ilmek başına ışık/gölge + yün lifleri */
const knitTex = (base: string, dark: string, repeat: [number, number]) =>
  canvasTex(
    512,
    512,
    (c) => {
      c.fillStyle = dark;
      c.fillRect(0, 0, 512, 512);
      const cw = 64;
      const rh = 40;
      for (let col = 0; col < 8; col++) {
        for (let row = -1; row < 14; row++) {
          const x = col * cw + cw / 2;
          const y = row * rh + (col % 2) * 2;
          for (const side of [-1, 1]) {
            c.save();
            c.translate(x + side * 13, y + 22);
            c.rotate(side * -0.55);
            const g = c.createRadialGradient(-4, -8, 2, 0, 0, 26);
            g.addColorStop(0, "rgba(255,255,255,0.35)");
            g.addColorStop(0.35, base);
            g.addColorStop(1, dark);
            c.fillStyle = g;
            c.beginPath();
            c.ellipse(0, 0, 13, 25, 0, 0, Math.PI * 2);
            c.fill();
            // ilmek içi iplik çizgileri
            c.strokeStyle = "rgba(0,0,0,0.12)";
            c.lineWidth = 1.2;
            for (let k = -2; k <= 2; k++) {
              c.beginPath();
              c.moveTo(k * 4, -20);
              c.quadraticCurveTo(k * 5, 0, k * 4, 20);
              c.stroke();
            }
            c.restore();
          }
        }
      }
      fibers(c, 512, 512, 2600, "rgba(255,240,236,0.35)", "rgba(120,50,50,0.25)", 3);
    },
    repeat,
  );

/** kareli yün kumaş: dokuma çizgileri + lifler */
const plaidTex = (a: string, b: string, repeat: [number, number]) =>
  canvasTex(
    512,
    512,
    (c) => {
      c.fillStyle = b;
      c.fillRect(0, 0, 512, 512);
      c.fillStyle = a;
      c.globalAlpha = 0.65;
      c.fillRect(0, 0, 512, 256);
      c.fillRect(0, 0, 256, 512);
      c.globalAlpha = 1;
      c.fillStyle = a;
      c.fillRect(0, 0, 256, 256);
      // dokuma (çapraz ince çizgiler)
      c.strokeStyle = "rgba(255,255,255,0.12)";
      c.lineWidth = 2;
      for (let k = -512; k < 512; k += 7) {
        c.beginPath();
        c.moveTo(k, 0);
        c.lineTo(k + 512, 512);
        c.stroke();
      }
      c.strokeStyle = "rgba(0,0,0,0.1)";
      for (let k = -512; k < 512; k += 9) {
        c.beginPath();
        c.moveTo(k + 512, 0);
        c.lineTo(k, 512);
        c.stroke();
      }
      fibers(c, 512, 512, 2200, "rgba(255,255,255,0.3)", "rgba(10,30,90,0.25)", 7);
    },
    repeat,
  );

const ribTex = (base: string, repeat: [number, number]) =>
  canvasTex(
    128,
    64,
    (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 128, 64);
      c.fillStyle = "rgba(0,0,0,0.22)";
      for (let x = 0; x < 128; x += 16) c.fillRect(x, 0, 6, 64);
      fuzz(c, 128, 64, 0.12, 5);
    },
    repeat,
  );

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** a→b arasında kapsül (uzuv) */
const Limb: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; r: number; mat: THREE.Material }> = ({ a, b, r, mat }) => {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
  return (
    <mesh position={mid} quaternion={q} material={mat} castShadow>
      <capsuleGeometry args={[r, len, 8, 20]} />
    </mesh>
  );
};

export type Bora3DPose = {
  /** her kol için dirsek ve el (yerel); verilmezse eller cepte */
  armNear?: { el: [number, number, number]; hand: [number, number, number] };
  /** baş eğimi (radyan, + öne) */
  head?: number;
  smile?: number;
};

export const Bora3D: React.FC<{ look?: Bora3DLook; pose?: Bora3DPose; blink?: number }> = ({ look = BORA3D_ORGU, pose = {}, blink = 0 }) => {
  const m = useMemo(() => {
    const knit = knitTex(look.sweater, look.sweaterDark, [3.2, 2.2]);
    const knitArm = knitTex(look.sweater, look.sweaterDark, [2, 1.2]);
    const plaid = plaidTex(look.pants, look.plaid, [3.2, 3.6]);
    const rib = ribTex(look.beanie, [10, 1]);
    const sweaterRib = ribTex(look.sweater, [14, 1]);
    const pantsRib = ribTex(look.pants, [10, 1]);
    const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...o });
    return {
      skin: std({ color: look.skin, roughness: 0.55 }),
      sweater: std({ map: knit, bumpMap: knit, bumpScale: 6, roughness: 1 }),
      sleeve: std({ map: knitArm, bumpMap: knitArm, bumpScale: 6, roughness: 1 }),
      sweaterRib: std({ map: sweaterRib }),
      pants: std({ map: plaid, bumpMap: plaid, bumpScale: 1.5, roughness: 1 }),
      pantsRib: std({ map: pantsRib }),
      beanie: std({ map: rib, bumpMap: rib, bumpScale: 2 }),
      shoe: std({ color: look.shoe, roughness: 0.8 }),
      sole: std({ color: look.sole, roughness: 0.85 }),
      white: std({ color: "#fbf7f0", roughness: 0.3 }),
      dark: std({ color: "#1b120d", roughness: 0.3 }),
      blush: new THREE.MeshStandardMaterial({ color: "#ff7a7a", transparent: true, opacity: 0.35, roughness: 1 }),
      lace: std({ color: "#ffffff", roughness: 0.7 }),
    };
  }, [look]);

  const headY = 2.19;
  const nearZ = 0.24;
  const sh = V(0.0, 1.55, nearZ);
  const armNear = pose.armNear ?? { el: [-0.05, 1.24, nearZ + 0.08] as [number, number, number], hand: [0.1, 1.06, nearZ - 0.01] as [number, number, number] };
  const armFar = { el: V(-0.05, 1.24, -nearZ - 0.08), hand: V(0.1, 1.06, -nearZ + 0.01) };
  // bol, kutumsu kazak: yandan profil (yarıçap, yükseklik)
  const sweaterGeo = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0.0, 1.01],
          [0.235, 1.01],
          [0.265, 1.05],
          [0.28, 1.15],
          [0.285, 1.3],
          [0.275, 1.45],
          [0.24, 1.55],
          [0.17, 1.61],
          [0.09, 1.64],
          [0.0, 1.645],
        ].map(([r, y]) => new THREE.Vector2(r, y)),
        48,
      ),
    [],
  );
  // geniş paçalı pantolon bacağı (hafif genişleyen)
  const legGeo = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0.0, 0.24],
          [0.142, 0.24],
          [0.138, 0.55],
          [0.13, 0.85],
          [0.122, 1.04],
          [0.0, 1.05],
        ].map(([r, y]) => new THREE.Vector2(r, y)),
        36,
      ),
    [],
  );

  return (
    <group>
      {/* tıknaz spor ayakkabılar (kalın krem taban, krem burun) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s > 0 ? 0.1 : -0.02, 0, s * 0.12]}>
          <mesh position={[0.02, 0.045, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1.9]} material={m.sole} castShadow>
            <capsuleGeometry args={[0.045, 0.27, 8, 20]} />
          </mesh>
          <mesh position={[-0.01, 0.13, 0]} scale={[1.75, 0.85, 0.95]} material={m.shoe} castShadow>
            <sphereGeometry args={[0.1, 28, 18]} />
          </mesh>
          <mesh position={[0.15, 0.1, 0]} scale={[0.9, 0.62, 0.92]} material={m.sole} castShadow>
            <sphereGeometry args={[0.08, 22, 14]} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0.0 + k * 0.035, 0.205 - k * 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.lace}>
              <cylinderGeometry args={[0.008, 0.008, 0.11, 8]} />
            </mesh>
          ))}
          {/* bilek */}
          <mesh position={[-0.02, 0.22, 0]} material={m.skin}>
            <cylinderGeometry args={[0.045, 0.05, 0.08, 14]} />
          </mesh>
        </group>
      ))}

      {/* pantolon: uzun, geniş paçalı, hafif açık duruş */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s > 0 ? 0.05 : 0.0, 0, s * 0.1]} rotation={[s * 0.035, 0, s > 0 ? -0.04 : 0.02]}>
          <mesh geometry={legGeo} material={m.pants} castShadow />
          <mesh position={[0, 0.27, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.pantsRib} castShadow>
            <torusGeometry args={[0.14, 0.045, 14, 32]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.03, 1.02, 0]} scale={[0.9, 0.45, 1.05]} material={m.pants}>
        <sphereGeometry args={[0.24, 24, 16]} />
      </mesh>

      {/* kazak */}
      <mesh geometry={sweaterGeo} position={[0.02, 0, 0]} scale={[0.95, 1, 1.05]} material={m.sweater} castShadow />
      <mesh position={[0.02, 1.03, 0]} scale={[0.95, 1, 1.05]} rotation={[Math.PI / 2, 0, 0]} material={m.sweaterRib} castShadow>
        <torusGeometry args={[0.245, 0.045, 14, 40]} />
      </mesh>
      {/* boğazlı yaka */}
      <mesh position={[0.02, 1.67, 0]} material={m.sweaterRib} castShadow>
        <cylinderGeometry args={[0.075, 0.095, 0.1, 24]} />
      </mesh>

      {/* kollar (bol, düşük omuzlu) */}
      {[
        { el: V(...armNear.el), hand: V(...armNear.hand), s: 1 },
        { ...armFar, s: -1 },
      ].map((a, k) => (
        <group key={k}>
          <Limb a={V(sh.x, sh.y, a.s * Math.abs(sh.z))} b={a.el} r={0.125} mat={m.sleeve} />
          <Limb a={a.el} b={a.hand} r={0.112} mat={m.sleeve} />
          {pose.armNear && k === 0 ? (
            <mesh position={a.hand.clone().add(a.hand.clone().sub(a.el).normalize().multiplyScalar(0.11))} material={m.skin} castShadow>
              <sphereGeometry args={[0.055, 20, 16]} />
            </mesh>
          ) : null}
        </group>
      ))}

      {/* boyun */}
      <mesh position={[0.02, 1.87, 0]} material={m.skin} castShadow>
        <cylinderGeometry args={[0.034, 0.04, 0.34, 18]} />
      </mesh>

      {/* baş */}
      <group position={[0.03, headY, 0]} rotation={[0, 0, -(pose.head ?? 0)]}>
        <mesh scale={[0.92, 1.3, 0.85]} material={m.skin} castShadow>
          <sphereGeometry args={[0.15, 48, 36]} />
        </mesh>
        {/* çene */}

        {/* burun */}
        <mesh position={[0.142, -0.01, 0]} scale={[1.45, 1.05, 1]} material={m.skin} castShadow>
          <sphereGeometry args={[0.035, 20, 16]} />
        </mesh>
        {/* kulaklar */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[-0.02, 0.0, s * 0.125]} scale={[0.7, 1, 0.5]} material={m.skin}>
            <sphereGeometry args={[0.04, 16, 12]} />
          </mesh>
        ))}
        {/* gözler */}
        {[-1, 1].map((s) => (
          <group key={s} position={[0.11, 0.05, s * 0.06]}>
            <mesh scale={[0.6, blink > 0.5 ? 0.15 : 1, 1]} material={m.white}>
              <sphereGeometry args={[0.021, 16, 12]} />
            </mesh>
            {blink > 0.5 ? null : (
              <mesh position={[0.016, 0.002, 0]} material={m.dark}>
                <sphereGeometry args={[0.012, 12, 10]} />
              </mesh>
            )}
            {/* kaş */}
            <mesh position={[0.004, 0.04, 0]} rotation={[Math.PI / 2, 0, 0.05]} material={m.dark} visible={false}>
              <capsuleGeometry args={[0.008, 0.04, 4, 8]} />
            </mesh>
            {/* yanak */}
            <mesh position={[-0.005, -0.065, s * 0.02]} scale={[0.4, 0.7, 1]} material={m.blush} visible={false}>
              <sphereGeometry args={[0.035, 16, 12]} />
            </mesh>
          </group>
        ))}
        {/* ağız */}
        {(() => {
          const arc = Math.PI * (0.3 + 0.4 * (pose.smile ?? 0.15));
          return (
            <group position={[0.128, -0.085, 0]} rotation={[0, Math.PI / 2, 0]}>
              <mesh rotation={[0, 0, -Math.PI / 2 - arc / 2]} material={m.dark}>
                <torusGeometry args={[0.024, 0.0065, 10, 24, arc]} />
              </mesh>
            </group>
          );
        })()}
        {/* bere (küçük, başın üstünde) */}
        <group position={[-0.01, 0.14, 0]} rotation={[0, 0, 0.15]}>
          <mesh scale={[0.95, 0.75, 0.88]} material={m.beanie} castShadow>
            <sphereGeometry args={[0.145, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={m.beanie} castShadow>
            <torusGeometry args={[0.135, 0.03, 14, 36]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
