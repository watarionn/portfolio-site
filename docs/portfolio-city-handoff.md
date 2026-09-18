# Portfolio City handoff

Updated: 2026-09-18

> Current continuation point: see `docs/PHASE3_9_HANDOFF.md`.
> The latest production main is `35444da469696981090e415702c64e1225546ab9`.
> Phase 3.9 currently has 6 illustrated runtime buildings. The next adopted visual direction is the World Veil Pass: preserve the cross-shaped active city, add low-detail scenery beneath currently blank visible areas so the world reads as rectangular, then soften those peripheral areas with semi-transparent world-fixed cloud / fog.

## Canonical state

- Canonical repository: `watarionn/portfolio-site`
- Canonical branch: `main`
- Production URL: `https://cf278796.cloudfree.jp/portfolio-city/`
- Current production baseline: `35444da469696981090e415702c64e1225546ab9`
- Detailed current state and next-step contract: `docs/PHASE3_9_HANDOFF.md`

## Historical note

The remainder of this document describes the earlier Phase 3.4 handoff and is retained for historical context. For current work, `docs/PHASE3_9_HANDOFF.md` is authoritative.

## Phase 3.4 completed work

Checkpoint 1 added the PC art-direction depth pass: far, mid, and near layers with local hand-authored SVG environment assets.

Checkpoint 2 rebuilt the mobile presentation around the approved illustrated-city concept. Mobile now uses one vertical town map, 14 illustrated project buildings, environment art, fixed bottom navigation, a dismissible inspector overlay, and illustrated WORKS thumbnails.

Checkpoint 3 added district-specific visual identity without changing project routes or interaction models. Observatory Hill now reads as elevated and astronomical, Archive Street as bookish and informational, Workshop Alley as mechanical and handmade, and Waterside Play as aquatic and playful. The pass is isolated in `portfolio-city/district-art.css`.

Desktop and tablet behavior remain intentionally different from the mobile art pass. Desktop keeps the floating building inspector. Tablet keeps the static inspector layout.

## Approved visual references

Use the adopted Google Drive references as the visual north star:

- `02_PortfolioCity_成長する街_UIUX設計ボード_採用.png`
- `01_PortfolioCity_建物個性化コンセプト_採用.png`

The implementation should approach these references without sacrificing route stability, keyboard access, visited-state persistence, reduced-motion support, or responsive readability.

## Key implementation files

- `portfolio-city/city.html` — shared MAP / WORKS / PROFILE / CONTACT shell and inspector markup
- `portfolio-city/city.css` — desktop, tablet, mobile map art direction and responsive behavior
- `portfolio-city/district-art.css` — district-specific decorative art direction
- `portfolio-city/city.js` — city rendering, project selection, visited state, inspector, navigation, keyboard behavior
- `portfolio-city/data/projects.json` — locked 14-work inventory and production routes
- `portfolio-city/data/districts.json` — four-district city model
- `portfolio-city/assets/buildings/` — legacy/project-specific SVG building assets
- `portfolio-city/assets/illustrated/` — current illustrated terrain and accepted runtime building art
- `portfolio-city/data/map-layout.json` — current world, terrain chunks, district regions and project placements
- `portfolio-city/data/environment-details.json` — Phase 3.8 world-detail registry
- `tools/check_portfolio_city_contract.py` — structural contract
- `tools/check_portfolio_city_phase37_visual_polish.py` — Phase 3.7 visual contract
- `tools/check_portfolio_city_phase38_storybook_details.py` — Phase 3.8 detail/world-edge contract

## Current validation gates

Before proposing further Portfolio City changes, run:

```text
python tools/check_portfolio_city_contract.py
python tools/check_portfolio_city_phase37_visual_polish.py
python tools/check_portfolio_city_phase38_storybook_details.py
node --check portfolio-city/city.js
git diff --check
```

The historical `tools/check_portfolio_city_runtime.mjs` may fail because its mock does not include `environment-details.json`; do not report it as PASS unless that mock is updated separately.

Browser QA should cover mobile 390 px, tablet 820 px, and desktop 1440 px. Keep horizontal overflow at zero, verify 14 projects, preserve map drag behavior, and distinguish app/runtime failures from the unrelated root `/favicon.ico` 404.

## Development rules

- Never commit implementation work directly to `main`; use a work branch and Draft PR.
- Validate the latest head locally before Ready for review.
- Merge and deploy only after explicit approval.
- Prefer `[skip ci]` where applicable to avoid intentionally consuming metered GitHub Actions.
- Production deployment is manual FTPS; upload only changed production files when practical.
- Do not change unrelated apps when working on Portfolio City.
- Keep the 14 production project routes unchanged unless a separate migration is explicitly approved.
- Once an illustration is accepted, preserve that exact source art unless the user explicitly requests a redesign.
