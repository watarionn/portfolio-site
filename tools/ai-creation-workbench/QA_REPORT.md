# AI Creation Workbench v1.0.0 QA Report

Date: 2026-09-24

## Static validation

- `node --check app.js`: PASS
- Main app DOM ID references missing from HTML: 0
- Duplicate HTML IDs: 0
- Web App Manifest parse: PASS
- ARIA tabs / tabpanels: 5 / 5
- Obvious embedded secret patterns: 0
- Public demo adult-content term scan: 0
- OGP PNG: 1200 x 630 generated from release SVG

## Chromium functional QA

The exact release HTML/CSS/JavaScript was executed inline in Chromium because this environment blocks direct `file://` and `127.0.0.1` navigation by organization policy. A localStorage-compatible in-memory store was used only by the QA harness; the release source itself was not modified for this test.

- First-run onboarding: PASS
- One-click sample Workspace: PASS
- App version: v1.0.0
- Prompt sample: 5 records
- Prompt seed: 20260924
- Deterministic seed regeneration: PASS
- Offline Model sample: 1 record / OK 1
- Asset sample: PNG 1 / JSON 2 / Pair 1 / Orphan 1
- Notebook sample note: PASS
- Help via `?`: PASS
- Workspace switching via `1`–`5`: PASS
- Notebook via `N`: PASS
- Pose Studio document/canvas surface: PASS
- Mobile 390x844 horizontal overflow: none
- Mobile Prompt sample: 5 records
- Runtime JavaScript exceptions: 0
- Console errors: 0

## Compatibility / migration

The v1 code falls back to the Phase 2 Notebook keys (`acw-phase2-notes`, `acw-phase2-favorites`) and migrates their values into the v1 namespace when present.

## Network boundary

Prompt Lab, Pose Studio, Asset Organizer and Notebook are designed for browser-local processing. Model Inspector contains the intentional Civitai API integration used only when API fetching is selected or needed by Auto mode. API keys are read from the password input at request time and are not stored in localStorage.

## Environment limitation

Direct served-host QA could not be completed in this execution environment because Chromium returned `ERR_BLOCKED_BY_ADMINISTRATOR` for localhost. File structure, metadata and static resource references were validated directly against the release files, and browser behavior was tested with the same release code inlined.

## File System Access note

The real OS permission dialog and physical `collect/` directory write require an interactive supported browser session, so that write operation was not automated here. The scan, pair/orphan classification and manifest logic were exercised in Chromium.
