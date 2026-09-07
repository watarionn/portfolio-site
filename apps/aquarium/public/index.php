<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>魚類辞典 — Watarionn's Aquarium</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;700&family=Libre+Baskerville:ital@1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="aquarium.css">
</head>
<body>

  <!-- SVGフィルター：墨の滲み -->
  <svg class="svg-filters" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <filter id="ink-blur" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
  </svg>

  <!-- 水中背景 -->
  <div class="water-bg"     aria-hidden="true"></div>
  <div class="water-caustic" aria-hidden="true"></div>

  <!-- 泡コンテナ -->
  <div id="bubble-container" aria-hidden="true"></div>

  <!-- ヘッダー -->
  <header role="banner">
    <em class="header-kana">ぎょるいじてん</em>
    <h1>魚類辞典</h1>
    <span class="header-en">Liz Aquarium</span>
  <a href="/" class="home-btn" aria-label="ホームへ戻る">← ホームへ戻る</a>
    <div class="header-rule" aria-hidden="true"></div>
  </header>

  <!-- メイン -->
  <main role="main">
    <div class="card-sea" role="list" aria-label="魚の用例カード一覧">

      <?php
        require_once __DIR__ . '/../../config.php';

        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

        if ($conn->connect_error) {
          error_log("DB接続失敗: " . $conn->connect_error);
          die("サーバーエラーが発生しました。");
        }

        $sql  = "SELECT KANJI, YOMI_1, YOMI_2 FROM FISH";
        $data = $conn->query($sql);

        if (!$data) {
          error_log("クエリ失敗: " . $conn->error);
          die("クエリ失敗");
        }

        $index = 1;
        foreach ($data as $row):
          $kanji = htmlspecialchars($row["KANJI"], ENT_QUOTES, 'UTF-8');
          $yomi1 = htmlspecialchars($row["YOMI_1"], ENT_QUOTES, 'UTF-8');
          $yomi2 = htmlspecialchars($row["YOMI_2"], ENT_QUOTES, 'UTF-8');
          $num   = str_pad($index, 3, '0', STR_PAD_LEFT);
      ?>

      <article
        class="fish-card"
        role="listitem"
        tabindex="0"
        aria-label="<?= $kanji ?> — クリックで読みを表示"
        data-index="<?= $index ?>"
      >
        <div class="fish-inner">

          <!-- 表：漢字 -->
          <div class="fish-front" aria-hidden="false">
            <div class="card-front-inner">
              <span class="card-pos">名</span>
              <span class="fish-name"><?= $kanji ?></span>
              <span class="card-num"><?= $num ?></span>
            </div>
          </div>

          <!-- 裏：読み -->
          <div class="fish-back" aria-hidden="true">
            <div class="card-back-inner">
              <span class="card-label">読み</span>
              <?php if ($yomi1): ?>
                <p class="fish-reading-main"><?= $yomi1 ?></p>
              <?php endif; ?>
              <?php if ($yomi2): ?>
                <p class="fish-reading-sub"><?= $yomi2 ?></p>
              <?php endif; ?>
              <span class="card-back-kanji" aria-hidden="true"><?= $kanji ?></span>
            </div>
          </div>

        </div>
      </article>

      <?php
          $index++;
        endforeach;
        $conn->close();
      ?>

    </div>
  </main>

  <footer role="contentinfo">
    <p class="footer-text">魚類辞典　©&nbsp;Liz Hookah</p>
  </footer>

  <script src="aquarium.js" defer></script>
</body>
</html>
