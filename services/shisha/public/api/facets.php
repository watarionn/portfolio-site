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

uksort($prefectures, static function (string $a, string $b): int {
    $codeCompare = prefecture_code($a) <=> prefecture_code($b);
    return $codeCompare !== 0 ? $codeCompare : strnatcasecmp($a, $b);
});
foreach ($municipalities as &$items) {
    uksort($items, static fn(string $a, string $b): int => strnatcasecmp($a, $b));
}
unset($items);

json_response([
    'prefectures' => $prefectures,
    'prefecture_order' => array_keys($prefectures),
    'municipalities' => $municipalities,
]);
