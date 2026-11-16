"""Verify pre-rendered binary sprites exactly match the committed manifest."""
from pathlib import Path
import hashlib,json,struct
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'public/assets/manifest.json').read_text())
assert manifest['schema']==1
assert len(manifest['files'])==12
for filename,item in manifest['files'].items():
    assert filename.endswith('.webp') and '/' not in filename
    data=(root/'public/assets'/filename).read_bytes()
    assert len(data)==item['bytes']
    assert hashlib.sha256(data).hexdigest()==item['sha256']
    assert data[:4]==b'RIFF' and data[8:12]==b'WEBP'
assert (root/'public/index.html').read_text().startswith('<!doctype html>')
print('PRERENDER_MANIFEST_PASS',len(manifest['files']),'images')
