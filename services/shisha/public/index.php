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
    <meta name="description" content="地域・駅・現在地・営業日時から全国のシーシャ店舗を探せる、検索とデータ整備を組み合わせた店舗検索ツール。">
    <title>SHISHA 店舗検索 — Search & Data Maintenance</title>
    <link rel="stylesheet" href="<?=htmlspecialchars($base, ENT_QUOTES, 'UTF-8')?>/assets/app.css">
</head>
<body>
<header class="site-hero">
    <div class="hero-shell">
        <div class="hero-copy">
            <p class="eyebrow">STAGE 9 / SHISHA STORE FINDER</p>
            <h1>シーシャ店舗検索</h1>
            <p class="hero-lead">地域・駅・現在地・営業日時という複数の入口から、目的に合う店舗へ辿り着くための検索ツールです。検索画面だけでなく、営業時間の確認日や出典を扱うデータ整備の考え方まで含めて設計しています。</p>
            <div class="hero-actions">
                <a class="primary-link" href="#collector">検索を使う</a>
                <a class="secondary-link" href="https://github.com/watarionn/portfolio-site/tree/main/services/shisha/public" target="_blank" rel="noopener">公開ソースを見る</a>
            </div>
        </div>
        <aside class="hero-note" aria-label="この作品の要点">
            <p class="hero-note-label">Search &amp; Data Maintenance</p>
            <p>「近い店」だけでなく、<strong>いつ営業しているか</strong>、その情報が<strong>いつ・どこで確認されたか</strong>まで検索結果に残す構成です。</p>
        </aside>
    </div>
</header>

<main>
    <section class="project-intro" aria-labelledby="projectTitle">
        <div class="intro-heading">
            <p class="section-kicker">WHAT THIS APP DOES</p>
            <h2 id="projectTitle">探す条件と、情報の確かさを同じ画面で扱う</h2>
            <p>店舗検索は条件を増やすほど便利になりますが、営業時間のような変化する情報を「未確認」と「閉店中」で混同しないことも重要です。SHISHAでは検索条件と情報の確認状態を分けて扱います。</p>
        </div>
        <div class="capability-grid">
            <article class="capability-card">
                <span>01</span>
                <h3>Area &amp; Station</h3>
                <p>都道府県、市区町村、沿線、駅を組み合わせて段階的に絞り込みます。</p>
            </article>
            <article class="capability-card">
                <span>02</span>
                <h3>Near Me</h3>
                <p>ブラウザの現在地、または選択した駅を起点に距離で比較できます。</p>
            </article>
            <article class="capability-card">
                <span>03</span>
                <h3>Opening Hours</h3>
                <p>指定日時や「現在営業中」で、確認済み営業時間をもつ店舗だけを判定します。</p>
            </article>
            <article class="capability-card">
                <span>04</span>
                <h3>Source Tracking</h3>
                <p>営業時間の確認日と出典を結果に残し、情報の鮮度を追える形にしています。</p>
            </article>
        </div>
        <div class="workflow-strip" aria-label="検索の流れ">
            <div><small>STEP 1</small><strong>場所を選ぶ</strong><span>地域 / 駅 / 現在地</span></div>
            <i aria-hidden="true">→</i>
            <div><small>STEP 2</small><strong>条件を重ねる</strong><span>店名 / 日時 / 半径</span></div>
            <i aria-hidden="true">→</i>
            <div><small>STEP 3</small><strong>根拠ごと比較</strong><span>距離 / 営業時間 / 更新日</span></div>
        </div>
    </section>

    <section class="live-interface" id="collector" aria-labelledby="liveTitle">
        <div class="live-heading">
            <div>
                <p class="section-kicker">LIVE INTERFACE</p>
                <h2 id="liveTitle">実際の店舗検索</h2>
            </div>
            <p class="data-note"><strong>営業時間フィルターについて</strong><br>営業時間が確認済みの店舗だけを営業中か判定します。未確認の店舗を「営業時間外」とは扱いません。</p>
        </div>

        <section class="search-panel" aria-labelledby="searchTitle">
            <h3 id="searchTitle" class="sr-only">検索条件</h3>
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
    </section>
</main>

<footer>
    <span>駅情報: <a href="https://express.heartrails.com/" target="_blank" rel="noopener">HeartRails Express</a></span>
    <span>公開画面には運用用データ・認証情報を含めていません。</span>
</footer>
<script>window.APP_BASE=<?=json_encode($base, JSON_UNESCAPED_SLASHES)?>;</script>
<script src="<?=htmlspecialchars($base, ENT_QUOTES, 'UTF-8')?>/assets/app.js"></script>
</body>
</html>
