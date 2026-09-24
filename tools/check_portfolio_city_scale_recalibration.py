from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
CITY=ROOT/'portfolio-city'
layout=json.loads((CITY/'data/map-layout.json').read_text(encoding='utf-8'))
spec=json.loads((ROOT/'docs/phase3-6-r6-scale-recalibration.json').read_text(encoding='utf-8'))
world=layout['world']
expected=spec['world']
assert world['minX']==expected['minX'] and world['minY']==expected['minY']
assert world['width']==expected['width'] and world['height']==expected['height']
assert len(layout['chunks'])==expected['chunks']==13
assert len(layout['projectPlacements'])==15
widths={p['projectId']:p['width'] for p in layout['projectPlacements']}
assert widths['holoscope']==270
assert widths['sphere']==250 and widths['prime-dot-art']==250
assert widths['mindmap-maker']==260
assert widths['aquarium']==260 and widths['holoca']==260 and widths['word-generator']==260
js=(CITY/'city.js').read_text(encoding='utf-8')
css=(CITY/'city.css').read_text(encoding='utf-8')
for token in ['world-projects','--project-world-left','--project-world-width','--project-world-height']:
    assert token in js, token
for token in ['.world-projects','--project-world-left','--project-world-width','--project-world-height']:
    assert token in css, token
print('Portfolio City R6 scale recalibration contract passed: 13 chunks / 15 authored project widths / world-project layer')
