from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Iterable, Protocol

DATE_TOKEN = re.compile(r"(?<!\d)(\d{8})(?!\d)")
FORBIDDEN_CONFIG_KEYS = {
    "access_key", "access_key_id", "aws_access_key_id",
    "secret_key", "secret_access_key", "aws_secret_access_key",
    "session_token", "aws_session_token", "password", "token",
}
ALLOWED_CONFIG_KEYS = {
    "provider", "executable", "profile", "account_name", "bucket",
    "top_n", "parallel", "timeout_seconds", "folder_pattern", "stale_after_days",
}


class AuditError(RuntimeError):
    pass


class ProviderError(AuditError):
    pass


@dataclass(frozen=True)
class AuditConfig:
    provider: str
    executable: str
    bucket: str
    profile: str | None = None
    account_name: str | None = None
    top_n: int = 1
    parallel: int = 4
    timeout_seconds: int = 60
    folder_pattern: str = r"^\d+_{target}$"
    stale_after_days: int | None = None

    @classmethod
    def from_mapping(cls, data: dict) -> "AuditConfig":
        if not isinstance(data, dict):
            raise AuditError("Config root must be an object")
        lowered = {str(k).casefold(): k for k in data}
        forbidden = sorted(k for k in lowered if k in FORBIDDEN_CONFIG_KEYS)
        if forbidden:
            raise AuditError(
                "Credentials are not allowed in config. Use an existing CLI profile instead: "
                + ", ".join(forbidden)
            )
        unknown = sorted(set(data) - ALLOWED_CONFIG_KEYS)
        if unknown:
            raise AuditError("Unknown config keys: " + ", ".join(unknown))
        provider = str(data.get("provider", "")).strip().casefold()
        if provider not in {"s3browser", "awscli"}:
            raise AuditError("provider must be 's3browser' or 'awscli'")
        executable = str(data.get("executable", "")).strip()
        if not executable:
            executable = "s3browser-cli.exe" if provider == "s3browser" else "aws"
        bucket = str(data.get("bucket", "")).strip()
        if not bucket:
            raise AuditError("bucket is required")
        top_n = int(data.get("top_n", 1))
        parallel = int(data.get("parallel", 4))
        timeout_seconds = int(data.get("timeout_seconds", 60))
        stale_raw = data.get("stale_after_days")
        stale_after_days = None if stale_raw in (None, "") else int(stale_raw)
        if not 1 <= top_n <= 100:
            raise AuditError("top_n must be 1-100")
        if not 1 <= parallel <= 16:
            raise AuditError("parallel must be 1-16")
        if not 1 <= timeout_seconds <= 600:
            raise AuditError("timeout_seconds must be 1-600")
        if stale_after_days is not None and not 0 <= stale_after_days <= 3650:
            raise AuditError("stale_after_days must be 0-3650")
        profile = _optional_text(data.get("profile"))
        account_name = _optional_text(data.get("account_name"))
        if provider == "s3browser" and not account_name:
            raise AuditError("account_name is required for s3browser")
        return cls(
            provider=provider,
            executable=executable,
            bucket=bucket,
            profile=profile,
            account_name=account_name,
            top_n=top_n,
            parallel=parallel,
            timeout_seconds=timeout_seconds,
            folder_pattern=str(data.get("folder_pattern", r"^\d+_{target}$")),
            stale_after_days=stale_after_days,
        )

    @classmethod
    def load(cls, path: Path | str) -> "AuditConfig":
        p = Path(path)
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            raise AuditError(f"Config not found: {p}") from exc
        except json.JSONDecodeError as exc:
            raise AuditError(f"Invalid JSON config: {exc}") from exc
        return cls.from_mapping(data)


@dataclass(frozen=True)
class TargetList:
    targets: tuple[str, ...]
    duplicates: tuple[str, ...]


@dataclass(frozen=True)
class FileCandidate:
    key: str
    filename: str
    date: datetime | None


@dataclass(frozen=True)
class AuditRow:
    target: str
    status: str
    resolved_folder: str = ""
    file_name: str = ""
    date_in_filename: str = ""
    age_days: int | None = None
    note: str = ""


@dataclass
class AuditReport:
    rows: list[AuditRow] = field(default_factory=list)
    total_targets: int = 0
    duplicate_targets: tuple[str, ...] = ()

    @property
    def matched_targets(self) -> int:
        return len({r.target for r in self.rows if r.status in {"ok", "ok-undated", "stale"}})

    @property
    def stale_targets(self) -> int:
        return len({r.target for r in self.rows if r.status == "stale"})

    @property
    def problem_targets(self) -> int:
        return len({r.target for r in self.rows if r.status in {"stale", "missing-folder", "no-files", "provider-error"}})

    def to_json_dict(self) -> dict:
        return {
            "summary": {
                "total_targets": self.total_targets,
                "matched_targets": self.matched_targets,
                "stale_targets": self.stale_targets,
                "problem_targets": self.problem_targets,
                "duplicate_targets": list(self.duplicate_targets),
            },
            "rows": [r.__dict__ for r in self.rows],
        }


class ObjectProvider(Protocol):
    def list_root_folders(self) -> list[str]: ...
    def list_files(self, folder: str) -> list[str]: ...


def _optional_text(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def load_targets(path: Path | str) -> TargetList:
    p = Path(path)
    raw = p.read_bytes()
    text = None
    for encoding in ("utf-8-sig", "cp932", "utf-8"):
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise AuditError(f"Could not decode target list: {p}")
    seen: set[str] = set()
    targets: list[str] = []
    duplicates: list[str] = []
    for raw_line in text.splitlines():
        target = raw_line.strip()
        if not target or target.startswith("#"):
            continue
        if "\t" in target or "\x00" in target:
            raise AuditError("Target contains a forbidden control character")
        if target in seen:
            if target not in duplicates:
                duplicates.append(target)
            continue
        seen.add(target)
        targets.append(target)
    if not targets:
        raise AuditError("Target list is empty")
    return TargetList(tuple(targets), tuple(duplicates))


def extract_date_from_filename(name: str) -> datetime | None:
    base = Path(name).name
    for match in DATE_TOKEN.finditer(base):
        try:
            return datetime.strptime(match.group(1), "%Y%m%d")
        except ValueError:
            continue
    return None


def resolve_folders(root_folders: Iterable[str], target: str, pattern_template: str) -> list[str]:
    try:
        pattern = re.compile(pattern_template.format(target=re.escape(target)))
    except (re.error, KeyError) as exc:
        raise AuditError(f"Invalid folder_pattern: {exc}") from exc
    return sorted(
        folder.strip().rstrip("/")
        for folder in root_folders
        if pattern.fullmatch(folder.strip().rstrip("/"))
    )


def rank_files(keys: Iterable[str], top_n: int) -> tuple[list[FileCandidate], int]:
    candidates: list[FileCandidate] = []
    for key in keys:
        clean = str(key).strip()
        if not clean or clean.endswith("/"):
            continue
        filename = clean.rsplit("/", 1)[-1]
        candidates.append(FileCandidate(clean, filename, extract_date_from_filename(filename)))
    undated_count = sum(c.date is None for c in candidates)
    candidates.sort(
        key=lambda c: (
            c.date is not None,
            c.date or datetime.min,
            c.filename.casefold(),
        ),
        reverse=True,
    )
    return candidates[:top_n], undated_count


def audit_targets(
    provider: ObjectProvider,
    target_list: TargetList,
    config: AuditConfig,
    *,
    reference_date=None,
) -> AuditReport:
    from datetime import date as _date
    if reference_date is None:
        reference_date = _date.today()
    try:
        root_folders = provider.list_root_folders()
    except Exception as exc:
        raise ProviderError(f"Root folder listing failed: {exc}") from exc

    report = AuditReport(
        total_targets=len(target_list.targets),
        duplicate_targets=target_list.duplicates,
    )
    jobs: list[tuple[str, str]] = []
    for target in target_list.targets:
        matched = resolve_folders(root_folders, target, config.folder_pattern)
        if not matched:
            report.rows.append(AuditRow(target, "missing-folder", note="No matching folder"))
            continue
        for folder in matched:
            jobs.append((target, folder))

    def inspect_one(target: str, folder: str) -> list[AuditRow]:
        try:
            keys = provider.list_files(folder)
        except Exception as exc:
            return [AuditRow(target, "provider-error", resolved_folder=folder, note=str(exc))]
        ranked, undated_count = rank_files(keys, config.top_n)
        if not ranked:
            return [AuditRow(target, "no-files", resolved_folder=folder, note="No files found")]
        rows: list[AuditRow] = []
        for candidate in ranked:
            age_days = None
            status = "ok-undated"
            if candidate.date:
                age_days = (reference_date - candidate.date.date()).days
                status = "ok"
                if (
                    config.stale_after_days is not None
                    and age_days > config.stale_after_days
                ):
                    status = "stale"
            rows.append(
                AuditRow(
                    target=target,
                    status=status,
                    resolved_folder=folder,
                    file_name=candidate.filename,
                    date_in_filename=candidate.date.strftime("%Y/%m/%d") if candidate.date else "",
                    age_days=age_days,
                    note=f"undated_in_folder={undated_count}" if undated_count else "",
                )
            )
        return rows

    with ThreadPoolExecutor(max_workers=config.parallel) as executor:
        future_map = {
            executor.submit(inspect_one, target, folder): (target, folder)
            for target, folder in jobs
        }
        gathered: list[AuditRow] = []
        for future in as_completed(future_map):
            gathered.extend(future.result())

    order = {target: i for i, target in enumerate(target_list.targets)}
    gathered.sort(key=lambda r: (order[r.target], r.resolved_folder, r.file_name))
    report.rows.extend(gathered)
    return report
