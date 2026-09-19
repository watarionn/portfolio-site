<?php
declare(strict_types=1); require_once __DIR__ . '/_common.php';
$q=geo_q();
try {
 $sql="SELECT s.station_code,s.station_name,s.station_reading,s.longitude,s.latitude,s.prefecture_code,
 l.line_code,l.line_name,sl.source_order
 FROM geo_lines l JOIN geo_station_lines sl ON sl.line_code=l.line_code JOIN geo_stations s ON s.station_code=sl.station_code
 WHERE l.line_name=? OR l.line_name_short=? OR l.line_name_abbrev=? OR l.line_code=?
 ORDER BY sl.source_order,s.station_code";
 $st=geo_pdo()->prepare($sql);$st->execute([$q,$q,$q,$q]);$rows=$st->fetchAll();
 geo_respond(['ok'=>true,'query'=>$q,'source_record_count'=>count($rows),'station_point_count'=>count($rows),'stations'=>$rows]);
} catch(Throwable $e){error_log('GEO line station search failed: '.$e->getMessage());geo_respond(['ok'=>false,'error'=>'沿線検索に失敗しました。'],500);}
