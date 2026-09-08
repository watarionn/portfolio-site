<?php

declare(strict_types=1);

namespace HoloScope\Service;

use HoloScope\Config\AppConfig;
use HoloScope\ViewModel\PageViewModel;

final readonly class SeoService
{
    public function __construct(private AppConfig $config)
    {
    }

    public function enrich(PageViewModel $view): PageViewModel
    {
        $image = $this->image($view->data);
        $openGraph = [
            'og:locale' => 'ja_JP',
            'og:site_name' => $this->config->siteName,
            'og:type' => $this->type($view->template),
            'og:title' => $view->title,
            'og:description' => $view->description,
            'og:url' => $view->canonical,
            'twitter:card' => $image === null ? 'summary' : 'summary_large_image',
        ];
        if ($image !== null) {
            $openGraph['og:image'] = $image;
            $openGraph['twitter:image'] = $image;
        }

        $jsonLd = [$this->pageJsonLd($view)];
        if ($view->breadcrumbs !== []) {
            $items = [];
            foreach ($view->breadcrumbs as $index => $item) {
                $items[] = [
                    '@type' => 'ListItem',
                    'position' => $index + 1,
                    'name' => (string) $item['label'],
                    'item' => $item['url'] ?? $view->canonical,
                ];
            }
            $jsonLd[] = ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => $items];
        }

        return $view->withSeo(
            openGraph: $openGraph,
            jsonLd: $jsonLd,
            feedLinks: [
                ['title' => 'HoloScope 最新情報', 'url' => $this->absoluteStatic('/feeds/all.xml')],
                ['title' => 'HoloScope 配信記事', 'url' => $this->absoluteStatic('/feeds/streams.xml')],
                ['title' => 'HoloScope 特集記事', 'url' => $this->absoluteStatic('/feeds/articles.xml')],
            ],
        );
    }

    /** @param array<string, mixed> $data */
    private function image(array $data): ?string
    {
        foreach (['stream', 'article'] as $key) {
            $item = $data[$key] ?? null;
            if (is_array($item) && is_string($item['thumbnailUrl'] ?? null) && str_starts_with($item['thumbnailUrl'], 'https://')) {
                return $item['thumbnailUrl'];
            }
        }
        return null;
    }

    private function type(string $template): string
    {
        return in_array($template, ['pages/stream-detail', 'pages/feature-detail'], true) ? 'article' : 'website';
    }

    /** @return array<string, mixed> */
    private function pageJsonLd(PageViewModel $view): array
    {
        $type = match ($view->template) {
            'pages/stream-detail', 'pages/feature-detail' => 'Article',
            'pages/member-detail' => 'ProfilePage',
            'pages/home' => 'WebSite',
            default => 'CollectionPage',
        };
        $data = [
            '@context' => 'https://schema.org',
            '@type' => $type,
            'name' => $view->heading,
            'headline' => $view->heading,
            'description' => $view->description,
            'url' => $view->canonical,
            'inLanguage' => 'ja',
            'isPartOf' => [
                '@type' => 'WebSite',
                'name' => $this->config->siteName,
                'url' => $this->absoluteStatic('/'),
            ],
        ];
        $entity = $view->data['stream'] ?? $view->data['article'] ?? null;
        if (is_array($entity)) {
            $published = $entity['publishedAt'] ?? $entity['articleInfo']['articlePublishedAt'] ?? $entity['articleInfo']['publishedAt'] ?? null;
            $updated = $entity['updatedAt'] ?? $entity['articleInfo']['articleUpdatedAt'] ?? $entity['articleInfo']['updatedAt'] ?? null;
            if (is_string($published)) {
                $data['datePublished'] = $published;
            }
            if (is_string($updated)) {
                $data['dateModified'] = $updated;
            }
        }
        return $data;
    }

    private function absoluteStatic(string $path): string
    {
        return $this->config->canonicalScheme . '://' . $this->config->canonicalHost . $this->config->basePath . $path;
    }
}
