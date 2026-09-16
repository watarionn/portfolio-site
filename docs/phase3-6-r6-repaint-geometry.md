# Phase 3.6-R6-B Terrain Repaint Geometry

R6-B keeps the 13-chunk world and all 14 project placements fixed. Only terrain drawing scale changes.

North Crown keeps the R0 route centerlines and widths: 160 world for the north spine and 120 world for both side links.

Middle Belt keeps all R0 routes, except the east-west civic spine is widened from 120 to 160 world so it reads at the same apparent scale as HoloScope and the other project buildings.

South Belt keeps the R0 HoloCa bypass geometry: 160 world shared throat, 120 world west/east bypass arms, 160 world rejoined south spine, and 120 world waterfront anchors.

Every project receives a quiet forecourt clearing. Its width is `project width + 120 world`; its centre is shifted upward from the bottom-centre building anchor by `project width * 0.60`.

These masks are geometry authority for repainting. Generated or hand-painted terrain may not redefine road centre lines, project anchors, the HoloCa split/rejoin, or world bounds.
