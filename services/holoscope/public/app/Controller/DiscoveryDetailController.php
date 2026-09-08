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

final readonly class DiscoveryDetailController
{
    /** @param list<string> $requiredKeys */
    public function __construct(
        private JsonPageRepository $repository,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
        private string $collection,
        private string $label,
        private string $template,
        private array $requiredKeys,
        private string $titleKey,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters, ?Request $request = null): Response
    {
        $slug = $parameters['slug'] ?? '';
        $entity = $this->repository->detail($this->collection, $slug, $this->requiredKeys);
        foreach ($this->requiredKeys as $key) {
            if (in_array($key, ['members', 'latestStreams', 'beginnerRecommendations', 'topGames', 'topSeries', 'relatedArticles', 'topMembers', 'streamTypes', 'relatedEvents', 'relatedSeries', 'participants', 'streams', 'rules', 'episodes', 'games', 'events'], true)
                && !is_array($entity[$key])) {
                throw new DataSourceException('Discovery detail has an invalid list: ' . $key);
            }
        }
        $title = (string) $entity[$this->titleKey];
        $route = '/' . $this->collection . '/' . $slug . '/';
        $model = new PageViewModel(
            template: 'pages/' . $this->template,
            title: $title . ' | HoloScope',
            description: (string) ($entity['summary'] ?? $title),
            canonical: $this->canonical->absolute($route),
            robots: 'index,follow',
            heading: $title,
            breadcrumbs: [
                ['label' => 'トップ', 'url' => $this->canonical->absolute('/')],
                ['label' => $this->label, 'url' => $this->canonical->absolute('/' . $this->collection . '/')],
                ['label' => $title, 'url' => null],
            ],
            data: ['entity' => $entity, 'collection' => $this->collection],
        );
        return Response::html($this->view->render($model));
    }
}
