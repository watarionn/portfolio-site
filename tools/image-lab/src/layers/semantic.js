/**
 * Semantic Layers (ATR 18 classes), SegFormer B0 quantized ONNX.
 * MIT upstream: mattmdjaga/segformer_b0_clothes, Xenova ONNX export.
 * All inference stays on-device: self-hosted WASM and ONNX, no remote uploads.
 */
const GROUPS=[
 {name:'背景',ids:[0],kind:'background'},
 {name:'髪',ids:[2],kind:'hair'},
 {name:'顔',ids:[11],kind:'face'},
 {name:'上の服',ids:[4],kind:'upper-clothes'},
 {name:'下の服・ズボン',ids:[5,6],kind:'lower-clothes'},
 {name:'ワンピース',ids:[7],kind:'dress'},
 {name:'腕',ids:[14,15],kind:'arms'},
 {name:'脚',ids:[12,13],kind:'legs'},
 {name:'靴',ids:[9,10],kind:'shoes'},
 {name:'帽子',ids:[1],kind:'hat'},
 {name:'眼鏡',ids:[3],kind:'glasses'},
 {name:'ベルト',ids:[8],kind:'belt'},
 {name:'バッグ',ids:[16],kind:'bag'},
 {name:'スカーフ',ids:[17],kind:'scarf'}
];
export const ATR_LABELS=Object.freeze(GROUPS.map(g=>g.name));
const idToGroup=new Uint8Array(18);
GROUPS.forEach((g,i)=>g.ids.forEach(id=>{idToGroup[id]=i;}));
const inputSide=256;
let sessionPromise;
async function getSession(progress){
 if(!sessionPromise){
  sessionPromise=(async()=>{
   progress('AI推論エンジンを読み込み中…');
   const ort=await import('onnxruntime-web/wasm');
   ort.env.wasm.numThreads=1;
   ort.env.wasm.proxy=false;
   ort.env.wasm.wasmPaths={
    // The Cloudfree nginx host does not assign JS MIME type to .mjs.
    mjs:new URL('./ort/ort-wasm-simd-threaded-loader.js',import.meta.url).href,
    wasm:new URL('./ort/ort-wasm-simd-threaded.wasm',import.meta.url).href
   };
   progress('AIモデルを読み込み中（約4.4MB・初回のみ）…');
   const modelUrl=new URL('./models/segformer-b0-clothes-int8.onnx',import.meta.url).href;
   const session=await ort.InferenceSession.create(modelUrl,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
   if(session.inputNames.length!==1||session.outputNames.length!==1)throw Error('モデルの入出力定義が不一致です');
   return {ort,session};
  })().catch(error=>{sessionPromise=null;throw error;});
 }
 return sessionPromise;
}
export function semanticLayerModel(image,classes,maskWidth,maskHeight){
 const {width,height,data}=image;
 if(!classes?.length||classes.length!==maskWidth*maskHeight)throw Error('AIマスクのサイズが不正です');
 const pixelTotals=new Uint32Array(GROUPS.length);
 const ownerAll=new Uint8Array(width*height);
 const raw=new Uint8Array(width*height);
 let foreground=0;
 for(let y=0;y<height;y++){
  const sy=Math.min(maskHeight-1,Math.floor((y+.5)*maskHeight/height));
  for(let x=0;x<width;x++){
   const sx=Math.min(maskWidth-1,Math.floor((x+.5)*maskWidth/width));
   const predicted=classes[sy*maskWidth+sx];
   const sourceIndex=(y*width+x);
   const mapped=idToGroup[predicted]??0;
   raw[sourceIndex]=mapped;
   if(data[sourceIndex*4+3]){
    pixelTotals[mapped]++;
    if(predicted!==0)foreground++;
   }
  }
 }
 const opaque=pixelTotals.reduce((a,b)=>a+b,0);
 if(foreground<Math.max(10,Math.round(opaque*.015)))return null;
 // Keep only meaningful classes; reserve a background owner that is always present.
 const retained=GROUPS.map((_,id)=>id).filter(id=>pixelTotals[id]>=Math.max(5,Math.round(opaque*.00025))||id===0);
 const selectedIndex=new Int8Array(GROUPS.length).fill(-1);
 retained.forEach((id,index)=>{selectedIndex[id]=index;});
 const owner=new Uint8Array(ownerAll.length);
 const layers=retained.map(id=>({
   id:'semantic-'+GROUPS[id].kind,label:GROUPS[id].name,kind:GROUPS[id].kind,
   source:'semantic',visible:true,opacity:100,pixelCount:0,hex:'#888888'
 }));
 for(let i=0;i<owner.length;i++){
  const id=selectedIndex[raw[i]];
  const selected=id<0?selectedIndex[0]:id;
  owner[i]=selected;
  if(data[i*4+3])layers[selected].pixelCount++;
 }
 return {width,height,source:new Uint8ClampedArray(data),owner,layers,
   sampleWidth:maskWidth,sampleHeight:maskHeight,groupsFound:retained.length,method:'semantic'};
}
export function argmaxLogits(data,dims){
 if(dims.length!==4||dims[0]!==1||dims[1]!==18)throw Error('AIモデルの18分類出力が見つかりません');
 const h=dims[2],w=dims[3],area=h*w;
 if(!w||!h||area>1024*1024||data.length!==18*area)throw Error('AIマスクの大きさが不正です');
 const result=new Uint8Array(area);
 for(let i=0;i<area;i++){
   let best=0,v=-Infinity;
   for(let c=0;c<18;c++){
    const cur=data[c*area+i];
    if(cur>v){best=c;v=cur;}
   }
   result[i]=best;
 }
 return result;
}
export async function segmentSemantic(source,{progress=()=>{}}={}){
 const image=source.getContext('2d',{willReadFrequently:true})
   .getImageData(0,0,source.width,source.height);
 const {ort,session}=await getSession(progress);
 progress('人物・髪・服をAIで解析中…');
 // Input follows the checkpoint's RGB ImageNet mean/std normalization.
 // Keep resize geometry consistent with the model; return masks in original coordinates.
 const c=document.createElement('canvas');c.width=inputSide;c.height=inputSide;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,inputSide,inputSide);
 ctx.drawImage(source,0,0,inputSide,inputSide);
 const pixels=ctx.getImageData(0,0,inputSide,inputSide).data;
 const input=new Float32Array(3*inputSide*inputSide);
 const mean=[.485,.456,.406],std=[.229,.224,.225],area=inputSide*inputSide;
 for(let i=0;i<area;i++){
  for(let channel=0;channel<3;channel++){
   input[channel*area+i]=(pixels[i*4+channel]/255-mean[channel])/std[channel];
  }
 }
 const x=new ort.Tensor('float32',input,[1,3,inputSide,inputSide]);
 const output=await session.run({[session.inputNames[0]]:x});
 const t=output[session.outputNames[0]];
 if(!t||!t.dims)throw Error('推論結果を取得できません');
 const labels=argmaxLogits(t.data,t.dims);
 return semanticLayerModel(image,labels,t.dims[3],t.dims[2]);
}
