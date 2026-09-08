<?php

declare(strict_types=1);

namespace HoloScope\View;

use HoloScope\Config\AppConfig;
use HoloScope\Exception\DataSourceException;
use HoloScope\ViewModel\PageViewModel;
use HoloScope\Service\SeoService;

final readonly class ViewRenderer
{
    public function __construct(private AppConfig $config)
    {
    }

    public function render(PageViewModel $view): string
    {
        $view = (new SeoService($this->config))->enrich($view);
        $contentTemplate = $this->templatePath($view->template);
        $layoutTemplate = $this->templatePath('layout');

        ob_start();
        try {
            require $contentTemplate;
            $content = (string) ob_get_clean();
        } catch (\Throwable $exception) {
            ob_end_clean();
            throw $exception;
        }

        ob_start();
        try {
            require $layoutTemplate;
            return (string) ob_get_clean();
        } catch (\Throwable $exception) {
            ob_end_clean();
            throw $exception;
        }
    }

    private function templatePath(string $name): string
    {
        if (preg_match('/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/', $name) !== 1) {
            throw new DataSourceException('Invalid template name.');
        }
        $path = $this->config->templateDirectory . '/' . $name . '.php';
        $real = realpath($path);
        $templateRoot = realpath($this->config->templateDirectory);
        if ($real === false || $templateRoot === false || !str_starts_with($real, $templateRoot . DIRECTORY_SEPARATOR)) {
            throw new DataSourceException('Template was not found.');
        }
        return $real;
    }
}
