# Phase 3.4 — Art Direction Pass

## Goal

Phase 3.4 raises the visual density of Portfolio City without changing its project data, navigation model, or mobile interaction. The map should read less like a diagram and more like a lived-in town while keeping buildings and routes easy to use.

## Checkpoint 1 — depth layers

- preserve all 14 project routes, visited state, floating inspector, keyboard behavior, WORKS / PROFILE / CONTACT, and reduced-motion behavior
- keep the existing stacked map at widths up to 980 px
- add three desktop-only decorative layers: far, mid, and near
- use local hand-authored SVG assets only; no remote image dependency
- keep every environment layer `aria-hidden` and non-interactive
- retain building hit-area separation and no horizontal overflow

## Checkpoint 1 acceptance

- desktop 1440 px renders 14 illustrated buildings plus 3 art layers
- far layer contains mountains and clouds; mid layer contains tree clusters, fountain, market stall, and reeds; near layer contains people and flowerbeds
- decorative assets remain visually below buildings and never receive pointer events
- desktop building hit-area overlap remains zero
- tablet 820 px and mobile 390 px render no new art layer and preserve the existing stacked map
- contract, runtime contract, production build, JavaScript syntax, and browser QA remain green
- browser page errors remain zero

The next checkpoints can increase local detail and atmosphere, but should not replace the project-specific buildings or make the city harder to scan.

## Checkpoint 2 — Mobile Art Direction Pass

Checkpoint 2 brings the approved mobile concept board into the real 390 px experience without copying the desktop layout verbatim.

- replace the stacked mobile district cards with one vertical illustrated town map
- use the same 14 project-specific SVG buildings on mobile
- re-enable and reposition environment layers for mountains, clouds, trees, fountain, market, people, flowerbeds, roads, shoreline, pier, and boat
- keep MAP / WORKS / PROFILE / CONTACT as a fixed bottom navigation on mobile
- open project details as a dismissible bottom overlay so the town remains visible behind it
- add project building thumbnails to the mobile WORKS directory
- keep tablet 820 px and desktop 1440 px behavior unchanged
- keep project routes, visited state, keyboard behavior, reduced motion, and existing app implementations unchanged

## Checkpoint 2 acceptance

- mobile 390 px renders 14 illustrated SVG buildings on one vertical town map
- mobile infrastructure and three art layers are visible; horizontal overflow remains zero
- project inspector opens as a fixed overlay, remains inside the viewport after its transition, and can be closed
- WORKS renders 14 rows with 14 project thumbnails
- desktop 1440 px keeps the floating inspector and art-direction layout
- tablet 820 px keeps its existing static inspector and does not adopt the mobile-only art layout
- contract, runtime contract, production build, JavaScript syntax, diff check, and browser QA remain green
- browser page errors remain zero

## Checkpoint 3 — District Identity Pass

Checkpoint 3 differentiates the four districts through decorative terrain, texture, signage, and atmosphere while preserving the accepted layout and interaction models.

- Observatory Hill uses astronomical texture and elevated contour cues
- Archive Street uses index / shelf-like texture and archival signage cues
- Workshop Alley uses drafting-grid and mechanical / gear cues
- Waterside Play uses layered water, shoreline, and wave cues
- keep all district art decorative and non-interactive
- keep all 14 project routes, project data, navigation, visited state, inspectors, and responsive interaction models unchanged
- isolate this pass in `portfolio-city/district-art.css` so it remains reversible and easy to audit

## Checkpoint 3 acceptance

- all required local validation gates pass on the merged implementation
- production renders 4 districts and 14 `.building-button` elements
- `district-art.css` loads successfully in production
- 390 px, 820 px, and 1440 px retain zero horizontal overflow and zero browser console errors
- desktop keeps its floating inspector, tablet keeps its static inspector, and mobile keeps its accepted one-map interaction model
- deployment is completed through FTPS without intentionally consuming GitHub Actions minutes

## Phase 3.4 closure direction

Before adding another major visual system, perform a closure / visual polish audit against the approved concept references and live production. Limit further work to local detail, spacing, layering, legibility, and visual consistency unless a new phase explicitly authorizes a larger redesign.
