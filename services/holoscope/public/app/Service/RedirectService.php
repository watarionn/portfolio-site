<?php

declare(strict_types=1);

namespace HoloScope\Service;

use HoloScope\Exception\DataSourceException;

final class RedirectService
{
    /** @var array<string, array{status:int,toPath:?string}>|null */
    private ?array $map = null;

    public function __construct(private readonly string $filePath)
    {
    }

    /** @return array{status:int,toPath:?string}|null */
    public function resolve(string $routePath): ?array
    {
        $map = $this->load();
        return $map[$routePath] ?? null;
    }

    /** @return array<string, array{status:int,toPath:?string}> */
    private function load(): array
    {
        if ($this->map !== null) {
            return $this->map;
        }
        if (!is_file($this->filePath)) {
            throw new DataSourceException('Redirect data is missing.');
        }
        $raw = file_get_contents($this->filePath);
        if (!is_string($raw)) {
            throw new DataSourceException('Redirect data cannot be read.');
        }
        try {
            $data = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new DataSourceException('Redirect data is invalid JSON.', 0, $exception);
        }
        if (!is_array($data) || ($data['schemaVersion'] ?? null) !== '1.0.0' || !is_array($data['redirects'] ?? null)) {
            throw new DataSourceException('Redirect data has an invalid structure.');
        }

        $map = [];
        foreach ($data['redirects'] as $entry) {
            if (!is_array($entry)) {
                throw new DataSourceException('Redirect entry must be an object.');
            }
            $from = $entry['fromPath'] ?? null;
            $status = $entry['status'] ?? null;
            $to = $entry['toPath'] ?? null;
            if (!is_string($from) || !in_array($status, [301, 410], true)) {
                throw new DataSourceException('Redirect entry has invalid required fields.');
            }
            $from = CanonicalUrlService::normalizeRoutePath($from);
            if ($status === 301 && !is_string($to)) {
                throw new DataSourceException('A 301 redirect requires toPath.');
            }
            if ($status === 410 && $to !== null) {
                throw new DataSourceException('A 410 redirect must not have toPath.');
            }
            $map[$from] = [
                'status' => $status,
                'toPath' => is_string($to) ? CanonicalUrlService::normalizeRoutePath($to) : null,
            ];
        }
        $this->map = $map;
        return $map;
    }
}
