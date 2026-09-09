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
