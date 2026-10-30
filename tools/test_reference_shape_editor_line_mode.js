#!/usr/bin/env node
'use strict';
// Dependency-free regression: node tools/test_reference_shape_editor_line_mode.js
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const directory of ['reference-shape-editor','reference-shape-editor-pwa']){
  let code=fs.readFileSync(path.join(__dirname,directory,'app.js'),'utf8');
  const start=code.indexOf('  setBindings();if(window.matchMedia'),end=code.indexOf('  window.ReferenceShapeEditor=',start);
  assert.ok(start>0&&end>start,'test bootstrap markers');
  code=code.slice(0,start)+
    '  render=()=>{};renderPalette=()=>{};refreshUndo=()=>{};toast=()=>{};\n'+
    '  window.testHooks={state,newProject,addDraftPoint,finishPolygon,insertEdgeVertex,validateImport,outputSvg,changeTool,removeSelected};\n'+
    code.slice(end);
  const elements={};
  const stage={getScreenCTM(){return {a:1,b:0,inverse(){return this}}}};
  const document={
    addEventListener(){},
    getElementById(id){if(id==='stage')return stage;return elements[id]||(elements[id]={
      dataset:{},value:'',textContent:'',disabled:false,
      classList:{add(){},remove(){},toggle(){}},style:{setProperty(){}}
    })},
    querySelectorAll(){return []},createElement(){return {}}
  };
  class DOMPoint{
    constructor(x,y){this.x=x;this.y=y}
    matrixTransform(){return this}
  }
  const window={addEventListener(){}};
  vm.runInNewContext(code,{document,window,DOMPoint,setTimeout:()=>0,clearTimeout(){},console},{filename:directory+'/app.js'});
  const h=window.testHooks,state=h.state;
  state.project=h.newProject(300,300);
  state.project.imageData='test-image';
  h.changeTool('line');
  h.addDraftPoint({x:10,y:10});
  h.addDraftPoint({x:10,y:10});
  assert.equal(state.draft.length,1,'duplicate line point ignored');
  h.addDraftPoint({x:110,y:10});
  h.addDraftPoint({x:110,y:110});
  h.finishPolygon();
  const line=state.project.shapes[0];
  assert.equal(line.kind,'line');
  assert.equal(line.vertexIds.length,3);
  assert.ok(h.outputSvg().includes('<polyline'));
  assert.ok(!h.outputSvg().includes('<polygon'));
  h.changeTool('edge');
  h.insertEdgeVertex({clientX:50,clientY:50});
  assert.equal(line.vertexIds.length,3,'open polyline has no closing edge');
  h.insertEdgeVertex({clientX:50,clientY:10});
  assert.equal(line.vertexIds.length,4,'line edge can be subdivided');
  const doc={schema:'reference-shape-editor/v1',canvas:{width:300,height:300},image:{name:'test.png',dataURL:null},
    vertices:state.project.vertices,shapes:state.project.shapes,layerGroups:[],
    palette:state.project.palette,nextCounter:state.project.counter};
  assert.equal(h.validateImport(doc).project.shapes[0].kind,'line','line JSON roundtrip');
  state.project=h.newProject(300,300);
  h.changeTool('draw');
  for(const p of [{x:10,y:10},{x:110,y:10},{x:110,y:110},{x:10,y:10}])h.addDraftPoint(p);
  assert.equal(state.project.shapes.length,1,'tapping first point closes polygon');
  assert.equal(state.draft.length,0);
  const legacy={...doc,vertices:state.project.vertices,shapes:state.project.shapes};
  assert.equal(h.validateImport(legacy).project.shapes[0].kind,undefined,'old JSON stays polygon');
  state.project=h.newProject(300,300);
  h.changeTool('draw');
  h.addDraftPoint({x:10,y:10});
  h.addDraftPoint({x:110,y:10});
  h.addDraftPoint({x:110,y:110});
  h.addDraftPoint({x:110,y:10});
  assert.equal(state.draft.length,3,'reusing a non-first vertex is ignored');
}
console.log('reference-shape-editor polyline and vertex parity: PASS');
