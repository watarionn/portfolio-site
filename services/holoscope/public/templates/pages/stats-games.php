<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$stats = $view->data['stats'];
?>
<section class="detail-header"><h1><?= e($view->heading) ?></h1><p class="lead"><?= e($stats['note']) ?></p></section>
<div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>ゲーム</th><th>公開配信</th><th>配信メンバー</th><th>合計時間</th><th>割合</th></tr></thead><tbody>
<?php foreach ($stats['items'] as $item): ?><tr>
<td><a href="/holoscope/games/<?= e($item['slug']) ?>/"><?= e($item['name']) ?></a></td>
<td><?= e((string)$item['streamCount']) ?></td><td><?= e((string)$item['memberCount']) ?></td>
<td><?= e(format_duration((int)$item['totalDurationSeconds'])) ?></td>
<td><?= $item['streamSharePercent'] === null ? '母数不足' : e((string)$item['streamSharePercent']) . '%' ?></td>
</tr><?php endforeach; ?>
</tbody></table></div>
