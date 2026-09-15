# Portfolio City Phase 3.5-P2 — Observatory Hill Visual Polish Spec

Status: P2 working specification
Baseline: `990098edc69fc72f7c7e77ab3248b46f5392f650`
Scope: Observatory Hill only

## 1. Purpose

This phase turns the illustrated Observatory Hill pilot into the visual quality master for Portfolio City before any remaining district is converted.

No remaining district may enter illustrated mass-production during this phase.

## 2. Canonical references

Read together with:

- `docs/phase3-5-illustrated-city-architecture.md`
- `docs/phase3-5-art-bible.md`
- `portfolio-city/data/map-layout.json`
- approved Google Drive references under `Portfolio City_採用設計画像_20260913`

Approved runtime assets currently in production:

- `observatory_terrain.webp`
- `holoscope.webp`
- `sphere.webp`
- `prime-dot-art.webp`

## 3. P1 audit summary

The illustrated pilot is technically successful, but it is not yet the Portfolio City quality master.

Main findings:

1. The three project buildings contain too much self-contained ground, stairs, planting, lamps, and pedestal scenery, which can make them read as isolated dioramas placed on top of the terrain.
2. Sphere currently reads first as a celestial monument rather than an enterable building.
3. Prime Dot Art's dominant circular radial motif reads too easily as a gear or clock.
4. HoloScope, Sphere, and Prime Dot Art need a clearer apparent scale hierarchy.
5. The terrain foreground and clickable buildings are too similar in sharpness and local contrast.
6. At 390 px, recognition must depend on large silhouettes rather than internal micro-detail.

## 4. Required correction order

P2 work proceeds in this order:

1. Sphere redesign
2. Prime Dot Art redesign
3. Shared building-ground contact treatment
4. HoloScope proportion polish
5. Terrain depth / sharpness polish
6. 390 / 820 / 1440 visual QA

Do not reverse this order merely to polish easier details first.

## 5. Sphere target

Sphere must read as an enterable celestial building with a globe motif, not as a monument on a pedestal.

Required changes:

- retain the blue / gold celestial identity
- reduce the globe's dominance relative to the architecture
- strengthen a clearly readable main entrance
- increase visible wall, window, roof and interior-building mass
- place the celestial sphere as an architectural crown or integrated upper structure
- simplify the independent circular plaza / pedestal language
- keep a clean bottom-center ground-contact anchor
- keep the silhouette clearly distinct from HoloScope

At 390 px, the viewer should read: "round celestial building".

## 6. Prime Dot Art target

Prime Dot Art must read as a small mathematical atelier / gallery rather than a mechanical workshop.

Required changes:

- remove or weaken the gear / clock reading of the dominant radial circle
- use a sparse dot pattern, constellation links, plotted points, survey marks, or mathematical construction lines
- prefer asymmetric point clusters over gear-like rotational symmetry
- preserve a smaller, more intimate horizontal mass than HoloScope and Sphere
- remove large mechanical props that compete with HoloScope's telescope motif
- avoid adding fine linework that disappears at runtime scale

At 390 px, the viewer should read: "small dot / star-map atelier".

## 7. HoloScope target

HoloScope already has the strongest identity and receives proportion polish rather than a full redesign.

Required changes:

- preserve the large telescope / sensor silhouette
- strengthen the vertical tower reading slightly
- keep cobalt instrument accents
- reduce unnecessary ground-island scenery around the base
- preserve the strongest landmark role in Observatory Hill

At 390 px, the telescope silhouette must remain unmistakable.

## 8. Building-ground contact standard

All three project-building assets must feel planted into the shared terrain rather than supplied with their own miniature parcel.

Rules:

- transparent background
- tightly cropped canvas with safe padding
- bottom-center anchor
- only minimal building-specific steps / threshold / immediate foundation may remain
- remove broad independent lawns, circular plazas, excessive lamps, and ornamental planting when the terrain already provides them
- contact shadow follows the canonical upper-left light and falls softly to lower-right
- contact shadow must be short and soft, not a large floating drop shadow
- terrain path and building entrance should appear visually continuous

## 9. Apparent scale hierarchy

The intended visual hierarchy is:

`HoloScope > Sphere > Prime Dot Art`

This is an apparent hierarchy, not only a JSON width difference.

Current layout widths remain the starting point:

- HoloScope: 270 world units
- Sphere: 250 world units
- Prime Dot Art: 250 world units

Image canvas padding, silhouette height, prop spread and visual mass must also support the hierarchy.

## 10. Terrain depth target

The current terrain composition is retained as the base unless a specific defect requires repainting.

Polish direction:

- keep the elevated pale-stone terrace, cypress trees, stairs, blue sky and distant mountains
- reduce distant mountain / city contrast slightly
- keep distant detail softer than project buildings
- keep building parcels visually quieter than framing scenery
- do not add micro-detail merely to increase richness
- do not bake project names, catch copy or explanatory text into the terrain

Depth order should read:

`distant atmosphere -> terrain / scenery -> clickable project buildings`

Project buildings should be one step sharper and more locally contrasted than the scenery behind them.

## 11. Style guardrails

Preserve the approved warm storybook direction:

- European town-map feeling
- elevated 3/4 view
- warm cream / pale stone
- fresh but controlled greens
- cobalt / sky-blue accents
- soft daylight from upper-left
- clean painted edges with restrained irregularity
- grouped foliage masses
- simple large forms before detail

Avoid:

- photorealism
- thick uniform black outlines
- hard vector icon styling
- excessive micro-detail
- incompatible time-of-day changes
- text labels baked into project assets

## 12. Candidate handling

Google Drive remains the working image repository.

Use:

`Portfolio City_採用設計画像_20260913/02_IllustratedCity/02_ObservatoryHill/02_Masters_And_Candidates/`

for masters and candidates.

Only approved web-ready derivatives move into GitHub runtime assets.

Generated comparison / design boards are not runtime assets and must not be promoted automatically.

## 13. Checkpoint 3 quality-master gate

Observatory Hill may become the Portfolio City quality master only when all of the following are true:

- HoloScope, Sphere and Prime Dot Art can be distinguished without labels
- 390 px still preserves the three high-level identities
- Sphere reads as an enterable building rather than a monument
- Prime Dot Art no longer reads first as a gear or clock
- the three buildings appear planted into the same terrain
- apparent scale reads HoloScope > Sphere > Prime Dot Art
- distant scenery is visibly softer than clickable buildings
- no added micro-detail is required for recognition
- no project copy is baked into images
- the existing 14-project / 4-district / 9-chunk structure remains unchanged
- click, keyboard, visited and inspector behavior remain unchanged
- 390 / 820 / 1440 visual QA passes
- no horizontal overflow
- browser console errors remain zero

Checkpoint 3 is a separate approval step. P2 completion does not automatically authorize the remaining three districts.