"""Pixel-size SVG 2.5D appearance and animation contract.
A read-only fake session history isolates the live forest and user progress.
Run: python tests/test_dragon_art_v2.py
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/adrian-hub/'
rows=[{'status':'completado','id':f'test-dragon-art-{i}'} for i in range(25)]
raw=json.dumps(rows)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--disable-web-security','--no-sandbox'])
  for reduced in [False,True]:
   for width in [360,390,412,1280]:
    context=browser.new_context(viewport={'width':width,'height':820},reduced_motion=('reduce' if reduced else 'no-preference'),service_workers='block')
    context.add_init_script("localStorage.setItem('adrianEasyCatalanTaskSessionsV1',"+json.dumps(raw)+");")
    pg=context.new_page();errors=[]
    pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.route('**/adrian-core/components/adrian-sync.js**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
    pg.route('**/api.open-meteo.com/**',lambda r:r.fulfill(status=503))
    pg.goto(base,wait_until='domcontentloaded',timeout=20000)
    pg.wait_for_selector('#githubGarden .nl-dino svg.dragon-art .freckles',state='attached',timeout=20000)
    mascot=pg.locator('#githubGarden .nl-dino')
    shape=pg.evaluate("""()=>{const d=document.querySelector('#githubGarden .nl-dino');
       const svg=d.querySelector('svg.dragon-art'),rect=d.getBoundingClientRect();
       const css=getComputedStyle(svg),wing=svg.querySelector('.wing-front');
       const body=d.querySelector('.dragon-art .face');
       return {stage:d.dataset.stage,renderedWidth:Math.round(rect.width),renderedHeight:Math.round(rect.height),
         green:svg.querySelectorAll('#nd-volume,#nd-head-light,#nd-iris').length,
         highlights:svg.querySelectorAll('.freckles,.belly-ridges').length,
         animation:css.animationName,wing:!!wing,face:!!body,
         completed:window.CottageGarden.progress().completedBlocks,
         trees:document.querySelectorAll('#githubGarden .cottage-garden [data-cottage-plant]').length,
         horizontalOverflow:document.documentElement.scrollWidth>innerWidth}}""")
    assert shape['stage']=='2' and shape['green']==3 and shape['highlights']==2 and shape['face'] and shape['wing'],(width,reduced,shape)
    assert shape['completed']==25 and shape['trees']==2 and shape['renderedWidth']>=80 and not shape['horizontalOverflow'],(width,reduced,shape)
    if reduced:assert shape['animation']=='none',shape
    else:assert shape['animation']!='none',shape
    stored=pg.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")
    mascot.click(force=True)
    assert pg.locator('#githubGarden .nl-speaking').count()==1
    assert pg.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")==stored
    assert not errors,(width,reduced,errors)
    if width==390 and not reduced:
     pg.screenshot(path=str(ROOT/'adrian-hub'/'tests'/'dragon-art-v2-mobile.png'),full_page=True)
    print('PASS artwork',width,'reduced',reduced,'SVG layers, touch, forest preserved',flush=True)
    context.close()
  browser.close()
finally:
 server.shutdown()
