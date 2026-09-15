# Portfolio City Phase 3.5 — Observatory Hill Quality Master

Date: 2026-09-15
Gate: Phase 3.5 Checkpoint 3 / Quality Master Decision
Initial quality-lock baseline: `990098edc69fc72f7c7e77ab3248b46f5392f650`
P2.5 revalidation baseline: `4766bf04834fb00865012ee1760a5a3be4edc641`
Working branch: `phase3-5-observatory-style-harmonization`
Decision: **PASS AFTER REVALIDATION - Observatory Hill remains the visual quality master after Phase 3.5-P2.5 style harmonization.**

> R0 supersession note (2026-09-15): Phase 3.6-R0 Whole-City Blueprint Reset withdraws `observatory_terrain.webp` from final geographic / terrain-composition approval. The terrain remains an art-direction reference for rendering quality, material warmth, lighting, vegetation grouping and detail density. HoloScope, Sphere and Prime Dot Art remain approved project-building assets. The reset does not invalidate the visual-quality findings below; it only removes the assumption that the current Observatory terrain silhouette is final geography. See `docs/phase3-6-r0-whole-city-blueprint-reset.md`.

## Scope

This checkpoint evaluates Observatory Hill only. It does not authorize production of Archive Street, Workshop Alley, or Waterside Play.

The gate follows the project-specific sequence adopted after the illustrated pilot:

1. Phase 3.5-P1 - Observatory Hill Visual Polish audit
2. Phase 3.5-P2 - Observatory Hill polish
3. Checkpoint 3 - initial Quality Master decision
4. Phase 3.5-P2.5 - Observatory Hill Style Harmonization
5. Checkpoint 3 - Quality Master revalidation

The initial Checkpoint 3 PASS was reopened after production review found that the new Sphere and Prime Dot Art still differed visibly from HoloScope and the terrain in colour, edge treatment and overall rendering character. P2.5 corrected that mismatch before the quality master was revalidated.

The older architecture document described the next broad conversion stage as “Checkpoint 3”. For current execution, this quality gate takes precedence before any remaining-district conversion.

## Approved source/runtime set

- Terrain reference: `observatory_terrain.webp` — **visual reference only after Phase 3.6-R0; final geography withdrawn**
- HoloScope: `holoscope.webp` — approved project-building asset
- Sphere: `sphere.webp` — approved project-building asset
- Prime Dot Art: `prime-dot-art.webp` — approved project-building asset
- Sphere approved master: `sphere_phase3-5-p2-5_APPROVED.png` in Google Drive
- Prime Dot Art approved master: `prime-dot-art_phase3-5-p2-5_APPROVED.png` in Google Drive

## Visual master rules locked by this checkpoint

### 1. Building hierarchy

- HoloScope is the dominant technical lookout and may read largest/tallest.
- Sphere is the rounded celestial building, clearly entered through a façade rather than read as a freestanding monument.
- Prime Dot Art is the smallest and most intimate mass, a low mathematical atelier rather than another observatory.
- Three project buildings must remain distinguishable by silhouette before labels are visible.

### 2. Motif separation

- HoloScope: telescope / observation instrument.
- Sphere: celestial globe / planetarium architecture.
- Prime Dot Art: dots, plotted relations, mathematics and restrained drafting/survey motifs.
- Do not reuse giant rings, gears, clock faces or oversized astronomical devices for Prime Dot Art.

### 3. Storybook rendering

- Warm European storybook-town feeling is the north star.
- Use cream stone, cobalt/sky-blue roofs and restrained gold accents.
- Shapes stay simple enough to survive runtime reduction.
- Avoid photorealism, uniform black outlines and excessive micro-detail.
- No project title, catchcopy or explanatory text is baked into the artwork.

### 4. Depth and sharpness

- Distant terrain stays softer and lower priority.
- Clickable project buildings are one visual step sharper than the background.
- Building edges remain painted rather than vector-hard.
- Contact shadows are soft, compact and compatible with upper-left lighting.

## Runtime QA result

### Responsive

- 1440 px: PASS
- 820 px: PASS
- 390 px: PASS
- Horizontal page overflow: `0 px` at all three widths.
- All three Observatory Hill buildings remain identifiable at 390 px.

### Interaction preservation

- Building click / selection: PASS
- Inspector title and route handoff: PASS
- Keyboard Arrow navigation: PASS
- Visited state persistence: PASS
- DOM buttons remain the interaction source; raster art does not own hit testing.
- JavaScript page errors: 0.
- The only local HTTP 404 observed was `/favicon.ico`, unrelated to Portfolio City runtime assets.

### Runtime asset measurements

| Asset | Dimensions | Alpha | Approx. bytes |
| --- | ---: | --- | ---: |
| HoloScope | 284 × 320 | yes | 18 KB |
| Sphere | 296 × 320 | yes | 27 KB |
| Prime Dot Art | 320 × 319 | yes | 31 KB |
| Observatory terrain reference | 768 × 506 | opaque | 42 KB |

All project-building assets remain far below the provisional 250 KB building budget.

## Checkpoint decision matrix

| Criterion | Result | Notes |
| --- | --- | --- |
| Natural ground contact | PASS | Compact shadows and bottom-center placement read as grounded at runtime. |
| Natural contact shadow | PASS | No large floating halo; shadow direction remains compatible with the terrain. |
| Three-building scale balance | PASS | HoloScope leads; Sphere supports; Prime Dot Art remains intimate. |
| Silhouette separation | PASS | Telescope / globe / low atelier read as separate families. |
| Background vs building sharpness | PASS | Terrain recedes; project buildings remain more legible. |
| 390 px recognition | PASS | All three remain visually distinct. |
| Sphere reads as a building | PASS | Entrance, façade and side masses prevent monument-only reading. |
| Prime Dot Art avoids gear language | PASS | Dot network and drafting motif dominate instead. |
| Storybook-town direction | PASS | Warm stone, blue roofs and restrained detail remain compatible with the approved references. |
| No baked explanatory text | PASS | Runtime art remains text-free. |
| Existing interaction contract | PASS | Click, keyboard, inspector, route and visited semantics preserved. |
| Style harmony with HoloScope | PASS | P2.5 derivatives were rebalanced against HoloScope for saturation, value and edge density, then reviewed in-map at all three widths. |
| Runtime weight | PASS | Building derivatives are 18-31 KB. |

## P2.5 style-harmonization revalidation

Production review after the first Checkpoint 3 exposed a real visual mismatch that the original QA had underweighted: Sphere and Prime Dot Art were cleaner, brighter and more decorative than HoloScope and the terrain. That first visual lock is therefore superseded by this revalidation.

The approved P2.5 runtime derivatives were tuned against HoloScope rather than judged only as standalone illustrations. Opaque-pixel measurements at runtime scale are:

| Asset | Mean saturation | Mean value | Edge density |
| --- | ---: | ---: | ---: |
| HoloScope | 0.377 | 0.546 | 0.0505 |
| Sphere P2.5 | 0.360 | 0.558 | 0.0513 |
| Prime Dot Art P2.5 | 0.363 | 0.562 | 0.0486 |

These metrics are diagnostic rather than future hard limits. The actual gate remains the in-map visual comparison: no new building should look like a separately generated product render when placed beside existing approved district art.

The 1440 / 820 / 390 in-map review confirms that the blue/gold palette no longer jumps ahead of HoloScope, edge hardness is comparable, and the three silhouettes remain distinct.

## Quality-master rule for later districts

Observatory Hill is a **quality bar, not a copy template**. Later districts must inherit camera, lighting, edge softness, runtime clarity, material warmth and detail restraint, while using their own architecture and motifs.

After Phase 3.6-R0, the same rule also applies to replacement Observatory terrain: reproduce the quality language without copying the withdrawn terrain geography.

Before a later district can be called complete, its buildings must pass the same 1440 / 820 / 390 silhouette test and interaction regression test used here.

## Stop condition

Checkpoint 3 ends here. Phase 3.6-R0 now governs geography. Do **not** resume final terrain production until the Whole-City Master Blueprint passes its growth-capacity review.