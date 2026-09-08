<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Search\StreamSearchCriteria;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\Service\StreamSearchService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class StreamSearchController
{
    public function __construct(
        private StreamSearchService $search,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = [], ?Request $request = null): Response
    {
        $criteria = StreamSearchCriteria::fromQuery($request?->queryParameters() ?? []);
        $result = $this->search->search($criteria);
        $robots = ($criteria->hasUserConditions() || $criteria->page > 1) ? 'noindex,follow' : 'index,follow';
        $model = new PageViewModel(
            template: 'pages/stream-search',
            title: '配信を探す | HoloScope',
            description: 'メンバー、世代、配信分類、ゲーム、企画、シリーズ、配信時間、CEFRからホロライブENの配信を検索します。',
            canonical: $this->canonical->absolute('/streams/'),
            robots: $robots,
            heading: '配信を探す',
            breadcrumbs: [
                ['label' => 'トップ', 'url' => $this->canonical->absolute('/')],
                ['label' => '配信', 'url' => null],
            ],
            data: ['search' => $result, 'formAction' => '/holoscope/streams/', 'fixedMember' => null],
        );
        return Response::html($this->view->render($model));
    }
}
