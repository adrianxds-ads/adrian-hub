"""Independent dragon-concept smoke/regression. Does not touch user progress.
Run: python tests/test_dragon_prototype.py (Windows, Chrome, Playwright).
"""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'prototypes'/'dragon-garden'
class Silent(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Silent,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
url='http://127.0.0.1:'+str(server.server_port)+'/prototypes/dragon-garden/'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--no-sandbox'])
  for width in (360,390,412,1280):
   page=browser.new_page(viewport={'width':width,'height':820},device_scale_factor=1,service_workers='block')
   errors=[]
   page.on('pageerror', lambda exc:errors.append(str(exc)))
   page.goto(url,wait_until='networkidle')
   page.wait_for_function('window.__dragonPrototypeReady === true')
   assert page.locator('#dragon svg .wing-front').count()==1,(width,'art SVG not loaded')
   assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'),(width,'horizontal overflow')
   assert not errors,(width,errors)
   initial=page.evaluate('({local:localStorage.length,session:sessionStorage.length})')
   page.locator('#dragon').click()
   assert page.locator('#bubble').is_visible()
   page.locator('[data-action="walk"]').click()
   assert page.locator('#dragon.walking').count()==1
   page.locator('[data-action="sleep"]').click()
   assert page.locator('#dragon.sleeping').count()==1
   page.locator('[data-weather="night"]').click()
   assert page.locator('#scene').get_attribute('data-weather')=='night'
   page.locator('[data-weather="rain"]').click()
   assert page.locator('#scene').get_attribute('data-weather')=='rain'
   page.locator('#stageSelect').select_option('0')
   assert page.locator('#egg').is_visible()
   assert page.locator('#dragon').is_hidden()
   page.locator('#stageSelect').select_option('2')
   assert page.locator('#dragon').is_visible()
   page.locator('[data-action="fly"]').click()
   assert page.locator('#scene').get_attribute('data-stage')=='3'
   assert page.locator('#dragon.flying').count()==1
   assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
   assert page.evaluate('({local:localStorage.length,session:sessionStorage.length})')==initial,'Unexpected storage writes'
   assert not errors,(width,errors)
   page.locator('[data-weather="day"]').click()
   page.locator('#stageSelect').select_option('1')
   page.wait_for_timeout(550)
   if width in (390,1280):
    page.screenshot(path=str(ROOT/'tests'/('dragon-prototype-'+str(width)+'.png')),full_page=True)
   print('PASS viewport',width,'controls, animation, stages, isolated storage')
   page.close()
  page=browser.new_page(viewport={'width':390,'height':820},reduced_motion='reduce',service_workers='block')
  page.goto(url,wait_until='networkidle')
  page.wait_for_function('window.__dragonPrototypeReady === true')
  page.locator('[data-action="fly"]').click()
  assert page.locator('#bubble').is_visible()
  assert page.locator('#scene').get_attribute('data-stage')=='3'
  print('PASS reduced motion')
  browser.close()
finally:
 server.shutdown()
