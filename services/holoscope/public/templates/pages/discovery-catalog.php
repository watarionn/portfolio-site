<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$index = $view->data['index'];
$collection = $view->data['collection'];
?>
<section class="search-header discovery-header">
    <p class="eyebrow">DISCOVERY DATABASE</p>
    <h1><?= e($view->heading) ?></h1>
    <p class="lead"><?= e($view->data['description']) ?></p>
    <p><?= e($index['count']) ?>件を公開中</p>
</section>
<?php if ($index['items'] === []): ?>
<p class="notice">公開データはまだ登録されていません。</p>
<?php else: ?>
<div class="entity-card-grid catalog-grid">
<?php foreach ($index['items'] as $item):
    $title = $item['nameJa'] ?? $item['name'] ?? $item['title'] ?? $item['slug'] ?? '';
?>
<article class="entity-card entity-card--catalog">
    <?php if ($collection === 'generations'): ?>
        <p class="entity-card__stat"><?= e($item['activeMemberCount'] ?? 0) ?>人が活動中 · <?= e($item['streamCount'] ?? 0) ?>配信</p>
    <?php elseif ($collection === 'games'): ?>
        <p class="entity-card__stat"><?= e($item['streamCount'] ?? 0) ?>配信 · <?= e($item['memberCount'] ?? 0) ?>メンバー</p>
    <?php elseif ($collection === 'events'): ?>
        <p class="entity-card__stat"><?= e($item['eventTypeLabel'] ?? '') ?> · <?= e($item['streamCount'] ?? 0) ?>視点</p>
    <?php else: ?>
        <p class="entity-card__stat"><?= e($item['episodeCount'] ?? 0) ?>話 · <?= e($item['memberCount'] ?? 0) ?>メンバー</p>
    <?php endif; ?>
    <h2><a href="/holoscope/<?= e($collection) ?>/<?= e($item['slug']) ?>/"><?= e($title) ?></a></h2>
    <?php if (!empty($item['nameEn']) && $item['nameEn'] !== $title): ?><p class="entity-card__meta"><?= e($item['nameEn']) ?></p><?php endif; ?>
    <?php if (!empty($item['summary'])): ?><p><?= e($item['summary']) ?></p><?php endif; ?>
    <?php if ($collection === 'generations' && !empty($item['members'])): ?><p class="entity-card__meta"><?= e(implode(' / ', $item['members'])) ?></p><?php endif; ?>
    <?php if ($collection === 'events' && !empty($item['startsAt'])): ?><p class="entity-card__meta"><?= e(format_date_jp($item['startsAt'])) ?></p><?php endif; ?>
    <?php if ($collection === 'series' && !empty($item['progress'])): ?><p class="entity-card__meta">進捗: <?= e($item['progress']) ?></p><?php endif; ?>
</article>
<?php endforeach; ?>
</div>
<?php endif; ?>
