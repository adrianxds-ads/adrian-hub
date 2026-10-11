"""Living dragon routes: real cave/plant points, stage-locked gliding, weather shelter,
accessibility, and separation from podcast progress. No user storage accessed.
"""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];HUB=ROOT/'adrian-hub'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/adrian-hub/'
def configure(page,kind=0,wind=8):
 def core(route):
  import urllib.parse
  path=ROOT/'adrian-core'/urllib.parse.urlparse(route.request.url).path.removeprefix('/adrian-core/')
  if path.name=='adrian-sync.js':route.fulfill(status=200,content_type='application/javascript',body='')
  elif path.is_file():route.fulfill(path=str(path))
  else:route.fulfill(status=404)
 page.route('**/adrian-core/**',core)
 current={'time':'2026-10-11T12:10','weather_code':kind,'temperature_2m':22,
          'cloud_cover':100 if kind else 0,'wind_speed_10m':wind,'wind_direction_10m':90,'rain':0,'is_day':1}
 page.route('**/api.open-meteo.com/**',lambda route:route.fulfill(status=200,content_type='application/json',
   headers={'access-control-allow-origin':'*'},body=json.dumps({'current':current})))
def history(n):
 return [{'id':f'journey-test-{i}','libraryId':'fixture','status':'completado','endedAt':'2026-10-11T10:00:00Z'} for i in range(n)]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox','--disable-web-security'])
  for width in (360,390,412,1280):
   for steps,stage in [(0,0),(5,1),(25,2),(100,3),(300,4)]:
    ctx=browser.new_context(viewport={'width':width,'height':820},service_workers='block')
    ctx.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(json.dumps(history(steps)))+");")
    pg=ctx.new_page();errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    configure(pg)
    pg.goto(URL,wait_until='domcontentloaded')
    pg.wait_for_function("""stage => document.querySelector('#githubGarden .nl-dino')?.dataset.stage===String(stage)""",arg=stage,timeout=20000)
    d=pg.locator('#githubGarden .nl-dino')
    if stage:
     pg.wait_for_function("""()=>document.querySelector('#githubGarden .nl-dino')?.dataset.journey==='clearing'""",timeout=16000)
     rect=pg.evaluate("""()=>{
       let host=document.querySelector('#githubGarden'),cave=host.querySelector('.jurassic-cave').getBoundingClientRect();
       let first=host.querySelector('[data-cottage-plant]')?.getBoundingClientRect();
       let d=host.querySelector('.nl-dino'),scene=host.getBoundingClientRect();
       return {caveX:cave.x+cave.width/2,plantX:first?.x,sceneWidth:scene.width,petWidth:d.offsetWidth};
     }""")
     assert rect['caveX']>rect['sceneWidth']*.65,(width,steps,rect)
     d.click(force=True)
     pg.wait_for_function("""()=>document.querySelector('#githubGarden .nl-dino')?.dataset.journey==='plant'""")
     pos=pg.evaluate("""()=>({x:parseFloat(document.querySelector('#githubGarden .nl-dino').style.left),bottom:parseFloat(document.querySelector('#githubGarden .nl-dino').style.bottom)})""")
     assert pos['x']>=10 and pos['bottom']>=5,(width,steps,pos)
     d.click(force=True)
     assert d.get_attribute('data-journey')=='tree', (width,stage,'not visiting an existing Hub tree')
     d.click(force=True)
     pg.wait_for_function("""()=>document.querySelector('#githubGarden .nl-dino')?.dataset.journey==='cave'""")
     cavePos=pg.evaluate("""()=>parseFloat(document.querySelector('#githubGarden .nl-dino').style.left)""")
     assert cavePos>rect['sceneWidth']*.5,(width,steps,cavePos,rect)
     if width==390 and steps==25:
      pg.wait_for_timeout(5800)
      pg.screenshot(path=str(HUB/'tests'/'dragon-journey-cave390.png'),full_page=True)
     d.click(force=True)
     if stage>=3:
      assert pg.locator('#githubGarden .nl-dino.nl-dragon-travel-flight').count()==1,(width,stage)
      assert d.get_attribute('data-journey')=='flying'
     else:
      assert pg.locator('#githubGarden .nl-dino.nl-dragon-travel-flight').count()==0
     assert pg.evaluate("window.CottageGarden.progress().completedBlocks")==steps
     assert pg.locator('#githubGarden .cottage-garden [data-cottage-plant]').count()==(steps+19)//20
    else:
     assert d.get_attribute('data-journey')=='egg'
     d.click(force=True)
     assert not d.evaluate("el=>el.style.left")
    assert not pg.evaluate("document.documentElement.scrollWidth>innerWidth"),(width,stage)
    assert not errors,(width,steps,errors)
    print('PASS route',width,'stage',stage,flush=True)
    ctx.close()
  # A newly completed detail creates a real plant reaction without new counters.
  ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
  ctx.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(json.dumps(history(25)))+");")
  pg=ctx.new_page();configure(pg)
  pg.goto(URL,wait_until='domcontentloaded')
  pg.wait_for_function("""()=>document.querySelector('#githubGarden .nl-dino')?.dataset.journey==='clearing'""",timeout=16000)
  pg.evaluate("""rows=>{
    localStorage.setItem('adrianEasyCatalanTaskSessionsV1',JSON.stringify(rows));
    window.CottageGarden.refresh();window.NucleoGardenLife.refresh();
  }""",history(26))
  pg.wait_for_function("""()=>document.querySelector('#githubGarden .nl-dino')?.dataset.journey==='plant'""")
  assert pg.locator('#githubGarden .nl-dino-bubble').text_content().startswith('¡Una hoja más!')
  assert pg.evaluate("window.CottageGarden.progress().completedBlocks")==26
  print('PASS new growth invokes only a cosmetic visit, original progress unchanged',flush=True)
  ctx.close()
  # Bad real-weather codes force shelter and prevent takeoff.
  for weather,wind in [(61,6),(0,45)]:
   ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
   ctx.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(json.dumps(history(100)))+");")
   pg=ctx.new_page();configure(pg,kind=weather,wind=wind)
   pg.goto(URL,wait_until='domcontentloaded')
   pg.wait_for_function("""()=>document.querySelector('#githubGarden')?.dataset.nlWeather""",timeout=20000)
   d=pg.locator('#githubGarden .nl-dino')
   if weather==61:
    pg.wait_for_function("""()=>document.querySelector('#githubGarden .nl-dino')?.dataset.journey==='cave'""")
    assert d.get_attribute('data-journey')=='cave'
   for _ in range(4):d.click(force=True)
   assert pg.locator('#githubGarden .nl-dino.nl-dragon-travel-flight').count()==0,(weather,wind)
   print('PASS weather shelter / no high-wind flight',weather,wind,flush=True)
   ctx.close()
  for reduce in [True]:
   ctx=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce',service_workers='block')
   ctx.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(json.dumps(history(100)))+");")
   pg=ctx.new_page();configure(pg)
   pg.goto(URL,wait_until='domcontentloaded')
   pg.wait_for_function("""()=>document.querySelector('#githubGarden .nl-dino')?.dataset.journey==='still'""")
   d=pg.locator('#githubGarden .nl-dino')
   before=d.evaluate("el=>el.getAttribute('style')")
   d.click(force=True)
   assert d.get_attribute('data-journey')=='still'
   assert d.evaluate("el=>el.getAttribute('style')")==before
   print('PASS reduced motion is stationary')
   ctx.close()
  # Real task garden remains progress-driven: never receives journey state.
  ctx=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
  ctx.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(json.dumps(history(25)))+");localStorage.setItem('adrianEasyCatalan20261009ReconciliationV1',JSON.stringify({skipped:'test'}));")
  pg=ctx.new_page();configure(pg)
  pg.goto(URL+'apps/biblioteca/',wait_until='domcontentloaded')
  pg.wait_for_selector('#taskGarden .nl-dino',state='attached',timeout=20000)
  dragon=pg.locator('#taskGarden .nl-dino')
  assert not dragon.get_attribute('data-journey')
  pg.locator('#taskProgress').evaluate("el=>el.style.width='75%'")
  pg.wait_for_function("""()=>document.querySelector('#taskGarden .nl-dino')?.style.left==='64%'""",timeout=6000)
  assert not dragon.get_attribute('data-journey')
  print('PASS task progress left=64%, no journey substitution')
  ctx.close()
  browser.close()
finally:
 server.shutdown()
