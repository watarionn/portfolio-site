# mkPDF Studio v1.0.0

画像入りアーカイブを安全に検査し、ページを確認・編集してPDF化するWindowsデスクトップツールです。

## 特長

- ZIP / CBZ / 7z / RAR / CBR / CB7 を展開前に安全検査
- Explorerからドラッグ&ドロップ
- ページサムネイルと大きなプレビュー
- 複数ページ選択
- ドラッグ並べ替え
- 選択ページの一括上下移動
- 90度単位の左右回転
- ページの含む / 除外
- Undo / Redo
- Built-in PDF Presets
  - Balanced
  - Compact
  - Print A4
- ユーザーPresetの保存 / 削除
- JPEG品質 80 / 88 / 92 / 95 / 100
- 原寸 / A4縦 / A4横
- 初回ガイド / Help / キーボードショートカット
- PDF生成後のheader / EOF / ページ数検証
- 原本アーカイブを常に保持
- 外部サービスへのアップロード不要

## 安全設計

mkPDF Studioは元アーカイブを削除・変更する機能を持ちません。

変換前に以下を検査します。

- `..` を含むパストラバーサル
- 絶対パス / ドライブ指定
- ZIP内symlink
- 7z / RAR系のlink-like entry
- 異常なアーカイブサイズ
- 展開後サイズ
- 圧縮率
- 画像枚数
- 1画像のピクセル数
- 全画像の総ピクセル数

失敗した変換の一時PDFも自動削除します。

## 必要環境

- Windows
- Python 3.11以上
- 7-Zip
- Python packages:
  - Pillow
  - tkinterdnd2

## セットアップ

```powershell
py -3 -m pip install -r requirements.txt
```

## 起動

```powershell
.\run_studio.ps1
```

または、

```powershell
$env:PYTHONPATH = ".\src"
py -3 -m mkpdf_safe.gui
```

## 操作

1. 「アーカイブを開く」またはD&Dで読み込む
2. 左のページ一覧から1ページまたは複数ページを選択
3. 並べ替え・回転・含む/除外を調整
4. Presetまたは品質/ページサイズを選択
5. 「PDFを生成」
6. 完成検証後にPDFを保存

## ショートカット

- `Ctrl+O` アーカイブを開く
- `Ctrl+A` 全ページ選択
- `Ctrl+Z` Undo
- `Ctrl+Y` Redo
- `Alt+↑ / ↓` 選択ページを移動
- `Ctrl+← / →` 90°回転
- `Space` 含む / 除外
- `Ctrl+S` PDF生成
- `F1` Help

## 設定保存先

Presetや初回ガイド表示状態は、

`%APPDATA%\mkPDF Studio\settings.json`

へ保存します。

アーカイブ内容や画像データ、生成PDFは設定ファイルへ保存しません。

## CLI

Safe CoreはCLIからも利用できます。

```powershell
$env:PYTHONPATH = ".\src"
py -3 -m mkpdf_safe.cli inspect ".\book.cbz"
py -3 -m mkpdf_safe.cli convert ".\book.cbz"
```

## QA

```powershell
$env:PYTHONPATH = ".\src"
py -3 -m unittest discover -s tests -v
py -3 tests\qa_gui_final.py
```

v1.0.0の自動テストは17件。詳細は `QA_REPORT.md` を参照してください。

## Privacy

`PRIVACY.md` を参照してください。
