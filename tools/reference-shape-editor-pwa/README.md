# Shape Studio PWA v1.3

Independent personal PWA fork of the website's Reference Shape Editor v1.2.

- Canonical website editor remains at `tools/reference-shape-editor/`; this fork lives at `tools/reference-shape-editor-pwa/` and should be deployed at `/reference-shape-editor-pwa/`.
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

