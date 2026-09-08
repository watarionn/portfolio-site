<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$stats = $view->data['stats'];
?>
<section class="detail-header"><h1><?= e($view->heading) ?></h1><p class="lead"><?= e($stats['note']) ?></p></section>
<p class="notice">CEFRと各評価軸は、配信者本人の能力ではなく、視聴者が配信を聞く際の難易度目安です。</p>
<?php if ($stats['status'] === 'insufficient_data'): ?>
<section class="empty-state"><h2>集計値はまだ公開していません</h2><p>評価済み配信は<?= e((string)$stats['evaluatedStreamCount']) ?>件です。平均値の公開には<?= e((string)$stats['minimumRequired']) ?>件以上が必要です。</p></section>
<?php else: ?>
<section><h2>評価軸の平均</h2><div class="stats-kpi-grid">
<?php foreach ($stats['averages'] as $key=>$value): ?><article class="stats-kpi"><p><?= e($key) ?></p><strong><?= e((string)$value) ?></strong></article><?php endforeach; ?>
</div></section>
<section><h2>CEFR目安の分布</h2><div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>目安</th><th>件数</th></tr></thead><tbody><?php foreach ($stats['cefrDistribution'] as $item): ?><tr><td><?= e($item['level']) ?></td><td><?= e((string)$item['count']) ?></td></tr><?php endforeach; ?></tbody></table></div></section>
<?php endif; ?>
