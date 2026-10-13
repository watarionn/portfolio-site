import {CAPABILITY_GROUPS,CAPABILITY_COUNT} from './catalog.js';
import {executeCapability} from './runner.js';
const $=id=>document.getElementById(id);
export function createCapabilityLab({source}){
 const lib=$('capLibrary'),item=$('capCapability'),run=$('capRun'),all=$('capRunAll');
 const status=$('capStatus'),results=$('capHistory'),canvas=$('capCanvas'),svg=$('capSvg');
 const json=$('capJson'),exportButton=$('capExport');
 const ledger=new Map();let busy=false,blobUrl=null;
 const key=(g,c)=>g+'/'+c;
 function resetPreview(){
  canvas.hidden=true;svg.hidden=true;json.hidden=true;
  canvas.width=1;canvas.height=1;svg.removeAttribute('src');
  if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null;}
  json.textContent='';
 }
 function showResult(result){
  resetPreview();
  if(result.kind==='canvas'&&result.canvas){
   canvas.width=result.canvas.width;canvas.height=result.canvas.height;
   canvas.getContext('2d').drawImage(result.canvas,0,0);canvas.hidden=false;
  }else if(result.kind==='svg'&&result.svg){
   blobUrl=URL.createObjectURL(new Blob([result.svg],{type:'image/svg+xml'}));
   svg.src=blobUrl;svg.hidden=false;
  }else if(result.kind==='json'){
   json.textContent=JSON.stringify(result.data,null,2);json.hidden=false;
  }
 }
 function group(){return CAPABILITY_GROUPS.find(g=>g.id===lib.value);}
 function refreshHistory(){
  const current=group();results.replaceChildren();
  if(!current)return;
  for(const feature of current.items){
   const r=ledger.get(key(current.id,feature.id));
   const row=document.createElement('div');row.className='cap-history-row';
   row.textContent=feature.label+' · '+(r?r.state==='pass'?'PASS '+r.ms+'ms':r.state==='fail'?'FAIL: '+r.error:'SKIP':'未実行');
   results.append(row);
  }
  exportButton.disabled=ledger.size===0;
 }
 function refreshSelection(){
  const current=group(),feature=current?.items.find(c=>c.id===item.value);
  run.disabled=busy||!feature||feature.status!=='available';
  all.disabled=busy||!current?.items.some(x=>x.status==='available');
  const prev=feature&&ledger.get(key(current.id,feature.id));
  status.textContent=busy?'実行中…':feature?.status==='blocked'?'ライセンス上保留':
    feature?.status==='unsupported'?'この環境では非対応':prev?.state==='pass'?'直近の試験：PASS':
    prev?.state==='fail'?'直近の試験：FAIL':'実行すると結果と経過時間を記録します';
 }
 function refreshCapabilities(){
  const current=group();item.replaceChildren();
  for(const feature of current?.items||[]){
   const option=document.createElement('option');option.value=feature.id;
   option.textContent=feature.label+(feature.status==='available'?'':' ['+feature.status+']');
   item.append(option);
  }
  refreshHistory();refreshSelection();resetPreview();
 }
 for(const group of CAPABILITY_GROUPS){
  const option=document.createElement('option');option.value=group.id;
  option.textContent=group.name+' ('+group.items.length+')';lib.append(option);
 }
 $('capTotal').textContent=CAPABILITY_GROUPS.length+'ライブラリ / '+CAPABILITY_COUNT+'機能候補';
 async function runOne(library,capability){
  const started=performance.now(),name=key(library,capability);
  try{
   const result=await executeCapability(library,capability,source);
   if(result.kind==='skip'){
    const info={state:'skip',error:result.message,ms:Math.round(performance.now()-started)};
    ledger.set(name,info);return info;
   }
   if(!['canvas','json','svg'].includes(result.kind))throw Error('結果形式が不正です');
   const info={state:'pass',ms:Math.round(performance.now()-started),message:result.message,
     kind:result.kind,stats:result.stats??null};
   ledger.set(name,info);
   showResult(result);return info;
  }catch(e){
   const info={state:'fail',ms:Math.round(performance.now()-started),
    error:e instanceof Error?e.message:String(e)};
   ledger.set(name,info);return info;
  }finally{
   refreshHistory();
  }
 }
 async function execute(many){
  if(busy)return;const g=group();if(!g)return;
  const list=many?g.items.filter(x=>x.status==='available'):[g.items.find(x=>x.id===item.value)];
  if(!list[0])return;
  busy=true;refreshSelection();
  let passed=0,failed=0;
  try{
   for(let i=0;i<list.length;i++){
    const feature=list[i];status.textContent=g.name+' '+(i+1)+'/'+list.length+' · '+feature.label;
    await new Promise(resolve=>setTimeout(resolve,0));
    const result=await runOne(g.id,feature.id);
    if(result.state==='pass')passed++;else if(result.state==='fail')failed++;
   }
   status.textContent=g.name+'：'+passed+' PASS / '+failed+' FAIL。結果は端末内で記録中。';
  }finally{busy=false;refreshSelection();}
 }
 lib.addEventListener('change',refreshCapabilities);
 item.addEventListener('change',()=>{refreshSelection();resetPreview();});
 run.addEventListener('click',()=>execute(false));
 all.addEventListener('click',()=>execute(true));
 exportButton.addEventListener('click',()=>{
  const records=Array.from(ledger,([id,result])=>({id,...result}));
  const blob=new Blob([JSON.stringify({version:'0.9.1',generatedAt:new Date().toISOString(),records},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='image-lab-capability-results.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 });
 refreshCapabilities();
 return {results:ledger};
}
