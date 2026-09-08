<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
?>
<section class="page-header">
    <p class="eyebrow">ROUTE READY</p>
    <h1><?= e($view->heading) ?></h1>
    <p><?= e($view->data['description'] ?? '') ?></p>
</section>
