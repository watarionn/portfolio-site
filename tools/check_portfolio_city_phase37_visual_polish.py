from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs" / "phase3-7-runtime-manifest.json"

def fail(message: str) -> None:
    raise SystemExit(f"Phase 3.7 visual polish contract failed: {message}")

data = json.loads(MANIFEST.read_text(encoding="utf-8"))
if data.get("phase") != "3.7":
    fail("unexpected phase")
chunks = data.get("chunks", {})
if data.get("chunkCount") != 13 or len(chunks) != 13:
    fail("expected exactly 13 terrain chunks")

total = 0
for chunk_id, item in chunks.items():
    path = ROOT / item["file"]
    if not path.is_file():
        fail(f"missing {chunk_id}: {item['file']}")
    raw = path.read_bytes()
    total += len(raw)
    if len(raw) != item["bytes"]:
        fail(f"byte mismatch for {chunk_id}")
    sha = hashlib.sha256(raw).hexdigest()
    if sha != item["sha256"]:
        fail(f"SHA mismatch for {chunk_id}")
    with Image.open(path) as image:
        if image.size != (item["width"], item["height"]):
            fail(f"dimension mismatch for {chunk_id}")
        if image.size != (2048, 1536):
            fail(f"unexpected runtime dimensions for {chunk_id}")

if total != data.get("totalBytes"):
    fail("totalBytes mismatch")
qa = data.get("qa", {})
recon = qa.get("reconstruction", {})
if recon.get("maxSeamMean", 10**9) > recon.get("baselineMaxSeamMean", -1):
    fail("seam mean regressed from baseline")
if recon.get("maxSeamP95", 10**9) > recon.get("baselineMaxSeamP95", -1):
    fail("seam p95 regressed from baseline")

print(
    "Portfolio City Phase 3.7 visual polish contract passed: "
    f"{len(chunks)} chunks / {total} bytes / seam metrics improved"
)
