import {build} from 'esbuild';
import {writeFile,copyFile,readFile} from 'node:fs/promises';
import path from 'node:path';
const out='assets';
// Keep previously published hashed chunks: older versioned entrypoints still
// reference them. Removing these chunks would break rollback/offline clients.
// Orphan cleanup requires a separate reference-graph audit.

const result=await build({
 entryPoints:['src/main.js'],
 outdir:out,entryNames:'main',chunkNames:'chunk-[hash]',assetNames:'asset-[name]-[hash]',
 bundle:true,splitting:true,format:'esm',minify:true,target:['es2021'],platform:'browser',
 logLevel:'info',metafile:true
});
await writeFile('.build-meta.json',JSON.stringify(result.metafile));
console.log('BUNDLE_OUTPUTS',Object.keys(result.metafile.outputs).join(' | '));

// Each release has distinct app-shell URLs, so an old service worker using
// cache.match(ignoreSearch:true) cannot return stale JavaScript to a newer UI.
const version=JSON.parse(await readFile('package.json','utf8')).version;
await copyFile('assets/main.js','assets/main-v'+version+'.js');
await copyFile('style.css','style-v'+version+'.css');
console.log('VERSIONED_APP_SHELL',version);
