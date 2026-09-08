<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$stream = $view->data['stream'];
$video = $view->data['video'];
$bodyHtml = $view->data['articleBodyHtml'];
$timestampUrl = static fn (int $seconds): string => $stream['originalUrl'] . (str_contains($stream['originalUrl'], '?') ? '&' : '?') . 't=' . $seconds . 's';
?>
<article class="stream-detail">
    <header class="detail-header">
        <p class="eyebrow">STREAM ARCHIVE</p>
        <h1><?= e($view->heading) ?></h1>
        <div class="stream-info-grid" aria-label="配信情報">
            <div><span>配信者</span><a href="/holoscope/members/<?= e($stream['primaryMember']['slug']) ?>/"><?= e($stream['primaryMember']['displayName']) ?></a></div>
            <div><span>公開日</span><strong><?= e(format_date_jp($stream['publishedAt'])) ?></strong></div>
            <div><span>配信時間</span><strong><?= e(format_duration(isset($stream['durationSeconds']) ? (int) $stream['durationSeconds'] : null)) ?></strong></div>
            <div><span>分類</span><strong><?= e($stream['streamType']) ?></strong></div>
        </div>
        <?php if (!empty($stream['games']) || !empty($stream['events']) || !empty($stream['series'])): ?>
            <div class="tag-list">
                <?php foreach ($stream['games'] ?? [] as $item): ?><a href="/holoscope/games/<?= e($item['slug']) ?>/"><?= e($item['name']) ?></a><?php endforeach; ?>
                <?php foreach ($stream['events'] ?? [] as $item): ?><a href="/holoscope/events/<?= e($item['slug']) ?>/"><?= e($item['name']) ?></a><?php endforeach; ?>
                <?php foreach ($stream['series'] ?? [] as $item): ?><a href="/holoscope/series/<?= e($item['slug']) ?>/"><?= e($item['name']) ?></a><?php endforeach; ?>
            </div>
        <?php endif; ?>
    </header>

    <section class="video-section" aria-labelledby="official-video">
        <h2 id="official-video">公式動画</h2>
        <?php if ($video['embedAllowed']): ?>
            <div class="video-frame"><iframe src="<?= e($video['embedUrl']) ?>" title="<?= e($stream['originalTitle'] ?? $stream['title']) ?>" loading="lazy" allowfullscreen></iframe></div>
            <p><a href="<?= e($stream['originalUrl']) ?>" rel="noopener noreferrer">YouTubeで元配信を開く</a></p>
        <?php else: ?>
            <div class="status-notice"><p><?= e($video['statusMessage']) ?></p></div>
        <?php endif; ?>
    </section>

    <section class="article-lead">
        <p class="lead"><?= e($stream['lead']) ?></p>
        <div class="one-line-summary"><span>一文要約</span><p><?= e($stream['summaryOneLine']) ?></p></div>
        <?php if ($stream['keyPoints'] !== []): ?>
            <div class="key-points"><h2>この配信の要点</h2><ol><?php foreach ($stream['keyPoints'] as $point): ?><li><?= e($point) ?></li><?php endforeach; ?></ol></div>
        <?php endif; ?>
    </section>

    <section class="article-body prose"><?= $bodyHtml ?></section>

    <?php if ($stream['highlights'] !== []): ?>
    <section><h2>見どころ</h2><div class="highlight-grid">
        <?php foreach ($stream['highlights'] as $highlight): ?>
            <article class="highlight-card"><p class="timestamp">
                <?php if ($video['timestampAllowed']): ?><a href="<?= e($timestampUrl((int) $highlight['timestampSeconds'])) ?>" rel="noopener noreferrer"><?= e(format_timestamp((int) $highlight['timestampSeconds'])) ?></a>
                <?php else: ?><span><?= e(format_timestamp((int) $highlight['timestampSeconds'])) ?></span><?php endif; ?>
            </p><h3><?= e($highlight['title']) ?></h3><p><?= e($highlight['description']) ?></p></article>
        <?php endforeach; ?>
    </div></section>
    <?php endif; ?>

    <?php if ($stream['timeline'] !== []): ?>
    <section><h2>タイムライン</h2><ol class="timeline">
        <?php foreach ($stream['timeline'] as $item): ?><li><span class="timestamp">
            <?php if ($video['timestampAllowed']): ?><a href="<?= e($timestampUrl((int) $item['timestampSeconds'])) ?>" rel="noopener noreferrer"><?= e(format_timestamp((int) $item['timestampSeconds'])) ?></a>
            <?php else: ?><?= e(format_timestamp((int) $item['timestampSeconds'])) ?><?php endif; ?>
        </span><p><?= e($item['text']) ?></p></li><?php endforeach; ?>
    </ol></section>
    <?php endif; ?>

    <?php if (!empty($stream['result']) || !empty($stream['continuation'])): ?>
    <section><h2>結果・次回へ続く内容</h2>
        <?php if (!empty($stream['result'])): ?><h3>今回の結果</h3><p><?= e($stream['result']) ?></p><?php endif; ?>
        <?php if (!empty($stream['continuation'])): ?><h3>次回へ続く内容</h3><p><?= e($stream['continuation']) ?></p><?php endif; ?>
    </section>
    <?php endif; ?>

    <?php if (!empty($stream['learningPoints'])): ?>
    <section><h2>英語学習ポイント</h2><div class="learning-grid">
        <?php foreach ($stream['learningPoints'] as $point): ?><article><p class="expression"><?= e($point['expression']) ?></p><p><?= e($point['meaningJa']) ?></p><p class="timestamp"><?= e(format_timestamp((int) $point['timestampSeconds'])) ?></p></article><?php endforeach; ?>
    </div></section>
    <?php endif; ?>

    <?php if (!empty($stream['conclusion'])): ?><section><h2>まとめ</h2><p><?= e($stream['conclusion']) ?></p></section><?php endif; ?>

    <section class="article-info"><h2>記事情報</h2><dl>
        <div><dt>元配信</dt><dd><a href="<?= e($stream['articleInfo']['originalStream']) ?>" rel="noopener noreferrer">YouTubeで確認</a></dd></div>
        <div><dt>配信公開日</dt><dd><?= e(format_date_jp($stream['articleInfo']['streamPublishedAt'])) ?></dd></div>
        <div><dt>記事公開日</dt><dd><?= e(format_date_jp($stream['articleInfo']['articlePublishedAt'])) ?></dd></div>
        <div><dt>記事最終更新日</dt><dd><?= e(format_date_jp($stream['articleInfo']['articleUpdatedAt'])) ?></dd></div>
    </dl></section>

    <?php if ($stream['relatedStreams'] !== []): ?><section><h2>関連配信</h2><div class="stream-card-grid">
        <?php foreach ($stream['relatedStreams'] as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?>
    </div></section><?php endif; ?>
</article>
