# Cloudfree 容量不足の調査・重複削除・プリレンダリング版復旧（2026-11-16）

## 追補：2026-11-16 FTP全ルート再走査で、前回の容量評価を訂正

**重要：旧調査の「現行ドキュメントルート約194MB」は未走査が大量にある過少計上だった。全容量として引用しないこと。**

- 認証済みFTPルート `/` を深さ優先ではなくキューで再帰列挙し、ProFTPD接続切断に対して再接続（計34回）しながら取得。
- 2026-11-16T03:23:06.729809Z時点：**走査済み7,386ディレクトリ、300,276ファイル、計6,215,639,736 bytes（6.216GB、下限）**。まだ**2,920ディレクトリ未走査**で、`inventory_limit_exceeded`（安全上の30万ファイル上限）を記録。集計は完全ではない。
- 読み取れた範囲の現行Webルート `/cf278796.cloudfree.jp/public_html`：**6,183,054,896 bytes / 298,922ファイル以上**。
- 同ルートの `holoscope`：**6,025,556,362 bytes / 292,105ファイル以上**。走査済みバイト数の約97%を占める。とりわけ旧スキャン時の `holoscope/releases/...` 以下に接続断による未走査が存在した。リリース履歴の大量の蓄積が主因候補。ただし未走査の内訳と実際の現行・旧スナップショットの保持契約を確認するまでは削除しない。
- `holoscope_old`：走査済み45,656,074 bytes / 6,078ファイル以上。前回40MBという数字も過少計上。
- サーバーパネルは公式ログイン `https://secure.wpx.ne.jp/wpxapanel/login/cloudfree/server/` にCloudflare Turnstile認証が必要。チャットからログイン済み画面にアクセスできなかったため、**パネルの削除後の最新使用GB・ファイル数は未確認**。所有者が以前「10GB上限に達した」と確認した報告と、このFTP下限の差額を最終差額として扱わない。
- FTP `SITE QUOTA` が返すのは転送量/転送ファイル数の「unlimited」で、**ディスク使用量ではない**。既存のSSHホスト鍵は存在したが認証鍵が許可されず、SSHで `du`/`quota` は取得できなかった。認証設定の変更やチャレンジ回避はしない。
- 詳細な集計の現物レシートは所有者Windowsの `%LOCALAPPDATA%/PortfolioSite/cloudfree-full-ftp-audit-20261116.json`（各上位ディレクトリ別サイズ、走査エラー・残数）。
- 今回は**read-only**。元の重複5件削除後、追加の削除・移動・変更・公開操作は行っていない。

### 原因・影響・再発防止

- **原因：**前回のFTP列挙で `WinError 10054` 接続切断後の未走査領域を十分に補完できず、194MBを重要な容量比較の代表値として扱った。
- **影響：**容量不足の原因を旧 `holoscope_old` や小さな旧ZIP等へ過度に寄せ、本番 `holoscope` 内の大量のスナップショット蓄積を見落としていた。旧コピー5ファイルの削除自体はSHA-256一致＋現行残存で安全を確認済み。
- **修正：**再接続ありの全ルート監査で6.22GB以上、HoloScopeで6.03GB以上を確認。前回の見立てを訂正。
- **再発防止：**ディスク容量の全体値を名乗る条件は **未走査キュー0、エラー0、ファイル数・ディレクトリ数上限未達** の全て。いずれか未達なら **下限** と明記。次回完全監査ではチェックポイント付き再開式のスキャナ（ディレクトリキューと集計を永続化）か、既存認証済みSSHによる read-only `du` を採用し、コストの大きい再走査を避ける。サーバーパネルの現在GB・ファイル数との照合が残課題。


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
