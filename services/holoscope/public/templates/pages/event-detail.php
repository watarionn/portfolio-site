<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$entity = $view->data['entity'];
?>
<article class="member-detail discovery-detail">
<header class="detail-header">
    <p class="eyebrow">EVENT</p>
    <p class="event-type-badge"><?= e($entity['eventTypeLabel']) ?></p>
    <h1><?= e($entity['name']) ?></h1>
    <p class="lead"><?= e($entity['summary'] ?? '') ?></p>
    <div class="event-period"><span>開催期間</span><strong><?= e(format_date_jp($entity['startsAt'] ?? null)) ?><?php if (!empty($entity['endsAt'])): ?> 〜 <?= e(format_date_jp($entity['endsAt'])) ?><?php endif; ?></strong></div>
    <div class="metric-grid"><div><strong><?= e($entity['participantCount'] ?? 0) ?></strong><span>登録参加者</span></div><div><strong><?= e($entity['streamCount'] ?? 0) ?></strong><span>公開配信視点</span></div><div><strong><?= e($entity['learningProfile']['evaluatedStreams'] ?? 0) ?></strong><span>学習評価済み</span></div></div>
    <div class="actions"><a class="button" href="/holoscope<?= e($entity['streamSearchUrl']) ?>">この企画の配信を検索</a></div>
</header>
<section><h2>参加メンバー</h2><div class="member-card-grid"><?php foreach ($entity['participants'] as $member): ?><article class="member-card"><h3><a href="/holoscope/members/<?= e($member['slug']) ?>/"><?= e($member['displayName']) ?></a></h3><?php if (!empty($member['role'])): ?><p class="entity-card__meta"><?= e($member['role']) ?></p><?php endif; ?></article><?php endforeach; ?></div></section>
<section><div class="section-heading"><h2>公開配信視点</h2><a href="/holoscope<?= e($entity['streamSearchUrl']) ?>">すべて見る</a></div><div class="stream-card-grid"><?php foreach ($entity['streams'] as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?></div></section>
<?php if ($entity['rules'] !== [] || !empty($entity['result'])): ?><section><div class="two-column"><div><h2>ルール・前提</h2><?php if ($entity['rules'] !== []): ?><ul class="plain-check-list"><?php foreach ($entity['rules'] as $rule): ?><li><?= e($rule) ?></li><?php endforeach; ?></ul><?php else: ?><p>公開されたルール情報はありません。</p><?php endif; ?></div><div><h2>結果</h2><p><?= e($entity['result'] ?? '公開された結果情報はありません。') ?></p></div></div></section><?php endif; ?>
<section><h2>関連データ</h2><div class="two-column"><div><h3>ゲーム</h3><ol class="rank-list"><?php foreach ($entity['topGames'] as $item): ?><li><a href="/holoscope/games/<?= e($item['slug']) ?>/"><?= e($item['name']) ?></a><strong><?= e($item['streamCount']) ?>視点</strong></li><?php endforeach; ?></ol></div><div><h3>シリーズ</h3><ol class="rank-list"><?php foreach ($entity['relatedSeries'] as $item): ?><li><a href="/holoscope/series/<?= e($item['slug']) ?>/"><?= e($item['name']) ?></a><strong><?= e($item['streamCount']) ?>件</strong></li><?php endforeach; ?></ol></div></div></section>
<section><h2>英語学習プロフィール</h2><?php $learning = $entity['learningProfile']; require dirname(__DIR__) . '/components/learning-summary.php'; ?></section>
<section><h2>関連特集</h2><?php $articles = $entity['relatedArticles']; require dirname(__DIR__) . '/components/related-articles.php'; ?></section>
</article>
