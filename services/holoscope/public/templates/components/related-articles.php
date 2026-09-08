<?php
/** @var list<array<string, mixed>> $articles */
require_once dirname(__DIR__) . '/helpers.php';
?>
<?php if ($articles !== []): ?>
<div class="entity-card-grid">
<?php foreach ($articles as $article): ?>
<article class="entity-card"><p class="entity-card__stat"><?= e($article['primaryCategory'] ?? 'feature') ?></p><h3><a href="/holoscope/articles/<?= e($article['slug']) ?>/"><?= e($article['title']) ?></a></h3><p><?= e($article['lead'] ?? '') ?></p></article>
<?php endforeach; ?>
</div>
<?php else: ?><p class="notice">関連する公開特集はまだありません。</p><?php endif; ?>
