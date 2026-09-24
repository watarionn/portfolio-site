from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class AuditPreset:
    top_n: int = 1
    parallel: int = 4
    timeout_seconds: int = 60
    stale_after_days: int | None = 30
    folder_pattern: str = r"^\d+_{target}$"


BUILTIN_PRESETS: dict[str, AuditPreset] = {
    "Monthly": AuditPreset(top_n=1, parallel=4, timeout_seconds=60, stale_after_days=30),
    "Strict Weekly": AuditPreset(top_n=1, parallel=4, timeout_seconds=60, stale_after_days=7),
    "History 3": AuditPreset(top_n=3, parallel=4, timeout_seconds=60, stale_after_days=30),
}


class AppSettings:
    def __init__(self, path: Path | str | None = None) -> None:
        if path is None:
            appdata = Path(os.environ.get("APPDATA", Path.home()))
            path = appdata / "S3 Upload Audit" / "settings.json"
        self.path = Path(path)
        self.data = {
            "onboarding_seen": False,
            "last_config_path": "",
            "last_targets_path": "",
            "last_preset": "Monthly",
            "presets": {},
        }
        self.load()

    def load(self) -> None:
        if not self.path.exists():
            return
        try:
            value = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return
        if isinstance(value, dict):
            self.data.update(value)
        if not isinstance(self.data.get("presets"), dict):
            self.data["presets"] = {}

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp = self.path.with_suffix(".tmp")
        temp.write_text(
            json.dumps(self.data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        temp.replace(self.path)

    @property
    def onboarding_seen(self) -> bool:
        return bool(self.data.get("onboarding_seen"))

    def mark_onboarding_seen(self) -> None:
        self.data["onboarding_seen"] = True
        self.save()

    def set_paths(self, config_path: str, targets_path: str) -> None:
        self.data["last_config_path"] = config_path
        self.data["last_targets_path"] = targets_path
        self.save()

    def last_paths(self) -> tuple[str, str]:
        return (
            str(self.data.get("last_config_path", "")),
            str(self.data.get("last_targets_path", "")),
        )

    def presets(self) -> dict[str, AuditPreset]:
        result = dict(BUILTIN_PRESETS)
        for name, raw in self.data.get("presets", {}).items():
            if not isinstance(name, str) or not isinstance(raw, dict):
                continue
            try:
                preset = AuditPreset(
                    top_n=int(raw["top_n"]),
                    parallel=int(raw["parallel"]),
                    timeout_seconds=int(raw["timeout_seconds"]),
                    stale_after_days=None if raw.get("stale_after_days") in (None, "") else int(raw["stale_after_days"]),
                    folder_pattern=str(raw["folder_pattern"]),
                )
            except (KeyError, TypeError, ValueError):
                continue
            if _valid_preset(preset):
                result[name] = preset
        return result

    @property
    def last_preset(self) -> str:
        return str(self.data.get("last_preset", "Monthly"))

    def set_last_preset(self, name: str) -> None:
        self.data["last_preset"] = name
        self.save()

    def save_preset(self, name: str, preset: AuditPreset) -> None:
        clean = " ".join(name.strip().split())
        if not clean:
            raise ValueError("Preset name is empty")
        if len(clean) > 40:
            raise ValueError("Preset name is too long")
        if clean in BUILTIN_PRESETS:
            raise ValueError("Built-in preset names are reserved")
        if not _valid_preset(preset):
            raise ValueError("Preset values are out of range")
        self.data.setdefault("presets", {})[clean] = {
            "top_n": preset.top_n,
            "parallel": preset.parallel,
            "timeout_seconds": preset.timeout_seconds,
            "stale_after_days": preset.stale_after_days,
            "folder_pattern": preset.folder_pattern,
        }
        self.data["last_preset"] = clean
        self.save()

    def delete_preset(self, name: str) -> None:
        if name in BUILTIN_PRESETS:
            raise ValueError("Built-in presets cannot be deleted")
        self.data.setdefault("presets", {}).pop(name, None)
        if self.data.get("last_preset") == name:
            self.data["last_preset"] = "Monthly"
        self.save()


def _valid_preset(preset: AuditPreset) -> bool:
    if not 1 <= preset.top_n <= 100:
        return False
    if not 1 <= preset.parallel <= 16:
        return False
    if not 1 <= preset.timeout_seconds <= 600:
        return False
    if preset.stale_after_days is not None and not 0 <= preset.stale_after_days <= 3650:
        return False
    return bool(preset.folder_pattern.strip())
