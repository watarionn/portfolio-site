<?php

declare(strict_types=1);

namespace HoloScope\Service;

use HoloScope\Config\AppConfig;
use HoloScope\Http\Request;

final readonly class CanonicalUrlService
{
    public function __construct(private AppConfig $config)
    {
    }

    public function redirectTarget(Request $request): ?string
    {
        $routePath = $request->routePath($this->config->basePath);
        if ($routePath === null) {
            return null;
        }

        $normalizedRoute = self::normalizeRoutePath($routePath);
        $canonicalPath = $this->config->basePath . ($normalizedRoute === '/' ? '/' : $normalizedRoute);
        if ($canonicalPath === '') {
            $canonicalPath = '/';
        }

        $needsRedirect = $request->scheme !== $this->config->canonicalScheme
            || strtolower($request->host) !== $this->config->canonicalHost
            || $request->path !== $canonicalPath;

        if (!$needsRedirect) {
            return null;
        }

        $target = $this->config->canonicalScheme . '://' . $this->config->canonicalHost . $canonicalPath;
        if ($request->queryString !== '') {
            $target .= '?' . $request->queryString;
        }
        return $target;
    }

    public function absolute(string $routePath): string
    {
        $normalized = self::normalizeRoutePath($routePath);
        return $this->config->canonicalScheme . '://' . $this->config->canonicalHost
            . $this->config->basePath . ($normalized === '/' ? '/' : $normalized);
    }

    public static function normalizeRoutePath(string $path): string
    {
        $path = str_replace('\\', '/', $path);
        $path = preg_replace('~/+~', '/', $path) ?? $path;
        $path = '/' . ltrim($path, '/');
        $path = strtolower($path);
        if ($path !== '/') {
            $path = rtrim($path, '/') . '/';
        }
        return $path;
    }
}
