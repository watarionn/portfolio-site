# S3 Upload Audit v1.0.0

S3上の対象フォルダを読み取り専用で監査し、最新ファイルの有無・日付・経過日数・前回との差分を確認するWindowsデスクトップツールです。

## 主な機能

- AWS CLI / S3 Browser CLI の既存profileを利用
- credentialをアプリ設定へ保存しない
- クラウド操作は一覧取得のみ
- Healthy / Stale / Undated / Missing folder / No files / Provider error
- `YYYYMMDD`をファイル名から抽出
- 任意の `stale_after_days`
- Dashboard集計
- 検索 / status filter
- Offline Demo
- TSV / JSON export
- 同一監査元の前回との差分表示
- ローカル監査履歴 最大50回
- Built-in / Custom audit presets
- config編集UI
- 初回ガイド / Help / ショートカット

## 安全境界

S3 Upload AuditはAccess Key、Secret Access Key、Session Tokenをconfigへ保存する設計ではありません。

credential系のconfig項目は読み込み時に拒否します。認証は既存のAWS CLI profileまたはS3 Browser Account profileへ委譲します。

providerが内部生成するクラウド操作も一覧取得だけです。

- AWS CLI: `s3api list-objects-v2`
- S3 Browser CLI: `/file list`

`subprocess`は`shell=False`で実行し、timeoutも必須です。

## Dashboard

Dashboardには以下を表示します。

- Targets
- Healthy
- Stale
- Problems
- Changes
- Duplicates

結果表ではTarget、Status、Date、Age、Resolved folder、File、Noteを確認できます。

## Changes

同じ監査元の直前実行とtarget単位で比較します。

- New problem
- Recovered
- Changed
- Unchanged
- New target
- Removed target

Offline Demoと実bucketの履歴はsourceが異なるため、互いに比較しません。

## History

監査履歴はこのPCだけに保存します。

`%APPDATA%\S3 Upload Audit\history.json`

最大50回です。target名、folder名、file名が含まれる可能性があります。DashboardのHistoryタブから全削除できます。

## Presets

Built-in:

- Monthly
- Strict Weekly
- History 3

Presetへ保存するのは以下だけです。

- top_n
- parallel
- timeout_seconds
- stale_after_days
- folder_pattern

bucket、profile、account名、credentialはPresetへ保存しません。

## Offline Demo

実S3へ接続せず、以下の状態を確認できます。

- Healthy
- Stale
- Missing folder
- No files
- Undated
- Provider error
- Duplicate target

固定reference dateを使用するため、実行日によって結果は変わりません。

## セットアップ

必要環境:

- Windows
- Python 3.11+
- 実監査を行う場合はAWS CLIまたはS3 Browser CLI

Python packageには外部依存はありません。

## 起動

Dashboard:

```powershell
.\run_dashboard.ps1
```

CLI:

```powershell
.\run_audit.ps1
```

## Config

`config.example.json`を`config.json`へコピーします。

実環境の`config.json`と`targets.txt`は.gitignore対象です。

## Shortcuts

- `Ctrl+R` Run Audit
- `Ctrl+D` Offline Demo
- `Ctrl+F` Search
- `Ctrl+E` Export TSV
- `Ctrl+Shift+E` Export JSON
- `F1` Help

## QA

```powershell
$env:PYTHONPATH = ".\src"
py -3 -m unittest discover -s tests -v
py -3 tests\qa_gui_final.py
```

v1.0.0は18件の自動テストと実GUI QAを通しています。

## Live integrationについて

2026-09-24時点の開発PCにはAWS CLI / S3 Browser CLIがインストールされていないため、live S3接続QAは未実施です。

providerのコマンド生成、timeout、audit flow、DashboardはfixtureとOffline Demoで検証しています。
