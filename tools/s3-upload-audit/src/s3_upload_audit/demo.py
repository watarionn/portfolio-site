from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from .core import AuditConfig, TargetList


@dataclass
class DemoScenario:
    config: AuditConfig
    targets: TargetList
    provider: "DemoProvider"
    reference_date: date
    name: str


class DemoProvider:
    def __init__(self, root_folders: list[str], files: dict[str, list[str]]) -> None:
        self._root_folders = list(root_folders)
        self._files = {str(k): list(v) for k, v in files.items()}

    def list_root_folders(self) -> list[str]:
        return list(self._root_folders)

    def list_files(self, folder: str) -> list[str]:
        value = self._files.get(folder, [])
        if value == ["__PROVIDER_ERROR__"]:
            raise RuntimeError("Demo provider error")
        return list(value)


def load_demo(path: Path | str) -> DemoScenario:
    p = Path(path)
    data = json.loads(p.read_text(encoding="utf-8"))
    ref = date.fromisoformat(str(data["reference_date"]))
    config = AuditConfig.from_mapping(data["config"])
    targets = TargetList(
        tuple(str(v) for v in data["targets"]),
        tuple(str(v) for v in data.get("duplicates", [])),
    )
    provider = DemoProvider(
        [str(v) for v in data["root_folders"]],
        {str(k): [str(x) for x in v] for k, v in data["files"].items()},
    )
    return DemoScenario(
        config=config,
        targets=targets,
        provider=provider,
        reference_date=ref,
        name=str(data.get("name", "Offline Demo")),
    )
