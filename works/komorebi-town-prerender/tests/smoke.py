"""Browser acceptance and mobile-cost smoke. Run locally with Playwright Chromium."""
import asyncio, sys, pathlib, json, os
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
URL='https://komorebi.test/'
async def main():
    async with async_playwright() as p:
      browser=await p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_BIN','/usr/bin/chromium'),args=['--no-sandbox'])
      for name,viewport,mobile in [('iphone',{'width':390,'height':844},True),('desktop',{'width':1260,'height':810},False),('small',{'width':320,'height':568},True)]:
        context=await browser.new_context(viewport=viewport,is_mobile=mobile,has_touch=mobile,device_scale_factor=3 if mobile else 1)
        page=await context.new_page();errors=[];failed=[]
        async def intercept(route):
          import mimetypes
          path=route.request.url.split('komorebi.test/')[-1].split('?')[0]
          asset=(ROOT/'public'/path).resolve()
          if path.startswith('assets/') and asset.is_file() and str(asset).startswith(str(ROOT/'public')):
            await route.fulfill(status=200,body=asset.read_bytes(),content_type='image/webp')
          else:await route.fulfill(status=404,body=b'not found')
        await page.route('**/*',intercept)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('requestfailed',lambda r:failed.append(r.url))
        html=(ROOT/'public/index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://komorebi.test/">',1)
        await page.set_content(html,wait_until='networkidle')
        await page.wait_for_function("document.querySelector('#loading')?.classList.contains('hidden')",timeout=20000)
        await page.screenshot(path=str(ROOT/f'screenshot-{name}.png'))
        canvas=await page.locator('canvas').evaluate('(e)=>({width:e.width,height:e.height})')
        loaded=await page.evaluate('()=>performance.getEntriesByType("resource").filter(x=>x.name.includes(".webp")).length')
        assert loaded==12,(name,loaded)
        if mobile:
          assert await page.locator('.pad').is_visible()
          await page.locator('[data-dir="right"]').first.tap()
          await page.wait_for_timeout(190)
          await page.locator('#action').click()
        else:
          await page.keyboard.down('ArrowDown');await page.wait_for_timeout(500);await page.keyboard.up('ArrowDown')
          await page.mouse.click(580,430)
        await page.locator('#mapToggle').click()
        assert await page.locator('#mapPanel').is_visible()
        await page.locator('[data-place="library"]').click()
        assert not await page.locator('#mapPanel').is_visible()
        await page.wait_for_timeout(300)
        assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),name
        assert not errors,(name,errors)
        assert not failed,(name,failed)
        print(json.dumps({'viewport':name,'canvas':canvas,'webpRequests':loaded,'pageErrors':len(errors),'failedRequests':len(failed),'mapNavigation':'PASS'},ensure_ascii=False))
        await context.close()
      await browser.close()
    print('PRERENDER_BROWSER_SMOKE_PASS')
asyncio.run(main())
