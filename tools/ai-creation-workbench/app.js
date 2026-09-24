(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const APP_VERSION = '1.0.0';
  const STORAGE = { notes: 'acw-v1-notes', favorites: 'acw-v1-favorites', onboarding: 'acw-v1-onboarding' };
  const tabs = [...document.querySelectorAll('.tab')];
  const panels = [...document.querySelectorAll('.workspace')];
  let toastTimer = null;

  function showToast(message) {
    const el = $('toast'); el.textContent = message; el.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function download(name, content, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  function csvCell(v) { const s = String(v ?? ''); return `"${s.replaceAll('"', '""')}"`; }

  function activateTab(tab, focus = false) {
    if (!tab) return;
    tabs.forEach((t) => { const active = t === tab; t.classList.toggle('active', active); t.setAttribute('aria-selected', String(active)); t.tabIndex = active ? 0 : -1; });
    panels.forEach((panel) => { const active = panel.id === `panel-${tab.dataset.panel}`; panel.classList.toggle('active', active); panel.hidden = !active; });
    history.replaceState(null, '', `#${tab.dataset.panel}`);
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
      e.preventDefault();
      let next = index;
      if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      activateTab(tabs[next], true);
    });
  });
  const initial = location.hash.slice(1); activateTab(tabs.find((t) => t.dataset.panel === initial) || tabs[0]);
  $('reloadPose').addEventListener('click', () => { $('poseFrame').src = `modules/pose/index.html?t=${Date.now()}`; });

  // Notebook / favorites
  let favorites = [];
  try { favorites = JSON.parse(localStorage.getItem(STORAGE.favorites) || localStorage.getItem('acw-phase2-favorites') || '[]'); if (!Array.isArray(favorites)) favorites = []; if (!localStorage.getItem(STORAGE.favorites) && favorites.length) localStorage.setItem(STORAGE.favorites, JSON.stringify(favorites)); } catch { favorites = []; }
  $('workspaceNotes').value = localStorage.getItem(STORAGE.notes) || localStorage.getItem('acw-phase2-notes') || '';
  if (!localStorage.getItem(STORAGE.notes) && $('workspaceNotes').value) localStorage.setItem(STORAGE.notes, $('workspaceNotes').value);
  let noteTimer = null;
  $('workspaceNotes').addEventListener('input', () => { $('notesStatus').textContent = '保存中…'; clearTimeout(noteTimer); noteTimer = setTimeout(() => { localStorage.setItem(STORAGE.notes, $('workspaceNotes').value); $('notesStatus').textContent = '保存済み'; }, 280); });
  function setModal(id, show) { const modal=$(id); modal.classList.toggle('hidden', !show); modal.setAttribute('aria-hidden', String(!show)); }
  $('openNotebook').addEventListener('click', () => { setModal('notebookModal', true); renderFavorites(); setTimeout(() => $('workspaceNotes').focus(), 30); });
  $('closeNotebook').addEventListener('click', () => setModal('notebookModal', false));
  $('notebookModal').addEventListener('click', (e) => { if (e.target === $('notebookModal')) setModal('notebookModal', false); });
  function favoriteId(type, data) { return `${type}:${data.seed ?? data.model_id ?? data.path ?? data.positive ?? data.input_url ?? ''}:${data.version_id ?? ''}`; }
  function isFavorite(type, data) { const id = favoriteId(type, data); return favorites.some((x) => x.id === id); }
  function toggleFavorite(type, title, data) {
    const id = favoriteId(type, data); const at = favorites.findIndex((x) => x.id === id);
    if (at >= 0) { favorites.splice(at, 1); showToast('お気に入りから外しました'); }
    else { favorites.unshift({ id, type, title, data, saved_at: new Date().toISOString() }); showToast('お気に入りに保存しました'); }
    localStorage.setItem(STORAGE.favorites, JSON.stringify(favorites)); updateFavoriteCount(); renderFavorites(); renderPromptResults(); renderModels();
  }
  function updateFavoriteCount() { $('favoriteCount').textContent = String(favorites.length); }
  function renderFavorites() {
    const box = $('favoritesList'); box.replaceChildren(); box.classList.toggle('empty-state', favorites.length === 0);
    if (!favorites.length) { box.textContent = 'お気に入りはまだありません。'; return; }
    favorites.forEach((f) => {
      const el = document.createElement('article'); el.className = 'favorite-item';
      const preview = f.type === 'prompt' ? f.data.positive : f.type === 'model' ? `${f.data.model_name || f.data.input_url} · ${f.data.version_name || ''}` : f.title;
      el.innerHTML = `<div class="row"><strong>${escapeHtml(f.type.toUpperCase())} · ${escapeHtml(f.title)}</strong><button data-remove="${escapeHtml(f.id)}">Remove</button></div><p>${escapeHtml(preview)}</p>`;
      el.querySelector('button').addEventListener('click', () => { favorites = favorites.filter((x) => x.id !== f.id); localStorage.setItem(STORAGE.favorites, JSON.stringify(favorites)); updateFavoriteCount(); renderFavorites(); renderPromptResults(); renderModels(); });
      box.append(el);
    });
  }
  $('exportWorkspace').addEventListener('click', () => download('acw-workspace.json', JSON.stringify({ format:'ai-creation-workbench-workspace', version:2, exported_at:new Date().toISOString(), notes:$('workspaceNotes').value, favorites }, null, 2), 'application/json'));
  updateFavoriteCount();

  // Prompt Lab
  const DEMO_PROMPT_DB = {
    config: { version:'2.0.0-demo', default_group:'normal', dedupe:true, allow_repeat_same_category:false, identity_prefix:'', suffix:'', negative_prompt:'low quality, blurry, distorted anatomy, extra limbs, unreadable text', groups:{
      normal:{ sentence_files:[{file:'normal.txt',weight:1}] }, office:{sentence_files:[{file:'office.txt',weight:1}]}, library:{sentence_files:[{file:'library.txt',weight:1}]}, street_night:{sentence_files:[{file:'street_night.txt',weight:1}]}, fashion:{sentence_files:[{file:'fashion.txt',weight:1}]}, profile_angle:{sentence_files:[{file:'profile_angle.txt',weight:1}]}
    }},
    words:{ place:['quiet library','sunlit cafe','small design studio','night city street','bookstore aisle','hotel lounge'], pose:['standing naturally','sitting at a desk','walking forward','looking over one shoulder','leaning against a wall'], move:['turning a page','adjusting glasses','holding a notebook','reaching for a shelf','walking through light rain'], light:['soft window light','warm tungsten light','overcast daylight','neon rim light','late afternoon backlight'], camera:['35mm medium shot','50mm eye-level portrait','wide environmental shot','close-up portrait','three-quarter view'], expression:['calm expression','subtle smile','focused expression','curious expression'], outfit:['layered casual outfit','minimal monochrome outfit','smart office outfit','streetwear layers','classic coat'], mood:['quiet and reflective','bright and energetic','cinematic and restrained','cozy and intimate'], composition:['centered composition','rule-of-thirds composition','foreground framing','strong leading lines'], body_angle:['front view','three-quarter angle','side profile','rear three-quarter angle'], item:['notebook','coffee cup','camera','umbrella','stack of books'] },
    sentences:{
      'normal.txt':['_PLACE_, _POSE_, _MOVE_, _EXPRESSION_, _LIGHT_, _CAMERA_, _MOOD_','_PLACE_, _OUTFIT_, _POSE_, _COMPOSITION_, _LIGHT_, _CAMERA_'],
      'office.txt':['small design studio, smart office outfit, _POSE_, _MOVE_, _EXPRESSION_, _LIGHT_, _CAMERA_','quiet office workspace, _ITEM_ on the desk, _COMPOSITION_, _MOOD_, _CAMERA_'],
      'library.txt':['quiet library, _POSE_, _MOVE_, _ITEM_, _LIGHT_, _CAMERA_, _MOOD_','bookstore aisle, _BODY_ANGLE_, reaching for a shelf, _EXPRESSION_, _COMPOSITION_, _LIGHT_'],
      'street_night.txt':['night city street, _OUTFIT_, _POSE_, _MOVE_, neon rim light, _CAMERA_, _MOOD_','rainy urban street, _BODY_ANGLE_, umbrella, _COMPOSITION_, _CAMERA_'],
      'fashion.txt':['studio fashion reference, _OUTFIT_, _BODY_ANGLE_, _POSE_, neutral backdrop, _CAMERA_','full outfit reference, _OUTFIT_, _POSE_, _COMPOSITION_, soft window light'],
      'profile_angle.txt':['portrait angle study, _BODY_ANGLE_, _EXPRESSION_, _LIGHT_, _CAMERA_','facial profile reference, _BODY_ANGLE_, neutral expression, soft window light, close-up portrait']
    }, source:'Built-in demo'
  };
  let promptDb = structuredClone(DEMO_PROMPT_DB); let promptRecords = [];
  const groupSelect = $('promptGroup');
  function refreshPromptGroups() {
    groupSelect.replaceChildren(); Object.keys(promptDb.config.groups || {}).forEach((name) => { const opt=document.createElement('option'); opt.value=name; opt.textContent=name; groupSelect.append(opt); });
    const preferred = promptDb.config.default_group; if (preferred && [...groupSelect.options].some((x) => x.value === preferred)) groupSelect.value = preferred;
    $('promptDbStatus').textContent = `${promptDb.source} · ${Object.keys(promptDb.words).length} word categories · ${Object.keys(promptDb.config.groups || {}).length} groups · ${Object.keys(promptDb.sentences).length} sentence files`;
  }
  function usableLines(text) { return String(text).split(/\r?\n/).map((x) => x.trim()).filter((x) => x && !x.startsWith('#')); }
  async function importPromptDb(files) {
    const list=[...files]; const configFile=list.find((f)=>/(^|\/)config\.json$/i.test(f.webkitRelativePath || f.name)); if(!configFile) throw new Error('config.json が見つかりません');
    const config=JSON.parse(await configFile.text()); if(!config.groups || typeof config.groups !== 'object') throw new Error('config.groups がありません');
    const words={}; const sentences={};
    for (const file of list) {
      const path=(file.webkitRelativePath || file.name).replaceAll('\\','/');
      const wm=path.match(/(?:^|\/)words\/([^/]+)\.txt$/i); const sm=path.match(/(?:^|\/)sentences\/([^/]+\.txt)$/i);
      if (wm) { const lines=usableLines(await file.text()); if(lines.length) words[wm[1].toLowerCase().replaceAll('-','_')]=lines; }
      if (sm) { const lines=usableLines(await file.text()); if(lines.length) sentences[sm[1]]=lines; }
    }
    const missing=[]; for(const g of Object.values(config.groups)){ for(const sf of g.sentence_files || []){ const name=typeof sf==='string'?sf:sf.file; if(name && !sentences[name]) missing.push(name); }}
    if(missing.length) throw new Error(`sentences不足: ${[...new Set(missing)].slice(0,6).join(', ')}`);
    promptDb={ config, words, sentences, source:`Imported PromptDB: ${configFile.webkitRelativePath.split('/')[0] || 'folder'}` }; $('promptDedupe').checked = config.dedupe !== false; refreshPromptGroups(); generatePrompts();
  }
  $('promptDbImportButton').addEventListener('click', () => $('promptDbFolder').click());
  $('promptDbFolder').addEventListener('change', async (e) => { try { await importPromptDb(e.target.files); showToast('PromptDBを読み込みました'); } catch(err){ showToast(err.message); } finally { e.target.value=''; } });
  $('promptDbReset').addEventListener('click', () => { promptDb=structuredClone(DEMO_PROMPT_DB); $('promptDedupe').checked = true; refreshPromptGroups(); generatePrompts(); showToast('Demo PromptDBへ戻しました'); });
  function hashSeed(value){let h=1779033703^value.length;for(let i=0;i<value.length;i++){h=Math.imul(h^value.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^=h>>>16)>>>0;};}
  function mulberry32(a){return()=>{let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function makeRng(seed){return mulberry32(hashSeed(String(seed))());} function choice(arr,rng){return arr[Math.floor(rng()*arr.length)];}
  function weightedSentenceFile(group,rng){ const raw=group.sentence_files||[]; const items=raw.map((x)=>typeof x==='string'?{file:x,weight:1}:{file:x.file,weight:Number(x.weight)||1}).filter(x=>x.file&&promptDb.sentences[x.file]); if(!items.length) throw new Error('sentence fileがありません'); const total=items.reduce((s,x)=>s+x.weight,0); let n=rng()*total; for(const x of items){n-=x.weight;if(n<=0)return x.file;}return items.at(-1).file; }
  const tokenPatterns=[/__([a-zA-Z][a-zA-Z0-9_-]*)__/g,/\{([a-zA-Z][a-zA-Z0-9_-]*)\}/g,/_([A-Z][A-Z0-9_]*)_/g];
  function renderTemplate(template,rng,allowRepeat=false){const used=new Map();let text=template;for(const regex of tokenPatterns){text=text.replace(regex,(whole,raw)=>{const key=raw.toLowerCase().replaceAll('-','_'),values=promptDb.words[key];if(!values?.length)return whole;const already=used.get(key)||[],available=allowRepeat?values:values.filter(x=>!already.includes(x)),value=choice(available.length?available:values,rng);used.set(key,[...already,value]);return value;});}return text.replace(/\s+,/g,',').replace(/,\s*,+/g,',').replace(/\s+/g,' ').trim().replace(/^,|,$/g,'').trim();}
  function composePositive(rendered,group){const prefix=group.identity_prefix ?? promptDb.config.identity_prefix ?? '',suffix=group.suffix ?? promptDb.config.suffix ?? '';return [prefix,rendered,suffix].map(x=>String(x||'').trim()).filter(Boolean).join(', ').replace(/,\s*,+/g,', ');}
  function generatePrompts(){try{const groupName=groupSelect.value,group=promptDb.config.groups[groupName];if(!group)throw new Error('groupがありません');const count=Math.max(1,Math.min(50,Number($('promptCount').value)||1));const raw=$('promptSeed').value.trim(),seed=raw===''?Math.floor(Math.random()*2147483647):Number(raw);$('promptSeed').value=String(seed);const master=makeRng(seed),dedupe=$('promptDedupe').checked,seen=new Set(),out=[];let attempts=0;while(out.length<count&&attempts<count*50){attempts++;const childSeed=Math.floor(master()*2147483647),rng=makeRng(childSeed),sentenceFile=weightedSentenceFile(group,rng),template=choice(promptDb.sentences[sentenceFile],rng),rendered=renderTemplate(template,rng,Boolean(group.allow_repeat_same_category ?? promptDb.config.allow_repeat_same_category)),positive=composePositive(rendered,group),negative=String(group.negative_prompt ?? promptDb.config.negative_prompt ?? '').trim(),key=`${positive}\n${negative}`;if(dedupe&&seen.has(key))continue;seen.add(key);out.push({index:out.length+1,group:groupName,sentence_file:sentenceFile,seed:childSeed,template,positive,negative,created_at:new Date().toISOString()});}promptRecords=out;renderPromptResults();}catch(err){showToast(err.message);}}
  function renderPromptResults(){const box=$('promptResults');box.replaceChildren();box.classList.toggle('empty-state',!promptRecords.length);$('promptSummary').textContent=promptRecords.length?`${promptRecords.length}件生成 · group=${groupSelect.value} · seed=${$('promptSeed').value}`:'まだ生成されていません。';if(!promptRecords.length){box.textContent='Generateを押すと候補がここに並びます。';return;}promptRecords.forEach((r)=>{const article=document.createElement('article');article.className='prompt-item';const fav=isFavorite('prompt',r);article.innerHTML=`<button class="favorite-btn ${fav?'active':''}" aria-label="お気に入り${fav?'解除':'登録'}">${fav?'★':'☆'}</button><div class="prompt-meta"><span class="chip">#${r.index}</span><span class="chip">${escapeHtml(r.group)}</span><span class="chip">${escapeHtml(r.sentence_file||'')}</span><span class="chip">seed ${r.seed}</span></div><div class="prompt-positive">${escapeHtml(r.positive)}</div><div class="prompt-negative">Negative: ${escapeHtml(r.negative)}</div>`;article.querySelector('.favorite-btn').addEventListener('click',()=>toggleFavorite('prompt',`${r.group} · seed ${r.seed}`,r));box.append(article);});}
  $('generatePrompts').addEventListener('click',generatePrompts);$('shuffleSeed').addEventListener('click',()=>{$('promptSeed').value=Math.floor(Math.random()*2147483647);generatePrompts();});
  $('copyPrompts').addEventListener('click',async()=>{if(!promptRecords.length)return;await navigator.clipboard.writeText(promptRecords.map(r=>r.positive).join('\n'));showToast(`${promptRecords.length}件をコピーしました`);});
  $('exportPromptTxt').addEventListener('click',()=>{if(promptRecords.length)download('prompt-lab.txt',promptRecords.map(r=>`[${r.index}] ${r.group} / ${r.sentence_file} / seed=${r.seed}\n${r.positive}\nNEGATIVE: ${r.negative}`).join('\n\n'),'text/plain;charset=utf-8');});
  $('exportPromptJson').addEventListener('click',()=>{if(promptRecords.length)download('prompt-lab.json',JSON.stringify({format:'ai-creation-workbench-prompts',version:2,source:promptDb.source,records:promptRecords},null,2),'application/json');});
  $('exportPromptCsv').addEventListener('click',()=>{if(!promptRecords.length)return;const head=['index','group','sentence_file','seed','positive','negative','template','created_at'],rows=[head,...promptRecords.map(r=>head.map(k=>r[k]))];download('prompt-lab.csv','\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');});

  // Model Inspector + offline JSON
  const offlineDb={ models:new Map(), versions:new Map(), records:new Map() };
  function updateOfflineStatus(){ $('offlineDbStatus').textContent=`Offline DB: ${offlineDb.models.size} models / ${offlineDb.versions.size} versions / ${offlineDb.records.size} exported records`; }
  function parseCivitaiUrl(raw){try{const u=new URL(raw.trim());let modelId=null,versionId=null;let m=u.pathname.match(/\/models\/(\d+)/i);if(m)modelId=Number(m[1]);m=u.pathname.match(/\/api\/download\/models\/(\d+)/i)||u.pathname.match(/\/api\/v1\/model-versions\/(\d+)/i);if(m)versionId=Number(m[1]);m=u.pathname.match(/\/api\/v1\/models\/(\d+)/i);if(m)modelId=Number(m[1]);for(const key of ['modelVersionId','versionId']){const q=u.searchParams.get(key);if(q&&/^\d+$/.test(q))versionId=Number(q);}return{modelId,versionId};}catch{return{modelId:null,versionId:null};}}
  function stripHtml(value){const doc=new DOMParser().parseFromString(String(value||''),'text/html');return(doc.body.textContent||'').replace(/\s+/g,' ').trim();}function bytes(file){if(Number.isFinite(file?.sizeKB))return Math.round(file.sizeKB*1024);if(Number.isFinite(file?.size))return Number(file.size);return 0;}
  function choosePrimary(version){const files=Array.isArray(version?.files)?[...version.files]:[];files.sort((a,b)=>{const score=f=>[(f.primary||f.metadata?.primary)?1:0,['model','checkpoint','lora'].includes(String(f.type||'').toLowerCase())?1:0,bytes(f)],A=score(a),B=score(b);return B[0]-A[0]||B[1]-A[1]||B[2]-A[2];});return files[0]||{};}
  function extractSettings(...texts){const rx=/(recommend|recommended|setting|parameter|steps?|sampler|scheduler|cfg|guidance|clip\s*skip|denois|strength|weight|resolution|width|height|vae|prompt|trigger|推奨|設定|ステップ|サンプラー|トリガー|強度|解像度|プロンプト)/i,found=[];texts.filter(Boolean).forEach(t=>String(t).split(/[\n\r]+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x&&rx.test(x)).forEach(x=>{if(!found.includes(x))found.push(x.slice(0,400));}));return found.slice(0,20).join(' / ');}
  function recordFromModel(raw,model,version,source){const primary=choosePrimary(version),modelText=stripHtml(model?.description),versionText=stripHtml(version?.description),creator=model?.creator?.username||'';return{input_url:raw,status:'OK',error:'',source,model_type:model?.type||'',model_name:model?.name||version?.model?.name||'',version_name:version?.name||'',creator,file_name:primary.name||'',file_size_bytes:bytes(primary)||'',trigger_words:Array.isArray(version?.trainedWords)?version.trainedWords.join(' | '):'',download_url:primary.downloadUrl||version?.downloadUrl||'',recommended_settings:extractSettings(modelText,versionText),base_model:version?.baseModel||'',model_id:model?.id||version?.modelId||version?.model?.id||'',version_id:version?.id||'',model_description:modelText,version_description:versionText};}
  async function importOfflineJson(files){let loaded=0;for(const file of files){let data;try{data=JSON.parse(await file.text());}catch{continue;}loaded++;if(Array.isArray(data?.records)){for(const r of data.records){const key=`${r.model_id||''}:${r.version_id||''}`;offlineDb.records.set(key,r);}continue;}const array=Array.isArray(data?.items)?data.items:[data];for(const obj of array){if(!obj||typeof obj!=='object')continue;if(Array.isArray(obj.modelVersions)){if(obj.id!=null)offlineDb.models.set(Number(obj.id),obj);for(const v of obj.modelVersions){if(v?.id!=null)offlineDb.versions.set(Number(v.id),{...v,modelId:v.modelId??obj.id,model:v.model??{id:obj.id,name:obj.name}});}}else if(obj.id!=null&&(obj.modelId!=null||obj.model?.id!=null||obj.files||obj.trainedWords)){offlineDb.versions.set(Number(obj.id),obj);if(obj.model&&obj.model.id!=null)offlineDb.models.set(Number(obj.model.id),obj.model);}}}updateOfflineStatus();showToast(`${loaded} JSONをOffline DBへ読み込みました`);}
  $('offlineJsonButton').addEventListener('click',()=> $('offlineJsonFiles').click());$('offlineJsonFiles').addEventListener('change',async e=>{await importOfflineJson([...e.target.files]);e.target.value='';});
  $('clearOfflineJson').addEventListener('click',()=>{offlineDb.models.clear();offlineDb.versions.clear();offlineDb.records.clear();updateOfflineStatus();showToast('Offline DBを解除しました');});
  async function apiJson(url,key){const headers={Accept:'application/json'};if(key)headers.Authorization=`Bearer ${key}`;const res=await fetch(url,{headers});if(!res.ok)throw new Error(`API ${res.status}`);return res.json();}
  function resolveOffline(raw,parsed){const direct=offlineDb.records.get(`${parsed.modelId||''}:${parsed.versionId||''}`)||[...offlineDb.records.values()].find(r=>(parsed.versionId&&Number(r.version_id)===parsed.versionId)||(parsed.modelId&&!parsed.versionId&&Number(r.model_id)===parsed.modelId));if(direct)return{...direct,input_url:raw,source:'Offline export'};let version=parsed.versionId?offlineDb.versions.get(parsed.versionId):null,model=parsed.modelId?offlineDb.models.get(parsed.modelId):null;if(!model&&version){const mid=Number(version.modelId||version.model?.id||0);if(mid)model=offlineDb.models.get(mid)||version.model||null;}if(model&&!version){const versions=Array.isArray(model.modelVersions)?model.modelVersions:[];version=versions[0]||null;}if(!model&&parsed.modelId){model=[...offlineDb.models.values()].find(m=>Number(m.id)===parsed.modelId)||null;}if(model&&version)return recordFromModel(raw,model,version,'Offline JSON');return null;}
  let modelRecords=[];
  async function inspectOne(raw,key,mode){const parsed=parseCivitaiUrl(raw),base={input_url:raw,model_id:parsed.modelId||'',version_id:parsed.versionId||''};if(!parsed.modelId&&!parsed.versionId)return{...base,status:'ERROR',source:'URL parser',error:'Civitai model URLを認識できません'};if(mode!=='api'){const off=resolveOffline(raw,parsed);if(off)return off;if(mode==='offline')return{...base,status:'ERROR',source:'Offline JSON',error:'Offline DBに該当データがありません'};}try{let versionApi=null,modelId=parsed.modelId;if(!modelId&&parsed.versionId){versionApi=await apiJson(`https://civitai.com/api/v1/model-versions/${parsed.versionId}`,key);modelId=Number(versionApi.modelId||versionApi.model?.id||0)||null;}if(!modelId)throw new Error('modelIdを取得できません');const model=await apiJson(`https://civitai.com/api/v1/models/${modelId}`,key),versions=Array.isArray(model.modelVersions)?model.modelVersions:[];let version=parsed.versionId?versions.find(v=>Number(v.id)===parsed.versionId):versions[0];if(!version&&versionApi)version=versionApi;if(!version)throw new Error('versionがありません');if(versionApi&&Number(versionApi.id)===Number(version.id))version={...version,...versionApi};return recordFromModel(raw,model,version,'Civitai API');}catch(error){return{...base,status:'ERROR',source:'Civitai API',error:error?.message||String(error)};}}
  function renderModels(){const box=$('modelResults');box.replaceChildren();box.classList.toggle('empty-state',!modelRecords.length);const ok=modelRecords.filter(x=>x.status==='OK').length;$('modelSummary').textContent=modelRecords.length?`${modelRecords.length}件 · OK ${ok} / ERROR ${modelRecords.length-ok}`:'URLを入力してください。';if(!modelRecords.length){box.textContent='モデル情報がここに並びます。';return;}modelRecords.forEach(r=>{const article=document.createElement('article');article.className='model-item';const title=r.model_name||r.input_url,fav=isFavorite('model',r);article.innerHTML=`<button class="favorite-btn ${fav?'active':''}" aria-label="お気に入り${fav?'解除':'登録'}">${fav?'★':'☆'}</button><div class="model-meta"><span class="chip">${escapeHtml(r.status)}</span><span class="chip source-chip">${escapeHtml(r.source||'-')}</span>${r.model_type?`<span class="chip">${escapeHtml(r.model_type)}</span>`:''}${r.base_model?`<span class="chip">${escapeHtml(r.base_model)}</span>`:''}</div><h4>${escapeHtml(title)}</h4><dl class="model-fields">${r.error?`<dt>Error</dt><dd class="error-text">${escapeHtml(r.error)}</dd>`:''}<dt>Version</dt><dd>${escapeHtml(r.version_name||'-')}</dd><dt>Creator</dt><dd>${escapeHtml(r.creator||'-')}</dd><dt>Model / Version ID</dt><dd>${escapeHtml(`${r.model_id||'-'} / ${r.version_id||'-'}`)}</dd><dt>File</dt><dd>${escapeHtml(r.file_name||'-')}</dd><dt>Trigger</dt><dd>${escapeHtml(r.trigger_words||'-')}</dd><dt>Recommended</dt><dd>${escapeHtml(r.recommended_settings||'-')}</dd></dl>`;article.querySelector('.favorite-btn').addEventListener('click',()=>toggleFavorite('model',title,r));box.append(article);});}
  $('inspectModels').addEventListener('click',async()=>{const urls=$('modelUrls').value.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));if(!urls.length)return;$('inspectModels').disabled=true;modelRecords=[];for(let i=0;i<urls.length;i++){modelRecords.push(await inspectOne(urls[i],$('modelApiKey').value.trim(),$('modelFetchMode').value));$('modelSummary').textContent=`${i+1} / ${urls.length} 取得中…`;renderModels();}$('inspectModels').disabled=false;});
  $('clearModels').addEventListener('click',()=>{modelRecords=[];$('modelUrls').value='';$('modelApiKey').value='';renderModels();});
  $('exportModelsJson').addEventListener('click',()=>{if(modelRecords.length)download('model-inspector.json',JSON.stringify({format:'ai-creation-workbench-models',version:2,records:modelRecords},null,2),'application/json');});
  $('exportModelsCsv').addEventListener('click',()=>{if(!modelRecords.length)return;const head=['input_url','status','source','error','model_type','model_name','version_name','creator','file_name','trigger_words','recommended_settings','base_model','model_id','version_id','download_url'],rows=[head,...modelRecords.map(r=>head.map(k=>r[k]??''))];download('model-inspector.csv','\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');});
  updateOfflineStatus();

  // Asset Organizer
  let assetRecords=[]; let assetObjectUrls=[];
  function clearAssetUrls(){assetObjectUrls.forEach(URL.revokeObjectURL);assetObjectUrls=[];}
  function buildAssetRecords(files){clearAssetUrls();const useful=[...files].filter(f=>/\.(png|json)$/i.test(f.name)&&!/(^|\/)collect\//i.test((f.webkitRelativePath||f.name).replaceAll('\\','/'))),byStem=new Map();for(const file of useful){const path=(file.webkitRelativePath||file.name).replaceAll('\\','/'),ext=file.name.split('.').pop().toLowerCase(),stem=path.replace(/\.[^.]+$/,'').replace(/^(?:[^/]+\/)?/,'');if(!byStem.has(stem))byStem.set(stem,{stem,png:null,json:null});byStem.get(stem)[ext]=file;}assetRecords=[...byStem.values()].sort((a,b)=>a.stem.localeCompare(b.stem,'ja')).map(r=>({...r,status:r.png&&r.json?'PAIR':'ORPHAN'}));renderAssets();}
  function renderAssets(){const png=assetRecords.filter(r=>r.png).length,json=assetRecords.filter(r=>r.json).length,pairs=assetRecords.filter(r=>r.status==='PAIR').length,orph=assetRecords.length-pairs;$('assetStats').innerHTML=`<div><strong>${png}</strong><span>PNG</span></div><div><strong>${json}</strong><span>JSON</span></div><div><strong>${pairs}</strong><span>Pairs</span></div><div><strong>${orph}</strong><span>Orphans</span></div>`;$('assetSummary').textContent=assetRecords.length?`${assetRecords.length} stems`:'未監査';const box=$('assetResults');box.replaceChildren();box.classList.toggle('empty-state',!assetRecords.length);if(!assetRecords.length){box.textContent='フォルダを選ぶと、同名stemのPNG/JSONペアと孤立ファイルを表示します。';return;}assetRecords.slice(0,200).forEach(r=>{const el=document.createElement('article');el.className='asset-item';let preview='<div class="asset-placeholder">JSON</div>';if(r.png){const u=URL.createObjectURL(r.png);assetObjectUrls.push(u);preview=`<img class="asset-thumb" src="${u}" alt="">`;}el.innerHTML=`${preview}<div><div class="prompt-meta"><span class="chip ${r.status==='PAIR'?'source-chip':''}">${r.status}</span></div><h4>${escapeHtml(r.stem)}</h4><p>${r.png?'PNG ':''}${r.json?'JSON':''}</p></div>`;box.append(el);});}
  $('scanAssetFolder').addEventListener('click',()=> $('assetFolderInput').click());$('assetFolderInput').addEventListener('change',e=>{buildAssetRecords(e.target.files);showToast(`${assetRecords.length} stemを監査しました`);e.target.value='';});
  function assetManifest(){return assetRecords.map(r=>({stem:r.stem,status:r.status,png:r.png?.name||'',json:r.json?.name||'',png_bytes:r.png?.size||0,json_bytes:r.json?.size||0}));}
  $('exportAssetJson').addEventListener('click',()=>{if(assetRecords.length)download('asset-organizer-manifest.json',JSON.stringify({format:'ai-creation-workbench-assets',version:1,created_at:new Date().toISOString(),records:assetManifest()},null,2),'application/json');});
  $('exportAssetCsv').addEventListener('click',()=>{if(!assetRecords.length)return;const head=['stem','status','png','json','png_bytes','json_bytes'],rows=[head,...assetManifest().map(r=>head.map(k=>r[k]))];download('asset-organizer-manifest.csv','\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');});
  async function walkDirectory(handle,prefix='',out=[]){for await(const [name,child] of handle.entries()){const rel=prefix?`${prefix}/${name}`:name;if(name==='collect'&&prefix==='')continue;if(child.kind==='directory')await walkDirectory(child,rel,out);else if(/\.(png|json)$/i.test(name))out.push({handle:child,name,path:rel});}return out;}
  async function uniqueFileHandle(dir,name){const dot=name.lastIndexOf('.'),base=dot>=0?name.slice(0,dot):name,ext=dot>=0?name.slice(dot):'';for(let i=0;;i++){const candidate=i===0?name:`${base}_${i}${ext}`;try{await dir.getFileHandle(candidate,{create:false});}catch{return dir.getFileHandle(candidate,{create:true});}}}
  $('collectAssetFolder').addEventListener('click',async()=>{if(!window.showDirectoryPicker){showToast('このブラウザはFile System Access API非対応です');return;}try{const source=await window.showDirectoryPicker({mode:'readwrite'}),files=await walkDirectory(source),collect=await source.getDirectoryHandle('collect',{create:true});let copied=0;for(const item of files){const src=await item.handle.getFile(),dst=await uniqueFileHandle(collect,item.name),w=await dst.createWritable();await w.write(await src.arrayBuffer());await w.close();copied++;}$('assetSummary').textContent=`collectへ ${copied} files copied` ;showToast(`${copied}ファイルをcollectへ非破壊コピーしました`);}catch(err){if(err?.name!=='AbortError')showToast(err.message||String(err));}});

  // Public release guide / sample workspace
  const DEMO_MODEL_JSON = {
    format: 'ai-creation-workbench-models', version: 2, records: [{
      input_url: 'https://civitai.com/models/900001/acw-demo-model?modelVersionId=900101', status: 'OK', source: 'Offline demo', error: '',
      model_type: 'Checkpoint', model_name: 'ACW Demo Model', version_name: 'v1.0 Demo', creator: 'Local Sample', file_name: 'acw-demo.safetensors',
      trigger_words: 'demo-style, warm-light', recommended_settings: 'Steps 24 · CFG 5.5', base_model: 'Demo Base', model_id: 900001, version_id: 900101, download_url: ''
    }]
  };
  const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgQIAJ6iZ9QAAAABJRU5ErkJggg==';
  function base64Bytes(value) { const raw=atob(value); return Uint8Array.from(raw, c=>c.charCodeAt(0)); }
  async function loadDemoWorkspace() {
    promptDb = structuredClone(DEMO_PROMPT_DB); refreshPromptGroups(); $('promptGroup').value='library'; $('promptCount').value='5'; $('promptSeed').value='20260924'; generatePrompts();
    await importOfflineJson([new File([JSON.stringify(DEMO_MODEL_JSON)], 'acw-demo-model.json', {type:'application/json'})]);
    $('modelUrls').value='https://civitai.com/models/900001/acw-demo-model?modelVersionId=900101'; $('modelFetchMode').value='offline';
    modelRecords=[resolveOffline($('modelUrls').value, parseCivitaiUrl($('modelUrls').value))].filter(Boolean); renderModels();
    const png=new File([base64Bytes(TINY_PNG)], 'study-01.png', {type:'image/png'}), json=new File([JSON.stringify({prompt:'demo',seed:20260924})], 'study-01.json', {type:'application/json'}), orphan=new File([JSON.stringify({note:'orphan sample'})], 'note-only.json', {type:'application/json'});
    Object.defineProperty(png,'webkitRelativePath',{value:'demo/study-01.png'}); Object.defineProperty(json,'webkitRelativePath',{value:'demo/study-01.json'}); Object.defineProperty(orphan,'webkitRelativePath',{value:'demo/note-only.json'}); buildAssetRecords([png,json,orphan]);
    $('workspaceNotes').value='Demo Workspace\n\n・Prompt Lab: seed 20260924\n・Model Inspector: Offline JSON\n・Asset Organizer: 1 pair + 1 orphan'; localStorage.setItem(STORAGE.notes,$('workspaceNotes').value); $('notesStatus').textContent='保存済み';
    activateTab(tabs[0]); showToast('サンプルWorkspaceを読み込みました');
  }
  function dismissOnboarding(withDemo=false){ try{localStorage.setItem(STORAGE.onboarding,'seen');}catch{} setModal('onboardingModal',false); if(withDemo) loadDemoWorkspace(); }
  function openHelp(){ setModal('helpModal',true); setTimeout(()=>$('closeHelp').focus(),30); }
  $('openHelp').addEventListener('click', openHelp); $('closeHelp').addEventListener('click',()=>setModal('helpModal',false));
  $('helpModal').addEventListener('click',e=>{if(e.target===$('helpModal'))setModal('helpModal',false);}); $('loadDemoFromHelp').addEventListener('click',()=>{setModal('helpModal',false);loadDemoWorkspace();});
  $('startBlank').addEventListener('click',()=>dismissOnboarding(false)); $('startDemo').addEventListener('click',()=>dismissOnboarding(true));
  document.addEventListener('keydown',(e)=>{
    const tag=document.activeElement?.tagName?.toLowerCase(), editing=tag==='input'||tag==='textarea'||tag==='select'||document.activeElement?.isContentEditable;
    if(e.key==='Escape'){setModal('notebookModal',false);setModal('helpModal',false);return;}
    if(editing && !(e.ctrlKey||e.metaKey)) return;
    if(!editing && /^[1-5]$/.test(e.key)){e.preventDefault();activateTab(tabs[Number(e.key)-1],true);return;}
    if(!editing && e.key.toLowerCase()==='n'){e.preventDefault();$('openNotebook').click();return;}
    if(!editing && (e.key==='?'||(e.key==='/'&&e.shiftKey))){e.preventDefault();openHelp();return;}
    if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&document.activeElement?.closest?.('#panel-prompt')){e.preventDefault();generatePrompts();}
  });
  try { if (!localStorage.getItem(STORAGE.onboarding)) setTimeout(()=>setModal('onboardingModal',true),120); } catch { setTimeout(()=>setModal('onboardingModal',true),120); }

  // Small public integration surface for future modules and deterministic QA.
  window.ACW = Object.freeze({
    version: APP_VERSION,
    loadDemoWorkspace,
    importPromptDb,
    importOfflineJson,
    buildAssetRecords,
    getPromptDb: () => structuredClone(promptDb),
    getModelRecords: () => structuredClone(modelRecords),
    getAssetManifest: () => assetManifest(),
    getFavorites: () => structuredClone(favorites)
  });

  refreshPromptGroups(); generatePrompts(); renderModels(); renderAssets();
})();
