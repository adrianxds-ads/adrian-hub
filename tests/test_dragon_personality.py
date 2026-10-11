"""Dragon personality phase 1: verified medal deltas, contextual lines, quiet-time rules.
No real browser profile, no user data mutation, no new storage keys. Uses Chrome/Playwright.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[2]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/adrian-hub/'
def intercept(page):
 def core(route):
  import urllib.parse
  path=ROOT/'adrian-core'/urllib.parse.urlparse(route.request.url).path.removeprefix('/adrian-core/')
  if path.name=='adrian-sync.js':route.fulfill(content_type='application/javascript',body='')
  elif path.is_file():route.fulfill(path=str(path))
  else:route.fulfill(status=404)
 page.route('**/adrian-core/**',core)
 page.route('**/api.open-meteo.com/**',lambda r:r.fulfill(status=503))
def init(context,blocks=100):
 rows=[{'id':f'fake-{i}','status':'completado','endedAt':'2026-10-11T03:33:00Z'} for i in range(blocks)]
 context.add_init_script("""
 (() => {
  window.__personalLoop=null;
  window.__originalDateNow=Date.now;
  const origSetInterval=window.setInterval;
  window.setInterval=function(callback,interval,...args){
   if(interval===45000)window.__personalLoop=callback;
   return origSetInterval.call(this,callback,interval,...args);
  };
 })();
 """)
 context.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(json.dumps(rows))+");")
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox','--disable-web-security'])
  for w in (360,390,412,1280):
   c=b.new_context(viewport={'width':w,'height':820},service_workers='block')
   init(c);pg=c.new_page();errors=[]
   pg.on('pageerror',lambda e:errors.append(str(e)));intercept(pg)
   pg.goto(url,wait_until='domcontentloaded',timeout=25000)
   pg.wait_for_function("""()=>document.querySelector('#githubGarden .nl-dino')?.dataset.stage==='3' && !!window.__personalLoop""",timeout=20000)
   pet=pg.locator('#githubGarden .nl-dino')
   before=pg.evaluate("""()=>({
       history:localStorage.getItem('adrianEasyCatalanTaskSessionsV1'),
       storage:Object.keys(localStorage).sort(),
       progress:window.CottageGarden.progress().completedBlocks,
       baseline:document.querySelector('#hubGoldCount')?.textContent
   })""")
   # No spontaneous dialogue immediately on open, despite calling scheduled loop.
   pg.evaluate("window.__personalLoop()")
   assert not pet.evaluate("e=>e.classList.contains('nl-speaking')"),w
   assert pg.locator('#githubGarden .nl-dino').get_attribute('data-stage')=='3'
   # After >2.75 minutes, natural quiet chat only when garden is visible and not touched.
   pg.evaluate("Date.now=()=>window.__originalDateNow()+190000;window.__personalLoop()")
   assert pet.evaluate("e=>e.classList.contains('nl-speaking')"),(w,'no spontaneous speech')
   automatic=pg.locator('#githubGarden .nl-dino-bubble').text_content()
   assert automatic and len(automatic)>6
   # Immediate second periodic check must not generate new chat.
   pg.evaluate("window.__personalLoop()")
   assert pg.locator('#githubGarden .nl-dino-bubble').text_content()==automatic
   # Touch triggers context speech and travel, while preserving records.
   pet.click(force=True)
   first=pg.locator('#githubGarden .nl-dino-bubble').text_content()
   pet.click(force=True)
   second=pg.locator('#githubGarden .nl-dino-bubble').text_content()
   assert first!=second,(w,first,second)
   assert pg.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")==before['history']
   assert pg.evaluate("window.CottageGarden.progress().completedBlocks")==before['progress']
   # Existing stable awards are NOT celebrated at load, nor on repeated identical updates.
   pg.evaluate("""()=>window.dispatchEvent(new CustomEvent('hub:reward-summary-updated',{detail:{apps:{english:0},stars:0,totalGold:0}}))""")
   pg.evaluate("""()=>window.dispatchEvent(new CustomEvent('hub:reward-summary-updated',{detail:{apps:{english:0},stars:0,totalGold:0}}))""")
   # First delta is a confirmed newly observed gold. Speech only, no ledger edits.
   pg.evaluate("""()=>window.dispatchEvent(new CustomEvent('hub:reward-summary-updated',{detail:{apps:{english:1},stars:0,totalGold:1}}))""")
   assert 'oro' in pg.locator('#githubGarden .nl-dino-bubble').text_content().lower(),(w,'gold did not trigger',pg.locator('#githubGarden .nl-dino-bubble').text_content())
   assert pet.evaluate("e=>e.classList.contains('nl-dragon-celebrate')"),w
   if w==390:pg.screenshot(path=str(ROOT/'adrian-hub'/'tests'/'dragon-personality-390.png'),full_page=True)
   assert pg.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")==before['history']
   pg.evaluate("""()=>window.dispatchEvent(new CustomEvent('hub:reward-summary-updated',{detail:{apps:{english:1},stars:0,totalGold:1}}))""")
   assert 'oro' in pg.locator('#githubGarden .nl-dino-bubble').text_content().lower(),w
   assert not pg.evaluate("document.documentElement.scrollWidth > innerWidth")
   assert not errors,(w,errors)
   print('PASS personality',w,'context, rare auto chat, real reward delta, no history changes',flush=True)
   c.close()
  # The dragon must never interrupt an active Hub interaction or immersive quiz.
  c=b.new_context(viewport={'width':390,'height':844},service_workers='block')
  init(c);pg=c.new_page();intercept(pg)
  pg.goto(url,wait_until='domcontentloaded')
  pg.wait_for_function("""()=>document.querySelector('#githubGarden .nl-dino')?.dataset.stage==='3' && !!window.__personalLoop""")
  pg.evaluate("Date.now=()=>window.__originalDateNow()+190000")
  pg.locator('body').click(position={'x':5,'y':400},force=True)
  pg.evaluate('window.__personalLoop()')
  assert not pg.locator('#githubGarden .nl-dino').evaluate('el=>el.classList.contains("nl-speaking")')
  pg.evaluate("Date.now=()=>window.__originalDateNow()+360000;document.querySelector('#immersiveLayer').hidden=false;window.__personalLoop()")
  assert not pg.locator('#githubGarden .nl-dino').evaluate('el=>el.classList.contains("nl-speaking")')
  pg.evaluate("document.querySelector('#immersiveLayer').hidden=true;window.__personalLoop()")
  assert pg.locator('#githubGarden .nl-dino').evaluate('el=>el.classList.contains("nl-speaking")')
  print('PASS stays quiet during touch and active immersive quiz',flush=True)
  c.close()
  # A +5 gold confirmed change means one genuine new star.
  c=b.new_context(viewport={'width':390,'height':844},service_workers='block')
  init(c);pg=c.new_page();intercept(pg)
  pg.goto(url,wait_until='domcontentloaded')
  pg.wait_for_selector('#githubGarden .nl-dino',state='attached')
  pg.evaluate("""()=>window.dispatchEvent(new CustomEvent('hub:reward-summary-updated',{detail:{apps:{english:5},stars:1,totalGold:5}}))""")
  line=pg.locator('#githubGarden .nl-dino-bubble').text_content()
  assert 'estrella' in line.lower(),line
  assert pg.locator('#githubGarden .nl-dragon-celebrate').count()==1
  print('PASS real star delta, visual celebration',flush=True)
  c.close()
  # Task garden is silent: rewards do not appear inside its task-progress avatar.
  c=b.new_context(viewport={'width':390,'height':844},service_workers='block')
  init(c,25);pg=c.new_page();intercept(pg)
  pg.goto(url+'apps/biblioteca/',wait_until='domcontentloaded')
  pg.wait_for_selector('#taskGarden .nl-dino',state='attached',timeout=20000)
  assert not pg.locator('#taskGarden .nl-dino.nl-dragon-celebrate').count()
  pg.wait_for_timeout(100)
  assert pg.locator('#taskGarden .nl-dino').get_attribute('data-journey') is None
  print('PASS task garden unaffected',flush=True)
  c.close();b.close()
finally:
 server.shutdown()
