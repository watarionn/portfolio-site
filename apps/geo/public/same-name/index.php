<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>同名駅 | 沿線・駅・住所</title><link rel="stylesheet" href="../assets/geo.css"></head><body>
<main class="geo-page"><nav class="geo-nav"><a href="../lab/">← DATA LAB</a><a href="../explore/">EXPLORE</a></nav>
<p class="geo-kicker">SAME NAME STATIONS</p><h1 id="title">同名駅</h1><p class="geo-status" id="status">読み込み中…</p><section class="same-grid" id="places"></section>
</main><script>
(async()=>{const p=new URLSearchParams(location.search);const name=p.get('station')||'住吉';document.querySelector('#title').textContent='「'+name+'」の駅';
try{const d=await fetch('../api/same-name.php?q='+encodeURIComponent(name)).then(r=>r.json());if(!d.ok)throw new Error(d.error);
document.querySelector('#status').textContent=d.station_count+'駅コード → '+d.place_count+'地点（'+d.grouping_radius_m+'m以内を試験的に統合）';
const root=document.querySelector('#places');d.places.forEach(x=>{const a=document.createElement('article');const h=document.createElement('h2');h.textContent=name;const p=document.createElement('p');p.textContent=x.lines.join(' / ');const s=document.createElement('small');s.textContent='駅コード '+x.station_codes.join(', ');a.append(h,p,s);root.append(a);});}
catch(e){document.querySelector('#status').textContent=e.message;}})();
</script></body></html>
