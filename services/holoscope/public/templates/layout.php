<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
/** @var string $content */
require_once __DIR__ . '/helpers.php';
?>
<!doctype html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($view->title) ?></title>
    <meta name="description" content="<?= e($view->description) ?>">
    <meta name="robots" content="<?= e($view->robots) ?>">
    <link rel="canonical" href="<?= e($view->canonical) ?>">
<?php foreach ($view->openGraph as $property => $value): ?>
    <meta <?= str_starts_with($property, 'twitter:') ? 'name' : 'property' ?>="<?= e($property) ?>" content="<?= e($value) ?>">
<?php endforeach; ?>
<?php foreach ($view->feedLinks as $feed): ?>
    <link rel="alternate" type="application/rss+xml" title="<?= e($feed['title']) ?>" href="<?= e($feed['url']) ?>">
<?php endforeach; ?>
<?php foreach ($view->jsonLd as $item): ?>
    <script type="application/ld+json"><?= json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?></script>
<?php endforeach; ?>
    <link rel="stylesheet" href="/holoscope/assets/css/app.css">
    <link rel="stylesheet" href="/holoscope/assets/css/editorial.css">
</head>
<body>
<header class="site-header">
    <div class="shell header-inner">
        <a class="brand brand-lockup" href="/holoscope/">
            <span class="brand-lockup__name">HoloScope</span>
            <span class="brand-lockup__sub">ホロライブEN観測所</span>
        </a>
        <nav class="site-primary-nav" aria-label="主要ナビゲーション">
            <a href="/holoscope/streams/">配信</a>
            <a href="/holoscope/members/">メンバー</a>
            <a href="/holoscope/learning/">英語学習</a>
            <a href="/holoscope/articles/">特集</a>
            <details class="nav-more">
                <summary>探す</summary>
                <div class="nav-more__panel">
                    <a href="/holoscope/generations/">世代</a>
                    <a href="/holoscope/games/">ゲーム</a>
                    <a href="/holoscope/events/">企画</a>
                    <a href="/holoscope/series/">シリーズ</a>
                    <a href="/holoscope/stats/">統計</a>
                </div>
            </details>
        </nav>
        <details class="mobile-menu">
            <summary>メニュー</summary>
            <nav class="mobile-menu__panel" aria-label="モバイルナビゲーション">
                <a href="/holoscope/streams/">配信</a>
                <a href="/holoscope/members/">メンバー</a>
                <a href="/holoscope/learning/">英語学習</a>
                <a href="/holoscope/articles/">特集</a>
                <a href="/holoscope/generations/">世代</a>
                <a href="/holoscope/games/">ゲーム</a>
                <a href="/holoscope/events/">企画</a>
                <a href="/holoscope/series/">シリーズ</a>
                <a href="/holoscope/stats/">統計</a>
            </nav>
        </details>
    </div>
</header>
<main class="shell">
<?php if ($view->breadcrumbs !== []): ?>
    <nav class="breadcrumbs" aria-label="パンくず">
        <ol>
        <?php foreach ($view->breadcrumbs as $item): ?>
            <li>
            <?php if ($item['url'] !== null): ?>
                <a href="<?= e($item['url']) ?>"><?= e($item['label']) ?></a>
            <?php else: ?>
                <span aria-current="page"><?= e($item['label']) ?></span>
            <?php endif; ?>
            </li>
        <?php endforeach; ?>
        </ol>
    </nav>
<?php endif; ?>
<?= $content ?>
</main>
<footer class="site-footer">
    <div class="shell">
        <p>HoloScopeはホロライブENの非公式ファンサイトです。</p>
        <p class="footer-feeds"><a href="/holoscope/feeds/all.xml">RSS</a> · <a href="/holoscope/sitemap.xml">サイトマップ</a></p>
    </div>
</footer>
</body>
</html>
