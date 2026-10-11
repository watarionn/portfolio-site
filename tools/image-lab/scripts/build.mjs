import {build} from 'esbuild';
import {readdir,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';
const out='assets';
// Remove only prior hashed chunks emitted by this app, never vendor files.
for(const file of await readdir(out))if(/^chunk-[A-Z0-9]+\.js$/.test(file))await unlink(path.join(out,file));
const result=await build({
 entryPoints:['src/main.js'],
 outdir:out,entryNames:'main',chunkNames:'chunk-[hash]',assetNames:'asset-[name]-[hash]',
 bundle:true,splitting:true,format:'esm',minify:true,target:['es2021'],platform:'browser',
 logLevel:'info',metafile:true
});
await writeFile('.build-meta.json',JSON.stringify(result.metafile));
console.log('BUNDLE_OUTPUTS',Object.keys(result.metafile.outputs).join(' | '));
