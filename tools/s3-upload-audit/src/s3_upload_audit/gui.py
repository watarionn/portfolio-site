from __future__ import annotations

import json
import threading
import tkinter as tk
from dataclasses import asdict
from pathlib import Path
from tkinter import filedialog, messagebox, simpledialog, ttk

from .cli import write_json, write_tsv
from .core import AuditConfig, AuditError, AuditReport, audit_targets, load_targets
from .demo import load_demo
from .history import AuditHistoryStore, TargetDiff, compare_reports
from .providers import create_provider
from .settings import AppSettings, AuditPreset, BUILTIN_PRESETS

APP_VERSION = "1.0.0"
ASSET_DIR = Path(__file__).resolve().parent / "assets"

STATUS_ORDER = (
    "all",
    "ok",
    "stale",
    "ok-undated",
    "missing-folder",
    "no-files",
    "provider-error",
)

STATUS_LABELS = {
    "all": "All",
    "ok": "Healthy",
    "stale": "Stale",
    "ok-undated": "Undated",
    "missing-folder": "Missing folder",
    "no-files": "No files",
    "provider-error": "Provider error",
}

DIFF_LABELS = {
    "new-problem": "New problem",
    "recovered": "Recovered",
    "changed": "Changed",
    "unchanged": "Unchanged",
    "new-target": "New target",
    "removed-target": "Removed target",
}


class AuditDashboard:
    def __init__(
        self,
        root: tk.Tk,
        project_root: Path | None = None,
        *,
        settings: AppSettings | None = None,
        history: AuditHistoryStore | None = None,
    ) -> None:
        self.root = root
        self.project_root = project_root or Path(__file__).resolve().parents[2]
        self.settings = settings or AppSettings()
        self.history = history or AuditHistoryStore()
        self.report: AuditReport | None = None
        self.current_diffs: list[TargetDiff] = []
        self.busy = False
        self.demo_mode = False

        last_config, last_targets = self.settings.last_paths()
        self.config_var = tk.StringVar(
            value=last_config or str(self.project_root / "config.json")
        )
        self.targets_var = tk.StringVar(
            value=last_targets or str(self.project_root / "targets.txt")
        )
        self.search_var = tk.StringVar()
        self.status_filter_var = tk.StringVar(value="all")
        self.source_var = tk.StringVar(value="No audit loaded")
        self.total_var = tk.StringVar(value="0")
        self.healthy_var = tk.StringVar(value="0")
        self.stale_var = tk.StringVar(value="0")
        self.problem_var = tk.StringVar(value="0")
        self.duplicate_var = tk.StringVar(value="0")
        self.change_var = tk.StringVar(value="0")
        self.status_var = tk.StringVar(value="Ready")

        self.preset_var = tk.StringVar(value=self.settings.last_preset)
        self.top_n_var = tk.StringVar(value="1")
        self.parallel_var = tk.StringVar(value="4")
        self.timeout_var = tk.StringVar(value="60")
        self.stale_days_var = tk.StringVar(value="30")
        self.folder_pattern_var = tk.StringVar(value=r"^\d+_{target}$")

        root.title(f"S3 Upload Audit v{APP_VERSION}")
        root.geometry("1280x820")
        root.minsize(940, 640)
        self._apply_icon()
        self._load_preset_values(self.settings.last_preset, persist=False)
        self._build_ui()
        self._bind_shortcuts()
        self._refresh_history()
        self.search_var.trace_add("write", lambda *_: self._refresh_rows())
        self.status_filter_var.trace_add("write", lambda *_: self._refresh_rows())
        self.root.after(180, self._maybe_show_onboarding)

    def _apply_icon(self) -> None:
        icon = ASSET_DIR / "app-icon.png"
        self._icon_ref = None
        if not icon.exists():
            return
        try:
            self._icon_ref = tk.PhotoImage(file=str(icon))
            self.root.iconphoto(True, self._icon_ref)
        except tk.TclError:
            self._icon_ref = None

    def _build_ui(self) -> None:
        outer = ttk.Frame(self.root, padding=14)
        outer.pack(fill="both", expand=True)

        header = ttk.Frame(outer)
        header.pack(fill="x")
        ttk.Label(header, text="S3 Upload Audit", font=("", 20, "bold")).pack(side="left")
        ttk.Label(header, text=f"v{APP_VERSION} · read-only").pack(side="left", padx=(10, 0))
        ttk.Button(header, text="Help", command=self.show_help).pack(side="right")
        ttk.Button(header, text="Offline Demo", command=self.run_demo).pack(side="right", padx=(0, 6))
        ttk.Button(header, text="Run Audit", command=self.run_live).pack(side="right", padx=(0, 6))

        self.notebook = ttk.Notebook(outer)
        self.notebook.pack(fill="both", expand=True, pady=(12, 0))

        self.dashboard_tab = ttk.Frame(self.notebook, padding=10)
        self.changes_tab = ttk.Frame(self.notebook, padding=10)
        self.history_tab = ttk.Frame(self.notebook, padding=10)
        self.notebook.add(self.dashboard_tab, text="Dashboard")
        self.notebook.add(self.changes_tab, text="Changes")
        self.notebook.add(self.history_tab, text="History")

        self._build_dashboard_tab()
        self._build_changes_tab()
        self._build_history_tab()

        footer = ttk.Frame(outer)
        footer.pack(fill="x", pady=(10, 0))
        self.progress = ttk.Progressbar(footer, mode="indeterminate", length=130)
        self.progress.pack(side="left")
        ttk.Label(footer, textvariable=self.status_var).pack(side="left", padx=(10, 0))
        self.export_tsv_btn = ttk.Button(footer, text="Export TSV", command=self.export_tsv)
        self.export_tsv_btn.pack(side="right")
        self.export_json_btn = ttk.Button(footer, text="Export JSON", command=self.export_json)
        self.export_json_btn.pack(side="right", padx=(0, 6))
        self._set_export_state(False)

    def _build_dashboard_tab(self) -> None:
        tab = self.dashboard_tab
        setup = ttk.LabelFrame(tab, text="Audit source", padding=10)
        setup.pack(fill="x")

        ttk.Label(setup, text="Config").grid(row=0, column=0, sticky="w")
        ttk.Entry(setup, textvariable=self.config_var).grid(
            row=0, column=1, sticky="ew", padx=(8, 6)
        )
        ttk.Button(setup, text="Browse", command=self.choose_config).grid(row=0, column=2)
        ttk.Button(setup, text="Edit", command=self.edit_config).grid(row=0, column=3, padx=(6, 0))

        ttk.Label(setup, text="Targets").grid(row=1, column=0, sticky="w", pady=(8, 0))
        ttk.Entry(setup, textvariable=self.targets_var).grid(
            row=1, column=1, sticky="ew", padx=(8, 6), pady=(8, 0)
        )
        ttk.Button(setup, text="Browse", command=self.choose_targets).grid(
            row=1, column=2, pady=(8, 0)
        )
        setup.columnconfigure(1, weight=1)

        options = ttk.LabelFrame(tab, text="Audit options", padding=10)
        options.pack(fill="x", pady=(8, 8))
        ttk.Label(options, text="Preset").grid(row=0, column=0, sticky="w")
        self.preset_combo = ttk.Combobox(
            options, textvariable=self.preset_var, state="readonly", width=17
        )
        self.preset_combo.grid(row=0, column=1, sticky="w", padx=(6, 10))
        self.preset_combo.bind("<<ComboboxSelected>>", self._on_preset_selected)
        ttk.Button(options, text="Save preset", command=self.save_preset).grid(row=0, column=2)
        ttk.Button(options, text="Delete", command=self.delete_preset).grid(row=0, column=3, padx=(4, 18))

        fields = [
            ("Top N", self.top_n_var, 5),
            ("Parallel", self.parallel_var, 6),
            ("Timeout sec", self.timeout_var, 8),
            ("Stale days", self.stale_days_var, 8),
        ]
        col = 4
        for label, variable, width in fields:
            ttk.Label(options, text=label).grid(row=0, column=col, sticky="w")
            ttk.Entry(options, textvariable=variable, width=width).grid(
                row=0, column=col + 1, sticky="w", padx=(4, 10)
            )
            col += 2
        ttk.Label(options, text="Folder pattern").grid(row=1, column=0, sticky="w", pady=(8, 0))
        ttk.Entry(options, textvariable=self.folder_pattern_var).grid(
            row=1, column=1, columnspan=9, sticky="ew", padx=(6, 0), pady=(8, 0)
        )
        options.columnconfigure(9, weight=1)
        self._refresh_presets()

        summary = ttk.Frame(tab)
        summary.pack(fill="x", pady=(0, 8))
        self._summary_card(summary, "Targets", self.total_var).pack(side="left", fill="x", expand=True)
        self._summary_card(summary, "Healthy", self.healthy_var).pack(side="left", fill="x", expand=True, padx=5)
        self._summary_card(summary, "Stale", self.stale_var).pack(side="left", fill="x", expand=True)
        self._summary_card(summary, "Problems", self.problem_var).pack(side="left", fill="x", expand=True, padx=5)
        self._summary_card(summary, "Changes", self.change_var).pack(side="left", fill="x", expand=True)
        self._summary_card(summary, "Duplicates", self.duplicate_var).pack(side="left", fill="x", expand=True, padx=(5, 0))

        filters = ttk.Frame(tab)
        filters.pack(fill="x", pady=(0, 8))
        ttk.Label(filters, text="Search").pack(side="left")
        self.search_entry = ttk.Entry(filters, textvariable=self.search_var, width=32)
        self.search_entry.pack(side="left", padx=(6, 14))
        ttk.Label(filters, text="Status").pack(side="left")
        self.status_combo = ttk.Combobox(
            filters,
            state="readonly",
            textvariable=self.status_filter_var,
            values=STATUS_ORDER,
            width=18,
        )
        self.status_combo.pack(side="left", padx=(6, 0))
        ttk.Label(filters, textvariable=self.source_var).pack(side="right")

        table_frame = ttk.Frame(tab)
        table_frame.pack(fill="both", expand=True)
        columns = ("target", "status", "date", "age", "folder", "file", "note")
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings", selectmode="browse")
        headings = {
            "target": "Target", "status": "Status", "date": "Date", "age": "Age",
            "folder": "Resolved folder", "file": "File", "note": "Note",
        }
        widths = {
            "target": 130, "status": 115, "date": 92, "age": 60,
            "folder": 165, "file": 270, "note": 185,
        }
        for col_name in columns:
            self.tree.heading(col_name, text=headings[col_name])
            self.tree.column(col_name, width=widths[col_name], minwidth=55)
        yscroll = ttk.Scrollbar(table_frame, orient="vertical", command=self.tree.yview)
        xscroll = ttk.Scrollbar(table_frame, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=yscroll.set, xscrollcommand=xscroll.set)
        self.tree.grid(row=0, column=0, sticky="nsew")
        yscroll.grid(row=0, column=1, sticky="ns")
        xscroll.grid(row=1, column=0, sticky="ew")
        table_frame.columnconfigure(0, weight=1)
        table_frame.rowconfigure(0, weight=1)
        self.tree.tag_configure("ok", background="#eef7ee")
        self.tree.tag_configure("stale", background="#fff4d8")
        self.tree.tag_configure("ok-undated", background="#eef2f7")
        self.tree.tag_configure("missing-folder", background="#fde9e7")
        self.tree.tag_configure("no-files", background="#fde9e7")
        self.tree.tag_configure("provider-error", background="#f6e3f2")

    def _build_changes_tab(self) -> None:
        tab = self.changes_tab
        top = ttk.Frame(tab)
        top.pack(fill="x", pady=(0, 8))
        ttk.Label(
            top,
            text="Current audit compared with the previous run from the same audit source.",
        ).pack(side="left")
        self.diff_source_label = ttk.Label(top, text="No comparison yet")
        self.diff_source_label.pack(side="right")

        columns = ("target", "change", "previous", "current", "previous_file", "current_file")
        body = ttk.Frame(tab)
        body.pack(fill="both", expand=True)
        self.diff_tree = ttk.Treeview(body, columns=columns, show="headings")
        headings = {
            "target": "Target", "change": "Change", "previous": "Previous",
            "current": "Current", "previous_file": "Previous file", "current_file": "Current file",
        }
        widths = {
            "target": 150, "change": 120, "previous": 110,
            "current": 110, "previous_file": 300, "current_file": 300,
        }
        for col in columns:
            self.diff_tree.heading(col, text=headings[col])
            self.diff_tree.column(col, width=widths[col], minwidth=70)
        y = ttk.Scrollbar(body, orient="vertical", command=self.diff_tree.yview)
        x = ttk.Scrollbar(body, orient="horizontal", command=self.diff_tree.xview)
        self.diff_tree.configure(yscrollcommand=y.set, xscrollcommand=x.set)
        self.diff_tree.grid(row=1, column=0, sticky="nsew")
        y.grid(row=1, column=1, sticky="ns")
        x.grid(row=2, column=0, sticky="ew")
        body.columnconfigure(0, weight=1)
        body.rowconfigure(0, weight=1)
        for tag, color in {
            "new-problem": "#fde9e7",
            "recovered": "#e7f4e8",
            "changed": "#fff4d8",
            "new-target": "#eaf1fb",
            "removed-target": "#eeeeee",
        }.items():
            self.diff_tree.tag_configure(tag, background=color)

    def _build_history_tab(self) -> None:
        tab = self.history_tab
        top = ttk.Frame(tab)
        top.pack(fill="x", pady=(0, 8))
        ttk.Label(
            top,
            text="Stored locally only. History may contain target and file names from your audit.",
        ).pack(side="left")
        ttk.Button(top, text="Clear history", command=self.clear_history).pack(side="right")
        ttk.Button(top, text="View selected", command=self.view_selected_history).pack(side="right", padx=(0, 6))

        columns = ("time", "source", "targets", "matched", "stale", "problems", "duplicates")
        body = ttk.Frame(tab)
        body.pack(fill="both", expand=True)
        self.history_tree = ttk.Treeview(body, columns=columns, show="headings", selectmode="browse")
        headings = {
            "time": "UTC time", "source": "Source", "targets": "Targets",
            "matched": "Matched", "stale": "Stale", "problems": "Problems", "duplicates": "Duplicates",
        }
        widths = {
            "time": 160, "source": 320, "targets": 80,
            "matched": 80, "stale": 70, "problems": 80, "duplicates": 90,
        }
        for col in columns:
            self.history_tree.heading(col, text=headings[col])
            self.history_tree.column(col, width=widths[col], minwidth=60)
        y = ttk.Scrollbar(body, orient="vertical", command=self.history_tree.yview)
        x = ttk.Scrollbar(body, orient="horizontal", command=self.history_tree.xview)
        self.history_tree.configure(yscrollcommand=y.set, xscrollcommand=x.set)
        self.history_tree.grid(row=1, column=0, sticky="nsew")
        y.grid(row=1, column=1, sticky="ns")
        x.grid(row=2, column=0, sticky="ew")
        body.columnconfigure(0, weight=1)
        body.rowconfigure(0, weight=1)
        self.history_tree.bind("<Double-1>", lambda _e: self.view_selected_history())

    def _summary_card(self, parent: ttk.Frame, title: str, variable: tk.StringVar) -> ttk.Frame:
        frame = ttk.LabelFrame(parent, text=title, padding=(10, 6))
        ttk.Label(frame, textvariable=variable, font=("", 17, "bold")).pack(anchor="w")
        return frame

    def _bind_shortcuts(self) -> None:
        self.root.bind_all("<Control-r>", lambda _e: self.run_live())
        self.root.bind_all("<Control-d>", lambda _e: self.run_demo())
        self.root.bind_all("<Control-f>", lambda _e: self._focus_search())
        self.root.bind_all("<Control-e>", lambda _e: self.export_tsv())
        self.root.bind_all("<Control-Shift-E>", lambda _e: self.export_json())
        self.root.bind_all("<F1>", lambda _e: self.show_help())

    def _focus_search(self) -> str:
        self.notebook.select(self.dashboard_tab)
        self.search_entry.focus_set()
        return "break"

    def choose_config(self) -> None:
        path = filedialog.askopenfilename(
            title="Choose config.json",
            filetypes=[("JSON", "*.json"), ("All files", "*.*")],
        )
        if path:
            self.config_var.set(path)
            self._load_options_from_config(Path(path))

    def choose_targets(self) -> None:
        path = filedialog.askopenfilename(
            title="Choose targets.txt",
            filetypes=[("Text", "*.txt"), ("All files", "*.*")],
        )
        if path:
            self.targets_var.set(path)

    def _option_values(self) -> AuditPreset:
        stale_text = self.stale_days_var.get().strip()
        return AuditPreset(
            top_n=int(self.top_n_var.get()),
            parallel=int(self.parallel_var.get()),
            timeout_seconds=int(self.timeout_var.get()),
            stale_after_days=None if stale_text == "" else int(stale_text),
            folder_pattern=self.folder_pattern_var.get().strip(),
        )

    def _config_mapping_with_options(self, base: AuditConfig) -> dict:
        preset = self._option_values()
        data = {
            "provider": base.provider,
            "executable": base.executable,
            "bucket": base.bucket,
            "top_n": preset.top_n,
            "parallel": preset.parallel,
            "timeout_seconds": preset.timeout_seconds,
            "folder_pattern": preset.folder_pattern,
            "stale_after_days": preset.stale_after_days,
        }
        if base.profile:
            data["profile"] = base.profile
        if base.account_name:
            data["account_name"] = base.account_name
        return data

    def _load_options_from_config(self, path: Path) -> None:
        try:
            cfg = AuditConfig.load(path)
        except AuditError:
            return
        self.top_n_var.set(str(cfg.top_n))
        self.parallel_var.set(str(cfg.parallel))
        self.timeout_var.set(str(cfg.timeout_seconds))
        self.stale_days_var.set("" if cfg.stale_after_days is None else str(cfg.stale_after_days))
        self.folder_pattern_var.set(cfg.folder_pattern)

    def edit_config(self) -> None:
        path = Path(self.config_var.get())
        try:
            cfg = AuditConfig.load(path)
        except AuditError:
            cfg = AuditConfig.from_mapping({
                "provider": "awscli",
                "executable": "aws",
                "profile": "your-read-only-profile",
                "bucket": "your-bucket-name",
                "top_n": 1,
                "parallel": 4,
                "timeout_seconds": 60,
                "folder_pattern": r"^\d+_{target}$",
                "stale_after_days": 30,
            })
        win = tk.Toplevel(self.root)
        win.title("Edit read-only audit config")
        win.transient(self.root)
        win.grab_set()
        frame = ttk.Frame(win, padding=16)
        frame.pack(fill="both", expand=True)

        values = {
            "provider": tk.StringVar(value=cfg.provider),
            "executable": tk.StringVar(value=cfg.executable),
            "profile": tk.StringVar(value=cfg.profile or ""),
            "account_name": tk.StringVar(value=cfg.account_name or ""),
            "bucket": tk.StringVar(value=cfg.bucket),
        }
        labels = [
            ("Provider", "provider"),
            ("Executable", "executable"),
            ("AWS profile", "profile"),
            ("S3 Browser account", "account_name"),
            ("Bucket", "bucket"),
        ]
        for row, (label, key) in enumerate(labels):
            ttk.Label(frame, text=label).grid(row=row, column=0, sticky="w", pady=4)
            if key == "provider":
                widget = ttk.Combobox(
                    frame, textvariable=values[key], values=("awscli", "s3browser"),
                    state="readonly", width=28
                )
            else:
                widget = ttk.Entry(frame, textvariable=values[key], width=42)
            widget.grid(row=row, column=1, sticky="ew", padx=(8, 0), pady=4)
        ttk.Label(
            frame,
            text="Credentials are intentionally not accepted here. Authentication stays in the existing CLI profile.",
            wraplength=470,
        ).grid(row=5, column=0, columnspan=2, sticky="w", pady=(10, 12))

        def save() -> None:
            try:
                mapping = {
                    "provider": values["provider"].get(),
                    "executable": values["executable"].get(),
                    "bucket": values["bucket"].get(),
                    "profile": values["profile"].get() or None,
                    "account_name": values["account_name"].get() or None,
                    **asdict(self._option_values()),
                }
                mapping = {k: v for k, v in mapping.items() if v is not None}
                validated = AuditConfig.from_mapping(mapping)
                self._write_config(path, validated)
            except (ValueError, AuditError, OSError) as exc:
                messagebox.showerror("Config", str(exc), parent=win)
                return
            self.config_var.set(str(path))
            self.status_var.set(f"Config saved: {path}")
            win.destroy()

        buttons = ttk.Frame(frame)
        buttons.grid(row=6, column=0, columnspan=2, sticky="e")
        ttk.Button(buttons, text="Cancel", command=win.destroy).pack(side="left")
        ttk.Button(buttons, text="Save", command=save).pack(side="left", padx=(6, 0))
        frame.columnconfigure(1, weight=1)

    def _write_config(self, path: Path, config: AuditConfig) -> None:
        data = {
            "provider": config.provider,
            "executable": config.executable,
            "bucket": config.bucket,
            "top_n": config.top_n,
            "parallel": config.parallel,
            "timeout_seconds": config.timeout_seconds,
            "folder_pattern": config.folder_pattern,
            "stale_after_days": config.stale_after_days,
        }
        if config.profile:
            data["profile"] = config.profile
        if config.account_name:
            data["account_name"] = config.account_name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    def _refresh_presets(self) -> None:
        names = list(self.settings.presets())
        self.preset_combo.configure(values=names)
        if self.preset_var.get() not in names:
            self.preset_var.set("Monthly")

    def _load_preset_values(self, name: str, persist: bool = True) -> None:
        presets = self.settings.presets()
        preset = presets.get(name, BUILTIN_PRESETS["Monthly"])
        self.top_n_var.set(str(preset.top_n))
        self.parallel_var.set(str(preset.parallel))
        self.timeout_var.set(str(preset.timeout_seconds))
        self.stale_days_var.set("" if preset.stale_after_days is None else str(preset.stale_after_days))
        self.folder_pattern_var.set(preset.folder_pattern)
        self.preset_var.set(name if name in presets else "Monthly")
        if persist:
            self.settings.set_last_preset(self.preset_var.get())

    def _on_preset_selected(self, _event: object = None) -> None:
        self._load_preset_values(self.preset_var.get(), persist=True)
        self.status_var.set(f"Preset: {self.preset_var.get()}")

    def save_preset(self) -> None:
        name = simpledialog.askstring("Save preset", "Preset name:", parent=self.root)
        if name is None:
            return
        try:
            self.settings.save_preset(name, self._option_values())
        except (ValueError, OSError) as exc:
            messagebox.showerror("Preset", str(exc))
            return
        self._refresh_presets()
        self.preset_var.set(" ".join(name.strip().split()))
        self.status_var.set("Preset saved")

    def delete_preset(self) -> None:
        name = self.preset_var.get()
        if name in BUILTIN_PRESETS:
            messagebox.showinfo("Preset", "Built-in presets cannot be deleted.")
            return
        try:
            self.settings.delete_preset(name)
        except (ValueError, OSError) as exc:
            messagebox.showerror("Preset", str(exc))
            return
        self._refresh_presets()
        self._load_preset_values("Monthly", persist=True)
        self.status_var.set("Preset deleted")

    def run_live(self) -> None:
        if self.busy:
            return
        try:
            base = AuditConfig.load(Path(self.config_var.get()))
            config = AuditConfig.from_mapping(self._config_mapping_with_options(base))
            targets_path = Path(self.targets_var.get())
            self.settings.set_paths(str(Path(self.config_var.get())), str(targets_path))
        except (AuditError, ValueError) as exc:
            messagebox.showerror("S3 Upload Audit", str(exc))
            return
        self._set_busy(True, "Starting read-only audit…")
        threading.Thread(
            target=self._live_worker, args=(config, targets_path), daemon=True
        ).start()

    def _live_worker(self, config: AuditConfig, targets_path: Path) -> None:
        try:
            targets = load_targets(targets_path)
            provider = create_provider(config)
            report = audit_targets(provider, targets, config)
        except Exception as exc:
            self.root.after(0, self._audit_failed, exc)
            return
        source = f"{config.provider} · {config.bucket}"
        self.root.after(0, self._audit_done, report, source, False, True)

    def run_demo(self) -> None:
        if self.busy:
            return
        self._set_busy(True, "Loading offline demo…")
        try:
            demo_path = self.project_root / "fixtures" / "demo_s3.json"
            if not demo_path.exists():
                demo_path = ASSET_DIR / "demo_s3.json"
            scenario = load_demo(demo_path)
            report = audit_targets(
                scenario.provider,
                scenario.targets,
                scenario.config,
                reference_date=scenario.reference_date,
            )
        except Exception as exc:
            self._audit_failed(exc)
            return
        source = f"{scenario.name} · reference {scenario.reference_date.isoformat()}"
        self._audit_done(report, source, True, True)

    def _audit_failed(self, exc: Exception) -> None:
        self._set_busy(False, "Audit failed")
        messagebox.showerror("S3 Upload Audit", str(exc))

    def _audit_done(
        self,
        report: AuditReport,
        source: str,
        demo_mode: bool,
        save_history: bool,
    ) -> None:
        previous = self.history.latest_for_source(source) if save_history else None
        self.report = report
        self.demo_mode = demo_mode
        self.current_diffs = compare_reports(previous.report if previous else None, report)
        self.source_var.set(source)
        self.diff_source_label.configure(
            text="First run for this source" if previous is None else f"Previous: {previous.timestamp}"
        )
        if save_history:
            self.history.save_report(report, source)
        self._update_summary()
        self._refresh_rows()
        self._refresh_diffs()
        self._refresh_history()
        self._set_export_state(True)
        self._set_busy(False, f"Audit complete · {len(report.rows)} result rows")

    def _update_summary(self) -> None:
        report = self.report
        if report is None:
            for var in (
                self.total_var, self.healthy_var, self.stale_var,
                self.problem_var, self.change_var, self.duplicate_var
            ):
                var.set("0")
            return
        healthy = len({
            row.target for row in report.rows if row.status in {"ok", "ok-undated"}
        })
        changed = sum(1 for d in self.current_diffs if d.state != "unchanged")
        self.total_var.set(str(report.total_targets))
        self.healthy_var.set(str(healthy))
        self.stale_var.set(str(report.stale_targets))
        self.problem_var.set(str(report.problem_targets))
        self.change_var.set(str(changed))
        self.duplicate_var.set(str(len(report.duplicate_targets)))

    def _filtered_rows(self):
        if self.report is None:
            return []
        query = self.search_var.get().strip().casefold()
        status = self.status_filter_var.get()
        rows = []
        for row in self.report.rows:
            if status != "all" and row.status != status:
                continue
            haystack = " ".join([
                row.target, row.status, row.resolved_folder, row.file_name,
                row.date_in_filename, row.note,
            ]).casefold()
            if query and query not in haystack:
                continue
            rows.append(row)
        return rows

    def _refresh_rows(self) -> None:
        if not hasattr(self, "tree"):
            return
        self.tree.delete(*self.tree.get_children())
        for index, row in enumerate(self._filtered_rows()):
            age = "" if row.age_days is None else str(row.age_days)
            self.tree.insert(
                "", "end", iid=f"r{index}",
                values=(
                    row.target, STATUS_LABELS.get(row.status, row.status),
                    row.date_in_filename, age, row.resolved_folder,
                    row.file_name, row.note,
                ),
                tags=(row.status,),
            )
        if self.report is not None:
            self.status_var.set(
                f"Showing {len(self.tree.get_children())} / {len(self.report.rows)} rows"
            )

    def _refresh_diffs(self) -> None:
        self.diff_tree.delete(*self.diff_tree.get_children())
        for index, diff in enumerate(self.current_diffs):
            self.diff_tree.insert(
                "", "end", iid=f"d{index}",
                values=(
                    diff.target, DIFF_LABELS.get(diff.state, diff.state),
                    STATUS_LABELS.get(diff.previous_status, diff.previous_status),
                    STATUS_LABELS.get(diff.current_status, diff.current_status),
                    diff.previous_file, diff.current_file,
                ),
                tags=(diff.state,),
            )

    def _refresh_history(self) -> None:
        if not hasattr(self, "history_tree"):
            return
        self.history_tree.delete(*self.history_tree.get_children())
        entries = self.history.list_entries()
        for index, entry in enumerate(entries):
            report = entry.report
            self.history_tree.insert(
                "", "end", iid=f"h{index}",
                values=(
                    entry.timestamp, entry.source, report.total_targets,
                    report.matched_targets, report.stale_targets,
                    report.problem_targets, len(report.duplicate_targets),
                ),
            )

    def view_selected_history(self) -> None:
        selected = self.history_tree.selection()
        if not selected:
            return
        try:
            index = int(selected[0][1:])
            entry = self.history.list_entries()[index]
        except (ValueError, IndexError):
            return
        self.report = entry.report
        self.current_diffs = []
        self.source_var.set(f"History · {entry.source} · {entry.timestamp}")
        self.diff_source_label.configure(text="Historical snapshot")
        self._update_summary()
        self._refresh_rows()
        self._refresh_diffs()
        self._set_export_state(True)
        self.notebook.select(self.dashboard_tab)
        self.status_var.set("Historical snapshot loaded (not added to history)")

    def clear_history(self) -> None:
        if not self.history.list_entries():
            return
        if not messagebox.askyesno(
            "Clear history",
            "Delete all locally stored audit history? This does not delete exported files.",
        ):
            return
        self.history.clear()
        self._refresh_history()
        self.status_var.set("Local audit history cleared")

    def export_tsv(self) -> None:
        if self.report is None:
            return
        path = filedialog.asksaveasfilename(
            title="Export TSV", defaultextension=".tsv",
            filetypes=[("TSV", "*.tsv")], initialfile="audit-result.tsv",
        )
        if path:
            write_tsv(Path(path), self.report)
            self.status_var.set(f"TSV exported: {path}")

    def export_json(self) -> None:
        if self.report is None:
            return
        path = filedialog.asksaveasfilename(
            title="Export JSON", defaultextension=".json",
            filetypes=[("JSON", "*.json")], initialfile="audit-result.json",
        )
        if path:
            write_json(Path(path), self.report)
            self.status_var.set(f"JSON exported: {path}")

    def _set_export_state(self, enabled: bool) -> None:
        if not hasattr(self, "export_tsv_btn"):
            return
        state = ["!disabled"] if enabled else ["disabled"]
        self.export_tsv_btn.state(state)
        self.export_json_btn.state(state)

    def _set_busy(self, busy: bool, status: str) -> None:
        self.busy = busy
        self.status_var.set(status)
        if busy:
            self.progress.start(12)
        else:
            self.progress.stop()

    def _maybe_show_onboarding(self) -> None:
        if not self.settings.onboarding_seen:
            self.show_onboarding()

    def show_onboarding(self) -> None:
        win = tk.Toplevel(self.root)
        win.title("S3 Upload Audit - Getting started")
        win.transient(self.root)
        win.grab_set()
        win.resizable(False, False)
        frame = ttk.Frame(win, padding=20)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="S3 Upload Audit", font=("", 17, "bold")).pack(anchor="w")
        text = (
            "1. Offline DemoでDashboardと状態表示を確認できます。\n"
            "2. 実監査では既存のAWS CLI / S3 Browser read-only profileを使います。\n"
            "3. Access Key / Secret Keyをこのアプリへ入力する欄はありません。\n"
            "4. 監査履歴はこのPCのAPPDATAに最大50回ぶん保存されます。\n\n"
            "まずOffline Demoを試すのがおすすめです。"
        )
        ttk.Label(frame, text=text, justify="left").pack(anchor="w", pady=(12, 16))
        buttons = ttk.Frame(frame)
        buttons.pack(fill="x")
        ttk.Button(
            buttons, text="Help", command=lambda: (win.destroy(), self.show_help())
        ).pack(side="left")
        ttk.Button(
            buttons, text="Start", command=lambda: self._finish_onboarding(win)
        ).pack(side="right")

    def _finish_onboarding(self, win: tk.Toplevel) -> None:
        self.settings.mark_onboarding_seen()
        win.destroy()

    def show_help(self) -> None:
        win = tk.Toplevel(self.root)
        win.title("S3 Upload Audit Help")
        win.geometry("690x570")
        win.minsize(560, 450)
        frame = ttk.Frame(win, padding=16)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="Help / Shortcuts", font=("", 15, "bold")).pack(anchor="w")
        text = (
            "安全境界\n"
            "  認証は既存CLI profileへ委譲し、credentialを設定ファイルへ保存しません。\n"
            "  アプリが生成するS3操作は一覧取得だけです。\n\n"
            "Dashboard\n"
            "  Healthy / Stale / Missing / Empty / Undated / Provider errorを表示します。\n"
            "  Changesでは同じ監査元の前回実行と比較します。\n"
            "  HistoryはAPPDATAへ最大50回保存され、いつでも全削除できます。\n\n"
            "Shortcuts\n"
            "  Ctrl+R        Run Audit\n"
            "  Ctrl+D        Offline Demo\n"
            "  Ctrl+F        Search\n"
            "  Ctrl+E        Export TSV\n"
            "  Ctrl+Shift+E  Export JSON\n"
            "  F1            Help"
        )
        ttk.Label(frame, text=text, justify="left").pack(
            anchor="w", fill="both", expand=True, pady=(12, 0)
        )
        ttk.Button(
            frame, text="Getting started",
            command=lambda: (win.destroy(), self.show_onboarding())
        ).pack(anchor="e", pady=(12, 0))


def main() -> None:
    root = tk.Tk()
    AuditDashboard(root)
    root.mainloop()


if __name__ == "__main__":
    main()
