# Cloudfree 容量不足の調査・重複削除・プリレンダリング版復旧（2026-11-16）

## 事象と結果

- 10GB上限に達したとの所有者報告。プリレンダリング版初回配信で `550 Disk quota exceeded`、独立URLは404だった。
- 2026-11-16、認証済みFTPSで公開データを読み取り専用で棚卸し。現行ドキュメントルート `/cf278796.cloudfree.jp/public_html` に確認できたファイルは **194,160,491 bytes／8,154ファイル**。ただし列挙途中で接続切断が発生したため **完全走査ではない**。廃止済みアカウント直下 `/public_html` は **70,693,071 bytes／1,551ファイル**（削除前、走査完了）。
- 容量内訳のFTP可視ファイル総量はパネル上の「10GB使用済み」報告を説明できない。サーバーパネルの厳密な使用量、FTP不可視領域、quota/inode等の原因は **未確定**。推測を原因と断定しない。
- GitHub `config/deployment-map.json` の `retiredRemotePaths` に `public_html` が含まれること、現行の唯一の公開ディレクトリが `/cf278796.cloudfree.jp/public_html` であることを確認した。
- 廃止済み `/public_html` の重複ファイル **5件／23,576,329 bytes** を削除。実施直前に旧・現行のSHA-256一致を確認、旧ファイルの削除後不存在と現行の存在・サイズをFTPで読み戻した。
- 空き容量ができた状態で `works/komorebi-town-prerender/tools/release_prerender.py` を再実行。GitHub main **29ef22bb1717994e3b4cf03819b3623b1396c8e8** を厳密に固定し、アセット12画像・manifest・HTMLの14ファイル（合計121,891 bytes）を `/komorebi-town-prerender/` へ限定配置。**KOMOREBI_PRERENDER_RELEASE_PASS / FTPS readback / HTTPS exact-byte readback / Worktree cleanup PASS** を確認。公開URL: https://cf278796.cloudfree.jp/komorebi-town-prerender/
- 本番公開が可能になった事実は確認したが、**サーバーパネルで何GB空いているかまでは未確認**。後日パネル表示との突き合わせが必要。

## 削除したファイル（すべて廃止済み `/public_html/` 直下の旧コピーのみ）

| 相対パス | bytes | SHA-256 |
|---|---:|---|
| `PYTHON_MUSIC_LAB/downloads/python-music-lab_v0.6.0.zip` | 15,826,899 | `5f58f4424a242a27ceb8c5e9309c9c3fb02f01c7f46fd06b24157ed4b3181442` |
| `geo/assets/forest/area-a-desktop.png` | 2,813,782 | `ca26f7a1077f31b4f044436c569d8425e364485e80020ee965ea7bae20e65dd3` |
| `geo/assets/forest/area-a-mobile.png` | 2,742,157 | `80f155e4c8da4358258438f02d74b4f9b57fc5ddd42c29a30133d613bdd88b34` |
| `geo/assets/forest/area-b-desktop.png` | 1,104,264 | `1b80d0a2ca0318423e9b9a93f6337328d5f5308c26c98ecc412ca2354add6c4e` |
| `geo/assets/forest/area-b-mobile.png` | 1,089,227 | `bdb1dc8d027288658d1d1470bc036955a0ac33a75b4412e2c27f84b6d9fb128e` |

削除箇所の旧ファイルを戻す必要があれば、**同じ相対パスの現行公開先ファイル**が上記のSHA-256と一致することを確認してから、明示的な承認付きで複製して復旧する。現行ファイルを削除・上書きしていない。

## 手を付けていないもの・残課題

- 現行 `holoscope`（約70.7MB）、`image-lab`（約41.0MB）、現行サイトの配布物・記事・サービス・設定・ログ・秘密情報は **削除していない**。
- `holoscope_old`（約40.2MB）、`CHARACTER_OLD`（約4.6MB）、旧 `public_html.zip`（約4.9MB）および旧 `/public_html` の非重複ファイルは **削除していない**。旧版という名前だけで唯一のバックアップを捨てないため。
- 新たなログ削除や全階層削除、サイト全体の再デプロイは未実施。秘密情報の取り出し・印字なし。
- iPhone実機のプリレンダリング版の滑らかさはユーザー受入待ち。サーバーパネルのディスク使用量の再確認も未実施。

## 証跡

認証済み所有者Windowsでの実施ログ：`DUPLICATE_CLEANUP_PASS` ×5、`DUPLICATE_CLEANUP_TOTAL_PASS`（23,576,329 bytes）、`PRERENDER_MANIFEST_PASS 12 images`、`PRERENDER_DRY_RUN_PASS`、`KOMOREBI_PRERENDER_RELEASE_PASS`（2026-11-16T02:42:07.503064+00:00）。削除レシートは所有者PCの `%LOCALAPPDATA%/PortfolioSite/retired-root-dedup-cleanup-20261116.json` に保存。リリースレシートも `%LOCALAPPDATA%/PortfolioSite/komorebi-prerender-release-receipt.json` に保存。
