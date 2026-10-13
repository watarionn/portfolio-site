/**
 * MIT-licensed @gkucmierz/trianglify adapter. NOT GPL-licensed qrohlf/trianglify.
 * Synthetic canvas-independent SVG trials; original source pixels are unchanged.
 */
import Trianglify from '@gkucmierz/trianglify';
export async function runTrianglify(cap){
 const options={width:400,height:300,cellSize:75,variance:.65,seed:18,
   xColors:'tokyonight',stroke:true,strokeWidth:.45};
 if(cap==='pattern')options.xColors='nord';
 else if(cap==='palette')options.xColors='cyberpunk';
 else if(cap==='seed'){options.seed=2048;options.xColors='emerald';}
 else if(cap==='gradient'){
  options.colorPoints=[
    {x:.1,y:.12,color:'#ca536a'},
    {x:.9,y:.15,color:'#4c77b7'},
    {x:.45,y:.95,color:'#f4c565'}];
 }else throw Error('Unknown Trianglify capability: '+cap);
 const result=Trianglify(options);
 const svg=result.toSVGString();
 if(!svg||!/^<svg\b/i.test(svg.trim())||!svg.includes('</svg>')||
   /<script|<foreignObject|<image|onload\s*=|href\s*=/i.test(svg))
  throw Error('Trianglify系ライブラリのSVG結果が不正です');
 return {kind:'svg',svg,message:'Trianglify系 MIT / '+cap,
  stats:{size:svg.length,seed:options.seed,cellSize:options.cellSize}};
}
