/* Run locally: node --test tools/prompt-studio/v2-browser.test.cjs
 * Requires playwright installed in the caller's existing test environment.
 * No GitHub Actions, deployment, or production storage modification.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
let chromium;try{({chromium}=require('playwright'));}catch{throw new Error('Playwright is required for browser E2E. Install only in an approved test environment.');}
const url='file://'+path.resolve(__dirname,'v2-phase3.html');
test('v2 browser editing, local persistence and reload',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  await page.goto(url);
  await page.locator('#source').fill('A white dress in a forest.');
  await page.locator('#source').evaluate(el=>{el.focus();el.setSelectionRange(2,13);el.dispatchEvent(new Event('select',{bubbles:true}));});
  page.on('dialog',async dialog=>{await dialog.accept(dialog.message().includes('候補')?'white dress\nblack coat':'outfit');});
  await page.locator('#mark').click();
  assert.equal(await page.locator('#parts select').count(),1);
  await page.locator('#parts select').selectOption('1');
  assert.equal(await page.locator('#preview').textContent(),'A black coat in a forest.');
  await page.locator('#profile').selectOption('sdxl-tags');
  await page.locator('#negative').fill('blurry');
  await page.reload();
  assert.equal(await page.locator('#profile').inputValue(),'sdxl-tags');
  assert.equal(await page.locator('#negative').inputValue(),'blurry');
  assert.equal(await page.locator('#preview').textContent(),'A black coat in a forest.');
 }finally{await browser.close();}
});
