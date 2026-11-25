// Every selectable muscle in the 3D model.
// id -> [display name, body-part id, deep?, camera view?]
// "deep" muscles sit under others; selecting one fades the outer layer.
// Ids must match MUSCLE_RULES in tools/build_model.py.

const M = {
  // neck
  scm: ['Sternocleidomastoid', 'neck'],
  scalenes: ['Scalenes', 'neck'],
  levator: ['Levator scapulae', 'neck'],
  splenius: ['Splenius capitis & cervicis', 'neck'],
  neck_extensors: ['Semispinalis & neck erectors', 'neck', true],
  hyoids: ['Hyoid (strap) muscles', 'neck', false, 'front'],
  // deep neck
  neck_flexors: ['Deep neck flexors (longus colli & capitis)', 'deepneck', true, 'front'],
  suboccipitals: ['Suboccipitals', 'deepneck', true],
  neck_rotators: ['Cervical rotators & interspinales', 'deepneck', true],
  // upper back
  upper_trap: ['Upper trapezius', 'traps'],
  mid_trap: ['Middle trapezius', 'traps'],
  lower_trap: ['Lower trapezius', 'traps'],
  rhomboids: ['Rhomboids', 'traps', true],
  serratus_post: ['Serratus posterior', 'traps', true],
  // rotator cuff
  supraspinatus: ['Supraspinatus', 'rotatorcuff', true],
  infraspinatus: ['Infraspinatus', 'rotatorcuff'],
  teres_minor: ['Teres minor', 'rotatorcuff'],
  subscapularis: ['Subscapularis', 'rotatorcuff', true, 'front'],
  // shoulders
  front_delt: ['Front deltoid', 'shoulders'],
  side_delt: ['Side deltoid', 'shoulders'],
  rear_delt: ['Rear deltoid', 'shoulders'],
  // chest
  upper_pec: ['Upper chest (clavicular pec)', 'chest', false, 'front'],
  pec_major: ['Pectoralis major', 'chest', false, 'front'],
  pec_minor: ['Pectoralis minor', 'chest', true],
  subclavius: ['Subclavius', 'chest', true],
  // arms
  biceps: ['Biceps brachii', 'biceps', false, 'front'],
  brachialis: ['Brachialis', 'biceps'],
  coracobrachialis: ['Coracobrachialis', 'biceps', true, 'front'],
  triceps_long: ['Triceps – long head', 'triceps'],
  triceps_lat: ['Triceps – lateral head', 'triceps'],
  triceps_med: ['Triceps – medial head', 'triceps', true],
  anconeus: ['Anconeus', 'triceps'],
  brachioradialis: ['Brachioradialis', 'forearms'],
  wrist_flex: ['Wrist flexors', 'forearms'],
  finger_flex: ['Finger flexors', 'forearms'],
  wrist_ext: ['Wrist extensors', 'forearms'],
  finger_ext: ['Finger & thumb extensors', 'forearms'],
  forearm_deep: ['Supinator & pronator quadratus', 'forearms', true],
  hand: ['Hand muscles', 'forearms'],
  // trunk
  rectus_abs: ['Rectus abdominis', 'abs', false, 'front'],
  ext_oblique: ['External oblique', 'obliques'],
  int_oblique: ['Internal oblique', 'obliques', true],
  serratus_ant: ['Serratus anterior', 'obliques'],
  intercostals: ['Intercostals', 'obliques', true],
  latissimus: ['Latissimus dorsi', 'lats'],
  teres_major: ['Teres major', 'lats'],
  erectors: ['Erector spinae', 'lowerback'],
  ql: ['Quadratus lumborum', 'lowerback', true],
  // deep core
  transverse_abs: ['Transversus abdominis', 'deepcore', true],
  multifidus: ['Multifidus & spinal rotators', 'deepcore', true],
  diaphragm: ['Diaphragm', 'deepcore', true],
  pelvic_floor: ['Pelvic floor', 'deepcore', true],
  // hips
  glute_max: ['Gluteus maximus', 'glutes'],
  glute_med: ['Gluteus medius', 'glutes'],
  glute_min: ['Gluteus minimus', 'glutes', true],
  piriformis: ['Piriformis', 'hiprotators', true],
  gemelli: ['Gemelli', 'hiprotators', true],
  obturators: ['Obturator internus & externus', 'hiprotators', true],
  quadratus_fem: ['Quadratus femoris', 'hiprotators', true],
  psoas: ['Psoas major', 'hipflexors', true],
  iliacus: ['Iliacus', 'hipflexors', true],
  sartorius: ['Sartorius', 'hipflexors'],
  tfl: ['Tensor fasciae latae', 'itband'],
  it_band: ['Iliotibial band', 'itband'],
  // thighs
  add_longus: ['Adductor longus', 'adductors'],
  add_brevis: ['Adductor brevis', 'adductors', true],
  add_magnus: ['Adductor magnus', 'adductors'],
  gracilis: ['Gracilis', 'adductors', false, 'front'],
  pectineus: ['Pectineus', 'adductors'],
  rectus_fem: ['Rectus femoris', 'quads', false, 'front'],
  vastus_lat: ['Vastus lateralis', 'quads'],
  vastus_med: ['Vastus medialis', 'quads'],
  vastus_int: ['Vastus intermedius', 'quads', true, 'front'],
  biceps_fem: ['Biceps femoris', 'hamstrings'],
  semitendinosus: ['Semitendinosus', 'hamstrings'],
  semimembranosus: ['Semimembranosus', 'hamstrings'],
  // lower legs & feet
  gastroc: ['Gastrocnemius', 'calves'],
  soleus: ['Soleus', 'calves'],
  plantaris: ['Plantaris', 'calves', true],
  achilles: ['Achilles tendon', 'calves'],
  popliteus: ['Popliteus', 'calves', true],
  deep_calf: ['Tibialis posterior & deep toe flexors', 'calves', true],
  tib_ant: ['Tibialis anterior', 'shins'],
  toe_extensors: ['Toe extensors', 'shins'],
  peroneals: ['Peroneals (fibularis)', 'shins'],
  foot_top: ['Top-of-foot muscles', 'feet'],
  foot_sole: ['Sole muscles & plantar fascia', 'feet'],
};

export const MUSCLES = Object.fromEntries(
  Object.entries(M).map(([id, [name, region, deep = false, view = null]]) => [id, { id, name, region, deep, view }]),
);

export const MUSCLES_BY_REGION = {};
for (const m of Object.values(MUSCLES)) (MUSCLES_BY_REGION[m.region] ||= []).push(m.id);
