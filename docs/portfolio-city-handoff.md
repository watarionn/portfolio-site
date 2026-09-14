# Portfolio City handoff

Updated: 2026-09-14

## Canonical state

- Canonical repository: `watarionn/portfolio-site`
- Canonical branch: `main`
- Production URL: `https://cf278796.cloudfree.jp/portfolio-city/`
- Current production baseline after Phase 3.4 Checkpoint 3: `db01ea57bf9d88c42741b8668c82632faf51d08a`
- Phase 3.3 Living City Map is closed and production-ready.
- Phase 3.4 Checkpoints 1, 2, and 3 are merged and deployed.

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
- `portfolio-city/assets/buildings/` — 14 project-specific SVG building assets
- `portfolio-city/assets/environment/` — environment SVG assets
- `tools/check_portfolio_city_contract.py` — structural and art-direction contract
- `tools/check_portfolio_city_runtime.mjs` — runtime behavior guard

## Production QA

Checkpoint 3 was validated locally before deployment with all required gates passing. Production was deployed by FTPS without GitHub Actions, then verified at 390 px, 820 px, and 1440 px with zero horizontal overflow and zero browser console errors. All 4 districts and all 14 `.building-button` elements were present in production, and `district-art.css` loaded successfully.

Existing accepted mobile snapshots from Checkpoint 2 remain available at:

- `docs/assets/portfolio-city/phase3-4-mobile/mobile-map-390.png`
- `docs/assets/portfolio-city/phase3-4-mobile/mobile-inspector-390.png`
- `docs/assets/portfolio-city/phase3-4-mobile/mobile-works-390.png`

## Validation gates

Before proposing further Portfolio City changes, run:

```text
python tools/check_portfolio_city_contract.py
node tools/check_portfolio_city_runtime.mjs
python tools/build_deployment.py
node --check portfolio-city/city.js
git diff --check
```

Browser QA should cover mobile 390 px, tablet 820 px, and desktop 1440 px. Keep horizontal overflow at zero and browser page errors at zero.

## Development rules

- Never commit directly to `main`.
- Use a work branch and Draft PR, validate the latest head locally, then move to review and merge only after approval.
- Prefer local validation and `[skip ci]` implementation commits so paid CI is not intentionally consumed.
- Do not change the existing homepage or unrelated apps when working on Portfolio City.
- Keep the 14 production project routes unchanged unless a separate migration is explicitly approved.

## Recommended next checkpoint

Perform a Phase 3.4 closure / visual polish audit against the approved concept references and live production rather than starting another global layout rewrite.

Focus on local district detail, spacing, layering, legibility, and any remaining visual inconsistencies across 390 px, 820 px, and 1440 px. Preserve the accepted 14-project structure, navigation, project routes, and interaction models. Any additional scenery should remain decorative, local, accessible, and non-interactive.
