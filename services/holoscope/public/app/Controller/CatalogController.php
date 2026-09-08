<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class CatalogController
{
    public function __construct(
        private JsonPageRepository $repository,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
        private string $collection,
        private string $label,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = []): Response
    {
        $index = $this->repository->index($this->collection);
        $route = '/' . $this->collection . '/';
        $model = new PageViewModel(
            template: 'pages/catalog',
            title: $this->label . ' | HoloScope',
            description: 'HoloScopeに登録された' . $this->label . 'を表示します。',
            canonical: $this->canonical->absolute($route),
            robots: 'index,follow',
            heading: $this->label,
            breadcrumbs: [
                ['label' => 'トップ', 'url' => $this->canonical->absolute('/')],
                ['label' => $this->label, 'url' => null],
            ],
            data: ['collection' => $this->collection, 'index' => $index],
        );
        return Response::html($this->view->render($model));
    }
}
