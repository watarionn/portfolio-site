<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$status = $view->data['status'];
?>
<section class="detail-header admin-status"><p class="eyebrow">読み取り専用</p><h1><?= e($view->heading) ?></h1><p class="lead">公開用データと検査結果の要約です。編集・公開操作はできません。</p></section>
<section class="status-panel status-panel--<?= e(strtolower($status['status'])) ?>"><h2>ビルド状態: <?= e($status['status']) ?></h2><p>デプロイ停止: <?= $status['deploymentBlocked'] ? 'はい' : 'いいえ' ?></p><p>生成日: <?= e(format_date_jp($status['generatedAt'])) ?></p></section>
<section><h2>検査件数</h2><div class="stats-kpi-grid"><?php foreach ($status['checks'] as $key=>$value): ?><article class="stats-kpi"><p><?= e($key) ?></p><strong><?= e((string)$value) ?></strong></article><?php endforeach; ?></div></section>
<section><h2>公開件数</h2><div class="stats-table-wrap"><table class="stats-table"><tbody><?php foreach ($status['publicCounts'] as $key=>$value): ?><tr><th><?= e($key) ?></th><td><?= e((string)$value) ?></td></tr><?php endforeach; ?></tbody></table></div></section>
<section><h2>運用規則</h2><p><?= e($status['releasePolicy']) ?></p></section>
