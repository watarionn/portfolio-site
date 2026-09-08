<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Exception\DataSourceException;
use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class DiscoveryCatalogController
{
    public function __construct(
        private JsonPageRepository $repository,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
        private string $collection,
        private string $label,
        private string $description,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = [], ?Request $request = null): Response
    {
        $index = $this->repository->index($this->collection);
        if (!is_array($index['items'])) {
            throw new DataSourceException('Discovery catalog items must be an array.');
        }
        $route = '/' . $this->collection . '/';
        $model = new PageViewModel(
            template: 'pages/discovery-catalog',
            title: $this->label . ' | HoloScope',
            description: $this->description,
            canonical: $this->canonical->absolute($route),
            robots: 'index,follow',
            heading: $this->label,
            breadcrumbs: [
                ['label' => 'トップ', 'url' => $this->canonical->absolute('/')],
                ['label' => $this->label, 'url' => null],
            ],
            data: [
                'collection' => $this->collection,
                'label' => $this->label,
                'description' => $this->description,
                'index' => $index,
            ],
        );
        return Response::html($this->view->render($model));
    }
}
