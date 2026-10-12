const sampleCanvas=source=>{
 const c=document.createElement('canvas');c.width=400;c.height=300;
 c.getContext('2d').drawImage(source,0,0,c.width,c.height);return c;
};
let gpu=null;
export async function runGraphics(lib,cap,source){
 const sample=sampleCanvas(source);
 if(lib==='glfx'){
  const imported=await import('glfx');const fx=imported.default||imported;gpu=gpu||(gpu=fx.canvas());
  const tex=gpu.texture(sample);
  try{
   gpu.draw(tex);
   if(cap==='contrast')gpu.brightnessContrast(.12,.32);
   else if(cap==='hue')gpu.hueSaturation(.28,.6);
   else if(cap==='vignette')gpu.vignette(.32,.6);
   else if(cap==='hex')gpu.hexagonalPixelate(200,150,18);
   else if(cap==='dots')gpu.dotScreen(200,150,.6,10);
   else if(cap==='blur')gpu.triangleBlur(12);
   else if(cap==='ink')gpu.ink(.45);
   else if(cap==='swirl')gpu.swirl(200,150,100,2);
   else throw Error('Unknown glfx filter');
   gpu.update();
   const canvas=sampleCanvas(gpu);
   return {kind:'canvas',canvas,message:'glfx.js '+cap};
  }finally{tex.destroy();}
 }
 if(lib==='p5'){
  const {loadP5}=await import('../modes/paint.js'),P5=await loadP5();
  const mount=document.createElement('div');mount.hidden=true;document.body.append(mount);
  let instance;
  try{
   await new Promise((resolve,reject)=>{
    try{instance=new P5(p=>{
     p.setup=()=>{
      try{
       p.pixelDensity(1);p.createCanvas(400,300);p.noLoop();p.drawingContext.drawImage(sample,0,0,400,300);
       const mapping={gray:p.GRAY,invert:p.INVERT,threshold:p.THRESHOLD,posterize:p.POSTERIZE,blur:p.BLUR,erode:p.ERODE,dilate:p.DILATE};
       if(!(cap in mapping))throw Error('Unknown p5 filter');
       p.filter(mapping[cap],cap==='posterize'?4:cap==='threshold'?.55:cap==='blur'?3:undefined);
       resolve();
      }catch(err){reject(err);}
     };
    },mount);}catch(err){reject(err);}
   });
   const canvas=sampleCanvas(instance.canvas);
   return {kind:'canvas',canvas,message:'p5.js filter '+cap};
  }finally{instance?.remove();mount.remove();}
 }
 throw Error('Unknown graphics adapter');
}
