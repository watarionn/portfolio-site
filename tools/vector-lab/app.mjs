import {DEFAULTS,fromForm,normalize} from "./options.mjs";
const $=id=>document.getElementById(id);
const ids=["vtracer","imagetracer","primitive","geometrize","primeval"];
const state={file:null,image:null,sha:null,worker:null,seq:0,busy:false,results:new Map(),selected:null,loadSeq:0};
let debounce=null;
const MAX_SVG=6_000_000;
function status(text,error=false){
  $("status").textContent=text;
  $("status").classList.toggle("error",error);
  $("status").classList.toggle("loading",!error && /実行中|図形化|読み込み中/.test(text));
}
function shortSize(n){return n>=1048576?(n/1048576).toFixed(2)+"MB":n>=1024?(n/1024).toFixed(1)+"KB":n+"B"}
function revokeResult(result){if(result?.url)URL.revokeObjectURL(result.url);}
function clearResults(){
  for(const r of state.results.values())revokeResult(r);
  state.results.clear();state.selected=null;$("candidates").replaceChildren();
  $("candidate-count").textContent="0件";
  $("jump-result").hidden=true;
  $("result").hidden=true;$("result").removeAttribute("src");$("result-meta").textContent="未生成";
  $("metrics").textContent="変換すると図形数・ファイルサイズ・元画像との差を表示する。";
  for(const k of ["save-svg","save-png","save-json"])$(k).disabled=true;
}
function abortWorker(){if(state.worker){state.worker.terminate();state.worker=null;}state.busy=false;$("run").disabled=!state.image;$("cancel").disabled=true;}
async function imageFromFile(file){
  if(!file)return;
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size<1||file.size>20*1024*1024)
    throw new Error("PNG・JPEG・WebPの20MB以内の画像を選んでね");
  const ticket=++state.loadSeq;
  clearTimeout(debounce);
  abortWorker();
  status("画像を読み込み中");
  const url=URL.createObjectURL(file);
  try {
    const pic=new Image();
    await new Promise((ok,no)=>{pic.onload=ok;pic.onerror=()=>no(Error("画像が読み込めません"));pic.src=url;});
    if(ticket!==state.loadSeq)return;
    if(!pic.naturalWidth||!pic.naturalHeight||pic.naturalWidth>8192||pic.naturalHeight>8192)
      throw new Error("画像の縦横は8192px以下にしてね");
    const size=Number($("resolution").value);
    const ratio=Math.min(1,size/Math.max(pic.naturalWidth,pic.naturalHeight));
    const w=Math.max(1,Math.round(pic.naturalWidth*ratio)),h=Math.max(1,Math.round(pic.naturalHeight*ratio));
    const canvas=$("source");canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d",{willReadFrequently:true});ctx.clearRect(0,0,w,h);ctx.drawImage(pic,0,0,w,h);
    const pixels=ctx.getImageData(0,0,w,h);
    const shaBuffer=await crypto.subtle.digest("SHA-256",pixels.data);
    if(ticket!==state.loadSeq)return;
    const hash=[...new Uint8Array(shaBuffer)].map(x=>x.toString(16).padStart(2,"0")).join("");
    state.file=file;state.image=pixels;state.sha=hash;
    clearResults();
    $("source-meta").textContent=file.name+" / "+pic.naturalWidth+"×"+pic.naturalHeight+" → "+w+"×"+h+
      " / "+shortSize(file.size)+" / RGBA SHA256 "+hash.slice(0,12)+"…";
    $("run").disabled=false;status("画像の準備ができたよ。");
    if($("auto").checked)schedule();
  }finally{URL.revokeObjectURL(url);}
}
function displayFields(){
  const engine=$("engine").value,clustering=$("clustering").value;
  for(const card of document.querySelectorAll("[data-engine]")){
    card.setAttribute("aria-pressed",String(card.dataset.engine===engine));
  }
  $("vtracer-panel").hidden=engine!=="vtracer";
  $("imagetracer-panel").hidden=engine!=="imagetracer";
  const geometric=["primitive","geometrize","primeval"].includes(engine);
  $("approx-panel").hidden=!geometric;
  const max=engine==="primitive"?100:engine==="geometrize"?500:600;
  $("approx-count").max=String(max);
  if(Number($("approx-count").value)>max)$("approx-count").value=String(max);
  const polygon=$("approx-shape").querySelector('option[value="polygon"]');
  polygon.disabled=engine==="geometrize";
  if(polygon.disabled && $("approx-shape").value==="polygon")$("approx-shape").value="any";
  $("approx-count-value").textContent=$("approx-count").value;
  for(const el of document.querySelectorAll('[data-for="watershed"]'))el.hidden=clustering!=="watershed";
  for(const el of document.querySelectorAll('[data-for="color"]'))el.hidden=clustering==="bw";
  for(const el of document.querySelectorAll('[data-for="bw"]'))el.hidden=clustering!=="bw";
  for(const el of document.querySelectorAll('[data-for="threshold"]'))el.hidden=$("adaptive").checked;
  for(const el of document.querySelectorAll('[data-for="adaptive"]'))el.hidden=!$("adaptive").checked;
  for(const el of document.querySelectorAll('[data-for="spline"]'))el.hidden=$("mode").value!=="spline";
  for(const input of document.querySelectorAll('input[type="range"]')){
    const out=document.querySelector('[data-output="'+input.id+'"]');
    if(out)out.textContent=input.id==="maxColors"&&input.value==="0"?"無制限":
      input.id==="adaptiveWindow"&&input.value==="0"?"自動":
      input.id==="simplify"&&input.value==="0"?"0（無効）":input.value;
  }
  $("imagetracer-count").textContent=$("imagetracer-colors").value;
}
function schedule(){
  clearTimeout(debounce);
  if(!state.image||!$("auto").checked)return;
  debounce=setTimeout(()=>run().catch(e=>status(e.message,true)),350);
}
function parseSVG(svg){
  if(typeof svg!=="string"||svg.length<25||new Blob([svg]).size>MAX_SVG)
    throw new Error("SVGが長すぎるか、内容が不正です");
  if(/<!DOCTYPE|<!ENTITY|<\s*(?:script|style|foreignObject|iframe|image|video|audio|object|embed|filter|animate|set|use|feImage)\b|@import|javascript\s*:|url\s*\(/i.test(svg))
    throw new Error("実行可能な要素・外部参照を含むSVGは読み込めないよ");
  const doc=new DOMParser().parseFromString(svg,"image/svg+xml");
  if(doc.querySelector("parsererror")||doc.documentElement.localName!=="svg"||doc.documentElement.namespaceURI!=="http://www.w3.org/2000/svg")
    throw new Error("SVGの形式が正しくないよ");
  const tags=new Set(["svg","g","path","rect","polygon","polyline","circle","ellipse","line","defs","clipPath","linearGradient","radialGradient","stop","title","desc"]);
  for(const el of doc.getElementsByTagName("*")){
    if(!tags.has(el.localName)||el.namespaceURI!=="http://www.w3.org/2000/svg")throw new Error("SVGの未対応要素: "+el.localName);
    for(const a of el.attributes){
      const k=a.name.toLowerCase();
      if(k.startsWith("on")||k==="style"||k.includes("href")||k==="src"||/url\s*\(|javascript\s*:|@import/i.test(a.value))
        throw new Error("SVGに危険な属性が含まれています");
    }
  }
  return svg;
}
async function loadSVGImage(url){
  const img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("SVGの表示に失敗"));img.src=url;});
  return img;
}
function shapeCount(svg){return(svg.match(/<(?:path|rect|polygon|polyline|circle|ellipse|line)\b/g)||[]).length;}
async function metricsOf(svg,url){
  const img=await loadSVGImage(url),s=state.image;
  const c=document.createElement("canvas");c.width=s.width;c.height=s.height;
  const ctx=c.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(img,0,0,s.width,s.height);
  const out=ctx.getImageData(0,0,s.width,s.height).data;
  let changed=0,alphaChanged=0,total=0;
  for(let i=0;i<out.length;i+=4){
    let diff=false;
    for(let k=0;k<4;k++){const d=Math.abs(out[i+k]-s.data[i+k]);total+=d;if(d>0)diff=true;}
    if(diff)changed++;
    if(out[i+3]!==s.data[i+3])alphaChanged++;
  }
  return {shapes:shapeCount(svg),bytes:new Blob([svg]).size,meanAbsRgba:Number((total/out.length).toFixed(3)),changedPixels:changed,alphaChangedPixels:alphaChanged,totalPixels:s.width*s.height};
}
function renderCandidates(){
  const grid=$("candidates");grid.replaceChildren();
  $("candidate-count").textContent=state.results.size+"件";
  for(const id of ids){
    const r=state.results.get(id);if(!r)continue;
    const box=document.createElement("div");box.className="candidate";
    box.classList.toggle("is-selected",state.selected===id);
    const image=document.createElement("img");image.src=r.url;image.alt=id+"の出力";
    const name=document.createElement("strong");name.textContent=r.name;
    const note=document.createElement("small");note.textContent=r.metrics.shapes+" 図形 / "+shortSize(r.metrics.bytes);
    const button=document.createElement("button");button.type="button";button.textContent="表示する";
    button.addEventListener("click",()=>selectCandidate(id));
    box.append(image,name,note,button);grid.append(box);
  }
}
function selectCandidate(id){
  const r=state.results.get(id);if(!r)return;
  state.selected=id;
  $("jump-result").hidden=false;
  for(const card of $("candidates").querySelectorAll(".candidate")){
    const index=[...card.parentElement.children].indexOf(card);
    const candidateId=ids.filter(key=>state.results.has(key))[index];
    card.classList.toggle("is-selected",candidateId===id);
  }
  const img=$("result");img.src=r.url;img.hidden=false;
  $("result-meta").textContent=r.name+" / "+shortSize(r.metrics.bytes);
  const m=r.metrics;
  $("metrics").textContent="図形 "+m.shapes+" / RGBA平均差 "+m.meanAbsRgba+
    " / 相違画素 "+m.changedPixels+"/"+m.totalPixels+
    " / 透明度差 "+m.alphaChangedPixels+"px （見た目・意味の正確性とは別の参考値）";
  for(const k of ["save-svg","save-png","save-json"])$(k).disabled=false;
  updateCompare();
}
async function register(id,svg,settings,origin){
  const version=state.sha,clean=parseSVG(svg);
  const url=URL.createObjectURL(new Blob([clean],{type:"image/svg+xml"}));
  let m;
  try{m=await metricsOf(clean,url);}catch(e){URL.revokeObjectURL(url);throw e;}
  if(state.sha!==version){URL.revokeObjectURL(url);return;}
  revokeResult(state.results.get(id));
  const names={vtracer:"VTracer 1.0",imagetracer:"ImageTracerJS",primitive:"Primitive",geometrize:"Geometrize",primeval:"Primeval"};
  state.results.set(id,{name:names[id],svg:clean,url,settings,origin,metrics:m,sha:version});
  renderCandidates();selectCandidate(id);
}
async function run(){
  if(!state.image)return;
  clearTimeout(debounce);
  const engine=$("engine").value;
  const settings=engine==="vtracer" ? fromForm($("settings")):
    engine==="imagetracer" ? {numberOfColors:Number($("imagetracer-colors").value)}:
    {count:Number($("approx-count").value),shape:$("approx-shape").value};
  const approximation=["primitive","geometrize","primeval"].includes(engine);
  const seq=++state.seq;
  abortWorker();
  state.busy=true;$("run").disabled=true;$("cancel").disabled=false;
  const names={vtracer:"VTracer 1.0",imagetracer:"ImageTracerJS",
    primitive:"Primitive",geometrize:"Geometrize",primeval:"Primeval"};
  status(names[engine]+"を実行中（図形生成は端末内のみ）");
  const w=new Worker("./worker.mjs",{type:"module"});state.worker=w;
  const copy=new Uint8ClampedArray(state.image.data),width=state.image.width,height=state.image.height;
  const start=performance.now();
  w.onmessage=async e=>{
    const d=e.data||{};if(seq!==state.seq||w!==state.worker)return;
    if(d.progress){status(d.progress);return;}
    if(d.error){status(d.error,true);abortWorker();return;}
    try{
      await register(engine,d.svg,settings,"local");
      if(seq!==state.seq)return;
      status("SVGを生成したよ（"+((performance.now()-start)/1000).toFixed(2)+"秒）");
    }catch(err){status(err.message,true);}
    finally{if(w===state.worker)abortWorker();}
  };
  w.onerror=e=>{if(w===state.worker){status("変換ワーカーで問題が発生: "+e.message,true);abortWorker();}};
  let png=null;
  if(approximation && engine!=="geometrize") {
    try {
      const canvas=$("source");
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
      if(!blob)throw new Error("PNG入力の準備に失敗");
      png=new Uint8Array(await blob.arrayBuffer());
    }catch(err){if(state.worker===w){status(err.message,true);abortWorker();}return;}
  }
  if(state.worker!==w || seq!==state.seq)return;
  const payload={job:seq,engine,rgba:copy,png,width,height,settings,
    colors:settings.numberOfColors,count:settings.count,shape:settings.shape};
  const transfers=[copy.buffer];if(png)transfers.push(png.buffer);
  w.postMessage(payload,transfers);
}
let previewMode="compare";
function setPreviewMode(mode){
  if(!["source","compare","result"].includes(mode))return;
  previewMode=mode;
  for(const button of document.querySelectorAll("[data-view]")){
    button.setAttribute("aria-pressed",String(button.dataset.view===mode));
  }
  $("compare-tools").hidden=mode!=="compare";
  updateCompare();
}
function updateCompare(){
  const value=Number($("compare").value);
  $("compare-value").textContent=value+"%";
  const visible=previewMode==="source"?0:previewMode==="result"?100:value;
  $("result").style.clipPath="inset(0 "+(100-visible)+"% 0 0)";
}
function download(blob,filename){
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
}
async function exportPNG(r){
  const image=await loadSVGImage(r.url),canvas=document.createElement("canvas");
  canvas.width=state.image.width;canvas.height=state.image.height;
  canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
  if(!blob)throw Error("PNGを生成できません");
  download(blob,"vector-lab-"+state.selected+".png");
}
$("file").addEventListener("change",e=>imageFromFile(e.target.files?.[0]).catch(err=>status(err.message,true)));
const drop=$("drop");
for(const name of ["dragenter","dragover"])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.add("dragging");});
for(const name of ["dragleave","drop"])drop.addEventListener(name,e=>{e.preventDefault();drop.classList.remove("dragging");});
drop.addEventListener("drop",e=>imageFromFile(e.dataTransfer.files?.[0]).catch(err=>status(err.message,true)));
$("resolution").addEventListener("change",()=>{if(state.file)imageFromFile(state.file).catch(e=>status(e.message,true))});
$("settings").addEventListener("submit",e=>e.preventDefault());
$("settings").addEventListener("input",e=>{
  displayFields();
  // Text entry is debounced, but iPhone sliders do not restart heavy WASM
  // while the user is still dragging the knob.
  if(e.target.id==="palette")schedule();
});
$("settings").addEventListener("change",e=>{
  displayFields();
  if(e.target.closest("#vtracer-panel, #imagetracer-panel, #approx-panel") || e.target.id==="engine")schedule();
});
$("engine").addEventListener("change",()=>{displayFields();schedule()});
$("run").addEventListener("click",()=>run().catch(e=>status(e.message,true)));
$("cancel").addEventListener("click",()=>{
  clearTimeout(debounce);state.seq++;abortWorker();status("変換を停止したよ");
});
for(const button of document.querySelectorAll("[data-engine]")){
  button.addEventListener("click",()=>{
    if($("engine").value===button.dataset.engine)return;
    $("engine").value=button.dataset.engine;
    displayFields();
    schedule();
  });
}
$("jump-result").addEventListener("click",()=>
  $("output-title").scrollIntoView({behavior:"smooth",block:"start"})
);
for(const button of document.querySelectorAll("[data-view]")){
  button.addEventListener("click",()=>setPreviewMode(button.dataset.view));
}
$("auto").addEventListener("change",()=>{if($("auto").checked)schedule();else clearTimeout(debounce)});
$("compare").addEventListener("input",updateCompare);
$("reset").addEventListener("click",()=>{
  const form=$("settings");form.reset();
  $("clustering").value=DEFAULTS.clustering;$("hierarchical").value=DEFAULTS.hierarchical;
  $("mode").value=DEFAULTS.mode;$("engine").value="vtracer";$("palette").value="";
  displayFields();schedule();
});
$("save-svg").addEventListener("click",()=>{
  const r=state.results.get(state.selected);if(r)download(new Blob([r.svg],{type:"image/svg+xml"}),"vector-lab-"+state.selected+".svg");
});
$("save-png").addEventListener("click",()=>{
  const r=state.results.get(state.selected);if(r)exportPNG(r).catch(e=>status(e.message,true));
});
$("save-json").addEventListener("click",()=>{
  if(!state.image||!state.selected)return;
  const data={schema:"vector-lab-report/v1",vtracerVersion:"1.0.0-alpha.4",referenceRgbaSha256:state.sha,
    width:state.image.width,height:state.image.height,selected:state.selected,
    candidates:Object.fromEntries([...state.results].map(([id,r])=>
      [id,{engine:r.name,origin:r.origin,settings:r.settings,metrics:r.metrics}]))};
  download(new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"}),"vector-lab-report.json");
});
for(const input of document.querySelectorAll("[data-import]"))input.addEventListener("change",async()=>{
  const file=input.files?.[0];
  try{
    if(!state.image)throw Error("まず元画像を選んでね");
    if(!file||file.size<25||file.size>MAX_SVG)throw Error("SVGファイルは6MB以内にしてね");
    await register(input.dataset.import,await file.text(),null,"external-import-unverified-source");
    status("SVG候補を取り込んだよ。元画像が同じか確認してね。");
  }catch(e){status(e.message,true);}
  finally{input.value="";}
});
window.addEventListener("pagehide",()=>{clearTimeout(debounce);abortWorker();for(const r of state.results.values())revokeResult(r);});
if("serviceWorker" in navigator&&location.protocol==="https:"){
  addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{scope:"./",updateViaCache:"none"}).catch(()=>{}));
}
displayFields();setPreviewMode("compare");
