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
