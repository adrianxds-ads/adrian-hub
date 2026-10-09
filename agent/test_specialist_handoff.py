"""Constructor/Editor browser acceptance; execution requests blocked."""
import argparse,importlib.util,threading,sys
from pathlib import Path
from http.server import ThreadingHTTPServer
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from triage_agent import route
sys.stdout.reconfigure(encoding='utf-8')
p=argparse.ArgumentParser();p.add_argument('--bridge',required=True);p.add_argument('--base-url');a=p.parse_args()
s=importlib.util.spec_from_file_location('bridge_specialists',a.bridge);b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
server=None;base=(a.base_url or 'http://127.0.0.1:18881').rstrip('/')
if not a.base_url:
 server=ThreadingHTTPServer(('127.0.0.1',18881),b.Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='chrome',headless=True)
  for width,height in ((390,844),(1280,800)):
   c=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
   c.add_init_script("navigator.clipboard.writeText=async text=>{window.__copied=text;}")
   errors=[];posts=[]
   def intercept(r):
    path=urlparse(r.request.url).path
    if r.request.method=='POST':
     posts.append(path)
     if path.endswith('/triage'):r.fulfill(json={'triage':route(r.request.post_data_json['request'])});return
     r.abort();raise AssertionError('Unexpected execution request '+path)
    if '/ui/' in path:r.continue_()
    else:r.fulfill(json={'ok':True})
   c.route('**/dc-inbox/agents/**',intercept)
   page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+'/dc-inbox/agents/ui/',wait_until='networkidle')
   for role,brief,source,criteria in (
    ('constructor','Crea una app nueva para vocabulario','Proyecto de prueba aislado; index.html y app.js','Añadir y buscar palabras; conservarlas al recargar'),
    ('editor','Corrige este texto con mi voz','El museo presenta una exposición. <script>test</script>','Conservar hechos y estructura; corregir puntuación')):
    page.locator('#triageRequest').fill(brief);page.locator('#triageBtn').click()
    page.wait_for_function("document.querySelector('#triageGo').dataset.target==='"+role+"'")
    page.locator('#triageGo').click()
    assert page.locator('#'+role+'Brief').input_value()==brief
    assert page.locator('#'+role+'Copy').is_disabled()
    page.locator('#'+role+'Source').fill(source);page.locator('#'+role+'Criteria').fill(criteria)
    page.reload(wait_until='networkidle')
    for suffix,value in (('Brief',brief),('Source',source),('Criteria',criteria)):
     assert page.locator('#'+role+suffix).input_value()==value
    page.locator('#'+role+'Form button').click()
    packet=page.locator('#'+role+'Packet').input_value()
    for value in (brief,source,criteria,'Sin nuevas llamadas'):assert value in packet
    page.locator('#'+role+'Copy').click();page.wait_for_function('!!window.__copied')
    assert page.evaluate('window.__copied')==packet
    page.evaluate("()=>{navigator.clipboard.writeText=async()=>{throw Error('blocked')};}")
    page.locator('#'+role+'Copy').click()
    assert 'Copia automática no disponible' in page.locator('#'+role+'Note').inner_text()
    page.evaluate("()=>{navigator.clipboard.writeText=async text=>{window.__copied=text};}")
    page.locator('#'+role+'Brief').fill(brief+' actualizado')
    assert page.locator('#'+role+'Copy').is_disabled()
    page.locator('#'+role+'Form button').click()
    page.route('https://adrianxds-ads.github.io/adrian-hub/chatgpt.html',lambda req:req.fulfill(body='<html>ChatGPT handoff</html>',content_type='text/html'))
    page.locator('#'+role+'Continue').click()
    page.wait_for_url('**/chatgpt.html')
    page.goto(base+'/dc-inbox/agents/ui/',wait_until='networkidle')
    assert page.locator('#'+role+'Brief').input_value()==brief+' actualizado'
   assert all(x.endswith('/triage') for x in posts)
   assert not errors,errors
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.locator('[data-agent="constructor"]').screenshot(path=str(Path(__file__).parent/'runs'/('constructor-'+str(width)+'.png')))
   page.locator('[data-agent="editor"]').screenshot(path=str(Path(__file__).parent/'runs'/('editor-'+str(width)+'.png')))
   print('PASS',width,'routing, required inputs, reload, full escaped packet, clipboard fallback, stale packet blocked; no execution/API')
   c.close()
  browser.close()
finally:
 if server:server.shutdown();server.server_close()
