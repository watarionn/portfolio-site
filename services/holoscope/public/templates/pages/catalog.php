<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$index = $view->data['index'];
$collection = $view->data['collection'];
?>
<section class="page-header">
    <p class="eyebrow">CATALOG</p>
    <h1><?= e($view->heading) ?></h1>
    <p>登録件数: <?= e($index['totalCount'] ?? $index['count']) ?>件</p>
</section>
<?php if ($index['items'] === []): ?>
    <p class="notice">公開データはまだ登録されていません。</p>
<?php else: ?>
    <div class="card-grid">
    <?php foreach ($index['items'] as $item):
        $label = $item['title'] ?? $item['displayName'] ?? $item['name'] ?? $item['slug'] ?? '';
        $slug = $item['slug'] ?? '';
    ?>
        <article class="card">
            <h2><?php if ($slug !== ''): ?><a href="/holoscope/<?= e($collection) ?>/<?= e($slug) ?>/"><?= e($label) ?></a><?php else: ?><?= e($label) ?><?php endif; ?></h2>
            <?php if (isset($item['summaryOneLine'])): ?><p><?= e($item['summaryOneLine']) ?></p><?php endif; ?>
            <?php if (isset($item['summary'])): ?><p><?= e($item['summary']) ?></p><?php endif; ?>
        </article>
    <?php endforeach; ?>
    </div>
<?php endif; ?>
