<?php

declare(strict_types=1);

namespace HoloScope\Repository;

use HoloScope\Exception\DataSourceException;
use HoloScope\Exception\NotFoundException;

final readonly class JsonPageRepository
{
    public function __construct(private string $dataDirectory)
    {
    }

    /** @param list<string> $requiredKeys @return array<string, mixed> */
    public function detail(string $collection, string $slug, array $requiredKeys): array
    {
        $this->assertSafeName($collection);
        $this->assertSafeName($slug);
        $data = $this->read($this->dataDirectory . '/' . $collection . '/' . $slug . '.json');
        $this->assertRequired($data, $requiredKeys);
        if (($data['publicationStatus'] ?? 'published') !== 'published') {
            throw new NotFoundException('The requested page is not public.');
        }
        if (($data['slug'] ?? null) !== $slug) {
            throw new DataSourceException('The JSON slug does not match the requested slug.');
        }
        return $data;
    }

    /** @return array<string, mixed> */
    public function index(string $collection): array
    {
        $this->assertSafeName($collection);
        $data = $this->read($this->dataDirectory . '/' . $collection . '/index.json');
        $this->assertRequired($data, ['schemaVersion', 'count', 'items']);
        if (!is_int($data['count']) || !is_array($data['items']) || $data['count'] !== count($data['items'])) {
            throw new DataSourceException('The index count does not match its items.');
        }
        return $data;
    }

    /** @param list<string> $requiredKeys @return array<string, mixed> */
    public function document(string $relative, array $requiredKeys): array
    {
        if (preg_match('~^[a-z0-9/_-]+\.json$~', $relative) !== 1 || str_contains($relative, '..')) {
            throw new NotFoundException('Invalid data document path.');
        }
        $data = $this->read($this->dataDirectory . '/' . $relative);
        $this->assertRequired($data, $requiredKeys);
        return $data;
    }

    /** @return array<string, mixed> */
    public function site(): array
    {
        $data = $this->read($this->dataDirectory . '/site.json');
        $this->assertRequired($data, ['schemaVersion', 'title', 'hero', 'description']);
        return $data;
    }

    /** @return array<string, mixed> */
    public function home(): array
    {
        $data = $this->read($this->dataDirectory . '/home.json');
        $this->assertRequired($data, [
            'schemaVersion', 'latestStreams', 'beginnerStreams', 'generations',
            'popularGames', 'recentEvents', 'activeSeries', 'latestArticles', 'counts',
        ]);
        foreach (['latestStreams', 'beginnerStreams', 'generations', 'popularGames', 'recentEvents', 'activeSeries', 'latestArticles'] as $key) {
            if (!is_array($data[$key])) {
                throw new DataSourceException('Home data has an invalid list: ' . $key);
            }
        }
        if (!is_array($data['counts'])) {
            throw new DataSourceException('Home data counts must be an object.');
        }
        return $data;
    }

    /** @return array<string, mixed> */
    private function read(string $path): array
    {
        if (!is_file($path)) {
            throw new NotFoundException('JSON data was not found.');
        }
        $raw = file_get_contents($path);
        if (!is_string($raw)) {
            throw new DataSourceException('JSON data cannot be read.');
        }
        try {
            $value = json_decode($raw, true, 128, JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new DataSourceException('JSON data is malformed.', 0, $exception);
        }
        if (!is_array($value) || array_is_list($value)) {
            throw new DataSourceException('The JSON root must be an object.');
        }
        return $value;
    }

    /** @param array<string, mixed> $data @param list<string> $requiredKeys */
    private function assertRequired(array $data, array $requiredKeys): void
    {
        foreach ($requiredKeys as $key) {
            if (!array_key_exists($key, $data)) {
                throw new DataSourceException('A required JSON key is missing: ' . $key);
            }
        }
        if (($data['schemaVersion'] ?? null) !== '1.0.0') {
            throw new DataSourceException('Unsupported JSON schemaVersion.');
        }
    }

    private function assertSafeName(string $value): void
    {
        if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value) !== 1) {
            throw new NotFoundException('Invalid route segment.');
        }
    }
}
