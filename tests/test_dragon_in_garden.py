"""Isolated browser acceptance for dragon artwork replacing only the garden mascot.
Never connects to user data; synthetic completed blocks prove preserved tree progress.
"""
import json, pathlib, threading, urllib.parse
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/adrian-hub/'
cases=[(0,0),(5,1),(25,2),(100,3),(300,4)]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',args=['--no-sandbox','--disable-web-security'])
  for width in (360,390,412,1280):
   for amount,stage in cases:
    context=browser.new_context(viewport={'width':width,'height':820},service_workers='block')
    records=[{'id':f'fixture-{i}','status':'completado','libraryId':'fixture'} for i in range(amount)]
    history=json.dumps(records)
    context.add_init_script(f"localStorage.setItem('adrianEasyCatalanTaskSessionsV1',{json.dumps(history)});")
    page=context.new_page();errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    def core(route):
     path=ROOT/'adrian-core'/urllib.parse.urlparse(route.request.url).path.removeprefix('/adrian-core/')
     if path.name=='adrian-sync.js':route.fulfill(content_type='application/javascript',body='')
     else:route.fulfill(path=str(path)) if path.is_file() else route.fulfill(status=404)
    page.route('**/adrian-core/**',core)
    page.route('https://api.open-meteo.com/**',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps({'current':{'time':'2026-10-11T01:00','temperature_2m':17,'weather_code':0,'cloud_cover':0,'rain':0,'is_day':0}}),headers={'access-control-allow-origin':'*'}))
    page.goto(base,wait_until='domcontentloaded',timeout=25000)
    host=page.locator('#githubGarden')
    page.wait_for_function("""stage => document.querySelector('#githubGarden .nl-dino')?.dataset.stage===String(stage)""",arg=stage,timeout=22000)
    if stage:
     page.wait_for_function("""() => !!document.querySelector('#githubGarden .nl-dino svg.dragon-art .tail') && !!document.querySelector('#githubGarden .nl-dino svg.dragon-art .wing-front')""",timeout=12000)
     assert page.locator('#githubGarden .nl-dino svg.dragon-art .wing-front').count()==1
     assert page.locator('#githubGarden .nl-dino svg.dragon-art .tail').count()==1,(width,amount,page.locator('#githubGarden .nl-dino svg.dragon-art').evaluate('e=>e.outerHTML.slice(0,900)'))
    else:
     assert page.locator('#githubGarden .nl-dino svg.dragon-art').count()==0
    page.wait_for_function("""n => document.querySelector('#githubGarden .cottage-garden')?.dataset.steps===String(n)""",arg=amount,timeout=12000)
    assert page.evaluate('window.CottageGarden.progress().completedBlocks')==amount,(width,amount,page.evaluate('window.CottageGarden.progress()'),page.evaluate('localStorage.getItem("adrianEasyCatalanTaskSessionsV1")?.slice(0,180)'))
    assert 'dragon' in page.locator('#githubGarden .nl-dino').get_attribute('aria-label').lower()
    tree_count=page.locator('#githubGarden .cottage-garden [data-cottage-plant]').count()
    expected=(amount+19)//20
    assert tree_count==expected,(width,amount,tree_count,expected)
    before=page.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")
    d=page.locator('#githubGarden .nl-dino')
    d.click(force=True)
    assert page.locator('#githubGarden .nl-speaking').count()==1
    if stage>=3:
     for _ in range(2):d.click(force=True)
     assert d.evaluate("d=>d.classList.contains('nl-dragon-flight')")
    assert page.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")==before
    assert page.locator('#githubGarden .cottage-garden [data-cottage-plant]').count()==tree_count
    assert not page.evaluate("document.documentElement.scrollWidth>innerWidth"),(width,stage)
    assert not errors,(width,stage,errors)
    if width==390 and stage in (0,2,4):
     page.screenshot(path=str(ROOT/'adrian-hub'/'tests'/f'dragon-garden-{width}-stage{stage}.png'),full_page=True)
    context.close()
   print('PASS Hub',width,'5 stages, tree counts, dialogue, flight, no history writes')
  for n in (0,20):
   context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
   records=[{'id':f'task-fixture-{i}','status':'completado'} for i in range(n)]
   context.add_init_script(f"localStorage.setItem('adrianEasyCatalanTaskSessionsV1',{json.dumps(json.dumps(records))});localStorage.setItem('adrianEasyCatalan20261009ReconciliationV1',JSON.stringify({{skipped:'no-preexisting-data'}}));")
   page=context.new_page()
   page.route('**/adrian-core/**',core)
   page.route('https://api.open-meteo.com/**',lambda route:route.fulfill(status=503))
   page.goto(base+'apps/biblioteca/',wait_until='domcontentloaded',timeout=25000)
   page.wait_for_selector('#taskGarden .nl-dino',state='attached',timeout=20000)
   if n:
    page.wait_for_selector('#taskGarden svg.dragon-art',state='attached',timeout=12000)
   page.wait_for_function("""n => document.querySelector('#taskGarden .cottage-garden')?.dataset.steps===String(n)""",arg=n,timeout=12000)
   assert page.locator('#taskProgress').count()==1
   assert not page.evaluate("document.documentElement.scrollWidth>innerWidth")
   print('PASS Task Garden:',n,'completed blocks')
   context.close()
  browser.close()
finally:
 server.shutdown()
