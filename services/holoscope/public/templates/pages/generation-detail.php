<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$entity = $view->data['entity'];
?>
<article class="member-detail discovery-detail">
<header class="detail-header">
    <p class="eyebrow">GENERATION</p>
    <h1><?= e($entity['nameJa']) ?></h1>
    <?php if (!empty($entity['nameEn']) && $entity['nameEn'] !== $entity['nameJa']): ?><p class="member-name-ja"><?= e($entity['nameEn']) ?></p><?php endif; ?>
    <p class="lead"><?= e($entity['summary'] ?? '') ?></p>
    <div class="metric-grid">
        <div><strong><?= e($entity['activeMemberCount'] ?? 0) ?></strong><span>活動中メンバー</span></div>
        <div><strong><?= e($entity['memberCount'] ?? 0) ?></strong><span>登録メンバー</span></div>
        <div><strong><?= e($entity['streamCount'] ?? 0) ?></strong><span>公開配信記事</span></div>
    </div>
    <div class="actions"><a class="button" href="/holoscope<?= e($entity['streamSearchUrl']) ?>">この世代の配信を検索</a></div>
</header>
<section><div class="section-heading"><h2>所属メンバー</h2><a href="/holoscope/members/">全メンバー</a></div><div class="member-card-grid">
<?php foreach ($entity['members'] as $member): ?><article class="member-card"><p class="status-pill status-pill--<?= e($member['activityStatus']) ?>"><?= e($member['activityStatus']) ?></p><h3><a href="/holoscope/members/<?= e($member['slug']) ?>/"><?= e($member['displayName']) ?></a></h3><?php if (!empty($member['nameJa'])): ?><p class="entity-card__meta"><?= e($member['nameJa']) ?></p><?php endif; ?><p><?= e($member['summary'] ?? '') ?></p></article><?php endforeach; ?>
</div></section>
<?php if ($entity['beginnerRecommendations'] !== []): ?><section><div class="section-heading"><h2>初めて見る人向け</h2><p>メンバー別の初心者向け指定から選出</p></div><div class="stream-card-grid"><?php foreach ($entity['beginnerRecommendations'] as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?></div></section><?php endif; ?>
<section><div class="section-heading"><h2>最新の配信</h2><a href="/holoscope<?= e($entity['streamSearchUrl']) ?>">すべて見る</a></div><div class="stream-card-grid"><?php foreach ($entity['latestStreams'] as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?></div></section>
<section><h2>配信傾向</h2><div class="two-column"><div><h3>配信分類</h3><ol class="rank-list"><?php foreach ($entity['streamTypes'] as $item): ?><li><span><?= e($item['label']) ?></span><strong><?= e($item['count']) ?>件</strong></li><?php endforeach; ?></ol></div><div><h3>主なゲーム</h3><ol class="rank-list"><?php foreach ($entity['topGames'] as $item): ?><li><a href="/holoscope/games/<?= e($item['slug']) ?>/"><?= e($item['name']) ?></a><strong><?= e($item['streamCount']) ?>件</strong></li><?php endforeach; ?></ol></div></div><?php if ($entity['topSeries'] !== []): ?><h3>主なシリーズ</h3><div class="tag-list"><?php foreach ($entity['topSeries'] as $item): ?><a href="/holoscope/series/<?= e($item['slug']) ?>/"><?= e($item['name']) ?>（<?= e($item['streamCount']) ?>）</a><?php endforeach; ?></div><?php endif; ?></section>
<section><h2>英語学習プロフィール</h2><?php $learning = $entity['learningProfile']; require dirname(__DIR__) . '/components/learning-summary.php'; ?></section>
<section><h2>関連特集</h2><?php $articles = $entity['relatedArticles']; require dirname(__DIR__) . '/components/related-articles.php'; ?></section>
</article>
