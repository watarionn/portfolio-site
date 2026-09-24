# mkPDF Studio v1.0.0

Release date: 2026-09-24

## Highlights

- Safe preflight inspection for ZIP / CBZ / 7z / RAR / CBR / CB7
- Archive path traversal and link rejection
- Archive, entry, extraction, compression, image-count, and pixel safety limits
- Local-only archive extraction and PDF generation
- Thumbnail page list and large preview
- Drag-and-drop archive opening
- Drag page reordering
- Multi-page selection
- Batch move, rotate, include / exclude
- Undo / redo for page layout edits
- JPEG quality controls
- Original / A4 portrait / A4 landscape page presets
- Built-in and custom PDF presets
- Keyboard shortcuts
- First-run onboarding and Help
- PDF header, EOF, and page-count verification before final output
- Automatic partial-output cleanup on failure
- Source archives are always preserved

## Safety model

mkPDF Studio intentionally does not contain an option to delete the input archive after conversion.

Potentially dangerous archive paths such as absolute paths, drive-qualified paths, and `..` traversal are rejected before extraction where supported.

## QA

- automated tests: 17 / 17 PASS
- Phase 2 GUI smoke retained
- solid 7z integration PASS
- malicious traversal ZIP rejection PASS
- secret-pattern scan PASS

See `QA_REPORT.md` for the detailed validation record.
