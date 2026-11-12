# Vector Lab standalone PWA viewport-fit / no-vertical-scroll fix (2026-11-12)

## Adopted requirement and source
- User's current explicit acceptance rule (2026-11-12): installed iPhone PWA must be operable without vertical page scrolling; previous screenshot-free 390px width/no-horizontal-overflow tests were **insufficient**.
- Memory-vault documented precedent: `watarionn/ai-memory-vault/50-sessions/rinka-diary/2026/2026-10/2026-10-05.md`, user's Pose Studio PWA expectation "PWAならスクロールしないようにしたい". That dated precedent describes Pose Studio, so this Vector Lab requirement is separately affirmed by the **current user request**. Do not fabricate a previously approved global rule/record ID.
- Canonical application: `watarionn/portfolio-site/tools/vector-lab/`, public `/vector-lab/`. Existing Web/Safari document mode remains vertically scrollable where appropriate; only installed PWA (`display-mode:standalone` or `navigator.standalone===true`) receives the fixed workspace.

## Root cause and impact
- PR #246 simplified engine cards and removed two redundant blocks but still rendered **source, settings, preview and results vertically as a document**. The mobile QA asserted only `documentElement.scrollWidth <= innerWidth`, engine-card scrollability and touch target size, not document/panel **vertical** overflow, and did not simulate the installed `navigator.standalone` path.
- Effect: user-confirmed five engines operated correctly on iPhone but installed PWA required a long vertical scroll to reach controls and output. This contradicted the user's PWA interaction goal.
- Root cause is the design/acceptance test procedure, **not** any engine; do not "fix" by `overflow:hidden` alone and leave controls clipped.

## Current solution
- Installed PWA uses document `height:100dvh`, `overflow:hidden` and safe-area aware header/bottom navigation; only the active workspace is displayed.
- Four task tabs: `画像`, `設定`, `結果`, `候補`. Editor form and candidate functions are preserved, not deleted to fit.
- VTracer settings have four subpanes: `基本`, `色・白黒`, `輪郭`, `詳細`. The existing `advanced` details are open within installed mode and their individual fields are staged without dropping parameters. Other engine settings continue on one pane. Source and output preview fit flexibly into available height; complex candidate import is separate.
- Engine cards remain horizontally swipeable; **vertical scroll is disabled** for PWA document and task panes. Normal Safari and desktop document flow untouched. The result jump button is hidden only in installed mode since the bottom `結果` tab supersedes it.
- Explicit Run returns to result tab after success; automatic rerun does not interrupt current settings pane. Cancel, source upload, SVG/PNG/JSON export, 5 engines, compare slider and external SVG candidate import remain available.
- Static shell cache changes v3 to `vector-lab-shell-v4-20261112-standalone` for offline installed PWA refresh.

## Gate and reoccurrence prevention
- CDP driver emulates iPhone `navigator.standalone` **before application script execution**. Tests cover 390×844, 375×667, 320×568 (portrait) and non-PWA browser flow.
- For each PWA tab, check live document/body `scrollHeight <= innerHeight + 2`, no horizontal page overflow, pane geometry inside viewport, inactive panes not visible.
- For each VTracer subpane verify its visible actual controls are not clipped below the section's bound; test with previously generated SVG and all engines.
- This is **a QA gate, not an approximation from CSS presence**. Chrome emulation does not replace physical iPhone Safari PWA acceptance after release.
- Full site repository boundary scan, isolated production build, main integration, scoped FTPS update for `/vector-lab/` only, raw HTTPS hash readback and hosted PWA Chrome QA remain required before calling shipped.

## Regression/mistake analysis
- **Cause:** required no-scroll quality attribute omitted from PR #246 review and browser E2E; current user's PWA-specific expectation was not replayed during mobile redesign.
- **Impact:** excess vertical scrolling on installed iPhone PWA; no documented alteration to SVG algorithms/data or other portfolio pages.
- **Fix:** installed-specific four-screen workspace with stage partition, safe-area-aware height and no scroll; browser mode unchanged.
- **Prevention:** include explicit PWA display-mode, viewport-height and per-pane clipping assertions in `tests/smoke_vector_lab_chrome.py`, not merely CSS grep or horizontal-overflow tests. For any future PWA UI update, re-run these checks and physical-device acceptance.
