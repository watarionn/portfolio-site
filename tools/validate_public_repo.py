from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FORBIDDEN_EXACT = {
    ".env",
    "config.php",
    "user.ini",
    "admin.local.php",
    "config.local.php",
}

FORBIDDEN_PARTS = {
    ".git",
    ".installer",
    "runtime",
    "operator",
}

FORBIDDEN_PREFIXES = (
    "characters/",
    "apps/yorei/",
    "apps/aquarium/",
    "holoca/",
    "holoscope/",
    "shisha/",
    "secret/",
)

REQUIRED_STAGE1_FILES = {
    "index.html",
    "index-style.css",
    "index-script.js",
    "profile/index.html",
    "tools/anagram/index.html",
    "tools/actress-finder/index.html",
    "tools/cheatsheet/index.html",
    "tools/location-csv-checker/index.html",
    "tools/maze-maker/index.html",
    "tools/pixel-art-maker/index.html",
    "tools/word-generator/index.html",
    "works/dqb2/index.html",
    "works/formula-stratum-world/index.html",
    "works/madori/index.html",
    "works/prime-dot-art/index.html",
    "works/sphere/index.html",
}

TEXT_SUFFIXES = {
    ".html",
    ".htm",
    ".css",
    ".js",
    ".mjs",
    ".json",
    ".md",
    ".txt",
    ".py",
    ".yml",
    ".yaml",
    ".xml",
    ".csv",
    ".tsv",
    ".php",
}

SECRET_PATTERNS = [
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"(?i)\b(?:password|passwd|api[_-]?key|access[_-]?token|secret[_-]?key)\b\s*[:=]\s*['\"][^'\"]{8,}['\"]"),
]


def fail(message: str) -> None:
    raise SystemExit(f"ERROR: {message}")


def tracked_paths() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return [ROOT / item.decode("utf-8") for item in result.stdout.split(b"\0") if item]


def main() -> None:
    tracked = tracked_paths()
    tracked_rel = {path.relative_to(ROOT).as_posix() for path in tracked}

    missing = sorted(REQUIRED_STAGE1_FILES - tracked_rel)
    if missing:
        fail("missing required Stage 1 files: " + ", ".join(missing))

    for rel_text in sorted(tracked_rel):
        if rel_text.startswith(FORBIDDEN_PREFIXES):
            fail(f"deferred/private surface is not allowed in Stage 1: {rel_text}")

    for path in tracked:
        rel = path.relative_to(ROOT)
        parts = set(rel.parts)

        if any(part in FORBIDDEN_PARTS for part in parts):
            fail(f"forbidden tracked path component: {rel}")

        if path.name in FORBIDDEN_EXACT or path.name.startswith(".env."):
            fail(f"forbidden public file: {rel}")

        if path.is_symlink():
            fail(f"symlink is not allowed in public repository: {rel}")

        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue

        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError as exc:
            fail(f"expected UTF-8 text file is not UTF-8: {rel}: {exc}")

        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                fail(f"high-confidence secret-like content detected: {rel}")

    print(f"Public repository boundary validation passed ({len(tracked)} tracked files).")
    print("Stage 1 required surfaces are present and deferred surfaces are absent.")


if __name__ == "__main__":
    main()
