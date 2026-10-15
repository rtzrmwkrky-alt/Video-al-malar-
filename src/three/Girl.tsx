/**
 * Kız karakter: Michelle modeli (three.js örneği) temel alınır, kulaklık ve gözlük çıkarılır,
 * Xbot'un animasyonları dünya uzayında doğru yeniden hedeflenir (kollar bozulmaz).
 *
 * Parça etiketleri (üçgen başına) public/models/michelle-labels.txt içinde:
 *   0 gövde+baş, 2 kulaklık, 3 saç, 4 gözlük camı, 5 gözlük çerçevesi, 6 göz küresi, 7 gözlük parçaları, 8 ayakkabı
 */
import { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Clip } from "./Character";

export const useLabels = () => {
  const [labels, setLabels] = useState<Uint8Array | null>(null);
  const [handle] = useState(() => delayRender("Parça etiketleri"));
  useEffect(() => {
    fetch(staticFile("models/michelle-labels.txt"))
      .then((r) => r.text())
      .then((b64) => {
        const bin = atob(b64.trim());
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        setLabels(arr);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
  return labels;
};

/** Gizlenecek parçalar (9: iki yandaki saç topuzları) */
const HIDE = [2, 4, 5, 7];

export type GirlLook = {
  skin?: string;
  hair: string;
  /** verilmezse orijinal renk kalır */
  top?: string;
  bottom?: string;
  shoe?: string;
  accent?: string;
  style: "puffs" | "ponytail" | "bun" | "long" | "straight";
  /** gözlük ve kulaklık kalsın (fotoğraftaki gibi) */
  accessories?: boolean;
  /** iris rengi: verilirse gözler yeniden yapılır (daha açık göz kapağı, belirgin kirpik) */
  eyes?: string;
  /** dudak rengi */
  lips?: string;
  /** küpe, kolye, bileklik */
  jewelry?: boolean;
};

/** Kullanıcının seçtiği kız: beyaz ten, kumral düz saç, belirgin gözler, altın takılar */
export const KIZ: GirlLook = { skin: "#f3cdb2", hair: "#7f5a3e", style: "straight", eyes: "#6b4423", jewelry: true };

export const useImage = (file: string) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [handle] = useState(() => delayRender(`Görsel: ${file}`));
  useEffect(() => {
    const im = new Image();
    im.onload = () => {
      setImg(im);
      continueRender(handle);
    };
    im.onerror = () => continueRender(handle);
    im.src = staticFile(file);
  }, [file, handle]);
  return img;
};

const SKIN_REF = [92, 59, 38];

/** Dokuyu yeniden boyar: ten, saç, üst, alt, ayakkabı (UV parça haritasına göre). */
const recolor = (src: HTMLImageElement | ImageBitmap, uvl: HTMLImageElement, look: GirlLook) => {
  const W = 1024;
  const cv = document.createElement("canvas");
  cv.width = cv.height = W;
  const c = cv.getContext("2d")!;
  c.drawImage(src as CanvasImageSource, 0, 0, W, W);
  const img = c.getImageData(0, 0, W, W);
  const lc = document.createElement("canvas");
  lc.width = lc.height = W;
  const l2 = lc.getContext("2d")!;
  l2.imageSmoothingEnabled = false;
  l2.drawImage(uvl, 0, 0, W, W);
  const lab = l2.getImageData(0, 0, W, W).data;
  const col = (h: string) => {
    const k = new THREE.Color(h);
    return [k.r * 255, k.g * 255, k.b * 255];
  };
  // sRGB değerleri (getStyle ile)
  const cs = (h: string) => {
    const m = new THREE.Color(h).getHexString();
    return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
  };
  void col;
  const skin = look.skin ? cs(look.skin) : SKIN_REF;
  const hair = cs(look.hair);
  const top = look.top ? cs(look.top) : null;
  const bottom = look.bottom ? cs(look.bottom) : null;
  const shoe = look.shoe ? cs(look.shoe) : null;
  const accent = look.accent ? cs(look.accent) : null;
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const L = lab[i];
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const v = mx / 255;
    const s = mx === 0 ? 0 : (mx - mn) / mx;
    let h = 0;
    if (mx !== mn) {
      if (mx === r) h = ((g - b) / (mx - mn) + 6) % 6;
      else if (mx === g) h = (b - r) / (mx - mn) + 2;
      else h = (r - g) / (mx - mn) + 4;
      h /= 6;
    }
    let out: number[] | null = null;
    if (L === 0) {
      if (h > 0.01 && h < 0.11 && s > 0.25 && v > 0.06 && v < 0.92) {
        // koyu gölgeleri (eski gözlük izi) yumuşat: kontrastı sıkıştır
        const k = Math.pow(v / 0.36, 0.5);
        out = skin.map((x) => x * k);
        // kaş ve kapak çizgileri: koyu ten pikselleri saç rengine (kaş) yaklaşır
        if (v < 0.3) {
          const w = Math.min(1, (0.3 - v) / 0.07);
          out = out.map((x, n) => x * (1 - w) + hair[n] * 0.85 * w);
        }
      } else if (h >= 0.11 && h < 0.2 && s > 0.3) {
        const k = v / 0.92;
        if (bottom) out = bottom.map((x) => x * k);
      } else if (h > 0.42 && h < 0.6 && s > 0.3) {
        const k = v / 0.8;
        if (accent) out = accent.map((x) => x * k);
      } else if (s < 0.22 && v > 0.28) {
        const k = v / 0.55;
        if (top) out = top.map((x) => x * k);
      }
    } else if (L === 10) {
      // yüz: boyalı gölgeleri düzleştir (eski gözlük izi), kirpik/göz çizgisi koyu kalsın
      if (v < 0.13 && s < 0.7 && !look.eyes) {
        out = hair.map((x) => x * 0.35);
      } else if ((h > 0.9 || h < 0.01) && s > 0.45) {
        // boyalı dudak yerine ten (3B dudak ayrıca eklenir)
        out = skin.map((x, n) => x * (n === 0 ? 1.0 : 0.94));
      } else {
        const k = Math.min(1.1, Math.max(0.93, Math.pow(v / 0.29, 0.3)));
        out = skin.map((x) => x * k);
      }
    } else if (L === 3 || L === 9) {
      const lum = (r + g + b) / 3;
      const k = 0.35 + lum / 60;
      out = hair.map((x) => x * k);
    } else if (L === 8) {
      if (v < 0.35) {
        const k = 0.4 + v * 1.8;
        if (shoe) out = shoe.map((x) => x * k);
      } else if (h > 0.42 && h < 0.6 && s > 0.3 && accent) out = accent.map((x) => x * v);
    }
    if (out) {
      d[i] = Math.min(255, out[0]);
      d[i + 1] = Math.min(255, out[1]);
      d[i + 2] = Math.min(255, out[2]);
    }
  }
  c.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.flipY = false;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

// ------------------------------------------------------------ eklenen saç (model uzayı, metre)

const tube = (pts: [number, number, number][], r0: number, r1: number) => {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const tub = 40;
  const rad = 14;
  const g = new THREE.TubeGeometry(curve, tub, 1, rad, false);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i <= tub; i++) {
    const u = i / tub;
    const c = curve.getPointAt(u);
    const rr = r0 + (r1 - r0) * Math.pow(u, 1.3);
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      const v = new THREE.Vector3(pos.getX(k), pos.getY(k), pos.getZ(k)).sub(c).multiplyScalar(rr);
      pos.setXYZ(k, c.x + v.x, c.y + v.y, c.z + v.z);
    }
  }
  g.computeVertexNormals();
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(g));
  const cap0 = new THREE.Mesh(new THREE.SphereGeometry(r0 * 0.99, 18, 12));
  cap0.position.copy(curve.getPointAt(0));
  const cap1 = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.002, r1 * 0.99), 14, 10));
  cap1.position.copy(curve.getPointAt(1));
  grp.add(cap0, cap1);
  return grp;
};

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Göz dokusu: beyaz zemin + degrade iris + halka + göz bebeği (küre UV'sine göre). */
const eyeTexture = (iris: string) => {
  const W = 1024;
  const H = 512;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#f7f3f0";
  c.fillRect(0, 0, W, H);
  const cx = W / 2;
  const cy = H / 2;
  const R = 150;
  const base = new THREE.Color(iris);
  const g = c.createRadialGradient(cx, cy + R * 0.3, R * 0.1, cx, cy, R);
  g.addColorStop(0, base.clone().lerp(new THREE.Color("#ffffff"), 0.5).getStyle());
  g.addColorStop(0.5, base.getStyle());
  g.addColorStop(1, base.clone().multiplyScalar(0.4).getStyle());
  c.fillStyle = g;
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "rgba(0,0,0,0.13)";
  c.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * R * 0.42, cy + Math.sin(a) * R * 0.42);
    c.lineTo(cx + Math.cos(a) * R * 0.94, cy + Math.sin(a) * R * 0.94);
    c.stroke();
  }
  c.strokeStyle = "rgba(15,8,4,0.85)";
  c.lineWidth = 12;
  c.beginPath();
  c.arc(cx, cy, R - 6, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = "#070505";
  c.beginPath();
  c.arc(cx, cy, R * 0.42, 0, Math.PI * 2);
  c.fill();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

/** Göz merkezleri (model uzayı, metre) */
const EYE_C: [number, number, number][] = [
  [0.0416, 1.4495, 0.0505],
  [-0.0416, 1.4495, 0.0505],
];
const EYE_R = 0.0222;

/** Göz kapağı açıklığını büyüt: göz çevresindeki deri noktalarını dikeyde göz merkezinden uzaklaştır */
const openLids = (g: THREE.BufferGeometry, labels: Uint8Array) => {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const idx = g.index!.array;
  const isSkin = new Uint8Array(pos.count);
  for (let t = 0; t < idx.length / 3; t++) {
    if ((labels[t] ?? 0) !== 0) continue;
    isSkin[idx[t * 3]] = isSkin[idx[t * 3 + 1]] = isSkin[idx[t * 3 + 2]] = 1;
  }
  for (let i = 0; i < pos.count; i++) {
    if (!isSkin[i]) continue;
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (z < 0.03) continue;
    for (const [cx, cy] of EYE_C) {
      const dx = (x - cx) / 0.03;
      const dy = y - cy;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 0.022) continue;
      const fall = (1 - dx * dx) * (1 - Math.abs(dy) / 0.022);
      // üst kapak daha çok açılır
      const f = dy > 0 ? 0.0055 : 0.0025;
      pos.setY(i, y + Math.sign(dy) * f * fall);
    }
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
};

/** Gözler + kirpikler + eyeliner (baş kemiğine bağlanacak, model uzayı) */
const buildEyes = (iris: string) => {
  const grp = new THREE.Group();
  const eyeMat = new THREE.MeshPhysicalMaterial({ map: eyeTexture(iris), roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 });
  const lash = new THREE.MeshStandardMaterial({ color: "#120b0a", roughness: 0.55 });
  const shine = new THREE.MeshBasicMaterial({ color: "#ffffff" });
  for (const [i, c] of EYE_C.entries()) {
    const side = i === 0 ? 1 : -1;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(EYE_R, 48, 32), eyeMat);
    eye.rotation.y = -Math.PI / 2 + side * 0.12;
    eye.position.set(...c);
    grp.add(eye);
    // parıltı
    const sp = new THREE.Mesh(new THREE.SphereGeometry(EYE_R * 0.085, 10, 8), shine);
    sp.position.set(c[0] + EYE_R * 0.25, c[1] + EYE_R * 0.3, c[2] + EYE_R * 0.96);
    grp.add(sp);
    // üst kirpik çizgisi (kapak kenarında yay)
    const dy = 0.0118;
    const ring = Math.sqrt(EYE_R * EYE_R - dy * dy) + 0.0036;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(ring, 0.0024, 8, 40, Math.PI * 0.97), lash);
    arc.rotation.set(Math.PI / 2 + 0.06, 0, Math.PI * 0.025);
    arc.position.set(c[0], c[1] + dy, c[2]);
    grp.add(arc);
    // kirpik telleri: dış yarıda yukarı-dışa kıvrık
    for (let k = 0; k < 11; k++) {
      const u = 0.08 + k * 0.085; // 0 iç köşe … 1 dış köşe
      const a = side > 0 ? Math.PI * (0.5 - u * 0.5) : Math.PI * (0.5 + u * 0.5);
      const px = c[0] + Math.cos(a) * ring;
      const pz = c[2] + Math.sin(a) * ring;
      const len = 0.0045 + u * 0.0045;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.0011, len, 6), lash);
      cone.position.set(px + side * u * 0.0015, c[1] + dy + len * 0.45, pz + 0.001);
      cone.rotation.set(0.5, 0, -side * (0.25 + u * 0.7));
      grp.add(cone);
    }
    // eyeliner kanadı
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.002, 0.009, 6), lash);
    wing.position.set(c[0] + side * (ring + 0.002), c[1] + dy - 0.001, c[2] + 0.004);
    wing.rotation.set(0, 0, -side * 1.15);
    grp.add(wing);
    // alt kirpik (ince)
    const low = new THREE.Mesh(new THREE.TorusGeometry(Math.sqrt(EYE_R * EYE_R - 0.0095 * 0.0095) + 0.0008, 0.0007, 6, 32, Math.PI * 0.8), lash);
    low.rotation.set(Math.PI / 2 - 0.3, 0, Math.PI * 0.1);
    low.position.set(c[0], c[1] - 0.0095, c[2]);
    grp.add(low);
  }
  return grp;
};

/** 3B dudaklar (boyalı dudağın yerine, pürüzsüz) */
const buildLips = (color: string) => {
  const grp = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25, sheen: 0.3 });
  for (const s of [1, -1]) {
    const up = tube(
      [
        [0, 1.4012, 0.1004],
        [s * 0.009, 1.4008, 0.0985],
        [s * 0.0175, 1.3988, 0.0935],
      ],
      0.0036,
      0.0012,
    );
    const low = tube(
      [
        [0, 1.3958, 0.1004],
        [s * 0.009, 1.3962, 0.0982],
        [s * 0.0165, 1.3984, 0.0935],
      ],
      0.0043,
      0.0012,
    );
    [up, low].forEach((g) =>
      g.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = mat;
      }),
    );
    grp.add(up, low);
  }
  return grp;
};

/** Takılar: altın küpeler (baş), kolye (göğüs) */
const gold = () => new THREE.MeshPhysicalMaterial({ color: "#e8b94a", metalness: 1, roughness: 0.22, clearcoat: 0.6 });
const buildEarrings = () => {
  const grp = new THREE.Group();
  const m = gold();
  for (const s of [1, -1]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0017, 10, 32), m);
    hoop.position.set(s * 0.1, 1.398, -0.018);
    hoop.rotation.y = Math.PI / 2;
    grp.add(hoop);
    const stud = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 12, 8), m);
    stud.position.set(s * 0.1, 1.41, -0.018);
    grp.add(stud);
  }
  return grp;
};
const buildNecklace = () => {
  const grp = new THREE.Group();
  const m = gold();
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.0012, 8, 64), m);
  chain.rotation.x = Math.PI / 2 + 0.38;
  chain.position.set(0, 1.315, -0.004);
  chain.scale.set(1.05, 0.95, 1);
  grp.add(chain);
  const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.007, 0), m);
  pendant.scale.set(0.8, 1.2, 0.5);
  pendant.position.set(0, 1.293, 0.043);
  grp.add(pendant);
  return grp;
};

/** Saç parçaları: sabit kısım + sallanan kısım (kuyruk) ayrı döndürülür */
const buildHair = (style: GirlLook["style"], mat: THREE.Material) => {
  const fixed = new THREE.Group();
  const swing = new THREE.Group();
  const pivot = new THREE.Vector3();
  // kaşlar (yüz dokusu düzleştirildiği için ayrıca çizilir)
  for (const s of [1, -1]) {
    const brow = tube(
      [
        [s * 0.016, 1.494, 0.0925],
        [s * 0.04, 1.505, 0.0905],
        [s * 0.066, 1.499, 0.081],
      ],
      0.0042,
      0.0022,
    );
    brow.scale.set(1, 0.75, 0.6);
    brow.position.set(0, 1.5 * 0.25, 0.035);
    fixed.add(brow);
  }
  if (style === "ponytail") {
    pivot.set(0, 1.565, -0.15);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.01, 10, 24));
    tie.position.set(0, 1.565, -0.16);
    tie.rotation.x = 1.1;
    fixed.add(tie);
    swing.add(
      tube(
        [
          [0, 1.57, -0.16],
          [0, 1.54, -0.215],
          [0, 1.43, -0.235],
          [0.008, 1.31, -0.215],
          [0.02, 1.2, -0.18],
        ],
        0.036,
        0.01,
      ),
    );
  } else if (style === "bun") {
    pivot.set(0, 1.58, -0.1);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.026 + rnd(i) * 0.008, 18, 12));
      m.position.set(Math.cos(a) * 0.032, 1.6 + (rnd(i + 5) - 0.3) * 0.02, -0.1 + Math.sin(a) * 0.032);
      fixed.add(m);
    }
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.04, 24, 16));
    top.position.set(0, 1.618, -0.1);
    fixed.add(top);
  } else if (style === "straight") {
    // düz, uzun saç: sırta dökülen yumuşak kabuk + yüzü çerçeveleyen düz perdeler
    pivot.set(0, 1.52, -0.06);
    const backGeo = new THREE.CylinderGeometry(0.112, 0.125, 0.34, 40, 8, true, Math.PI * 0.4, Math.PI * 1.2);
    const back = new THREE.Mesh(backGeo);
    back.position.set(0, 1.36, -0.035);
    back.scale.set(1, 1, 0.95);
    swing.add(back);
    // kabuğun kalınlığı (içten bakınca boş görünmesin)
    const inner = new THREE.Mesh(backGeo.clone().scale(0.93, 1, 0.93));
    inner.position.copy(back.position);
    inner.scale.copy(back.scale);
    swing.add(inner);
    for (const s of [1, -1]) {
      const curtain = tube(
        [
          [s * 0.097, 1.52, -0.02],
          [s * 0.106, 1.42, -0.02],
          [s * 0.11, 1.32, -0.015],
          [s * 0.112, 1.21, -0.01],
        ],
        0.02,
        0.012,
      );
      curtain.scale.set(1, 1, 0.75);
      swing.add(curtain);
    }
  } else if (style === "long") {
    pivot.set(0, 1.5, -0.1);
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.2, 12, 24));
    back.scale.set(1.12, 1, 0.5);
    back.position.set(0, 1.33, -0.135);
    swing.add(back);
    for (const s of [1, -1]) {
      swing.add(
        tube(
          [
            [s * 0.1, 1.5, -0.075],
            [s * 0.112, 1.38, -0.085],
            [s * 0.108, 1.26, -0.08],
            [s * 0.1, 1.17, -0.07],
          ],
          0.03,
          0.012,
        ),
      );
    }
  }
  [fixed, swing].forEach((g) =>
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.material = mat;
        m.castShadow = true;
      }
    }),
  );
  return { fixed, swing, pivot };
};

/** Kök nesneye göre (model uzayı) dönüş: sahnedeki konumdan bağımsız */
const modelQ = (o: THREE.Object3D, root: THREE.Object3D) => {
  const q = new THREE.Quaternion();
  let n: THREE.Object3D | null = o;
  while (n && n !== root) {
    q.premultiply(n.quaternion);
    n = n.parent;
  }
  return q;
};

const bones = (root: THREE.Object3D) => {
  const out: THREE.Bone[] = [];
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) out.push(o as THREE.Bone);
  });
  return out; // traverse sırası: ebeveyn önce
};

export const Girl: React.FC<{
  gltf: GLTF;
  anim: GLTF;
  labels: Uint8Array;
  clips: Clip[];
  position?: [number, number, number];
  rotationY?: number;
  inPlace?: boolean;
  look?: GirlLook;
  uvLabels?: HTMLImageElement | null;
}> = ({ gltf, anim, labels, clips, position = [0, 0, 0], rotationY = 0, inPlace = true, look, uvLabels }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hideSet = useMemo(
    () =>
      new Set([...(look?.accessories ? [] : HIDE), ...(look && look.style !== "puffs" ? [9] : []), ...(look?.eyes ? [6] : [])]),
    [look],
  );

  // hedef model: parçalara ayrılmış, gizlenecekler görünmez malzemede
  const dst = useMemo(() => {
    const root = cloneSkinned(gltf.scene);
    root.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (!m.isSkinnedMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      const g = m.geometry.clone();
      const idx = g.index!.array;
      const tris = idx.length / 3;
      const order: number[][] = Array.from({ length: 16 }, () => []);
      for (let t = 0; t < tris; t++) order[labels[t] ?? 0].push(t);
      const out = new Uint32Array(idx.length);
      let k = 0;
      g.clearGroups();
      order.forEach((list, lab) => {
        if (!list.length) return;
        const start = k;
        for (const t of list) {
          out[k++] = idx[t * 3];
          out[k++] = idx[t * 3 + 1];
          out[k++] = idx[t * 3 + 2];
        }
        g.addGroup(start, k - start, lab);
      });
      g.setIndex(new THREE.BufferAttribute(out, 1));
      if (look?.eyes) {
        // etiketler sıralı indekse göre değil, orijinal üçgen sırasına göre: önce orijinal indeksle aç
        const tmp = m.geometry.clone();
        openLids(tmp, labels);
        g.setAttribute("position", tmp.attributes.position);
        g.setAttribute("normal", tmp.attributes.normal);
      }
      m.geometry = g;
      const base = (m.material as THREE.MeshStandardMaterial).clone();
      base.metalness = 0;
      if (look && uvLabels && base.map?.image) {
        base.map = recolor(base.map.image as HTMLImageElement, uvLabels, look);
      }
      const hidden = new THREE.MeshBasicMaterial({ visible: false });
      m.material = Array.from({ length: 16 }, (_, lab) => (hideSet.has(lab) ? hidden : base));
    });
    // dinlenme pozu: modelin kendi T-poz klibi varsa onu uygula
    const tpose = gltf.animations.find((a) => /tpose/i.test(a.name));
    if (tpose) {
      const mx = new THREE.AnimationMixer(root);
      mx.clipAction(tpose).play();
      mx.update(0);
      mx.stopAllAction();
    }
    return root;
  }, [gltf, labels, hideSet, look, uvLabels]);

  // eklenen saç: baş kemiğine bağlanır (dinlenme pozunda model uzayında tasarlandı)
  const hair = useMemo(() => {
    if (!look || look.style === "puffs") return null;
    const mat = new THREE.MeshPhysicalMaterial({
      color: look.hair,
      roughness: 0.42,
      side: THREE.DoubleSide,
      sheen: 0.4,
      sheenColor: new THREE.Color("#ffe0c0"),
      sheenRoughness: 0.4,
      clearcoat: 0.2,
    });
    const h = buildHair(look.style, mat);
    const head = dst.getObjectByName("mixamorigHead")!;
    dst.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(dst.matrixWorld).invert().multiply(head.matrixWorld).invert();
    // sabit kısım
    h.fixed.applyMatrix4(inv);
    head.add(h.fixed);
    // sallanan kısım: pivot etrafında dönen ara grup
    const pivotGroup = new THREE.Group();
    pivotGroup.position.copy(h.pivot);
    h.swing.position.sub(h.pivot);
    pivotGroup.add(h.swing);
    const holder = new THREE.Group();
    holder.add(pivotGroup);
    holder.applyMatrix4(inv);
    head.add(holder);
    const attach = (boneName: string, obj: THREE.Object3D) => {
      const bone = dst.getObjectByName(boneName);
      if (!bone) return;
      const m = new THREE.Matrix4().copy(dst.matrixWorld).invert().multiply(bone.matrixWorld).invert();
      obj.applyMatrix4(m);
      bone.add(obj);
    };
    if (look.eyes) {
      attach("mixamorigHead", buildEyes(look.eyes));
      attach("mixamorigHead", buildLips(look.lips ?? "#d0767c"));
    }
    if (look.jewelry) {
      attach("mixamorigHead", buildEarrings());
      attach("mixamorigSpine2", buildNecklace());
      // bileklik: sol bilekte, kol ekseni etrafında
      const hand = dst.getObjectByName("mixamorigLeftHand");
      const fore = dst.getObjectByName("mixamorigLeftForeArm");
      if (hand && fore) {
        const hp = dst.worldToLocal(hand.getWorldPosition(new THREE.Vector3()));
        const fp = dst.worldToLocal(fore.getWorldPosition(new THREE.Vector3()));
        const dir = hp.clone().sub(fp).normalize();
        const br = new THREE.Group();
        const m = gold();
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0035, 10, 40), m);
        band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        band.position.copy(hp.clone().addScaledVector(dir, -0.025));
        br.add(band);
        attach("mixamorigLeftForeArm", br);
      }
    }
    return { pivotGroup, holder };
  }, [dst, look]);

  // kaynak: Xbot (animasyonlar onun iskeletinde oynatılır)
  const src = useMemo(() => cloneSkinned(anim.scene), [anim]);
  const mixer = useMemo(() => new THREE.AnimationMixer(src), [src]);
  const actions = useMemo(() => {
    const map = new Map<string, THREE.AnimationAction>();
    for (const clip of anim.animations) {
      const a = mixer.clipAction(clip);
      a.play();
      a.setEffectiveWeight(0);
      map.set(clip.name, a);
    }
    return map;
  }, [mixer, anim]);

  // dinlenme (T-poz) model-uzayı dönüşleri
  const rig = useMemo(() => {
    src.updateMatrixWorld(true);
    dst.updateMatrixWorld(true);
    const sB = new Map(bones(src).map((b) => [b.name, b]));
    const dList = bones(dst).filter((b) => sB.has(b.name));
    const rest = dList.map((d) => {
      const s = sB.get(d.name)!;
      return { d, s, dq: modelQ(d, dst), sq: modelQ(s, src) };
    });
    const sh = sB.get("mixamorigHips")!;
    const dh = dst.getObjectByName("mixamorigHips")!;
    const sp = src.worldToLocal(sh.getWorldPosition(new THREE.Vector3()));
    const dp = dst.worldToLocal(dh.getWorldPosition(new THREE.Vector3()));
    return { rest, sh, dh, sRestPos: sp, dRestPos: dp, ratio: dp.y / Math.max(1e-6, sp.y) };
  }, [src, dst]);

  const t = frame / fps;
  for (const [name, a] of actions) {
    const c = clips.find((x) => x.name === name);
    a.setEffectiveWeight(c ? c.weight : 0);
    a.time = c ? ((c.time ?? t) * (c.speed ?? 1)) % a.getClip().duration : 0;
    a.enabled = !!c && c.weight > 0;
  }
  mixer.update(0);
  src.updateMatrixWorld(true);

  // kalça konumu (model uzayında)
  const sPos = src.worldToLocal(rig.sh.getWorldPosition(new THREE.Vector3()));
  const delta = sPos.sub(rig.sRestPos).multiplyScalar(rig.ratio);
  if (inPlace) {
    delta.x = 0;
    delta.z = 0;
  }
  const hipModel = rig.dRestPos.clone().add(delta);
  dst.updateWorldMatrix(true, true);
  rig.dh.position.copy(rig.dh.parent!.worldToLocal(dst.localToWorld(hipModel)));

  // dönüşler: kaynaktaki model-uzayı farkını hedefin dinlenme pozuna uygula
  const mq = new Map<THREE.Object3D, THREE.Quaternion>();
  for (const { d, s, dq, sq } of rig.rest) {
    const dModel = modelQ(s, src).multiply(sq.clone().invert()).multiply(dq);
    const parent = d.parent!;
    const pq = mq.get(parent) ?? modelQ(parent, dst);
    d.quaternion.copy(pq.clone().invert().multiply(dModel));
    mq.set(d, dModel);
  }

  if (hair) {
    // saç yerçekimiyle sarkar: baş öne eğilince kuyruk/arka saç yukarı kalkmasın
    const sway = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(t * 3.1) * 0.06, 0, Math.sin(t * 2.3 + 0.5) * 0.1));
    const parentQ = modelQ(hair.holder, dst);
    const gravity = parentQ.clone().invert().multiply(sway);
    hair.pivotGroup.quaternion.copy(sway).slerp(gravity, 0.75);
  }

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <primitive object={dst} />
    </group>
  );
};
