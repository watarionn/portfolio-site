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
