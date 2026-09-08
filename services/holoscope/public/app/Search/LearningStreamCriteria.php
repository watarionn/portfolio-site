<?php

declare(strict_types=1);

namespace HoloScope\Search;

final readonly class LearningStreamCriteria
{
    /** @param list<string> $cefr */
    public function __construct(
        public string $keyword = '',
        public array $cefr = [],
        public string $member = '',
        public string $type = '',
        public string $speed = '',
        public string $clarity = '',
        public string $overlap = '',
        public string $slang = '',
        public string $context = '',
        public int $page = 1,
    ) {
    }

    /** @param array<string, mixed> $query */
    public static function fromQuery(array $query): self
    {
        $scalar = static function (array $source, string $key): string {
            $value = $source[$key] ?? '';
            return is_string($value) && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value) === 1 ? $value : '';
        };
        $keyword = is_string($query['q'] ?? null) ? trim((string) $query['q']) : '';
        $keyword = preg_replace('/\s+/u', ' ', $keyword) ?? '';
        $keyword = function_exists('mb_substr') ? mb_substr($keyword, 0, 300) : substr($keyword, 0, 300);
        $levels = $query['cefr'] ?? [];
        $levels = is_string($levels) ? [$levels] : $levels;
        $cefr = [];
        if (is_array($levels)) {
            foreach ($levels as $level) {
                if (is_string($level) && in_array($level, ['A1','A2','B1','B2','C1','C2'], true)) {
                    $cefr[] = $level;
                }
            }
        }
        $pageValue = $query['page'] ?? '1';
        $page = is_string($pageValue) && preg_match('/^[1-9][0-9]{0,4}$/', $pageValue) === 1 ? (int) $pageValue : 1;
        return new self(
            keyword: $keyword,
            cefr: array_values(array_unique($cefr)),
            member: $scalar($query, 'member'),
            type: $scalar($query, 'type'),
            speed: $scalar($query, 'speed'),
            clarity: $scalar($query, 'clarity'),
            overlap: $scalar($query, 'overlap'),
            slang: $scalar($query, 'slang'),
            context: $scalar($query, 'context'),
            page: $page,
        );
    }

    /** @return array<string, string|list<string>> */
    public function queryParameters(bool $includePage = true): array
    {
        $result = array_filter([
            'q' => $this->keyword, 'member' => $this->member, 'type' => $this->type,
            'speed' => $this->speed, 'clarity' => $this->clarity, 'overlap' => $this->overlap,
            'slang' => $this->slang, 'context' => $this->context,
        ], static fn (string $value): bool => $value !== '');
        if ($this->cefr !== []) { $result['cefr'] = $this->cefr; }
        if ($includePage && $this->page > 1) { $result['page'] = (string) $this->page; }
        return $result;
    }

    public function hasUserConditions(): bool
    {
        return $this->queryParameters(false) !== [];
    }
}
