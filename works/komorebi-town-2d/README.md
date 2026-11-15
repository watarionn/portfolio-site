# こもれび町 2D 比較試作

元の3D `komorebi-town/`、斜め見下ろし2.5D `komorebi-town-25d/` に並ぶ、真上見下ろしの独立した軽量版。トップページや旧作品の公開内容は変更しない。

## 制作意図

ユーザーからiPhoneで2.5Dの描画が重いとの報告があったため、**視点だけでなく描画アーキテクチャも変更**した独立比較版を作成。4軒（図書館、工房、展示館、あそび場）、住民モモ・ソラと町の探索を踏襲する。

## 技術

- Canvas 2Dのみ。外部ネットワーク依存、フォント追加、重いゲームエンジン無し。
- マップ地面・建物・木などを起動時に**480×384pxの単一Canvas画像**に生成し、プレイ中は`drawImage`一回で背景表示。キャラクターと噴水だけ個別描画。
- スマホでは表示ピクセル数をCSSピクセルの約1/2に抑え、Retina端末の3倍DPRでも処理を増やさない。スマホ・タブレットは固定画面でスクロール無し。
- 歩行中は約30fps、静止中は約8fps。タブを隠すと描画停止、reduced-motion対応。
- テキストは日本語。スクリーン固定カメラ、十字ボタン/WASD/矢印/タップ移動（BFS）、近くの建物・住民の調査。
- `window.__komorebi2dDiagnostics()` はQA用の読み取り専用情報（現在位置、描画数、描画負荷）。本番で個人情報や通信を取得しない。
- 公開ページは比較用なので`noindex,nofollow`。

## 手元でのテスト

`python works/komorebi-town-2d/tests/browser_smoke.py` （Python PlaywrightとChromiumのある検証環境）。iPhone幅393x852、狭小幅320x568、デスクトップ、横長の四条件で、画面溢れ、JSエラー、方向キー、タップ移動、案内操作を確認する。テスト環境がブラウザのfile: URLを許可しない場合は、`page.set_content`でソースを読み込む。

iPhone実機の体感速度は**公開後の受入項目**。Chromiumの模擬モバイル実測値をiPhoneのFPSと見なさない。

## 本番公開手順

`config/deployment-map.json` の`komorebi-town-2d-preview`を正本とし、main反映済みGit blobのバイト列を対象に `python scripts/release_komorebi_town_2d.py --expected-main <main SHA> --apply` で**新しい1ページだけ**FTPS公開する。WinCred `portfolio-cloudfree-ftps` を利用。別内容が本番に存在すれば上書き拒否し、FTPS/HTTPS SHA256読み戻しまで成功して初めて完了とする。GitHub Actionsは使わない。