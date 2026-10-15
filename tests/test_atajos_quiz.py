from playwright.sync_api import sync_playwright
import json, time
URL='http://127.0.0.1:18357/apps/atajos/'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
 for width,height in [(360,740),(390,844),(412,915),(1280,800)]:
  ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
  page=ctx.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL,wait_until='domcontentloaded',timeout=20000)
  page.locator('#startQuiz').wait_for()
  n=page.evaluate('window.__ATAJOS_TEST__.bankSize')
  assert n==136,n
  assert page.locator('#coverage').inner_text()=='0%'
  x=page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
  assert x,('overflow_home',width,page.evaluate('document.documentElement.scrollWidth'))
  page.locator('#startFlash').click()
  assert page.locator('#flashFront').inner_text()
  page.locator('#revealFlash').click()
  assert page.locator('#flashBack').is_visible()
  page.locator('#flashKnown').click()
  page.locator('#quitFlash').click()
  assert page.locator('#coverage').inner_text()=='0%'
  if width==390:
   page.locator('#readFirst').uncheck()
   page.locator('#groupSelect').select_option('qq')
   page.locator('#startQuiz').click()
   for i in range(15):
    page.locator('.option:not([disabled])').first.wait_for(timeout=4000)
    page.locator('.option:not([disabled])').first.click()
    page.wait_for_timeout(1200)
   page.locator('#finalScore').wait_for(timeout=5000)
   assert page.locator('#finalScore').inner_text().endswith('/15')
   assert page.evaluate('window.__ATAJOS_TEST__.metrics().sessions.length')==1
   page.locator('#goHome').click()
   assert page.locator('#coverage').inner_text()!='0%'
   page.reload(wait_until='domcontentloaded')
   assert page.evaluate('window.__ATAJOS_TEST__.metrics().sessions.length')==1
   page.locator('#exportJson').click()
   # JSON export is triggered, not a destructive action
   page.locator('#startQuiz').click()
   page.locator('.option:not([disabled])').first.click()
   page.wait_for_timeout(70)
   page.reload(wait_until='domcontentloaded')
   assert page.evaluate('window.__ATAJOS_TEST__.metrics().sessions.length')==1
   assert page.evaluate('window.__ATAJOS_TEST__.metrics().seen')>0
  else:
   page.locator('#readFirst').uncheck()
   page.locator('#startQuiz').click()
   assert page.locator('#secondsLeft').inner_text() in ('5','4')
   page.locator('.option:not([disabled])').first.click()
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'),('overflow_quiz',width)
   page.locator('#quitQuiz').click()
  assert not errors,(width,errors)
  print('OK',width,height,'cards=',n,'overflow=false','js_errors=0')
  ctx.close()
 browser.close()
