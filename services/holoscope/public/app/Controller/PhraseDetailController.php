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

final readonly class PhraseDetailController
{
    public function __construct(
        private JsonPageRepository $repository, private ViewRenderer $view, private CanonicalUrlService $canonical,
        private string $collection, private string $label,
    ) {}

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters, ?Request $request = null): Response
    {
        $slug = $parameters['slug'] ?? '';
        $entity = $this->repository->detail($this->collection, $slug, [
            'schemaVersion','slug','standardForm','meaningJa','nuanceJa','category','register','politeness','aggressiveness','currency','occurrences','relatedPhrases',
        ]);
        if (!is_array($entity['occurrences']) || $entity['occurrences'] === []) { throw new DataSourceException('Published phrase must have a verified occurrence.'); }
        $route = '/learning/' . $this->collection . '/' . $slug . '/';
        $model = new PageViewModel(
            template: 'pages/phrase-detail', title: $entity['standardForm'] . ' | ' . $this->label . ' | HoloScope',
            description: (string) $entity['meaningJa'], canonical: $this->canonical->absolute($route), robots: 'index,follow', heading: (string) $entity['standardForm'],
            breadcrumbs: [
                ['label'=>'トップ','url'=>$this->canonical->absolute('/')],
                ['label'=>'英語学習','url'=>$this->canonical->absolute('/learning/')],
                ['label'=>$this->label,'url'=>$this->canonical->absolute('/learning/' . $this->collection . '/')],
                ['label'=>(string) $entity['standardForm'],'url'=>null],
            ], data: ['entity'=>$entity,'collection'=>$this->collection,'label'=>$this->label],
        );
        return Response::html($this->view->render($model));
    }
}
