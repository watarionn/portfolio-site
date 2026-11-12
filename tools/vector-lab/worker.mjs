// Vector Lab isolated compute worker. No network calls beyond same-origin vendored WASM.
import {toEngine} from "./options.mjs";
let vtracerPromise=null;
let imageTracerPromise=null;
async function vtracer() {
  if(!vtracerPromise) vtracerPromise=(async()=>{
    const m=await import("./vendor/vtracer10-browser.mjs");
    const url=new URL("./vendor/vtracer_wasm_bg.wasm",import.meta.url);
    const response=await fetch(url);
    if(!response.ok)throw new Error("VTracer 1.0のWASMを取得できません");
    await m.initVTracer10(new Uint8Array(await response.arrayBuffer()));
    return m;
  })().catch(e=>{vtracerPromise=null;throw e});
  return vtracerPromise;
}
async function imagetracer() {
  if(!imageTracerPromise) imageTracerPromise=(async()=>{
    await import("./vendor/imagetracer_v1.2.6.js");
    if(!self.ImageTracer)throw new Error("ImageTracerJSを初期化できません");
    return self.ImageTracer;
  })().catch(e=>{imageTracerPromise=null;throw e});
  return imageTracerPromise;
}
self.onmessage=async e=>{
  const {job,engine,rgba,png,width,height,settings,colors,count,shape}=e.data||{};
  try {
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
       width>2048||height>2048||!(rgba instanceof Uint8ClampedArray)&&!(rgba instanceof Uint8Array)||
       rgba.byteLength!==width*height*4)throw new Error("画像データが不正です");
    let svg;
    if(engine==="vtracer"){
      self.postMessage({job,progress:"VTracer 1.0で図形化中"});
      const mod=await vtracer();
      svg=mod.vectorize_rgba(new Uint8Array(rgba),width,height,toEngine(settings));
    }else if(engine==="imagetracer"){
      self.postMessage({job,progress:"ImageTracerJSで図形化中"});
      const tracer=await imagetracer();
      svg=tracer.imagedataToSVG({width,height,data:rgba},{
        numberofcolors:Math.max(2,Math.min(32,Number(colors)||8)),
        colorquantcycles:3,pathomit:8,ltres:1,qtres:1,scale:1,
        linefilter:false,viewbox:true,strokewidth:0,layering:0,
        rightangleenhance:true
      });
    }else if (["primitive","geometrize","primeval"].includes(engine)) {
      const module=await import("./adapters/"+engine+".mjs");
      const progress=(step,total)=>self.postMessage({
        job,progress:engine+" の図形化 "+step+"/"+total
      });
      const options={png,rgba,width,height,count,shape,progress};
      if(engine==="primitive")svg=await module.primitiveSvg(options);
      else if(engine==="geometrize")svg=await module.geometrizeSvg(options);
      else svg=await module.primevalSvg(options);
    }else throw new Error("未知の図形化エンジンです");
    if(typeof svg!=="string"||svg.length<25||svg.length>6_000_000)
      throw new Error("SVGが不正か、サイズ上限を超えました");
    self.postMessage({job,svg,engine});
  }catch(err){self.postMessage({job,error:String(err?.message||err)});}
};
