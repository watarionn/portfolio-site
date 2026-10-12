import {CAPABILITY_GROUPS} from './catalog.js';
const groups=new Map(CAPABILITY_GROUPS.map(x=>[x.id,x]));
export function findCapability(lib,cap){
 const group=groups.get(lib),item=group?.items.find(x=>x.id===cap);
 if(!item)throw Error('未登録のライブラリ機能: '+lib+'/'+cap);
 return item;
}
export async function executeCapability(lib,cap,source){
 const item=findCapability(lib,cap);
 if(item.status!=='available')return {kind:'skip',message:item.status==='blocked'?'ライセンス上保留':'この環境では実行対象外'};
 if(!source||!source.width||!source.height)throw Error('元画像がありません');
 if(['d3-voronoi','delaunator','earcut','pts','rough','paper'].includes(lib)){
  const {runGeometry}=await import('./geometry.js');return runGeometry(lib,cap);
 }
 if(['svgpath','svgo'].includes(lib)){
  const {runVector}=await import('./vector.js');return runVector(lib,cap);
 }
 if(['glfx','p5'].includes(lib)){
  const {runGraphics}=await import('./graphics.js');return runGraphics(lib,cap,source);
 }
 if(lib==='pixi'){
  const {runPixi}=await import('./pixi.js');return runPixi(cap,source);
 }
 if(['vtracer','clipper'].includes(lib)){
  const {runWasm}=await import('./wasm-api.js');return runWasm(lib,cap,source);
 }
 if(lib==='onnx'){
  const {runOnnx}=await import('./wasm-api.js');return runOnnx(cap,source);
 }
 throw Error('実行アダプター未実装: '+lib);
}
