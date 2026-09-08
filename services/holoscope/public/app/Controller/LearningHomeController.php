<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class LearningHomeController
{
    public function __construct(private JsonPageRepository $repository, private ViewRenderer $view, private CanonicalUrlService $canonical) {}

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = [], ?Request $request = null): Response
    {
        $data = $this->repository->document('learning/index.json', ['schemaVersion','disclaimer','evaluatedStreamCount','evaluationAxes','byCefr','clearSpeech','lowOverlap','lowSlang','highContextSupport','recentPhrases','recentSlang','guides']);
        $model = new PageViewModel(
            template: 'pages/learning-home',
            title: '配信で英語を学ぶ | HoloScope',
            description: '実際のホロライブEN配信を、聞き取り難易度、発話の特徴、確認済みフレーズから選ぶ英語学習ナビゲーションです。',
            canonical: $this->canonical->absolute('/learning/'), robots: 'index,follow', heading: '配信で英語を学ぶ',
            breadcrumbs: [['label'=>'トップ','url'=>$this->canonical->absolute('/')],['label'=>'英語学習','url'=>null]],
            data: ['learning'=>$data],
        );
        return Response::html($this->view->render($model));
    }
}
