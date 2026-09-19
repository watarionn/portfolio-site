<?php
declare(strict_types=1);
require_once __DIR__ . '/_common.php';

$q = geo_q();
$limit = geo_limit(30, 50);
$literal = geo_like_literal($q);
$fields = [
    'prefecture_name', 'municipality_name', 'town_name', 'block_name',
    'prefecture_kana', 'municipality_kana', 'town_kana', 'block_kana',
];
$select = "
    SELECT address_record_id, address_code, postal_code, prefecture_code,
           prefecture_name, municipality_name, town_name, block_name,
           prefecture_kana, municipality_kana, town_kana, block_kana,
           street_name_flag, common_name_flag, is_last
    FROM geo_address_records
";
$where = implode(' OR ', array_map(static fn(string $field): string => "{$field} LIKE ?", $fields));

try {
    $pdo = geo_pdo();

    // Indexed component-prefix pass. This is the normal fast path.
    $prefix = $literal . '%';
    $sql = $select . " WHERE ({$where}) ORDER BY is_last DESC, address_record_id LIMIT {$limit}";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_fill(0, count($fields), $prefix));
    $rows = $stmt->fetchAll();
    $mode = 'prefix';

    // Some source fields contain a larger municipality/town string.
    // Only fall back to contains search when the indexed prefix pass found nothing.
    if (!$rows) {
        $contains = '%' . $literal . '%';
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_fill(0, count($fields), $contains));
        $rows = $stmt->fetchAll();
        $mode = 'contains-fallback';
    }

    geo_respond([
        'ok' => true,
        'query' => $q,
        'mode' => $mode,
        'count' => count($rows),
        'results' => $rows,
    ]);
} catch (Throwable $e) {
    error_log('GEO address search failed: ' . $e->getMessage());
    geo_respond(['ok' => false, 'error' => '住所検索に失敗しました。'], 500);
}
