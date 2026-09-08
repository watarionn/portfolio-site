<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Search\LearningStreamCriteria;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\Service\LearningStreamSearchService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class LearningStreamSearchController
{
    public function __construct(private LearningStreamSearchService $search, private ViewRenderer $view, private CanonicalUrlService $canonical) {}

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = [], ?Request $request = null): Response
    {
        $criteria = LearningStreamCriteria::fromQuery($request?->queryParameters() ?? []);
        $result = $this->search->search($criteria);
        $robots = ($criteria->hasUserConditions() || $criteria->page > 1) ? 'noindex,follow' : 'index,follow';
        $model = new PageViewModel(
            template: 'pages/learning-streams', title: '英語学習向け配信 | HoloScope',
            description: '公開済みの学習評価がある配信を、CEFR、速度、明瞭さ、発話の重なり、スラング量、文脈支援から検索します。',
            canonical: $this->canonical->absolute('/learning/streams/'), robots: $robots, heading: '英語学習向け配信',
            breadcrumbs: [
                ['label'=>'トップ','url'=>$this->canonical->absolute('/')],
                ['label'=>'英語学習','url'=>$this->canonical->absolute('/learning/')],
                ['label'=>'学習向け配信','url'=>null],
            ],
            data: ['search'=>$result],
        );
        return Response::html($this->view->render($model));
    }
}
