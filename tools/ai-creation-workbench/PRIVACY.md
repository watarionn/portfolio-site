# Privacy / Data Handling

AI Creation Workbench v1.0.0 は、可能な範囲をブラウザ内で処理するローカルファーストの制作支援ツールです。

- Prompt Labの辞書、テンプレート、生成結果はブラウザ内で処理します。
- Pose Studioはブラウザ内で編集・書き出しします。
- Asset Organizerの監査はブラウザ内で行います。File System Access APIを使うコピー機能は、ユーザーが選択したローカルフォルダだけを対象にします。元ファイルは削除しません。
- Notebookのメモとお気に入りはlocalStorageへ保存します。
- Model Inspectorは `API only` または `Auto` でAPI取得が必要な場合にCivitai APIへ通信します。
- Model Inspectorに入力したAPI keyはlocalStorageへ保存しません。
- Offline JSONモードでは、読み込んだJSONをブラウザ内で参照します。
- ブラウザのサイトデータを削除するとNotebookの保存内容も失われます。必要に応じてWorkspace JSONを保存してください。
