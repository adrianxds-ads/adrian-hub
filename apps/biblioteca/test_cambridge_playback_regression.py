"""Real Cambridge MP3 play/pause/reload/bfcache regression, no mocked HTMLMediaElement."""
from pathlib import Path
from playwright.sync_api import sync_playwright
AUDIO=Path.home()/'My Drive'/'Inglés B2'/'B2 Inglés · Exámenes'/'00 · ÍNDICE'/'Audiolibro Cambridge B2'/'01_EXAMEN01_PARTES1-4_CONTINUO_FOLA.mp3'
URL='http://127.0.0.1:19543/apps/biblioteca/?lang=en'
assert AUDIO.is_file(), AUDIO
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 for width in (390,1280):
  context=browser.new_context(viewport={'width':width,'height':844})
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda x:errors.append(str(x)))
  page.goto(URL)
  page.locator('[data-play="1"]').wait_for()
  page.locator('#cambridgeFiles').set_input_files(str(AUDIO))
  page.wait_for_function("!document.querySelector('[data-play=\\\"1\\\"]').disabled")
  page.locator('[data-play="1"]').click()
  page.wait_for_function("document.getElementById('audio').currentTime>0.55",timeout=12000)
  first=page.evaluate("({t:audio.currentTime,paused:audio.paused,error:audio.error?.message??'',ready:audio.readyState,src:audio.currentSrc})")
  assert not first['paused'] and first['src'].startswith('blob:'),first
  page.locator('#playerToggle').click()
  assert page.evaluate("audio.paused")
  page.locator('#playerToggle').click()
  page.wait_for_function("!audio.paused && audio.currentTime>1.05",timeout=12000)
  page.reload()
  page.wait_for_function("!document.querySelector('[data-play=\\\"1\\\"]').disabled",timeout=20000)
  page.locator('[data-play="1"]').click()
  page.wait_for_function("audio.currentTime>0.7 && !audio.paused",timeout=12000)
  page.evaluate("window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));audio.pause();audio.load();window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))")
  page.locator('#playerToggle').click()
  page.wait_for_timeout(1300)
  after=page.evaluate("({t:audio.currentTime,paused:audio.paused,error:audio.error?.message??'',ready:audio.readyState,src:audio.currentSrc})")
  print('REAL_PLAYBACK',width,'FIRST',first,'AFTER_BFCACHE',after,'JS_ERRORS',errors,flush=True)
  assert not errors,errors
  assert not after['paused'] and not after['error'], 'Player failed after bfcache pagehide/pageshow: '+str(after)
  if width==390:
   import json
   entries=json.loads((Path(__file__).parent/'cambridge-exams.json').read_text(encoding='utf-8'))['episodes']
   page.locator('#cambridgeFiles').set_input_files([str(next(AUDIO.parent.rglob(entry['fileName']))) for entry in entries])
   page.wait_for_function("(n)=>document.querySelectorAll('#episodes [data-play]:not([disabled])').length===n",arg=len(entries),timeout=30000)
   for number in range(2,len(entries)+1):
    page.locator(f'[data-play="{number}"]').click()
    page.wait_for_function('audio.readyState>=2 && !audio.paused && audio.currentTime>0.35',timeout=12000)
    print('REAL_MP3_PLAYED',number,page.evaluate('({time:audio.currentTime,duration:audio.duration,error:audio.error?.message??""})'),flush=True)
  context.close()
 browser.close()
print('REAL_CAMBRIDGE_PLAYBACK_PASSED')
