from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .core import ArchiveError, Limits, convert_archive, inspect_archive


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="mkpdf-safe", description="Safe archive-to-PDF converter")
    sub = p.add_subparsers(dest="command", required=True)

    inspect_p = sub.add_parser("inspect", help="Validate archive metadata without extraction")
    inspect_p.add_argument("archive", type=Path)
    inspect_p.add_argument("--seven-zip", type=Path, default=Path(r"C:\Program Files\7-Zip\7z.exe"))

    conv = sub.add_parser("convert", help="Validate, extract, convert, and verify")
    conv.add_argument("archive", type=Path)
    conv.add_argument("-o", "--output", type=Path)
    conv.add_argument("--overwrite", action="store_true")
    conv.add_argument("--seven-zip", type=Path, default=Path(r"C:\Program Files\7-Zip\7z.exe"))
    return p


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    limits = Limits()
    try:
        if args.command == "inspect":
            result = inspect_archive(args.archive, limits, args.seven_zip)
            payload = {
                "archive": str(result.archive),
                "format": result.format,
                "entries": len(result.entries),
                "total_unpacked_bytes": result.total_unpacked_bytes,
            }
        else:
            result = convert_archive(
                args.archive,
                args.output,
                limits=limits,
                seven_zip=args.seven_zip,
                overwrite=args.overwrite,
            )
            payload = {
                "archive": str(result.archive),
                "output": str(result.output),
                "pages": result.pages,
                "output_bytes": result.output_bytes,
                "images": list(result.image_paths),
                "original_preserved": result.archive.exists(),
            }
    except ArchiveError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False, indent=2), file=sys.stderr)
        return 2
    print(json.dumps({"ok": True, **payload}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
