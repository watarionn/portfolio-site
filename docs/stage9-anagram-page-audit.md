# Stage 9 — Anagram page audit

Date: 2026-09-10
Base public commit: `581c98113f4167a832f12627b29f30720d469007`
Target: `tools/anagram`
Production route: `/ANAGRAM/`

## Baseline

Production `index.html`, `anagram.html`, CSS, and JavaScript were fetched before editing and compared with the public production artifact. Byte hashes differed because production used LF while the artifact used CRLF; normalized content was identical for all four files. No production-only behavior needed to be preserved separately.

The existing tool already split source text into tiles, supported drag/touch reordering, chunk creation, manual result input, and remaining-letter validation. The main Stage 9 gaps were portfolio framing, ambiguous tile-selection semantics, grapheme handling, clearer progress metrics, copy output, and keyboard reordering.

## Reference direction

Refero had already been explicitly checked in this session and was unavailable. Public reference research therefore covered two interaction dimensions: letter-rack tools that let users rearrange tiles directly, and word-board tools that expose keyboard movement/placement shortcuts. The adopted direction is an original CSS-only **Letter Workbench**, using type drawers, letter racks, graph-paper structure, and restrained status colors. No third-party screenshots, logos, or copied interface assets are included.
## Stage 9 changes

- Reframed the page as a portfolio-ready Letter Workbench.
- Separated `COMPOSE` from `CHUNK` so choosing chunk candidates no longer adds them to the result preview.
- Reserved clicked composition tiles before matching manual input, preventing one source tile from being consumed twice.
- Added `Intl.Segmenter` grapheme splitting with an `Array.from` fallback so combining characters and emoji sequences stay together when supported.
- Added source, unique-character, chunk, and remaining-character metrics.
- Added a combined `NOW` preview and result-copy action.
- Added tile shuffling and `Alt + ArrowLeft/ArrowRight` keyboard reordering.
- Preserved desktop drag-and-drop and touch drag behavior.
- Replaced UI clearing via `innerHTML` with DOM `replaceChildren()` calls.
- Updated the root portfolio technology label to `Text Engine / Drag & Drop`.
- Added a dedicated Stage 9 contract checker and public-validator markers.

## Browser QA

Chrome/CDP at 390px showed `innerWidth=390` and `scrollWidth=390`. `aab` with one clicked `a` plus manual `ab` completed correctly, while adding manual `aab` after reserving the clicked `a` produced an input error instead of double-consuming that tile. In CHUNK mode, selecting two tiles enabled grouping while the composition preview remained empty; grouping reduced four tiles to three and increased the chunk count to one.

The source `e + combining acute / woman technologist emoji / A` produced three grapheme tiles. `Alt + ArrowRight` changed `abcd` to `acbd`, and copying a complete `abc` composition returned exactly `abc`. Desktop QA at 1440px showed no horizontal page overflow.

## Deployment gate

This audit does not authorize production deployment. The standard Draft PR → exact-head verification → Ready for review → explicit merge/deploy approval flow remains required.
