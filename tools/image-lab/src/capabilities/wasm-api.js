export async function runWasm(lib,cap,source){
 const {renderVTracer,renderClipper}=await import('../modes/wasm.js');
 const canvas=document.createElement('canvas');canvas.width=400;canvas.height=300;
 const ctx=canvas.getContext('2d');const sample=document.createElement('canvas');
 sample.width=400;sample.height=300;sample.getContext('2d').drawImage(source,0,0,400,300);
 const image=sample.getContext('2d',{willReadFrequently:true}).getImageData(0,0,400,300);
 const fn=lib==='vtracer'?renderVTracer:renderClipper;
 const result=await fn({ctx,source:sample,image,detail:45,weight:55,seed:23,variant:cap});
 if(typeof result?.svg!=='string'||!result.svg.includes('<svg'))throw Error('WASM did not return valid SVG');
 return {kind:'svg',svg:result.svg,message:result.message+' · '+cap};
}
export async function runOnnx(cap,source){
 if(cap!=='wasm')throw Error('Unsupported ONNX backend');
 const {segmentSemantic}=await import('../layers/semantic.js');
 const model=await segmentSemantic(source,{progress:()=>{}});
 if(!model)return {kind:'json',data:{inference:'PASS',foregroundDetected:false},
  message:'ONNX Runtime Web WASM inference succeeded; no person detected'};
 return {kind:'json',data:{inference:'PASS',foregroundDetected:true,
  layers:model.layers.map(x=>({name:x.label,pixels:x.pixelCount}))},
  message:'ONNX Runtime Web WASM inference succeeded'};
}
