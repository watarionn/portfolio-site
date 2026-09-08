<?php

declare(strict_types=1);

namespace HoloScope\Controller;

use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Service\AdminAuthService;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\View\ViewRenderer;
use HoloScope\ViewModel\PageViewModel;

final readonly class AdminController
{
    public function __construct(
        private JsonPageRepository $repository,
        private ViewRenderer $view,
        private CanonicalUrlService $canonical,
        private AdminAuthService $auth,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function __invoke(array $parameters = [], ?Request $request = null): Response
    {
        $request ??= new Request('GET', 'https', 'localhost', '/');
        if (!$this->auth->authenticate($request)) {
            return Response::html('<!doctype html><html lang="ja"><meta charset="utf-8"><title>認証が必要です</title><p>管理画面を表示するには認証が必要です。</p>', 401)
                ->withHeader('WWW-Authenticate', 'Basic realm="HoloScope Admin", charset="UTF-8"')
                ->withHeader('Cache-Control', 'private, no-store');
        }
        $status = $this->repository->document('operations/status.json', [
            'schemaVersion', 'generatedAt', 'status', 'deploymentBlocked', 'checks', 'publicCounts', 'releasePolicy', 'mode',
        ]);
        $model = new PageViewModel(
            template: 'pages/admin-status',
            title: '運用状態 | HoloScope',
            description: '認証された運用担当者向けの読み取り専用状態表示です。',
            canonical: $this->canonical->absolute('/admin/'),
            robots: 'noindex,nofollow',
            heading: '運用状態',
            breadcrumbs: [],
            data: ['status' => $status],
        );
        return Response::html($this->view->render($model))
            ->withHeader('Cache-Control', 'private, no-store');
    }
}
