"""Cambridge private ZIP incremental acceptance: all catalogued exams, no duplicates."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path.home()/'My Drive'/'Inglés B2'/'B2 Inglés · Exámenes'/'00 · ÍNDICE'/'Audiolibro Cambridge B2'
CAT=Path(__file__).with_name('cambridge-exams.json')
catalog=json.loads(CAT.read_text(encoding='utf-8'))
COUNT=catalog['count']
assert COUNT==len(catalog['episodes']) and COUNT>=4
assert [e['number'] for e in catalog['episodes']]==list(range(1,COUNT+1))
PACKAGES=[(4,ROOT/'Cambridge_B2_Audiolibros_01-02-03-04.zip')]
PACKAGES.extend((n,ROOT/f'Cambridge_B2_Audiolibros_{n:02d}.zip') for n in range(5,COUNT+1))
assert all(x.exists() and x.stat().st_size>15000000 for _,x in PACKAGES)
URL='http://127.0.0.1:19543/apps/biblioteca/?lang=en'
with sync_playwright() as pw:
 browser=pw.chromium.launch(channel='msedge',headless=True)
 for width in (390,1280):
  context=browser.new_context(viewport={'width':width,'height':844},locale='es-ES')
  page=context.new_page();errors=[]
  page.on('pageerror',lambda error:errors.append(str(error)))
  page.goto(URL)
  page.locator('#cambridgeFiles').wait_for()
  page.wait_for_function('(n)=>document.querySelectorAll("#episodes [data-play]").length===n',arg=COUNT)
  assert page.locator('#episodes [data-play]:disabled').count()==COUNT
  for n,package in PACKAGES:
   page.locator('#cambridgeFiles').set_input_files(str(package))
   page.wait_for_function('(n)=>document.querySelectorAll("#episodes [data-play]:not(:disabled)").length===n',arg=n,timeout=90000)
   assert page.locator('#cambridgeImportStatus').inner_text().startswith(f'{n} de {COUNT}')
   print('ZIP_IMPORTED',width,n,package.name,flush=True)
  for number in range(1,COUNT+1):
   page.locator(f'#episodes [data-play="{number}"]').click()
   page.wait_for_function('!audio.paused && audio.currentTime>0.3',timeout=15000)
   state=page.evaluate('({time:audio.currentTime,ready:audio.readyState,error:audio.error?.message??""})')
   assert state['ready']>=2 and not state['error'],(number,state)
  page.reload()
  page.wait_for_function('(n)=>document.querySelectorAll("#episodes [data-play]:not(:disabled)").length===n',arg=COUNT,timeout=30000)
  for n,package in PACKAGES:
   page.locator('#cambridgeFiles').set_input_files(str(package))
   duplicate_count=4 if n==4 else 1
   page.wait_for_function('(x)=>document.querySelector("#cambridgeImportStatus").textContent.includes(x)',arg=f'{duplicate_count} ya estaban guardados',timeout=90000)
   assert page.locator('#episodes [data-play]:not(:disabled)').count()==COUNT
  print('ZIP_NO_DUPLICATES',width,COUNT,flush=True)
  if width==390:
   page.locator('#cambridgeFiles').set_input_files({'name':'invalido.zip','mimeType':'application/zip','buffer':b'not a zip'})
   page.wait_for_function('document.querySelector("#cambridgeImportStatus").textContent.includes("ZIP")',timeout=15000)
   assert page.locator('#episodes [data-play]:not(:disabled)').count()==COUNT
   page.goto('http://127.0.0.1:19543/apps/biblioteca/')
   page.locator('#episodes .episode').first.wait_for()
   assert page.locator('#episodes .episode').count()==233
   assert page.locator('#cambridgeImport').is_hidden()
  assert not errors,errors
  context.close()
 browser.close()
print('CAMBRIDGE_ZIP_IMPORT_ACCEPTANCE_PASSED',COUNT)
