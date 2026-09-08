<?php

declare(strict_types=1);

namespace HoloScope\Search;

final readonly class StreamSearchCriteria
{
    /** @param list<string> $cefr */
    public function __construct(
        public string $keyword = '',
        public string $member = '',
        public string $generation = '',
        public string $type = '',
        public string $game = '',
        public string $event = '',
        public string $series = '',
        public string $collaboration = '',
        public string $participant = '',
        public string $month = '',
        public string $duration = '',
        public array $cefr = [],
        public int $page = 1,
        public bool $memberIsFixed = false,
    ) {
    }

    /** @param array<string, mixed> $query */
    public static function fromQuery(array $query, ?string $fixedMember = null): self
    {
        $scalar = static function (array $source, string $key, string $pattern = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/'): string {
            $value = $source[$key] ?? '';
            if (!is_string($value)) {
                return '';
            }
            $value = trim($value);
            return $value !== '' && preg_match($pattern, $value) === 1 ? $value : '';
        };

        $keyword = $query['q'] ?? '';
        if (!is_string($keyword)) {
            $keyword = '';
        }
        $keyword = trim(preg_replace('/\s+/u', ' ', $keyword) ?? '');
        if (strlen($keyword) > 300) {
            $keyword = substr($keyword, 0, 300);
        }

        $pageValue = $query['page'] ?? '1';
        $page = is_string($pageValue) && preg_match('/^[1-9][0-9]{0,4}$/', $pageValue) === 1 ? (int) $pageValue : 1;

        $cefrValue = $query['cefr'] ?? [];
        if (is_string($cefrValue)) {
            $cefrValue = [$cefrValue];
        }
        $allowedCefr = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'unrated'];
        $cefr = [];
        if (is_array($cefrValue)) {
            foreach ($cefrValue as $value) {
                if (is_string($value) && in_array($value, $allowedCefr, true)) {
                    $cefr[] = $value;
                }
            }
        }
        $cefr = array_values(array_unique($cefr));

        $member = $fixedMember ?? $scalar($query, 'member');
        return new self(
            keyword: $keyword,
            member: $member,
            generation: $scalar($query, 'generation'),
            type: $scalar($query, 'type'),
            game: $scalar($query, 'game'),
            event: $scalar($query, 'event'),
            series: $scalar($query, 'series'),
            collaboration: $scalar($query, 'collaboration'),
            participant: $scalar($query, 'participant'),
            month: $scalar($query, 'month', '/^[0-9]{4}-[0-9]{2}$/'),
            duration: $scalar($query, 'duration'),
            cefr: $cefr,
            page: $page,
            memberIsFixed: $fixedMember !== null,
        );
    }

    /** @return array<string, string|list<string>> */
    public function queryParameters(bool $includePage = true): array
    {
        $values = [
            'q' => $this->keyword,
            'member' => $this->memberIsFixed ? '' : $this->member,
            'generation' => $this->generation,
            'type' => $this->type,
            'game' => $this->game,
            'event' => $this->event,
            'series' => $this->series,
            'collaboration' => $this->collaboration,
            'participant' => $this->participant,
            'month' => $this->month,
            'duration' => $this->duration,
        ];
        $result = array_filter($values, static fn (string $value): bool => $value !== '');
        if ($this->cefr !== []) {
            $result['cefr'] = $this->cefr;
        }
        if ($includePage && $this->page > 1) {
            $result['page'] = (string) $this->page;
        }
        return $result;
    }

    public function hasUserConditions(): bool
    {
        return $this->queryParameters(false) !== [];
    }
}
