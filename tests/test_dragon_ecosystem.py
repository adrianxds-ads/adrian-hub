"""Read-only decorative ecology of the shared dragon garden.
Weather is deterministic; 6 modes x 4 viewports plus reduced motion and task garden.
No changes to actual user data or score storage.
"""
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];HUB=ROOT/'adrian-hub'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/adrian-hub/'
rows=[{'id':f'eco-fixture-{i}','status':'completado','endedAt':'2026-10-11T10:00:00Z'} for i in range(100)]
source=json.dumps(rows)
def core(route):
 import urllib.parse
 path=ROOT/'adrian-core'/urllib.parse.urlparse(route.request.url).path.removeprefix('/adrian-core/')
 if path.name=='adrian-sync.js':route.fulfill(content_type='application/javascript',body='')
 elif path.is_file():route.fulfill(path=str(path))
 else:route.fulfill(status=404)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox','--disable-web-security'])
  cases=[
   ('sunny',0,1,8,'butterfly'),
   ('night',0,0,4,'fireflies'),
   ('wind',1,1,24,'leaves'),
   ('rain',61,1,6,'quiet'),
   ('fog',45,1,6,'quiet'),
   ('clouds',3,1,4,'quiet'),
   ('storm',95,0,15,'quiet')
  ]
  for width in (360,390,412,1280):
   for tag,code,day,wind,expect in cases:
    ctx=browser.new_context(viewport={'width':width,'height':844},service_workers='block')
    ctx.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(source)+");")
    page=ctx.new_page();errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.route('**/adrian-core/**',core)
    current={'time':'2026-10-11T12:10','temperature_2m':20,'wind_speed_10m':wind,
     'wind_direction_10m':88,'weather_code':code,'is_day':day,'cloud_cover':0,
     'rain':0,'snowfall':0}
    page.route('**/api.open-meteo.com/**',lambda route:route.fulfill(status=200,content_type='application/json',
      body=json.dumps({'current':current}),headers={'access-control-allow-origin':'*'}))
    page.goto(BASE,wait_until='domcontentloaded',timeout=25000)
    page.wait_for_function("""s => document.querySelector('#githubGarden .nl-ecosystem')?.dataset.ecoMode===s && document.querySelector('#githubGarden .nl-dino')?.dataset.stage==='3'""",arg=expect,timeout=22000)
    eco=page.locator('#githubGarden .nl-ecosystem')
    assert eco.count()==1
    assert eco.get_attribute('aria-hidden')=='true'
    layer=page.locator('#githubGarden .nl-eco-butterflies')
    expected_css='block' if expect=='butterfly' else 'none'
    assert layer.evaluate('el=>getComputedStyle(el).display')==expected_css,(width,tag,expect)
    if expect=='fireflies':assert page.locator('#githubGarden .nl-eco-fireflies').evaluate("el=>getComputedStyle(el).display")=='block'
    if expect=='leaves':assert page.locator('#githubGarden .nl-eco-leaves').evaluate("el=>getComputedStyle(el).display")=='block'
    before=page.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")
    d=page.locator('#githubGarden .nl-dino')
    # Every sixth tap yields a context-specific ecological line, without changing scores.
    if expect in ('butterfly','fireflies','leaves'):
     for i in range(6):d.click(force=True)
     dialogue=page.locator('#githubGarden .nl-dino-bubble').text_content()
     assert {'butterfly':'mariposa','fireflies':'lucecitas','leaves':'hojas'}[expect] in dialogue.lower(),(width,tag,dialogue)
     bounds=page.evaluate("""()=>{const h=document.querySelector('#githubGarden').getBoundingClientRect();const bEl=document.querySelector('#githubGarden .nl-dino-bubble');const b=bEl.getBoundingClientRect();const d=document.querySelector('#githubGarden .nl-dino');const c=getComputedStyle(bEl);return {hl:h.left,hr:h.right,bl:b.left,br:b.right,align:d.dataset.bubbleAlign,journey:d.dataset.journey,petLeft:d.getBoundingClientRect().left,styleLeft:d.style.left,bubbleTransform:c.transform,bubbleLeft:c.left,bubbleRight:c.right,css:!![...document.styleSheets].find(x=>x.href?.includes('garden-ecosystem.css'))}}""")
     assert bounds['bl']>=bounds['hl']-3 and bounds['br']<=bounds['hr']+3,(width,tag,'clipped bubble',bounds)
    assert page.evaluate("window.CottageGarden.progress().completedBlocks")==100
    assert page.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")==before
    assert not page.evaluate("document.documentElement.scrollWidth>innerWidth"),(width,tag)
    assert not errors,(width,tag,errors)
    if width==390 and tag in ('sunny','night','wind'):
     page.screenshot(path=str(HUB/'tests'/f'dragon-ecosystem-{tag}-390.png'),full_page=True)
    ctx.close()
   print('PASS ecological modes',width,'7 weather combinations, progress, no overflow',flush=True)
  for reduced in ('reduce',):
   ctx=browser.new_context(viewport={'width':390,'height':844},reduced_motion=reduced,service_workers='block')
   ctx.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(source)+");")
   page=ctx.new_page();page.route('**/adrian-core/**',core)
   page.route('**/api.open-meteo.com/**',lambda r:r.fulfill(content_type='application/json',
        body=json.dumps({'current':{'weather_code':0,'is_day':1,'wind_speed_10m':3,'temperature_2m':20}}),
        headers={'access-control-allow-origin':'*'}))
   page.goto(BASE,wait_until='domcontentloaded')
   page.wait_for_function("""()=>document.querySelector('#githubGarden .nl-ecosystem')?.dataset.ecoMode==='quiet'""")
   assert page.locator('#githubGarden .nl-ecosystem').evaluate("el=>getComputedStyle(el).display")=='none'
   print('PASS reduced motion no creatures',flush=True);ctx.close()
  ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
  ctx.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(source)+");")
  page=ctx.new_page();page.route('**/adrian-core/**',core)
  page.route('**/api.open-meteo.com/**',lambda r:r.fulfill(status=503))
  page.goto(BASE,wait_until='domcontentloaded')
  page.wait_for_function("""()=>document.querySelector('#githubGarden .nl-ecosystem')?.dataset.ecoMode==='quiet'""")
  print('PASS no data = no invented climate',flush=True);ctx.close()
  ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
  ctx.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(source)+");localStorage.setItem('adrianEasyCatalan20261009ReconciliationV1',JSON.stringify({skipped:'test'}))")
  page=ctx.new_page();page.route('**/adrian-core/**',core)
  page.route('**/api.open-meteo.com/**',lambda r:r.fulfill(status=503))
  page.goto(BASE+'apps/biblioteca/',wait_until='domcontentloaded')
  page.wait_for_selector('#taskGarden .nl-dino',state='attached',timeout=20000)
  assert page.locator('#taskGarden .nl-ecosystem').count()==0
  print('PASS task garden has no extra effects',flush=True);ctx.close()
  browser.close()
finally:
 server.shutdown()
