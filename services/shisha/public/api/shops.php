<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

$shops = read_shops();
$query = lower_text(trim((string)($_GET['q'] ?? '')));
$prefecture = trim((string)($_GET['prefecture'] ?? ''));
$municipality = trim((string)($_GET['municipality'] ?? ''));
$lat = isset($_GET['lat']) && is_numeric($_GET['lat']) ? (float)$_GET['lat'] : null;
$lng = isset($_GET['lng']) && is_numeric($_GET['lng']) ? (float)$_GET['lng'] : null;
$radius = max(0.0, min(100.0, (float)($_GET['radius'] ?? 0)));
$sort = (string)($_GET['sort'] ?? 'name');
$offset = max(0, (int)($_GET['offset'] ?? 0));
$limit = max(1, min(200, (int)($_GET['limit'] ?? 60)));
$openNow = filter_var($_GET['open_now'] ?? false, FILTER_VALIDATE_BOOL);
$openAtRaw = trim((string)($_GET['open_at'] ?? ''));
$openAt = null;

if ($openNow) {
    $openAt = new DateTimeImmutable('now', new DateTimeZone(SHISHA_TIMEZONE));
} elseif ($openAtRaw !== '') {
    $openAt = DateTimeImmutable::createFromFormat(
        '!Y-m-d\TH:i',
        $openAtRaw,
        new DateTimeZone(SHISHA_TIMEZONE)
    ) ?: null;
    if ($openAt === null) {
        json_response(['error' => 'invalid_open_at'], 400);
    }
}

$items = [];
foreach ($shops as $shop) {
    if ($prefecture !== '' && ($shop['prefecture'] ?? '') !== $prefecture) {
        continue;
    }
    if ($municipality !== '' && ($shop['municipality'] ?? '') !== $municipality) {
        continue;
    }
    if ($query !== '') {
        $haystack = lower_text(
            (string)($shop['name'] ?? '') . ' ' . (string)($shop['address'] ?? '')
        );
        if (!str_contains($haystack, $query)) {
            continue;
        }
    }

    $distance = null;
    if ($lat !== null && $lng !== null
        && is_numeric($shop['lat'] ?? null) && is_numeric($shop['lng'] ?? null)) {
        $distance = haversine($lat, $lng, (float)$shop['lat'], (float)$shop['lng']);
        if ($radius > 0 && $distance > $radius) {
            continue;
        }
    } elseif ($lat !== null && $lng !== null && $radius > 0) {
        // 距離検索では座標未登録店舗を混在させません。
        continue;
    }

    $isOpenAt = $openAt instanceof DateTimeImmutable ? shop_is_open_at($shop, $openAt) : null;
    if ($openAt instanceof DateTimeImmutable && $isOpenAt !== true) {
        // 指定時刻検索では、営業時間不明の店舗を「営業中」と推測しません。
        continue;
    }

    $shop['distance_km'] = $distance;
    $shop['hours_summary'] = hours_summary($shop);
    $shop['weekly_open_minutes'] = weekly_open_minutes($shop);
    $shop['is_open_at'] = $isOpenAt;
    $items[] = $shop;
}

if ($sort === 'distance') {
    usort($items, static fn(array $a, array $b): int =>
        ($a['distance_km'] ?? INF) <=> ($b['distance_km'] ?? INF));
} elseif ($sort === 'verified') {
    usort($items, static fn(array $a, array $b): int =>
        strcmp((string)($b['verified_at'] ?? ''), (string)($a['verified_at'] ?? '')));
} elseif ($sort === 'hours') {
    usort($items, static function (array $a, array $b): int {
        $minutes = (int)($b['weekly_open_minutes'] ?? 0) <=> (int)($a['weekly_open_minutes'] ?? 0);
        return $minutes !== 0
            ? $minutes
            : strnatcasecmp((string)($a['name'] ?? ''), (string)($b['name'] ?? ''));
    });
} else {
    usort($items, static fn(array $a, array $b): int =>
        strnatcasecmp((string)($a['name'] ?? ''), (string)($b['name'] ?? '')));
}

$total = count($items);
json_response([
    'count' => $total,
    'offset' => $offset,
    'limit' => $limit,
    'open_at' => $openAt?->format(DATE_ATOM),
    'items' => array_slice($items, $offset, $limit),
]);
