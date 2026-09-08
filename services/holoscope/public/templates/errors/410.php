<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
?>
<section class="error-page">
    <p class="error-code">410</p>
    <h1><?= e($view->heading) ?></h1>
    <p><?= e($view->data['description'] ?? '') ?></p>
    <a class="button" href="/holoscope/">トップへ戻る</a>
</section>
