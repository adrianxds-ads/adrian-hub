from playwright.sync_api import sync_playwright
url='http://127.0.0.1:18358/adrian-hub/#hub/modulos'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
 for w,h in ((360,740),(390,844),(412,915),(1280,800)):
  ctx=browser.new_context(viewport={'width':w,'height':h})
  page=ctx.new_page();errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.goto(url,wait_until='domcontentloaded',timeout=25000)
  link=page.locator('a[href*="apps/atajos/"]').first
  link.wait_for(state='visible',timeout=15000)
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'),('overflow',w)
  assert link.get_attribute('href') and link.is_visible()
  print('HUB',w,'ATAJOS_VISIBLE',link.is_visible(),'ERRORS',errors[:2])
  assert not errors,(w,errors)
  ctx.close()
 browser.close()
