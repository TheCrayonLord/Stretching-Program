# Stretch Atlas

An interactive stretching and exercise guide built around a 3D figure drawn in
the style of a muscular-system anatomy chart.

- **Two tabs** – *Stretches* and *Exercises* share the same body and search.
- **Tap a muscle** – the camera swings round to face it and the muscle group
  glows. Inside a group, tap again (or tap a muscle name) to focus on a single
  muscle.
- **Exercises** – each muscle group lists its exercises split into
  *Compound* (multi-joint) and *Isolation* (single-joint). Tapping an exercise
  highlights its **primary** muscles in orange and **secondary** muscles in pale
  yellow, with instructions, sets × reps and a YouTube link.
- **Equipment filter** – pick the equipment you have (bodyweight, dumbbell,
  barbell, kettlebell, cable, machine, band) and the lists only show exercises
  you can do. The choice is remembered.
- **Deep & stabilizer muscles** – Rotator Cuff, Deep Core, Deep Hip Rotators
  and Deep Neck. Selecting a deep muscle fades the outer muscles to a ghost so
  you can see it; the *Deep layer* button does the same at any time.
- **Search** – body parts, individual muscles, everyday terms ("hammies",
  "sciatica"), stretch names and exercise names.
- **Move around** – one finger / left-drag rotates, pinch / scroll zooms,
  two fingers / right-drag pans. Front / Back / Side buttons reset the view.

## Run it

It is a static site with no build step, but it uses ES modules so it must be
served over HTTP rather than opened from the file system:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

It also works as-is on GitHub Pages.

## Layout

| Path | What |
| --- | --- |
| `js/data.js` | Muscle groups, search aliases and stretches |
| `js/muscles.js` | The 87 selectable muscles: name, group and whether they sit deep |
| `js/exercises.js` | Exercises with type, equipment and primary / secondary muscles |
| `js/body.js` | Loads the anatomical model and shades fibres and tendons |
| `assets/body.bin` | The 3D model: ~300 real muscles and the skeleton, grouped into the 87 muscles |
| `tools/build_model.py` | Rebuilds `assets/body.bin` from the BodyParts3D STL files |
| `js/app.js` | Scene, camera moves, picking, search and panel |
| `vendor/` | three.js r170 (MIT) |

## 3D model credit

The figure is derived from **BodyParts3D, © The Database Center for Life Science,
licensed under CC Attribution-Share Alike 2.1 Japan**
(via <https://github.com/Kevin-Mattheus-Moerman/BodyParts3D>). The meshes were
decimated, regrouped and re-encoded; `assets/body.bin` is shared under the same
licence.

YouTube links open a search for the stretch rather than one fixed video, so they
never go stale.
