# Image Lab v0.7.0: Per-layer Tone / QA handoff (2026-10-13)

## Feature delivered
- Original user goal: develop the next Image Lab feature after the v0.6.2 preview/layout release.
- Selected scope: tonal adjustments per selected layer, not a blanket promise to apply all 13 library algorithms individually.
- A collapsed “選択レイヤーの色を調整” panel controls brightness, contrast, saturation independently, each -100 to +100.
- Sliders preview without changing the canonical layer model. Explicit “色調整を適用” commits a single undo step; “調整を元に戻す” cancels only uncommitted preview.
- Live result canvas and individual layer PNG incorporate tone. Existing composite PNG exports the result canvas.
- An effect's settings are stored on the layer, not duplicated in a full-size per-layer RGBA buffer. Unselected layer pixels remain unchanged; source canvas is never altered.
- Merge bakes the visible RGB and alpha of selected layers, so a merged result is pixel-identical. Reorder carries the selected layer's tone; brush transitions restore uploaded original RGB to the reassigned pixel before applying the destination layer's tone.
- Active layer edits, boundaries, alpha/visibility, second-finger protection, existing five-step undo, and v0.6.2 mobile compact layout remain supported.
- Spatial/library-specific per-layer effects, editable project persistence, and overlapping compositing are not in v0.7.0.

## Automated regression results
- Temporary, isolated sparse clone from main 41fcd8521a666044df4cd651e07a151c72c91c05. No active personal workspace modified.
- npm ci --ignore-scripts --no-audit --no-fund, npm run build, npm run check: **31/31 PASS**.
- Added 6 tests for neutral RGBA exactness, owned-pixel-only effect, bounds/invalid input, tone-preserving merge, reorder identity, and brush restoration.
- Existing layout, merge, retouch, semantic, runtime/SW release contracts remain passing.
- Headless Microsoft Edge with CDP viewport device metrics and Selenium end-to-end interactions:
  - 390×844, 375×667, 768×1024, 1440×900: **4/4 PASS**.
  - Tested live canvas differences on slider input, Apply preview parity, Undo exact restoration, original canvas immutability, two-layer merge exact result, version label, and no horizontal overflow.
- Browser simulation is **not** physical iPhone Safari evidence.

## Release gate
- Build outputs are versioned assets/main-v0.7.0.js and style-v0.7.0.css; Service Worker cache image-lab-v0.7.0. Old hashed assets must be retained for older cached clients.
- Publish the committed Image Lab delta using the existing certificate-verified FTPS route. Verify HTTP SHA-256 of uploaded files against exact merged GitHub blobs.
- Physical iPhone acceptance of v0.7.0 is a distinct **OPEN** gate; do not infer user approval from automated tests.
- Manual acceptance: in Layer Decomposer, select one layer, expand the tone controls, change sliders, see live preview, cancel preview, re-adjust and apply, Undo restores, merge with another layer and export PNG. Verify the ORIGINAL remains unmodified and the v0.6.2 result preview is still large on iPhone.
