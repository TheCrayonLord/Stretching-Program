import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { loadBody } from './body.js';
import { REGIONS, REGION_BY_ID } from './data.js';
import { MUSCLES, MUSCLES_BY_REGION } from './muscles.js';
import { EXERCISES, EXERCISE_BY_ID, EQUIPMENT } from './exercises.js';
import {
  GOALS, READY, resolveStep, routineMinutes, stretchRef, exerciseRef, loadMine, saveMine, newId,
} from './routines.js';

const canvas = document.getElementById('scene');
const stage = document.getElementById('stage');
const tip = document.getElementById('tip');
const listEl = document.getElementById('list');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('q');
const filtersEl = document.getElementById('filters');
const legendEl = document.getElementById('legend');
const peelBtn = document.getElementById('peel');
const toastEl = document.getElementById('toast');
const sheetEl = document.getElementById('sheet');

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
  body = await loadBody((got, total) => {
    loading.textContent = total
      ? `Loading anatomy… ${Math.round((got / total) * 100)}%`
      : `Loading anatomy… ${(got / 1e6).toFixed(1)} MB`;
  });
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
  tab: store.get('tab', 'stretch'),          // 'stretch' | 'exercise' | 'routine'
  goal: store.get('goal', ''),               // routine goal filter, '' = all
  equip: new Set(store.get('equip', [])),    // empty = any equipment
  view: { kind: 'list' },                    // list | region | exercise | routine {id, step} | player {id}
  peel: false,                               // manual "deep layer" toggle
};
if (!['stretch', 'exercise', 'routine'].includes(state.tab)) state.tab = 'stretch';
let mine = loadMine();
const getRoutine = (id) => mine.find((r) => r.id === id) || READY.find((r) => r.id === id);
const isMine = (id) => mine.some((r) => r.id === id);
const stepsOf = (r) => r.steps.map(resolveStep).filter(Boolean);

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
  } else if (v.kind === 'routine' || v.kind === 'player') {
    const steps = stepsOf(getRoutine(v.id));
    const idx = v.kind === 'player' ? player?.i : v.step;
    const focus = idx != null && steps[idx] ? [steps[idx]] : steps;
    for (const st of focus) for (const id of st.secondary) if (!highlight.has(id)) highlight.set(id, 0.5);
    for (const st of focus) for (const id of st.primary) highlight.set(id, 1);
    if (focus.length === 1) autoPeel = focus[0].primary.filter((id) => MUSCLES[id].deep).length * 2 > focus[0].primary.length;
  }
  const peeling = autoPeel || state.peel;
  stage.classList.toggle('peeled', peeling);
  legendEl.hidden = !(v.kind === 'exercise' || ((v.kind === 'routine' || v.kind === 'player') && [...highlight.values()].includes(0.5)));
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
  document.getElementById('panel').classList.toggle('playing', view.kind === 'player');
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
  } else if (view.kind === 'exercise') {
    const ex = EXERCISE_BY_ID[view.id];
    if (fly) focusMuscles(ex.primary, viewFor(ex.primary));
    renderExercise(ex, view.from);
  } else if (view.kind === 'routine') {
    const r = getRoutine(view.id);
    if (!r) return show({ kind: 'list' });
    const st = view.step != null ? stepsOf(r)[view.step] : null;
    if (fly) st ? focusStep(st) : goHome('front');
    renderRoutine(r, view.step);
  } else if (view.kind === 'player') {
    renderPlayer();
  }
}
function focusStep(st) {
  focusMuscles(st.primary, st.kind === 'stretch' ? st.region.view : viewFor(st.primary));
}
const openRegion = (id, opts) => show({ kind: 'region', id }, opts);

function setTab(tab) {
  state.tab = tab;
  store.set('tab', tab);
  for (const b of document.querySelectorAll('.tabs button')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  if (player) stopPlayer();
  renderFilters();
  filtersEl.hidden = tab === 'stretch';
  const v = state.view;
  if (tab === 'routine') show(v.kind === 'routine' ? v : { kind: 'list' }, { fly: v.kind !== 'list' });
  else if (v.kind === 'routine' || v.kind === 'player') show({ kind: 'list' });
  else if (v.kind === 'exercise') show({ kind: 'region', id: v.from || MUSCLES[EXERCISE_BY_ID[v.id].primary[0]].region }, { fly: false });
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
  if (state.view.kind === 'player') return; // don't leave a workout by accident
  if (state.tab === 'routine') { state.view = { kind: 'list' }; setTab('stretch'); }
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
  if (state.tab === 'routine') {
    filtersEl.innerHTML = `<span class="filters-label" id="goal-label">Goal</span>
      <div class="chips" role="group" aria-labelledby="goal-label">
        <button type="button" class="chip" data-goal="" aria-pressed="${!state.goal}">All</button>
        ${GOALS.map(([id, label]) => `<button type="button" class="chip" data-goal="${id}" aria-pressed="${state.goal === id}">${label}</button>`).join('')}
      </div>`;
    return;
  }
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

function routineRow(r) {
  const steps = stepsOf(r);
  const kinds = new Set(steps.map((s) => s.kind));
  const what = kinds.size === 2 ? 'steps' : kinds.has('exercise') ? 'exercises' : 'stretches';
  const goals = (r.goals || []).map((g) => `<i>${esc(GOALS.find(([id]) => id === g)[1])}</i>`).join('');
  return `<button class="row" type="button" data-routine="${r.id}">
      <b>${esc(r.name)}</b>
      <span>${steps.length ? `${steps.length} ${what} · about ${routineMinutes(steps)} min` : 'Empty, add stretches or exercises'}</span>
      ${goals ? `<span class="tags">${goals}</span>` : ''}
    </button>`;
}

function renderRoutineList(terms) {
  const match = (r) => !terms.length || terms.every((t) => `${r.name} ${r.about || ''} ${stepsOf(r).map((s) => s.name).join(' ')}`.toLowerCase().includes(t));
  const myList = mine.filter(match);
  const ready = READY.filter((r) => (!state.goal || r.goals.includes(state.goal)) && match(r));
  listEl.innerHTML = `
    <h3 class="section">My routines</h3>
    ${myList.map(routineRow).join('')}
    ${terms.length ? '' : `<div class="pad"><button type="button" class="ghost-btn" data-act="new">+ New routine</button>
      ${mine.length ? '' : '<p class="note">Build your own: tap <b>+ Routine</b> on any stretch or exercise. Saved in this browser.</p>'}</div>`}
    <h3 class="section">Ready-made${state.goal ? ` · ${esc(GOALS.find(([id]) => id === state.goal)[1])}` : ''}</h3>
    ${ready.map(routineRow).join('') || '<p class="empty">No ready-made routines match.</p>'}
    <div class="empty">${CREDIT}</div>`;
}

function renderList() {
  detailEl.hidden = true;
  listEl.hidden = false;
  const terms = searchEl.value.toLowerCase().split(/\s+/).filter(Boolean);
  if (state.tab === 'routine') return renderRoutineList(terms);
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
        <div class="card-actions">
          <a href="${esc(st.url)}" target="_blank" rel="noopener">Watch on YouTube</a>
          <button type="button" class="add" data-add="${esc(stretchRef(region.id, st.name))}">+ Routine</button>
        </div>
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
      <div class="card-actions">
        <a href="${esc(ex.url)}" target="_blank" rel="noopener">Watch on YouTube</a>
        <button type="button" class="add" data-add="${esc(exerciseRef(ex.name))}">+ Routine</button>
      </div>
    </section>
    <p class="note">Sets × reps are a starting point. Use a weight you can control with good form.</p>
    ${CREDIT}`;
}

/* ---------- routines ---------- */
const typeTag = (st) => st.kind === 'stretch' ? '<i class="type stretch-tag">Stretch</i>'
  : `<i class="type ${st.ex.type}">${st.ex.type === 'compound' ? 'Compound' : 'Isolation'}</i>`;
let confirmDelete = false;
let renaming = false;

function renderRoutine(r, preview) {
  listEl.hidden = true;
  detailEl.hidden = false;
  const own = isMine(r.id);
  const steps = stepsOf(r);
  const title = renaming && own
    ? `<form class="rename" data-form="rename"><input id="rename-input" value="${esc(r.name)}" maxlength="40" aria-label="Routine name" autocomplete="off"><button type="submit" class="ghost-btn">Save</button></form>`
    : `<h2>${esc(r.name)}</h2>`;
  detailEl.innerHTML = `
    <button class="back" type="button" data-nav="list">&larr; All routines</button>
    ${title}
    ${r.about ? `<p class="hint">${esc(r.about)}</p>` : ''}
    <p class="meta">${steps.length ? `${plural(steps.length, 'step')} · about ${routineMinutes(steps)} min` : 'No steps yet'}</p>
    <div class="routine-actions">
      ${steps.length ? '<button type="button" class="start-btn" data-act="start">&#9654; Start</button>' : ''}
      ${own
        ? `<button type="button" class="ghost-btn" data-act="rename">Rename</button>
           <button type="button" class="ghost-btn danger" data-act="delete">${confirmDelete ? 'Tap again to delete' : 'Delete'}</button>`
        : '<button type="button" class="ghost-btn" data-act="copy">Copy to my routines</button>'}
    </div>
    ${steps.length ? `<p class="hint">Tap a step to see the muscles it works.</p>
    <ol class="steps">
      ${steps.map((st, i) => `<li class="step${preview === i ? ' on' : ''}">
          <button type="button" class="step-main" data-act="preview" data-i="${i}" aria-pressed="${preview === i}">
            <b>${esc(st.name)}</b>
            <span class="tags">${typeTag(st)}<i>${esc(st.dose)}</i></span>
          </button>
          ${own ? `<span class="step-tools">
            <button type="button" data-act="up" data-i="${i}" aria-label="Move ${esc(st.name)} up" ${i ? '' : 'disabled'}>&uarr;</button>
            <button type="button" data-act="down" data-i="${i}" aria-label="Move ${esc(st.name)} down" ${i < steps.length - 1 ? '' : 'disabled'}>&darr;</button>
            <button type="button" data-act="remove" data-i="${i}" aria-label="Remove ${esc(st.name)}">&times;</button>
          </span>` : ''}
        </li>`).join('')}
    </ol>` : `<p class="empty">Add stretches or exercises with the <b>+ Routine</b> button on any stretch card or exercise page.</p>`}
    ${own ? '<p class="note">Your routines are saved in this browser.</p>' : ''}
    ${CREDIT}`;
  if (renaming) { const inp = detailEl.querySelector('#rename-input'); inp.focus(); inp.select(); }
}

function updateMine(id, fn) {
  const r = mine.find((x) => x.id === id);
  if (!r) return;
  fn(r);
  saveMine(mine);
}

function createRoutine(name, steps = []) {
  const n = mine.length + 1;
  const r = { id: newId(), name: name || `My routine ${n}`, steps };
  mine.push(r);
  saveMine(mine);
  return r;
}

let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2200);
}

/* add-to-routine sheet */
let sheetRef = null;
function openSheet(ref) {
  sheetRef = ref;
  const st = resolveStep(ref);
  sheetEl.innerHTML = `
    <div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <h3 id="sheet-title">Add “${esc(st.name)}” to…</h3>
      <div class="sheet-list">
        ${mine.map((r) => {
          const has = r.steps.includes(ref);
          return `<button type="button" class="row" data-pick="${r.id}" ${has ? 'aria-disabled="true"' : ''}><b>${esc(r.name)}</b><span>${has ? 'Already added' : plural(r.steps.length, 'step')}</span></button>`;
        }).join('')}
      </div>
      <form class="rename" data-form="new-routine">
        <input id="new-routine-name" placeholder="New routine name" maxlength="40" aria-label="New routine name" autocomplete="off">
        <button type="submit" class="start-btn">Create &amp; add</button>
      </form>
      <button type="button" class="ghost-btn" data-close="1">Cancel</button>
    </div>`;
  sheetEl.hidden = false;
  (sheetEl.querySelector('[data-pick]:not([aria-disabled])') || sheetEl.querySelector('input')).focus();
}
function closeSheet() { sheetEl.hidden = true; sheetEl.innerHTML = ''; sheetRef = null; }
sheetEl.addEventListener('click', (ev) => {
  if (ev.target === sheetEl || ev.target.closest('[data-close]')) return closeSheet();
  const b = ev.target.closest('[data-pick]');
  if (!b || b.getAttribute('aria-disabled')) return;
  const ref = sheetRef;
  updateMine(b.dataset.pick, (r) => r.steps.push(ref));
  toast(`Added to ${getRoutine(b.dataset.pick).name}`);
  closeSheet();
});
sheetEl.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const r = createRoutine(sheetEl.querySelector('#new-routine-name').value.trim(), [sheetRef]);
  toast(`Added to ${r.name}`);
  closeSheet();
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !sheetEl.hidden) closeSheet(); });

function routineAction(act, i) {
  const v = state.view;
  const r = getRoutine(v.id);
  if (act !== 'delete') confirmDelete = false;
  if (act === 'preview') return show({ kind: 'routine', id: v.id, step: v.step === i ? null : i });
  if (act === 'start') return startPlayer(v.id);
  if (act === 'copy') {
    const c = createRoutine(`${r.name} (my copy)`, [...r.steps]);
    toast('Copied to My routines');
    return show({ kind: 'routine', id: c.id }, { fly: false });
  }
  if (act === 'rename') { renaming = true; return renderRoutine(r, v.step); }
  if (act === 'delete') {
    if (!confirmDelete) { confirmDelete = true; return renderRoutine(r, v.step); }
    confirmDelete = false;
    mine = mine.filter((x) => x.id !== r.id);
    saveMine(mine);
    toast('Routine deleted');
    return show({ kind: 'list' });
  }
  if (act === 'up' || act === 'down' || act === 'remove') {
    updateMine(r.id, (x) => {
      if (act === 'remove') x.steps.splice(i, 1);
      else {
        const j = act === 'up' ? i - 1 : i + 1;
        [x.steps[i], x.steps[j]] = [x.steps[j], x.steps[i]];
      }
    });
    return show({ kind: 'routine', id: r.id }, { fly: false });
  }
}

detailEl.addEventListener('submit', (ev) => {
  ev.preventDefault();
  if (ev.target.dataset.form !== 'rename') return;
  const name = detailEl.querySelector('#rename-input').value.trim();
  if (name) updateMine(state.view.id, (r) => { r.name = name; });
  renaming = false;
  show(state.view, { fly: false });
});

/* ---------- guided player ---------- */
let player = null;
let audio = null;
let wakeLock = null;
const READY_SECS = 5;

function beep(freq = 880, dur = 0.12) {
  if (!audio) return;
  try {
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.18, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + dur);
  } catch { /* audio unavailable */ }
}

async function startPlayer(id) {
  try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); await audio.resume(); } catch { audio = null; }
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { wakeLock = null; }
  player = { id, steps: stepsOf(getRoutine(id)), i: 0, set: 1, side: 1, phase: 'ready', endsAt: 0, left: 0, paused: false, timer: null };
  state.view = { kind: 'player', id };
  document.getElementById('panel').classList.add('playing');
  enterStep(0);
  player.timer = setInterval(tick, 200);
}

function stopPlayer() {
  if (!player) return;
  clearInterval(player.timer);
  player = null;
  try { wakeLock?.release(); } catch { /* ignore */ }
  wakeLock = null;
}

function setPhase(phase, secs) {
  player.phase = phase;
  player.endsAt = secs ? performance.now() + secs * 1000 : 0;
  player.left = secs ? secs * 1000 : 0;
  player.paused = false;
  renderPlayer();
}

function enterStep(i) {
  player.i = i;
  player.set = 1;
  player.side = 1;
  computeHighlight();
  focusStep(player.steps[i]);
  setPhase('ready', READY_SECS);
}

function startWork() {
  const st = player.steps[player.i];
  beep(1175, 0.2);
  setPhase('work', st.secs || 0);
}

function finishWork() {
  const st = player.steps[player.i];
  if (player.side < st.sides) { player.side++; return setPhase('ready', READY_SECS); }
  if (player.set < st.sets) { player.set++; player.side = 1; beep(660, 0.25); return setPhase('rest', st.kind === 'exercise' ? st.rest : st.rest); }
  nextStep();
}

function nextStep() {
  if (player.i < player.steps.length - 1) { beep(660, 0.25); return enterStep(player.i + 1); }
  beep(988, 0.15); setTimeout(() => beep(1319, 0.3), 180);
  player.phase = 'done';
  clearInterval(player.timer);
  renderPlayer();
}

function tick() {
  if (!player || player.paused || !player.endsAt) return;
  const left = player.endsAt - performance.now();
  const secs = Math.ceil(left / 1000);
  if (secs !== player.lastSecs) {
    player.lastSecs = secs;
    if (secs > 0 && secs <= 3) beep(880, 0.08);
  }
  if (left <= 0) {
    if (player.phase === 'ready' || player.phase === 'rest') return player.phase === 'rest' ? setPhase('ready', 3) : startWork();
    if (player.phase === 'work') return finishWork();
  }
  updateClock(left);
}

const fmt = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function updateClock(left) {
  const el = detailEl.querySelector('#clock');
  if (!el) return;
  el.textContent = fmt(left);
  const total = player.left || 1;
  detailEl.querySelector('#clock-bar')?.style.setProperty('--p', String(1 - Math.max(0, left) / total));
}

function renderPlayer() {
  if (!player) return;
  listEl.hidden = true;
  detailEl.hidden = false;
  const r = getRoutine(player.id);
  const n = player.steps.length;
  if (player.phase === 'done') {
    detailEl.innerHTML = `
      <div class="player done">
        <p class="eyebrow">${esc(r.name)}</p>
        <h2>Routine complete</h2>
        <p class="hint">${plural(n, 'step')} done. Nice work.</p>
        <div class="routine-actions">
          <button type="button" class="start-btn" data-p="again">Do it again</button>
          <button type="button" class="ghost-btn" data-p="exit">Back to routine</button>
        </div>
      </div>`;
    return;
  }
  const st = player.steps[player.i];
  const nextSt = player.steps[player.i + 1];
  const sideLabel = st.sides > 1 ? (player.side === 1 ? 'Left side' : 'Right side') : '';
  const setLabel = st.sets > 1 ? `${st.kind === 'exercise' ? 'Set' : 'Round'} ${player.set} of ${st.sets}` : '';
  const what = [setLabel, sideLabel].filter(Boolean).join(' · ');
  let label, center, action = '';
  if (player.phase === 'ready') {
    label = player.set > 1 || player.side > 1 ? `Next: ${what}` : 'Get ready';
    center = `<div id="clock" class="clock small">${fmt(player.left)}</div>`;
    action = '<button type="button" class="ghost-btn" data-p="go">Start now</button>';
  } else if (player.phase === 'rest') {
    label = 'Rest';
    center = `<div id="clock" class="clock">${fmt(player.left)}</div>`;
    action = '<button type="button" class="ghost-btn" data-p="go">Skip rest</button>';
  } else if (st.secs) {
    label = st.kind === 'stretch' ? `Hold${what ? ` · ${what}` : ''}` : (what || 'Go');
    center = `<div id="clock" class="clock">${fmt(player.left)}</div>`;
  } else {
    label = what || 'Go';
    center = `<div class="clock reps">${esc(st.reps)}</div>`;
    action = `<button type="button" class="start-btn" data-p="done">${st.kind === 'exercise' ? 'Set done' : 'Done'}</button>`;
  }
  detailEl.innerHTML = `
    <div class="player">
      <div class="player-top">
        <p class="eyebrow">${esc(r.name)} · Step ${player.i + 1} of ${n}</p>
        <button type="button" class="ghost-btn small" data-p="exit">End</button>
      </div>
      <div class="progress" aria-hidden="true"><span style="width:${(player.i / n) * 100}%"></span></div>
      <h2>${esc(st.name)}</h2>
      <span class="tags">${typeTag(st)}<i>${esc(st.dose)}</i></span>
      <p class="phase">${esc(label)}</p>
      <div id="clock-bar" class="clock-wrap${player.phase === 'work' && st.secs ? ' timed' : ''}">${center}</div>
      <div class="player-controls">
        <button type="button" class="round" data-p="prev" aria-label="Previous step" ${player.i ? '' : 'disabled'}>&#9198;</button>
        ${player.endsAt ? `<button type="button" class="round big" data-p="pause" aria-label="${player.paused ? 'Resume' : 'Pause'}">${player.paused ? '&#9654;' : '&#10073;&#10073;'}</button>` : ''}
        <button type="button" class="round" data-p="next" aria-label="Next step">&#9197;</button>
      </div>
      <div class="player-action">${action}</div>
      <p class="how">${esc(st.how)}</p>
      <a class="yt" href="${esc(st.url)}" target="_blank" rel="noopener">Watch on YouTube</a>
      ${nextSt ? `<p class="up-next">Up next: <b>${esc(nextSt.name)}</b></p>` : '<p class="up-next">Last step</p>'}
    </div>`;
  updateClock(player.paused ? player.left : player.endsAt - performance.now());
}

function playerAction(a) {
  if (a === 'exit') { const id = player?.id ?? state.view.id; stopPlayer(); return show({ kind: 'routine', id }); }
  if (a === 'again') { const id = player.id; stopPlayer(); return startPlayer(id); }
  if (!player) return;
  if (a === 'go') return player.phase === 'rest' ? setPhase('ready', 3) : startWork();
  if (a === 'done') return finishWork();
  if (a === 'next') return nextStep();
  if (a === 'prev') return enterStep(Math.max(0, player.i - 1));
  if (a === 'pause') {
    if (player.paused) { player.endsAt = performance.now() + player.left; player.paused = false; }
    else { player.left = player.endsAt - performance.now(); player.paused = true; }
    renderPlayer();
  }
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
  const g = ev.target.closest('[data-goal]');
  if (g) {
    state.goal = g.dataset.goal;
    store.set('goal', state.goal);
    renderFilters();
    return show({ kind: 'list' }, { fly: false });
  }
  const b = ev.target.closest('[data-equip]');
  if (b) setEquip(b.dataset.equip);
});

function onPanelClick(ev) {
  const t = ev.target.closest('[data-region],[data-exercise],[data-muscle],[data-nav],[data-equip],[data-routine],[data-act],[data-add],[data-p]');
  if (!t || t.disabled) return;
  const d = t.dataset;
  if (d.p) return playerAction(d.p);
  if (d.add) return openSheet(d.add);
  if (d.act === 'new') { const r = createRoutine(); renaming = true; return show({ kind: 'routine', id: r.id }); }
  if (d.act) return routineAction(d.act, d.i != null ? Number(d.i) : null);
  if (d.routine) { searchEl.blur(); confirmDelete = false; renaming = false; return show({ kind: 'routine', id: d.routine }); }
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
  if (d.nav === 'list') { renaming = false; confirmDelete = false; return show({ kind: 'list' }); }
  if (d.nav.startsWith('region:')) return openRegion(d.nav.slice(7));
}
listEl.addEventListener('click', onPanelClick);
detailEl.addEventListener('click', onPanelClick);

searchEl.addEventListener('input', () => {
  if (state.view.kind === 'player') return;
  show({ kind: 'list' }, { fly: false });
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
  routine: (id) => { setTab('routine'); show({ kind: 'routine', id }); },
};

// offline support when hosted (ignored where service workers aren't allowed)
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !globalThis.STRETCH_ATLAS_MODEL) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* not available here */ });
}
