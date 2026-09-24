# mkPDF Studio v1.0.0 QA Report

Date: 2026-09-24

## Release result

v1.0.0 release candidate: PASS

## Automated test suite

`py -3 -m unittest discover -s tests -v`

Result: **17 / 17 PASS**

Coverage:
- nested natural page ordering
- archive traversal rejection
- ZIP symbolic-link rejection
- unpacked-size limits
- source archive preservation
- PDF header / EOF / page-count verification
- existing output protection
- page reorder / rotation / exclusion / A4 build
- rotated thumbnails
- zero included page rejection
- quality and page-size validation
- Studio output protection
- session snapshot / restore
- adjacent multi-page movement
- non-contiguous multi-page movement
- custom preset round-trip
- onboarding flag round-trip
- built-in preset protection

## Archive integration

Solid 7z:
- preflight PASS
- extraction PASS
- natural page order PASS
- 3-page PDF PASS
- source archive preserved

Malicious ZIP with `../escaped.txt`:
- rejected
- no external file written
- no PDF created

## Final GUI QA

A real TkinterDnD window was created.

Result: **GUI_FINAL=PASS**

Verified:
- version: 1.0.0
- onboarding opened on first run
- onboarding-seen state persisted to isolated QA settings
- Help window opened
- Ctrl+A selected 4 / 4 pages
- Ctrl+Right rotated all selected pages
- Space toggled all selected pages
- Undo restored include state
- second Undo restored rotation
- Redo restored rotation
- custom Landscape preset applied and persisted
- custom preset deleted cleanly
- edited final state produced 2-page A4 PDF
- source CBZ remained intact
- final GUI screenshot captured

## GUI shortcut fix found during QA

The first shortcut smoke sent `Space` to the root window instead of the Treeview, so the Treeview-specific binding did not receive the test event.

The binding was hardened to return `break`, and final QA sends the key event to the focused Treeview. Multi-page toggle then passed.

## Security / privacy

- no source archive deletion feature
- isolated temporary extraction directory
- failed partial PDF cleanup
- no network dependency for core workflow
- secret-pattern scan included in release closure

## Assets

- app icon PNG
- app icon ICO
- 1200x630 OGP preview
- final GUI screenshot
