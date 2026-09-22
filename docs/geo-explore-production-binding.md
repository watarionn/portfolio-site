# EXPLORE production data binding

EXPLORE keeps authored discovery design in JSON while factual readings come from the production MariaDB snapshot.

## Boundary

`forest.json` owns:

- A-G topology and exits
- item placement
- station/address display names
- authored multiple-choice distractors
- optional narrative context
- special-experience entry points

MariaDB owns:

- authoritative station readings
- authoritative address readings
- station/line identity
- normalized address-row identity

The browser never treats a hard-coded `reading` in `forest.json` as the answer.

## Binding model

Forest schema version 2 adds a binding per item:

- station: stable normalized `stationCode`
- address: normalized unique `addressRecordId`

Address JUCD / `address_code` is intentionally not used as the sole binding key because the source contains duplicated address codes. The surrogate normalized row id is the production identity for this snapshot and is deterministic when the same normalized import is replayed in source order.

`api/forest-area.php?area=A` resolves all items in one area with a single API request. It validates the authored display name against the bound database row and returns the database reading normalized to hiragana.

A mismatch fails closed with a service error. EXPLORE does not silently fall back to an authored answer.

## Special experiences

The authored forest connects to the existing API-backed experiences:

- Area E -> 同じ字・違う読み
- Area F -> 五能線トラベラー
- Area G -> 住吉の同名駅

The entry routes remain defined in `special-experiences.json`.

## Verified snapshot

On 2026-09-22 the production binding audit checked all 41 forest items against the live read-only APIs:

- 41 / 41 item bindings found
- no authored `reading` values remain in `forest.json`
- all 3 special-experience ids resolve
- all selected station codes and address record ids exist in the production snapshot

Use `apps/geo/tools/validate_forest_contract.py` for repository-level structural checks. Runtime database mismatches are additionally caught by `forest-area.php`.
