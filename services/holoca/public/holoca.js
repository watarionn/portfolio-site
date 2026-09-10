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
  const activeTab=tab==='search'?'search':'deck';
  document.querySelectorAll('.tab-btn[data-tab]').forEach(button=>{
    const active=button.dataset.tab===activeTab;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
    button.tabIndex=active?0:-1;
  });
  ['deck','search'].forEach(name=>{
    const panel=document.getElementById(`tab-${name}`);
    const active=name===activeTab;
    panel.classList.toggle('active',active);
    panel.hidden=!active;
  });
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
      <td class="row-num" data-label="CARD">${idx+1}</td>
      <td data-label="枚数"><input type="number" min="1" max="4" value="${row.qty}" data-deck="${deck}" data-row-id="${row.id}" data-field="qty"></td>
      <td data-label="カード番号"><input type="text" placeholder="hSD01-001" value="${esc(row.no)}" data-deck="${deck}" data-row-id="${row.id}" data-field="no" data-card-number><div class="val-msg" id="no-msg-${deck}-${row.id}">形式: hSD01-001</div></td>
      <td data-label="カード名"><input type="text" placeholder="カード名" value="${esc(row.name)}" data-deck="${deck}" data-row-id="${row.id}" data-field="name"></td>
      <td data-label="カードタイプ">${mkSel('type',deck,row.id,CARD_TYPES,row.type)}</td>
      <td data-label="HP"><input type="number" min="0" max="999" value="${row.hp}" placeholder="—" data-deck="${deck}" data-row-id="${row.id}" data-field="hp"></td>
      <td data-label="Bloom">${mkSel('bloom',deck,row.id,BLOOM_LEVELS,row.bloom,'—')}</td>
      <td data-label="タグ"><input type="text" placeholder="#タグ Enter" value="${esc(row.tagInput)}" data-deck="${deck}" data-row-id="${row.id}" data-field="tagInput" data-tag-input><div class="tag-display" id="tags-${deck}-${row.id}">${row.tags.map(t=>tpill(t,deck,row.id)).join('')}</div></td>
      <td data-label="能力テキスト"><textarea placeholder="能力テキスト" data-deck="${deck}" data-row-id="${row.id}" data-field="text">${esc(row.text)}</textarea></td>
      <td data-label="レアリティ">${mkSel('rarity',deck,row.id,RARITIES,row.rarity)}</td>
      <td data-label="削除"><button type="button" class="del-btn" data-delete-deck="${deck}" data-row-id="${row.id}" aria-label="${idx+1}行目を削除">✕</button></td>`;
    tbody.appendChild(tr);
  });
}
function mkSel(f,deck,id,opts,val,empty=''){
  return `<select data-deck="${deck}" data-row-id="${id}" data-field="${f}">${empty?`<option value="">${empty}</option>`:''}${opts.map(o=>`<option${o===val?' selected':''}>${o}</option>`).join('')}</select>`;
}
function tpill(t,deck,id){return `<span class="tag-pill">${esc(t)}<button type="button" class="del-tag" data-remove-tag data-deck="${deck}" data-row-id="${id}" data-tag="${esc(t)}" aria-label="${esc(t)}を削除">✕</button></span>`;}
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
function addTagValue(input,deck,id){
  const row=rows[deck].find(r=>r.id===id);if(!row)return;
  let tag=input.value.trim();if(!tag)return;
  if(!tag.startsWith('#'))tag='#'+tag;
  if(!row.tags.includes(tag))row.tags.push(tag);
  row.tagInput='';input.value='';
  const disp=document.getElementById(`tags-${deck}-${row.id}`);
  if(disp)disp.innerHTML=row.tags.map(t=>tpill(t,deck,row.id)).join('');
  input.focus();
}
function rmTag(deck,id,tag){
  const row=rows[deck].find(r=>r.id===id);if(!row)return;
  row.tags=row.tags.filter(t=>t!==tag);
  const disp=document.getElementById(`tags-${deck}-${id}`);
  if(disp)disp.innerHTML=row.tags.map(t=>tpill(t,deck,id)).join('');
}
function deckTotal(deck){return rows[deck].reduce((sum,row)=>sum+(parseInt(row.qty)||0),0);}
function updateDeckHealth(){
  const ready=Object.entries(DECK_LIMITS).every(([deck,limit])=>deckTotal(deck)===limit);
  const el=document.getElementById('deck-health');if(!el)return;
  el.textContent=ready?'READY':'BUILDING';el.dataset.state=ready?'ready':'building';
}
function updateCount(deck){
  const total=deckTotal(deck),limit=DECK_LIMITS[deck];
  const el=document.getElementById(deck+'-count');
  el.textContent=total;el.className=total===limit?'count-ok':(total>limit?'count-ng':'');
  const summary=document.getElementById(`summary-${deck}`);
  if(summary){summary.textContent=`${total} / ${limit}`;summary.dataset.state=total===limit?'ready':(total>limit?'over':'building');}
  updateDeckHealth();
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
function openDlModal(){openModal('dl-modal');}
function closeDlModal(){closeModal('dl-modal');}
function csvCell(value){return `"${String(value??'').replace(/"/g,'""')}"`;}
function downloadCSV(){
  const header=['デッキ','投入枚数','カード番号','カード名','カードタイプ','HP','Bloomレベル','タグ','能力テキスト','レアリティ'];
  const lines=[header.map(csvCell).join(',')];
  [['oshi','推しホロメン'],['main','メインデッキ'],['yell','エールデッキ']].forEach(([deck,label])=>{
    rows[deck].forEach(row=>lines.push([label,row.qty,row.no,row.name,row.type,row.hp,row.bloom,row.tags.join(' '),row.text,row.rarity].map(csvCell).join(',')));
  });
  const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8;'}));
  const a=document.createElement('a');a.href=url;a.download='holoca_deck.csv';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),0);closeDlModal();showToast('CSVをダウンロードしました');
}
function canvasLines(ctx,text,maxWidth){
  const chars=[...String(text||'')],lines=[];let line='';
  chars.forEach(char=>{const next=line+char;if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=char;}else line=next;});
  if(line)lines.push(line);return lines.length?lines:['—'];
}
function downloadImage(){
  const width=1400,margin=72,sectionGap=34,rowH=46;
  const groups=[['推しホロメン','oshi'],['メインデッキ','main'],['エールデッキ','yell']];
  const rowCount=groups.reduce((sum,[,deck])=>sum+Math.max(1,rows[deck].length),0);
  const height=330+groups.length*88+rowCount*rowH;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f2ead0';ctx.fillRect(0,0,width,height);
  ctx.fillStyle='#1a120a';ctx.font='700 54px serif';ctx.fillText('HOLOCA DECK RECIPE',margin,92);
  ctx.font='24px serif';ctx.fillStyle='#6b5538';ctx.fillText(`OSHI ${deckTotal('oshi')}/1   MAIN ${deckTotal('main')}/50   YELL ${deckTotal('yell')}/20`,margin,138);
  let y=205;
  groups.forEach(([label,deck])=>{
    ctx.fillStyle='#1a120a';ctx.fillRect(margin,y,width-margin*2,2);y+=36;
    ctx.font='700 28px serif';ctx.fillStyle='#1a120a';ctx.fillText(label,margin,y);
    ctx.font='18px serif';ctx.fillStyle='#9a7a32';ctx.fillText(`${deckTotal(deck)} / ${DECK_LIMITS[deck]} 枚`,width-margin-150,y);y+=28;
    const items=rows[deck].length?rows[deck]:[{qty:0,no:'',name:'カード未登録',type:''}];
    items.forEach(row=>{
      ctx.fillStyle='rgba(192,168,112,.28)';ctx.fillRect(margin,y+rowH-1,width-margin*2,1);
      ctx.font='20px serif';ctx.fillStyle='#3a2c18';
      ctx.fillText(`${row.qty||0} ×`,margin+8,y+30);ctx.fillStyle='#6b5538';ctx.fillText(row.no||'—',margin+78,y+30);
      ctx.fillStyle='#1a120a';const name=canvasLines(ctx,row.name||'名称未設定',570)[0];ctx.fillText(name,margin+280,y+30);
      ctx.fillStyle='#6b5538';ctx.fillText(row.type||'—',margin+900,y+30);y+=rowH;
    });
    y+=sectionGap;
  });
  ctx.font='16px serif';ctx.fillStyle='#a08060';ctx.fillText('Personal portfolio tool / not an official hololive service',margin,height-42);
  canvas.toBlob(blob=>{
    if(!blob){showToast('画像の生成に失敗しました');return;}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='holoca_deck.png';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),0);closeDlModal();showToast('PNGをダウンロードしました');
  },'image/png');
}

// ===== SHARE =====
function openShareModal(){openModal('share-modal');}
function closeShareModal(){closeModal('share-modal');}
function buildShareText(){
  const oshi=rows.oshi[0];
  let t='【ホロカデッキレシピ】\n';
  if(oshi?.name)t+=`推しホロメン: ${oshi.name}\n`;
  t+=`メインデッキ: ${rows.main.reduce((s,r)=>s+(parseInt(r.qty)||0),0)}/50枚\n`;
  t+=`エールデッキ: ${rows.yell.reduce((s,r)=>s+(parseInt(r.qty)||0),0)}/20枚\n`;
  t+='#ホロカ #ホロライブカードゲーム';
  return t;
}
function shareX(){window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareText())}`,'_blank','noopener,noreferrer');closeShareModal();}
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
  ['partial','exact'].forEach(name=>{
    const button=document.getElementById(`toggle-${name}`),active=name===mode;
    button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  });
}
function toggleAbility(el){
  const ab=el.dataset.ability;
  if(activeAbilities.has(ab)){activeAbilities.delete(ab);el.classList.remove('active');}
  else{activeAbilities.add(ab);el.classList.add('active');}
  el.setAttribute('aria-checked',String(activeAbilities.has(ab)));
}
function resetSearch(){
  ['s-name','s-type','s-bloom','s-rarity','s-exp','s-tag','s-text'].forEach(id=>{document.getElementById(id).value='';});
  activeAbilities.clear();
  document.querySelectorAll('.ability-chip').forEach(c=>{c.classList.remove('active');c.setAttribute('aria-checked','false');});
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
       <div>検索サービスに接続できませんでした。時間をおいてもう一度お試しください。</div>
       <div class="search-error-detail">${esc(e.message)}</div></div>`;
  }finally{
    btn.disabled=false;
    btn.textContent='🔍 この条件で検索する';
  }
}

function bindSearchResultActions(container){
  container.querySelectorAll('.card-item[data-card-index]').forEach(cardEl=>{
    const open=()=>openCardModal(Number(cardEl.dataset.cardIndex));
    cardEl.addEventListener('click',open);
    cardEl.addEventListener('keydown',event=>{
      if(event.target!==cardEl||!['Enter',' '].includes(event.key))return;
      event.preventDefault();open();
    });
  });
  container.querySelectorAll('.card-item-footer').forEach(footer=>footer.addEventListener('click',event=>event.stopPropagation()));
  container.querySelectorAll('.add-to-deck-btn[data-card-index][data-deck]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.stopPropagation();
      const card=searchResults[Number(button.dataset.cardIndex)],deck=button.dataset.deck;
      if(!card||!['oshi','main','yell'].includes(deck))return;addFromSearch(card,deck);
    });
  });
  container.querySelectorAll('.page-btn[data-page]').forEach(button=>button.addEventListener('click',()=>goPage(Number(button.dataset.page))));
  container.querySelectorAll('img.card-thumb').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;}));
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
    const img=card.imageUrl?`<img class="card-thumb" src="${esc(card.imageUrl)}" alt="" loading="lazy">` :'';
    const expShort=(card.expansionName||'').replace('ブースターパック','BP').replace('スタートデッキ','SD').replace(/「|」/g,'');

    // デッキ種別ごとの追加可否
    const t=card.type||'';
    const canOshi = t==='推しホロメン';
    const canYell = t==='エール';
    const canMain = !canOshi && !canYell;
    const disOshi = canOshi?'':' disabled title="推しホロメンのみ追加できます"';
    const disMain = canMain?'':' disabled title="エール・推しホロメンはメインデッキに追加できません"';
    const disYell = canYell?'':' disabled title="エールのみ追加できます"';
    html+=`<div class="card-item" style="animation:cardReveal 0.33s ease ${i*0.03}s both" data-card-index="${i}" role="button" tabindex="0" aria-label="${esc(card.name||'カード詳細')}の詳細を見る">
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
    html+=`<button class="page-btn" data-page="${currentPage-1}" ${currentPage<=1?'disabled':''} aria-label="前のページ">‹</button>`;
    for(let p=1;p<=totalPages;p++){
      if(p===1||p===totalPages||Math.abs(p-currentPage)<=2)
        html+=`<button class="page-btn${p===currentPage?' active':''}" data-page="${p}"${p===currentPage?' aria-current="page"':''}>${p}</button>`;
      else if((p===2&&currentPage>4)||(p===totalPages-1&&currentPage<totalPages-3))
        html+=`<span style="padding:0 3px;color:var(--text-sub);line-height:34px">…</span>`;
    }
    html+=`<button class="page-btn" data-page="${currentPage+1}" ${currentPage>=totalPages?'disabled':''} aria-label="次のページ">›</button>`;
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

  openModal('card-modal');
}

function closeCardModal(){closeModal('card-modal');}

function addFromModalCard(deck) {
  if (!modalCard) return;
  const cleanTags = (modalCard.tags||[]).filter(t => !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t));
  addFromSearch({...modalCard, tags: cleanTags}, deck);
  closeCardModal();
}
let lastFocusedElement=null;
function openModal(id){
  const modal=document.getElementById(id);if(!modal)return;
  lastFocusedElement=document.activeElement;modal.classList.add('show');modal.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>modal.querySelector('button:not(:disabled), input, select, textarea, [tabindex="0"]')?.focus());
}
function closeModal(id){
  const modal=document.getElementById(id);if(!modal)return;
  modal.classList.remove('show');modal.setAttribute('aria-hidden','true');
  if(lastFocusedElement instanceof HTMLElement)lastFocusedElement.focus();
}
function bindStaticActions(){
  const tabs=[...document.querySelectorAll('.tab-btn[data-tab]')];
  tabs.forEach((button,index)=>{
    button.addEventListener('click',()=>switchTab(button.dataset.tab));
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();
      const step=event.key==='ArrowRight'?1:-1,next=tabs[(index+step+tabs.length)%tabs.length];switchTab(next.dataset.tab);next.focus();
    });
  });
  document.querySelectorAll('[data-add-deck]').forEach(button=>button.addEventListener('click',()=>addRow(button.dataset.addDeck)));
  document.getElementById('save-deck-btn').addEventListener('click',saveDeck);
  document.getElementById('download-deck-btn').addEventListener('click',openDlModal);
  document.getElementById('share-deck-btn').addEventListener('click',openShareModal);
  document.getElementById('draw-hand-btn').addEventListener('click',drawHand);
  document.getElementById('search-btn').addEventListener('click',()=>performSearch());
  document.getElementById('reset-search-btn').addEventListener('click',resetSearch);
  document.querySelectorAll('[data-tag-match]').forEach(button=>button.addEventListener('click',()=>setTagMatch(button.dataset.tagMatch)));
  document.querySelectorAll('.ability-chip').forEach(chip=>{
    const activate=()=>toggleAbility(chip);chip.addEventListener('click',activate);
    chip.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();activate();}});
  });
  document.querySelectorAll('.search-input,.search-select').forEach(input=>input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();performSearch();}}));
  document.getElementById('download-csv-btn').addEventListener('click',downloadCSV);
  document.getElementById('download-png-btn').addEventListener('click',downloadImage);
  document.getElementById('close-dl-btn').addEventListener('click',closeDlModal);
  document.getElementById('share-x-btn').addEventListener('click',shareX);
  document.getElementById('copy-share-btn').addEventListener('click',copyShareText);
  document.getElementById('close-share-btn').addEventListener('click',closeShareModal);
  document.getElementById('close-card-btn').addEventListener('click',closeCardModal);
  document.querySelectorAll('[data-modal-deck]').forEach(button=>button.addEventListener('click',()=>addFromModalCard(button.dataset.modalDeck)));
  document.getElementById('cm-img').addEventListener('error',event=>{event.currentTarget.parentElement.style.display='none';});
  document.querySelectorAll('.modal-overlay').forEach(overlay=>overlay.addEventListener('click',event=>{if(event.target===overlay)closeModal(overlay.id);}));
  document.addEventListener('click',event=>{
    const del=event.target.closest('[data-delete-deck]');if(del){deleteRow(del.dataset.deleteDeck,Number(del.dataset.rowId));return;}
    const tag=event.target.closest('[data-remove-tag]');if(tag)rmTag(tag.dataset.deck,Number(tag.dataset.rowId),tag.dataset.tag);
  });
  document.addEventListener('input',event=>{
    const el=event.target.closest('[data-deck][data-row-id][data-field]');if(!el||el.tagName==='SELECT')return;
    updateField(el.dataset.deck,Number(el.dataset.rowId),el.dataset.field,el.value);
  });
  document.addEventListener('change',event=>{
    const el=event.target.closest('select[data-deck][data-row-id][data-field]');if(!el)return;
    updateField(el.dataset.deck,Number(el.dataset.rowId),el.dataset.field,el.value);
  });
  document.addEventListener('focusout',event=>{
    const el=event.target.closest('[data-card-number]');if(el)validateCardNo(el,el.dataset.deck,Number(el.dataset.rowId));
  });
  document.addEventListener('keydown',event=>{
    const tagInput=event.target.closest('[data-tag-input]');
    if(tagInput&&event.key==='Enter'){event.preventDefault();addTagValue(tagInput,tagInput.dataset.deck,Number(tagInput.dataset.rowId));return;}
    if(event.key==='Escape'){const modal=document.querySelector('.modal-overlay.show');if(modal)closeModal(modal.id);}
  });
}

// ===== INIT =====
bindStaticActions();
loadDeck();
['oshi','main','yell'].forEach(deck=>{renderTable(deck);updateCount(deck);});
switchTab('deck');
