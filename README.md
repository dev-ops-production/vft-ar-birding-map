# Visit Fallon AR Birding Map (prototype)

A static team demo of the City Bird Month journey on a phone:

**map → birding location → species card → bird in AR**

Plain HTML, CSS and vanilla JS. No backend, no build step, no CDN calls: every library is pinned and vendored in `/vendor`. This is a prototype, not production. Locations, copy, card art and 3D models are placeholders and are flagged as such in the data and on screen.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | City Bird Month intro, illustrated inline SVG map with 4 tappable pins, text list of the same locations, "Birds I've found" checklist |
| `location.html?id=…` | Location name, description, species found there |
| `species.html?id=…` | Species card: photo placeholder, names, ID tips, habitat, season, where to find it, rotatable 3D model, AR button |
| `scan.html` | Image-tracked AR: the camera recognizes a printed card and the bird stands on it |
| `card.html` / `card.html?id=…` | Printable species cards (the tracking targets) with a QR code to each species page |
| `data/birds.json` | All content: `species` and `locations`, cross-referenced by id |
| `models/<species-id>.glb` | 3D models, in meters at true scale |
| `assets/cards/<species-id>.png` | Card artwork (tracking target images); `.svg` is the editable source |
| `targets/cards.mind` | Compiled MindAR target file for all card artwork |
| `tools/compile-target.html` | Recompiles `targets/cards.mind` in the browser |
| `tools/serve.mjs` | Optional tiny local web server |
| `vendor/` | Pinned libraries (see Licenses) |

## Run locally

The pages load `data/birds.json` with `fetch`, so open them through a web server, not as `file://`.

```bash
node tools/serve.mjs
```

or

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. On a desktop you get the map, pages, rotatable 3D model and the QR fallback. `scan.html` also works on a laptop webcam at `localhost`.

Handy demo switches:

- Add `?inapp=1` to any page to preview the Instagram/Facebook "open in browser" prompt.
- "Reset checklist" on the home page clears the found list.

## Test on a phone (HTTPS required)

Camera access and AR only work in a secure context. `http://192.168.x.x:8000` from your laptop will **not** work on a phone. Use one of these:

1. **Deploy it** (simplest): GitHub Pages or Netlify, both HTTPS by default. Netlify: drag the project folder onto <https://app.netlify.com/drop>.
2. **Tunnel your local server**: run the local server, then in a second terminal run `npx cloudflared tunnel --url http://localhost:8000` (or `ngrok http 8000`) and open the `https://…` address on the phone.

Then on the phone:

1. Open the site in **Safari (iPhone)** or **Chrome (Android)**, not inside Instagram or Facebook.
2. Tap a map pin → a bird → scroll to the 3D model → **See this bird in your space**.
3. For the card demo: open `card.html` on a laptop and print it (or just leave it on screen), then on the phone tap **Scan a printed card → Start camera** and point at the picture.

QR codes are generated from the address the page is currently served from, so print cards from the deployed site, not from localhost.

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "AR Birding Map prototype"
git branch -M main
git remote add origin https://github.com/<org>/<repo>.git
git push -u origin main
```

Then in the GitHub repo: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**. The site appears at `https://<org>.github.io/<repo>/` after a minute or two.

Notes: all paths are relative, so the project works from a sub-folder. `.nojekyll` is included so GitHub serves every file as is. A free-plan GitHub Pages site must be in a public repo.

## Data model

`data/birds.json` mirrors the WordPress custom post types planned for the real build (Species and Birding Location, with ACF-style fields).

- `species[]`: `id`, `common_name`, `scientific_name`, `summary`, `id_tips[]`, `habitat`, `best_season`, `where_to_find`, `location_ids[]`, `photo{src, alt, credit}`, `model{src, alt, length_m}`, `card{art, target_index}`, `source_url`
- `locations[]`: `id`, `name`, `map_label`, `description`, `best_season`, `access_notes`, `directions_query`, `map{x, y}`, `species_ids[]`
- `is_placeholder: true` marks anything that is stand-in content. Remove the flag as real content lands.

The relationship is stored on both sides (`species.location_ids` and `locations.species_ids`), like a bidirectional relationship field. Keep both in sync when editing.

Map pins are positioned from `locations[].map` in the SVG's `0 0 400 440` coordinate space, so a new location appears on the map without touching the HTML.

## Add a species

1. **Data**: copy a `species` entry in `data/birds.json`, give it a new `id` (lowercase, hyphens) and fill in the fields. Set `card.target_index` to the next unused number (0, 1, 2, 3… no gaps).
2. **Cross-reference**: add the new id to `species_ids` of each location it appears at, and those location ids to the species' `location_ids`.
3. **Model**: add `models/<id>.glb`, authored in meters at real-world size, ideally under 5 MB. Set `model.length_m` to the bird's length (used to size it on the printed card).
4. **Photo**: point `photo.src` at the image and write real `alt` text.
5. **Card artwork**: add `assets/cards/<id>.png` (3:4 portrait, about 900×1200 px) and set `card.art`.
6. **Recompile the tracking target** (next section).

The checklist total ("1 of 4") updates automatically.

## Recompile the MindAR target when card artwork changes

`targets/cards.mind` is compiled from the card images. Recompile whenever any card image changes or a species is added or removed. Even small artwork edits need a recompile.

1. Put the final artwork in `assets/cards/` and check `card.art` and `card.target_index` in `data/birds.json`.
2. Start the local server and open <http://localhost:8000/tools/compile-target.html>.
3. Click **Compile** (takes up to a minute), then **Download cards.mind**.
4. Replace `targets/cards.mind` with the downloaded file and redeploy.

The tool uses the same pinned MindAR build as `scan.html`. The official hosted compiler at <https://hiukim.github.io/mind-ar-js-doc/tools/compile> produces an equivalent file: upload the images **in `target_index` order**.

Artwork that tracks well has lots of irregular, high-contrast detail edge to edge. Avoid large flat areas, repeating patterns, glossy lamination and very dark images. Keep the QR code outside the tracked picture.

## Files to replace before this is real

| Replace | With | Notes |
| --- | --- | --- |
| `models/american-white-pelican.glb` | Licensed pelican model | Currently the Khronos Duck scaled to 1.50 m long |
| `models/american-avocet.glb` | Licensed avocet model | Currently the Khronos Duck scaled to 0.45 m long |
| `models/white-faced-ibis.glb` | Licensed ibis model | Currently the Khronos Duck scaled to 0.56 m long |
| `assets/cards/*.png` (and `.svg`) | Final card artwork | Placeholder illustrations made for this demo; recompile `targets/cards.mind` after |
| `targets/cards.mind` | Recompiled file | Must match the final artwork |
| `photo.src` in `data/birds.json` | Licensed bird photos | Currently reuses the card art, tagged "Photo placeholder" |
| Copy and locations in `data/birds.json` | Approved copy from NDOW info, confirmed locations | Everything flagged `is_placeholder` |
| Map illustration in `index.html` | Agency map illustration (layered SVG) | Keep `<g id="map-points">` and the 400×440 viewBox, or update `map{x,y}` to match |
| Colors and fonts in `css/styles.css` `:root` | Visit Fallon brand values | CSS variables only; re-check contrast after |

Real models: export GLB in **meters, +Y up, facing +X or +Z, feet at the origin**. `ar-scale="fixed"` shows the model at exactly its authored size, so scale mistakes show up immediately in AR. No USDZ is needed: model-viewer generates it on the iPhone.

## Licenses of downloaded files

| File | Source | License |
| --- | --- | --- |
| `models/*.glb` (all three) | "Duck" from [KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Duck), `glTF-Binary/Duck.glb`. Modified: root node rescaled per species, feet moved to the origin, embedded camera node unlinked | © 2006 Sony. **SCEA Shared Source License 1.0**. Fine for an internal demo; replace before anything public |
| `vendor/model-viewer-4.4.0.min.js` | npm `@google/model-viewer@4.4.0`, `dist/model-viewer.min.js` | Apache-2.0 |
| `vendor/mindar-image-aframe-1.2.5.prod.js` | npm `mind-ar@1.2.5`, `dist/mindar-image-aframe.prod.js` | MIT |
| `vendor/aframe-1.5.0.min.js` | npm `aframe@1.5.0`, `dist/aframe-v1.5.0.min.js` | MIT |
| `vendor/qrcode-generator-1.4.4.js` | npm `qrcode-generator@1.4.4`, `qrcode.js` | MIT |

Card art, map illustration, copy and code were written for this prototype.

## How the AR pieces behave

- **Species page**: `<model-viewer>` with `ar`, `ar-modes="webxr scene-viewer quick-look"`, `ar-scale="fixed"`, `camera-controls`, `auto-rotate`, and a custom `slot="ar-button"` labeled "See this bird in your space". No `ios-src`.
- **Lazy loading**: the map page loads under 50 KB in total (HTML, CSS, JS and the data file) and no 3D or AR code. model-viewer (1 MB) loads when the 3D viewer scrolls near the viewport. A-Frame and MindAR (3 MB) plus the target file (2 MB) load only after "Start camera" is tapped.
- **Camera permission**: never requested on page load. The species page asks when the AR button is tapped (and only on Android WebXR; Quick Look and Scene Viewer are system viewers). `scan.html` asks after "Start camera". Each has a one-line explanation next to the button.
- **Fallbacks**: no AR support → rotatable model plus a QR code to the same page. In-app browser → "Open in Safari/Chrome" banner with a copy-link button (and an "Open in Chrome" intent link on Android).
- **Checklist**: stored in `localStorage` under `vf-birds-found`. A species is marked found when its AR button is tapped or its card is recognized on the scan page.

## Known limitations

- **Stand-in models.** All three birds are a rubber duck at the right size.
- **"Found" is optimistic.** It is set when the AR button is tapped, not when AR is confirmed running. Quick Look and Scene Viewer don't report back to the page.
- **iPhone AR is Quick Look**, a system viewer: no custom UI or branding inside it. The auto-generated USDZ drops some material features and takes a moment on large models.
- **Android AR needs Google Play Services for AR** (ARCore). Unsupported phones get the 3D fallback.
- **In-app browser detection is by user agent** (Instagram, Facebook). Other in-app browsers (TikTok, LinkedIn, etc.) are not detected. The page cannot force its way out of an in-app browser on iPhone; it can only prompt.
- **Image tracking is sensitive** to lighting, glare, print quality and distance. The placeholder art tracked reliably against a simulated camera feed but has not been tested in print.
- **Download weight on the scan page** is about 5 MB (libraries plus a 2 MB target file). Fine on Wi-Fi; slow on weak cellular. Smaller card images would shrink the target file.
- **The bird on the card is static.** No animation or sound yet.
- **No analytics, no species index, no share tools, no bird calls.** Out of scope for this demo.
- **Map is illustrative**, not geographic, and pin positions are hand-placed in the data.
- **localStorage** is per browser and can be cleared by the phone; private browsing may not keep the checklist.
- **JavaScript is required** to render locations and species (content comes from the JSON file).
