# MindMap Maker v1.0.0 QA Report

Date: 2026-09-17

## Static validation

- `node --check app.js`: PASS
- JavaScript `$('<id>')` references missing from HTML: 0
- Duplicate HTML IDs: 0
- Web App Manifest JSON parse: PASS
- Header icon buttons without accessible name: 0
- Shape icon buttons without accessible name: 0

## Functional browser QA

Chromiumで配布版HTML/CSS/JSと同一コードをインライン実行し、以下を確認。

- First-run onboarding: PASS
- Blank initial map: PASS
- Sample map: PASS
  - nodes: 12
  - connections: 11
  - groups: 2
- Autosave status: PASS
- Full-text search: PASS
- Help modal: PASS
- `?` shortcut: PASS
- localStorage payload generation: PASS
- 390x844 mobile viewport horizontal overflow: none
- Desktop-size saved view restored at mobile width: map bounds fit in viewport
- Runtime JavaScript exceptions: 0
- Console errors during tested flow: 0

## Visual fixes found during QA

- Replaced the previous cloud path algorithm because small clouds could collapse into a scribble-like outline.
- Added viewport-aware restore because a desktop-saved pan/zoom position could place content off-screen on mobile.
- Darkened secondary/accent text colors to improve contrast on the beige UI surfaces.

## Environment note

The QA browser environment blocks direct `file://` and localhost pages by organization policy. Browser execution therefore used the exact release HTML/CSS/JavaScript injected into a blank Chromium document, with an in-memory localStorage-compatible mock. Static validation was run directly against the packaged files.
