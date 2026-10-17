"""Classroom study-contract expiry preserves feedback and records one class."""
from pathlib import Path
exec((Path(__file__).with_name('test_quiz_ergonomics.py')).read_text(encoding='utf-8').split('with sync_playwright()')[0])
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True);c=b.new_context(viewport={'width':412,'height':915},service_workers='block',has_touch=True);c.route('**/*',serve);p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto('https://adrianxds-ads.github.io/adaptive-pizarras/');ready(p,'adaptive-pizarras');p.locator('#startClassBtn').click();p.wait_for_selector('#gameScreen:not(.hidden)')
 duration=p.evaluate('session.durationSec')
 for i in range(8):
  reveal(p,'adaptive-pizarras')
  idx=choice(p,'adaptive-pizarras',i!=7);p.locator('#answers >button.answer').nth(idx).click()
  if i<7:p.wait_for_function('(n)=>session.questionCount===n&&!locked',arg=i+1)
  else:
   p.evaluate('session.endsAt=Date.now()-1;updateClassClock()')
   assert p.evaluate('!session.finished')
   p.wait_for_timeout(1600);assert p.evaluate('!session.finished')
   p.wait_for_selector('#endScreen:not(.hidden)',timeout=5000)
 assert p.evaluate('state.sessions===1&&state.classSessions===1&&state.quickSessions===0&&state.history.length===1&&state.history[0].questions===8')
 assert p.evaluate('quizFlow.pending.size')==0
 p.evaluate('window.ClassroomProgress.flush()');p.reload();ready(p,'adaptive-pizarras')
 assert p.evaluate('state.classSessions===1&&state.history.length===1&&!state.activeSession')
 assert not errors,errors
 print('PASS CLASSROOM_CONTRACT',duration,'seconds unchanged; feedback completed before single final record',flush=True)
 c.close();b.close()
