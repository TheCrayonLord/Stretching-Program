// Body regions and their stretches.
// `view` is the direction the camera sits in relative to the muscle
// (+z = front of the body, -z = back, +x = the side).

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const s = (name, how, hold, query) => ({ name, how, hold, url: yt(query || `how to do ${name}`) });

export const REGIONS = [
  {
    id: 'neck', name: 'Neck', view: [0.55, 0.15, 1],
    muscles: 'Sternocleidomastoid, scalenes, levator scapulae',
    aliases: 'cervical throat tech neck stiff neck scm',
    stretches: [
      s('Upper Trapezius Neck Stretch', 'Sit tall, drop one ear toward the shoulder and gently add weight with the same-side hand. Keep the opposite shoulder down.', '30 s each side', 'ear to shoulder neck stretch'),
      s('Levator Scapulae Stretch', 'Turn your head 45° and look down toward your armpit, then lightly pull the head forward and down.', '30 s each side'),
      s('Chin Tucks', 'Glide the chin straight back to make a "double chin" without tilting the head. Lengthens the back of the neck.', '10 slow reps', 'chin tuck exercise neck'),
      s('SCM Stretch', 'Anchor the collarbone with your fingers, tilt the head back and rotate away to open the front of the neck.', '20–30 s each side', 'sternocleidomastoid stretch'),
    ],
  },
  {
    id: 'traps', name: 'Upper Back & Traps', view: [0, 0.35, -1],
    muscles: 'Trapezius, rhomboids',
    aliases: 'trapezius rhomboid shoulder blade scapula thoracic upper back mid back posture knots',
    stretches: [
      s('Thread the Needle', 'From all fours, slide one arm under the other until the shoulder and ear rest on the floor. Breathe into the upper back.', '30–45 s each side', 'thread the needle stretch'),
      s('Cat-Cow', 'On hands and knees, alternate rounding the spine to the ceiling and arching it toward the floor.', '10 slow cycles', 'cat cow stretch'),
      s('Eagle Arms', 'Cross the elbows, wrap the forearms and lift the elbows to spread the shoulder blades apart.', '30 s each side', 'eagle arms upper back stretch'),
      s('Seated Rhomboid Stretch', 'Clasp the hands in front, round the upper back and push the hands away while dropping the chin.', '30 s', 'rhomboid stretch'),
    ],
  },
  {
    id: 'shoulders', name: 'Shoulders', view: [0.9, 0.25, 0.6],
    muscles: 'Deltoids (front, side, rear)',
    aliases: 'deltoid delts shoulder',
    stretches: [
      s('Cross-Body Shoulder Stretch', 'Bring one arm across the chest and hug it in with the other forearm, keeping the shoulder low.', '30 s each side', 'cross body shoulder stretch'),
      s('Sleeper Stretch', 'Lie on your side with the bottom elbow bent 90°, then gently press the forearm toward the floor.', '30 s each side', 'sleeper stretch shoulder'),
      s('Behind-the-Back Clasp', 'Interlace the fingers behind the back, straighten the arms and lift the hands away to open the front delts.', '30 s', 'hands clasped behind back shoulder stretch'),
      s('Wall Shoulder Flexion Stretch', 'Place both hands on a wall, walk back and sink the chest toward the floor with straight arms.', '30–45 s', 'wall shoulder flexion stretch'),
    ],
  },
  {
    id: 'chest', name: 'Chest', view: [0, 0.1, 1],
    muscles: 'Pectoralis major & minor',
    aliases: 'pecs pectorals pectoral bench rounded shoulders',
    stretches: [
      s('Doorway Pec Stretch', 'Place the forearms on a door frame with elbows at shoulder height and step through until the chest opens.', '30 s, 2–3 rounds', 'doorway pec stretch'),
      s('Wall Pec Stretch', 'Put one palm on a wall behind you at shoulder height and rotate the body away from the arm.', '30 s each side', 'wall chest stretch single arm'),
      s('Floor Angels', 'Lie on your back, arms in a goalpost position, and slide them overhead while keeping the wrists on the floor.', '10 slow reps', 'floor angels exercise'),
      s('Foam Roller Chest Opener', 'Lie lengthwise on a foam roller and let the arms fall open to the sides, palms up.', '1–2 min', 'foam roller chest opener stretch'),
    ],
  },
  {
    id: 'biceps', name: 'Biceps', view: [0.5, 0.1, 1],
    muscles: 'Biceps brachii, brachialis',
    aliases: 'bicep upper arm front of arm guns',
    stretches: [
      s('Wall Biceps Stretch', 'Place the palm on a wall behind you with the thumb down and the arm straight, then turn the chest away.', '30 s each side', 'wall bicep stretch'),
      s('Seated Biceps Stretch', 'Sit with hands on the floor behind you, fingers pointing back, and slide the hips forward.', '30 s', 'seated bicep stretch'),
      s('Standing Biceps Stretch', 'Clasp the hands behind the back, rotate the palms down and lift the arms.', '30 s', 'standing bicep stretch hands behind back'),
    ],
  },
  {
    id: 'triceps', name: 'Triceps', view: [0.6, 0.1, -1],
    muscles: 'Triceps brachii',
    aliases: 'tricep back of arm upper arm',
    stretches: [
      s('Overhead Triceps Stretch', 'Reach one hand down between the shoulder blades and use the other hand to draw the elbow back and in.', '30 s each side', 'overhead tricep stretch'),
      s('Towel Triceps Stretch', 'Hold a towel behind the back with one hand over the shoulder and pull down with the lower hand.', '30 s each side', 'towel tricep stretch'),
      s('Bench Triceps & Lat Stretch', 'Kneel with elbows on a bench, hands together, and sink the chest down as the hands fold behind the head.', '30–45 s', 'kneeling bench tricep lat stretch'),
    ],
  },
  {
    id: 'forearms', name: 'Forearms & Wrists', view: [0.6, 0, 1],
    muscles: 'Wrist flexors & extensors, brachioradialis, hands',
    aliases: 'forearm wrist hand hands fingers grip carpal tunnel typing tennis elbow golfers elbow',
    stretches: [
      s('Wrist Flexor Stretch', 'Extend the arm palm-up and use the other hand to pull the fingers down and back.', '30 s each side', 'wrist flexor stretch'),
      s('Wrist Extensor Stretch', 'Extend the arm palm-down, let the hand drop and gently draw it toward you.', '30 s each side', 'wrist extensor stretch'),
      s('Prayer Stretch', 'Press the palms together at chest height and lower the hands until the forearms stretch.', '30 s', 'prayer stretch wrists'),
      s('Quadruped Wrist Stretch', 'On all fours, turn the fingers to face the knees and rock the hips back.', '20–30 s', 'quadruped wrist stretch fingers back'),
    ],
  },
  {
    id: 'abs', name: 'Abdominals', view: [0, 0, 1],
    muscles: 'Rectus abdominis',
    aliases: 'abs core stomach belly six pack sixpack tummy',
    stretches: [
      s('Cobra Pose', 'Lie face down, hands under the shoulders, and press the chest up while the hips stay on the floor.', '20–30 s', 'cobra pose stretch'),
      s('Upward-Facing Dog', 'From cobra, straighten the arms and lift the thighs off the floor, opening the whole front body.', '15–30 s', 'upward facing dog pose'),
      s('Standing Backbend', 'Stand with hands on the lower back, lift the chest and lean back gently.', '15–20 s', 'standing back bend stretch'),
      s('Stability Ball Ab Stretch', 'Lie back over a stability ball and reach the arms overhead.', '30–60 s', 'stability ball ab stretch'),
    ],
  },
  {
    id: 'obliques', name: 'Obliques & Side Body', view: [0.9, 0, 0.7],
    muscles: 'External & internal obliques, serratus anterior',
    aliases: 'oblique side waist love handles serratus ribs core twist',
    stretches: [
      s('Standing Side Bend', 'Reach one arm overhead and lean to the opposite side without twisting.', '30 s each side', 'standing side bend stretch'),
      s('Seated Spinal Twist', 'Sit with one leg crossed over the other and rotate toward the top knee, growing tall as you turn.', '30 s each side', 'seated spinal twist stretch'),
      s('Supine Twist', 'Lie on your back, drop both knees to one side and look the other way.', '45–60 s each side', 'supine spinal twist stretch'),
      s('Gate Pose', 'Kneel, extend one leg to the side and arc the opposite arm overhead toward it.', '30 s each side', 'gate pose yoga'),
    ],
  },
  {
    id: 'lats', name: 'Lats', view: [0.45, 0.1, -1],
    muscles: 'Latissimus dorsi, teres major',
    aliases: 'latissimus dorsi side back wings pull up',
    stretches: [
      s("Child's Pose with Side Reach", "From child's pose, walk both hands to one side to lengthen the opposite lat.", '30–45 s each side', 'childs pose side reach lat stretch'),
      s('Doorframe Lat Stretch', 'Hold a door frame or pole, sit the hips back and away, and let the side of the back lengthen.', '30 s each side', 'door frame lat stretch'),
      s('Dead Hang', 'Hang from a pull-up bar with relaxed shoulders and a long spine.', '20–60 s', 'dead hang stretch'),
      s('Bench Lat Prayer Stretch', 'Kneel with elbows on a bench and drop the chest between the arms.', '30–45 s', 'bench lat stretch prayer'),
    ],
  },
  {
    id: 'lowerback', name: 'Lower Back', view: [0, 0, -1],
    muscles: 'Erector spinae, quadratus lumborum',
    aliases: 'lumbar spine erector ql low back backache',
    stretches: [
      s("Child's Pose", 'Kneel, sit the hips back onto the heels and reach the arms forward with the forehead down.', '1–2 min', 'childs pose stretch'),
      s('Knees-to-Chest', 'Lie on your back and hug both knees in, rocking gently side to side.', '30–60 s', 'double knee to chest stretch'),
      s('Supine Twist', 'Lie on your back, drop both knees to one side and keep both shoulders grounded.', '45–60 s each side', 'supine twist lower back stretch'),
      s('Seated QL Stretch', 'Sit with legs wide, reach one arm overhead and side-bend toward the opposite foot.', '30 s each side', 'quadratus lumborum QL stretch'),
    ],
  },
  {
    id: 'glutes', name: 'Glutes', view: [0.25, 0, -1],
    muscles: 'Gluteus maximus, medius & minimus',
    aliases: 'glute butt buttocks bum',
    stretches: [
      s('Figure-Four Stretch', 'Lie on your back, cross one ankle over the opposite knee and pull the legs toward the chest.', '30–45 s each side', 'figure four stretch'),
      s('Pigeon Pose', 'Bring one shin forward across the mat, extend the other leg back and fold over the front leg.', '1–2 min each side', 'pigeon pose stretch'),
      s('Seated Glute Twist', 'Sit tall, cross one foot over the opposite thigh and hug the knee to the chest.', '30 s each side', 'seated glute stretch'),
      s('90/90 Stretch', 'Sit with both knees bent at 90°, one in front and one to the side, and hinge over the front shin.', '45 s each side', '90 90 hip stretch'),
    ],
  },
  {
    id: 'hipflexors', name: 'Hip Flexors', view: [0.2, 0, 1],
    muscles: 'Iliopsoas, sartorius',
    aliases: 'psoas iliacus hips front of hip groin sitting',
    stretches: [
      s('Half-Kneeling Hip Flexor Stretch', 'Kneel on one knee, tuck the pelvis under and shift forward until the front of the back hip opens.', '30–45 s each side', 'half kneeling hip flexor stretch'),
      s('Couch Stretch', 'Place the back shin up a wall or couch, the other foot forward, and bring the torso upright.', '1 min each side', 'couch stretch'),
      s('Low Lunge', 'Step into a long lunge, lower the back knee and sink the hips forward and down.', '30–45 s each side', 'low lunge hip flexor stretch'),
      s('Supine Psoas Stretch', 'Lie at the edge of a bed, hug one knee in and let the other leg hang off.', '45 s each side', 'thomas stretch psoas'),
    ],
  },
  {
    id: 'itband', name: 'IT Band & Outer Hip', view: [1, 0, 0.15],
    muscles: 'Tensor fasciae latae, iliotibial band',
    aliases: 'tfl iliotibial outer thigh side of leg runners knee abductors',
    stretches: [
      s('Standing IT Band Stretch', 'Cross one leg behind the other and lean the hips toward the back-leg side while reaching overhead.', '30 s each side', 'standing IT band stretch'),
      s('Supine Cross-Body Leg Stretch', 'Lie on your back and draw a straight leg across the body with the opposite hand or a strap.', '30–45 s each side', 'supine IT band stretch strap'),
      s('TFL Stretch', 'In a half-kneeling lunge, shift the hips forward and side-bend away from the back leg.', '30 s each side', 'TFL stretch'),
      s('Foam Roll Outer Thigh', 'Lie sideways over a foam roller and slowly roll between the hip and just above the knee.', '1 min each side', 'foam roll IT band'),
    ],
  },
  {
    id: 'adductors', name: 'Inner Thighs', view: [0, -0.15, 1],
    muscles: 'Adductors, gracilis',
    aliases: 'adductor groin inner thigh splits',
    stretches: [
      s('Butterfly Stretch', 'Sit with the soles of the feet together, hold the ankles and let the knees fall open.', '45–60 s', 'butterfly stretch'),
      s('Frog Stretch', 'On all fours, widen the knees with feet turned out and rock the hips back.', '1 min', 'frog stretch'),
      s('Side Lunge Stretch', 'Take a wide stance and bend one knee, keeping the other leg straight with the foot flat.', '30 s each side', 'side lunge adductor stretch'),
      s('Wide-Legged Forward Fold', 'Stand with feet wide, hinge at the hips and fold forward with a long spine.', '45 s', 'wide legged forward fold'),
    ],
  },
  {
    id: 'quads', name: 'Quadriceps', view: [0.25, 0, 1],
    muscles: 'Rectus femoris, vastus lateralis & medialis',
    aliases: 'quad quads thigh front of leg knee',
    stretches: [
      s('Standing Quad Stretch', 'Stand on one leg, grab the other ankle and draw the heel to the glute with the knees together.', '30 s each side', 'standing quad stretch'),
      s('Side-Lying Quad Stretch', 'Lie on your side, hold the top ankle and pull the heel back while tucking the pelvis.', '30 s each side', 'side lying quad stretch'),
      s('Couch Stretch', 'Back shin up a wall or couch, front foot forward, torso tall — a deep quad and hip flexor stretch.', '1 min each side', 'couch stretch quads'),
      s('Reclined Hero Pose', 'Kneel and sit between the heels, then lean back onto the hands or elbows.', '30–60 s', 'reclined hero pose'),
    ],
  },
  {
    id: 'hamstrings', name: 'Hamstrings', view: [0.2, 0, -1],
    muscles: 'Biceps femoris, semitendinosus, semimembranosus',
    aliases: 'hamstring hammies back of thigh back of leg toe touch',
    stretches: [
      s('Supine Hamstring Stretch', 'Lie on your back and raise one straight leg, holding behind the thigh or using a strap.', '30–45 s each side', 'supine hamstring stretch strap'),
      s('Standing Forward Fold', 'Hinge from the hips with soft knees and let the torso hang toward the floor.', '30–60 s', 'standing forward fold hamstring stretch'),
      s('Seated Forward Fold', 'Sit with legs straight and reach toward the feet, leading with the chest.', '45–60 s', 'seated forward fold'),
      s('Half Splits', 'From a low lunge, shift the hips back and straighten the front leg with the toes up.', '30–45 s each side', 'half splits pose'),
    ],
  },
  {
    id: 'calves', name: 'Calves', view: [0.2, 0, -1],
    muscles: 'Gastrocnemius, soleus, Achilles tendon',
    aliases: 'calf achilles lower leg back of leg',
    stretches: [
      s('Wall Calf Stretch', 'Lean into a wall with one leg straight behind you and the heel pressed down.', '30 s each side', 'wall calf stretch gastrocnemius'),
      s('Bent-Knee Soleus Stretch', 'Same wall position, but bend the back knee to move the stretch lower in the calf.', '30 s each side', 'soleus stretch'),
      s('Step Heel Drop', 'Stand with the balls of the feet on a step and slowly lower the heels below it.', '30 s', 'calf stretch on step heel drop'),
      s('Downward Dog', 'From a plank, lift the hips high and pedal the heels toward the floor.', '45–60 s', 'downward dog calf stretch'),
    ],
  },
  {
    id: 'shins', name: 'Shins', view: [0.45, 0, 1],
    muscles: 'Tibialis anterior, peroneals',
    aliases: 'shin splints tibialis front of lower leg peroneal',
    stretches: [
      s('Kneeling Shin Stretch', 'Kneel with the tops of the feet flat and sit back onto the heels.', '30 s', 'kneeling shin stretch tibialis anterior'),
      s('Standing Toe-Drag Stretch', 'Stand and place the top of one foot on the floor behind you, pressing the ankle forward.', '20–30 s each side', 'standing shin stretch toe drag'),
      s('Seated Ankle Plantarflexion Stretch', 'Cross one ankle over the knee and pull the toes and top of the foot toward you.', '30 s each side', 'tibialis anterior stretch seated'),
    ],
  },
  {
    id: 'feet', name: 'Feet & Ankles', view: [0.5, 0.6, 1],
    muscles: 'Plantar fascia, intrinsic foot muscles',
    aliases: 'foot ankle toes arch plantar fasciitis heel sole',
    stretches: [
      s('Plantar Fascia Stretch', 'Cross one foot over the knee and pull the toes back toward the shin.', '30 s each side', 'plantar fascia stretch'),
      s('Toe Squat', 'Kneel with the toes tucked under and sit back onto the heels.', '30–60 s', 'toe squat stretch yin yoga'),
      s('Ball Roll', 'Roll the sole of the foot slowly over a tennis or lacrosse ball.', '1 min each foot', 'foot ball roll plantar fascia'),
      s('Ankle Circles', 'Lift one foot and draw slow, full circles in both directions.', '10 each direction', 'ankle circles mobility'),
    ],
  },
];

// Deep and stabiliser muscles. Selecting these fades the outer muscles.
REGIONS.push(
  {
    id: 'rotatorcuff', name: 'Rotator Cuff', deep: true, view: [0.7, 0.25, -1],
    muscles: 'Supraspinatus, infraspinatus, teres minor, subscapularis',
    aliases: 'rotator cuff shoulder impingement sits si ts external rotation internal rotation shoulder stability',
    stretches: [
      s('Sleeper Stretch', 'Lie on the affected side with the shoulder and elbow at 90°, then gently press the forearm toward the floor with the other hand.', '30 s, 2–3 rounds', 'sleeper stretch rotator cuff'),
      s('Cross-Body Stretch', 'Draw one arm across the chest just below shoulder height and hold it there with the other forearm.', '30 s each side', 'cross body posterior shoulder stretch'),
      s('Towel Internal Rotation Stretch', 'Hold a towel behind your back, one hand high and one low, and pull the lower hand up with the top hand.', '30 s each side', 'towel internal rotation stretch shoulder'),
      s('Doorway External Rotation Stretch', 'Hold a door frame with the elbow bent 90° at your side and turn the body away from the hand.', '30 s each side', 'doorway external rotation stretch subscapularis'),
    ],
  },
  {
    id: 'deepcore', name: 'Deep Core', deep: true, view: [0.35, 0.05, 1],
    muscles: 'Transversus abdominis, multifidus, diaphragm, pelvic floor',
    aliases: 'deep core tva transverse abdominis multifidus diaphragm breathing pelvic floor kegel stability bracing',
    stretches: [
      s('Diaphragmatic Breathing', 'Lie on your back with knees bent, one hand on the belly. Breathe in through the nose so the belly and lower ribs widen, then exhale slowly.', '5 min', 'diaphragmatic breathing'),
      s('Child\'s Pose Breathing', 'In child\'s pose, breathe into the back of the ribs and feel the lower back widen with each inhale.', '1–2 min', 'childs pose breathing back of ribs'),
      s('Happy Baby', 'Lie on your back, hold the outsides of the feet with knees wide and let the pelvic floor soften as you breathe.', '1 min', 'happy baby pose pelvic floor'),
      s('Cobra Pose', 'Lie face down and press the chest up with the hips grounded to lengthen the front of the trunk.', '20–30 s', 'cobra pose stretch'),
    ],
  },
  {
    id: 'hiprotators', name: 'Deep Hip Rotators', deep: true, view: [0.45, 0, -1],
    muscles: 'Piriformis, gemelli, obturators, quadratus femoris',
    aliases: 'piriformis sciatica deep six hip rotators external rotators gemellus obturator',
    stretches: [
      s('Supine Piriformis Stretch', 'Lie on your back, cross one ankle over the opposite knee and pull that thigh toward your chest.', '30–45 s each side', 'supine piriformis stretch'),
      s('Pigeon Pose', 'Bring one shin forward across the mat, extend the other leg back and fold over the front leg.', '1–2 min each side', 'pigeon pose stretch'),
      s('Knee-to-Opposite-Shoulder', 'Lie on your back and pull one knee across the body toward the opposite shoulder.', '30 s each side', 'knee to opposite shoulder piriformis stretch'),
      s('Seated Piriformis Stretch', 'Sit tall with one ankle on the opposite knee and hinge forward from the hips.', '30–45 s each side', 'seated piriformis stretch chair'),
    ],
  },
  {
    id: 'deepneck', name: 'Deep Neck', deep: true, view: [0.4, 0.1, -1],
    muscles: 'Deep neck flexors, suboccipitals, cervical rotators',
    aliases: 'deep neck flexors longus colli suboccipital tension headache forward head posture',
    stretches: [
      s('Chin Tucks', 'Slide the chin straight back without tilting the head, then relax.', '10 slow reps', 'chin tuck exercise neck'),
      s('Suboccipital Stretch', 'Tuck the chin and gently draw the back of the head up and forward with both hands.', '30 s', 'suboccipital stretch'),
      s('Suboccipital Ball Release', 'Lie on your back with two tennis balls under the base of the skull and nod slowly.', '1–2 min', 'suboccipital release tennis ball'),
      s('Nod and Rotate', 'Nod the chin slightly, then turn the head slowly side to side within a comfortable range.', '10 each way', 'upper cervical rotation mobility'),
    ],
  },
);

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
