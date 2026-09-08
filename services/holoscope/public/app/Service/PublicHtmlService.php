<?php

declare(strict_types=1);

namespace HoloScope\Service;

use HoloScope\Exception\DataSourceException;

final class PublicHtmlService
{
    public function validateArticleBody(mixed $value): string
    {
        if (!is_string($value)) {
            throw new DataSourceException('Article body HTML must be a string.');
        }
        if (preg_match('/<(?!\/?(?:h2|h3|p|ul|li|strong|code)>)/i', $value) === 1) {
            throw new DataSourceException('Article body HTML contains a forbidden tag or attribute.');
        }
        return $value;
    }
    public function validateInlineBody(mixed $value): string
    {
        if (!is_string($value)) {
            throw new DataSourceException('Inline article HTML must be a string.');
        }
        if (preg_match('/<(?!\/?(?:strong|code)>)/i', $value) === 1) {
            throw new DataSourceException('Inline article HTML contains a forbidden tag or attribute.');
        }
        return $value;
    }

}
