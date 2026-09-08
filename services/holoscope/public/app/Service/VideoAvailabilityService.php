<?php

declare(strict_types=1);

namespace HoloScope\Service;

final class VideoAvailabilityService
{
    /** @param array<string, mixed> $stream @return array<string, mixed> */
    public function describe(array $stream): array
    {
        $status = is_string($stream['videoStatus'] ?? null) ? $stream['videoStatus'] : 'unknown';
        $videoId = is_string($stream['videoId'] ?? null) ? $stream['videoId'] : '';
        $playable = in_array($status, ['public', 'unlisted'], true) && preg_match('/^[A-Za-z0-9_-]{11}$/', $videoId) === 1;
        $messages = [
            'private' => '元動画は非公開です。記事本文は公開記録として保持しています。',
            'deleted' => '元動画は削除されています。時刻リンクと埋め込みは利用できません。',
            'unavailable' => '元動画は現在利用できません。時刻リンクと埋め込みは利用できません。',
            'unknown' => '元動画の状態を確認できないため、埋め込みを停止しています。',
        ];
        return [
            'embedAllowed' => $playable,
            'timestampAllowed' => $playable,
            'embedUrl' => $playable ? 'https://www.youtube-nocookie.com/embed/' . $videoId : null,
            'statusMessage' => $playable ? null : ($messages[$status] ?? $messages['unknown']),
        ];
    }
}
