"""Recover the existing real audit in Nexo; all mutations/paid APIs are blocked."""
import sys,json
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
base='https://adrin.tail8fd071.ts.net/dc-inbox/agents'
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 for width,height in [(390,844),(1280,800)]:
  c=b.new_context(viewport={'width':width,'height':height},service_workers='block')
  posts=[]
  def prevent(r):
   if r.request.method=='POST':posts.append(r.request.url);r.abort()
   else:r.continue_()
  c.route('**/dc-inbox/agents/**',prevent)
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/ui/',wait_until='networkidle')
  snapshot=page.request.get(base+'/status').json()['agent']
  assert not snapshot['running'] and snapshot['report_available'],snapshot
  page.locator('#nexoRecover').click()
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent.includes('PARCIAL')")
  assert page.locator('#nexoMissionRepair').is_disabled()
  page.locator('.nexo-mission summary').click()
  assert 'INFORME PARCIAL' in page.locator('#nexoMissionReport').inner_text()
  linked=page.evaluate("JSON.parse(localStorage.getItem('nexo-mission-v1'))")
  assert linked['runId']==snapshot['run_id'] and linked['request']==snapshot['mission']
  page.reload(wait_until='networkidle')
  assert page.locator('#nexoMissionState').inner_text()=='INFORME PARCIAL · RUTA DETENIDA'
  assert not posts and not errors,(posts,errors)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('.nexo-mission').screenshot(path=str(Path(__file__).parent/'runs'/('nexo-real-'+str(width)+'.png')))
  print('PASS live',width,'real audit linked, partial gate, reload persistence, 0 POST/paid calls',flush=True)
  c.close()
 b.close()
