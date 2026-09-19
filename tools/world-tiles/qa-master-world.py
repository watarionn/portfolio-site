#!/usr/bin/env python3
import hashlib, json, math
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[2]
TILES = ROOT / "portfolio-city/assets/world/v1/terrain"
MASTER = ROOT / "portfolio-city/assets/world/v1/master/portfolio-city-master-world-v1.jpg"
manifest = json.loads((TILES / "manifest.json").read_text(encoding="utf-8"))
expected = [f"{chr(65+c)}{r:02d}" for r in range(1, 13) for c in range(16)]
assert manifest["grid"] == {"columns": 16, "rows": 12, "cellCount": 192}
assert list(manifest["tiles"]) == expected
assert len(list(TILES.glob("*.webp"))) == 192
master = Image.open(MASTER).convert("RGB")
assert master.size == (8192, 6144)
recon = Image.new("RGB", master.size)
for row in range(12):
    for col in range(16):
        cid = f"{chr(65+col)}{row+1:02d}"
        path = TILES / manifest["tiles"][cid]["file"]
        tile = Image.open(path).convert("RGB")
        assert tile.size == (512, 512)
        assert hashlib.sha256(path.read_bytes()).hexdigest() == manifest["tiles"][cid]["sha256"]
        recon.paste(tile, (col * 512, row * 512))
rms = ImageStat.Stat(ImageChops.difference(master, recon)).rms
mse = sum(value * value for value in rms) / 3
psnr = 10 * math.log10((255 * 255) / mse)
print("PASS: 16x12 / 192 tiles / 512x512 / SHA-256 / 8192x6144 coverage")
print(f"Reconstruction PSNR: {psnr:.2f} dB")
print(f"Tile bytes: {sum(path.stat().st_size for path in TILES.glob('*.webp'))}")
