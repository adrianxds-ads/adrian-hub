from playwright.sync_api import sync_playwright
import importlib.util
ns={}
exec(open(r'C:\Users\adria\adrian-hub\apps\biblioteca\test_mode_tarea.py',encoding='utf-8').read().split('with sync_playwright() as p:')[0],ns)
with sync_playwright() as p:
 browser=p.chromium.launch(channel='msedge',headless=True)
 page=browser.new_page(viewport={'width':412,'height':915})
 page.add_init_script(ns['stub'])
 page.on('dialog',lambda d:d.accept())
 page.goto(ns['url'],wait_until='domcontentloaded')
 page.locator('#episodes .episode').first.wait_for()
 page.locator('#tabTasks').click()
 ns['episode'](page,233,'Organizar el escritorio')
 page.evaluate("document.getElementById('audio').currentTime=2096")
 assert page.locator('#taskFinish').is_visible()
 page.locator('#taskFinish').click()
 assert page.locator('#taskTotal').inner_text()=='1'
 assert 'Organizar el escritorio' in page.locator('#taskLatest').inner_text()
 page.locator('#tabPodcasts').click()
 assert '1 tarea completada' in page.locator('#episodes [data-episode="233"] .listen-tally').inner_text()
 assert page.locator('#episodes [data-episode="233"] button[data-state]').count()==0
 print('PASS last-15-seconds manual confirmation, saved log, shared listing and protected recorded marker')
 browser.close()
