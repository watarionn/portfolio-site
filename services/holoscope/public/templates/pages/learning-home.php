<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$learning = $view->data['learning'];
?>
<article class="learning-home">
<header class="learning-hero">
    <p class="eyebrow">LEARN WITH STREAMS</p>
    <h1><?= e($view->heading) ?></h1>
    <p class="lead">一般教材の代わりではなく、実際の配信を理解しながら聞くためのナビゲーションです。</p>
    <p class="learning-disclaimer"><?= e($learning['disclaimer']) ?></p>
    <div class="actions">
        <a class="button" href="/holoscope/learning/streams/">学習向け配信を探す</a>
        <a href="/holoscope/learning/phrases/">フレーズ辞典を見る</a>
        <a href="/holoscope/learning/slang/">スラング辞典を見る</a>
    </div>
    <div class="metric-grid"><div><strong><?= e($learning['evaluatedStreamCount']) ?></strong><span>学習評価済み配信</span></div><div><strong><?= e(count($learning['recentPhrases'])) ?></strong><span>掲載フレーズ</span></div><div><strong><?= e(count($learning['guides'])) ?></strong><span>学習ガイド</span></div></div>
</header>

<section>
    <div class="section-heading"><div><p class="eyebrow">EVALUATION</p><h2>評価軸の読み方</h2></div></div>
    <div class="axis-grid"><?php foreach ($learning['evaluationAxes'] as $axis): ?><article class="axis-card"><h3><?= e($axis['label']) ?></h3><p><?= e($axis['description']) ?></p></article><?php endforeach; ?></div>
</section>

<?php if ($learning['byCefr'] !== []): ?>
<section><div class="section-heading"><div><p class="eyebrow">CEFR GUIDE</p><h2>聞き取り難易度から選ぶ</h2></div><a href="/holoscope/learning/streams/">すべて検索</a></div>
<?php foreach ($learning['byCefr'] as $group): ?><div class="learning-level"><h3><?= e($group['level']) ?> <span><?= e($group['count']) ?>件</span></h3><div class="stream-card-grid"><?php foreach ($group['streams'] as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?></div></div><?php endforeach; ?>
</section>
<?php endif; ?>

<div class="two-column learning-columns">
<?php foreach ([['clearSpeech','発音が明瞭な配信'],['lowOverlap','発話の重なりが少ない配信'],['lowSlang','スラングが少ない配信'],['highContextSupport','文脈を推測しやすい配信']] as [$key,$label]): ?>
<section><div class="section-heading"><h2><?= e($label) ?></h2></div><div class="compact-stream-list"><?php foreach ($learning[$key] as $card): ?><a href="<?= e(stream_url($card)) ?>"><strong><?= e($card['title']) ?></strong><span><?= e($card['primaryMember']['displayName']) ?> · <?= e($card['learning']['cefrLevel']) ?></span></a><?php endforeach; ?></div></section>
<?php endforeach; ?>
</div>

<section><div class="section-heading"><div><p class="eyebrow">PHRASES</p><h2>確認済みフレーズ</h2></div><a href="/holoscope/learning/phrases/">辞典を開く</a></div><div class="phrase-card-grid"><?php foreach ($learning['recentPhrases'] as $item): ?><article class="phrase-card"><p class="phrase-card__meta"><?= e($item['categoryLabel']) ?> · <?= e($item['registerLabel']) ?></p><h3><a href="/holoscope/learning/phrases/<?= e($item['slug']) ?>/"><?= e($item['standardForm']) ?></a></h3><p><?= e($item['meaningJa']) ?></p><small>確認済み <?= e($item['occurrenceCount']) ?>例</small></article><?php endforeach; ?></div></section>

<?php if ($learning['guides'] !== []): ?><section><div class="section-heading"><div><p class="eyebrow">GUIDES</p><h2>英語学習ガイド</h2></div><a href="/holoscope/learning/guides/">一覧</a></div><div class="entity-card-grid"><?php foreach ($learning['guides'] as $item): ?><article class="entity-card"><p class="entity-card__stat"><?= e($item['primaryCategoryLabel']) ?></p><h3><a href="/holoscope/articles/<?= e($item['slug']) ?>/"><?= e($item['title']) ?></a></h3><p><?= e($item['lead']) ?></p></article><?php endforeach; ?></div></section><?php endif; ?>
</article>
