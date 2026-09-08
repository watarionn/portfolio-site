<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

$shops = read_shops();
$prefectures = [];
$municipalities = [];

foreach ($shops as $shop) {
    $prefecture = trim((string)($shop['prefecture'] ?? ''));
    $municipality = trim((string)($shop['municipality'] ?? ''));
    if ($prefecture !== '') {
        $prefectures[$prefecture] = ($prefectures[$prefecture] ?? 0) + 1;
    }
    if ($prefecture !== '' && $municipality !== '') {
        $municipalities[$prefecture][$municipality]
            = ($municipalities[$prefecture][$municipality] ?? 0) + 1;
    }
}

ksort($prefectures, SORT_NATURAL);
foreach ($municipalities as &$items) {
    ksort($items, SORT_NATURAL);
}
unset($items);

json_response([
    'prefectures' => $prefectures,
    'municipalities' => $municipalities,
]);
