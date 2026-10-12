/* Experimental p5.js and PixiJS color-expression renderers. Run on demand only. */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function sample(image,x,y){
 const w=image.width,h=image.height;
 const ix=clamp(Math.floor(x),0,w-1),iy=clamp(Math.floor(y),0,h-1),i=(iy*w+ix)*4;
 return [image.data[i],image.data[i+1],image.data[i+2]];
}
function rng(seed){let s=seed|0;return()=>{s=(Math.imul(s,1664525)+1013904223)|0;return(s>>>0)/4294967296;};}
let p5loading;
export async function loadP5(){
 if(window.p5)return window.p5;
 if(!p5loading){
  p5loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src=new URL('./vendor/p5.min.js',import.meta.url).href;
   script.onload=()=>window.p5?resolve(window.p5):reject(new Error('p5.js が起動できない'));
   script.onerror=()=>reject(new Error('p5.js 読み込み失敗'));
   document.head.append(script);
  }).catch(e=>{p5loading=null;throw e;});
 }
 return p5loading;
}
export async function renderP5({ctx,image,detail,weight,seed}){
 const P5=await loadP5();
 const w=image.width,h=image.height,spacing=Math.max(9,Math.round(110-detail)),rand=rng(seed);
 const mount=document.createElement('div');
 mount.style.display='none';document.body.append(mount);
 let instance;
 try{
  // Instance mode avoids leaking global sketch functions into other Image Lab experiments.
  await new Promise((resolve,reject)=>{
   try{
    instance=new P5(p=>{
      p.setup=()=>{
       p.pixelDensity(1);p.createCanvas(w,h);p.noLoop();
       p.background(249,245,237);p.noFill();
       p.strokeWeight(.7+weight*.024);
       for(let y=spacing/2;y<h;y+=spacing)for(let x=spacing/2;x<w;x+=spacing){
        const a=sample(image,x,y),v=(a[0]+a[1]+a[2])/3;
        const angle=(v/255)*p.TWO_PI+rand()*.8;
        const radius=spacing*(.2+weight*.005);
        p.stroke(...a,215);
        p.push();p.translate(x,y);p.rotate(angle);
        p.line(-radius,0,radius,0);
        if(weight>35)p.ellipse(0,0,radius*.9,radius*.9);
        p.pop();
       }
       resolve();
      };
    },mount);
   }catch(e){reject(e);}
  });
  ctx.drawImage(instance.canvas,0,0);
 }finally{instance?.remove();mount.remove();}
}
export async function renderPixi({ctx,image,source,detail,weight,seed}){
 const {Application,Graphics,Sprite,Texture}=await import('pixi.js');
 const app=new Application();
 await app.init({width:image.width,height:image.height,preference:'webgl',autoStart:false,
   background:'#f9f5ed',antialias:true,resolution:1,preserveDrawingBuffer:true});
 let texture;
 try{
   texture=Texture.from(source);
   const sprite=new Sprite(texture);
   sprite.alpha=clamp(0.2+(100-weight)*.006,0.18,.85);
   sprite.width=image.width;sprite.height=image.height;
   app.stage.addChild(sprite);
   const art=new Graphics(),spacing=Math.max(10,Math.round(110-detail)),rand=rng(seed);
   for(let y=spacing/2;y<image.height;y+=spacing)for(let x=spacing/2;x<image.width;x+=spacing){
      const rgb=sample(image,x,y),hex=(rgb[0]<<16)|(rgb[1]<<8)|rgb[2];
      const r=spacing*(.1+.55*rand())*(.6+weight*.008);
      art.circle(x,y,r).fill({color:hex,alpha:.66});
   }
   app.stage.addChild(art);
   app.render();
   ctx.drawImage(app.canvas,0,0,image.width,image.height);
 }finally{app.destroy(true,{children:true,texture:false,textureSource:false});}
}
