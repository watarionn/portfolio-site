<?php
/** @var array<string, mixed> $card */
require_once dirname(__DIR__) . '/helpers.php';
?>
<article class="stream-card">
    <?php if (!empty($card['thumbnailUrl'])): ?>
        <a class="stream-card__image" href="<?= e(stream_url($card)) ?>" tabindex="-1" aria-hidden="true">
            <img src="<?= e($card['thumbnailUrl']) ?>" alt="" loading="lazy" width="640" height="360">
        </a>
    <?php endif; ?>
    <div class="stream-card__body">
        <p class="stream-card__meta"><?= e(format_stream_date_jp($card['publishedAt'] ?? null)) ?> · <?= e(format_duration(isset($card['durationSeconds']) ? (int) $card['durationSeconds'] : null)) ?></p>
        <h3><a href="<?= e(stream_url($card)) ?>"><?= e($card['title'] ?? '') ?></a></h3>
        <?php if (!empty($card['summaryOneLine'])): ?><p><?= e($card['summaryOneLine']) ?></p><?php endif; ?>
        <?php if (isset($card['primaryMember']['displayName'])): ?>
            <p class="stream-card__member"><a href="/holoscope/members/<?= e($card['primaryMember']['slug']) ?>/"><?= e($card['primaryMember']['displayName']) ?></a></p>
        <?php endif; ?>
        <?php if (!empty($card['reason'])): ?><p class="relation-reason"><?= e($card['reason']) ?></p><?php endif; ?>
    </div>
</article>
