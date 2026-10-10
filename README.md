# dino-cosic.github.io

Personal portfolio. Plain HTML, CSS and JavaScript, with Three.js (loaded from a CDN) for the hero.

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Paths are root-relative, so serve from the repo root. Modules will not load over `file://`.

## Layout

- `index.html` holds all content. The portrait strokes are inlined between the `portrait:start/end` markers.
- `css/` has `base.css` (tokens, reset) and `site.css` (layout and sections).
- `js/main.js` handles header, scroll thread, and loads the hero. `js/hero-scene.js` is the Three.js scene, `js/portrait.js` prepares the stroke data.
- `tools/build_portrait.py` regenerates the inlined strokes from `data/dino-one-line.png` (needs pillow, numpy, scipy, scikit-image).
- `404.html`, `robots.txt` and `sitemap.xml` sit at the root. Update the sitemap's `lastmod` when content changes.
- `data/` is source material (résumé, copy, drawing). It is gitignored and kept only locally, so `tools/build_portrait.py` needs a local copy of `data/dino-one-line.png`.

Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`, which copies the site files into `dist/`. New top-level files must be added to its `cp` line.
