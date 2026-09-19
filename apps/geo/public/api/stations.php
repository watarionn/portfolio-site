<?php
declare(strict_types=1); require_once __DIR__ . '/_common.php';
$q=geo_q(); $limit=geo_limit(); $like='%'.geo_like_literal($q).'%';
try {
 $sql="SELECT s.station_code,s.station_name,s.station_reading,s.longitude,s.latitude,s.prefecture_code,
 GROUP_CONCAT(DISTINCT l.line_name ORDER BY sl.source_order SEPARATOR ' / ') AS line_names
 FROM geo_stations s LEFT JOIN geo_station_lines sl ON sl.station_code=s.station_code
 LEFT JOIN geo_lines l ON l.line_code=sl.line_code
 WHERE s.station_name LIKE ? OR s.station_reading LIKE ? OR s.station_code=?
 GROUP BY s.station_code,s.station_name,s.station_reading,s.longitude,s.latitude,s.prefecture_code
 ORDER BY s.station_name,s.station_code LIMIT {$limit}";
 $st=geo_pdo()->prepare($sql); $st->execute([$like,$like,$q]); $rows=$st->fetchAll();
 geo_respond(['ok'=>true,'query'=>$q,'count'=>count($rows),'results'=>$rows]);
} catch(Throwable $e){error_log('GEO station search failed: '.$e->getMessage());geo_respond(['ok'=>false,'error'=>'駅検索に失敗しました。'],500);}
