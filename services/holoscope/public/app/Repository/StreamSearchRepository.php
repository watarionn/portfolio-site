<?php

declare(strict_types=1);

namespace HoloScope\Repository;

use HoloScope\Exception\DataSourceException;

final class StreamSearchRepository
{
    /** @var array<string, array<string, mixed>> */
    private array $cache = [];

    public function __construct(private readonly string $dataDirectory)
    {
    }

    /** @return array<string, mixed> */
    public function manifest(): array
    {
        $manifest = $this->read('search/streams/manifest.json');
        foreach (['schemaVersion', 'count', 'perPage', 'shardSize', 'cardShardCount', 'options'] as $key) {
            if (!array_key_exists($key, $manifest)) {
                throw new DataSourceException('Search manifest is missing: ' . $key);
            }
        }
        if (!is_int($manifest['count']) || !is_int($manifest['perPage']) || !is_int($manifest['shardSize']) || !is_array($manifest['options'])) {
            throw new DataSourceException('Search manifest has invalid field types.');
        }
        return $manifest;
    }

    /** @return list<int> */
    public function idsForToken(string $token): array
    {
        $shard = (string) (hexdec(substr(hash('sha256', $token), 0, 1)) % 4);
        $relative = 'search/streams/inverted/' . $shard . '.json';
        if (!is_file($this->dataDirectory . '/' . $relative)) {
            return [];
        }
        $data = $this->read($relative);
        $ids = $data['tokens'][$token] ?? [];
        return $this->validateIds($ids);
    }

    /** @return list<int> */
    public function idsForFilter(string $dimension, string $value): array
    {
        if (preg_match('/^[a-z]+$/', $dimension) !== 1) {
            throw new DataSourceException('Invalid filter dimension.');
        }
        $relative = 'search/streams/filters/' . $dimension . '.json';
        if (!is_file($this->dataDirectory . '/' . $relative)) {
            return [];
        }
        $data = $this->read($relative);
        if (($data['dimension'] ?? null) !== $dimension || !is_array($data['values'] ?? null)) {
            throw new DataSourceException('Filter index has an invalid structure.');
        }
        return $this->validateIds($data['values'][$value] ?? []);
    }

    /** @param list<int> $ids @return list<array<string, mixed>> */
    public function cards(array $ids, int $shardSize): array
    {
        $byShard = [];
        foreach ($ids as $id) {
            $byShard[intdiv($id, $shardSize)][] = $id;
        }
        $result = [];
        foreach ($byShard as $shard => $wanted) {
            $data = $this->read(sprintf('search/streams/cards/%04d.json', $shard));
            if (!is_array($data['items'] ?? null)) {
                throw new DataSourceException('Card shard has an invalid structure.');
            }
            $wantedMap = array_fill_keys($wanted, true);
            foreach ($data['items'] as $card) {
                if (!is_array($card) || !is_int($card['id'] ?? null)) {
                    throw new DataSourceException('Card shard contains an invalid card.');
                }
                if (isset($wantedMap[$card['id']])) {
                    $result[$card['id']] = $card;
                }
            }
        }
        $ordered = [];
        foreach ($ids as $id) {
            if (!isset($result[$id])) {
                throw new DataSourceException('A search card is missing from its shard.');
            }
            $ordered[] = $result[$id];
        }
        return $ordered;
    }

    /** @return array<string, mixed> */
    private function read(string $relative): array
    {
        if (preg_match('~^[a-z0-9/_-]+\.json$~', $relative) !== 1) {
            throw new DataSourceException('Invalid search data path.');
        }
        if (isset($this->cache[$relative])) {
            return $this->cache[$relative];
        }
        $path = $this->dataDirectory . '/' . $relative;
        if (!is_file($path)) {
            throw new DataSourceException('Search data is missing: ' . $relative);
        }
        $raw = file_get_contents($path);
        if (!is_string($raw)) {
            throw new DataSourceException('Search data cannot be read.');
        }
        try {
            $data = json_decode($raw, true, 128, JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new DataSourceException('Search data is malformed.', 0, $exception);
        }
        if (!is_array($data) || array_is_list($data) || ($data['schemaVersion'] ?? null) !== '1.0.0') {
            throw new DataSourceException('Search data has an invalid root.');
        }
        return $this->cache[$relative] = $data;
    }

    /** @return list<int> */
    private function validateIds(mixed $value): array
    {
        if (!is_array($value)) {
            throw new DataSourceException('Search index IDs must be an array.');
        }
        $result = [];
        foreach ($value as $id) {
            if (!is_int($id) || $id < 0) {
                throw new DataSourceException('Search index contains an invalid ID.');
            }
            $result[] = $id;
        }
        return $result;
    }
}
