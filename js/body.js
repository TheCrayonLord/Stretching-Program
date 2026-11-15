// Procedural anatomical figure: every muscle is a spindle (stretched ellipsoid)
// whose fibres run along its long axis and fade to pale tendon at both ends.
import * as THREE from 'three';

const Y = new THREE.Vector3(0, 1, 0);

function fiberCanvas({ base, light, dark, tendon, tendonAmt, lines = 240 }) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < lines; i++) {
    g.globalAlpha = 0.12 + rnd() * 0.38;
    g.fillStyle = rnd() < 0.5 ? light : dark;
    g.fillRect(rnd() * 256, 0, 0.6 + rnd() * 2.2, 256);
  }
  g.globalAlpha = 1;
  if (tendonAmt > 0) {
    const grad = g.createLinearGradient(0, 0, 0, 256);
    const clear = 'rgba(255,255,255,0)';
    grad.addColorStop(0, tendon);
    grad.addColorStop(tendonAmt * 0.45, tendon);
    grad.addColorStop(tendonAmt, clear);
    grad.addColorStop(1 - tendonAmt, clear);
    grad.addColorStop(1 - tendonAmt * 0.45, tendon);
    grad.addColorStop(1, tendon);
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
  }
  return c;
}

function tex(canvas, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildBody() {
  const muscleMap = tex(fiberCanvas({ base: '#b02a22', light: '#e2685a', dark: '#6e120e', tendon: '#efe4d2', tendonAmt: 0.2 }));
  const bellyMap = tex(fiberCanvas({ base: '#b02a22', light: '#e2685a', dark: '#6e120e', tendon: '#efe4d2', tendonAmt: 0.07 }));
  const fasciaMap = tex(fiberCanvas({ base: '#eadfcd', light: '#ffffff', dark: '#b9a78c', tendon: '#f4ecdf', tendonAmt: 0.1, lines: 160 }));
  const bump = tex(fiberCanvas({ base: '#808080', light: '#ffffff', dark: '#000000', tendon: '#808080', tendonAmt: 0.15 }), false);

  const maps = { muscle: muscleMap, belly: bellyMap, fascia: fasciaMap };
  const newMat = (kind = 'muscle') =>
    new THREE.MeshStandardMaterial({
      map: maps[kind], bumpMap: bump, bumpScale: 0.9, roughness: 0.48, metalness: 0.0,
    });

  const geo = new THREE.SphereGeometry(1, 30, 22);
  const root = new THREE.Group();
  const half = new THREE.Group();   // one side of the body, mirrored below
  const center = new THREE.Group(); // midline structures
  const materials = new Map();      // `${region}:${kind}` -> material
  const regionMaterials = new Map(); // region -> [materials]

  const matFor = (region, kind) => {
    const key = `${region}:${kind}`;
    if (!materials.has(key)) {
      const m = newMat(kind);
      materials.set(key, m);
      if (!regionMaterials.has(region)) regionMaterials.set(region, []);
      regionMaterials.get(region).push(m);
    }
    return materials.get(key);
  };

  const deepMat = new THREE.MeshStandardMaterial({ color: 0x6b1a15, roughness: 0.7 });
  const decoMat = newMat('muscle');
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xefe6d6, roughness: 0.55 });

  // spindle from point a to point b; w = half-width, d = half-depth
  function seg(region, a, b, w, d, opts = {}) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const dir = B.clone().sub(A);
    const len = dir.length();
    const mat = opts.mat || matFor(region, opts.kind || 'muscle');
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(A).add(B).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(Y, dir.normalize());
    if (opts.roll) mesh.rotateY(opts.roll);
    mesh.scale.set(w, len / 2, d);
    mesh.userData.region = region;
    (opts.center ? center : half).add(mesh);
    return mesh;
  }
  // plain ellipsoid at a point
  function blob(region, p, r, opts = {}) {
    const mesh = new THREE.Mesh(geo, opts.mat || matFor(region, opts.kind || 'muscle'));
    mesh.position.set(...p);
    mesh.scale.set(...r);
    mesh.userData.region = region;
    (opts.center ? center : half).add(mesh);
    return mesh;
  }
  const deep = { mat: deepMat }, bone = { mat: boneMat }, deco = { mat: decoMat };
  const C = (o) => ({ ...o, center: true });

  /* ---------- deep core (not selectable) ---------- */
  blob(null, [0, 1.31, -0.005], [0.158, 0.2, 0.098], C(deep));   // ribcage
  blob(null, [0, 1.08, 0], [0.132, 0.17, 0.085], C(deep));       // abdomen
  blob(null, [0, 0.94, -0.005], [0.158, 0.11, 0.092], C(deep));  // pelvis
  blob(null, [0, 1.54, -0.01], [0.05, 0.1, 0.05], C(deep));      // neck
  seg(null, [0.215, 1.46, 0], [0.305, 1.16, 0], 0.036, 0.036, deep);        // humerus
  seg(null, [0.3, 1.19, 0.005], [0.385, 0.9, 0.03], 0.027, 0.024, deep);    // forearm
  seg(null, [0.095, 0.97, 0], [0.105, 0.48, 0.01], 0.068, 0.07, deep);      // thigh
  seg(null, [0.105, 0.53, 0.0], [0.105, 0.06, -0.01], 0.04, 0.042, deep);   // shank

  /* ---------- head ---------- */
  blob(null, [0, 1.705, -0.012], [0.081, 0.096, 0.098], C(bone));           // cranium
  blob(null, [0, 1.655, 0.03], [0.064, 0.082, 0.064], C(deco));             // face
  blob(null, [0, 1.6, 0.05], [0.04, 0.03, 0.035], C(deco));                 // chin / mouth
  seg(null, [0.062, 1.665, 0.02], [0.05, 1.595, 0.04], 0.017, 0.02, deco);  // masseter
  seg(null, [0.066, 1.74, -0.012], [0.062, 1.668, 0.022], 0.034, 0.011, deco); // temporalis
  seg(null, [0.012, 1.7, 0.082], [0.012, 1.63, 0.1], 0.012, 0.012, bone);   // nose
  const eyeW = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const eyeI = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.2 });
  blob(null, [0.031, 1.688, 0.078], [0.014, 0.011, 0.012], { mat: eyeW });
  blob(null, [0.031, 1.688, 0.088], [0.006, 0.006, 0.004], { mat: eyeI });
  blob(null, [0.031, 1.688, 0.074], [0.021, 0.017, 0.012], deco);           // orbicularis

  /* ---------- neck ---------- */
  seg('neck', [0.076, 1.63, -0.02], [0.02, 1.485, 0.062], 0.019, 0.017);    // SCM
  seg('neck', [0.018, 1.59, 0.03], [0.018, 1.49, 0.056], 0.018, 0.012);     // strap muscles
  seg('neck', [0.058, 1.61, -0.025], [0.105, 1.49, 0.0], 0.024, 0.027);     // scalenes / levator
  seg('neck', [0.03, 1.645, -0.062], [0.036, 1.52, -0.058], 0.03, 0.022);   // splenius

  /* ---------- upper back / traps ---------- */
  seg('traps', [0.025, 1.61, -0.058], [0.2, 1.478, -0.018], 0.048, 0.036);  // upper trap
  seg('traps', [0.0, 1.45, -0.098], [0.2, 1.462, -0.045], 0.062, 0.026);    // mid trap
  seg('traps', [0.012, 1.24, -0.097], [0.15, 1.435, -0.082], 0.046, 0.02);  // lower trap
  seg('traps', [0.0, 1.56, -0.075], [0.0, 1.19, -0.098], 0.07, 0.02, C({}));   // central diamond
  seg('traps', [0.07, 1.345, -0.1], [0.215, 1.405, -0.04], 0.042, 0.022);   // infraspinatus / teres

  /* ---------- shoulders ---------- */
  seg('shoulders', [0.165, 1.49, 0.04], [0.252, 1.325, 0.022], 0.042, 0.042);  // anterior
  seg('shoulders', [0.212, 1.505, 0.0], [0.27, 1.318, 0.0], 0.047, 0.052);     // lateral
  seg('shoulders', [0.165, 1.485, -0.042], [0.257, 1.325, -0.022], 0.042, 0.042); // posterior

  /* ---------- chest ---------- */
  seg('chest', [0.02, 1.458, 0.082], [0.215, 1.412, 0.05], 0.042, 0.03);
  seg('chest', [0.0, 1.365, 0.1], [0.222, 1.4, 0.05], 0.066, 0.038);
  seg('chest', [0.02, 1.275, 0.094], [0.22, 1.392, 0.045], 0.046, 0.03);

  /* ---------- arms ---------- */
  seg('biceps', [0.222, 1.405, 0.034], [0.297, 1.185, 0.034], 0.035, 0.036);
  seg('biceps', [0.262, 1.28, 0.012], [0.312, 1.15, 0.022], 0.02, 0.026);     // brachialis
  seg('triceps', [0.222, 1.415, -0.034], [0.3, 1.175, -0.028], 0.04, 0.036);
  seg('triceps', [0.262, 1.385, -0.018], [0.318, 1.215, -0.02], 0.025, 0.03);
  seg('forearms', [0.283, 1.175, 0.022], [0.366, 0.925, 0.042], 0.03, 0.027);  // flexors
  seg('forearms', [0.312, 1.215, 0.006], [0.392, 0.935, 0.022], 0.027, 0.03);  // brachioradialis
  seg('forearms', [0.3, 1.16, -0.02], [0.378, 0.925, 0.008], 0.028, 0.022);    // extensors
  seg('forearms', [0.378, 0.925, 0.03], [0.408, 0.795, 0.042], 0.032, 0.014, { kind: 'fascia' }); // palm
  for (let i = 0; i < 4; i++) {
    const x = 0.386 + i * 0.0155;
    seg('forearms', [x, 0.825, 0.04], [x + 0.018, 0.728 + Math.abs(i - 1.3) * 0.008, 0.047], 0.0078, 0.0078, { kind: 'fascia' });
  }
  seg('forearms', [0.41, 0.885, 0.04], [0.452, 0.808, 0.058], 0.0095, 0.0095, { kind: 'fascia' }); // thumb
  blob(null, [0.306, 1.168, -0.03], [0.02, 0.024, 0.018], bone);               // elbow

  /* ---------- trunk ---------- */
  seg('abs', [0.0, 1.3, 0.086], [0.0, 0.89, 0.062], 0.085, 0.016, C({ kind: 'fascia' })); // rectus sheath
  seg(null, [0.0, 1.47, 0.07], [0.0, 1.27, 0.092], 0.026, 0.012, C(bone));       // sternum
  seg('abs', [0.04, 1.282, 0.094], [0.04, 1.2, 0.101], 0.037, 0.02);
  seg('abs', [0.04, 1.207, 0.1], [0.04, 1.132, 0.1], 0.037, 0.021);
  seg('abs', [0.04, 1.139, 0.099], [0.04, 1.064, 0.095], 0.037, 0.021);
  seg('abs', [0.038, 1.072, 0.093], [0.03, 0.9, 0.066], 0.035, 0.02);
  seg('obliques', [0.135, 1.23, 0.036], [0.085, 0.94, 0.07], 0.058, 0.036);
  seg('obliques', [0.152, 1.225, -0.012], [0.148, 0.97, 0.008], 0.058, 0.03);
  for (let i = 0; i < 4; i++) {                                              // serratus
    const y = 1.318 - i * 0.036;
    seg('obliques', [0.158, y, 0.03], [0.112, y - 0.034, 0.082], 0.014, 0.013);
  }
  seg('lats', [0.2, 1.4, -0.03], [0.03, 1.06, -0.083], 0.09, 0.032);
  seg('lats', [0.19, 1.37, -0.02], [0.125, 1.11, -0.055], 0.05, 0.032);
  seg('lowerback', [0.036, 1.215, -0.086], [0.04, 0.965, -0.082], 0.036, 0.026);
  seg('lowerback', [0.085, 1.13, -0.07], [0.09, 0.985, -0.072], 0.034, 0.022); // QL
  seg('lowerback', [0.0, 1.14, -0.092], [0.0, 0.9, -0.084], 0.06, 0.014, C({ kind: 'fascia' }));

  /* ---------- hips ---------- */
  seg('glutes', [0.045, 1.0, -0.068], [0.135, 0.815, -0.058], 0.082, 0.056, { kind: 'belly' });
  seg('glutes', [0.118, 1.01, -0.03], [0.168, 0.895, -0.012], 0.05, 0.042);
  seg('hipflexors', [0.1, 1.005, 0.058], [0.082, 0.855, 0.07], 0.031, 0.026);     // iliopsoas
  seg('hipflexors', [0.148, 0.975, 0.05], [0.058, 0.52, 0.03], 0.014, 0.013);     // sartorius
  seg('hipflexors', [0.015, 0.935, 0.062], [0.08, 0.835, 0.06], 0.032, 0.026);    // pectineus
  seg('itband', [0.15, 0.995, 0.03], [0.162, 0.85, 0.036], 0.028, 0.032);         // TFL
  seg('itband', [0.17, 0.9, 0.008], [0.152, 0.5, 0.012], 0.009, 0.03, { kind: 'fascia' });

  /* ---------- thighs ---------- */
  seg('quads', [0.1, 0.905, 0.066], [0.105, 0.545, 0.056], 0.035, 0.031);          // rectus femoris
  seg('quads', [0.155, 0.865, 0.022], [0.136, 0.535, 0.036], 0.036, 0.046);        // vastus lateralis
  seg('quads', [0.058, 0.73, 0.046], [0.076, 0.515, 0.046], 0.035, 0.036);         // vastus medialis
  seg('adductors', [0.03, 0.915, 0.012], [0.07, 0.58, 0.015], 0.041, 0.052);
  seg('adductors', [0.024, 0.865, -0.022], [0.064, 0.5, -0.01], 0.019, 0.026);     // gracilis
  seg('hamstrings', [0.118, 0.845, -0.05], [0.138, 0.515, -0.03], 0.035, 0.036);   // biceps femoris
  seg('hamstrings', [0.068, 0.845, -0.055], [0.07, 0.515, -0.035], 0.035, 0.036);  // semitendinosus
  blob(null, [0.105, 0.5, 0.058], [0.029, 0.034, 0.02], bone);                     // patella

  /* ---------- lower legs ---------- */
  seg('calves', [0.08, 0.505, -0.04], [0.088, 0.25, -0.05], 0.037, 0.042);
  seg('calves', [0.13, 0.505, -0.04], [0.126, 0.27, -0.05], 0.034, 0.04);
  seg('calves', [0.105, 0.345, -0.035], [0.105, 0.055, -0.042], 0.036, 0.024);       // soleus / Achilles
  seg('shins', [0.126, 0.475, 0.03], [0.112, 0.135, 0.026], 0.027, 0.028);           // tibialis anterior
  seg('shins', [0.146, 0.465, 0.0], [0.132, 0.115, -0.01], 0.016, 0.023);           // peroneals
  seg(null, [0.09, 0.475, 0.034], [0.094, 0.1, 0.02], 0.012, 0.014, bone);          // tibia
  seg('feet', [0.105, 0.036, -0.062], [0.116, 0.026, 0.165], 0.043, 0.032, { kind: 'belly' });
  seg('feet', [0.105, 0.06, -0.01], [0.114, 0.035, 0.14], 0.03, 0.02, { kind: 'fascia' });
  blob(null, [0.105, 0.075, -0.015], [0.03, 0.03, 0.035], bone);                    // ankle

  const mirror = half.clone();
  mirror.scale.x = -1;
  root.add(center, half, mirror);

  // collect meshes per region; `near` = the +x side only (used for close-ups)
  const regions = new Map();
  const pickables = [];
  const collect = (grp, isNear) =>
    grp.traverse((o) => {
      if (!o.isMesh) return;
      pickables.push(o);
      const id = o.userData.region;
      if (!id) return;
      if (!regions.has(id)) regions.set(id, { all: [], near: [] });
      regions.get(id).all.push(o);
      if (isNear) regions.get(id).near.push(o);
    });
  collect(center, true);
  collect(half, true);
  collect(mirror, false);

  return { root, regions, regionMaterials, pickables };
}
