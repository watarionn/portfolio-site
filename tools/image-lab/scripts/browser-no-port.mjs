#!/usr/bin/env node
// Local Image Lab browser smoke without HTTP servers or any listening port.
// Chrome DevTools communicates over anonymous pipes, not a TCP socket.
// A synthetic HTTPS origin is fulfilled exclusively from this checkout.
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const origin = 'https://image-lab-preview.invalid';
const entry = origin + '/image-lab/';
const windowsEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserPath = process.env.IMAGE_LAB_BROWSER || (
  existsSync(windowsEdge) ? windowsEdge :
  ['/usr/bin/microsoft-edge', '/usr/bin/chromium', '/usr/bin/google-chrome'].find(existsSync)
);
if (!browserPath) {
  console.error('NO_PORT_BROWSER_UNAVAILABLE: set IMAGE_LAB_BROWSER to Edge/Chrome path');
  process.exit(2);
}
const mime = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json', '.webmanifest':'application/manifest+json',
  '.wasm':'application/wasm', '.onnx':'application/octet-stream',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2',
  '.md':'text/plain; charset=utf-8'
};
const previewSelfTest = process.argv.includes('--preview-smoke');
const previewMode = process.argv.includes('--preview') || previewSelfTest;
const profile = await mkdtemp(join(tmpdir(), 'image-lab-pipe-'));
const browser = spawn(browserPath, [
  ...(previewMode && !previewSelfTest ? [] : ['--headless=new']), '--disable-gpu', '--disable-extensions',
  '--disable-background-networking', '--no-first-run', '--no-default-browser-check',
  '--no-proxy-server', '--no-pings', '--no-service-autorun',
  '--remote-debugging-pipe', '--user-data-dir=' + profile,
  'about:blank'
], {stdio:['ignore','ignore','pipe','pipe','pipe'], windowsHide:true});
const requests = new Map();
const errors = [];
let nextId = 0;
let buffer = '';
let sessionId = null;
let previewTargetId = null;
let closePreview = null;
browser.stdio[2].on('data', () => {}); // Drain diagnostics without emitting profile details.

function send(method, params = {}, session = undefined) {
  return new Promise((yes, no) => {
    if (!browser.stdio[3].writable) return no(new Error('CDP pipe not writable'));
    const id = ++nextId;
    const timeout = setTimeout(() => {
      requests.delete(id);
      no(new Error('CDP timed out: ' + method));
    }, 30000);
    requests.set(id, {yes, no, timeout});
    const message = {id, method, params};
    if (session) message.sessionId = session;
    browser.stdio[3].write(JSON.stringify(message) + '\0');
  });
}
async function respond(event) {
  const url = event.params.request.url;
  const id = event.params.requestId;
  const target = new URL(url);
  if (target.origin !== origin || !target.pathname.startsWith('/image-lab/')) {
    errors.push('BLOCKED_NON_LOCAL_REQUEST: ' + target.origin + target.pathname);
    await send('Fetch.failRequest', {requestId:id,errorReason:'BlockedByClient'}, event.sessionId);
    return;
  }
  let requested;
  try {requested = decodeURIComponent(target.pathname.slice('/image-lab/'.length));}
  catch {requested = '__invalid_path__';}
  if (requested === '') requested = 'index.html';
  const filename = resolve(root, requested);
  if (filename !== root && !filename.startsWith(root + sep)) {
    errors.push('REJECTED_PATH: ' + requested);
    await send('Fetch.failRequest', {requestId:id,errorReason:'BlockedByClient'}, event.sessionId);
    return;
  }
  let data;
  try {data = await readFile(filename);}
  catch {
    errors.push('MISSING_ASSET: ' + requested);
    await send('Fetch.fulfillRequest', {requestId:id,responseCode:404,body:Buffer.from('Not Found').toString('base64')},event.sessionId);
    return;
  }
  await send('Fetch.fulfillRequest', {
    requestId:id,responseCode:200,
    responseHeaders:[{name:'Content-Type', value:mime[extname(filename).toLowerCase()] || 'application/octet-stream'},
      {name:'Cache-Control',value:'no-store'},
      {name:'Access-Control-Allow-Origin',value:origin}],
    body:data.toString('base64')
  }, event.sessionId);
}
browser.stdio[4].on('data', chunk => {
  buffer += chunk.toString('utf8');
  for (let cut; (cut = buffer.indexOf('\0')) >= 0;) {
    const raw = buffer.slice(0, cut);
    buffer = buffer.slice(cut + 1);
    if (!raw) continue;
    let msg;
    try {msg = JSON.parse(raw);}
    catch {errors.push('Malformed DevTools response'); continue;}
    if (msg.id !== undefined) {
      const op = requests.get(msg.id);
      if (!op) continue;
      requests.delete(msg.id); clearTimeout(op.timeout);
      if (msg.error) op.no(new Error(msg.error.message));
      else op.yes(msg.result || {});
    } else if (msg.method === 'Fetch.requestPaused') {
      void respond(msg).catch(e => errors.push('Fetch handler: ' + e.message));
    } else if (msg.method === 'Target.targetDestroyed' && msg.params.targetId === previewTargetId) {
      closePreview?.();
    } else if (msg.method === 'Runtime.exceptionThrown') {
      errors.push('Browser exception: ' + (msg.params.exceptionDetails.text || 'unknown'));
    }
  }
});
browser.once('exit', (code) => {
  closePreview?.();
  for (const op of requests.values()) {clearTimeout(op.timeout);op.no(new Error('Browser exited: ' + code));}
  requests.clear();
});
const wait = ms => new Promise(done => setTimeout(done,ms));
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true},sessionId);
  if(r.exceptionDetails) throw new Error('Browser evaluation failed: ' + r.exceptionDetails.text);
  return r.result?.value;
}
async function until(expression, timeoutMs=15000) {
  const started=Date.now();
  while(Date.now()-started<timeoutMs) {
    if(await evaluate(expression)) return;
    await wait(200);
  }
  throw new Error('Browser smoke timeout for: ' + expression);
}
try {
  await send('Browser.getVersion');
  if (previewMode) await send('Target.setDiscoverTargets', {discover:true});
  const target = await send('Target.createTarget', {url:'about:blank'});
  previewTargetId = target.targetId;
  sessionId = (await send('Target.attachToTarget',{targetId:target.targetId,flatten:true})).sessionId;
  await send('Page.enable',{},sessionId);
  await send('Runtime.enable',{},sessionId);
  await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]},sessionId);
  const result = await send('Page.navigate',{url:entry},sessionId);
  if(result.errorText) throw new Error('Navigation failed: ' + result.errorText);
  await until("document.readyState === 'complete' && !!document.getElementById('sampleButton') && !!document.getElementById('description')?.textContent");
  if (previewMode) {
    console.log('IMAGE_LAB_NO_PORT_PREVIEW_READY: close the browser window to exit');
    console.log('No HTTP server, no localhost listener; temporary isolated browser profile');
    const closed = new Promise(resolve => {closePreview = resolve;});
    if (previewSelfTest) {
      const closedTarget = await send('Target.closeTarget', {targetId:previewTargetId});
      if (!closedTarget.success) throw new Error('Failed to close preview target');
    }
    await closed;
    if (previewSelfTest) console.log('IMAGE_LAB_PORTLESS_PREVIEW_LIFECYCLE_PASS');
  } else {
  await evaluate("document.getElementById('sampleButton').click()");
  await until("document.getElementById('source').getContext('2d').getImageData(0,0,1,1).data[3] > 0 && document.getElementById('status').textContent.includes('完了')");
  const source = await evaluate("document.getElementById('source').toDataURL()");
  await evaluate("document.getElementById('layersViewButton').click()");
  await evaluate("document.getElementById('layerMode').value='color';document.getElementById('decomposeButton').click()");
  await until("!document.getElementById('layerResults').hidden && document.getElementById('decomposeButton').disabled === false");
  const unchanged=await evaluate("document.getElementById('source').toDataURL()");
  if(source !== unchanged) throw new Error('Original canvas modified');
  if(errors.length) throw new Error(errors.join('; ').slice(0,1200));
  console.log('IMAGE_LAB_PORTLESS_BROWSER_PASS: page, module, sample, color decomposition, source unchanged');
  console.log('NO_HTTP_LISTENER_CREATED; devtools_pipe_only=true');
  }
} catch(e) {
  console.error('IMAGE_LAB_PORTLESS_BROWSER_FAIL: ' + e.message);
  if(errors.length) console.error('LOAD_ERRORS: ' + errors.slice(0,12).join(' | '));
  process.exitCode = 1;
} finally {
  try {await send('Browser.close');} catch {}
  if(browser.exitCode === null) {
    await Promise.race([new Promise(done => browser.once('exit',done)), wait(3000)]);
  }
  if(browser.exitCode === null) browser.kill();
  try {await rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:500});}
  catch(e){console.error('Temporary browser profile cleanup failed: ' + e.message);process.exitCode=1;}
}
