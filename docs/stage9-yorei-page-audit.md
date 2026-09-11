# Stage 9 — 用例採集 page audit

Date: 2026-09-11

## Baseline explicitly checked before editing

### Public GitHub

- Repository: `watarionn/portfolio-site`
- Branch: `main`
- Baseline commit: `695ee3fc857851043207450feac9037dc08a84a6`
- The repository README defines this public repository as the canonical source of truth for publishable production code.
- `config/deployment-map.json` maps `apps/yorei/public` to the production path `YOREI`.

### Production

- Checked: `https://cf278796.cloudfree.jp/`
- Checked: `https://cf278796.cloudfree.jp/YOREI/yorei.html`
- The production `/YOREI/yorei.html` currently shows the older Aozora Bunko / NDL-T example-search interface.
- This does **not** match the canonical `main` implementation, which is the newer `Corpus Collector` workflow for manually collecting a headword, example, bibliographic source, collection metadata, visibility, preview, and My Dictionary membership.

This divergence is important: a future deployment from current public `main` will replace the older production YOREI client with the canonical `apps/yorei/public` client. Stage 9 therefore improves the canonical public source rather than preserving the stale production-only UI.

## Stage 9 objective

Turn YOREI from a tool-first screen into a portfolio work that still keeps the real application as its strongest evidence.

The page should answer, before asking the visitor to use the form:

1. What is this application?
2. What problem does it solve?
3. What information is collected?
4. What changes between an ad-hoc memo and a structured example card?
5. What can fail or require authentication?
6. Where is the real working interface?

## Changes

### 1. Portfolio framing before the live form

Added a compact Stage 9 hero with:

- project name and role (`Corpus Collector`)
- one-paragraph product explanation
- jump link to the real collector UI
- public GitHub source link

No representative screenshot was added because the real interactive UI is stronger evidence than a duplicate image.

### 2. Product capabilities made visible

Added four capability cards:

- Collect — headword, example, role, meaning
- Source — title, author, year, page, medium, ISBN
- Review — live preview and public/private state
- Organize — save and add a card to My Dictionary

These are all grounded in the existing HTML/JavaScript behavior.

### 3. Before / After story

Added a short workflow comparison:

- Before: example text and source metadata are easily separated or recorded inconsistently.
- After: the same fields are captured together as a reusable example card.

This explains the app without inventing a fictional metric or outcome.

### 4. Failure and authentication state

Added an explicit state note explaining that:

- visitors can fill and preview without logging in;
- saving requires authentication;
- missing required fields are handled separately;
- a failed Supabase write is not presented as success.

The existing `yorei.js` behavior remains authoritative and unchanged.

### 5. Real UI preserved

The existing collection form, preview card, dictionary modal, script loading order, DOM IDs, and Supabase-facing behavior were retained.

The only structural change inside the live tool is semantic: the original form heading is now an `h2` because the page-level project title is the single `h1`.

### 6. Mobile flow corrected

On narrow screens the DOM order is now respected:

1. Stage 9 introduction
2. capability / workflow / state explanation
3. collection form
4. preview

The previous mobile CSS moved the preview before the form; Stage 9 removes that inversion so the interaction reads in task order.

## Files changed

- `apps/yorei/public/yorei.html`
- `apps/yorei/public/yorei.css`
- `docs/stage9-yorei-page-audit.md`

No changes to `yorei.js`, authentication code, Supabase configuration, deployment mapping, or server-only configuration are required for this Stage 9 framing pass.

## Validation plan

Validate the branch head without paid GitHub Actions:

- run `tools/validate_public_repo.py` locally;
- run `tools/build_deployment.py` locally;
- run JavaScript syntax checks against the built public artifact;
- confirm the built `YOREI/yorei.html` contains the Stage 9 framing and all existing functional IDs;
- confirm no duplicate HTML IDs;
- compare the branch against the exact baseline commit;
- keep CI skipped with `[skip ci]` commits to avoid metered workflow execution.

## Production note

Production must not be treated as already updated. Until this branch is reviewed, merged, and explicitly deployed, `/YOREI/yorei.html` remains the older production implementation observed on 2026-09-11.
