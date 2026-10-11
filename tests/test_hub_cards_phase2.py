"""Phase 2 card medals and updates. Disposable storage, mocked update workers."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
HUB=ROOT/'adrian-hub'
class Silent(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Silent,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL='http://127.0.0.1:'+str(server.server_port)+'/adrian-hub/'
apps=json.loads((HUB/'apps.json').read_text(encoding='utf8'))
versions=json.loads((HUB/'versions.json').read_text(encoding='utf8'))
# Existing public version is made same-origin for the isolated test server.
fixture_apps=json.loads(json.dumps(apps))
for entry in fixture_apps['apps']:
 if entry['id']=='english':entry['url']='../adaptive-english/'
def external(route):
 import urllib.parse
 path=ROOT/'adrian-core'/urllib.parse.urlparse(route.request.url).path.removeprefix('/adrian-core/')
 if path.name=='adrian-sync.js':route.fulfill(status=200,content_type='application/javascript',body='')
 elif path.is_file():route.fulfill(path=str(path))
 else:route.fulfill(status=404)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox','--disable-web-security'])
  for width in (360,390,412,1280):
   c=browser.new_context(viewport={'width':width,'height':844},service_workers='block')
   page=c.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   english={'sessionHistory':[{'correct':13,'total':15},{'correct':14,'total':15}]+[{'correct':15,'total':15} for _ in range(5)]}
   page.add_init_script("localStorage.setItem('adaptive_english_campaign1_v1',"+json.dumps(json.dumps(english))+");")
   page.route('**/adrian-core/**',external)
   page.route('**/api.open-meteo.com/**',lambda r:r.fulfill(status=503))
   page.goto(URL,wait_until='domcontentloaded')
   page.wait_for_function("""()=>document.querySelectorAll('.hub-card-medals').length===7 && document.querySelectorAll('.hub-card-update').length===7""",timeout=25000)
   expected=page.evaluate("""()=>{
     const english=document.querySelector('[data-id="english"]');
     const badge=k=>english.querySelector('[data-medal="'+k+'"]');
     const unknown=document.querySelector('[data-id="phrasal-verbs"]');
     return {blue:badge('blue').dataset.count,violet:badge('violet').dataset.count,
       gold:badge('gold').dataset.count,star:badge('star').dataset.count,
       unknownBlue:unknown.querySelector('[data-medal="blue"]').dataset.count,
       unknownGold:unknown.querySelector('[data-medal="gold"]').dataset.count,
       globalStar:document.querySelector('#hubStarCount').textContent,
       total:document.querySelectorAll('.hub-card-medals').length,
       updates:document.querySelectorAll('.hub-card-update').length,
       nonGame:!!document.querySelector('[data-id="biblioteca"] .hub-card-medals'),
       pending:[...document.querySelectorAll('.hub-card-update[data-state="pending"]')].length,
       overflow:document.documentElement.scrollWidth>innerWidth}
   }""")
   assert expected['blue']=='1' and expected['violet']=='1' and expected['gold']=='5' and expected['star']=='1',(width,expected)
   assert expected['unknownBlue']=='unknown' and expected['unknownGold']=='0',(width,expected)
   assert expected['globalStar']=='1' and expected['total']==7 and expected['updates']==7,(width,expected)
   assert not expected['nonGame'] and not expected['overflow'] and not errors,(width,expected,errors)
   # Force synthetic positive cache evidence to test pending label, never claim unknown.
   page.evaluate("""()=>{
     versionAudit.english={ok:true,pending:true,installed:'stale',type:'cache'};
     window.dispatchEvent(new CustomEvent('hub:version-audit',{detail:{id:'english'}}));
   }""")
   page.wait_for_function("""()=>document.querySelector('[data-update-app="english"]')?.dataset.state==='pending'""")
   if width in (390,1280):page.screenshot(path=str(HUB/'tests'/f'hub-phase2-{width}.png'),full_page=True)
   print('PASS medals',width,'all levels, unknown vs zero, no overflow, pending evidence',flush=True)
   c.close()
  # The isolated individual updater must call only the selected application's SW.
  c=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script("""(()=>{
    window.__registeredWorkerUpdates=[];
    Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{
      register:async url=>{window.__registeredWorkerUpdates.push(url);return{installing:null,waiting:null,active:{state:'activated'},update:async()=>{}};}
    }});
    localStorage.setItem('adaptive_english_campaign1_v1',JSON.stringify({sessionHistory:[{correct:15,total:15}]}));
  })()""")
  page.route('**/adrian-core/**',external)
  page.route('**/api.open-meteo.com/**',lambda r:r.fulfill(status=503))
  page.route('**/apps.json*',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps(fixture_apps)))
  page.route('**/versions.json*',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps(versions)))
  page.route('**/version-verifier.js*',lambda r:r.fulfill(status=200,content_type='application/javascript',body="window.AdrianVersionVerifier={verify:async()=>({ok:true,text:'VERIFICADO',kind:'ok'})};"))
  page.route('**/service-worker.js*',lambda r:r.fulfill(status=200,content_type='application/javascript',body='/* mock SW */'))
  page.goto(URL,wait_until='domcontentloaded')
  page.wait_for_function("""()=>document.querySelectorAll('.hub-card-update').length===7 && document.querySelector('[data-update-app="english"]')""",timeout=25000)
  before=page.evaluate("localStorage.getItem('adaptive_english_campaign1_v1')")
  page.locator('[data-update-app="english"]').click()
  page.wait_for_function("""()=>document.querySelector('[data-update-app="english"]')?.dataset.state==='prepared'""",timeout=16000)
  update=page.evaluate("""()=>({
   urls:window.__registeredWorkerUpdates,
   state:document.querySelector('[data-update-app="english"]').dataset.state,
   label:document.querySelector('[data-update-app="english"] .hub-card-update-label').textContent,
   medals:document.querySelector('[data-id="english"] [data-medal="gold"]').dataset.count,
   history:localStorage.getItem('adaptive_english_campaign1_v1')
  })""")
  assert update['history']==before and update['medals']=='1',update
  assert any('adaptive-english' in u and 'hub_update' in u for u in update['urls']),update
  assert not any('b2-multiple-choice-cloze' in u for u in update['urls']),update
  assert update['state']=='prepared' and not errors,(update,errors)
  print('PASS individual update: isolated worker prepared; stored results intact',flush=True)
  c.close();browser.close()
finally:server.shutdown()
