<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class LearningGuidesController
{
    public function __construct(private JsonPageRepository $repository, private ViewRenderer $view, private CanonicalUrlService $canonical) {}

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = [], ?Request $request = null): Response
    {
        $index = $this->repository->document('learning/guides/index.json', ['schemaVersion','count','items']);
        $model = new PageViewModel(
            template: 'pages/learning-guides', title: '英語学習ガイド | HoloScope',
            description: '配信の選び方、聞き方、フレーズの確認方法を説明する英語学習特集です。',
            canonical: $this->canonical->absolute('/learning/guides/'), robots: 'index,follow', heading: '英語学習ガイド',
            breadcrumbs: [
                ['label'=>'トップ','url'=>$this->canonical->absolute('/')],
                ['label'=>'英語学習','url'=>$this->canonical->absolute('/learning/')],
                ['label'=>'ガイド','url'=>null],
            ], data: ['index'=>$index],
        );
        return Response::html($this->view->render($model));
    }
}
