<?php
/** @var \HoloScope\ViewModel\PageViewModel $view */
require_once dirname(__DIR__) . '/helpers.php';
$member = $view->data['member'];
?>
<article class="member-detail">
<header class="detail-header member-header"><p class="eyebrow">MEMBER PROFILE</p><h1><?= e($member['displayName']) ?></h1><?php if (!empty($member['nameJa'])): ?><p class="member-name-ja"><?= e($member['nameJa']) ?></p><?php endif; ?><p class="lead"><?= e($member['summary']) ?></p><a class="button" href="/holoscope<?= e($member['streamSearchUrl']) ?>">このメンバーの配信を検索</a></header>

<?php if ($member['beginnerRecommendations'] !== []): ?><section><h2>初心者向けおすすめ</h2><div class="stream-card-grid"><?php foreach ($member['beginnerRecommendations'] as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?></div></section><?php endif; ?>
<?php if ($member['latestStreams'] !== []): ?><section><div class="section-heading"><h2>最新配信</h2><a href="/holoscope<?= e($member['streamSearchUrl']) ?>">すべての配信</a></div><div class="stream-card-grid"><?php foreach ($member['latestStreams'] as $card): require dirname(__DIR__) . '/components/stream-card.php'; endforeach; ?></div></section><?php endif; ?>

<section><h2>配信スタイル</h2><div class="metric-grid"><div><strong><?= e($member['streamStyle']['totalStreams'] ?? 0) ?></strong><span>公開配信</span></div><div><strong><?= e($member['streamStyle']['soloCount'] ?? 0) ?></strong><span>単独配信</span></div><div><strong><?= e($member['streamStyle']['collaborationCount'] ?? 0) ?></strong><span>コラボ配信</span></div></div><?php if (!empty($member['streamStyle']['types'])): ?><ul class="rank-list"><?php foreach ($member['streamStyle']['types'] as $item): ?><li><span><?= e($item['label']) ?></span><strong><?= e($item['count']) ?>件</strong></li><?php endforeach; ?></ul><?php endif; ?></section>

<?php if ($member['topGames'] !== [] || $member['topSeries'] !== []): ?><section><h2>主なゲーム・シリーズ</h2><div class="two-column"><div><h3>ゲーム</h3><ul class="rank-list"><?php foreach ($member['topGames'] as $item): ?><li><a href="/holoscope/games/<?= e($item['slug']) ?>/"><?= e($item['name']) ?></a><strong><?= e($item['count']) ?>件</strong></li><?php endforeach; ?></ul></div><div><h3>シリーズ</h3><ul class="rank-list"><?php foreach ($member['topSeries'] as $item): ?><li><a href="/holoscope/series/<?= e($item['slug']) ?>/"><?= e($item['name']) ?></a><strong><?= e($item['count']) ?>件</strong></li><?php endforeach; ?></ul></div></div></section><?php endif; ?>

<?php if (($member['learningProfile']['evaluatedStreams'] ?? 0) > 0): ?><section><h2>英語学習プロフィール</h2><p>学習評価済み配信: <?= e($member['learningProfile']['evaluatedStreams']) ?>件<?php if ($member['learningProfile']['averageSpeechSpeedWpm'] !== null): ?> / 平均発話速度: <?= e($member['learningProfile']['averageSpeechSpeedWpm']) ?> WPM<?php endif; ?></p><div class="tag-list"><?php foreach ($member['learningProfile']['cefrDistribution'] ?? [] as $item): ?><span><?= e($item['level']) ?>: <?= e($item['count']) ?>件</span><?php endforeach; ?></div></section><?php endif; ?>

<?php if ($member['frequentPhrases'] !== []): ?><section><h2>よく登場する表現</h2><div class="phrase-grid"><?php foreach ($member['frequentPhrases'] as $item): ?><article><p class="expression"><?= e($item['standardForm']) ?></p><p><?= e($item['meaningJa']) ?></p><p><?= e($item['occurrenceCount']) ?>件の確認済み使用例</p></article><?php endforeach; ?></div></section><?php endif; ?>

<?php if ($member['collaborations'] !== []): ?><section><h2>公開配信上の共演記録</h2><p>公開配信で確認できる共演回数のみを集計しています。私的な関係性は推測しません。</p><ul class="collaboration-list"><?php foreach ($member['collaborations'] as $item): ?><li><a href="/holoscope/members/<?= e($item['slug']) ?>/"><?= e($item['displayName']) ?></a><span><?= e($item['label']) ?></span></li><?php endforeach; ?></ul></section><?php endif; ?>

<?php if ($member['relatedArticles'] !== []): ?><section><h2>関連特集</h2><div class="card-grid"><?php foreach ($member['relatedArticles'] as $item): ?><article class="card"><h3><a href="/holoscope/articles/<?= e($item['slug']) ?>/"><?= e($item['title']) ?></a></h3><p><?= e($item['lead']) ?></p></article><?php endforeach; ?></div></section><?php endif; ?>

<?php if ($member['officialLinks'] !== []): ?><section><h2>公式リンク</h2><ul><?php foreach ($member['officialLinks'] as $item): ?><li><a href="<?= e($item['url']) ?>" rel="noopener noreferrer"><?= e($item['label']) ?></a></li><?php endforeach; ?></ul></section><?php endif; ?>
</article>
