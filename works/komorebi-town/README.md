# こもれび町 3D 景観強化版

## 目的と公開範囲
既存 `/komorebi-town/` の初期試作を大きく作り込む。2D `/komorebi-town-2d/` と 2.5D `/komorebi-town-25d/`、サイトのトップ、Portfolio Cityには変更を加えない。現段階は探索体験を比較するための独立試作で、正式なポートフォリオ入口には置き換えない。

## 景観の追加
- 4軒の家を図書館・工房・展示館・あそび場として装飾。色別の屋根瓦（InstancedMesh）、木組み、石の土台、玄関の日除け、花の窓台、日本語の案内板を追加
- 中央広場近くに街灯とベンチ、町の一角に池・水紋・蝶、花壇、野草と砂浜の縁・波の泡を追加
- 町の昼・夕方・夜を手動で切り替え可能。窓・街灯は emissive 材質と少数のSpriteで表現し、重いPointLightやポストプロセスを追加しない
- 住民だけでなく、各建物に近づいて「しらべる」で短い説明を読めるようにした
- 他の表示方式（2D・2.5D）へのリンクをゲーム画面に設置

## 実装
- `public/index.html` : ゲーム、移動、カメラ、UI、住民との会話、従来の主要建物と木
- `public/scenery.js` : 景観の追加要素と昼夕夜の演出。独立したThree.jsの実行時オブジェクトを作り、エクスポートする
- `tests/scenery.test.mjs` : 2つのJavaScriptの構文と追加景観の構築、池の当たり判定、昼夕夜切替、屋根・野草のインスタンス化を検証
- `scripts/release_komorebi_3d_visual.py` : GitHub main の正確なGit blobを、WinCredによるFTPSで **この2ファイルのみ** 配置。従来のHTML SHAを検証し、JS→HTMLの順で公開。FTPS・HTTPSでSHA-256を読み戻し。失敗時には既存HTMLを復元

## iPhoneの描画負荷対策
- タッチ端末でピクセル密度の上限を1.35にし、アンチエイリアスとシャドウマップ解像度を軽量化
- 約220個の小さな花を5色のInstancedMeshと葉1バッチへ変換
- 新規の屋根瓦288個、野草最大170個もInstancedMeshでまとめて描画
- 装飾で実際の点光源や重いポストエフェクトを使用しない
- タッチ端末のレンダリングは30fpsを上限にする。入力・移動の更新はrequestAnimationFrameで継続
- `prefers-reduced-motion` 時には波紋・蝶の演出を抑える
- 新しいJSにはクエリバージョン `scenery.js?v=20261115-v1` を付け、Safariの古いキャッシュとの混在を防ぐ

## 検証
```sh
node works/komorebi-town/tests/scenery.test.mjs
python scripts/release_komorebi_3d_visual.py --expected-main <main SHA>
python scripts/release_komorebi_3d_visual.py --expected-main <main SHA> --apply
```

本番公開の受入条件は、上記スモークテストPASS、正本mainの読み戻し、FTPS・HTTPS双方でのHTML/JS完全一致。最終的なiPhoneでの操作感とGPU負荷は実機で試すまで確認済みとは言わない。

## 継続開発
建物の内部や実作品への導線、背景のアートディレクションは次の工程。今の世界観を無断でPortfolio Cityの正式仕様に転用しない。
