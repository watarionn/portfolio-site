<?php

declare(strict_types=1);

use HoloScope\Config\AppConfig;
use HoloScope\Http\Response;

require __DIR__ . '/app/bootstrap.php';

try {
    $config = AppConfig::fromEnvironment(__DIR__);
    $releaseRoot = realpath(__DIR__ . '/releases');
    $activeDataDirectory = realpath($config->dataDirectory);

    if (
        $releaseRoot === false
        || $activeDataDirectory === false
        || !str_starts_with($activeDataDirectory, $releaseRoot . DIRECTORY_SEPARATOR)
    ) {
        throw new RuntimeException('The active HoloScope data directory is not an immutable release.');
    }

    $releaseId = basename(str_replace('\\', '/', $activeDataDirectory));
    if (preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{2,80}$/', $releaseId) !== 1) {
        throw new RuntimeException('The active HoloScope release ID is invalid.');
    }

    $body = json_encode(
        [
            'status' => 'ok',
            'releaseId' => $releaseId,
        ],
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
    );
    $response = new Response($body . "\n", 200, [
        'Content-Type' => 'application/json; charset=UTF-8',
        'Cache-Control' => 'no-store, max-age=0',
        'X-Content-Type-Options' => 'nosniff',
        'X-Robots-Tag' => 'noindex, nofollow, noarchive',
    ]);
} catch (Throwable $exception) {
    error_log('[HoloScope] Release status error: ' . $exception->getMessage());
    $response = new Response("{\"status\":\"unavailable\"}\n", 503, [
        'Content-Type' => 'application/json; charset=UTF-8',
        'Cache-Control' => 'no-store, max-age=0',
        'X-Content-Type-Options' => 'nosniff',
        'X-Robots-Tag' => 'noindex, nofollow, noarchive',
    ]);
}

$response->send();
