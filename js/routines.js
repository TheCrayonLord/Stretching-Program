// Routines: ready-made ones grouped by goal, plus the viewer's own (saved in
// this browser). A routine is a list of step refs:
//   's:<region id>:<stretch name>'  or  'e:<exercise name>'
import { REGIONS, REGION_BY_ID } from './data.js';
import { EXERCISES } from './exercises.js';
import { MUSCLES_BY_REGION } from './muscles.js';

export const GOALS = [
  ['desk', 'Desk & posture'],
  ['backpain', 'Back pain'],
  ['running', 'Running'],
  ['flexibility', 'Flexibility'],
  ['strength', 'Strength'],
  ['core', 'Core'],
];

const EX_BY_NAME = Object.fromEntries(EXERCISES.map((e) => [e.name, e]));

/* ---------- timing ---------- */
const first = (s) => parseFloat(s);

// "30 s each side", "1–2 min", "30 s, 2–3 rounds", "10 slow reps"
function stretchTiming(hold) {
  const sides = /each (side|foot)/.test(hold) ? 2 : 1;
  const rounds = /rounds/.test(hold) ? first(hold.match(/(\d+)(?:–\d+)? rounds/)[1]) : 1;
  let secs = null;
  const m = hold.match(/^(\d+)(?:–\d+)?\s*(s|min)\b/);
  if (m) secs = first(m[1]) * (m[2] === 'min' ? 60 : 1);
  return { sets: rounds, sides, secs, reps: secs ? null : hold, rest: 10 };
}

// "3 × 8–12", "3 × 20–45 s each side", "5 min"
function exerciseTiming(ex) {
  const dose = ex.dose;
  const parts = dose.split('×').map((s) => s.trim());
  const sets = parts.length > 1 ? first(parts[0]) : 1;
  const per = parts.length > 1 ? parts[1] : parts[0];
  const m = per.match(/^(\d+)(?:–\d+)?\s*(s|min)\b(?!\s*hold)/);
  const secs = m ? first(m[1]) * (m[2] === 'min' ? 60 : 1) : null;
  const sides = secs && /each side/.test(per) ? 2 : 1;
  const light = ex.equipment.every((e) => e === 'bodyweight' || e === 'band');
  const rest = light ? 45 : ex.type === 'compound' ? 90 : 60;
  return { sets, sides, secs, reps: secs ? null : per, rest };
}

/* ---------- steps ---------- */
export function resolveStep(ref) {
  if (ref.startsWith('e:')) {
    const ex = EX_BY_NAME[ref.slice(2)];
    if (!ex) return null;
    return { ref, kind: 'exercise', name: ex.name, ex, how: ex.how, url: ex.url, dose: ex.dose,
      primary: ex.primary, secondary: ex.secondary, ...exerciseTiming(ex) };
  }
  const [, regionId, ...rest] = ref.split(':');
  const region = REGION_BY_ID[regionId];
  const st = region && region.stretches.find((s) => s.name === rest.join(':'));
  if (!st) return null;
  return { ref, kind: 'stretch', name: st.name, region, how: st.how, url: st.url, dose: st.hold,
    primary: MUSCLES_BY_REGION[regionId] || [], secondary: [], ...stretchTiming(st.hold) };
}

export const stretchRef = (regionId, name) => `s:${regionId}:${name}`;
export const exerciseRef = (name) => `e:${name}`;

// rough length in seconds, assuming ~3 s per rep
export function stepSeconds(s) {
  const work = s.secs ?? (parseFloat(s.reps) || 10) * 3;
  return s.sets * s.sides * work + (s.sets * s.sides - 1) * (s.kind === 'exercise' ? s.rest : 5);
}
export function routineMinutes(steps) {
  const secs = steps.reduce((t, s) => t + stepSeconds(s) + 10, 0);
  return Math.max(1, Math.round(secs / 60));
}

/* ---------- ready-made ---------- */
const S = stretchRef, E = exerciseRef;
export const READY = [
  {
    id: 'desk-reset', name: 'Desk Reset', goals: ['desk'],
    about: 'Undo hours of sitting: open the chest and hips and wake up the upper back.',
    steps: [S('deepneck', 'Chin Tucks'), S('neck', 'Upper Trapezius Neck Stretch'), S('chest', 'Doorway Pec Stretch'),
      S('traps', 'Thread the Needle'), S('hipflexors', 'Half-Kneeling Hip Flexor Stretch'), S('glutes', 'Figure-Four Stretch'),
      S('forearms', 'Wrist Flexor Stretch')],
  },
  {
    id: 'posture-strength', name: 'Posture Builder', goals: ['desk', 'strength'],
    about: 'Strengthen the muscles that pull the shoulders back and keep the head stacked.',
    steps: [E('Band Pull-Apart'), E('Face Pull'), E('Prone Y-T-W Raise'), E('Chin-Tuck Head Lift'), E('Band External Rotation'), E('Bird Dog')],
  },
  {
    id: 'back-relief', name: 'Lower Back Relief', goals: ['backpain'],
    about: 'Gentle mobility for a stiff lower back, finishing with two stability drills.',
    steps: [S('lowerback', 'Knees-to-Chest'), S('traps', 'Cat-Cow'), S('lowerback', 'Supine Twist'), S('lowerback', "Child's Pose"),
      S('hiprotators', 'Supine Piriformis Stretch'), S('hipflexors', 'Half-Kneeling Hip Flexor Stretch'), E('Dead Bug'), E('Bird Dog')],
  },
  {
    id: 'sciatica', name: 'Piriformis & Sciatica Ease', goals: ['backpain', 'running'],
    about: 'Release the deep hip rotators that can press on the sciatic nerve.',
    steps: [S('hiprotators', 'Supine Piriformis Stretch'), S('hiprotators', 'Knee-to-Opposite-Shoulder'), S('glutes', '90/90 Stretch'),
      S('hiprotators', 'Pigeon Pose'), E('Clamshell'), E('Glute Bridge')],
  },
  {
    id: 'runner-recovery', name: "Runner's Recovery", goals: ['running', 'flexibility'],
    about: 'Post-run stretches for the calves, hamstrings, quads and hips.',
    steps: [S('calves', 'Wall Calf Stretch'), S('calves', 'Bent-Knee Soleus Stretch'), S('quads', 'Standing Quad Stretch'),
      S('hamstrings', 'Supine Hamstring Stretch'), S('itband', 'Standing IT Band Stretch'), S('hiprotators', 'Pigeon Pose'),
      S('adductors', 'Butterfly Stretch')],
  },
  {
    id: 'runner-strength', name: 'Runner Strength', goals: ['running', 'strength'],
    about: 'Single-leg strength and ankle stability to stay injury-free.',
    steps: [E('Bulgarian Split Squat'), E('Single-Leg Balance'), E('Standing Calf Raise'), E('Tibialis Raise'),
      E('Side-Lying Hip Abduction'), E('Copenhagen Plank')],
  },
  {
    id: 'morning-mobility', name: 'Morning Mobility', goals: ['flexibility', 'desk'],
    about: 'A quick head-to-toe wake-up you can do beside the bed.',
    steps: [S('traps', 'Cat-Cow'), S('lowerback', "Child's Pose"), S('hipflexors', 'Low Lunge'), S('calves', 'Downward Dog'),
      S('obliques', 'Standing Side Bend'), S('hamstrings', 'Standing Forward Fold')],
  },
  {
    id: 'full-flex', name: 'Full-Body Flexibility', goals: ['flexibility'],
    about: 'Longer holds for every major muscle group. Best when warm.',
    steps: [S('neck', 'Upper Trapezius Neck Stretch'), S('shoulders', 'Cross-Body Shoulder Stretch'), S('triceps', 'Overhead Triceps Stretch'),
      S('chest', 'Doorway Pec Stretch'), S('lats', "Child's Pose with Side Reach"), S('obliques', 'Supine Twist'),
      S('hipflexors', 'Couch Stretch'), S('hamstrings', 'Seated Forward Fold'), S('adductors', 'Frog Stretch'), S('calves', 'Wall Calf Stretch')],
  },
  {
    id: 'push-day', name: 'Push Day', goals: ['strength'],
    about: 'Chest, shoulders and triceps.',
    steps: [E('Bench Press'), E('Overhead Press'), E('Incline Dumbbell Press'), E('Lateral Raise'), E('Triceps Pushdown'), E('Overhead Triceps Extension')],
  },
  {
    id: 'pull-day', name: 'Pull Day', goals: ['strength'],
    about: 'Back, rear delts and biceps.',
    steps: [E('Pull-Up'), E('Bent-Over Row'), E('Lat Pulldown'), E('Face Pull'), E('Biceps Curl'), E('Hammer Curl')],
  },
  {
    id: 'leg-day', name: 'Leg Day', goals: ['strength'],
    about: 'Quads, hamstrings, glutes and calves.',
    steps: [E('Back Squat'), E('Romanian Deadlift'), E('Bulgarian Split Squat'), E('Lying Leg Curl'), E('Hip Thrust'), E('Standing Calf Raise')],
  },
  {
    id: 'home-bodyweight', name: 'No-Equipment Full Body', goals: ['strength', 'core'],
    about: 'A full-body session with nothing but the floor.',
    steps: [E('Push-Up'), E('Bulgarian Split Squat'), E('Glute Bridge'), E('Superman'), E('Walking Lunge'), E('Side Plank')],
  },
  {
    id: 'core-stability', name: 'Core Stability', goals: ['core', 'backpain'],
    about: 'Train the deep core to brace and resist movement.',
    steps: [E('Crocodile Breathing'), E('Dead Bug'), E('Bird Dog'), E('Plank'), E('Side Plank'), E('Pallof Press')],
  },
  {
    id: 'shoulder-health', name: 'Shoulder Health', goals: ['desk', 'strength'],
    about: 'Rotator cuff strength and mobility for pain-free pressing and overhead work.',
    steps: [E('Band External Rotation'), E('Band Internal Rotation'), E('Full-Can Raise'), E('Face Pull'),
      S('rotatorcuff', 'Sleeper Stretch'), S('rotatorcuff', 'Cross-Body Stretch')],
  },
];

/* ---------- the viewer's own routines (this browser only) ---------- */
const KEY = 'stretchAtlas.routines';
export function loadMine() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v) ? v.filter((r) => r && r.id && Array.isArray(r.steps)) : [];
  } catch { return []; }
}
export function saveMine(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
}
export const newId = () => `my-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// development check: every ready-made step must resolve
for (const r of READY) for (const ref of r.steps) if (!resolveStep(ref)) console.warn(`Unknown step "${ref}" in ${r.name}`);
export { REGIONS };
