<?php
declare(strict_types=1);
require_once __DIR__ . '/_common.php';

$q = geo_q();

try {
    $stmt = geo_pdo()->prepare("
        SELECT station_record_id, station_code, line_code, line_name,
               station_name, station_reading, longitude, latitude, prefecture_code
        FROM geo_station_records
        WHERE line_name = ? OR line_name_short = ? OR line_name_abbrev = ? OR line_code = ?
        ORDER BY station_code, station_record_id
    ");
    $stmt->execute([$q, $q, $q, $q]);
    $rows = $stmt->fetchAll();

    // A station code can occur more than once because source naming/history can vary.
    // Keep the first record per station-code + coordinates for the traveler sequence.
    $seen = [];
    $stations = [];
    foreach ($rows as $row) {
        $key = implode('|', [
            $row['station_code'],
            (string) $row['longitude'],
            (string) $row['latitude'],
        ]);
        if (isset($seen[$key])) continue;
        $seen[$key] = true;
        $stations[] = $row;
    }

    geo_respond([
        'ok' => true,
        'query' => $q,
        'source_record_count' => count($rows),
        'station_point_count' => count($stations),
        'stations' => $stations,
    ]);
} catch (Throwable $e) {
    error_log('GEO line station search failed: ' . $e->getMessage());
    geo_respond(['ok' => false, 'error' => '沿線検索に失敗しました。'], 500);
}
