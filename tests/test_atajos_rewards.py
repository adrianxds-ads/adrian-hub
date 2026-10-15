from playwright.sync_api import sync_playwright
from pathlib import Path
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
 ctx=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
 page=ctx.new_page();page.goto('http://127.0.0.1:18357/apps/atajos/',wait_until='domcontentloaded')
 page.locator('#readFirst').uncheck();page.locator('#groupSelect').select_option('powertoys')
 page.locator('#startQuiz').click()
 for i in range(15):
  page.locator('.option:not([disabled])').first.wait_for()
  target=page.evaluate("""() => {let reverse=document.getElementById('questionText').textContent.includes('corresponde');let hint=document.getElementById('questionHint').textContent;let card=window.ATAJOS_BANK.find(c=>c.group==='powertoys'&&(reverse?c.meaning===hint:c.key===hint));return reverse?card.key:card.meaning}""")
  opts=page.locator('.option:not([disabled])')
  found=False
  for k in range(opts.count()):
   if opts.nth(k).locator('span').last.inner_text()==target:
    opts.nth(k).click();found=True;break
  assert found,(i,target)
  page.wait_for_timeout(1180)
 page.locator('#finalScore').wait_for(timeout=3000)
 assert page.locator('#finalScore').inner_text()=='15/15'
 page.locator('#goHome').click()
 assert page.locator('#medal15').inner_text()=='1'
 assert page.locator('#starCount').inner_text()=='0'
 with page.expect_download(timeout=4000) as dl:
  page.locator('#exportJson').click()
 download=dl.value
 path=Path(r'C:\Users\adria\AppData\Local\Temp')/'atajos_quiz_sample.json'
 download.save_as(path)
 import json
 data=json.loads(path.read_text(encoding='utf8'))
 assert data['metrics']['medals']['m15']==1
 assert len(data['sessions'])==1
 assert len(data['sessions'][0]['attempts'])==15
 assert all(a['correct'] for a in data['sessions'][0]['attempts'])
 print('GOLD / 15 CORRECT / JSON / VERIFIED')
 page.reload(wait_until='domcontentloaded')
 assert page.locator('#medal15').inner_text()=='1'
 assert page.evaluate('window.__ATAJOS_TEST__.metrics().sessions.length')==1
 print('RELOAD / NO DOUBLE MEDAL / VERIFIED')
 ctx.close()
 # Timeout test
 ctx=browser.new_context(viewport={'width':390,'height':844})
 page=ctx.new_page();page.goto('http://127.0.0.1:18357/apps/atajos/',wait_until='domcontentloaded')
 page.locator('#readFirst').uncheck();page.locator('#startQuiz').click()
 page.wait_for_timeout(5200)
 assert 'Tiempo agotado' in page.locator('#feedback').inner_text() or page.evaluate('window.__ATAJOS_TEST__.metrics().seen')>=1
 # Since it auto-advances after 1.1 s, check persisted state directly.
 count=page.evaluate("JSON.parse(localStorage.getItem(window.__ATAJOS_TEST__.storeKey)).draft.attempts.length")
 assert count==1,count
 sec=page.evaluate("JSON.parse(localStorage.getItem(window.__ATAJOS_TEST__.storeKey)).draft.attempts[0].answerSeconds")
 assert sec==5,sec
 print('FIVE-SECOND TIMEOUT / VERIFIED')
 ctx.close();browser.close()
