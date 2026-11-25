// Strength exercises. Each one lists the muscles it trains (ids from muscles.js):
// primary = the main movers, secondary = assisting and stabilising muscles.
// type: 'compound' moves several joints, 'isolation' moves one.
// equipment: any one of these is enough to do the exercise.
import { MUSCLES } from './muscles.js';

export const EQUIPMENT = [
  ['bodyweight', 'Bodyweight'],
  ['dumbbell', 'Dumbbell'],
  ['barbell', 'Barbell'],
  ['kettlebell', 'Kettlebell'],
  ['cable', 'Cable'],
  ['machine', 'Machine'],
  ['band', 'Band'],
];

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const TRI = 'triceps_long triceps_lat triceps_med';
const QUADS = 'rectus_fem vastus_lat vastus_med vastus_int';
const HAMS = 'biceps_fem semitendinosus semimembranosus';
const list = (s) => s.split(/\s+/).filter(Boolean);

const E = [];
// name, c|i, equipment, primary, secondary, how, dose
const ex = (name, type, equipment, primary, secondary, how, dose) =>
  E.push({ name, type: type === 'c' ? 'compound' : 'isolation', equipment: list(equipment), primary: list(primary), secondary: list(secondary), how, dose });

/* ---------- chest ---------- */
ex('Bench Press', 'c', 'barbell dumbbell', 'pec_major', `upper_pec front_delt ${TRI}`, 'Lie on a bench with feet planted, lower the bar to the mid-chest with elbows about 45° from the body, then press back up.', '3–4 × 6–10');
ex('Incline Dumbbell Press', 'c', 'dumbbell barbell', 'upper_pec', `pec_major front_delt ${TRI}`, 'On a bench set to 30–45°, lower the dumbbells beside the upper chest and press them up and slightly together.', '3 × 8–12');
ex('Push-Up', 'c', 'bodyweight', 'pec_major', `upper_pec front_delt ${TRI} serratus_ant rectus_abs`, 'Hands just wider than shoulders, body in one straight line. Lower the chest to the floor and push back up.', '3 × 10–20');
ex('Dips', 'c', 'bodyweight', `pec_major ${TRI}`, 'front_delt pec_minor upper_pec', 'Support yourself on parallel bars, lean slightly forward and lower until the shoulders are just below the elbows, then press up.', '3 × 6–12');
ex('Dumbbell Fly', 'i', 'dumbbell cable machine', 'pec_major upper_pec', 'front_delt biceps', 'Lie on a bench with a slight bend in the elbows and open the arms wide in an arc, then squeeze them back together over the chest.', '3 × 10–15');
ex('Cable Crossover', 'i', 'cable band', 'pec_major', 'upper_pec front_delt', 'Stand between two cables set high and sweep the hands down and together in front of the hips.', '3 × 12–15');
ex('Low-to-High Cable Fly', 'i', 'cable band', 'upper_pec', 'pec_major front_delt', 'With cables set low, sweep the hands up and together to chin height, keeping a soft bend in the elbows.', '3 × 12–15');

/* ---------- shoulders ---------- */
ex('Overhead Press', 'c', 'barbell dumbbell kettlebell', 'front_delt side_delt', `${TRI} upper_trap serratus_ant upper_pec`, 'Stand tall with glutes and abs tight and press the weight from the shoulders to straight overhead.', '3–4 × 6–10');
ex('Lateral Raise', 'i', 'dumbbell cable band', 'side_delt', 'upper_trap supraspinatus front_delt', 'With a slight bend in the elbows, raise the arms out to the sides until they are level with the shoulders.', '3 × 12–20');
ex('Front Raise', 'i', 'dumbbell cable band', 'front_delt', 'upper_pec side_delt', 'Lift the weight straight in front of you to shoulder height and lower it slowly.', '3 × 10–15');
ex('Rear Delt Fly', 'i', 'dumbbell cable machine band', 'rear_delt', 'mid_trap rhomboids infraspinatus teres_minor', 'Hinge forward with a flat back and open the arms out to the sides, leading with the elbows.', '3 × 12–20');
ex('Face Pull', 'c', 'cable band', 'rear_delt infraspinatus teres_minor', 'mid_trap lower_trap rhomboids', 'Pull a rope from face height toward your forehead, splitting the ends and rotating the hands back so the knuckles point up.', '3 × 12–15');
ex('Upright Row', 'c', 'barbell dumbbell cable', 'side_delt upper_trap', 'front_delt biceps', 'Pull the weight up close to the body to lower-chest height, leading with the elbows.', '3 × 10–12');

/* ---------- upper back ---------- */
ex('Shrug', 'i', 'barbell dumbbell machine', 'upper_trap', 'levator mid_trap finger_flex', 'Hold the weight at your sides and lift the shoulders straight up toward the ears, then lower under control.', '3 × 10–15');
ex('Bent-Over Row', 'c', 'barbell dumbbell', 'latissimus mid_trap rhomboids', 'rear_delt biceps brachialis teres_major erectors', 'Hinge forward with a flat back and row the weight to the lower ribs, squeezing the shoulder blades together.', '3–4 × 8–10');
ex('Seated Cable Row', 'c', 'cable machine band', 'mid_trap rhomboids latissimus', 'rear_delt biceps brachialis teres_major', 'Sit tall and pull the handle to your stomach, drawing the shoulder blades back and down.', '3 × 10–12');
ex('Prone Y-T-W Raise', 'i', 'bodyweight dumbbell', 'lower_trap mid_trap', 'rear_delt infraspinatus supraspinatus rhomboids', 'Lie face down on an incline bench and lift the arms into a Y, then a T, then a W shape, holding each briefly.', '2–3 × 8 each shape');
ex('Band Pull-Apart', 'i', 'band', 'rear_delt mid_trap rhomboids', 'infraspinatus teres_minor lower_trap', 'Hold a band at shoulder height with straight arms and pull it apart until it touches the chest.', '3 × 15–20');
ex("Farmer's Carry", 'c', 'dumbbell kettlebell', 'upper_trap finger_flex', 'wrist_flex ql ext_oblique int_oblique transverse_abs glute_med', 'Pick up heavy weights and walk tall with the shoulders back and the trunk braced.', '3 × 30–40 m');

/* ---------- rotator cuff ---------- */
ex('Side-Lying External Rotation', 'i', 'dumbbell', 'infraspinatus teres_minor', 'rear_delt', 'Lie on your side, elbow bent 90° and pinned to the ribs, and rotate the forearm up toward the ceiling.', '2–3 × 12–15');
ex('Band External Rotation', 'i', 'band cable', 'infraspinatus teres_minor', 'rear_delt supraspinatus mid_trap', 'Elbow bent 90° at your side, rotate the hand outward against the band without letting the elbow drift.', '2–3 × 15');
ex('Band Internal Rotation', 'i', 'band cable', 'subscapularis', 'pec_major latissimus teres_major', 'Elbow bent 90° at your side, rotate the hand in across the stomach against the band.', '2–3 × 15');
ex('Full-Can Raise', 'i', 'dumbbell band', 'supraspinatus', 'side_delt front_delt', 'With thumbs up, raise the arms at 30° in front of the body to shoulder height.', '2–3 × 12–15');
ex('90/90 External Rotation', 'i', 'band cable dumbbell', 'infraspinatus teres_minor', 'lower_trap rear_delt supraspinatus', 'Hold the upper arm out at shoulder height with the elbow at 90°, and rotate the forearm up until it points to the ceiling.', '2–3 × 12');

/* ---------- arms ---------- */
ex('Biceps Curl', 'i', 'barbell dumbbell cable band', 'biceps', 'brachialis brachioradialis', 'Keep the elbows by your sides and curl the weight up, then lower it slowly.', '3 × 8–12');
ex('Hammer Curl', 'i', 'dumbbell cable', 'brachialis brachioradialis', 'biceps', 'Curl with the palms facing each other, as if holding a hammer.', '3 × 10–12');
ex('Incline Dumbbell Curl', 'i', 'dumbbell', 'biceps', 'brachialis', 'Sit back on an incline bench with the arms hanging behind the body and curl without moving the elbows forward.', '3 × 10–12');
ex('Preacher Curl', 'i', 'machine dumbbell barbell', 'biceps brachialis', 'brachioradialis', 'Rest the upper arms on a preacher pad and curl the weight up, lowering until the arms are almost straight.', '3 × 10–12');
ex('Chin-Up', 'c', 'bodyweight', 'latissimus biceps', 'brachialis teres_major lower_trap rhomboids rectus_abs', 'Hang from a bar with palms facing you and pull until the chin clears the bar.', '3 × 5–10');
ex('Close-Grip Bench Press', 'c', 'barbell', TRI, 'pec_major front_delt', 'Bench press with hands shoulder-width apart and elbows tucked close to the body.', '3 × 6–10');
ex('Skull Crusher', 'i', 'barbell dumbbell', TRI, 'anconeus', 'Lying on a bench, bend only at the elbows to lower the weight toward the forehead, then extend.', '3 × 10–12');
ex('Triceps Pushdown', 'i', 'cable band', 'triceps_lat triceps_med', 'triceps_long anconeus', 'Elbows pinned at your sides, push the handle down until the arms are straight.', '3 × 12–15');
ex('Overhead Triceps Extension', 'i', 'dumbbell cable band', 'triceps_long', 'triceps_lat triceps_med', 'Hold the weight overhead and lower it behind the head by bending the elbows, then press back up.', '3 × 10–12');
ex('Diamond Push-Up', 'c', 'bodyweight', TRI, 'pec_major front_delt', 'Do a push-up with the hands close together under the chest so the thumbs and index fingers form a diamond.', '3 × 8–15');

/* ---------- forearms ---------- */
ex('Wrist Curl', 'i', 'dumbbell barbell', 'wrist_flex finger_flex', '', 'Rest the forearms on your thighs, palms up, and curl the weight using only the wrists.', '3 × 15–20');
ex('Reverse Wrist Curl', 'i', 'dumbbell barbell', 'wrist_ext', 'finger_ext', 'With the palms facing down, lift the back of the hand toward you using only the wrist.', '3 × 15–20');
ex('Reverse Curl', 'i', 'barbell dumbbell cable', 'brachioradialis', 'brachialis wrist_ext biceps', 'Curl with an overhand grip, keeping the wrists straight.', '3 × 10–12');
ex('Dead Hang', 'c', 'bodyweight', 'finger_flex wrist_flex', 'latissimus lower_trap hand', 'Hang from a pull-up bar with a full grip and the shoulders gently engaged.', '3 × 20–60 s');
ex('Forearm Rotations', 'i', 'dumbbell', 'forearm_deep', 'brachioradialis wrist_flex wrist_ext', 'Hold a hammer or a dumbbell by one end and slowly turn the palm up and down.', '2–3 × 12 each way');
ex('Plate Pinch', 'i', 'barbell', 'hand finger_flex', 'wrist_flex', 'Pinch two weight plates together smooth-side out and hold them at your side.', '3 × 20–30 s');

/* ---------- abs & obliques ---------- */
ex('Crunch', 'i', 'bodyweight', 'rectus_abs', 'ext_oblique', 'Lie on your back with knees bent and curl the ribs toward the pelvis, lifting the shoulder blades.', '3 × 15–20');
ex('Cable Crunch', 'i', 'cable band', 'rectus_abs', 'ext_oblique int_oblique', 'Kneel facing a cable with a rope behind the head and crunch the ribs down toward the hips.', '3 × 12–15');
ex('Hanging Leg Raise', 'c', 'bodyweight', 'rectus_abs psoas iliacus', 'ext_oblique rectus_fem finger_flex', 'Hang from a bar and raise the legs, curling the pelvis up at the top.', '3 × 8–12');
ex('Ab Wheel Rollout', 'c', 'bodyweight', 'rectus_abs', 'transverse_abs latissimus ext_oblique serratus_ant', 'From your knees, roll the wheel forward as far as you can without the lower back sagging, then pull back.', '3 × 8–12');
ex('Plank', 'c', 'bodyweight', 'rectus_abs transverse_abs', 'ext_oblique int_oblique serratus_ant glute_max', 'Hold a straight line from head to heels on the forearms, with the ribs down and glutes tight.', '3 × 30–60 s');
ex('Russian Twist', 'i', 'bodyweight dumbbell kettlebell', 'ext_oblique int_oblique', 'rectus_abs psoas', 'Sit leaning back with feet up or on the floor and rotate the chest from side to side.', '3 × 10 each side');
ex('Side Plank', 'c', 'bodyweight', 'ext_oblique int_oblique ql', 'glute_med transverse_abs', 'Hold a straight line on one forearm and the side of the foot, hips lifted.', '3 × 20–45 s each side');
ex('Pallof Press', 'c', 'cable band', 'transverse_abs int_oblique ext_oblique', 'rectus_abs glute_med', 'Stand side-on to a cable and press the handle straight out from the chest without letting it pull you round.', '3 × 10 each side');
ex('Cable Woodchop', 'c', 'cable band', 'ext_oblique int_oblique', 'rectus_abs front_delt glute_max serratus_ant', 'Rotate through the trunk to pull a cable diagonally from high to low across the body.', '3 × 10–12 each side');
ex('Scapular Push-Up', 'i', 'bodyweight', 'serratus_ant', 'pec_minor lower_trap', 'In a push-up position with straight arms, let the chest sink between the shoulder blades, then push the floor away.', '3 × 12–15');

/* ---------- lats ---------- */
ex('Pull-Up', 'c', 'bodyweight', 'latissimus teres_major', 'biceps brachialis lower_trap rhomboids rear_delt', 'Hang with an overhand grip and pull until the chin clears the bar, driving the elbows down.', '3 × 5–10');
ex('Lat Pulldown', 'c', 'cable machine band', 'latissimus teres_major', 'biceps brachialis rhomboids lower_trap', 'Pull the bar to the upper chest while leaning back slightly, then let it rise under control.', '3 × 8–12');
ex('Straight-Arm Pulldown', 'i', 'cable band', 'latissimus teres_major', 'triceps_long rear_delt', 'With straight arms, sweep the bar from overhead down to the thighs.', '3 × 12–15');
ex('Single-Arm Dumbbell Row', 'c', 'dumbbell kettlebell', 'latissimus mid_trap rhomboids', 'rear_delt biceps teres_major erectors', 'With one hand and knee on a bench, row the dumbbell to the hip.', '3 × 8–12 each side');
ex('Dumbbell Pullover', 'i', 'dumbbell', 'latissimus pec_major', 'teres_major triceps_long serratus_ant', 'Lie across a bench and lower one dumbbell behind the head with soft elbows, then pull it back over the chest.', '3 × 10–12');

/* ---------- lower back ---------- */
ex('Deadlift', 'c', 'barbell kettlebell dumbbell', `erectors glute_max ${HAMS}`, `add_magnus finger_flex upper_trap latissimus ${QUADS} transverse_abs`, 'With the bar over the mid-foot, brace and stand up by driving the floor away, keeping the bar close and the back flat.', '3 × 3–6');
ex('Back Extension', 'c', 'bodyweight machine', 'erectors glute_max', `${HAMS} multifidus`, 'On a back-extension bench, hinge down and lift the trunk until it lines up with the legs.', '3 × 12–15');
ex('Superman', 'i', 'bodyweight', 'erectors multifidus', 'glute_max rear_delt lower_trap', 'Lie face down and lift the arms, chest and legs a few centimetres off the floor.', '3 × 10–12');
ex('Good Morning', 'c', 'barbell band', `erectors ${HAMS}`, 'glute_max add_magnus', 'With a bar on the upper back, hinge at the hips with soft knees until the trunk is near parallel, then stand up.', '3 × 8–10');
ex('Suitcase Carry', 'c', 'dumbbell kettlebell', 'ql ext_oblique int_oblique', 'glute_med finger_flex upper_trap transverse_abs', 'Carry a heavy weight in one hand while staying perfectly upright.', '3 × 30 m each side');

/* ---------- deep core ---------- */
ex('Dead Bug', 'c', 'bodyweight', 'transverse_abs rectus_abs', 'int_oblique psoas diaphragm', 'On your back with arms up and knees over hips, lower the opposite arm and leg while the lower back stays down.', '3 × 8 each side');
ex('Bird Dog', 'c', 'bodyweight', 'multifidus erectors', 'glute_max glute_med transverse_abs rear_delt', 'On all fours, reach one arm forward and the opposite leg back without the hips rotating.', '3 × 8 each side');
ex('Stomach Vacuum', 'i', 'bodyweight', 'transverse_abs', 'diaphragm int_oblique', 'Exhale fully, then draw the belly button in toward the spine and hold while breathing shallowly.', '5 × 15–20 s');
ex('Crocodile Breathing', 'i', 'bodyweight', 'diaphragm', 'intercostals transverse_abs pelvic_floor', 'Lie face down, forehead on your hands, and breathe so the lower back and sides rise against gravity.', '5 min');
ex('Pelvic Floor Contractions', 'i', 'bodyweight', 'pelvic_floor', 'transverse_abs', 'Gently lift and squeeze the pelvic floor as if stopping urine flow, hold, then fully relax.', '3 × 10 (5 s hold)');
ex('Heel Taps', 'i', 'bodyweight', 'transverse_abs', 'rectus_abs psoas', 'On your back with knees bent 90° in the air, lower one heel at a time to tap the floor while keeping the back flat.', '3 × 10 each side');

/* ---------- glutes & hip rotators ---------- */
ex('Hip Thrust', 'i', 'barbell dumbbell bodyweight band machine', 'glute_max', `biceps_fem semitendinosus glute_med add_magnus`, 'With the upper back on a bench, drive the hips up until the body is level and squeeze the glutes.', '3 × 8–12');
ex('Glute Bridge', 'i', 'bodyweight band', 'glute_max', 'biceps_fem erectors glute_med', 'Lying on your back with knees bent, lift the hips until shoulders, hips and knees line up.', '3 × 12–20');
ex('Cable Kickback', 'i', 'cable band', 'glute_max', 'biceps_fem glute_med', 'Attach a cuff to the ankle and kick the leg straight back without arching the lower back.', '3 × 12–15 each side');
ex('Side-Lying Hip Abduction', 'i', 'bodyweight band cable', 'glute_med tfl', 'glute_min', 'Lie on your side and lift the top leg up and slightly back, keeping the toes pointing forward.', '3 × 15 each side');
ex('Lateral Band Walk', 'i', 'band', 'glute_med tfl', 'glute_min glute_max', 'With a band around the knees or ankles, take small side steps in a half squat.', '3 × 12 steps each way');
ex('Hip Abduction Machine', 'i', 'machine cable band', 'glute_med tfl', 'glute_min', 'Sit in the machine and push the knees outward against the pads, then return slowly.', '3 × 15');
ex('Clamshell', 'i', 'band bodyweight', 'piriformis gemelli obturators quadratus_fem glute_med', 'glute_min', 'Lie on your side with knees bent and feet together, and open the top knee without rolling the pelvis back.', '3 × 15 each side');
ex('Fire Hydrant', 'i', 'bodyweight band', 'glute_med piriformis', 'glute_min gemelli glute_max', 'On all fours, lift one bent knee out to the side as high as you can without shifting your weight.', '3 × 12 each side');
ex('Seated Banded Hip External Rotation', 'i', 'band cable', 'obturators gemelli quadratus_fem piriformis', 'glute_max', 'Sit on a box with a band around the ankle and swing the foot inward so the thigh rotates outward.', '3 × 12 each side');
ex('90/90 Hip Lift-Offs', 'i', 'bodyweight', 'piriformis gemelli obturators', 'glute_med psoas', 'Sit in a 90/90 position and lift the back knee and foot off the floor without leaning away.', '3 × 8 each side');

/* ---------- legs ---------- */
ex('Back Squat', 'c', 'barbell', `${QUADS} glute_max`, 'add_magnus erectors soleus transverse_abs', 'With the bar on the upper back, sit down between the heels until the thighs are at least parallel, then stand up.', '3–4 × 5–8');
ex('Goblet Squat', 'c', 'dumbbell kettlebell', `${QUADS} glute_max`, 'add_magnus rectus_abs upper_trap', 'Hold a weight at the chest and squat deep with the elbows inside the knees.', '3 × 10–12');
ex('Leg Press', 'c', 'machine', `${QUADS} glute_max`, 'add_magnus soleus', 'Lower the platform until the knees are bent about 90°, then press it away without locking out hard.', '3 × 10–12');
ex('Bulgarian Split Squat', 'c', 'dumbbell bodyweight barbell kettlebell', `${QUADS} glute_max`, 'glute_med add_magnus', 'With the back foot on a bench, lower straight down until the back knee nearly touches the floor.', '3 × 8–10 each side');
ex('Walking Lunge', 'c', 'bodyweight dumbbell barbell', `${QUADS} glute_max`, 'glute_med add_magnus gastroc', 'Step forward into a lunge, push through the front heel and step straight into the next one.', '3 × 10 each side');
ex('Step-Up', 'c', 'dumbbell bodyweight barbell', 'glute_max vastus_lat vastus_med', 'rectus_fem glute_med soleus', 'Step onto a box and stand fully up, then step down slowly with the same leg.', '3 × 10 each side');
ex('Leg Extension', 'i', 'machine band', QUADS, '', 'Sit in the machine and straighten the knees, pausing briefly at the top.', '3 × 12–15');
ex('Romanian Deadlift', 'c', 'barbell dumbbell kettlebell', `${HAMS} glute_max`, 'erectors add_magnus finger_flex', 'With soft knees, push the hips back and slide the weight down the thighs until you feel the hamstrings stretch, then stand.', '3 × 8–10');
ex('Lying Leg Curl', 'i', 'machine band', HAMS, 'gastroc', 'Lie face down in the machine and curl the heels toward the glutes.', '3 × 10–12');
ex('Nordic Curl', 'i', 'bodyweight', HAMS, 'gastroc glute_max', 'Kneel with the ankles anchored and lower the body forward as slowly as possible, catching yourself with the hands.', '3 × 4–6');
ex('Kettlebell Swing', 'c', 'kettlebell dumbbell', `glute_max ${HAMS}`, 'erectors transverse_abs front_delt finger_flex', 'Hinge and hike the bell back between the legs, then snap the hips forward to float it to chest height.', '3 × 15–20');
ex('Sumo Squat', 'c', 'barbell dumbbell kettlebell', 'add_magnus add_longus glute_max vastus_med', 'vastus_lat rectus_fem gracilis', 'Take a wide stance with toes turned out and squat straight down, pushing the knees out.', '3 × 10–12');
ex('Lateral Lunge', 'c', 'bodyweight dumbbell kettlebell', 'add_magnus add_longus vastus_med glute_max', 'gracilis vastus_lat glute_med', 'Step wide to one side and sit back into that hip, keeping the other leg straight.', '3 × 8 each side');
ex('Copenhagen Plank', 'c', 'bodyweight', 'add_longus add_brevis add_magnus gracilis', 'int_oblique ext_oblique pectineus', 'In a side plank, rest the top leg on a bench and lift the bottom leg and hips off the floor.', '3 × 15–30 s each side');
ex('Hip Adduction Machine', 'i', 'machine cable band', 'add_longus add_brevis add_magnus pectineus gracilis', '', 'Sit in the machine and squeeze the legs together against the pads.', '3 × 12–15');

/* ---------- hip flexors ---------- */
ex('Lying Leg Raise', 'i', 'bodyweight', 'psoas iliacus rectus_abs', 'rectus_fem', 'Lie on your back and lift straight legs to vertical, lowering them slowly without arching the back.', '3 × 10–15');
ex('Standing Banded March', 'i', 'band cable machine', 'psoas iliacus rectus_fem', 'sartorius tfl', 'With a band around the feet, drive one knee above hip height and hold briefly.', '3 × 10 each side');
ex('L-Sit', 'c', 'bodyweight', 'psoas iliacus rectus_abs', `rectus_fem ${TRI}`, 'Press up on parallettes or a bench and hold the legs straight out in front.', '3 × 10–20 s');

/* ---------- lower legs & feet ---------- */
ex('Standing Calf Raise', 'i', 'machine bodyweight dumbbell barbell', 'gastroc', 'soleus plantaris peroneals', 'Rise onto the balls of the feet as high as possible with straight knees, then lower below the step.', '3 × 12–20');
ex('Seated Calf Raise', 'i', 'machine dumbbell', 'soleus', 'gastroc deep_calf', 'Seated with weight on the knees, raise the heels as high as possible.', '3 × 15–20');
ex('Jump Rope', 'c', 'bodyweight', 'gastroc soleus', 'tib_ant peroneals foot_sole', 'Stay light on the balls of the feet with small, quick jumps.', '3 × 1–2 min');
ex('Banded Foot Inversion', 'i', 'band', 'deep_calf', 'tib_ant', 'Seated with a band around the forefoot pulling outward, turn the sole of the foot inward against it.', '3 × 15');
ex('Tibialis Raise', 'i', 'bodyweight band machine', 'tib_ant toe_extensors', '', 'Lean your back against a wall with heels forward and lift the toes as high as possible.', '3 × 15–25');
ex('Heel Walk', 'i', 'bodyweight', 'tib_ant toe_extensors', 'peroneals', 'Walk on your heels with the toes pulled up toward the shins.', '3 × 20 m');
ex('Banded Eversion', 'i', 'band', 'peroneals', 'toe_extensors', 'Seated with a band around the forefoot pulling inward, turn the sole of the foot outward against it.', '3 × 15');
ex('Short Foot', 'i', 'bodyweight', 'foot_sole', 'deep_calf tib_ant', 'Without curling the toes, draw the ball of the foot toward the heel to lift the arch.', '3 × 10 (5 s hold)');
ex('Towel Scrunches', 'i', 'bodyweight', 'foot_sole', 'deep_calf', 'Seated, use the toes to scrunch a towel toward you across the floor.', '3 × 30 s');
ex('Toe Yoga', 'i', 'bodyweight', 'foot_sole foot_top', 'toe_extensors', 'Lift the big toe while the others stay down, then switch.', '3 × 10');
ex('Single-Leg Balance', 'c', 'bodyweight', 'foot_sole peroneals deep_calf', 'glute_med soleus tib_ant', 'Stand on one foot with a soft knee. Make it harder by closing your eyes or standing on a cushion.', '3 × 30 s each side');

/* ---------- neck ---------- */
ex('Neck Flexion', 'i', 'bodyweight band', 'scm neck_flexors', 'scalenes hyoids', 'Lying on your back with the head off a bench, nod the chin toward the chest and lift the head.', '2–3 × 12–15');
ex('Neck Extension', 'i', 'band bodyweight', 'splenius neck_extensors upper_trap', 'suboccipitals levator', 'With a band around the back of the head, look slightly up against the resistance and return.', '2–3 × 12–15');
ex('Lateral Neck Flexion', 'i', 'band bodyweight', 'scm scalenes', 'levator upper_trap', 'Tilt the ear toward the shoulder against light hand or band resistance.', '2–3 × 12 each side');
ex('Chin Tuck', 'i', 'bodyweight', 'neck_flexors', 'suboccipitals hyoids', 'Glide the chin straight back to make a double chin and hold for a few seconds.', '3 × 10 (5 s hold)');
ex('Chin-Tuck Head Lift', 'i', 'bodyweight', 'neck_flexors scm', 'hyoids', 'Lying on your back, tuck the chin and lift the head a few centimetres off the floor.', '3 × 10–20 s');
ex('Prone Head Hold', 'i', 'bodyweight', 'neck_extensors suboccipitals lower_trap', 'rhomboids mid_trap', 'Lie face down on your forearms with the chin tucked and hold the head level with the spine.', '3 × 20–30 s');
ex('Isometric Neck Rotation', 'i', 'bodyweight band', 'neck_rotators suboccipitals scm splenius', 'scalenes', 'Press your hand against the side of your head and try to turn toward it without moving.', '3 × 10 s each side');

export const EXERCISES = E.map((e, i) => ({ ...e, id: `ex${i}`, url: yt(`how to do ${e.name} proper form`) }));
export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

// sanity check during development
for (const e of EXERCISES)
  for (const m of [...e.primary, ...e.secondary])
    if (!MUSCLES[m]) console.warn(`Unknown muscle "${m}" in ${e.name}`);
