# ベクター変換室 UI整理・モバイル改良 (2026-11-12)

## Goal / acceptance scope
ユーザーは既存Vector Labの5エンジンすべてをiPhone実機で正常実行したと確認した。指定の「ほかの図形化エンジンと比較」「使い方と注意点」2ブロックを**完全削除**し、UIの実用的な改良へ進む。既存公開PWA `/vector-lab/` だけを更新し、Minimalizer、他作品ページ、変換エンジン本体、ライブラリの依存・バイナリを変更しない。

## 変更
- 重複したエンジン比較ブロックと長い使い方ブロックを削除。ヘッダーの無効な `#help` リンクをライセンス画面へのリンクへ修正。独立サイトのナビゲーションとフッターも整理。
- 5エンジン切替は5枚のカード式ボタン（`aria-pressed`）に変更。iPhone幅では横スクロールのカード列（最低44pxタップ領域）、PCではグリッド。既存 `#engine` select はスクリーンリーダー・テスト互換用に残し、選択状態と同期。
- 出力プレビューを「元画像 / 比較 / SVG」の3モード（ボタン・`aria-pressed`）へ整理。比較だけスライダーを表示。結果がある場合は「変換結果を見る」で出力へ移動。
- 生成済み候補数の表示、選択中候補の枠線強調、iPhoneのSVG/PNG/設定JSON保存ボタンの整列、処理中インジケータ、端末の設定に合わせたreduced-motion対応。
- 外部SVG取り込み（Primitive / Geometrize / Primeval）は**削除せず**「生成した候補を切り替える」内部の折りたたみ欄に移設。
- iPhoneの高負荷を抑えるため、sliderの`input`イベント中は重いWASMの繰返し再起動を避け、`change`イベント後に再変換。テキストパレット変更は従来どおりデバウンス。新しい図形数設定も自動更新対象へ修正。
- PWA Service Workerのキャッシュ名を`vector-lab-shell-v3-20261112-ui`へ更新し、既存5エンジンWASM/JSと全アセットを再キャッシュ。
- Windows版Gitによる既存チェックアウト時CRLF変換により、固定Geometrize JSのバイトハッシュ検証が環境依存で失敗。上流保存ファイルは正規LFで一致することを確認済み。vendorの`.gitattributes`で将来のバイト変化を防止し、旧チェックアウトのCRLFのみ正規化して元上流SHA256と照合するテストへ修正。アルゴリズムとコードは変更なし。

## チェック
- Focused Python `tests/test_vector_lab_standalone.py`: **9 passed**.
- Node options: `VECTOR_LAB_OPTIONS_PASS`.
- 実Chrome E2E（合成PNG、ローカル一時Webサーバー）: `VECTOR_LAB_CHROME_PASS`。5エンジン実変換、VTracer追加モード、候補インポート、カード選択同期、3プレビュー表示、削除済ブロック不存在、結果ジャンプを確認。
- **390pxモバイルViewport再現**の実Chrome E2EもPASS。エンジン選択が内部横スクロールでき、タップ領域が44px以上、ページ全体に予期せぬ横はみ出しがない。
- 未完了（執筆時）: 全public boundary validator、公開ビルド、PRマージ、`/vector-lab/` のスコープ付き本番展開、公開HTTPSでのreadback / Chrome E2E、更新後のユーザーiPhone実機受入。これらのPASSは実施後にのみ記録する。

## 配信・復旧
- 正本: `watarionn/portfolio-site`、唯一の対象は `tools/vector-lab/` → `/vector-lab/`。ライブラリバイナリ・他ページは変えず、HTML/JS/CSS/SWだけを差分更新。
- 前版正本はPR #245 merge `dee31f0b2bb4cab83813d64bab6c0b863b79fb01`。
- WinCred資格情報を使用した既存の証明書検証付きFTPS運用と、最初にread-only CAS /バックアップ / read-after-write / HTTPSハッシュ照合を継続する。GitHub/正本とライブの差異がCRLFだけでも、必ず既存実バイトをバックアップした上でスコープ内更新する。
