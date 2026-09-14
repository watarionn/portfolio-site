# Portfolio City Phase 3.4 Closure Audit

Audited: 2026-09-14
Baseline: `9ce181d843246a7decd9ce4ee3c8772a17688869`
Production: `https://cf278796.cloudfree.jp/portfolio-city/`

## Scope

Compare live production against the two approved Portfolio City concept references while preserving the accepted project routes, data model, navigation, visited state, inspector behavior, and responsive interaction models.

Approved references:

- `02_PortfolioCity_成長する街_UIUX設計ボード_採用.png`
- `01_PortfolioCity_建物個性化コンセプト_採用.png`

## Production verification

- 390 px: 4 districts, 14 building buttons, no horizontal overflow, no severe browser errors
- 820 px: 4 districts, 14 building buttons on repeat verification, no severe browser errors
- 1440 px: 4 districts, 14 building buttons, no horizontal overflow, no severe browser errors
- the first 820 px capture briefly showed an empty map, but repeated probes at 800 / 820 / 821 / 980 px consistently rendered all 14 buildings; treat the first capture as a capture race rather than a reproducible product defect
- `district-art.css` is active in production

## Visual audit findings

### P0 — City density is still far below the approved concept

The approved boards read immediately as a lively illustrated town. Production remains much more diagrammatic: large quiet areas, thin infrastructure, and comparatively little visual mass around the projects. This is now the largest remaining gap.

### P0 — Project buildings are structurally distinct but visually underpowered

All 14 handcrafted building visuals exist and remain distinct in the DOM/CSS, but their rendered scale and contrast are too modest relative to the map. Project labels currently dominate more than the buildings themselves. The concept boards do the opposite: architecture is the first read, labels are secondary.

### P1 — Mobile has the correct one-map interaction, but not yet the intended illustrated-city impact

The 390 px layout successfully preserves one vertical town map and fixed bottom navigation. However, the approved mobile reference feels like exploring a miniature town, while production still reads mainly as paths, labels, and sparse decorative cues.

### P1 — District identity exists, but scenery does not yet carry enough of it

Checkpoint 3 gives Observatory Hill, Archive Street, Workshop Alley, and Waterside Play distinct textures and motifs. These differences are technically present, but at normal viewing distance they are subtler than the concept boards. District identity should be legible from scenery and silhouettes before reading district labels.

### P1 — Tablet is functional but visually the least expressive breakpoint

Tablet intentionally keeps the static inspector model and hides the desktop art layers. That interaction decision remains valid, but the resulting city loses too much atmosphere. The next pass should improve tablet visual density without importing the mobile interaction model.

### P2 — Information hierarchy can move closer to the concept without a layout rewrite

The current desktop title / legend / framing are clear, but the concept boards place more emphasis on the city itself and less on editorial chrome. Small spacing, scale, and hierarchy adjustments can return more of the first viewport to the town without changing navigation or data.

## Recommended closure implementation order

1. Increase building visual scale, contrast, and silhouette readability across 390 / 820 / 1440 px.
2. Add local scenery density around buildings and district edges using existing or new hand-authored local SVGs.
3. Strengthen district-specific foreground/background cues so each district reads before its text label.
4. Give tablet a dedicated decorative density pass while preserving its static inspector behavior.
5. Reduce non-city visual competition in the first desktop viewport through spacing and hierarchy polish only.

## Guardrails

- no project route changes
- no project inventory changes
- no navigation-model changes
- no mobile interaction-model rewrite
- no tablet inspector-model rewrite
- no remote image dependencies
- decorative additions remain non-interactive and `aria-hidden`
- keep horizontal overflow at zero
- keep runtime / contract gates green
- prefer local validation and `[skip ci]`; do not intentionally consume metered GitHub Actions

## Closure gate

Phase 3.4 should close after the priority items above are implemented and the live city is visually re-audited against both approved reference boards at 390 px, 820 px, and 1440 px. A new global layout or information-architecture redesign belongs in a later phase, not this closure pass.
