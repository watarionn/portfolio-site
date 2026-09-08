<?php

declare(strict_types=1);

namespace HoloScope\Service;

use HoloScope\Exception\NotFoundException;
use HoloScope\Repository\LearningStreamSearchRepository;
use HoloScope\Search\LearningStreamCriteria;

final readonly class LearningStreamSearchService
{
    public function __construct(private LearningStreamSearchRepository $repository) {}

    /** @return array<string, mixed> */
    public function search(LearningStreamCriteria $criteria): array
    {
        $manifest = $this->repository->manifest();
        $ids = $manifest['count'] > 0 ? range(0, $manifest['count'] - 1) : [];
        foreach ($this->tokenize($criteria->keyword) as $token) {
            $ids = $this->intersect($ids, $this->repository->idsForToken($token, $manifest['invertedShardCount']));
        }
        foreach (['member','type','speed','clarity','overlap','slang','context'] as $dimension) {
            $value = $criteria->{$dimension};
            if ($value !== '') { $ids = $this->intersect($ids, $this->repository->idsForFilter($dimension, $value)); }
        }
        if ($criteria->cefr !== []) {
            $or = [];
            foreach ($criteria->cefr as $level) { $or = array_values(array_unique(array_merge($or, $this->repository->idsForFilter('cefr', $level)))); }
            sort($or); $ids = $this->intersect($ids, $or);
        }
        $total = count($ids); $perPage = $manifest['perPage']; $pageCount = max(1, (int) ceil($total / $perPage));
        if ($criteria->page > $pageCount && $criteria->page > 1) { throw new NotFoundException('Learning search page does not exist.'); }
        $pageIds = array_slice($ids, ($criteria->page - 1) * $perPage, $perPage);
        return [
            'criteria' => $criteria, 'total' => $total, 'page' => $criteria->page, 'pageCount' => $pageCount,
            'cards' => $this->repository->cards($pageIds, $manifest['shardSize']), 'options' => $manifest['options'],
        ];
    }

    /** @return list<string> */
    private function tokenize(string $text): array
    {
        if ($text === '') { return []; }
        preg_match_all('/[a-z0-9]+|[\x{3040}-\x{30ff}\x{3400}-\x{9fff}々ー]+/u', strtolower($text), $matches);
        $tokens = [];
        foreach ($matches[0] ?? [] as $token) {
            if (preg_match('/^[a-z0-9]+$/', $token) === 1) {
                if (strlen($token) >= 2) { $tokens[$token] = true; }
                continue;
            }
            $chars = preg_split('//u', $token, -1, PREG_SPLIT_NO_EMPTY);
            if (!is_array($chars) || count($chars) < 2) { continue; }
            $tokens[$token] = true;
            for ($i=0; $i<count($chars)-1; $i++) { $tokens[$chars[$i] . $chars[$i+1]] = true; }
        }
        return array_keys($tokens);
    }

    /** @param list<int> $left @param list<int> $right @return list<int> */
    private function intersect(array $left, array $right): array
    {
        if ($left === [] || $right === []) { return []; }
        $map = array_fill_keys($right, true);
        return array_values(array_filter($left, static fn (int $id): bool => isset($map[$id])));
    }
}
