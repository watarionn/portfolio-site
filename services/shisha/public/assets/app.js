const B=window.APP_BASE||'';
let facets={},city='',coords=null,stationCoords=null,list=false,offset=0,total=0,loading=false;
const PAGE_SIZE=60;
const $=selector=>document.querySelector(selector);

async function requestJson(url,options){
    const response=await fetch(B+url,options);
    const text=await response.text();
    let data={};
    try{data=JSON.parse(text)}catch{throw new Error(text||`HTTP ${response.status}`)}
    if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);
    return data;
}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function safeUrl(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:''}catch{return ''}}
function formatVerified(value){if(!value)return'';const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleDateString('ja-JP')}

async function init(){
    facets=await requestJson('/api/facets.php');
    Object.keys(facets.prefectures).forEach(prefecture=>$('#pref').insertAdjacentHTML('beforeend',`<option>${escapeHtml(prefecture)}</option>`));
    $('#pref').onchange=()=>{city='';renderCities();loadLines()};
    $('#line').onchange=loadStations;
    $('#station').onchange=()=>{const option=$('#station').selectedOptions[0];stationCoords=option?.dataset.x?{lng:+option.dataset.x,lat:+option.dataset.y}:null};
    $('#search').onclick=()=>search(true);
    $('#query').onkeydown=event=>{if(event.key==='Enter')search(true)};
    $('#sort').onchange=()=>search(true);
    $('#view').onclick=()=>{list=!list;$('#results').classList.toggle('list',list);$('#view').textContent=list?'カード表示':'リスト表示'};
    $('#near').onchange=locate;
    $('#openNow').onchange=()=>{$('#openAt').disabled=$('#openNow').checked;search(true)};
    $('#openAt').onchange=()=>search(true);
    $('#more').onclick=()=>search(false);
    renderCities();
    search(true);
}
function renderCities(){
    const prefecture=$('#pref').value,items=facets.municipalities[prefecture]||{};
    $('#cities').innerHTML='<button class="active" data-value="" type="button">すべて</button>'+Object.entries(items).map(([name,count])=>`<button data-value="${escapeHtml(name)}" type="button">${escapeHtml(name)} ${count}</button>`).join('');
    $('#cities').onclick=event=>{if(event.target.tagName!=='BUTTON')return;city=event.target.dataset.value;[...$('#cities').children].forEach(element=>element.classList.toggle('active',element===event.target))};
}
async function loadLines(){
    const prefecture=$('#pref').value;
    $('#line').innerHTML='<option value="">沿線を選択</option>';
    $('#station').innerHTML='<option value="">駅を選択</option>';
    stationCoords=null;
    if(!prefecture)return;
    const data=await requestJson('/api/stations.php?method=getLines&prefecture='+encodeURIComponent(prefecture));
    (data.response?.line||[]).forEach(line=>$('#line').insertAdjacentHTML('beforeend',`<option>${escapeHtml(line)}</option>`));
}
async function loadStations(){
    const line=$('#line').value;
    $('#station').innerHTML='<option value="">駅を選択</option>';
    stationCoords=null;
    if(!line)return;
    const data=await requestJson('/api/stations.php?method=getStations&line='+encodeURIComponent(line));
    (data.response?.station||[]).forEach(station=>$('#station').insertAdjacentHTML('beforeend',`<option data-x="${station.x}" data-y="${station.y}">${escapeHtml(station.name)}</option>`));
}
function locate(){
    if(!$('#near').checked){coords=null;return}
    if(!navigator.geolocation){alert('このブラウザは現在地取得に対応していません。');$('#near').checked=false;return}
    navigator.geolocation.getCurrentPosition(position=>{coords={lat:position.coords.latitude,lng:position.coords.longitude};search(true)},()=>{alert('現在地を取得できませんでした。');$('#near').checked=false},{enableHighAccuracy:true,timeout:10000,maximumAge:300000});
}
function buildCard(shop){
    const official=safeUrl(shop.official_url);
    const hoursSource=safeUrl(shop.hours_source_url);
    const mapUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(shop.address||shop.name);
    const openBadge=shop.is_open_at===true?'<span class="badge open">営業中</span>':shop.is_open_at===false?'<span class="badge closed">営業時間外</span>':'';
    const hours=shop.hours_summary?`<p class="hours"><strong>営業時間</strong><br>${escapeHtml(shop.hours_summary)}</p>`:'<p class="hours unknown">営業時間未確認</p>';
    const verified=formatVerified(shop.hours_verified_at);
    const sourceLink=hoursSource?`<a href="${escapeHtml(hoursSource)}" target="_blank" rel="noopener">営業時間の出典</a>`:'';
    return `<article class="card"><div class="badges"><span class="badge">${escapeHtml(shop.prefecture||'地域未設定')}</span>${openBadge}</div><h2>${escapeHtml(shop.name)}</h2><p class="meta">${escapeHtml(shop.address||'住所未登録')}</p>${hours}${verified?`<p class="verified">営業時間確認: ${escapeHtml(verified)}</p>`:''}${shop.distance_km!=null?`<p><strong>${Number(shop.distance_km).toFixed(2)} km</strong></p>`:''}<div class="actions">${official?`<a href="${escapeHtml(official)}" target="_blank" rel="noopener">公式情報</a>`:''}${sourceLink}<a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener">地図・経路</a></div></article>`;
}
async function search(reset){
    if(loading)return;
    loading=true;
    try{
        if(reset){offset=0;$('#results').innerHTML=''}
        const origin=$('#near').checked?coords:stationCoords;
        const params=new URLSearchParams({q:$('#query').value,prefecture:$('#pref').value,municipality:city,sort:$('#sort').value,radius:$('#radius').value,offset:String(offset),limit:String(PAGE_SIZE)});
        if(origin){params.set('lat',origin.lat);params.set('lng',origin.lng)}
        if($('#openNow').checked)params.set('open_now','1');
        else if($('#openAt').value)params.set('open_at',$('#openAt').value);
        const data=await requestJson('/api/shops.php?'+params);
        total=data.count;
        $('#count').textContent=total+'件';
        $('#results').insertAdjacentHTML('beforeend',data.items.map(buildCard).join(''));
        if(total===0&&reset)$('#results').innerHTML='<p class="empty">条件に一致する店舗がありません。営業時間未確認の店舗は、営業日時検索では除外されます。</p>';
        offset+=data.items.length;
        $('#more').hidden=offset>=total;
    }catch(error){$('#results').innerHTML=`<p>${escapeHtml(error.message)}</p>`;$('#more').hidden=true}
    finally{loading=false}
}
init().catch(error=>{$('#results').innerHTML=`<p>${escapeHtml(error.message)}</p>`});
