<?php

declare(strict_types=1);

namespace HoloScope\Config;

use HoloScope\Service\ReleaseLocator;

final readonly class AppConfig
{
    public function __construct(
        public string $siteRoot,
        public string $canonicalScheme,
        public string $canonicalHost,
        public string $basePath,
        public string $siteName,
        public string $dataDirectory,
        public string $templateDirectory,
        public bool $debug,
    ) {
    }

    public static function fromEnvironment(string $siteRoot): self
    {
        $siteRoot = rtrim(str_replace('\\', '/', $siteRoot), '/');
        $scheme = self::env('HOLOSCOPE_CANONICAL_SCHEME', 'https');
        $host = strtolower(self::env('HOLOSCOPE_CANONICAL_HOST', 'cf278796.cloudfree.jp'));
        $basePath = self::normalizeBasePath(self::env('HOLOSCOPE_BASE_PATH', '/holoscope'));
        $debug = filter_var(self::env('HOLOSCOPE_DEBUG', '0'), FILTER_VALIDATE_BOOL);

        $fallbackDataDirectory = self::env('HOLOSCOPE_DATA_DIRECTORY', $siteRoot . '/data');
        $dataDirectory = ReleaseLocator::resolve($siteRoot, $fallbackDataDirectory);

        return new self(
            siteRoot: $siteRoot,
            canonicalScheme: $scheme,
            canonicalHost: $host,
            basePath: $basePath,
            siteName: 'ホロライブEN観測所 HoloScope',
            dataDirectory: $dataDirectory,
            templateDirectory: $siteRoot . '/templates',
            debug: $debug,
        );
    }

    private static function env(string $name, string $default): string
    {
        $value = getenv($name);
        return is_string($value) && $value !== '' ? $value : $default;
    }

    private static function normalizeBasePath(string $path): string
    {
        $path = '/' . trim(str_replace('\\', '/', $path), '/');
        return $path === '/' ? '' : strtolower($path);
    }
}
