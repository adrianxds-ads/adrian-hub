"""Mobile acceptance uses fresh Chrome contexts and local fixtures only; production storage/network is never used."""
from pathlib import Path
import mimetypes,json
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
w=Path(__file__).parent.parent
def serve(route):
 u=urlparse(route.request.url)
 if u.hostname=='adrin.tail8fd071.ts.net':
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'entries':{},'revision':0,'accepted':0,'acceptedKeys':[]}));return
 if u.hostname!='adrianxds-ads.github.io':route.abort();return
 file=w/unquote(u.path).lstrip('/')
 if file.is_dir():file=file/'index.html'
 if not file.is_file():route.fulfill(status=404,body='missing fixture');return
 route.fulfill(status=200,content_type=mimetypes.guess_type(str(file))[0] or 'application/octet-stream',body=file.read_bytes())
ua='Mozilla/5.0 (Linux; Android 17; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 for size in [(360,640),(390,844),(740,420)]:
  c=b.new_context(viewport={'width':size[0],'height':size[1]},is_mobile=True,has_touch=True,user_agent=ua,service_workers='block')
  c.route('**/*',serve);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('https://adrianxds-ads.github.io/adrian-hub/apps/adri-type/',wait_until='domcontentloaded')
  assert page.locator('#openHistory').is_hidden();assert 'móvil' in page.locator('#status').inner_text()
  assert page.locator('.back').bounding_box()['height']>=44
  page.goto('https://adrianxds-ads.github.io/adaptive-exam/',wait_until='domcontentloaded')
  for part in [2,3,4]:
   page.locator('#partList .part-card').nth(part-1).click();page.locator('#exerciseList button').first.click()
   fields=page.locator('#paperHost input[data-n]');assert fields.count()
   fields.first.tap();page.locator('.ad-keyboard.open').wait_for();page.wait_for_timeout(350)
   def visible():
    el=page.locator('#paperHost input[data-n]:focus');assert el.count()==1
    r=el.bounding_box();kb=page.locator('.ad-keyboard').bounding_box()
    header=page.locator('#paperScreen .paper-head').bounding_box()
    assert r['y']>=header['y']+header['height']-1,(size,part,'header',r,header)
    assert r['y']+r['height']<=kb['y']-10,(size,part,'keyboard',r,kb)
    assert page.locator('.ad-keyboard-float-preview').is_hidden()
   visible()
   page.locator('.cambridge-next').click();page.wait_for_timeout(350);visible()
   page.locator('.ad-keyboard [data-char="A"]').first.tap();page.wait_for_timeout(250);visible()
   assert page.locator('#paperHost input[data-n]:focus').input_value().endswith('A')
   page.locator('.cambridge-prev').click();page.wait_for_timeout(350);visible()
   page.locator('[data-action="close"]').click();assert page.locator('.ad-keyboard').is_hidden()
   page.locator('#backBtn').click();page.locator('#partBackBtn').click()
  assert not errors,errors;c.close()
  print('PASS mobile '+str(size)+': Hub Control companion, Cambridge Parts 2/3/4, field/context bounds, arrow focus, typing and keyboard close')
 c=b.new_context(viewport={'width':1280,'height':800},service_workers='block');c.route('**/*',serve);page=c.new_page()
 page.goto('https://adrianxds-ads.github.io/adrian-hub/apps/adri-type/',wait_until='domcontentloaded');assert page.locator('#openHistory').is_hidden()
 page.evaluate("document.documentElement.dataset.hubControlVersion='0.4.3'");page.locator('#openHistory').wait_for(state='visible');assert page.locator('#openHistory').is_enabled()
 c.close();b.close()
print('PASS desktop companion: missing and late extension availability; no dead mobile control')
