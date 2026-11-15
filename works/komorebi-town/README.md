# こもれび町 3D：景観強化版

対象：`/komorebi-town/`。3D版のみを段階更新する。比較用の `/komorebi-town-25d/`、`/komorebi-town-2d/`、トップページには変更を加えない。

## 変更内容

- 建物4軒に日本語名、屋根・壁・窓・飾り・煙突・庇などの違いを追加。入口の近くで「しらべる」操作ができる。
- 花壇、街灯、海岸の砂・小石・波紋、雲、草と道の小さな模様を追加。
- 昼・夕方・夜の切替で背景、光源、海、窓明かり、街灯が変わる。
- 元の住民2人との会話、キーボード移動、画面タップ移動、スマホ方向ボタンは維持。
- モバイルでは描画解像度1.3倍上限、アンチエイリアス無効、影の解像度1024、約30fps上限。デスクトップは解像度1.7倍上限・2048影・約60fps。
- 260個弱の花・約90個の海岸石は `THREE.InstancedMesh` に集約。石以外の地面/道は1回生成するCanvasTextureで表現。
- reduced motion時は雲や木の揺れを抑制。タブ非表示時は描画を休止。

## ファイル構成

- `public/index.html`：Three.js 0.169.0（既存と同一バージョン）を CDN から読み込む単一ページ。追加パッケージなし。
- `tests/scene_smoke.test.mjs`：ネットワークやGPUを使わないDOM/Three APIモックによる生成・入力・時間帯切替の退行テスト。
- `scripts/release_komorebi_town_visual.py`：GitHub mainの正確なSHAと、旧本番HTMLのSHAを確認して、対象HTMLだけをFTPSで更新。FTPS/HTTPS一致検証、失敗時ロールバック。WinCredの既存資格情報使用。

## 検証

```sh
node --check /tmp/komorebi-3d-module.mjs  # HTMLから script[type=module] を抽出
node works/komorebi-town/tests/scene_smoke.test.mjs
python scripts/release_komorebi_town_visual.py --expected-main <approved-main-sha>
```

Node VMテストはThree.js APIの使用とUIイベントに関するスモークテストであり、実GPU/WebGLやiPhoneの性能を保証しない。公開後のiPhone確認を別途受け入れ項目にする。新機能でデバイス負荷が増す場合は、追加演出を削減する前にGPU描画回数とフレーム時間を調べる。

## 公開・復旧

`main` 統合後のみ、`scripts/release_komorebi_town_visual.py --expected-main <sha> --apply`。本番で既知以外のHTMLを発見したら書き換えない。GitHub Actionsは禁止のまま。実行時の資格情報は表示せず、既存Webサイトの他のパスを配備・削除しない。