# Stretch Atlas

An interactive stretching guide built around a 3D figure drawn in the style of a
muscular-system anatomy chart.

- **Tap a muscle** – the camera swings round to face it, the muscle group glows,
  and a list of stretches appears with a YouTube link for each.
- **Search** – type a body part, muscle name, everyday term ("hammies", "butt",
  "sciatica") or a stretch name.
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
| `js/data.js` | Body regions, search aliases and stretches |
| `js/body.js` | Procedural muscle figure (each muscle is a textured spindle) |
| `js/app.js` | Scene, camera moves, picking, search and panel |
| `vendor/` | three.js r170 (MIT) |

YouTube links open a search for the stretch rather than one fixed video, so they
never go stale.
