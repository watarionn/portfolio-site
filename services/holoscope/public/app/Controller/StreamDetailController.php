<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Exception\DataSourceException;
use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\Service\PublicHtmlService;
use HoloScope\Service\VideoAvailabilityService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class StreamDetailController
{
    public function __construct(
        private JsonPageRepository $repository,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
        private VideoAvailabilityService $video,
        private PublicHtmlService $publicHtml,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters, ?Request $request = null): Response
    {
        $slug = $parameters['slug'] ?? '';
        $stream = $this->repository->detail('streams', $slug, [
            'schemaVersion', 'publicationStatus', 'slug', 'videoId', 'title', 'originalUrl', 'videoStatus',
            'publishedAt', 'primaryMember', 'lead', 'summaryOneLine', 'keyPoints', 'articleBodyHtml',
            'highlights', 'timeline', 'articleInfo', 'relatedStreams',
        ]);
        foreach (['primaryMember', 'articleInfo'] as $key) {
            if (!is_array($stream[$key])) {
                throw new DataSourceException('Stream detail has an invalid object: ' . $key);
            }
        }
        foreach (['keyPoints', 'highlights', 'timeline', 'relatedStreams'] as $key) {
            if (!is_array($stream[$key])) {
                throw new DataSourceException('Stream detail has an invalid list: ' . $key);
            }
        }
        $route = '/streams/' . $slug . '/';
        $model = new PageViewModel(
            template: 'pages/stream-detail',
            title: (string) $stream['title'] . ' | HoloScope',
            description: (string) $stream['summaryOneLine'],
            canonical: $this->canonical->absolute($route),
            robots: 'index,follow',
            heading: (string) $stream['title'],
            breadcrumbs: [
                ['label' => 'トップ', 'url' => $this->canonical->absolute('/')],
                ['label' => '配信', 'url' => $this->canonical->absolute('/streams/')],
                ['label' => (string) $stream['title'], 'url' => null],
            ],
            data: ['stream' => $stream, 'video' => $this->video->describe($stream), 'articleBodyHtml' => $this->publicHtml->validateArticleBody($stream['articleBodyHtml'])],
        );
        return Response::html($this->view->render($model));
    }
}
