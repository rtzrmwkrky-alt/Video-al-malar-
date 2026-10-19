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
  skin: "#d39b6d",
  sweater: "#f3a3a3",
  sweaterDark: "#d9797d",
  pants: "#2f6fd1",
  plaid: "#f2e6d0",
  beanie: "#2f6fd1",
  shoe: "#2f6fd1",
  sole: "#efe3cc",
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

/** örgü: dikey sütunlarda V ilmekler */
const knitTex = (base: string, dark: string, repeat: [number, number]) =>
  canvasTex(
    256,
    256,
    (c) => {
      c.fillStyle = base;
      c.fillRect(0, 0, 256, 256);
      c.strokeStyle = dark;
      c.lineWidth = 5;
      c.lineCap = "round";
      for (let col = 0; col < 8; col++) {
        for (let row = 0; row < 12; row++) {
          const x = col * 32;
          const y = row * 22;
          c.beginPath();
          c.moveTo(x + 3, y + 2);
          c.quadraticCurveTo(x + 10, y + 18, x + 16, y + 20);
          c.moveTo(x + 29, y + 2);
          c.quadraticCurveTo(x + 22, y + 18, x + 16, y + 20);
          c.stroke();
        }
      }
      fuzz(c, 256, 256, 0.12, 3);
    },
    repeat,
  );

const plaidTex = (a: string, b: string, repeat: [number, number]) =>
  canvasTex(
    256,
    256,
    (c) => {
      c.fillStyle = a;
      c.fillRect(0, 0, 256, 256);
      c.globalAlpha = 0.7;
      c.fillStyle = b;
      c.fillRect(0, 80, 256, 64);
      c.fillRect(80, 0, 64, 256);
      c.globalAlpha = 0.5;
      c.fillRect(0, 210, 256, 14);
      c.fillRect(210, 0, 14, 256);
      c.globalAlpha = 1;
      fuzz(c, 256, 256, 0.14, 7);
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
    const knit = knitTex(look.sweater, look.sweaterDark, [5, 4]);
    const knitArm = knitTex(look.sweater, look.sweaterDark, [3, 2]);
    const plaid = plaidTex(look.pants, look.plaid, [3, 3.2]);
    const rib = ribTex(look.beanie, [10, 1]);
    const sweaterRib = ribTex(look.sweater, [14, 1]);
    const pantsRib = ribTex(look.pants, [10, 1]);
    const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...o });
    return {
      skin: std({ color: look.skin, roughness: 0.6 }),
      sweater: std({ map: knit, bumpMap: knit, bumpScale: 2.5 }),
      sleeve: std({ map: knitArm, bumpMap: knitArm, bumpScale: 2.5 }),
      sweaterRib: std({ map: sweaterRib }),
      pants: std({ map: plaid, bumpMap: plaid, bumpScale: 0.8 }),
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

  const headY = 1.93;
  const nearZ = 0.27;
  const sh = V(0.0, 1.5, nearZ);
  const armNear = pose.armNear ?? { el: [0.06, 1.12, nearZ + 0.06] as [number, number, number], hand: [0.17, 0.98, nearZ - 0.02] as [number, number, number] };
  const armFar = { el: V(0.06, 1.12, -nearZ - 0.06), hand: V(0.17, 0.98, -nearZ + 0.02) };

  return (
    <group>
      {/* ayakkabılar */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0.06 + (s > 0 ? 0.06 : 0), 0, s * 0.12]}>
          <mesh position={[0.02, 0.04, 0]} scale={[1, 0.22, 0.48]} material={m.sole} castShadow>
            <sphereGeometry args={[0.185, 28, 16]} />
          </mesh>
          <mesh position={[0.02, 0.025, 0]} material={m.sole} castShadow>
            <cylinderGeometry args={[0.001, 0.001, 0.001, 4]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} scale={[1.7, 0.75, 0.95]} material={m.shoe} castShadow>
            <sphereGeometry args={[0.1, 24, 16]} />
          </mesh>
          <mesh position={[0.13, 0.085, 0]} scale={[1, 0.7, 1]} material={m.sole} castShadow>
            <sphereGeometry args={[0.075, 20, 14]} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0.02 + k * 0.035, 0.165 - k * 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.lace}>
              <cylinderGeometry args={[0.008, 0.008, 0.1, 8]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* pantolon */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0.05, 0, s * 0.12]}>
          <mesh position={[0, 0.55, 0]} material={m.pants} castShadow>
            <cylinderGeometry args={[0.15, 0.14, 0.78, 28]} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.pantsRib} castShadow>
            <torusGeometry args={[0.14, 0.045, 14, 32]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.05, 0.92, 0]} scale={[1, 0.6, 1.25]} material={m.pants}>
        <sphereGeometry args={[0.24, 24, 16]} />
      </mesh>

      {/* kazak */}
      <mesh position={[0.02, 1.22, 0]} scale={[0.92, 1, 1.05]} material={m.sweater} castShadow>
        <capsuleGeometry args={[0.29, 0.34, 10, 28]} />
      </mesh>
      <mesh position={[0.02, 0.9, 0]} scale={[0.92, 1, 1.05]} rotation={[Math.PI / 2, 0, 0]} material={m.sweaterRib} castShadow>
        <torusGeometry args={[0.26, 0.05, 14, 40]} />
      </mesh>
      {/* yaka */}
      <mesh position={[0.02, 1.64, 0]} material={m.sweaterRib} castShadow>
        <cylinderGeometry args={[0.085, 0.1, 0.09, 24]} />
      </mesh>

      {/* kollar (bol kollu) */}
      {[
        { el: V(...armNear.el), hand: V(...armNear.hand), s: 1 },
        { ...armFar, s: -1 },
      ].map((a, k) => (
        <group key={k}>
          <Limb a={V(sh.x, sh.y, a.s * Math.abs(sh.z))} b={a.el} r={0.115} mat={m.sleeve} />
          <Limb a={a.el} b={a.hand} r={0.1} mat={m.sleeve} />
          {pose.armNear && k === 0 ? (
            <mesh position={a.hand.clone().add(a.hand.clone().sub(a.el).normalize().multiplyScalar(0.11))} material={m.skin} castShadow>
              <sphereGeometry args={[0.06, 20, 16]} />
            </mesh>
          ) : null}
        </group>
      ))}

      {/* boyun */}
      <mesh position={[0.02, 1.73, 0]} material={m.skin} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.16, 18]} />
      </mesh>

      {/* baş */}
      <group position={[0.03, headY, 0]} rotation={[0, 0, -(pose.head ?? 0)]}>
        <mesh scale={[1, 1.15, 0.92]} material={m.skin} castShadow>
          <sphereGeometry args={[0.16, 48, 36]} />
        </mesh>
        {/* çene */}

        {/* burun */}
        <mesh position={[0.165, -0.01, 0]} scale={[1.5, 1, 0.9]} material={m.skin} castShadow>
          <sphereGeometry args={[0.035, 20, 16]} />
        </mesh>
        {/* kulaklar */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[-0.02, 0.0, s * 0.145]} scale={[0.7, 1, 0.5]} material={m.skin}>
            <sphereGeometry args={[0.04, 16, 12]} />
          </mesh>
        ))}
        {/* gözler */}
        {[-1, 1].map((s) => (
          <group key={s} position={[0.12, 0.03, s * 0.072]}>
            <mesh scale={[0.6, blink > 0.5 ? 0.15 : 1, 1]} material={m.white}>
              <sphereGeometry args={[0.03, 16, 12]} />
            </mesh>
            {blink > 0.5 ? null : (
              <mesh position={[0.016, 0.002, 0]} material={m.dark}>
                <sphereGeometry args={[0.017, 12, 10]} />
              </mesh>
            )}
            {/* kaş */}
            <mesh position={[0.008, 0.052, 0]} rotation={[Math.PI / 2, 0, 0.1]} material={m.dark}>
              <capsuleGeometry args={[0.008, 0.04, 4, 8]} />
            </mesh>
            {/* yanak */}
            <mesh position={[-0.005, -0.065, s * 0.02]} scale={[0.4, 0.7, 1]} material={m.blush}>
              <sphereGeometry args={[0.035, 16, 12]} />
            </mesh>
          </group>
        ))}
        {/* ağız */}
        {(() => {
          const arc = Math.PI * (0.4 + 0.4 * (pose.smile ?? 0.6));
          return (
            <group position={[0.15, -0.07, 0]} rotation={[0, Math.PI / 2, 0]}>
              <mesh rotation={[0, 0, -Math.PI / 2 - arc / 2]} material={m.dark}>
                <torusGeometry args={[0.024, 0.0065, 10, 24, arc]} />
              </mesh>
            </group>
          );
        })()}
        {/* bere (küçük, başın üstünde) */}
        <group position={[-0.015, 0.135, 0]} rotation={[0, 0, 0.12]}>
          <mesh scale={[1, 0.72, 1]} material={m.beanie} castShadow>
            <sphereGeometry args={[0.15, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={m.beanie} castShadow>
            <torusGeometry args={[0.148, 0.035, 14, 36]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
