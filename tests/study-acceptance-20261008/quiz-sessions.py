import json,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('C:/Users/adria/agent-workbench/pixel-acceptance-20261008')
results=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',args=['--mute-audio'])
 for app in ['adaptive-english','adaptive-phrasal-verbs','adaptive-pizarras','b2-multiple-choice-cloze','adaptive-verbs-catala','adaptive-keyword-speaking']:
  c=b.new_context(viewport={'width':411,'height':801})
  c.route('**/*',lambda r:r.continue_() if r.request.url.startswith('http://127.0.0.1:18766/') else r.abort())
  p=c.new_page(); errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  r={'app':app}
  try:
   p.goto('http://127.0.0.1:18766/'+app+'/')
   p.wait_for_timeout(600)
   kw=app=='adaptive-keyword-speaking'
   before=p.evaluate('load().sessions.length' if kw else 'state.sessions')
   if not kw:p.locator('#readFirstToggle').evaluate('(e)=>{if(e.getAttribute("aria-pressed")==="true")e.click()}')
   p.locator('#quickBtn' if app=='adaptive-pizarras' else '#startBtn').click()
   if not kw:
    if p.evaluate('typeof readFirstMode!=="undefined" && readFirstMode'):
     p.locator('#readFirstToggle').evaluate('(e)=>e.click()')
   for i in range(15):
    if kw:
     p.locator('#answer').fill(p.evaluate('expectedVariants(current())[0]'))
     p.locator('#checkBtn').click()
     p.locator('#nextBtn').click()
    else:
     p.wait_for_function('!locked && current && document.querySelector("#answers button")')
     if app=='adaptive-phrasal-verbs':
      idx=p.evaluate('Array.from(document.querySelectorAll("#answers button")).findIndex(b=>b.dataset.key===current.correctKey)')
     elif app=='adaptive-pizarras':
      idx=p.evaluate('Array.from(document.querySelectorAll("#answers button")).findIndex(b=>b.textContent.trim()===current.correct)')
     else: idx=p.evaluate('current.correctPos')
     assert idx>=0, 'correct answer not found'
     p.locator('#answers button').nth(idx).click()
     p.wait_for_timeout(450)
   p.locator('#resultScore' if kw else '#endScore').wait_for(state='visible',timeout=20000)
   after=p.evaluate('load().sessions.length' if kw else 'state.sessions')
   assert after==before+1,(before,after)
   score=p.locator('#resultScore' if kw else '#endScore').inner_text()
   assert ('30/30' if kw else '15/15') in score,score
   r.update(before=before,after=after,score=p.locator('#resultScore' if kw else '#endScore').inner_text(),errors=errors)
   p.reload();p.wait_for_timeout(600)
   assert p.evaluate('load().sessions.length' if kw else 'state.sessions')==after
   assert not errors,errors
   r['status']='PASS'
  except Exception as e:r.update(status='FAIL',error=str(e),trace=traceback.format_exc())
  results.append(r);OUT.joinpath('full-session-results-final.json').write_text(json.dumps(results,indent=2),encoding='utf8')
  c.close()
 b.close()
print(json.dumps(results,indent=2))
