<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class PhraseCatalogController
{
    public function __construct(
        private JsonPageRepository $repository, private ViewRenderer $view, private CanonicalUrlService $canonical,
        private string $collection, private string $label,
    ) {}

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = [], ?Request $request = null): Response
    {
        $query = $request?->queryParameters() ?? [];
        $keyword = is_string($query['q'] ?? null) ? trim((string) $query['q']) : '';
        $category = is_string($query['category'] ?? null) && preg_match('/^[a-z]+(?:-[a-z]+)*$/', (string) $query['category']) === 1 ? (string) $query['category'] : '';
        $register = is_string($query['register'] ?? null) && preg_match('/^[a-z_]+$/', (string) $query['register']) === 1 ? (string) $query['register'] : '';
        $index = $this->repository->index($this->collection);
        $items = array_values(array_filter($index['items'], static function (mixed $item) use ($keyword, $category, $register): bool {
            if (!is_array($item)) { return false; }
            if ($category !== '' && ($item['category'] ?? '') !== $category) { return false; }
            if ($register !== '' && ($item['register'] ?? '') !== $register) { return false; }
            if ($keyword === '') { return true; }
            $haystack = strtolower(implode(' ', [
                (string) ($item['standardForm'] ?? ''), (string) ($item['meaningJa'] ?? ''),
                implode(' ', is_array($item['speakers'] ?? null) ? $item['speakers'] : []),
            ]));
            return str_contains($haystack, strtolower($keyword));
        }));
        $filtered = $keyword !== '' || $category !== '' || $register !== '';
        $route = '/learning/' . $this->collection . '/';
        $model = new PageViewModel(
            template: 'pages/phrase-catalog', title: $this->label . ' | HoloScope',
            description: '確認済みの配信内使用例を、発言者、時刻、原文、訳、文脈とともに掲載します。',
            canonical: $this->canonical->absolute($route), robots: $filtered ? 'noindex,follow' : 'index,follow', heading: $this->label,
            breadcrumbs: [
                ['label'=>'トップ','url'=>$this->canonical->absolute('/')],
                ['label'=>'英語学習','url'=>$this->canonical->absolute('/learning/')],
                ['label'=>$this->label,'url'=>null],
            ],
            data: ['collection'=>$this->collection,'index'=>$index,'items'=>$items,'keyword'=>$keyword,'category'=>$category,'register'=>$register],
        );
        return Response::html($this->view->render($model));
    }
}
