import json
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(r'C:\Users\adria\adrian-hub\apps\biblioteca')
source=(root/'test_mode_tarea.py').read_text(encoding='utf-8')
ns={}
exec(source.split('with sync_playwright() as p:')[0],ns)
url=ns['url'];stub=ns['stub'];episode=ns['episode'];finish=ns['finish']
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 page=browser.new_page(viewport={'width':412,'height':915})
 page.add_init_script(stub)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 seed=[
  {'id':'a1','episodeNumber':233,'status':'completado','seconds':1800,'task':'Limpiar','endedAt':'2026-10-09T00:00:00Z'},
  {'id':'a2','episodeNumber':233,'status':'completado','seconds':1900,'task':'Cocinar','endedAt':'2026-10-09T01:00:00Z'},
  {'id':'a3','episodeNumber':232,'status':'interrumpido','seconds':800,'task':'Barrer','endedAt':'2026-10-09T01:00:00Z'}
 ]
 page.goto(url,wait_until='domcontentloaded')
 page.evaluate('''seed=>{
 localStorage.setItem("adrianEasyCatalanTaskSessionsV1",JSON.stringify(seed));
 localStorage.setItem("adrianLibraryEasyCatalanV1",JSON.stringify([233,231]));
 localStorage.setItem("adrianEasyCatalanNormalPlaysV1",JSON.stringify({"230":1}));
 }''',seed)
 page.reload(wait_until='domcontentloaded')
 page.locator('#episodes .episode').first.wait_for(timeout=20000)
 assert page.locator('#episodes [data-episode="233"] .listen-tally').inner_text()=='🦖 2 tareas completadas'
 assert 'Marcado como escuchado' in page.locator('#episodes [data-episode="231"] .listen-tally').inner_text()
 assert '🎧 1 escucha' in page.locator('#episodes [data-episode="230"] .listen-tally').inner_text()
 assert page.locator('#heardCount').inner_text()=='3'
 # Manual listened toggles do NOT grant listens or tasks.
 page.locator('#episodes [data-episode="229"] [data-state]').click()
 assert page.locator('#episodes [data-episode="229"] .listen-tally').inner_text()=='✓ Marcado como escuchado'
 assert page.evaluate("window.PodcastCounts.normalCounts()['229']")==None
 # Normal completion should increase library plays, but never the task count.
 page.locator('#episodes [data-episode="232"] [data-play]').click()
 page.evaluate("document.getElementById('audio').dispatchEvent(new Event('ended'))")
 assert page.evaluate("window.PodcastCounts.normalCounts()['232']")==1
 assert page.evaluate("window.PodcastCounts.taskCounts()['232']")==None
 page.locator('#tabTasks').click()
 assert page.locator('#taskEpisodes [data-task-episode="233"].task-select-done').inner_text()=='✓ 2 veces'
 assert 'Sin tareas completadas' in page.locator('#taskEpisodes .episode:has([data-task-episode="232"]) .task-tally').inner_text()
 assert page.locator('#taskMedals').inner_text()=='0'
 assert page.locator('#taskMedalFraction').inner_text()=='2/15'
 assert page.locator('#taskUniqueCount').inner_text().startswith('1 episodio')
 # Repeating a task podcast awards a separate completion and updates the shared library.
 episode(page,233,'Volver a limpiar')
 assert page.locator('#taskStage').is_visible()
 finish(page)
 assert page.locator('#taskBreak').is_hidden()
 assert page.locator('#taskMedalFraction').inner_text()=='3/15'
 assert page.locator('#taskEpisodes [data-task-episode="233"].task-select-done').inner_text()=='✓ 3 veces'
 assert page.evaluate("window.PodcastCounts.normalCounts().get")==None # separate stores
 page.locator('#tabPodcasts').click()
 assert page.locator('#episodes [data-episode="233"] .listen-tally').inner_text()=='🦖 3 tareas completadas'
 # Medal boundary at exactly 15 completed blocks.
 page.evaluate("""()=>{
 let a=JSON.parse(localStorage.getItem('adrianEasyCatalanTaskSessionsV1'));
 for(let i=0;i<12;i++)a.push({id:'extra'+i,episodeNumber:233,status:'completado',seconds:1500,task:'Test',endedAt:new Date().toISOString()});
 localStorage.setItem('adrianEasyCatalanTaskSessionsV1',JSON.stringify(a));
 }""")
 page.reload(wait_until='domcontentloaded')
 page.locator('#episodes .episode').first.wait_for(timeout=20000)
 page.locator('#tabTasks').click()
 assert page.locator('#taskMedals').inner_text()=='1'
 assert page.locator('#taskMedalFraction').inner_text()=='0/15'
 assert page.locator('#taskTotal').inner_text()=='15'
 assert page.locator('#taskUniqueCount').inner_text().startswith('1 episodio')
 # Shared Hub card/garden marker show the same total, without borrowing Adaptive stars.
 page.goto('http://127.0.0.1:19543/',wait_until='domcontentloaded')
 page.locator('#gardenTaskMedals').wait_for(timeout=20000)
 assert '🏅 1' in page.locator('#gardenTaskMedals').inner_text()
 page.locator('[data-id="biblioteca"] .app-task-chip').wait_for(timeout=20000)
 assert '15 bloques' in page.locator('[data-id="biblioteca"] .app-task-chip').inner_text()
 assert not errors,errors
 print('PASS shared listening: old flags, normal playback, manual marks, repeated task, task-only medals=15, Hub garden+card')
 browser.close()
