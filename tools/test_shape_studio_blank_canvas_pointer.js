#!/usr/bin/env node
'use strict';
// No dependencies: exercise actual SVG pointer handlers after a new blank canvas.
// node tools/test_shape_studio_blank_canvas_pointer.js
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const app=path.join(__dirname,'reference-shape-editor-pwa','app.js');
let source=fs.readFileSync(app,'utf8');
const start=source.indexOf("  setBindings();if(window.matchMedia");
const end=source.indexOf("  window.ReferenceShapeEditor=",start);
assert.ok(start>0&&end>start,'PWA bootstrap test markers');
source=source.slice(0,start)+
  "  render=()=>{};renderPalette=()=>{};refreshUndo=()=>{};toast=()=>{};status=()=>{};autoFit=()=>{};scheduleAutosave=()=>{};\n"+
  "  window.hooks={state,newProject,createBlankCanvas,changeTool,onPointerDown,onPointerUp,finishPolygon};\n"+
  source.slice(end);
const elements={};
const stage={
  getScreenCTM(){return {a:1,b:0,inverse(){return this}};},
  setPointerCapture(){},releasePointerCapture(){}
};
const document={
  addEventListener(){},querySelectorAll(){return[];},
  getElementById(id){
    if(id==='stage')return stage;
    if(!elements[id])elements[id]={
      value:'',hidden:false,disabled:false,textContent:'',dataset:{},
      classList:{add(){},remove(){},toggle(){}},
      style:{setProperty(){}},focus(){},setAttribute(){},
      removeAttribute(){},replaceChildren(){},append(){}
    };
    return elements[id];
  },
  createElement(){return{};}
};
class DOMPoint{
  constructor(x,y){this.x=x;this.y=y;}
  matrixTransform(){return this;}
}
const window={confirm:()=>true,addEventListener(){}};
vm.runInNewContext(source,{document,window,DOMPoint,structuredClone,setTimeout:()=>0,clearTimeout(){},console},
 {filename:app});
const h=window.hooks;
const noTarget={closest(){return null;}};
function event(x,y,pointerType='touch',pointerId=1,type='pointerdown'){
  return {clientX:x,clientY:y,pointerType,pointerId,button:0,type,target:noTarget};
}
function tap(x,y){
  h.onPointerDown(event(x,y));
  h.onPointerUp(event(x,y,'touch',1,'pointerup'));
}
const p=h.state.project;
assert.equal(p.imageData,null);
assert.equal(p.imageName,null);
h.changeTool('draw');
tap(30,40);
assert.equal(h.state.draft.length,0,'launch placeholder must not draw without a canvas');
// Create and edit a genuinely image-free canvas using iPhone pointerup taps.
document.getElementById('newCanvasSize').value='1024x1024';
h.createBlankCanvas();
assert.equal(h.state.project.width,1024);
assert.equal(h.state.project.imageData,null);
assert.equal(h.state.project.imageName,'無題のキャンバス');
tap(50,60);tap(300,60);tap(300,300);
assert.equal(h.state.draft.length,3,'new blank canvas must accept three touch vertices');
h.finishPolygon();
assert.equal(h.state.project.shapes.length,1,'touch vertices must form a polygon');
assert.equal(h.state.project.shapes[0].vertexIds.length,3);
// Switch to line mode in another fresh blank canvas, without underlay.
document.getElementById('newCanvasSize').value='720x1280';
h.createBlankCanvas();
h.changeTool('line');
tap(70,80);tap(250,260);
assert.equal(h.state.draft.length,2,'new blank canvas must accept line touch vertices');
h.finishPolygon();
assert.equal(h.state.project.shapes[0].kind,'line','two touch points must form a line');
// Mouse or trackpad path uses pointerdown rather than touch pointerup.
document.getElementById('newCanvasSize').value='512x512';
h.createBlankCanvas();
h.changeTool('draw');
h.onPointerDown(event(50,50,'mouse',2,'pointerdown'));
h.onPointerDown(event(300,50,'mouse',2,'pointerdown'));
h.onPointerDown(event(300,250,'mouse',2,'pointerdown'));
assert.equal(h.state.draft.length,3,'mouse must accept blank-canvas polygon vertices');
h.finishPolygon();
assert.equal(h.state.project.shapes.length,1);
// Previous image-backed drawing remains available.
h.state.project=h.newProject(512,512);
h.state.project.imageData='data:image/png;base64,AA==';
h.changeTool('draw');
h.onPointerDown(event(60,60,'mouse',2,'pointerdown'));
assert.equal(h.state.draft.length,1,'image-backed editing regression');
console.log('Shape Studio image-free touch + mouse polygon/line pointers: PASS');
