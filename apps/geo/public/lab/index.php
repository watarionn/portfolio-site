<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>DATA LAB | 沿線・駅・住所</title>
  <link rel="stylesheet" href="../assets/geo.css">
</head>
<body>
<main class="geo-page">
  <nav class="geo-nav"><a href="../">← 沿線・駅・住所</a><a href="../explore/">EXPLORE</a></nav>
  <p class="geo-kicker">DATA LAB</p><h1>駅・路線・住所</h1>
  <div class="geo-tabs" role="tablist">
    <button data-mode="station" aria-selected="true">駅</button>
    <button data-mode="line" aria-selected="false">路線</button>
    <button data-mode="address" aria-selected="false">住所</button>
  </div>
  <form class="geo-search" id="search-form">
    <input id="q" type="search" autocomplete="off" placeholder="駅名を検索" aria-label="検索語">
    <button>検索</button>
  </form>
  <section class="geo-stats" id="stats" aria-label="データ件数"></section>
  <p class="geo-status" id="status" role="status" aria-live="polite">検索語を入力してください。</p>
  <section class="geo-results" id="results"></section>
  <section class="geo-specials">
    <a href="../same-name/?station=住吉"><strong>同名駅</strong><span>同じ駅名がどこにあるかを見る</span></a>
    <a href="?view=reading-contrast"><strong>同じ字・違う読み</strong><span>七日町や登戸などを比べる</span></a>
    <a href="../line/?line=五能線"><strong>沿線</strong><span>五能線を駅順に辿る</span></a>
  </section>
</main>
<script src="../assets/lab.js"></script>
</body></html>
