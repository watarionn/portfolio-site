<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$article = $view->data['article'];
$linkForEntity = static function (string $type, string $slug): string {
    return match ($type) {
        'member' => '/holoscope/members/' . rawurlencode($slug) . '/',
        'game' => '/holoscope/games/' . rawurlencode($slug) . '/',
        'event' => '/holoscope/events/' . rawurlencode($slug) . '/',
        'series' => '/holoscope/series/' . rawurlencode($slug) . '/',
        'phrase' => '/holoscope/learning/phrases/' . rawurlencode($slug) . '/',
        default => '#',
    };
};
?>
<article class="feature-detail">
<header class="detail-header feature-detail__header">
    <p class="eyebrow"><?= e($article['primaryCategoryLabel']) ?></p>
    <h1><?= e($article['title']) ?></h1>
    <p class="lead"><?= e($article['lead']) ?></p>
    <dl class="feature-article-info"><div><dt>主カテゴリ</dt><dd><?= e($article['primaryCategoryLabel']) ?></dd></div><div><dt>公開日</dt><dd><?= e(format_date_jp($article['articleInfo']['publishedAt'] ?? null)) ?></dd></div><div><dt>最終更新日</dt><dd><?= e(format_date_jp($article['articleInfo']['updatedAt'] ?? null)) ?></dd></div></dl>
</header>

<section class="feature-summary-grid">
<div><h2>この記事で分かること</h2><ul><?php foreach ($article['whatYouWillLearn'] as $item): ?><li><?= e($item) ?></li><?php endforeach; ?></ul></div>
<div><h2>対象読者</h2><p><?= e($article['targetAudience']) ?></p></div>
</section>

<?php if ($article['tableOfContents'] !== []): ?><nav class="table-of-contents" aria-label="目次"><h2>目次</h2><ol><?php foreach ($article['tableOfContents'] as $item): ?><li><a href="#<?= e($item['anchor']) ?>"><?= e($item['label']) ?></a></li><?php endforeach; ?></ol></nav><?php endif; ?>

<div class="feature-body prose">
<?php foreach ($article['bodyBlocks'] as $block): ?>
    <?php if ($block['type'] === 'heading'): ?>
        <?php if ((int) $block['level'] === 3): ?><h3 id="<?= e($block['anchor']) ?>"><?= e($block['text']) ?></h3><?php else: ?><h2 id="<?= e($block['anchor']) ?>"><?= e($block['text']) ?></h2><?php endif; ?>
    <?php elseif ($block['type'] === 'paragraph'): ?><p><?= $block['html'] ?></p>
    <?php elseif ($block['type'] === 'list'): ?><ul><?php foreach ($block['itemsHtml'] as $html): ?><li><?= $html ?></li><?php endforeach; ?></ul>
    <?php elseif ($block['type'] === 'embed'): $kind=(string)$block['kind']; $item=$block['item']; ?>
        <?php if ($kind === 'stream'): $card=$item; ?><div class="feature-embed feature-embed--stream"><?php require dirname(__DIR__) . '/components/stream-card.php'; ?></div>
        <?php else: ?><aside class="feature-embed"><p class="feature-embed__kind"><?= e(match($kind){'member'=>'メンバー','game'=>'ゲーム','event'=>'企画','series'=>'シリーズ','phrase'=>'フレーズ',default=>'関連項目'}) ?></p><h3><a href="<?= e($linkForEntity($kind,(string)$item['slug'])) ?>"><?= e($item['name']) ?></a></h3><p><?= e($item['summary'] ?? '') ?></p></aside><?php endif; ?>
    <?php endif; ?>
<?php endforeach; ?>
</div>

<section class="feature-conclusion"><h2>まとめ</h2><p><?= e($article['conclusion']) ?></p></section>

<?php if ($article['relatedStreams'] !== []): ?><section><h2>関連する配信</h2><div class="stream-card-grid"><?php foreach ($article['relatedStreams'] as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?></div></section><?php endif; ?>
<?php if ($article['relatedEntities'] !== []): ?><section><h2>関連する項目</h2><div class="entity-card-grid"><?php foreach ($article['relatedEntities'] as $item): ?><article class="entity-card"><p class="entity-card__stat"><?= e($item['type']) ?></p><h3><a href="<?= e($linkForEntity((string)$item['type'],(string)$item['slug'])) ?>"><?= e($item['name']) ?></a></h3><p><?= e($item['summary'] ?? '') ?></p></article><?php endforeach; ?></div></section><?php endif; ?>
<?php if ($article['relatedArticles'] !== []): ?><section><h2>関連する特集記事</h2><div class="feature-card-grid"><?php foreach ($article['relatedArticles'] as $item): ?><article class="feature-card"><h3><a href="/holoscope/articles/<?= e($item['slug']) ?>/"><?= e($item['title']) ?></a></h3><p><?= e($item['lead']) ?></p></article><?php endforeach; ?></div></section><?php endif; ?>

<?php if ($article['sources'] !== []): ?><section class="source-list"><h2>出典</h2><ol><?php foreach ($article['sources'] as $source): ?><li><a href="<?= e($source['url']) ?>" rel="noopener noreferrer"><?= e($source['label']) ?></a><?php if (!empty($source['checkedAt'])): ?>（確認日: <?= e(format_date_jp($source['checkedAt'])) ?>）<?php endif; ?></li><?php endforeach; ?></ol></section><?php endif; ?>
</article>
