"""Browser regression with intercepted execution APIs: no paid calls."""
import json,sys
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
BASE='https://adrin.tail8fd071.ts.net/dc-inbox/agents'
MISSION='Audita primero Keyboard Speak y repara solo errores reproducibles.'
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='chrome',headless=True)
 for width,height in [(390,844),(1280,800)]:
  c=browser.new_context(viewport={'width':width,'height':height},service_workers='block')
  repair_state={'run_id':'','status':'idle','running':False}
  state={'run_id':'','status':'idle','running':False};counts={'audit':0,'repair':0};switch=False
  route_data={'status':'routed','primary':{'id':'auditor','name':'El Auditor','active':True},'pipeline':[{'id':'auditor','name':'El Auditor','active':True},{'id':'reparador','name':'El Reparador','active':True}],'confidence':.98,'active_ceiling_usd':2}
  def handle(r):
   nonlocal_dummy=None
   path=urlparse(r.request.url).path.removeprefix('/dc-inbox/agents')
   if path=='/audit':
    counts['audit']+=1;state.update(run_id='test-nexo-1',mission=MISSION,running=True,status='running',dry_run=False);out={'agent':dict(state)}
   elif path=='/triage':out={'triage':route_data}
   elif path=='/status':out={'agent':dict(state)}
   elif path=='/report':
    out={'available':True,'path':'test-report','content':'Keyboard Speak · observed report <img src=x onerror=alert(1)>'}
    if switch:state['run_id']='other-run'
   elif path=='/repair':
    counts['repair']+=1
    assert r.request.post_data_json['audit_run_id']==state['run_id']
    repair_state.update(run_id='repair-1',status='running',running=True);out={'repair':dict(repair_state)}
   elif path=='/repair/status':out={'repair':dict(repair_state)}
   elif path=='/repair/report':out={'available':True,'content':'Verified isolated patch','diff_stat':'app.js | 2'}
   elif path=='/nucleo/status':out={'ok':True,'summary':{},'checks':[]}
   elif path=='/advisor/status':out={'events':0,'findings':0,'recent':[]}
   elif path=='/openrouter':out={'limit':15,'limit_remaining':3,'usage':12}
   else:out={}
   r.fulfill(json={'ok':True,**out})
  c.route('**/dc-inbox/agents/**',handle)
  # UI assets must use real canonical files, not the JSON API interceptor.
  from pathlib import Path
  root=Path(__file__).resolve().parents[1]/'apps/agents'
  def assets(r):
   rel=urlparse(r.request.url).path.split('/ui/')[-1] or 'index.html'
   f=root/rel
   r.fulfill(body=f.read_bytes(),content_type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'}[f.suffix])
  c.route('**/dc-inbox/agents/ui/**',assets)
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.goto(BASE+'/ui/',wait_until='networkidle')
  page.locator('#triageRequest').fill(MISSION);page.locator('#nexoRun').click()
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent==='AUDITOR TRABAJANDO'")
  assert counts['audit']==1
  page.reload(wait_until='networkidle');assert counts['audit']==1
  state.update(running=False,status='completed',returncode=0,report_available=True,result={'partial':True,'cost_usd':.1})
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent.includes('PARCIAL')")
  assert page.locator('#nexoMissionRepair').is_disabled()
  page.locator('.nexo-mission summary').click()
  assert page.locator('#nexoMissionReport img').count()==0
  assert 'observed report' in page.locator('#nexoMissionReport').inner_text(), page.locator('#nexoMissionReport').text_content()
  assert counts['repair']==0
  # Complete report enables the linked isolated repair.
  state['result']['partial']=False
  page.locator('#nexoRecover').click()
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent==='INFORME PARA REVISAR'")
  page.locator('#nexoMissionRepair').click()
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent==='REPARADOR TRABAJANDO'")
  assert counts['repair']==1 and counts['audit']==1
  page.reload(wait_until='networkidle');assert counts['repair']==1
  repair_state.update(running=False,status='completed',returncode=0,result={'ok':True,'cost_usd':.2,'last_test':{'exit_code':0}},checkout='isolated-test-copy')
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent.includes('PARCHE VERIFICADO')")
  assert 'Verified isolated patch' in page.locator('#nexoMissionReport').text_content()
  # Clear only the local linked repair to exercise independent audit recovery.
  page.evaluate("localStorage.removeItem('nexo-mission-v1')");page.reload(wait_until='networkidle')
  # Result from another run is rejected.
  switch=True;page.locator('#nexoRecover').click()
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent==='OTRA EJECUCIÓN EN EL SERVICIO'")
  assert page.locator('#nexoMissionRepair').is_disabled()
  assert 'observed report' not in page.locator('#nexoMissionReport').inner_text()
  # A complete audit of another app must not prepare the fixed Keyboard Speak repair target.
  switch=False;state.update(run_id='other-run',mission='Audita Cambridge',result={'partial':False,'cost_usd':.1})
  page.locator('#nexoRecover').click()
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent==='INFORME PARA REVISAR'")
  assert page.locator('#nexoMissionRepair').is_disabled()
  route_data['primary']={'id':'tester','name':'El Tester','active':False}
  page.locator('#triageRequest').fill('Prueba Keyboard Speak')
  page.locator('#nexoRun').click()
  page.wait_for_function("document.querySelector('#triageStatus').textContent==='EN FORMACIÓN'")
  assert counts['audit']==1 and counts['repair']==1
  # One approved automatic route: partial still stops, full diagnosis starts repair.
  route_data['primary']={'id':'auditor','name':'El Auditor','active':True}
  page.locator('#triageRequest').fill(MISSION);page.locator('#nexoAutoRepair').check();page.locator('#nexoRun').click()
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent==='AUDITOR TRABAJANDO'")
  state.update(running=False,status='completed',returncode=0,report_available=True,result={'ok':True,'partial':False,'cost_usd':.1})
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent==='REPARADOR TRABAJANDO'")
  assert counts=={'audit':2,'repair':2}
  page.reload(wait_until='networkidle');assert counts=={'audit':2,'repair':2}
  repair_state.update(running=False,status='failed',returncode=1,result={'ok':False,'last_test':{'exit_code':1}})
  page.wait_for_function("document.querySelector('#nexoMissionState').textContent==='REPARACIÓN DETENIDA'")
  assert page.locator('#nexoMissionRepair').is_disabled()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors
  page.locator('.nexo-mission').screenshot(path=str(Path(__file__).resolve().parent/'runs'/('nexo-mission-'+str(width)+'.png')))
  print('PASS',width,'start, reload/no duplicate, partial stop, complete handoff, escaped report, run mismatch, automatic repair, no duplicates, final-test failure stop',flush=True)
  c.close()
 browser.close()
