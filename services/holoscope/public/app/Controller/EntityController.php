<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class EntityController
{
    /** @param list<string> $requiredKeys */
    public function __construct(
        private JsonPageRepository $repository,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
        private string $collection,
        private string $label,
        private array $requiredKeys,
        private string $titleKey,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters): Response
    {
        $slug = $parameters['slug'] ?? '';
        $entity = $this->repository->detail($this->collection, $slug, $this->requiredKeys);
        $title = (string) ($entity[$this->titleKey] ?? $slug);
        $route = '/' . $this->collection . '/' . $slug . '/';
        $model = new PageViewModel(
            template: 'pages/entity',
            title: $title . ' | HoloScope',
            description: (string) ($entity['summaryOneLine'] ?? $entity['summary'] ?? $title),
            canonical: $this->canonical->absolute($route),
            robots: 'index,follow',
            heading: $title,
            breadcrumbs: [
                ['label' => 'トップ', 'url' => $this->canonical->absolute('/')],
                ['label' => $this->label, 'url' => $this->canonical->absolute('/' . $this->collection . '/')],
                ['label' => $title, 'url' => null],
            ],
            data: ['collection' => $this->collection, 'entity' => $entity],
        );
        return Response::html($this->view->render($model));
    }
}
