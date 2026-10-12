export async function runPixi(cap,source){
 const {Application,Sprite,Texture,BlurFilter,NoiseFilter,ColorMatrixFilter,AlphaFilter}=await import('pixi.js');
 const app=new Application();
 await app.init({width:400,height:300,preference:'webgl',autoStart:false,background:'#e5e9e8',
  preserveDrawingBuffer:true,resolution:1});
 let texture;
 try{
  const input=document.createElement('canvas');input.width=400;input.height=300;
  input.getContext('2d').drawImage(source,0,0,400,300);
  texture=Texture.from(input);
  const sprite=new Sprite(texture);sprite.width=400;sprite.height=300;
  if(cap==='blur')sprite.filters=[new BlurFilter({strength:7})];
  else if(cap==='noise')sprite.filters=[new NoiseFilter({noise:.4,seed:.25})];
  else if(cap==='color'){
   const m=new ColorMatrixFilter();m.sepia(.8,false);sprite.filters=[m];
  }else if(cap==='alpha')sprite.filters=[new AlphaFilter({alpha:.4})];
  else throw Error('Unknown PixiJS capability');
  app.stage.addChild(sprite);app.render();
  const output=document.createElement('canvas');output.width=400;output.height=300;
  output.getContext('2d').drawImage(app.canvas,0,0,400,300);
  return {kind:'canvas',canvas:output,message:'PixiJS '+cap};
 }finally{app.destroy(true,{children:true,texture:false,textureSource:false});}
}
