# Phase 3.9 — World Topology Candidate Study

Updated: 2026-09-18
Status: candidate comparison / no final world dimensions locked

## Purpose

Compare several abstract World Map topologies against the accepted growth model.

This is not final map art. Numbers below are **study canvases** used to test proportions and growth behavior. They do not become runtime constants merely by appearing here.

## Shared assumptions

All candidates use:

- one continuous illustrated World Map,
- a hidden logical coordinate system,
- four current published districts,
- one stable home logical cell per district,
- optional multi-cell visible footprints,
- published core + peripheral cloud band,
- local reveal expansion,
- no visible checkerboard,
- no requirement to preserve the legacy 13-chunk cross.

Legend:

- `O` Observatory Hill
- `A` Archive Street
- `W` Workshop Alley
- `S` Waterside Play
- `·` open logical geography / future address
- `~` peripheral world / cloud-capable geography

Central Commons is omitted from the district count in these diagrams because its future role is still undecided.

## Candidate T1 — Wide atlas

Study canvas: **9 × 6**, landscape.

```text
~ ~ ~ ~ ~ ~ ~ ~ ~
~ · · · · · · · ~
~ · · O · · · · ~
~ · A · W · · · ~
~ · · S · · · · ~
~ ~ ~ ~ ~ ~ ~ ~ ~
```

Intent:

- world-map / atlas feeling is immediately strong,
- large east-west expansion reserve,
- desktop composition is comfortable,
- geography can contain coastlines, mountain chains, and distant regions without crowding the city.

Growth behavior:

- W0 four districts: compact cluster with large horizontal reserve,
- W1 5–6 districts: easy to reveal west/east or diagonally,
- W2 7–9 districts: strong,
- W3 10+: still has address space, though north/south reserve is shallower.

Risks:

- mobile sees only a narrow slice unless camera logic is excellent,
- may encourage east-west expansion too strongly,
- current four districts can look tiny if the full atlas is shown too early.

Best use:

A world intended to feel much larger than the portfolio from day one.

## Candidate T2 — Balanced storybook world

Study canvas: **8 × 7**, mildly landscape / near-square.

```text
~ ~ ~ ~ ~ ~ ~ ~
~ · · · · · · ~
~ · · O · · · ~
~ · A · W · · ~
~ · · S · · · ~
~ · · · · · · ~
~ ~ ~ ~ ~ ~ ~ ~
```

Intent:

- enough width to feel like a map rather than a board,
- enough vertical reserve for north/south growth,
- current four districts remain visually important,
- works naturally with a one-band peripheral reveal.

Growth behavior:

- W0: compact and readable,
- W1: fifth/sixth district can open on different edges,
- W2: 7–9 districts can form an irregular connected region without hitting a boundary,
- W3: 10+ has reserve in every direction.

Risks:

- less immediately panoramic than T1,
- world silhouette must be made interesting through geography rather than aspect ratio alone.

Best use:

A world where long-term expansion and current readability have equal priority.

## Candidate T3 — Tall exploration map

Study canvas: **7 × 9**, portrait-biased.

```text
~ ~ ~ ~ ~ ~ ~
~ · · · · · ~
~ · · O · · ~
~ · A · W · ~
~ · · S · · ~
~ · · · · · ~
~ · · · · · ~
~ · · · · · ~
~ ~ ~ ~ ~ ~ ~
```

Intent:

- strong north/south journey feeling,
- mobile can expose meaningful vertical geography,
- supports river-valley / road-journey composition.

Growth behavior:

- W0: readable,
- W1: easy north/south reveal,
- W2: possible but lateral district branching is tighter,
- W3: 10+ tends to become a vertical chain unless geography actively counters it.

Risks:

- desktop can feel column-like,
- Archive / Workshop west-east relationship receives less breathing room,
- less compatible with the user's "world map" mental image if interpreted as a broad atlas.

Best use:

Only if later geography strongly favors a north-south journey.

## Candidate T4 — Large square reserve

Study canvas: **9 × 9**, square.

```text
~ ~ ~ ~ ~ ~ ~ ~ ~
~ · · · · · · · ~
~ · · · · · · · ~
~ · · O · · · · ~
~ · A · W · · · ~
~ · · S · · · · ~
~ · · · · · · · ~
~ · · · · · · · ~
~ ~ ~ ~ ~ ~ ~ ~ ~
```

Intent:

- maximum neutral growth freedom,
- easy to reserve distant geography,
- future topology rarely needs coordinate migration.

Growth behavior:

- W0: structurally excellent but oversized,
- W1/W2/W3: excellent reserve in all directions.

Risks:

- too much unused logical world for the current portfolio,
- encourages designing empty world merely because space exists,
- initial camera must ignore most of the master world,
- harder to justify final-art production cost.

Best use:

A long-lived platform expecting many future districts, not necessarily the best first production target.

## Comparative matrix

| Criterion | T1 Wide atlas | T2 Balanced | T3 Tall | T4 Large square |
| --- | --- | --- | --- | --- |
| Current 4-district focus | Good | Strong | Good | Fair |
| 5–6 district expansion | Strong | Strong | Good | Strong |
| 7–9 district expansion | Strong | Strong | Good | Strong |
| 10+ reserve | Good | Strong | Good | Very strong |
| Desktop world-map feel | Very strong | Strong | Fair | Good |
| Mobile crop flexibility | Good | Strong | Strong | Good |
| Four-direction growth | Good | Very strong | Fair | Very strong |
| Avoids overbuilding empty world | Good | Strong | Good | Fair |
| Geography freedom | Strong | Strong | Good | Very strong |

These are qualitative design observations, not final scores.

## Initial cluster study

The old cardinal relationship remains useful as a **semantic mnemonic**:

```text
      O
   A     W
      S
```

But the new map should not literally recreate the old cross.

For World Map composition, slightly offset the homes so geography can flow between them:

```text
        O
     A     W
          S
```

or:

```text
        O
     A
          W
       S
```

The exact arrangement should be selected together with geography.

Important invariant:

- current four remain connected as one published cluster,
- no district starts on the outer world boundary,
- at least two distinct expansion fronts remain available,
- future District 5 does not require moving any current home cell.

## Camera test

Regardless of master topology, the initial camera should **not** show the full study canvas.

At W0, frame:

- the four current district footprints,
- connecting geography,
- approximately one peripheral logical-cell-equivalent band,
- cloud / fog beyond the published edge.

Consequences:

- T1 and T4 can be physically large without making current districts tiny,
- mobile and desktop can use different crops of the same published bound,
- the master topology becomes future capacity rather than initial visual emptiness.

## Growth simulation placement test

### W1 — fifth district

Place District 5 on any meaningful neighboring geography outside the current four.

All T1–T4 pass without moving the original homes.

### W1 — sixth district on a different front

T1, T2, and T4 preserve comfortable multi-direction growth.

T3 passes structurally but begins to favor vertical development.

### W2 — 7–9 districts

T2 can form a broad irregular cluster while retaining clouded geography on multiple edges.

T1 remains strong but is more naturally horizontal.

T3 requires more deliberate lateral composition.

T4 has abundant room but does not yet earn its larger production surface.

### W3 — 10+ districts

All candidates can be authored to support this target if the logical grid remains hidden.

T2 and T4 provide the most neutral reserve. T1 remains viable if future geography accepts a landscape bias.

## Working topology direction

For the next design step, carry forward **two** candidates rather than locking a winner prematurely:

### T2 — Balanced storybook world

Use as the baseline because it best tests four-direction growth without demanding a huge empty master world.

### T1 — Wide atlas

Keep as the challenger because it most strongly communicates "a much larger world exists beyond the current portfolio."

The numeric study canvases `8 × 7` and `9 × 6` are **not locked grid dimensions**.

They are proportion tests.

The next step should determine whether the World Map's visual geography wants the balanced or panoramic family before choosing actual logical rows / columns.

## Topology study gate

World Topology Candidate Study: **COMPLETE**

Findings:

- a hidden logical grid remains viable,
- the full master world should not be visible at W0,
- T3 portrait bias adds constraints without a current need,
- T4 square reserve is structurally safe but premature,
- T2 Balanced and T1 Wide are the two useful directions to carry forward,
- no final grid dimensions are selected.

## Next step

**Abstract World Composition Study**

Create non-final, low-detail composition diagrams for:

1. T2 Balanced storybook world
2. T1 Wide atlas

Each diagram should include:

- rough land / water masses,
- current four district home regions,
- plausible 5th / 6th district expansion fronts,
- clouded peripheral reveal,
- initial W0 camera crop.

Do not create final Professor-Layton-style World Map art yet. The goal is to choose the geography family and camera behavior, not to polish illustration.
