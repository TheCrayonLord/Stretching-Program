import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { loadBody } from './body.js';
import { REGIONS, REGION_BY_ID } from './data.js';

const canvas = document.getElementById('scene');
const stage = document.getElementById('stage');
const tip = document.getElementById('tip');
const listEl = document.getElementById('list');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('q');

/* ---------- scene ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 30);

scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8a6f5c, 1.5));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
const fill = new THREE.DirectionalLight(0xffe2c8, 0.9);
camera.add(key, key.target, fill, fill.target); // lights follow the camera
key.position.set(-1.2, 1.6, 1.5);
fill.position.set(1.8, -0.4, 0.8);
key.target.position.set(0, 0, -3);
fill.target.position.set(0, 0, -3);
scene.add(camera);

const loading = document.getElementById('loading');
let body;
try {
  body = await loadBody();
  loading.remove();
} catch (err) {
  loading.textContent = 'Could not load the 3D model. Serve this folder over HTTP and reload.';
  throw err;
}
scene.add(body.root);

// soft contact shadow
{
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(70,45,25,.45)');
  grad.addColorStop(1, 'rgba(70,45,25,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.8),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.006;
  scene.add(shadow);
}

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.minDistance = 0.3;
controls.maxDistance = 9;
controls.zoomToCursor = true;
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

/* ---------- camera framing ---------- */
const HOME = { center: new THREE.Vector3(0, body.height * 0.5, 0), radius: body.height * 0.55 };
let flight = null;

function fitDistance(radius) {
  const v = THREE.MathUtils.degToRad(camera.fov) / 2;
  const h = Math.atan(Math.tan(v) * camera.aspect);
  return radius / Math.sin(Math.min(v, h));
}

function flyTo(center, radius, dir, ms = 900) {
  const to = new THREE.Spherical().setFromVector3(new THREE.Vector3(...dir).normalize());
  to.radius = fitDistance(radius);
  const from = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  // take the short way round
  let dTheta = to.theta - from.theta;
  dTheta = ((dTheta + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  flight = { t0: performance.now(), ms, from, to, dTheta, c0: controls.target.clone(), c1: center.clone() };
  if (ms === 0) stepFlight(Infinity);
}

function stepFlight(now) {
  if (!flight) return;
  const f = flight;
  let k = Math.min(1, (now - f.t0) / (f.ms || 1));
  k = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const sph = new THREE.Spherical(
    THREE.MathUtils.lerp(f.from.radius, f.to.radius, k),
    THREE.MathUtils.lerp(f.from.phi, f.to.phi, k),
    f.from.theta + f.dTheta * k,
  );
  controls.target.lerpVectors(f.c0, f.c1, k);
  camera.position.setFromSpherical(sph).add(controls.target);
  if (k >= 1) flight = null;
}

function focusRegion(id) {
  const region = REGION_BY_ID[id];
  const sets = body.regions.get(id);
  const oneSide = Math.abs(region.view[0]) >= 0.4;
  const box = new THREE.Box3();
  for (const m of oneSide ? sets.near : sets.all) box.expandByObject(m);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  flyTo(sphere.center, Math.max(sphere.radius * 1.55, 0.22), region.view);
}

const VIEWS = { front: [0, 0.08, 1], back: [0, 0.08, -1], side: [1, 0.08, 0] };
function goHome(view = 'front', ms = 900) {
  flyTo(HOME.center, HOME.radius, VIEWS[view], ms);
}

/* ---------- selection & highlight ---------- */
let selected = null;
let hovered = null;
const WHITE = new THREE.Color(0xffffff);
const DIM = new THREE.Color(0xb9a79f);
const GLOW = new THREE.Color(0xff9a1f);

function paint(time) {
  const pulse = 0.5 + 0.22 * Math.sin(time / 260);
  for (const [id, mats] of body.regionMaterials) {
    const isSel = id === selected;
    const target = isSel || !selected ? WHITE : DIM;
    const glow = isSel ? pulse : id === hovered ? 0.2 : 0;
    for (const m of mats) {
      m.color.lerp(target, 0.15);
      m.emissive.copy(GLOW);
      m.emissiveIntensity += (glow - m.emissiveIntensity) * 0.2;
    }
  }
}

function select(id, { fly = true } = {}) {
  selected = id;
  stage.classList.toggle('focused', !!id);
  if (id) {
    if (fly) focusRegion(id);
    renderDetail(REGION_BY_ID[id]);
  } else {
    renderList();
  }
}

/* ---------- picking ---------- */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(ev) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(body.pickables, false)[0];
  return hit ? hit.object.userData.region || null : null;
}

const pointers = new Map();
let tapCancelled = false;

canvas.addEventListener('pointerdown', (ev) => {
  flight = null; // user takes over
  if (pointers.size === 0) tapCancelled = false;
  else tapCancelled = true; // multi-touch gesture, never a tap
  pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, t: performance.now() });
});
canvas.addEventListener('pointermove', (ev) => {
  const p = pointers.get(ev.pointerId);
  if (p && Math.hypot(ev.clientX - p.x, ev.clientY - p.y) > 8) tapCancelled = true;
  if (ev.pointerType === 'mouse' && pointers.size === 0) {
    hovered = pick(ev);
    canvas.classList.toggle('hot', !!hovered);
    if (hovered) {
      const r = stage.getBoundingClientRect();
      tip.textContent = REGION_BY_ID[hovered].name;
      tip.style.left = `${ev.clientX - r.left}px`;
      tip.style.top = `${ev.clientY - r.top}px`;
    }
    tip.hidden = !hovered;
  }
});
canvas.addEventListener('pointerup', (ev) => {
  const p = pointers.get(ev.pointerId);
  pointers.delete(ev.pointerId);
  if (!p || tapCancelled || performance.now() - p.t > 600) return;
  const id = pick(ev);
  if (id) {
    searchEl.value = '';
    select(id);
  }
});
canvas.addEventListener('pointercancel', (ev) => pointers.delete(ev.pointerId));
canvas.addEventListener('pointerleave', () => { hovered = null; tip.hidden = true; });
canvas.addEventListener('wheel', () => { flight = null; }, { passive: true });

document.querySelector('.views').addEventListener('click', (ev) => {
  const view = ev.target.dataset.view;
  if (view) goHome(view);
});

/* ---------- panel ---------- */
const CREDIT = '<p class="note">3D model: BodyParts3D © The Database Center for Life Science, CC BY-SA 2.1 Japan.</p>';
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function search(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return REGIONS.map((region) => ({ region }));
  const out = [];
  for (const region of REGIONS) {
    const own = `${region.name} ${region.muscles} ${region.aliases}`.toLowerCase();
    if (terms.every((t) => own.includes(t))) {
      out.push({ region, rank: region.name.toLowerCase().startsWith(terms[0]) ? 0 : 1 });
      continue;
    }
    const st = region.stretches.find((x) => terms.every((t) => x.name.toLowerCase().includes(t)));
    if (st) out.push({ region, via: st.name, rank: 2 });
  }
  return out.sort((a, b) => a.rank - b.rank);
}

function renderList() {
  const results = search(searchEl.value);
  detailEl.hidden = true;
  listEl.hidden = false;
  listEl.innerHTML = results.length
    ? results.map(({ region, via }) => `
        <button class="row" role="listitem" data-id="${region.id}">
          <b>${esc(region.name)}</b>
          <span>${esc(region.muscles)}</span>
          ${via ? `<em>Includes: ${esc(via)}</em>` : ''}
        </button>`).join('') + `<div class="empty">${CREDIT}</div>`
    : `<p class="empty">No body part matches “${esc(searchEl.value)}”. Try “hamstrings”, “shoulder” or “lower back”.</p>`;
}

function renderDetail(region) {
  listEl.hidden = true;
  detailEl.hidden = false;
  detailEl.scrollTop = 0;
  detailEl.innerHTML = `
    <button class="back" type="button">&larr; All body parts</button>
    <h2>${esc(region.name)}</h2>
    <p class="muscles">${esc(region.muscles)}</p>
    ${region.stretches.map((st) => `
      <section class="stretch">
        <h3>${esc(st.name)}</h3>
        <span class="hold">${esc(st.hold)}</span>
        <p>${esc(st.how)}</p>
        <a href="${esc(st.url)}" target="_blank" rel="noopener">Watch on YouTube</a>
      </section>`).join('')}
    <p class="note">Ease into each stretch and stop if you feel sharp pain. Video links open a YouTube search for the stretch.</p>
    ${CREDIT}`;
}

listEl.addEventListener('click', (ev) => {
  const row = ev.target.closest('.row');
  if (!row) return;
  searchEl.blur();
  select(row.dataset.id);
});
detailEl.addEventListener('click', (ev) => {
  if (!ev.target.closest('.back')) return;
  select(null);
  goHome('front');
});
searchEl.addEventListener('input', () => {
  selected = null;
  stage.classList.remove('focused');
  renderList();
});
searchEl.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter') return;
  const first = listEl.querySelector('.row');
  if (first) first.click();
});

/* ---------- loop ---------- */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

renderList();
goHome('front', 0);

renderer.setAnimationLoop((time) => {
  stepFlight(performance.now());
  controls.update();
  paint(time);
  renderer.render(scene, camera);
});

// handy for debugging / automation
window.stretchAtlas = { select, goHome };
