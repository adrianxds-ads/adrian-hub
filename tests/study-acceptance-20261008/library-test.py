import json
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',args=['--mute-audio']);c=b.new_context(viewport={'width':411,'height':801})
 c.route('**/*',lambda r:r.continue_() if r.request.url.startswith('http://127.0.0.1:18766/') else r.abort())
 p=c.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
 p.goto('http://127.0.0.1:18766/adrian-hub/apps/biblioteca/');p.wait_for_function('data!==null')
 count=p.locator('.episode').count();assert count==233,count
 first=p.locator('.episode').first.get_attribute('data-episode');p.locator('#sortBtn').click()
 assert p.locator('.episode').first.get_attribute('data-episode')!=first
 p.locator('#search').fill('zzzz-no-result');assert p.locator('.episode').count()==0
 p.locator('#search').fill('');p.locator('[data-state="'+first+'"]').click()
 assert p.evaluate('heard().size')==1
 p.reload();p.wait_for_function('data!==null');assert p.evaluate('heard().size')==1
 assert not errs,errs
 r={'app':'biblioteca','status':'PASS','episodes':count,'tests':['search','sort','mark listened','reload persistence'],'audio':'not tested'}
 Path('C:/Users/adria/agent-workbench/pixel-acceptance-20261008/library-results.json').write_text(json.dumps(r,indent=2));print(r);b.close()
