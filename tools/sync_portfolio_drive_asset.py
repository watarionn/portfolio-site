#!/usr/bin/env python3
"""Sync an explicitly downloaded canonical Drive art file into a GitHub worktree.

The Drive object remains canonical. This command only stages a verified production
input copy for deterministic CI processing.
"""
from __future__ import annotations
import argparse, hashlib, shutil
from pathlib import Path

def sha256(path: Path) -> str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()

def main() -> int:
    p=argparse.ArgumentParser()
    p.add_argument("--source",type=Path,required=True)
    p.add_argument("--target",type=Path,required=True)
    p.add_argument("--sha256",required=True)
    a=p.parse_args()
    actual=sha256(a.source)
    if actual.lower()!=a.sha256.lower():
        raise SystemExit(f"SHA-256 mismatch: expected {a.sha256}, got {actual}")
    a.target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(a.source,a.target)
    if sha256(a.target)!=actual: raise SystemExit("post-copy SHA-256 mismatch")
    print(f"synced {a.target} sha256={actual}")
    return 0
if __name__=="__main__": raise SystemExit(main())
