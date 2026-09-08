<?php

declare(strict_types=1);

namespace HoloScope\Repository;

use HoloScope\Exception\DataSourceException;

final class LearningStreamSearchRepository
{
    /** @var array<string, array<string, mixed>> */
    private array $cache = [];

    public function __construct(private readonly string $dataDirectory) {}

    /** @return array<string, mixed> */
    public function manifest(): array
    {
        $data = $this->read('learning/streams/manifest.json');
        foreach (['count','perPage','shardSize','cardShardCount','invertedShardCount','options'] as $key) {
            if (!array_key_exists($key, $data)) { throw new DataSourceException('Learning search manifest is missing: ' . $key); }
        }
        if (!is_int($data['count']) || !is_int($data['perPage']) || !is_int($data['shardSize']) || !is_array($data['options'])) {
            throw new DataSourceException('Learning search manifest has invalid field types.');
        }
        return $data;
    }

    /** @return list<int> */
    public function idsForToken(string $token, int $shardCount): array
    {
        $shard = (string) (hexdec(substr(hash('sha256', $token), 0, 1)) % $shardCount);
        $path = 'learning/streams/inverted/' . $shard . '.json';
        if (!is_file($this->dataDirectory . '/' . $path)) { return []; }
        $data = $this->read($path);
        return $this->validateIds($data['tokens'][$token] ?? []);
    }

    /** @return list<int> */
    public function idsForFilter(string $dimension, string $value): array
    {
        if (preg_match('/^[a-z]+$/', $dimension) !== 1) { throw new DataSourceException('Invalid learning filter dimension.'); }
        $path = 'learning/streams/filters/' . $dimension . '.json';
        if (!is_file($this->dataDirectory . '/' . $path)) { return []; }
        $data = $this->read($path);
        if (($data['dimension'] ?? null) !== $dimension || !is_array($data['values'] ?? null)) {
            throw new DataSourceException('Learning filter index has an invalid structure.');
        }
        return $this->validateIds($data['values'][$value] ?? []);
    }

    /** @param list<int> $ids @return list<array<string, mixed>> */
    public function cards(array $ids, int $shardSize): array
    {
        $byShard = [];
        foreach ($ids as $id) { $byShard[intdiv($id, $shardSize)][] = $id; }
        $found = [];
        foreach ($byShard as $shard => $wanted) {
            $data = $this->read(sprintf('learning/streams/cards/%04d.json', $shard));
            if (!is_array($data['items'] ?? null)) { throw new DataSourceException('Learning card shard is invalid.'); }
            $wantedMap = array_fill_keys($wanted, true);
            foreach ($data['items'] as $card) {
                if (!is_array($card) || !is_int($card['id'] ?? null)) { throw new DataSourceException('Learning card is invalid.'); }
                if (isset($wantedMap[$card['id']])) { $found[$card['id']] = $card; }
            }
        }
        $ordered = [];
        foreach ($ids as $id) {
            if (!isset($found[$id])) { throw new DataSourceException('Learning search card is missing.'); }
            $ordered[] = $found[$id];
        }
        return $ordered;
    }

    /** @return array<string, mixed> */
    private function read(string $relative): array
    {
        if (preg_match('~^[a-z0-9/_-]+\.json$~', $relative) !== 1) { throw new DataSourceException('Invalid learning data path.'); }
        if (isset($this->cache[$relative])) { return $this->cache[$relative]; }
        $path = $this->dataDirectory . '/' . $relative;
        $raw = is_file($path) ? file_get_contents($path) : false;
        if (!is_string($raw)) { throw new DataSourceException('Learning data is missing: ' . $relative); }
        try { $data = json_decode($raw, true, 128, JSON_THROW_ON_ERROR); }
        catch (\JsonException $e) { throw new DataSourceException('Learning data is malformed.', 0, $e); }
        if (!is_array($data) || array_is_list($data) || ($data['schemaVersion'] ?? null) !== '1.0.0') {
            throw new DataSourceException('Learning data has an invalid root.');
        }
        return $this->cache[$relative] = $data;
    }

    /** @return list<int> */
    private function validateIds(mixed $value): array
    {
        if (!is_array($value)) { throw new DataSourceException('Learning index IDs must be an array.'); }
        $ids = [];
        foreach ($value as $id) {
            if (!is_int($id) || $id < 0) { throw new DataSourceException('Learning index contains an invalid ID.'); }
            $ids[] = $id;
        }
        return $ids;
    }
}
