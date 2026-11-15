// Loads the anatomical figure (assets/body.bin, built by tools/build_model.py
// from the BodyParts3D dataset) and shades it like a muscle chart: red fibres
// streaked along each muscle, fading to pale tendon where the muscle thins out.
import * as THREE from 'three';

const FIBRE_GLSL = /* glsl */ `
  float fHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float fNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(fHash(i), fHash(i + vec2(1, 0)), f.x),
               mix(fHash(i + vec2(0, 1)), fHash(i + vec2(1, 1)), f.x), f.y);
  }
  vec3 muscleColor(vec2 perp, float tendon) {
    // perp is constant along the muscle's long axis, so this noise becomes fibres
    float coarse = fNoise(perp * 150.0);
    // fine grain fades out with distance so it never shimmers
    float px = max(fwidth(perp.x), fwidth(perp.y)) * 700.0;
    float fine = mix(fNoise(perp * 700.0), 0.5, clamp(px * 1.4 - 0.2, 0.0, 1.0));
    float fibre = coarse * 0.65 + fine * 0.35;
    vec3 flesh = mix(vec3(0.42, 0.045, 0.035), vec3(0.74, 0.17, 0.13), smoothstep(0.1, 0.9, fibre));
    vec3 sinew = mix(vec3(0.74, 0.66, 0.56), vec3(0.97, 0.94, 0.88), fibre);
    float t = smoothstep(0.25, 0.8, tendon + (fibre - 0.5) * 0.35);
    return mix(flesh, sinew, t);
  }
`;

function muscleMaterial() {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec2 aPerp; attribute float aTendon;
        varying vec2 vPerp; varying float vTendon;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vPerp = aPerp; vTendon = aTendon;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vPerp; varying float vTendon;
        ${FIBRE_GLSL}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= muscleColor(vPerp, vTendon);`);
  };
  return m;
}

export async function loadBody(url = 'assets/body.bin') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  const buf = await res.arrayBuffer();
  const headLen = new DataView(buf).getUint32(0, true);
  const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, headLen)));
  const base = 4 + headLen;
  const [ox, oy, oz] = head.origin;
  const [sx, sy, sz] = head.size;

  const root = new THREE.Group();
  const regions = new Map();         // id -> { all: [mesh], near: [mesh] }
  const regionMaterials = new Map(); // id -> [material]
  const pickables = [];

  const boneMat = new THREE.MeshStandardMaterial({ color: 0xe9dfcb, roughness: 0.6 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xf6f3ee, roughness: 0.25 });
  const faceMat = muscleMaterial();
  const matFor = (id) => {
    if (!regionMaterials.has(id)) regionMaterials.set(id, [muscleMaterial()]);
    return regionMaterials.get(id)[0];
  };

  for (const e of head.meshes) {
    const q = new Uint16Array(buf, base + e.pos, e.verts * 3);
    const pos = new Float32Array(e.verts * 3);
    for (let i = 0; i < e.verts; i++) {
      pos[i * 3] = ox + (q[i * 3] / 65535) * sx;
      pos[i * 3 + 1] = oy + (q[i * 3 + 1] / 65535) * sy;
      pos[i * 3 + 2] = oz + (q[i * 3 + 2] / 65535) * sz;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const Index = e.index32 ? Uint32Array : Uint16Array;
    geo.setIndex(new THREE.BufferAttribute(new Index(buf, base + e.idx, e.tris * 3), 1));
    if (e.kind === 'muscle') {
      const p = new Int16Array(buf, base + e.perp, e.verts * 2);
      const perp = new Float32Array(e.verts * 2);
      for (let i = 0; i < perp.length; i++) perp[i] = (p[i] / 32767) * head.perpRange;
      geo.setAttribute('aPerp', new THREE.BufferAttribute(perp, 2));
      geo.setAttribute('aTendon', new THREE.BufferAttribute(new Uint8Array(buf, base + e.tendon, e.verts), 1, true));
    }
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    geo.computeBoundingBox();

    const mat = e.kind === 'bone' ? boneMat : e.kind === 'eye' ? eyeMat : e.region ? matFor(e.region) : faceMat;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.region = e.region;
    root.add(mesh);
    pickables.push(mesh);
    if (e.region) {
      if (!regions.has(e.region)) regions.set(e.region, { all: [], near: [] });
      const r = regions.get(e.region);
      r.all.push(mesh);
      if (e.side !== 'r') r.near.push(mesh); // close-ups frame the +x side
    }
  }

  return { root, regions, regionMaterials, pickables, height: sy, credit: head.source };
}
