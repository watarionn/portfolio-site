<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$search=$view->data['search']; $criteria=$search['criteria']; $options=$search['options']; $action='/holoscope/learning/streams/';
$select=static function(string $name,string $label,array $items,string $selected):void { ?><label><span><?= e($label) ?></span><select name="<?= e($name) ?>"><option value="">すべて</option><?php foreach($items as $item): ?><option value="<?= e($item['value']) ?>"<?= $selected===$item['value']?' selected':'' ?>><?= e($item['label']) ?></option><?php endforeach; ?></select></label><?php };
?>
<section class="search-header learning-search-header"><p class="eyebrow">LEARNING STREAM SEARCH</p><h1><?= e($view->heading) ?></h1><p>公開済みの学習評価がある配信だけを検索します。CEFRは配信者の能力ではなく、視聴者にとっての聞き取り難易度目安です。</p></section>
<form class="search-form" method="get" action="<?= e($action) ?>">
<label class="keyword-field"><span>キーワード</span><input type="search" name="q" value="<?= e($criteria->keyword) ?>" maxlength="100" placeholder="配信名・ゲーム・内容"></label>
<div class="filter-grid">
<?php $select('member','メンバー',$options['member']??[],$criteria->member); ?>
<?php $select('type','配信分類',$options['type']??[],$criteria->type); ?>
<?php $select('speed','話す速度',$options['speed']??[],$criteria->speed); ?>
<?php $select('clarity','発音の明瞭さ',$options['clarity']??[],$criteria->clarity); ?>
<?php $select('overlap','発話の重なり',$options['overlap']??[],$criteria->overlap); ?>
<?php $select('slang','スラング量',$options['slang']??[],$criteria->slang); ?>
<?php $select('context','文脈推測',$options['context']??[],$criteria->context); ?>
</div>
<fieldset class="cefr-filter"><legend>CEFR（複数選択はOR）</legend><?php foreach($options['cefr']??[] as $item): ?><label><input type="checkbox" name="cefr[]" value="<?= e($item['value']) ?>"<?= in_array($item['value'],$criteria->cefr,true)?' checked':'' ?>> <?= e($item['label']) ?></label><?php endforeach; ?></fieldset>
<div class="form-actions"><button class="button" type="submit">検索する</button><a href="<?= e($action) ?>">条件をクリア</a></div>
</form>
<section class="search-results"><div class="result-heading"><h2>検索結果</h2><p><?= e($search['total']) ?>件 · <?= e($search['page']) ?>/<?= e($search['pageCount']) ?>ページ</p></div>
<?php if($search['cards']===[]): ?><p class="notice">条件に一致する学習評価済み配信はありません。</p><?php else: ?><div class="learning-stream-grid"><?php foreach($search['cards'] as $card): $l=$card['learning']; ?><article class="learning-stream-card"><a class="stream-card__image" href="<?= e(stream_url($card)) ?>"><img src="<?= e($card['thumbnailUrl']) ?>" alt="" loading="lazy"></a><div class="learning-stream-card__body"><p class="phrase-card__meta"><?= e($l['cefrLevel']) ?> · <?= e($card['primaryMember']['displayName']) ?></p><h3><a href="<?= e(stream_url($card)) ?>"><?= e($card['title']) ?></a></h3><p><?= e($card['summaryOneLine']) ?></p><dl class="learning-metrics"><div><dt>速度</dt><dd><?= e($l['speechSpeedWpm'] ?? '不明') ?> WPM</dd></div><div><dt>明瞭さ</dt><dd><?= e($l['pronunciationClarityScore'] ?? '不明') ?></dd></div><div><dt>重なり</dt><dd><?= e($l['overlapScore'] ?? '不明') ?></dd></div><div><dt>スラング</dt><dd><?= e($l['slangScore'] ?? '不明') ?></dd></div><div><dt>文脈支援</dt><dd><?= e($l['contextSupportScore'] ?? '不明') ?></dd></div></dl></div></article><?php endforeach; ?></div><?php endif; ?>
<?php if($search['pageCount']>1): ?><nav class="pagination" aria-label="検索結果ページ"><?php if($search['page']>1): $q=$criteria->queryParameters(false);$q['page']=(string)($search['page']-1);?><a rel="prev" href="<?= e(query_url($action,$q)) ?>">前のページ</a><?php endif; ?><span><?= e($search['page']) ?> / <?= e($search['pageCount']) ?></span><?php if($search['page']<$search['pageCount']):$q=$criteria->queryParameters(false);$q['page']=(string)($search['page']+1);?><a rel="next" href="<?= e(query_url($action,$q)) ?>">次のページ</a><?php endif; ?></nav><?php endif; ?>
</section>
