# Stage 9 — Prime Dot Art page audit

## Scope

Target: `works/prime-dot-art/`

Goal: turn the existing interactive experiment into a portfolio case study without replacing the drawing engine.

## Existing strengths

- Sieve of Eratosthenes for prime classification.
- Rule-based direction changes mapped to integer properties.
- Optional conditions for prime index, 4k±1, digit sum, prime squares, and twin primes.
- Incremental Canvas rendering with requestAnimationFrame.
- Fully client-side implementation with no backend dependency.

## Main presentation problem

The original page begins with the settings panel, especially on mobile. The generated artifact appears later, so the viewer must understand controls before seeing why the experiment is interesting.

The redesign therefore follows a result-first principle: show the generated canvas before asking the viewer to edit rules.
## Reference direction

Refero research favored creative-product and digital-art systems where interface chrome recedes and the generated output becomes the visual anchor. The portfolio shell keeps the site's warm paper / ink / vermilion / cobalt identity while adopting that output-first hierarchy.

## Default-preset review

The original base preset (`odd prime index = right`, `even prime index = left`) produces a very sparse 5,000-step path with an approximate 2526 × 2476 step bounding box.

Candidate presets were simulated before changing the default. `right / back` produces an approximate 203 × 135 step bounding box, keeping substantially more of the structure inside the visible canvas while creating denser branching and overlap.

The engine is unchanged; only the initial selected direction for even-indexed primes is changed to U-turn. Users can still choose the original combination manually.

## Slice A implementation

- standardize the public title on `素数点画`
- add an editorial project hero and project metadata
- make the live Canvas the first workspace artifact
- move the settings rail after the Canvas in reading order
- add Concept, Logic, Explore, and related-work sections
- keep all original rule controls and optional conditions
- improve mobile rule-row sizing
- curate the initial rule preset for a denser first render

## Next slice

Editor/gallery usability: preset switching, PNG export, canvas fit/centering, clearer statistics, and mobile settings disclosure.


## Slice B — gallery / editor usability

Implemented after Slice A exact-head CI run #65 completed successfully.

### Interaction changes
- Added four one-click trajectory presets: branch, grid, 4k±1, and twin-prime emphasis.
- Added `全体表示` to recompute the current trajectory bounds and center the complete walk.
- Added PNG export with temporary Blob URL cleanup after download dispatch.
- Added a result-side statistics strip for steps, prime count, logical span, and active rule count.
- On mobile, drawing settings are collapsed behind an explicit `描画ルールを開く` control.
- Canvas remains before settings in DOM and visual reading order.

### Rendering changes
- Drawing now uses a two-pass streaming walk: first measure logical bounds, then paint into a centered fit transform.
- The path is not retained as a giant point array, so fitting does not add trajectory-sized memory growth.
- Prime ordinal counting is streamed instead of materializing a prime-index Map.
- The configured step count now means exactly that many rendered steps; the previous inclusive-loop +1 mismatch is removed.
- The `素数の2乗` override is evaluated for composite prime squares, fixing the previously unreachable option.
### Runtime verification
- Initial 5,000-step branch preset: 669 prime steps, span `203 × 135`.
- Grid preset: span `129 × 327`.
- 4k±1 preset enables both matching optional rows and reports five active rules.
- Mobile settings disclosure synchronizes `hidden` and `aria-expanded` in both directions.
- PNG export test observed one Object URL creation and one revocation of the same URL.
- 100-step prime-square test reports exactly 100 steps, 25 prime steps, and 4 prime-square matches.
- Desktop and mobile visual captures confirm the generated result remains the primary workspace surface.
- JavaScript syntax, public repository boundary, and production artifact build pass after Slice B changes.
