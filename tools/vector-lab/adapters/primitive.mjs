// Upstream Primitive Playground Go->WASM port of fogleman/primitive,
// pinned to upstream commit, built with Go 1.26.4. MIT-licensed.
// The Go runtime is isolated in this disposable JS Worker, not the UI thread.
let runtimePromise;
async function primitiveRuntime() {
  if(!runtimePromise)runtimePromise=(async()=>{
    await import("../vendor/primitive/wasm_exec.js");
    if(typeof globalThis.Go!=="function")throw Error("Go WASM runtime unavailable");
    const go=new globalThis.Go();
    const response=await fetch(new URL("../vendor/primitive/primitive.wasm",import.meta.url));
    if(!response.ok)throw Error("Primitive WASM download failed: "+response.status);
    const bytes=await response.arrayBuffer();
    const instance=(await WebAssembly.instantiate(bytes,go.importObject)).instance;
    const runPromise=go.run(instance);
    // This Go program intentionally remains in `select {}` after installing
    // global primitiveRun. The outer Worker is terminated after every job.
    runPromise.catch(err=>self.postMessage({fatal:String(err)}));
    if(typeof self.primitiveRun!=="function")
      throw Error("Primitive WASM entry point missing");
    return self.primitiveRun;
  })().catch(err=>{runtimePromise=null;throw err;});
  return runtimePromise;
}
const shapeIds={
  any:0,triangle:1,rectangle:2,ellipse:3,circle:4,
  "rotated-rectangle":5,quadratic:6,"rotated-ellipse":7,polygon:8
};
export async function primitiveSvg({png,width,height,count=24,shape="triangle",progress=()=>{}}) {
  if(!Number.isInteger(count)||count<1||count>100)throw new Error("Primitiveの図形数が範囲外");
  if(!(png instanceof Uint8Array)||png.length<25)throw new Error("PrimitiveにはPNG画像が必要");
  if(!(shape in shapeIds))throw new Error("Primitiveの図形種類が不正");
  const call=await primitiveRuntime();
  return await new Promise((resolve,reject)=>{
    try {
      call(png,{n:count,mode:shapeIds[shape],alpha:128,size:Math.max(width,height),
        inputSize:Math.min(128,Math.max(width,height)),batch:Math.max(1,Math.floor(count/10))},
      (step,svg,error)=>{
        if(error){reject(new Error(String(error)));return;}
        if(Number.isInteger(step))progress(step,count);
        if(step===count && typeof svg==="string")resolve(svg);
      });
    }catch(err){reject(err);}
  });
}
