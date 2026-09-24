from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from .core import AuditReport, AuditRow

PROBLEM_STATUSES = {"stale", "missing-folder", "no-files", "provider-error"}


@dataclass(frozen=True)
class HistoryEntry:
    run_id: str
    timestamp: str
    source: str
    report: AuditReport


@dataclass(frozen=True)
class TargetDiff:
    target: str
    state: str
    previous_status: str = ""
    current_status: str = ""
    previous_file: str = ""
    current_file: str = ""


class AuditHistoryStore:
    def __init__(self, path: Path | str | None = None, max_entries: int = 50) -> None:
        if path is None:
            appdata = Path(os.environ.get("APPDATA", Path.home()))
            path = appdata / "S3 Upload Audit" / "history.json"
        self.path = Path(path)
        self.max_entries = max_entries

    def list_entries(self) -> list[HistoryEntry]:
        if not self.path.exists():
            return []
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []
        if not isinstance(data, list):
            return []
        entries: list[HistoryEntry] = []
        for raw in data:
            try:
                entries.append(_entry_from_dict(raw))
            except (KeyError, TypeError, ValueError):
                continue
        return entries

    def save_report(
        self,
        report: AuditReport,
        source: str,
        *,
        timestamp: datetime | None = None,
    ) -> HistoryEntry:
        now = timestamp or datetime.now(timezone.utc)
        stamp = now.astimezone(timezone.utc).replace(microsecond=0).isoformat()
        entry = HistoryEntry(
            run_id=now.strftime("%Y%m%dT%H%M%SZ"),
            timestamp=stamp,
            source=source,
            report=report,
        )
        entries = self.list_entries()
        entries.append(entry)
        entries = entries[-self.max_entries :]
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp = self.path.with_suffix(".tmp")
        temp.write_text(
            json.dumps([_entry_to_dict(e) for e in entries], ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        temp.replace(self.path)
        return entry

    def previous_before_latest(self) -> HistoryEntry | None:
        entries = self.list_entries()
        if len(entries) < 2:
            return None
        return entries[-2]

    def latest(self) -> HistoryEntry | None:
        entries = self.list_entries()
        return entries[-1] if entries else None

    def latest_for_source(self, source: str) -> HistoryEntry | None:
        for entry in reversed(self.list_entries()):
            if entry.source == source:
                return entry
        return None

    def clear(self) -> None:
        self.path.unlink(missing_ok=True)


def compare_reports(previous: AuditReport | None, current: AuditReport) -> list[TargetDiff]:
    prev = _primary_by_target(previous) if previous is not None else {}
    curr = _primary_by_target(current)
    targets = sorted(set(prev) | set(curr), key=str.casefold)
    result: list[TargetDiff] = []
    for target in targets:
        a = prev.get(target)
        b = curr.get(target)
        if a is None and b is not None:
            state = "new-problem" if b.status in PROBLEM_STATUSES else "new-target"
            result.append(TargetDiff(target, state, "", b.status, "", b.file_name))
            continue
        if a is not None and b is None:
            result.append(TargetDiff(target, "removed-target", a.status, "", a.file_name, ""))
            continue
        assert a is not None and b is not None
        was_problem = a.status in PROBLEM_STATUSES
        is_problem = b.status in PROBLEM_STATUSES
        if not was_problem and is_problem:
            state = "new-problem"
        elif was_problem and not is_problem:
            state = "recovered"
        elif a.status != b.status or a.file_name != b.file_name or a.date_in_filename != b.date_in_filename:
            state = "changed"
        else:
            state = "unchanged"
        result.append(
            TargetDiff(
                target=target,
                state=state,
                previous_status=a.status,
                current_status=b.status,
                previous_file=a.file_name,
                current_file=b.file_name,
            )
        )
    return result


def _primary_by_target(report: AuditReport | None) -> dict[str, AuditRow]:
    if report is None:
        return {}
    priority = {
        "provider-error": 0,
        "missing-folder": 1,
        "no-files": 2,
        "stale": 3,
        "ok-undated": 4,
        "ok": 5,
    }
    result: dict[str, AuditRow] = {}
    for row in report.rows:
        current = result.get(row.target)
        if current is None or priority.get(row.status, 99) < priority.get(current.status, 99):
            result[row.target] = row
    return result


def _entry_to_dict(entry: HistoryEntry) -> dict:
    return {
        "run_id": entry.run_id,
        "timestamp": entry.timestamp,
        "source": entry.source,
        "report": entry.report.to_json_dict(),
    }


def _entry_from_dict(raw: dict) -> HistoryEntry:
    report_raw = raw["report"]
    rows = [
        AuditRow(
            target=str(r.get("target", "")),
            status=str(r.get("status", "")),
            resolved_folder=str(r.get("resolved_folder", "")),
            file_name=str(r.get("file_name", "")),
            date_in_filename=str(r.get("date_in_filename", "")),
            age_days=None if r.get("age_days") in (None, "") else int(r.get("age_days")),
            note=str(r.get("note", "")),
        )
        for r in report_raw.get("rows", [])
    ]
    summary = report_raw.get("summary", {})
    report = AuditReport(
        rows=rows,
        total_targets=int(summary.get("total_targets", len({r.target for r in rows}))),
        duplicate_targets=tuple(str(v) for v in summary.get("duplicate_targets", [])),
    )
    return HistoryEntry(
        run_id=str(raw["run_id"]),
        timestamp=str(raw["timestamp"]),
        source=str(raw.get("source", "")),
        report=report,
    )
