<?php
require_once __DIR__ . '/../../config.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    error_log('DB接続失敗: ' . $conn->connect_error);
    die('サーバーエラーが発生しました。');
}

$sql = 'SELECT KANJI, YOMI_1, YOMI_2 FROM FISH';
$data = $conn->query($sql);
if (!$data) {
    error_log('クエリ失敗: ' . $conn->error);
    die('クエリ失敗');
}

$fishRows = [];
foreach ($data as $row) {
    $fishRows[] = $row;
}
$conn->close();
$totalFish = count($fishRows);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AQUARIUM — 魚の名前を読む</title>
  <meta name="description" content="魚の漢字名と読みを、検索しながらめくって確かめるフィールドインデックス。">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Noto+Serif+JP:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="aquarium.css">
</head>
<body>
  <div class="water-bg" aria-hidden="true"></div>
  <div class="water-caustic" aria-hidden="true"></div>
  <div id="bubble-container" aria-hidden="true"></div>

  <header class="site-header">
    <nav class="top-nav" aria-label="ページナビゲーション">
      <a href="/" class="home-btn">← PORTFOLIO</a>
      <span class="edition-mark">FIELD INDEX / 09</span>
    </nav>

    <div class="hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">AQUARIUM / FISH NAME ARCHIVE</p>
        <h1><span class="title-en">AQUARIUM</span><span class="title-ja">魚の名前を、読む。</span></h1>
        <p class="hero-lead">漢字で出会って、読みをめくる。魚名と読みを往復しながら探せる、小さな水中フィールドインデックスです。</p>
      </div>

      <dl class="hero-stats" aria-label="コレクション概要">
        <div><dt>ENTRIES</dt><dd><?= $totalFish ?></dd></div>
        <div><dt>INDEX</dt><dd>NAME / READING</dd></div>
        <div><dt>SOURCE</dt><dd>PHP / MySQL</dd></div>
      </dl>
    </div>
  </header>
  <main class="page-main">
    <section class="explorer" aria-labelledby="explorer-title">
      <div class="explorer-heading">
        <div>
          <p class="section-kicker">SEARCH THE WATER</p>
          <h2 id="explorer-title">魚名と読みから探す</h2>
        </div>
        <p class="result-count"><strong id="visible-count"><?= $totalFish ?></strong><span aria-hidden="true"> / </span><span id="total-count"><?= $totalFish ?></span> entries</p>
      </div>

      <div class="search-panel">
        <label class="search-field" for="fish-search">
          <span>SEARCH</span>
          <input id="fish-search" type="search" autocomplete="off" placeholder="例：鮫 / さめ" aria-describedby="search-help search-status">
        </label>

        <div class="scope-block">
          <span class="control-label" id="scope-label">SEARCH IN</span>
          <div class="scope-switch" role="group" aria-labelledby="scope-label">
            <button type="button" class="scope-btn is-active" data-scope="all" aria-pressed="true">すべて</button>
            <button type="button" class="scope-btn" data-scope="name" aria-pressed="false">魚名</button>
            <button type="button" class="scope-btn" data-scope="reading" aria-pressed="false">読み</button>
          </div>
        </div>

        <div class="explorer-actions" aria-label="一覧操作">
          <button type="button" id="random-fish" class="action-btn action-primary">RANDOM</button>
          <button type="button" id="reveal-visible" class="action-btn">READ ALL</button>
          <button type="button" id="reset-search" class="action-btn">RESET</button>
        </div>
      </div>

      <p id="search-help" class="search-help"><kbd>/</kbd> で検索へ移動。カタカナとひらがなは同じ読みとして探します。</p>
      <p id="search-status" class="sr-only" role="status" aria-live="polite">全<?= $totalFish ?>件を表示しています。</p>
    </section>

    <section class="collection" aria-labelledby="collection-title">
      <div class="collection-heading">
        <p class="section-kicker">FIELD CARDS</p>
        <h2 id="collection-title">水中索引</h2>
      </div>
      <div class="card-sea" role="list" aria-label="魚名カード一覧">
<?php foreach ($fishRows as $index => $row):
    $kanji = htmlspecialchars((string) $row['KANJI'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $yomi1 = htmlspecialchars((string) $row['YOMI_1'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $yomi2 = htmlspecialchars((string) $row['YOMI_2'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $readingSearch = htmlspecialchars(trim((string) $row['YOMI_1'] . ' ' . (string) $row['YOMI_2']), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $cardIndex = $index + 1;
    $num = str_pad((string) $cardIndex, 3, '0', STR_PAD_LEFT);
    $readingId = 'fish-reading-' . $cardIndex;
?>
        <article class="fish-card" role="listitem" data-name="<?= $kanji ?>" data-reading="<?= $readingSearch ?>" data-index="<?= $cardIndex ?>">
          <button type="button" class="fish-card-trigger" aria-expanded="false" aria-controls="<?= $readingId ?>" aria-label="<?= $kanji ?>。読みを表示">
            <span class="fish-inner">
              <span class="fish-front" aria-hidden="false">
                <span class="card-front-inner">
                  <span class="card-pos">FISH</span>
                  <span class="fish-name"><?= $kanji ?></span>
                  <span class="card-num"><?= $num ?></span>
                  <span class="flip-hint">TAP TO READ</span>
                </span>
              </span>

              <span class="fish-back" id="<?= $readingId ?>" aria-hidden="true">
                <span class="card-back-inner">
                  <span class="card-label">READING</span>
                  <?php if ($yomi1 !== ''): ?><span class="fish-reading-main"><?= $yomi1 ?></span><?php endif; ?>
                  <?php if ($yomi2 !== ''): ?><span class="fish-reading-sub"><?= $yomi2 ?></span><?php endif; ?>
                  <span class="card-back-kanji" aria-hidden="true"><?= $kanji ?></span>
                  <span class="card-num"><?= $num ?></span>
                </span>
              </span>
            </span>
          </button>
        </article>
<?php endforeach; ?>
      </div>
      <p id="empty-state" class="empty-state" hidden>該当する魚名がありません。検索語や検索範囲を変えてみてください。</p>
    </section>
  </main>
  <footer class="site-footer">
    <p>AQUARIUM FIELD INDEX</p>
    <p>© Liz Hookah</p>
  </footer>

  <script src="aquarium.js" defer></script>
</body>
</html>
