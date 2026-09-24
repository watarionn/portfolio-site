from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from typing import Callable, Sequence

from .core import AuditConfig, ProviderError

Runner = Callable[[Sequence[str], int], str]


def default_runner(args: Sequence[str], timeout_seconds: int) -> str:
    try:
        proc = subprocess.run(
            list(args),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout_seconds,
            check=False,
            shell=False,
        )
    except FileNotFoundError as exc:
        raise ProviderError(f"CLI executable not found: {args[0]}") from exc
    except subprocess.TimeoutExpired as exc:
        raise ProviderError(f"CLI timed out after {timeout_seconds}s") from exc
    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or "").strip()
        if len(detail) > 500:
            detail = detail[:500] + "..."
        raise ProviderError(f"CLI failed with exit code {proc.returncode}: {detail}")
    return proc.stdout


@dataclass
class S3BrowserProvider:
    config: AuditConfig
    runner: Runner = default_runner

    def _run(self, args: list[str]) -> str:
        return self.runner(args, self.config.timeout_seconds)

    def list_root_folders(self) -> list[str]:
        assert self.config.account_name
        output = self._run([
            self.config.executable,
            "/file",
            "list",
            self.config.account_name,
            self.config.bucket,
        ])
        folders: list[str] = []
        for raw in output.splitlines():
            line = raw.strip()
            if not line or line.startswith("["):
                continue
            if line.endswith("/"):
                folders.append(line.rstrip("/"))
        return sorted(set(folders))

    def list_files(self, folder: str) -> list[str]:
        assert self.config.account_name
        s3_path = f"{self.config.bucket}/{folder}/"
        output = self._run([
            self.config.executable,
            "/file",
            "list",
            self.config.account_name,
            s3_path,
            "fp",
        ])
        noise_patterns = (
            "[", "Please upgrade", "S3 Browser", "non-commercial", "---"
        )
        files: list[str] = []
        for raw in output.splitlines():
            line = raw.strip()
            if not line or line.endswith("/"):
                continue
            if any(line.startswith(prefix) for prefix in noise_patterns):
                continue
            files.append(line)
        return files


@dataclass
class AwsCliProvider:
    config: AuditConfig
    runner: Runner = default_runner

    def _base(self) -> list[str]:
        args = [self.config.executable]
        if self.config.profile:
            args += ["--profile", self.config.profile]
        return args

    def _run_json(self, tail: list[str]) -> object:
        output = self.runner(
            self._base() + tail + ["--output", "json"],
            self.config.timeout_seconds,
        )
        try:
            return json.loads(output)
        except json.JSONDecodeError as exc:
            raise ProviderError("AWS CLI returned invalid JSON") from exc

    def list_root_folders(self) -> list[str]:
        data = self._run_json([
            "s3api",
            "list-objects-v2",
            "--bucket",
            self.config.bucket,
            "--delimiter",
            "/",
            "--query",
            "CommonPrefixes[].Prefix",
        ])
        if data is None:
            return []
        if not isinstance(data, list):
            raise ProviderError("Unexpected AWS CLI folder response")
        return sorted({
            str(item).strip().rstrip("/")
            for item in data
            if str(item).strip()
        })

    def list_files(self, folder: str) -> list[str]:
        data = self._run_json([
            "s3api",
            "list-objects-v2",
            "--bucket",
            self.config.bucket,
            "--prefix",
            f"{folder}/",
            "--query",
            "Contents[].Key",
        ])
        if data is None:
            return []
        if not isinstance(data, list):
            raise ProviderError("Unexpected AWS CLI object response")
        return [
            str(item).strip()
            for item in data
            if str(item).strip() and not str(item).strip().endswith("/")
        ]


def create_provider(config: AuditConfig, runner: Runner = default_runner):
    if config.provider == "s3browser":
        return S3BrowserProvider(config, runner)
    if config.provider == "awscli":
        return AwsCliProvider(config, runner)
    raise ProviderError(f"Unsupported provider: {config.provider}")
