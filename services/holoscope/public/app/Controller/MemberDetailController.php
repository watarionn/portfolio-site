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

final readonly class MemberDetailController
{
    public function __construct(
        private JsonPageRepository $repository,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters, ?Request $request = null): Response
    {
        $slug = $parameters['slug'] ?? '';
        $member = $this->repository->detail('members', $slug, [
            'schemaVersion', 'publicationStatus', 'slug', 'displayName', 'summary',
            'beginnerRecommendations', 'latestStreams', 'streamStyle', 'topGames', 'topSeries',
            'learningProfile', 'frequentPhrases', 'collaborations', 'streamSearchUrl',
            'relatedArticles', 'officialLinks',
        ]);
        foreach (['beginnerRecommendations', 'latestStreams', 'topGames', 'topSeries', 'frequentPhrases', 'collaborations', 'relatedArticles', 'officialLinks'] as $key) {
            if (!is_array($member[$key])) {
                throw new DataSourceException('Member detail has an invalid list: ' . $key);
            }
        }
        foreach (['streamStyle', 'learningProfile'] as $key) {
            if (!is_array($member[$key])) {
                throw new DataSourceException('Member detail has an invalid object: ' . $key);
            }
        }
        $model = new PageViewModel(
            template: 'pages/member-detail',
            title: (string) $member['displayName'] . ' | HoloScope',
            description: (string) $member['summary'],
            canonical: $this->canonical->absolute('/members/' . $slug . '/'),
            robots: 'index,follow',
            heading: (string) $member['displayName'],
            breadcrumbs: [
                ['label' => 'トップ', 'url' => $this->canonical->absolute('/')],
                ['label' => 'メンバー', 'url' => $this->canonical->absolute('/members/')],
                ['label' => (string) $member['displayName'], 'url' => null],
            ],
            data: ['member' => $member],
        );
        return Response::html($this->view->render($model));
    }
}
