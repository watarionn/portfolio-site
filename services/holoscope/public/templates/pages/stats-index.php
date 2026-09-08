<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$stats = $view->data['stats'];
?>
<section class="detail-header stats-header">
    <p class="eyebrow">登録済み公開データ</p>
    <h1><?= e($view->heading) ?></h1>
    <p class="lead"><?= e($stats['note']) ?></p>
    <p class="muted">集計生成日: <?= e(format_date_jp($stats['generatedAt'])) ?></p>
</section>

<section class="stats-kpi-grid" aria-label="登録件数">
<?php foreach (['streams'=>'配信記事','members'=>'メンバー','games'=>'ゲーム','articles'=>'特集記事','phrases'=>'フレーズ','evaluatedStreams'=>'学習評価済み配信'] as $key=>$label): ?>
    <article class="stats-kpi"><p><?= e($label) ?></p><strong><?= e((string)($stats['counts'][$key] ?? 0)) ?></strong></article>
<?php endforeach; ?>
</section>

<section>
    <h2>配信分類</h2>
    <div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>分類</th><th>件数</th><th>割合</th></tr></thead><tbody>
    <?php foreach ($stats['streamTypes'] as $item): ?><tr><td><?= e($item['value']) ?></td><td><?= e((string)$item['count']) ?></td><td><?= $item['sharePercent'] === null ? '母数不足' : e((string)$item['sharePercent']) . '%' ?></td></tr><?php endforeach; ?>
    </tbody></table></div>
</section>

<section class="stats-links">
    <h2>詳しい集計</h2>
    <div class="entity-card-grid">
        <article class="entity-card"><h3><a href="/holoscope/stats/members/">メンバー統計</a></h3><p>公開配信件数、配信時間、分類を確認します。</p></article>
        <article class="entity-card"><h3><a href="/holoscope/stats/games/">ゲーム統計</a></h3><p>ゲームごとの配信件数と参加メンバー数を確認します。</p></article>
        <article class="entity-card"><h3><a href="/holoscope/stats/learning/">英語学習統計</a></h3><p>評価済み配信が最低件数を満たす場合だけ平均値を表示します。</p></article>
    </div>
</section>

<section class="methodology"><h2>公開基準</h2><dl>
<?php foreach ($stats['methodology']['thresholds'] as $key=>$value): ?><div><dt><?= e($key) ?></dt><dd><?= e($value) ?></dd></div><?php endforeach; ?>
</dl><p>人物能力、人気、私的関係のランキングは作成しません。</p></section>
