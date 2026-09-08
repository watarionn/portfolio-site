<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$home = $view->data['home'];

$latestStreams = is_array($home['latestStreams'] ?? null) ? $home['latestStreams'] : [];
$featuredStream = $latestStreams[0] ?? null;
$remainingLatestStreams = array_slice($latestStreams, 1);

$visibleCounts = [];
$countDefinitions = [
    'streams' => '配信記事',
    'members' => 'メンバー',
    'games' => 'ゲーム',
    'events' => '企画',
];
foreach ($countDefinitions as $key => $label) {
    $value = (int) ($home['counts'][$key] ?? 0);
    if ($value > 0) {
        $visibleCounts[] = ['label' => $label, 'value' => $value];
    }
}
?>
<section class="home-hero-v2">
    <div class="home-hero-v2__identity">
        <p class="eyebrow">HOLOLIVE EN OBSERVATORY</p>
        <h1>HoloScope</h1>
        <p class="home-hero-v2__label">ホロライブEN観測所</p>
        <p class="home-hero-v2__description">配信の要点、見どころ、関連する人物・ゲーム・企画を記録しています。</p>
        <div class="actions">
            <a class="button" href="/holoscope/streams/">配信記事を見る</a>
            <a class="button secondary" href="/holoscope/members/">メンバーから探す</a>
        </div>
        <?php if ($visibleCounts !== []): ?>
        <dl class="home-counts--compact" aria-label="公開データ件数">
            <?php foreach ($visibleCounts as $count): ?>
            <div><dt><?= e($count['label']) ?></dt><dd><?= e($count['value']) ?></dd></div>
            <?php endforeach; ?>
        </dl>
        <?php endif; ?>
    </div>
    <?php if ($featuredStream !== null): ?>
    <div class="home-hero-v2__latest" aria-label="最新の配信記事">
        <p class="eyebrow">最新の観測記録</p>
        <?php $card = $featuredStream; require dirname(__DIR__) . '/components/stream-card.php'; ?>
    </div>
    <?php else: ?>
    <div class="home-hero-v2__empty" aria-hidden="true"></div>
    <?php endif; ?>
</section>

<?php if ($remainingLatestStreams !== []): ?>
<section class="home-section home-section--priority">
    <div class="section-heading">
        <div><p class="eyebrow">NEW ARTICLES</p><h2>最新の配信記事</h2></div>
        <a href="/holoscope/streams/">すべての配信を見る</a>
    </div>
    <div class="stream-card-grid">
    <?php foreach ($remainingLatestStreams as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?>
    </div>
</section>
<?php endif; ?>

<?php if ($home['beginnerStreams'] !== []): ?>
<section class="home-section home-section--soft">
    <div class="section-heading"><div><p class="eyebrow">START HERE</p><h2>初めて見る人向け</h2></div><p>編集原本で初心者向けに指定された配信です。</p></div>
    <div class="stream-card-grid">
    <?php foreach ($home['beginnerStreams'] as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?>
    </div>
</section>
<?php endif; ?>

<section class="home-section">
    <div class="section-heading"><div><p class="eyebrow">DISCOVER</p><h2>分類から探す</h2></div></div>
    <div class="discovery-links">
        <a href="/holoscope/generations/"><strong>世代</strong><span>所属メンバーと配信傾向</span></a>
        <a href="/holoscope/games/"><strong>ゲーム</strong><span>ゲーム別の配信と配信者</span></a>
        <a href="/holoscope/events/"><strong>企画</strong><span>参加者と各配信視点</span></a>
        <a href="/holoscope/series/"><strong>シリーズ</strong><span>話数順と進捗</span></a>
    </div>
</section>

<?php if ($home['generations'] !== []): ?>
<section class="home-section">
    <div class="section-heading"><div><p class="eyebrow">GENERATIONS</p><h2>世代から見る</h2></div><a href="/holoscope/generations/">世代一覧</a></div>
    <div class="entity-card-grid">
    <?php foreach ($home['generations'] as $item): ?>
        <article class="entity-card">
            <p class="entity-card__stat"><?= e($item['activeMemberCount'] ?? 0) ?>人が活動中 · <?= e($item['streamCount'] ?? 0) ?>配信</p>
            <h3><a href="/holoscope/generations/<?= e($item['slug']) ?>/"><?= e($item['nameJa']) ?></a></h3>
            <p><?= e($item['summary'] ?? '') ?></p>
            <?php if (!empty($item['members'])): ?><p class="entity-card__meta"><?= e(implode(' / ', $item['members'])) ?></p><?php endif; ?>
        </article>
    <?php endforeach; ?>
    </div>
</section>
<?php endif; ?>

<div class="home-split">
<?php if ($home['popularGames'] !== []): ?>
<section class="home-section compact-section">
    <div class="section-heading"><div><p class="eyebrow">GAMES</p><h2>ゲーム</h2></div><a href="/holoscope/games/">一覧</a></div>
    <ol class="ranked-link-list">
    <?php foreach ($home['popularGames'] as $item): ?><li><a href="/holoscope/games/<?= e($item['slug']) ?>/"><strong><?= e($item['name']) ?></strong><span><?= e($item['streamCount'] ?? 0) ?>配信</span></a></li><?php endforeach; ?>
    </ol>
</section>
<?php endif; ?>
<?php if ($home['activeSeries'] !== []): ?>
<section class="home-section compact-section">
    <div class="section-heading"><div><p class="eyebrow">SERIES</p><h2>シリーズ</h2></div><a href="/holoscope/series/">一覧</a></div>
    <ol class="ranked-link-list">
    <?php foreach ($home['activeSeries'] as $item): ?><li><a href="/holoscope/series/<?= e($item['slug']) ?>/"><strong><?= e($item['name']) ?></strong><span><?= e($item['episodeCount'] ?? 0) ?>話</span></a></li><?php endforeach; ?>
    </ol>
</section>
<?php endif; ?>
</div>

<?php if ($home['recentEvents'] !== []): ?>
<section class="home-section">
    <div class="section-heading"><div><p class="eyebrow">EVENTS</p><h2>最近の企画</h2></div><a href="/holoscope/events/">企画一覧</a></div>
    <div class="entity-card-grid">
    <?php foreach ($home['recentEvents'] as $item): ?>
        <article class="entity-card"><p class="entity-card__stat"><?= e($item['eventTypeLabel'] ?? '') ?> · <?= e($item['streamCount'] ?? 0) ?>視点</p><h3><a href="/holoscope/events/<?= e($item['slug']) ?>/"><?= e($item['name']) ?></a></h3><p><?= e($item['summary'] ?? '') ?></p><p class="entity-card__meta"><?= e(format_date_jp($item['startsAt'] ?? null)) ?></p></article>
    <?php endforeach; ?>
    </div>
</section>
<?php endif; ?>

<?php if ($home['latestArticles'] !== []): ?>
<section class="home-section">
    <div class="section-heading"><div><p class="eyebrow">FEATURES</p><h2>特集記事</h2></div><a href="/holoscope/articles/">特集一覧</a></div>
    <div class="entity-card-grid">
    <?php foreach ($home['latestArticles'] as $item): ?><article class="entity-card"><p class="entity-card__stat"><?= e($item['primaryCategory'] ?? 'feature') ?></p><h3><a href="/holoscope/articles/<?= e($item['slug']) ?>/"><?= e($item['title']) ?></a></h3><p><?= e($item['lead'] ?? '') ?></p></article><?php endforeach; ?>
    </div>
</section>
<?php endif; ?>
