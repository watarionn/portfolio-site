<?php
declare(strict_types=1);
require_once __DIR__ . '/_common.php';

$name = geo_q();
$radius = 150.0;

try {
    $stmt = geo_pdo()->prepare("
        SELECT station_record_id, station_code, line_code, line_name,
               station_name, station_reading, longitude, latitude, prefecture_code
        FROM geo_station_records
        WHERE station_name = ?
        ORDER BY prefecture_code, station_code, line_code
    ");
    $stmt->execute([$name]);
    $rows = $stmt->fetchAll();

    // Connected-component grouping by geographic distance.
    // This preserves every source row while presenting nearby interchange records as one place.
    $n = count($rows);
    $parent = range(0, max(0, $n - 1));

    $find = static function (int $x) use (&$parent, &$find): int {
        if ($parent[$x] !== $x) {
            $parent[$x] = $find($parent[$x]);
        }
        return $parent[$x];
    };
    $union = static function (int $a, int $b) use (&$parent, &$find): void {
        $ra = $find($a);
        $rb = $find($b);
        if ($ra !== $rb) {
            $parent[$rb] = $ra;
        }
    };

    for ($i = 0; $i < $n; $i++) {
        if ($rows[$i]['latitude'] === null || $rows[$i]['longitude'] === null) {
            continue;
        }
        for ($j = $i + 1; $j < $n; $j++) {
            if ($rows[$j]['latitude'] === null || $rows[$j]['longitude'] === null) {
                continue;
            }
            $distance = geo_distance_m(
                (float) $rows[$i]['latitude'], (float) $rows[$i]['longitude'],
                (float) $rows[$j]['latitude'], (float) $rows[$j]['longitude']
            );
            if ($distance <= $radius) {
                $union($i, $j);
            }
        }
    }

    $groups = [];
    foreach ($rows as $i => $row) {
        $root = $find($i);
        $groups[$root][] = $row;
    }

    $places = [];
    foreach ($groups as $records) {
        $latitudes = [];
        $longitudes = [];
        $lines = [];
        $codes = [];
        foreach ($records as $record) {
            if ($record['latitude'] !== null) $latitudes[] = (float) $record['latitude'];
            if ($record['longitude'] !== null) $longitudes[] = (float) $record['longitude'];
            $lines[] = $record['line_name'];
            $codes[] = $record['station_code'];
        }
        $places[] = [
            'name' => $name,
            'prefecture_code' => $records[0]['prefecture_code'],
            'latitude' => $latitudes ? array_sum($latitudes) / count($latitudes) : null,
            'longitude' => $longitudes ? array_sum($longitudes) / count($longitudes) : null,
            'lines' => array_values(array_unique($lines)),
            'station_codes' => array_values(array_unique($codes)),
            'source_record_count' => count($records),
        ];
    }

    geo_respond([
        'ok' => true,
        'query' => $name,
        'grouping_radius_m' => $radius,
        'source_record_count' => $n,
        'place_count' => count($places),
        'places' => $places,
    ]);
} catch (Throwable $e) {
    error_log('GEO same-name search failed: ' . $e->getMessage());
    geo_respond(['ok' => false, 'error' => '同名駅検索に失敗しました。'], 500);
}
