import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CAPABILITY_GROUPS,CAPABILITY_COUNT} from '../src/capabilities/catalog.js';
import {findCapability,executeCapability} from '../src/capabilities/runner.js';
test('catalog tracks 15 library families with unique capability IDs',()=>{
 assert.equal(CAPABILITY_GROUPS.length,15);
 assert.ok(CAPABILITY_COUNT>=55);
 for(const group of CAPABILITY_GROUPS){
  assert.ok(group.id&&group.name&&group.items.length);
  assert.equal(new Set(group.items.map(x=>x.id)).size,group.items.length);
  for(const item of group.items)assert.ok(['available','unsupported','blocked'].includes(item.status));
 }
});
test('ONNX WebGPU stays excluded; MIT Trianglify alternative is executable',async()=>{
 assert.equal(findCapability('onnx','webgpu').status,'unsupported');
 assert.equal(findCapability('trianglify','pattern').status,'available');
 assert.equal((await executeCapability('onnx','webgpu',null)).kind,'skip');
 assert.throws(()=>findCapability('nonsense','none'),/未登録/);
});
test('MIT Trianglify-compatible library returns actual repeatable SVG',async()=>{
 const {runTrianglify}=await import('../src/capabilities/trianglify.js');
 for(const cap of ['pattern','palette','seed','gradient']){
  const a=await runTrianglify(cap),b=await runTrianglify(cap);
  assert.equal(a.kind,'svg');
  assert.match(a.svg,/<svg[\s>]/);
  assert.match(a.svg,/<path[\s>]/);
  assert.equal(a.svg,b.svg,cap+' must be repeatable');
 }
});
test('research UI is connected to actual lazy execution with traceability',async()=>{
 const [ui,page,main]=await Promise.all([
  readFile(new URL('../src/capabilities/ui.js',import.meta.url),'utf8'),
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/main.js',import.meta.url),'utf8')
 ]);
 for(const id of ['capLibrary','capCapability','capRun','capRunAll','capHistory','capExport'])assert.ok(page.includes('id="'+id+'"'));
 assert.ok(ui.includes('executeCapability'));
 assert.ok(ui.includes("state:'pass'")&&ui.includes("state:'fail'"));
 assert.ok(main.includes('createCapabilityLab({source})'));
});
