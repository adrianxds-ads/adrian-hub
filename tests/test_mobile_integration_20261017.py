"""Isolated regression: no real user profile, remote sync or physical answers."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys,time
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parent.parent.parent
if not (root/'adrian-hub').exists():root=Path(__file__).parent
out=[]
def serve(r):
 u=urlparse(r.request.url)
 if u.hostname!='adrianxds-ads.github.io':r.abort();return
 f=root/unquote(u.path).lstrip('/')
 if f.is_dir():f=f/'index.html'
 r.fulfill(status=200 if f.is_file() else 404,body=f.read_bytes() if f.is_file() else b'missing',content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
def record(name,data):
 out.append({'test':name,'data':data});print('PASS',name,json.dumps(data,ensure_ascii=False),flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='chrome',headless=True)
 def openapp(repo,width=412):
  c=b.new_context(viewport={'width':width,'height':915},service_workers='block',has_touch=True,is_mobile=True)
  c.route('**/*',serve);p=c.new_page();p.errors=[];p.on('pageerror',lambda e:p.errors.append(str(e)))
  p.goto('https://adrianxds-ads.github.io/'+repo+'/')
  return c,p
 for width,scenario in ([] if '--post' in sys.argv else [(390,'transient')] if '--remaining' in sys.argv else [(360,'normal'),(412,'freeze'),(390,'transient')]):
  c,p=openapp('b2-multiple-choice-cloze',width)
  p.wait_for_function("document.querySelector('#startBtn')?.onclick!=null")
  p.locator('#startBtn').click();p.wait_for_selector('#gameScreen:not(.hidden)')
  for i in range(15):
   if i>0 and p.locator('.nucleo-read-skip:visible').count():p.locator('.nucleo-read-skip:visible').click()
   p.wait_for_function("!locked && document.querySelector('#answers button.answer:not(:disabled)') && !document.querySelector('#answers').classList.contains('read-first-hidden')",timeout=12000)
   assert p.evaluate('session.index')==i,(scenario,i,p.evaluate('session.index'))
   if i==9 and scenario=='transient':
    p.evaluate("()=>{window.savedNext=nextQuestion;window.failNext=1;nextQuestion=function(){if(window.failNext-- >0)throw new Error('INJECTED_RECOVERABLE_TRANSITION');return window.savedNext();};}")
   pos=p.evaluate('current.correctPos')
   print('STEP',scenario,i,flush=True)
   p.wait_for_timeout(250)
   try:p.locator('#answers button.answer').nth(pos).click(timeout=3500)
   except Exception:
    print('CLICK_DIAGNOSTIC',p.evaluate("({idx:session.index,locked,classes:document.querySelector('#answers').className,buttons:[...document.querySelectorAll('#answers button')].map(b=>({text:b.textContent,cls:b.className,disabled:b.disabled,pointer:getComputedStyle(b).pointerEvents}))})"),flush=True);raise
   # Duplicate callback within same event loop must not register another answer.
   p.evaluate('answer(current.correctPos,false)')
   assert p.evaluate('session.records.length')==i+1
   if i==9 and scenario=='freeze':
    cd=c.new_cdp_session(p);cd.send('Page.setWebLifecycleState',{'state':'frozen'})
    time.sleep(2)
    cd.send('Page.setWebLifecycleState',{'state':'active'})
   if i<14:p.wait_for_function('(n)=>session.index===n && !locked',arg=i+1,timeout=10000)
  p.wait_for_selector('#endScreen:not(.hidden)',timeout=15000)
  got=p.evaluate("({attempts:state.totalAttempts,rows:state.history.length,sessions:state.sessions,sessionRows:state.sessionHistory.length,last:state.sessionHistory.at(-1).total})")
  assert got=={'attempts':15,'rows':15,'sessions':1,'sessionRows':1,'last':15},got
  p.wait_for_timeout(2300);assert p.evaluate('state.totalAttempts')==15
  p.reload();p.wait_for_function("document.querySelector('#startBtn')?.onclick!=null")
  assert p.evaluate('state.totalAttempts===15 && state.sessions===1')
  assert not p.errors,p.errors
  record('Cloze '+scenario+' '+str(width),got);c.close()
 c,p=openapp('adaptive-english')
 p.wait_for_function("document.querySelector('#startBtn')?.onclick!=null")
 p.locator('#startBtn').click()
 p.wait_for_selector('#missionOverlay:not(.hidden)')
 assert 'TARGET' in p.locator('#missionBody').inner_text()
 p.wait_for_selector('#gameScreen:not(.hidden)')
 p.wait_for_function('!focusAwaiting && !locked',timeout=12000)
 v=p.evaluate("""()=>{const visible=e=>!!(e&&e.getBoundingClientRect().height&&getComputedStyle(e).display!=='none');return {clock:visible(document.querySelector('.timer-number')),elapsed:visible(document.querySelector('#focusTimeDisplay')),extra:visible(document.querySelector('#quiz-segmented-timer')),audio:audioCtx?.state,limit:(deadline-focusAnswerAt)/1000}}""")
 assert p.locator('.integrated-timer').is_hidden()
 assert p.locator('#focusTimeDisplay').count()==0
 for width in [360,390,412,768,1280]:
  p.set_viewport_size({'width':width,'height':915})
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
 p.set_viewport_size({'width':412,'height':915})
 p.screenshot(path=str(root/'grammar-countdown.png'),full_page=True)
 assert v=={'clock':True,'elapsed':False,'extra':False,'audio':'running','limit':15},v
 start=time.monotonic()
 p.wait_for_function('session.records.length===1',timeout=17000)
 elapsed=time.monotonic()-start
 assert 14<=elapsed<=16.5,elapsed
 assert p.evaluate("session.records[0].ms===15000 && session.records[0].timingMode==='COUNTDOWN_15S'")
 for i in range(1,15):
  p.wait_for_function('!focusAwaiting && !locked',timeout=12000)
  assert p.evaluate('session.index')==i
  p.locator('#answers button').nth(p.evaluate('current.correctPos')).click()
  if i<14:p.wait_for_function('(n)=>session.index===n && !locked',arg=i+1)
 p.wait_for_selector('#endScreen:not(.hidden)',timeout=15000)
 assert p.evaluate('state.totalAttempts===15 && state.sessions===1 && state.sessionHistory.length===1')
 assert not p.errors,p.errors
 record('Grammar real deadline and full round',{'timeoutWallSec':round(elapsed,2),**v})
 p.screenshot(path=str(root/'grammar-after.png'),full_page=True);c.close()
 if '--post' not in sys.argv:
  c,p=openapp('adaptive-pizarras')
  p.wait_for_function("window.ClassroomBootComplete===true")
  p.locator('#quickBtn').click()
  p.wait_for_selector('#classroomMission:not([hidden])')
  assert 'TARGET' in p.locator('#classroomMissionBody').inner_text()
  p.wait_for_selector('#gameScreen:not(.hidden)')
  for i in range(15):
   p.wait_for_function("!locked && document.querySelector('#answers button:not(:disabled)') && !document.querySelector('#answers').classList.contains('read-first-hidden')",timeout=12000)
   answer=p.evaluate('current.correct')
   p.locator('#answers button').filter(has_text=answer).first.click()
   if i<14:p.wait_for_function('(n)=>session.questionCount===n && !locked',arg=i+1)
  p.wait_for_selector('#classroomMission:not([hidden])')
  assert 'TARGET SUPERADO' in p.locator('#classroomMissionBody').inner_text()
  got=p.evaluate("({answers:state.answers,quick:state.quickSessions,rows:state.history.length,last:state.history.at(-1).questions})")
  assert got=={'answers':15,'quick':1,'rows':1,'last':15},got
  assert not p.errors,p.errors
  record('Classroom quick initial and final target',got);c.close()
 c,p=openapp('adaptive-phrasal-verbs')
 p.wait_for_function("typeof APP_VERSION!=='undefined'&&document.querySelector('#buildVersion')?.textContent.includes(APP_VERSION)")
 p.locator('#startBtn').click();p.wait_for_selector('#gameScreen:not(.hidden)')
 for i in range(15):
  p.wait_for_function("!locked && questionPhase==='answer' && document.querySelector('#answers button:not(:disabled)')",timeout=12000)
  idx=p.evaluate('current.options.findIndex(x=>x.key===current.correctKey)')
  p.locator('#answers button').nth(idx).click()
  if i<14:p.wait_for_function('(n)=>session.index===n && !locked',arg=i+1)
 p.wait_for_selector('#endScreen:not(.hidden)',timeout=15000)
 got=p.evaluate("({answers:state.answers,sessions:state.sessions,rows:state.history.length,score:state.history.at(-1).score})")
 assert got=={'answers':15,'sessions':1,'rows':1,'score':15},got
 assert not p.errors,p.errors
 record('Phrasal full round after answer-only feedback fix',got);c.close()
 b.close()
(root/'lab-results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
