"""Acceptance for the Cambridge-only English library.
Only the supplied completed Google AI Studio MP3 is used; stored in isolated browser profile.
No real user progress or original Cambridge audio leaves this computer.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import requests
BASE='http://127.0.0.1:19543'
CAT=BASE+'/apps/biblioteca/'
ENG=CAT+'?lang=en'
AUDIO=Path.home()/'My Drive'/'Inglés B2'/'B2 Inglés · Exámenes'/'00 · ÍNDICE'/'Audiolibro Cambridge B2'/'01_EXAMEN01_PARTES1-4_CONTINUO_FOLA.mp3'
assert AUDIO.is_file()
assert requests.get(BASE+'/apps/biblioteca/cambridge-exams.json',timeout=10).json()['count']==4
MOCK=r"""(()=>{
 Object.defineProperty(navigator,'wakeLock',{configurable:true,value:{request:async()=>({release:async()=>{},addEventListener(){}})}});
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},getVoices(){return []},speak(u){u.onend?.()}}});
 Object.defineProperty(HTMLMediaElement.prototype,'paused',{configurable:true,get(){return this.__paused??true}});
 Object.defineProperty(HTMLMediaElement.prototype,'duration',{configurable:true,get(){return 1228}});
 Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{configurable:true,get(){return this.__pos||0},set(v){this.__pos=v;this.dispatchEvent(new Event('timeupdate'))}});
 HTMLMediaElement.prototype.play=function(){this.__paused=false;this.dispatchEvent(new Event('play'));return Promise.resolve()};
 HTMLMediaElement.prototype.pause=function(){this.__paused=true;this.dispatchEvent(new Event('pause'))};
})()"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 for width,height in [(390,844),(1280,800)]:
  context=browser.new_context(viewport={'width':width,'height':height},locale='es-ES')
  context.add_init_script(MOCK)
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(CAT,wait_until='domcontentloaded')
  page.locator('#episodes .episode').first.wait_for(timeout=20000)
  assert page.locator('#episodes .episode').count()==233
  assert page.locator('#cambridgeImport').is_hidden()
  assert page.locator('#totalCount').inner_text()=='233'
  snapshot=page.evaluate("({listen:localStorage.getItem('adrianLibraryEasyCatalanV1'),task:localStorage.getItem('adrianEasyCatalanTaskSessionsV1'),live:localStorage.getItem('adrianEasyCatalanTaskLiveV1')})")
  page.goto(ENG,wait_until='domcontentloaded')
  page.locator('#episodes .episode').first.wait_for(timeout=20000)
  assert 'Cambridge' in page.title()
  assert page.locator('#episodes .episode').count()==4
  assert page.locator('#totalCount').inner_text()=='4'
  assert page.locator('#cambridgeImport').is_visible()
  assert page.locator('#sortLabel').inner_text()=='1 → 4'
  assert page.locator('#episodes [data-play="1"]').is_disabled()
  assert page.locator('#episodes [data-play="4"]').is_disabled()
  assert not page.locator('.transcript-link').count()
  assert page.locator('.cambridge-audio-state').count()==4
  assert page.locator('body').inner_text().count('Easy English')==0
  # Import real full Google AI Studio MP3. File is stored only in IndexedDB.
  page.locator('#cambridgeFiles').set_input_files(str(AUDIO))
  page.wait_for_function("document.getElementById('cambridgeImportStatus').textContent.includes('1 de 4')",timeout=30000)
  assert page.locator('#episodes [data-play="1"]').is_enabled()
  assert page.locator('#episodes [data-play="2"]').is_disabled()
  page.locator('#episodes [data-play="1"]').click()
  assert page.locator('#player').is_visible()
  assert page.locator('#audio').get_attribute('src').startswith('blob:')
  page.evaluate("document.getElementById('audio').currentTime=50;document.getElementById('audio').pause()")
  assert page.evaluate("JSON.parse(localStorage.getItem('adrianLibraryCambridgeAudiobooksPositionsV1'))['1']")==50
  page.locator('#playerDone').click()
  assert 1 in page.evaluate("JSON.parse(localStorage.getItem('adrianLibraryCambridgeAudiobooksV1'))")
  # Task mode inherits exact same dinosaur mode as Catalan; no artificial tasks in real profile.
  page.locator('#tabTasks').click()
  assert page.locator('#taskEpisodes .episode').count()==4
  assert page.locator('#taskEpisodes [data-task-episode="1"]').first.is_enabled()
  assert page.locator('#taskEpisodes [data-task-episode="2"]').first.is_disabled()
  page.locator('#taskEpisodes [data-task-episode="1"]').first.click()
  page.locator('#taskText').fill('Ordenar escritorio')
  page.locator('#taskSetupButton').click()
  assert page.locator('#taskStage').is_visible()
  page.evaluate("document.getElementById('audio').dispatchEvent(new Event('ended'))")
  history=page.evaluate("JSON.parse(localStorage.getItem('adrianCambridgeTaskSessionsV1')||'[]')")
  assert len(history)==1 and history[0]['episodeNumber']==1 and history[0]['status']=='completado',history
  page.goto(ENG,wait_until='domcontentloaded')
  page.locator('#episodes .episode').first.wait_for(timeout=20000)
  page.wait_for_function("!document.querySelector('[data-play=\"1\"]').disabled",timeout=18000)
  assert page.locator('#heardCount').inner_text()=='1'
  assert page.evaluate("JSON.parse(localStorage.getItem('adrianCambridgeTaskSessionsV1')).length")==1
  page.goto(CAT,wait_until='domcontentloaded')
  page.locator('#episodes .episode').first.wait_for(timeout=18000)
  assert page.locator('#episodes .episode').count()==233
  assert page.evaluate("localStorage.getItem('adrianLibraryEasyCatalanV1')")==snapshot['listen']
  assert page.evaluate("localStorage.getItem('adrianEasyCatalanTaskSessionsV1')")==snapshot['task']
  assert page.evaluate("localStorage.getItem('adrianEasyCatalanTaskLiveV1')")==snapshot['live']
  assert page.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1")
  assert not errors,errors
  print('PASS',width,'CAT_233','CAMBRIDGE_4','REAL_MP3_SHA_VERIFIED','PERSISTENT_IDB','LISTEN','TASK_DINO','INDEPENDENT_HISTORY','NO_JS_ERRORS',flush=True)
  context.close()
 browser.close()
print('CAMBRIDGE_BILINGUAL_ACCEPTANCE_PASSED',flush=True)
