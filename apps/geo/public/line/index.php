<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>沿線 | 沿線・駅・住所</title><link rel="stylesheet" href="../assets/geo.css"></head><body>
<main class="geo-page"><nav class="geo-nav"><a href="../lab/">← DATA LAB</a><a href="../explore/">EXPLORE</a></nav>
<p class="geo-kicker">LINE TRAVELER</p><h1 id="title">沿線</h1><p class="geo-status" id="status">読み込み中…</p><section class="traveler" id="stations"></section>
</main><script>
(async()=>{const p=new URLSearchParams(location.search);const line=p.get('line')||'五能線';document.querySelector('#title').textContent=line;
try{const d=await fetch('../api/line-stations.php?q='+encodeURIComponent(line)).then(r=>r.json());if(!d.ok)throw new Error(d.error);
document.querySelector('#status').textContent=d.station_point_count+'地点';const root=document.querySelector('#stations');
d.stations.forEach((x,i)=>{const a=document.createElement('article');const n=document.createElement('small');n.textContent=String(i+1).padStart(2,'0');const h=document.createElement('h2');h.textContent=x.station_name;const r=document.createElement('p');r.textContent=x.station_reading||'';const c=document.createElement('small');c.textContent='駅コード '+x.station_code;a.append(n,h,r,c);root.append(a);});}
catch(e){document.querySelector('#status').textContent=e.message;}})();
</script></body></html>
