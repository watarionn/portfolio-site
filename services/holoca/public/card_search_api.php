<?php
/**
 * ホロカ カード検索API
 * ==================================
 * holoca.html の検索機能から呼び出されるPHP。
 * 同じディレクトリに置いてください。
 *
 * GET /card_search_api.php?name=わため&type=ホロメン&...
 * → JSON を返す
 */

// ============================================================
// レスポンスヘッダー
// ============================================================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: no-store');

function respond_service_error(int $status = 500): void {
    http_response_code($status);
    echo json_encode([
        'ok'    => false,
        'error' => '検索サービスは現在利用できません。',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ============================================================
// Protected runtime configuration
// ============================================================
$configPath = __DIR__ . '/../../config.php';
if (!is_file($configPath)) {
    error_log('HOLOCA card search unavailable: protected config is missing.');
    respond_service_error(503);
}
require_once $configPath;

// 1回の検索で返す最大件数
define('MAX_RESULTS', 100);

// ============================================================
// DB接続（シングルトン）
// ============================================================
function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}

// ============================================================
// パラメータ取得ヘルパー
// ============================================================
function gp(string $key, string $default = ''): string {
    return trim($_GET[$key] ?? $default);
}

// ============================================================
// メイン処理
// ============================================================
try {
    $pdo = get_pdo();

    // ---- 検索パラメータ ----
    $name       = gp('name');
    $cardType   = gp('type');
    $bloom      = gp('bloom');
    $rarity     = gp('rarity');
    $expansion  = gp('expansion');
    $tag        = gp('tag');
    $tagMode    = gp('tag_mode', 'partial');
    $textKw     = gp('text');
    $abilities  = gp('abilities');
    $page       = max(1, (int)gp('page', '1'));
    $perPage    = min(MAX_RESULTS, max(1, (int)gp('per_page', '12')));

    // ---- SQLビルド ----
    $where  = ['1=1'];
    $params = [];

    // カード名（部分一致 — 全角半角・ひらがなカタカナ揺れに対応）
    if ($name !== '') {
        $where[]           = '(c.name LIKE :name OR c.name LIKE :name_n)';
        $params[':name']   = '%' . $name . '%';
        $params[':name_n'] = '%' . mb_convert_kana($name, 'KVa', 'UTF-8') . '%';
    }

    // カードタイプ
    if ($cardType !== '') {
        $where[]              = 'c.card_type = :card_type';
        $params[':card_type'] = $cardType;
    }

    // Bloomレベル
    if ($bloom !== '') {
        $where[]          = 'c.bloom_level = :bloom';
        $params[':bloom'] = $bloom;
    }

    // レアリティ
    if ($rarity !== '') {
        $where[]           = 'c.rarity_code = :rarity';
        $params[':rarity'] = $rarity;
    }

    // 収録商品
    if ($expansion !== '') {
        $where[] = 'EXISTS (
            SELECT 1 FROM card_expansions ce
            WHERE ce.card_no = c.card_no AND ce.expansion_code = :expansion
        )';
        $params[':expansion'] = $expansion;
    }

    // タグ
    if ($tag !== '') {
        $tagVal  = $tagMode === 'exact' ? $tag : '%' . $tag . '%';
        $tagOp   = $tagMode === 'exact' ? '=' : 'LIKE';
        $where[] = 'EXISTS (
            SELECT 1 FROM card_tags t
            WHERE t.card_no = c.card_no AND t.tag ' . $tagOp . ' :tag
        )';
        $params[':tag'] = $tagVal;
    }

    // 能力テキスト
    if ($textKw !== '') {
        $where[]                = '(c.ability_text LIKE :text_kw OR c.ability_text_raw LIKE :text_kw_raw)';
        $params[':text_kw']     = '%' . $textKw . '%';
        $params[':text_kw_raw'] = '%' . $textKw . '%';
    }

    // 特定能力
    if ($abilities !== '') {
        $abilityList = array_values(array_filter(array_map('trim', explode(',', $abilities))));
        $abilityMap  = [
            'サーチ'       => ['search',     'サーチ',   '手札に加える', 'デッキから'],
            'ドロー'       => ['draw',       'ドロー',   '引く'],
            '回復'         => ['heal',       '回復'],
            'エール加速'   => ['yell_boost', 'エール',   'エールゾーン'],
            'ダメージ増加' => ['damage_up',  'アーツ+',  'ダメージ'],
            '妨害・耐性'   => ['disrupt',    '妨害',     '耐性', '無効'],
        ];
        foreach ($abilityList as $i => $ab) {
            $keywords = $abilityMap[$ab] ?? [$ab];
            $engKey   = $keywords[0];
            $textKws  = array_slice($keywords, 1);

            $subConds = [];
            $keyAb    = ':ab_type_' . $i;
            $subConds[] = 'EXISTS (SELECT 1 FROM card_abilities a WHERE a.card_no = c.card_no AND a.ability_type = ' . $keyAb . ')';
            $params[$keyAb] = $engKey;

            foreach ($textKws as $j => $kw) {
                $keyLike    = ':ab_like_' . $i . '_' . $j;
                $subConds[] = 'c.ability_text LIKE ' . $keyLike;
                $params[$keyLike] = '%' . $kw . '%';
            }

            $where[] = '(' . implode(' OR ', $subConds) . ')';
        }
    }

    $whereSQL = implode(' AND ', $where);

    // ---- 総件数 ----
    $countSQL  = "SELECT COUNT(DISTINCT c.card_no) FROM cards c WHERE {$whereSQL}";
    $countStmt = $pdo->prepare($countSQL);
    $countStmt->execute($params);
    $totalCount = (int)$countStmt->fetchColumn();

    // ---- カード取得 ----
    $offset  = ($page - 1) * $perPage;
    $dataSQL = "
        SELECT
            c.card_no,
            c.name,
            c.card_type,
            c.hp,
            c.life,
            c.bloom_level,
            c.color,
            c.rarity_code,
            c.illustrator,
            c.ability_text,
            c.image_url,
            c.official_id,
            GROUP_CONCAT(DISTINCT t.tag ORDER BY t.id SEPARATOR '\t') AS tags_raw,
            GROUP_CONCAT(DISTINCT ab.ability_type ORDER BY ab.id SEPARATOR ',') AS ability_types,
            (
                SELECT e.code
                FROM card_expansions ce2
                JOIN expansions e ON ce2.expansion_code = e.code
                WHERE ce2.card_no = c.card_no
                ORDER BY e.sort_order DESC
                LIMIT 1
            ) AS expansion_code,
            (
                SELECT e.name
                FROM card_expansions ce2
                JOIN expansions e ON ce2.expansion_code = e.code
                WHERE ce2.card_no = c.card_no
                ORDER BY e.sort_order DESC
                LIMIT 1
            ) AS expansion_name
        FROM cards c
        LEFT JOIN card_tags      t  ON t.card_no  = c.card_no
        LEFT JOIN card_abilities ab ON ab.card_no = c.card_no
        WHERE {$whereSQL}
        GROUP BY c.card_no
        ORDER BY c.card_no ASC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($dataSQL);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
    $stmt->execute();
    $rawCards = $stmt->fetchAll();

    // ---- 整形 ----
    $cards = array_map(function (array $row): array {
        return [
            'no'            => $row['card_no'],
            'name'          => $row['name'],
            'type'          => $row['card_type'],
            'hp'            => $row['hp'] !== null ? (int)$row['hp'] : null,
            'life'          => $row['life'] !== null ? (int)$row['life'] : null,
            'bloom'         => $row['bloom_level'],
            'color'         => $row['color'],
            'rarity'        => $row['rarity_code'],
            'illustrator'   => $row['illustrator'],
            'text'          => $row['ability_text'],
            'imageUrl'      => $row['image_url'],
            'tags'          => array_values(array_filter(
                                 $row['tags_raw'] ? explode("\t", $row['tags_raw']) : [],
                                 fn($t) => !preg_match('/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $t)
                               )),
            'abilities'     => $row['ability_types']
                                 ? explode(',', $row['ability_types'])
                                 : [],
            'expansion'     => $row['expansion_code'],
            'expansionName' => $row['expansion_name'],
        ];
    }, $rawCards);

    echo json_encode([
        'ok'          => true,
        'total'       => $totalCount,
        'page'        => $page,
        'per_page'    => $perPage,
        'total_pages' => (int)ceil($totalCount / $perPage),
        'cards'       => $cards,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    error_log('HOLOCA card search failed: ' . get_class($e) . ': ' . $e->getMessage());
    respond_service_error(500);
}
