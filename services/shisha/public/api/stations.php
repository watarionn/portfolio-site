<?php
declare(strict_types=1);
require dirname(__DIR__) . '/includes/bootstrap.php';

$allowedMethods = ['getLines', 'getStations', 'getStationsByName', 'getStationsByGeoPoint'];
$method = (string)($_GET['method'] ?? 'getLines');
if (!in_array($method, $allowedMethods, true)) {
    json_response(['response' => [], 'error' => 'invalid_method'], 400);
}

$params = ['method' => $method];
foreach (['prefecture', 'line', 'name', 'x', 'y'] as $key) {
    if (isset($_GET[$key]) && $_GET[$key] !== '') {
        $params[$key] = mb_substr((string)$_GET[$key], 0, 100);
    }
}

$url = (string)$config['station_endpoint'] . '?' . http_build_query($params);
$data = remote_json($url);
if ($data === []) {
    json_response(['response' => []]);
}

$response = $data['response'] ?? null;
if (is_array($response) && isset($response['line']) && is_array($response['line'])) {
    $seen = [];
    $response['line'] = array_values(array_filter($response['line'], static function ($line) use (&$seen): bool {
        $label = trim((string)$line);
        if ($label === '') {
            return false;
        }
        $key = lower_text(function_exists('mb_convert_kana')
            ? mb_convert_kana($label, 'asKV', 'UTF-8')
            : $label);
        $key = preg_replace('/[\\s　]+/u', '', $key) ?? $key;
        if (isset($seen[$key])) {
            return false;
        }
        $seen[$key] = true;
        return true;
    }));
    $data['response'] = $response;
}

if (is_array($response) && isset($response['station']) && is_array($response['station'])) {
    $seen = [];
    $response['station'] = array_values(array_filter($response['station'], static function ($station) use (&$seen): bool {
        if (!is_array($station)) {
            return false;
        }
        $label = trim((string)($station['name'] ?? ''));
        if ($label === '') {
            return false;
        }
        $key = lower_text(function_exists('mb_convert_kana')
            ? mb_convert_kana($label, 'asKV', 'UTF-8')
            : $label);
        $key = preg_replace('/[\\s　]+/u', '', $key) ?? $key;
        if (isset($seen[$key])) {
            return false;
        }
        $seen[$key] = true;
        return true;
    }));
    $data['response'] = $response;
}

json_response($data);
