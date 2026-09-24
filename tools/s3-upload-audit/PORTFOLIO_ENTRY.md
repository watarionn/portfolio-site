# Portfolio Entry

## Title

S3 Upload Audit

## Building name

クラウド監査室

## Type

Python / Desktop / S3

## Summary

対象名リストとS3上のフォルダ・ファイルを読み取り専用で照合し、最新アップロード、経過日数、欠損、前回との差分をDashboardで確認するローカルファーストの運用監査ツール。

## Key points

- credentialをアプリへ持たせない
- AWS CLI / S3 Browser CLIの既存profileを利用
- list操作のみ
- stale / missing / empty / errorを明示
- Offline Demo
- 検索・filter
- TSV / JSON export
- ローカル履歴
- 前回との差分
- audit preset

## Portfolio positioning

元の月次運用用S3チェックscriptを、実運用データと環境固有値を分離し、credentialを保持しないSafe Coreから再設計した作品。単発TSV出力だけでなく、状態の可視化・履歴・差分確認までを1つのDashboardへまとめている。
