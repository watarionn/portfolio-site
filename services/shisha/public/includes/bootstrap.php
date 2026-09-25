<?php
declare(strict_types=1);

$configFile = dirname(__DIR__) . '/config.php';
$config = is_file($configFile)
    ? require $configFile
    : require dirname(__DIR__) . '/config.example.php';

const SHISHA_JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
const SHISHA_TIMEZONE = 'Asia/Tokyo';
const SHISHA_HOURS_FIELDS = [
    'hours',
    'hours_text',
    'hours_status',
    'hours_source_url',
    'hours_verified_at',
];


function shisha_prefecture_codes(): array
{
    return [
        '北海道' => 1, '青森県' => 2, '岩手県' => 3, '宮城県' => 4, '秋田県' => 5,
        '山形県' => 6, '福島県' => 7, '茨城県' => 8, '栃木県' => 9, '群馬県' => 10,
        '埼玉県' => 11, '千葉県' => 12, '東京都' => 13, '神奈川県' => 14, '新潟県' => 15,
        '富山県' => 16, '石川県' => 17, '福井県' => 18, '山梨県' => 19, '長野県' => 20,
        '岐阜県' => 21, '静岡県' => 22, '愛知県' => 23, '三重県' => 24, '滋賀県' => 25,
        '京都府' => 26, '大阪府' => 27, '兵庫県' => 28, '奈良県' => 29, '和歌山県' => 30,
        '鳥取県' => 31, '島根県' => 32, '岡山県' => 33, '広島県' => 34, '山口県' => 35,
        '徳島県' => 36, '香川県' => 37, '愛媛県' => 38, '高知県' => 39, '福岡県' => 40,
        '佐賀県' => 41, '長崎県' => 42, '熊本県' => 43, '大分県' => 44, '宮崎県' => 45,
        '鹿児島県' => 46, '沖縄県' => 47,
    ];
}

function prefecture_code(string $prefecture): int
{
    return shisha_prefecture_codes()[$prefecture] ?? PHP_INT_MAX;
}

function postal_location_map(): array
{
    static $map = null;
    if (is_array($map)) {
        return $map;
    }
    $path = __DIR__ . '/postal-location-map.php';
    $loaded = is_file($path) ? require $path : [];
    $map = is_array($loaded) ? $loaded : [];
    return $map;
}

function extract_postal_code(string $address): string
{
    if (preg_match('/〒?\s*(\d{3})[-‐‑‒–—ー−]?\s*(\d{4})/u', $address, $m)) {
        return $m[1] . $m[2];
    }
    return '';
}

function normalize_display_shop_name(string $value): string
{
    if (function_exists('mb_convert_kana')) {
        $value = mb_convert_kana($value, 'asKV', 'UTF-8');
    }
    $value = preg_replace('/[\s　\x{00A0}]+/u', ' ', trim($value)) ?? trim($value);
    $value = preg_replace('/\s*（\s*/u', '（', $value) ?? $value;
    $value = preg_replace('/\s*）\s*/u', '）', $value) ?? $value;
    return trim($value);
}

function normalize_shop_location(array $shop, string $address): array
{
    $rawPrefecture = trim((string)($shop['prefecture'] ?? ''));
    $rawMunicipality = trim((string)($shop['municipality'] ?? ''));
    $postalCode = extract_postal_code($address);
    $postalMap = postal_location_map();

    $prefecture = '';
    $municipality = '';
    $source = 'review';

    if ($postalCode !== '' && isset($postalMap[$postalCode]) && is_array($postalMap[$postalCode])) {
        $prefecture = trim((string)($postalMap[$postalCode][0] ?? ''));
        $municipality = trim((string)($postalMap[$postalCode][1] ?? ''));
        $source = 'postal';
    } else {
        $addressPrefecture = extract_prefecture($address);
        $addressMunicipality = extract_municipality($address);
        if ($addressPrefecture !== '') {
            $prefecture = $addressPrefecture;
            $source = 'address';
        } elseif ($rawPrefecture !== '' && isset(shisha_prefecture_codes()[$rawPrefecture])) {
            $prefecture = $rawPrefecture;
            $source = 'source';
        }
        if ($addressMunicipality !== '' && !preg_match('/[A-Za-z]/', $addressMunicipality)) {
            $municipality = $addressMunicipality;
        } elseif ($rawMunicipality !== '' && !preg_match('/[A-Za-z]/', $rawMunicipality)) {
            $municipality = $rawMunicipality;
        }
    }

    if ($rawPrefecture !== '' && $rawPrefecture !== $prefecture) {
        $shop['prefecture_raw'] = $rawPrefecture;
    }
    if ($rawMunicipality !== '' && $rawMunicipality !== $municipality) {
        $shop['municipality_raw'] = $rawMunicipality;
    }

    $shop['prefecture'] = $prefecture;
    $shop['municipality'] = $municipality;
    $shop['postal_code'] = $postalCode;
    $shop['location_normalization_status'] = $municipality !== ''
        ? 'normalized_' . $source
        : 'review';

    return $shop;
}

function json_response(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode($data, SHISHA_JSON_FLAGS);
    exit;
}

function read_json(string $path): array
{
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function var_dir(): string
{
    return dirname(__DIR__) . '/var';
}

function shops_path(): string
{
    return var_dir() . '/shops.json';
}

function update_state_path(): string
{
    return var_dir() . '/update-state.json';
}

function read_seed_shops(): array
{
    $parts = glob(dirname(__DIR__, 2) . '/bootstrap-data/shops.seed.*') ?: [];
    sort($parts, SORT_NATURAL);
    $encoded = '';
    foreach ($parts as $part) {
        if (basename($part) === '.htaccess') {
            continue;
        }
        $chunk = @file_get_contents($part);
        if (is_string($chunk)) {
            $encoded .= trim($chunk);
        }
    }
    if ($encoded === '') {
        return [];
    }
    $compressed = base64_decode($encoded, true);
    if ($compressed === false) {
        return [];
    }
    $raw = gzdecode($compressed);
    if ($raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function lower_text(string $value): string
{
    return function_exists('mb_strtolower')
        ? mb_strtolower($value, 'UTF-8')
        : strtolower($value);
}

function normalize_shop_name(string $value): string
{
    if (function_exists('mb_convert_kana')) {
        $value = mb_convert_kana($value, 'asKV', 'UTF-8');
    }
    $value = lower_text($value);
    $value = preg_replace('/[\s　・･\-—_\/\\()（）【】\[\]]+/u', '', $value) ?? $value;
    return trim($value);
}

function normalize_address_key(string $value): string
{
    if (function_exists('mb_convert_kana')) {
        $value = mb_convert_kana($value, 'asKV', 'UTF-8');
    }
    $value = lower_text($value);
    $value = preg_replace('/[\s　,，・･\-—_\/\\()（）【】\[\]〒]+/u', '', $value) ?? $value;
    return trim($value);
}

function deterministic_shop_id(string $name, string $address): string
{
    $hex = substr(hash('sha256', $name . "\n" . $address), 0, 32);
    return sprintf('%s-%s-5%s-%s-%s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 13, 3),
        dechex((hexdec($hex[16]) & 0x3) | 0x8) . substr($hex, 17, 3),
        substr($hex, 20, 12)
    );
}

function normalize_hours_entries(mixed $entries): array
{
    if (!is_array($entries)) {
        return [];
    }

    $normalized = [];
    foreach ($entries as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $day = $entry['day_of_week'] ?? $entry['day'] ?? null;
        $open = trim((string)($entry['open_time'] ?? $entry['open'] ?? ''));
        $close = trim((string)($entry['close_time'] ?? $entry['close'] ?? ''));
        $closed = (bool)($entry['is_closed'] ?? $entry['closed'] ?? false);
        if (!is_numeric($day) || (int)$day < 0 || (int)$day > 6) {
            continue;
        }
        if (!$closed && (!preg_match('/^\d{2}:\d{2}$/', $open) || !preg_match('/^\d{2}:\d{2}$/', $close))) {
            continue;
        }
        $normalized[] = [
            'day_of_week' => (int)$day,
            'open_time' => $closed ? '' : $open,
            'close_time' => $closed ? '' : $close,
            'closes_next_day' => $closed ? false : (bool)($entry['closes_next_day'] ?? $entry['next_day'] ?? false),
            'is_closed' => $closed,
        ];
    }

    usort($normalized, static function (array $a, array $b): int {
        return [$a['day_of_week'], $a['open_time'], $a['close_time']]
            <=> [$b['day_of_week'], $b['open_time'], $b['close_time']];
    });

    $unique = [];
    foreach ($normalized as $entry) {
        $key = implode('|', [
            (string)$entry['day_of_week'],
            $entry['open_time'],
            $entry['close_time'],
            $entry['closes_next_day'] ? '1' : '0',
            $entry['is_closed'] ? '1' : '0',
        ]);
        $unique[$key] = $entry;
    }
    return array_values($unique);
}

function clean_hours_text_for_display(string $text, array $structuredHours): string
{
    $text = trim($text);
    if ($text === '' || in_array(lower_text($text), ['unknown', 'n/a', 'na', 'none', '-'], true)) {
        return '';
    }
    if ($structuredHours !== []) {
        return '';
    }

    $text = preg_split('/(?:住所|所在地|電話番号|TEL|アクセス|予約|料金|メニュー|席数)/u', $text, 2)[0] ?? $text;
    $text = preg_replace('/[\x{00A0}\t\r\n ]+/u', ' ', trim($text)) ?? trim($text);
    $hasRange = preg_match('/\d{1,2}[：:][0-5]\d.{0,16}?[〜～~\-－—–].{0,16}?(?:翌\s*)?\d{1,2}[：:][0-5]\d/u', $text) === 1;
    if (!$hasRange) {
        return '';
    }
    if (function_exists('mb_strlen') && mb_strlen($text, 'UTF-8') > 160) {
        return mb_substr($text, 0, 160, 'UTF-8');
    }
    return strlen($text) > 240 ? substr($text, 0, 240) : $text;
}

function normalize_shop_record(array $shop): array
{
    $sourceName = trim((string)($shop['name'] ?? $shop['shop_name'] ?? ''));
    $address = trim((string)($shop['address'] ?? ''));
    if (!isset($shop['id']) || trim((string)$shop['id']) === '') {
        $shop['id'] = trim((string)($shop['shop_id'] ?? ''));
    }
    if (trim((string)($shop['id'] ?? '')) === '' && $sourceName !== '') {
        $shop['id'] = deterministic_shop_id($sourceName, $address);
    }
    $shop['name'] = $sourceName;
    $shop['display_name'] = normalize_display_shop_name($sourceName);
    $shop['address'] = $address;
    $shop = normalize_shop_location($shop, $address);
    $shop['hours'] = normalize_hours_entries($shop['hours'] ?? []);
    $sourceHoursText = trim((string)($shop['hours_text'] ?? ''));
    $cleanHoursText = clean_hours_text_for_display($sourceHoursText, $shop['hours']);
    if ($sourceHoursText !== '' && $sourceHoursText !== $cleanHoursText) {
        $shop['hours_text_raw'] = $sourceHoursText;
    }
    $shop['hours_text'] = $cleanHoursText;
    $shop['hours_quality'] = $shop['hours'] !== []
        ? 'CLEAN'
        : ($cleanHoursText !== '' ? 'REVIEW' : 'MISSING');
    $shop['hours_status'] = trim((string)($shop['hours_status'] ?? 'unknown')) ?: 'unknown';
    $shop['hours_source_url'] = trim((string)($shop['hours_source_url'] ?? ''));
    $shop['hours_verified_at'] = trim((string)($shop['hours_verified_at'] ?? ''));
    return $shop;
}

function shop_match_key(array $shop): string
{
    return normalize_shop_name((string)($shop['name'] ?? ''))
        . '|' . normalize_address_key((string)($shop['address'] ?? ''));
}

function read_shops(): array
{
    $seed = array_map('normalize_shop_record', read_seed_shops());
    $runtime = read_json(shops_path());
    if ($runtime === []) {
        return $seed;
    }

    $seedById = [];
    $seedByKey = [];
    foreach ($seed as $seedShop) {
        $id = trim((string)($seedShop['id'] ?? ''));
        if ($id !== '') {
            $seedById[$id] = $seedShop;
        }
        $key = shop_match_key($seedShop);
        if ($key !== '|') {
            $seedByKey[$key][] = $seedShop;
        }
    }

    foreach ($runtime as $index => $shop) {
        if (!is_array($shop)) {
            continue;
        }
        $normalized = normalize_shop_record($shop);
        $seedShop = null;
        $id = trim((string)($normalized['id'] ?? ''));
        if ($id !== '' && isset($seedById[$id])) {
            $seedShop = $seedById[$id];
        } else {
            $key = shop_match_key($normalized);
            if (isset($seedByKey[$key]) && count($seedByKey[$key]) === 1) {
                $seedShop = $seedByKey[$key][0];
            }
        }

        if (is_array($seedShop)) {
            foreach (SHISHA_HOURS_FIELDS as $field) {
                $current = $normalized[$field] ?? null;
                $incoming = $seedShop[$field] ?? null;
                $currentEmpty = $field === 'hours'
                    ? !is_array($current) || $current === []
                    : trim((string)$current) === '' || ($field === 'hours_status' && $current === 'unknown');
                $incomingPresent = $field === 'hours'
                    ? is_array($incoming) && $incoming !== []
                    : trim((string)$incoming) !== '' && !($field === 'hours_status' && $incoming === 'unknown');
                if ($currentEmpty && $incomingPresent) {
                    $normalized[$field] = $incoming;
                }
            }
        }

        $runtime[$index] = $normalized;
    }

    return array_values($runtime);
}

function extract_prefecture(string $address): string
{
    foreach (array_keys(shisha_prefecture_codes()) as $prefecture) {
        if (str_contains($address, $prefecture)) {
            return $prefecture;
        }
    }
    return '';
}

function extract_municipality(string $address): string
{
    $prefecture = extract_prefecture($address);
    $rest = $address;
    if ($prefecture !== '') {
        $position = strpos($address, $prefecture);
        if ($position !== false) {
            $rest = substr($address, $position + strlen($prefecture));
        }
    }
    $rest = preg_replace('/^[\s,，]+/u', '', $rest) ?? $rest;

    $patterns = [
        '/^([^\s,，]+?市[^\s,，]+?区)/u',
        '/^([^\s,，]+?郡[^\s,，]+?(?:町|村))/u',
        '/^([^\s,，]+?(?:市|区|町|村))/u',
    ];
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $rest, $m)) {
            $candidate = trim($m[1]);
            return preg_match('/[A-Za-z]/', $candidate) ? '' : $candidate;
        }
    }
    return '';
}

function is_public_ip(string $ip): bool
{
    return filter_var(
        $ip,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    ) !== false;
}

function is_safe_remote_url(string $url): bool
{
    $parts = @parse_url($url);
    if (!is_array($parts)) {
        return false;
    }
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    $host = strtolower(rtrim((string)($parts['host'] ?? ''), '.'));
    if (!in_array($scheme, ['http', 'https'], true) || $host === '') {
        return false;
    }
    if (isset($parts['user']) || isset($parts['pass'])) {
        return false;
    }
    if ($host === 'localhost' || str_ends_with($host, '.localhost') || str_ends_with($host, '.local')) {
        return false;
    }
    if (filter_var($host, FILTER_VALIDATE_IP)) {
        return is_public_ip($host);
    }
    $ips = @gethostbynamel($host);
    if (!is_array($ips) || $ips === []) {
        return false;
    }
    foreach ($ips as $ip) {
        if (!is_public_ip($ip)) {
            return false;
        }
    }
    return true;
}

function resolve_redirect_url(string $base, string $location): string
{
    $location = trim($location);
    if ($location === '') {
        return '';
    }
    if (preg_match('~^https?://~i', $location)) {
        return $location;
    }
    $baseParts = parse_url($base);
    if (!is_array($baseParts) || empty($baseParts['scheme']) || empty($baseParts['host'])) {
        return '';
    }
    $origin = $baseParts['scheme'] . '://' . $baseParts['host'];
    if (isset($baseParts['port'])) {
        $origin .= ':' . $baseParts['port'];
    }
    if (str_starts_with($location, '//')) {
        return $baseParts['scheme'] . ':' . $location;
    }
    if (str_starts_with($location, '/')) {
        return $origin . $location;
    }
    $path = (string)($baseParts['path'] ?? '/');
    $dir = preg_replace('~/[^/]*$~', '/', $path) ?: '/';
    return $origin . $dir . $location;
}

function remote_text(string $url): string
{
    global $config;
    $timeout = max(3, min(30, (int)($config['remote_timeout_seconds'] ?? 15)));
    $current = $url;

    for ($redirect = 0; $redirect <= 4; $redirect++) {
        if (!is_safe_remote_url($current)) {
            return '';
        }
        $context = stream_context_create([
            'http' => [
                'timeout' => $timeout,
                'user_agent' => 'ShishaStoreSearch/3.0 (+https://cf278796.cloudfree.jp/SHISHA/)',
                'ignore_errors' => true,
                'follow_location' => 0,
                'header' => "Accept: text/html,application/json;q=0.9,*/*;q=0.5\r\nAccept-Language: ja,en;q=0.7\r\n",
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);
        $handle = @fopen($current, 'rb', false, $context);
        if ($handle === false) {
            return '';
        }
        $raw = stream_get_contents($handle, 2_097_153);
        fclose($handle);
        $headers = $http_response_header ?? [];
        $status = 0;
        $location = '';
        foreach ($headers as $header) {
            if (preg_match('~^HTTP/\S+\s+(\d{3})~i', $header, $m)) {
                $status = (int)$m[1];
            } elseif (stripos($header, 'Location:') === 0) {
                $location = trim(substr($header, 9));
            }
        }
        if ($status >= 300 && $status < 400 && $location !== '') {
            $current = resolve_redirect_url($current, $location);
            if ($current === '') {
                return '';
            }
            continue;
        }
        if ($status >= 400 || !is_string($raw) || strlen($raw) > 2_097_152) {
            return '';
        }
        return $raw;
    }
    return '';
}

function remote_json(string $url): array
{
    $raw = remote_text($url);
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function normalize_clock(string $value): ?string
{
    $value = trim($value);
    $value = preg_replace('/[^0-9:]/u', '', $value) ?? $value;
    if (!preg_match('/^(\d{1,2}):(\d{2})$/', $value, $m)) {
        return null;
    }
    $hour = (int)$m[1];
    $minute = (int)$m[2];
    if ($hour < 0 || $hour > 24 || $minute < 0 || $minute > 59 || ($hour === 24 && $minute !== 0)) {
        return null;
    }
    return sprintf('%02d:%02d', $hour, $minute);
}

function clock_minutes(string $value): ?int
{
    $clock = normalize_clock($value);
    if ($clock === null) {
        return null;
    }
    [$hour, $minute] = array_map('intval', explode(':', $clock));
    return $hour * 60 + $minute;
}

function schema_day_number(string $value): ?int
{
    $value = strtolower(trim($value));
    $value = preg_replace('~^https?://schema\.org/~', '', $value) ?? $value;
    $value = preg_replace('/[^a-z]/', '', $value) ?? $value;
    return match ($value) {
        'sunday', 'sun', 'su' => 0,
        'monday', 'mon', 'mo' => 1,
        'tuesday', 'tue', 'tu' => 2,
        'wednesday', 'wed', 'we' => 3,
        'thursday', 'thu', 'th' => 4,
        'friday', 'fri', 'fr' => 5,
        'saturday', 'sat', 'sa' => 6,
        default => null,
    };
}

function expand_day_range(int $start, int $end): array
{
    $days = [$start];
    $current = $start;
    while ($current !== $end && count($days) < 7) {
        $current = ($current + 1) % 7;
        $days[] = $current;
    }
    return $days;
}

function parse_schema_day_expression(string $expression): array
{
    $expression = trim($expression);
    if ($expression === '') {
        return [];
    }
    $tokens = preg_split('/\s*,\s*/', $expression) ?: [];
    $days = [];
    foreach ($tokens as $token) {
        if (preg_match('/^([A-Za-z]+)\s*[-–—~〜]\s*([A-Za-z]+)$/u', trim($token), $m)) {
            $start = schema_day_number($m[1]);
            $end = schema_day_number($m[2]);
            if ($start !== null && $end !== null) {
                $days = array_merge($days, expand_day_range($start, $end));
            }
            continue;
        }
        $day = schema_day_number($token);
        if ($day !== null) {
            $days[] = $day;
        }
    }
    return array_values(array_unique($days));
}

function make_hours_entries(array $days, string $open, string $close, bool $nextDay = false): array
{
    $openClock = normalize_clock($open);
    $closeClock = normalize_clock($close);
    if ($openClock === null || $closeClock === null) {
        return [];
    }
    $openMinutes = clock_minutes($openClock);
    $closeMinutes = clock_minutes($closeClock);
    $nextDay = $nextDay || ($openMinutes !== null && $closeMinutes !== null && $closeMinutes <= $openMinutes);
    $entries = [];
    foreach (array_values(array_unique($days)) as $day) {
        if (!is_int($day) || $day < 0 || $day > 6) {
            continue;
        }
        $entries[] = [
            'day_of_week' => $day,
            'open_time' => $openClock,
            'close_time' => $closeClock,
            'closes_next_day' => $nextDay,
            'is_closed' => false,
        ];
    }
    return $entries;
}

function parse_schema_opening_hours(mixed $value): array
{
    $values = is_array($value) ? $value : [$value];
    $entries = [];
    foreach ($values as $line) {
        if (!is_string($line)) {
            continue;
        }
        $segments = preg_split('/\s*;\s*/', trim($line)) ?: [];
        foreach ($segments as $segment) {
            if (preg_match('/^(.+?)\s+(\d{1,2}:\d{2})\s*[-–—~〜]\s*(\d{1,2}:\d{2})$/u', trim($segment), $m)) {
                $days = parse_schema_day_expression($m[1]);
                $entries = array_merge($entries, make_hours_entries($days, $m[2], $m[3]));
            }
        }
    }
    return normalize_hours_entries($entries);
}

function parse_jsonld_hours_node(mixed $node): array
{
    if (!is_array($node)) {
        return [];
    }
    $entries = [];
    if (array_key_exists('openingHoursSpecification', $node)) {
        $specs = $node['openingHoursSpecification'];
        if (!is_array($specs) || array_is_list($specs) === false) {
            $specs = [$specs];
        }
        foreach ($specs as $spec) {
            if (!is_array($spec)) {
                continue;
            }
            $dayValues = $spec['dayOfWeek'] ?? [];
            $dayValues = is_array($dayValues) ? $dayValues : [$dayValues];
            $days = [];
            foreach ($dayValues as $dayValue) {
                if (!is_string($dayValue)) {
                    continue;
                }
                $day = schema_day_number($dayValue);
                if ($day !== null) {
                    $days[] = $day;
                }
            }
            $open = (string)($spec['opens'] ?? '');
            $close = (string)($spec['closes'] ?? '');
            $entries = array_merge($entries, make_hours_entries($days, $open, $close));
        }
    }
    if (array_key_exists('openingHours', $node)) {
        $entries = array_merge($entries, parse_schema_opening_hours($node['openingHours']));
    }
    foreach ($node as $value) {
        if (is_array($value)) {
            $entries = array_merge($entries, parse_jsonld_hours_node($value));
        }
    }
    return normalize_hours_entries($entries);
}

function extract_jsonld_hours(string $html): array
{
    $entries = [];
    if (!preg_match_all('~<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>~isu', $html, $matches)) {
        return [];
    }
    foreach ($matches[1] as $jsonText) {
        $jsonText = html_entity_decode(trim($jsonText), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $data = json_decode($jsonText, true);
        if (is_array($data)) {
            $entries = array_merge($entries, parse_jsonld_hours_node($data));
        }
    }
    return normalize_hours_entries($entries);
}

function japanese_days_from_text(string $text): array
{
    $text = trim($text);
    if ($text === '') {
        return [];
    }
    if (preg_match('/(?:毎日|全日|年中無休|月(?:曜)?(?:日)?から日(?:曜)?(?:日)?)/u', $text)) {
        return [0, 1, 2, 3, 4, 5, 6];
    }
    if (preg_match('/平日/u', $text)) {
        return [1, 2, 3, 4, 5];
    }
    if (preg_match('/土日(?:祝)?/u', $text)) {
        return [0, 6];
    }

    $map = ['日' => 0, '月' => 1, '火' => 2, '水' => 3, '木' => 4, '金' => 5, '土' => 6];
    if (preg_match('/([日月火水木金土])(?:曜(?:日)?)?\s*[-–—~〜～から]\s*([日月火水木金土])(?:曜(?:日)?)?/u', $text, $m)) {
        return expand_day_range($map[$m[1]], $map[$m[2]]);
    }
    preg_match_all('/([日月火水木金土])(?:曜(?:日)?)?/u', $text, $matches);
    $days = [];
    foreach ($matches[1] ?? [] as $day) {
        $days[] = $map[$day];
    }
    return array_values(array_unique($days));
}

function extract_hours_text_snippet(string $html): string
{
    $visibleHtml = preg_replace('~<(script|style|noscript)[^>]*>.*?</\1>~isu', ' ', $html) ?? $html;
    $text = html_entity_decode(strip_tags($visibleHtml), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/[\x{00A0}\t\r\n ]+/u', ' ', $text) ?? $text;
    $keywords = ['営業時間', '営業 時間', 'OPENING HOURS', 'Business Hours', 'Hours'];
    foreach ($keywords as $keyword) {
        $position = function_exists('mb_stripos')
            ? mb_stripos($text, $keyword, 0, 'UTF-8')
            : stripos($text, $keyword);
        if ($position === false) {
            continue;
        }
        $snippet = function_exists('mb_substr')
            ? mb_substr($text, (int)$position, 360, 'UTF-8')
            : substr($text, (int)$position, 360);
        $snippet = preg_split('/(?:住所|所在地|電話番号|TEL|アクセス|予約|料金|メニュー|席数)/u', $snippet, 2)[0] ?? $snippet;
        return trim($snippet);
    }
    return '';
}

function parse_japanese_hours_text(string $text): array
{
    if ($text === '') {
        return [];
    }
    $normalized = str_replace(['：', '〜', '～', '－', '—', '–'], [':', '~', '~', '-', '-', '-'], $text);
    $segments = preg_split('/[。;；\/｜|]+/u', $normalized) ?: [$normalized];
    $entries = [];

    foreach ($segments as $segment) {
        if (!preg_match('/(?:(翌)\s*)?(\d{1,2}):([0-5]\d)\s*[~\-]\s*(?:(翌)\s*)?(\d{1,2}):([0-5]\d)/u', $segment, $m)) {
            continue;
        }
        $days = japanese_days_from_text($segment);
        if ($days === []) {
            continue;
        }
        $open = sprintf('%02d:%02d', (int)$m[2], (int)$m[3]);
        $closeHour = (int)$m[5];
        $close = sprintf('%02d:%02d', $closeHour, (int)$m[6]);
        $nextDay = $m[4] !== '' || $closeHour < (int)$m[2];
        $entries = array_merge($entries, make_hours_entries($days, $open, $close, $nextDay));
    }

    if ($entries === [] && preg_match('/(毎日|全日|年中無休)?.{0,20}?(\d{1,2}):([0-5]\d)\s*[~\-]\s*(?:翌\s*)?(\d{1,2}):([0-5]\d)/u', $normalized, $m)) {
        $days = $m[1] !== '' ? [0, 1, 2, 3, 4, 5, 6] : [];
        if ($days !== []) {
            $open = sprintf('%02d:%02d', (int)$m[2], (int)$m[3]);
            $close = sprintf('%02d:%02d', (int)$m[4], (int)$m[5]);
            $entries = array_merge($entries, make_hours_entries($days, $open, $close));
        }
    }

    return normalize_hours_entries($entries);
}

function extract_hours_from_html(string $html, string $sourceUrl): array
{
    $verifiedAt = (new DateTimeImmutable('now', new DateTimeZone(SHISHA_TIMEZONE)))->format(DATE_ATOM);
    $jsonEntries = extract_jsonld_hours($html);
    $text = extract_hours_text_snippet($html);
    if ($jsonEntries !== []) {
        return [
            'hours' => $jsonEntries,
            'hours_text' => $text,
            'hours_status' => 'verified',
            'hours_source_url' => $sourceUrl,
            'hours_verified_at' => $verifiedAt,
        ];
    }
    $textEntries = parse_japanese_hours_text($text);
    if ($textEntries !== []) {
        return [
            'hours' => $textEntries,
            'hours_text' => $text,
            'hours_status' => 'partial',
            'hours_source_url' => $sourceUrl,
            'hours_verified_at' => $verifiedAt,
        ];
    }
    return [
        'hours' => [],
        'hours_text' => $text,
        'hours_status' => $text !== '' ? 'text_only' : 'unavailable',
        'hours_source_url' => $sourceUrl,
        'hours_verified_at' => $verifiedAt,
    ];
}

function is_social_url(string $url): bool
{
    $host = strtolower((string)parse_url($url, PHP_URL_HOST));
    foreach (['instagram.com', 'x.com', 'twitter.com', 'facebook.com', 'tiktok.com', 'line.me'] as $domain) {
        if ($host === $domain || str_ends_with($host, '.' . $domain)) {
            return true;
        }
    }
    return false;
}

function hours_summary(array $shop): string
{
    $entries = normalize_hours_entries($shop['hours'] ?? []);
    if ($entries !== []) {
        $dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        $parts = [];
        foreach ($entries as $entry) {
            if ($entry['is_closed']) {
                continue;
            }
            $closePrefix = $entry['closes_next_day'] ? '翌' : '';
            $parts[] = $dayNames[$entry['day_of_week']] . ' '
                . $entry['open_time'] . '〜' . $closePrefix . $entry['close_time'];
            if (count($parts) >= 4) {
                break;
            }
        }
        return implode(' / ', $parts) . (count($entries) > 4 ? ' ほか' : '');
    }

    $text = trim((string)($shop['hours_text'] ?? ''));
    if ($text === '') {
        return '';
    }
    if (function_exists('mb_strlen') && mb_strlen($text, 'UTF-8') > 120) {
        return mb_substr($text, 0, 117, 'UTF-8') . '…';
    }
    return strlen($text) > 180 ? substr($text, 0, 177) . '…' : $text;
}

function weekly_open_minutes(array $shop): int
{
    $total = 0;
    foreach (normalize_hours_entries($shop['hours'] ?? []) as $entry) {
        if ($entry['is_closed']) {
            continue;
        }
        $open = clock_minutes($entry['open_time']);
        $close = clock_minutes($entry['close_time']);
        if ($open === null || $close === null) {
            continue;
        }
        if ($entry['closes_next_day'] || $close <= $open) {
            $close += 1440;
        }
        $total += max(0, $close - $open);
    }
    return $total;
}

function shop_is_open_at(array $shop, DateTimeImmutable $at): ?bool
{
    $entries = normalize_hours_entries($shop['hours'] ?? []);
    if ($entries === []) {
        return null;
    }
    $local = $at->setTimezone(new DateTimeZone(SHISHA_TIMEZONE));
    $day = (int)$local->format('w');
    $minute = (int)$local->format('G') * 60 + (int)$local->format('i');
    $weekMinute = $day * 1440 + $minute;
    $week = 7 * 1440;

    foreach ($entries as $entry) {
        if ($entry['is_closed']) {
            continue;
        }
        $open = clock_minutes($entry['open_time']);
        $close = clock_minutes($entry['close_time']);
        if ($open === null || $close === null) {
            continue;
        }
        $start = $entry['day_of_week'] * 1440 + $open;
        $end = $entry['day_of_week'] * 1440 + $close;
        if ($entry['closes_next_day'] || $close <= $open) {
            $end += 1440;
        }
        foreach ([$weekMinute, $weekMinute + $week] as $candidate) {
            if ($candidate >= $start && $candidate < $end) {
                return true;
            }
        }
        if ($end > $week && $weekMinute < $end - $week) {
            return true;
        }
    }
    return false;
}

function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
{
    $r = 6371.0;
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat / 2) ** 2
        + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
    return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
}
