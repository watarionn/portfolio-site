<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');

function geo_respond(array $payload, int $status = 200): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function geo_config_value(string $geoName, string $fallbackName): string {
    if (defined($geoName) && (string) constant($geoName) !== '') {
        return (string) constant($geoName);
    }
    if (defined($fallbackName) && (string) constant($fallbackName) !== '') {
        return (string) constant($fallbackName);
    }
    return '';
}

function geo_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $configPath = __DIR__ . '/../config.php';
    if (!is_file($configPath)) {
        error_log('GEO database config is missing.');
        geo_respond(['ok' => false, 'error' => '検索サービスは現在利用できません。'], 503);
    }
    require_once $configPath;

    $host = geo_config_value('GEO_DB_HOST', 'DB_HOST');
    $name = geo_config_value('GEO_DB_NAME', 'DB_NAME');
    $user = geo_config_value('GEO_DB_USER', 'DB_USER');
    $pass = geo_config_value('GEO_DB_PASS', 'DB_PASS');
    $charset = geo_config_value('GEO_DB_CHARSET', 'DB_CHARSET') ?: 'utf8mb4';

    if ($host === '' || $name === '' || $user === '') {
        error_log('GEO database config is incomplete.');
        geo_respond(['ok' => false, 'error' => '検索サービスは現在利用できません。'], 503);
    }

    try {
        $pdo = new PDO(
            sprintf('mysql:host=%s;dbname=%s;charset=%s', $host, $name, $charset),
            $user,
            $pass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    } catch (Throwable $e) {
        error_log('GEO database connection failed: ' . $e->getMessage());
        geo_respond(['ok' => false, 'error' => '検索サービスは現在利用できません。'], 503);
    }

    return $pdo;
}

function geo_q(int $maxLength = 64): string {
    $q = trim((string) ($_GET['q'] ?? ''));
    if ($q === '') {
        geo_respond(['ok' => false, 'error' => '検索語を入力してください。'], 400);
    }
    if (mb_strlen($q, 'UTF-8') > $maxLength) {
        geo_respond(['ok' => false, 'error' => '検索語が長すぎます。'], 400);
    }
    return $q;
}

function geo_limit(int $default = 30, int $max = 100): int {
    $value = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT);
    if ($value === false || $value === null) {
        return $default;
    }
    return max(1, min($max, $value));
}

function geo_like_literal(string $value): string {
    return strtr($value, ['\\' => '\\\\', '%' => '\\%', '_' => '\\_']);
}

function geo_distance_m(float $lat1, float $lng1, float $lat2, float $lng2): float {
    $earth = 6371000.0;
    $p1 = deg2rad($lat1);
    $p2 = deg2rad($lat2);
    $dp = deg2rad($lat2 - $lat1);
    $dl = deg2rad($lng2 - $lng1);
    $a = sin($dp / 2) ** 2 + cos($p1) * cos($p2) * sin($dl / 2) ** 2;
    return 2 * $earth * asin(min(1.0, sqrt($a)));
}
