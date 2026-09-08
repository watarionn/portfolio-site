<?php

declare(strict_types=1);

namespace HoloScope\ViewModel;

final readonly class PageViewModel
{
    /**
     * @param list<array{label:string,url:?string}> $breadcrumbs
     * @param array<string, mixed> $data
     */
    public function __construct(
        public string $template,
        public string $title,
        public string $description,
        public string $canonical,
        public string $robots,
        public string $heading,
        public array $breadcrumbs,
        public array $data = [],
        public int $status = 200,
        /** @var array<string, string> */
        public array $openGraph = [],
        /** @var list<array<string, mixed>> */
        public array $jsonLd = [],
        /** @var list<array{title:string,url:string}> */
        public array $feedLinks = [],
    ) {
    }

    /** @param array<string, string> $openGraph @param list<array<string, mixed>> $jsonLd @param list<array{title:string,url:string}> $feedLinks */
    public function withSeo(array $openGraph, array $jsonLd, array $feedLinks): self
    {
        return new self(
            template: $this->template, title: $this->title, description: $this->description,
            canonical: $this->canonical, robots: $this->robots, heading: $this->heading,
            breadcrumbs: $this->breadcrumbs, data: $this->data, status: $this->status,
            openGraph: $openGraph, jsonLd: $jsonLd, feedLinks: $feedLinks,
        );
    }
}
