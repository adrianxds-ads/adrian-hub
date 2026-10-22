"""Real private Cambridge 01–04 + incremental 05/06 ZIP import; playback, no duplicates."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path.home()/'My Drive'/'Inglés B2'/'B2 Inglés · Exámenes'/'00 · ÍNDICE'/'Audiolibro Cambridge B2'
BUNDLE=ROOT/'Cambridge_B2_Audiolibros_01-02-03-04.zip'
FIVE=ROOT/'Cambridge_B2_Audiolibros_05.zip'
SIX=ROOT/'Cambridge_B2_Audiolibros_06.zip'
URL='http://127.0.0.1:19543/apps/biblioteca/?lang=en'
assert all(f.is_file() and f.stat().st_size>15000000 for f in (BUNDLE,FIVE,SIX))
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 for width in (390,1280):
  context=browser.new_context(viewport={'width':width,'height':844},locale='es-ES')
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.goto(URL)
  page.locator('#cambridgeFiles').wait_for()
  page.wait_for_function("document.querySelectorAll('#episodes [data-play]').length===6")
  assert page.locator('#episodes [data-play]:disabled').count()==6
  page.locator('#cambridgeFiles').set_input_files(str(BUNDLE))
  page.wait_for_function("document.querySelectorAll('#episodes [data-play]:not(:disabled)').length===4",timeout=90000)
  assert page.locator('#episodes [data-play="5"]').is_disabled()
  assert page.locator('#episodes [data-play="6"]').is_disabled()
  page.locator('#cambridgeFiles').set_input_files(str(FIVE))
  page.wait_for_function("document.querySelectorAll('#episodes [data-play]:not(:disabled)').length===5",timeout=90000)
  assert page.locator('#episodes [data-play="6"]').is_disabled()
  page.locator('#cambridgeFiles').set_input_files(str(SIX))
  page.wait_for_function("document.querySelectorAll('#episodes [data-play]:not(:disabled)').length===6",timeout=90000)
  assert '1 nuevo' in page.locator('#cambridgeImportStatus').inner_text()
  print('ZIP_SIX_IMPORTED',width,page.locator('#cambridgeImportStatus').inner_text(),flush=True)
  for i in range(1,7):
   page.locator(f'#episodes [data-play="{i}"]').click()
   page.wait_for_function('!audio.paused && audio.currentTime>0.3',timeout=15000)
   state=page.evaluate('({time:audio.currentTime,ready:audio.readyState,error:audio.error?.message??""})')
   assert state['ready']>=2 and state['error']=='', (i,state)
  page.reload()
  page.wait_for_function("document.querySelectorAll('#episodes [data-play]:not(:disabled)').length===6",timeout=30000)
  for package,already in ((SIX,'1 ya estaban guardados'),(FIVE,'1 ya estaban guardados'),(BUNDLE,'4 ya estaban guardados')):
   page.locator('#cambridgeFiles').set_input_files(str(package))
   page.wait_for_function("document.querySelector('#cambridgeImportStatus').textContent.includes("+repr(already)+")",timeout=90000)
  print('ZIP_IDEMPOTENT',width,page.locator('#cambridgeImportStatus').inner_text(),flush=True)
  if width==390:
   page.locator('#cambridgeFiles').set_input_files({'name':'invalido.zip','mimeType':'application/zip','buffer':b'not a zip'})
   page.wait_for_function("document.querySelector('#cambridgeImportStatus').textContent.includes('ZIP')",timeout=15000)
   assert page.locator('#episodes [data-play]:not(:disabled)').count()==6
   page.goto('http://127.0.0.1:19543/apps/biblioteca/')
   page.locator('#episodes .episode').first.wait_for()
   assert page.locator('#episodes .episode').count()==233
   assert page.locator('#cambridgeImport').is_hidden()
  assert not errors,errors
  context.close()
 browser.close()
print('CAMBRIDGE_ZIP_IMPORT_ACCEPTANCE_PASSED')
