<?php
declare(strict_types=1);
require_once __DIR__ . '/_common.php';

try {
    $pdo = geo_pdo();
    $queries = [
        'station_records' => 'SELECT COUNT(*) FROM geo_station_records',
        'station_codes' => 'SELECT COUNT(DISTINCT station_code) FROM geo_station_records',
        'line_records' => 'SELECT COUNT(*) FROM geo_line_records',
        'line_codes' => 'SELECT COUNT(DISTINCT line_code) FROM geo_line_records',
        'address_records' => 'SELECT COUNT(*) FROM geo_address_records',
        'address_codes' => 'SELECT COUNT(DISTINCT address_code) FROM geo_address_records',
    ];
    $stats = [];
    foreach ($queries as $key => $sql) {
        $stats[$key] = (int) $pdo->query($sql)->fetchColumn();
    }
    geo_respond(['ok' => true, 'stats' => $stats]);
} catch (Throwable $e) {
    error_log('GEO stats failed: ' . $e->getMessage());
    geo_respond(['ok' => false, 'error' => '統計情報を取得できませんでした。'], 500);
}
