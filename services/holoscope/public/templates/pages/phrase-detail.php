<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$entity = $view->data['entity'];
$collection = $view->data['collection'];
$isSlang = $collection === 'slang';
?>
<article class="phrase-detail">
<header class="detail-header phrase-detail__header">
    <p class="eyebrow"><?= $isSlang ? 'SLANG ENTRY' : 'PHRASE ENTRY' ?></p>
    <h1><?= e($entity['standardForm']) ?></h1>
    <p class="lead"><?= e($entity['meaningJa']) ?></p>
    <div class="tag-list">
        <span><?= e($entity['categoryLabel'] ?? $entity['category']) ?></span>
        <span><?= e($entity['registerLabel'] ?? $entity['register']) ?></span>
        <span>確認済み <?= e(count($entity['occurrences'])) ?>例</span>
    </div>
</header>

<section>
    <h2>意味とニュアンス</h2>
    <p><?= e($entity['nuanceJa']) ?></p>
    <?php if (($entity['variants'] ?? []) !== []): ?><p><strong>表記・形の違い:</strong> <?= e(implode(' / ', $entity['variants'])) ?></p><?php endif; ?>
</section>

<?php if ($isSlang): ?>
<section>
    <h2>使う前に確認すること</h2>
    <dl class="safety-metadata">
        <div><dt>丁寧さ</dt><dd><?= e($entity['politenessLabel'] ?? $entity['politeness']) ?></dd></div>
        <div><dt>攻撃性</dt><dd><?= e($entity['aggressivenessLabel'] ?? $entity['aggressiveness']) ?></dd></div>
        <div><dt>現在性</dt><dd><?= e($entity['currencyLabel'] ?? $entity['currency']) ?></dd></div>
    </dl>
    <?php if (!empty($entity['cautionJa'])): ?><p class="notice"><?= e($entity['cautionJa']) ?></p><?php endif; ?>
</section>
<?php endif; ?>

<section>
    <h2>配信内の確認済み使用例</h2>
    <div class="occurrence-list">
    <?php foreach ($entity['occurrences'] as $occurrence): ?>
        <article class="occurrence-card">
            <div class="occurrence-card__meta">
                <a href="/holoscope/members/<?= e($occurrence['speakerSlug']) ?>/"><?= e($occurrence['speakerName']) ?></a>
                <span><?= e(format_timestamp((int) $occurrence['timestampSeconds'])) ?></span>
            </div>
            <blockquote lang="en"><?= e($occurrence['originalText']) ?></blockquote>
            <p><strong>日本語:</strong> <?= e($occurrence['translationJa']) ?></p>
            <p><strong>場面:</strong> <?= e($occurrence['contextJa']) ?></p>
            <p class="occurrence-card__source">
                <a href="/holoscope/streams/<?= e($occurrence['streamSlug']) ?>/"><?= e($occurrence['streamTitle']) ?></a>
                <?php if (!empty($occurrence['timestampAllowed']) && !empty($occurrence['timestampUrl'])): ?>
                    · <a href="<?= e($occurrence['timestampUrl']) ?>" rel="noopener noreferrer">元配信の該当時刻を開く</a>
                <?php else: ?>
                    · <span>元動画の時刻リンクは利用できません</span>
                <?php endif; ?>
            </p>
        </article>
    <?php endforeach; ?>
    </div>
</section>

<?php if (($entity['relatedPhrases'] ?? []) !== []): ?>
<section><h2>関連する表現</h2><div class="phrase-card-grid">
<?php foreach ($entity['relatedPhrases'] as $item): ?><article class="phrase-card"><h3><a href="/holoscope/learning/phrases/<?= e($item['slug']) ?>/"><?= e($item['standardForm']) ?></a></h3><p><?= e($item['meaningJa']) ?></p></article><?php endforeach; ?>
</div></section>
<?php endif; ?>

<section class="article-information"><h2>項目情報</h2><dl><div><dt>公開日</dt><dd><?= e(format_date_jp($entity['publishedAt'] ?? null)) ?></dd></div><div><dt>最終更新日</dt><dd><?= e(format_date_jp($entity['updatedAt'] ?? null)) ?></dd></div></dl></section>
</article>
