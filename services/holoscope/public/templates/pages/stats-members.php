<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$stats = $view->data['stats'];
?>
<section class="detail-header"><h1><?= e($view->heading) ?></h1><p class="lead"><?= e($stats['note']) ?></p></section>
<div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>メンバー</th><th>公開配信</th><th>合計時間</th><th>コラボ配信</th><th>ゲーム数</th><th>割合</th></tr></thead><tbody>
<?php foreach ($stats['items'] as $item): ?><tr>
<td><a href="/holoscope/members/<?= e($item['slug']) ?>/"><?= e($item['displayName']) ?></a></td>
<td><?= e((string)$item['streamCount']) ?></td><td><?= e(format_duration((int)$item['totalDurationSeconds'])) ?></td>
<td><?= e((string)$item['collaborationCount']) ?></td><td><?= e((string)$item['gameCount']) ?></td>
<td><?= $item['streamSharePercent'] === null ? '母数不足' : e((string)$item['streamSharePercent']) . '%' ?></td>
</tr><?php endforeach; ?>
</tbody></table></div>
<p class="notice">一覧は名前順です。公開配信件数を人気や能力の順位として扱いません。</p>
