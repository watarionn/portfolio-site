<?php
declare(strict_types=1); require_once __DIR__ . '/_common.php';
$q=geo_q(); $limit=geo_limit(); $like='%'.geo_like_literal($q).'%';
try {
 $sql="SELECT line_code,line_name,line_name_short,line_name_abbrev,line_reading,corp_type
 FROM geo_lines WHERE line_name LIKE ? OR line_name_short LIKE ? OR line_name_abbrev LIKE ? OR line_reading LIKE ? OR line_code=?
 ORDER BY line_code LIMIT {$limit}";
 $st=geo_pdo()->prepare($sql);$st->execute([$like,$like,$like,$like,$q]);$rows=$st->fetchAll();
 geo_respond(['ok'=>true,'query'=>$q,'count'=>count($rows),'results'=>$rows]);
} catch(Throwable $e){error_log('GEO line search failed: '.$e->getMessage());geo_respond(['ok'=>false,'error'=>'路線検索に失敗しました。'],500);}
