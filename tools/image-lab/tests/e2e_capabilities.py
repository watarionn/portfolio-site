from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json,sys,os
sys.stdout.reconfigure(encoding='utf-8',errors='backslashreplace')
opts=Options()
opts.binary_location=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
for flag in ['--headless=new','--disable-gpu','--enable-unsafe-swiftshader','--no-first-run','--disable-extensions']:opts.add_argument(flag)
d=webdriver.Edge(options=opts)
try:
 d.set_window_size(1320,980)
 d.get(os.getenv('IMAGE_LAB_QA_URL','http://127.0.0.1:29790/index.html'))
 wait=WebDriverWait(d,35)
 wait.until(lambda x:'完了' in x.find_element(By.ID,'status').text)
 d.find_element(By.ID,'capabilityLab').click()
 baseline=d.execute_script("return document.getElementById('source').toDataURL()")
 wait.until(EC.element_to_be_clickable((By.ID,'capRunAll')))
 libs=d.execute_script("return Array.from(document.getElementById('capLibrary').options,o=>o.value)")
 print('CATALOG_LIBRARIES',len(libs),json.dumps(libs),flush=True)
 failures=[]
 for lib in libs:
  if lib == 'onnx':continue
  d.execute_script("const s=document.getElementById('capLibrary');s.value=arguments[0];s.dispatchEvent(new Event('change',{bubbles:true}));",lib)
  b=d.find_element(By.ID,'capRunAll')
  assert b.is_enabled(),lib
  b.click()
  WebDriverWait(d,100).until(lambda x:x.find_element(By.ID,'capRunAll').is_enabled())
  rows=[e.text for e in d.find_elements(By.CSS_SELECTOR,'#capHistory .cap-history-row')]
  ok=sum('PASS ' in x for x in rows)
  bad=[x for x in rows if 'FAIL:' in x]
  failures += [(lib,x) for x in bad]
  print('API_TRIAL',lib,ok,'/',len(rows),'failures',json.dumps(bad,ensure_ascii=False),flush=True)
 # ONNX will run separately after checking model + WASM path.
 print('TOTAL_FAILURES',len(failures),json.dumps(failures,ensure_ascii=False),flush=True)
 assert not failures, failures
 assert d.execute_script("return document.getElementById('source').toDataURL()") == baseline, 'Image Lab original changed'
 d.execute_script("const s=document.getElementById('capLibrary');s.value='onnx';s.dispatchEvent(new Event('change',{bubbles:true}));")
 print('ONNX_STATUS',d.find_element(By.ID,'capStatus').text,flush=True)
 # Check responsiveness on the same page with mobile emulation.
 for width,height in [(390,844),(375,667),(768,1024)]:
  d.execute_cdp_cmd('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':2,'mobile':True})
  metrics=d.execute_script("return {w:innerWidth,scroll:document.documentElement.scrollWidth,preview:Math.round(document.getElementById('result').getBoundingClientRect().width)}")
  assert metrics['scroll']<=width+1,(width,metrics)
  print('MOBILE_CAPABILITY_LAYOUT_PASS',width,json.dumps(metrics),flush=True)
finally:
 d.quit()
