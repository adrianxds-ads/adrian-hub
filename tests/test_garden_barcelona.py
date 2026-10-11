"""Barcelona miniature skyline integration with real sky timing and preserved forest.
Synthetic Open-Meteo readings, isolated browser contexts, no user profile data.
Run: python -u tests/test_garden_barcelona.py
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[2]
HUB=ROOT/'adrian-hub'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/adrian-hub/'
HIST=json.dumps([{'id':f'barcelona-fixture-{i}','status':'completado','endedAt':'2026-10-11T02:00:00Z'} for i in range(100)])
def core(route):
 import urllib.parse
 path=ROOT/'adrian-core'/urllib.parse.urlparse(route.request.url).path.removeprefix('/adrian-core/')
 if path.name=='adrian-sync.js':route.fulfill(status=200,content_type='application/javascript',body='')
 elif path.is_file():route.fulfill(path=str(path))
 else:route.fulfill(status=404)
def hooks(page,weather):
 page.route('**/adrian-core/**',core)
 if weather is None:
  page.route('**/api.open-meteo.com/**',lambda route:route.fulfill(status=503,content_type='application/json',body='{}'))
 else:
  page.route('**/api.open-meteo.com/**',lambda route:route.fulfill(status=200,content_type='application/json',
   body=json.dumps(weather),headers={'access-control-allow-origin':'*'}))
def provider(is_day=1,weather_code=0,include_daily=True):
 result={'current':{'time':'2026-10-11T13:00','temperature_2m':21,
  'cloud_cover':0,'wind_speed_10m':7,'wind_direction_10m':79,
  'weather_code':weather_code,'is_day':is_day,'rain':0,'snowfall':0}}
 if include_daily:
  result['daily']={'time':['2026-10-11'],'sunrise':['2026-10-11T07:58'],
    'sunset':['2026-10-11T19:10']}
 return result
def create_page(browser,width,when,reduced=False,weather=None):
 context=browser.new_context(viewport={'width':width,'height':844},
  reduced_motion='reduce' if reduced else 'no-preference',service_workers='block')
 context.add_init_script('localStorage.setItem("adrianEasyCatalanTaskSessionsV1",'+json.dumps(HIST)+');')
 page=context.new_page()
 page.clock.set_fixed_time(when)
 hooks(page,weather)
 return context,page
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,
   executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
   args=['--disable-web-security','--no-sandbox'])
  # local date Oct 11th 2026, CEST = UTC+2
  cases=[('dawn','2026-10-11T05:38:00Z',1),
    ('day','2026-10-11T11:00:00Z',1),
    ('dusk','2026-10-11T17:00:00Z',1),
    ('night','2026-10-11T20:00:00Z',0)]
  for width in (360,390,412,1280):
   for phase,when,day in cases:
    ctx,page=create_page(browser,width,when,weather=provider(is_day=day))
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL,wait_until='domcontentloaded',timeout=30000)
    page.wait_for_function("""p=>document.querySelector('#githubGarden')?.dataset.bcnPhase===p && document.querySelector('#githubGarden .nl-barcelona-landscape img')?.naturalWidth>0""",arg=phase,timeout=25000)
    page.wait_for_function("""()=>document.querySelector('#githubGarden .nl-dino')?.dataset.stage==='3' && document.querySelectorAll('#groups .app').length===15""",timeout=20000)
    props=page.evaluate("""()=>{const h=document.querySelector('#githubGarden'),l=h.querySelector('.nl-barcelona-landscape');
      const img=l.querySelector('img');
      const star=document.querySelector('#hubStarCount')?.textContent;
      return {
       version:window.NucleoGardenLife.version,phase:h.dataset.bcnPhase,
       src:img.src,layerIndex:getComputedStyle(l).zIndex,
       layerCount:h.querySelectorAll(':scope > .nl-barcelona-landscape').length,
       layerIsHidden:l.hidden,
       aria:l.getAttribute('aria-hidden'),
       progress:window.CottageGarden.progress().completedBlocks,
       trees:h.querySelectorAll('.cottage-garden [data-cottage-plant]').length,
       dragon:!!h.querySelector('.nl-dino svg.dragon-art'),
       apps:document.querySelectorAll('#groups .app').length,
       overflow:document.documentElement.scrollWidth>innerWidth,
       readableClock:document.querySelector('#barcelonaClock')?.textContent,
       mood:h.querySelector('.nl-dino')?.dataset.mood,
       weather:h.dataset.nlWeather,
       background:getComputedStyle(h).backgroundImage,
       star:star
      }}""")
    assert props['phase']==phase and props['layerCount']==1 and not props['layerIsHidden'],(width,phase,props)
    assert props['aria']=='true' and props['layerIndex']=='3',props
    assert props['progress']==100 and props['trees']==5 and props['dragon'] and props['apps']==15,(width,phase,props)
    assert not props['overflow'] and not errors,(width,phase,props,errors)
    assert 'garden-barcelona.svg' in props['src'] and 'linear-gradient' in props['background'],props
    assert props['version']=='1.6.0',props
    if width in (390,1280):
     page.screenshot(path=str(HUB/'tests'/f'barcelona-phase2-{phase}-{width}.png'),full_page=True)
    ctx.close()
   print('PASS',width,'dawn/day/dusk/night, forest & rewards preserved',flush=True)
  # missing daily sunrise/sunset falls back to is_day without asserting an exact sunrise
  ctx,page=create_page(browser,390,'2026-10-11T11:00:00Z',weather=provider(include_daily=False))
  page.goto(URL,wait_until='domcontentloaded')
  page.wait_for_function("""()=>document.querySelector('#githubGarden')?.dataset.bcnPhase==='day'""")
  print('PASS live is_day fallback without daily astronomical data',flush=True)
  ctx.close()
  # offline absence shows a local illustrative (not exact astronomical) phase only
  ctx,page=create_page(browser,390,'2026-10-11T20:00:00Z',weather=None)
  page.goto(URL,wait_until='domcontentloaded')
  page.wait_for_function("""()=>document.querySelector('#githubGarden')?.dataset.bcnPhase==='night'""")
  assert page.locator('#barcelonaWeather').get_attribute('data-weather-state')=='unknown'
  assert page.locator('#githubGarden .nl-weather').is_hidden()
  print('PASS offline: no fabricated weather, illustration uses local clock',flush=True)
  ctx.close()
  # reduced motion: background remains still and legible
  ctx,page=create_page(browser,390,'2026-10-11T11:00:00Z',True,provider())
  page.goto(URL,wait_until='domcontentloaded')
  page.wait_for_function("""()=>document.querySelector('#githubGarden .nl-barcelona-landscape img')?.naturalWidth>0""")
  assert page.locator('#githubGarden .nl-barcelona-landscape').evaluate(
   "(el)=>getComputedStyle(el).animationName")=='none'
  assert page.locator('#githubGarden .nl-ecosystem').get_attribute('data-eco-mode')=='quiet'
  print('PASS reduced motion: static landscape, no creatures',flush=True)
  ctx.close()
  # Biblioteca: no second skyline and task path remains wholly progress-driven
  ctx,page=create_page(browser,390,'2026-10-11T11:00:00Z',weather=provider())
  ctx.add_init_script("""localStorage.setItem('adrianEasyCatalan20261009ReconciliationV1',JSON.stringify({skipped:'test'}))""")
  page.goto(URL+'apps/biblioteca/',wait_until='domcontentloaded')
  page.wait_for_selector('#taskGarden .nl-dino',state='attached',timeout=25000)
  assert page.locator('#taskGarden .nl-barcelona-landscape').count()==0
  assert page.locator('#taskGarden .nl-ecosystem').count()==0
  assert page.locator('#taskGarden .nl-dino').get_attribute('data-journey') is None
  page.locator('#taskProgress').evaluate("(el)=>el.style.width='75%'")
  page.wait_for_function("""()=>document.querySelector('#taskGarden .nl-dino')?.style.left==='64%'""")
  print('PASS Biblioteca progress path unaffected; no skyline overlay',flush=True)
  ctx.close()
  browser.close()
finally:
 server.shutdown()
