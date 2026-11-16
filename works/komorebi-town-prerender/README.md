# こもれび町 プリレンダリング版

独立URL: `/komorebi-town-prerender/`。既存の3D・2.5D・2D各版を変更しない比較用プレビュー。

## 本当にプリレンダリングしているもの

- `tools/bake_scene.py` が立体座標 `(x,z,height)` の建物（壁、屋根、煙突、窓、入口）、樹木、人物をオフラインで等角投影する。
- `public/assets/` 以下の12点のWebP画像を**ビルド時**に焼き出す。絵の陰影・屋根瓦・窓・花壇・道路・背景はブラウザで3D計算しない。
- `public/index.html` では Canvas 2D `drawImage` で画像を重ねるだけ。建物、木、人物は座標 `x+z` 順で並べ、人物が建物の裏側を通れば隠れる。
- 経路探索は27×27の固定セルに対するBFS。クリック/タップ、WASD/矢印、iPhone方向キー、会話、町案内に対応。
- iPhone向けに Canvas のDPRを1.35に制限し、背景画像は表示領域のみコピー。操作停止時は描画を抑制。Three.js・WebGL・外部ライブラリは**実行時不要**。
- 原画制作は Pillow 11.3.0 で生成（ビルド時のみ。再生成時はWebPエンコーダのバージョン差でバイト列が変わり得る）。`python tools/bake_scene.py` で画像・manifestを再生成できる。ソースファイルと画像のハッシュは `assets/manifest.json` に記録する。

## 試すこと

1. `python tools/bake_scene.py` でアセットの再生成。
2. `python -m http.server --directory public 8000` で静的ホストを起動。`http://localhost:8000` のモバイル幅とPC幅で描画確認。
3. `node --check` のためにHTMLインラインJSを抽出、ブラウザで描画・移動・会話・町案内・画像ロードとリクエスト数を確認。
4. GitHubに統合後、既存WinCred FTPSによる**専用ディレクトリ限定公開**。WebP・HTMLとmanifestのFTPS/HTTPSバイト一致確認。iPhoneの最終FPS/操作感はユーザー受け入れ。

古い試作のトップや各ページは削除・変更しない。本番サイト全体のデプロイやGitHub Actionsは使わない。

## 2026-11-16 配信状況とCloudfreeの容量障害

**制作・正本：GitHub mainへ統合済み。正式Cloudfreeへの配信：BLOCKED（未完了）。**

- 正本PR：#258、Windows UTF-8修正PR：#259。ファイル20点の新規追加とUTF-8明示。
- Windows実機で `PRERENDER_MANIFEST_PASS 12 images`、限定公開 `PRERENDER_DRY_RUN_PASS` を確認。
- FTPSで `MKD /cf278796.cloudfree.jp/public_html/komorebi-town-prerender` を実行したところ `550 Disk quota exceeded`。対象ディレクトリは作成されなかった。公開先 `https://cf278796.cloudfree.jp/komorebi-town-prerender/` は404。画像は一切本番に送っていない。
- 既存ファイルは**削除・移動・上書きしていない**。容量やファイル数の限度について、Cloudfree側の原因究明が必要。既存コンテンツを勝手に整理しない。
- 公開済みGitHub正本を使った暫定外部プレビュー：
  `https://rawcdn.githack.com/watarionn/portfolio-site/4bae3284462d78ba68cd74b29b6d3617a117be05/works/komorebi-town-prerender/public/index.html`
  PowerShellのHTTP検証でHTML 200 text/html、ground.webp 200 image/webp。外部サービスなので稼働保証はなく、ブラウザの初回確認画面が表示される場合がある。
- GitHub Pagesは当該repoでは有効になっていない。既存の公開基盤を無断で切り替えない。
- 新しいディレクトリを作成できる空きが確保されたら、`tools/release_prerender.py --expected-main <その時点のレビュー済みmain> --apply` を認可済みWindowsから実施。公開対象の正本とmainが一致している必要がある。FTPS・HTTPSバイト一致 `KOMOREBI_PRERENDER_RELEASE_PASS` が出るまで、本番公開完了としない。
- iPhone実機での軽さ/操作の受け入れは**未実施**。暫定プレビューで比較できるが、SafariでのFPS測定は未実施。
