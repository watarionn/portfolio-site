<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Response;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class PlaceholderController
{
    public function __construct(
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
        private string $route,
        private string $heading,
        private string $description,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = []): Response
    {
        $route = $this->route;
        if (isset($parameters['slug'])) {
            $route = str_replace('{slug}', $parameters['slug'], $route);
        }
        $model = new PageViewModel(
            template: 'pages/placeholder',
            title: $this->heading . ' | HoloScope',
            description: $this->description,
            canonical: $this->canonical->absolute($route),
            robots: 'noindex,follow',
            heading: $this->heading,
            breadcrumbs: [
                ['label' => 'トップ', 'url' => $this->canonical->absolute('/')],
                ['label' => $this->heading, 'url' => null],
            ],
            data: ['description' => $this->description],
        );
        return Response::html($this->view->render($model));
    }
}
