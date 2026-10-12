import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const get=path=>readFile(new URL(path,import.meta.url),'utf8');
test('release script/style paths are exact filenames distinct from v0.3 cache',async()=>{
 const [page,worker,pack]=await Promise.all([get('../index.html'),get('../service-worker.js'),get('../package.json')]);
 const version=JSON.parse(pack).version;
 assert.equal(version,'0.7.0');
 const js='assets/main-v'+version+'.js',css='style-v'+version+'.css';
 assert.ok(page.includes('./'+js));
 assert.ok(page.includes('./'+css));
 assert.ok(worker.includes("'./"+js+"'"));
 assert.ok(worker.includes("'./"+css+"'"));
 assert.ok(!worker.includes('ignoreSearch:true'));
 assert.ok(!worker.includes('main.js?v=0.2.0'));
 assert.ok(!worker.includes('style.css?v=0.2.0'));
 for(const name of [js,css])assert.ok((await stat(new URL('../'+name,import.meta.url))).size>0);
});
