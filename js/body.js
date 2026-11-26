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

async function download(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !onProgress) return res.arrayBuffer();
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress(got, total);
  }
  const out = new Uint8Array(got);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out.buffer;
}

export async function loadBody(onProgress, url = globalThis.STRETCH_ATLAS_MODEL || 'assets/body.bin') {
  const buf = await download(url, onProgress);
  const headLen = new DataView(buf).getUint32(0, true);
  const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, headLen)));
  const base = 4 + headLen;
  const [ox, oy, oz] = head.origin;
  const [sx, sy, sz] = head.size;

  const root = new THREE.Group();
  const muscles = new Map(); // id -> { meshes, near, mat }
  const pickables = [];

  const fadeable = (m) => { m.transparent = true; m.userData.fade = 1; return m; };
  const boneMat = fadeable(new THREE.MeshStandardMaterial({ color: 0xe9dfcb, roughness: 0.6 }));
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xe2cfc2, roughness: 0.45 });
  const faceMat = fadeable(muscleMaterial());
  const muscleFor = (id) => {
    if (!muscles.has(id)) muscles.set(id, { meshes: [], near: [], mat: fadeable(muscleMaterial()) });
    return muscles.get(id);
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

    const group = e.muscle ? muscleFor(e.muscle) : null;
    const mat = e.kind === 'bone' ? boneMat : e.kind === 'eye' ? eyeMat : group ? group.mat : faceMat;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.muscle = e.muscle || null;
    root.add(mesh);
    pickables.push(mesh);
    if (group) {
      group.meshes.push(mesh);
      if (e.side !== 'r') group.near.push(mesh); // close-ups frame the +x side
    }
  }

  // Which way each muscle faces: from the centre of the nearby bones out to the
  // muscle (the rear deltoid sits behind the shoulder joint, so look from behind).
  const bones = [];
  for (const mesh of pickables) if (mesh.material === boneMat) bones.push(mesh.geometry.attributes.position.array);
  for (const g of muscles.values()) {
    const c = new THREE.Vector3();
    let n = 0;
    for (const mesh of g.near) {
      const p = mesh.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) { c.x += p[i]; c.y += p[i + 1]; c.z += p[i + 2]; n++; }
    }
    c.divideScalar(n || 1);
    const b = new THREE.Vector3();
    for (const r of [0.08, 0.14, 0.24]) {
      let k = 0;
      b.set(0, 0, 0);
      for (const p of bones) {
        for (let i = 0; i < p.length; i += 3) {
          if (Math.abs(p[i + 1] - c.y) > 0.05) continue;
          const dx = p[i] - c.x, dz = p[i + 2] - c.z;
          if (dx * dx + dz * dz > r * r) continue;
          b.x += p[i]; b.z += p[i + 2]; k++;
        }
      }
      if (k > 40) { b.divideScalar(k); break; }
      b.set(c.x * 0.5, 0, 0); // fallback: centre of the body at this height
    }
    const dir = new THREE.Vector3(c.x - b.x, 0, c.z - b.z);
    g.facing = dir.lengthSq() > 1e-8 ? dir.normalize() : new THREE.Vector3(0, 0, 1);
  }

  return { root, muscles, pickables, boneMat, faceMat, height: sy, credit: head.source };
}
