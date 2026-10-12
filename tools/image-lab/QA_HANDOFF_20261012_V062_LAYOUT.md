# Image Lab v0.6.2: compact mobile layout and larger RESULT (2026-10-12)

## Requested change
- Result preview is too small on iPhone.
- All controls in one long page cause excessive vertical scrolling.

## Design and behavior
- Media query <= 930 CSS px: RESULT shown first, at full available column width; ORIGINAL reduced to a 112 CSS px framed thumbnail, with optional expanded original preview.
- Preview canvas intrinsic resolution is unchanged. The original image, output canvas pixels, export formats, layer ownership, and effects algorithms are not modified.
- A two-button mode switch displays **either** Image Effects (effect and tune sections) **or** Layer Decomposer. Hidden sections remain present in the DOM for existing event handlers.
- Switching to Image Effects while editing layers does not silently discard the model; instead the current layer mode remains visible and a hint explains that its existing “画像効果モードに戻る” button exits the editor.
- v0.6.1 touch ownership and brush/undo logic preserved. No image-generation functions added.
- Future-content explanation folded into a small optional details section. Mobile margins and tool history buttons compacted. On desktop both images remain side by side.

## Validation
- Clean isolated sparse clone of main `c8b42551d54bcff10329bf99832b70f0143af5ec`.
- Node build and test 25/25 PASS, including new layout/selector release contracts.
- Actual headless Edge with CDP mobile metrics, plus Selenium interactions:
  - 390 x 844: RESULT canvas visible width 360 CSS px; ORIGINAL thumb 110px; no horizontal overflow.
  - 375 x 667: RESULT width 345 CSS px; ORIGINAL thumb 110px; no horizontal overflow.
  - 768 x 1024: RESULT width 738 CSS px; ORIGINAL thumb 110px; no horizontal overflow.
  - 1440 x 900: desktop side-by-side previews unchanged and no horizontal overflow.
  - Source expand/collapse, Effects -> Layers, color decomposition, effects-mode guard during live editing, exit editor -> effects PASS.
- Browser emulation is **not** a physical iPhone Safari test.

## Release checklist
1. Read back v0.6.2 build and source from the exact branch/merge commit.
2. Merge only after tests pass, then deploy the reviewed Image Lab delta using the existing credential-verified FTPS route.
3. Read public HTML, versioned CSS, JS, and SW over HTTPS and compare bytes/SHA-256 to committed source. Do not touch other production routes.
4. User physical iPhone acceptance after release: enlarged preview, source expansion, mode switching, effects, layer decomposition/retouch/undo, PNG export, and PWA cache refresh.
5. Record physical acceptance only if user confirms it, not from browser emulation.

## Note
Do not confuse GitHub merge with production publication. v0.6.1 was already user-confirmed in QA_HANDOFF_20261012_V061.md. This is a new 0.6.2 release with a separate acceptance gate.
