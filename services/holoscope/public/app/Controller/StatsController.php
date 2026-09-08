<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class StatsController
{
    /** @param list<string> $requiredKeys */
    public function __construct(
        private JsonPageRepository $repository,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
        private string $document,
        private string $route,
        private string $template,
        private string $title,
        private string $description,
        private array $requiredKeys,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = [], ?Request $request = null): Response
    {
        $stats = $this->repository->document($this->document, $this->requiredKeys);
        $breadcrumbs = [['label' => 'トップ', 'url' => $this->canonical->absolute('/')]];
        if ($this->route !== '/stats/') {
            $breadcrumbs[] = ['label' => '統計', 'url' => $this->canonical->absolute('/stats/')];
        }
        $breadcrumbs[] = ['label' => $this->title, 'url' => null];
        $model = new PageViewModel(
            template: $this->template,
            title: $this->title . ' | HoloScope',
            description: $this->description,
            canonical: $this->canonical->absolute($this->route),
            robots: 'index,follow',
            heading: $this->title,
            breadcrumbs: $breadcrumbs,
            data: ['stats' => $stats],
        );
        return Response::html($this->view->render($model));
    }
}
