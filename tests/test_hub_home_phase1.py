"""Hub home phase 1 — strict read-only functional smoke with deterministic weather.
Uses isolated Chrome contexts, never real user profile or financial data.
"""
import json, pathlib, threading, urllib.parse
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
HUB=ROOT/'adrian-hub'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/adrian-hub/'
weather={'current':{'time':'2026-10-11T02:00','temperature_2m':20.6,'wind_speed_10m':13.8,
  'wind_direction_10m':91,'cloud_cover':0,'weather_code':0,'precipitation':0,'rain':0,'snowfall':0,'is_day':0}}
def configure(page,kind='sun',status=200):
 def core(route):
  path=ROOT/'adrian-core'/urllib.parse.urlparse(route.request.url).path.removeprefix('/adrian-core/')
  if path.name=='adrian-sync.js':route.fulfill(status=200,content_type='application/javascript',body='')
  elif path.is_file():route.fulfill(path=str(path))
  else:route.fulfill(status=404)
 page.route('**/adrian-core/**',core)
 page.route('**/api.open-meteo.com/**',lambda route:route.fulfill(status=status,content_type='application/json',body=json.dumps(weather),headers={'access-control-allow-origin':'*'}))
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox','--disable-web-security'])
  app_count=len(json.loads((HUB/'apps.json').read_text(encoding='utf8'))['apps'])
  for width in (360,390,412,1280):
   page=browser.new_page(viewport={'width':width,'height':844},service_workers='block')
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   history=json.dumps([{'id':f'fixture-{i}','libraryId':'fixture','status':'completado'} for i in range(25)])
   page.add_init_script(f"localStorage.setItem('adrianEasyCatalanTaskSessionsV1',{json.dumps(history)});")
   configure(page)
   page.goto(BASE,wait_until='domcontentloaded',timeout=30000)
   page.wait_for_selector('#groups .app',state='attached',timeout=25000)
   page.wait_for_function("""()=>document.querySelector('#barcelonaWeather')?.dataset.weatherState==='live'""",timeout=18000)
   page.wait_for_selector('#githubGarden .nl-dino svg.dragon-art',state='attached',timeout=18000)
   state=page.evaluate("""()=>({
      children:[...document.querySelector('main').children].map(x=>x.id||x.className||x.localName),
      groups:document.querySelectorAll('#groups .app').length,
      first:document.querySelector('main').firstElementChild.className,
      wind:document.querySelector('#barcelonaWind').textContent,
      temp:document.querySelector('#barcelonaTemperature').textContent,
      condition:document.querySelector('#barcelonaCondition').textContent,
      time:document.querySelector('#barcelonaClock').textContent,
      expectedTime:new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}).format(new Date()),
      missing:{search:!document.querySelector('#search'),nexo:!document.querySelector('.nexo-visual-launch'),chat:!document.querySelector('.hub-chat-panel'),hero:!document.querySelector('.hero')},
      versionsOpen:document.querySelector('#versionCenter').open,
      detailsCount:document.querySelectorAll('#versionCenter summary').length,
      awards:document.querySelectorAll('#hubStarCounter').length,
      button:document.querySelectorAll('#updateAllVersionsBtn').length,
      dragon:!!document.querySelector('#githubGarden .nl-dino svg.dragon-art'),
      tree:!!document.querySelector('#githubGarden .cottage-garden'),
      overflow:document.documentElement.scrollWidth>innerWidth
   })""")
   assert state['groups']==app_count,(width,'apps',state)
   assert state['first']=='hub-top',(width,state)
   assert state['temp']=='21 °C' and '14 km/h E' in state['wind'],(width,'weather',state)
   assert state['condition']=='despejado' and state['time']==state['expectedTime'],(width,'clock',state)
   assert all(state['missing'].values()),(width,'unwanted chrome',state)
   assert state['button']==1 and state['awards']==1 and not state['versionsOpen'],(width,'controls',state)
   assert state['dragon'] and state['tree'] and not state['overflow'] and not errors,(width,state,errors)
   assert page.locator('#versionCenter').get_attribute('open') is None
   page.locator('#versionCenter > summary').click()
   assert page.locator('#versionCenter').evaluate('(el)=>el.open')
   page.locator('#groups .app-info').first.click()
   assert page.locator('#appInfoDialog').evaluate('(el)=>el.open')
   page.locator('#appInfoClose').click()
   assert not page.locator('#appInfoDialog').evaluate('(el)=>el.open')
   assert page.locator('#groups .app-launch').first.get_attribute('href')
   assert not errors,(width,errors)
   if width in (390,1280):page.screenshot(path=str(HUB/'tests'/f'hub-phase1-{width}.png'),full_page=True)
   page.close()
   print('PASS',width,'garden first, weather+wind, all apps, stars, details, info, no errors')
  # Cold start network failure, never claim made-up weather.
  page=browser.new_page(viewport={'width':390,'height':844},service_workers='block')
  configure(page,status=503)
  page.goto(BASE,wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function("""()=>document.querySelector('#barcelonaWeather')?.dataset.weatherState==='unknown'""",timeout=15000)
  assert page.locator('#barcelonaTemperature').text_content()=='— °C'
  assert '— km/h' in page.locator('#barcelonaWind').text_content()
  print('PASS offline weather fallback')
  page.close()
  browser.close()
finally:
 server.shutdown()
