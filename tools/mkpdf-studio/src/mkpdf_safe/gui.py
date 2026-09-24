from __future__ import annotations

import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, simpledialog, ttk

from PIL import ImageTk

from .core import ArchiveError
from .settings import BUILTIN_PRESETS, PdfPreset, SettingsStore
from .studio import StudioSession

try:
    from tkinterdnd2 import DND_FILES, TkinterDnD
except Exception:
    DND_FILES = None
    TkinterDnD = None


APP_VERSION = "1.0.0"
ASSET_DIR = Path(__file__).resolve().parent / "assets"

ARCHIVE_TYPES = [
    ("Supported archives", "*.zip *.cbz *.7z *.rar *.cbr *.cb7"),
    ("ZIP / CBZ", "*.zip *.cbz"),
    ("7-Zip / RAR", "*.7z *.rar *.cbr *.cb7"),
    ("All files", "*.*"),
]


class StudioApp:
    def __init__(self, root: tk.Tk, settings: SettingsStore | None = None) -> None:
        self.root = root
        self.settings = settings or SettingsStore()
        self.session: StudioSession | None = None
        self.thumb_refs: list[ImageTk.PhotoImage] = []
        self.preview_ref: ImageTk.PhotoImage | None = None
        self.drag_index: int | None = None
        self.drag_snapshot: tuple[tuple[str, int, bool], ...] | None = None
        self.busy = False
        self.undo_stack: list[tuple[tuple[str, int, bool], ...]] = []
        self.redo_stack: list[tuple[tuple[str, int, bool], ...]] = []

        root.title(f"mkPDF Studio v{APP_VERSION}")
        root.geometry("1180x760")
        root.minsize(900, 620)
        root.protocol("WM_DELETE_WINDOW", self.close)
        self._apply_icon()

        self.status_var = tk.StringVar(value="アーカイブを選択してください")
        self.archive_var = tk.StringVar(value="未選択")
        self.summary_var = tk.StringVar(value="0 pages")
        self.quality_var = tk.StringVar(value="92")
        self.page_size_var = tk.StringVar(value="original")
        self.preset_var = tk.StringVar(value=self.settings.last_preset)

        self._load_preset_values(self.settings.last_preset, persist=False)
        self._build_ui()
        self._setup_drop()
        self._bind_shortcuts()
        self.root.after(180, self._maybe_show_onboarding)

    def _apply_icon(self) -> None:
        icon = ASSET_DIR / "app-icon.png"
        if not icon.exists():
            return
        try:
            self._icon_ref = tk.PhotoImage(file=str(icon))
            self.root.iconphoto(True, self._icon_ref)
        except tk.TclError:
            self._icon_ref = None

    def _build_ui(self) -> None:
        outer = ttk.Frame(self.root, padding=12)
        outer.pack(fill="both", expand=True)

        header = ttk.Frame(outer)
        header.pack(fill="x")
        ttk.Label(header, text="mkPDF Studio", font=("", 18, "bold")).pack(side="left")
        ttk.Label(header, text=f"v{APP_VERSION}").pack(side="left", padx=(8, 0))
        ttk.Button(header, text="Help", command=self.show_help).pack(side="right")
        ttk.Button(header, text="アーカイブを開く", command=self.choose_archive).pack(
            side="right", padx=(0, 6)
        )

        ttk.Label(outer, textvariable=self.archive_var).pack(fill="x", pady=(8, 2))
        ttk.Label(
            outer,
            text="安全検査 → ページ編集 → PDF生成 → 完成検証。原本アーカイブは変更しません。",
        ).pack(fill="x", pady=(0, 8))

        self.drop_zone = ttk.Label(
            outer,
            text="ここへアーカイブをドロップ、または「アーカイブを開く」",
            anchor="center",
            padding=10,
            relief="groove",
        )
        self.drop_zone.pack(fill="x", pady=(0, 10))

        pane = ttk.Panedwindow(outer, orient="horizontal")
        pane.pack(fill="both", expand=True)

        left = ttk.Frame(pane, padding=(0, 0, 8, 0))
        right = ttk.Frame(pane, padding=(8, 0, 0, 0))
        pane.add(left, weight=2)
        pane.add(right, weight=3)

        self.tree = ttk.Treeview(
            left,
            columns=("use", "rotation", "path"),
            show="tree headings",
            selectmode="extended",
            height=20,
        )
        self.tree.heading("#0", text="Page")
        self.tree.heading("use", text="Use")
        self.tree.heading("rotation", text="Rotate")
        self.tree.heading("path", text="Path")
        self.tree.column("#0", width=95, stretch=False)
        self.tree.column("use", width=55, anchor="center", stretch=False)
        self.tree.column("rotation", width=65, anchor="center", stretch=False)
        self.tree.column("path", width=300)
        yscroll = ttk.Scrollbar(left, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=yscroll.set)
        self.tree.pack(side="left", fill="both", expand=True)
        yscroll.pack(side="right", fill="y")

        self.tree.bind("<<TreeviewSelect>>", self._on_select)
        self.tree.bind("<ButtonPress-1>", self._on_drag_start, add=True)
        self.tree.bind("<B1-Motion>", self._on_drag_motion, add=True)
        self.tree.bind("<ButtonRelease-1>", self._on_drag_end, add=True)
        self.tree.bind("<Double-1>", lambda _e: self.toggle_include())

        preview_box = ttk.Frame(right)
        preview_box.pack(fill="both", expand=True)
        self.preview = ttk.Label(preview_box, text="Preview", anchor="center")
        self.preview.pack(fill="both", expand=True)

        edit = ttk.Frame(right)
        edit.pack(fill="x", pady=(8, 0))
        ttk.Button(edit, text="↑", width=4, command=lambda: self.move_selected(-1)).pack(
            side="left"
        )
        ttk.Button(edit, text="↓", width=4, command=lambda: self.move_selected(1)).pack(
            side="left", padx=(4, 10)
        )
        ttk.Button(edit, text="↶ 90°", command=lambda: self.rotate_selected(-90)).pack(
            side="left"
        )
        ttk.Button(edit, text="↷ 90°", command=lambda: self.rotate_selected(90)).pack(
            side="left", padx=4
        )
        ttk.Button(edit, text="含む / 除外", command=self.toggle_include).pack(
            side="left", padx=(6, 0)
        )
        self.undo_btn = ttk.Button(edit, text="Undo", command=self.undo)
        self.undo_btn.pack(side="right")
        self.redo_btn = ttk.Button(edit, text="Redo", command=self.redo)
        self.redo_btn.pack(side="right", padx=(0, 4))

        options = ttk.LabelFrame(right, text="PDF設定", padding=10)
        options.pack(fill="x", pady=(10, 0))

        ttk.Label(options, text="Preset").grid(row=0, column=0, sticky="w")
        self.preset_combo = ttk.Combobox(
            options,
            textvariable=self.preset_var,
            values=(),
            state="readonly",
            width=16,
        )
        self.preset_combo.grid(row=0, column=1, sticky="w", padx=(8, 10))
        self.preset_combo.bind("<<ComboboxSelected>>", self._on_preset_selected)
        ttk.Button(options, text="保存", command=self.save_preset).grid(
            row=0, column=2, sticky="w"
        )
        ttk.Button(options, text="削除", command=self.delete_preset).grid(
            row=0, column=3, sticky="w", padx=(4, 18)
        )

        ttk.Label(options, text="JPEG品質").grid(row=1, column=0, sticky="w", pady=(8, 0))
        quality = ttk.Combobox(
            options,
            textvariable=self.quality_var,
            values=("80", "88", "92", "95", "100"),
            state="readonly",
            width=8,
        )
        quality.grid(row=1, column=1, sticky="w", padx=(8, 10), pady=(8, 0))

        ttk.Label(options, text="ページサイズ").grid(
            row=1, column=2, sticky="w", pady=(8, 0)
        )
        page_size = ttk.Combobox(
            options,
            textvariable=self.page_size_var,
            values=("original", "a4-portrait", "a4-landscape"),
            state="readonly",
            width=16,
        )
        page_size.grid(row=1, column=3, sticky="w", padx=(8, 0), pady=(8, 0))

        actions = ttk.Frame(right)
        actions.pack(fill="x", pady=(12, 0))
        ttk.Label(actions, textvariable=self.summary_var).pack(side="left")
        self.generate_btn = ttk.Button(actions, text="PDFを生成", command=self.generate_pdf)
        self.generate_btn.pack(side="right")

        footer = ttk.Frame(outer)
        footer.pack(fill="x", pady=(10, 0))
        self.progress = ttk.Progressbar(footer, mode="indeterminate", length=140)
        self.progress.pack(side="left")
        ttk.Label(footer, textvariable=self.status_var).pack(side="left", padx=(10, 0))

        self._refresh_presets()
        self._update_history_buttons()

    def _setup_drop(self) -> None:
        if DND_FILES is None or not hasattr(self.drop_zone, "drop_target_register"):
            self.drop_zone.configure(text="ドラッグ&ドロップ拡張なし。ボタンから選択できます。")
            return
        self.drop_zone.drop_target_register(DND_FILES)
        self.drop_zone.dnd_bind("<<Drop>>", self._on_drop)
        self.root.drop_target_register(DND_FILES)
        self.root.dnd_bind("<<Drop>>", self._on_drop)

    def _bind_shortcuts(self) -> None:
        self.root.bind_all("<Control-o>", lambda _e: self.choose_archive())
        self.root.bind_all("<Control-z>", lambda _e: self.undo())
        self.root.bind_all("<Control-y>", lambda _e: self.redo())
        self.root.bind_all("<Control-Shift-Z>", lambda _e: self.redo())
        self.root.bind_all("<Control-a>", self._select_all)
        self.root.bind_all("<Alt-Up>", lambda _e: self.move_selected(-1))
        self.root.bind_all("<Alt-Down>", lambda _e: self.move_selected(1))
        self.root.bind_all("<Control-Left>", lambda _e: self.rotate_selected(-90))
        self.root.bind_all("<Control-Right>", lambda _e: self.rotate_selected(90))
        self.root.bind_all("<Control-s>", lambda _e: self.generate_pdf())
        self.root.bind_all("<F1>", lambda _e: self.show_help())
        self.tree.bind("<space>", lambda _e: (self.toggle_include(), "break")[1])

    def _on_drop(self, event: object) -> str:
        if self.busy:
            return "break"
        data = getattr(event, "data", "")
        try:
            paths = list(self.root.tk.splitlist(data))
        except tk.TclError:
            paths = [data]
        if paths:
            self.open_archive(Path(paths[0]))
        return "break"

    def choose_archive(self) -> None:
        if self.busy:
            return
        selected = filedialog.askopenfilename(title="アーカイブを選択", filetypes=ARCHIVE_TYPES)
        if selected:
            self.open_archive(Path(selected))

    def open_archive(self, path: Path) -> None:
        if self.busy:
            return
        self._set_busy(True, "アーカイブを安全検査・展開しています…")
        threading.Thread(target=self._load_worker, args=(path,), daemon=True).start()

    def _load_worker(self, path: Path) -> None:
        try:
            session = StudioSession(path)
        except Exception as exc:
            self.root.after(0, self._load_failed, exc)
            return
        self.root.after(0, self._load_done, session)

    def _load_failed(self, exc: Exception) -> None:
        self._set_busy(False, "読み込みに失敗しました")
        messagebox.showerror("mkPDF Studio", str(exc))

    def _load_done(self, session: StudioSession) -> None:
        if self.session is not None:
            self.session.close()
        self.session = session
        self.undo_stack.clear()
        self.redo_stack.clear()
        self.archive_var.set(str(session.archive))
        self._refresh_tree(select_indices=[0], focus_index=0)
        self._set_busy(False, f"{len(session.pages)}ページを読み込みました")
        self._update_history_buttons()

    def _selected_indices(self) -> list[int]:
        indices: list[int] = []
        for iid in self.tree.selection():
            if iid.startswith("p"):
                try:
                    indices.append(int(iid[1:]))
                except ValueError:
                    pass
        return sorted(set(indices))

    def _focused_index(self) -> int | None:
        iid = self.tree.focus()
        if iid.startswith("p"):
            try:
                return int(iid[1:])
            except ValueError:
                return None
        selected = self._selected_indices()
        return selected[0] if selected else None

    def _refresh_tree(
        self,
        select_indices: list[int] | None = None,
        focus_index: int | None = None,
    ) -> None:
        self.tree.delete(*self.tree.get_children())
        self.thumb_refs.clear()
        if self.session is None:
            self.summary_var.set("0 pages")
            self.preview.configure(image="", text="Preview")
            return
        for idx, page in enumerate(self.session.pages):
            thumb = ImageTk.PhotoImage(self.session.thumbnail(page, (70, 90)))
            self.thumb_refs.append(thumb)
            self.tree.insert(
                "",
                "end",
                iid=f"p{idx}",
                text=f"{idx + 1}",
                image=thumb,
                values=("✓" if page.included else "×", f"{page.rotation}°", page.relative_path),
            )
        valid = [
            i for i in (select_indices or []) if 0 <= i < len(self.session.pages)
        ]
        if valid:
            iids = [f"p{i}" for i in valid]
            self.tree.selection_set(iids)
            focus = focus_index if focus_index in valid else valid[0]
            self.tree.focus(f"p{focus}")
            self.tree.see(f"p{focus}")
            self._show_preview(focus)
        self._update_summary()

    def _update_summary(self) -> None:
        if self.session is None:
            self.summary_var.set("0 pages")
            return
        included = len(self.session.included_pages)
        selected = len(self._selected_indices())
        suffix = f" / {selected} selected" if selected else ""
        self.summary_var.set(f"{included} / {len(self.session.pages)} pages{suffix}")

    def _on_select(self, _event: object = None) -> None:
        idx = self._focused_index()
        if idx is not None:
            self._show_preview(idx)
        self._update_summary()

    def _show_preview(self, index: int) -> None:
        if self.session is None or not (0 <= index < len(self.session.pages)):
            return
        page = self.session.pages[index]
        image = self.session.thumbnail(page, (560, 520))
        self.preview_ref = ImageTk.PhotoImage(image)
        state = "使用" if page.included else "除外"
        selected = len(self._selected_indices())
        selected_text = f" / {selected} pages selected" if selected > 1 else ""
        self.preview.configure(
            image=self.preview_ref,
            text=f"{index + 1}. {page.relative_path}\n{state} / {page.rotation}°{selected_text}",
            compound="top",
        )

    def _checkpoint(self) -> None:
        if self.session is None:
            return
        snapshot = self.session.snapshot()
        if self.undo_stack and self.undo_stack[-1] == snapshot:
            return
        self.undo_stack.append(snapshot)
        if len(self.undo_stack) > 100:
            self.undo_stack.pop(0)
        self.redo_stack.clear()
        self._update_history_buttons()

    def undo(self) -> None:
        if self.session is None or self.busy or not self.undo_stack:
            return
        current = self.session.snapshot()
        previous = self.undo_stack.pop()
        self.redo_stack.append(current)
        self.session.restore(previous)
        self._refresh_tree(select_indices=[0], focus_index=0)
        self.status_var.set("Undo")
        self._update_history_buttons()

    def redo(self) -> None:
        if self.session is None or self.busy or not self.redo_stack:
            return
        current = self.session.snapshot()
        next_state = self.redo_stack.pop()
        self.undo_stack.append(current)
        self.session.restore(next_state)
        self._refresh_tree(select_indices=[0], focus_index=0)
        self.status_var.set("Redo")
        self._update_history_buttons()

    def _update_history_buttons(self) -> None:
        if not hasattr(self, "undo_btn"):
            return
        self.undo_btn.state(["!disabled"] if self.undo_stack and not self.busy else ["disabled"])
        self.redo_btn.state(["!disabled"] if self.redo_stack and not self.busy else ["disabled"])

    def move_selected(self, delta: int) -> None:
        if self.session is None or self.busy:
            return
        indices = self._selected_indices()
        if not indices:
            return
        self._checkpoint()
        moved = self.session.move_indices(indices, delta)
        self._refresh_tree(select_indices=moved, focus_index=moved[0] if moved else None)

    def rotate_selected(self, degrees: int) -> None:
        if self.session is None or self.busy:
            return
        indices = self._selected_indices()
        if not indices:
            return
        self._checkpoint()
        for idx in indices:
            self.session.pages[idx].rotate(degrees)
        self._refresh_tree(select_indices=indices, focus_index=indices[0])

    def toggle_include(self) -> None:
        if self.session is None or self.busy:
            return
        indices = self._selected_indices()
        if not indices:
            return
        self._checkpoint()
        target = not all(self.session.pages[i].included for i in indices)
        for idx in indices:
            self.session.pages[idx].included = target
        self._refresh_tree(select_indices=indices, focus_index=indices[0])

    def _select_all(self, _event: object = None) -> str:
        if self.session is None:
            return "break"
        indices = list(range(len(self.session.pages)))
        self._refresh_tree(select_indices=indices, focus_index=indices[0] if indices else None)
        return "break"

    def _on_drag_start(self, event: tk.Event) -> None:
        row = self.tree.identify_row(event.y)
        self.drag_index = int(row[1:]) if row.startswith("p") else None
        self.drag_snapshot = self.session.snapshot() if self.session is not None else None

    def _on_drag_motion(self, event: tk.Event) -> None:
        if self.session is None or self.drag_index is None or self.busy:
            return
        row = self.tree.identify_row(event.y)
        if not row.startswith("p"):
            return
        target = int(row[1:])
        if target == self.drag_index:
            return
        self.session.move(self.drag_index, target)
        self.drag_index = target
        self._refresh_tree(select_indices=[target], focus_index=target)

    def _on_drag_end(self, _event: object) -> None:
        if (
            self.session is not None
            and self.drag_snapshot is not None
            and self.session.snapshot() != self.drag_snapshot
        ):
            self.undo_stack.append(self.drag_snapshot)
            if len(self.undo_stack) > 100:
                self.undo_stack.pop(0)
            self.redo_stack.clear()
            self._update_history_buttons()
        self.drag_index = None
        self.drag_snapshot = None

    def _refresh_presets(self) -> None:
        names = list(self.settings.presets())
        self.preset_combo.configure(values=names)
        if self.preset_var.get() not in names:
            self.preset_var.set("Balanced")

    def _load_preset_values(self, name: str, persist: bool = True) -> None:
        presets = self.settings.presets()
        preset = presets.get(name, BUILTIN_PRESETS["Balanced"])
        self.quality_var.set(str(preset.quality))
        self.page_size_var.set(preset.page_size)
        self.preset_var.set(name if name in presets else "Balanced")
        if persist:
            self.settings.set_last_preset(self.preset_var.get())

    def _on_preset_selected(self, _event: object = None) -> None:
        self._load_preset_values(self.preset_var.get(), persist=True)
        self.status_var.set(f"Preset: {self.preset_var.get()}")

    def save_preset(self) -> None:
        name = simpledialog.askstring("Preset保存", "プリセット名:", parent=self.root)
        if name is None:
            return
        try:
            self.settings.save_preset(
                name,
                PdfPreset(int(self.quality_var.get()), self.page_size_var.get()),
            )
        except (ValueError, OSError) as exc:
            messagebox.showerror("Preset保存", str(exc))
            return
        self._refresh_presets()
        self.preset_var.set(" ".join(name.strip().split()))
        self.status_var.set("Presetを保存しました")

    def delete_preset(self) -> None:
        name = self.preset_var.get()
        if name in BUILTIN_PRESETS:
            messagebox.showinfo("Preset削除", "Built-in presetは削除できません。")
            return
        try:
            self.settings.delete_preset(name)
        except (ValueError, OSError) as exc:
            messagebox.showerror("Preset削除", str(exc))
            return
        self._refresh_presets()
        self._load_preset_values("Balanced", persist=True)
        self.status_var.set("Presetを削除しました")

    def generate_pdf(self) -> None:
        if self.session is None or self.busy:
            return
        if not self.session.included_pages:
            messagebox.showwarning("mkPDF Studio", "PDFに含めるページがありません。")
            return
        default = self.session.archive.with_suffix(".pdf")
        selected = filedialog.asksaveasfilename(
            title="PDFの保存先",
            defaultextension=".pdf",
            initialdir=str(default.parent),
            initialfile=default.name,
            filetypes=[("PDF", "*.pdf")],
        )
        if not selected:
            return
        output = Path(selected)
        overwrite = False
        if output.exists():
            overwrite = messagebox.askyesno(
                "上書き確認",
                f"{output.name} は既に存在します。上書きしますか？",
            )
            if not overwrite:
                return
        self._set_busy(True, "PDFを生成・検証しています…")
        threading.Thread(
            target=self._build_worker,
            args=(output, int(self.quality_var.get()), self.page_size_var.get(), overwrite),
            daemon=True,
        ).start()

    def _build_worker(
        self, output: Path, quality: int, page_size: str, overwrite: bool
    ) -> None:
        assert self.session is not None
        try:
            result = self.session.build(
                output,
                quality=quality,
                page_size=page_size,
                overwrite=overwrite,
            )
        except Exception as exc:
            self.root.after(0, self._build_failed, exc)
            return
        self.root.after(
            0, self._build_done, result.output, result.pages, result.output_bytes
        )

    def _build_failed(self, exc: Exception) -> None:
        self._set_busy(False, "PDF生成に失敗しました")
        messagebox.showerror("mkPDF Studio", str(exc))

    def _build_done(self, output: Path, pages: int, size: int) -> None:
        self._set_busy(False, f"{pages}ページのPDFを生成しました")
        messagebox.showinfo(
            "mkPDF Studio",
            f"PDFを生成・検証しました。\n\n{output}\n{pages} pages / {size:,} bytes\n\n原本アーカイブは変更していません。",
        )

    def _set_busy(self, busy: bool, status: str) -> None:
        self.busy = busy
        self.status_var.set(status)
        if busy:
            self.progress.start(12)
            self.generate_btn.state(["disabled"])
        else:
            self.progress.stop()
            self.generate_btn.state(["!disabled"])
        self._update_history_buttons()

    def _maybe_show_onboarding(self) -> None:
        if not self.settings.onboarding_seen:
            self.show_onboarding()

    def show_onboarding(self) -> None:
        win = tk.Toplevel(self.root)
        win.title("mkPDF Studio - はじめに")
        win.transient(self.root)
        win.grab_set()
        win.resizable(False, False)
        frame = ttk.Frame(win, padding=20)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="mkPDF Studioへようこそ", font=("", 16, "bold")).pack(
            anchor="w"
        )
        text = (
            "1. ZIP / CBZ / 7z / RAR / CBR / CB7を開く\n"
            "2. ページを複数選択して、並べ替え・回転・除外を調整\n"
            "3. Presetまたは品質/ページサイズを選んでPDF生成\n\n"
            "変換前に危険な展開パスやリンク、異常サイズを検査します。\n"
            "原本アーカイブを削除・変更する機能はありません。"
        )
        ttk.Label(frame, text=text, justify="left").pack(anchor="w", pady=(12, 16))
        buttons = ttk.Frame(frame)
        buttons.pack(fill="x")
        ttk.Button(
            buttons,
            text="Helpを見る",
            command=lambda: (win.destroy(), self.show_help()),
        ).pack(side="left")
        ttk.Button(
            buttons,
            text="始める",
            command=lambda: self._finish_onboarding(win),
        ).pack(side="right")

    def _finish_onboarding(self, win: tk.Toplevel) -> None:
        self.settings.mark_onboarding_seen()
        win.destroy()

    def show_help(self) -> None:
        win = tk.Toplevel(self.root)
        win.title("mkPDF Studio Help")
        win.geometry("640x520")
        win.minsize(520, 420)
        frame = ttk.Frame(win, padding=16)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="Help / Shortcuts", font=("", 15, "bold")).pack(anchor="w")
        help_text = (
            "基本操作\n"
            "  アーカイブを開くか、画面へドラッグ&ドロップします。\n"
            "  Ctrl/Shiftで複数ページを選択できます。\n"
            "  回転・除外・上下移動は選択中のページすべてに適用されます。\n\n"
            "ショートカット\n"
            "  Ctrl+O        アーカイブを開く\n"
            "  Ctrl+A        全ページ選択\n"
            "  Ctrl+Z        Undo\n"
            "  Ctrl+Y        Redo\n"
            "  Alt+↑ / ↓     選択ページを移動\n"
            "  Ctrl+← / →    90°回転\n"
            "  Space         含む / 除外\n"
            "  Ctrl+S        PDF生成\n"
            "  F1            Help\n\n"
            "安全性\n"
            "  展開前検査、サイズ上限、画像上限、PDF完成検証を行います。\n"
            "  原本アーカイブは常に保持します。"
        )
        ttk.Label(frame, text=help_text, justify="left").pack(
            anchor="w", fill="both", expand=True, pady=(12, 0)
        )
        ttk.Button(
            frame,
            text="初回ガイドを開く",
            command=lambda: (win.destroy(), self.show_onboarding()),
        ).pack(anchor="e", pady=(12, 0))

    def close(self) -> None:
        if self.session is not None:
            self.session.close()
        self.root.destroy()


def create_root() -> tk.Tk:
    if TkinterDnD is not None:
        return TkinterDnD.Tk()
    return tk.Tk()


def main() -> None:
    root = create_root()
    StudioApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
