<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Exception\NotFoundException;
use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class FeatureArticleCatalogController
{
    public function __construct(private JsonPageRepository $repository, private ViewRenderer $view, private CanonicalUrlService $canonical) {}

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = [], ?Request $request = null): Response
    {
        $query = $request?->queryParameters() ?? [];
        $category = is_string($query['category'] ?? null) && preg_match('/^[a-z]+(?:-[a-z]+)*$/', (string) $query['category']) === 1 ? (string) $query['category'] : '';
        $pageValue = $query['page'] ?? '1';
        $page = is_string($pageValue) && preg_match('/^[1-9][0-9]{0,4}$/', $pageValue) === 1 ? (int) $pageValue : 1;
        $index = $this->repository->index('articles');
        $items = array_values(array_filter($index['items'], static fn (mixed $item): bool => is_array($item) && ($category === '' || ($item['primaryCategory'] ?? '') === $category)));
        $perPage = is_int($index['perPage'] ?? null) ? $index['perPage'] : 12;
        $pageCount = max(1, (int) ceil(count($items) / $perPage));
        if ($page > $pageCount && $page > 1) { throw new NotFoundException('Article catalog page does not exist.'); }
        $pageItems = array_slice($items, ($page - 1) * $perPage, $perPage);
        $filtered = $category !== '' || $page > 1;
        $model = new PageViewModel(
            template: 'pages/feature-catalog', title: '特集記事 | HoloScope',
            description: '複数の配信やエンティティを横断し、読者の問いに答える特集記事です。',
            canonical: $this->canonical->absolute('/articles/'), robots: $filtered ? 'noindex,follow' : 'index,follow', heading: '特集記事',
            breadcrumbs: [['label'=>'トップ','url'=>$this->canonical->absolute('/')],['label'=>'特集記事','url'=>null]],
            data: ['items'=>$pageItems,'total'=>count($items),'page'=>$page,'pageCount'=>$pageCount,'category'=>$category],
        );
        return Response::html($this->view->render($model));
    }
}
