import json
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',args=['--mute-audio']);p=b.new_page()
 p.route('**/*',lambda r:r.continue_() if r.request.url.startswith('http://127.0.0.1:18766/') else r.abort())
 p.goto('http://127.0.0.1:18766/adaptive-pizarras/');p.locator('#startClassBtn').click()
 if p.evaluate('readFirstMode'):p.locator('#readFirstToggle').evaluate('(e)=>e.click()')
 for i in range(8):
  p.wait_for_function('!locked&&current')
  idx=p.evaluate('Array.from(document.querySelectorAll("#answers button")).findIndex(b=>b.textContent.trim()===current.correct)')
  p.locator('#answers button').nth(idx).click();p.wait_for_timeout(450)
 p.evaluate('session.endsAt=Date.now()-1;updateClassClock()')
 p.locator('#endScore').wait_for(state='visible',timeout=20000)
 assert p.evaluate('state.sessions')==1
 assert p.evaluate('state.activeSession') is None
 p.evaluate('finishSession(false);updateClassClock()');assert p.evaluate('state.sessions')==1
 p.reload();assert p.evaluate('state.sessions')==1
 r={'status':'PASS','app':'adaptive-pizarras','case':'timed study expiry after 8 real answers; simulated expiry clock','sessions':1,'activeSession':None}
 Path('C:/Users/adria/agent-workbench/pixel-acceptance-20261008/pizarras-expiry-results.json').write_text(json.dumps(r,indent=2));print(r);b.close()
