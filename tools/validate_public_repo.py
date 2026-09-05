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
    for path in tracked_paths():
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

    print("Public repository boundary validation passed.")


if __name__ == "__main__":
    main()
