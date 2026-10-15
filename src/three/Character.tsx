/**
 * 3D insan karakteri (Mixamo iskeletli GLB). Animasyonlar videonun karesine
 * bağlıdır: her karede mixer.setTime ile kesin poz hesaplanır (render tekrarlanabilir).
 */
import { useEffect, useMemo, useState } from "react";
import {
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

const cache = new Map<string, Promise<GLTF>>();
const loadGltf = (file: string) => {
  if (!cache.has(file)) {
    cache.set(file, new GLTFLoader().loadAsync(staticFile(file)));
  }
  return cache.get(file)!;
};

export const useGltf = (file: string) => {
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [handle] = useState(() => delayRender(`Model: ${file}`));
  useEffect(() => {
    loadGltf(file)
      .then((g) => {
        setGltf(g);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [file, handle]);
  return gltf;
};

/** Ek poz: kemik adı (mixamorig: öneksiz) → Euler açıları (radyan), ağırlıkla eklenir. */
export type PoseOffsets = Record<string, [number, number, number]>;

export type Clip = { name: string; weight: number; time?: number; speed?: number };

export const Character: React.FC<{
  /** Canvas dışında useGltf ile yüklenmiş model */
  gltf: GLTF;
  /** Animasyon kaynağı (başka modelin klipleri de kullanılabilir) */
  animGltf?: GLTF;
  clips: Clip[];
  pose?: PoseOffsets;
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
  /** Kalça yerinde kalsın (koşu vb. klipleri yerinde oynatır) */
  inPlace?: boolean;
  tint?: string;
  /** Kalçayı aşağı indir (model birimi, ~cm) — çömelme vb. */
  hipsDrop?: number;
  /** Kalça ileri/geri kaydırma (~cm) */
  hipsShift?: number;
  /**
   * Kemiği karakterin kendi yönlerine göre bir yöne çevir (sırayla, üstten alta).
   * Yön: x = karakterin solu(+)/sağı(-), y = yukarı, z = karakterin önü.
   */
  aims?: Aim[];
  /** Tüm gövdeyi döndür (ör. plank için yere yatır), radyan */
  rootRotation?: [number, number, number];
  /** Kas bölgelerini renklendir: [renk, yoğunluk 0-1] */
  glow?: Partial<Record<Region, [string, number]>>;
  /** Kemiğe bağlı nesneler (dambıl vb.) */
  attach?: { bone: string; object: THREE.Object3D }[];
}> = ({ gltf, animGltf: animSrc, clips, pose, position = [0, 0, 0], rotationY = 0, scale = 1, inPlace = true, tint, hipsDrop = 0, hipsShift = 0, aims, rootRotation, attach, glow }) => {
  const animGltf = animSrc ?? gltf;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const model = useMemo(() => {
    if (!gltf) return null;
    const root = cloneSkinned(gltf.scene);
    root.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      const mat = (m.material as THREE.MeshStandardMaterial).clone();
      const isSurface = /Surface/.test(m.name);
      if (tint) mat.color = new THREE.Color(isSurface ? tint : "#2a2a2a");
      if (m.isSkinnedMesh) addRegions(m, mat);
      m.material = mat;
    });
    return root;
  }, [gltf, tint]);

  const mixer = useMemo(() => (model ? new THREE.AnimationMixer(model) : null), [model]);

  const actions = useMemo(() => {
    if (!mixer || !animGltf) return new Map<string, THREE.AnimationAction>();
    const map = new Map<string, THREE.AnimationAction>();
    // Başka modelin kliplerini bu modele uyarla: kalça kemiğinin duruş farkını düzelt
    const srcHips = animGltf.scene.getObjectByName("mixamorigHips");
    const dstHips = model!.getObjectByName("mixamorigHips");
    const fix =
      srcHips && dstHips && animGltf !== gltf
        ? dstHips.quaternion.clone().multiply(srcHips.quaternion.clone().invert())
        : null;
    const posScale =
      srcHips && dstHips && fix ? dstHips.position.length() / srcHips.position.length() : 1;
    for (const original of animGltf.animations) {
      let clip = original;
      if (fix) {
        clip = original.clone();
        for (const tr of clip.tracks) {
          if (/Hips\.quaternion$/.test(tr.name)) {
            const q = new THREE.Quaternion();
            for (let i = 0; i < tr.values.length; i += 4) {
              q.fromArray(tr.values, i).premultiply(fix);
              q.toArray(tr.values, i);
            }
          } else if (/Hips\.position$/.test(tr.name)) {
            const v = new THREE.Vector3();
            for (let i = 0; i < tr.values.length; i += 3) {
              v.fromArray(tr.values, i).applyQuaternion(fix).multiplyScalar(posScale);
              v.toArray(tr.values, i);
            }
          }
        }
      }
      let c = clip;
      if (inPlace) {
        c = clip.clone();
        c.tracks = c.tracks.filter((t) => !/Hips\.position$/.test(t.name) || false);
        // Hips yüksekliğini koru, ileri/yan hareketi sil
        const hips = clip.tracks.find((t) => /Hips\.position$/.test(t.name));
        if (hips) {
          const h = hips.clone();
          for (let i = 0; i < h.values.length; i += 3) {
            // ileri-geri ve yan kaymayı sil, dikey (zıplama) kalsın
            h.values[i] = hips.values[0];
            if (fix) h.values[i + 1] = hips.values[1];
            else h.values[i + 2] = hips.values[2];
          }
          c.tracks.push(h);
        }
      }
      const a = mixer.clipAction(c);
      a.play();
      a.setEffectiveWeight(0);
      map.set(clip.name, a);
    }
    return map;
  }, [mixer, animGltf, inPlace, gltf, model]);

  if (!model || !mixer) return null;

  const t = frame / fps;
  for (const [name, a] of actions) {
    const c = clips.find((x) => x.name === name);
    a.setEffectiveWeight(c ? c.weight : 0);
    a.time = c ? ((c.time ?? t) * (c.speed ?? 1)) % a.getClip().duration : 0;
    a.enabled = !!c && c.weight > 0;
  }
  mixer.update(0);

  model.traverse((o) => {
    const u = (o as THREE.Mesh).material && ((o as THREE.Mesh).material as THREE.Material).userData.regionUniforms;
    if (!u) return;
    REGIONS.forEach((r, i) => {
      const g = glow?.[r];
      u.uRegionAmt.value.setComponent(i, g ? g[1] : 0);
      (u.uRegionCol.value as THREE.Color[])[i].set(g ? g[0] : "#000000");
    });
  });

  if (hipsDrop || hipsShift) {
    const h = model.getObjectByName("mixamorigHips");
    if (h) {
      h.position.y -= hipsDrop;
      h.position.z += hipsShift;
    }
  }

  if (pose) {
    for (const [bone, [x, y, z]] of Object.entries(pose)) {
      const b = model.getObjectByName(`mixamorig${bone}`);
      if (b) {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ"));
        b.quaternion.multiply(q);
      }
    }
  }

  // Kök dönüşümünü şimdi uygula ki yön hesapları dünya uzayında doğru olsun
  model.position.set(...position);
  model.scale.setScalar(scale);
  // Model ham hâliyle +z'ye bakar; karakterin solu +x
  const rootQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0));
  if (rootRotation) {
    rootQ.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rootRotation)));
  }
  model.quaternion.copy(rootQ);

  if (aims && aims.length) {
    for (const [bone, dir, amount = 1] of aims) {
      model.updateMatrixWorld(true);
      const b = model.getObjectByName(`mixamorig${bone}`);
      const child = model.getObjectByName(`mixamorig${CHILD[bone] ?? ""}`);
      if (!b || !child || !b.parent) continue;
      const from = new THREE.Vector3().setFromMatrixPosition(child.matrixWorld)
        .sub(new THREE.Vector3().setFromMatrixPosition(b.matrixWorld))
        .normalize();
      // karakterin yönü (yalnızca Y dönüşü; gövde yatırılsa da hedefler dünyaya göre)
      const to = new THREE.Vector3(...dir).normalize()
        .applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0)));
      const delta = new THREE.Quaternion().setFromUnitVectors(from, to);
      if (amount < 1) delta.slerp(new THREE.Quaternion(), 1 - amount);
      const worldQ = new THREE.Quaternion();
      b.getWorldQuaternion(worldQ);
      const parentQ = new THREE.Quaternion();
      b.parent.getWorldQuaternion(parentQ);
      b.quaternion.copy(parentQ.invert().multiply(delta.multiply(worldQ)));
    }
  }

  if (attach) {
    for (const { bone, object } of attach) {
      const b = model.getObjectByName(`mixamorig${bone}`);
      if (b && object.parent !== b) b.add(object);
    }
  }

  return <primitive object={model} />;
};

/** Yön hesabı için her kemiğin bir alt kemiği */
const CHILD: Record<string, string> = {
  Hips: "Spine",
  Spine: "Neck",
  Spine1: "Neck",
  Spine2: "Neck",
  Neck: "Head",
  Head: "HeadTop_End",
  LeftArm: "LeftForeArm",
  LeftForeArm: "LeftHand",
  LeftHand: "LeftHandMiddle1",
  RightArm: "RightForeArm",
  RightForeArm: "RightHand",
  RightHand: "RightHandMiddle1",
  LeftUpLeg: "LeftLeg",
  LeftLeg: "LeftFoot",
  LeftFoot: "LeftToeBase",
  RightUpLeg: "RightLeg",
  RightLeg: "RightFoot",
  RightFoot: "RightToeBase",
};

/** [kemik, yön, miktar(0-1)] */
export type Aim = [string, [number, number, number], number?];

/** Kamerayı her karede kesin olarak ayarlar (videonun karesine bağlı). */
export const CameraRig: React.FC<{
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}> = ({ position, target, fov = 35 }) => {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...position);
  cam.fov = fov;
  cam.aspect = size.width / size.height;
  cam.near = 0.05;
  cam.far = 200;
  cam.lookAt(...target);
  cam.updateProjectionMatrix();
  return null;
};

export type Region = "legs" | "arms" | "core";
const REGIONS: Region[] = ["legs", "arms", "core"];
const REGION_BONES: Record<Region, RegExp> = {
  legs: /^mixamorig(Left|Right)(UpLeg|Leg)$/,
  arms: /^mixamorig(Left|Right)(Arm|ForeArm)$/,
  core: /^mixamorigSpine1?$/,
};

/** Her köşeye hangi kas bölgesine ait olduğunu yazar ve materyale renk karışımı ekler. */
const addRegions = (mesh: THREE.SkinnedMesh, mat: THREE.MeshStandardMaterial) => {
  const geo = mesh.geometry;
  if (!geo.getAttribute("aRegion")) {
    const idx = geo.getAttribute("skinIndex");
    const wts = geo.getAttribute("skinWeight");
    const names = mesh.skeleton.bones.map((b) => b.name);
    const arr = new Float32Array(idx.count * 3);
    for (let v = 0; v < idx.count; v++) {
      for (let k = 0; k < 4; k++) {
        const bone = names[idx.getComponent(v, k)] ?? "";
        const w = wts.getComponent(v, k);
        REGIONS.forEach((r, i) => {
          if (REGION_BONES[r].test(bone)) arr[v * 3 + i] += w;
        });
      }
    }
    geo.setAttribute("aRegion", new THREE.BufferAttribute(arr, 3));
  }
  const uniforms = {
    uRegionAmt: { value: new THREE.Vector3() },
    uRegionCol: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color()] },
  };
  mat.userData.regionUniforms = uniforms;
  mat.customProgramCacheKey = () => "region";
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec3 aRegion;\nvarying vec3 vRegion;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRegion = aRegion;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vRegion;\nuniform vec3 uRegionAmt;\nuniform vec3 uRegionCol[3];",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 rw = clamp(vRegion, 0.0, 1.0) * uRegionAmt;
        diffuseColor.rgb = mix(diffuseColor.rgb, uRegionCol[0], rw.x);
        diffuseColor.rgb = mix(diffuseColor.rgb, uRegionCol[1], rw.y);
        diffuseColor.rgb = mix(diffuseColor.rgb, uRegionCol[2], rw.z);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += (uRegionCol[0] * rw.x + uRegionCol[1] * rw.y + uRegionCol[2] * rw.z) * 0.45;`,
      );
  };
};
