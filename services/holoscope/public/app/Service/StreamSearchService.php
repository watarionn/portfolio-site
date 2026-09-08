<?php

declare(strict_types=1);

namespace HoloScope\Service;

use HoloScope\Exception\NotFoundException;
use HoloScope\Repository\StreamSearchRepository;
use HoloScope\Search\StreamSearchCriteria;

final readonly class StreamSearchService
{
    public function __construct(private StreamSearchRepository $repository)
    {
    }

    /** @return array<string, mixed> */
    public function search(StreamSearchCriteria $criteria): array
    {
        $manifest = $this->repository->manifest();
        $ids = range(0, max(0, $manifest['count'] - 1));
        if ($manifest['count'] === 0) {
            $ids = [];
        }

        foreach ($this->tokenize($criteria->keyword) as $token) {
            $ids = $this->intersect($ids, $this->repository->idsForToken($token));
        }

        $filters = [
            'member' => $criteria->member,
            'generation' => $criteria->generation,
            'type' => $criteria->type,
            'game' => $criteria->game,
            'event' => $criteria->event,
            'series' => $criteria->series,
            'collaboration' => $criteria->collaboration,
            'participant' => $criteria->participant,
            'month' => $criteria->month,
            'duration' => $criteria->duration,
        ];
        foreach ($filters as $dimension => $value) {
            if ($value !== '') {
                $ids = $this->intersect($ids, $this->repository->idsForFilter($dimension, $value));
            }
        }

        if ($criteria->cefr !== []) {
            $cefrIds = [];
            foreach ($criteria->cefr as $level) {
                $cefrIds = array_values(array_unique(array_merge($cefrIds, $this->repository->idsForFilter('cefr', $level))));
            }
            sort($cefrIds);
            $ids = $this->intersect($ids, $cefrIds);
        }

        $total = count($ids);
        $perPage = $manifest['perPage'];
        $pageCount = max(1, (int) ceil($total / $perPage));
        if ($criteria->page > $pageCount && $criteria->page > 1) {
            throw new NotFoundException('Search result page does not exist.');
        }
        $pageIds = array_slice($ids, ($criteria->page - 1) * $perPage, $perPage);
        return [
            'criteria' => $criteria,
            'total' => $total,
            'page' => $criteria->page,
            'pageCount' => $pageCount,
            'perPage' => $perPage,
            'cards' => $this->repository->cards($pageIds, $manifest['shardSize']),
            'options' => $manifest['options'],
        ];
    }

    /** @return list<string> */
    private function tokenize(string $text): array
    {
        if ($text === '') {
            return [];
        }
        preg_match_all('/[a-z0-9]+|[\x{3040}-\x{30ff}\x{3400}-\x{9fff}々ー]+/u', strtolower($text), $matches);
        $tokens = [];
        foreach ($matches[0] ?? [] as $token) {
            if (preg_match('/^[a-z0-9]+$/', $token) === 1) {
                if (strlen($token) >= 2) {
                    $tokens[$token] = true;
                }
                continue;
            }
            $characters = preg_split('//u', $token, -1, PREG_SPLIT_NO_EMPTY);
            if (!is_array($characters) || count($characters) < 2) {
                continue;
            }
            $tokens[$token] = true;
            for ($index = 0; $index < count($characters) - 1; $index++) {
                $tokens[$characters[$index] . $characters[$index + 1]] = true;
            }
        }
        return array_keys($tokens);
    }

    /** @param list<int> $left @param list<int> $right @return list<int> */
    private function intersect(array $left, array $right): array
    {
        if ($left === [] || $right === []) {
            return [];
        }
        $rightMap = array_fill_keys($right, true);
        return array_values(array_filter($left, static fn (int $id): bool => isset($rightMap[$id])));
    }
}
