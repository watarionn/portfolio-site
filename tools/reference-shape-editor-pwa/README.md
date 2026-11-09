# Shape Studio PWA v1.3

Canonical production editing surface for the portfolio site's 切り絵作成室 and the installed iPhone Shape Studio PWA (unified on 2026-11-09).

- Canonical production editor lives at `tools/reference-shape-editor-pwa/` and `/reference-shape-editor-pwa/`. The portfolio entry now points directly here; `/reference-shape-editor/` redirects here for older bookmarks. Legacy `tools/reference-shape-editor/` JavaScript/CSS remain for compatibility/regression tests and are not a second public editor. Keep the PWA manifest ID, start_url, and Service Worker scope unchanged to protect installed iPhone PWAs and IndexedDB autosave.
- No dependency or server processing. Service worker caches only static app shell within its own path.
- Native pointer/touch: single tap adds polygon vertex; single-finger drag pans in draw and edge modes; two-finger pinch zooms anchored to gesture center.
- Vertex edit: 40 CSS px hit targets, on-canvas nudge 1/5/10 source px. Edge mode adds a point to a selected polygon on one tap.
- IndexedDB autosaves the current project (including source image data URL) only on this device; startup restores it. JSON save is still recommended for backups or device migration; it retains the v1 schema and optional layerGroups/palette.unified.
- Exported SVG/PNG never include the underlay. No source image or private tracing data are included in this repository.
- On first launch, an HTTPS visit is needed for SW install. iOS: Safari Share → Add to Home Screen.
- Test with real iPhone Safari before claiming final touch/pinch acceptance. PWA storage is browser-managed and may be evicted: keep JSON backups.
- Avoid changing Minimalizer Golden/C08/Worker via this fork.

## Line mode (v1.4 PWA)
- Draw 2 or more points to make an open straight/polyline, then tap 線を確定.
- Duplicate draft points are ignored, tapping the first draft point after 3+ points closes a polygon.
- Select a line or polygon and use 辺に点 to add a vertex to any existing segment. Lines have no implicit closing segment.
- Lines have editable stroke color/width (0.25–40px), layered ordering, shared vertex editing, JSON and SVG/PNG export.
- The v1 schema is retained; line entries in shapes use kind: line, while legacy polygons need no kind.
- Run node tools/test_reference_shape_editor_line_mode.js for common geometry regression. Actual touch QA is separate.

