# Waterside Play building asset rules

## S1 Aquarium measured placement baseline

Measured by the placement tool against the adopted 1672 x 941 Waterside Play background.

- anchor: bottom-center
- x_percent: 19.9606
- y_percent: 57.1039
- width_percent: 25
- rotation_deg: 0
- anchor_px: x 333.74 / y 537.35

This replaces the earlier 46% scale assumption. The 46% value was derived from matching the former asset's staircase to background stairs; that basis no longer applies because ground-attached elements are removed from project-building assets.

## Building asset ground-contact rule

Project-building assets must contain the architecture itself only.

Exclude:
- stairs
- entrance stones / landing slabs
- forecourts
- planting
- fences
- other ground-attached scenery

The lower edge should terminate where the building wall / entrance meets the district ground. District scenery supplies the surrounding ground and approach.

## Placement workflow

1. Generate or edit the building only. Never generate the district background together with it.
2. Use a true-alpha transparent building PNG.
3. Load the adopted district background and building asset into the placement tool.
4. Tune position, scale, and rotation visually on the real background.
5. Export portfolio-city-placement/v2 JSON.
6. Treat exported values as the implementation source of truth.
