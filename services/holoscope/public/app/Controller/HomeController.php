<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class HomeController
{
    public function __construct(
        private JsonPageRepository $repository,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = [], ?Request $request = null): Response
    {
        $site = $this->repository->site();
        $home = $this->repository->home();
        $model = new PageViewModel(
            template: 'pages/home',
            title: (string) $site['title'],
            description: (string) $site['description'],
            canonical: $this->canonical->absolute('/'),
            robots: 'index,follow',
            heading: (string) $site['hero'],
            breadcrumbs: [],
            data: ['site' => $site, 'home' => $home],
        );
        return Response::html($this->view->render($model));
    }
}
