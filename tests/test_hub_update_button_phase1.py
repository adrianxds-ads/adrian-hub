"""The relocated Update All button must invoke the real existing update workflow.
Disposable browser with stubbed service workers and a tiny synthetic registry.
"""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[2]; HUB=ROOT/'adrian-hub'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
catalog=json.loads((HUB/'versions.json').read_text(encoding='utf8'))
catalog['apps']=[x for x in catalog['apps'] if x['id'] in ('english','biblioteca')]
registry=json.loads((HUB/'apps.json').read_text(encoding='utf8'))
registry['apps']=[x for x in registry['apps'] if x['id'] in ('english','biblioteca')]
for app in registry['apps']:
 if app['id']=='english':app['url']='../adaptive-english/' # same-origin fixture; live URLs remain unchanged
base=f'http://127.0.0.1:{server.server_port}/adrian-hub/'
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--disable-web-security','--no-sandbox'])
  context=b.new_context(service_workers='block',viewport={'width':390,'height':844})
  page=context.new_page();errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  # Stub service worker in this fresh browser only, never touching user apps.
  page.add_init_script("""(() => {
   window.__registeredWorkerUpdates=[];
   Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{
      register:async function(url){window.__registeredWorkerUpdates.push(url);return {installing:null,waiting:null,active:{state:'activated'},update:async()=>{}};}
   }});
  })()""")
  page.route('**/apps.json*',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps(registry)))
  page.route('**/versions.json*',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps(catalog)))
  page.route('**/version-verifier.js*',lambda route:route.fulfill(status=200,content_type='application/javascript',body="window.AdrianVersionVerifier={verify:async()=>({ok:true,text:'VERIFICADO',kind:'ok'})};"))
  def core(route):
   import urllib.parse
   path=ROOT/'adrian-core'/urllib.parse.urlparse(route.request.url).path.removeprefix('/adrian-core/')
   if path.name=='adrian-sync.js':route.fulfill(status=200,content_type='application/javascript',body='')
   else:route.fulfill(path=str(path)) if path.is_file() else route.fulfill(status=404)
  page.route('**/adrian-core/**',core)
  page.route('**/api.open-meteo.com/**',lambda route:route.fulfill(status=503))
  page.route('**/service-worker.js*',lambda route:route.fulfill(status=200,content_type='application/javascript',body='/* test worker */'))
  page.goto(base,wait_until='domcontentloaded',timeout=25000)
  page.wait_for_selector('#groups .app',state='attached')
  page.wait_for_function("""()=>document.querySelectorAll('#groups .app').length===2""")
  assert page.locator('#updateAllVersionsBtn').count()==1
  assert page.locator('#versionCenter').evaluate('(e)=>e.open') is False
  page.wait_for_function("""()=>!document.querySelector('#updateAllVersionsBtn').disabled""",timeout=20000)
  page.locator('#updateAllVersionsBtn').click()
  page.wait_for_function("""()=>document.querySelector('#updateHeadline').textContent==='Actualización preparada'""",timeout=20000)
  state=page.evaluate("""()=>({
   headline:document.querySelector('#updateHeadline').textContent,
   registered:window.__registeredWorkerUpdates,
   last:localStorage.getItem('adrian_hub_update_state_v1'),
   enabled:!document.querySelector('#updateAllVersionsBtn').disabled,
   detailsOpen:document.querySelector('#versionCenter').open
  })""")
  assert len(state['registered'])>=2,state
  assert any('adaptive-english' in x for x in state['registered']),state
  assert state['enabled'] and not state['detailsOpen'],state
  assert json.loads(state['last'])['failed']==0,state
  assert not errors,errors
  print('PASS action: Update All prepared fake app+Hub workers; result visible without expanding details')
  context.close();b.close()
finally:server.shutdown()
