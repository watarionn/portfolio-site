#!/usr/bin/env node
'use strict';
// Dependency-free regression test. Execute: node tools/reference-shape-editor/test-core.js
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
let code=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
const startup="  setBindings();if(window.matchMedia('(max-width:760px)').matches)$('inspector').classList.add('collapsed');state.view={x:0,y:0,w:INITIAL_WIDTH,h:INITIAL_HEIGHT};changeTool('draw');refreshUndo();";
assert.ok(code.includes(startup));
code=code.replace(startup,'  // Isolated test: no browser bootstrap.');
const ending=code.lastIndexOf('})();');assert.ok(ending>0);
code=code.slice(0,ending)+
  "  render=()=>{};renderPalette=()=>{};refreshUndo=()=>{};toast=()=>{};\n"+
  "  window.hooks={state,newProject,mergeLayerSelection,ungroupLayer,toggleGroupVisibility,reorderLayers,layerEntries,undo,redo,validateImport,combinedPalette,paletteSave,paletteDelete,importPalette};\n})();";
const elements={paletteEditHex:{value:'#abcdef'},paletteEditColor:{value:'#abcdef'}};
const document={
  getElementById(id){return elements[id]||(elements[id]={value:'',disabled:false,textContent:'',classList:{add(){},remove(){},toggle(){}},replaceChildren(){},append(){},style:{setProperty(){}}});},
  createElement(){return{style:{setProperty(){}},addEventListener(){},append(){},classList:{add(){},remove(){}}}},
  querySelectorAll(){return[]}
};
const context={document,window:{},setTimeout,clearTimeout,console};
vm.runInNewContext(code,context,{filename:'app.js'});
const h=context.window.hooks,{state}=h;
const p=h.newProject(400,400);
p.vertices={v1:{x:0,y:0},v2:{x:20,y:0},v3:{x:0,y:20},v4:{x:80,y:80},v5:{x:100,y:80},v6:{x:80,y:100},v7:{x:200,y:200},v8:{x:220,y:200},v9:{x:200,y:220}};
p.shapes=[['s1',['v1','v2','v3'],'#ff0000'],['s2',['v4','v5','v6'],'#00ff00'],['s3',['v7','v8','v9'],'#0000ff']].map(([id,vertexIds,fill])=>({id,name:id,vertexIds,fill,visible:true}));
p.counter=20;state.project=p;
const geometry=JSON.stringify(p.vertices);
state.layerSelection.add('s:s1');state.layerSelection.add('s:s3');
h.mergeLayerSelection();
assert.equal(p.layerGroups.length,1);
assert.equal(p.shapes.length,3);
assert.equal(JSON.stringify(p.vertices),geometry);
assert.equal(p.layerGroups[0].shapeIds.length,2);
assert.equal(new Set(p.shapes.map(s=>s.fill)).size,3);
const key='g:'+p.layerGroups[0].id;
h.reorderLayers(key,'s:s2',true);
assert.equal(h.layerEntries()[0].key,'s:s2');
h.undo();assert.equal(h.layerEntries()[0].key,key);
h.undo();assert.equal(p.layerGroups.length,0);
h.redo();assert.equal(p.layerGroups.length,1);
h.toggleGroupVisibility(p.layerGroups[0].id);
assert.ok(p.shapes.filter(s=>p.layerGroups[0].shapeIds.includes(s.id)).every(s=>!s.visible));
h.undo();assert.ok(p.shapes.every(s=>s.visible));
const doc={schema:'reference-shape-editor/v1',canvas:{width:400,height:400},image:{name:'fixture.png',dataURL:null},vertices:p.vertices,shapes:p.shapes,layerGroups:p.layerGroups,palette:p.palette,nextCounter:p.counter,backgroundOpacity:.35};
assert.equal(h.validateImport(doc).project.layerGroups.length,1);
const legacy=JSON.parse(JSON.stringify(doc));delete legacy.layerGroups;delete legacy.palette.unified;
assert.equal(h.validateImport(legacy).project.layerGroups.length,0);
const corrupt=JSON.parse(JSON.stringify(doc));corrupt.layerGroups[0].shapeIds=['unknown','s2'];
assert.throws(()=>h.validateImport(corrupt),/複合レイヤ/);
state.project.palette={characteristic:['#AABBCC','#DDEEFF'],featured:['#aabbcc'],representative:['#112233','#ddeeff'],unified:[]};
assert.equal(h.combinedPalette(state.project.palette).length,3);
state.project.palette.unified=h.combinedPalette(state.project.palette);
state.paletteEditIndex=-1;elements.paletteEditHex.value='#abcdef';h.paletteSave();
assert.ok(state.project.palette.unified.includes('#abcdef'));
elements.paletteEditHex.value='#fedcba';h.paletteSave();
assert.ok(state.project.palette.unified.includes('#fedcba'));
h.paletteDelete();assert.ok(!state.project.palette.unified.includes('#fedcba'));
assert.equal(state.project.palette.characteristic.length,2);
const prior=state.project.palette.unified.join(',');
h.importPalette({colors:['#010203','#010203','#040506']});
assert.equal(state.project.palette.unified.join(','),'#010203,#040506');
h.undo();assert.equal(state.project.palette.unified.join(','),prior);
h.ungroupLayer(p.layerGroups[0].id);assert.equal(p.layerGroups.length,0);
console.log('reference-shape-editor core regression: PASS');
