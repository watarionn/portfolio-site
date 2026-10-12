import SVGPathCommander from 'svg-path-commander';
import {optimize} from 'svgo/browser';
export async function runVector(lib,cap){
 const raw='M 30 30 L 200 40 C 320 70 330 225 190 260 Q 40 260 30 30 Z';
 if(lib==='svgpath'){
  let path=new SVGPathCommander(raw,{round:3}),d;
  if(cap==='optimize')d=path.optimize().toString();
  else if(cap==='reverse')d=path.reverse().toString();
  else if(cap==='absolute')d=path.toAbsolute().toString();
  else if(cap==='transform')d=path.transform({translate:[42,15],rotate:12}).toString();
  else throw Error('Unknown path mode');
  return {kind:'svg',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><path d="'+d+'" fill="#80aaa7" stroke="#294354" stroke-width="4"/></svg>',
   message:'SVGPathCommander.'+cap,stats:{before:raw.length,after:d.length}};
 }
 if(lib==='svgo'){
  const src='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><g id="paint"><rect x="30.0" y="22.00" width="340.000" height="260.000" fill="#88aacc"/><circle cx="186.0" cy="145.0" r="79.0" fill="#eeeecc"/></g></svg>';
  const configs={
   default:{},
   multipass:{multipass:true},
   pretty:{js2svg:{pretty:true,indent:2}},
   preserve:{plugins:[{name:'preset-default',params:{overrides:{removeViewBox:false}}}]}
  };
  if(!configs[cap])throw Error('Unknown SVGO trial');
  const out=optimize(src,configs[cap]).data;
  if(!out.includes('<svg'))throw Error('SVGO returned invalid SVG');
  return {kind:'svg',svg:out,message:'SVGO '+cap,stats:{sourceBytes:src.length,resultBytes:out.length}};
 }
 throw Error('Unknown vector adapter');
}
