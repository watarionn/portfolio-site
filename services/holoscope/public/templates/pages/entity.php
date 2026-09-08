<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$entity = $view->data['entity'];
?>
<article class="entity-gate">
    <p class="eyebrow">PUBLIC DATA VERIFIED</p>
    <h1><?= e($view->heading) ?></h1>
    <?php if (isset($entity['summaryOneLine'])): ?><p class="lead"><?= e($entity['summaryOneLine']) ?></p><?php endif; ?>
    <?php if (isset($entity['summary'])): ?><p class="lead"><?= e($entity['summary']) ?></p><?php endif; ?>
    <div class="notice">
        <strong>Phase 2表示</strong>
        <p>URL、公開状態、JSON構造の検証に成功しました。詳細本文は後続Phaseで実装します。</p>
    </div>
</article>
