import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const get=path=>readFile(new URL(path,import.meta.url),'utf8');

test('v0.6.2 retains full-sized RESULT canvas and compact mobile source preview',async()=>{
 const [page,styles,code]=await Promise.all([get('../index.html'),get('../style.css'),get('../src/main.js')]);
 assert.match(page,/id="comparePreview"/);
 assert.ok(page.indexOf('class="result-preview"')>=0 && page.indexOf('<canvas id="result"')>page.indexOf('class="result-preview"'));
 assert.match(page,/id="sourceExpandButton"/);
 assert.match(styles,/\.compare\{display:flex;flex-direction:column/);
 assert.match(styles,/#result\{width:100%;height:auto/);
 assert.match(styles,/\.compare \.original-preview \.canvas-frame\{order:0;flex:0 0 112px/);
 assert.match(code,/source-expanded/);
});
test('effects and layer decomposer are separate, non-destructive control views',async()=>{
 const [page,styles,code]=await Promise.all([get('../index.html'),get('../style.css'),get('../src/main.js')]);
 for(const id of ['effectViewButton','layersViewButton','effectSection','tuneSection','layerSection'])assert.ok(page.includes('id="'+id+'"'));
 assert.match(styles,/\.controls\[data-view="effects"\] #layerSection/);
 assert.match(styles,/\.controls\[data-view="layers"\] #effectSection/);
 assert.match(styles,/\.controls\[data-view="layers"\] #tuneSection/);
 assert.match(code,/view==='effects'&&layerController\?\.active\(\)/);
 assert.match(code,/showControlView\('effects'\);updateStackUI\(\)/);
});
