<?php

declare(strict_types=1);

namespace HoloScope\Http;

final readonly class Request
{
    public function __construct(
        public string $method,
        public string $scheme,
        public string $host,
        public string $path,
        public string $queryString = '',
        /** @var array<string, string> */
        public array $headers = [],
    ) {
    }

    public static function fromGlobals(): self
    {
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $path = parse_url($uri, PHP_URL_PATH);
        $query = parse_url($uri, PHP_URL_QUERY);
        $https = (string) ($_SERVER['HTTPS'] ?? '');
        $scheme = ($https !== '' && strtolower($https) !== 'off') ? 'https' : 'http';
        $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        $host = preg_replace('/:\\d+$/', '', $host) ?? $host;

        return new self(
            method: strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            scheme: $scheme,
            host: $host,
            path: is_string($path) && $path !== '' ? $path : '/',
            queryString: is_string($query) ? $query : '',
            headers: self::headersFromGlobals(),
        );
    }

    public function header(string $name): ?string
    {
        $name = strtolower($name);
        return $this->headers[$name] ?? null;
    }

    /** @return array<string, string> */
    private static function headersFromGlobals(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (!is_string($value)) {
                continue;
            }
            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = $value;
            }
        }
        if (!isset($headers['authorization']) && isset($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'])) {
            $headers['authorization'] = 'Basic ' . base64_encode((string) $_SERVER['PHP_AUTH_USER'] . ':' . (string) $_SERVER['PHP_AUTH_PW']);
        }
        return $headers;
    }

    /** @return array<string, mixed> */
    public function queryParameters(): array
    {
        if ($this->queryString === '') {
            return [];
        }
        $parameters = [];
        parse_str($this->queryString, $parameters);
        return is_array($parameters) ? $parameters : [];
    }

    public function routePath(string $basePath): ?string
    {
        if ($basePath === '') {
            return $this->path;
        }
        if ($this->path === $basePath || $this->path === $basePath . '/') {
            return '/';
        }
        $prefix = $basePath . '/';
        if (!str_starts_with($this->path, $prefix)) {
            return null;
        }
        return '/' . ltrim(substr($this->path, strlen($basePath)), '/');
    }
}
