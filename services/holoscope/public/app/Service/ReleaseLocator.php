<?php

declare(strict_types=1);

namespace HoloScope\Service;

final class ReleaseLocator
{
    public static function resolve(string $siteRoot, string $fallbackDataDirectory): string
    {
        $pointer = $siteRoot . '/data/current-release.json';
        if (!is_file($pointer)) {
            return $fallbackDataDirectory;
        }
        $raw = file_get_contents($pointer);
        if (!is_string($raw)) {
            return $fallbackDataDirectory;
        }
        try {
            $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return $fallbackDataDirectory;
        }
        $releaseId = $data['releaseId'] ?? null;
        if (!is_string($releaseId) || preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{2,80}$/', $releaseId) !== 1) {
            return $fallbackDataDirectory;
        }
        $releaseRoot = realpath($siteRoot . '/releases');
        $release = realpath($siteRoot . '/releases/' . $releaseId);
        if ($releaseRoot === false || $release === false || !str_starts_with($release, $releaseRoot . DIRECTORY_SEPARATOR)) {
            return $fallbackDataDirectory;
        }
        if (!is_file($release . '/manifest.json') || !is_file($release . '/release-manifest.json')) {
            return $fallbackDataDirectory;
        }
        return $release;
    }
}
