# Image Lab v0.2.0 / 画像実験PWA

Minimalizer/MinimalizerPublic、既存 Image Studio とは独立。

## 画像処理
既存7モード: d3-voronoi, Delaunator, Earcut, Pts.js, Rough.js, Paper.js, glfx.js。
新規6モード: p5.js（ドローイング）、PIXI.js（GPUカラー合成）、SVGPathCommander（パス最適化）、
SVGO（SVG最適化）、VTracer WASM（画像をSVG化）、Clipper2-WASM（ポリゴン交差）。

元画像は常に保持。通常は元画像から新規処理する。明示的に「結果を重ねる」を押すと
次のモードは現在の加工結果を入力にして処理する。最大5段階のスナップショットが戻せる。
「元画像に戻す」ですべて破棄。履歴は端末メモリのみで、ページ更新すると消える。

PNG出力。SVGはベクター対応モードのみ。出力表示は長辺最大1,200px。
VTracerは長辺160px以下の縮小画像をトレースするため、SVGは完全な原画再現ではない。

## 配布とセキュリティ
全処理は端末ブラウザ内、画像のアップロードなし。CDNなし。
npm package-lock固定、esbuildコード分割で遅延ロード。p5は変更なしの配布物を独立読込。
p5 LGPL-2.1対応としてminify版と可読ソースをassets/vendorに同梱。
詳細は THIRD_PARTY.md。Trianglify GPL-3.0は対応検討のためHOLD。

## 開発
npm ci --ignore-scripts
npm run build
npm run check

初期ブラウザテストは13モードPASS、積層操作6件PASS。
追加6モードのiPhone Safari実機検証は別途必要。
オフライン時はキャッシュ済みのモードのみ利用可能。初回の追加モードにはネット接続が必要。
