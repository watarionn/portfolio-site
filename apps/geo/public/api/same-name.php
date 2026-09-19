<?php
declare(strict_types=1); require_once __DIR__ . '/_common.php';
$name=geo_q(); $radius=150.0;
try {
 $sql="SELECT s.station_code,s.station_name,s.station_reading,s.longitude,s.latitude,s.prefecture_code,
 l.line_code,l.line_name
 FROM geo_stations s LEFT JOIN geo_station_lines sl ON sl.station_code=s.station_code
 LEFT JOIN geo_lines l ON l.line_code=sl.line_code
 WHERE s.station_name=? ORDER BY s.prefecture_code,s.station_code,sl.source_order";
 $st=geo_pdo()->prepare($sql);$st->execute([$name]);$rows=$st->fetchAll();
 $stations=[];
 foreach($rows as $r){$code=$r['station_code'];if(!isset($stations[$code])){$stations[$code]=['station_code'=>$code,'station_name'=>$r['station_name'],'station_reading'=>$r['station_reading'],'longitude'=>$r['longitude'],'latitude'=>$r['latitude'],'prefecture_code'=>$r['prefecture_code'],'lines'=>[]];}if($r['line_name']!==null)$stations[$code]['lines'][]=$r['line_name'];}
 $points=array_values($stations);foreach($points as &$p)$p['lines']=array_values(array_unique($p['lines']));unset($p);
 $n=count($points);$parent=$n?range(0,$n-1):[];
 $find=function(int $x)use(&$parent,&$find):int{if($parent[$x]!==$x)$parent[$x]=$find($parent[$x]);return $parent[$x];};
 $union=function(int $a,int $b)use(&$parent,&$find):void{$ra=$find($a);$rb=$find($b);if($ra!==$rb)$parent[$rb]=$ra;};
 for($i=0;$i<$n;$i++)for($j=$i+1;$j<$n;$j++){if($points[$i]['latitude']===null||$points[$j]['latitude']===null)continue;$d=geo_distance_m((float)$points[$i]['latitude'],(float)$points[$i]['longitude'],(float)$points[$j]['latitude'],(float)$points[$j]['longitude']);if($d<=$radius)$union($i,$j);}
 $groups=[];foreach($points as $i=>$p)$groups[$find($i)][]=$p;$places=[];
 foreach($groups as $g){$lat=[];$lng=[];$lines=[];$codes=[];foreach($g as $p){if($p['latitude']!==null)$lat[]=(float)$p['latitude'];if($p['longitude']!==null)$lng[]=(float)$p['longitude'];$lines=array_merge($lines,$p['lines']);$codes[]=$p['station_code'];}$places[]=['name'=>$name,'prefecture_code'=>$g[0]['prefecture_code'],'latitude'=>$lat?array_sum($lat)/count($lat):null,'longitude'=>$lng?array_sum($lng)/count($lng):null,'lines'=>array_values(array_unique($lines)),'station_codes'=>$codes,'station_count'=>count($g)];}
 geo_respond(['ok'=>true,'query'=>$name,'grouping_radius_m'=>$radius,'station_count'=>$n,'place_count'=>count($places),'places'=>$places]);
} catch(Throwable $e){error_log('GEO same-name search failed: '.$e->getMessage());geo_respond(['ok'=>false,'error'=>'同名駅検索に失敗しました。'],500);}
