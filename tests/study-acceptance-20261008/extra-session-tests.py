import json,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('C:/Users/adria/agent-workbench/pixel-acceptance-20261008/extra-session-results.json');results=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',args=['--mute-audio'])
 for app in ['adaptive-hoti0108','adaptive-exam']:
  c=b.new_context(viewport={'width':411,'height':801});c.route('**/*',lambda r:r.continue_() if r.request.url.startswith('http://127.0.0.1:18766/') else r.abort())
  p=c.new_page();errs=[];p.on('pageerror',lambda e:errs.append(str(e)));r={'app':app}
  try:
   p.goto('http://127.0.0.1:18766/'+app+'/');p.wait_for_timeout(800)
   if app=='adaptive-hoti0108':
    p.wait_for_function('bank.length>0');before=p.evaluate('state.roundHistory.length')
    p.locator('#openGame').click();p.locator('#readFirstToggle').evaluate('(e)=>{if(e.getAttribute("aria-pressed")==="true")e.click()}')
    p.locator('#startGame').click()
    for i in range(15):
     key=p.evaluate('byId.get(session.ids[session.index]).correct_answer')
     p.locator('#gameCard .option[data-answer="'+key+'"]').click()
     p.locator('#nextQuestion').click()
    p.locator('#resultHeadline').wait_for(state='visible',timeout=20000)
    after=p.evaluate('state.roundHistory.length');assert after==before+1
    r['score']=p.locator('#resultHeadline').inner_text()
    p.reload();p.wait_for_timeout(800);assert p.evaluate('state.roundHistory.length')==after
   else:
    assert p.evaluate('allExercises().length')==120
    scores=[]
    for part in [1,2,3,4]:
     eid=p.evaluate('(part)=>allExercises().find(e=>e.paper.examNumber==11&&e.part==part).id',part)
     p.evaluate('(id)=>startExercise(id)',eid)
     items=p.evaluate('partItems().map(it=>({n:it.n,value:validAnswers(it)[0],options:it.options||[]}))')
     for it in items:
      if part==1:
       p.locator('.gap-choice[data-n="'+str(it['n'])+'"]').click()
       opts=p.locator('#optionGrid button')
       for j in range(opts.count()):
        if opts.nth(j).inner_text()[1:].strip().lower()==it['value']:
         opts.nth(j).click();break
       else:raise AssertionError('option not found')
      else:p.locator('#paperHost input[data-n="'+str(it['n'])+'"]').fill(it['value'])
     p.evaluate('checkPart()')
     p.locator('#reviewSummary').wait_for(state='visible')
     scores.append(p.locator('#reviewSummary .review-score').inner_text())
     assert p.evaluate('bankAttempts().length')==part
     p.evaluate('checkPart()');assert p.evaluate('bankAttempts().length')==part
    p.reload();p.wait_for_timeout(800);assert p.evaluate('bankAttempts().length')==4
    r['scores']=scores;r['bank_exercises']=120
   assert not errs,errs
   r['status']='PASS'
  except Exception as e:r.update(status='FAIL',error=str(e),trace=traceback.format_exc())
  results.append(r);out.write_text(json.dumps(results,indent=2),encoding='utf8');c.close()
 b.close()
print(json.dumps(results,indent=2))
