<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Exception\DataSourceException;
use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\Service\PublicHtmlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class FeatureArticleDetailController
{
    public function __construct(
        private JsonPageRepository $repository, private ViewRenderer $view, private CanonicalUrlService $canonical,
        private PublicHtmlService $publicHtml,
    ) {}

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters, ?Request $request = null): Response
    {
        $slug = $parameters['slug'] ?? '';
        $article = $this->repository->detail('articles', $slug, [
            'schemaVersion','slug','title','primaryCategory','primaryCategoryLabel','lead','targetAudience','whatYouWillLearn',
            'tableOfContents','bodyBlocks','conclusion','articleInfo','relatedStreams','relatedEntities','relatedArticles','sources',
        ]);
        foreach (['whatYouWillLearn','tableOfContents','bodyBlocks','relatedStreams','relatedEntities','relatedArticles','sources'] as $key) {
            if (!is_array($article[$key])) { throw new DataSourceException('Feature article has an invalid list: ' . $key); }
        }
        foreach ($article['bodyBlocks'] as $block) {
            if (!is_array($block) || !is_string($block['type'] ?? null)) { throw new DataSourceException('Feature article block is invalid.'); }
            if (($block['type'] ?? '') === 'paragraph') { $this->publicHtml->validateInlineBody($block['html'] ?? null); }
            if (($block['type'] ?? '') === 'list') {
                foreach (($block['itemsHtml'] ?? []) as $html) { $this->publicHtml->validateInlineBody($html); }
            }
        }
        $model = new PageViewModel(
            template: 'pages/feature-detail', title: $article['title'] . ' | HoloScope', description: (string) $article['lead'],
            canonical: $this->canonical->absolute('/articles/' . $slug . '/'), robots: 'index,follow', heading: (string) $article['title'],
            breadcrumbs: [
                ['label'=>'トップ','url'=>$this->canonical->absolute('/')],
                ['label'=>'特集記事','url'=>$this->canonical->absolute('/articles/')],
                ['label'=>(string) $article['title'],'url'=>null],
            ], data: ['article'=>$article],
        );
        return Response::html($this->view->render($model));
    }
}
