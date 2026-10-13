from qa_origin import qa_url
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
import os,json,sys,time
sys.stdout.reconfigure(encoding='utf-8',errors='backslashreplace')
o=Options()
o.binary_location=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
for a in ['--headless=new','--disable-gpu','--enable-unsafe-swiftshader','--no-first-run','--disable-extensions']:o.add_argument(a)
d=webdriver.Edge(options=o)
try:
 d.set_window_size(1200,900)
 d.get(qa_url())
 w=WebDriverWait(d,90)
 w.until(lambda x:'完了' in x.find_element(By.ID,'status').text)
 # Synthetic, copyright-free validation stimulus, not an accuracy benchmark.
 d.execute_script("""
 const c=document.getElementById('source');
 c.width=512;c.height=512;
 const g=c.getContext('2d');g.fillStyle='#f8edf0';g.fillRect(0,0,512,512);
 g.fillStyle='#37445c';g.beginPath();g.ellipse(256,235,142,210,0,0,Math.PI*2);g.fill();
 g.fillStyle='#f7c7ac';g.beginPath();g.ellipse(256,255,102,132,0,0,Math.PI*2);g.fill();
 g.fillStyle='#5a6d98';g.beginPath();g.moveTo(45,512);g.quadraticCurveTo(100,370,192,380);
 g.lineTo(320,380);g.quadraticCurveTo(420,370,480,512);g.fill();
 g.fillStyle='#37445c';g.beginPath();g.moveTo(136,135);g.quadraticCurveTo(220,12,348,98);
 g.quadraticCurveTo(360,165,263,180);g.quadraticCurveTo(195,205,139,179);g.fill();
 g.fillStyle='white';for(const x of [216,296]){g.beginPath();g.ellipse(x,260,21,27,0,0,Math.PI*2);g.fill();}
 g.fillStyle='#516b9b';for(const x of [216,296]){g.beginPath();g.ellipse(x,264,10,19,0,0,Math.PI*2);g.fill();}
 g.fillStyle='#c3677b';g.beginPath();g.ellipse(256,329,20,4,0,0,Math.PI*2);g.fill();
 """)
 baseline=d.execute_script("return document.getElementById('source').toDataURL()")
 d.find_element(By.ID,'layersViewButton').click()
 d.execute_script("""let m=document.getElementById('layerMode');m.value='anime';m.dispatchEvent(new Event('change',{bubbles:true}));""")
 d.find_element(By.ID,'decomposeButton').click()
 w.until(lambda x:x.find_element(By.ID,'decomposeButton').is_enabled())
 animeStatus=d.find_element(By.ID,'status').text
 animeMeta=d.find_element(By.ID,'layerMeta').text
 print('ANIME_RESULT',repr(animeStatus),repr(animeMeta),flush=True)
 assert '失敗' not in animeStatus,animeStatus
 assert d.execute_script("return document.getElementById('source').toDataURL()")==baseline
 d.execute_script("""let m=document.getElementById('layerMode');m.value='compare';m.dispatchEvent(new Event('change',{bubbles:true}));""")
 started=time.monotonic()
 d.find_element(By.ID,'decomposeButton').click()
 w.until(lambda x:x.find_element(By.ID,'decomposeButton').is_enabled())
 status=d.find_element(By.ID,'status').text
 info=d.find_element(By.ID,'semanticCompareInfo').text
 print('COMPARE_RESULT',repr(status),repr(info),'wall_sec',round(time.monotonic()-started,2),flush=True)
 assert 'AI比較完了' in status,status
 assert not d.find_element(By.ID,'semanticCompare').get_attribute('hidden')
 active=[d.find_element(By.ID,'semanticUsePhoto').is_enabled(),d.find_element(By.ID,'semanticUseAnime').is_enabled()]
 print('SELECTABLE',active,flush=True)
 assert any(active),'neither model produced labels'
 selected='semanticUseAnime' if active[1] else 'semanticUsePhoto'
 d.find_element(By.ID,selected).click()
 assert d.find_element(By.ID,'layerResults').is_displayed()
 assert d.find_element(By.ID,'semanticCompare').get_attribute('hidden') is not None
 assert d.execute_script("return document.getElementById('source').toDataURL()")==baseline
 print('COMPARE_CHOICE_PASS',selected,'LAYER_ROWS',len(d.find_elements(By.CSS_SELECTOR,'#layerList .layer-row')),flush=True)
 for width,height in [(375,667),(390,844),(768,1024)]:
  d.execute_cdp_cmd('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':2,'mobile':True})
  met=d.execute_script('return {inner:innerWidth,scroll:document.documentElement.scrollWidth}')
  assert met['scroll']<=width+1,met
  print('MOBILE_PASS',width,met,flush=True)
finally:
 d.quit()
