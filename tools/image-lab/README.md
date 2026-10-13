# Image Lab v0.9.2 / 独立した画像実験PWA

Minimalizer / MinimalizerPublic、既存の画像仕立て室から独立している。
画像はアップロードされず、すべてブラウザ内で扱う。元画像の破壊的編集、AIによる描き足しは行わない。

## Layer Decomposer v0.3

1. 「画像を読み込む」または作例で元画像を用意
2. 「分解の細かさ」6 / 10 / 14 色を選択し「元画像をレイヤー分解」を押す
3. 抽出されたレイヤーをタップして選択。表示・非表示・単独表示、名前と不透明度を変更
4. 「選択レイヤーを透過PNG保存」で領域だけ保存、「結果をPNG保存」で現在見えている合成を保存
5. 「画像効果モードに戻る」で既存13モードへ復帰

分解手法：決定論的RGB k-means（最大15代表色）＋縮小300px上での4方向連結成分探索。
大きな領域から最大17領域を独立化、残余を「その他の領域」に保持し、合計18枚以内。
元画像のRGBA画素を全画素ちょうど1つのレイヤーに割り当てる方式。
全レイヤーが表示・不透明度100%なら全画素が元画像と一致する。
分解の境界は縮小サンプル由来なので細い物体の区分が不正確になる場合がある。
v0.4以降は意味分離（人物・髪・服など）にも対応。背景補完、描き足しはしない。

モバイルメモリ保護として、画像最大1200px長辺、レイヤー所有者配列を単一のUint8Arrayとして保持。
フル解像度RGBAを各レイヤーに複製せず、描画時/保存時にだけ必要な透過画像を作成する。
表示状態・名前・不透明度はタブ内メモリだけに保持され、再読込で消える。
表示/非表示と単独表示は独立し、単独表示では通常非表示の領域も確認可能。
個別PNG書き出しは選択範囲の元RGBAをそのまま保存し、非表示・不透明度の設定に影響されない。
合成PNGは現在の表示と不透明度を反映する。

## 画像効果

既存13モード：d3-voronoi、Delaunator、Earcut、Pts.js、Rough.js、
Paper.js、glfx.js、p5.js、PIXI.js、SVGPathCommander、SVGO、VTracer WASM、Clipper2-WASM。
通常は元画像から再計算。「結果を重ねる」で加工結果を確定し次の効果の入力とする
5段階のメモリ内履歴に対応。PNG書き出し、ベクター対応モードのみSVG書き出し。
レイヤー別の色調整はv0.7で利用可能。図形等の空間エフェクトのレイヤー別適用とレイヤープロジェクトの永続保存は未実装。境界の手動修正はv0.6から利用可能。

## ビルドと検証

npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run check

実装元 src/layers/decompose.js はブラウザDOM非依存でNodeテスト可能。
テストは4連結領域分離、透過を含む元画像の厳密復元、可視性・透明度・単独表示、
大きなグラデーション画像の決定性と枚数制限、不正入力に対応。
Edge実ブラウザの390×844スマートフォン幅操作テストで16/16 PASS。
iPhone Safariの新機能については公開後の実機操作が別途必要。

## 依存性

npm lock固定、esbuild code splitting、自前配信。重い効果とレイヤー分解は遅延ロード。
第三者ライセンスは THIRD_PARTY.md と licenses/。
TrianglifyはGPL-3.0配布条件の検討中につき未導入。
PWAキャッシュはv0.3.1。新規モードの初回アクセスはオンラインを推奨。

## v0.3.1 PWA更新修正（2026-10-12）

v0.3.0でService Workerの事前キャッシュ一覧だけ旧v0.2.0のJS/CSSクエリが残った。
さらにignoreSearch:trueの検索が、v0.3.0のHTMLから要求した新JSに旧v0.2.0のJSを返す状態を作り、
「レイヤー分解」ボタンが画面上には表示されるのに反応しない原因になった。

修正は（1）バージョン番号を含む別パス main-v0.3.1.js と style-v0.3.1.css の配信、
（2）SWのキャッシュキー完全一致と現在版のプリキャッシュ、
（3）二度目の合成クリックを使わない単一の非同期click操作への変更。
古いSWから切り替わる初回読み込みでも、旧キャッシュにないパスを要求するので利用できる。
回帰テストでは旧SWの事前キャッシュがある状態から新版へ更新する。

## v0.4 Semantic Layers Beta

- 分解方法に「AI意味分離」を追加。写真人物の背景・髪・顔・服の上下・ドレス・腕・脚・靴・帽子・小物を解析。
- ONNX Runtime Web（WASM 1スレッド）とMITライセンスの SegFormer-B0 clothes ONNX INT8を自己ホスト。
- モデルID：Xenova/segformer_b0_clothes、リビジョン：a2489ea8e7ec1ee912190546bad31a4906ccca76。
- 元モデル：mattmdjaga/segformer_b0_clothes、ライセンスMIT。確認：https://huggingface.co/mattmdjaga/segformer_b0_clothes。
- 質量約4.4 MBモデルと約14 MB WASMは初回のAI操作時だけ遅延読込。
- 256x256 RGB入力、ImageNet正規化、18 logits argmax、各ピクセルを一意の意味レイヤーに割り当てる。
- 全表示の再合成は元画像のRGBAと一致。内容生成・塗り足し無し。人物が検出されなければ色・領域分解に戻す。
- 写真向けチェックポイントであり、アニメイラスト・複数人物・ポーズ・複雑背景は精度保証しない。
- WASMとモデルは画像をサーバに送信せず、同一サイトから配信する。オフライン初回AI推論は不可。
 
## v0.4.1 Cloudfree runtime fix 
ONNX Runtime Web module is served from assets/ort/ort-wasm-simd-threaded-loader.js, an identical copy of the upstream .mjs file, because the production nginx host does not serve a JavaScript Content-Type for .mjs. wasmPaths explicitly maps mjs and wasm. No vendor code modifications.

## v0.5 Layer Merge
- Choose two or more Color or Semantic layers via multi-selection, optionally name the merged output.
- Image Lab uses disjoint pixel ownership. The selected layer visibility and opacity are baked into pixel alpha. Unselected layers are unchanged; the original input canvas is never mutated.
- The merged composite is pixel-identical to the visible composite before the operation. Layer name, visibility, opacity and transparent PNG export work after merging.
- Up to three in-memory merge undo steps. History does not survive a refresh.
- Solo display resets on entering multiple selection. Hidden layers can be selected, but their hidden pixels are baked transparent.

## v0.6 Order and Mask Retouch
- Move the selected layer earlier/later by one with large mobile controls; remaps all owner IDs so layer identity and pixel assignments remain correct.
- Ownership layers are disjoint: reordering changes list order only and does not create visual overlap. It does not change the displayed composite until a future overlapping-layer compositor is implemented.
- Boundary brush: tap selected layer, select Add or Remove, choose destination when removing, then draw on the RESULT canvas with Pointer Events (touch-action none) and a configurable radius.
- Every edited pixel receives its original uploaded RGBA, changing only membership; no invented pixels. Original uploaded image canvas is not modified. A stroke commits on pointer-up. Pointer cancellation rolls back.
- Unified maximum 5 in-memory Undo steps for merge, reorder, and brush strokes. Reopening/resetting the editor clears edits.
- Browser-only and touch friendly; editing on the result canvas requires viewing the result image at a usable size.

## v0.6.2 Mobile Preview & Compact Controls
- スマートフォンやタブレット（幅930px以下）では RESULT を先に横幅いっぱいに表示。ORIGINAL は112pxの比較サムネイルにし、必要なときだけ展開できる。
- 「画像効果」「レイヤー分解」は切り替え式で、無関係な長い設定を同時に並べない。編集中のレイヤーをタブ操作だけで破棄しない。
- 元画像と結果のRGBA、各エフェクト・レイヤーの演算、エクスポート形式は不変更。CSSと操作導線のみ変更。
- 390pxと375px相当のEdge端末エミュレーションで結果幅360px/345px、元画像サムネイル幅110px、横スクロール無し。切り替え・色分解・復帰を確認。
- iPhone Safari物理実機でのv0.6.2受入は、本番公開後の別ゲート。

## v0.7.0 Per-layer Tone (initial release)
- 色/AI意味分離後、選択中の各レイヤーにだけ明るさ・コントラスト・彩度（-100〜+100）を非破壊で調整。
- 編集パネルは折りたたみ式。スライダー中は試写のみ、「色調整を適用」で確定・Unified Undo（最大5ステップ）に記録。「調整を元に戻す」は未確定の試写のみ取消。
- 効果値はレイヤー単位のスカラー値。画素バッファは元のownerマップとsourceを共有し、各レイヤーごとにRGBA全画像を複製しない。
- 完全ニュートラルなら元画素RGBAそのまま。彩度や明るさが0でない場合もアルファは変更しない。PNG合成とレイヤーPNGへ反映。
- 統合では現在見えている結果を選択レイヤー画素にだけ焼き込む。未選択レイヤーとアップロード元canvasは不変。
- 次の段階の空間フィルター（Voronoiなど）のレイヤー別適用はこの版に含まない。境界修正・並び替え・2指ガードは維持。
- 更新されたPWAシェルと自動回帰テスト。実機iPhoneの新機能確認は公開後に別途。

## v0.8.0 FX Stack + Library Explorer
- レイヤー編集で独立したFXスタック。反転、グレースケール、ポスタライズ、二値化、モザイク、ぼかし、網点、エッジ強調の8個の Image Lab独自CPU参照効果。
- 各効果のON/OFF・順序変更・削除・強度スライダーのプレビューと確定。操作ごとにUndoへ記録。レイヤーごと8件まで。
- 元画像RGBAと画素所有者は保持。ぼかし・モザイク・輪郭計算は同じownerの元画素だけを参照し、他レイヤーからの色にじみを防ぐ。
- レイヤー統合で見えている効果をそのまま焼き込み、単独PNGと全体PNGにも反映。
- Library Explorerは15ライブラリ分の追加研究候補を表示し、既存13モードの代表実験に移動できる。個々の未実装APIを試したと偽って表示しない。
- ONNX Runtime WebのiPhone Safari WebGPUなど非対応モードは対象外。外部ライブラリのAPI網羅検証は未完了で、続く研究工程。

## v0.9.0 Capability Lab
- 実装済みの複数ライブラリAPIを直接試す実験パネル（初回は折り畳み）。
- 登録と試験成功を厳密に分離。未実行は未実行のまま。失敗時はエラー、経過時間を記録しJSON保存可能。
- ライブラリごとの一括実行は明示操作のみ。ONNX推論モデル等をアプリ起動時に読み込まない。
- PWA iPhone SafariではONNX WebGPUを実行しない。Trianglifyはライセンス上の保留を維持。
- 追加試験は「各ライブラリの全公開APIの網羅」を意味しない。今後API列挙・カバレッジ拡大を続ける。

## v0.9.1 Trianglify系パターン実験
- GPL-3.0の公式Trianglifyは組み込まない。MITの別実装 @gkucmierz/trianglify@1.0.0 を採用し、画面でもTrianglify系 (MIT)と表示する。
- 実ライブラリtoSVGString()を利用して三角形、配色、seed、カラーポイントの4種類を実験できる。
- 入力画像のピクセルを変更せずSVGプレビューを返す。既存FXとの多段合成は別工程。
- iPhone実機v0.9.1検証は別途実施する。

## v0.9.2 アニメ意味分離比較
- 写真向けATR SegFormer 18分類をそのまま維持する。
- MIT anime U-Net 7分類（siyeong0, 2025）をONNXへ変換してローカルWASMで実行。モデルを要求時だけロード。
- 7分類は背景・髪・目・口・顔・肌・服。腕・脚・上下の服に分けられるとは主張しない。
- 比較モードは両方の実AIを独立実行し、分類マスクを並べて表示し選択結果をレイヤー編集に引き渡す。
- 画像の外部送信、生成・描き足し無し。候補の絶対的精度は未検証、実画像の正解マスクによる評価は別途必要。
