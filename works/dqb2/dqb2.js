/* =============================================
   DQB2 部屋レシピ図鑑 — dbq2.js
   ロジック完全保持 / カードHTML生成を辞書風に更新
   ============================================= */

const ROOMS = [
  ["ととのった寝室タイプ3","あかり(系統)×1｜ベッド(系統)×1｜はち植えの花(カタマリ)×1｜めざまし時計×1","住人がベッドで寝てくれる"],
  ["モダンハイム","あかり(系統)×2｜ベッド(系統)×2｜ウッドブラインド・上×1","住人がベッドで寝てくれる"],
  ["モダンメゾンタイプ1","あかり(系統)×2｜ベッド(系統)×4｜ウッドブラインド・上×1｜フレームシェルフ×1｜めざまし時計×1","住人がベッドで寝てくれる"],
  ["モダンレジデンスタイプ1","高級あかり(系統)×2｜ベッド(系統)×8｜ウッドブラインド・上×1｜フレームシェルフ×1｜めざまし時計×1｜ちくおんき×1","住人がベッドで寝てくれる"],
  ["バスルームタイプ4","たらい×2｜あかり(系統)×1｜ジェットバス×2｜タオル(系統)×2","住人がお風呂に入ってくれる"],
  ["男湯タイプ5","男のカベかけ×1｜ジェットバス×2｜タオル(系統)×2","住人がお風呂に入ってくれる"],
  ["女湯タイプ5","女のカベかけ×1｜ジェットバス×2｜タオル(系統)×2","住人がお風呂に入ってくれる"],
  ["ユニットバスタイプ1","ごえもん風呂×1｜あかり(系統)×1｜洗面台×1｜タオル(系統)×1","住人がお風呂に入ってくれる"],
  ["システムキッチンタイプ1","収納箱(系統)×1｜まな板とナイフ×1｜クックポット×1｜アイランドキッチン×1","素材をいれておくと住人が調理してくれる"],
  ["カフェタイプ1","食器プレート(系統)×1｜かざり飲料(系統)×1｜絵画(系統)×1｜いす(系統)×2｜カフェテーブル×2","効果なし"],
  ["プールの更衣室タイプ4","タンス×1｜あかり(系統)×1｜モダンなパラソル×1｜タオル(系統)×1","住人が水着に着替えてくれる"],
  ["リビングルームタイプ3","モップかざり×1｜だんろ×1｜はち植えの花(カタマリ)×2｜観葉植物(カタマリ)×2｜ラウンドソファ×1","効果なし"],
  ["書斎","テーブル(系統)×1｜書籍(系統)×1｜いす(系統)×1｜フレームシェルフ×1｜ちくおんき×1","効果なし"],
  ["玄関タイプ1","ハイヒール×1｜展示ハンガー×1｜かざり花(系統)×1","効果なし"],
  ["プールの更衣室タイプ6","あかり(系統)×1｜桐ダンス×1｜モダンなパラソル×1｜タオル(系統)×1","住人が水着に着替えてくれる"],
  ["玄関タイプ3","下駄×1｜展示ハンガー×1｜かざり花(系統)×1","効果なし"],
  ["プレゼントツリータイプ1","スギの若木×1｜プレゼントボックス×1","効果なし"],
  ["魚展示室タイプ1","展示かんばん×1｜水槽(カタマリ)×1｜船のまど×1","効果なし"],
  ["おみやげ屋タイプ1","スライム風船×1｜ねふだ×1｜テーブル(系統)×1｜海のモニュメント×1","商人が値札にいれたアイテムを売ってくれる"],
  ["アクアルーム","きれいな水×10｜ようがん石×1｜船のまど×2｜海草(系統)×3","効果なし"],
  ["アクアベッドルーム","ベッド(系統)×2｜貝(系統)×1｜海草(系統)×1","住人がベッドで寝てくれる"],
  ["アクアゲストハウス","ヒトデ×1｜ベッド(系統)×4｜貝(系統)×1｜海草(系統)×1","住人がベッドで寝てくれる"],
  ["アクアヴィラタイプ1","ヒトデ×1｜ももいろのサンゴ×1｜ベッド(系統)×8｜貝(系統)×1｜海草(系統)×1","住人がベッドで寝てくれる"],
  ["アクアキッチンタイプ1","シンク×1｜たき火(系統)×3｜収納箱(系統)×1｜貝(系統)×1","素材をいれておくと住人が調理してくれる"],
  ["囲炉裏","たき火(系統)×1｜魚の炭火やき×1","効果なし"],
  ["水槽タイプ1","まど枠固定ガラス×4｜きれいな水×10","効果なし"],
  ["いけすタイプ1","きれいな水×10｜いけすの網×1","効果なし"],
  ["水族館","おみやげ屋×1｜魚展示室×1","地図上に魚のアイコンが表示される"],
  ["更衣室タイプ3","ドレッサー×1｜いす(系統)×1｜あかり(系統)×1｜桐ダンス×1","衣装をいれておくと住人が着替えてくれる"],
  ["おふろの更衣室タイプ3","たらい×1｜あかり(系統)×1｜桐ダンス×1｜タオル(系統)×1","住人がバスタオルに着替えてくれる"],
  ["バニーの更衣室タイプ3","タル×1｜いけ花×1｜あかり(系統)×1｜桐ダンス×1","住人がバニースーツに着替えてくれる"],
  ["プールの更衣室タイプ3","パラソル×1｜あかり(系統)×1｜桐ダンス×1｜タオル(系統)×1","住人が水着に着替えてくれる"],
  ["和風の寝床タイプ1","タンス×1｜ちょうちん×1｜布団×2","住人がベッドで寝てくれる"],
  ["和風の寝所タイプ1","タンス×1｜木の間じきり×2｜ちょうちん×2｜布団×4","住人がベッドで寝てくれる"],
  ["和風のはたごタイプ1","タンス×1｜木の間じきり×4｜ちょうちん×4｜布団×8","住人がベッドで寝てくれる"],
  ["土間タイプ1","収納箱×1｜かまど×1｜たき火(系統)×3｜ツボ(系統)×1｜米俵×2","素材をいれておくと住人が調理してくれる"],
  ["お茶の間タイプ1","丸クッション×1｜食器プレート(系統)×1｜ちゃぶだい×1","効果なし"],
  ["かわやタイプ1","ツボ(系統)×1｜下駄×1｜タオル(系統)×1","住人が用をたしていく"],
  ["床の間","刀かざり×1｜らんま×1｜かけ軸×1","効果なし"],
  ["道場","兵士用マネキン×2｜刀かざり×1｜かけ軸×1","兵士が体をきたえてくれる"],
  ["和風庭園タイプ1","松(系統)×1｜鹿おどし×1｜石どうろう×1","効果なし"],
  ["水車小屋タイプ1","カベかけふくろ(系統)×1｜米俵×1｜水車×1","効果無し"],
  ["はじめての寝床","あかり(系統)×1｜ベッド(系統)×2","住人がベッドで寝てくれる"],
  ["みんなの寝室","あかり(系統)×2｜ベッド(系統)×4","住人がベッドで寝てくれる"],
  ["ワイワイ寝室","あかり(系統)×4｜ベッド(系統)×8","住人がベッドで寝てくれる"],
  ["ととのった寝室タイプ1","はしら時計×1｜あかり(系統)×1｜ベッド(系統)×1｜はち植えの花(カタマリ)×1","住人がベッドで寝てくれる"],
  ["農家の寝床","農具かざり×1｜まき材×1｜あかり(系統)×1｜ベッド(系統)×2","住人がベッドで寝てくれる"],
  ["農家の寝室","農具かざり×2｜まき材×2｜あかり(系統)×2｜ベッド(系統)×4","住人がベッドで寝てくれる"],
  ["カントリーロッジ","農具かざり×4｜まき材×4｜あかり(系統)×4｜ベッド(系統)×8","住人がベッドで寝てくれる"],
  ["あらくれの寝床","宿屋のカベかけ×1｜ベッド(系統)×8｜ツボ(系統)×3","住人がベッドで寝てくれる"],
  ["あらくれの宿屋","宿屋のカベかけ×1｜いす(系統)×2｜あかり(系統)×2｜ベッド(系統)×8｜ツボ(系統)×3","住人がベッドで寝てくれる"],
  ["ホテルあらくれ","宿屋のカベかけ×1｜高級ベッド(系統)×8｜高級あかり(系統)×2｜いす(系統)×2｜ツボ(系統)×3｜キャビネット×1","住人がベッドで寝てくれる"],
  ["兵士の寝床","武具(系統)×1｜あかり(系統)×1｜ベッド(系統)×2","住人がベッドで寝てくれる"],
  ["兵士のバラック","武具(系統)×2｜あかり(系統)×2｜ベッド(系統)×4","住人がベッドで寝てくれる"],
  ["兵士の宿舎","武具(系統)×4｜あかり(系統)×4｜ベッド(系統)×8","住人がベッドで寝てくれる"],
  ["バスルームタイプ1","たらい×2｜ごえもん風呂×2｜あかり(系統)×1｜タオル(系統)×2","住人がお風呂に入ってくれる"],
  ["男湯タイプ1","男のカベかけ×1｜ごえもん風呂×2｜タオル(系統)×2","住人がお風呂に入ってくれる"],
  ["女湯タイプ1","女のカベかけ×1｜ごえもん風呂×2｜タオル(系統)×2","住人がお風呂に入ってくれる"],
  ["あったかお風呂","たらい×4｜ごえもん風呂×1｜いす(系統)×1｜タオル(系統)×3","住人がお風呂に入ってくれる"],
  ["木のぬくもりの湯","まき材×2｜たらい×4｜ごえもん風呂×2｜いす(系統)×1｜あかり(系統)×1｜タオル(系統)×3","住人がお風呂に入ってくれる"],
  ["シャワールーム","ついたて×1｜シャワー×1｜タオル(系統)×1","住人がシャワーを浴びてくれる"],
  ["すけすけシャワー室タイプ1","つながるガラスまど×4｜ついたて×2｜シャワー×4｜あかり(系統)×2｜タオル(系統)×2","住人がシャワーを浴びてくれる"],
  ["あったか温泉","たらい×3｜お風呂のいす×3｜湯わき口×1｜温泉(カタマリ)×1","住人がお風呂に入ってくれる"],
  ["ぶきみなお風呂","たらい×3｜お風呂のいす×3 赤い水×10｜魔物のシンボル(系統)×1","住人がお風呂に入ってくれる"],
  ["常夏プール","パラソル×1｜とこなつドリンク×1｜デッキチェア×1｜プール(カタマリ)×1","住人が水着で泳いでくれる"],
  ["シンプルキッチンタイプ1","たき火(系統)×3｜収納箱(系統)×1","素材をいれておくと住人が調理してくれる"],
  ["ごはんどころタイプ1","たき火(系統)×3｜収納箱(系統)×1｜食事テーブル(カタマリ)×1","素材をいれておくと住人が調理してくれる"],
  ["農家の台所タイプ1","小麦ぶくろ×3｜まき材×2｜たき火(系統)×3｜収納箱(系統)×1","素材をいれておくと住人が調理してくれる"],
  ["農家の食堂タイプ1","小麦ぶくろ×3｜まき材×2｜たき火(系統)×3｜収納箱(系統)×1｜食事テーブル(カタマリ)×1","素材をいれておくと住人が調理してくれる"],
  ["キノコキッチンタイプ1","たき火(系統)×2｜キノコ(系統)×1｜収納箱(系統)×1","住人がキノコ料理を作ってくれる"],
  ["キノコ食堂タイプ1","キノコ(系統)×1｜収納箱(系統)×1｜フライパン調理台(カタマリ)×2｜食事テーブル(カタマリ)×1","住人がキノコ料理を作ってくれる"],
  ["お城のキッチンタイプ1","井戸×1｜レンガキッチン×1｜収納箱(系統)×1","素材をいれておくと住人が調理してくれる"],
  ["お城の食堂タイプ1","井戸×1｜レンガキッチン×1｜収納箱(系統)×1｜炊き出しテーブル(カタマリ)×1","素材をいれておくと住人が調理してくれる"],
  ["魔物のキッチン","レンガキッチン×1｜まもの飯マウンテン皿×1｜収納箱(系統)×1","素材をいれておくと住人が調理してくれる"],
  ["ダイニング","あかり(系統)×1｜食事テーブル(カタマリ)×4","効果なし"],
  ["ロイヤルダイニングタイプ1","タペストリ×2｜だんろ×1｜王の食事テーブル(カタマリ)×1","効果なし"],
  ["はじめての個室","個室カベかけ(系統)×1｜いす(系統)×1｜あかり(系統)×1｜ベッド(系統)×1","指定した住人の部屋になる"],
  ["ちょっとした個室","テーブル(系統)×1｜カベかけかざり(系統)×1｜個室カベかけ(系統)×1｜いす(系統)×1｜あかり(系統)×1｜ベッド(系統)×1","指定した住人の部屋になる"],
  ["ゴージャス個室","高級ベッド(系統)×1｜高級あかり(系統)×1｜高級テーブル(系統)×1｜カベかけかざり(系統)×1｜個室カベかけ(系統)×1｜高級いす(系統)×1","指定した住人の部屋になる"],
  ["かっこいい個室","ダンベル×1｜タル×1｜ガラスびん×1｜個室カベかけ(系統)×1｜あかり(系統)×1｜ベッド(系統)×1","指定した住人の部屋になる"],
  ["かわいい個室タイプ1","ドレッサー×1｜いけ花×1｜個室カベかけ(系統)×1｜いす(系統)×1｜あかり(系統)×1｜ベッド(系統)×1","指定した住人の部屋になる"],
  ["王さまの寝室","高級あかり(系統)×1｜個室カベかけ(系統)×1｜キングベッド×1｜だんろ×1｜高級いす(系統)×1","指定した住人の部屋になる"],
  ["お姫さまの寝室","高級あかり(系統)×1｜個室カベかけ(系統)×1｜王女のベッド×1｜高級いす(系統)×1｜はち植えの花(カタマリ)×1","指定した住人の部屋になる"],
  ["はじめての2人部屋","個室カベかけ(系統)×2｜いす(系統)×2｜あかり(系統)×1｜ベッド(系統)×2","指定した住人の部屋になる"],
  ["ちょっとした2人部屋","テーブル(系統)×1｜カベかけかざり(系統)×1｜個室カベかけ(系統)×2｜いす(系統)×2｜あかり(系統)×1｜ベッド(系統)×2","指定した住人の部屋になる"],
  ["ゴージャスな2人部屋","高級ベッド(系統)×2｜高級あかり(系統)×1｜高級テーブル(系統)×1｜カベかけかざり(系統)×1｜個室カベかけ(系統)×2｜高級いす(系統)×2","指定した住人の部屋になる"],
  ["バー","バーセット(カタマリ)×1","バーテンダーが住人に飲み物をふるまってくれる"],
  ["みんなの酒場","酒場のカベかけ×1｜酒ダル×2｜宴会テーブル(カタマリ)×1｜バーセット(カタマリ)×1｜ドリンクテーブル(カタマリ)×2","バーテンダーが住人に飲み物をふるまってくれる"],
  ["ゲーム酒場","酒場のカベかけ×1｜銀の水さし×1｜カベかけあかり(系統)×1｜バーセット(カタマリ)×1｜ポーカーテーブル(カタマリ)×1｜ダーツセット(カタマリ)×1","バーテンダーが住人に飲み物をふるまってくれる"],
  ["トイレタイプ1","ツボ(系統)×1｜タオル(系統)×1","住人が用をたしていく"],
  ["みんなのトイレ","トイレ×3｜ついたて×2｜タオル(系統)×3","住人が用をたしていく"],
  ["男子トイレ","男のカベかけ×1｜トイレ×3｜タオル(系統)×3","住人が用をたしていく"],
  ["女子トイレ","女のカベかけ×1｜トイレ×3｜タオル(系統)×3","住人が用をたしていく"],
  ["カントリー風トイレタイプ1","つみわら×1｜ツボ(系統)×1｜タオル(系統)×1","住人が用をたしていく"],
  ["花かおるトイレタイプ1","いけ花×1｜ツボ(系統)×1｜タオル(系統)×1","住人が用をたしていく"],
  ["お城のトイレタイプ1","カベさしのはた×1｜ツボ(系統)×1｜タオル(系統)×1","住人が用をたしていく"],
  ["更衣室タイプ1","ドレッサー×1｜タンス×1｜いす(系統)×1｜あかり(系統)×1","衣装をいれておくと住人が着替えてくれる"],
  ["おふろの更衣室タイプ1","タンス×1｜たらい×1｜あかり(系統)×1｜タオル(系統)×1","住人がバスタオルに着替えてくれる"],
  ["バニーの更衣室タイプ1","タンス×1｜タル×1｜いけ花×1｜あかり(系統)×1","住人がバニースーツに着替えてくれる"],
  ["プールの更衣室タイプ1","パラソル×1｜タンス×1｜あかり(系統)×1｜タオル(系統)×1","住人が水着に着替えてくれる"],
  ["リビングルームタイプ1","モップかざり×1｜くつろぎソファ×1｜だんろ×1｜はち植えの花(カタマリ)×2｜観葉植物(カタマリ)×2","効果なし"],
  ["農家の倉庫","農具かざり×1｜ロープ×1｜まき材×1｜つみわら×1｜収納箱(系統)×1｜ツボ(系統)×1","住民が素材を収納箱に入れてくれる"],
  ["武器庫","バリケード×2｜武具(系統)×4｜収納箱(系統)×1","武器をいれておくと住人が装備してくれる"],
  ["金属工房","炉×1｜カベかけふくろ(系統)×1｜収納箱(系統)×1｜ツボ(系統)×1","一部の住人がアイテムづくりを手伝ってくれる"],
  ["かじ屋","武器屋のカベかけ×1｜金床×1｜カベかけふくろ(系統)×1｜収納箱(系統)×1","素材を入れておくと一部の住人がアイテムを作ってくれる"],
  ["発酵所","酒ダル×2｜タル×2｜カベかけふくろ(系統)×1｜収納箱(系統)×1","一部の住人が飲み物づくりを手伝ってくれる"],
  ["染め物アトリエ","染料ダル×1｜たらい×2｜カベかけふくろ(系統)×1｜収納箱(系統)×1","一部の住人が染料づくりを手伝ってくれる"],
  ["ビルダールームタイプ5","薬研×1｜キッチンかざり×1｜からっぽ島作業台×1(5段階目)｜カベかけふくろ(系統)×1｜収納箱(系統)×1","素材を入れておくと一部の住人がアイテムを作ってくれる"],
  ["道具屋タイプ1","道具屋のカベかけ×1｜ねふだ×1｜箱(系統)×2｜テーブル(系統)×1","商人が値札にいれたアイテムを売ってくれる"],
  ["武器屋","武器屋のカベかけ×1｜ねふだ×1｜テーブル(系統)×1｜武具(系統)×2","商人が値札にいれたアイテムを売ってくれる"],
  ["受付ロビー","文房具×1｜テーブル(系統)×2｜卓上あかり(系統)×1｜カベかけかざり(系統)×1","効果なし"],
  ["ろうかタイプ1","いけ花×2｜柱(系統)×2｜カベかけかざり(系統)×2｜あかり(系統)×2","効果なし"],
  ["あらくれジム","つるはしかざり×2｜ダンベル×2｜タオル(系統)×2","効果なし"],
  ["マッサージ部屋","ついたて×1｜カーテン(系統)×2｜あかり(系統)×1｜ベッド(系統)×1","エッチなムードにすると住人がバフバフしてくれる"],
  ["教会","女神像×1｜さいだん×1｜卓上あかり(系統)×2｜いす(系統)×4","シスターが集会を開いてくれる"],
  ["作戦会議室","地図×1｜ロトの大テーブル×1｜コマ(系統)×2","一部の住人がたたかいの作戦を考えてくれる"],
  ["まほう研究所","水晶玉×1｜香炉×1｜丸クッション×1｜まほうの作業台×1","一部の住人がアイテムづくりを手伝ってくれる"],
  ["訓練所","木の格子×4｜兵士用マネキン×4｜槍立てラック×2","兵士が体をきたえてくれる"],
  ["玉座の間タイプ1","玉座×1｜タペストリ×4｜かがり火×2","王さまだけが使える部屋"],
  ["壊れた玉座の間","こわれた玉座×1","効果なし"],
  ["ハーゴン教会","邪神の像×1｜邪教のたいまつ×1｜邪教のさいだん×1｜邪教の顔かざり×1｜邪教の大レリーフ×1｜邪教のレリーフ×1","効果なし"],
  ["禁断の錬成部屋","邪神の像×1｜邪教のたいまつ×1｜邪教のさいだん×1｜収納箱(系統)×1｜邪教の花柱×2｜禁断の錬成台×1","一部の住人が錬成を手伝ってくれる"],
  ["あやしい植物園","収納箱(系統)×1｜奇妙な花×4｜奇妙な大花×2","住人がアイテムを収納箱に入れてくれる"],
  ["図書室タイプ1","本だな×3｜つみあげた本×3","効果なし"],
  ["図書館","本だな×5｜メモ×1｜つみあげた本×3｜テーブル(系統)×1｜書籍(系統)×3｜いす(系統)×1","効果なし"],
  ["石像の間タイプ1","うごかないせきぞう×1｜手すり(系統)×3","効果なし"],
  ["展示室","絵画(系統)×2｜手すり(系統)×4","効果なし"],
  ["美術館","展示かんばん×1｜絵画(系統)×4｜彫像(系統)×2｜手すり(系統)×10","効果なし"],
  ["資料室","展示台(系統)×2｜手すり(系統)×4","効果なし"],
  ["博物館","展示かんばん×1｜たなづくりキット×2｜展示台(系統)×5｜手すり(系統)×10","効果なし"],
  ["宝物庫","宝箱×5｜おたから(系統)×1｜展示台(系統)×1｜手すり(系統)×2","効果なし"],
  ["財宝の間タイプ1","宝箱×5｜タペストリ×2｜おたから(系統)×1｜展示台(系統)×1｜手すり(系統)×2｜おたからの山×1","効果なし"],
  ["墓所","ベンチ(系統)×1｜墓(系統)×3｜花(系統)×3","効果なし"],
  ["占いの間","水晶玉×1｜丸クッション×1｜つみあげた本×1｜カーテン(系統)×2｜書籍(系統)×1","効果なし"],
  ["役場タイプ1","住人めいぼ×1｜ベル×1｜かんばん×1｜机(系統)×3","効果なし"],
  ["ミュージックホールタイプ1","楽器(系統)×3｜カーテン(系統)×2｜いす(系統)×1","一部の住人が夜に歌を歌ってくれる"],
  ["ダンスホール","ブロックライト×1｜おどりこのステージ×3｜カーテン(系統)×4","バニーがたまにダンスしてくれる"],
  ["牢屋","ほりょのくさり×1｜ツボ(系統)×1","効果なし"],
  ["ごうもん室","ろうごくベッド×1｜ほりょのくさり×2｜ギロチン×1｜骨(系統)×2","効果なし"],
  ["ぬいぐるみハウス","イエティラグ×1｜ぬいぐるみ(系統)×2｜いす(系統)×1","効果なし"],
  ["スライムルーム","スライムタワー×1｜スライムの目×2｜スライムの口×1｜スライムランプ×1","効果なし"],
  ["ファイアルーム","見はりのかがり火×2｜カベかけトーチ×2｜カベかけたいまつ×2｜かがり火×2｜ベンチ(系統)×1","効果なし"],
  ["ようがんルームタイプ1","小さな石(系統)×3 溶岩×6","効果なし"],
  ["どろんこルーム","沼枯れの木×1｜ガマ草×3 汚水×6","効果なし"],
  ["竜王の間","竜王の玉座×1｜竜王軍のはた×2｜ドラゴンの柱×2","効果なし"],
  ["ハーゴンの間","教団のはた×2｜邪教の花柱×2｜ハーゴンの玉座×1","効果なし"],
  ["ツボだらけの部屋","収納箱(系統)×1｜ツボ(系統)×5","住人がアイテムを収納箱に入れてくれる"],
  ["キノコだらけの部屋","キノコ(系統)×6｜収納箱(系統)×1","住人がキノコを収納箱に入れてくれる"],
  ["すぐに壊れる部屋","まほうの玉×1","効果なし"],
  ["うららか牧場タイプ1","木のフェンス×1｜牧草×5｜つみわら×1","効果なし"],
  ["飼育小屋","どうぶつの寝わら×1｜つみわら×1｜エサ入れ×1","朝になると動物の幸福度が上がる"],
  ["水飲み場","たらい×1｜きれいな水×10｜収納箱(系統)×1｜ツボ(系統)×2","効果なし"],
  ["いどばた広場タイプ1","井戸×1｜ひろばの入り口・木×1｜花(系統)×1","効果なし"],
  ["ブランコ公園","木の足場×2｜ベンチ(系統)×1｜花(系統)×2｜自然のブランコ(カタマリ)×1","効果なし"],
  ["草のはえた部屋","ベンチ(系統)×1｜草(系統)×5","効果なし"],
  ["花のさいている部屋","草(系統)×4｜花(系統)×6","効果なし"],
  ["花の庭園","高級ベンチ×1｜つるバラの葉×1｜つるバラ×1｜しろい花×8｜アジサイ×1","効果なし"],
  ["森の庭園タイプ1","木の枝×2｜ヤシの大木×1｜ベンチ×1｜ブナの大木×1｜スギの大木×1｜シラカバの大木×1","効果なし"],
  ["砂漠の庭園","柱サボテンの頭×2｜柱サボテン×3｜花サボテン×3｜ベンチ×1｜ヒマワリ×1｜グラジオラス×1","効果なし"],
  ["ジャングル庭園","板のベンチ×1｜ラフレシア×1｜マヒ花×5｜ジャングル草×1｜オウギヤシ×1｜ソテツ×1","効果なし"],
  ["石の庭園タイプ1","大きな石×3｜石の足場×2｜石のがれき×1｜小石×5｜ベンチ×1","効果なし"],
  ["水の庭園","高級ベンチ×1｜ハスの葉×1｜ハスの花×1｜きれいな水×10｜ふんすい(系統)×1","効果なし"],
  ["雪の庭園タイプ1","白雪草×3｜雪のスギ木×2｜ベンチ×1｜ゆきだるま×1","効果なし"],
  ["魔物の庭園","板のベンチ×1｜枯れ木×2｜のろい葉のしげみ×3｜ススキ×3｜大地うがつ大牙×2｜まものの床レリーフ×1","効果なし"],
  ["メルキドガーデン","木のはし×1｜桜の木×1｜高級ベンチ×1｜花咲くしげみ×3｜しんぴの花×5｜きれいな水×8","効果なし"],
  ["フライパン調理台","フライパン×1｜たき火×1","2つの食材を使って調理ができる"],
  ["食事テーブル","テーブル(系統)×1｜食器プレート(系統)×1｜いす(系統)×1","効果なし"],
  ["炊き出しテーブルタイプ1","木のテーブル×1｜食器×1｜にこみの大鍋×1","シスターが住人に炊き出しをしてくれる"],
  ["王の食事テーブルタイプ1","しょく台×2｜食器プレート(系統)×4｜王の食卓×1｜高級いす(系統)×4","効果なし"],
  ["フルコースタイプ1","パンとカゴ×1｜かざり飲料(系統)×1｜スープとサラダ×1｜魚料理プレート×1","効果なし"],
  ["温泉タイプ1","水面の花びら×1｜温泉×10","住人がお風呂に入ってくれる"],
  ["プール","はしご×1｜きれいな水×10","住人が水着で泳いでくれる"],
  ["バーセットタイプ1","バーカウンター×1｜シェイカー×1｜いす(系統)×4","バーテンダーが住人に飲み物をふるまってくれる"],
  ["ドリンクテーブル","テーブル(系統)×1｜かざり飲料(系統)×1｜いす(系統)×1","バニーが住人に飲み物を運んできてくれる"],
  ["宴会テーブルタイプ1","かざり飲料(系統)×4｜大きな机(系統)×1｜いす(系統)×4","効果なし"],
  ["ポーカーテーブル","ポーカー×1｜テーブル(系統)×1｜いす(系統)×2","住人がポーカーで遊んでくれる"],
  ["救急セット","木箱×1｜救急キット×1｜いす(系統)×1","兵士がけが人を手当してくれる"],
  ["スターマイン","うちあげ砲台×3","住人が花火を連発してくれる"],
  ["ドラキートーテム","ドラキートーテム(系統)×3","効果なし"],
  ["スライムタワー","スライムタワー(系統)×3","効果なし"],
  ["自然のブランコ","ブランコ×1｜木(系統)×1","効果なし"],
  ["はち植えの花タイプ1","うえきばち×1｜花(系統)×1","効果なし"],
  ["観葉植物タイプ1","うえきばち×1｜草(系統)×1","効果なし"],
  ["駅","トロッコ停止板×1｜線路(系統)×1","トロッコが駅の前に停まるようになる"],
  ["ダーツセット","ダーツボード×3","効果なし"],
  ["ピアノセット","グランドピアノ×1｜いす(系統)×1","住人がピアノを弾いてくれる"],
  ["レストラン","シンプルキッチン×1｜ダイニング×1","地図上にレストランのアイコンが表示される"],
  ["アニマルパーク","飼育小屋×1｜ブランコ公園×1","地図上にアニマルパークのアイコンが表示される"],
  ["ホテル","はじめての寝床×1｜受付ロビー×1","地図上にホテルのアイコンが表示される"],
  ["城","玉座の間×1｜王さまの寝室×1","地図上に城のアイコンが表示される"],
  ["リゾートスパ","ミュージックホール×1｜あったか温泉×1","地図上に温泉のアイコンが表示される。付近のBGMがカジノ風に変わる"],
];

/* ─── Stage 9: Builder's Field Guide interaction layer ─── */
function getRoomMeta(name, effect) {
  if (effect.includes("ベッドで寝") || name.includes("寝") || name.includes("ベッド") || name.includes("布団")) return { category: "SLEEP", accent: "#2f6f91" };
  if (effect.includes("お風呂") || effect.includes("シャワー") || name.includes("風呂") || name.includes("湯") || name.includes("バス") || name.includes("温泉") || name.includes("プール") || effect.includes("泳")) return { category: "BATH / WATER", accent: "#3f88a6" };
  if (effect.includes("調理") || effect.includes("キノコ料理") || effect.includes("調理ができる") || effect.includes("炊き出し")) return { category: "COOK", accent: "#b58a37" };
  if (effect.includes("着替え") || effect.includes("水着") || effect.includes("バスタオル") || effect.includes("バニースーツ")) return { category: "DRESS", accent: "#9b5f7e" };
  if (effect.includes("個室") || effect.includes("住人の部屋")) return { category: "PRIVATE", accent: "#71659c" };
  if (effect.includes("バーテンダー") || effect.includes("飲み物")) return { category: "FOOD / BAR", accent: "#9d6337" };
  if (effect.includes("用をたし")) return { category: "TOILET", accent: "#5f7a52" };
  if (effect.includes("アイテムづくり") || effect.includes("アイテムを作") || effect.includes("錬成") || effect.includes("染料") || effect.includes("飲み物づくり") || effect.includes("収納箱に入れ") || effect.includes("装備")) return { category: "CRAFT", accent: "#7d703e" };
  if (effect.includes("売って")) return { category: "SHOP", accent: "#d96a3a" };
  if (name.includes("庭園") || name.includes("ガーデン") || name.includes("牧場") || name.includes("公園") || name.includes("広場")) return { category: "GARDEN", accent: "#50735b" };
  if (effect === "効果なし" || effect === "効果無し") return { category: "OTHER", accent: "#8a8172" };
  return { category: "SPECIAL", accent: "#184861" };
}

function parseItems(itemStr) {
  return itemStr.split("｜").map(function(part) {
    const match = part.match(/^(.+?)×(\d+)$/) || part.match(/^(.+?)×(\d+)/);
    if (match) return { name: match[1].trim(), count: Number.parseInt(match[2], 10) };
    return { name: part.trim(), count: null };
  }).filter(function(item) { return item.name; });
}

function matchesFilter(room, filter) {
  const [name, , effect] = room;
  if (filter === "all") return true;
  if (filter === "寝る") return effect.includes("ベッドで寝");
  if (filter === "お風呂") return effect.includes("お風呂") || effect.includes("シャワー") || effect.includes("泳") || name.includes("風呂") || name.includes("湯") || name.includes("プール");
  if (filter === "調理") return effect.includes("調理") || effect.includes("キノコ料理") || effect.includes("炊き出し");
  if (filter === "着替え") return effect.includes("着替え") || effect.includes("水着") || effect.includes("バスタオル") || effect.includes("バニースーツ");
  if (filter === "個室") return effect.includes("住人の部屋") || effect.includes("個室");
  if (filter === "バー") return effect.includes("バーテンダー") || effect.includes("飲み物");
  if (filter === "トイレ") return effect.includes("用をたし");
  if (filter === "作る") return effect.includes("アイテムづくり") || effect.includes("アイテムを作") || effect.includes("錬成") || effect.includes("染料") || effect.includes("飲み物づくり") || effect.includes("収納箱に入れ") || effect.includes("装備");
  if (filter === "商人") return effect.includes("売って");
  if (filter === "庭園") return name.includes("庭園") || name.includes("ガーデン") || name.includes("牧場") || name.includes("公園") || name.includes("広場");
  if (filter === "効果なし") return effect === "効果なし" || effect === "効果無し";
  return true;
}

function normalizeText(value) {
  return String(value || "").normalize("NFKC").toLowerCase().trim();
}

let currentFilter = "all";
let currentScope = "all";
let currentSearch = "";
let filtered = [...ROOMS];
let lastTrigger = null;
let toastTimer = null;

function getFiltered() {
  const query = normalizeText(currentSearch);
  return ROOMS.filter(function(room) {
    if (!matchesFilter(room, currentFilter)) return false;
    if (!query) return true;
    const [name, items, effect] = room;
    const fields = currentScope === "name" ? [name]
      : currentScope === "items" ? [items]
      : currentScope === "effect" ? [effect]
      : [name, items, effect];
    return fields.some(function(value) { return normalizeText(value).includes(query); });
  });
}

function getUniqueMaterialCount() {
  const names = new Set();
  ROOMS.forEach(function(room) {
    parseItems(room[1]).forEach(function(item) { names.add(normalizeText(item.name)); });
  });
  return names.size;
}

function createTextElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function updateResultSummary() {
  document.getElementById("visible-count").textContent = filtered.length;
  document.getElementById("result-count").textContent = filtered.length;
  const active = document.querySelector(`.filter-btn[data-filter="${CSS.escape(currentFilter)}"]`);
  const scope = document.querySelector(`.scope-btn[data-scope="${CSS.escape(currentScope)}"]`);
  const parts = [active ? active.textContent : "すべて"];
  if (currentSearch) parts.push(`「${currentSearch}」 / ${scope ? scope.textContent : "すべて"}`);
  document.getElementById("result-context").textContent = parts.join(" · ");
}

function renderGrid() {
  filtered = getFiltered();
  const grid = document.getElementById("room-grid");
  const empty = document.getElementById("empty-state");
  const fragment = document.createDocumentFragment();
  grid.replaceChildren();

  filtered.forEach(function(room) {
    const [name, items, effect] = room;
    const originalIndex = ROOMS.indexOf(room) + 1;
    const meta = getRoomMeta(name, effect);
    const itemCount = parseItems(items).length;
    const hasEffect = effect !== "効果なし" && effect !== "効果無し";
    const li = document.createElement("li");
    li.className = "room-entry";

    const card = document.createElement("button");
    card.type = "button";
    card.className = "room-card";
    card.style.setProperty("--card-accent", meta.accent);
    card.setAttribute("aria-label", `${name}。必要材料${itemCount}種類。詳細を開く`);

    const top = document.createElement("div");
    top.className = "card-topline";
    top.append(createTextElement("span", "card-index", `#${String(originalIndex).padStart(3, "0")}`));
    top.append(createTextElement("span", "card-item-count", `${itemCount} MATERIALS`));
    card.append(top);
    card.append(createTextElement("span", "card-category", meta.category));
    card.append(createTextElement("h3", "card-name", name));
    card.append(createTextElement("p", `card-effect ${hasEffect ? "" : "no-effect"}`.trim(), effect));
    card.addEventListener("click", function() { openModal(room, card); });
    li.append(card);
    fragment.append(li);
  });

  grid.append(fragment);
  empty.classList.toggle("hidden", filtered.length !== 0);
  updateResultSummary();
  syncUrlState();
}

function syncUrlState() {
  const params = new URLSearchParams();
  if (currentSearch) params.set("q", currentSearch);
  if (currentFilter !== "all") params.set("cat", currentFilter);
  if (currentScope !== "all") params.set("scope", currentScope);
  const query = params.toString();
  const next = `${location.pathname}${query ? `?${query}` : ""}${location.hash}`;
  history.replaceState(null, "", next);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function() { toast.classList.remove("show"); }, 1800);
}

async function copyRecipe(room) {
  const [name, itemStr, effect] = room;
  const lines = [name, "", ...parseItems(itemStr).map(function(item) {
    return `・${item.name}${item.count ? ` ×${item.count}` : ""}`;
  }), "", `効果：${effect}`];
  const text = lines.join("\n");
  try {
    await navigator.clipboard.writeText(text);
    showToast("RECIPE COPIED");
  } catch (_) {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast("RECIPE COPIED");
  }
}

function openModal(room, trigger) {
  lastTrigger = trigger || document.activeElement;
  const [name, itemStr, effect] = room;
  const items = parseItems(itemStr);
  const meta = getRoomMeta(name, effect);
  const hasEffect = effect !== "効果なし" && effect !== "効果無し";
  const content = document.getElementById("modal-content");
  content.replaceChildren();

  const header = document.createElement("div");
  header.className = "modal-header";
  const marker = createTextElement("span", "modal-marker", meta.category.split(" ")[0]);
  marker.style.setProperty("--modal-accent", meta.accent);
  const copy = document.createElement("div");
  const title = createTextElement("h2", "modal-title", name);
  title.id = "modal-title-text";
  copy.append(title);
  copy.append(createTextElement("p", `modal-effect ${hasEffect ? "" : "no-effect"}`.trim(), effect));
  header.append(marker, copy);
  content.append(header);

  const actions = document.createElement("div");
  actions.className = "recipe-actions";
  const copyButton = createTextElement("button", "copy-btn", "COPY RECIPE");
  copyButton.type = "button";
  copyButton.addEventListener("click", function() { copyRecipe(room); });
  actions.append(copyButton);
  content.append(actions);

  const section = document.createElement("section");
  section.className = "recipe-section";
  section.append(createTextElement("h3", "", `MATERIAL LIST · ${items.length}`));
  const list = document.createElement("ol");
  list.className = "items-list";
  items.forEach(function(item, index) {
    const li = document.createElement("li");
    li.className = "item-row";
    li.append(createTextElement("span", "item-order", String(index + 1).padStart(2, "0")));
    li.append(createTextElement("span", "item-name", item.name));
    li.append(createTextElement("span", "item-count", item.count ? `×${item.count}` : "—"));
    list.append(li);
  });
  section.append(list);
  content.append(section);

  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("modal");
  overlay.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modal.scrollTop = 0;
  document.getElementById("modal-close").focus();
}

function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("modal");
  if (overlay.classList.contains("hidden")) return;
  overlay.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
}

function trapModalFocus(event) {
  if (event.key !== "Tab") return;
  const modal = document.getElementById("modal");
  if (modal.getAttribute("aria-hidden") === "true") return;
  const focusable = [...modal.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])")]
    .filter(function(node) { return !node.disabled && node.offsetParent !== null; });
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function setPressedState(selector, attribute, value) {
  document.querySelectorAll(selector).forEach(function(button) {
    const active = button.dataset[attribute] === value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function resetSearchState() {
  currentFilter = "all";
  currentScope = "all";
  currentSearch = "";
  const input = document.getElementById("search");
  input.value = "";
  document.getElementById("clear-btn").classList.remove("visible");
  setPressedState(".filter-btn", "filter", currentFilter);
  setPressedState(".scope-btn", "scope", currentScope);
  renderGrid();
  input.focus();
}

function loadStateFromUrl() {
  const params = new URLSearchParams(location.search);
  const filters = [...document.querySelectorAll(".filter-btn")].map(function(button) { return button.dataset.filter; });
  const scopes = [...document.querySelectorAll(".scope-btn")].map(function(button) { return button.dataset.scope; });
  currentSearch = params.get("q") || "";
  currentFilter = filters.includes(params.get("cat")) ? params.get("cat") : "all";
  currentScope = scopes.includes(params.get("scope")) ? params.get("scope") : "all";
  document.getElementById("search").value = currentSearch;
  document.getElementById("clear-btn").classList.toggle("visible", Boolean(currentSearch));
  setPressedState(".filter-btn", "filter", currentFilter);
  setPressedState(".scope-btn", "scope", currentScope);
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("total-count").textContent = ROOMS.length;
  document.getElementById("intro-room-count").textContent = ROOMS.length;
  document.getElementById("material-count").textContent = getUniqueMaterialCount();
  loadStateFromUrl();
  renderGrid();

  const search = document.getElementById("search");
  search.addEventListener("input", function() {
    currentSearch = search.value;
    document.getElementById("clear-btn").classList.toggle("visible", Boolean(currentSearch));
    renderGrid();
  });
  document.getElementById("clear-btn").addEventListener("click", function() {
    currentSearch = "";
    search.value = "";
    document.getElementById("clear-btn").classList.remove("visible");
    renderGrid();
    search.focus();
  });
  document.getElementById("reset-btn").addEventListener("click", resetSearchState);

  document.querySelectorAll(".scope-btn").forEach(function(button) {
    button.addEventListener("click", function() {
      currentScope = button.dataset.scope;
      setPressedState(".scope-btn", "scope", currentScope);
      renderGrid();
    });
  });
  document.querySelectorAll(".filter-btn").forEach(function(button) {
    button.addEventListener("click", function() {
      currentFilter = button.dataset.filter;
      setPressedState(".filter-btn", "filter", currentFilter);
      renderGrid();
    });
  });

  const overlay = document.getElementById("modal-overlay");
  const modal = document.getElementById("modal");
  document.getElementById("modal-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", function(event) {
    if (event.target === overlay) closeModal();
  });
  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") closeModal();
    trapModalFocus(event);
  });

  let startY = 0;
  modal.addEventListener("touchstart", function(event) {
    startY = event.touches[0].clientY;
  }, { passive: true });
  modal.addEventListener("touchend", function(event) {
    const moved = event.changedTouches[0].clientY - startY;
    if (moved > 90 && modal.scrollTop === 0) closeModal();
  }, { passive: true });
});
