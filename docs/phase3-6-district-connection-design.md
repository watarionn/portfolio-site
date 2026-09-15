# Portfolio City Phase 3.6-P0 - District Connection Design

Date: 2026-09-15
Baseline main: `1ffb0d29e96d5acd3bd0e20875e8412ffb324b4e`
Working branch: `phase3-6-district-connection-design`
Status: **PASS / CLOSED** — connection design and wireframe validation complete; no final terrain production performed

## 1. Purpose

Phase 3.6-P0 defines how the four districts connect before Archive Street, Workshop Alley, or Waterside Play terrain production begins.

The goal is to prevent independently beautiful districts from becoming four disconnected illustrations.

This phase defines:

- the city-wide connection graph
- the neutral Central Commons connector area
- fixed connector gates in world coordinates
- chunk-seam contracts for roads, elevation, water, and vegetation
- transition-zone art rules
- future expansion rules

This phase does not create final terrain or project-building art.

## 2. Current world geometry

The world uses `1024 x 768` logical chunks and the current initial world is `3200 x 2304` world units.

Key chunk seams are `x=1024`, `x=2048`, `y=768`, and `y=1536`.

Current district regions:

- Observatory Hill: `x=768..2432`, `y=80..730`
- Archive Street: `x=120..1440`, `y=700..1700`
- Workshop Alley: `x=1760..3080`, `y=720..1720`
- Waterside Play: `x=420..2780`, `y=1580..2200`

The important discovery is the neutral gap between Archive Street and Workshop Alley: `x=1440..1760`.

That gap passes through the centre of chunk `1:1` and lines up with Observatory Hill above and Waterside Play below.

## 3. Central Commons

Chunk `1:1` hosts the city-wide transition hub, provisionally named **Central Commons**. The commons core occupies the neutral centre of the chunk; the chunk's west and east portions may still carry blend scenery into Archive Street and Workshop Alley.

Central Commons is infrastructure, not a fifth district.

It should contain no named project building.

Its visual role is to reset strong district motifs to a shared Portfolio City vocabulary before the visitor enters the next district.

Shared vocabulary may include:

- warm pale paving
- restrained stone walls
- simple lamps
- benches
- low shrubs and small trees
- a small civic fountain or wayfinding landmark

Do not let the hub become a fifth visual theme. It should be quieter than all four districts.

## 4. Connection graph

Primary city graph:

```text
                Observatory Hill
                       |
                North Connector
                       |
               [ Central Commons ]
                 /       |       \
                /        |        \
      Archive Street     |     Workshop Alley
                \        |        /
                 \       |       /
                  Waterside Play
```

Central Commons provides the main Archive Street <-> Workshop Alley crossing and the principal Observatory Hill <-> Waterside Play spine.

Two additional southern feeders connect Archive Street and Workshop Alley directly into Waterside Play so the city does not feel like every journey must pass through one square.

## 5. Inter-district gates

The following world-coordinate gates are reserved before terrain illustration begins.

| Gate | Boundary | Centre | Clear width | Role |
| --- | --- | ---: | ---: | --- |
| `G-NORTH` | `y=768` | `x=1600` | 160 | Observatory descent into Central Commons |
| `G-ARCHIVE` | `x=1440` | `y=1260` | 120 | Central Commons into Archive Street |
| `G-WORKSHOP` | `x=1760` | `y=1260` | 120 | Central Commons into Workshop Alley |
| `G-SOUTH` | `y=1536` | `x=1600` | 160 | Central Commons into Waterside Play |
| `G-ARCHIVE-WATER` | `y=1536` | `x=760` | 120 | Archive Street descent into Waterside Play |
| `G-WORKSHOP-WATER` | `y=1536` | `x=2440` | 120 | Workshop Alley descent into Waterside Play |

Gate centres may move by at most 24 world units during terrain composition if required by art, but both touching terrain assets must use the same final coordinate.

## 6. Main route identities

### North Connector

A broad pale-stone stair and gentle ramp descends from Observatory Hill toward Central Commons.

Astronomical props must fade before entering the commons. Blue/gold accents become sparse rather than stopping abruptly.

### Archive Connector

The west branch gradually introduces arcades, bookish civic details, warmer shopfront stone, and denser street trees.

No giant book or library-sign iconography should mark the boundary.

### Workshop Connector

The east branch gradually introduces timber, workshop awnings, utility stone, restrained metalwork, and slightly more practical paving.

Mechanical props stay secondary so the street does not turn into a gear-themed amusement park.

### South Connector

The central route becomes greener and more open as it approaches Waterside Play, then transitions into a promenade.

After crossing G-SOUTH, the promenade must fork around the existing HoloCa parcel at x=1600, y=1820; it must not continue as a straight centreline through that project building.

## 7. Intra-district seam anchors

District terrain may span multiple chunks, so internal seams also need fixed lanes.

| Anchor | Seam | Centre | Purpose |
| --- | --- | ---: | --- |
| `A-EW` | `x=1024` | `y=1260` | Archive Street main east-west street |
| `W-EW` | `x=2048` | `y=1260` | Workshop Alley main east-west street |
| `WS-WEST` | `x=1024` | `y=1840` | Waterside west promenade continuity |
| `WS-EAST` | `x=2048` | `y=1840` | Waterside east promenade continuity |

Waterside terrain must also preserve shoreline and water continuity across `x=1024` and `x=2048`.

The exact shoreline silhouette may vary, but the shared edge must not create a visible water-level jump or disconnected pier approach.

## 8. Connector-zone contract

Every gate reserves a transition zone extending at least 80 world units to both sides of the shared boundary.

Inside this zone:

- project buildings are prohibited
- unique landmarks are prohibited
- the primary road centreline must match across the seam
- road clear width should match within 8 world units
- paving family must be compatible on both sides
- ground elevation class must agree
- major shadow direction must remain upper-left to lower-right
- vegetation must stay clear of the road centreline by at least 32 world units
- retaining walls, stairs, and bridge approaches must terminate or continue deliberately rather than being cut at the image edge
- no baked district title or explanatory text may be used to hide a weak visual transition

Connector zones are neutral shared infrastructure first and district decoration second.

## 9. Transition-art rule

A district boundary should read as a gradient of visual vocabulary, not a hard border.

Use three bands when practical:

1. **District band** - full local identity
2. **Blend band** - local identity mixed with shared city materials
3. **Commons / neighbour band** - shared materials dominate and the next district begins to appear

Strong motifs must fade before the seam.

Examples:

- Observatory celestial brass becomes ordinary lamp metal
- Archive arcades become simple civic stonework
- Workshop timber and metal become restrained utility details
- Waterside railings and planting begin before the water itself dominates

The transition should be readable without labels but should never look like a theme-park gate.

## 10. Central Commons composition target

Reserve the quietest area around approximately `x=1600`, `y=1260` for the civic hub.

The hub should widen the north-south path into a modest square, then release traffic west, east, and south.
Suggested non-project focal element: one small fountain, compass-like paving medallion, or civic wayfinding sculpture.

It must remain visually subordinate to project buildings.

## 11. Wireframe validation

A desktop world-space overlay was tested against the current 14 project placements before any terrain art was produced.

The first draft exposed two problems: the east-west corridor at `y=1160` ran too close to Actress Finder / DQB2, and the original southern feeder gates at `x=860 / 2340` were unnecessarily close to SHISHA / Maze Maker.

The validated geometry therefore moves the Archive / Workshop main street to `y=1260`, uses a 120-world-unit clear lane, and moves the two side Waterside gates outward to `x=760 / 2440`.

Validated route skeleton:

- north spine: `(1600,650) -> (1600,1260)`
- Archive main street: `(1600,1260) -> (1440,1260) -> (1024,1260) -> (760,1260)`
- Workshop main street: `(1600,1260) -> (1760,1260) -> (2048,1260) -> (2440,1260)`
- south spine: `(1600,1260) -> (1600,1536)`, then split around HoloCa
- west split: `-> (1420,1650) -> (1240,1740) -> (1180,1840) -> (1024,1840)`
- east split: `-> (1780,1650) -> (1960,1740) -> (2020,1840) -> (2048,1840)`
- Archive feeder: `(760,1260) -> (760,1536) -> (900,1660) -> (1080,1740) -> (1180,1840) -> (1024,1840)`
- Workshop feeder: mirror through `x=1600` to `(2048,1840)`

Approximate minimum centreline clearance to an existing project anchor is 220 world units on the two main side streets, about 240 around HoloCa, and over 250 on the side Waterside feeders. With 250-260-unit building widths and 120-unit branch lanes, the wireframe preserves roughly 35 world units or more of edge-to-edge breathing room at the tightest point.

The 1440 desktop overlay visually confirms that Central Commons fits inside the neutral gap and that no route requires moving an existing project. Existing 820 / 390 layouts retain zero horizontal overflow; the connector geometry remains a shared-world production contract rather than a separate mobile map.

This wireframe is a planning aid only. It is not a runtime asset and is not shipped.

## 12. Future data representation

No runtime schema change is required during P0.

When implementation begins, the preferred direction is to add a machine-readable connection registry to `map-layout.json` or a separate `map-connections.json`.

A future record should contain at least:

```json
{
  "id": "G-NORTH",
  "axis": "horizontal",
  "boundary": 768,
  "center": 1600,
  "clearWidth": 160,
  "kind": "road",
  "elevation": "high-to-mid"
}
```

The visual art remains authoritative for exact curves, but the registry prevents future chunks from forgetting where connections must meet.

## 13. Production order after P0

Once this design is approved, remaining production should proceed in this order:

1. Central Commons connector terrain / wireframe
2. Archive Street terrain and four buildings
3. Workshop Alley terrain and four buildings
4. Waterside Play terrain and three buildings
5. Whole-city illustrated consistency checkpoint

Each district remains separately reviewable and deployable.

Do not generate all remaining district art in one batch.

## 14. P0 acceptance criteria

Phase 3.6-P0 passes when:

- all four districts have at least one clear route to the shared city network
- Archive Street and Workshop Alley connect through a neutral common area rather than touching with a hard art boundary
- Waterside Play can be reached from the central spine and from both side districts
- all required chunk seams have documented road or promenade anchors
- no connector requires moving an existing project placement
- connector zones reserve enough quiet space to survive future building replacements
- transition scenery can be painted without introducing a fifth district identity
- the scheme works with the current `1024 x 768` chunk architecture
- future project growth can extend roads from known connector lanes without repainting the whole city

## 15. P0 closure decision

Decision: **PASS / CLOSED** on 2026-09-15.

The wireframe-validated connector geometry is now the production contract for the next stage. All acceptance criteria above are satisfied without moving any of the existing 14 project placements.

The next authorized stage is **Central Commons connector terrain design**. This is a new stage and must begin from the validated P0 geometry rather than re-deriving district connections ad hoc.

No final Archive Street, Workshop Alley, or Waterside Play terrain or project-building art was produced during P0.

## 16. Stop condition

P0 ends here. Preserve the validated geometry until a later stage explicitly revises it.

Do not begin Archive Street final terrain or building production before Central Commons connector terrain design establishes the shared transition surface.
