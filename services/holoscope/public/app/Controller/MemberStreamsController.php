<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Search\StreamSearchCriteria;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\Service\StreamSearchService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class MemberStreamsController
{
    public function __construct(
        private JsonPageRepository $pages,
        private StreamSearchService $search,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters, ?Request $request = null): Response
    {
        $slug = $parameters['slug'] ?? '';
        $member = $this->pages->detail('members', $slug, ['schemaVersion', 'publicationStatus', 'slug', 'displayName']);
        $criteria = StreamSearchCriteria::fromQuery($request?->queryParameters() ?? [], $slug);
        $result = $this->search->search($criteria);
        $robots = ($criteria->hasUserConditions() || $criteria->page > 1) ? 'noindex,follow' : 'index,follow';
        $route = '/members/' . $slug . '/streams/';
        $model = new PageViewModel(
            template: 'pages/stream-search',
            title: (string) $member['displayName'] . 'の配信 | HoloScope',
            description: (string) $member['displayName'] . 'の公開配信を条件別に検索します。',
            canonical: $this->canonical->absolute($route),
            robots: $robots,
            heading: (string) $member['displayName'] . 'の配信',
            breadcrumbs: [
                ['label' => 'トップ', 'url' => $this->canonical->absolute('/')],
                ['label' => 'メンバー', 'url' => $this->canonical->absolute('/members/')],
                ['label' => (string) $member['displayName'], 'url' => $this->canonical->absolute('/members/' . $slug . '/')],
                ['label' => '配信', 'url' => null],
            ],
            data: ['search' => $result, 'formAction' => '/holoscope' . $route, 'fixedMember' => $member],
        );
        return Response::html($this->view->render($model));
    }
}
