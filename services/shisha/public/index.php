<?php
declare(strict_types=1);
$configFile = __DIR__ . '/config.php';
$config = is_file($configFile) ? require $configFile : require __DIR__ . '/config.example.php';
$base = rtrim((string)($config['base_path'] ?? '/SHISHA'), '/');
?>
<!doctype html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="地域、駅、店名、現在地、営業日時から全国のシーシャ店舗を検索できます。">
    <title>シーシャ店舗検索</title>
    <link rel="stylesheet" href="<?=htmlspecialchars($base, ENT_QUOTES, 'UTF-8')?>/assets/app.css">
</head>
<body>
<header>
    <div>
        <p class="eyebrow">SHISHA STORE FINDER</p>
        <h1>シーシャ店舗検索</h1>
    </div>
</header>
<main>
    <section class="search-panel" aria-labelledby="searchTitle">
        <h2 id="searchTitle" class="sr-only">検索条件</h2>
        <label>都道府県
            <select id="pref"><option value="">全国</option></select>
        </label>
        <div>
            <span class="label">市区町村</span>
            <div id="cities" class="chips"><button class="active" data-value="" type="button">すべて</button></div>
        </div>
        <div class="station-grid">
            <label>沿線
                <select id="line"><option value="">沿線を選択</option></select>
            </label>
            <label>駅
                <select id="station"><option value="">駅を選択</option></select>
            </label>
        </div>
        <label>店名
            <input id="query" type="search" placeholder="店名・住所を入力" autocomplete="off">
        </label>
        <div class="time-grid">
            <label>営業日時
                <input id="openAt" type="datetime-local" aria-describedby="hoursHelp">
            </label>
            <label class="check"><input id="openNow" type="checkbox">現在営業中だけ表示</label>
        </div>
        <p id="hoursHelp" class="help">営業時間が確認済みの店舗だけを、指定日時に営業中か判定します。</p>
        <div class="controls">
            <label class="check"><input id="near" type="checkbox">現在地から検索</label>
            <label>半径
                <select id="radius">
                    <option value="3">3km</option>
                    <option value="5" selected>5km</option>
                    <option value="10">10km</option>
                    <option value="30">30km</option>
                </select>
            </label>
            <button id="search" type="button">検索</button>
        </div>
    </section>

    <section class="result-head">
        <strong id="count">0件</strong>
        <div>
            <select id="sort" aria-label="並び替え">
                <option value="name">名前順</option>
                <option value="distance">距離順</option>
                <option value="hours">営業時間が長い順</option>
                <option value="verified">更新日順</option>
            </select>
            <button id="view" class="ghost" type="button">リスト表示</button>
        </div>
    </section>
    <section id="results" class="cards" aria-live="polite"></section>
    <button id="more" class="more" type="button" hidden>さらに表示</button>
</main>

<footer>
    駅情報: <a href="https://express.heartrails.com/" target="_blank" rel="noopener">HeartRails Express</a>
</footer>
<script>window.APP_BASE=<?=json_encode($base, JSON_UNESCAPED_SLASHES)?>;</script>
<script src="<?=htmlspecialchars($base, ENT_QUOTES, 'UTF-8')?>/assets/app.js"></script>
</body>
</html>
