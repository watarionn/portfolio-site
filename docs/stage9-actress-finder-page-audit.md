# Stage 9 — 人物索引 / Actress Finder audit

## Baseline

- Public source: `tools/actress-finder/`.
- Production route: `/OTHER/actress_finder.html`.
- Baseline main: `8d75dbf0316cd79cfac05e1e6dce8f1559d8466b`.
- Production HTML was fetched before editing and matched the generated public artifact after LF/CRLF normalization.
- The legacy page was classified as a purely static app; no protected server-side recommendation API exists in the reviewed private/public repositories.

## Problems found

- The browser attempted to call the Anthropic Messages API directly without a protected server-side credential path, so the core recommendation request was not a viable production architecture.
- Inline event handlers and HTML-string result rendering mixed state, presentation, and untrusted AI output.
- Candidate cards used generous variable-height blocks even though the task is comparison-oriented.
- The page offered no shareable input state and no reusable output format independent of one AI provider.
## Stage 9 direction

Reframe the page as **ACTRESS INDEX / Recommendation Brief**, a local-first preference workbench:

1. Add favorite people as removable chips.
2. Pick a recommendation axis with a keyboard-operable radio group.
3. Build and copy a provider-neutral recommendation brief locally.
4. Paste JSON returned by any AI and render it as a consistent vertical comparison list.
5. Share only the input people and focus axis through URL state.

No API key, credential, or automatic external AI request is embedded in the browser page.

## Reference decisions

- Search/comparison tasks benefit from consistent list placement rather than irregular cards, so candidate results use fixed rows with similarity, identity/tags, and reason in predictable columns.
- Similar controls keep consistent visual treatment, while active focus state is differentiated with both border/color and ARIA state.
- Recognition is favored over recall: the current people, focus axis, brief readiness, JSON schema, and candidate score are visible in context.
## Browser QA

- 390px: `innerWidth=390`, `scrollWidth=390`.
- Added two people through Enter and Japanese-comma input.
- Focus changed to VIBE and then STYLE through keyboard navigation.
- Generated brief contained both people and the selected focus axis.
- URL stored repeated `person` parameters and the focus axis; reload restored both.
- Imported JSON was sorted by similarity and rendered with DOM APIs only.
- HTML-like strings in analysis, tags, and reasons remained literal text; no injected elements were created.
- 1440px: no horizontal overflow.

## Public-boundary / cost note

The Stage 9 implementation is static JavaScript only. It removes the automatic Anthropic request and therefore introduces no embedded secret or automatic AI API billing path.
