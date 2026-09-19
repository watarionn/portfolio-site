# Phase 3.9 CP-D5L - Activation Candidate QA

Updated: 2026-09-20
Status: PASS / branch-only default-ON candidate

## Candidate
- `DEFAULT_FEATURE_FLAG = true` on the Phase 3.9 branch.
- Normal `portfolio-city/city.html` now mounts the Phase 3.9 hierarchy without a query parameter.
- Explicit QA overrides remain:
  - `?world39=1`: force ON
  - `?world39=0`: force OFF / rollback path

## Default URL browser QA
The branch candidate was served locally using the normal URL with no `world39` parameter.
- 1440 x 1200 capture: `docs/phase3-9-d5l-1440.png`
- 390 x 844 capture: `docs/phase3-9-d5l-390.png`
- Both captures are non-empty and exercise the production `city.html` shell.

## Validation
- JS syntax: PASS
- Portfolio City contract: PASS
- Portfolio City runtime contract: PASS
- Master World QA remained PASS from the activation-gate sequence.
- `git diff --check`: PASS

## Rollback diff
The activation itself is deliberately tiny: default OFF becomes default ON, plus a query override that can explicitly force OFF. Reverting the candidate is therefore a small, isolated change and does not require deleting Master World assets or hierarchy code.

## Release boundary
- This candidate exists only on `phase3-9-world-scale-growth-model`.
- No main merge.
- No production deployment.
- Production remains unchanged.

## Decision
CP-D5L: PASS.
The Phase 3.9 branch is ready to be presented as a release candidate. The next action is an explicit release gate before merging to main and deploying production.
