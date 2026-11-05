# Prompt Studio 2.0: unified composer (incremental implementation)

> Historical Phase 3 plan. The new authorized completion specification is [V2_NEXT_SPEC_20261105.md](V2_NEXT_SPEC_20261105.md). The old PromptDB compatibility/migration gates below are superseded and no longer required for the new independent 2.0 build.

## Goal
One canonical template model for free-form prose and selectable parts. The existing v1.2 UI, localStorage keys, PromptDB v1, recipes, exports and model-specific renderers remain untouched until migration and E2E verification.

## New model
`segments` is an ordered list of literal text and variable references. `variables` is a keyed map of labels, candidate values and selected index. Repeated references share one selection. Render is deterministic. No implicit translation or AI inference.

## Editing contract
- Start with prose using `fromText`.
- Add a variable and replace a selection contained entirely within one plain-text segment using `replaceRange`.
- Switch its candidate with `select`; all occurrences update.
- Never flatten existing variable references when editing. Unsupported cross-segment selection raises an error.
- `legacySnapshot` is a **lossy preview only**, not a data migration. Do not overwrite v1 records with it.

## Remaining integration gates
1. Wire an accessible editor to the new model (desktop selection and iPhone selection).
2. Add reversible, non-lossy legacy import/export adapters, including semantic metadata, negative prompt and recipe modes.
3. Verify storage, autosave, history, model conversion, legacy import/export, and no data loss.
4. Run browser and mobile QA before merging or deploying.

The module is standalone and deliberately not loaded by the production page yet.
