<?php

declare(strict_types=1);

namespace HoloScope;

use HoloScope\Config\AppConfig;
use HoloScope\Controller\CatalogController;
use HoloScope\Controller\DiscoveryCatalogController;
use HoloScope\Controller\DiscoveryDetailController;
use HoloScope\Controller\EntityController;
use HoloScope\Controller\ErrorController;
use HoloScope\Controller\HomeController;
use HoloScope\Controller\LearningHomeController;
use HoloScope\Controller\LearningStreamSearchController;
use HoloScope\Controller\LearningGuidesController;
use HoloScope\Controller\PhraseCatalogController;
use HoloScope\Controller\PhraseDetailController;
use HoloScope\Controller\FeatureArticleCatalogController;
use HoloScope\Controller\FeatureArticleDetailController;
use HoloScope\Controller\MemberDetailController;
use HoloScope\Controller\MemberStreamsController;
use HoloScope\Controller\PlaceholderController;
use HoloScope\Controller\StreamDetailController;
use HoloScope\Controller\StreamSearchController;
use HoloScope\Controller\StatsController;
use HoloScope\Controller\AdminController;
use HoloScope\Exception\DataSourceException;
use HoloScope\Exception\GoneException;
use HoloScope\Exception\NotFoundException;
use HoloScope\Http\Request;
use HoloScope\Http\Response;
use HoloScope\Repository\JsonPageRepository;
use HoloScope\Repository\LearningStreamSearchRepository;
use HoloScope\Repository\StreamSearchRepository;
use HoloScope\Routing\Router;
use HoloScope\Service\CanonicalUrlService;
use HoloScope\Service\LearningStreamSearchService;
use HoloScope\Service\RedirectService;
use HoloScope\Service\PublicHtmlService;
use HoloScope\Service\StreamSearchService;
use HoloScope\Service\VideoAvailabilityService;
use HoloScope\Service\AdminAuthService;
use HoloScope\View\ViewRenderer;

final readonly class Application
{
    public function __construct(
        private AppConfig $config,
        private Router $router,
        private CanonicalUrlService $canonical,
        private RedirectService $redirects,
        private ErrorController $errors,
    ) {
    }

    public static function create(AppConfig $config): self
    {
        $pages = new JsonPageRepository($config->dataDirectory);
        $streamSearchRepository = new StreamSearchRepository($config->dataDirectory);
        $streamSearch = new StreamSearchService($streamSearchRepository);
        $learningSearchRepository = new LearningStreamSearchRepository($config->dataDirectory);
        $learningSearch = new LearningStreamSearchService($learningSearchRepository);
        $view = new ViewRenderer($config);
        $canonical = new CanonicalUrlService($config);
        $redirects = new RedirectService($config->dataDirectory . '/redirects.json');
        $errors = new ErrorController($view, $canonical);
        $video = new VideoAvailabilityService();
        $publicHtml = new PublicHtmlService();
        $router = new Router();

        $router->get('/', new HomeController($pages, $view, $canonical));
        $router->get('/streams/', new StreamSearchController($streamSearch, $view, $canonical));
        $router->get('/streams/{slug}/', new StreamDetailController($pages, $view, $canonical, $video, $publicHtml));
        $router->get('/members/{slug}/', new MemberDetailController($pages, $view, $canonical));
        $router->get('/members/{slug}/streams/', new MemberStreamsController($pages, $streamSearch, $view, $canonical));

        self::catalog($router, $pages, $view, $canonical, 'members', 'メンバー');
        self::discoveryCatalog($router, $pages, $view, $canonical, 'generations', '世代', '所属メンバー、配信傾向、初心者向け配信から世代を比較できます。');
        self::discoveryCatalog($router, $pages, $view, $canonical, 'games', 'ゲーム', 'ゲームごとの配信、主な配信者、関連企画・シリーズを探せます。');
        self::discoveryCatalog($router, $pages, $view, $canonical, 'events', '企画', '大会、コラボ、ロールプレイなどの企画を参加者と配信視点から探せます。');
        self::discoveryCatalog($router, $pages, $view, $canonical, 'series', 'シリーズ', '継続企画を話数順、目標、進捗から追えます。');
        $router->get('/articles/', new FeatureArticleCatalogController($pages, $view, $canonical));

        self::discoveryEntity($router, $pages, $view, $canonical, 'generations', '世代', 'generation-detail', [
            'schemaVersion', 'slug', 'nameJa', 'summary', 'members', 'beginnerRecommendations',
            'latestStreams', 'streamTypes', 'topGames', 'topSeries', 'learningProfile', 'relatedArticles',
        ], 'nameJa');
        self::discoveryEntity($router, $pages, $view, $canonical, 'games', 'ゲーム', 'game-detail', [
            'schemaVersion', 'slug', 'name', 'summary', 'latestStreams', 'topMembers', 'streamTypes',
            'relatedEvents', 'relatedSeries', 'learningProfile', 'relatedArticles',
        ], 'name');
        self::discoveryEntity($router, $pages, $view, $canonical, 'events', '企画', 'event-detail', [
            'schemaVersion', 'slug', 'name', 'eventTypeLabel', 'participants', 'streams', 'rules',
            'topGames', 'relatedSeries', 'learningProfile', 'relatedArticles',
        ], 'name');
        self::discoveryEntity($router, $pages, $view, $canonical, 'series', 'シリーズ', 'series-detail', [
            'schemaVersion', 'slug', 'name', 'episodes', 'members', 'games', 'events',
            'learningProfile', 'relatedArticles',
        ], 'name');
        $router->get('/articles/{slug}/', new FeatureArticleDetailController($pages, $view, $canonical, $publicHtml));

        $router->get('/learning/', new LearningHomeController($pages, $view, $canonical));
        $router->get('/learning/streams/', new LearningStreamSearchController($learningSearch, $view, $canonical));
        $router->get('/learning/guides/', new LearningGuidesController($pages, $view, $canonical));
        $router->get('/learning/phrases/', new PhraseCatalogController($pages, $view, $canonical, 'phrases', 'フレーズ辞典'));
        $router->get('/learning/phrases/{slug}/', new PhraseDetailController($pages, $view, $canonical, 'phrases', 'フレーズ辞典'));
        $router->get('/learning/slang/', new PhraseCatalogController($pages, $view, $canonical, 'slang', 'スラング辞典'));
        $router->get('/learning/slang/{slug}/', new PhraseDetailController($pages, $view, $canonical, 'slang', 'スラング辞典'));
        $router->get('/stats/', new StatsController(
            $pages, $view, $canonical, 'stats/index.json', '/stats/', 'pages/stats-index',
            '統計', 'HoloScope登録済み公開データの範囲と集計基準を確認できます。',
            ['schemaVersion','generatedAt','note','counts','streamTypes','methodology'],
        ));
        $router->get('/stats/members/', new StatsController(
            $pages, $view, $canonical, 'stats/members.json', '/stats/members/', 'pages/stats-members',
            'メンバー統計', '公開済み配信記事をメンバー別に集計します。人気や能力のランキングではありません。',
            ['schemaVersion','generatedAt','note','count','items','methodology'],
        ));
        $router->get('/stats/games/', new StatsController(
            $pages, $view, $canonical, 'stats/games.json', '/stats/games/', 'pages/stats-games',
            'ゲーム統計', '公開済み配信記事をゲーム別に集計します。',
            ['schemaVersion','generatedAt','note','count','items','methodology'],
        ));
        $router->get('/stats/learning/', new StatsController(
            $pages, $view, $canonical, 'stats/learning.json', '/stats/learning/', 'pages/stats-learning',
            '英語学習統計', '学習評価済み配信だけを対象に集計し、最低件数に満たない値は公開しません。',
            ['schemaVersion','generatedAt','note','status','evaluatedStreamCount','minimumRequired','averages','cefrDistribution','methodology'],
        ));
        $router->get('/admin/', new AdminController($pages, $view, $canonical, AdminAuthService::fromEnvironment()));

        return new self($config, $router, $canonical, $redirects, $errors);
    }

    public function handle(Request $request): Response
    {
        try {
            if (!in_array($request->method, ['GET', 'HEAD'], true)) {
                return $this->secure(Response::html('', 405)->withHeader('Allow', 'GET, HEAD'));
            }

            $canonicalTarget = $this->canonical->redirectTarget($request);
            if ($canonicalTarget !== null) {
                return $this->secure(Response::redirect($canonicalTarget, 301));
            }

            $routePath = $request->routePath($this->config->basePath);
            if ($routePath === null) {
                throw new NotFoundException('Request is outside the configured base path.');
            }
            $routePath = CanonicalUrlService::normalizeRoutePath($routePath);

            $redirect = $this->redirects->resolve($routePath);
            if ($redirect !== null) {
                if ($redirect['status'] === 410) {
                    throw new GoneException('Route was removed.');
                }
                return $this->secure(Response::redirect($this->canonical->absolute((string) $redirect['toPath']), 301));
            }

            $match = $this->router->match($request->method === 'HEAD' ? 'GET' : $request->method, $routePath);
            if ($match === null) {
                throw new NotFoundException('Route was not found.');
            }
            $handler = $match->route->handler;
            $response = $handler($match->parameters, $request);
            if ($request->method === 'HEAD') {
                $response = Response::html('', $response->status());
            }
            return $this->secure($response);
        } catch (GoneException) {
            return $this->secure($this->errors->gone());
        } catch (NotFoundException) {
            return $this->secure($this->errors->notFound());
        } catch (DataSourceException $exception) {
            error_log('[HoloScope] Data source error: ' . $exception->getMessage());
            return $this->secure($this->errors->internalServerError());
        } catch (\Throwable $exception) {
            error_log('[HoloScope] Unhandled error: ' . $exception->getMessage());
            return $this->secure($this->errors->internalServerError());
        }
    }

    private function secure(Response $response): Response
    {
        $scriptSources = ["'self'"];
        if (preg_match_all('~<script\s+type="application/ld\+json">(.*?)</script>~s', $response->body(), $matches) === false) {
            $matches = [1 => []];
        }
        foreach ($matches[1] ?? [] as $jsonLd) {
            $scriptSources[] = "'sha256-" . base64_encode(hash('sha256', (string) $jsonLd, true)) . "'";
        }
        $scriptSources = array_values(array_unique($scriptSources));
        $contentSecurityPolicy = "default-src 'self'; img-src 'self' https://i.ytimg.com data:; style-src 'self'; script-src "
            . implode(' ', $scriptSources)
            . "; frame-src https://www.youtube-nocookie.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'";

        return $response
            ->withHeader('X-Content-Type-Options', 'nosniff')
            ->withHeader('X-Frame-Options', 'SAMEORIGIN')
            ->withHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->withHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
            ->withHeader('Content-Security-Policy', $contentSecurityPolicy);
    }

    private static function catalog(Router $router, JsonPageRepository $repository, ViewRenderer $view, CanonicalUrlService $canonical, string $collection, string $label): void
    {
        $router->get('/' . $collection . '/', new CatalogController($repository, $view, $canonical, $collection, $label));
    }

    private static function discoveryCatalog(
        Router $router,
        JsonPageRepository $repository,
        ViewRenderer $view,
        CanonicalUrlService $canonical,
        string $collection,
        string $label,
        string $description,
    ): void {
        $router->get('/' . $collection . '/', new DiscoveryCatalogController(
            $repository, $view, $canonical, $collection, $label, $description,
        ));
    }

    /** @param list<string> $requiredKeys */
    private static function discoveryEntity(
        Router $router,
        JsonPageRepository $repository,
        ViewRenderer $view,
        CanonicalUrlService $canonical,
        string $collection,
        string $label,
        string $template,
        array $requiredKeys,
        string $titleKey,
    ): void {
        $router->get('/' . $collection . '/{slug}/', new DiscoveryDetailController(
            $repository, $view, $canonical, $collection, $label, $template, $requiredKeys, $titleKey,
        ));
    }

    /** @param list<string> $requiredKeys */
    private static function entity(Router $router, JsonPageRepository $repository, ViewRenderer $view, CanonicalUrlService $canonical, string $collection, string $label, array $requiredKeys, string $titleKey): void
    {
        $router->get('/' . $collection . '/{slug}/', new EntityController($repository, $view, $canonical, $collection, $label, $requiredKeys, $titleKey));
    }
}
