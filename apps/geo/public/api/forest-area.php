<?php
declare(strict_types=1);
require __DIR__ . '/_common.php';

$areaId = strtoupper(trim((string) ($_GET['area'] ?? '')));
if (!preg_match('/^[A-Z]$/', $areaId)) {
    geo_respond(['ok' => false, 'error' => '区画を指定してください。'], 400);
}

$forestPath = __DIR__ . '/../data/forest.json';
$raw = @file_get_contents($forestPath);
$model = $raw === false ? null : json_decode($raw, true);
if (!is_array($model) || !isset($model['areas'][$areaId]['items'])) {
    geo_respond(['ok' => false, 'error' => '森のデータを読み込めませんでした。'], 500);
}

function geo_hiragana(string $value): string {
    $value = mb_convert_kana($value, 'KV', 'UTF-8');
    return mb_convert_kana($value, 'c', 'UTF-8');
}

$pdo = geo_pdo();
$station = $pdo->prepare(
    'SELECT s.station_code, s.station_name, s.station_reading,
            GROUP_CONCAT(l.line_name ORDER BY sl.source_order SEPARATOR " / ") AS line_names
       FROM geo_stations s
       LEFT JOIN geo_station_lines sl ON sl.station_code = s.station_code
       LEFT JOIN geo_lines l ON l.line_code = sl.line_code
      WHERE s.station_code = ?
      GROUP BY s.station_code, s.station_name, s.station_reading'
);
$address = $pdo->prepare(
    'SELECT address_record_id, address_code, prefecture_name, municipality_name,
            town_name, block_name, town_kana, block_kana
       FROM geo_addresses
      WHERE address_record_id = ?'
);

$resolved = [];
foreach ($model['areas'][$areaId]['items'] as $item) {
    $id = (string) ($item['id'] ?? '');
    $name = (string) ($item['name'] ?? '');
    $binding = $item['binding'] ?? null;
    if ($id === '' || $name === '' || !is_array($binding)) {
        geo_respond(['ok' => false, 'error' => '森のbindingが不正です。'], 500);
    }

    if (($binding['kind'] ?? '') === 'station') {
        $code = (string) ($binding['stationCode'] ?? '');
        $station->execute([$code]);
        $row = $station->fetch();
        if (!$row || (string) $row['station_name'] !== $name || (string) $row['station_reading'] === '') {
            error_log('GEO forest station binding mismatch: ' . $areaId . '/' . $id);
            geo_respond(['ok' => false, 'error' => '森の駅データを確認できませんでした。'], 503);
        }
        $resolved[$id] = [
            'reading' => geo_hiragana((string) $row['station_reading']),
            'source' => [
                'kind' => 'station',
                'stationCode' => $code,
                'lineNames' => (string) ($row['line_names'] ?? ''),
            ],
        ];
        continue;
    }

    if (($binding['kind'] ?? '') === 'address') {
        $recordId = (int) ($binding['addressRecordId'] ?? 0);
        $address->execute([$recordId]);
        $row = $address->fetch();
        if (!$row) {
            error_log('GEO forest address binding missing: ' . $areaId . '/' . $id);
            geo_respond(['ok' => false, 'error' => '森の住所データを確認できませんでした。'], 503);
        }

        $reading = '';
        if ((string) ($row['block_name'] ?? '') === $name) {
            $reading = (string) ($row['block_kana'] ?? '');
        } elseif ((string) ($row['town_name'] ?? '') === $name) {
            $reading = (string) ($row['town_kana'] ?? '');
        }
        if ($reading === '') {
            error_log('GEO forest address binding mismatch: ' . $areaId . '/' . $id);
            geo_respond(['ok' => false, 'error' => '森の住所データを確認できませんでした。'], 503);
        }

        $parts = array_values(array_filter([
            $row['prefecture_name'] ?? null,
            $row['municipality_name'] ?? null,
            $row['town_name'] ?? null,
            $row['block_name'] ?? null,
        ], static fn($v) => $v !== null && $v !== ''));

        $resolved[$id] = [
            'reading' => geo_hiragana($reading),
            'source' => [
                'kind' => 'address',
                'addressRecordId' => $recordId,
                'addressCode' => (string) $row['address_code'],
                'location' => implode(' ', $parts),
            ],
        ];
        continue;
    }

    geo_respond(['ok' => false, 'error' => '森のbinding種別が不正です。'], 500);
}

geo_respond([
    'ok' => true,
    'area' => $areaId,
    'items' => $resolved,
]);
