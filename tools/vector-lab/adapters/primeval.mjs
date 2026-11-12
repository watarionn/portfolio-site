// Real Primeval 0.2.2 browser WASM build (MIT).
// Same-origin vendored npm package, no image uploads.
let apiPromise;
export async function primevalSvg({png,width,height,count=80,shape="any",progress=()=>{}}) {
  if(!Number.isInteger(count)||count<1||count>600)throw new Error("Primevalの図形数が範囲外");
  if(!(png instanceof Uint8Array)||png.length<25)throw new Error("PrimevalにはPNG画像が必要");
  if(!apiPromise)apiPromise=import("../vendor/primeval/dist/browser.js")
    .catch(err=>{apiPromise=null;throw err;});
  const api=await apiPromise;
  const allowed=["any","triangle","rectangle","ellipse","circle","rotated-rectangle","quadratic","rotated-ellipse","polygon"];
  if(!allowed.includes(shape))throw new Error("未対応のPrimeval図形種類");
  const outputSize=Math.max(width,height);
  const result=await api.approximate({
    input:png,output:"svg",
    render:{count,shape,alpha:"auto",resizeInput:Math.min(256,outputSize),outputSize,seed:42},
    execution:{onProgress(info){
      if(Number.isFinite(info.step)&&(!Number.isFinite(info.total)||info.step%10===0||info.step===info.total))
        progress(info.step,info.total??count);
    }}
  });
  if(result.format!=="svg"||typeof result.data!=="string")
    throw new Error("PrimevalからSVGを取得できません");
  return result.data;
}
