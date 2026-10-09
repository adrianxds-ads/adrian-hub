from playwright.sync_api import sync_playwright
from pathlib import Path
url='http://127.0.0.1:19543/'
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 for width,height in [(412,915),(1280,850)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url,wait_until='domcontentloaded')
  page.locator('[data-id="english"] .app-info').wait_for(timeout=20000)
  assert page.locator('[data-id="english"] .app-copy strong').inner_text()=='Grammar Quest'
  assert page.locator('[data-id="pizarras"] .app-copy strong').inner_text()=='Classroom B2'
  assert page.locator('[data-id="cambridge"] .app-copy strong').inner_text()=='Cambridge Lab'
  assert page.locator('.app-info').count()==16
  initial=page.url
  page.locator('[data-id="english"] .app-info').click()
  assert page.locator('#appInfoDialog').is_visible()
  assert page.locator('#appInfoTitle').inner_text()=='Grammar Quest'
  assert '15 preguntas' in page.locator('#appInfoDescription').inner_text()
  assert page.locator('#appInfoFeatures li').count()==3
  assert 'adaptive-english' in page.locator('#appInfoOpen').get_attribute('href')
  assert page.url==initial
  page.locator('#appInfoClose').click()
  assert not page.locator('#appInfoDialog').is_visible()
  fonts=page.evaluate("""()=>{
    let selectors=['.app-copy strong','.app-copy small','.app-version-chip','.version-main small','.version-status','.app-info','.update-summary small'];
    return Object.fromEntries(selectors.map(s=>[s,parseFloat(getComputedStyle(document.querySelector(s)).fontSize)]))
  }""")
  assert min(fonts.values())>=12,fonts
  assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth+1"),'horizontal overflow'
  assert not errors,errors
  print('PASS Hub info, names, fonts, no overflow',width,fonts)
  page.close()
 browser.close()
