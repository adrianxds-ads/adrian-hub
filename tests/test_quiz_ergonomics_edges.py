"""Timeout/abort/stale-interval checks in isolated contexts."""
from pathlib import Path
exec((Path(__file__).with_name('test_quiz_ergonomics.py')).read_text(encoding='utf-8').split('with sync_playwright()')[0])
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 for name in (sys.argv[1:] or names):
  c=b.new_context(viewport={'width':412,'height':915},service_workers='block',has_touch=True,is_mobile=True);c.route('**/*',serve)
  c.add_init_script("""window.qeCaptured=[];(()=>{const old=setInterval;window.setInterval=function(fn,ms,...a){if(ms===50)window.qeCaptured.push(fn);return old.call(this,fn,ms,...a);};})();""")
  p=c.new_page();p.on('dialog',lambda d:d.accept());p.goto('https://adrianxds-ads.github.io/'+name+'/');ready(p,name)
  p.locator('#quickBtn' if name=='adaptive-pizarras' else '#startBtn').click();p.wait_for_selector('#gameScreen:not(.hidden)');reveal(p,name)
  p.evaluate('window.qeOld=qeCaptured.at(-1)');start=time.monotonic()
  p.wait_for_function('(session.records?.length??session.times.length)===1',timeout=17000)
  elapsed=time.monotonic()-start;assert 14.3<=elapsed<=16.3,(name,elapsed)
  assert p.evaluate('locked')
  rec=p.evaluate('session.records?.at(-1)??state.answerHistory.at(-1)')
  sec=rec.get('ms',rec.get('time',0)*1000)/1000
  assert abs(sec-15)<.15,(name,rec)
  p.evaluate('window.qeOld?.()');assert rows(p)==1
  p.wait_for_timeout(250);assert rows(p)==1
  p.evaluate('abortSession()');p.wait_for_timeout(2300)
  assert p.evaluate('session===null'),name
  assert p.evaluate('quizFlow.pending.size')==0
  p.locator('#quickBtn' if name=='adaptive-pizarras' else '#startBtn').click();p.wait_for_selector('#gameScreen:not(.hidden)')
  p.evaluate('window.qeOld?.()');assert rows(p)==0,(name,'stale timer after restart')
  p.evaluate('abortSession()')
  print('PASS TIMEOUT_ABORT',name,round(elapsed,3),flush=True);c.close()
 b.close()
