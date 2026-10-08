"""Regression for explicit-order routing, inactive targets, and live mission handoff."""
import json,sys,argparse
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
a=argparse.ArgumentParser();a.add_argument('--start-audit',action='store_true');args=a.parse_args()
base='https://adrin.tail8fd071.ts.net/dc-inbox/agents'
mission='Comprueba Keyboard Speak: teclado que tapa la respuesta, tipografía y micrófono. Audita primero y repara solo errores reproducibles; verifica móvil y escritorio y conserva progreso.'
with sync_playwright() as p:
 b=p.chromium.launch(channel='chrome',headless=True)
 for width,height in [(390,844),(1280,800)]:
  c=b.new_context(viewport={'width':width,'height':height},service_workers='block')
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/ui/',wait_until='networkidle')
  assert not page.locator('#triageGo').is_visible()
  page.locator('#triageRequest').fill(mission);page.locator('#triageBtn').click()
  page.wait_for_function("document.querySelector('#triageGo').dataset.target==='audit'")
  assert page.locator('#triagePrimary').inner_text()=='El Auditor'
  page.locator('#triageGo').click()
  assert page.locator('#auditMission').input_value()==mission
  page.locator('#triageRequest').fill('Haz pruebas responsive y mira la consola')
  page.locator('#triageBtn').click()
  page.wait_for_function("document.querySelector('#triageStatus').textContent==='EN FORMACIÓN'")
  assert not page.locator('#triageGo').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors
  print('PASS',width,'audit-first transfer, inactive button hidden, no overflow/JS errors',flush=True)
  if args.start_audit and width==390:
   page.on('dialog',lambda d:d.accept())
   page.locator('#agentAuditOpus').click()
   page.wait_for_timeout(1500)
   state=page.request.get(base+'/status').json()
   assert state['agent']['mission']==mission,state
   print('AUDIT START',json.dumps(state,ensure_ascii=False),flush=True)
  c.close()
 b.close()
