from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public-inventory.json"


def tracked_paths() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return [ROOT / item.decode("utf-8") for item in result.stdout.split(b"\0") if item]


def main() -> None:
    entries = []
    for path in tracked_paths():
        rel = path.relative_to(ROOT).as_posix()
        data = path.read_bytes()
        entries.append(
            {
                "path": rel,
                "size": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
            }
        )

    payload = {
        "schemaVersion": 1,
        "repository": "watarionn/portfolio-site",
        "trackedFileCount": len(entries),
        "files": entries,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.name} with {len(entries)} tracked files.")


if __name__ == "__main__":
    main()
