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
json_response($data !== [] ? $data : ['response' => []]);
