from playwright.sync_api import sync_playwright
import requests
from urllib.parse import urlsplit
from pathlib import Path
import json
COUNT=json.loads((Path(__file__).with_name('cambridge-exams.json')).read_text(encoding='utf-8'))['count']
ROOT='http://127.0.0.1:19543/'
session=requests.Session()
asset_cache={}
def serve_published_core(route):
 u=urlsplit(route.request.url)
 remote='https://adrianxds-ads.github.io'+u.path
 if remote not in asset_cache:
  response=session.get(remote,timeout=30)
  if response.status_code!=200:raise AssertionError((response.status_code,remote))
  asset_cache[remote]=(response.content,response.headers.get('content-type','application/octet-stream'))
 body,content_type=asset_cache[remote]
 route.fulfill(status=200,body=body,content_type=content_type)
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 for width in (390,1280):
  context=browser.new_context(viewport={'width':width,'height':844})
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('http://127.0.0.1:19543/adrian-core/**',serve_published_core)
  page.goto(ROOT+'#hub/modulos',wait_until='domcontentloaded')
  page.get_by_text('Podcasts Inglés',exact=True).first.wait_for(timeout=30000)
  found=page.get_by_text('Podcasts Inglés',exact=True).count()
  links=page.locator('a[href*="biblioteca"][href*="lang=en"]')
  print('HOME',width,'CARD',found,'LINK_COUNT',links.count(),'ERRORS',errors[:3],flush=True)
  assert found>=1
  assert links.count()>=1
  links.first.click()
  page.wait_for_timeout(1500)
  print('AFTER_CLICK',page.url,'TITLE',page.title(),'HIDDEN_LAYER',page.locator('#immersiveLayer').get_attribute('hidden') if page.locator('#immersiveLayer').count() else 'no-layer','EPISODES',page.locator('#episodes .episode').count(),'EPISODES_VISIBLE',page.locator('#episodes').is_visible(),'TASK_PANEL_VISIBLE',page.locator('#taskPanel').is_visible(),'TASK_EPISODES_VISIBLE',page.locator('#taskEpisodes').is_visible(),'ERRORS',errors[:5],flush=True)
  page.locator('#episodes .episode').first.wait_for(timeout=8000)
  print('NAV',width,page.url,'TITLE',page.title(),flush=True)
  assert '?lang=en' in page.url
  assert page.locator('#episodes .episode').count()==COUNT
  assert not errors,errors
  context.close()
 browser.close()
print('HUB_HOME_TO_CAMBRIDGE_ACCEPTANCE_PASSED',flush=True)
