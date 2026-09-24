from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

from .core import AuditConfig, AuditError, audit_targets, load_targets
from .providers import create_provider


def write_tsv(path: Path, report) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter="\t", lineterminator="\n")
        writer.writerow([
            "Target", "Status", "ResolvedFolder", "FileName",
            "DateInFilename", "AgeDays", "Note",
        ])
        for row in report.rows:
            writer.writerow([
                row.target, row.status, row.resolved_folder,
                row.file_name, row.date_in_filename,
                "" if row.age_days is None else row.age_days,
                row.note,
            ])


def write_json(path: Path, report) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(report.to_json_dict(), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="s3-upload-audit",
        description="Read-only S3 upload coverage audit",
    )
    p.add_argument("--config", type=Path, default=Path("config.json"))
    p.add_argument("--targets", type=Path, default=Path("targets.txt"))
    p.add_argument("--tsv", type=Path, default=Path("audit-result.tsv"))
    p.add_argument("--json", dest="json_path", type=Path, default=Path("audit-result.json"))
    p.add_argument(
        "--strict",
        action="store_true",
        help="Return exit code 3 when missing/error statuses exist",
    )
    return p


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        config = AuditConfig.load(args.config)
        targets = load_targets(args.targets)
        provider = create_provider(config)
        report = audit_targets(provider, targets, config)
        write_tsv(args.tsv, report)
        write_json(args.json_path, report)
    except AuditError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2
    summary = report.to_json_dict()["summary"]
    print(json.dumps({"ok": True, **summary}, ensure_ascii=False, indent=2))
    if args.strict and report.problem_targets:
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
