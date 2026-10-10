"""Scheduled entrypoint with durable per-run logs."""
import datetime as dt
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
LOG = ROOT / "publication-task-log.jsonl"
started = dt.datetime.now(dt.timezone.utc).isoformat()
try:
    recovery = subprocess.run([sys.executable, str(ROOT / "publication_recovery.py")], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=7200)
    if recovery.returncode:
        raise RuntimeError("production recovery failed: " + recovery.stderr[-2000:])
    p = subprocess.run([sys.executable, str(ROOT / "publication_production_auto.py")], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=7200)
    row = {"started": started, "exit_code": p.returncode, "stdout_tail": p.stdout[-4000:], "stderr_tail": p.stderr[-4000:]}
except Exception as exc:
    row = {"started": started, "exit_code": 1, "error": str(exc)}
with LOG.open("a", encoding="utf-8") as f:
    f.write(json.dumps(row, ensure_ascii=False) + "\n")
sys.exit(row["exit_code"])
