// Geometrize (Haxe -> JS) v0.0.19, bundled from npm geometrizejs.
// Official Geometrize core, not a visual imitation. MIT license.
let libraryPromise;
async function getLibrary() {
  if (!libraryPromise) {
    libraryPromise=(async()=>{
      // The pinned Haxe compiler output is CommonJS. A module-worker-local
      // `exports` object exposes its existing native namespace without eval.
      const exportsObject={};
      globalThis.exports=exportsObject;
      await import("../vendor/geometrize-haxe.js");
      const g=exportsObject.geometrize;
      if(!g?.runner?.ImageRunner || !g?.bitmap?.Bitmap || !g?.exporter?.SvgExporter)
        throw new Error("Geometrize Haxeエンジンの初期化に失敗");
      return g;
    })().catch(error=>{libraryPromise=null;throw error;});
  }
  return libraryPromise;
}
const shapeGroups={
  any:["RECTANGLE","ROTATED_RECTANGLE","TRIANGLE","ELLIPSE","ROTATED_ELLIPSE","CIRCLE","LINE","QUADRATIC_BEZIER"],
  triangle:["TRIANGLE"],rectangle:["RECTANGLE"],ellipse:["ELLIPSE"],
  circle:["CIRCLE"],"rotated-rectangle":["ROTATED_RECTANGLE"],
  "rotated-ellipse":["ROTATED_ELLIPSE"],quadratic:["QUADRATIC_BEZIER"],line:["LINE"]
};
export async function geometrizeSvg({rgba,width,height,count=75,shape="any",progress=()=>{}}) {
  if(!Number.isInteger(count)||count<1||count>500)throw new Error("Geometrizeの図形数が範囲外");
  const g=await getLibrary();
  const types=shapeGroups[shape];
  if(!types)throw new Error("未対応のGeometrize図形種類");
  const bitmap=g.bitmap.Bitmap.createFromByteArray(width,height,new Uint8Array(rgba));
  const runner=new g.runner.ImageRunner(bitmap);
  const typeCodes=types.map(name=>g.shape.ShapeTypes[name]);
  const opts={shapeTypes:typeCodes,candidateShapesPerStep:24,shapeMutationsPerStep:54,alpha:128};
  const pieces=[];
  for(let i=0;i<count;i++){
    pieces.push(g.exporter.SvgExporter.exportShapes(runner.step(opts)));
    if(i===0 || (i+1)%10===0 || i===count-1)
      progress(i+1,count);
  }
  const widthInt=Math.floor(width),heightInt=Math.floor(height);
  return g.exporter.SvgExporter.getSvgNodeOpen(widthInt,heightInt)+
    '<rect width="'+widthInt+'" height="'+heightInt+'" fill="#ffffff"/>'+pieces.join("\n")+
    g.exporter.SvgExporter.getSvgNodeClose();
}
