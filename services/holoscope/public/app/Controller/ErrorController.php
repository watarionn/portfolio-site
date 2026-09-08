<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Response;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class ErrorController
{
    public function __construct(
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
    ) {
    }

    public function notFound(): Response
    {
        return $this->render(404, 'ページが見つかりません', '指定されたページは存在しないか、公開されていません。', 'errors/404');
    }

    public function gone(): Response
    {
        return $this->render(410, 'ページは廃止されました', 'このURLに対応するページは廃止され、後継ページはありません。', 'errors/410');
    }

    public function internalServerError(): Response
    {
        return $this->render(500, 'データを読み込めません', '公開データの読み込み中に問題が発生しました。', 'errors/500');
    }

    private function render(int $status, string $heading, string $description, string $template): Response
    {
        $model = new PageViewModel(
            template: $template,
            title: $heading . ' | HoloScope',
            description: $description,
            canonical: $this->canonical->absolute('/'),
            robots: 'noindex,follow',
            heading: $heading,
            breadcrumbs: [['label' => 'トップ', 'url' => $this->canonical->absolute('/')]],
            data: ['description' => $description],
            status: $status,
        );
        return Response::html($this->view->render($model), $status);
    }
}
