# Stage 9 AQUARIUM page audit

Baseline: `ef260aabc363e88662719fffcb7121d74fe7c7dc`.
Production `/AQUARIUM/` was fetched before editing. The four deployed files differed from the public artifact only by LF/CRLF normalization, so there was no production-only behavior to preserve.

## Existing product

AQUARIUM reads `KANJI`, `YOMI_1`, and `YOMI_2` from the `FISH` table once and renders a PHP card collection. The protected database configuration remains outside the public repository.

The original page already had a distinctive submerged dictionary-card identity and keyboard card flipping, but it lacked collection search, result counts, search-state sharing, discovery controls, and explicit portfolio framing.

## Stage 9 direction

Reframe the page as **AQUARIUM / Fish Name Archive**, a searchable underwater field index. Keep the deep-water atmosphere and paper specimen cards while making the collection itself the main interaction.
## Changes

- Added live total / visible counts and portfolio introduction.
- Added search across fish names and readings with all/name/reading scopes.
- Normalized hiragana and katakana for reading search.
- Added URL query-state synchronization for search and scope.
- Added RANDOM discovery and READ ALL / NAME ALL controls.
- Replaced article-level pseudo-buttons with native card buttons and synchronized ARIA state.
- Added arrow/Home/End navigation for search scopes and `/` search shortcut.
- Preserved the single read-only `FISH` query and private `config.php` dependency.
- Reduced decorative motion and bubble count while respecting `prefers-reduced-motion`.
- Updated the root portfolio technology label to `PHP / MySQL / Search`.

## QA

A PHP 8.4 syntax check passed for both entrypoints. Browser QA used a git-untracked temporary mock config so no production DB writes or credentials were involved. At 390px, the page had no horizontal overflow; katakana `サメ` matched reading `さめ`, name-only scope returned zero for that query, reading scope returned one, card reveal state synchronized, READ ALL / NAME ALL toggled all visible cards, arrow-key scope navigation worked, `/` focused search, and RANDOM focused a revealed card. At 1440px there was no horizontal overflow.
