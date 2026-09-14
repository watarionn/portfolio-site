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
