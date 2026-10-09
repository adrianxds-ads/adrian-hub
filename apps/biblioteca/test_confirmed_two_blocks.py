import json
from playwright.sync_api import sync_playwright
url='http://127.0.0.1:19543/apps/biblioteca/'
livekey='adrianEasyCatalanTaskSessionsV1'
cases=[
 ('one233',[{'id':'real-233','episodeNumber':233,'status':'completado','task':'Limpiar la habitación','seconds':2095,'startedAt':'2026-10-09T01:25:00+02:00','endedAt':'2026-10-09T02:00:00+02:00'}],2,1),
 ('one232',[{'id':'real-232','episodeNumber':232,'status':'completado','task':'Limpiar salón','seconds':1744,'startedAt':'2026-10-09T02:10:00+02:00','endedAt':'2026-10-09T02:40:00+02:00'}],2,1),
 ('both',[{'id':'real-233','episodeNumber':233,'status':'completado','task':'Limpiar habitación','seconds':2095,'endedAt':'2026-10-09T02:00:00+02:00'},{'id':'real-232','episodeNumber':232,'status':'completado','task':'Limpiar salón','seconds':1744,'endedAt':'2026-10-09T03:00:00+02:00'}],2,0),
 ('repeat233',[{'id':'real-233','episodeNumber':233,'status':'completado','task':'Limpieza A','seconds':2095,'endedAt':'2026-10-09T02:00:00+02:00'},{'id':'repeat-233','episodeNumber':233,'status':'completado','task':'Limpieza B','seconds':2095,'endedAt':'2026-10-09T02:50:00+02:00'}],3,1),
 ('new',[],0,0),
]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 for name,seed,total,recovered in cases:
  page=browser.new_page()
  page.add_init_script("if(localStorage.getItem('test-fixture-loaded')!=='1'){localStorage.setItem(\'adrianEasyCatalanTaskSessionsV1\',JSON.stringify("+json.dumps(seed)+"));localStorage.setItem(\'test-fixture-loaded\',\'1\')}")
  # playwrite add_init_script does not accept arg? use a simple JS source string instead
  page.goto(url,wait_until='domcontentloaded')
  page.locator('#episodes .episode').first.wait_for(timeout=20000)
  page.locator('#tabTasks').click()
  assert page.locator('#taskTotal').inner_text()==str(total),(name,page.locator('#taskTotal').inner_text())
  rows=page.evaluate("JSON.parse(localStorage.getItem('adrianEasyCatalanTaskSessionsV1'))")
  assert len(rows)==len(seed)+recovered,(name,rows)
  assert len(set(x.get('id') for x in rows))==len(rows)
  if recovered:
   assert page.evaluate("!!localStorage.getItem('adrianEasyCatalanTaskSessions_before_recovery_20261009')")
   assert len([x for x in rows if x.get('source')=='confirmed-by-user'])==recovered
   assert 'recuperad' in page.locator('#taskHistory').inner_text().lower() if page.locator('#taskStatsDetails').is_visible() else True
  page.reload(wait_until='domcontentloaded')
  page.locator('#episodes .episode').first.wait_for(timeout=20000)
  rows2=page.evaluate("JSON.parse(localStorage.getItem('adrianEasyCatalanTaskSessionsV1'))")
  assert len(rows2)==len(rows),(name,'duplicate after reload')
  assert rows2==rows,(name,'existing history mutated')
  print('PASS',name, 'total=',total, 'recovered=',recovered)
  page.close()
 browser.close()
