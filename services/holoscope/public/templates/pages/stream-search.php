<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$search = $view->data['search'];
$criteria = $search['criteria'];
$options = $search['options'];
$action = $view->data['formAction'];
$fixedMember = $view->data['fixedMember'];
$select = static function (string $name, string $label, array $items, string $selected): void { ?>
    <label><span><?= e($label) ?></span><select name="<?= e($name) ?>"><option value="">すべて</option><?php foreach ($items as $item): ?><option value="<?= e($item['value']) ?>"<?= $selected === $item['value'] ? ' selected' : '' ?>><?= e($item['label']) ?></option><?php endforeach; ?></select></label>
<?php };
?>
<section class="search-header"><p class="eyebrow">STREAM SEARCH</p><h1><?= e($view->heading) ?></h1><p>条件は原則ANDで絞り込みます。CEFRを複数選んだ場合だけ、選択したレベルのいずれかに一致する配信を表示します。</p></section>
<form class="search-form" method="get" action="<?= e($action) ?>">
    <label class="keyword-field"><span>キーワード</span><input type="search" name="q" value="<?= e($criteria->keyword) ?>" maxlength="100" placeholder="配信名・ゲーム・内容"></label>
    <div class="filter-grid">
        <?php if ($fixedMember === null): ?><?php $select('member', 'メンバー', $options['member'] ?? [], $criteria->member); ?><?php endif; ?>
        <?php $select('generation', '世代', $options['generation'] ?? [], $criteria->generation); ?>
        <?php $select('type', '配信分類', $options['type'] ?? [], $criteria->type); ?>
        <?php $select('game', 'ゲーム', $options['game'] ?? [], $criteria->game); ?>
        <?php $select('event', '企画', $options['event'] ?? [], $criteria->event); ?>
        <?php $select('series', 'シリーズ', $options['series'] ?? [], $criteria->series); ?>
        <?php $select('collaboration', '単独・コラボ', $options['collaboration'] ?? [], $criteria->collaboration); ?>
        <?php $select('participant', '共演者', $options['participant'] ?? [], $criteria->participant); ?>
        <?php $select('month', '年月', $options['month'] ?? [], $criteria->month); ?>
        <?php $select('duration', '配信時間', $options['duration'] ?? [], $criteria->duration); ?>
    </div>
    <fieldset class="cefr-filter"><legend>CEFR（複数選択はOR）</legend><?php foreach ($options['cefr'] ?? [] as $item): ?><label><input type="checkbox" name="cefr[]" value="<?= e($item['value']) ?>"<?= in_array($item['value'], $criteria->cefr, true) ? ' checked' : '' ?>> <?= e($item['label']) ?></label><?php endforeach; ?></fieldset>
    <div class="form-actions"><button class="button" type="submit">検索する</button><a href="<?= e($action) ?>">条件をクリア</a></div>
</form>

<section class="search-results" aria-live="polite">
    <div class="result-heading"><h2>検索結果</h2><p><?= e($search['total']) ?>件 · <?= e($search['page']) ?>/<?= e($search['pageCount']) ?>ページ</p></div>
    <?php if ($search['cards'] === []): ?><p class="notice">条件に一致する公開配信はありません。</p>
    <?php else: ?><div class="stream-card-grid"><?php foreach ($search['cards'] as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?></div><?php endif; ?>

    <?php if ($search['pageCount'] > 1): ?>
    <nav class="pagination" aria-label="検索結果ページ">
        <?php if ($search['page'] > 1): $params = $criteria->queryParameters(false); $params['page'] = (string) ($search['page'] - 1); ?><a rel="prev" href="<?= e(query_url($action, $params)) ?>">前のページ</a><?php endif; ?>
        <span><?= e($search['page']) ?> / <?= e($search['pageCount']) ?></span>
        <?php if ($search['page'] < $search['pageCount']): $params = $criteria->queryParameters(false); $params['page'] = (string) ($search['page'] + 1); ?><a rel="next" href="<?= e(query_url($action, $params)) ?>">次のページ</a><?php endif; ?>
    </nav>
    <?php endif; ?>
</section>
