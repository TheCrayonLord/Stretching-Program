import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { loadBody } from './body.js';
import { REGIONS, REGION_BY_ID } from './data.js';
import { MUSCLES, MUSCLES_BY_REGION } from './muscles.js';
import { EXERCISES, EXERCISE_BY_ID, EQUIPMENT } from './exercises.js';

const canvas = document.getElementById('scene');
const stage = document.getElementById('stage');
const tip = document.getElementById('tip');
const listEl = document.getElementById('list');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('q');
const filtersEl = document.getElementById('filters');
const legendEl = document.getElementById('legend');
const peelBtn = document.getElementById('peel');

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

// frame a set of muscles, looking from `dir`
function focusMuscles(ids, dir) {
  const oneSide = Math.abs(dir[0]) >= 0.4;
  const box = new THREE.Box3();
  for (const id of ids) {
    const g = body.muscles.get(id);
    if (!g) continue;
    for (const m of oneSide ? g.near : g.meshes) box.expandByObject(m);
  }
  if (box.isEmpty()) return;
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  flyTo(sphere.center, Math.max(sphere.radius * 1.55, 0.22), dir);
}

// look at the muscles from the side they face
function viewFor(ids) {
  const v = new THREE.Vector3();
  const FIXED = { front: [0.25, 0, 1], back: [0.25, 0, -1] };
  for (const id of ids) {
    const g = body.muscles.get(id);
    if (!g) continue;
    const f = FIXED[MUSCLES[id].view] ? new THREE.Vector3(...FIXED[MUSCLES[id].view]) : g.facing.clone();
    f.x = Math.max(f.x, 0.2); // close-ups frame the +x side, so never look through the body
    v.add(f.normalize());
  }
  if (v.lengthSq() < 1e-4) v.set(0.3, 0, 1);
  v.normalize();
  v.y = 0.12;
  return v.toArray();
}

const VIEWS = { front: [0, 0.08, 1], back: [0, 0.08, -1], side: [1, 0.08, 0] };
function goHome(view = 'front', ms = 900) {
  flyTo(HOME.center, HOME.radius, VIEWS[view], ms);
}

/* ---------- app state ---------- */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(`stretchAtlas.${k}`)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(`stretchAtlas.${k}`, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
const state = {
  tab: store.get('tab', 'stretch'),          // 'stretch' | 'exercise'
  equip: new Set(store.get('equip', [])),    // empty = any equipment
  view: { kind: 'list' },                    // list | region {id, spot} | exercise {id, from}
  peel: false,                               // manual "deep layer" toggle
};
if (!['stretch', 'exercise'].includes(state.tab)) state.tab = 'stretch';

const regionMuscles = (id) => MUSCLES_BY_REGION[id] || [];
const allowed = (ex) => !state.equip.size || ex.equipment.some((e) => state.equip.has(e));
const exercisesFor = (regionId) => {
  const ms = new Set(regionMuscles(regionId));
  return EXERCISES.filter((e) => e.primary.some((m) => ms.has(m)));
};

/* ---------- highlight ---------- */
let hovered = null;   // muscle id under the mouse
let highlight = new Map(); // muscle id -> 1 (primary) | 0.5 (secondary)
let autoPeel = false;

function computeHighlight() {
  highlight = new Map();
  autoPeel = false;
  const v = state.view;
  if (v.kind === 'region') {
    const ids = v.spot ? [v.spot] : regionMuscles(v.id);
    for (const id of ids) highlight.set(id, 1);
    const deep = ids.filter((id) => MUSCLES[id].deep).length;
    autoPeel = v.spot ? MUSCLES[v.spot].deep : REGION_BY_ID[v.id].deep || deep * 2 > ids.length;
  } else if (v.kind === 'exercise') {
    const ex = EXERCISE_BY_ID[v.id];
    for (const id of ex.secondary) highlight.set(id, 0.5);
    for (const id of ex.primary) highlight.set(id, 1);
    autoPeel = ex.primary.filter((id) => MUSCLES[id].deep).length * 2 >= ex.primary.length;
  }
  const peeling = autoPeel || state.peel;
  stage.classList.toggle('peeled', peeling);
  legendEl.hidden = v.kind !== 'exercise';
}

const WHITE = new THREE.Color(0xffffff);
const DIM = new THREE.Color(0xc4b2a8);
const PRIMARY = new THREE.Color(0xff6a00);
const SECONDARY = new THREE.Color(0xffe9a8);

function setFade(mat, target) {
  const f = mat.userData.fade + (target - mat.userData.fade) * 0.18;
  mat.userData.fade = Math.abs(f - target) < 0.004 ? target : f;
  mat.opacity = mat.userData.fade;
  const solid = mat.opacity > 0.985;
  if (mat.transparent === solid) { mat.transparent = !solid; mat.needsUpdate = true; }
  mat.depthWrite = mat.opacity > 0.6;
}

function paint(time) {
  const pulse = 0.68 + 0.18 * Math.sin(time / 260);
  const any = highlight.size > 0;
  const peeling = autoPeel || state.peel;
  for (const [id, g] of body.muscles) {
    const level = highlight.get(id) || 0;
    const m = g.mat;
    m.color.lerp(level || !any ? WHITE : DIM, 0.15);
    m.emissive.lerp(level === 0.5 ? SECONDARY : PRIMARY, 0.3);
    const glow = level === 1 ? pulse : level ? 0.3 : id === hovered ? 0.22 : 0;
    m.emissiveIntensity += (glow - m.emissiveIntensity) * 0.2;
    // with a selection, everything else turns to a ghost; without one, only the outer layer does
    const fade = !peeling || level ? 1 : !MUSCLES[id].deep ? 0.07 : any ? 0.14 : 1;
    setFade(m, fade);
  }
  setFade(body.faceMat, peeling ? 0.07 : 1);
  setFade(body.boneMat, peeling ? 0.32 : 1);
}

/* ---------- navigation ---------- */
function show(view, { fly = true } = {}) {
  state.view = view;
  computeHighlight();
  stage.classList.toggle('focused', view.kind !== 'list');
  if (view.kind === 'list') {
    renderList();
    if (fly) goHome('front');
    return;
  }
  if (view.kind === 'region') {
    if (fly) {
      if (view.spot) focusMuscles([view.spot], viewFor([view.spot]));
      else focusMuscles(regionMuscles(view.id), REGION_BY_ID[view.id].view);
    }
    renderRegion(REGION_BY_ID[view.id], view.spot);
  } else {
    const ex = EXERCISE_BY_ID[view.id];
    if (fly) focusMuscles(ex.primary, viewFor(ex.primary));
    renderExercise(ex, view.from);
  }
}
const openRegion = (id, opts) => show({ kind: 'region', id }, opts);

function setTab(tab) {
  state.tab = tab;
  store.set('tab', tab);
  for (const b of document.querySelectorAll('.tabs button')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  filtersEl.hidden = tab !== 'exercise';
  const v = state.view;
  if (v.kind === 'exercise') show({ kind: 'region', id: v.from || MUSCLES[EXERCISE_BY_ID[v.id].primary[0]].region }, { fly: false });
  else show(v, { fly: false });
}

/* ---------- picking ---------- */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(ev) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  for (const hit of raycaster.intersectObjects(body.pickables, false)) {
    if (hit.object.material.opacity < 0.5) continue; // faded layer: look through it
    return hit.object.userData.muscle || null;
  }
  return null;
}

function tapMuscle(id) {
  const m = MUSCLES[id];
  const v = state.view;
  searchEl.value = '';
  // inside the same body part, a tap spotlights that one muscle
  if (v.kind === 'region' && v.id === m.region && v.spot !== id && regionMuscles(m.region).length > 1) {
    show({ kind: 'region', id: m.region, spot: id });
  } else {
    openRegion(m.region);
  }
}

const pointers = new Map();
let tapCancelled = false;

canvas.addEventListener('pointerdown', (ev) => {
  flight = null; // user takes over
  tapCancelled = pointers.size > 0; // multi-touch gesture, never a tap
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
      const m = MUSCLES[hovered];
      tip.innerHTML = `${esc(m.name)}<small>${esc(REGION_BY_ID[m.region].name)}</small>`;
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
  if (id) tapMuscle(id);
});
canvas.addEventListener('pointercancel', (ev) => pointers.delete(ev.pointerId));
canvas.addEventListener('pointerleave', () => { hovered = null; tip.hidden = true; });
canvas.addEventListener('wheel', () => { flight = null; }, { passive: true });

document.querySelector('.views').addEventListener('click', (ev) => {
  const btn = ev.target.closest('button');
  if (!btn) return;
  if (btn === peelBtn) {
    state.peel = !state.peel;
    peelBtn.setAttribute('aria-pressed', String(state.peel));
    computeHighlight();
  } else goHome(btn.dataset.view);
});

/* ---------- panel rendering ---------- */
const CREDIT = '<p class="note">3D model: BodyParts3D © The Database Center for Life Science, CC BY-SA 2.1 Japan.</p>';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EQUIP_LABEL = Object.fromEntries(EQUIPMENT);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function renderFilters() {
  filtersEl.innerHTML = `<span class="filters-label" id="equip-label">Equipment</span>
    <div class="chips" role="group" aria-labelledby="equip-label">
      ${EQUIPMENT.map(([id, label]) => `<button type="button" class="chip" data-equip="${id}" aria-pressed="${state.equip.has(id)}">${label}</button>`).join('')}
      ${state.equip.size ? '<button type="button" class="chip clear" data-equip="">Clear</button>' : ''}
    </div>`;
}

function regionRow(region) {
  let meta = esc(region.muscles);
  if (state.tab === 'exercise') {
    const n = exercisesFor(region.id).filter(allowed).length;
    meta = `${plural(n, 'exercise')} · ${meta}`;
  }
  return `<button class="row" type="button" data-region="${region.id}"><b>${esc(region.name)}</b><span>${meta}</span></button>`;
}

function exerciseRow(ex, showRegion = false) {
  const prim = ex.primary.map((id) => MUSCLES[id].name).join(', ');
  return `<button class="row ex-row" type="button" data-exercise="${ex.id}">
      <b>${esc(ex.name)}</b>
      <span class="tags"><i class="type ${ex.type}">${ex.type === 'compound' ? 'Compound' : 'Isolation'}</i>${ex.equipment.map((e) => `<i>${EQUIP_LABEL[e]}</i>`).join('')}</span>
      <span>${showRegion ? 'Works: ' : ''}${esc(prim)}</span>
    </button>`;
}

function searchRegions(terms) {
  const out = [];
  for (const region of REGIONS) {
    const muscleNames = regionMuscles(region.id).map((id) => MUSCLES[id].name).join(' ');
    const own = `${region.name} ${region.muscles} ${region.aliases} ${muscleNames}`.toLowerCase();
    if (terms.every((t) => own.includes(t))) {
      out.push({ region, rank: region.name.toLowerCase().startsWith(terms[0]) ? 0 : 1 });
      continue;
    }
    if (state.tab === 'stretch') {
      const st = region.stretches.find((x) => terms.every((t) => x.name.toLowerCase().includes(t)));
      if (st) out.push({ region, via: st.name, rank: 2 });
    }
  }
  return out.sort((a, b) => a.rank - b.rank);
}

function renderList() {
  detailEl.hidden = true;
  listEl.hidden = false;
  const terms = searchEl.value.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) {
    listEl.innerHTML = `
      <h3 class="section">Muscle groups</h3>
      ${REGIONS.filter((r) => !r.deep).map(regionRow).join('')}
      <h3 class="section">Deep &amp; stabilizer muscles</h3>
      ${REGIONS.filter((r) => r.deep).map(regionRow).join('')}
      <div class="empty">${CREDIT}</div>`;
    return;
  }
  const regions = searchRegions(terms);
  const exercises = state.tab === 'exercise'
    ? EXERCISES.filter((e) => allowed(e) && terms.every((t) => e.name.toLowerCase().includes(t)))
    : [];
  const regionHtml = regions.map(({ region, via }) => regionRow(region).replace('</span></button>', `</span>${via ? `<em>Includes: ${esc(via)}</em>` : ''}</button>`)).join('');
  const exHtml = exercises.map((e) => exerciseRow(e, true)).join('');
  // a typed exercise name beats a body part that only matched on a nickname
  const exFirst = exercises.length && !regions.some((r) => r.rank === 0);
  let html = exFirst
    ? `<h3 class="section">Exercises</h3>${exHtml}${regionHtml ? `<h3 class="section">Muscle groups</h3>${regionHtml}` : ''}`
    : regionHtml + (exHtml ? `<h3 class="section">Exercises</h3>${exHtml}` : '');
  listEl.innerHTML = html || `<p class="empty">Nothing matches “${esc(searchEl.value)}”. Try “hamstrings”, “rotator cuff”${state.tab === 'exercise' ? ' or “squat”' : ' or “lower back”'}.</p>`;
}

function muscleChips(ids, { spot, link } = {}) {
  return `<div class="muscle-chips">${ids.map((id) => `<button type="button" class="mchip" data-muscle="${id}" ${link ? 'data-link="1"' : ''} aria-pressed="${spot === id}">${esc(MUSCLES[id].name)}${MUSCLES[id].deep ? '<small>deep</small>' : ''}</button>`).join('')}</div>`;
}

function renderRegion(region, spot) {
  listEl.hidden = true;
  detailEl.hidden = false;
  const ids = regionMuscles(region.id);
  let body;
  if (state.tab === 'stretch') {
    body = region.stretches.map((st) => `
      <section class="stretch">
        <h3>${esc(st.name)}</h3>
        <span class="hold">${esc(st.hold)}</span>
        <p>${esc(st.how)}</p>
        <a href="${esc(st.url)}" target="_blank" rel="noopener">Watch on YouTube</a>
      </section>`).join('')
      + '<p class="note">Ease into each stretch and stop if you feel sharp pain. Video links open a YouTube search for the stretch.</p>';
  } else {
    const all = exercisesFor(region.id).filter((e) => !spot || e.primary.includes(spot));
    const shown = all.filter(allowed);
    const group = (type, title) => {
      const items = shown.filter((e) => e.type === type);
      return items.length ? `<h3 class="section">${title}<small>${type === 'compound' ? 'multi-joint' : 'single-joint'}</small></h3>${items.map((e) => exerciseRow(e)).join('')}` : '';
    };
    body = shown.length
      ? group('compound', 'Compound') + group('isolation', 'Isolation')
      : `<p class="empty">No ${spot ? `${esc(MUSCLES[spot].name)} ` : ''}exercises use the selected equipment.
           <button type="button" class="link" data-equip="">Show all equipment</button></p>`;
    if (shown.length < all.length) body += `<p class="note">${plural(all.length - shown.length, 'more exercise')} hidden by the equipment filter.</p>`;
  }
  detailEl.innerHTML = `
    <button class="back" type="button" data-nav="list">&larr; All muscle groups</button>
    <h2>${esc(region.name)}</h2>
    <p class="hint">${ids.length > 1 ? 'Tap a muscle to focus on it.' : ''}</p>
    ${muscleChips(ids, { spot })}
    <div class="${state.tab === 'exercise' ? 'ex-list' : ''}">${body}</div>
    ${CREDIT}`;
}

function renderExercise(ex, from) {
  listEl.hidden = true;
  detailEl.hidden = false;
  detailEl.scrollTop = 0;
  const backLabel = from ? REGION_BY_ID[from].name : 'All muscle groups';
  detailEl.innerHTML = `
    <button class="back" type="button" data-nav="${from ? `region:${from}` : 'list'}">&larr; ${esc(backLabel)}</button>
    <h2>${esc(ex.name)}</h2>
    <span class="tags big"><i class="type ${ex.type}">${ex.type === 'compound' ? 'Compound' : 'Isolation'}</i>${ex.equipment.map((e) => `<i>${EQUIP_LABEL[e]}</i>`).join('')}</span>
    <h3 class="section"><span class="swatch primary"></span>Primary muscles</h3>
    ${muscleChips(ex.primary, { link: true })}
    ${ex.secondary.length ? `<h3 class="section"><span class="swatch secondary"></span>Secondary muscles</h3>${muscleChips(ex.secondary, { link: true })}` : ''}
    <section class="stretch">
      <h3>How to do it</h3>
      <span class="hold">${esc(ex.dose)}</span>
      <p>${esc(ex.how)}</p>
      <a href="${esc(ex.url)}" target="_blank" rel="noopener">Watch on YouTube</a>
    </section>
    <p class="note">Sets × reps are a starting point. Use a weight you can control with good form.</p>
    ${CREDIT}`;
}

/* ---------- panel events ---------- */
document.querySelector('.tabs').addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-tab]');
  if (b && b.dataset.tab !== state.tab) setTab(b.dataset.tab);
});

function setEquip(id) {
  if (!id) state.equip.clear();
  else if (state.equip.has(id)) state.equip.delete(id);
  else state.equip.add(id);
  store.set('equip', [...state.equip]);
  renderFilters();
  show(state.view, { fly: false });
}
filtersEl.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-equip]');
  if (b) setEquip(b.dataset.equip);
});

function onPanelClick(ev) {
  const t = ev.target.closest('[data-region],[data-exercise],[data-muscle],[data-nav],[data-equip]');
  if (!t) return;
  const d = t.dataset;
  if (d.equip !== undefined) return setEquip(d.equip);
  if (d.region) { searchEl.blur(); return openRegion(d.region); }
  if (d.exercise) {
    const v = state.view;
    return show({ kind: 'exercise', id: d.exercise, from: v.kind === 'region' ? v.id : null });
  }
  if (d.muscle) {
    const m = MUSCLES[d.muscle];
    if (d.link) return openRegion(m.region);
    const v = state.view;
    return show({ kind: 'region', id: v.id, spot: v.spot === d.muscle ? null : d.muscle });
  }
  if (d.nav === 'list') return show({ kind: 'list' });
  if (d.nav.startsWith('region:')) return openRegion(d.nav.slice(7));
}
listEl.addEventListener('click', onPanelClick);
detailEl.addEventListener('click', onPanelClick);

searchEl.addEventListener('input', () => show({ kind: 'list' }, { fly: false }));
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

renderFilters();
setTab(state.tab);
goHome('front', 0);

renderer.setAnimationLoop((time) => {
  stepFlight(performance.now());
  controls.update();
  paint(time);
  renderer.render(scene, camera);
});

// handy for debugging / automation
window.stretchAtlas = {
  show, setTab, goHome,
  select: (id) => openRegion(id),
  exercise: (name) => show({ kind: 'exercise', id: EXERCISES.find((e) => e.name === name).id, from: null }),
};
