/* Prompt Studio 2.0: standalone screens + browser-local working data. */
(() => {
  'use strict';
  const C=window.PromptStudioNext, KEY='prompt-studio-2.0-dictionary-v1';
  const $=id=>document.getElementById(id);
  let state, corrupt=false, unsaved=false, pendingName=null, pendingRecord=null, pickerAction=null;
  try {
    const raw=localStorage.getItem(KEY);
    state=raw===null ? C.starterState() : C.validateState(JSON.parse(raw));
  } catch(err) {
    corrupt=true; state=C.starterState();
  }
  const alertText=text=>$('status').textContent=text;
  function commit(modify, replaceCorrupt=false) {
    if(corrupt&&!replaceCorrupt) {alertText('保存データを保護中。正常なバックアップの読み込みでのみ置き換えできるよ');return false;}
    const next=C.clone(state);
    try {
      modify(next);
      const validated=C.validateState(next);
      const raw=JSON.stringify(validated);
      localStorage.setItem(KEY,raw);
      if(localStorage.getItem(KEY)!==raw) throw Error('保存後の読み戻しに失敗したよ');
      state=validated;corrupt=false;
      return true;
    } catch(err) {alertText('保存できなかったよ。前のデータを維持したよ: '+err.message);return false;}
  }
  if(corrupt) alertText('保存データが読み込めないため、元のデータを保護しているよ。上書きせずバックアップを確認してね');
  const makeOption=(label,value)=>{const el=document.createElement('option');el.value=value;el.textContent=label;return el;};
  const fill=(select,items,selected,placeholder=null)=>{
    select.replaceChildren();
    if(placeholder!==null)select.append(makeOption(placeholder,''));
    for(const item of items)select.append(makeOption(item.name,item.id));
    const has=items.some(x=>x.id===selected);
    select.value=has?selected:(placeholder!==null?'':items[0]?.id||'');
    select.disabled=items.length===0;
    return select.value;
  };
  const resolve=(list,id)=>list.find(x=>x.id===id);
  let mainCategory='',mainValue='',picks={},dictTab='parts',editSel={category:'',value:'',option:'',choice:''};
  function renderPartPicker(){
    mainCategory=fill($('partCategory'),state.parts,mainCategory);
    const part=resolve(state.parts,mainCategory);
    mainValue=fill($('partValue'),part?.values||[],mainValue);
    const value=resolve(part?.values||[],mainValue);
    $('partOptions').replaceChildren();
    for(const option of value?.options||[]){
      const label=document.createElement('label');
      label.textContent=option.name;
      const sel=document.createElement('select');
      sel.dataset.optionId=option.id;
      sel.setAttribute('aria-label',option.name);
      fill(sel,option.choices,picks[option.id],'指定なし');
      sel.onchange=()=>{picks[option.id]=sel.value;};
      label.append(sel);$('partOptions').append(label);
    }
    $('reflect').disabled=!value;
  }
  $('partCategory').onchange=()=>{mainCategory=$('partCategory').value;mainValue='';picks={};renderPartPicker();};
  $('partValue').onchange=()=>{mainValue=$('partValue').value;picks={};renderPartPicker();};
  $('clearPart').onclick=()=>{mainValue='';picks={};renderPartPicker();alertText('パーツの選択をクリアしたよ');};
  function ensureDraft(){
    const current=$('promptText').value;
    if(current===state.draft.text && !unsaved) return true;
    const next=C.editText(state.draft,current);
    if(!commit(s=>{s.draft=next;})){unsaved=true;return false;}
    unsaved=false;
    return true;
  }
  const editor=$('promptText');
  editor.oninput=()=>{
    const next=C.editText(state.draft,editor.value);
    if(!commit(s=>{s.draft=next;})){unsaved=true;return;}
    unsaved=false;
    $('editNote').textContent=next.marks.length+'か所のパーツを追跡中。手編集したパーツは普通の文章になる。';
  };
  function setDraft(next,message){
    if(!ensureDraft())return false;
    if(!commit(s=>{s.draft=next;}))return false;
    editor.value=state.draft.text;unsaved=false;
    if(message)alertText(message);
    return true;
  }
  $('reflect').onclick=()=>{
    if(!ensureDraft())return;
    const part=resolve(state.parts,mainCategory),value=resolve(part?.values||[],mainValue);
    if(!part||!value)return alertText('反映する項目を選んでね');
    const next=C.reflect(state.draft,part,value,picks);
    setDraft(next,'「'+part.name+'」を反映したよ');
  };
  $('clearPrompt').onclick=()=>{
    if(!ensureDraft())return;
    if(editor.value&&!confirm('編集中のプロンプトをクリアする？ 保存済みの文章や辞書は消えないよ'))return;
    setDraft({text:'',marks:[]},'編集欄をクリアしたよ');
  };
  $('copyPrompt').onclick=async()=>{
    if(!ensureDraft())return;
    const copied=state.draft.text;
    try {
      await navigator.clipboard.writeText(copied);
      if(commit(s=>{s.recentCopies=C.addCopy(s.recentCopies,copied,new Date().toISOString());}))
        alertText('コピーして履歴に追加したよ');
      else alertText('コピーはできたけれど履歴を保存できなかったよ');
    }catch{alertText('コピーに失敗したよ。ブラウザの権限を確認してね');}
  };
  function showPicker(title,items,onPick){
    $('pickerTitle').textContent=title;
    const host=$('pickerList');host.replaceChildren();
    if(items.length===0){const p=document.createElement('p');p.textContent='まだ登録されていないよ';host.append(p);}
    for(const item of items){
      const btn=document.createElement('button');btn.type='button';
      const label=document.createElement('strong');label.textContent=item.label;
      const text=document.createElement('small');text.textContent=item.detail||'';
      btn.append(label,text);btn.onclick=()=>{$('pickerDialog').close();onPick(item);};
      host.append(btn);
    }
    $('pickerDialog').showModal();
  }
  const loadContent=(content,name)=>{
    if(!ensureDraft())return;
    if(editor.value&&!confirm('編集中の文章を「'+name+'」で置き換える？'))return;
    setDraft({text:content,marks:[]},'「'+name+'」を読み込んだよ');
  };
  $('pickTemplate').onclick=()=>showPicker('テンプレート',state.templates.map(x=>({label:x.name,detail:x.content,content:x.content})),x=>loadContent(x.content,x.label));
  $('pickHistory').onclick=()=>{
    const recent=state.recentCopies.map((x,i)=>({label:'コピー履歴 '+(i+1),detail:x.text,content:x.text}));
    const saved=state.prompts.map(x=>({label:'保存済み：'+x.name,detail:x.content,content:x.content}));
    showPicker('履歴・保存済みプロンプト',[...recent,...saved],x=>loadContent(x.content,x.label));
  };
  $('savePrompt').onclick=()=>{if(ensureDraft())$('saveDialog').showModal();};
  $('saveAsTemplate').onclick=()=>{$('saveDialog').close();openRecordEditor('template',null,C.toTemplate(state.draft));};
  $('saveAsPrompt').onclick=()=>{$('saveDialog').close();openRecordEditor('prompt',null,state.draft.text);};
  document.querySelectorAll('[data-close]').forEach(btn=>btn.onclick=()=>$(btn.dataset.close).close());
  function showScreen(id){
    $('mainScreen').hidden=id!=='main';$('dictionaryScreen').hidden=id!=='dictionary';
    $('showMain').classList.toggle('active',id==='main');
    $('showDictionary').classList.toggle('active',id==='dictionary');
    $('showMain').setAttribute('aria-current',id==='main'?'page':'false');
    $('showDictionary').setAttribute('aria-current',id==='dictionary'?'page':'false');
    if(id==='dictionary')renderDictionary();
    else {renderPartPicker();editor.value=state.draft.text;}
  }
  $('showMain').onclick=()=>{if(ensureDraft())showScreen('main');};
  $('showDictionary').onclick=()=>{if(ensureDraft())showScreen('dictionary');};
  const entityInfo=()=>{
    const category=resolve(state.parts,editSel.category);
    const value=resolve(category?.values||[],editSel.value);
    const option=resolve(value?.options||[],editSel.option);
    return {category,value,option};
  };
  function renderDictionary(){
    document.querySelectorAll('[data-dict]').forEach(b=>b.classList.toggle('active',b.dataset.dict===dictTab));
    $('editParts').hidden=dictTab!=='parts';
    $('editTemplates').hidden=dictTab!=='templates';
    $('editPrompts').hidden=dictTab!=='prompts';
    editSel.category=fill($('editCategory'),state.parts,editSel.category);
    const {category}=entityInfo();
    editSel.value=fill($('editValue'),category?.values||[],editSel.value);
    const {value}=entityInfo();
    editSel.option=fill($('editOption'),value?.options||[],editSel.option);
    const {option}=entityInfo();
    editSel.choice=fill($('editChoice'),option?.choices||[],editSel.choice);
    fill($('templateList'),state.templates,$('templateList').value);
    fill($('promptList'),state.prompts,$('promptList').value);
    for(const b of document.querySelectorAll('[data-entity]')){
      const e=b.dataset.entity;
      b.disabled=e==='value'&&!category||e==='option'&&!value||e==='choice'&&!option||
      b.dataset.op!=='add'&&!((e==='category'&&category)||(e==='value'&&value)||(e==='option'&&option)||(e==='choice'&&resolve(option?.choices||[],editSel.choice)));
    }
    for(const b of document.querySelectorAll('[data-record]')){
      const list=b.dataset.record==='template'?state.templates:state.prompts;
      b.disabled=b.dataset.op!=='add'&&!list.length;
    }
  }
  $('editCategory').onchange=()=>{editSel.category=$('editCategory').value;editSel.value=editSel.option=editSel.choice='';renderDictionary();};
  $('editValue').onchange=()=>{editSel.value=$('editValue').value;editSel.option=editSel.choice='';renderDictionary();};
  $('editOption').onchange=()=>{editSel.option=$('editOption').value;editSel.choice='';renderDictionary();};
  $('editChoice').onchange=()=>{editSel.choice=$('editChoice').value;renderDictionary();};
  document.querySelectorAll('[data-dict]').forEach(b=>b.onclick=()=>{dictTab=b.dataset.dict;renderDictionary();});
  function editName(title,current,onDone){
    $('nameTitle').textContent=title;
    $('nameInput').value=current||'';
    pendingName=onDone;
    $('nameDialog').showModal();
    $('nameInput').focus();
  }
  $('nameDialog').onclose=()=>{
    if($('nameDialog').returnValue!=='submit'||!pendingName){pendingName=null;return;}
    const action=pendingName;pendingName=null;
    const name=$('nameInput').value.trim();
    if(!name)return alertText('名前を入力してね');
    action(name);
  };
  function entityList(s,entity){
    if(entity==='category')return s.parts;
    const cat=resolve(s.parts,editSel.category);
    if(entity==='value')return cat?.values;
    const value=resolve(cat?.values||[],editSel.value);
    if(entity==='option')return value?.options;
    const option=resolve(value?.options||[],editSel.option);
    return option?.choices;
  }
  const labels={category:'属性',value:'値',option:'オプション',choice:'候補'};
  document.querySelectorAll('[data-entity]').forEach(btn=>btn.onclick=()=>{
    const entity=btn.dataset.entity,op=btn.dataset.op,items=entityList(state,entity),id=editSel[entity];
    if(!items)return alertText('親の項目を先に選んでね');
    const target=resolve(items,id),name=labels[entity];
    if(op==='delete'){
      if(!target||!confirm('「'+target.name+'」を削除する？ 辞書からの削除は元に戻せないよ'))return;
      if(commit(s=>{const list=entityList(s,entity);list.splice(list.findIndex(x=>x.id===id),1);})){
        editSel[entity]='';renderDictionary();renderPartPicker();alertText(name+'を削除したよ');
      }return;
    }
    editName(name+(op==='add'?'を追加':'を編集'),target?.name||'',newName=>{
      if(op==='add'){
        const newItem={id:C.newId(entity),name:newName};
        if(entity==='category')newItem.values=[];
        if(entity==='value')newItem.options=[];
        if(entity==='option')newItem.choices=[];
        if(commit(s=>{entityList(s,entity).push(newItem);})){
          editSel[entity]=newItem.id;
          renderDictionary();renderPartPicker();alertText(name+'を追加したよ');
        }
      }else if(target&&commit(s=>{resolve(entityList(s,entity),id).name=newName;})){
        renderDictionary();renderPartPicker();alertText(name+'を更新したよ');
      }
    });
  });
  function openRecordEditor(kind,existing=null,initial=''){
    const title=kind==='template'?'テンプレート':'プロンプト';
    $('recordTitle').textContent=title+(existing?'を編集':'として保存');
    $('recordName').value=existing?.name||'';
    $('recordContent').value=existing?.content??initial;
    pendingRecord={kind,id:existing?.id||null};
    $('recordDialog').showModal();$('recordName').focus();
  }
  $('recordDialog').onclose=()=>{
    if($('recordDialog').returnValue!=='submit'||!pendingRecord){pendingRecord=null;return;}
    const {kind,id}=pendingRecord;pendingRecord=null;
    const name=$('recordName').value.trim(),content=$('recordContent').value;
    if(!name)return alertText('名前を入力してね');
    const field=kind==='template'?'templates':'prompts',recordId=id||C.newId(kind);
    if(commit(s=>{
      const list=s[field],found=id?resolve(list,id):null;
      if(found){found.name=name;found.content=content;}
      else list.push({id:recordId,name,content});
    })){dictTab=field;renderDictionary();$(kind==='template'?'templateList':'promptList').value=recordId;alertText('「'+name+'」を保存したよ');}
  };
  document.querySelectorAll('[data-record]').forEach(btn=>btn.onclick=()=>{
    const kind=btn.dataset.record,op=btn.dataset.op,field=kind==='template'?'templates':'prompts';
    const id=$(kind==='template'?'templateList':'promptList').value,record=resolve(state[field],id);
    if(op==='add')return openRecordEditor(kind,null,'');
    if(!record)return alertText('項目を選んでね');
    if(op==='edit')return openRecordEditor(kind,record);
    if(op==='delete'&&confirm('「'+record.name+'」を削除する？')){
      if(commit(s=>{s[field]=s[field].filter(x=>x.id!==id);})){renderDictionary();alertText('削除したよ');}
    }
  });
  function download(name,text){
    const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('backupExport').onclick=()=>{
    if(corrupt)return alertText('保存データの読み込みに失敗しているため、空のデータは書き出さないよ');
    if(!ensureDraft())return;
    download('prompt-studio-2.0-backup.json',C.backup(state));alertText('2.0専用データを書き出したよ');
  };
  $('backupImport').onchange=async event=>{
    const file=event.target.files[0];event.target.value='';
    if(!file)return;
    if(file.size>10*1024*1024)return alertText('10MB以下のJSONファイルを選んでね');
    if(!corrupt&&!ensureDraft())return;
    try {
      const restored=C.restore(JSON.parse(await file.text()));
      if(!confirm('今の2.0辞書・履歴・作業内容を読み込んだデータで置き換える？'))return;
      if(!commit(s=>{Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,restored);},true))return;
      unsaved=false;editor.value=state.draft.text;picks={};mainCategory=mainValue='';
      editSel={category:'',value:'',option:'',choice:''};
      renderPartPicker();renderDictionary();alertText('2.0データを読み込んだよ');
    }catch(err){alertText('読み込み失敗: '+err.message);}
  };
  window.addEventListener('beforeunload',event=>{if(unsaved){event.preventDefault();event.returnValue='';}});
  editor.value=state.draft.text;renderPartPicker();
})();
