import {voronoi} from 'd3-voronoi';
import Delaunator from 'delaunator';
import earcut,{flatten,deviation} from 'earcut';
import {Pt,Line} from 'pts';
import rough from 'roughjs';
import paper from 'paper';
const ptsFor=(w,h)=>[[.12*w,.18*h],[.4*w,.1*h],[.8*w,.12*h],[.9*w,.53*h],[.74*w,.87*h],[.33*w,.75*h],[.1*w,.82*h],[.51*w,.48*h],[.65*w,.35*h],[.24*w,.43*h]];
const draw=(ctx,polys,closed=false)=>{
 ctx.strokeStyle='#263f50';ctx.lineWidth=2;
 for(const ring of polys){if(!ring||ring.length<2)continue;ctx.beginPath();ctx.moveTo(...ring[0]);
 for(const point of ring.slice(1))ctx.lineTo(...point);
 if(closed)ctx.closePath();ctx.stroke();}
};
export async function runGeometry(lib,cap){
 const w=400,h=300,c=document.createElement('canvas');c.width=w;c.height=h;
 const ctx=c.getContext('2d');ctx.fillStyle='#f5efe5';ctx.fillRect(0,0,w,h);
 const pts=ptsFor(w,h);
 const ok=(message,stats={})=>({kind:'canvas',canvas:c,message,stats});
 if(lib==='d3-voronoi'){
  const v=voronoi().extent([[0,0],[w,h]])(pts);
  if(cap==='find'){const point=v.find(200,140);if(!point)throw Error('Voronoi find returned empty');
   return {kind:'json',data:{nearest:point,query:[200,140]},message:'voronoi.find()'};}
  if(cap==='polygons'){const a=v.polygons().filter(Boolean);draw(ctx,a,true);return ok('voronoi.polygons()', {count:a.length});}
  if(cap==='links'){const a=v.links();draw(ctx,a.map(x=>[x.source,x.target]));return ok('voronoi.links()', {count:a.length});}
  if(cap==='triangles'){const a=v.triangles();draw(ctx,a,true);return ok('voronoi.triangles()', {count:a.length});}
 }
 if(lib==='delaunator'){
  const d=Delaunator.from(pts);
  if(cap==='update'){d.coords[0]+=15;d.coords[1]+=25;d.update();
   return {kind:'json',data:{triangles:d.triangles.length/3,hull:Array.from(d.hull)},message:'Delaunator.update()'};}
  if(cap==='halfedges')return {kind:'json',data:{halfedges:Array.from(d.halfedges),triangles:Array.from(d.triangles)},message:'Delaunator.halfedges'};
  if(cap==='hull'){const ring=Array.from(d.hull,p=>pts[p]);draw(ctx,[ring],true);return ok('Delaunator.hull',{vertices:ring.length});}
  if(cap==='triangles'){const a=[];for(let i=0;i<d.triangles.length;i+=3)a.push([pts[d.triangles[i]],pts[d.triangles[i+1]],pts[d.triangles[i+2]]]);
   draw(ctx,a,true);return ok('Delaunator.triangles',{count:a.length});}
 }
 if(lib==='earcut'){
  const outer=[[40,40],[360,40],[360,260],[40,260]],hole=[[140,110],[140,195],[260,195],[260,110]];
  if(cap==='flatten')return {kind:'json',data:flatten([outer,hole]),message:'earcut.flatten()'};
  const rings=cap==='simple'?outer:[...outer,...hole];
  const flat=rings.flat(),holes=cap==='simple'?null:[outer.length];
  const tris=earcut(flat,holes,2);
  if(cap==='deviation')return {kind:'json',data:{deviation:deviation(flat,holes,2,tris),triangles:tris.length/3},message:'earcut.deviation()'};
  const polys=[];for(let i=0;i<tris.length;i+=3)polys.push([rings[tris[i]],rings[tris[i+1]],rings[tris[i+2]]]);
  draw(ctx,polys,true);return ok('earcut triangulation',{triangles:polys.length,holes:cap==='holes'});
 }
 if(lib==='pts'){
  const a=new Pt(24,40),b=new Pt(284,218);
  if(cap==='distance')return {kind:'json',data:{length:Line.magnitude([a,b])},message:'Pts.Line.magnitude()'};
  if(cap==='midpoint'){const mid=new Pt((a[0]+b[0])/2,(a[1]+b[1])/2);
   return {kind:'json',data:{midpoint:Array.from(mid),a:Array.from(a),b:Array.from(b)},message:'Pts midpoint'};}
  if(cap==='transform'){const translated=a.clone().add(40,30);
   return {kind:'json',data:{before:Array.from(a),after:Array.from(translated)},message:'Pts.Pt.add()'};}
 }
 if(lib==='rough'){
  const rc=rough.canvas(c),opts={stroke:'#263f50',strokeWidth:2,fill:'#85adae',roughness:1.5,seed:17};
  if(cap==='shapes'){
   rc.rectangle(36,40,100,100,opts);rc.circle(230,100,100,opts);rc.line(20,220,375,230,opts);rc.ellipse(320,200,90,55,opts);
  }else if(cap==='svgpath')rc.path('M 80 60 L 190 70 L 210 220 L 65 195 Z',opts);
  else rc.rectangle(45,35,305,235,{...opts,fillStyle:cap});
  return ok('Rough.js '+cap);
 }
 if(lib==='paper'){
  const scope=new paper.PaperScope();scope.setup(c);
  try{
   const a=new scope.Path.Circle(new scope.Point(162,142),88);
   const b=new scope.Path.Circle(new scope.Point(232,142),88);
   a.fillColor=new scope.Color('#427d8d');b.fillColor=new scope.Color('#c37d66');let shape;
   if(['unite','intersect','subtract'].includes(cap)){
    shape=a[cap](b);a.remove();b.remove();shape.fillColor=new scope.Color('#6d997e');
   }else{
    a.remove();b.remove();
    shape=new scope.Path({segments:[[45,140],[90,54],[150,105],[215,50],[305,140],[320,250],[200,225],[135,280]],closed:true,fillColor:'#6d997e'});
    if(cap==='simplify')shape.simplify(15);
    if(cap==='smooth')shape.smooth();
   }
   scope.view.draw();
   if(cap==='export'){const svg=scope.project.exportSVG({asString:true});
    if(!svg?.includes('<svg'))throw Error('Paper SVG export did not return SVG');
    return {kind:'svg',svg,message:'Paper.js exportSVG()'};}
   return ok('Paper.js '+cap,{segments:shape.segments?.length||0});
  }finally{scope.project.clear();scope.remove();}
 }
 throw Error('Capability adapter missing: '+lib+'/'+cap);
}
