<?php

declare(strict_types=1);

function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function format_date_jp(?string $value): string
{
    if ($value === null || $value === '') {
        return '不明';
    }
    try {
        return (new DateTimeImmutable($value))->setTimezone(new DateTimeZone('Asia/Tokyo'))->format('Y年n月j日');
    } catch (Throwable) {
        return '不明';
    }
}

function format_stream_date_jp(?string $value): string
{
    $formatted = format_date_jp($value);
    return $formatted === '不明' ? '公開日不明' : $formatted;
}

function format_duration(?int $seconds): string
{
    if ($seconds === null) {
        return '時間不明';
    }
    $hours = intdiv($seconds, 3600);
    $minutes = intdiv($seconds % 3600, 60);
    if ($hours > 0) {
        return $hours . '時間' . ($minutes > 0 ? $minutes . '分' : '');
    }
    return $minutes . '分';
}

function format_timestamp(int $seconds): string
{
    $hours = intdiv($seconds, 3600);
    $minutes = intdiv($seconds % 3600, 60);
    $remain = $seconds % 60;
    return $hours > 0
        ? sprintf('%d:%02d:%02d', $hours, $minutes, $remain)
        : sprintf('%d:%02d', $minutes, $remain);
}

/** @param array<string, string|list<string>> $parameters */
function query_url(string $path, array $parameters): string
{
    $query = http_build_query($parameters, '', '&', PHP_QUERY_RFC3986);
    return $query === '' ? $path : $path . '?' . $query;
}

/** @param array<string, mixed> $card */
function stream_url(array $card): string
{
    return '/holoscope/streams/' . rawurlencode((string) ($card['slug'] ?? '')) . '/';
}
