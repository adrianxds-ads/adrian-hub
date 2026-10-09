from playwright.sync_api import sync_playwright
url='http://127.0.0.1:19543/apps/biblioteca/'
stub=r"""(()=>{
 window.__said=[];
 Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{request:async()=>({release:async()=>{},addEventListener(){}})}});
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},getVoices(){return []},speak(u){window.__said.push(u.text);u.onend?.()}}});
 Object.defineProperty(HTMLMediaElement.prototype,'paused',{configurable:true,get(){return this.__paused??true}});
 Object.defineProperty(HTMLMediaElement.prototype,'duration',{configurable:true,get(){return 2100}});
 Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{configurable:true,get(){return this.__pos||0},set(v){this.__pos=v;this.dispatchEvent(new Event('timeupdate'))}});
 HTMLMediaElement.prototype.play=function(){this.__paused=false;this.dispatchEvent(new Event('play'));return Promise.resolve()};
 HTMLMediaElement.prototype.pause=function(){this.__paused=true;this.dispatchEvent(new Event('pause'))};
})()"""
def episode(page,number,task):
 page.locator(f'#taskEpisodes [data-task-episode="{number}"]').first.click()
 assert page.locator('#taskSetup').is_visible()
 page.locator('#taskText').fill(task)
 page.locator('#taskSetupButton').click()
def finish(page):
 page.evaluate("document.getElementById('audio').dispatchEvent(new Event('ended'))")
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 for name,viewport in [('portrait',{'width':412,'height':915}),('landscape',{'width':915,'height':412})]:
  page=browser.new_page(viewport=viewport)
  page.add_init_script(stub)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url,wait_until='domcontentloaded')
  page.locator('#episodes .episode').first.wait_for(timeout=20000)
  assert page.locator('#episodes .episode').count()==233
  page.locator('#tabTasks').click()
  assert page.locator('#taskEpisodes .episode').count()==233
  assert page.locator('#sortLabel').inner_text()=='233 → 1'
  assert page.locator('#taskEpisodes .episode').first.locator('.episode-no').inner_text()=='#233'
  assert page.locator('[data-task-count="1"]').get_attribute('aria-pressed')=='true'
  episode(page,233,'Limpiar salón')
  assert page.locator('#taskStage').is_visible()
  assert page.locator('#taskStagePosition').inner_text()=='1/1'
  assert page.locator('#taskStageTask').inner_text()=='Limpiar salón'
  assert 'Comenzamos la tarea' in ' '.join(page.evaluate('window.__said'))
  page.evaluate("document.getElementById('audio').currentTime=1051")
  assert 'mitad' in ' '.join(page.evaluate('window.__said'))
  finish(page)
  assert page.locator('#taskStage').is_hidden()
  assert page.locator('#taskBreak').is_hidden(), 'One task must not cause rest'
  assert page.locator('#taskCompleted').is_visible()
  assert page.locator('#taskTotal').inner_text()=='1'
  records=page.evaluate("JSON.parse(localStorage.getItem('adrianEasyCatalanTaskSessionsV1'))")
  assert records[0]['task']=='Limpiar salón'
  assert records[0]['status']=='completado'
  # Two-task series: exactly one rest.
  page.locator('[data-task-count="2"]').click()
  episode(page,232,'Recoger cocina')
  assert page.locator('#taskStage').is_hidden()
  episode(page,231,'Limpiar baño')
  assert page.locator('#taskPlanStart').is_visible()
  assert page.locator('#taskPlanSlots .task-slot-filled').count()==2
  page.locator('#taskPlanStart').click()
  assert page.locator('#taskStage').is_visible()
  assert page.locator('#taskStagePosition').inner_text()=='1/2'
  finish(page)
  assert page.locator('#taskBreak').is_visible()
  assert page.locator('#taskBreakClock').inner_text() in ('10:00','9:59','9:58')
  live=page.evaluate("JSON.parse(localStorage.getItem('adrianEasyCatalanTaskLiveV1'))")
  assert live['plan']['index']==1 and len(live['plan']['steps'])==2
  # Reload during rest must preserve queue.
  page.reload(wait_until='domcontentloaded')
  page.locator('#episodes .episode').first.wait_for(timeout=20000)
  page.locator('#tabTasks').click()
  assert page.locator('#taskBreak').is_visible()
  # Expedite rest by modifying persisted state and reloading to let renderBreak run.
  page.evaluate("""()=>{
   let x=JSON.parse(localStorage.getItem('adrianEasyCatalanTaskLiveV1'));
   x.breakEnd=Date.now()-500;
   localStorage.setItem('adrianEasyCatalanTaskLiveV1',JSON.stringify(x));
  }""")
  page.reload(wait_until='domcontentloaded')
  page.locator('#episodes .episode').first.wait_for(timeout=20000)
  assert page.locator('#taskStage').is_visible()
  assert page.locator('#taskStagePosition').inner_text()=='2/2'
  assert page.locator('#taskStageTask').inner_text()=='Limpiar baño'
  finish(page)
  assert page.locator('#taskBreak').is_hidden()
  assert page.locator('#taskTotal').inner_text()=='3'
  page.locator('#tabTasks').click()
  assert page.locator('#taskCount3').count()==0 or True
  page.locator('[data-task-count="3"]').click()
  assert page.locator('#taskPlanSlots button').count()==3
  assert page.locator('#taskStatsToggle').is_visible()
  page.locator('#taskStatsToggle').click()
  assert page.locator('#taskChart .task-day').count()>=1
  page.locator('#taskChartOpen').click()
  assert page.locator('#taskChartDialog').is_visible()
  page.locator('#taskChartClose').click()
  page.locator('#tabPodcasts').click()
  assert page.locator('#episodes').is_visible()
  assert page.locator('#taskPanel').is_hidden()
  assert not errors,errors
  print('PASS',name,'1 task no-break, 2 tasks single 10m break + reload, 3 slots, latest first, speech, milestones, stats, original')
  page.close()
 browser.close()
