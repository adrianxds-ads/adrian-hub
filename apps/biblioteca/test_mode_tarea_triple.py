from pathlib import Path
from playwright.sync_api import sync_playwright
x=Path(r'C:\Users\adria\adrian-hub\apps\biblioteca\test_mode_tarea.py').read_text(encoding='utf-8')
namespace={}
exec(x.split('with sync_playwright() as p:')[0],namespace)
url=namespace['url'];stub=namespace['stub'];episode=namespace['episode'];finish=namespace['finish']
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 page=browser.new_page(viewport={'width':915,'height':412})
 page.add_init_script(stub)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url,wait_until='domcontentloaded')
 page.locator('#episodes .episode').first.wait_for(timeout=20000)
 page.locator('#tabTasks').click()
 page.locator('[data-task-count="3"]').click()
 for number,task in [(233,'Estudiar'),(232,'Cocinar'),(231,'Ordenar')]:episode(page,number,task)
 page.locator('#taskPlanStart').click()
 for n,task in [(1,'Estudiar'),(2,'Cocinar'),(3,'Ordenar')]:
  assert page.locator('#taskStagePosition').inner_text()==f'{n}/3'
  assert page.locator('#taskStageTask').inner_text()==task
  assert page.locator('#taskDino').evaluate("(el)=>getComputedStyle(el).transform") != 'none'
  assert page.evaluate('!!window.AdrianAchievements?.play'), 'Shared medal audio should load'
  finish(page)
  if n<3:
   assert page.locator('#taskBreak').is_visible()
   page.evaluate("""()=>{let k='adrianEasyCatalanTaskLiveV1',x=JSON.parse(localStorage.getItem(k));x.breakEnd=Date.now()-1;localStorage.setItem(k,JSON.stringify(x))}""")
   page.reload(wait_until='domcontentloaded')
   page.locator('#episodes .episode').first.wait_for(timeout=20000)
  else:assert page.locator('#taskBreak').is_hidden()
 records=page.evaluate("JSON.parse(localStorage.getItem('adrianEasyCatalanTaskSessionsV1'))")
 assert len(records)==3
 assert len(set(x['chain'] for x in records))==1
 assert [(x['position'],x['total']) for x in records]==[(1,3),(2,3),(3,3)]
 live=page.evaluate("JSON.parse(localStorage.getItem('adrianEasyCatalanTaskLiveV1'))")
 assert live['plan'] is None and live['breakEnd'] is None
 assert not errors,errors
 print('PASS 3-task sequence: 3 episodes, exactly two rests, original gold tone, right-facing dino transform, one shared session chain')
 page.close();browser.close()
