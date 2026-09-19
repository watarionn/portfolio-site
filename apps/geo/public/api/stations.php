<?php
declare(strict_types=1);
require_once __DIR__ . '/_common.php';

$q = geo_q();
$limit = geo_limit();
$like = '%' . geo_like_literal($q) . '%';

try {
    $sql = "
        SELECT station_record_id, station_code, line_code, line_name,
               station_name, station_reading, longitude, latitude, prefecture_code
        FROM geo_station_records
        WHERE station_name LIKE ? OR station_reading LIKE ? OR station_code = ?
        ORDER BY station_name, station_code, line_code
        LIMIT {$limit}
    ";
    $stmt = geo_pdo()->prepare($sql);
    $stmt->execute([$like, $like, $q]);
    $rows = $stmt->fetchAll();
    geo_respond(['ok' => true, 'query' => $q, 'count' => count($rows), 'results' => $rows]);
} catch (Throwable $e) {
    error_log('GEO station search failed: ' . $e->getMessage());
    geo_respond(['ok' => false, 'error' => '駅検索に失敗しました。'], 500);
}
