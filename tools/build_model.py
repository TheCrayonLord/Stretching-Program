#!/usr/bin/env python3
"""Build assets/body.bin from the BodyParts3D STL meshes.

Usage: build_model.py <stl dir> <parts_list_e.txt> <FMA.csv> <out.bin>

Source data: https://github.com/Kevin-Mattheus-Moerman/BodyParts3D
(BodyParts3D, (c) The Database Center for Life Science, CC BY-SA 2.1 Japan)

Each muscle is decimated, tagged with a body region, and given two baked
per-vertex attributes used by the shader:
  * fibre coords - position in the plane perpendicular to the muscle's long
    axis, so noise sampled there forms streaks that run along the muscle
  * tendon       - 0..1, how tendon-like (thin, near an end) this spot is
Meshes are merged per region + side and written as one compact binary.
"""
import csv, json, os, re, struct, sys
import numpy as np
import trimesh
import fast_simplification

STL, PARTS, FMA, OUT = sys.argv[1:5]
MUSCLE_BUDGET, BONE_BUDGET = 250_000, 40_000

# ---------------------------------------------------------------- names
names = {}
for line in open(PARTS):
    a = line.rstrip('\n').split('\t')
    if len(a) >= 2:
        names[a[0]] = a[1]
fma, parent = {}, {}
for r in csv.reader(open(FMA)):
    if r[0].isdigit():
        fma['FMA' + r[0]] = r[1]
        parent['FMA' + r[0]] = 'FMA' + r[2]

def ancestors(i):
    out = []
    while i in parent and len(out) < 40:
        i = parent[i]
        out.append(fma.get(i, '').lower())
    return out

# ---------------------------------------------------------------- classification
# first match wins; order matters (foot / leg before forearm)
REGION_RULES = [
    ('feet', r'of foot|hallucis brevis|abductor hallucis|adductor hallucis|digitorum brevis|flexor accessorius|long plantar'),
    ('shins', r'tibialis anterior|extensor digitorum longus|extensor hallucis longus|fibularis'),
    ('calves', r'gastrocnemius|soleus|plantaris|popliteus|calcaneal tendon|tibialis posterior|flexor digitorum longus|flexor hallucis longus'),
    ('hamstrings', r'biceps femoris|semimembranosus|semitendinosus'),
    ('quads', r'rectus femoris|vastus'),
    ('adductors', r'adductor (brevis|longus|magnus|minimus)|gracilis|pectineus'),
    ('itband', r'tensor fasciae latae|iliotibial'),
    ('hipflexors', r'psoas|iliacus|sartorius|inguinal'),
    ('glutes', r'gluteus|piriformis|gemellus|obturator|quadratus femoris'),
    ('abs', r'rectus abdominis|pyramidalis|linea alba'),
    ('obliques', r'external oblique|internal oblique|transversus abdominis|serratus anterior'),
    ('lowerback', r'lumborum|iliocostalis thoracis|longissimus thoracis|spinalis thoracis|semispinalis thoracis|multifidus|serratus posterior inferior|lumbar|thoracic rotator|interspinales (lumborum|thoracis)'),
    ('lats', r'latissimus|teres major'),
    ('traps', r'trapezius|rhomboid|infraspinatus|supraspinatus|teres minor|subscapularis|serratus posterior superior'),
    ('shoulders', r'deltoid'),
    ('chest', r'pectoralis|subclavius'),
    ('biceps', r'biceps brachii|brachialis|coracobrachialis'),
    ('triceps', r'triceps|anconeus'),
    ('forearms', r'brachioradialis|carpi|digitorum|digiti minimi|pollicis|indicis|pronator|supinator|palmaris|of hand|retinaculum of wrist|interosseous membrane of forearm'),
    ('neck', r'sternocleidomastoid|scalenus|levator scapulae|splenius|capitis|cervicis|hyoid|thyroid|digastric|cervical|longus colli'),
]
SKIP = r'papillary|diaphragm|sphincter|coccygeus|puborectalis|levator ani|platysma|pterygoid|transversus thoracis|innermost intercostal|internal intercostal|levatores|hair|eyebrow|skin|interosseous membrane of leg'
TENDON = r'aponeurosis|calcaneal tendon|iliotibial|linea alba|retinaculum|inguinal|intermediate tendon|plantar ligament|interosseous membrane'
EXTRA_BONE = r'cartilage|tooth|eyeball|^ear$'
EXTRA_MUSCLE = r'trapezius|extensor carpi ulnaris|interossei|lumbricals|spinalis cervicis|intertransversari|interspinales'

def classify(i):
    name = (names.get(i) or fma.get(i) or '').lower()
    base = re.sub(r'\b(left|right) ', '', name)
    if not name or re.search(SKIP, base):
        return None
    anc = ancestors(i)
    is_muscle = any('muscle' in a for a in anc) or re.search(EXTRA_MUSCLE, base)
    is_tendon = re.search(TENDON, base)
    is_bone = any(re.search(r'\bbone\b|skeleton|vertebra', a) for a in anc) or re.search(EXTRA_BONE, base)
    if is_tendon:
        kind = 'tendon'
    elif is_muscle:
        kind = 'muscle'
    elif is_bone:
        kind = 'eye' if 'eyeball' in base else 'bone'
    else:
        return None
    region = None
    if kind != 'bone' and kind != 'eye':
        for rid, pat in REGION_RULES:
            if re.search(pat, base):
                region = rid
                break
    return dict(id=i, name=name, kind=kind, region=region)

# ---------------------------------------------------------------- load
parts = []
for f in sorted(os.listdir(STL)):
    c = classify(f[:-4])
    if not c:
        continue
    m = trimesh.load(os.path.join(STL, f))
    if not len(m.faces):
        continue
    c['mesh'] = m
    c['area'] = float(m.area)
    parts.append(c)
    print(f"{c['kind']:7}{str(c['region']):11}{len(m.faces):8}  {c['name']}", flush=True)

def budgeted(kinds, budget):
    group = [p for p in parts if p['kind'] in kinds]
    total = sum(p['area'] for p in group)
    for p in group:
        p['target'] = int(min(len(p['mesh'].faces), max(100, budget * p['area'] / total)))
budgeted(('muscle', 'tendon'), MUSCLE_BUDGET)
budgeted(('bone', 'eye'), BONE_BUDGET)

# ---------------------------------------------------------------- per-part processing
def to_scene(v):  # BodyParts3D: mm, z up, front = -y  ->  metres, y up, front = +z
    return np.column_stack([v[:, 0], v[:, 2], -v[:, 1]]) / 1000.0

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

def fibre_attrs(v, kind):
    """v in scene metres. returns (perp coords Nx2 in metres, tendon N)"""
    c = v.mean(0)
    _, _, vt = np.linalg.svd(v - c, full_matrices=False)
    axis, e1, e2 = vt[0], vt[1], vt[2]
    d = v - c
    t = d @ axis
    perp = np.column_stack([d @ e1, d @ e2])
    if kind == 'tendon':
        return perp, np.ones(len(v))
    # girth of the muscle in slices along its axis
    lo, hi = t.min(), t.max()
    n = 28
    idx = np.clip(((t - lo) / (hi - lo + 1e-9) * n).astype(int), 0, n - 1)
    girth = np.zeros(n)
    for b in range(n):
        sel = perp[idx == b]
        if len(sel) > 2:
            girth[b] = np.sqrt(((sel - sel.mean(0)) ** 2).sum(1).mean())
    for b in range(n):  # fill empty slices
        if girth[b] == 0:
            girth[b] = girth[max(b - 1, 0)] or girth[min(b + 1, n - 1)]
    girth = np.convolve(np.pad(girth, 1, mode='edge'), [0.25, 0.5, 0.25], mode='valid')
    rel = girth / (np.percentile(girth, 85) + 1e-9)
    centres = lo + (np.arange(n) + 0.5) / n * (hi - lo)
    rel_v = np.interp(t, centres, rel)
    s = (t - lo) / (hi - lo + 1e-9)
    end = 1 - smoothstep(0.0, 0.3, np.minimum(s, 1 - s))      # 1 at the ends
    thin = 1 - smoothstep(0.3, 0.62, rel_v)                    # 1 where slender
    tip = 1 - smoothstep(0.0, 0.05, np.minimum(s, 1 - s))      # always a little at the very tip
    return perp, np.clip(np.maximum(thin * np.sqrt(end), tip * 0.8), 0, 1)

groups = {}
for p in parts:
    m = p['mesh']
    v, f = m.vertices.astype(np.float32), m.faces
    for _ in range(4):  # the simplifier can stall short of the target; repeat
        if len(f) <= p['target'] * 1.1:
            break
        before = len(f)
        v, f = fast_simplification.simplify(v, f, target_count=p['target'], agg=7)
        if len(f) > before * 0.95:
            break
    v = to_scene(np.asarray(v, dtype=np.float64))
    f = np.asarray(f)
    if p['kind'] in ('muscle', 'tendon'):
        perp, tendon = fibre_attrs(v, p['kind'])
    else:
        perp, tendon = np.zeros((len(v), 2)), np.zeros(len(v))
    cx = v[:, 0].mean()
    side = 'c' if abs(cx) < 0.012 and v[:, 0].min() < -0.004 and v[:, 0].max() > 0.004 else ('l' if cx > 0 else 'r')
    key = (p['region'] or p['kind'] if p['kind'] in ('bone', 'eye') or p['region'] else 'face', side,
           'bone' if p['kind'] == 'bone' else 'eye' if p['kind'] == 'eye' else 'muscle')
    g = groups.setdefault(key, dict(v=[], f=[], perp=[], tendon=[], n=0, names=[]))
    g['f'].append(f + g['n'])
    g['v'].append(v); g['perp'].append(perp); g['tendon'].append(tendon)
    g['n'] += len(v)
    g['names'].append(p['name'])

# ---------------------------------------------------------------- write
allv = np.concatenate([np.concatenate(g['v']) for g in groups.values()])
lo, hi = allv.min(0), allv.max(0)
# stand on the ground, centred
offset = np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2])
size = hi - lo
PERP_RANGE = 0.5  # metres mapped onto int16

header = dict(origin=(lo - offset).tolist(), size=size.tolist(), perpRange=PERP_RANGE, meshes=[],
              source='BodyParts3D, (c) The Database Center for Life Science, CC BY-SA 2.1 Japan')
blob = bytearray()
def push(arr):
    while len(blob) % 4:
        blob.append(0)
    off = len(blob)
    blob.extend(arr.tobytes())
    return off

tris = 0
for (region, side, kind), g in sorted(groups.items()):
    v = np.concatenate(g['v']); f = np.concatenate(g['f'])
    q = np.round((v - lo) / size * 65535).astype(np.uint16)
    entry = dict(region=None if region in ('bone', 'eye', 'face') else region, side=side, kind=kind,
                 verts=len(v), tris=len(f), pos=push(q))
    if kind == 'muscle':
        perp = np.concatenate(g['perp'])
        entry['perp'] = push(np.clip(np.round(perp / PERP_RANGE * 32767), -32767, 32767).astype(np.int16))
        entry['tendon'] = push(np.round(np.concatenate(g['tendon']) * 255).astype(np.uint8))
    entry['index32'] = len(v) > 65535
    entry['idx'] = push(f.astype(np.uint32 if entry['index32'] else np.uint16))
    header['meshes'].append(entry)
    tris += len(f)
    print(f"{str(region):11}{side} {kind:7}{len(v):8} verts {len(f):8} tris  ({len(g['names'])} parts)")

hj = json.dumps(header, separators=(',', ':')).encode()
hj += b' ' * (-len(hj) % 4)
with open(OUT, 'wb') as fh:
    fh.write(struct.pack('<I', len(hj)))
    fh.write(hj)
    fh.write(blob)
print(f'{tris} triangles, {os.path.getsize(OUT) / 1e6:.2f} MB -> {OUT}')
