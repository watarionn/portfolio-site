const assert=require('node:assert/strict');
const T=require('./template-model.js');
let m=T.fromText('A white dress in a forest.');
m=T.addVariable(m,'outfit','服装',['white dress','black coat']);
m=T.replaceRange(m,2,13,'outfit');
assert.equal(T.render(m),'A white dress in a forest.');
m=T.select(m,'outfit',1);
assert.equal(T.render(m),'A black coat in a forest.');
assert.throws(()=>T.replaceRange(m,0,14,'outfit'),/plain-text segment/);
assert.equal(T.render(T.legacySnapshot({semantic:{subject:'cat',environment:'room'}})),'cat. room.');
assert.throws(()=>T.addVariable(m,'outfit','duplicate',['x']),/unique/);
console.log('template model tests PASS');

assert.throws(()=>T.addVariable(T.fromText('x'),'empty','Empty',[]),/at least one option/);
assert.throws(()=>T.normalize({segments:[{type:'variable',ref:'x'}],variables:{x:{options:[]}}}),/at least one option/);

assert.throws(()=>T.addVariable(T.fromText('x'),'constructor','Reserved',['x']),/unique/);
assert.throws(()=>T.normalize({segments:[],variables:{constructor:{options:['x']}}}),/Invalid variable ID/);
