<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$items = $view->data['items'];
$page = (int) $view->data['page'];
$pageCount = (int) $view->data['pageCount'];
$category = (string) $view->data['category'];
$action = '/holoscope/articles/';
?>
<section class="search-header"><p class="eyebrow">FEATURE ARTICLES</p><h1><?= e($view->heading) ?></h1><p class="lead">複数の配信、メンバー、ゲーム、企画、シリーズ、フレーズを横断し、ひとつの問いに答える記事です。</p></section>
<form class="search-form compact-filter" method="get" action="<?= e($action) ?>">
<label><span>主カテゴリ</span><select name="category"><option value="">すべて</option><?php foreach (['learning'=>'英語学習','guide'=>'ガイド','cross-analysis'=>'横断分析','event'=>'企画','member'=>'メンバー','game'=>'ゲーム'] as $value=>$label): ?><option value="<?= e($value) ?>"<?= $category===$value?' selected':'' ?>><?= e($label) ?></option><?php endforeach; ?></select></label>
<div class="form-actions"><button class="button" type="submit">絞り込む</button><a href="<?= e($action) ?>">条件をクリア</a></div>
</form>
<div class="result-heading"><h2>公開中の記事</h2><p><?= e($view->data['total']) ?>件</p></div>
<?php if ($items === []): ?><p class="notice">条件に一致する特集記事はありません。</p><?php else: ?><div class="feature-card-grid"><?php foreach ($items as $item): ?><article class="feature-card"><p class="feature-card__category"><?= e($item['primaryCategoryLabel'] ?? $item['primaryCategory']) ?></p><h2><a href="/holoscope/articles/<?= e($item['slug']) ?>/"><?= e($item['title']) ?></a></h2><p><?= e($item['lead']) ?></p><p class="entity-card__meta">更新 <?= e(format_date_jp($item['updatedAt'] ?? null)) ?></p></article><?php endforeach; ?></div><?php endif; ?>
<?php if ($pageCount > 1): ?><nav class="pagination" aria-label="特集記事ページ"><?php if ($page > 1): ?><a rel="prev" href="<?= e(query_url($action, array_filter(['category'=>$category,'page'=>(string)($page-1)]))) ?>">前のページ</a><?php endif; ?><span><?= e($page) ?> / <?= e($pageCount) ?></span><?php if ($page < $pageCount): ?><a rel="next" href="<?= e(query_url($action, array_filter(['category'=>$category,'page'=>(string)($page+1)]))) ?>">次のページ</a><?php endif; ?></nav><?php endif; ?>
