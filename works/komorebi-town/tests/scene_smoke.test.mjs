import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
let code=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert(code);
code=code.replace("await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js')","globalThis.__mockTHREE");
// Stub non-rendering APIs to verify scene construction and button logic without network.
class Color {constructor(c){this.color=c;}setHex(c){this.color=c;return this;}set(c){this.color=c;return this;}}
class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}copy(v){return this.set(v.x,v.y,v.z);}add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}clone(){return new Vector3(this.x,this.y,this.z);}lerp(v,a){this.x+=(v.x-this.x)*a;this.y+=(v.y-this.y)*a;this.z+=(v.z-this.z)*a;return this;} }
class Vector2{constructor(x=0,y=0){this.x=x;this.y=y;}set(x,y){this.x=x;this.y=y;return this;}normalize(){let l=Math.hypot(this.x,this.y)||1;this.x/=l;this.y/=l;return this;}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;return this;}lengthSq(){return this.x*this.x+this.y*this.y;}length(){return Math.hypot(this.x,this.y);} }
class Scale{constructor(){this.x=this.y=this.z=1;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}setScalar(v){return this.set(v,v,v);} }
class Rot {constructor(){this.x=this.y=this.z=0;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
class Obj {constructor(){this.position=new Vector3();this.rotation=new Rot();this.scale=new Scale();this.children=[];this.material=null;this.castShadow=true;this.receiveShadow=true;}add(a){this.children.push(a);return a;}updateMatrix(){this.matrix={pos:this.position.clone(),scale:{...this.scale}};}lookAt(){} }
class Geo {constructor(...args){this.args=args;}}
class Material {constructor(opts={}){this.color=new Color(opts.color);this.emissive=new Color(opts.emissive||0);this.opts=opts;Object.assign(this,opts);this.color=new Color(opts.color);this.emissive=new Color(opts.emissive||0);} }
class Mesh extends Obj {constructor(geo,mat){super();this.geometry=geo;this.material=mat;}}
class InstancedMesh extends Mesh {constructor(g,m,n){super(g,m);this.count=n;this.instanceMatrix={needsUpdate:false};this.matrices=[];}setMatrixAt(i,m){this.matrices[i]=m;}}
class Renderer{constructor(){this.shadowMap={};this.domElement=element('render-canvas');this.outputColorSpace=null;}setPixelRatio(){}setSize(){}render(){renders++;}}
class Light extends Obj{constructor(color,intensity){super();this.color=new Color(color);this.intensity=intensity;this.shadow={mapSize:{set(){}},camera:{},normalBias:0};this.isHemisphereLight=this.constructor.name==='Hemi';}}
class Hemi extends Light {constructor(a,b,c){super(a,c);this.isHemisphereLight=true;}}
class Camera extends Obj {updateProjectionMatrix(){} }
class Ray {intersectPlane(plane, v){v.set(5,0,4);return v;}}
class Clock{getDelta(){return 1/30;}}
const elems=new Map(),handlers={};let requestCB;let renders=0;
function element(id){if(!elems.has(id)){const e={id,textContent:'',style:{},dataset:{},children:[],handlers:{},attributes:{},classList:{v:new Set(),add(k){this.v.add(k);},remove(k){this.v.delete(k);},contains(k){return this.v.has(k);},toggle(k,b){if(b)this.v.add(k);else this.v.delete(k);}},addEventListener(type,fn){this.handlers[type]=fn;},setAttribute(k,v){this.attributes[k]=v;},appendChild(e){this.children.push(e);},setPointerCapture(){},getContext(){return {fillRect(){},fillText(){},strokeRect(){}};}};elems.set(id,e);}return elems.get(id);}
const document={hidden:false,getElementById:element,createElement:tag=>element(`new-${tag}-${elems.size}`),querySelectorAll:selector=>selector==='[data-dir]'?['up','down','left','right'].map(d=>{const el=element('pad-'+d);el.dataset.dir=d;return el;}):[]};
const THREE={ACESFilmicToneMapping:'tone',PCFSoftShadowMap:'soft',PCFShadowMap:'hard',SRGBColorSpace:'srgb',DoubleSide:'double',RepeatWrapping:'repeat',Mesh,InstancedMesh,MeshStandardMaterial:Material,MeshBasicMaterial:Material,Scene:Obj,Group:Obj,Object3D:Obj,Color,Vector2,Vector3,Clock,WebGLRenderer:Renderer,Fog:class{constructor(color){this.color=new Color(color);}},HemisphereLight:Hemi,DirectionalLight:Light,OrthographicCamera:Camera,Raycaster:class{constructor(){this.ray=new Ray();}setFromCamera(){}},Plane:class{},MathUtils:{clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t},CanvasTexture:class{constructor(canvas){this.canvas=canvas;this.repeat={set(){}};}},PlaneGeometry:Geo,TorusGeometry:Geo,CylinderGeometry:Geo,BoxGeometry:Geo,IcosahedronGeometry:Geo,SphereGeometry:Geo,CircleGeometry:Geo,RingGeometry:Geo};
let now=0;
const globalObj={__mockTHREE:THREE,document,innerWidth:393,innerHeight:852,window:null,matchMedia:()=>({matches:true}),performance:{now:()=>now},requestAnimationFrame(fn){requestCB=fn;},setTimeout(fn){fn();return 0;},console};
globalObj.window={devicePixelRatio:3,matchMedia:()=>({matches:true}),addEventListener(type,cb){handlers[type]=cb;}};
// Our code is module syntax in browser; after removing dynamic import, async operations in `try` are okay.
await vm.runInNewContext(`(async()=>{${code}\n})()`,globalObj,{timeout:20000});
assert.equal(element('load-status').classList.contains('hidden'),true,'scene finished initializing');
assert(element('stage').children.length>0,'renderer mounted');
for(const [i,label] of ['◕ 夕方','☾ 夜','☀ 昼'].entries()){
 element('time-button').handlers.click();
 assert.equal(element('time-button').textContent,label,'time toggle works '+i);
}
for(let i=1;i<=9;i++){now=i*35;requestCB(now);}
assert(renders>2,'3D renderer draws frames');
assert(typeof element('touch-talk').handlers.click==='function');
element('touch-talk').handlers.click();
assert(element('toast').textContent.includes('近づい'),'interaction prompt displays');
assert.equal(handlers.keydown instanceof Function || typeof handlers.keydown==='function',true);
handlers.keydown({key:'w',preventDefault(){},repeat:false});
for(let i=10;i<=16;i++){now=i*35;requestCB(now);}
handlers.keyup({key:'w'});
console.log('3D_SCENE_SMOKE_PASS',{objectCount:globalObj.scene?.children?.length??'constructed',renders,ui:elems.size,bytes:Buffer.byteLength(html)});