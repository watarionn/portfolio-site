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

<section class="observatory-brief" aria-labelledby="observatoryBriefTitle">
    <div class="observatory-brief__intro">
        <p class="eyebrow">HOW HOLOSCOPE WORKS</p>
        <h2 id="observatoryBriefTitle">配信を、あとから辿れる観測記録へ。</h2>
        <p>HoloScopeは配信を単発の動画として並べるのではなく、人物・ゲーム・企画・シリーズ・英語学習の情報へつなぎ直す観測サイトです。入口が違っても、同じ記録へ辿り着けるように情報を構造化しています。</p>
    </div>
    <div class="observatory-axes" aria-label="HoloScopeの4つの観測軸">
        <article class="observatory-axis"><span>01</span><h3>Stream Records</h3><p>配信の要点、見どころ、日時を記事として残す。</p><a href="/holoscope/streams/">配信記録を見る</a></article>
        <article class="observatory-axis"><span>02</span><h3>Relationships</h3><p>メンバー・ゲーム・企画・シリーズを相互に結び、文脈から探せるようにする。</p><a href="/holoscope/members/">メンバーから辿る</a></article>
        <article class="observatory-axis"><span>03</span><h3>English Learning</h3><p>配信を英語難度やフレーズの観点でも整理し、視聴を学習導線へ変える。</p><a href="/holoscope/learning/">英語学習を見る</a></article>
        <article class="observatory-axis"><span>04</span><h3>Editorial & Stats</h3><p>特集と公開データの集計から、個別配信だけでは見えにくい傾向を読む。</p><a href="/holoscope/articles/">特集を見る</a></article>
    </div>
    <ol class="observation-flow" aria-label="HoloScopeの観測フロー">
        <li><span>OBSERVE</span><strong>配信を観測</strong><small>公開情報から要点を記録</small></li>
        <li><span>STRUCTURE</span><strong>関係を構造化</strong><small>人物・作品・企画へ接続</small></li>
        <li><span>DISCOVER</span><strong>別の入口から再発見</strong><small>検索・学習・特集・統計へ展開</small></li>
    </ol>
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
