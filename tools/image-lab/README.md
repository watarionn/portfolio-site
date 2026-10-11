# Image Lab 0.1.0 (独立した画像実験PWA)

Minimalizer / MinimalizerPublic、既存の画像仕立て室 \`tools/image-studio\` とは**別プロジェクト**。

目的: 画像をブラウザの外へ送らず、異なるJS/WASMライブラリの画像処理結果を比較・保存する。比較画像は毎回**元画像から**作り直し、破壊的処理や生成AIの描き足しは行わない。

## 今回の実機対応モード
- d3-voronoi: 元画像色のボロノイ領域分割
- Delaunator: 元画像色の低ポリゴン化
- Earcut: 穴あきタイルメッシュの元画像色パターン
- Pts.js: 元画像の色に応じた点・線ネットワーク
- Rough.js: 元画像の色に応じた手描きスケッチ
- Paper.js: ベクタータイル表現
- glfx.js: WebGL GPUフィルター。GPUが使えない環境では明示エラーとなる

使用する各パッケージはpackage-lockで固定し、esbuildでローカルにバンドル。CDNに依存しない。ビルド成果物 \`assets/main.js\` をコミットする。第三者コードのライセンス確認は別途実施する（\`THIRD_PARTY.md\`）。

## 次の研究モード（未実装）
Trianglify（GPL-3.0 のため配布条件を確認中）, p5.js, PIXI.js, SVGPathCommander, SVGO, VTracer-WASM, Clipper2-WASM。初期版ではメニューには出さず、未実装のものを「完成」と表記しない。

## QA
- PNG/WebP/JPEG等の画像を読み込み → プレビュー → PNG出力（最大1200px）
- SVG保存は描画上有効なベクター出力を作れたモードのみ可能
- 同一シード・同一元画像で再現可能
- 全処理はローカル、サーバへの画像アップロードなし
- PWAはservice workerでアプリファイルをキャッシュ

開発: \`npm ci\` → \`npm run build\`。検証: \`npm run check\`。
