// ===== DATA =====
const CARD_TYPES=['推しホロメン','ホロメン','Buzzホロメン','サポート・アイテム・LIMITED','サポート・アイテム','サポート・イベント','サポート・イベント・LIMITED','サポート・ツール','サポート・マスコット','サポート・ファン','サポート・スタッフ・LIMITED','エール'];
const BLOOM_LEVELS=['Debut','1st','2nd','Spot'];
const RARITIES=['C','HR','OC','OSR','OUR','P','R','RR','S','SEC','SR','SY','U','UR'];
const CARD_NO_RE=/^[a-zA-Z]+[0-9]+-[0-9]+$/;
const DECK_LIMITS={oshi:1,main:50,yell:20};

let rows={oshi:[],main:[],yell:[]};
let nextId=1;
let tagMatchMode='partial';
let activeAbilities=new Set();
let searchResults=[];
let currentPage=1;
const PAGE_SIZE=12;

// ===== TAB =====
function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach((b,i)=>b.classList.toggle('active',(i===0&&tab==='deck')||(i===1&&tab==='search')));
  document.getElementById('tab-deck').classList.toggle('active',tab==='deck');
  document.getElementById('tab-search').classList.toggle('active',tab==='search');
}

// ===== ROW MGMT =====
function makeRow(id){return{id,qty:1,no:'',name:'',type:CARD_TYPES[0],hp:'',bloom:'',tags:[],text:'',rarity:RARITIES[0],tagInput:''};}
function addRow(deck){const id=nextId++;rows[deck].push(makeRow(id));renderTable(deck);updateCount(deck);}
function deleteRow(deck,id){rows[deck]=rows[deck].filter(r=>r.id!==id);renderTable(deck);updateCount(deck);}

// ===== RENDER =====
function renderTable(deck){
  const tbody=document.getElementById(deck+'-body');
  tbody.innerHTML='';
  rows[deck].forEach((row,idx)=>{
    const tr=document.createElement('tr');
    tr.id=`row-${deck}-${row.id}`;
    tr.innerHTML=`
      <td class="row-num">${idx+1}</td>
      <td><input type="number" min="1" max="4" value="${row.qty}" oninput="updateField('${deck}',${row.id},'qty',this.value)" style="width:40px"></td>
      <td>
        <input type="text" placeholder="hSD01-001" value="${esc(row.no)}" oninput="updateField('${deck}',${row.id},'no',this.value)" onblur="validateCardNo(this,'${deck}',${row.id})">
        <div class="val-msg" id="no-msg-${deck}-${row.id}">形式: hSD01-001</div>
      </td>
      <td><input type="text" placeholder="カード名" value="${esc(row.name)}" oninput="updateField('${deck}',${row.id},'name',this.value)"></td>
      <td>${mkSel('type',deck,row.id,CARD_TYPES,row.type)}</td>
      <td><input type="number" min="0" max="999" value="${row.hp}" placeholder="—" oninput="updateField('${deck}',${row.id},'hp',this.value)" style="width:40px"></td>
      <td>${mkSel('bloom',deck,row.id,BLOOM_LEVELS,row.bloom,'—')}</td>
      <td>
        <input type="text" placeholder="#タグ Enter" value="${esc(row.tagInput)}" oninput="updateField('${deck}',${row.id},'tagInput',this.value)" onkeydown="addTag(event,'${deck}',${row.id})">
        <div class="tag-display" id="tags-${deck}-${row.id}">${row.tags.map(t=>tpill(t,deck,row.id)).join('')}</div>
      </td>
      <td><textarea placeholder="能力テキスト" oninput="updateField('${deck}',${row.id},'text',this.value)">${esc(row.text)}</textarea></td>
      <td>${mkSel('rarity',deck,row.id,RARITIES,row.rarity)}</td>
      <td><button class="del-btn" onclick="deleteRow('${deck}',${row.id})">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
}
function mkSel(f,deck,id,opts,val,empty=''){
  return`<select onchange="updateField('${deck}',${id},'${f}',this.value)">${empty?`<option value="">${empty}</option>`:''}${opts.map(o=>`<option${o===val?' selected':''}>${o}</option>`).join('')}</select>`;
}
function tpill(t,deck,id){return`<span class="tag-pill">${esc(t)}<span class="del-tag" onclick="rmTag('${deck}',${id},${JSON.stringify(t)})">✕</span></span>`;}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ===== FIELD UPDATE =====
function updateField(deck,id,field,value){
  const row=rows[deck].find(r=>r.id===id);if(!row)return;
  if(field==='qty'){let v=parseInt(value);if(isNaN(v))v=1;if(v<1)v=1;if(v>4)v=4;row.qty=v;updateCount(deck);}
  else row[field]=value;
}
function validateCardNo(input,deck,id){
  const val=input.value.trim();
  const msg=document.getElementById(`no-msg-${deck}-${id}`);
  if(val&&!CARD_NO_RE.test(val)){input.classList.add('error');msg.classList.add('show');}
  else{input.classList.remove('error');msg.classList.remove('show');updateField(deck,id,'no',val);}
}
function addTag(e,deck,id){
  if(e.key!=='Enter')return;e.preventDefault();
  const row=rows[deck].find(r=>r.id===id);if(!row)return;
  let tag=row.tagInput.trim();if(!tag)return;
  if(!tag.startsWith('#'))tag='#'+tag;
  if(!row.tags.includes(tag))row.tags.push(tag);
  row.tagInput='';
  const disp=document.getElementById(`tags-${deck}-${row.id}`);
  if(disp)disp.innerHTML=row.tags.map(t=>tpill(t,deck,row.id)).join('');
  const inp=document.querySelector(`#row-${deck}-${row.id} .tag-display`).previousElementSibling;
  if(inp){inp.value='';inp.focus();}
}
function rmTag(deck,id,tag){
  const row=rows[deck].find(r=>r.id===id);if(!row)return;
  row.tags=row.tags.filter(t=>t!==tag);
  const disp=document.getElementById(`tags-${deck}-${id}`);
  if(disp)disp.innerHTML=row.tags.map(t=>tpill(t,deck,id)).join('');
}
function updateCount(deck){
  const total=rows[deck].reduce((s,r)=>s+(parseInt(r.qty)||0),0);
  const el=document.getElementById(deck+'-count');
  el.textContent=total;
  el.className=total===DECK_LIMITS[deck]?'count-ok':(total>DECK_LIMITS[deck]?'count-ng':'');
}

// ===== SAVE/LOAD =====
function saveDeck(){
  localStorage.setItem('holoca_deck',JSON.stringify({ts:new Date().toISOString(),...rows}));
  showToast('💾 デッキを保存しました！');
}
function loadDeck(){
  const s=localStorage.getItem('holoca_deck');if(!s)return;
  try{
    const d=JSON.parse(s);
    ['oshi','main','yell'].forEach(k=>{rows[k]=d[k]||[];});
    const ids=[...rows.oshi,...rows.main,...rows.yell].map(r=>r.id||0);
    nextId=(ids.length?Math.max(...ids):0)+1;
    ['oshi','main','yell'].forEach(k=>{renderTable(k);updateCount(k);});
    showToast('📂 保存済みデッキを読み込みました');
  }catch(e){}
}

// ===== TOAST =====
let toastTimer=null;
function showToast(msg){
  clearTimeout(toastTimer);
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}

// ===== DOWNLOAD =====
function openDlModal(){document.getElementById('dl-modal').classList.add('show');}
function closeDlModal(){document.getElementById('dl-modal').classList.remove('show');}
function downloadCSV(){
  const h=['デッキ','投入枚数','カード番号','カード名','カードタイプ','HP','Bloomレベル','タグ','能力テキスト','レアリティ'];
  const lines=[h.join(',')];
  [['oshi','推しホロメン'],['main','メインデッキ'],['yell','エールデッキ']].forEach(([d,l])=>{
    rows[d].forEach(r=>lines.push([l,r.qty,r.no,r.name,r.type,r.hp,r.bloom,r.tags.join(' '),`"${(r.text||'').replace(/"/g,'""')}"`,r.rarity].join(',')));
  });
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8;'}));a.download='holoca_deck.csv';a.click();
  closeDlModal();showToast('📊 CSVをダウンロードしました！');
}
function downloadImage(){closeDlModal();showToast('🖼️ 画像ダウンロードは準備中です');}

// ===== SHARE =====
function openShareModal(){document.getElementById('share-modal').classList.add('show');}
function closeShareModal(){document.getElementById('share-modal').classList.remove('show');}
function buildShareText(){
  const oshi=rows.oshi[0];
  let t='【ホロカデッキレシピ】\n';
  if(oshi?.name)t+=`推しホロメン: ${oshi.name}\n`;
  t+=`メインデッキ: ${rows.main.reduce((s,r)=>s+(parseInt(r.qty)||0),0)}/50枚\n`;
  t+=`エールデッキ: ${rows.yell.reduce((s,r)=>s+(parseInt(r.qty)||0),0)}/20枚\n`;
  t+='#ホロカ #ホロライブカードゲーム';
  return t;
}
function shareX(){window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareText())}`,'_blank');closeShareModal();}
function copyShareText(){navigator.clipboard.writeText(buildShareText()).then(()=>{closeShareModal();showToast('📋 テキストをコピーしました！');});}

// ===== DRAW (メインデッキのみ) =====
function drawHand(){
  const deck=[];
  rows.main.forEach(r=>{const q=parseInt(r.qty)||0;for(let i=0;i<q;i++)deck.push({no:r.no,name:r.name,type:r.type,rarity:r.rarity});});
  if(!deck.length){showToast('⚠️ メインデッキにカードがありません');return;}
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  const hand=deck.slice(0,7);
  const c=document.getElementById('draw-cards');c.innerHTML='';
  hand.forEach((card,i)=>{
    const div=document.createElement('div');div.className='draw-card';div.style.animationDelay=`${i*0.07}s`;
    div.innerHTML=`<div class="dc-num">${esc(card.no)||'—'}</div><div class="dc-name">${esc(card.name)||'（名称未設定）'}</div><div class="dc-type">${esc(card.type)}</div>`;
    c.appendChild(div);
  });
  const el=document.getElementById('draw-result');el.classList.add('show');
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
  showToast(`🃏 メインデッキ${deck.length}枚からシャッフルして${hand.length}枚ドロー！`);
}

// ===== SEARCH =====
// card_search_api.php と同じディレクトリに置いてください
const SEARCH_API = 'card_search_api.php';

function setTagMatch(mode){
  tagMatchMode=mode;
  document.getElementById('toggle-partial').classList.toggle('active',mode==='partial');
  document.getElementById('toggle-exact').classList.toggle('active',mode==='exact');
}
function toggleAbility(el){
  const ab=el.dataset.ability;
  if(activeAbilities.has(ab)){activeAbilities.delete(ab);el.classList.remove('active');}
  else{activeAbilities.add(ab);el.classList.add('active');}
}
function resetSearch(){
  ['s-name','s-type','s-bloom','s-rarity','s-exp','s-tag','s-text'].forEach(id=>{document.getElementById(id).value='';});
  activeAbilities.clear();
  document.querySelectorAll('.ability-chip').forEach(c=>c.classList.remove('active'));
  setTagMatch('partial');
  searchResults=[];
  currentPage=1;
  totalSearchPages=0;
  document.getElementById('search-results').innerHTML=`<div class="empty-state"><div class="emoji">🌸</div><div>検索条件を入力して「検索する」を押してください</div></div>`;
}

// ページ切り替え用にトータル件数・ページ数を保持
let totalSearchCount=0;
let totalSearchPages=0;

async function performSearch(page=1){
  const btn=document.getElementById('search-btn');
  const name    =document.getElementById('s-name').value.trim();
  const type    =document.getElementById('s-type').value;
  const bloom   =document.getElementById('s-bloom').value;
  const rarity  =document.getElementById('s-rarity').value;
  const exp     =document.getElementById('s-exp').value;
  const tag     =document.getElementById('s-tag').value.trim();
  const textKw  =document.getElementById('s-text').value.trim();
  const abilities=[...activeAbilities];

  // クエリパラメータ構築
  const params=new URLSearchParams();
  if(name)    params.set('name',      name);
  if(type)    params.set('type',      type);
  if(bloom)   params.set('bloom',     bloom);
  if(rarity)  params.set('rarity',    rarity);
  if(exp)     params.set('expansion', exp);
  if(tag){    params.set('tag',       tag); params.set('tag_mode', tagMatchMode); }
  if(textKw)  params.set('text',      textKw);
  if(abilities.length) params.set('abilities', abilities.join(','));
  params.set('page',     page);
  params.set('per_page', PAGE_SIZE);

  currentPage=page;

  btn.disabled=true;
  btn.innerHTML='<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.4);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite;margin-right:5px"></span>検索中...';
  if(page===1){
    document.getElementById('search-results').innerHTML='<div class="search-loading"><div class="spinner"></div><div>データベースを検索しています…</div></div>';
  }

  try{
    const res=await fetch(`${SEARCH_API}?${params.toString()}`);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    if(!data.ok) throw new Error(data.error||'検索失敗');

    searchResults    =data.cards||[];
    totalSearchCount =data.total;
    totalSearchPages =data.total_pages;
    renderSearchResults(data.total, data.total_pages);

  }catch(e){
    console.error(e);
    document.getElementById('search-results').innerHTML=
      `<div class="empty-state"><div class="emoji">😿</div>
       <div>検索エラーが発生しました。<br><code>card_search_api.php</code> が同じフォルダにあるか確認してください。</div>
       <div style="margin-top:6px;font-size:0.68rem;color:var(--error)">${esc(e.message)}</div></div>`;
  }finally{
    btn.disabled=false;
    btn.innerHTML='🔍 この条件で検索する';
  }
}

function bindSearchResultActions(container){
  container.querySelectorAll('.card-item[data-card-index]').forEach(cardEl=>{
    cardEl.addEventListener('click',()=>openCardModal(Number(cardEl.dataset.cardIndex)));
  });
  container.querySelectorAll('.card-item-footer').forEach(footer=>{
    footer.addEventListener('click',event=>event.stopPropagation());
  });
  container.querySelectorAll('.add-to-deck-btn[data-card-index][data-deck]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.stopPropagation();
      const index=Number(button.dataset.cardIndex);
      const card=searchResults[index];
      const deck=button.dataset.deck;
      if(!card||!['oshi','main','yell'].includes(deck))return;
      addFromSearch(card,deck);
    });
  });
}

function renderSearchResults(total, totalPages){
  const el=document.getElementById('search-results');
  if(!searchResults.length){
    el.innerHTML='<div class="empty-state"><div class="emoji">🔍</div><div>条件に一致するカードが見つかりませんでした</div></div>';
    return;
  }

  let html=`<div class="results-header"><div class="results-count"><strong>${total}</strong> 件ヒット</div></div><div class="results-grid">`;

  searchResults.forEach((card,i)=>{
    // 色名タグを除外（#xxx / #xxxxxx 形式のCSSカラーコード）
    const cleanTags=(card.tags||[]).filter(t=>!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t));
    const tags=cleanTags.map(t=>`<span class="card-tag-pill">${esc(t)}</span>`).join('');
    const img=card.imageUrl?`<img src="${esc(card.imageUrl)}" alt="" style="width:56px;height:auto;border-radius:6px;flex-shrink:0" onerror="this.style.display='none'">` :'';
    const expShort=(card.expansionName||'').replace('ブースターパック','BP').replace('スタートデッキ','SD').replace(/「|」/g,'');

    // デッキ種別ごとの追加可否
    const t=card.type||'';
    const canOshi = t==='推しホロメン';
    const canYell = t==='エール';
    const canMain = !canOshi && !canYell;
    const disOshi = canOshi?'':' disabled title="推しホロメンのみ追加できます"';
    const disMain = canMain?'':' disabled title="エール・推しホロメンはメインデッキに追加できません"';
    const disYell = canYell?'':' disabled title="エールのみ追加できます"';
    html+=`<div class="card-item" style="animation:cardReveal 0.33s ease ${i*0.03}s both" data-card-index="${i}">
      <div class="card-item-header">
        <div style="flex:1">
          <div class="card-item-name">${esc(card.name||'—')}</div>
          <div class="card-item-no">${esc(card.no||'—')}</div>
        </div>${img}
      </div>
      <div class="card-badges">
        ${card.type?`<span class="mini-badge mb-type">${esc(card.type)}</span>`:''}
        ${card.rarity?`<span class="mini-badge mb-rarity">${esc(card.rarity)}</span>`:''}
        ${card.bloom?`<span class="mini-badge mb-bloom">${esc(card.bloom)}</span>`:''}
        ${card.expansionName?`<span class="mini-badge mb-exp" title="${esc(card.expansionName)}">${esc(expShort)}</span>`:''}
      </div>
      ${tags?`<div class="card-item-tags">${tags}</div>`:''}
      ${card.text?`<div class="card-item-text">${esc(card.text)}</div>`:''}
      <div>
        <div class="card-add-title">デッキレシピに追加する</div>
        <div class="card-item-footer">
          <button class="add-to-deck-btn add-to-oshi" data-card-index="${i}" data-deck="oshi"${disOshi}>⭐ 推し</button>
          <button class="add-to-deck-btn add-to-main" data-card-index="${i}" data-deck="main"${disMain}>🌟 メイン</button>
          <button class="add-to-deck-btn add-to-yell" data-card-index="${i}" data-deck="yell"${disYell}>💛 エール</button>
        </div>
      </div>
    </div>`;
  });
  html+='</div>';

  // サーバーサイドページネーション
  if(totalPages>1){
    html+='<div class="pagination">';
    html+=`<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage<=1?'disabled':''}>‹</button>`;
    for(let p=1;p<=totalPages;p++){
      if(p===1||p===totalPages||Math.abs(p-currentPage)<=2)
        html+=`<button class="page-btn${p===currentPage?' active':''}" onclick="goPage(${p})">${p}</button>`;
      else if((p===2&&currentPage>4)||(p===totalPages-1&&currentPage<totalPages-3))
        html+=`<span style="padding:0 3px;color:var(--text-sub);line-height:34px">…</span>`;
    }
    html+=`<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage>=totalPages?'disabled':''}>›</button>`;
    html+='</div>';
  }
  el.innerHTML=html;
  bindSearchResultActions(el);
}

function goPage(p){
  if(p<1||p>totalSearchPages)return;
  performSearch(p);
  document.getElementById('search-results').scrollIntoView({behavior:'smooth',block:'start'});
}

function addFromSearch(card,deck){
  if(!card||typeof card!=='object'){
    showToast('⚠️ カード情報の解析に失敗しました');return;
  }

  // デッキ種別チェック
  const t=card.type||'';
  if(deck==='oshi' && t!=='推しホロメン'){
    showToast('⚠️ 推しホロメンデッキには「推しホロメン」のカードのみ追加できます');return;
  }
  if(deck==='yell' && t!=='エール'){
    showToast('⚠️ エールデッキには「エール」のカードのみ追加できます');return;
  }
  if(deck==='main' && (t==='推しホロメン'||t==='エール')){
    showToast('⚠️ メインデッキに「'+t+'」のカードは追加できません');return;
  }

  // 色名タグを除外して登録
  const cleanTags=(card.tags||[]).filter(t=>!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t));

  let row=rows[deck].find(r=>r.no&&r.no===card.no);
  if(row){row.qty=Math.min(4,(row.qty||0)+1);}
  else{
    const id=nextId++;
    const nr=makeRow(id);
    Object.assign(nr,{no:card.no||'',name:card.name||'',type:t||CARD_TYPES[0],hp:card.hp||'',bloom:card.bloom||'',tags:cleanTags,text:card.text||'',rarity:card.rarity||RARITIES[0]});
    rows[deck].push(nr);
  }
  renderTable(deck);updateCount(deck);
  const label={oshi:'推しホロメン',main:'メインデッキ',yell:'エールデッキ'}[deck];
  showToast(`✅「${card.name}」を${label}に追加！`);
}

// ===== CARD DETAIL MODAL =====
let modalCard = null;

function openCardModal(idx) {
  modalCard = searchResults[idx];
  if (!modalCard) return;
  const c = modalCard;

  document.getElementById('cm-name').textContent  = c.name  || '—';
  document.getElementById('cm-no').textContent    = c.no    || '—';
  document.getElementById('cm-type').textContent  = c.type  || '—';
  document.getElementById('cm-rarity').textContent= c.rarity|| '—';

  // Bloom / HP / LIFE — 値があるときだけ表示
  const bloomRow = document.getElementById('cm-bloom-row');
  document.getElementById('cm-bloom').textContent = c.bloom || '';
  bloomRow.style.display = c.bloom ? 'flex' : 'none';

  const hpRow = document.getElementById('cm-hp-row');
  document.getElementById('cm-hp').textContent = c.hp != null ? c.hp : '';
  hpRow.style.display = c.hp != null ? 'flex' : 'none';

  const lifeRow = document.getElementById('cm-life-row');
  document.getElementById('cm-life').textContent = c.life != null ? c.life : '';
  lifeRow.style.display = c.life != null ? 'flex' : 'none';

  document.getElementById('cm-exp').textContent = c.expansionName || c.expansion || '—';

  const illRow = document.getElementById('cm-ill-row');
  document.getElementById('cm-ill').textContent = c.illustrator || '';
  illRow.style.display = c.illustrator ? 'flex' : 'none';

  // 画像
  const img = document.getElementById('cm-img');
  if (c.imageUrl) { img.src = c.imageUrl; img.parentElement.style.display = 'block'; }
  else img.parentElement.style.display = 'none';

  // タグ（色名除外済み）
  const cleanTags = (c.tags||[]).filter(t => !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t));
  document.getElementById('cm-tags').innerHTML = cleanTags.map(t =>
    `<span class="card-tag-pill">${esc(t)}</span>`
  ).join('');

  // 能力テキスト
  const tw = document.getElementById('cm-text-wrap');
  document.getElementById('cm-text').textContent = c.text || '';
  tw.style.display = c.text ? 'block' : 'none';

  // 追加ボタンの有効/無効
  const t = c.type || '';
  const canOshi = t === '推しホロメン';
  const canYell  = t === 'エール';
  const canMain  = !canOshi && !canYell;
  const btnOshi = document.getElementById('cm-btn-oshi');
  const btnMain = document.getElementById('cm-btn-main');
  const btnYell = document.getElementById('cm-btn-yell');
  btnOshi.disabled = !canOshi; btnOshi.title = canOshi ? '' : '推しホロメンのみ追加できます';
  btnMain.disabled = !canMain; btnMain.title = canMain ? '' : 'エール・推しホロメンはメインデッキに追加できません';
  btnYell.disabled = !canYell; btnYell.title = canYell ? '' : 'エールのみ追加できます';

  document.getElementById('card-modal').classList.add('show');
}

function closeCardModal() {
  document.getElementById('card-modal').classList.remove('show');
}

function addFromModalCard(deck) {
  if (!modalCard) return;
  const cleanTags = (modalCard.tags||[]).filter(t => !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t));
  addFromSearch({...modalCard, tags: cleanTags}, deck);
  closeCardModal();
}
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show');}));

// ===== INIT =====
loadDeck();
['oshi','main','yell'].forEach(d=>{if(!rows[d].length)addRow(d);});
