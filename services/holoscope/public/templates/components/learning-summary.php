<?php
/** @var array<string, mixed> $learning */
require_once dirname(__DIR__) . '/helpers.php';
?>
<div class="metric-grid metric-grid--four">
    <div><strong><?= e($learning['evaluatedStreams'] ?? 0) ?></strong><span>評価済み配信</span></div>
    <div><strong><?= e($learning['averageSpeechSpeedWpm'] ?? '—') ?></strong><span>平均話速 WPM</span></div>
    <div><strong><?= e($learning['averagePronunciationClarity'] ?? '—') ?></strong><span>発音明瞭度</span></div>
    <div><strong><?= e($learning['averageSlangScore'] ?? '—') ?></strong><span>スラング指標</span></div>
</div>
<?php if (!empty($learning['cefrDistribution'])): ?>
<div class="tag-list" aria-label="CEFR分布">
<?php foreach ($learning['cefrDistribution'] as $level): ?><span><?= e($level['level']) ?>: <?= e($level['count']) ?>件</span><?php endforeach; ?>
</div>
<?php else: ?><p class="notice">英語学習評価はまだありません。</p><?php endif; ?>
