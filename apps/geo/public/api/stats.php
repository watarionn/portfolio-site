<?php
declare(strict_types=1); require_once __DIR__ . '/_common.php';
try {
 $pdo=geo_pdo(); $queries=[
 'stations'=>'SELECT COUNT(*) FROM geo_stations',
 'station_lines'=>'SELECT COUNT(*) FROM geo_station_lines',
 'lines'=>'SELECT COUNT(*) FROM geo_lines',
 'address_records'=>'SELECT COUNT(*) FROM geo_addresses',
 'address_codes'=>'SELECT COUNT(DISTINCT address_code) FROM geo_addresses'];
 $stats=[];foreach($queries as $k=>$sql){$stats[$k]=(int)$pdo->query($sql)->fetchColumn();}
 geo_respond(['ok'=>true,'stats'=>$stats]);
} catch(Throwable $e){error_log('GEO stats failed: '.$e->getMessage());geo_respond(['ok'=>false,'error'=>'統計情報を取得できませんでした。'],500);}
