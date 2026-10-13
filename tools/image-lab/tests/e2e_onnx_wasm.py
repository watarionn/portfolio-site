from qa_origin import qa_url
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
import sys,os
sys.stdout.reconfigure(encoding='utf-8',errors='replace')
o=Options();o.binary_location=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
for a in ['--headless=new','--disable-gpu','--enable-unsafe-swiftshader','--no-first-run']:o.add_argument(a)
d=webdriver.Edge(options=o)
try:
 d.set_window_size(1280,900)
 d.get(qa_url())
 w=WebDriverWait(d,40);w.until(lambda d:'完了' in d.find_element(By.ID,'status').text)
 d.find_element(By.ID,'capabilityLab').click()
 d.execute_script("const x=document.getElementById('capLibrary');x.value='onnx';x.dispatchEvent(new Event('change',{bubbles:true}));")
 d.execute_script("const x=document.getElementById('capCapability');x.value='webgpu';x.dispatchEvent(new Event('change',{bubbles:true}));")
 assert not d.find_element(By.ID,'capRun').is_enabled()
 print('ONNX_WEBGPU_EXCLUDED_PASS',d.find_element(By.ID,'capStatus').text,flush=True)
 d.execute_script("const x=document.getElementById('capCapability');x.value='wasm';x.dispatchEvent(new Event('change',{bubbles:true}));")
 d.find_element(By.ID,'capRun').click()
 WebDriverWait(d,120).until(lambda x:x.find_element(By.ID,'capRun').is_enabled())
 rows=[e.text for e in d.find_elements(By.CSS_SELECTOR,'#capHistory .cap-history-row')]
 print('ONNX_WASM_RUN_RESULT',rows,flush=True)
 assert any('PASS ' in x for x in rows),rows
finally:d.quit()
