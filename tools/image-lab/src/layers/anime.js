/**
 * siyeong0/Anime-Face-Segmentation, MIT (2025 siyeong).
 * Browser ONNX conversion of the original 7-class MobileNetV2 U-Net.
 * Input preprocessing: 512x512 RGB ToTensor() [0,1], no ImageNet normalization.
 * Label order comes from upstream util.py, not guessed.
 */
export const ANIME_LABELS=Object.freeze(['背景','髪','目','口','顔','肌','服']);
const GROUPS=[
 {name:'背景',kind:'background'},
 {name:'髪',kind:'hair'},
 {name:'目',kind:'eyes'},
 {name:'口',kind:'mouth'},
 {name:'顔',kind:'face'},
 {name:'肌',kind:'skin'},
 {name:'服',kind:'clothes'}
];
const SIDE=512;
let sessionPromise;
async function getAnimeSession(progress){
 if(!sessionPromise){
  sessionPromise=(async()=>{
   progress('アニメ専用ONNXエンジンを準備中…');
   const ort=await import('onnxruntime-web/wasm');
   ort.env.wasm.numThreads=1;
   ort.env.wasm.proxy=false;
   ort.env.wasm.wasmPaths={
    mjs:new URL('./ort/ort-wasm-simd-threaded-loader.js',import.meta.url).href,
    wasm:new URL('./ort/ort-wasm-simd-threaded.wasm',import.meta.url).href
   };
   progress('アニメ7分類モデルを読み込み中（約6.2MB）…');
   const url=new URL('./models/anime-face-unet-7.onnx',import.meta.url).href;
   const session=await ort.InferenceSession.create(url,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
   if(session.inputNames.length!==1||session.outputNames.length!==1||
      JSON.stringify(session.inputNames)!=='["image"]')throw Error('アニメモデルの入出力仕様が不一致です');
   return {ort,session};
  })().catch(err=>{sessionPromise=null;throw err;});
 }
 return sessionPromise;
}
export function animeArgmax(data,dims){
 if(dims.length!==4||dims[0]!==1||dims[1]!==7)throw Error('アニメモデルの7分類出力が見つかりません');
 const h=dims[2],w=dims[3],n=h*w;
 if(!w||!h||n>1024*1024||data.length!==7*n)throw Error('アニメ分類サイズが不正です');
 const labels=new Uint8Array(n),confidence=new Uint8Array(n);
 for(let p=0;p<n;p++){
  let best=0,score=-Infinity;
  for(let c=0;c<7;c++){
   const v=data[c*n+p];
   if(v>score){score=v;best=c;}
  }
  labels[p]=best;confidence[p]=Math.max(0,Math.min(255,Math.round(score*255)));
 }
 return {labels,confidence};
}
export function animeLayerModel(image,predicted,mw,mh,confidence){
 const {width:w,height:h,data}=image;
 if(!w||!h||predicted.length!==mw*mh||(confidence && confidence.length!==mw*mh))throw Error('アニメマスク形状が不正です');
 const raw=new Uint8Array(w*h),score=new Uint8Array(w*h),counts=new Uint32Array(7);
 let foreground=0,opaque=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,s=Math.min(mh-1,Math.floor((y+.5)*mh/h))*mw+Math.min(mw-1,Math.floor((x+.5)*mw/w));
  const label=predicted[s];if(label>6)throw Error('アニメ分類IDが不正です');
  raw[i]=label;score[i]=confidence?confidence[s]:255;
  if(data[i*4+3]){counts[label]++;opaque++;if(label!==0)foreground++;}
 }
 if(foreground<Math.max(10,Math.round(opaque*.015)))return null;
 const used=GROUPS.map((_,i)=>i).filter(i=>i===0||counts[i]>=Math.max(5,Math.round(opaque*.00025)));
 const index=new Int8Array(7).fill(-1);used.forEach((c,i)=>index[c]=i);
 const layers=used.map(id=>({
  id:'anime-'+GROUPS[id].kind,label:GROUPS[id].name,kind:GROUPS[id].kind,
  source:'anime-semantic',visible:true,opacity:100,pixelCount:0,hex:'#888888'
 }));
 const owner=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++){
  owner[i]=index[raw[i]]>=0?index[raw[i]]:index[0];
  if(data[i*4+3])layers[owner[i]].pixelCount++;
 }
 return {width:w,height:h,source:new Uint8ClampedArray(data),owner,layers,
  sampleWidth:mw,sampleHeight:mh,groupsFound:used.length,method:'anime',
  confidence:score};
}
export async function segmentAnime(source,{progress=()=>{}}={}){
 const image=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,source.width,source.height);
 const {ort,session}=await getAnimeSession(progress);
 const c=document.createElement('canvas');c.width=SIDE;c.height=SIDE;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.fillStyle='white';ctx.fillRect(0,0,SIDE,SIDE);
 ctx.drawImage(source,0,0,SIDE,SIDE);
 const pixels=ctx.getImageData(0,0,SIDE,SIDE).data;
 const n=SIDE*SIDE,input=new Float32Array(3*n);
 for(let p=0;p<n;p++)for(let ch=0;ch<3;ch++)input[ch*n+p]=pixels[p*4+ch]/255;
 progress('アニメ7分類を解析中…');
 const prediction=await session.run({image:new ort.Tensor('float32',input,[1,3,SIDE,SIDE])});
 const t=prediction[session.outputNames[0]];
 if(!t?.dims)throw Error('アニメ推論結果がありません');
 const {labels,confidence}=animeArgmax(t.data,t.dims);
 return animeLayerModel(image,labels,t.dims[3],t.dims[2],confidence);
}
